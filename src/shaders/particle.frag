
precision highp float;

uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vUv2;
varying float vTime;


float bezier(float p1, float p2, float p3, float p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

void main() {
  
  vec4 colA = texture2D(uTexture, vUv2);

  float iTime = vTime;

  float time = clamp(0.0, 1.0, bezier(1.0, 0.0, 0.5, 0.0, iTime));

  float mask = clamp(0.0, 1.0, 1.0 - abs(0.5 - vUv.x) * time - abs(0.5 - vUv.y) * time);

  gl_FragColor = colA * mask;

} 
