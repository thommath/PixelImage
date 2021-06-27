import { Clock, Color, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneBufferGeometry, PlaneGeometry, RawShaderMaterial, Scene, Texture, TextureLoader, WebGLRenderer, WebGLRenderTarget } from "three";
import { renderPixelShaderToTexture } from "./pixelShaderToTexture";
import { parseShader } from "./utils";


import particleWaveVert from 'raw-loader!./shaders/particle wave.vert';
import edgeDetectionFrag from 'raw-loader!./shaders/edgeDetection.frag';
import blurFrag from 'raw-loader!./shaders/blur.frag';
import defaultVert from 'raw-loader!./shaders/default.vert';
import turbulenceFrag from 'raw-loader!./shaders/turbulence.frag';
import dotFrag from 'raw-loader!./shaders/particle dot.frag';
import * as dat from "dat.gui";


export class ImageRenderer {
    
  layers = 300;
  pixelDensity = 50;
  smoothingIterations = 5;
  edgeMultiplier = 1;

  size = 80;

  turbulenceScale1 = 1;
  turbulenceScale2 = 2;

  colors = {background: "#aaaaaa"};
  
  uniforms = {
    uTime: { value: 0.0 },
    turbulenceTexture: { type: "t", value: null as Texture },
    turbulenceTexture2: { type: "t", value: null as Texture },
    edgesTexture: { type: "t", value: null as Texture },
    uTexture: { type: "t", value: null as Texture },
  }

  clip = true;
  clipScale = 1;

  alpha = 0.8;
  particleScale = 1.0;
  colorOffset = 0.3;
  limitColors = 10;
  randomOffsetScale = 1.0;

  status: "loading" | "done" = "loading";

  imageTexture: null | Texture;

  renderer: WebGLRenderer;
  camera: OrthographicCamera;
  scene: Scene;
  gui: dat.GUI;


  constructor() {
    this.renderer = new WebGLRenderer({
      preserveDrawingBuffer: true
    });
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    this.camera = new OrthographicCamera(0.1 * window.innerWidth / - 2, 0.1 * window.innerWidth / 2, 0.1 * window.innerHeight / 2, 0.1 * window.innerHeight / - 2, 1, 2000);
    this.camera.position.z = 10;
    this.scene = new Scene();

    this.gui = new dat.GUI({name: 'My GUI'});

    this.updateBackground();
    this.addGui();
  }

  addGui() {
    this.gui.addColor(this.colors, "background").onChange(() => this.updateBackground());
    this.gui.add(this, "clip").onFinishChange(() => this.updateBackground());
    this.gui.add(this, "clipScale", 0.5, 2.0).onFinishChange(() => this.updateBackground());

    
    this.gui.add(this, "size", 20, 500).onFinishChange(() => this.createParticles());

    this.gui.add(this, "layers", 1, 1000).onFinishChange(() => this.createParticles());
    this.gui.add(this, "pixelDensity", 10, 200).onFinishChange(() => {
      this.pixelDensity = Math.round(this.pixelDensity);
      this.renderTurbulenceTextures();
      this.renderEdgesTexture();
      this.createParticles();
    });
    this.gui.add(this, "smoothingIterations", 0, 100).onFinishChange(() => this.renderEdgesTexture());
    this.gui.add(this, "edgeMultiplier", 1, 10).onFinishChange(() => this.renderEdgesTexture());
    this.gui.add(this, "turbulenceScale1", 0.1, 10).onFinishChange(() => this.renderTurbulenceTextures());
    this.gui.add(this, "turbulenceScale2", 0.1, 10).onFinishChange(() => this.renderTurbulenceTextures());


    this.gui.add(this, "alpha", 0, 1).onFinishChange(() => this.createParticles());
    this.gui.add(this, "particleScale", 0.5, 10).onFinishChange(() => this.createParticles());
    this.gui.add(this, "colorOffset", 0.0, 5).onFinishChange(() => this.createParticles());
    this.gui.add(this, "limitColors", 1, 50).onFinishChange(() => this.createParticles());
    this.gui.add(this, "randomOffsetScale", 0, 5).onFinishChange(() => this.createParticles());
    
    this.gui.add(this, 'takeScreenshot');
  }

  takeScreenshot() {
    var a = document.createElement('a');
    a.href = this.renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
    a.download = 'canvas.png';
    a.click();
  }

  get height() {
    if (!this.imageTexture) {
        return 1;
    }
    return Math.round(this.pixelDensity * (this.imageTexture.image.height / this.imageTexture.image.width));
  }

  particlesMesh: Mesh | null;
  createParticles() {
    const _uniforms = {
      uZ: { value: window.innerWidth / 4 },
      //uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },
      uScale: { value: this.size / this.pixelDensity },
      uLayers: {value: this.layers},

      textureWidth: { value: this.pixelDensity },
      textureHeight: { value: this.height },
      alpha: { value: this.alpha },
      uParticleScale: { value: this.particleScale },
      uColorOffset: { value: this.colorOffset },
      uLimitColors: { value: this.limitColors },
      uRandomOffsetScale: { value: this.randomOffsetScale },

      ...this.uniforms,
    };

    const material = new RawShaderMaterial({
      uniforms: _uniforms,
      vertexShader: particleWaveVert.substr(16, particleWaveVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      //vertexShader: particleVert.substr(16, particleVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      fragmentShader: dotFrag.substr(16, dotFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      //depthTest: false,
      transparent: true,
      //side: DoubleSide,
    });



    const index = new Float32Array(this.pixelDensity*this.height*3 * this.layers);
    for(let l = 0; l < this.layers; l++) {
      for(let x = 0; x < this.pixelDensity; x++) {
        for(let y = 0; y < this.height; y++) {
          index[l*this.pixelDensity*this.height*3 + 3*x+3*y*this.pixelDensity] = x;
          index[l*this.pixelDensity*this.height*3 + 3*x+3*y*this.pixelDensity + 1] = y;
          index[l*this.pixelDensity*this.height*3 + 3*x+3*y*this.pixelDensity + 2] = l;
        }
      }
    }

    var planeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1));
    planeGeo.setAttribute("index", new InstancedBufferAttribute(index, 3, true, 1));
    
