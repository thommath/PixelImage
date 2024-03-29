
precision highp float;

uniform sampler2D uTexture;
uniform float textureWidth;
uniform float textureHeight;

varying vec2 vUv;
varying vec2 vUv2;
varying float vTime;
varying vec2 vRnd;


float bezier(float p1, float p2, float p3, float p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

void main() {
  
  //vec4 colA = texture2D(uTexture, vUv2);

  float iTime = vTime;

  float time = clamp(0.0, 1.0, bezier(1.0, 0.0, 0.5, 1.0, iTime));

  float mask = clamp(0.0, 1.0, 1.0 - abs(0.5 - vUv.x) * time - abs(0.5 - vUv.y) * time);

  vec4 colA = texture2D(uTexture, vUv2 + vUv / vec2(textureWidth, textureHeight));

  gl_FragColor = 0.7 * colA * time
    + (1.0 / 0.7) * (1.0-time) * vec4(clamp(0.0, 1.0, vRnd.r + vRnd.g - time - 0.1), clamp(0.0, 1.0, time - vRnd.r), clamp(0.0, 1.0, time - vRnd.g), 1.0);

} 
