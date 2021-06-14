
precision highp float;

uniform sampler2D uTexture;
uniform float textureWidth;
uniform float textureHeight;

varying vec2 vUv;

void main() {

  vec2 tick = vec2(1.0 / textureWidth, 1.0 / textureHeight);
  
  vec4 col = texture2D(uTexture, vUv);

  vec4 colL = texture2D(uTexture, vUv + tick * vec2(-1.0, 0.0));
  vec4 colR = texture2D(uTexture, vUv + tick * vec2(1.0, 0.0));
  vec4 colU = texture2D(uTexture, vUv + tick * vec2(0.0, 1.0));
  vec4 colD = texture2D(uTexture, vUv + tick * vec2(0.0, -1.0));

  float color = (colL + colR + colU + colD).x / 4.0;

  gl_FragColor = clamp(vec4(0.0), vec4(1.0), vec4(vec3(max(color, col.x)), col.w));
}
