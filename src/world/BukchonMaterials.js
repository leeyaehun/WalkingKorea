/**
 * Bukchon material language — Phase 03.
 *
 * Deterministic procedural SURFACE textures, evaluated in the existing
 * one-draw-call GLSL shader. No external image assets, extra meshes, or
 * per-house materials. Phase 04 will address lights and cast shadows.
 *
 * Material IDs and their local, meter-based UVs are vertex attributes.
 * The site retains the original sign/label atlas and vertex palette.
 */
export const MATERIAL={
  plain:0,giwa:1,wood:2,plaster:3,granite:4,brick:5,asphalt:6,paper:7
};

export function surfaceMaterialId(key) {
  if (typeof key !== 'string') return MATERIAL.plain;
  if (key.startsWith('tile') || key==='roof')return MATERIAL.giwa;
  if (['timber','timberLight','woodShade','gateWood','brown','shopDark'].includes(key))
    return MATERIAL.wood;
  if (['plaster','offwhite','cream','beige','mortar'].includes(key))return MATERIAL.plaster;
  if (key.startsWith('stone')||key.startsWith('edgeStone')||
      key.startsWith('pave')||key.startsWith('drain'))return MATERIAL.granite;
  if (key.startsWith('brick'))return MATERIAL.brick;
  if (['asphalt','asphaltPatch','road','street'].includes(key))return MATERIAL.asphalt;
  if (key==='paper')return MATERIAL.paper;
  return MATERIAL.plain;
}

/** Project to the face's dominant plane BEFORE transforming to world space.
 * This keeps pattern scale consistent between rotated houses. For roof
 * planes, (local x, local z) is the natural course direction; wall
 * faces use height as the second axis. */
export function surfaceCoordinates(point, normal) {
  const [x,y,z]=point;
  const [nx,ny,nz]=normal.map(Math.abs);
  if (ny>=nx && ny>=nz)return [x,z];
  if (nz>=nx)return [x,y];
  return [z,y];
}

export const MATERIAL_GLSL = `
  float matHash(vec2 p) {
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
  }
  float matNoise(vec2 p) {
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(matHash(i),matHash(i+vec2(1.,0.)),f.x),
               mix(matHash(i+vec2(0.,1.)),matHash(i+vec2(1.,1.)),f.x),f.y);
  }
  // RGB multiplier, close to one: base palette remains art-directable.
  // Patterns are continuous by local coordinates instead of starting
  // over with each one of the thousands of small brick/tile polygons.
  vec3 bukchonMaterial(vec2 uv,float id) {
    if(id<.5)return vec3(1.);
    float coarse=matNoise(uv*3.2);
    float detailFade=1.0-smoothstep(17.0,75.0,vDistance);
    if(id<1.5) {
      // Aged charcoal giwa: gentle slate mineral shifts, patina and
      // narrow convex glaze streaks, not painted checkerboard tiles.
      float slate=matNoise(uv*vec2(8.,5.));
      float streak=.5+.5*sin(uv.x*42.+coarse*2.8);
      float aging=matNoise(uv*vec2(1.9,2.6));
      float shade=.82+.24*slate+.060*streak*detailFade+.07*(aging-.5);
      return vec3(shade*.97,shade,shade*1.02);
    }
    if(id<2.5) {
      // Warm wood with following long grain: warped growth lines,
      // dark resin fibres and subtle rough edges.
      float warp=matNoise(uv*vec2(1.5,1.8));
      float grain=.5+.5*sin(uv.x*48.+warp*5.8);
      float fibres=matNoise(uv*vec2(26.,2.3));
      float shade=.86+.13*grain*detailFade+.10*fibres*detailFade+.11*(coarse-.5);
      return vec3(shade*1.05,shade*.98,shade*.88);
    }
    if(id<3.5) {
      // Lime plaster: warm ground mineral dust and barely visible
      // trowel variation, rather than an immaculate flat white.
      float trowel=matNoise(uv*vec2(1.15,2.7));
      float sand=matNoise(uv*vec2(39.,33.));
      float shade=.94+.065*trowel+.055*(sand-.5)*detailFade;
      return vec3(shade*1.015,shade,shade*.965);
    }
    if(id<4.5) {
      // Granite and cut paving: cold salt-and-pepper aggregate,
      // soft erosion across the cut stone faces.
      float mineral=matNoise(uv*vec2(36.,39.));
      float fleck=step(.87,matHash(floor(uv*91.)));
      float shade=.88+.17*mineral*detailFade+.07*(coarse-.5)-.10*fleck*detailFade;
      return vec3(shade*.99,shade,shade*1.015);
    }
    if(id<5.5) {
      // Fired clay brick: porous grain, slight fired colour patchiness.
      float pores=matNoise(uv*vec2(47.,38.));
      float burn=matNoise(uv*vec2(4.2,2.8));
      float shade=.88+.15*pores*detailFade+.08*burn;
      return vec3(shade*1.06,shade*.96,shade*.91);
    }
    if(id<6.5) {
      // Fine dark bitumen / asphalt aggregate, no obvious grid.
      float chips=matNoise(uv*vec2(70.,77.));
      float wear=matNoise(uv*vec2(2.1,3.1));
      float shade=.91+.12*chips*detailFade+.07*(wear-.5);
      return vec3(shade);
    }
    // Hanji paper fibres: nearly uniform, translucent warmth is a
    // later lighting/material-transmission task.
    float paper=matNoise(uv*vec2(26.,41.));
    float shade=.985+.02*paper*detailFade;
    return vec3(shade*1.01,shade,shade*.96);
  }
`;
