import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createThirdPersonCamera} from '../src/controllers/ThirdPersonCamera.js';

function cameraPose(pitch){
  const camera=new THREE.PerspectiveCamera(57,1.6,.1,240);
  const follow=createThirdPersonCamera({
    camera,hill:()=>6,isWalkable:()=>true
  });
  follow.update({x:-3,z:-42,yaw:Math.PI,pitch,dt:.016,moving:false});
  return follow.snapshot();
}

test('standard walking view stays identical at its existing starting pitch',()=>{
 const ordinary=cameraPose(-.35);
 assert.ok(Math.abs(ordinary.lookAt[1]-6.93)<.00001);
 assert.ok(ordinary.camera[1]>ordinary.lookAt[1]);
 assert.equal(ordinary.anchor[0],-3);
 assert.equal(ordinary.anchor[2],-42);
});

test('upward look and skyline preview can reveal the full tower without moving player',()=>{
 const skyline=cameraPose(.01);
 assert.ok(skyline.lookAt[1]>skyline.camera[1]+.9);
 assert.equal(skyline.anchor[0],-3);
 assert.equal(skyline.anchor[2],-42);
 const veryHigh=cameraPose(.30);
 assert.ok(veryHigh.lookAt[1]>skyline.lookAt[1]);
 assert.ok(veryHigh.camera.every(Number.isFinite));
});
