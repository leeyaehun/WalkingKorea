import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {
  buildContinuousFrontages,FRONTAGE_HALF_SPAN,GAP_GATE
} from '../src/world/BukchonContinuousFrontage.js';
import {mainLaneWidth,sampleMainLaneAtZ} from '../src/world/BukchonStreetLayout.js';

function world(){
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=old;}
}

test('old west fork is enclosed by a real street-facing hanok, eastern fork gains a roofed gate',()=>{
  const w=world();
  assert.equal(w.paths.length,2);
  assert.equal(w.houseSites.length,20);
  assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
  assert.equal(w.houseSites.filter(h=>h.district).length,11);
  assert.equal(w.houseSites.filter(h=>h.infill).length,1);
  const home=w.houseSites.find(h=>h.infill);
  assert.equal(home.side,-1);
  assert.ok(home.laneZ>-16&&home.laneZ<-14);
  assert.equal(home.archetype,'gate');
  const entry={x:home.x+Math.sin(home.angle)*4.6,z:home.z-Math.cos(home.angle)*4.6};
  const road=w.distanceFromPath(entry.x,entry.z,w.paths[0]);
  assert.ok(road>mainLaneWidth(entry.z)*.5+.27);
  assert.equal(w.continuousFrontages.gates,1);
  assert.equal(w.continuousFrontages.gatePositions[0].side,1);
  assert.equal(w.continuousFrontages.gatePositions[0].z,GAP_GATE.z);
  assert.ok(w.continuousFrontages.gatePositions[0].roadClearance>.6);
});

test('stone+brick+hanok tile wall spans fill all external frontage gaps on both sides',()=>{
  const w=world(),f=w.continuousFrontages;
  assert.equal(typeof buildContinuousFrontages,'function');
  assert.equal(FRONTAGE_HALF_SPAN,3.58);
  assert.ok(f.wallSegments>=28,'main frontage stays enclosed apart from 7-gyeong entrance');
  assert.ok(f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+5.2>27&&f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+5.2<38);
  assert.ok(f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+f.existingConnectorMeters+5.2>48);
  assert.ok(f.bySide.west+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+5.2>15&&f.bySide.east>10);
  assert.ok(f.roadClearance>.55);
  assert.ok(f.runs.length>=10);
  assert.ok(f.runs.some(r=>r.side===-1&&r.fromZ<-19&&r.toZ>-19),
    'missing wall between west houses');
  assert.ok(f.runs.some(r=>r.side===1&&r.fromZ<-26.5&&r.toZ>-25.3),
    'missing east fork return wall');
  for(const run of f.runs){
    assert.ok(run.toZ>run.fromZ&&run.length>0);
    for(const t of [0,.25,.50,.75,1]){
      const z=run.fromZ+(run.toZ-run.fromZ)*t;
      const lane=sampleMainLaneAtZ(w.paths[0].samples,z);
      const offset=mainLaneWidth(z)*.5+.79;
      const x=lane.x+lane.nx*run.side*offset,
        zz=lane.z+lane.nz*run.side*offset;
      const clearance=w.distanceFromPath(x,zz,w.paths[0])-mainLaneWidth(zz)*.5;
      assert.ok(clearance>.55,'infill wall blocks walking route at z='+z);
    }
  }
});

test('new infill preserves building collision, night windows, downtown view and mesh budget',()=>{
  const w=world(),p=w.mesh.geometry.getAttribute('position');
  assert.ok(p.array.every(Number.isFinite));
  assert.ok(w.vertexCount<850000);
  assert.equal(p.count,w.mesh.geometry.getAttribute('materialId').count);
  assert.equal(p.count,w.mesh.geometry.getAttribute('nightEmission').count);
  assert.equal(w.nightFixtures.stats.hanokSconces,20);
  assert.equal(w.nightFixtures.stats.streetLamps,3);
  assert.equal(w.nightFixtures.fixtures.length,23);
  assert.equal(w.streetLife.houseCount,20);
  assert.equal('planters' in w.streetLife.counts,false);
  assert.equal(w.skyline.buildings,39);
  assert.ok(w.namsan.topY>100);
  const worldSource=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  assert.match(worldSource,/buildGapHanok\(\)/);
  assert.match(worldSource,/buildContinuousFrontages\(\{/);
  const source=readFileSync(new URL('../src/world/BukchonContinuousFrontage.js',import.meta.url),'utf8');
  for(const key of ['stoneMasonry','brickTerracotta','tileIndigo','gateWood'])
    assert.ok(source.includes(key),'missing Bukchon frontage material '+key);
  assert.doesNotMatch(source,/\bplanters\b|\bflowerCoral\b|\bnew THREE\.PointLight/);
  const girl=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(girl,/girl\.update\(/);
  assert.match(girl,/cameraRelativeDirection/);
});
