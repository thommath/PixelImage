import { Clock } from 'three';
import * as Stats from "stats.js";


import { ImageRenderer } from './ImageRenderer';


const imageRenderer = new ImageRenderer();


const run = async () => {

  await imageRenderer.loadImage("AAM144.jpg");
  imageRenderer.renderTurbulenceTextures();
  imageRenderer.renderEdgesTexture();
  imageRenderer.createParticles();
  



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
    
    imageRenderer.render(delta);

    stats.end();
    
  };

  animate();
};
run();
