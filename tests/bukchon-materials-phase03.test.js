import test from 'node:test';
import assert from 'node:assert/strict';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {surfaceMaterialId,surfaceCoordinates,MATERIAL,MATERIAL_GLSL}
  from '../src/world/BukchonMaterials.js';

function worldForTest(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,getContext:()=>({
   fillRect(){},strokeRect(){},fillText(){}
 })})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}

test('surface classification preserves sign decals and separates architectural families',()=>{
 for(const k of ['tileDark','tileRidge','tileIndigo','tileEnd'])
  assert.equal(surfaceMaterialId(k),MATERIAL.giwa);
 for(const k of ['timber','timberLight','woodShade','gateWood'])
  assert.equal(surfaceMaterialId(k),MATERIAL.wood);
 for(const k of ['plaster','mortar'])assert.equal(surfaceMaterialId(k),MATERIAL.plaster);
 for(const k of ['stoneFoundation','paveStone','edgeStone'])assert.equal(surfaceMaterialId(k),MATERIAL.granite);
 assert.equal(surfaceMaterialId('brickTerracotta'),MATERIAL.brick);
 assert.equal(surfaceMaterialId('asphalt'),MATERIAL.asphalt);
 assert.equal(surfaceMaterialId('paper'),MATERIAL.paper);
 assert.equal(surfaceMaterialId('white'),MATERIAL.plain);
 assert.equal(surfaceMaterialId([.8,.7,.6]),MATERIAL.plain);
});

test('material UV selects XZ roof, XY facade and ZY side walls',()=>{
 assert.deepEqual(surfaceCoordinates([2,3,4],[0,1,0]),[2,4]);
 assert.deepEqual(surfaceCoordinates([2,3,4],[0,0,-1]),[2,3]);
 assert.deepEqual(surfaceCoordinates([2,3,4],[1,0,0]),[4,3]);
 assert.deepEqual(surfaceCoordinates([2,3,4],[-.1,.91,.4]),[2,4]);
});

test('architectural grain and roughness have dedicated shader branches',()=>{
 assert.match(MATERIAL_GLSL,/aged charcoal giwa/i);
 assert.match(MATERIAL_GLSL,/warm wood/i);
 assert.match(MATERIAL_GLSL,/lime plaster/i);
 assert.match(MATERIAL_GLSL,/granite/i);
 assert.match(MATERIAL_GLSL,/fired clay brick/i);
 assert.match(MATERIAL_GLSL,/bitumen/i);
 assert.match(MATERIAL_GLSL,/hanji/i);
 assert.doesNotMatch(MATERIAL_GLSL,/https?:\/\//);
});

test('world uses single geometry but conveys seven material classes as vertex attributes',()=>{
 const world=worldForTest();
 const geometry=world.mesh.geometry;
 const pos=geometry.getAttribute('position'),ids=geometry.getAttribute('materialId');
 const coord=geometry.getAttribute('surfaceUV'),atlas=geometry.getAttribute('uv');
 assert.equal(ids.count,pos.count);
 assert.equal(coord.count,pos.count);
 assert.equal(atlas.count,pos.count);
 const used=new Map();
 for(let i=0;i<ids.count;i++) {
  const id=ids.getX(i);
  used.set(id,(used.get(id)||0)+1);
  assert.ok(Number.isInteger(id)&&id>=0&&id<=7);
  assert.ok(Number.isFinite(coord.getX(i))&&Number.isFinite(coord.getY(i)));
 }
 for(let id=0;id<=7;id++)
  assert.ok(used.get(id)>0,'material ID '+id+' absent from generated world');
 assert.ok(world.mesh.material.fragmentShader.includes('bukchonMaterial'));
 assert.ok(world.mesh.material.vertexShader.includes('surfaceUV'));
 assert.ok(world.mesh.material.fragmentShader.includes('uNight'));
 assert.equal(world.houseSites.filter(h=>h.scenic).length,8);
 assert.equal(world.paths.length,3);
});
