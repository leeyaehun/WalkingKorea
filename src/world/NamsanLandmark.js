/**
 * Bukchon weather / skyline phase 02 — Namsan's landform and N Seoul Tower.
 *
 * Reference: a wooded, uneven Namsan ridgeline topped by the slender
 * off-white tower, an overhanging circular observation deck and a thin
 * red/white broadcast mast. Stylized perspective, not surveyed terrain.
 *
 * Reuses the existing colour-atlas, face, box, and shared world mesh.
 * No spheres, textures, external models, plants within the village, or
 * extra Three.js draw calls.
 */
export const NAMSAN_TOWER={x:17,z:158};
export const NAMSAN_X_EXTENT=108;
export const NAMSAN_SLOPE_Z=[124,136,149,160,170,181];
export const NAMSAN_TOP_OFFSET=64; // model height above the summit

const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

export function namsanRidgeHeight(x) {
  const hill=22*Math.exp(-Math.pow((x-NAMSAN_TOWER.x)/67,2));
  const shoulder=8.0+1.45*Math.sin(x*.092)+.82*Math.sin(x*.231);
  return shoulder+hill;
}
export function namsanSurfaceHeight(x,z) {
  // A broad gently folded hill, low at the skyline's near/far boundaries.
  const ridge=namsanRidgeHeight(x);
  const profiles=[.13,.39,.78,1,.84,.22];
  const stations=NAMSAN_SLOPE_Z;
  if(z<=stations[0]||z>=stations[stations.length-1])return 2+(ridge-2)*(z<=stations[0]?profiles[0]:profiles[profiles.length-1]);
  let i=0;
  while(i<stations.length-2&&z>stations[i+1])i++;
  const t=(z-stations[i])/(stations[i+1]-stations[i]);
  const weight=profiles[i]+(profiles[i+1]-profiles[i])*t;
  return 2+(ridge-2)*weight;
}

