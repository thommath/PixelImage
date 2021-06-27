import { Clock } from 'three';
import * as Stats from "stats.js";


import { ImageRenderer } from './ImageRenderer';


const imageRenderer = new ImageRenderer();


imageRenderer.renderer.domElement.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
imageRenderer.renderer.domElement.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

imageRenderer.renderer.domElement.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const dt = e.dataTransfer;


  const url=e.dataTransfer.getData('text/plain');

  if (url) {
    await imageRenderer.loadImage(url);
    imageRenderer.renderTurbulenceTextures();
    imageRenderer.renderEdgesTexture();
    imageRenderer.createParticles();
  }

  if (dt && dt.files && dt.files.length) {
    await imageRenderer.loadImage(URL.createObjectURL(dt.files[0]));
    imageRenderer.renderTurbulenceTextures();
    imageRenderer.renderEdgesTexture();
    imageRenderer.createParticles();
  }
});


const run = async () => {

  await imageRenderer.loadImage("AAM144.jpg");
  //await imageRenderer.loadImage("nature big.jpg");
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
