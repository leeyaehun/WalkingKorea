import {MAIN_STREET_ROUTE} from '../world/BukchonMainStreet.js';
import {smoothMainLane,mainLaneWidth} from '../world/BukchonStreetLayout.js';

export const MAX_WALKERS_PER_ROOM=8;
export const MAX_PUBLIC_ROOMS=64; // Soft operational safety cap; rooms appear on demand.
export const WALK_SEND_INTERVAL_MS=125; // Eight movement packets per second.
export const WALK_SPAWN=Object.freeze({x:-3,z:-42});
const ROAD=smoothMainLane(MAIN_STREET_ROUTE.points);
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));

/** Pure geometry validation, matching the browser's one walkable lane. */
export function distanceToMainStreet(x,z){
  let result=Infinity;
  for(let i=1;i<ROAD.length;i++){
    const [ax,az]=ROAD[i-1], [bx,bz]=ROAD[i];
    const dx=bx-ax,dz=bz-az;
    const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);
    result=Math.min(result,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return result;
}
export function isAllowedWalkPosition(x,z){
  return Number.isFinite(x)&&Number.isFinite(z)&&
    z>=-44.5&&z<=55.5 &&
    distanceToMainStreet(x,z)<=mainLaneWidth(z)*.5+.40;
}

/** Never relay untrusted messages, names or arbitrary payloads. */
export function validateMovement(data,previous,now){
  if(!data||data.t!=='p'||!previous||!Number.isFinite(now))return null;
  const {x,z,vx,vz}=data;
  if(![x,z,vx,vz].every(v=>typeof v==='number'&&Number.isFinite(v)))return null;
  if(!isAllowedWalkPosition(x,z))return null;
  if(Math.hypot(vx,vz)>3.9)return null;
  const delta=now-previous.at;
  if(delta<65)return null; // Limit malicious packet floods.
  const maxTravel=.55+3.9*Math.min(Math.max(delta,0),1200)/1000;
  if(!previous.initial&&Math.hypot(x-previous.x,z-previous.z)>maxTravel)return null;
  return {x,z,vx,vz,at:now};
}
