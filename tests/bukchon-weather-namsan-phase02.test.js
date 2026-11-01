import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  NAMSAN_TOWER,NAMSAN_X_EXTENT,NAMSAN_SLOPE_Z,
  namsanRidgeHeight,namsanSurfaceHeight,buildNamsanLandmark
} from '../src/world/NamsanLandmark.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

function captureLandmark(){
  const data={faces:[],boxes:[]};
  const landmarks=buildNamsanLandmark({
    face:(...a)=>data.faces.push(a),
    box:(...a)=>data.boxes.push(a)
  });
  return {data,landmarks};
}

function buildWorld(){
  const previous=globalThis.document;
  globalThis.document={
    createElement:()=>({width:2048,height:2048,getContext:()=>({
      fillRect(){},strokeRect(){},fillText(){}
    })})
  };
  try{return createBukchonWorld();}
  finally{globalThis.document=previous;}
}

test('Namsan is an undulating continuous terrain, not a set of intersecting green balls',()=>{
  assert.equal(NAMSAN_SLOPE_Z.length,6);
  assert.ok(NAMSAN_X_EXTENT>=100);
  assert.ok(namsanRidgeHeight(NAMSAN_TOWER.x)>28);
  assert.ok(namsanRidgeHeight(-100)<15);
  assert.ok(namsanRidgeHeight(100)<17);
  const variations=[-100,-70,-40,-10,17,40,70,100].map(namsanRidgeHeight);
  assert.ok(new Set(variations.map(y=>y.toFixed(2))).size>=6);
  assert.ok(namsanSurfaceHeight(NAMSAN_TOWER.x,160)>namsanSurfaceHeight(NAMSAN_TOWER.x,124)+15);
  assert.ok(namsanSurfaceHeight(NAMSAN_TOWER.x,160)>namsanSurfaceHeight(NAMSAN_TOWER.x,181)+15);
});

test('tower has correct white shaft, broad glazed observation disc and red-white antenna',()=>{
  const {data,landmarks}=captureLandmark();
  assert.ok(landmarks.terrainFaces>=250);
  assert.ok(landmarks.towerFaces>=280);
  assert.ok(landmarks.topY>landmarks.summit+65);
  assert.ok(landmarks.topY<116);
  const colors=new Set([...data.faces,...data.boxes].map(row=>row.at(-1)));
  for(const required of ['namsanForest','namsanPine','namsanOlive',
    'towerIvory','towerConcrete','towerGlass','towerTrim','towerSilver','towerRed'])
    assert.ok(colors.has(required),'missing '+required);
  const towerDeck=data.faces.filter(row=>row.at(-1)==='towerGlass');
  assert.ok(towerDeck.length>=16,'observation windows should form an entire ring');
  const redMast=data.faces.filter(row=>row.at(-1)==='towerRed');
  assert.ok(redMast.length>=18,'broadcast antenna should have red banded segments');
  for(const args of [...data.faces,...data.boxes]){
    for(const a of args){
      if(typeof a==='number') assert.ok(Number.isFinite(a));
      if(Array.isArray(a))for(const n of a)assert.ok(Number.isFinite(n));
    }
  }
});

test('mountain and tower are built into existing one-draw-call world, preserving streets',()=>{
  const w=buildWorld();
  assert.ok(w.namsan && w.namsan.towerFaces>280);
  assert.equal(w.namsan.tower.x,NAMSAN_TOWER.x);
  assert.equal(w.namsan.tower.z,NAMSAN_TOWER.z);
  assert.equal(w.paths.length,3);
  assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
  assert.ok(w.houseSites.length>=25);
  assert.ok(w.vertexCount<850000);
  const p=w.mesh.geometry.getAttribute('position');
  assert.ok(p.array.every(Number.isFinite));
  assert.equal(w.mesh.geometry.getAttribute('materialId').count,p.count);
  assert.equal(w.mesh.geometry.getAttribute('contactAO').count,p.count);
});

test('no old spherical green mountain or stacked cylindrical proxy remains',()=>{
  const world=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  const landmark=readFileSync(new URL('../src/world/NamsanLandmark.js',import.meta.url),'utf8');
  assert.doesNotMatch(world,/sphere\(tx,16,tz,30,14,23/);
  assert.doesNotMatch(world,/cylinder\(tx,54,tz,4\.6,4\.9/);
  assert.match(world,/buildNamsanLandmark\(\{face,box\}\)/);
  assert.doesNotMatch(landmark,/\bsphere\s*\(/);
  assert.doesNotMatch(landmark,/https?:\/\//);
});
