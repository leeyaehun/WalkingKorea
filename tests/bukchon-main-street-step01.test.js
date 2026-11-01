import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAIN_STREET_ROUTE,MAIN_STREET_DISCOVERIES} from '../src/world/BukchonMainStreet.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

function makeWorld(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}
const onStreet=(w,x,z)=>{
 const p=w.paths[0],width=p.widthAt?p.widthAt(z):p.width;
 return w.distanceFromPath(x,z,p)<width*.5+.05;
};

test('only ONE continuous asphalt main route exists from uphill overlook to end',()=>{
 const w=makeWorld();
 assert.equal(w.paths.length,1);
 assert.equal(w.paths[0].name,MAIN_STREET_ROUTE.name);
 assert.equal(w.paths[0].points.length,MAIN_STREET_ROUTE.points.length);
 assert.ok(w.paths[0].samples.length>30);
 assert.deepEqual(w.paths[0].points[0],[-1,55]);
 assert.deepEqual(w.paths[0].points.at(-1),[-3,-44]);
 assert.ok(w.paths[0].samples.every(([x,z])=>onStreet(w,x,z)));
 for(let i=1;i<w.paths[0].samples.length;i++){
   const a=w.paths[0].samples[i-1],b=w.paths[0].samples[i];
   assert.ok(b[1]<=a[1]+.00001,'main street must never double back');
   assert.ok(Math.hypot(b[0]-a[0],b[1]-a[1])<5,
     'continuous lane samples must not leave a gap');
 }
 assert.ok(w.paving.tiles>100);
 assert.ok(w.paving.drains>0);
});

test('former east and west shortcuts are not walkable or paved',()=>{
 const w=makeWorld();
 for(const [x,z] of [[-24,-8],[-19,2],[-12,5],[17,7],[16,16],[19,-17],[10,-24]]){
   assert.ok(!onStreet(w,x,z),'former branch still walkable at '+x+','+z);
 }
 const src=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/name:'서쪽 담장길'|name:'동쪽 공방길'/);
 assert.match(src,/const paths=\[\{\.\.\.MAIN_STREET_ROUTE/);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/return paths\.some\(p=>distanceFromPath\(x,z,p\)</);
});

test('all six places, spawn and end stay on the one reachable street',()=>{
 const w=makeWorld(),ids=new Set();
 assert.equal(MAIN_STREET_DISCOVERIES.length,6);
 for(const place of MAIN_STREET_DISCOVERIES){
   assert.ok(onStreet(w,place.x,place.z),place.name+' is inaccessible');
   assert.ok(!ids.has(place.id),'duplicate place ID');
   ids.add(place.id);
 }
 assert.ok(onStreet(w,-3,-42),'player spawn off street');
 assert.ok(onStreet(w,-1,55),'street lower endpoint off road');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/const locations=MAIN_STREET_DISCOVERIES/);
 assert.match(main,/girl\.update\(/);
 assert.match(main,/cameraRelativeDirection/);
});

test('scenic houses retained; off-route houses and their lanterns removed',()=>{
 const w=makeWorld();
 assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
 assert.equal(w.houseSites.filter(h=>h.district).length,11);
 assert.equal(w.houseSites.length,20);
 assert.ok(w.houseSites.every(h=>!h.district||h.routeIndex===0));
 assert.equal(w.nightFixtures.stats.hanokSconces,20);
 assert.equal(w.nightFixtures.stats.streetLamps,3);
 assert.equal(w.nightFixtures.fixtures.length,23);
 assert.equal(w.skyline.buildings,39);
 assert.ok(w.namsan.topY>100);
 assert.equal('planters' in w.streetLife.counts,false);
 assert.ok(w.vertexCount>500000&&w.vertexCount<850000);
 const g=w.mesh.geometry,p=g.getAttribute('position');
 assert.ok(p.array.every(Number.isFinite));
 assert.equal(p.count,g.getAttribute('nightEmission').count);
});
