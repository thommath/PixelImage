import { AddEquation, Color, CustomBlending, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, MeshBasicMaterial, OneMinusSrcAlphaFactor, OrthographicCamera, PlaneBufferGeometry, PlaneGeometry, RawShaderMaterial, Scene, SrcAlphaFactor, Texture, TextureLoader, WebGLRenderer, WebGLRenderTarget } from "three";
import { renderPixelShaderToTexture } from "./pixelShaderToTexture";
import { parseShader } from "./utils";


import particleWaveVert from './shaders/particle wave.vert';
import edgeDetectionFrag from './shaders/edgeDetection.frag';
import blurFrag from './shaders/blur.frag';
import defaultVert from './shaders/default.vert';
import turbulenceFrag from './shaders/turbulence.frag';
import dotFrag from './shaders/particle dot.frag';
import * as dat from "dat.gui";


export class ImageRenderer {

  layers = 100;
  pixelDensity = 50;

  enhanceDetails = true;
  smoothingIterations = 5;
  edgeMultiplier = 1;

  size = 80;

  turbulenceScale1 = 1;
  turbulenceScale2 = 2;

  colors = { background: "#aaaaaa" };

  uniforms = {
    uTime: { value: 0.0 },
    turbulenceTexture: { type: "t", value: null as any as Texture },
    turbulenceTexture2: { type: "t", value: null as any as Texture },
    edgesTexture: { type: "t", value: null as any as Texture },
    uTexture: { type: "t", value: null as any as Texture },
  }

  clip = false;
  clipScale = 1;

  alpha = 0.8;
  particleScale = 1.0;

  colorOffset = 0.3;
  limitColors = 10;
  randomOffsetScale = 1.0;

  pointilism = false;
  twoColors = true;
  reducedColorMultiplier = 0.5;

  animate = false;
  animateNoiseOffset = 1.0;
  animationSpeed = 1.0;
  animationDistance = 2.0;

  backgroundImage = false;
  showNoiseTurbulence1 = false;
  showNoiseTurbulence2 = false;
  showEdges = false;

  status: "loading" | "done" = "loading";

  imageTexture: null | Texture = null;

  renderer: WebGLRenderer;
  camera: OrthographicCamera;
  scene: Scene;
  gui: dat.GUI;


  constructor() {
    this.renderer = new WebGLRenderer({
      preserveDrawingBuffer: true
    });

    document.body.appendChild(this.renderer.domElement);
    this.camera = new OrthographicCamera(0.1 * window.innerWidth / - 2, 0.1 * window.innerWidth / 2, 0.1 * window.innerHeight / 2, 0.1 * window.innerHeight / - 2, 1, 2000);
    this.camera.position.z = 10;
    this.scene = new Scene();

    this.gui = new dat.GUI({ name: 'Image settings' });

    this.createParticle();
    this.updateBackground();
    this.updateImageBackground();
    this.addGui();
  }

  addGui() {
    const background = this.gui.addFolder("Background");
    background.addColor(this.colors, "background").onChange(() => this.updateBackground());
    background.add(this, "clip").onFinishChange(() => this.updateBackground());
    background.add(this, "clipScale", 0.5, 2.0).onFinishChange(() => this.updateBackground());
    background.add(this, "backgroundImage").onFinishChange(() => this.updateImageBackground());

    // this.gui.add(this, "size", 20, 500).onFinishChange(() => this.updateUniforms());

    const particles = this.gui.addFolder("Numer of particles");

    particles.add(this, "layers", 1, 300).onFinishChange(() => this.updateParticleInstances());
    particles.add(this, "pixelDensity", 10, 500).onFinishChange(() => {
      this.pixelDensity = Math.round(this.pixelDensity);
      this.renderTurbulenceTextures();
      this.renderEdgesTexture();
      this.updateParticleInstances();
      this.updateUniforms();
    });

    const enhanceDetails = this.gui.addFolder("Enhance details");

    enhanceDetails.add(this, "enhanceDetails", 0, 100).onFinishChange(() => this.updateUniforms());
    enhanceDetails.add(this, "smoothingIterations", 0, 100).onFinishChange(() => this.renderEdgesTexture());
    enhanceDetails.add(this, "edgeMultiplier", 0.1, 2).onFinishChange(() => this.renderEdgesTexture());
    enhanceDetails.add(this, "showEdges").onFinishChange(() => this.updateEdges());

    const noise = this.gui.addFolder("Noise");
    noise.add(this, "showNoiseTurbulence1").onFinishChange(() => this.updateNoiseTurbulence1());
    noise.add(this, "turbulenceScale1", 0.01, 5).onFinishChange(() => this.renderTurbulenceTextures());
    noise.add(this, "showNoiseTurbulence2").onFinishChange(() => this.updateNoiseTurbulence2());
    noise.add(this, "turbulenceScale2", 0.01, 5).onFinishChange(() => this.renderTurbulenceTextures());


    const particleControl = this.gui.addFolder("Particle properties");
    particleControl.add(this, "particleScale", 0.1, 10).onFinishChange(() => this.updateUniforms());
    particleControl.add(this, "randomOffsetScale", 0, 10).onFinishChange(() => this.updateUniforms());


    const colorControl = this.gui.addFolder("Colors");
    colorControl.add(this, "alpha", 0, 1).onFinishChange(() => this.updateUniforms());
    colorControl.add(this, "colorOffset", 0.0, 10).onFinishChange(() => this.updateUniforms());
    colorControl.add(this, "limitColors", 1, 50).onFinishChange(() => this.updateUniforms());
    const Pointilism = colorControl.addFolder("Pointilism");
    Pointilism.add(this, "pointilism").onFinishChange(() => this.updateUniforms());
    Pointilism.add(this, "twoColors").onFinishChange(() => this.updateUniforms());
    Pointilism.add(this, "reducedColorMultiplier", 0.0, 1.0).onFinishChange(() => this.updateUniforms());


    const animation = this.gui.addFolder("Animation");
    animation.add(this, "animate").onFinishChange(() => this.updateUniforms());
    animation.add(this, "animateNoiseOffset", 0, 1).onFinishChange(() => this.updateUniforms());
    animation.add(this, "animationSpeed", 0, 10).onFinishChange(() => this.updateUniforms());
    animation.add(this, "animationDistance", 0, 10).onFinishChange(() => this.updateUniforms());

    this.gui.add(this, 'change_image');
    this.gui.add(this, 'take_screenshot');
  }

