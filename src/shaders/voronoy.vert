


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
