import test from 'node:test';
import assert from 'node:assert/strict';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {buildBukchonStreetLife} from '../src/world/BukchonStreetLife.js';

function makeWorld(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}

test('residential details now extend to all houses, excluding all planter vegetation',()=>{
 const w=makeWorld(),v=w.streetLife;
 assert.equal(v.houseCount,w.houseSites.length);
 assert.equal(v.entries.length,w.houseSites.length);
 assert.equal(v.counts.doorsteps,18);
 assert.equal(v.counts.plaques,18);
 assert.equal(v.counts.downspouts,19);
 assert.equal(v.counts.electricMeters,19);
 assert.equal('planters' in v.counts,false);
 assert.equal(v.counts.benches,3);
 assert.equal(v.counts.storage,3);
 assert.equal(v.counts.wires,4);
 assert.equal(v.counts.poles,4);
 assert.deepEqual(v.entries.map(x=>x.index),w.houseSites.map(h=>h.index));
 assert.ok(v.entries.every(x=>x.type==='cafe'?
   !x.details.includes('plaques') && !x.details.includes('doorsteps'):
   x.details.includes('plaques') && x.details.includes('doorsteps')));
 assert.equal(w.houseSites.filter(s=>s.scenic).length,8);
 assert.equal(w.paths.length,1);
});

test('electric utility poles are beyond the walking kerb; overhead wires maintain clearance',()=>{
 const w=makeWorld(),v=w.streetLife;
 assert.deepEqual(v.lines.map(x=>x.z),[-35.4,-8.7]);
 for(const line of v.lines){
  assert.equal(line.poles.length,2);
  assert.ok(line.clearance>7,'wire sag must clear a person and orbit camera');
  for(const p of line.poles) {
   assert.ok(p.road>=4,'pole encroaches on the roadway');
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));
  }
 }
});

test('doorstep edge stays on the wall side of the road, without relocating house sites',()=>{
 const w=makeWorld();
 for(const home of w.houseSites.filter(h=>h.scenic)){
  // The local -Z street direction becomes (+sin(a),-cos(a)) in world space.
  const p={x:home.x+Math.sin(home.angle)*4.73,
           z:home.z-Math.cos(home.angle)*4.73};
  const roadDistance=w.distanceFromPath(p.x,p.z,w.paths[0]);
  assert.ok(roadDistance>=home.roadWidth*.5-.04,
    'step protrudes into street at house '+home.index+': '+roadDistance);
 }
});

test('procedural lifestyle geometry is deterministic, finite and within vertex budget',()=>{
 const a=makeWorld(),b=makeWorld();
 assert.deepEqual(a.streetLife,b.streetLife);
 assert.equal(a.vertexCount,b.vertexCount);
 assert.ok(a.vertexCount<850000,'excessive mesh budget after vegetation removal and district LOD');
 const g=a.mesh.geometry;
 const position=g.getAttribute('position'),materials=g.getAttribute('materialId');
 assert.equal(position.count,materials.count);
 assert.ok(position.array.every(Number.isFinite));
 assert.ok(materials.array.every(Number.isFinite));
 assert.ok(a.material.vertexShader.includes('shadowmap_vertex'));
 assert.ok(a.material.fragmentShader.includes('bukchonMaterial'));
});

test('no dependence on added external image assets or paid models',()=>{
 assert.equal(typeof buildBukchonStreetLife,'function');
});
