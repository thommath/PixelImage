import {Scene, PerspectiveCamera, WebGLRenderer, Clock } from 'three';
import { PlanetSystem } from './PlanetSystem';
import { FlyControls } from './FlyControls';

var scene = new Scene();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Initialize a planet system
const planetsystem = new PlanetSystem();

scene.add(planetsystem);

camera.position.z = 3;

const clock = new Clock();

const keysPressed: any = {};
window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
});
window.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});

/**
 * Add some controls copied from the internet (sorce in the file)
 */
const controls = new FlyControls( camera, renderer.domElement );
controls.movementSpeed = 10;
controls.domElement = renderer.domElement;
controls.rollSpeed = Math.PI / 6;
controls.autoForward = false;
controls.dragToLook = false;


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
  
  controls.update( delta );
  planetsystem.update(camera);

  renderer.render( scene, camera );
};

animate();

