import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {
 SEVENTH_HANOK_DESIGNS,SEVENTH_HOUSE_FOOTPRINT,
 hanokFootprintsOverlap,distanceToHanokFootprint,planSeventhHanokSites
} from '../src/world/BukchonSeventhBuildings.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function makeWorld(){
 const prior=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=prior;}
}
test('D-3 has all six unique physical hanok archetypes along one 7-gyeong loop',()=>{
 const w=makeWorld(),b=w.seventhBuildings;
 assert.ok(b,'new buildings were not added to world');
 assert.equal(b.buildings.length,6);
 assert.equal(new Set(b.buildings.map(h=>h.style)).size,6);
 assert.deepEqual(b.styles,SEVENTH_HANOK_DESIGNS.map(d=>d.style));
 assert.deepEqual(b.buildings.map(h=>h.id),SEVENTH_HANOK_DESIGNS.map(d=>d.id));
 assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
 assert.equal(w.houseSites.length,20,'existing 5/6-gyeong homes must remain');
 assert.equal(w.nightFixtures.stats.hanokSconces,20);
 assert.equal(w.nightFixtures.stats.streetLamps,3);
 assert.equal(w.nightFixtures.fixtures.length,23);
 assert.ok(b.roofs>=7,'corner house should have two independent roof silhouettes');
 assert.ok(b.windows>=10,'traditional wooden lattice facades not rendered');
 assert.ok(b.gates>=6,'not enough recognizable entry portals');
 assert.ok(b.stoneCourses>=10,'street walls need readable stone/brick patterns');
 assert.ok(b.lanterns>=5,'no lived-in detail near the doorways');
 console.log('D-3 buildings',
   b.buildings.map(h=>[h.id,h.style,h.s.toFixed(2),h.side,h.x.toFixed(2),h.z.toFixed(2),h.clearance.toFixed(2)]));
});
test('every new hanok foundation is outside both roads and original 20 home lots',()=>{
 const w=makeWorld(),sites=w.seventhBuildings.buildings;
 for(const h of sites){
   assert.ok(h.s>=10&&h.s<=73);
   assert.ok(h.clearance>.26,'new building clips road: '+h.id);
   assert.equal(h.width,SEVENTH_HOUSE_FOOTPRINT.width);
   assert.equal(h.depth,SEVENTH_HOUSE_FOOTPRINT.depth);
   for(const old of w.houseSites)
     assert.equal(hanokFootprintsOverlap(h,old,.26),false,
       'new house overlaps main-street house '+h.id+' / '+old.index);
   for(const other of sites){
     if(h===other)continue;
     assert.equal(hanokFootprintsOverlap(h,other,.4),false,'two new houses overlap');
   }
   // Property is not itself walkable; a player never spawns inside a home.
   assert.equal(onMainStreet(h.x,h.z),false,'house is on road '+h.id);
   // Road clearance must be measured against the entire oriented area,
   // not just the house center.
   for(const path of w.paths){
     const half=(path.widthAt?path.widthAt(path.samples[0][1]):path.width)*.5;
     const margin=Math.min(...path.samples.map(([x,z])=>
       distanceToHanokFootprint(x,z,h)-half));
     assert.ok(margin>.26,'road runs through footprint '+h.id);
   }
 }
});
test('D-3 unique facades replace generic wall spans rather than flickering over them',()=>{
 const w=makeWorld(),windows=w.seventhBuildings.frontageSpans;
 assert.equal(w.seventhLoopWalls.reservedFrontages.length,6);
 assert.equal(windows.length,6);
 for(const span of windows){
   assert.ok(span.to-span.from>7);
   assert.ok(span.from>8&&span.to<w.seventhLoopWalls.length-8,
     'a house obscures one of the two loop entrances');
   assert.ok([-1,1].includes(span.side));
 }
 // All unreserved segments retain D-C stone/brick route enclosure.
 assert.ok(w.seventhLoopWalls.segments>90,
   'side walls were accidentally removed beyond house entrances');
 assert.ok(w.seventhLoopWalls.segments<230,
   'generic stone wall was not cut away for the new hanok buildings');
 const worldSource=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.match(worldSource,/buildSeventhHanoks/);
 assert.match(worldSource,/reservedFrontages:seventhBuildings\.frontageSpans/);
});
test('all pavement stays walkable in multiplayer and renderer remains under budget',()=>{
 const w=makeWorld();
 for(const path of w.paths)
   for(const [x,z] of path.samples)
     assert.equal(onMainStreet(x,z),true,'server rejects existing paving');
 const geo=w.mesh.geometry;
 assert.ok(geo.getAttribute('position').array.every(Number.isFinite));
 assert.equal(geo.getAttribute('position').count,geo.getAttribute('materialId').count);
 assert.equal(geo.getAttribute('position').count,geo.getAttribute('nightEmission').count);
 assert.ok(w.vertexCount>690000,'building geometry failed to appear');
 assert.ok(w.vertexCount<850000,'D-3 exceeded static city vertex budget');
});
test('siting remains deterministic across world reloads',()=>{
 const a=makeWorld(),b=makeWorld();
 assert.deepEqual(
   a.seventhBuildings.buildings.map(h=>[h.id,h.s,h.side,h.x,h.z]),
   b.seventhBuildings.buildings.map(h=>[h.id,h.s,h.side,h.x,h.z]));
 const probe=planSeventhHanokSites({path:a.paths[1],paths:a.paths,existingHouses:a.houseSites});
 assert.deepEqual(probe.buildings,a.seventhBuildings.buildings);
});
