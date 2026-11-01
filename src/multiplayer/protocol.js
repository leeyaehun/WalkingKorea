import {MAIN_STREET_ROUTE} from '../world/BukchonMainStreet.js';
import {mainLaneWidth,smoothMainLane} from '../world/BukchonStreetLayout.js';

export const ROOM_CAPACITY=8;
export const SEND_INTERVAL_MS=110;
export const SPAWN=Object.freeze({x:-3,z:-42,vx:0,vz:0});
const samples=smoothMainLane(MAIN_STREET_ROUTE.points);

export function onMainStreet(x,z) {
  if(!Number.isFinite(x)||!Number.isFinite(z)||z<-44.35||z>55.35)
    return false;
  let best=Infinity;
  for(let i=1;i<samples.length;i++) {
    const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
    best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  }
  return best<=mainLaneWidth(z)*.5+.39;
}

// Only movement is ever accepted. No chat, user-provided identifiers,
// room selections or arbitrary messages are part of this protocol.
export function sanitizePose(data) {
  if(!data||typeof data!=='object'||data.type!=='pose')return null;
  const {x,z,vx,vz}=data;
  if(![x,z,vx,vz].every(n=>typeof n==='number'&&Number.isFinite(n)))
    return null;
  if(!onMainStreet(x,z)||Math.hypot(vx,vz)>4.2)return null;
  return {x:Math.round(x*1000)/1000,z:Math.round(z*1000)/1000,
    vx:Math.round(vx*1000)/1000,vz:Math.round(vz*1000)/1000};
}

export function plausibleStep(previous,next,elapsedMs,first=false) {
  if(first)return true; // after reconnect, the walker may be anywhere on the lane
  const seconds=Math.max(0,Math.min(1.5,elapsedMs/1000));
  return Math.hypot(previous.x-next.x,previous.z-next.z)<=4.2*seconds+.35;
}
