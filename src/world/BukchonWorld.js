import { createHanokKit } from './HanokKit.js';
import { buildPavedAlleys } from './BukchonPaving.js';
import {mainLaneWidth,scenicHillLift,scenicHouseSites} from './BukchonStreetLayout.js';
import {buildFrontageConnectors} from './BukchonFrontage.js';
import * as THREE from 'three';

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
  drainIron:[.50,.47,.43],drainGrill:[.69,.64,.56]
};
const color=(v)=>Array.isArray(v)?v:C[v]||C.white;
const positions=[],normals=[],uvs=[],colors=[];
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
};
// Local building frame: keep traditional building components reusable and let
// the hill pass continuously underneath houses, gates, trees and courtyards.
let activeFrame=null;
function hill(x,z){return .38+(43-z)*.062+.20*Math.sin(z*.14)+.09*Math.sin(x*.16)+scenicHillLift(z);}
function withFrame(x,z,angle,fn,{level=false}={}){
 const old=activeFrame;
 activeFrame={x,z,c:Math.cos(angle),s:Math.sin(angle),level,baseY:hill(x,z)};
 try{fn();}finally{activeFrame=old;}
}
function transformPoint(p){if(!activeFrame)return p;const f=activeFrame,X=f.x+p[0]*f.c-p[2]*f.s,Z=f.z+p[0]*f.s+p[2]*f.c;return [X,p[1]+(f.level?f.baseY:hill(X,Z)),Z];}
function transformNormal(n){if(!activeFrame)return n;const f=activeFrame;return [n[0]*f.c-n[2]*f.s,n[1],n[0]*f.s+n[2]*f.c];}
function face(a,b,c,d,n,col,tex=whiteUV){
  a=transformPoint(a);b=transformPoint(b);c=transformPoint(c);d=transformPoint(d);n=transformNormal(n);
  const p=[a,b,c,a,c,d],u=[[tex[0],tex[3]],[tex[2],tex[3]],[tex[2],tex[1]],[tex[0],tex[3]],[tex[2],tex[1]],[tex[0],tex[1]]];
  for(let i=0;i<6;i++){positions.push(...p[i]);normals.push(...n);uvs.push(...u[i]);colors.push(...color(col));}
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
// BUKCHON 01: small winding lanes and uphill views, not a georeferenced map.
// Paths are real geometry and also define collision and the minimap.
const paths=[
 {name:'가회동 오르막',width:3.35,points:[[0,55],[0,43],[-1,35],[.5,25],[-1.5,15],[-5.5,6],[-5,-3],[-2.6,-14],[-2.7,-24],[-2.9,-34],[-3,-44]]},
 {name:'서쪽 담장길',width:2.75,points:[[-5.5,6],[-12,5],[-19,2],[-25,-5],[-24,-12],[-18,-18],[-9,-16],[-2.6,-14]]},
 {name:'동쪽 공방길',width:2.8,points:[[.5,25],[9,23],[16,16],[17,7],[12,-2],[17,-10],[19,-17],[10,-24],[-2.7,-24]]}
];
// Smooth the hard turnpoints without opening a wide automotive street.
function softened(points){let p=points.map(q=>q.slice());for(let pass=0;pass<2;pass++){
 let next=[p[0]];for(let i=0;i<p.length-1;i++){let a=p[i],b=p[i+1];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}next.push(p[p.length-1]);p=next;
}return p;}
paths.forEach((p,i)=>{p.samples=softened(p.points);if(i===0)p.widthAt=mainLaneWidth;});
function distanceFromPath(x,z,p){let best=Infinity;for(let i=0;i<p.samples.length-1;i++){
 const a=p.samples[i],b=p.samples[i+1],vx=b[0]-a[0],vz=b[1]-a[1],t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1),0,1);
 best=Math.min(best,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t));
}return best;}
function groundTile(x,z,r,shade='sage'){face([x-r,hill(x-r,z-r)-.24,z-r],[x+r,hill(x+r,z-r)-.24,z-r],[x+r,hill(x+r,z+r)-.24,z+r],[x-r,hill(x-r,z+r)-.24,z+r],[0,1,0],shade);}
// Real slab faces follow the original sloped, winding lane samples.
const paving=buildPavedAlleys({paths,face,hill});
function routeFloor(){
 // green-grey terrain plate: city blocks are hidden behind walls and house rows.
 for(let x=-52;x<55;x+=8)for(let z=-67;z<68;z+=8)groundTile(x+4,z+4,4,(x+z)%3===0?'sage':'muted');
 // Paving is added after the terrain plate in one shared BufferGeometry.
}
// Approved Bukchon Hanok Set v1 (A: wall/gate, B: exposed front, C: café/atelier).
// Shared primitives preserve hillside alignment and the original mesh renderer.
const hanokKit=createHanokKit({box,face,sphere,cylinder,textured,signs});
function courtyard(type,detailVariant=0){return hanokKit.build(type,detailVariant);}
const houseSites=[];
function housesOnShowcase(){
 // Eight level-sited homes create staggered, close-set roof silhouettes.
 // Junctions at z~-14 (west) and -24 (east) stay clear.
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
   const spacing=5.8+((i+pIndex)%3)*.36;
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
   let archetype='gate';
   withFrame(x,z,angle,()=>{archetype=courtyard(houseType,detailVariant);});
   houseSites.push({x,z,angle,archetype,detailVariant,
     decorated: houseType === 100 || detailVariant > 0});
  }
 }
}
function laneDecoration(){
 // Retaining walls near corners and a few objects make it feel inhabited.
 for(const [x,z,angle] of [[-10,6,.7],[-19,-6,.5],[8,22,-.7],[14,-20,.9]]){
  withFrame(x,z,angle,()=>{
   box(0,.65,0,3.4,1.15,.36,'beige');box(0,1.25,0,3.5,.2,.5,'roof');
   cylinder(1.75,.83,.55,.18,1.65,'brown');sphere(1.7,1.98,.55,.7,.69,.75,'sage',8,5);
  });
 }
 for(const [x,z] of [[-6,26],[-8,-32],[13,12],[-21,-12],[7,-10]]){
  withFrame(x,z,.35,()=>{cylinder(0,1.23,0,.14,2.45,'brown');sphere(.05,2.64,0,.8,.72,.76,'sage',8,5);});
 }
 // The overlook starts on the street itself. Removing the old 4m platform
 // and waist-high transverse railing keeps the iconic downhill vista clear,
 // without blocking the camera or the player walkable path.

}
function hillsideBackground(){
 // The celebrated Bukchon view: the roofs open toward Seoul's city skyline
 // and the Namsan tower beyond. This is a stylized silhouette, not exact GIS.
 // The high lookout is at z~-42, and the road descends toward positive Z.
 for(let x=-86;x<=86;x+=16) {
   const z=155+(Math.abs(x)%3)*4;
   const height=9+3*Math.cos(x*.04);
   sphere(x,height,z,20,height+2,19,x%3===0?'deepGreen':'sage',9,5);
 }
 // Nearest skyline rows: alternate pale concrete and warm stone to resemble
 // the layered urban landscape visible between residential rooflines.
 for(let row=0;row<3;row++) {
   for(let i=-9;i<=9;i++) {
     const x=i*9+(row%2)*4;
     const z=99+row*14;
     const height=7+((Math.abs(i*17+row*11))%6)*2.8;
     const tone=(i+row)%4===0?'stoneLight':(i+row)%3===0?'dustyBlue':'beige';
     box(x,height*.5,z,6.2,height,6.8,tone);
     // A few subtle stacked window rhythms catch the light.
     if(row<2 && i%2===0) {
       for(let wy=4;wy<height-1;wy+=2.5)
         for(let wx of [-1.7,0,1.7])
           box(x+wx,wy,z-3.46,.58,.88,.045,'shadow');
     }
   }
 }
 // N Seoul Tower as a recognizable landmark above its dark green hill.
 const tx=17,tz=153;
 sphere(tx,16,tz,30,14,23,'deepGreen',12,6);
 cylinder(tx,35,tz,1.24,39,'stoneLight',11);
 cylinder(tx,54,tz,4.6,4.9,'offwhite',12);
 cylinder(tx,57.1,tz,2.6,2.7,'roof',12);
 cylinder(tx,67,tz,.43,20,'dark',8);
 cylinder(tx,78.5,tz,.20,3.5,'brickTerracotta',7);
 // Soft high clouds, well beyond the route.
 for(let i=0;i<10;i++) {
   const x=rand(-88,88),z=rand(165,200),y=rand(30,42);
   sphere(x,y,z,rand(4,10),1.2,3.6,'cream',8,4);
 }
}
let frontage={count:0,segments:[]};
function makeWorld(){
 routeFloor();
 housesOnShowcase();
 paths.forEach((p,i)=>housesAlong(p,i));
 frontage=buildFrontageConnectors({houses:houseSites,face,hill,distanceFromPath,mainPath:paths[0]});
 laneDecoration();
 hillsideBackground();
}
makeWorld();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));

  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: {value:texture},
      uNight: {value:0},
      uFogColor: {value:new THREE.Color().setRGB(.79,.78,.75)}
    },
    vertexShader: `
      varying vec2 vUV;
      varying vec3 vColor;
      varying float vLight;
      varying float vDistance;
      void main() {
        vec4 viewPos = modelViewMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * viewPos;
        vDistance = length(viewPos.xyz);
        vUV = uv;
        vColor = color;
        vec3 lightDirection = normalize(vec3(-0.45,0.83,0.35));
        float diffuse = max(dot(normalize(normal),lightDirection),0.0);
        vLight = 0.77 + diffuse * 0.32;
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D uAtlas;
      uniform float uNight;
      uniform vec3 uFogColor;
      varying vec2 vUV;
      varying vec3 vColor;
      varying float vLight;
      varying float vDistance;
      void main() {
        vec4 tex = texture2D(uAtlas,vUV);
        vec3 lit = tex.rgb * vColor * vLight;
        vec3 dusk = lit * vec3(.67,.73,.87) + vec3(.025,.033,.056);
        vec3 col = mix(lit,dusk,uNight);
        // Keep Seoul's distant hill and Namsan landmark legible while
        // retaining gentle atmospheric depth down the narrow residential lane.
        float fog = smoothstep(80.0,240.0,vDistance)*.60;
        gl_FragColor = vec4(mix(col,uFogColor,fog),1.0);
      }
    `,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {mesh,material,paths,hill,distanceFromPath,houseSites,frontage,paving,vertexCount:positions.length/3};
}
