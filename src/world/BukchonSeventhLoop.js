/**
 * Bukchon 7th-viewpoint neighborhood loop — C road pass.
 *
 * A stylized GAME route inspired by the alleys around Bukchon 7-gyeong.
 * It is NOT a cadastral/georeferenced copy of Bukchon-ro 11na/11ra-gil.
 *
 * This narrow west-side loop rejoins the EXISTING 5/6-gyeong street at
 * z≈+1.5 (middle) and at its original northern overlook z=-44.
 * The complete MAIN_STREET_ROUTE remains unchanged.
 */
export const SEVENTH_LOOP_ROUTE={
  name:'북촌 7경 순환 골목 (게임 재구성)',
  id:'bukchon-seventh-loop',
  kind:'seventh-loop',
  width:2.56,
  // From the mid-street westward fork around quiet residential rooflines
  // to the original overlook. The outer path keeps clear of scenic houses.
  points:[
    [-2.11,1.5],[-8.6,1.3],[-14.6,-.2],[-19.0,-4.2],
    [-21.9,-10.6],[-23.4,-19.1],[-24.7,-28.1],
    [-24.2,-37.7],[-21.0,-45.4],[-15.5,-49.4],
    [-8.5,-49.8],[-4.0,-47.2],[-3,-44]
  ]
};
export const SEVENTH_JOIN=Object.freeze({lowerZ:1.5,upperZ:-44,side:-1,halfWidth:2.6});
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

/** Subdivide a twice-Chaikin-rounded polyline to <=0.75m per segment.
 * Retain the exact endpoints so both intersections are one connected graph.
 */
export function sampleSeventhLoop(points=SEVENTH_LOOP_ROUTE.points,step=.75){
  if(points.length<4||!Number.isFinite(step)||step<=0)
    throw new Error('Invalid seventh-viewpoint route');
  let line=points.map(p=>p.slice());
  for(let pass=0;pass<2;pass++){
    const next=[line[0]];
    for(let i=0;i<line.length-1;i++){
      const a=line[i],b=line[i+1];
      next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);
      next.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
    }
    next.push(line.at(-1));
    line=next;
  }
  const out=[line[0]];
  for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i];
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    for(let j=1,n=Math.max(1,Math.ceil(len/step));j<=n;j++){
      const t=j/n;
      out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
    }
  }
  return out;
}
export function distanceToSeventhLoop(x,z,samples){
  let min=Infinity;
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    const dx=b[0]-a[0],dz=b[1]-a[1],denom=dx*dx+dz*dz||1;
    const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/denom,0,1);
    min=Math.min(min,Math.hypot(x-(a[0]+dx*t),z-(a[1]+dz*t)));
  }
  return min;
}
export function onSeventhLoop(x,z,samples=SEVENTH_LOOP_SAMPLES){
  return Number.isFinite(x)&&Number.isFinite(z)&&
    distanceToSeventhLoop(x,z,samples)<SEVENTH_LOOP_ROUTE.width*.5+.33;
}
export const SEVENTH_LOOP_SAMPLES=sampleSeventhLoop();

/** Simple continuous physical edge walls for the C ROAD milestone.
 * These line the accessible loop, not the main road. Later B architecture
 * work can replace spans with unique hanok gates while keeping the path.
 */
export function buildSeventhLoopWalls({samples=SEVENTH_LOOP_SAMPLES,face,hill}){
  let segments=0,piers=0,length=0;
  const stations=[];
  for(let i=0;i<samples.length;i++){
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
    const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz)||1;
    if(i)length+=Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]);
    stations.push({x:samples[i][0],z:samples[i][1],s:length,nx:-dz/d,nz:dx/d});
  }
  function at(q,side){
    const offset=side*(SEVENTH_LOOP_ROUTE.width*.5+.76);
    const x=q.x+q.nx*offset,z=q.z+q.nz*offset;
    return {x,z,y:hill(x,z)};
  }
  for(let i=1;i<stations.length;i++){
    const a=stations[i-1],b=stations[i];
    // Give junctions wide sight lines and allow the original main-road
    // doorway to remain completely open at both shared endpoints.
    if(a.s<8||b.s>length-8)continue;
    for(const side of [-1,1]){
      const p=at(a,side),q=at(b,side);
      const n=[a.nx*side,0,a.nz*side];
      const quad=(bottom,top,c)=>face(
        [p.x,p.y+bottom,p.z],[q.x,q.y+bottom,q.z],
        [q.x,q.y+top,q.z],[p.x,p.y+top,p.z],n,c);
      quad(-.09,.59,'stoneMasonry');
      quad(.59,.65,'stoneLight');
      quad(.65,1.58,Math.floor(a.s/7)%3===0?'brick':'plaster');
      quad(1.58,1.67,'tileDark');
      // A shallow pitched black-giwa coping; no coplanar overlapping wall.
      const ix=p.x-a.nx*side*.13,iz=p.z-a.nz*side*.13;
      const jx=q.x-b.nx*side*.13,jz=q.z-b.nz*side*.13;
      face([p.x,p.y+1.67,p.z],[q.x,q.y+1.67,q.z],
        [jx,q.y+1.78,jz],[ix,p.y+1.78,iz],[0,1,0],'tileIndigo');
      segments++;
    }
    if(Math.floor(b.s/6.0)>Math.floor(a.s/6.0))piers+=2;
  }
  return {segments,piers,length,join:SEVENTH_JOIN};
}
