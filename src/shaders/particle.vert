precision highp float;

attribute vec2 offset;
attribute vec3 position;
attribute vec2 uv;
attribute vec2 uv2;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uSeed;
uniform float uZ;
uniform float uScale;
uniform float uAnimationDuration;
uniform float uTime;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vUv2;
varying float vTime;

float random(float n) {
  return fract(sin(n) * 43758.5453123);
}


vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float turbulence( vec2 p ) {

  float w = 100.0;
  float t = 0.0;

  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( snoise( vec2( power * p )) / power );
  }

  return t;

}




float rand3dTo1d(vec3 value){
  vec3 dotDir = vec3(12.9898, 78.233, 37.719);
  //make value smaller to avoid artefacts
  vec3 smallValue = sin(value);
  //get scalar value from 3d vector
  float random = dot(smallValue, dotDir);
  //make value more random by making it bigger and then taking teh factional part
  random = fract(sin(random) * 143758.5453);
  return random;
}
float rand3dTo1d(vec3 value, vec3 dotDir){
  //make value smaller to avoid artefacts
  vec3 smallValue = sin(value);
  //get scalar value from 3d vector
  float random = dot(smallValue, dotDir);
  //make value more random by making it bigger and then taking teh factional part
  random = fract(sin(random) * 143758.5453);
  return random;
}
//get a 3d random value from a 3d value
vec3 rand3dTo3d(vec3 value){
    return vec3(
        rand3dTo1d(value, vec3(12.989, 78.233, 37.719)),
        rand3dTo1d(value, vec3(39.346, 11.135, 83.155)),
        rand3dTo1d(value, vec3(73.156, 52.235, 09.151))
    );
}

vec3 voronoiNoise(vec3 value){
  vec3 baseCell = floor(value);

  //first pass to find the closest cell
  float minDistToCell = 10.0;
  vec3 toClosestCell;
  vec3 closestCell;
  //[unroll]
  for(int x1=-1; x1<=1; x1++){
      //[unroll]
      for(int y1=-1; y1<=1; y1++){
          //[unroll]
          for(int z1=-1; z1<=1; z1++){
              vec3 cell = baseCell + vec3(x1, y1, z1);
              vec3 cellPosition = cell + rand3dTo3d(cell);
              vec3 toCell = cellPosition - value;
              float distToCell = length(toCell);
              if(distToCell < minDistToCell){
                  minDistToCell = distToCell;
                  closestCell = cell;
                  toClosestCell = toCell;
              }
          }
      }
    }

    //second pass to find the distance to the closest edge
    float minEdgeDistance = 10.0;
    //[unroll]
    for(int x2=-1; x2<=1; x2++){
        //[unroll]
        for(int y2=-1; y2<=1; y2++){
            //[unroll]
            for(int z2=-1; z2<=1; z2++){
                vec3 cell = baseCell + vec3(x2, y2, z2);
                vec3 cellPosition = cell + rand3dTo3d(cell);
                vec3 toCell = cellPosition - value;

                vec3 diffToClosestCell = abs(closestCell - cell);
                bool isClosestCell = diffToClosestCell.x + diffToClosestCell.y + diffToClosestCell.z < 0.1;
                if(!isClosestCell){
                    vec3 toCenter = (toClosestCell + toCell) * 0.5;
                    vec3 cellDifference = normalize(toCell - toClosestCell);
                    float edgeDistance = dot(toCenter, cellDifference);
                    minEdgeDistance = min(minEdgeDistance, edgeDistance);
                }
            }
        }
    }

    float random = rand3dTo1d(closestCell);
    return vec3(minDistToCell, random, minEdgeDistance);
}



vec3 bezier(vec3 p1, vec3 p2, vec3 p3, vec3 p4, float t) {
  float it = 1.0-t;
  return pow(it,3.0) * p1 + 3.0*pow(it,2.0) * t * p2 + 3.0*it*pow(t,2.0)*p3 + pow(t,3.0)*p4;
}

void main() {
  float noise = turbulence(vec2(uSeed, uSeed) + uv2);
  float noise2 = turbulence(vec2(uSeed, uSeed)*2.0 + uv2);
  float wait = clamp(0.0, 1.0, 1.0 * noise2);
  
  vec3 voronoi = voronoiNoise(vec3(vec2(uSeed, uSeed) + uv2, 1.0) * 30.0);

  float weight = 0.0;

  noise = voronoi.z * weight + noise * (1.0-weight);

  float speed = (1.0 + noise) * 1.5;

  float time = clamp(0.0, 1.0, speed * uTime / uAnimationDuration - wait );
  
  vec4 finalPosition;
  

  vec3 p1 = position + vec3(uZ / 2.0, 0.0, 0.0);
  vec3 p2 = vec3(uZ / 8.0, 0.0, -50.0);
  vec3 p3 = vec3(-uZ / 8.0, 0.0, -50.0);
  vec3 p4 = position + vec3(offset, 0.0);

  finalPosition =
    projectionMatrix *
    modelViewMatrix *
    //vec4(position+offset,1.0);
    vec4(bezier(p1, p2, p3, p4, time) * uScale, 1.0);


  vTime = time;
  vUv = uv;
  vUv2 = uv2;
  gl_Position = finalPosition;
}
