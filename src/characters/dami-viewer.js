import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createDamiModel } from './DamiCompanion.js';

const canvas=document.querySelector('#viewer');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,100);
const character=createDamiModel();
scene.add(character.root);
const sky=new THREE.HemisphereLight(0xffffff,0xb7a58d,1.95);scene.add(sky);
const key=new THREE.DirectionalLight(0xffe9cf,1.85);key.position.set(-2,5,5);scene.add(key);
const fill=new THREE.DirectionalLight(0xd9e6ff,.75);fill.position.set(3,3,-3);scene.add(fill);
const ground=new THREE.Mesh(new THREE.CircleGeometry(.83,60),new THREE.MeshBasicMaterial({color:0xcab8a8,transparent:true,opacity:.20,depthWrite:false}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.012;scene.add(ground);
camera.position.set(0,1.13,3.55);camera.lookAt(0,.69,0);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.10;
controls.target.set(0,.68,0);
controls.minDistance=1.8;controls.maxDistance=5.2;
controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.77;
let desired=0,spin=false,current=0,old=performance.now();
function resize(){
 const dpr=Math.min(window.devicePixelRatio||1,2);
 renderer.setPixelRatio(dpr);
 renderer.setSize(innerWidth,innerHeight,false);
 camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
document.querySelectorAll('[data-angle]').forEach(b=>{
 b.addEventListener('click',()=>{
   spin=false;document.querySelector('#spin-btn').classList.remove('active');
   desired=Number(b.dataset.angle)*Math.PI/180;
   document.querySelectorAll('[data-angle]').forEach(x=>x.classList.toggle('active',x===b));
 });
});
document.querySelector('#download-glb').addEventListener('click',()=>{
  const root=character.root.clone(true);
  root.rotation.y=0;root.position.set(0,0,0);
  const exporter=new GLTFExporter();
  exporter.parse(root,(buffer)=>{
    const blob=new Blob([buffer],{type:'model/gltf-binary'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='WalkingKorea_Dami_v07.glb';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  },err=>console.error('GLB export failed',err),{binary:true,onlyVisible:true});
});
document.querySelector('#spin-btn').addEventListener('click',e=>{
 spin=!spin;e.currentTarget.classList.toggle('active',spin);
 if(spin)document.querySelectorAll('[data-angle]').forEach(x=>x.classList.remove('active'));
});
function loop(t){
 const dt=Math.min(.04,(t-old)/1000||.016);old=t;
 if(spin)desired+=dt*.40;
 const diff=((desired-current+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 current+=diff*(1-Math.exp(-dt*8));
 character.root.rotation.y=current;
 character.animate(t*.001,false);
 controls.update();renderer.render(scene,camera);
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);