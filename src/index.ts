import {Scene, PerspectiveCamera, WebGLRenderer, Clock, InstancedBufferAttribute, TextureLoader, PlaneBufferGeometry } from 'three';
import { BoxBufferGeometry, DoubleSide, InstancedBufferGeometry, Mesh, RawShaderMaterial } from "three";

import particleVert from 'raw-loader!./shaders/particle.vert';
import particleFrag from 'raw-loader!./shaders/particle.frag';

var scene = new Scene();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const texture = new TextureLoader().load( "nature medium.jpg" );

const uniforms = {
  uTime: { value: 0 },
  uTexture: { type: "t", value: texture },
};

const material = new RawShaderMaterial({
  uniforms,
  vertexShader: particleVert.substr(16, particleVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
  fragmentShader: particleFrag.substr(16, particleFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n"),
  //depthTest: false,
  //transparent: true,
  side: DoubleSide,
});



var cubeGeo = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1, 1));
const mesh = new Mesh(cubeGeo, material);

const width = 1024;//100*5;
const height = 576;//56*5;

const floats = new Float32Array(width*height*2);
const offset = new Float32Array(width*height*3);

for(let x = 0; x < width; x++) {
  for(let y = 0; y < height; y++) {
    floats[2*x+2*y*width] = x / width;
    floats[2*x+2*y*width + 1] = y / height;

    
    offset[3*x+3*y*width] = x * 1 - width / 2;
    offset[3*x+3*y*width + 1] = y * 1 - height / 2;
    offset[3*x+3*y*width + 2] = -width * 0.5;
  }
}





cubeGeo.setAttribute("offset", new InstancedBufferAttribute(offset, 3, true, 1));
cubeGeo.setAttribute("uv", new InstancedBufferAttribute(floats, 2, true, 1));
scene.add(mesh)

// Initialize a planet system
//const particleRenderer = new ParticleRenderer();

//scene.add(particleRenderer);

camera.position.z = 3;

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

  uniforms.uTime.value += delta * 0.5;
  
  renderer.render( scene, camera );
};

animate();

