import {Scene, PerspectiveCamera, WebGLRenderer, Clock, InstancedBufferAttribute, TextureLoader, PlaneBufferGeometry, Texture } from 'three';
import { DoubleSide, InstancedBufferGeometry, Mesh, RawShaderMaterial } from "three";

import particleVert from 'raw-loader!./shaders/particle.vert';
import particleFrag from 'raw-loader!./shaders/particle.frag';

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
  const pixelDensity = 100;
  const height = Math.round(pixelDensity * (texture.image.height / texture.image.width));

  const duration = 5;
  const pixelWidth = window.innerWidth / 2;

  const uniforms = {
    uSeed: { value: 123 },
    uTime: { value: 0 },

    
    uAnimationDuration: { value: duration },
    
    uZ: { value: window.innerWidth / 4 },
    uScale: { value: (pixelWidth / 870) * 1 / pixelDensity },

    textureWidth: { value: pixelDensity },
    textureHeight: { value: height },
    uTexture: { type: "t", value: texture },
  };

  const material = new RawShaderMaterial({
    uniforms,
    vertexShader: particleVert.substr(16, particleVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    fragmentShader: particleFrag.substr(16, particleFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
    //depthTest: false,
    transparent: true,
    side: DoubleSide,
  });



  var cubeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1, 1));
  const mesh = new Mesh(cubeGeo, material);


  const floats = new Float32Array(pixelDensity*height*2);
  const offset = new Float32Array(pixelDensity*height*2);

  for(let x = 0; x < pixelDensity; x++) {
    for(let y = 0; y < height; y++) {
      floats[2*x+2*y*pixelDensity] = x / pixelDensity;
      floats[2*x+2*y*pixelDensity + 1] = y / height;

      
      offset[2*x+2*y*pixelDensity] = x * 1 - pixelDensity / 2;
      offset[2*x+2*y*pixelDensity + 1] = y * 1 - height / 2;
    }
  }





  cubeGeo.setAttribute("offset", new InstancedBufferAttribute(offset, 2, true, 1));
  cubeGeo.setAttribute("uv2", new InstancedBufferAttribute(floats, 2, true, 1));
  scene.add(mesh)

  // Initialize a planet system
  //const particleRenderer = new ParticleRenderer();

  //scene.add(particleRenderer);

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

  // Update function
  var animate = function () {
    requestAnimationFrame( animate );

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

    uniforms.uTime.value += delta;
    
    renderer.render( scene, camera );
  };

  animate();

};
run();
