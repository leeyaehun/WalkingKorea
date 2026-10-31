import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {createBukchonLighting,SUN_DIRECTION,SHADOW_VIEW_RADIUS}
  from '../src/world/BukchonLighting.js';

function makeWorld(){
 const old=globalThis.document;
 globalThis.document={
   createElement:()=>({width:2048,height:2048,
     getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})
 };
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}

test('same original world geometry receives physically cast directional shadows',()=>{
 const w=makeWorld();
 const g=w.mesh.geometry;
 assert.ok(g.getAttribute('contactAO'));
 assert.equal(g.getAttribute('contactAO').count,g.getAttribute('position').count);
 assert.ok(Array.from(g.getAttribute('contactAO').array).every(n=>n>=.7&&n<=1.00001));
 assert.ok(w.material.lights);
 assert.ok(w.material.vertexShader.includes('#include <shadowmap_vertex>'));
 assert.ok(w.material.fragmentShader.includes('#include <shadowmask_pars_fragment>'));
 assert.ok(w.material.fragmentShader.includes('getShadowMask()'));
 assert.ok(w.material.fragmentShader.includes('vContactAO'));
 assert.ok(w.material.uniforms.uShadowStrength);
 assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
 assert.equal(w.paths.length,3);
});

test('sun uses a soft directional shadow and reuses one static world mesh',()=>{
 const world=makeWorld();
 const renderer={shadowMap:{enabled:false,autoUpdate:true,needsUpdate:false,type:null}};
 const scene=new THREE.Scene();
 const light=createBukchonLighting({renderer,scene,worldMesh:world.mesh});
 assert.ok(renderer.shadowMap.enabled);
 assert.equal(renderer.shadowMap.type,THREE.PCFSoftShadowMap);
 assert.equal(renderer.shadowMap.autoUpdate,false);
 assert.equal(light.sun.shadow.mapSize.x,2048);
 assert.equal(light.sun.shadow.camera.right,SHADOW_VIEW_RADIUS);
 assert.equal(light.sun.shadow.camera.left,-SHADOW_VIEW_RADIUS);
 assert.equal(light.sun.shadow.bias,-.00024);
 assert.equal(world.mesh.castShadow,true);
 assert.equal(world.mesh.receiveShadow,true);
 assert.ok(Math.abs(SUN_DIRECTION.length()-1)<.0001);
 light.update({x:-3,z:-42,hill:world.hill,night:false});
 assert.equal(light.getStatus().refreshes,1);
 assert.equal(light.sun.intensity,2);
 renderer.shadowMap.needsUpdate=false;
 light.update({x:-2,z:-41,hill:world.hill,night:false});
 assert.equal(light.getStatus().refreshes,1);
 assert.equal(renderer.shadowMap.needsUpdate,false);
 light.update({x:0,z:-42,hill:world.hill,night:false});
 assert.equal(light.getStatus().refreshes,2);
 assert.equal(renderer.shadowMap.needsUpdate,true);
});

test('mobile shadow budget and evening transition keep geometry unchanged',()=>{
 const world=makeWorld();
 const scene=new THREE.Scene();
 const renderer={shadowMap:{}};
 const lights=createBukchonLighting({renderer,scene,worldMesh:world.mesh,isTouch:true});
 assert.equal(lights.sun.shadow.mapSize.x,1024);
 assert.equal(renderer.shadowMap.type,THREE.BasicShadowMap);
 lights.update({x:-3,z:-42,hill:world.hill,night:false});
 renderer.shadowMap.needsUpdate=false;
 lights.update({x:-3,z:-42,hill:world.hill,night:true});
 assert.equal(lights.getStatus().refreshes,2);
 assert.equal(renderer.shadowMap.needsUpdate,true);
 assert.equal(lights.sun.intensity,.12);
 assert.ok(world.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
});
