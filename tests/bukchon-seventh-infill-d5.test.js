import test from 'node:test';
import assert from 'node:assert/strict';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {distanceToHanokFootprint,hanokFootprintsOverlap} from '../src/world/BukchonSeventhBuildings.js';

function world(){const prior=globalThis.document;globalThis.document={createElement:()=>({width:2048,height:2048,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};try{return createBukchonWorld();}finally{globalThis.document=prior;}}
test('D-5 infill closes both 7-gyeong edges with real varied solid compounds',()=>{
 const w=world(),d=w.seventhInfill;
 assert.ok(d.buildings.length>=7,'too many open lots remain');
 assert.ok(new Set(d.buildings.map(b=>b.side)).size===2,'only one loop edge was infilled');
 assert.ok(new Set(d.buildings.map(b=>b.kind)).size===4,'infill became repetitive');
 assert.ok(d.roofs===d.buildings.length&&d.retainingSteps>=d.buildings.length*3);
 assert.ok(d.wallRuns===d.buildings.length);
});
test('D-5 compounds preserve all paved collision clearances and original homes',()=>{
 const w=world(),lots=w.seventhInfill.buildings;
 for(const lot of lots){
   for(const path of w.paths){const half=(path.widthAt?path.widthAt(lot.z):path.width)*.5;const margin=Math.min(...path.samples.map(([x,z])=>distanceToHanokFootprint(x,z,lot)-half));assert.ok(margin>.61,'infill clips a walkable road: '+lot.id);}
   for(const home of [...w.houseSites,...w.seventhBuildings.buildings])assert.equal(hanokFootprintsOverlap(lot,home,.38),false,'infill overlaps home: '+lot.id);
 }
 assert.ok(w.vertexCount<900000,'infill exceeds mobile static-geometry budget');
});
