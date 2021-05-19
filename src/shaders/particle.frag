
precision highp float;

uniform sampler2D uTexture;

varying vec3 vColor;
varying vec2 vUv;

void main() {
  
  vec4 colA = texture2D(uTexture, vUv);
  gl_FragColor = vec4(vColor, 1.0);
  gl_FragColor = colA;

} 
