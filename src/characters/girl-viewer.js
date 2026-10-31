import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createGirlModel } from './SeoulGirl.js';

const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#viewer'),antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.07;
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff6e9,0xa89b87,2));
const key=new THREE.DirectionalLight(0xffe7cf,2.0);key.position.set(-3,5,6);scene.add(key);
const fill=new THREE.DirectionalLight(0xd5e5fa,.9);fill.position.set(3,3,-4);scene.add(fill);
const camera=new THREE.PerspectiveCamera(35,1,.1,100);
camera.position.set(0,1.12,3.65);
const model=createGirlModel();scene.add(model.root);
const ground=new THREE.Mesh(new THREE.CircleGeometry(.67,48),
 new THREE.MeshBasicMaterial({color:0xc7ad96,transparent:true,opacity:.2,side:THREE.DoubleSide}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.02;scene.add(ground);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.target.set(0,1.00,0);
controls.minDistance=2;controls.maxDistance=5;
controls.minPolarAngle=.16;controls.maxPolarAngle=Math.PI*.77;
function resize(){
 const w=window.innerWidth,h=window.innerHeight;
 renderer.setSize(w,h,false);
 camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
let current=0,desired=0,spin=false,last=performance.now();
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>{
 spin=false;document.querySelector('#spin-btn').classList.remove('active');
 desired=Number(b.dataset.angle)*Math.PI/180;
 document.querySelectorAll('[data-angle]').forEach(x=>x.classList.toggle('active',x===b));
}));
document.querySelector('#spin-btn').addEventListener('click',e=>{
 spin=!spin;e.currentTarget.classList.toggle('active',spin);
 if(spin)document.querySelectorAll('[data-angle]').forEach(x=>x.classList.remove('active'));
});
document.querySelector('#download-glb').addEventListener('click',()=>{
 const root=model.root.clone(true);root.rotation.y=0;
 new GLTFExporter().parse(root,buffer=>{
  const blob=new Blob([buffer],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='WalkingKorea_SeoulGirl_v010.glb';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1700);
 },err=>console.error('GLB export error',err),{binary:true,onlyVisible:true});
});
function tick(t){
 const dt=Math.min(.05,(t-last)/1000||.016);last=t;
 if(spin)desired+=dt*.48;
 const d=((desired-current+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
 current+=d*(1-Math.exp(-dt*9));
 model.root.rotation.y=current;
 model.animate(t*.001,false,{dt});
 controls.update();renderer.render(scene,camera);
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
