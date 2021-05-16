# Exploration

## Install

### Requirements
* nodejs
* npm

### Setup
* Clone project
* run `npm install`

### Build
* run `npm run build`

## Run development server
* run `npm run start`


# Future plans

## How it works

By using random 2d-something you generate a mesh, a very simple mesh like a single triangle in the far distance.
When you move closer the triangle gets bigger and then you split it into multiple triangles by using another 2d-something.
You repeat this for all the triangles in view.

By doing this you should be able to get a mountain wall for example.
You start of with a flat wall and then you can see that it is not flat, but has some higher and some lower points.
Then you can see the big stones, then the smaller ones and finally when you are up close you can see the dust. 

By using random seeds and 2d/3d-noise you can show huge amazing generated worlds. 
To extend on this you could use rules like a->aba to generate some terrain or details in/to the terrain.

## Scope
Could be used for worlds first by using a sphere and then adding noise and then add to the level of details.
Have fun with it! 


### Planets
Can start of as a triangle, then a cube, sphere, more detailed sphere and then go into the pure splitting. 

Each planet should have it's own randomized parameters for the 2d-randomized terrain, it's own water levels and maybe even different biomes (triangles with different settings) and different vegetation. 
