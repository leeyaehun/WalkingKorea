import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createSeoulGirl3DModel,createSeoulGirlAnimationClips,
  SEOUL_GIRL_3D_META} from './Girl3DModel.js';

// This is an independent model workshop. It does not mutate the live
// multiplayer/game camera/sprite in src/main.js. The GLB is the actual
// renderable articulated asset, not a static front-facing picture.
const canvas=document.querySelector('#girl3d-canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.34;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,.1,50);
const hemi=new THREE.HemisphereLight(0xfff2db,0xb6a1a1,3.0);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff2df,3.1);
key.position.set(-3.4,6.2,4.3);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);
key.shadow.camera.left=-3;key.shadow.camera.right=3;
key.shadow.camera.top=4;key.shadow.camera.bottom=-3;
key.shadow.bias=-.0002;
scene.add(key);
const fill=new THREE.DirectionalLight(0xe2d6fa,1.4);
fill.position.set(3.5,3,-3);scene.add(fill);

const platform=new THREE.Mesh(
 new THREE.CylinderGeometry(1.00,1.14,.18,64),
 new THREE.MeshStandardMaterial({color:0xf3dfcd,roughness:1})
);platform.position.y=-.09;platform.receiveShadow=true;scene.add(platform);
const platformLine=new THREE.Mesh(
 new THREE.TorusGeometry(.995,.019,7,64),
 new THREE.MeshStandardMaterial({color:0xd7b6a0,roughness:.91})
);
platformLine.rotation.x=Math.PI/2;platformLine.position.y=-.006;scene.add(platformLine);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),
 new THREE.ShadowMaterial({opacity:.16}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;
scene.add(ground);

const girl=createSeoulGirl3DModel();
scene.add(girl.group);
const clips=createSeoulGirlAnimationClips();
const q=(id)=>document.getElementById(id);
let mode='walk',angle=.30,tilt=.04,distance=5.15,
  clock=0,last=0,dragging=false,downX=0,downY=0,
  draggingPointer=null,exportBusy=false;
function setMode(next){
 mode=next;girl.reset();
 for(const button of document.querySelectorAll('[data-mode]')){
  const active=button.dataset.mode===next;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 }
 q('motion-status').textContent=next==='walk'?
   '걷기 · 팔과 다리가 교대로 움직여요':'서 있기 · 가볍게 숨 쉬는 동작';
}
function orbit(){
 camera.position.set(Math.sin(angle)*distance*Math.cos(tilt),
   1.06+distance*.12+Math.sin(tilt)*distance,
   Math.cos(angle)*distance*Math.cos(tilt));
 // Keep BOTH boots above the bottom controls on desktop and mobile.
 camera.lookAt(0,.66,0);
}
function setAngle(yaw){
 angle=yaw;orbit();
 for(const b of document.querySelectorAll('[data-angle]')){
  b.classList.toggle('active',Math.abs(Number(b.dataset.angle)-yaw)<.01);
 }
}
function resize(){
 const w=Math.max(320,canvas.clientWidth),h=Math.max(320,canvas.clientHeight);
 renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.updateProjectionMatrix();orbit();
}
window.addEventListener('resize',resize);
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.pointerType==='mouse')return;
 dragging=true;draggingPointer=e.pointerId;
 downX=e.clientX;downY=e.clientY;canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging||e.pointerId!==draggingPointer)return;
 angle+=(e.clientX-downX)*.009;
 tilt=THREE.MathUtils.clamp(tilt+(e.clientY-downY)*.005,-.23,.42);
 downX=e.clientX;downY=e.clientY;orbit();
 for(const b of document.querySelectorAll('[data-angle]'))
   b.classList.remove('active');
});
const endDrag=()=>{dragging=false;draggingPointer=null};
canvas.addEventListener('pointerup',endDrag);
canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',e=>{
 e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.003,3.1,6.2);
 orbit();
},{passive:false});
for(const b of document.querySelectorAll('[data-angle]')){
 b.addEventListener('click',()=>setAngle(Number(b.dataset.angle)));
}
for(const b of document.querySelectorAll('[data-mode]')){
 b.addEventListener('click',()=>setMode(b.dataset.mode));
}
q('model-reset').addEventListener('click',()=>{
 tilt=.04;distance=5.15;setAngle(.3);
});
function tick(t){
 requestAnimationFrame(tick);
 const dt=Math.min(.08,Math.max(.001,last?(t-last)/1000:.016));
 last=t;clock+=dt;
 girl.update({dt,walking:mode==='walk',
   forcePreviewWalk:mode==='walk',visible:true});
 renderer.render(scene,camera);
}
setMode('walk');
resize();
requestAnimationFrame(tick);

q('export-glb').addEventListener('click',async()=>{
 if(exportBusy)return;
 exportBusy=true;
 const button=q('export-glb');
 button.disabled=true;
 button.textContent='GLB 생성 중…';
 const oldVisible=girl.group.visible;
 // Export neutral T-pose with both named animation clips.
 girl.reset();girl.group.visible=true;
 try{
   const exporter=new GLTFExporter();
   const file=await exporter.parseAsync(girl.group,{
     binary:true,animations:clips,trs:true,onlyVisible:true,
     includeCustomExtensions:false,maxTextureSize:1024
   });
   if(!(file instanceof ArrayBuffer))throw new Error('GLB buffer was not created');
   const url=URL.createObjectURL(new Blob([file],{type:'model/gltf-binary'}));
   const a=document.createElement('a');a.href=url;
   a.download='SeoulGirl3D_v1_walk_idle.glb';
   a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   q('export-status').textContent=
     'GLB 저장 준비 완료 · Walk/Idle 두 애니메이션 포함 · '+Math.round(file.byteLength/1024)+' KB';
 }catch(error){
   console.error('3D GLB export failed',error);
   q('export-status').textContent='GLB 내보내기 실패 · '+error.message;
 }finally{
   girl.group.visible=oldVisible;
   exportBusy=false;
   button.disabled=false;
   button.textContent='3D 에셋 GLB 받기';
 }
});
if(new URLSearchParams(location.search).has('qa')){
 window.__wkGirl3DQA=()=>{
  let meshes=0,triangles=0;
  const parts=[];
  girl.group.traverse(o=>{
   if(o.isMesh){
     meshes++;triangles+=(o.geometry.index?
       o.geometry.index.count:o.geometry.attributes.position.count)/3;
     parts.push(o.name);
   }
  });
  return {...girl.snapshot(),meshCount:meshes,triangles,
   clipNames:clips.map(c=>c.name),
   rigNodes:SEOUL_GIRL_3D_META.rig.map(n=>Boolean(girl.group.getObjectByName(n))),
   faceParts:parts.filter(n=>/eye|pupil|flower|fringe|strap|bag|boot/i.test(n)),
   rotationAngle:angle,mode,
   exportReady:typeof GLTFExporter==='function'};
 };
}
