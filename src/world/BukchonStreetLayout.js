/**
 * Bukchon art direction / Phase 01: an authored 40m street composition.
 * A local spatial study, NOT a surveyed map of Gahoe-dong.
 * No materials, lighting, or hanok mesh changes belong in this module.
 */
export const SCENIC_TOP_Z=-44;
export const SCENIC_BOTTOM_Z=-4;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);

export function scenicAmount(z) {
  // 0 at the upper/lower ends, 1 at the middle of the first street.
  const t=clamp((z-SCENIC_TOP_Z)/(SCENIC_BOTTOM_Z-SCENIC_TOP_Z),0,1);
  return Math.sin(Math.PI*t)**2;
}

export function mainLaneWidth(z) {
  // 3.35m at the junctions; a slightly more intimate 2.95m midblock.
  return 3.35 - .40*scenicAmount(z);
}

export function scenicHillLift(z) {
  // Raise the overlook 1.35m relative to the lower intersection, with
  // continuous slope at both ends (no stair or abrupt cliff in the road).
  const t=clamp((SCENIC_BOTTOM_Z-z)/(SCENIC_BOTTOM_Z-SCENIC_TOP_Z),0,1);
  return 1.35*smooth(t);
}

/**
 * Signed side -1 = west, +1 = east (main route runs toward negative Z).
 * Keep an intentional gap on the east near the craft-road junction z~-24,
 * and on the west near the quieter wall-lane junction z~-14.
 */
export const SCENIC_HOUSE_ROWS=[
  {z:-41.2,side:-1,setback:.29,type:100,variant:1},
  {z:-38.2,side: 1,setback:.32,type:1,variant:2},
  {z:-33.1,side:-1,setback:.22,type:2,variant:2},
  {z:-30.3,side: 1,setback:.52,type:0,variant:3},
  {z:-25.0,side:-1,setback:.38,type:4,variant:3},
  // East-facing house at -24 intentionally omitted: visible branch entrance.
  {z:-17.6,side: 1,setback:.39,type:1,variant:4},
  // West-facing house at -14 intentionally omitted: visible branch entrance.
  {z:-9.2,side: 1,setback:.34,type:7,variant:1},
  {z:-6.1,side:-1,setback:.33,type:3,variant:1},
];

export function sampleMainLaneAtZ(samples,z) {
  // Samples run from lower (+z) toward upper (-z); use actual smoothed lane,
  // not a second independent curve that would detach houses from paving.
  let best=null;
  for(let i=0;i<samples.length-1;i++){
    const a=samples[i],b=samples[i+1];
    if(z>Math.max(a[1],b[1])+.0001||z<Math.min(a[1],b[1])-.0001)continue;
    const t=clamp((z-a[1])/(b[1]-a[1]||1),0,1);
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1;
    best={x:a[0]+dx*t,z,tx:dx/length,tz:dz/length,
      nx:-dz/length,nz:dx/length};
    break;
  }
  return best;
}

export function scenicHouseSites(samples) {
  return SCENIC_HOUSE_ROWS.map((row,index)=>{
    const lane=sampleMainLaneAtZ(samples,row.z);
    if(!lane)throw new Error('Missing scenic street centreline at z='+row.z);
    const width=mainLaneWidth(row.z);
    const setback=4.60+width*.5+row.setback;
    const x=lane.x+lane.nx*row.side*setback;
    const z=lane.z+lane.nz*row.side*setback;
    return {...row,index,x,z,laneX:lane.x,laneZ:lane.z,roadWidth:width,
      angle:Math.atan2(-lane.nx*row.side,lane.nz*row.side)};
  });
}
