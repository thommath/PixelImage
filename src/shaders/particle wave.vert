precision highp float;

attribute vec3 position;
attribute vec3 index;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;


uniform float uAnimation;
uniform float uAnimationNoise;
uniform float uAnimationSpeed;

uniform float uSeed;
uniform float uPixelParticleRatio;
uniform float uZ;
uniform float uParticleScale;
uniform float uRandomOffsetScale;
uniform float uScale;
uniform float uLayers;
uniform float uAnimationDuration;
uniform float uTime;
uniform float textureWidth;
uniform float textureHeight;
uniform sampler2D uTexture;
uniform sampler2D turbulenceTexture;
uniform sampler2D turbulenceTexture2;
uniform sampler2D edgesTexture;
uniform float uEnhanceDetails;



varying vec2 vUv;
varying vec2 vUv2;
varying float vTime;
varying vec2 vRnd;
varying float vParticleScale;

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
  
  vec2 randomOffset = uRandomOffsetScale * 2.0*(0.5-vec2(random(index.z + noise), random(index.z + noise2)));

  randomOffset *= (1.0-uAnimation) + uAnimation * 10.0 * (0.5+0.5*(0.5+0.5*sin(noise*100.0 * uAnimationNoise + uAnimationSpeed * uTime)));

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


  vUv = uv;
  vUv2 = uv2;
  gl_Position = finalPosition;
  vRnd = vec2(noise, noise2);
  vParticleScale = particleScale;
}
