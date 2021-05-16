import { Planet, PlanetConfig } from './Planet';
import { Group, Vector3, MeshPhongMaterial, Camera, PointLight, UniformsLib, ShaderMaterial, ShaderLib } from 'three';
import { GenerationConfig } from './Icosphere';

import planetVert from 'raw-loader!./shaders/planet.vert';
import planetFrag from 'raw-loader!./shaders/planet.frag';

type ColorMaterialConfig = {
  color: Vector3;
  area: number;
  offset: number;
  smoothness: number;
}

export class PlanetSystem extends Group {

  // Config
  areaSize = 200;
  planetSize = 10;
  
  planets: Planet[] = [];

  material = new MeshPhongMaterial( { color: 0x00ff0a } );
  sunMaterial = new MeshPhongMaterial( { color: 0xffa000, emissive: 0xff0000, emissiveIntensity: 1 } );

  // Default sun config
  sunConfig = {
    material: this.sunMaterial,
    size: Math.random()*this.planetSize*2,
  }

  // Shaders modified because of raw-loader from webpack combined with typescript 
  vShader = planetVert.substr(16, planetVert.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  fShader = planetFrag.substr(16, planetFrag.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n");

  constructor(numberOfPlanets: number = 20) {
    super();

    for(let n = 0; n < numberOfPlanets; n++) {
      // A small chanse for making a sun
      if (Math.random() < 0.2) { // Make a sun

        const config = {...this.getRandomPlanetConfig(), ...this.sunConfig };
        const sun = new Planet(this, config)
        const light = new PointLight(0xffffff, 1, 200, 1);
        light.position.set(config.pos.x, config.pos.y, config.pos.z);
        sun.add(light)
        this.planets.push(sun);
        
      } else {
        this.planets.push(this.getRandomPlanet());
      }
    }
  }

  /**
   * Update all children
   * @param camera 
   */
  update(camera: Camera) {
    this.planets.forEach(p => p.update(camera));
  }


  getRandomPlanet(): Planet {
    const config = this.getRandomPlanetConfig();

    let colorPatternConfig: (ColorMaterialConfig | 0)[] = [];
    colorPatternConfig.length = 5;
    colorPatternConfig.fill(0);
    colorPatternConfig = colorPatternConfig.map(this.getRandomColorConfig)

    const material = new ShaderMaterial( {
      uniforms: {
        pos: { value: config.pos },
        size: { value: config.size },
        colorConfig: { value: colorPatternConfig },
        baseColor: { value: config.color },
        ...UniformsLib['lights'],
        ...ShaderLib.phong.uniforms,
      },
      vertexShader: this.vShader,
      fragmentShader: this.fShader,
      lights: true,
    } as any);

    return new Planet(this, {
      material,
      ...config
    });
  }

  getRandomPlanetConfig(): PlanetConfig {
    return {
      pos: new Vector3(Math.random()*this.areaSize-this.areaSize/2, Math.random()*this.areaSize-this.areaSize/2, Math.random()*this.areaSize-this.areaSize/2),
      size: 2+Math.random()*this.planetSize,
      color: new Vector3(Math.random(),Math.random(),Math.random()),
      generationConfig: this.getRandomGenerationConfig(),
    };
  }

  getRandomGenerationConfig(): GenerationConfig {
    return {
      amplitudeMultiplier: Math.random() * 3,
      numberOfIterations: Math.round(Math.random() * 15),
      noisemultiplier: Math.random() * 3,
      amplitudeChangeForEachLayer: Math.random() * 3,
      noiseChangeForEachLayer: Math.random() * 6,
    }
  }

  getRandomColorConfig(): ColorMaterialConfig {
    return {
      area: 1 + Math.random() * 20,
      color: new Vector3(Math.random(),Math.random(),Math.random()),
      offset: Math.random()*10 - 5,
      smoothness: .5 + Math.random()*0.01,
    }
  }
}