    if (this.particlesMesh) {
      this.scene.remove(this.particlesMesh);
    }

    const mesh = new Mesh(planeGeo, material);
    this.scene.add(mesh)
    this.particlesMesh = mesh;

    this.updateBackground();
  }

  backgroundMeshes: {
    leftMesh: null | Mesh,
    rightMesh: null | Mesh,
    topMesh: null | Mesh,
    bottomMesh: null | Mesh,
    behind: null | Mesh,
  } = {
    leftMesh: null,
    rightMesh: null,
    topMesh: null,
    bottomMesh: null,
    behind: null,
  };

  updateBackground() {
    Object.values(this.backgroundMeshes).forEach((m) => this.scene.remove(m));

    const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
    const cube = new Mesh(geometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
    cube.position.setZ(-1000);
    this.scene.add(cube);
    this.backgroundMeshes.behind = cube;
    

    if (this.clip && this.imageTexture) {
      const leftGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const leftMesh = new Mesh(leftGeometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
      leftMesh.position.setZ(1);
      leftMesh.position.setX(-innerWidth/2 - this.clipScale * this.size / 2);
      this.scene.add(leftMesh);
      this.backgroundMeshes.leftMesh = leftMesh;
      const rightGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const rightMesh = new Mesh(rightGeometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
      rightMesh.position.setZ(1);
      rightMesh.position.setX(+innerWidth/2 + this.clipScale * this.size / 2);
      this.scene.add(rightMesh);
      this.backgroundMeshes.rightMesh = rightMesh;
      
      const topGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const topMesh = new Mesh(topGeometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
      topMesh.position.setZ(1);
      topMesh.position.setY(+innerHeight/2 + (this.imageTexture.image.height / this.imageTexture.image.width) * this.clipScale * this.size / 2);
      this.scene.add(topMesh);
      this.backgroundMeshes.topMesh = topMesh;
      const bottomGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const bottomMesh = new Mesh(bottomGeometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
      bottomMesh.position.setZ(1);
      bottomMesh.position.setY(-innerHeight/2 - (this.imageTexture.image.height / this.imageTexture.image.width) * this.clipScale * this.size / 2);
      this.scene.add(bottomMesh);
      this.backgroundMeshes.bottomMesh = bottomMesh;
    }

  }


  async loadImage(name: string) {
    this.status = "loading";
    const texture: Texture = await new Promise((res, rej) => {
      new TextureLoader().load( name, (tex: Texture) => {
        res(tex);
      })
    });
    this.imageTexture = texture;
    this.uniforms.uTexture.value = texture;
    this.status = "done";
    return texture;
  }

  turbulence: WebGLRenderTarget | null;
  turbulence2: WebGLRenderTarget | null;

  renderTurbulenceTextures() {
    if (!this.turbulence || !this.turbulence2) {
      this.turbulence = new WebGLRenderTarget(this.pixelDensity, this.height);
      this.turbulence2 = new WebGLRenderTarget(this.pixelDensity, this.height);
    }
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity, this.height, this.turbulence, parseShader(defaultVert), parseShader(turbulenceFrag), 
      {uSeed: { value: 432 }, uScale: { value: this.turbulenceScale1 }}
    );
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity, this.height, this.turbulence2, parseShader(defaultVert), parseShader(turbulenceFrag), 
      {uSeed: { value: 321 }, uScale: { value: this.turbulenceScale2 }}
    );
    this.uniforms.turbulenceTexture.value = this.turbulence.texture;
    this.uniforms.turbulenceTexture2.value = this.turbulence2.texture;
  }

  edges: WebGLRenderTarget | null;

  renderEdgesTexture() {
    if (!this.edges) {
      this.edges = new WebGLRenderTarget(this.pixelDensity*this.edgeMultiplier, this.height*this.edgeMultiplier);
    }
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity*this.edgeMultiplier, this.height*this.edgeMultiplier, this.edges, parseShader(defaultVert), parseShader(edgeDetectionFrag), 
      {
        uTexture: { type: "t", value: this.imageTexture },
      }
    );
    const edgesBlur = new WebGLRenderTarget(this.pixelDensity*this.edgeMultiplier, this.height*this.edgeMultiplier);

    for(let n = 0; n < this.smoothingIterations; n++) {
      renderPixelShaderToTexture(
        this.renderer, this.pixelDensity*this.edgeMultiplier, this.height*this.edgeMultiplier, edgesBlur, parseShader(defaultVert), parseShader(blurFrag), 
        {
          uTexture: { type: "t", value: this.edges.texture },
        }
      );
      renderPixelShaderToTexture(
        this.renderer, this.pixelDensity*this.edgeMultiplier, this.height*this.edgeMultiplier, this.edges, parseShader(defaultVert), parseShader(blurFrag), 
        {
          uTexture: { type: "t", value: edgesBlur.texture },
        }
      );
    }
    edgesBlur.dispose();
    this.uniforms.edgesTexture.value = this.edges.texture;
  }

  render(delta: number) {
    this.uniforms.uTime.value += delta*3;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.render( this.scene, this.camera );
  }


}