import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {createThirdPersonCamera} from '../src/controllers/ThirdPersonCamera.js';
import {
 SEVENTH_PHOTO_STATION,SEVENTH_PHOTO_RADIUS,SEVENTH_PHOTO_PITCH,
 SEVENTH_ROOF_PEEK_SEEDS,sampleRouteAtDistance,createSeventhPhotoSpot,
 nearSeventhPhotoSpot,planSeventhRoofPeeks
} from '../src/world/BukchonSeventhViewpoint.js';
import {
 hanokFootprintsOverlap,distanceToHanokFootprint
} from '../src/world/BukchonSeventhBuildings.js';
import {NAMSAN_TOWER} from '../src/world/NamsanLandmark.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function makeWorld(){
 const prior=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=prior;}
}
test('the 7-gyeong photographic station is reachable and never forces a teleport',()=>{
 const w=makeWorld(),spot=w.seventhViewpoint.spot;
 assert.equal(spot.id,'bukchon-view-7');
 assert.equal(spot.s,SEVENTH_PHOTO_STATION);
 assert.equal(spot.radius,SEVENTH_PHOTO_RADIUS);
 assert.equal(spot.pitch,SEVENTH_PHOTO_PITCH);
 assert.ok(w.distanceFromPath(spot.x,spot.z,w.paths[1])<.001);
 assert.ok(onMainStreet(spot.x,spot.z));
 assert.ok(nearSeventhPhotoSpot(spot.x,spot.z,spot));
 assert.ok(!nearSeventhPhotoSpot(spot.x+10,spot.z,spot));
 assert.ok(!nearSeventhPhotoSpot(Number.NaN,spot.z,spot));
 assert.ok(Math.abs(Math.atan2(Math.sin(spot.yaw-spot.roadYaw),
   Math.cos(spot.yaw-spot.roadYaw)))<=.111);
 assert.deepEqual(createSeventhPhotoSpot(w.paths[1]),spot);
 assert.deepEqual(sampleRouteAtDistance(w.paths[1].samples,spot.s),
   sampleRouteAtDistance(w.paths[1].samples,SEVENTH_PHOTO_STATION));
});

test('scenic roof peeks never intersect either path, the 20 originals or six new homes',()=>{
 const w=makeWorld(),v=w.seventhViewpoint;
 assert.equal(SEVENTH_ROOF_PEEK_SEEDS.length,3);
 assert.ok(v.roofPeeks.length>=2,'not enough authentic layered rooftops');
 const roofs=planSeventhRoofPeeks({path:w.paths[1],paths:w.paths,
   houses:[...w.houseSites,...w.seventhBuildings.buildings]});
 assert.deepEqual(v.roofPeeks,roofs);
 for(const roof of roofs){
   assert.ok(roof.clearance>.54);
   assert.ok(!onMainStreet(roof.x,roof.z));
   for(const old of [...w.houseSites,...w.seventhBuildings.buildings,...roofs]){
     if(roof===old)continue;
     assert.equal(hanokFootprintsOverlap(roof,old,.53),false,
       'roof intersects old building: '+roof.id);
   }
   for(const path of w.paths){
     let clearance=Infinity;
     for(const [x,z] of path.samples){
       const width=path.widthAt?path.widthAt(z):path.width;
       clearance=Math.min(clearance,distanceToHanokFootprint(x,z,roof)-width*.5);
     }
     assert.ok(clearance>.54,'roof clips paving: '+roof.id);
   }
 }
 assert.ok(v.roofFaces>=288);
 assert.equal(v.streetDetails,3);
 assert.ok(Number.isFinite(v.marker.x)&&Number.isFinite(v.marker.z));
 console.info('D4 7-gyeong roof layers:',JSON.stringify(roofs.map(p=>({
   id:p.id,side:p.side,x:p.x,z:p.z,clearance:p.clearance
 }))));
});

test('all 26 original hanoks, both paved roads, lighting and single mesh survive',()=>{
 const w=makeWorld();
 assert.equal(w.paths.length,2);
 assert.equal(w.houseSites.length,20);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.equal(w.nightFixtures.fixtures.length,23);
 assert.equal(w.seventhBuildings.lights.length,6);
 for(const road of w.paths)for(const [x,z] of road.samples)
   assert.ok(onMainStreet(x,z),'server rejects approved road');
 const geo=w.mesh.geometry;
 assert.ok(geo.getAttribute('position').array.every(Number.isFinite));
 assert.equal(geo.getAttribute('position').count,geo.getAttribute('nightEmission').count);
 assert.ok(w.vertexCount>700000&&w.vertexCount<850000,
   'photo geometry exceeds original mesh limit: '+w.vertexCount);
 console.info('D4 total mesh vertices:',w.vertexCount);
});

test('opt-in third-person composition keeps the actual Namsan skyline inside desktop and mobile camera',()=>{
 const w=makeWorld(),spot=w.seventhViewpoint.spot;
 for(const aspect of [16/9,390/844]){
   const camera=new THREE.PerspectiveCamera(57,aspect,.1,240);
   const follow=createThirdPersonCamera({
     camera,hill:w.hill,isWalkable:()=>true
   });
   follow.update({x:spot.x,z:spot.z,yaw:spot.yaw,
     pitch:spot.pitch,dt:.016,moving:false});
   camera.updateMatrixWorld();
   const tip=new THREE.Vector3(NAMSAN_TOWER.x,w.namsan.topY,
     NAMSAN_TOWER.z).project(camera);
   console.info('D4 tower screen x,y,z',aspect,tip.x,tip.y,tip.z);
   assert.ok(Number.isFinite(tip.x)&&Number.isFinite(tip.y));
   assert.ok(Math.abs(tip.x)<1,'skyline cropped on mobile / desktop');
   assert.ok(Math.abs(tip.y)<1,'tower too high for photo frame');
   assert.ok(tip.z>0&&tip.z<1);
 }
});

test('desktop and touch have photo compose plus PNG capture without moving the player',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(main,/function composeSeventhPhoto/);
 assert.match(main,/KeyF/);
 assert.match(main,/KeyP/);
 assert.match(main,/photo-save-btn/);
 assert.match(main,/bukchon-7gyeong-postcard\.png/);
 assert.match(main,/data-photo-spot/);
 assert.match(main,/state\.yaw=photoSpot\.yaw/);
 assert.match(main,/if\(state\.started\)multiplayer\.update\(motion\)/);
 assert.match(html,/id="photo-save-btn"/);
 assert.match(css,/\.photo-save/);
 assert.doesNotMatch(main,/state\.x=photoSpot\.x|state\.z=photoSpot\.z/);
});
