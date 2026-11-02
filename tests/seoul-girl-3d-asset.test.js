import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {
  createSeoulGirl3DModel,createSeoulGirlAnimationClips,SEOUL_GIRL_3D_META
} from '../src/characters/Girl3DModel.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('the new Seoul girl is real 3D meshes, not a sprite or camera-facing flat card',()=>{
 const girl=createSeoulGirl3DModel(),root=girl.group;
 assert.equal(SEOUL_GIRL_3D_META.displayName,'서울 산책자 · 3D');
 assert.equal(root.userData.isPlayableCharacter,true);
 assert.equal(root.userData.assetId,SEOUL_GIRL_3D_META.id);
 assert.equal(root.getObjectByName('Body').isGroup,true);
 let meshes=0,triangles=0,withDepth=0;
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root);
 root.traverse(obj=>{
  if(!obj.isMesh)return;
  meshes++;
  assert.equal(obj.material.isMeshStandardMaterial,true);
  const geom=obj.geometry;
  assert.ok(geom.attributes.position?.count>6,obj.name+' is not real 3D');
  assert.ok([...geom.attributes.position.array].every(Number.isFinite));
  const bbox=new THREE.Box3().setFromObject(obj);
  if(bbox.max.z-bbox.min.z>.03)withDepth++;
  triangles+=(geom.index?geom.index.count:geom.attributes.position.count)/3;
 });
 assert.ok(meshes>75,'not enough detail '+meshes);
 assert.ok(withDepth>65,'mostly plane sprites');
 assert.ok(triangles>2000&&triangles<32000,'polygon budget '+triangles);
 assert.ok(box.max.y>1.7&&box.max.y<2.05,'character height unbounded');
 assert.ok(box.min.y>-.04&&box.min.y<.03,'feet not anchored');
 assert.ok(box.max.z-box.min.z>.40,'no three-dimensional thickness');
 assert.ok(box.max.x-box.min.x>.60);
 assert.ok(!root.children.some(x=>x.isSprite));
 console.info('Seoul girl 3D',meshes,'mesh parts;',triangles,'triangles; 3D bounds',box.min.toArray(),box.max.toArray());
});

test('all five articulated pivots exist; legs, arms and head move independently when walking',()=>{
 const girl=createSeoulGirl3DModel(),rig=girl.pivots;
 for(const key of ['head','leftArm','rightArm','leftLeg','rightLeg'])
   assert.equal(rig[key]?.isGroup,true,key);
 for(const name of SEOUL_GIRL_3D_META.rig)
   assert.equal(Boolean(girl.group.getObjectByName(name)),true,name);
 const old=girl.snapshot();
 assert.equal(old.rendering,'three-dimensional-mesh');
 assert.equal(old.pose,'idle');
 girl.update({x:0,z:0,dt:.05,vx:0,vz:0,walking:false});
 assert.ok(Math.abs(rig.leftLeg.rotation.x)<.02);
 girl.update({x:0,z:.30,dt:.18,vx:0,vz:2.1,walking:true});
 assert.ok(rig.leftLeg.rotation.x*rig.rightLeg.rotation.x<=0,
   'feet must alternate instead of skating together');
 assert.ok(rig.leftArm.rotation.x*rig.leftLeg.rotation.x<=0,
   'left arm should oppose left foot');
 assert.equal(girl.snapshot().rendering,'three-dimensional-mesh');
 girl.update({x:.1,z:.35,dt:.18,vx:1,vz:.5,walking:true});
 assert.ok(girl.group.rotation.y>0,'heading rotates full 3D body');
 assert.ok(girl.snapshot().totalTravel>.39);
 girl.update({x:.1,z:.35,dt:.08,vx:0,vz:0,walking:false});
 assert.equal(girl.group.position.x,.1);
 assert.equal(girl.group.position.z,.35);
 assert.ok(girl.snapshot().animationBlend<1);
});

