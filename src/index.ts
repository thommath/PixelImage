import {Scene, PerspectiveCamera, WebGLRenderer, Clock, InstancedBufferAttribute, TextureLoader, PlaneBufferGeometry, Texture, OrthographicCamera, Vector2, DataTexture, RGBFormat, MeshBasicMaterial, BoxGeometry, PlaneGeometry, WebGLRenderTarget, LinearFilter, NearestFilter, MeshNormalMaterial, Material, Color } from 'three';
import { DoubleSide, InstancedBufferGeometry, Mesh, RawShaderMaterial } from "three";
import * as Stats from "stats.js";

import particleVert from 'raw-loader!./shaders/particle.vert';
import particleWaveVert from 'raw-loader!./shaders/particle wave.vert';
import particleFrag from 'raw-loader!./shaders/particle.frag';
import edgeDetectionFrag from 'raw-loader!./shaders/edgeDetection.frag';
import blurFrag from 'raw-loader!./shaders/blur.frag';
import defaultVert from 'raw-loader!./shaders/default.vert';
import turbulenceFrag from 'raw-loader!./shaders/turbulence.frag';
import dotFrag from 'raw-loader!./shaders/particle dot.frag';
import { renderPixelShaderToTexture } from './pixelShaderToTexture';
import { parseShader } from './utils';

const run = async () => {

  var scene = new Scene();
  //var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

  var renderer = new WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //const texture = new TextureLoader().load( "nature medium.jpg" );
  const texture: Texture = await new Promise((res, rej) => {
    new TextureLoader().load( "AAM144.jpg", (tex) => {
      res(tex);
    })
  });

  const layers = 50;
  const pixelDensity = 30;
  const duration = 10;
  const pixelWidth = window.innerWidth * 0.90;
  const smoothingIterations = 25;
  const edgeMultiplier = 1;

  const height = Math.round(pixelDensity * (texture.image.height / texture.image.width));

  const turbulence = new WebGLRenderTarget(pixelDensity * 2, height*2);
  const turbulence2 = new WebGLRenderTarget(pixelDensity * 2, height*2);

  
  const camera = new OrthographicCamera(0.1 * window.innerWidth / - 2, 0.1 * window.innerWidth / 2, 0.1 * window.innerHeight / 2, 0.1 * window.innerHeight / - 2, 1, 2000);
  
  renderPixelShaderToTexture(
    renderer, pixelDensity * 2, height*2, turbulence, parseShader(defaultVert), parseShader(turbulenceFrag), 
    {uSeed: { value: 432 }, uScale: { value: 1 }}
  );
  renderPixelShaderToTexture(
    renderer, pixelDensity * 2, height*2, turbulence2, parseShader(defaultVert), parseShader(turbulenceFrag), 
    {uSeed: { value: 321 }, uScale: { value: 2 }}
  );
      
      
  const edges = new WebGLRenderTarget(pixelDensity*edgeMultiplier, height*edgeMultiplier);
  renderPixelShaderToTexture(
    renderer, pixelDensity*edgeMultiplier, height*edgeMultiplier, edges, parseShader(defaultVert), parseShader(edgeDetectionFrag), 
    {
      uTexture: { type: "t", value: texture },
    }
  );
  const edgesBlur = new WebGLRenderTarget(pixelDensity*edgeMultiplier, height*edgeMultiplier);

  for(let n = 0; n < smoothingIterations; n++) {
    renderPixelShaderToTexture(
      renderer, pixelDensity*edgeMultiplier, height*edgeMultiplier, edgesBlur, parseShader(defaultVert), parseShader(blurFrag), 
      {
        uTexture: { type: "t", value: edges.texture },
      }
    );
    renderPixelShaderToTexture(
      renderer, pixelDensity*edgeMultiplier, height*edgeMultiplier, edges, parseShader(defaultVert), parseShader(blurFrag), 
      {
        uTexture: { type: "t", value: edgesBlur.texture },
      }
    );
  }

  const uniforms = {
    uSeed: { value: 123 },
    uTime: { value: 0 },

    uAnimationDuration: { value: duration },
    
    uZ: { value: window.innerWidth / 4 },
    //uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },
    uScale: { value: 80 / pixelDensity },
    uLayers: {value: layers},

    turbulenceTexture: { type: "t", value: turbulence.texture },
    turbulenceTexture2: { type: "t", value: turbulence2.texture },
    edgesTexture: { type: "t", value: edges.texture },

    textureWidth: { value: pixelDensity },
    textureHeight: { value: height },
    uTexture: { type: "t", value: texture },
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


  const index = new Float32Array(pixelDensity*height*3 * layers);
  for(let l = 0; l < layers; l++) {
    for(let x = 0; x < pixelDensity; x++) {
      for(let y = 0; y < height; y++) {
        index[l*pixelDensity*height*3 + 3*x+3*y*pixelDensity] = x;
        index[l*pixelDensity*height*3 + 3*x+3*y*pixelDensity + 1] = y;
        index[l*pixelDensity*height*3 + 3*x+3*y*pixelDensity + 2] = l;
      }
    }
  }

  planeGeo.setAttribute("index", new InstancedBufferAttribute(index, 3, true, 1));
  scene.add(mesh)


  const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1);
  const cube = new Mesh(geometry, new MeshBasicMaterial({color: new Color(1, 0.1, 0.5)}));
  cube.position.setZ(-1000);
  scene.add(cube);


  camera.position.z = 10;
  const clock = new Clock();


  // Only upadte if window is in focus
  let isTabActive: boolean = true;

  window.onfocus = function () { 
    isTabActive = true; 
  }; 

  window.onblur = function () { 
    isTabActive = false; 
  }; 

  const stats = new Stats();
  stats.showPanel( 0 );
  document.body.appendChild( stats.dom );
  // Update function
  var animate = function () {
    requestAnimationFrame( animate );
    stats.begin();
  // Only upadte if window is in focus
    if (!isTabActive) {
      
      if (clock.running) {
        clock.stop();
      }
      return;
    } else if (!clock.running) {
      clock.start();
    }
    
    var delta = clock.getDelta();

    
    //camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    uniforms.uTime.value += delta*3;
    
    renderer.render( scene, camera );
    stats.end();
    
  };

  animate();
};
run();
