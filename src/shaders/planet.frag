#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>


struct ColorConfig
{
  vec3 color;
  float area;
  float offset;
  float smoothness;
};

const int ColorConfigElements = 5;

uniform ColorConfig colorConfig[ColorConfigElements];
uniform vec3 baseColor;
uniform vec3 pos;
uniform float size;
varying vec3 vPos;

vec3 getColor() {

  float distanceFromCenter = length(vPos - pos);
  float diffFromNormal = distanceFromCenter - 2. * size;

  float normalisedDiff = diffFromNormal;

  vec3 color;

  color = vec3(baseColor) * 0.3;
  for(int i = 0; i < ColorConfigElements; i++) {
    color += 
      clamp(colorConfig[i].color * clamp(colorConfig[i].area - pow(normalisedDiff - colorConfig[i].offset, 2. * colorConfig[i].smoothness), 0., 1.), 0., 1.);
  }
  
  return clamp(color, 0., 1.);
}



void main() {
  #include <clipping_planes_fragment>

  vec4 diffuseColor = vec4( diffuse, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive;
  #include <logdepthbuf_fragment>
  #include <map_fragment>
  #include <color_fragment>
  #include <alphamap_fragment>
  #include <alphatest_fragment>
  #include <specularmap_fragment>
  #include <normal_fragment_begin>
  #include <normal_fragment_maps>
  #include <emissivemap_fragment>
  #include <lights_phong_fragment>
  #include <lights_fragment_begin>
  #include <lights_fragment_maps>
  #include <lights_fragment_end>
  #include <aomap_fragment>
  vec3 outgoingLight = vec3(0., 0.5, 1.0) + reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
  #include <envmap_fragment>

  vec3 color = getColor();

  gl_FragColor = vec4( color * outgoingLight, diffuseColor.a );

  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
  #include <premultiplied_alpha_fragment>
  #include <dithering_fragment>
}