export function buildNamsanLandmark({face,box,rod}) {
  let terrainFaces=0,towerFaces=0;
  const ridgeSamples=[];
  const xStart=-NAMSAN_X_EXTENT,xEnd=NAMSAN_X_EXTENT;
  const slices=44;
  // A single contoured highland — no lumpy intersecting green spheres.
  // Minor blue-grey / olive mineral shifts are deterministic across faces.
  for(let xi=0;xi<slices;xi++){
    const x0=xStart+(xEnd-xStart)*xi/slices;
    const x1=xStart+(xEnd-xStart)*(xi+1)/slices;
    for(let j=0;j<NAMSAN_SLOPE_Z.length-1;j++){
      const z0=NAMSAN_SLOPE_Z[j],z1=NAMSAN_SLOPE_Z[j+1];
      const v=(x,z)=>[x,namsanSurfaceHeight(x,z),z];
      const a=v(x0,z0),b=v(x1,z0),c=v(x1,z1),d=v(x0,z1);
      const variation=(xi*7+j*13)%11;
      const tone=j===0?'namsanShade':variation<2?'namsanPine':variation<7?'namsanForest':'namsanOlive';
      face(a,b,c,d,[0,1,0],tone);
      terrainFaces++;
    }
    const x=(x0+x1)/2;
    ridgeSamples.push({x,height:namsanRidgeHeight(x)});
  }
  // Sparse low-poly canopy-like ridgelines painted as faceted bands into
  // the mountainside itself. Not independent fake roadside trees.
  for(let row=0;row<2;row++){
    const z=149+row*10;
    for(let i=0;i<42;i++){
      const x0=xStart+i*(xEnd-xStart)/42;
      const x1=xStart+(i+1)*(xEnd-xStart)/42;
      const m=(x0+x1)*.5;
      const y0=namsanSurfaceHeight(x0,z)+.22;
      const y1=namsanSurfaceHeight(x1,z)+.22;
      const ym=namsanSurfaceHeight(m,z)+.65+.33*Math.sin(i*2.15+row);
      const color=(i+row)%4===0?'namsanCanopy':'namsanPine';
      face([x0,y0,z],[m,ym,z],[x1,y1,z],[x1,y1,z],[0,.3,-1],color);
      terrainFaces++;
    }
  }

  const {x:tx,z:tz}=NAMSAN_TOWER;
  // Tower summit placed on the modelled crest, not an independent green ball.
  const summit=namsanSurfaceHeight(tx,160);
  // Deliberate radial surface: use enough facets for a circular deck even
  // from the lookout, while preserving one shared geometry/draw call.
  function ringBand(y0,y1,r0,r1,color,segments=16,phase=0){
    for(let i=0;i<segments;i++){
      const a=phase+i*Math.PI*2/segments;
      const b=phase+(i+1)*Math.PI*2/segments;
      const p=(y,r,t)=>[tx+r*Math.cos(t),y,tz+r*Math.sin(t)];
      face(p(y0,r0,a),p(y0,r0,b),p(y1,r1,b),p(y1,r1,a),
        [Math.cos((a+b)*.5),0,Math.sin((a+b)*.5)],color);
      towerFaces++;
    }
  }
  // Concrete hilltop plinth and low service structure.
  const y=summit;
  box(tx,y+.50,tz,11.2,1.0,8.5,'towerStone');
  box(tx-4.8,y+1.9,tz+1.3,4.2,2.5,4.7,'towerConcrete');
  box(tx+4.6,y+1.72,tz+2.0,4.2,2.3,3.7,'towerStone');

  // White tapered central column: tall uninterrupted shaft with joint bands.
  const level=y+1;
  ringBand(level,level+2.1,2.24,1.92,'towerConcrete');
  ringBand(level+2.1,level+15,1.92,1.57,'towerIvory');
  ringBand(level+15,level+30.3,1.57,1.46,'towerIvory');
  ringBand(level+30.3,level+32.2,1.46,1.55,'towerConcrete');
  // A little surface ribbing at a few long intervals emphasizes engineering.
  for(const offset of [7.5,15.6,23.5,29.8])ringBand(level+offset,level+offset+.17,1.63,1.63,'towerStone',12);

  // The observation deck must be visible as a broad, flattened cylinder,
  // not a thick round drum: narrow dark glass strip between white metal trim.
  ringBand(level+32.2,level+34.0,1.55,4.15,'towerConcrete');
  ringBand(level+34.0,level+35.2,4.15,4.72,'towerIvory');
  ringBand(level+35.2,level+35.9,4.72,5.00,'towerTrim');
  ringBand(level+35.9,level+40.0,5.00,5.00,'towerGlass');
  ringBand(level+40.0,level+40.65,5.00,4.84,'towerTrim');
  ringBand(level+40.65,level+42.1,4.84,3.28,'towerConcrete');
  ringBand(level+42.1,level+43.2,3.28,2.35,'towerIvory');

  // Vertical frames/glazing divisions; the segmented observation chamber
  // reads as windows from the street rather than a featureless blue ring.
  const mullions=18;
  for(let i=0;i<mullions;i++){
    const a=i*2*Math.PI/mullions;
    const x=tx+5.005*Math.cos(a),z=tz+5.005*Math.sin(a);
    // A square-section mullion box is small enough to remain distant.
    box(x,level+37.95,z,.075,4.12,.075,'towerSilver');
  }

  // Broadcast antenna's lightweight stepped white/red metal spire.
  const mast=level+43.2;
  ringBand(mast,mast+7,1.32,.97,'towerIvory',12);
  ringBand(mast+7,mast+13,.97,.68,'towerSilver',12);
  ringBand(mast+13,mast+17.2,.68,.55,'towerRed',10);
  ringBand(mast+17.2,mast+20.5,.55,.36,'towerIvory',10);
  ringBand(mast+20.5,mast+24.2,.36,.26,'towerRed',8);
  ringBand(mast+24.2,mast+27.6,.26,.12,'towerIvory',8);
  // Three broadcast collar rings make a readable fine top profile.
  for(const offset of [10.1,16.6,22.2]){
    ringBand(mast+offset,mast+offset+.26,.82,.76,'towerSilver',10);
  }
  // A shorter additional communications mast on the right skyline.
  const mx=tx+24, mz=tz+3, ground=namsanSurfaceHeight(mx,mz);
  box(mx,ground+8.0,mz,.30,16,.30,'towerSilver');
  box(mx,ground+16.75,mz,.75,1.4,.75,'towerRed');
  for(let k=0;k<3;k++)box(mx,ground+5+k*4.0,mz,.92,.12,.92,'towerStone');

  return {
    terrainFaces,towerFaces,
    summit,topY:mast+27.6,
    tower:{x:tx,z:tz},
    ridgeSamples
  };
}
