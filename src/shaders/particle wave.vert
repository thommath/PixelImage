precision highp float;

attribute vec3 position;
attribute vec3 index;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uAnimation;
uniform float uAnimationNoise;
uniform float uAnimationSpeed;
uniform float uAnimationDistance;

uniform float uParticleScale;
uniform float uRandomOffsetScale;
uniform float uScale;
uniform float uTime;
uniform float textureWidth;
uniform float textureHeight;
uniform float uEnhanceDetails;

uniform sampler2D uTexture;
uniform sampler2D turbulenceTexture;
uniform sampler2D turbulenceTexture2;
uniform sampler2D edgesTexture;

uniform float alpha;
uniform float uColorOffset;
uniform float uLimitColors;

uniform float uPointilism;
uniform float uTwoColors;
uniform float uReducedColorMultiplier;

varying vec4 vColor;
varying vec2 vUv;

float random(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 bezier(vec3 p1, vec3 p2, vec3 p3, vec3 p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

float bezier(float p1, float p2, float p3, float p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

void main() {

  vec2 offset = vec2(
    index.x - textureWidth / 2.0,
    index.y - textureHeight / 2.0
  );
  vec2 uv2 = vec2(
    index.x / textureWidth,
    index.y / textureHeight
  );

  float noise = texture2D(turbulenceTexture, uv2).r;
  float noise2 = texture2D(turbulenceTexture2, uv2).r;
  
  vec2 randomDir = 2.0*(0.5-vec2(random(index.z*2.0 + noise), random(index.z*2.0 + noise2)));
  vec2 randomOffset = (1.0-uAnimation) * uRandomOffsetScale * randomDir;

  randomOffset += uAnimation * randomDir * uRandomOffsetScale * (0.5+0.5*(0.5+0.5*sin(noise*100.0 * uAnimationNoise + uAnimationSpeed * uTime)));

  uv2 += randomOffset / vec2(textureWidth, textureHeight);

  offset = offset + randomOffset;

  vec4 edgeValue = texture2D(edgesTexture, uv2) * uEnhanceDetails;
  //edgeValue.x = 1.0*bezier(0.5, 0.99, 0.62, 0.99, edgeValue.x);

  float particleScale = uParticleScale * max(0.2, pow(1.0 - edgeValue.x, 1.0));
  //particleScale *= clamp(0.8, 1.0, (uLayers - index.z) / uLayers);

  particleScale *= (1.0-uAnimation) + (max(0.2, pow(1.0 - edgeValue.x, 1.0)) > 0.5 ? uAnimation * (0.5+0.5*(0.5+0.5*sin(noise*100.0 * uAnimationNoise + uAnimationSpeed * uTime * 1.0))) : 1.0);

  vec4 finalPosition =
    projectionMatrix *
    modelViewMatrix *
    vec4((position * particleScale + vec3(offset, 0.0)) * uScale, 1.0);
    //vec4(bezier(p1, p2, p3, p4, time) * uScale, 1.0);


  vec4 color = texture2D(uTexture, uv2 + uColorOffset * (particleScale * (random(uv2.x) - random(uv2.y)) / vec2(textureWidth, textureHeight)));
  
  float randomColorLimit = random(index.z*2.0 + uv2.x);

  float multiplier1 = (1.0-uTwoColors) * uReducedColorMultiplier + uTwoColors;
  float multiplier2 = (1.0-uTwoColors) + uTwoColors * uReducedColorMultiplier;

  color.x = (floor(0.5 + color.x * uLimitColors) / uLimitColors) * ((1.0-uPointilism) + uPointilism * (randomColorLimit > 0.33 ? multiplier1 : multiplier2));
  color.y = (floor(0.5 + color.y * uLimitColors) / uLimitColors) * ((1.0-uPointilism) + uPointilism * (randomColorLimit < 0.67 ? multiplier1 : multiplier2));
  color.z = (floor(0.5 + color.z * uLimitColors) / uLimitColors) * ((1.0-uPointilism) + uPointilism * (randomColorLimit < 0.33 || randomColorLimit > 0.67 ? multiplier1 : multiplier2));
  color.w = alpha;



  vColor = color;
  vUv = uv;
  gl_Position = finalPosition;
}
