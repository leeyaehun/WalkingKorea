import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {buildFrontageConnectors} from '../src/world/BukchonFrontage.js';
import {buildPavedAlleys} from '../src/world/BukchonPaving.js';

function world(){
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=old;}
}

test('original connector grey plinth has NO coplanar overlapping plaster face',()=>{
  const w=world(),faces=[];
  const r=buildFrontageConnectors({
    houses:w.houseSites,face:(...v)=>faces.push(v),
    hill:w.hill,distanceFromPath:w.distanceFromPath,
    mainPath:w.paths[0],paths:w.paths
  });
  assert.equal(r.count,3);
  const front=faces.filter(f=>f[5]==='plaster');
  const base=faces.filter(f=>f[5]==='stoneFoundation');
  assert.equal(front.length,r.count*2);
  assert.equal(base.length,r.count*2);
  for(let i=0;i<front.length;i++){
    const p=front[i],g=base[i];
    // Both wall endpoints sit at different elevations on the hill.
    // Compare vertical intervals AT THE SAME ENDPOINT, not the global
    // low of one sloping quad to the high of another.
    for(const [upper,lower] of [[p[0],g[3]],[p[1],g[2]]]){
      assert.ok(Math.abs(upper[1]-lower[1])<1e-6,
        'two surfaces must touch ONLY along their shared y edge');
    }
    assert.ok(p[3][1]>g[0][1]&&p[2][1]>g[1][1]);
  }
  const src=readFileSync(new URL('../src/world/BukchonFrontage.js',import.meta.url),'utf8');
  assert.match(src,/polygon\(plinthF0,plinthF1,topF1,topF0/);
  assert.doesNotMatch(src,/polygon\(front0,front1,topF1,topF0/);
});

test('continuous frontage deliberately omits spans already covered by original walls',()=>{
  const w=world(),f=w.continuousFrontages;
  const connectors=[...w.frontage.segments,...w.districtFrontage.segments];
  assert.equal(f.reservedConnectorSpans.length,connectors.length);
  assert.ok(f.existingConnectorMeters>20&&f.existingConnectorMeters<23);
  assert.ok(f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+5.2>27&&f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+5.2<38);
  assert.ok(f.coveredMeters+w.fiveGyeongApproach.length+w.fortySevenReturnWall.length+f.existingConnectorMeters+5.2>48);
  for(const run of f.runs)for(const reserved of f.reservedConnectorSpans){
    if(run.side!==reserved.side)continue;
    const overlap=Math.min(run.toZ,reserved.end)-
      Math.max(run.fromZ,reserved.begin);
    assert.ok(overlap<=1e-5,
      'duplicate coplanar facade at route '+run.fromZ+'..'+run.toZ);
  }
  assert.ok(f.roadClearance>.55);
  assert.equal(f.gates,1);
  assert.equal(w.paths.length,2);
});

test('asphalt, granite shoulders, iron drains and end thresholds have separated depths',()=>{
  const w=world(),faces=[];
  const metrics=buildPavedAlleys({
    paths:w.paths,hill:w.hill,face:(...f)=>faces.push(f)
  });
  assert.ok(metrics.shoulderMeters>195&&metrics.shoulderMeters<201);
  assert.equal(metrics.endCaps,2);
  assert.ok(metrics.tiles>500,'main asphalt plus narrower 7-gyeong stone slabs');
  assert.ok(metrics.drains>20);
  const bands={};
  for(const f of faces){
    const col=f[5];
    if(!bands[col])bands[col]=[];
    for(const p of f.slice(0,4)){
      bands[col].push(p[1]-w.hill(p[0],p[2]));
    }
  }
  const average=key=>{
    const arr=bands[key];
    assert.ok(arr?.length>0,'no '+key+' built');
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  };
  const grout=average('paveGrout'),asphalt=average('asphalt');
  const shoulder=average('edgeStoneLight'),kerb=average('paveJoint');
  const drain=average('drainIron'),grill=average('drainGrill');
  assert.ok(asphalt-grout>.045,'road asphalt and base are too close');
  assert.ok(shoulder>grout,'stone footpaths sit above terrain');
  assert.ok(kerb-asphalt>.008,'kerb must be visibly raised above bitumen');
  assert.ok(drain-asphalt>.015,'drain iron must sit above bitumen');
  assert.ok(grill-drain>.007,'grill must sit above drain frame');
  const landings=faces.filter(f=>f[5]==='paveStone');
  assert.ok(landings.length>=2,'main end landings remain alongside new alley slab tiles');
  assert.ok(landings.some(f=>f.slice(0,4).some(p=>p[2]<-44.1)));
  assert.ok(landings.some(f=>f.slice(0,4).some(p=>p[2]>55.1)));
  assert.equal(w.paths[0].points.length,11,'visual endcaps must not extend playable road');
});

test('combined world retains houses, controls, weather, single road, finite geometry',()=>{
  const w=world();
  assert.equal(w.paths.length,2);
  assert.equal(w.houseSites.length,20);
  assert.equal(w.skyline.buildings,39);
  assert.equal(w.nightFixtures.fixtures.length,23);
  assert.equal('planters' in w.streetLife.counts,false);
  assert.ok(w.vertexCount<850000);
  const g=w.mesh.geometry;
  assert.ok(g.getAttribute('position').array.every(Number.isFinite));
  assert.equal(g.getAttribute('position').count,g.getAttribute('nightEmission').count);
  const src=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  assert.match(src,/groundTile\(x\+2\.5,z\+2\.5,2\.5,'stoneWarm'\)/);
  assert.doesNotMatch(src,/\(x\+z\)%3===0\?'stoneWarm':'muted'/);
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/girl\.update\(/);
  assert.match(main,/cameraRelativeDirection/);
});
