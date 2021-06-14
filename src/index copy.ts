import {Scene, PerspectiveCamera, WebGLRenderer, Clock, InstancedBufferAttribute, TextureLoader, PlaneBufferGeometry, Texture, OrthographicCamera, Vector2, DataTexture, RGBFormat, MeshBasicMaterial, BoxGeometry, PlaneGeometry, WebGLRenderTarget, LinearFilter, NearestFilter } from 'three';
import { DoubleSide, InstancedBufferGeometry, Mesh, RawShaderMaterial } from "three";
import * as Stats from "stats.js";

import particleVert from 'raw-loader!./shaders/particle.vert';
import particleWaveVert from 'raw-loader!./shaders/particle wave.vert';
import particleFrag from 'raw-loader!./shaders/particle.frag';
import defaultVert from 'raw-loader!./shaders/default.vert';
import turbulenceFrag from 'raw-loader!./shaders/turbulence.frag';

const run = async () => {

  var scene = new Scene();
  var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

  var renderer = new WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //const texture = new TextureLoader().load( "nature medium.jpg" );
  const texture: Texture = await new Promise((res, rej) => {
    new TextureLoader().load( "nature big.jpg", (tex) => {
      res(tex);
    })
  });
  const pixelDensity = 4500;
  const height = Math.round(pixelDensity * (texture.image.height / texture.image.width));


  const turbulence = new WebGLRenderTarget(pixelDensity, height);
  const turbulence2 = new WebGLRenderTarget(pixelDensity, height);

  {
    renderer.setSize( pixelDensity, height );
    const scene2 = new Scene();
    const camera2 = new OrthographicCamera(pixelDensity / - 2, pixelDensity / 2, height / 2, height / - 2, 1, 1000 );

    const geometry = new PlaneGeometry(pixelDensity, height, 1, 1);
    const uniforms2 = {
      uSeed: { value: 122 },
      uScale: { value: 1 },
      textureWidth: { value: pixelDensity },
      textureHeight: { value: height },
    };
    const material2 = new RawShaderMaterial({
      uniforms: uniforms2,
      vertexShader: defaultVert.substr(16, defaultVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
      fragmentShader: turbulenceFrag.substr(16, turbulenceFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    });
    const cube = new Mesh( geometry, material2 );
    scene2.add( cube );

    camera2.position.z = 5;

    renderer.setRenderTarget(turbulence);
    renderer.render( scene2, camera2 );
    
    material2.uniforms.uScale.value = 2;
    material2.uniforms.uSeed.value = 222;
    renderer.setRenderTarget(turbulence2);
    renderer.render( scene2, camera2 );
    
    renderer.setRenderTarget(null);
  }

  const duration = 10;
  const pixelWidth = window.innerWidth * 0.95;

  const uniforms = {
    uSeed: { value: 123 },
    uTime: { value: 0 },
    
    uAnimationDuration: { value: duration },
    
    uZ: { value: window.innerWidth / 4 },
    uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },

    turbulenceTexture: { type: "t", value: turbulence.texture },
    turbulenceTexture2: { type: "t", value: turbulence2.texture },

    textureWidth: { value: pixelDensity },
    textureHeight: { value: height },
    uTexture: { type: "t", value: texture },
  };

  const material = new RawShaderMaterial({
    uniforms,
    vertexShader: particleWaveVert.substr(16, particleWaveVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    //vertexShader: particleVert.substr(16, particleVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    fragmentShader: particleFrag.substr(16, particleFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    //depthTest: false,
    transparent: true,
    //side: DoubleSide,
  });


  var planeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1));
  const mesh = new Mesh(planeGeo, material);

  const index = new Float32Array(pixelDensity*height*2);

  for(let x = 0; x < pixelDensity; x++) {
    for(let y = 0; y < height; y++) {
      index[2*x+2*y*pixelDensity] = x;
      index[2*x+2*y*pixelDensity + 1] = y;
    }
  }

  planeGeo.setAttribute("index", new InstancedBufferAttribute(index, 2, true, 1));
  scene.add(mesh)

  // Initialize a planet system
  camera.position.z = 1;

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

    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    uniforms.uTime.value += delta*3;
    
    renderer.render( scene, camera );
    stats.end();
    
  };

  animate();
};
run();
