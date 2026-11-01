import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  SEOUL_BUILDINGS,SEOUL_VIEWPOINT,NAMSAN_VIEW_TARGET,
  projectedTowerAxis,skylineViewClearance,buildSeoulSkyline
} from '../src/world/SeoulSkyline.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {surfaceMaterialId,MATERIAL} from '../src/world/BukchonMaterials.js';

function captureSkyline(){
  const calls={boxes:[],faces:[]};
  const result=buildSeoulSkyline({
    box:(...a)=>calls.boxes.push(a),
    face:(...a)=>calls.faces.push(a)
  });
  return {calls,result};
}

function worldForTest(){
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=previous;}
}

test('39 varied Seoul buildings form three distinct depth layers and housing types',()=>{
  const {result}=captureSkyline();
  assert.equal(result.buildings,39);
  assert.equal(result.apartments,15);
  assert.equal(result.offices,7);
  assert.equal(result.mixed,17);
  assert.deepEqual(result.buildingsByDepth,[15,14,10]);
  assert.ok(result.windowPanels>1000);
  assert.ok(result.balconies>=130);
  assert.ok(result.roofDetails>150);
  assert.ok(result.frames>1300);
  assert.ok(new Set(result.layouts.map(b=>b.height)).size>16,
    'no skyline made from repeated identical cuboids');
  assert.ok(new Set(result.layouts.map(b=>b.w)).size>=5);
  assert.ok(new Set(result.layouts.map(b=>b.profile)).size===3);
});

test('landmark remains in a naturally irregular view gap, not a concrete wall',()=>{
  assert.equal(SEOUL_VIEWPOINT.z,-42);
  assert.equal(NAMSAN_VIEW_TARGET.z,158);
  for(const building of SEOUL_BUILDINGS){
    assert.ok(skylineViewClearance(building),
      'obstructs N Seoul Tower: '+JSON.stringify(building));
  }
  assert.ok(projectedTowerAxis(100)>5 && projectedTowerAxis(100)<15);
  const center=SEOUL_BUILDINGS.filter(b=>
    Math.abs(b[0]-projectedTowerAxis(b[1]))-b[2]*.5<8.8);
  assert.ok(center.length>=3,'keep lower irregular roofs along tower axis');
  assert.ok(center.every(b=>b[4]<=12));
});

test('apartment buildings have actual 3D balcony shelves, rooftop structures and recessed glazing',()=>{
  const {calls}=captureSkyline();
  const counts={};
  for(const b of calls.boxes){
    const color=b.at(-1);
    counts[color]=(counts[color]||0)+1;
    assert.ok(b.slice(0,6).every(Number.isFinite));
    assert.ok(b[3]>0&&b[4]>0&&b[5]>0);
  }
  for(const key of ['cityBalconySlab','cityBalconyRail','cityRoofHouse',
    'cityParapet','cityWindowFrame','cityUtility'])assert.ok(counts[key]>0,key);
  const colors=new Set(calls.faces.map(f=>f.at(-1)));
  assert.ok(colors.has('cityGlassBlue'));
  assert.ok(colors.has('cityGlassPale'));
  assert.ok(colors.has('cityGlassWarm'));
  assert.ok(calls.faces.every(args=>
    args.slice(0,5).every(v=>Array.isArray(v)&&v.every(Number.isFinite))));
  assert.equal(surfaceMaterialId('cityConcreteA'),MATERIAL.plaster);
  assert.equal(surfaceMaterialId('cityBalconySlab'),MATERIAL.plaster);
});

test('single existing world mesh retains Namsan, 25 houses, roads, no potted plants and shadow support',()=>{
  const world=worldForTest();
  assert.equal(world.skyline.buildings,39);
  assert.ok(world.namsan.topY>100);
  assert.equal(world.houseSites.length,20);
  assert.equal(world.paths.length,2);
  assert.equal('planters' in world.streetLife.counts,false);
  assert.ok(world.vertexCount>500000&&world.vertexCount<850000,
    'combined skyline must stay within the old shared-mesh budget');
  const positions=world.mesh.geometry.getAttribute('position');
  assert.ok(positions.array.every(Number.isFinite));
  assert.equal(positions.count,world.mesh.geometry.getAttribute('materialId').count);
  assert.equal(positions.count,world.mesh.geometry.getAttribute('contactAO').count);
  assert.match(world.material.fragmentShader,/getShadowMask/);
});

test('old repeated 3-row rectangle skyline is removed, preserving the future night-lighting boundary',()=>{
  const city=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  const skyline=readFileSync(new URL('../src/world/SeoulSkyline.js',import.meta.url),'utf8');
  assert.doesNotMatch(city,/for\(let row=0;row<3;row\+\+\)/);
  assert.match(city,/skylineStats=buildSeoulSkyline\(\{box,face\}\)/);
  assert.doesNotMatch(skyline,/\bnew THREE\./);
  assert.doesNotMatch(skyline,/https?:\/\//);
  assert.doesNotMatch(skyline,/\bplanter\b|\bflowerCoral\b/);
});
