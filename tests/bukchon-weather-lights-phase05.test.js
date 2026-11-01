import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {
  MAX_VISIBLE_NIGHT_LIGHTS,STREET_LIGHT_STATIONS,nightEmissionClass,
  createBukchonNightLights
} from '../src/world/BukchonNightLighting.js';

function world(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}

test('all house sconces and three roadside lamps stay out of walking lanes',()=>{
 const w=world(),n=w.nightFixtures;
 assert.equal(n.stats.hanokSconces,19);
 assert.equal(n.stats.streetLamps,3);
 assert.equal(n.fixtures.length,22);
 assert.deepEqual(STREET_LIGHT_STATIONS,[-36.5,-26.8,-6.4]);
 assert.equal(n.fixtures.filter(x=>x.type==='hanok').length,w.houseSites.length);
 for(const l of n.fixtures){
  assert.ok(Number.isFinite(l.x)&&Number.isFinite(l.z)&&Number.isFinite(l.y));
  assert.ok(l.radius>=7&&l.radius<10);
  if(l.type==='street'){
    assert.ok(l.y>w.hill(l.x,l.z)+3.9);
    for(const path of w.paths) {
      const dist=w.distanceFromPath(l.x,l.z,path);
      assert.ok(dist>(path.widthAt?path.widthAt(l.z):path.width)*.5+.29);
    }
  }
 }
 assert.equal(w.paths.length,1);
 assert.equal(w.houseSites.length,19);
 assert.equal('planters' in w.streetLife.counts,false);
});

test('daytime shader colors remain while nighttime windows illuminate in a fixed, sparse pattern',()=>{
 const w=world(),g=w.mesh.geometry;
 const pos=g.getAttribute('position');
 const ids=g.getAttribute('nightEmission');
 assert.equal(pos.count,ids.count);
 assert.equal(pos.count,g.getAttribute('materialId').count);
 const counts=new Map();
 for(const v of ids.array)counts.set(v,(counts.get(v)||0)+1);
 for(const id of [0,1,2,3,4])assert.ok(counts.get(id)>0,'missing emission class '+id);
 assert.ok((counts.get(1)+counts.get(2))>1200);
 assert.equal(nightEmissionClass('cityGlassBlue'),0);
 assert.equal(nightEmissionClass('cityLitWindowWarm'),1);
 assert.equal(nightEmissionClass('cityLitWindowCool'),2);
 assert.equal(nightEmissionClass('warmLight'),3);
 assert.equal(nightEmissionClass('lampGlobe'),3);
 assert.ok(nightEmissionClass('hanokPaperWindow',{x:4,z:7})===0||
   nightEmissionClass('hanokPaperWindow',{x:4,z:7})===4);
 assert.equal(nightEmissionClass('hanokPaperWindow'),0);
 assert.match(w.material.fragmentShader,/col\+=glow\*uNight/);
 assert.match(w.material.fragmentShader,/col\+=vec3\(\.67,\.39,\.17\)\*pool/);
 assert.match(w.material.fragmentShader,/for\(int i=0;i<8;i\+\+\)/);
 assert.ok(w.vertexCount<850000);
});

test('eight-nearest local pools update when walking, turn off in daytime, and never add scene lights',()=>{
 const w=world(),u=w.material.uniforms.uNightLampPositions;
 const manager=createBukchonNightLights({fixtures:w.nightFixtures.fixtures,uniform:u});
 assert.equal(MAX_VISIBLE_NIGHT_LIGHTS,8);
 manager.update(-3,-42,true);
 const on=Array.from(u.value);
 assert.equal(on.length,32);
 assert.ok(on.filter((_,i)=>i%4===3&&_>0).length===8);
 assert.ok(on.some(v=>v>0));
 assert.equal(manager.getStatus().updates,1);
 manager.update(-3,-42,true);
 assert.equal(manager.getStatus().updates,1);
 manager.update(-9,-31,true);
 assert.equal(manager.getStatus().updates,2);
 manager.update(-9,-31,false);
 assert.ok(Array.from(u.value).every(v=>v===0));
 assert.equal(manager.getStatus().updates,3);
 const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(source,/nightLights\.update\(state\.x,state\.z,state\.night\)/);
 assert.match(source,/lighting\.update\(\{x:state\.x,z:state\.z,hill,night:state\.night\}\)/);
 assert.match(source,/createThirdPersonCamera/);
 assert.doesNotMatch(source,/new THREE\.PointLight/);
});

test('Seoul occupied-window pattern is deterministic and no vegetation is reintroduced',()=>{
 const skyline=readFileSync(new URL('../src/world/SeoulSkyline.js',import.meta.url),'utf8');
 const hanok=readFileSync(new URL('../src/world/HanokKit.js',import.meta.url),'utf8');
 const night=readFileSync(new URL('../src/world/BukchonNightLighting.js',import.meta.url),'utf8');
 assert.match(skyline,/const occupied=\(\(index\*29\+c\*17\+f\*11\)%19\)/);
 assert.match(skyline,/cityLitWindowWarm/);
 assert.match(skyline,/cityLitWindowCool/);
 assert.match(hanok,/hanokPaperWindow/);
 assert.doesNotMatch(night,/planter\s*\(|flowerCoral|Math\.random/);
 const w=world();
 assert.equal(w.skyline.buildings,39);
 assert.ok(w.namsan.topY>100);
 assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
});
