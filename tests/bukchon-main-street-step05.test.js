import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {createThirdPersonCamera} from '../src/controllers/ThirdPersonCamera.js';
import {
  MAIN_STREET_ROUTE,MAIN_STREET_DISCOVERIES,DEFAULT_MAIN_STREET_PITCH
} from '../src/world/BukchonMainStreet.js';
import {mainLaneWidth,sampleMainLaneAtZ} from '../src/world/BukchonStreetLayout.js';

function world(){
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=old;}
}

test('default first-look camera frames the N Seoul Tower on desktop and portrait',()=>{
  const w=world();
  assert.ok(DEFAULT_MAIN_STREET_PITCH>-.13&&DEFAULT_MAIN_STREET_PITCH<.05);
  for(const aspect of [16/9,390/844]){
    const camera=new THREE.PerspectiveCamera(57,aspect,.1,240);
    const follow=createThirdPersonCamera({
      camera,hill:w.hill,isWalkable:()=>true
    });
    follow.update({x:-3,z:-42,yaw:Math.PI,
      pitch:DEFAULT_MAIN_STREET_PITCH,dt:.016,moving:false});
    camera.updateMatrixWorld();
    const tip=new THREE.Vector3(w.namsan.tower.x,w.namsan.topY,
      w.namsan.tower.z).project(camera);
    assert.ok(Number.isFinite(tip.x)&&Number.isFinite(tip.y));
    assert.ok(tip.x>-.9&&tip.x<.9,
      'tower horizontally outside first look at aspect '+aspect+': '+tip.x);
    assert.ok(tip.y>-.95&&tip.y<.95,
      'tower clipped in first look at aspect '+aspect+': '+tip.y);
    assert.ok(tip.z>0&&tip.z<1);
  }
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/DEFAULT_MAIN_STREET_PITCH/);
  assert.match(main,/==='namsan'\?0\.01/);
});

test('all western and eastern frontages remain enclosed for the entire walk',()=>{
  const w=world(),a=w.continuousFrontages.coverageAudit;
  assert.equal(w.paths.length,1);
  assert.equal(w.houseSites.length,20);
  assert.equal(w.continuousFrontages.gates,1);
  assert.ok(a);
  assert.equal(a.largeGaps.length,0);
  assert.ok(a.longestGap<=.35,'vacant street frontage '+a.longestGap);
  for(const gap of a.gaps){
    assert.ok(gap.length>=0&&gap.length<=.35);
    assert.ok(gap.begin>=-44-1e-6&&gap.end<=55+1e-6);
  }
  for(let z=-44;z<=55;z+=.5){
    const lane=sampleMainLaneAtZ(w.paths[0].samples,z);
    assert.ok(lane,'road sample missing at z '+z);
    assert.ok(mainLaneWidth(z)>3);
  }
});

test('final edits preserve one path, discoveries, women walking and night',()=>{
  const w=world();
  assert.deepEqual(MAIN_STREET_ROUTE.points[0],[-1,55]);
  assert.deepEqual(MAIN_STREET_ROUTE.points.at(-1),[-3,-44]);
  assert.equal(w.paving.endCaps,2);
  assert.ok(w.paving.shoulderMeters>195);
  assert.equal(MAIN_STREET_DISCOVERIES.length,6);
  assert.ok(MAIN_STREET_DISCOVERIES.every(p=>
    w.distanceFromPath(p.x,p.z,w.paths[0])<mainLaneWidth(p.z)*.5));
  assert.equal(w.nightFixtures.fixtures.length,23);
  assert.equal(w.skyline.buildings,39);
  assert.ok(w.vertexCount<850000);
  assert.ok(w.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  for(const check of [/girl\.update\(/,/cameraRelativeDirection/,
    /state\.night\?1:0/,/isWalkable\(/])assert.match(main,check);
});

test('portrait and short landscape layouts keep joystick clear and notches safe',()=>{
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  assert.match(css,/@media \(max-width:450px\)[\s\S]*?body\.playing \.walker-card \{ bottom:calc\(263px/);
  assert.match(css,/@media \(max-width:850px\) and \(max-height:590px\)/);
  assert.match(css,/@media \(max-width:850px\) and \(max-height:420px\)/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/\.touch-pad \{ bottom:calc\(147px/);
  assert.ok(263>147+99+12,'touch pad and character button overlap');
});
