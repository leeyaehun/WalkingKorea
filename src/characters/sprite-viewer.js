import * as THREE from 'three';
import {createGirlSpriteCompanion} from './GirlSprite.js';
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.setClearColor(0xf1e8dc,0);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-2.8,2.8,2.0,-2.0,0.1,100);
camera.position.set(0,2.1,5.5);camera.lookAt(0,0.95,0);
const floor = new THREE.Mesh(new THREE.CircleGeometry(.52,48),new THREE.MeshBasicMaterial({color:0xd1c0a8,transparent:true,opacity:.34,side:THREE.DoubleSide}));
floor.rotation.x=-Math.PI/2;floor.position.y=0.012;scene.add(floor);
const avatar=createGirlSpriteCompanion(scene,()=>0,camera);
avatar.group.visible=true;
let direction=0,pose='idle',mirrored=false,frame=0,last=0;
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.left=-2.8*w/h;camera.right=2.8*w/h;camera.top=2.8;camera.bottom=-2.8;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
function refresh(){
 document.querySelectorAll('[data-direction]').forEach(b=>b.classList.toggle('active',Number(b.dataset.direction)===direction));
 document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===pose));
 document.getElementById('mirror').classList.toggle('active',mirrored);
 avatar.previewPose({pose,direction,frame,mirrored});
 document.getElementById('status').textContent=`${['정면','앞 45°','측면','뒤 45°','후면'][direction]} · ${pose==='walk'?'걷기':'서있기'} · ${frame+1}프레임`;
}
document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{direction=Number(b.dataset.direction);refresh();}));
document.querySelectorAll('[data-pose]').forEach(b=>b.addEventListener('click',()=>{pose=b.dataset.pose;frame=0;refresh();}));
document.getElementById('mirror').addEventListener('click',()=>{mirrored=!mirrored;refresh();});
function loop(t){
 if(t-last>(pose==='walk'?175:600)){
   last=t;frame=(frame+1)%(pose==='walk'?4:2);refresh();
 }
 avatar.group.visible=true;
 renderer.render(scene,camera);
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);