import { createHanokKit } from './HanokKit.js';
import {isFiveGyeongHeroSite,buildFiveGyeongReferenceHanok} from './BukchonFiveGyeongHanok.js';
import {FIVE_GYEONG_APPROACH_WALL,buildFiveGyeongApproach} from './BukchonFiveGyeongApproach.js';
import { buildPavedAlleys } from './BukchonPaving.js';
import {mainLaneWidth,mainLaneTerrainHeight,smoothMainLane,scenicHouseSites,sampleMainLaneAtZ} from './BukchonStreetLayout.js';
import {MAIN_STREET_ROUTE} from './BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE,SEVENTH_LOOP_SAMPLES,SEVENTH_JOIN,buildSeventhLoopWalls} from './BukchonSeventhLoop.js';
import {buildSeventhPhotoEnvironment} from './BukchonSeventhViewpoint.js';
import {planSeventhHanokSites,buildSeventhHanoks} from './BukchonSeventhBuildings.js';
import {planSeventhInfill,buildSeventhInfill} from './BukchonSeventhInfill.js';
import {buildFrontageConnectors} from './BukchonFrontage.js';
import {buildContinuousFrontages} from './BukchonContinuousFrontage.js';
import {buildBukchonStreetLife} from './BukchonStreetLife.js';
import {buildNamsanLandmark} from './NamsanLandmark.js';
import {buildSeoulSkyline} from './SeoulSkyline.js';
import {buildBukchonNightFixtures,nightEmissionClass} from './BukchonNightLighting.js';
import * as THREE from 'three';
import {surfaceMaterialId,surfaceCoordinates,MATERIAL_GLSL} from './BukchonMaterials.js';

