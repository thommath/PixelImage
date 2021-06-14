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
    
  layers = 50;
  pixelDensity = 30;
  smoothingIterations = 25;
  edgeMultiplier = 1;

  turbulenceScale1 = 1;
  turbulenceScale2 = 2;

  colors = {background: "#aaaaaa"};
  
  _uniforms = {
    uTime: { value: 0.0 },
    turbulenceTexture: { type: "t", value: null as Texture },
    turbulenceTexture2: { type: "t", value: null as Texture },
    edgesTexture: { type: "t", value: null as Texture },
    uTexture: { type: "t", value: null as Texture },
  }


  status: "loading" | "done" = "loading";

  imageTexture: null | Texture;

  renderer: WebGLRenderer;
  camera: OrthographicCamera;
  scene: Scene;
  gui: dat.GUI;


  constructor() {
    this.renderer = new WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    this.camera = new OrthographicCamera(0.1 * window.innerWidth / - 2, 0.1 * window.innerWidth / 2, 0.1 * window.innerHeight / 2, 0.1 * window.innerHeight / - 2, 1, 2000);
    this.camera.position.z = 10;
    this.scene = new Scene();

    this.gui = new dat.GUI({name: 'My GUI'});

    this.addBackground();
    this.addGui();
  }

  addGui() {
    this.gui.add(this, "layers", 1, 1000).onFinishChange(() => this.createParticles());
    this.gui.add(this, "pixelDensity", 10, 100).onFinishChange(() => {
      this.renderTurbulenceTextures();
      this.renderEdgesTexture();
      this.createParticles();
    });
    this.gui.add(this, "smoothingIterations", 0, 100).onFinishChange(() => this.renderEdgesTexture());
    this.gui.add(this, "edgeMultiplier", 1, 10).onFinishChange(() => this.renderEdgesTexture());
    this.gui.add(this, "turbulenceScale1", 0.1, 10).onFinishChange(() => this.renderTurbulenceTextures());
    this.gui.add(this, "turbulenceScale2", 0.1, 10).onFinishChange(() => this.renderTurbulenceTextures());
  }

  get height() {
    if (!this.imageTexture) {
        return 1;
    }
    return Math.round(this.pixelDensity * (this.imageTexture.image.height / this.imageTexture.image.width));
  }

  particlesMesh: Mesh | null;
  createParticles() {
    const uniforms = {
      uZ: { value: window.innerWidth / 4 },
      //uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },
      uScale: { value: 80 / this.pixelDensity },
      uLayers: {value: this.layers},

      textureWidth: { value: this.pixelDensity },
      textureHeight: { value: this.height },

      ...this._uniforms,
    };

    const material = new RawShaderMaterial({
      uniforms,
      vertexShader: particleWaveVert.substr(16, particleWaveVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      //vertexShader: particleVert.substr(16, particleVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      fragmentShader: dotFrag.substr(16, dotFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      //depthTest: false,
      transparent: true,
      //side: DoubleSide,
    });


    var planeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1));
    const mesh = new Mesh(planeGeo, material);

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

    planeGeo.setAttribute("index", new InstancedBufferAttribute(index, 3, true, 1));

    if (this.particlesMesh) {
      this.scene.remove(this.particlesMesh);
    }

    this.scene.add(mesh)
    this.particlesMesh = mesh;
  }

  addBackground() {
    const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
    const cube = new Mesh(geometry, new MeshBasicMaterial({color: new Color(this.colors.background)}));
    cube.position.setZ(-1000);
    this.scene.add(cube);
    
    this.gui.addColor(this.colors, "background").onChange(() => {
      (cube.material as MeshBasicMaterial).color = new Color(this.colors.background);
    });
  }


  async loadImage(name: string) {
    const texture: Texture = await new Promise((res, rej) => {
      new TextureLoader().load( name, (tex: Texture) => {
        res(tex);
      })
    });
    this.imageTexture = texture;
    this._uniforms.uTexture.value = texture;
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
    this._uniforms.turbulenceTexture.value = this.turbulence.texture;
    this._uniforms.turbulenceTexture2.value = this.turbulence2.texture;
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
    this._uniforms.edgesTexture.value = this.edges.texture;
  }

  render(delta: number) {
    this._uniforms.uTime.value += delta*3;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.render( this.scene, this.camera );
  }


}