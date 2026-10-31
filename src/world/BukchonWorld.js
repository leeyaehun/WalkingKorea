import * as THREE from 'three';

// Procedural Bukchon geometry retained from v0.3, now represented as a Three.js BufferGeometry.
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
  tileDark:[.23,.29,.33], tileBase:[.30,.37,.41], tileLight:[.39,.45,.47], tileRidge:[.19,.24,.27],
  timber:[.37,.25,.19], timberLight:[.54,.37,.27], woodShade:[.27,.21,.18], plaster:[.94,.89,.77], paper:[.98,.95,.84],
  stoneFoundation:[.63,.60,.53], stoneLight:[.76,.74,.66], gateWood:[.42,.30,.23], copper:[.71,.53,.30]
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
};
// Local building frame: keep traditional building components reusable and let
// the hill pass continuously underneath houses, gates, trees and courtyards.
let activeFrame=null;
function hill(x,z){return .38+(43-z)*.062+.20*Math.sin(z*.14)+.09*Math.sin(x*.16);}
function withFrame(x,z,angle,fn){const old=activeFrame;activeFrame={x,z,c:Math.cos(angle),s:Math.sin(angle)};try{fn();}finally{activeFrame=old;}}
function transformPoint(p){if(!activeFrame)return p;const f=activeFrame,X=f.x+p[0]*f.c-p[2]*f.s,Z=f.z+p[0]*f.s+p[2]*f.c;return [X,p[1]+hill(X,Z),Z];}
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
 {name:'가회동 오르막',width:3.35,points:[[0,43],[-1,35],[.5,25],[-1.5,15],[-5.5,6],[-5,-3],[-1,-14],[.5,-24],[-2,-34],[-3,-44]]},
 {name:'서쪽 담장길',width:2.75,points:[[-5.5,6],[-12,5],[-19,2],[-25,-5],[-24,-12],[-18,-18],[-9,-16],[-1,-14]]},
 {name:'동쪽 공방길',width:2.8,points:[[.5,25],[9,23],[16,16],[17,7],[12,-2],[17,-10],[19,-17],[10,-24],[.5,-24]]}
];
// Smooth the hard turnpoints without opening a wide automotive street.
function softened(points){let p=points.map(q=>q.slice());for(let pass=0;pass<2;pass++){
 let next=[p[0]];for(let i=0;i<p.length-1;i++){let a=p[i],b=p[i+1];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}next.push(p[p.length-1]);p=next;
}return p;}
paths.forEach(p=>p.samples=softened(p.points));
function distanceFromPath(x,z,p){let best=Infinity;for(let i=0;i<p.samples.length-1;i++){
 const a=p.samples[i],b=p.samples[i+1],vx=b[0]-a[0],vz=b[1]-a[1],t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1),0,1);
 best=Math.min(best,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t));
}return best;}
function groundTile(x,z,r,shade='sage'){face([x-r,hill(x-r,z-r)-.24,z-r],[x+r,hill(x+r,z-r)-.24,z-r],[x+r,hill(x+r,z+r)-.24,z+r],[x-r,hill(x-r,z+r)-.24,z+r],[0,1,0],shade);}
function ribbon(path){
 const pts=path.samples,edges=[];
 for(let i=0;i<pts.length;i++){
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;const nx=-dz/len,nz=dx/len;
  edges.push([[pts[i][0]+nx*path.width*.5,pts[i][1]+nz*path.width*.5],[pts[i][0]-nx*path.width*.5,pts[i][1]-nz*path.width*.5]]);
 }
 for(let i=0;i<edges.length-1;i++){
  const [a,b]=edges[i],[d,c]=edges[i+1];
  const v=q=>[q[0],hill(q[0],q[1])+.025,q[1]];
  face(v(a),v(b),v(c),v(d),[0,1,0],i%9===0?'beige':'sidewalk');
  // Subtle stone joints in pedestrian lanes, not automobile center lines.
  if(i%4===0){const v1=q=>[q[0],hill(q[0],q[1])+.043,q[1]];
   const f=.11,p=q=>[q[0]*(1-f)+edges[i+1][0][0]*f,q[1]*(1-f)+edges[i+1][0][1]*f];
   const t=q=>[q[0]*(1-f)+edges[i+1][1][0]*f,q[1]*(1-f)+edges[i+1][1][1]*f];
   face(v1(a),v1(b),v1(t(b)),v1(p(a)),[0,1,0],'cream');
  }
 }
}
function routeFloor(){
 // green-grey terrain plate: city blocks are hidden behind walls and house rows.
 for(let x=-52;x<55;x+=8)for(let z=-67;z<68;z+=8)groundTile(x+4,z+4,4,(x+z)%3===0?'sage':'muted');
 paths.forEach(ribbon);
}
// Bukchon-inspired traditional house visual pass. Geometry is stylized, but the
// components intentionally follow hanok construction: raised stone stylobate,
// exposed timber frame, paper lattice doors and curved blue-charcoal tiled roof.
// Model origin is the centre of a house, front faces the lane at -Z.
function roofY(x,z,w){
  const t=Math.min(1,Math.abs(z)/3.75);
  const corner=Math.pow(Math.min(1,Math.abs(x)/(w*.5)),4);
  // Shallow ridge, gently rolled tiles, corners lifting at each eave.
  return 4.08 - .24*t - .72*Math.sin(t*Math.PI*.5) + .29*Math.pow(t,5)*corner;
}
function hanokRoof(w,type){
  const halfX=(w+1.45)*.5;
  const stripsX=12, stripsZ=8;
  // Surface starts at the central ridge and runs down to each eave. Fine
  // longitudinal raised seams suggest traditional convex roof-tile rows.
  for(const side of [-1,1]){
    for(let iz=0;iz<stripsZ;iz++){
      const z0=side*3.75*iz/stripsZ,z1=side*3.75*(iz+1)/stripsZ;
      for(let ix=0;ix<stripsX;ix++){
        const x0=-halfX+ix*halfX*2/stripsX,x1=-halfX+(ix+1)*halfX*2/stripsX;
        const seam=(ix%3===0),col=seam?'tileLight':(ix%3===1?'tileBase':'tileDark');
        face([x0,roofY(x0,z0,w),z0],[x1,roofY(x1,z0,w),z0],
             [x1,roofY(x1,z1,w),z1],[x0,roofY(x0,z1,w),z1],[0,1,0],col);
        // Fine ridges on roof tiles, with a dark line under each course.
        if(ix%3===0){
          const x=x0+.045;
          face([x,roofY(x,z0,w)+.025,z0],[x+.068,roofY(x+.068,z0,w)+.025,z0],
               [x+.068,roofY(x+.068,z1,w)+.025,z1],[x,roofY(x,z1,w)+.025,z1],
               [0,1,0],'tileLight');
        }
      }
      if(iz%2===1){
        for(let ix=0;ix<stripsX;ix++){
          const x0=-halfX+ix*halfX*2/stripsX,x1=x0+.038;
          const z=z1-side*.012;
          face([x0,roofY(x0,z,w)+.022,z],[x1,roofY(x1,z,w)+.022,z],
               [x1,roofY(x1,z,w)+.038,z+side*.035],[x0,roofY(x0,z,w)+.038,z+side*.035],
               [0,1,0],'tileDark');
        }
      }
    }
    // Dark raised eave lip with little exposed tile ends (rounded by segments).
    for(let j=0;j<stripsX;j++){
      const x0=-halfX+j*(halfX*2/stripsX),x1=-halfX+(j+1)*(halfX*2/stripsX);
      const y0=roofY(x0,side*3.75,w),y1=roofY(x1,side*3.75,w);
      face([x0,y0,side*3.75],[x1,y1,side*3.75],
           [x1,y1-.12,side*3.86],[x0,y0-.12,side*3.86],
           [0,0,side],'tileRidge');
      for(let k=0;k<2;k++){
        const cx=x0+(k+.5)*(x1-x0)*.5;
        box(cx,(roofY(cx,side*3.75,w)-.055),side*3.86,.10,.13,.13,'tileDark');
      }
    }
    // Exposed underside and wooden beam under long eaves.
    box(0,2.93,side*3.37,w+.8,.13,.14,'timber');
    for(let x=-w*.5+.38;x<w*.5;x+=.86){
      box(x,2.89,side*3.44,.085,.19,.69,'timberLight');
    }
  }
  // Ridge cap, each short cap tile distinguished by daylight glints.
  box(0,4.16,0,w+1.55,.17,.30,'tileRidge');
  for(let x=-halfX+.18;x<halfX;x+=.41){
    box(x,4.27,0,.28,.085,.37,((Math.round(x*7)&1)===0)?'tileDark':'tileLight');
  }
  // End gables: a subdued white triangular infill and curved roof edges.
  for(const side of [-1,1]){
    const x=side*(w*.5+.055);
    const z=3.08;
    face([x,2.91,-z],[x,2.91,z],[x,4.01,0],[x,4.01,0],[side,0,0],'plaster');
    box(x,3.00,0,.09,.13,5.70,'timber');
    for(let zz of [-2.4,-1.2,1.2,2.4]){
      const yy=roofY(x,zz,w)-.11;
      box(x,yy-.38,zz,.10,.46,.13,'timberLight');
    }
    // Outer verge tiles follow the roof curvature rather than a flat slab.
    for(const s of [-1,1]){
      for(let k=0;k<8;k++){
        const za=s*3.75*k/8,zb=s*3.75*(k+1)/8;
        const ya=roofY(x,za,w),yb=roofY(x,zb,w);
        face([x-.12,ya+.035,za],[x+.12,ya+.035,za],
             [x+.12,yb+.035,zb],[x-.12,yb+.035,zb],[0,1,0],'tileRidge');
      }
    }
  }
}
function latticePanel(cx,cy,z,width,height,variant=0){
  // Paper field, four-sided wooden surround, thin grid and a lower wood sill.
  box(cx,cy,z,width,height,.09,'timber');
  box(cx,cy,z-.065,width-.14,height-.14,.024,'paper');
  for(const x of [cx-width*.5+.05,cx+width*.5-.05])box(x,cy,z-.094,.07,height,.036,'timber');
  for(const y of [cy-height*.5+.045,cy+height*.5-.045])box(cx,y,z-.09,width,.068,.036,'timber');
  // Fine wooden cross pieces allow the ivory paper to read as hanji, not glass.
  const cols=variant===1?3:4,rows=variant===1?5:6;
  for(let i=1;i<cols;i++)box(cx-width*.5+width*i/cols,cy,z-.102,.025,height-.11,.028,'timberLight');
  for(let j=1;j<rows;j++)box(cx,cy-height*.5+height*j/rows,z-.104,width-.12,.027,.028,'timberLight');
  box(cx,cy-height*.5+.20,z-.117,width-.1,.055,.045,'timber');
}
function hanok(type=0){
  const w=6.35+(type%3)*.28;
  const bodyColor=(type%4===2)?'cream':'plaster';
  // Pale stacked stone base, projecting plinth and porch timber floor.
  box(0,.18,0,w+.45,.36,6.40,'stoneFoundation');
  box(0,.39,-.03,w+.25,.12,6.18,'stoneLight');
  box(0,1.62,0,w,2.67,5.58,bodyColor);
  box(0,.43,-3.11,w+.55,.12,1.05,'timberLight');
  for(let xx=-w*.5+.3;xx<w*.5;xx+=.78)box(xx,.26,-3.21,.045,.15,1.0,'timber');
  // Legible timber post-and-beam construction instead of plain cream blocks.
  for(const x of [-w*.5+.12,-w*.25,0,w*.25,w*.5-.12]){
    box(x,1.69,-2.91,.17,2.70,.22,'timber');
    box(x,1.63,2.91,.15,2.70,.18,'timber');
    box(x,.51,-2.91,.24,.19,.26,'stoneFoundation');
  }
  box(0,2.87,-2.91,w+.28,.19,.23,'timber');
  box(0,.55,-2.91,w+.10,.21,.19,'timber');
  box(0,2.66,-2.97,w+.15,.055,.07,'timberLight');
  // Central twin door, two full-size lattice windows.
  latticePanel(0,1.60,-3.032,1.57,2.08,1);
  box(0,1.58,-3.143,.058,2.03,.04,'woodShade');
  for(const x of [-.10,.10])sphere(x,1.48,-3.19,.035,.035,.035,'copper',6,3);
  for(const x of [-1.96,1.96])latticePanel(x,1.70,-3.023,1.45,1.82,0);
  // Grey roof tiles: real nonflat slopes, dark fascia, upturned corner tips.
  hanokRoof(w,type);
  // Street-facing low walls: mix brick foundation, warm plaster and wooden caps.
  // The gate remains at the centre; you can still look into the hanok courtyard.
  for(const side of [-1,1]){
    const x=side*2.53;
    box(x,.31,-4.48,2.12,.62,.32,'stoneFoundation');
    box(x,1.12,-4.48,2.12,1.12,.29,bodyColor);
    box(x,1.75,-4.48,2.23,.14,.40,'tileDark');
    for(let j=0;j<3;j++){
      const xx=x-.69+j*.69;
      box(xx,1.13,-4.655,.045,.9,.035,'stoneLight');
    }
  }
  for(const x of [-3.59,-1.39,1.39,3.59]){
    box(x,.95,-4.52,.20,1.85,.36,'timber');
    box(x,.27,-4.52,.30,.31,.38,'stoneFoundation');
  }
  // Gate header with understated hanok roof and two engraved vertical leaves.
  box(0,2.03,-4.53,2.93,.18,.52,'timber');
  box(0,2.23,-4.53,3.16,.13,.68,'tileRidge');
  for(const x of [-.72,.72]){
    box(x,1.04,-4.57,1.32,1.62,.055,'gateWood');
    box(x,1.08,-4.63,1.14,1.35,.025,'timberLight');
    for(let j=0;j<4;j++)box(x-.43+j*.285,1.08,-4.66,.024,1.29,.025,'woodShade');
    for(let j=0;j<3;j++)box(x,.60+j*.49,-4.67,1.09,.029,.026,'woodShade');
  }
  for(const x of [-.12,.12])sphere(x,1.09,-4.70,.043,.043,.035,'copper',6,3);
  // Vary the silhouette subtly, keeping a unified calm Bukchon palette.
  if(type%3===1){
    box(-w*.5-.12,1.32,1.00,.23,1.72,3.50,'plaster');
    box(-w*.5-.14,2.25,1.00,.29,.13,3.68,'tileDark');
  }
  if(type%4===0){
    for(const z of [-1.7,1.55])box(w*.5+.045,1.5,z,.03,1.55,.45,'timber');
  }
}
function courtyard(type){
 // Small walled homes enclosing a view rather than lining an endless street.
 hanok(type);
 if(type%3===0){sphere(-3.0,1.35,-2.6,.62,.68,.55,'sage',7,5);sphere(3,1.7,-3.6,.48,.55,.55,'green',7,5);}
 if(type%4===1){cylinder(2.8,1,-4.25,.27,1.7,'brown');sphere(2.8,2,-4.25,.7,.61,.75,'sage',8,5);}
}
const houseSites=[];
function housesAlong(path,pIndex){
 const pts=path.samples;
 let traveled=0;
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);traveled+=len;
  if(traveled<8.4)continue;traveled=0;
  const tx=dx/len,tz=dz/len,nx=-tz,nz=tx;
  for(const side of [-1,1]){
   const spacing=5.8+((i+pIndex)%3)*.36;
   const x=b[0]+nx*side*spacing,z=b[1]+nz*side*spacing;
   if(Math.abs(x)>36||Math.abs(z)>49)continue;
   if(paths.some(other=>distanceFromPath(x,z,other)<4.75))continue;
   if(houseSites.some(site=>Math.hypot(site.x-x,site.z-z)<7.7))continue;
   // Negative local Z is the front gate: turn each house toward the lane.
   const angle=Math.atan2(nx*side,-nz*side)+Math.PI;
   houseSites.push({x,z,angle});
   withFrame(x,z,angle,()=>courtyard((i+pIndex*3+(side===1?2:0))%8));
  }
 }
}
function laneDecoration(){
 // Retaining walls near corners and a few objects make it feel inhabited.
 for(const [x,z,angle] of [[-10,6,.7],[-19,-6,.5],[8,22,-.7],[14,-20,.9],[-2,-38,0]]){
  withFrame(x,z,angle,()=>{
   box(0,.65,0,3.4,1.15,.36,'beige');box(0,1.25,0,3.5,.2,.5,'roof');
   cylinder(1.75,.83,.55,.18,1.65,'brown');sphere(1.7,1.98,.55,.7,.69,.75,'sage',8,5);
  });
 }
 for(const [x,z] of [[-6,26],[-8,-32],[13,12],[-21,-12],[7,-10]]){
  withFrame(x,z,.35,()=>{cylinder(0,1.23,0,.14,2.45,'brown');sphere(.05,2.64,0,.8,.72,.76,'sage',8,5);});
 }
 // An elevated overlook at the northwest side of the upper route.
 withFrame(-3,-43,0,()=>{
  box(0,.18,-1.35,4.0,.35,2.8,'beige');
  for(const xx of [-2,2])box(xx,.90,-2.60,.18,1.55,.2,'brown');
  box(0,1.57,-2.60,4.15,.17,.22,'brown');
 });
}
function hillsideBackground(){
 for(let x=-75;x<=75;x+=16){
  let z=-93-(x%4)*2;
  sphere(x,11,z,14,11,16,x%3===0?'sage':'green',9,5);
 }
 // This south-facing landmark is deliberately a far-off silhouette. A detailed
 // N Seoul Tower model will be a separate visual pass.
 const sx=17,sz=146;
 for(let i=-8;i<=8;i++){
   let x=i*10-3,h=8+(i%4+4)%4*3;
   box(x,h*.5,125,8,h,7,'dustyBlue');
 }
 cylinder(sx,31,sz,1.12,39,'roof',9);
 cylinder(sx,50,sz,4.4,4.6,'offwhite',10);
 cylinder(sx,53,sz,2.2,3.5,'roof',9);
 cylinder(sx,64,sz,.35,20,'dark',7);
 for(let i=0;i<10;i++){
  const x=rand(-80,80),z=rand(-135,-40),y=rand(25,38);
  sphere(x,y,z,rand(4,9),1.1,3.4,'cream',8,4);
 }
}
function makeWorld(){routeFloor();paths.forEach((p,i)=>housesAlong(p,i));laneDecoration();hillsideBackground();}
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
      uFogColor: {value:new THREE.Color().setRGB(.72,.78,.76)}
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
        float fog = smoothstep(60.0,180.0,vDistance)*.83;
        gl_FragColor = vec4(mix(col,uFogColor,fog),1.0);
      }
    `,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {mesh,material,paths,hill,distanceFromPath,houseSites,vertexCount:positions.length/3};
}
