import {NAMSAN_TOWER} from './NamsanLandmark.js';
import {hanokFootprintsOverlap,distanceToHanokFootprint}
  from './BukchonSeventhBuildings.js';

/**
 * D-4: a photographic view of lived-in Bukchon-ro 11-gil's quiet 7th scene.
 *
 * 7-gyeong is a modest RESIDENTIAL alley rather than a theatrical lookout.
 * The official Bukchon walking guide describes its stone walls and daily
 * life; a Namsan sightline is an optional distant background, not a huge
 * artificial scenic installation or an inaccurate street recreation.
 *
 * All geometry belongs to the current static world mesh. Camera alignment
 * is opt-in and never teleports or rotates the player automatically.
 */
export const SEVENTH_PHOTO_STATION=38.6;
export const SEVENTH_PHOTO_RADIUS=3.75;
export const SEVENTH_PHOTO_PITCH=.04;
const hypot=Math.hypot;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));

/** Sample by actual traveled distance, not a rectangular map shortcut. */
export function sampleRouteAtDistance(samples,distance){
  let walked=0;
  for(let i=1;i<samples.length;i++){
    const [ax,az]=samples[i-1], [bx,bz]=samples[i];
    const dx=bx-ax,dz=bz-az,length=hypot(dx,dz)||1;
    if(walked+length>=distance||i===samples.length-1){
      const t=clamp((distance-walked)/length,0,1);
      return {x:ax+dx*t,z:az+dz*t,tx:dx/length,tz:dz/length,
        nx:-dz/length,nz:dx/length,s:distance};
    }
    walked+=length;
  }
  throw new Error('Empty seventh-viewpoint route');
}

export function createSeventhPhotoSpot(path){
  if(path.kind!=='seventh-loop')throw Error('7-gyeong viewpoint needs the loop');
  const lane=sampleRouteAtDistance(path.samples,SEVENTH_PHOTO_STATION);
  // Aim approximately along the descending 7-gyeong roof rhythm, toward
  // the distant city. Namsan is near the background axis of this sightline.
  const roofFocus=sampleRouteAtDistance(path.samples,21.5);
  const roadYaw=Math.atan2(roofFocus.x-lane.x,lane.z-roofFocus.z);
  const towerYaw=Math.atan2(NAMSAN_TOWER.x-lane.x,lane.z-NAMSAN_TOWER.z);
  const difference=Math.atan2(Math.sin(towerYaw-roadYaw),
    Math.cos(towerYaw-roadYaw));
  const yaw=roadYaw+clamp(difference,-.11,.11);
  return Object.freeze({
    id:'bukchon-view-7',name:'북촌 7경 · 조용한 골목',
    detail:'전통 한옥의 겹겹이 이어지는 처마와 담장, 작은 대문이 만드는 풍경을 감상해요.',
    x:lane.x,z:lane.z,s:SEVENTH_PHOTO_STATION,radius:SEVENTH_PHOTO_RADIUS,
    yaw,pitch:SEVENTH_PHOTO_PITCH,
    roadYaw,towerYaw,
    direction:'내리막 방향으로 돌아보기',
    // Rest of loop remains open; this is a camera cue, not an exclusive place.
    buildingFrame:'작은 골목 / 전돌 담장 / 나무 대문 / 기와지붕'
  });
}
export function nearSeventhPhotoSpot(x,z,spot){
  return Number.isFinite(x)&&Number.isFinite(z) &&
    hypot(x-spot.x,z-spot.z)<=spot.radius;
}

export const SEVENTH_ROOF_PEEK_SEEDS=Object.freeze([
  {id:'roofline-west-01',s:18.8,side:1,tone:'tileInk'},
  {id:'roofline-west-02',s:28.5,side:1,tone:'tileIndigo'},
  {id:'roofline-corner',s:53.0,side:1,tone:'tileJade'}
]);
const PEEK_WIDTH=5.0,PEEK_DEPTH=4.60,PEEK_SETBACK=6.5;
function roadMargin(site,path){
  let nearest=Infinity;
  for(const [x,z] of path.samples){
    const width=typeof path.widthAt==='function'?path.widthAt(z):path.width;
    nearest=Math.min(nearest,distanceToHanokFootprint(x,z,site)-width*.5);
  }
  return nearest;
}

/** Fill distant roofline voids without creating new walkable buildings or
 * colliding with any existing foundations. No new house count / POIs.
 */
export function planSeventhRoofPeeks({path,paths,houses}){
  const roofs=[];
  for(const seed of SEVENTH_ROOF_PEEK_SEEDS){
    let found=null;
    // One side is preferred, the opposite side is permitted only if both
    // road clearance and house footprint tests are met.
    for(const change of [0,-1.2,1.2,-2.4,2.4]){
      const lane=sampleRouteAtDistance(path.samples,seed.s+change);
      for(const side of [seed.side,-seed.side]){
        const angle=Math.atan2(-lane.nx*side,lane.nz*side);
        const site={
          ...seed,s:seed.s+change,side,angle,
          x:lane.x+lane.nx*side*PEEK_SETBACK,
          z:lane.z+lane.nz*side*PEEK_SETBACK,
          width:PEEK_WIDTH,depth:PEEK_DEPTH
        };
        const clearance=Math.min(...paths.map(p=>roadMargin(site,p)));
        if(clearance<.55)continue;
        if([...houses,...roofs].some(h=>hanokFootprintsOverlap(site,h,.53)))
          continue;
        found={...site,clearance};
        break;
      }
      if(found)break;
    }
    // Decorative massing is optional; a bad roof must never block a path.
    if(found)roofs.push(found);
  }
  return roofs;
}

