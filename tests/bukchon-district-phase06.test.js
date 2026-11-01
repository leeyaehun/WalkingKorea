import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {createHanokKit} from '../src/world/HanokKit.js';

function makeWorld(){
 const previous=globalThis.document;
 globalThis.document={
  createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})
 };
 try{return createBukchonWorld();}
 finally{globalThis.document=previous;}
}

test('plants, flower clusters and roadside fake trees have been removed, while skyline stays',()=>{
 const hanok=readFileSync(new URL('../src/world/HanokKit.js',import.meta.url),'utf8');
 const life=readFileSync(new URL('../src/world/BukchonStreetLife.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.doesNotMatch(hanok,/\bplanter\s*\(|\bshrub\b|\bpetals\b|\bflowerLilac\b/);
 assert.doesNotMatch(life,/\bnumPots\b|\bplanters\b|\bflowerCoral\b/);
 const street=world.split('function laneDecoration(){')[1].split('function hillsideBackground(){')[0];
 assert.doesNotMatch(street,/\bsphere\s*\(|\bsage\b|\bdeepGreen\b/);
 assert.match(world,/function hillsideBackground\(\)/,'keep distant landscape, not street plants');
});

test('single lane retains level house siting, facade orientation and materials',()=>{
 const w=makeWorld();
 const scenic=w.houseSites.filter(h=>h.scenic);
 const district=w.houseSites.filter(h=>h.district);
 assert.equal(scenic.length,8);
 assert.ok(district.length>=8,'all side lanes should have homes');
 assert.equal(w.houseSites.length,scenic.length+district.length);
 assert.deepEqual([...new Set(district.map(s=>s.routeIndex))].sort(),[0]);
 for(const h of district){
  assert.equal(h.scenic,false);
  assert.ok(h.roadWidth>2.7);
  assert.ok(h.index>=8);
  const z=h.z-Math.cos(h.angle)*4.7;
  const x=h.x+Math.sin(h.angle)*4.7;
  const near=Math.min(...w.paths.map(p=>
    w.distanceFromPath(x,z,p)-(p.widthAt?p.widthAt(z):p.width)*.5));
  assert.ok(near>.14,'house gate intrudes in another lane: '+h.index);
 }
 assert.equal(w.paths.length,1);
 assert.equal(w.frontage.count,3);
 assert.ok(w.districtFrontage.count>=1,'branch facade continuity is missing');
 for(const join of w.districtFrontage.segments) {
  assert.ok(join.routeIndex===0);
  assert.ok(join.roadDistance>=1.6);
  assert.ok(join.length>0.1&&join.length<4.81);
 }
});

test('district receives street-life details but no new plants',()=>{
 const w=makeWorld(),d=w.streetLife;
 assert.equal(d.houseCount,w.houseSites.length);
 assert.equal(d.entries.length,d.houseCount);
 assert.equal(d.counts.downspouts,d.houseCount);
 assert.equal(d.counts.electricMeters,d.houseCount);
 assert.ok(d.counts.plaques>=12);
 assert.ok(d.counts.doorsteps>=12);
 assert.equal('planters' in d.counts,false);
 assert.ok(d.entries.some(e=>!e.scenic && e.details.includes('plaques')));
 assert.equal(d.counts.wires,4);
 assert.equal(d.counts.poles,4);
});

test('district roof LOD has fewer triangles and the combined static mesh remains affordable',()=>{
 const sample=quality=>{
  const c={faces:0,boxes:0};
  const fn=()=>c.faces++,box=()=>c.boxes++;
  const kit=createHanokKit({
    face:fn,box,sphere:()=>{},cylinder:()=>{},textured:()=>{},
    signs:{hanokCafe:[0,0,1,1],hanokAtelier:[0,0,1,1]}
  });
  kit.build(0,2,quality);
  return c;
 };
 const hero=sample('hero'),district=sample('district');
 assert.ok(hero.faces>district.faces+100,'district roofs should be reduced complexity');
 const w=makeWorld();
 const g=w.mesh.geometry;
 const position=g.getAttribute('position');
 assert.ok(position.array.every(Number.isFinite));
 assert.equal(g.getAttribute('materialId').count,position.count);
 assert.equal(g.getAttribute('contactAO').count,position.count);
 assert.ok(w.vertexCount<850000,'keep the static one-draw-call city under vertex budget');
 assert.ok(w.vertexCount>500000,'retain architectural details at district scale');
});
