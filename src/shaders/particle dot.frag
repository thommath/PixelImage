
precision highp float;


varying vec4 vColor;
varying vec2 vUv;

void main() {

  float mask = pow((vUv.x - 0.5), 2.0) + pow((vUv.y - 0.5), 2.0) < 0.2 ? 1.0 : 0.0;
  gl_FragColor = vColor * mask;

} 
