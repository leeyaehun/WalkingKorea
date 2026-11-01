/**
 * Bukchon art direction / Step 02: one photo-guided gentle uphill street.
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

export const MAIN_LANE_LOWER_Z=55;
/**
 * Photo-guided street width: a little wider toward the lower city, narrow
 * between the old tiled walls. These numbers are GAME DESIGN dimensions,
 * NOT measurements of the real Bukchon-ro 11-gil.
 * The same profile feeds the asphalt, kerbs, house setbacks and collision.
 */
export function mainLaneWidth(z) {
  const t=clamp((z-SCENIC_TOP_Z)/(MAIN_LANE_LOWER_Z-SCENIC_TOP_Z),0,1);
  return 3.24+.08*smooth(t)-.22*scenicAmount(z);
}

/** Continuous south-to-north grade with the 40m scenic crest.
 * Remove high-frequency lateral ripples that had made kerbs and gates step.
 * y increases toward the north (negative z), with only minute crossfall.
 */
export function mainLaneTerrainHeight(x,z) {
  return .38+(43-z)*.065+.045*Math.sin(z*.07)
    +.018*Math.sin(x*.12)+scenicHillLift(z);
}

/**
 * Monotone-Z cubic Hermite street sampling. Unlike the old double-Chaikin
 * zigzag, every longitudinal station has a continuous tangent and the
 * result never doubles back or jumps over an unpaved gap. Using z as the
 * interpolation parameter prevents corner overshoot in a narrow alley.
 */
export function smoothMainLane(points,step=1.15) {
  if(points.length<2)throw new Error('Main lane needs two or more stations');
  if(!Number.isFinite(step)||step<=0)throw new Error('Invalid road sample step');
  const slopes=points.map((p,i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    return (b[0]-a[0])/(b[1]-a[1]);
  });
  const result=[points[0].slice()];
  for(let i=0;i<points.length-1;i++){
    const [x0,z0]=points[i],[x1,z1]=points[i+1],dz=z1-z0;
    if(!(dz<0)||!Number.isFinite(x0)||!Number.isFinite(x1))
      throw new Error('Street anchor Z must be strictly descending');
    const parts=Math.max(1,Math.ceil(-dz/step));
    for(let j=1;j<=parts;j++){
      const t=j/parts,t2=t*t,t3=t2*t;
      const x=(2*t3-3*t2+1)*x0+(t3-2*t2+t)*dz*slopes[i]
        +(-2*t3+3*t2)*x1+(t3-t2)*dz*slopes[i+1];
      result.push([x,z0+dz*t]);
    }
  }
  return result;
}

export function scenicHillLift(z) {
  // Raise the overlook 1.35m relative to the lower intersection, with
  // continuous slope at both ends (no stair or abrupt cliff in the road).
  const t=clamp((SCENIC_BOTTOM_Z-z)/(SCENIC_BOTTOM_Z-SCENIC_TOP_Z),0,1);
  return 1.35*smooth(t);
}

/**
 * Signed side -1 = west, +1 = east. Step 01 disables all side routes.
 * The historic branch openings around z=-24/-14 become two explicitly
 * tracked unbuilt frontage spans; close them when siting houses in Step 03.
 */
export const SCENIC_HOUSE_ROWS=[
  {z:-41.2,side:-1,setback:.29,type:100,variant:1},
  {z:-38.2,side: 1,setback:.32,type:1,variant:2},
  {z:-33.1,side:-1,setback:.22,type:2,variant:2},
  {z:-30.3,side: 1,setback:.52,type:0,variant:3},
  {z:-25.0,side:-1,setback:.38,type:4,variant:3},
  // Empty east frontage around -24: to be closed in Step 03.
  {z:-17.6,side: 1,setback:.39,type:1,variant:4},
  // Empty west frontage around -14: to be closed in Step 03.
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
