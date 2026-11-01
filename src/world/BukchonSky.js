import * as THREE from 'three';

/**
 * Weather step 04 — actual night atmosphere, not merely a darkened day sky.
 * Reuses the single camera-following sky dome / shader. A thin, softly
 * illuminated moon, discreet deterministic stars and muted Seoul horizon
 * glow provide nighttime depth without adding real street lights (step 05).
 */
export const SKY_DAY_PALETTE=Object.freeze({
  horizon:0xd4e9f6,
  middle:0x91c9ef,
  zenith:0x4e9bdc
});
export const SKY_NIGHT_PALETTE=Object.freeze({
  horizon:0x263b59,   // distant city / atmospheric light
  middle:0x142a4c,    // clear navy-blue upper air
  zenith:0x09172f,    // deep midnight blue
  moon:0xf2eedc
});
export const SKY_FOG_DAY=Object.freeze([.72,.82,.90]);
export const SKY_FOG_NIGHT=Object.freeze([.14,.20,.30]);
export const MOON_DIRECTION=Object.freeze([-.33,.62,.71]);
export const NIGHT_STAR_CELL_COUNT=Object.freeze([92,32]);

const skyVertexShader=`
  varying vec3 vSkyDirection;
  void main() {
    vSkyDirection=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;

export const skyFragmentShader=`
  precision highp float;
  uniform vec3 uDayHorizon;
  uniform vec3 uDayMiddle;
  uniform vec3 uDayZenith;
  uniform vec3 uNightHorizon;
  uniform vec3 uNightMiddle;
  uniform vec3 uNightZenith;
  uniform vec3 uMoonColor;
  uniform vec3 uMoonDirection;
  uniform float uNight;
  varying vec3 vSkyDirection;

  float skyHash(vec2 p) {
    return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
  }

  // A sparse soft day cloud wisp, retained unchanged from weather step 01.
  float cloudWisp(vec2 p,vec2 centre,vec2 radius) {
    vec2 d=(p-centre)/radius;
    float grain=.13*sin(p.x*32.0+p.y*11.0)
               +.09*sin(p.x*61.0-p.y*17.0);
    return 1.0-smoothstep(.55,1.50,length(d)+grain);
  }

  float distantStars(vec2 p,float elevation) {
    // Stars are stable on the celestial dome as the camera moves. A wide,
    // fixed longitude/elevation grid creates a few fine points, not a noisy
    // overlay, while atmospheric light pollution fades them at the horizon.
    vec2 tile=p*vec2(92.0,32.0);
    vec2 cell=floor(tile);
    vec2 local=fract(tile);
    float seed=skyHash(cell);
    float alive=step(.971,seed);
    vec2 centre=vec2(.18+.64*skyHash(cell+2.7),
                     .20+.60*skyHash(cell+9.1));
    float size=mix(.018,.045,skyHash(cell+5.7));
    float distanceToStar=length((local-centre)*vec2(1.0,1.25));
    float star=(1.0-smoothstep(size,size+.025,distanceToStar))*alive;
    float darkSky=smoothstep(.12,.43,elevation);
    return star*darkSky*(.34+.44*skyHash(cell+13.7));
  }

  void main() {
    vec3 dir=normalize(vSkyDirection);
    float elev=clamp(dir.y,-.10,1.0);
    vec2 p=vec2(atan(dir.x,dir.z),elev);

    // Weather step 01 daytime colors and gentle clouds: unchanged.
    vec3 daylight=mix(uDayHorizon,uDayMiddle,smoothstep(-.08,.38,elev));
    daylight=mix(daylight,uDayZenith,smoothstep(.26,.96,elev));
    float cloud=0.0;
    cloud+=cloudWisp(p,vec2(-1.94,.40),vec2(.30,.105));
    cloud+=cloudWisp(p,vec2(-.95,.22),vec2(.22,.075));
    cloud+=cloudWisp(p,vec2(-.12,.57),vec2(.37,.092));
    cloud+=cloudWisp(p,vec2(.88,.36),vec2(.24,.080));
    cloud+=cloudWisp(p,vec2(2.05,.18),vec2(.32,.070));
    cloud=clamp(cloud*.45,0.0,.44);
    daylight=mix(daylight,vec3(.96,.98,1.0),cloud);

    // Three-tone midnight: clear near-black blue overhead, a gentle haze
    // above Seoul's roofs and a very restrained warm city-horizon glow.
    vec3 nightSky=mix(uNightHorizon,uNightMiddle,smoothstep(-.07,.38,elev));
    nightSky=mix(nightSky,uNightZenith,smoothstep(.24,.94,elev));
    float horizonGlow=(1.0-smoothstep(.02,.35,elev))*.13;
    nightSky+=vec3(.082,.058,.039)*horizonGlow;

    // Clean moon drawn in ANGULAR SPACE, avoiding a near white local mesh.
    // A smaller dark offset circle masks the disc into a readable crescent.
    float angularDistance=acos(clamp(dot(dir,normalize(uMoonDirection)),-1.0,1.0));
    float moonDisc=1.0-smoothstep(.032,.037,angularDistance);
    vec3 moonOffset=normalize(uMoonDirection+vec3(.016,-.004,.0));
    float cutDistance=acos(clamp(dot(dir,moonOffset),-1.0,1.0));
    float cut=1.0-smoothstep(.029,.036,cutDistance);
    float crescent=moonDisc*(1.0-cut);
    float moonHalo=exp(-pow(angularDistance/.19,2.0))*0.19;
    nightSky+=uMoonColor*moonHalo;
    nightSky=mix(nightSky,uMoonColor,crescent*.94);
    float star=distantStars(p,elev);
    // A moonlit night remains sparsely starred and clouds don't turn white.
    nightSky+=vec3(.71,.81,1.0)*star*(1.0-moonHalo);

    gl_FragColor=vec4(mix(daylight,nightSky,clamp(uNight,0.0,1.0)),1.0);
  }
`;

export function createBukchonSky(scene) {
  const material=new THREE.ShaderMaterial({
    uniforms:{
      uDayHorizon:{value:new THREE.Color(SKY_DAY_PALETTE.horizon)},
      uDayMiddle:{value:new THREE.Color(SKY_DAY_PALETTE.middle)},
      uDayZenith:{value:new THREE.Color(SKY_DAY_PALETTE.zenith)},
      uNightHorizon:{value:new THREE.Color(SKY_NIGHT_PALETTE.horizon)},
      uNightMiddle:{value:new THREE.Color(SKY_NIGHT_PALETTE.middle)},
      uNightZenith:{value:new THREE.Color(SKY_NIGHT_PALETTE.zenith)},
      uMoonColor:{value:new THREE.Color(SKY_NIGHT_PALETTE.moon)},
      uMoonDirection:{value:new THREE.Vector3(...MOON_DIRECTION).normalize()},
      uNight:{value:0}
    },
    vertexShader:skyVertexShader,
    fragmentShader:skyFragmentShader,
    side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false
  });
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(207,36,22),material);
  mesh.frustumCulled=false;
  mesh.renderOrder=-1000;
  scene.add(mesh);
  return {
    mesh,
    update(camera,night=false){
      mesh.position.copy(camera.position);
      material.uniforms.uNight.value=night?1:0;
    }
  };
}