// Procedural Bukchon lanes and approved Hanok Set v1 geometry in a Three.js BufferGeometry.
// This keeps existing lane and hanok shapes intact while allowing later migration to separate meshes.
export function createBukchonWorld() {
const TAU=Math.PI*2, clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const rand=(a,b)=>{seed=(seed*1664525+1013904223)>>>0;return a+(seed/4294967296)*(b-a);};
let seed=94826;
const C = {
  cream:[.91,.85,.75], offwhite:[.97,.91,.82], white:[.99,.97,.90], beige:[.83,.75,.63],
  muted:[.73,.68,.60], pink:[.88,.60,.54], orange:[.90,.54,.38], palePink:[.97,.79,.71],
  sage:[.56,.68,.56], deepGreen:[.28,.41,.36], green:[.44,.55,.42], dark:[.28,.34,.34],
  blue:[.56,.71,.75], dustyBlue:[.46,.61,.69], roof:[.35,.41,.46], street:[.53,.55,.53],
  road:[.48,.51,.50], sidewalk:[.81,.78,.69], yellow:[.97,.81,.49], brown:[.57,.46,.36],
  brick:[.67,.44,.39], lilac:[.70,.65,.76], shadow:[.43,.44,.42], teal:[.31,.59,.59],
  tileDark:[.30,.34,.39], tileBase:[.36,.40,.45], tileLight:[.50,.54,.57], tileRidge:[.25,.28,.33],
  // Four realistic weathered giwa tones, not bright fantasy roof colours.
  tileIndigo:[.29,.32,.35], tileIndigoLight:[.37,.40,.42],
  tileJade:[.32,.35,.34], tileJadeLight:[.41,.43,.42],
  tileInk:[.24,.27,.29], tileInkLight:[.36,.38,.40],
  tilePlum:[.35,.32,.32], tilePlumLight:[.44,.39,.39],
  flowerCoral:[.93,.59,.53], flowerYellow:[.98,.81,.49], flowerLilac:[.76,.68,.84],
  timber:[.49,.32,.22], timberLight:[.65,.44,.30], woodShade:[.30,.22,.18], plaster:[.94,.89,.82], paper:[.98,.95,.87],
  stoneFoundation:[.70,.68,.65], stoneLight:[.85,.83,.79], gateWood:[.46,.29,.19], copper:[.68,.54,.40],
  mortar:[.91,.87,.80], stoneMasonry:[.77,.76,.73], stoneWarm:[.84,.79,.73], stoneGrey:[.63,.65,.64],
  brickTerracotta:[.66,.34,.27], brickWarm:[.75,.41,.31], brickDark:[.55,.30,.27],
  tileEnd:[.40,.42,.43],
  shopDark:[.28,.29,.25], warmGlass:[.71,.57,.41], warmLight:[.92,.72,.44],
  asphalt:[.37,.40,.41], asphaltPatch:[.41,.43,.43],
  paveGrout:[.70,.69,.66],paveJoint:[.77,.76,.72],
  paveWarm:[.91,.80,.68],paveCream:[.96,.87,.76],
  paveSand:[.88,.77,.66],paveLight:[.98,.89,.79],
  paveStone:[.86,.77,.70],paveHoney:[.92,.81,.68],
  pavePatch:[.83,.77,.71],paveMossStone:[.79,.77,.72],
  edgeStone:[.84,.77,.67],edgeStoneLight:[.90,.83,.73],
  drainIron:[.50,.47,.43],drainGrill:[.69,.64,.56],
  // Distant Namsan is a continuous faceted forest ridge, not round shrubs.
  namsanForest:[.31,.43,.37],namsanPine:[.23,.35,.31],
  namsanOlive:[.42,.49,.40],namsanCanopy:[.35,.46,.39],
  namsanShade:[.33,.40,.35],
  // Pale ivory tower shaft, deep-blue observatory glazing, metallic bands,
  // restrained red/white antenna, distinct from local hanok materials.
  towerIvory:[.91,.94,.92],towerConcrete:[.73,.79,.80],
  towerStone:[.65,.72,.73],towerTrim:[.84,.89,.91],
  towerGlass:[.20,.39,.48],towerSilver:[.65,.72,.76],
  towerRed:[.75,.29,.27],
  // Seoul's distant residential and office layers: quiet blue-grey
  // concrete, ochre limestone, and desaturated balcony/sill materials.
  cityConcreteA:[.75,.80,.80],cityShadowA:[.63,.69,.72],cityTrimA:[.84,.86,.84],
  cityConcreteB:[.83,.81,.77],cityShadowB:[.70,.68,.64],cityTrimB:[.92,.88,.81],
  cityConcreteC:[.71,.76,.80],cityShadowC:[.57,.65,.70],cityTrimC:[.83,.87,.89],
  cityPodium:[.61,.65,.66],cityParapet:[.80,.83,.82],
  cityRoofHouse:[.75,.78,.77],cityUtility:[.63,.69,.71],
  cityWindowFrame:[.78,.81,.82],cityStairwell:[.65,.69,.72],
  cityBalconySlab:[.81,.82,.80],cityBalconyRail:[.66,.71,.73],
  cityGlassBlue:[.37,.50,.59],cityGlassPale:[.54,.64,.70],
  cityGlassWarm:[.65,.65,.61],
  cityLitWindowWarm:[.65,.65,.61],cityLitWindowCool:[.54,.64,.70],
  hanokPaperWindow:[.98,.95,.87],lampGlobe:[.93,.77,.54]
};
const color=(v)=>Array.isArray(v)?v:C[v]||C.white;
const positions=[],normals=[],uvs=[],colors=[],materialIds=[],surfaceUVs=[],contactAO=[],nightEmission=[];
const atlasSize=2048,atlas=document.createElement('canvas');atlas.width=atlas.height=atlasSize;
const ctx=atlas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,atlasSize,atlasSize);
let tileX=4,tileY=4,rowH=0;
function tile(text,bg,fg,options={}){
  const w=options.w||320,h=options.h||108;
  if(tileX+w+4>atlasSize){tileX=4;tileY+=rowH+4;rowH=0;}
  if(tileY+h+4>atlasSize) throw new Error('Atlas full');
  const x=tileX,y=tileY;tileX+=w+4;rowH=Math.max(rowH,h);
  ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
  if(options.border){ctx.strokeStyle=options.border;ctx.lineWidth=6;ctx.strokeRect(x+4,y+4,w-8,h-8);}
  if(options.stripe){ctx.fillStyle=options.stripe;ctx.fillRect(x,y,w,12);}
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`${options.bold===false?'500':'bold'} ${options.size||48}px 'NanumSquare','Arial',sans-serif`;
  ctx.fillText(text,x+w/2,y+h*.49,w-26);
  if(options.sub){ctx.font=`bold 17px Arial,sans-serif`;ctx.letterSpacing='3px';ctx.fillText(options.sub,x+w/2,y+h*.84,w-26);ctx.letterSpacing='0px';}
  return [(x+.5)/atlasSize,(y+.5)/atlasSize,(x+w-.5)/atlasSize,(y+h-.5)/atlasSize];
}
const whiteUV=[1/atlasSize,1/atlasSize,2/atlasSize,2/atlasSize];
// The on-street lettering is original, fictional shop naming rather than a real brand.
const signs={
 cafe:tile('느린 오후','#325447','#fff1dc',{sub:'SLOW AFTERNOON',stripe:'#e6ab74'}),
 market:tile('골목 편의점','#f6ead6','#2c6d69',{sub:'24 HOURS · OPEN',stripe:'#50a8a1'}),
 book:tile('달빛 서점','#5a6275','#faf1d9',{sub:'MOON BOOKS',stripe:'#d5b991'}),
 food:tile('서울 분식','#c66354','#fff7e8',{sub:'TTEOKBOKKI · KIMBAP'}),
 flower:tile('오후의 꽃','#e3ad9f','#435c48',{sub:'FLOWER & GARDEN'}),
 bakery:tile('소금빵집','#d2a87c','#fff9ec',{sub:'BAKERY'}),
 photo:tile('네컷 사진관','#827a9a','#fff9f2',{sub:'PHOTO BOOTH'}),
 record:tile('봄날 레코드','#657e89','#fff4dc',{sub:'MUSIC SHOP'}),
 laundry:tile('동네 세탁소','#6c9ba7','#f4f5e9',{sub:'LAUNDRY'}),
 noodle:tile('국수 한 그릇','#d5b177','#6c3d2e',{sub:'NOODLES'}),
 tea:tile('작은 찻집','#a7b38e','#3d5544',{sub:'TEA HOUSE'}),
 stationery:tile('연필 문구점','#e5bd9d','#4d605a',{sub:'STATIONERY'}),
 travel:tile('안녕 서울','#f4f0dc','#bf654f',{sub:'HELLO SEOUL',size:55}),
 hangul:tile('서울 산책','#334c4e','#f9edcf',{sub:'SEOUL STROLL'}),
 noentry:tile('천천히 가요','#e4ac82','#523e39',{sub:'SLOW DOWN'}),
 bus:tile('서촌 골목','#f7f1e8','#536b75',{sub:'VILLAGE STOP'}),
 hanokCafe:tile('차 한 잔','#e9d8b9','#654733',{size:43,border:'#81614a'}),
 hanokAtelier:tile('작은 공방','#eadbc7','#594b3e',{size:41,border:'#806d58'}),
 seventh:tile('북촌 7경','#34453d','#fbf4e6',{w:224,h:86,size:40,border:'#bca68a'}),
};
// These are fictional poetic residence names, not actual home addresses.
signs.residences=[
  tile('솔향','#604835','#f6e9d4',{w:148,h:70,size:39,border:'#b99d73'}),
  tile('온기','#74543d','#fff0db',{w:148,h:70,size:39,border:'#c5a478'}),
  tile('새봄','#5a6047','#fff3dc',{w:148,h:70,size:39,border:'#a9aa84'}),
  tile('다온','#6e5148','#fff1d9',{w:148,h:70,size:39,border:'#b08b77'})
];
// Local building frame: keep traditional building components reusable and let
// the hill pass continuously underneath houses, gates, trees and courtyards.
let activeFrame=null;
function hill(x,z){return mainLaneTerrainHeight(x,z);}
function withFrame(x,z,angle,fn,{level=false}={}){
 const old=activeFrame;
 activeFrame={x,z,c:Math.cos(angle),s:Math.sin(angle),level,baseY:hill(x,z)};
 try{fn();}finally{activeFrame=old;}
}
function transformPoint(p){if(!activeFrame)return p;const f=activeFrame,X=f.x+p[0]*f.c-p[2]*f.s,Z=f.z+p[0]*f.s+p[2]*f.c;return [X,p[1]+(f.level?f.baseY:hill(X,Z)),Z];}
function transformNormal(n){if(!activeFrame)return n;const f=activeFrame;return [n[0]*f.c-n[2]*f.s,n[1],n[0]*f.s+n[2]*f.c];}
function face(a,b,c,d,n,col,tex=whiteUV){
  // Material projection is performed in the unrotated local frame before
  // the terrain transform. Surface grain stays the same scale on every home.
  const id=surfaceMaterialId(col);
  const glowId=nightEmissionClass(col,activeFrame);
  const projected=[a,b,c,d].map(p=>surfaceCoordinates(p,n));
  const localUV=[projected[0],projected[1],projected[2],
                 projected[0],projected[2],projected[3]];
  // Gentle hand-authored architectural contact occlusion: areas just beneath
  // the eaves and at wall foundations receive less bounce light. Independent
  // of camera and shadow map resolution; proper cast shadows remain dynamic.
  const ambientOcclusion=p=>{
    if(!activeFrame)return 1;
    const nearRoof=clamp((p[1]-2.12)/.85,0,1);
    const floorContact=1-clamp(p[1]/.62,0,1);
    if(id===2||id===3||id===5||id===7)
      return 1-.20*nearRoof-.09*floorContact;
    if(id===4)return 1-.10*floorContact;
    return 1;
  };
  const localAO=[a,b,c,a,c,d].map(ambientOcclusion);
  a=transformPoint(a);b=transformPoint(b);c=transformPoint(c);d=transformPoint(d);n=transformNormal(n);
  const p=[a,b,c,a,c,d],u=[[tex[0],tex[3]],[tex[2],tex[3]],[tex[2],tex[1]],[tex[0],tex[3]],[tex[2],tex[1]],[tex[0],tex[1]]];
  for(let i=0;i<6;i++){
    positions.push(...p[i]);normals.push(...n);uvs.push(...u[i]);
    colors.push(...color(col));materialIds.push(id);surfaceUVs.push(...localUV[i]);contactAO.push(localAO[i]);nightEmission.push(glowId);
  }
}
function box(x,y,z,w,h,d,col){
  const X=x-w/2,X2=x+w/2,Y=y-h/2,Y2=y+h/2,Z=z-d/2,Z2=z+d/2;
  face([X,Y2,Z2],[X2,Y2,Z2],[X2,Y2,Z],[X,Y2,Z],[0,1,0],col);
  face([X,Y,Z],[X2,Y,Z],[X2,Y,Z2],[X,Y,Z2],[0,-1,0],col);
  face([X2,Y,Z2],[X2,Y2,Z2],[X2,Y2,Z],[X2,Y,Z],[1,0,0],col);
  face([X,Y,Z],[X,Y2,Z],[X,Y2,Z2],[X,Y,Z2],[-1,0,0],col);
  face([X,Y,Z2],[X,Y2,Z2],[X2,Y2,Z2],[X2,Y,Z2],[0,0,1],col);
  face([X2,Y,Z],[X2,Y2,Z],[X,Y2,Z],[X,Y,Z],[0,0,-1],col);
}
function textured(x,y,z,w,h,plane,tex,side=1){
  // wall front either x-constant, or a road-facing z-constant sign.
  if(plane==='x') face([x,y-h/2,z-w/2],[x,y-h/2,z+w/2],[x,y+h/2,z+w/2],[x,y+h/2,z-w/2],[side,0,0],'white',tex);
  else face([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[0,0,side],'white',tex);
}
function sphere(x,y,z,rx,ry,rz,col,seg=8,rings=5){
  for(let i=0;i<rings;i++){
    const t0=i*Math.PI/rings,t1=(i+1)*Math.PI/rings;
    for(let j=0;j<seg;j++){
      const p0=j*TAU/seg,p1=(j+1)*TAU/seg;
      const v=(t,p)=>[x+rx*Math.sin(t)*Math.cos(p),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(p)];
      const a=v(t0,p0),b=v(t0,p1),c=v(t1,p1),d=v(t1,p0);
      const n=[Math.cos((p0+p1)*.5),.15,Math.sin((p0+p1)*.5)];face(a,b,c,d,n,col);
    }
  }
}
function cylinder(x,y,z,r,h,col,segments=7){
  for(let i=0;i<segments;i++){
    const a=i*TAU/segments,b=(i+1)*TAU/segments,p0=[x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)],p1=[x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)],p2=[p1[0],y+h/2,p1[2]],p3=[p0[0],y+h/2,p0[2]];
    face(p0,p1,p2,p3,[Math.cos((a+b)/2),0,Math.sin((a+b)/2)],col);
    face([x,y+h/2,z],p3,p2,[x,y+h/2,z],[0,1,0],col);
  }
}
function rod(ax,ay,az,bx,by,bz,r,col){ // diagonal beam with a flat rotated vertical rectangle
  const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz)||1;
  const up=[-dy/L*r,dx/L*r,0];
  face([ax-up[0],ay-up[1],az-r],[bx-up[0],by-up[1],bz-r],[bx+up[0],by+up[1],bz+r],[ax+up[0],ay+up[1],az+r],[0,0,1],col);
}
// C: preserve original 5/6-gyeong path[0], add 7-gyeong loop path[1].
const paths=[
 {...MAIN_STREET_ROUTE,points:MAIN_STREET_ROUTE.points.map(p=>p.slice())},
 {...SEVENTH_LOOP_ROUTE,points:SEVENTH_LOOP_ROUTE.points.map(p=>p.slice())}
];
paths[0].samples=smoothMainLane(paths[0].points);
paths[0].widthAt=mainLaneWidth;
paths[1].samples=SEVENTH_LOOP_SAMPLES;
paths[1].widthAt=()=>SEVENTH_LOOP_ROUTE.width;
function distanceFromPath(x,z,p){let best=Infinity;for(let i=0;i<p.samples.length-1;i++){
 const a=p.samples[i],b=p.samples[i+1],vx=b[0]-a[0],vz=b[1]-a[1],t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1),0,1);
 best=Math.min(best,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t));
}return best;}
function groundTile(x,z,r,shade='sage'){face([x-r,hill(x-r,z-r)-.24,z-r],[x+r,hill(x+r,z-r)-.24,z-r],[x+r,hill(x+r,z+r)-.24,z+r],[x-r,hill(x-r,z+r)-.24,z+r],[0,1,0],shade);}
// Real slab faces follow the original sloped, winding lane samples.
const paving=buildPavedAlleys({paths,face,hill});
function routeFloor(){
 // Step 04: remove 8m beige/grey checkerboard and align the ground to
 // the hillside with finer 5m tiles. Asphalt, kerb and stone shoulders
 // sit distinctly above this uninterrupted neutral stone terrain.
 for(let x=-55;x<60;x+=5)for(let z=-70;z<70;z+=5)
   groundTile(x+2.5,z+2.5,2.5,'stoneWarm');
 // Paving is added after the terrain plate in one shared BufferGeometry.
}
// Approved Bukchon Hanok Set v1 (A: wall/gate, B: exposed front, C: café/atelier).
// Shared primitives preserve hillside alignment and the original mesh renderer.
const hanokKit=createHanokKit({box,face,sphere,cylinder,textured,signs});
function courtyard(type,detailVariant=0,profile='hero'){return hanokKit.build(type,detailVariant,profile);}
const houseSites=[];
let fiveGyeongHero=null; // Exactly one photo-referenced house on the lower 5-gyeong west frontage.
let fiveGyeongApproach=null;
function housesOnShowcase(){
 // Eight level-sited homes create staggered, close-set roof silhouettes.
 // Legacy side junction gaps are deliberately left for Step 03 facade fill.
 for(const site of scenicHouseSites(paths[0].samples)){
  let archetype='gate';
  withFrame(site.x,site.z,site.angle,()=>{
   // Narrow low stone plinth: does not read as a giant concrete rectangle.
   box(0,-.155,0,7.35,.32,8.55,'stoneFoundation');
   box(0,-.016,-4.22,7.35,.10,.23,'stoneLight');
   archetype=courtyard(site.type,site.variant);
  },{level:true});
  houseSites.push({...site,archetype,detailVariant:site.variant,decorated:true,scenic:true});
 }
}
function housesAlong(path,pIndex){
 const pts=path.samples;
 let traveled=0;
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);traveled+=len;
  if(traveled<8.4)continue;traveled=0;
  // Upper 40m is hand-composed above, without duplicated procedural homes.
  if(pIndex===0 && b[1]<-2.5)continue;
  const tx=dx/len,tz=dz/len,nx=-tz,nz=tx;
  for(const side of [-1,1]){
   // House thresholds face the kerb from BEHIND it, just as in the curated
   // first 40m. Old 5.8m setbacks pushed gates into the walking lane.
   const spacing=6.9+((i+pIndex*3+Math.abs(side))%3)*.24;
   const x=b[0]+nx*side*spacing,z=b[1]+nz*side*spacing;
   if(Math.abs(x)>36||Math.abs(z)>49)continue;
   if(paths.some(other=>distanceFromPath(x,z,other)<4.75))continue;
   if(houseSites.some(site=>Math.hypot(site.x-x,site.z-z)<(site.scenic?8.2:7.7)))continue;
   // Negative local Z is the front gate: turn each house toward the lane.
   // Actual local -Z rotated by angle points (sin(angle),-cos(angle)).
   // The previous sign used the wrong x direction and faced away.
   const angle=Math.atan2(-nx*side,nz*side);
   // The first lane-facing residence beside the spawn is the single
   // Hanok A01 showcase. Keep all other pre-existing house sites untouched.
   const houseType = pIndex === 0 && houseSites.length === 0 && side === -1
     ? 100
     : (i+pIndex*3+(side===1?2:0))%8;
   // Stable, varied decorations: keep houses familiar after a reload.
   // Force the first few visible houses into different enhanced appearances,
   // then decorate ~80% of the remaining sites using deterministic seeds.
   const detailVariant = houseSites.length < 8
     ? houseSites.length % 4 + 1
     : (i * 17 + pIndex * 7 + (side === 1 ? 1 : 3)) % 5;
   const gateX=x+Math.sin(angle)*4.70,gateZ=z-Math.cos(angle)*4.70;
   // Keep crossing side streets open: street-facing decorations must not
   // intrude into any other road, not only their originating lane.
   if(paths.some(other=>distanceFromPath(gateX,gateZ,other) <
      (other.widthAt?other.widthAt(gateZ):other.width)*.5+.16))continue;
   const photoHouse=!fiveGyeongHero&&
     isFiveGyeongHeroSite({routeIndex:pIndex,side,laneZ:b[1]});
   let archetype='gate',assetDiagnostics=null;
   withFrame(x,z,angle,()=>{
     // Same original lot, grade, rotation, foundation and walkable width.
     box(0,-.155,0,7.35,.32,8.55,'stoneFoundation');
     box(0,-.016,-4.22,7.35,.10,.23,'stoneLight');
     if(photoHouse){
       assetDiagnostics=buildFiveGyeongReferenceHanok({box,face,sphere,cylinder});
       archetype=assetDiagnostics.kind;
     }else archetype=courtyard(houseType,detailVariant,'district');
   },{level:true});
   const site={index:houseSites.length,x,z,angle,archetype,detailVariant,
     decorated:photoHouse||houseType===100||detailVariant>0,
     scenic:false,district:true,routeIndex:pIndex,side,
     laneZ:b[1],roadWidth:path.width,
     ...(photoHouse?{assetId:assetDiagnostics.id,referenceAsset:true}:{})};
   houseSites.push(site);
   if(photoHouse)fiveGyeongHero={site,asset:assetDiagnostics};
  }
 }
}
function buildGapHanok(){
 // The former west branch at z≈-14 was an exposed lot between rooflines.
 // A real modest hanok, not a disconnected wall or flat background image,
 // breaks up the long gap and keeps the visible historic street rhythm.
 const rowZ=-15.15,side=-1;
 const lane=sampleMainLaneAtZ(paths[0].samples,rowZ);
 if(!lane)throw new Error('Missing west gap in the main alley');
 const setback=4.60+mainLaneWidth(rowZ)*.5+.34;
 const x=lane.x+lane.nx*side*setback,z=lane.z+lane.nz*side*setback;
 const angle=Math.atan2(-lane.nx*side,lane.nz*side);
 const tooClose=houseSites.some(h=>Math.hypot(h.x-x,h.z-z)<8.1);
 if(tooClose)throw new Error('New west gap house overlaps an existing hanok');
 const gateX=x+Math.sin(angle)*4.6,gateZ=z-Math.cos(angle)*4.6;
 if(distanceFromPath(gateX,gateZ,paths[0])<mainLaneWidth(gateZ)*.5+.28)
   throw new Error('New gap hanok projects into the walking street');
 let archetype='gate';
 withFrame(x,z,angle,()=>{
   box(0,-.155,0,7.35,.32,8.55,'stoneFoundation');
   box(0,-.016,-4.22,7.35,.10,.23,'stoneLight');
   archetype=courtyard(1,3,'district');
 },{level:true});
 const site={index:houseSites.length,x,z,angle,archetype,
   type:1,detailVariant:3,decorated:true,scenic:false,
   district:false,infill:true,side,laneZ:rowZ,
   roadWidth:mainLaneWidth(rowZ)};
 houseSites.push(site);
 return site;
}
function laneDecoration(){
 // Stage 01: remove detached retaining walls formerly marking the two
 // side roads. The sole route stays paved; facade-gap closure is Step 03.
}

