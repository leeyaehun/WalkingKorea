import * as THREE from 'three';

/**
 * Weather direction 01 — a clear, crisp Bukchon daytime sky.
 *
 * Purposefully *only* replaces sky and daytime aerial perspective.
 * The old night-sky palette is retained by multiplying its original warm
 * horizon / cool zenith with the original night tint.
 *
 * A few subtle feathered cloud wisps are drawn in the sky shader itself:
 * no giant low-poly white spheres, textures or additional draw calls.
 * Everything follows the camera without parallax seams at the world edge.
 */
export const SKY_DAY_PALETTE = Object.freeze({
  horizon: 0xd4e9f6,
  middle: 0x91c9ef,
  zenith: 0x4e9bdc,
});
export const SKY_NIGHT_TINT = 0x34415c;
export const SKY_FOG_DAY = Object.freeze([0.72, 0.82, 0.90]);
export const SKY_FOG_NIGHT = Object.freeze([0.31, 0.37, 0.45]);

const skyVertexShader = `
  varying vec3 vSkyDirection;
  void main() {
    vSkyDirection=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;

export const skyFragmentShader = `
  precision highp float;
  uniform vec3 uDayHorizon;
  uniform vec3 uDayMiddle;
  uniform vec3 uDayZenith;
  uniform vec3 uNightHorizon;
  uniform vec3 uNightZenith;
  uniform float uNight;
  varying vec3 vSkyDirection;

  // One soft elongated band, not a hard edged cotton-ball sphere.
  float cloudWisp(vec2 p,vec2 centre,vec2 radius) {
    vec2 d=(p-centre)/radius;
    float grain=.13*sin(p.x*32.0+p.y*11.0)
               +.09*sin(p.x*61.0-p.y*17.0);
    float shape=length(d)+grain;
    return 1.0-smoothstep(.55,1.50,shape);
  }
  void main() {
    vec3 dir=normalize(vSkyDirection);
    float elev=clamp(dir.y,-.10,1.0);
    // True daytime blue: pale blue horizon -> clear blue zenith, no pink.
    vec3 daylight=mix(uDayHorizon,uDayMiddle,smoothstep(-.08,.38,elev));
    daylight=mix(daylight,uDayZenith,smoothstep(.26,.96,elev));

    // Five widely separated *subtle* cloud wisps. The broad majority of
    // the dome remains completely clear; no photo texture is needed.
    vec2 p=vec2(atan(dir.x,dir.z),elev);
    float cloud=0.0;
    cloud+=cloudWisp(p,vec2(-1.94,.40),vec2(.30,.105));
    cloud+=cloudWisp(p,vec2(-.95,.22),vec2(.22,.075));
    cloud+=cloudWisp(p,vec2(-.12,.57),vec2(.37,.092));
    cloud+=cloudWisp(p,vec2(.88,.36),vec2(.24,.080));
    cloud+=cloudWisp(p,vec2(2.05,.18),vec2(.32,.070));
    cloud=clamp(cloud*.45,0.0,.44);
    vec3 airyWhite=vec3(.96,.98,1.0);
    daylight=mix(daylight,airyWhite,cloud);

    // Match the previous night sky's color/tint so its planned redesign
    // remains a separate weather step 04, not an accidental side effect.
    float legacyHeight=clamp((dir.y+.12)/.85,0.0,1.0);
    vec3 nightSky=mix(uNightHorizon,uNightZenith,legacyHeight);
    gl_FragColor=vec4(mix(daylight,nightSky,clamp(uNight,0.0,1.0)),1.0);
  }
`;

export function createBukchonSky(scene) {
  const tint=new THREE.Color(SKY_NIGHT_TINT);
  const oldNightHorizon=new THREE.Color(0xe6bda8).multiply(tint);
  const oldNightZenith=new THREE.Color(0x9cb7dd).multiply(tint);
  const material=new THREE.ShaderMaterial({
    uniforms: {
      uDayHorizon:{value:new THREE.Color(SKY_DAY_PALETTE.horizon)},
      uDayMiddle:{value:new THREE.Color(SKY_DAY_PALETTE.middle)},
      uDayZenith:{value:new THREE.Color(SKY_DAY_PALETTE.zenith)},
      uNightHorizon:{value:oldNightHorizon},
      uNightZenith:{value:oldNightZenith},
      uNight:{value:0},
    },
    vertexShader:skyVertexShader,
    fragmentShader:skyFragmentShader,
    side:THREE.BackSide,
    depthWrite:false,
    depthTest:false,
    fog:false,
  });
  // Stay inside camera.far=240 and encompass existing city skyline.
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(207,36,22),material);
  mesh.frustumCulled=false;
  mesh.renderOrder=-1000;
  scene.add(mesh);
  return {
    mesh,
    update(camera,night=false) {
      mesh.position.copy(camera.position);
      material.uniforms.uNight.value=night?1:0;
    },
  };
}