export function buildSeventhPhotoEnvironment({
  path,paths,houses,face,box,hill,withFrame,textured,signs,cylinder
}){
  const spot=createSeventhPhotoSpot(path);
  const roofPeeks=planSeventhRoofPeeks({path,paths,houses});
  let roofFaces=0,streetDetails=0;
  // Secondary pitched, hand-laid roof silhouettes are real solid volumes
  // behind the official street frontage. From the lane, their layered
  // eaves peek ABOVE the gate/stone walls like real neighboring homes.
  for(const site of roofPeeks){
    withFrame(site.x,site.z,site.angle,()=>{
      const roofW=site.width+.62,roofD=site.depth+.59;
      box(0,.36,.12,site.width+.12,.55,site.depth+.1,'stoneFoundation');
      box(0,1.53,.12,site.width,2.45,site.depth,'plaster');
      for(const x of [-2.25,-1.13,0,1.13,2.25]){
        box(x,1.55,-site.depth*.5+.06,.12,2.42,.16,'timber');
        box(x,2.73,-site.depth*.5-.07,.24,.12,.35,'timberLight');
      }
      // Inset wooden lattice, deliberately visible over wall-top in places.
      for(const x of [-1.08,1.08]){
        box(x,1.84,-site.depth*.5-.035,1.26,1.20,.06,'timber');
        box(x,1.85,-site.depth*.5-.08,1.13,1.08,.025,'hanokPaperWindow');
        for(const xx of [-.31,0,.31])
          box(x+xx,1.86,-site.depth*.5-.12,.028,1.10,.030,'timberLight');
        for(const yy of [1.59,1.90,2.19])
          box(x,yy,-site.depth*.5-.12,1.20,.030,.030,'timberLight');
      }
      for(const direction of [-1,1]){
        // A multi-course gently curled giwa roof, ridge lengthwise in X.
        const xWidth=roofW*.5,depth=roofD*.5;
        for(let row=0;row<6;row++){
          const t0=row/6,t1=(row+1)/6;
          for(let col=0;col<12;col++){
            const u0=col/12,u1=(col+1)/12;
            const pt=(t,u)=>[
              (u*2-1)*xWidth*(1-.10*t),
              3.15+.74*(1-t)+.07*t*t,
              direction*depth*t
            ];
            const color=(col+row)%7===0?'tileRidge':site.tone;
            face(pt(t0,u0),pt(t0,u1),pt(t1,u1),pt(t1,u0),
              [0,1,direction*.3],color);
            roofFaces++;
          }
        }
        for(let i=0;i<13;i++){
          const x=-xWidth+(i+.5)*roofW/13;
          box(x,3.02,direction*(depth+.02),roofW/13-.035,.12,.19,
            i%3===0?'tileLight':'tileRidge');
        }
      }
      box(0,3.97,0,roofW*.90,.13,.24,'tileInkLight');
      for(let j=0;j<13;j++){
        const x=-roofW*.45+(j+.5)*roofW*.9/13;
        box(x,4.07,0,.15,.07,.19,'tileRidge');
      }
    },{level:true});
  }
  const lane=sampleRouteAtDistance(path.samples,spot.s);
  const wallOffset=path.width*.5+.76;
  // The enamel street marker is fixed to an existing residential wall.
  // Unlike a tourist beacon it is subtle and cannot be walked through.
  const side=1,angle=Math.atan2(-lane.nx*side,lane.nz*side);
  const mx=lane.x+lane.nx*side*wallOffset,
    mz=lane.z+lane.nz*side*wallOffset;
  withFrame(mx,mz,angle,()=>{
    box(0,1.43,-.085,1.22,.52,.10,'woodShade');
    box(0,1.43,-.157,1.12,.43,.035,'timberLight');
    textured(0,1.43,-.180,1.06,.37,'z',signs.seventh);
    // Two metal rivets; no glowing or billboard marker.
    for(const x of [-.54,.54])
      cylinder(x,1.43,-.193,.022,.05,'copper',6);
  },{level:true});
  streetDetails++;
  // Small weathered granite edge strip at the real photo station,
  // no steps or collision box in the middle of the 2.56m alley.
  const sx=lane.x+lane.nx*.83,sz=lane.z+lane.nz*.83;
  const grade=hill(sx,sz);
  box(sx,grade+.064,sz,.41,.014,.37,'stoneGrey');
  box(sx,grade+.075,sz,.29,.008,.25,'stoneLight');
  streetDetails++;
  // One modest urban electrical service box on the quiet residential wall.
  // Kept below the roof, and beyond the walkable corridor.
  const utility=sampleRouteAtDistance(path.samples,29.1);
  const ux=utility.x+utility.nx*wallOffset,
    uz=utility.z+utility.nz*wallOffset;
  const ua=Math.atan2(-utility.nx,utility.nz);
  withFrame(ux,uz,ua,()=>{
    box(.18,1.04,-.14,.46,.65,.16,'stoneGrey');
    box(.18,1.11,-.233,.34,.36,.024,'mortar');
    box(.18,.95,-.251,.10,.036,.024,'drainIron');
    box(.34,.46,-.125,.055,.62,.10,'drainIron');
  },{level:true});
  streetDetails++;
  return {spot,roofPeeks,roofFaces,streetDetails,marker:{x:mx,z:mz},
    description:'7-gyeong residential roof rhythm, discreet plaque, optional photo framing'};
}
