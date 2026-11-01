import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {
  SKY_DAY_PALETTE,SKY_NIGHT_PALETTE,SKY_FOG_DAY,SKY_FOG_NIGHT,
  MOON_DIRECTION,NIGHT_STAR_CELL_COUNT,createBukchonSky,skyFragmentShader
} from '../src/world/BukchonSky.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

test('navy sky is darkest at zenith, lighter at urban horizon, independent of daytime sky',()=>{
  const h=new THREE.Color(SKY_NIGHT_PALETTE.horizon);
  const m=new THREE.Color(SKY_NIGHT_PALETTE.middle);
  const z=new THREE.Color(SKY_NIGHT_PALETTE.zenith);
  assert.ok(h.r>m.r && m.r>z.r);
  assert.ok(h.g>m.g && m.g>z.g);
  assert.ok(h.b>m.b && m.b>z.b);
  assert.ok(z.b>z.r*2);
  assert.equal(SKY_DAY_PALETTE.horizon,0xd4e9f6);
  assert.equal(SKY_DAY_PALETTE.middle,0x91c9ef);
  assert.equal(SKY_DAY_PALETTE.zenith,0x4e9bdc);
  assert.deepEqual(SKY_FOG_DAY,[.72,.82,.90]);
  assert.deepEqual(SKY_FOG_NIGHT,[.14,.20,.30]);
});

test('moon and sparse static star field are embedded in the one-draw-call sky shader',()=>{
  const sky=createBukchonSky(new THREE.Scene());
  const mat=sky.mesh.material;
  assert.equal(sky.mesh.geometry.type,'SphereGeometry');
  assert.equal(mat.side,THREE.BackSide);
  assert.equal(mat.depthWrite,false);
  assert.equal(mat.depthTest,false);
  assert.equal(mat.transparent,false);
  assert.deepEqual(NIGHT_STAR_CELL_COUNT,[92,32]);
  assert.ok(mat.uniforms.uMoonDirection.value instanceof THREE.Vector3);
  assert.ok(Math.abs(mat.uniforms.uMoonDirection.value.length()-1)<1e-6);
  assert.equal(MOON_DIRECTION.length,3);
  assert.match(skyFragmentShader,/float distantStars/);
  assert.match(skyFragmentShader,/float crescent=moonDisc\*\(1\.0-cut\)/);
  assert.match(skyFragmentShader,/float moonHalo/);
  assert.match(skyFragmentShader,/horizonGlow/);
  assert.match(skyFragmentShader,/mix\(daylight,nightSky/);
  assert.ok(skyFragmentShader.indexOf('distantStars')<skyFragmentShader.lastIndexOf('gl_FragColor'));
});

test('night mode toggles and camera follows without changing player, landmarks or city mesh',()=>{
  const sky=createBukchonSky(new THREE.Scene()),camera=new THREE.PerspectiveCamera();
  camera.position.set(-3,12,-42);
  sky.update(camera,true);
  assert.equal(sky.mesh.material.uniforms.uNight.value,1);
  assert.deepEqual(sky.mesh.position.toArray(),camera.position.toArray());
  sky.update(camera,false);
  assert.equal(sky.mesh.material.uniforms.uNight.value,0);
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(main,/night:new URLSearchParams\(location.search\).get\('night'\)==='1'/);
  assert.match(main,/sky\.update\(camera,state\.night\)/);
  assert.match(main,/lighting\.update\(\{x:state.x,z:state.z,hill,night:state.night\}\)/);
  assert.match(main,/cameraRelativeDirection/);
});

test('night shading is moonlit, not blanket black and does not invent Step 05 lamps',()=>{
  const worldFile=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
  assert.match(worldFile,/vec3 dusk = lit \* vec3\(\.43,\.51,\.67\)/);
  assert.match(worldFile,/float nightFog=smoothstep\(73\.0,220\.0,vDistance\)\*\.52/);
  assert.match(worldFile,/float fog=mix\(dayFog,nightFog,uNight\)/);
  assert.doesNotMatch(worldFile,/new THREE\.PointLight/);
  assert.doesNotMatch(worldFile,/emissiveMap|cityWindowGlow/);
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{
    const world=createBukchonWorld();
    assert.equal(world.houseSites.length,20);
    assert.equal(world.paths.length,1);
    assert.equal(world.skyline.buildings,39);
    assert.ok(world.namsan.topY>100);
    assert.equal('planters' in world.streetLife.counts,false);
    assert.ok(world.vertexCount<850000);
    assert.ok(world.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
  }finally{
    globalThis.document=old;
  }
});