test('signature original girl design remains visible from front, back and 3/4 profile',()=>{
 const root=createSeoulGirl3DModel().group;
 const names=[];
 const materials=new Set();
 root.traverse(o=>{
  names.push(o.name);
  if(o.isMesh)materials.add(o.material.color.getHex());
 });
 for(const pattern of [
  /Rear chestnut bob/,/Sculpted chestnut fringe/,/FivePetalFlowerHairClip/,
  /Eye sparkle/,/Rosy cheek/,/Soft tiny smile/,/Jacket torso coral/,
  /Cream skirt/,/Tan crossbody strap/,/Bag body/,
  /Bag flap piping/,/dusty lavender ankle boot/,/rubber sole/
 ])assert.ok(names.some(n=>pattern.test(n)),'missing feature '+pattern);
 assert.ok(materials.size>=15,'not enough actual material variation');
 for(const key of ['HeadPivot','ArmLeftPivot','ArmRightPivot',
   'LegLeftPivot','LegRightPivot'])assert.ok(root.getObjectByName(key));
 assert.ok(root.getObjectByName('Pupil'));
 assert.ok(root.getObjectByName('FivePetalFlowerHairClip'));
});

test('GLB exports separate seamless idle and walk animation clips that target real bone names',()=>{
 const [idle,walk]=createSeoulGirlAnimationClips();
 assert.equal(idle.name,'Idle');
 assert.equal(walk.name,'Walk');
 assert.ok(walk.duration>.65&&walk.duration<.85);
 assert.ok(walk.tracks.length>=5);
 assert.ok(idle.tracks.length>=1);
 for(const clip of [idle,walk]){
  for(const track of clip.tracks){
   assert.equal(track.ValueTypeName,'quaternion');
   assert.ok(track.name.endsWith('.quaternion'));
   const joint=track.name.slice(0,-'.quaternion'.length);
   assert.ok(SEOUL_GIRL_3D_META.rig.includes(joint));
   assert.equal(track.values.length,track.times.length*4);
   assert.ok([...track.values].every(Number.isFinite));
   assert.ok([...track.times].every(Number.isFinite));
  }
  assert.ok(clip.validate(),'invalid glTF rig track');
 }
});

test('new 3D character has a separate interactive exportable studio but preserves entire live game and multiplayer',()=>{
 const main=read('src/main.js'),html=read('girl3d.html'),
   viewer=read('src/characters/Girl3DViewer.js'),
   vite=read('vite.config.js'),sprite=read('src/characters/GirlSprite.js');
 assert.match(vite,/girl3d: resolve\(import\.meta\.dirname, 'girl3d\.html'\)/);
 assert.match(html,/id="girl3d-canvas"/);
 assert.match(html,/id="export-glb"/);
 assert.match(html,/data-mode="walk"/);
 assert.match(html,/data-mode="idle"/);
 assert.match(html,/data-angle="3\.141592653589793"/);
 assert.match(viewer,/GLTFExporter/);
 assert.match(viewer,/binary:true,animations:clips/);
 assert.match(viewer,/SeoulGirl3D_v1_walk_idle\.glb/);
 assert.match(viewer,/window\.__wkGirl3DQA/);
 assert.match(viewer,/pointerdown/);
 assert.match(viewer,/pointermove/);
 assert.match(main,/const girl=createGirlSpriteCompanion\(scene,hill,camera\)/);
 assert.match(main,/girl\.update\(\{\.\.\.motion,visible:state\.started\}\)/);
 assert.match(main,/avatar:girl\.snapshot\(\),selectedAvatar:'girl'/);
 assert.match(main,/createWalkMultiplayer\(\{scene,hill,camera/);
 assert.match(sprite,/let atlasPromise=null/);
 assert.doesNotMatch(main,/Girl3DModel|Girl3DViewer/);
 assert.doesNotMatch(viewer,/WebSocket|PUBLIC_WALK_ROOMS/);
});
