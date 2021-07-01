import { Clock, Material, RawShaderMaterial } from 'three';
import * as Stats from "stats.js";
import { ImageRenderer } from './ImageRenderer';

var style = document.createElement('style');
style.innerHTML =
	'html, body {' +
		'height: 100%;' +
    'width: 100%;' +
    'margin: 0;'
	'}';
document.head.insertBefore(style, document.head.firstChild);

const imageRenderer = new ImageRenderer();



window.addEventListener("resize", () => {
  imageRenderer.updateSize();
  imageRenderer.render(0);
});

imageRenderer.renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  imageRenderer.size += e.deltaY * -0.01;
  imageRenderer.updateUniforms();
});

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
    imageRenderer.updateParticleInstances();
    imageRenderer.updateUniforms();
  }

  if (dt && dt.files && dt.files.length) {
    await imageRenderer.loadImage(URL.createObjectURL(dt.files[0]));
    imageRenderer.renderTurbulenceTextures();
    imageRenderer.renderEdgesTexture();
    imageRenderer.updateParticleInstances();
    imageRenderer.updateUniforms();
  }
});


const run = async () => {

  await imageRenderer.loadImage("AAM144.jpg");
  //await imageRenderer.loadImage("nature big.jpg");
  imageRenderer.renderTurbulenceTextures();
  imageRenderer.renderEdgesTexture();
  imageRenderer.updateParticleInstances();
  imageRenderer.updateUniforms();
  



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