  take_screenshot() {
    var a = document.createElement('a');
    a.href = this.renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
    a.download = 'canvas.png';
    a.click();
    a.remove();
  }

  change_image() {
    var a = document.createElement('input');
    a.type = "file";

    a.onchange = async (e: any) => {
      const file = e.target.files[0];
      await this.loadImage(URL.createObjectURL(file));
      this.renderTurbulenceTextures();
      this.renderEdgesTexture();
      this.updateParticleInstances();
      this.updateUniforms();
      this.updateImageBackground();
      a.remove();
    };

    a.click();
  }

  get height() {
    if (!this.imageTexture) {
      return 1;
    }
    return Math.round(this.pixelDensity * (this.imageTexture.image.height / this.imageTexture.image.width));
  }

  particlesMesh: Mesh | null = null;

  createParticle() {
    const material = new RawShaderMaterial({
      uniforms: {
        uZ: { value: 0 },
        uScale: { value: 0 },
        uLayers: { value: 0 },
        textureWidth: { value: 0 },
        textureHeight: { value: 0 },
        uParticleScale: { value: 0 },
        uRandomOffsetScale: { value: 0 },
        uEnhanceDetails: { value: 0 },

        uColorOffset: { value: 0 },
        uLimitColors: { value: 0 },
        alpha: { value: 0 },

        uPointilism: { value: 0 },
        uTwoColors: { value: 0 },
        uReducedColorMultiplier: { value: 0 },

        uAnimation: { value: 0 },
        uAnimationNoise: { value: 0 },
        uAnimationSpeed: { value: 0 },
        uAnimationDistance: { value: 0 },

        ...this.uniforms,
      },
      vertexShader: particleWaveVert,
      //vertexShader: particleVert,
      fragmentShader: dotFrag,
      //depthTest: false,
      transparent: true,
      //side: DoubleSide,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneMinusSrcAlphaFactor,
    });

    var planeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1));
    const mesh = new Mesh(planeGeo, material);
    this.scene.add(mesh);
    this.particlesMesh = mesh;

    this.updateUniforms();
    this.updateParticleInstances();
  }

  updateUniforms() {
    const uniforms = (this.particlesMesh?.material as RawShaderMaterial).uniforms;
    const a = {
      uZ: { value: window.innerWidth / 4 },
      // uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },
      uScale: { value: this.size / this.pixelDensity },
      uLayers: { value: this.layers },

      textureWidth: { value: this.pixelDensity },
      textureHeight: { value: this.height },
      uParticleScale: { value: this.particleScale },
      uRandomOffsetScale: { value: this.randomOffsetScale },

      uColorOffset: { value: this.colorOffset },
      uLimitColors: { value: this.limitColors },
      alpha: { value: this.alpha },

      uPointilism: { value: this.pointilism ? 1 : 0 },
      uTwoColors: { value: this.twoColors ? 1 : 0 },
      uReducedColorMultiplier: { value: this.reducedColorMultiplier },

      uEnhanceDetails: { value: this.enhanceDetails ? 1 : 0 },

      uAnimation: { value: this.animate ? 1 : 0 },
      uAnimationNoise: { value: this.animateNoiseOffset },
      uAnimationSpeed: { value: this.animationSpeed },
      uAnimationDistance: { value: this.animationDistance },

      ...this.uniforms,
    };

    Object.keys(a).forEach(key => {
      uniforms[key].value = (a as any)[key].value;
    });
  }

  updateParticleInstances() {
    const index = new Float32Array(this.pixelDensity * this.height * 3 * this.layers);
    for (let l = 0; l < this.layers; l++) {
      for (let x = 0; x < this.pixelDensity; x++) {
        for (let y = 0; y < this.height; y++) {
          index[l * this.pixelDensity * this.height * 3 + 3 * x + 3 * y * this.pixelDensity] = x;
          index[l * this.pixelDensity * this.height * 3 + 3 * x + 3 * y * this.pixelDensity + 1] = y;
          index[l * this.pixelDensity * this.height * 3 + 3 * x + 3 * y * this.pixelDensity + 2] = l;
        }
      }
    }
    (this.particlesMesh?.geometry as InstancedBufferGeometry).setAttribute("index", new InstancedBufferAttribute(index, 3, true, 1));
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
    Object.values(this.backgroundMeshes).forEach((m) => m && this.scene.remove(m));

    const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
    const cube = new Mesh(geometry, new MeshBasicMaterial({ color: new Color(this.colors.background) }));
    cube.position.setZ(-1000);
    this.scene.add(cube);
    this.backgroundMeshes.behind = cube;


    if (this.clip && this.imageTexture) {
      const leftGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const leftMesh = new Mesh(leftGeometry, new MeshBasicMaterial({ color: new Color(this.colors.background) }));
      leftMesh.position.setZ(1);
      leftMesh.position.setX(-innerWidth / 2 - this.clipScale * this.size / 2);
      this.scene.add(leftMesh);
      this.backgroundMeshes.leftMesh = leftMesh;
      const rightGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const rightMesh = new Mesh(rightGeometry, new MeshBasicMaterial({ color: new Color(this.colors.background) }));
      rightMesh.position.setZ(1);
      rightMesh.position.setX(+innerWidth / 2 + this.clipScale * this.size / 2);
      this.scene.add(rightMesh);
      this.backgroundMeshes.rightMesh = rightMesh;

      const topGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const topMesh = new Mesh(topGeometry, new MeshBasicMaterial({ color: new Color(this.colors.background) }));
      topMesh.position.setZ(1);
      topMesh.position.setY(+innerHeight / 2 + (this.imageTexture.image.height / this.imageTexture.image.width) * this.clipScale * this.size / 2);
      this.scene.add(topMesh);
      this.backgroundMeshes.topMesh = topMesh;
      const bottomGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
      const bottomMesh = new Mesh(bottomGeometry, new MeshBasicMaterial({ color: new Color(this.colors.background) }));
      bottomMesh.position.setZ(1);
      bottomMesh.position.setY(-innerHeight / 2 - (this.imageTexture.image.height / this.imageTexture.image.width) * this.clipScale * this.size / 2);
      this.scene.add(bottomMesh);
      this.backgroundMeshes.bottomMesh = bottomMesh;
    }

  }

  backgroundImageMesh: Mesh | null = null;
  updateImageBackground() {

    if (this.backgroundImageMesh) {
      this.scene.remove(this.backgroundImageMesh);
    }

    if (!this.backgroundImage) {
      return;
    }

    const material = new MeshBasicMaterial({
      //      uniforms: {},
      //vertexShader: particleWaveVert,
      //fragmentShader: dotFrag,

      map: this.uniforms.uTexture.value,
      transparent: false,
    });

    var planeGeo = new PlaneGeometry(this.pixelDensity * this.size / this.pixelDensity, this.height * this.size / this.pixelDensity, 1, 1);
    const mesh = new Mesh(planeGeo, material);
    mesh.position.setZ(-999);
    this.scene.add(mesh);
    this.backgroundImageMesh = mesh;
  }

  noiseTurbulence1: Mesh | null = null;
  updateNoiseTurbulence1() {

    if (this.noiseTurbulence1) {
      this.scene.remove(this.noiseTurbulence1);
    }

    if (!this.showNoiseTurbulence1) {
      return;
    }
    const material = new MeshBasicMaterial({
      map: this.uniforms.turbulenceTexture.value,
      transparent: false,
    });
    var planeGeo = new PlaneGeometry(this.pixelDensity * this.size / this.pixelDensity, this.height * this.size / this.pixelDensity, 1, 1);
    const mesh = new Mesh(planeGeo, material);
    mesh.position.setZ(1);
    this.scene.add(mesh);
    this.noiseTurbulence1 = mesh;
  }
  noiseTurbulence2: Mesh | null = null;
  updateNoiseTurbulence2() {

    if (this.noiseTurbulence2) {
      this.scene.remove(this.noiseTurbulence2);
    }

    if (!this.showNoiseTurbulence2) {
      return;
    }
    const material = new MeshBasicMaterial({
      map: this.uniforms.turbulenceTexture2.value,
      transparent: false,
    });
    var planeGeo = new PlaneGeometry(this.pixelDensity * this.size / this.pixelDensity, this.height * this.size / this.pixelDensity, 1, 1);
    const mesh = new Mesh(planeGeo, material);
    mesh.position.setZ(1);
    this.scene.add(mesh);
    this.noiseTurbulence2 = mesh;
  }
  edgesMesh: Mesh | null = null;
  updateEdges() {

    if (this.edgesMesh) {
      this.scene.remove(this.edgesMesh);
    }

    if (!this.showEdges) {
      return;
    }
    const material = new MeshBasicMaterial({
      map: this.uniforms.edgesTexture.value,
      transparent: false,
    });
    var planeGeo = new PlaneGeometry(this.pixelDensity * this.size / this.pixelDensity, this.height * this.size / this.pixelDensity, 1, 1);
    const mesh = new Mesh(planeGeo, material);
    mesh.position.setZ(1);
    this.scene.add(mesh);
    this.edgesMesh = mesh;
  }

  async loadImage(name: string) {
    this.status = "loading";
    const texture: Texture = await new Promise((res) => {
      new TextureLoader().load(name, (tex: Texture) => {
        res(tex);
      })
    });
    this.imageTexture = texture;
    this.uniforms.uTexture.value = texture;
    this.status = "done";
    return texture;
  }

  turbulence: WebGLRenderTarget | null = null;
  turbulence2: WebGLRenderTarget | null = null;

  renderTurbulenceTextures() {
    if (!this.turbulence || !this.turbulence2) {
      this.turbulence = new WebGLRenderTarget(this.pixelDensity, this.height);
      this.turbulence2 = new WebGLRenderTarget(this.pixelDensity, this.height);
    }
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity, this.height, this.turbulence, parseShader(defaultVert), parseShader(turbulenceFrag),
      { uSeed: { value: 432 }, uScale: { value: this.turbulenceScale1 } }
    );
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity, this.height, this.turbulence2, parseShader(defaultVert), parseShader(turbulenceFrag),
      { uSeed: { value: 321 }, uScale: { value: this.turbulenceScale2 } }
    );
    this.uniforms.turbulenceTexture.value = this.turbulence.texture;
    this.uniforms.turbulenceTexture2.value = this.turbulence2.texture;
  }

  edges: WebGLRenderTarget | null = null;

  renderEdgesTexture() {
    if (!this.edges) {
      this.edges = new WebGLRenderTarget(this.pixelDensity * this.edgeMultiplier, this.height * this.edgeMultiplier);
    }
    renderPixelShaderToTexture(
      this.renderer, this.pixelDensity * this.edgeMultiplier, this.height * this.edgeMultiplier, this.edges, parseShader(defaultVert), parseShader(edgeDetectionFrag),
      {
        uTexture: { type: "t", value: this.imageTexture },
      }
    );
    const edgesBlur = new WebGLRenderTarget(this.pixelDensity * this.edgeMultiplier, this.height * this.edgeMultiplier);

    for (let n = 0; n < this.smoothingIterations; n++) {
      renderPixelShaderToTexture(
        this.renderer, this.pixelDensity * this.edgeMultiplier, this.height * this.edgeMultiplier, edgesBlur, parseShader(defaultVert), parseShader(blurFrag),
        {
          uTexture: { type: "t", value: this.edges.texture },
        }
      );
      renderPixelShaderToTexture(
        this.renderer, this.pixelDensity * this.edgeMultiplier, this.height * this.edgeMultiplier, this.edges, parseShader(defaultVert), parseShader(blurFrag),
        {
          uTexture: { type: "t", value: edgesBlur.texture },
        }
      );
    }
    edgesBlur.dispose();
    this.uniforms.edgesTexture.value = this.edges.texture;
  }

  updateSize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = 0.1 * window.innerWidth / - 2;
    this.camera.right = 0.1 * window.innerWidth / 2;
    this.camera.top = 0.1 * window.innerHeight / 2;
    this.camera.bottom = 0.1 * window.innerHeight / - 2;
  }

  render(delta: number) {
    this.uniforms.uTime.value += delta;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }


}