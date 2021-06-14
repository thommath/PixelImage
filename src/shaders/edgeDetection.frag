
precision highp float;

uniform sampler2D uTexture;
uniform float textureWidth;
uniform float textureHeight;

varying vec2 vUv;

void main() {

  vec2 tick = vec2(1.0 / textureWidth, 1.0 / textureHeight);
  
  vec4 colL = texture2D(uTexture, vUv + tick * vec2(-1.0, 0.0));
  vec4 colR = texture2D(uTexture, vUv + tick * vec2(1.0, 0.0));
  vec4 colU = texture2D(uTexture, vUv + tick * vec2(0.0, 1.0));
  vec4 colD = texture2D(uTexture, vUv + tick * vec2(0.0, -1.0));

  vec4 diff = min(vec4(1.0), clamp(vec4(0.0), vec4(1.0), abs(colL - colR)) + clamp(vec4(0.0), vec4(1.0), abs(colU - colD)));

  float maxVal = max(max(diff.x, diff.y), diff.z);
  
  gl_FragColor = vec4(maxVal, maxVal, maxVal, maxVal > 0.1 ? 1.0 : 0.0);
}