let namsanStats=null;
let skylineStats=null;
function hillsideBackground(){
 // Nearby skyline stays unchanged until background Step 03, while
 // Namsan's landform and tower are built as a cohesive actual 3D model.
 const landmark=buildNamsanLandmark({face,box});
 namsanStats=landmark;
 // Real Seoul is layered rather than a wall of repeated identical boxes.
 // Detailed nearby mixed-use blocks, concrete apartment slabs and office
 // towers frame Namsan without cutting off the tower and ridge.
 skylineStats=buildSeoulSkyline({box,face});
 // Clouds now belong to the moving sky dome shader, not the city mesh.
 // The old flattened white spheres against Namsan are deliberately removed.

}
let frontage={count:0,segments:[]};
let districtFrontage={count:0,segments:[]};
let continuousFrontages=null;
let seventhLoopWalls=null;
let seventhBuildings=null;
let seventhInfill=null;
let seventhViewpoint=null;
let streetLife=null;
let nightFixtures=null;
function makeWorld(){
 routeFloor();
 housesOnShowcase();
 // Only the main-alley housing line remains; side-route buildings are removed.
 housesAlong(paths[0],0);
 if(!fiveGyeongHero)throw new Error('5-gyeong reference house missing its original lower-west lot');
 buildGapHanok();
 // The old short-gap connectors remain for small existing house joints.
 // The separate continuous pass fills the actual bare plots and creates
 // the roofed east gate without ever opening an alternative walking road.
 frontage=buildFrontageConnectors({houses:houseSites,face,hill,distanceFromPath,mainPath:paths[0]});
 districtFrontage=buildFrontageConnectors({
   houses:houseSites,face,hill,distanceFromPath,mainPath:paths[0],
   paths,district:true
 });
 continuousFrontages=buildContinuousFrontages({
   path:paths[0],houses:houseSites,hill,face,box,distanceFromPath,
   existingConnectors:[...frontage.segments,...districtFrontage.segments],
   openings:[SEVENTH_JOIN],
   customFrontages:[FIVE_GYEONG_APPROACH_WALL]
 });
 // The actual street-facing house enclosure was still the old generic
 // RED band. Replace that section with one photo-specific granite wall.
 fiveGyeongApproach=buildFiveGyeongApproach({
   path:paths[0],hill,face,box,sphere,distanceFromPath
 });
 // D-3: place real, six-silhouette 7-gyeong hanoks BEFORE the boundary
 // wall pass, so a generic wall never slices across a wooden front gate.
 // The existing 20 main-road houses are intentionally never rebuilt.
 const sevenPlan=planSeventhHanokSites({
   path:paths[1],paths,existingHouses:houseSites
 });
 seventhBuildings=buildSeventhHanoks({
   plan:sevenPlan,withFrame,box,face,cylinder,sphere,textured,signs,hill
 });
 // D-5 fills both visible sides of the curve with clearance-tested solids.
 // It does not alter path samples, client collision, or server protocol.
 const infillPlan=planSeventhInfill({
   path:paths[1],paths,houses:[...houseSites,...seventhBuildings.buildings]
 });
 seventhInfill=buildSeventhInfill({plan:infillPlan,withFrame,box,face});
 seventhLoopWalls=buildSeventhLoopWalls({
   samples:paths[1].samples,face,hill,
   reservedFrontages:seventhBuildings.frontageSpans
 });
 // D-4 adds low-key residential roof layering and an optional photo cue,
 // without moving a single navigable point or replacing D-3 buildings.
 seventhViewpoint=buildSeventhPhotoEnvironment({
   path:paths[1],paths,
   houses:[...houseSites,...seventhBuildings.buildings,...seventhInfill.buildings],
   face,box,hill,withFrame,textured,signs,cylinder
 });
 nightFixtures=buildBukchonNightFixtures({
   houseSites,paths,hill,withFrame,box,cylinder,sphere,distanceFromPath
 });
 streetLife=buildBukchonStreetLife({
   box,face,sphere,cylinder,textured,signs,withFrame,
   hill,houseSites,paths,distanceFromPath
 });
 laneDecoration();
 hillsideBackground();
}
makeWorld();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('materialId', new THREE.Float32BufferAttribute(materialIds,1));
  geometry.setAttribute('surfaceUV', new THREE.Float32BufferAttribute(surfaceUVs,2));
  geometry.setAttribute('contactAO', new THREE.Float32BufferAttribute(contactAO,1));
  geometry.setAttribute('nightEmission', new THREE.Float32BufferAttribute(nightEmission,1));

  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const material = new THREE.ShaderMaterial({
    lights: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        uAtlas: {value:texture},
        uNight: {value:0},
        uFogColor: {value:new THREE.Color().setRGB(.72,.82,.90)},
        uSunDirection: {value:new THREE.Vector3(-.47,.81,.35).normalize()},
        uShadowStrength: {value:.78},
        uNightLampPositions: {value:new Float32Array(32)}
      }
    ]),
    vertexShader: `
      #include <common>
      #include <shadowmap_pars_vertex>
      attribute float materialId;
      attribute vec2 surfaceUV;
      attribute float contactAO;
      attribute float nightEmission;
      uniform vec3 uSunDirection;
      varying vec2 vUV;
      varying vec2 vSurfaceUV;
      varying float vSurfaceId;
      varying vec3 vColor;
      varying float vLight;
      varying float vContactAO;
      varying float vNightEmission;
      varying vec3 vWorldPosition;
      varying float vWorldNormalY;
      varying float vDistance;
      void main() {
        vSurfaceUV = surfaceUV;
        vSurfaceId = materialId;
        vContactAO = contactAO;
        vNightEmission=nightEmission;
        vec3 transformed = position;
        vec3 transformedNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(transformed,1.0);
        vWorldPosition=worldPosition.xyz;
        #include <shadowmap_vertex>
        vec4 viewPos = modelViewMatrix * vec4(transformed,1.0);
        gl_Position = projectionMatrix * viewPos;
        vDistance = length(viewPos.xyz);
        vUV = uv;
        vColor = color;
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldNormalY=worldNormal.y;
        float daylight = max(dot(worldNormal,normalize(uSunDirection)),0.0);
        // Soft hemisphere skylight + directional warmth: clear faces,
        // darker sheltered plaster/wood, readable underside of tiled eaves.
        float hemi = .67 + .09*clamp(worldNormal.y, -.9, 1.);
        vLight = hemi + .41 * daylight;
      }
    `,
    fragmentShader: `
      precision highp float;
      #include <common>
      #include <packing>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      uniform sampler2D uAtlas;
      uniform float uShadowStrength;
      uniform vec4 uNightLampPositions[8];
      uniform float uNight;
      uniform vec3 uFogColor;
      varying vec2 vUV;
      varying vec2 vSurfaceUV;
      varying float vSurfaceId;
      varying vec3 vColor;
      varying float vLight;
      varying float vContactAO;
      varying float vNightEmission;
      varying vec3 vWorldPosition;
      varying float vWorldNormalY;
      varying float vDistance;
      ${MATERIAL_GLSL}
      void main() {
        vec4 tex = texture2D(uAtlas,vUV);
        // Texture-like surface response without external images. Existing
        // labels keep their UVs in the original 2048px sign atlas.
        vec3 finish=bukchonMaterial(vSurfaceUV,vSurfaceId);
        // The directional sun is almost off at night. Avoid a shadow-map
        // texture read on every fragment of an otherwise static alley.
        float occluded=0.0;
        if(uNight<0.5)occluded=clamp(1.0-getShadowMask(),0.0,1.0);
        // Actual sun shadow map occlusion + subtle local architectural AO.
        // Only the direct component darkens: the sky still fills the shadows.
        float castShade=1.0-.38*occluded*uShadowStrength;
        vec3 lit = tex.rgb * vColor * finish * vLight * vContactAO * castShade;
        // Moonlit surfaces are cool and legible without pretending that every
        // window and alley has an artificial lamp (reserved for step 05).
        // Keep soft blue skylight on eaves and enough detail in the stone.
        vec3 dusk = lit * vec3(.43,.51,.67) + vec3(.017,.024,.041);
        vec3 col = mix(lit,dusk,uNight);
        if(uNight>0.01){
          // Only eight nearest house / alley lamps contribute local warm
          // irradiance; the rest still glow as emissive fixtures.
          float pool=0.0;
          for(int i=0;i<8;i++){
            vec4 lamp=uNightLampPositions[i];
            if(lamp.w>0.1){
              // Squared-distance falloff: 8 lights per pixel without
              // expensive square roots, softer on the lantern housings.
              vec3 offset=vWorldPosition-lamp.xyz;
              float d2=dot(offset,offset);
              float f=1.0-smoothstep(0.0,lamp.w*lamp.w,d2);
              pool=max(pool,f*f);
            }
          }
          // This is local illumination, not pretend shadow-casting lamps.
          float faceFill=clamp(.77+.19*vWorldNormalY,.48,1.0);
          col+=vec3(.67,.39,.17)*pool*.62*faceFill*uNight;
          // Surface emission is independent of roof/shadow occlusion,
          // but fog still attenuates distant lit apartment windows.
          vec3 glow=vec3(0.0);
          if(vNightEmission>3.5) glow=vec3(.62,.38,.18)*.59;
          else if(vNightEmission>2.5) glow=vec3(1.0,.67,.30)*.90;
          else if(vNightEmission>1.5) glow=vec3(.48,.62,.77)*.56;
          else if(vNightEmission>.5) glow=vec3(.97,.64,.28)*.78;
          col+=glow*uNight;
        }
        // Keep Seoul's distant hill and Namsan landmark legible while
        // retaining gentle atmospheric depth down the narrow residential lane.
        // Cool blue atmospheric distance falloff matches the daytime sky.
        // The existing evening strength remains unchanged for phase 04.
        float dayFog=smoothstep(77.0,225.0,vDistance)*.62;
        // Deep-blue night aerial perspective: atmospheric layers remain visible.
        float nightFog=smoothstep(73.0,220.0,vDistance)*.52;
        float fog=mix(dayFog,nightFog,uNight);
        gl_FragColor = vec4(mix(col,uFogColor,fog),1.0);
      }
    `,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {mesh,material,paths,hill,distanceFromPath,houseSites,fiveGyeongHero,fiveGyeongApproach,frontage,districtFrontage,continuousFrontages,seventhLoopWalls,seventhBuildings,seventhInfill,seventhViewpoint,streetLife,nightFixtures,namsan:namsanStats,skyline:skylineStats,paving,vertexCount:positions.length/3};
}
