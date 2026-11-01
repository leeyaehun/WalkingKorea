import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {
  createBukchonSky,SKY_DAY_PALETTE,SKY_FOG_DAY,SKY_FOG_NIGHT,
  SKY_NIGHT_PALETTE,skyFragmentShader
} from '../src/world/BukchonSky.js';

test('blue, naturally graded daytime sky palette and haze replace warm peach sunset',()=>{
  const horizon=new THREE.Color(SKY_DAY_PALETTE.horizon);
  const mid=new THREE.Color(SKY_DAY_PALETTE.middle);
  const zenith=new THREE.Color(SKY_DAY_PALETTE.zenith);
  for(const color of [horizon,mid,zenith])
    assert.ok(color.b>color.r,'day sky should be blue rather than peach');
  assert.ok(zenith.b>zenith.r*1.6,'zenith is a saturated but gentle blue');
  assert.ok(horizon.r>zenith.r,'day sky gradually lightens toward horizon');
  assert.ok(SKY_FOG_DAY[2]>SKY_FOG_DAY[0],'day fog must stay blue');
  assert.deepEqual(SKY_FOG_NIGHT,[.14,.20,.30]);
});

test('one camera-following sky dome draws feathered cloud wisps without cloud blob meshes',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  camera.position.set(7,4,-32);
  const sky=createBukchonSky(scene);
  assert.ok(scene.children.includes(sky.mesh));
  assert.equal(sky.mesh.material.side,THREE.BackSide);
  assert.equal(sky.mesh.material.depthWrite,false);
  assert.equal(sky.mesh.material.depthTest,false);
  assert.equal(sky.mesh.material.transparent,false);
  assert.ok(sky.mesh.geometry.getAttribute('position').count<1000);
  assert.equal(sky.mesh.renderOrder,-1000);
  assert.match(skyFragmentShader,/cloudWisp/);
  assert.match(skyFragmentShader,/smoothstep\(\.55,1\.50,length\(d\)\+grain\)/);
  assert.match(skyFragmentShader,/mix\(daylight,nightSky/);
  sky.update(camera,false);
  assert.deepEqual(sky.mesh.position.toArray(),camera.position.toArray());
  assert.equal(sky.mesh.material.uniforms.uNight.value,0);
  camera.position.set(1,8,42);sky.update(camera,true);
  assert.deepEqual(sky.mesh.position.toArray(),camera.position.toArray());
  assert.equal(sky.mesh.material.uniforms.uNight.value,1);
});

test('distinct night palette is deep navy and never changes the clear day gradient',()=>{
  const sky=createBukchonSky(new THREE.Scene());
  const uniform=sky.mesh.material.uniforms;
  assert.ok(uniform.uNightHorizon.value.equals(new THREE.Color(SKY_NIGHT_PALETTE.horizon)));
  assert.ok(uniform.uNightMiddle.value.equals(new THREE.Color(SKY_NIGHT_PALETTE.middle)));
  assert.ok(uniform.uNightZenith.value.equals(new THREE.Color(SKY_NIGHT_PALETTE.zenith)));
  assert.ok(uniform.uDayHorizon.value.equals(new THREE.Color(SKY_DAY_PALETTE.horizon)));
  assert.ok(uniform.uDayMiddle.value.equals(new THREE.Color(SKY_DAY_PALETTE.middle)));
  assert.ok(uniform.uDayZenith.value.equals(new THREE.Color(SKY_DAY_PALETTE.zenith)));
  assert.match(skyFragmentShader,/moonHalo/);
  assert.match(skyFragmentShader,/crescent/);
  assert.match(skyFragmentShader,/distantStars/);
});

test('daylight sky update does not alter the city, shadows, houses or gameplay scripts',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const city=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  assert.match(main,/sky\.update\(camera,state\.night\)/);
  assert.match(main,/state\.night\?SKY_FOG_NIGHT:SKY_FOG_DAY/);
  assert.match(main,/createBukchonLighting/);
  assert.match(main,/cameraRelativeDirection/);
  assert.doesNotMatch(city,/Soft high clouds, well beyond the route/);
  assert.doesNotMatch(city,/for\(let i=0;i<10;i\+\+\)\s*\{\s*const x=rand\(-88,88\)/);
  assert.match(city,/float fog=mix\(dayFog,nightFog,uNight\)/);
  assert.match(city,/hillsideBackground\(\)/);
  assert.match(city,/streetLife=buildBukchonStreetLife/);
});
