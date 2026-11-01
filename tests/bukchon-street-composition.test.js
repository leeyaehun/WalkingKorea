import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {mainLaneWidth,scenicHillLift,scenicHouseSites,SCENIC_TOP_Z,SCENIC_BOTTOM_Z}
  from '../src/world/BukchonStreetLayout.js';

function buildWorld(){
 const previous=globalThis.document;
 const context={fillRect(){},strokeRect(){},fillText(){}};
 globalThis.document={
  createElement:()=>({width:2048,height:2048,getContext:()=>context})
 };
 try{return createBukchonWorld();}
 finally{globalThis.document=previous;}
}

test('long village road has continuous restrained width, with a narrow scenic midpoint',()=>{
 assert.equal(SCENIC_BOTTOM_Z-SCENIC_TOP_Z,40);
 assert.ok(mainLaneWidth(-24)>3.02 && mainLaneWidth(-24)<3.06);
 assert.ok(Math.abs(mainLaneWidth(-44)-3.24)<.001);
 assert.ok(mainLaneWidth(-4)>3.26 && mainLaneWidth(-4)<3.28);
 for(let z=-50;z<=5;z+=.5) {
  assert.ok(mainLaneWidth(z)>=3.02 && mainLaneWidth(z)<=3.34);
 }
});

test('grade is continuously descending and blends into the older paths',()=>{
 assert.equal(scenicHillLift(-44),1.35);
 assert.equal(scenicHillLift(-4),0);
 for(let z=-43.9;z<=-4;z+=.5){
  assert.ok(scenicHillLift(z+.05)<=scenicHillLift(z)+1e-8);
 }
 // The gradient goes to zero at both ends: no abrupt ramp/step there.
 for(const z of [-44,-4]) {
  const left=(scenicHillLift(z)-scenicHillLift(z-.001))/.001;
  const right=(scenicHillLift(z+.001)-scenicHillLift(z))/.001;
  assert.ok(Math.abs(left-right)<.0001);
 }
});

test('eight hand-placed hanoks frame the first 40m without overlapping',()=>{
 const world=buildWorld();
 const scenic=world.houseSites.filter(s=>s.scenic);
 assert.equal(scenic.length,8);
 assert.ok(world.houseSites.length>scenic.length);
 assert.equal(world.paths.length,2);
 for(const house of scenic) {
  assert.ok(house.roadWidth>=2.95 && house.roadWidth<=3.35);
  assert.ok(Number.isFinite(house.angle));
  const siteDistance=world.distanceFromPath(house.x,house.z,world.paths[0]);
  // The building centre is well outside player road collision.
  assert.ok(siteDistance>5.7,siteDistance.toFixed(3));
  const gateX=house.x+Math.sin(house.angle)*4.6;
  const gateZ=house.z-Math.cos(house.angle)*4.6;
  const gateDistance=world.distanceFromPath(gateX,gateZ,world.paths[0]);
  assert.ok(gateDistance>=house.roadWidth*.5-.12,
    `gate overlaps road ${gateDistance}`);
 }
 for(let i=0;i<world.houseSites.length;i++){
  for(let j=0;j<i;j++){
   const a=world.houseSites[i],b=world.houseSites[j];
   if(a.scenic||b.scenic){
    const separation=Math.hypot(a.x-b.x,a.z-b.z);
    assert.ok(separation>7.6,`overlapping house centres: ${i} / ${j}: ${separation}`);
   }
  }
 }
 // Historical branch junction coordinates now lie on the sole gentle road.
 assert.ok(world.distanceFromPath(-2.7,-24,world.paths[0])<.35);
 assert.ok(world.distanceFromPath(-24,-8,world.paths[0])>8);
 assert.ok(world.distanceFromPath(-2.6,-14,world.paths[0])<.35);
 assert.ok(world.distanceFromPath(17,7,world.paths[0])>8);
 const drop=world.hill(-3,-44)-world.hill(-3,-4);
 assert.ok(drop>3.5 && drop<4.6, `downhill change ${drop}`);
 assert.ok(world.distanceFromPath(-3,-42,world.paths[0])<.4);
 assert.ok(world.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
});

test('authored house gaps are identified for Step 03 frontage infill',()=>{
 const world=buildWorld(), row=scenicHouseSites(world.paths[0].samples);
 // Stage 03 can fill the two gaps after the street silhouette is final.
 const west=row.filter(s=>s.side<0);
 const east=row.filter(s=>s.side>0);
 for(const site of west)assert.ok(Math.abs(site.z+14)>5.0,`west branch blocked ${site.z}`);
 for(const site of east)assert.ok(Math.abs(site.z+24)>5.0,`east branch blocked ${site.z}`);
});
