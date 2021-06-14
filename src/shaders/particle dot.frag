
precision highp float;

uniform sampler2D uTexture;
uniform float textureWidth;
uniform float textureHeight;

varying vec2 vUv;
varying vec2 vUv2;
varying float vTime;
varying vec2 vRnd;
varying float vParticleScale;

float random(float n) {
  return fract(sin(n) * 43758.5453123);
}

float bezier(float p1, float p2, float p3, float p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

void main() {
  
  //vec4 colA = texture2D(uTexture, vUv2);

  float iTime = vTime;

  float time = clamp(0.0, 1.0, bezier(1.0, 0.0, 0.5, 1.0, iTime));

  float mask = pow((vUv.x - 0.5), 2.0) + pow((vUv.y - 0.5), 2.0) < 0.2 ? 1.0 : 0.0;

  vec4 colA = texture2D(uTexture, vUv2 + vParticleScale * (random(vUv2.x) + random(vUv2.y)) * 1.0 / vec2(textureWidth, textureHeight));

  float maxColors = 10.0;

  colA.x = (floor(colA.x * maxColors) / maxColors);

  gl_FragColor = colA * mask * vec4(1.0, 1.0, 1.0, 0.8);

} 
