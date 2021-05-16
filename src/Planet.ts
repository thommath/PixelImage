import { Geometry, Vector3, Object3D, Mesh, Material, Camera, MeshPhongMaterial } from "three";
import { Icosphere, GenerationConfig } from './Icosphere';


export type PlanetConfig = {
  pos: Vector3;
  size?: number;
  color?: Vector3;
  seed?: number;
  geometry?: Geometry;
  material?: Material;
  generationConfig: GenerationConfig;
};

export class Planet extends Mesh{
  config: PlanetConfig;

  detailLevel: number = 0;

  lastRes: number = 0;

  constructor(parent: Object3D, config: PlanetConfig) {
    super(config.geometry, config.material);

    this.config = config;

    // Set material
    this.material = config.material || new MeshPhongMaterial({ color: 0x00ff00 });
    // Set geometry
    this.setRes(1);

    parent.add(this);
  }

  setRes(detailLevel: number) {

    // Only update is resolution has changed
    if (detailLevel === this.lastRes) {
      return;
    } else {
      this.lastRes = detailLevel;
    }

    // Get geometry object of the new resolution
    this.geometry = Icosphere.createGeometry(detailLevel, this.config.pos, this.config.generationConfig);

    // Move and scale the planet
    this.geometry.scale(this.config.size || 1, this.config.size || 1, this.config.size || 1);
    this.geometry.translate(this.config.pos.x, this.config.pos.y, this.config.pos.z)
  }
  
  /**
   * Calculate the resolution based on distance from camera to the planet
   * @param camera 
   */
  update(camera: Camera) {
    const d = camera.position.distanceTo(this.config.pos) - this.config.size;

    const maxDetailLevel = 5;

    /*
      Let's do some math again

      We have a distance d to the planet's core

      when we are far away we want no details, = 1
      when we are close we want lot's of details, = 7

      Sooo let's try linear approach

      y = - x*dx + 7

      when x = 0 we are at 7
      and when x grows y is lower

      when dx is bigger it is steeper and y goes negative quicker, which means less planets with good resolution
    */

    /**
     
      Did not work well, let's try exponential
      Exponential worked a lot better

     */
    const dx = 0.0001;
    const y = - Math.pow(d, 2) * dx + maxDetailLevel;

    const res = Math.round(Math.max(Math.min(y,  maxDetailLevel), 1));
    this.setRes(res);
  }
}