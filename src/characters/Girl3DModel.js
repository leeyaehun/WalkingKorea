import * as THREE from 'three';

/**
 * Seoul Stroll: fully three-dimensional, low-cost Seoul Girl v1.
 * Original stylized character adapted from our approved 2.5D girl:
 * chestnut bob, five-petal ivory flower, coral jacket, cream pleated
 * skirt, tan crossbody bag, mauve leather ankle boots. No flat sprites,
 * image textures, human photos, external models or network calls.
 *
 * Size: 1.84m (including a 4mm flower ornament).
 * +Z = front. Bones are named rigid pivots suitable for GLB animation.
 * The independent 3D preview and .glb export do NOT replace the live
 * original illustrated walker or remote 8-person avatars.
 */
export const SEOUL_GIRL_3D_META=Object.freeze({
 id:'seoul-girl-3d-v1',
 displayName:'서울 산책자 · 3D',
 heightMeters:1.84,
 direction:'front +Z',
 rig:['HeadPivot','ArmLeftPivot','ArmRightPivot','LegLeftPivot','LegRightPivot'],
 palette:['chestnut-brown','coral','cream','sand','dusty-mauve'],
 walkCycleSeconds:0.76,
 glbClips:['Idle','Walk'],
 format:'Three.js reusable procedural meshes, exportable glTF 2.0 binary'
});
const MATERIAL_COLORS={
 face:0xffd3b4,faceShade:0xf3aa90,blush:0xf09992,
 hair:0x572d29,hairLight:0x75453d,hairEdge:0x3e2928,
 eyeWhite:0xfff7ee,iris:0x663c38,pupil:0x211b23,shine:0xffffff,
 lip:0xc06d75,
 coral:0xdf6859,coralLight:0xf38b70,coralDark:0xb9504d,
 dress:0xf4d9b2,dressTrim:0xffedda,
 bag:0xf3cf9f,bagEdge:0xbb8b64,bagFlap:0xe6b77e,
 buckle:0xeecb7b,
 sock:0xffe2c7,boot:0x9d6978,bootDark:0x704957,
 petal:0xfff8e5,flowerCenter:0xf1bb61,
 outline:0x6c4138
};
const mat=new Map(Object.entries(MATERIAL_COLORS).map(([name,hex])=>[
 name,new THREE.MeshStandardMaterial({
  color:hex,roughness:name==='shine'?.32:.91,metalness:0,
  flatShading:false
 })
]));
const sphereGeometry=new THREE.SphereGeometry(1,16,12);
const boxGeometry=new THREE.BoxGeometry(1,1,1);
const cylinderGeometry=new THREE.CylinderGeometry(1,1,1,14,1);
const coneGeometry=new THREE.CylinderGeometry(1,1,1,16,1);

function node(parent,name){
 const obj=new THREE.Group();obj.name=name;parent.add(obj);return obj;
}
function sphere(parent,name,m,x,y,z,sx,sy,sz){
 const mesh=new THREE.Mesh(sphereGeometry,mat.get(m));mesh.name=name;
 mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
 mesh.castShadow=true;parent.add(mesh);return mesh;
}
function box(parent,name,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
 const mesh=new THREE.Mesh(boxGeometry,mat.get(m));mesh.name=name;
 mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
 mesh.rotation.set(rx,ry,rz);
 mesh.castShadow=true;parent.add(mesh);return mesh;
}
function truncated(parent,name,m,x,y,z,r1,r2,height){
 const geometry=new THREE.CylinderGeometry(r1,r2,height,20,1);
 const mesh=new THREE.Mesh(geometry,mat.get(m));
 mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;
 parent.add(mesh);return mesh;
}
function beam(parent,name,m,a,b,radius){
 const p1=new THREE.Vector3(...a),p2=new THREE.Vector3(...b);
 const delta=p2.clone().sub(p1),mesh=new THREE.Mesh(cylinderGeometry,mat.get(m));
 mesh.name=name;
 mesh.position.copy(p1.add(p2).multiplyScalar(.5));
 mesh.scale.set(radius,delta.length(),radius);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 mesh.castShadow=true;parent.add(mesh);return mesh;
}
function curve(parent,name,m,points,radius){
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(6,points.length*5),radius,5,false),mat.get(m));
 mesh.name=name;parent.add(mesh);return mesh;
}
function flower(parent,x,y,z,size=1){
 const group=node(parent,'FivePetalFlowerHairClip');
 group.position.set(x,y,z);group.rotation.z=-.12;
 sphere(group,'Flower core','flowerCenter',0,0,.016,.036*size,.036*size,.027*size);
 for(let i=0;i<5;i++){
  const theta=2*Math.PI*i/5;
  const xx=Math.sin(theta)*.060*size,yy=Math.cos(theta)*.060*size;
  const petal=sphere(group,'Ivory flower petal '+i,'petal',xx,yy,0,
    .043*size,.058*size,.020*size);
  petal.rotation.z=-theta;
 }
 return group;
}

function makeLeg(body,side){
 const sign=side==='Left'?-1:1;
 const pivot=node(body,'Leg'+side+'Pivot');
 pivot.position.set(sign*.118,.655,0);
 truncated(pivot,side+' leg in coral shorts','coralLight',0,-.115,.0,.099,.104,.23);
 sphere(pivot,side+' sock knee','sock',0,-.274,.002,.075,.095,.083);
 truncated(pivot,side+' leg','sock',0,-.385,0,.058,.070,.24);
 const boot=node(pivot,'Boot'+side);
 boot.position.set(0,-.534,.03);
 sphere(boot,side+' dusty lavender ankle boot','boot',0,.035,.018,.104,.118,.129);
 sphere(boot,side+' shoe toe','boot',0,-.012,.092,.109,.059,.173);
 box(boot,side+' heel','bootDark',0,-.068,-.034,.182,.05,.117);
 box(boot,side+' rubber sole','bootDark',0,-.075,.085,.203,.031,.273);
 curve(boot,side+' ankle seam','bootDark',
  [[-.079,.055,.126],[-.048,.08,.138],[0,.085,.14],[.048,.08,.138],[.079,.055,.126]],.008);
 return pivot;
}
function makeArm(body,side){
 const sign=side==='Left'?-1:1;
 const arm=node(body,'Arm'+side+'Pivot');
 arm.position.set(sign*.246,1.115,.018);
 sphere(arm,side+' shoulder coral fabric','coral',sign*.043,-.064,.005,.117,.132,.116);
 beam(arm,side+' coral sleeve','coral',
  [sign*.055,-.072,.004],[sign*.09,-.365,.02],.089);
 sphere(arm,side+' cuff','coralDark',sign*.091,-.34,.023,.082,.046,.086);
 sphere(arm,side+' hand','face',sign*.09,-.429,.055,.068,.085,.072);
 return arm;
}
function makeHead(body){
 const neck=sphere(body,'Neck','face',0,1.20,.035,.089,.13,.083);
 const head=node(body,'HeadPivot');
 head.position.set(0,1.235,.018);
 // All details are intentionally children of the same movable head
 // pivot and keep their front/back shape as camera orbits in 3D.
 sphere(head,'Rear chestnut bob','hair',0,.278,-.075,.391,.414,.304);
 sphere(head,'Face cheeks','face',0,.279,.112,.312,.335,.285);
 sphere(head,'Left ear','face',-.297,.275,.092,.055,.088,.061);
 sphere(head,'Right ear','face',.297,.275,.092,.055,.088,.061);
 sphere(head,'Hair cap sweeping over the forehead','hair',0,.535,.035,.374,.158,.313);
 sphere(head,'Top shine','hairLight',-.095,.639,.116,.165,.052,.155);
 for(const side of [-1,1]){
  sphere(head,(side===-1?'Left':'Right')+' cheek hair bob','hair',
    side*.325,.174,-.006,.119,.249,.215);
  sphere(head,(side===-1?'Left':'Right')+' inward hair curl','hairLight',
    side*.29,.073,.145,.084,.104,.103);
 }
 // Different asymmetrical bangs create a true charming character
 // silhouette, not a generic orange cylinder with a ball on top.
 const fringes=[
  [-.195,.512,.284,.125,.154,-.24],
  [-.051,.524,.333,.143,.131,.19],
  [.106,.528,.305,.132,.112,-.17],
  [.231,.468,.250,.099,.119,-.33]
 ];
 for(const [x,y,z,rx,ry,angle] of fringes){
  const bang=sphere(head,'Sculpted chestnut fringe','hair',x,y,z,rx,ry,.082);
  bang.rotation.z=angle;
 }
 // Thick eyelids, white sclera, shaded irises, pupils and highlights
 // genuinely protrude from face for readable views under moving light.
 for(const sign of [-1,1]){
  const eyeX=sign*.132;
  sphere(head,(sign<0?'Left':'Right')+' eye white','eyeWhite',
    eyeX,.310,.371,.070,.090,.028);
  sphere(head,'Warm chocolate iris','iris',eyeX,.308,.391,.051,.069,.027);
  sphere(head,'Pupil','pupil',eyeX,.313,.408,.034,.057,.023);
  sphere(head,'Eye sparkle large','shine',eyeX-.014,.347,.426,.017,.024,.010);
  sphere(head,'Eye sparkle small','shine',eyeX+.021,.290,.428,.009,.011,.008);
  curve(head,'Upper lash', 'hairEdge', [
    [eyeX-.069,.386,.378],[eyeX,.399,.390],[eyeX+.066,.384,.376]
  ],.010);
  sphere(head,'Rosy cheek','blush',sign*.234,.222,.336,.062,.029,.015);
  // One gently arched eyebrow per eye, partly hidden by the bangs.
  curve(head,'Eyebrow','hairEdge',[
    [eyeX-.047,.442,.344],[eyeX,.457,.353],[eyeX+.044,.446,.339]
  ],.009);
 }
 sphere(head,'Tiny button nose','faceShade',0,.243,.399,.025,.023,.016);
 curve(head,'Soft tiny smile','lip',[
  [-.051,.176,.387],[-.023,.166,.397],[0,.162,.401],
  [.028,.167,.394],[.051,.180,.384]
 ],.009);
 flower(head,.306,.520,.262,.90);
 return head;
}

export function createSeoulGirl3DModel(){
 const root=node(new THREE.Group(),'SeoulGirl3D'); // root is returned, not auto-added to a scene
 root.position.set(0,0,0);
 root.userData.isPlayableCharacter=true;
 root.userData.assetId=SEOUL_GIRL_3D_META.id;
 const body=node(root,'Body');
 // Pleated cream dress flows below a little soft coral jacket.
 truncated(body,'Cream skirt','dress',0,.662,0,.208,.284,.275);
 for(let i=0;i<8;i++){
  const a=i*Math.PI*2/8;
  sphere(body,'Cream skirt pleat '+i,'dressTrim',
    Math.cos(a)*.245,.575,Math.sin(a)*.18,
    .025,.100,.035);
 }
 sphere(body,'Jacket torso coral','coral',0,.949,0,.244,.259,.151);
 sphere(body,'Jacket hem','coralDark',0,.763,.03,.237,.065,.142);
 sphere(body,'Jacket left lapel','coralLight',-.083,1.065,.149,.116,.106,.038).rotation.z=-.35;
 sphere(body,'Jacket right lapel','coralLight',.083,1.065,.149,.116,.106,.038).rotation.z=.35;
 sphere(body,'Cream blouse collar','dressTrim',0,1.116,.154,.077,.067,.048);
 box(body,'Jacket front seam','coralDark',0,.889,.150,.017,.206,.018);
 for(let i=0;i<2;i++)sphere(body,'Warm jacket button','buckle',.012,.943-i*.083,.166,.013,.013,.008);
 // Crossbody bag strap: actual diagonal 3D tube over front, from
 // left shoulder to right hip; little pouch and zipper separate solids.
 beam(body,'Tan crossbody strap','bagEdge',
   [-.185,1.155,.163],[.252,.756,.228],.024);
 sphere(body,'Bag body','bag',.294,.676,.215,.143,.136,.075);
 box(body,'Bag outer flap','bagFlap',.299,.714,.287,.249,.076,.030);
 curve(body,'Bag flap piping','bagEdge',
  [[.179,.695,.300],[.245,.684,.309],[.346,.682,.309],[.412,.696,.296]],.008);
 sphere(body,'Golden bag clasp','buckle',.299,.681,.314,.019,.020,.010);
 const leftArm=makeArm(body,'Left'),rightArm=makeArm(body,'Right');
 const leftLeg=makeLeg(body,'Left'),rightLeg=makeLeg(body,'Right');
 const head=makeHead(body);
 const pivots={head,leftArm,rightArm,leftLeg,rightLeg};
 let initialized=false,lastX=0,lastZ=0,heading=0,travel=0,
   clock=0,blend=0,pose='idle',distancePhase=0;
 function poseAt(t,walkingBlend){
  const cycle=2*Math.PI*t/SEOUL_GIRL_3D_META.walkCycleSeconds;
  const swing=Math.sin(cycle)*walkingBlend;
  const step=Math.cos(cycle)*walkingBlend;
  leftLeg.rotation.x=swing*.48;
  rightLeg.rotation.x=-swing*.48;
  leftArm.rotation.x=-swing*.35;
  rightArm.rotation.x=swing*.35;
  leftArm.rotation.z=-.06;rightArm.rotation.z=.06;
  head.rotation.z=Math.sin(clock*1.6)*.025+
    Math.sin(cycle)*.014*walkingBlend;
  head.rotation.x=Math.sin(clock*1.9)*.014;
  body.position.y=walkingBlend*.015*Math.abs(step)
      +(!walkingBlend?.009*Math.sin(clock*2.1):0);
  body.rotation.y=walkingBlend*.024*Math.sin(cycle);
 }
 function update({x=0,z=0,vx=0,vz=0,dt=.016,visible=true,walking=false,
    forcePreviewWalk=false}={}){
  root.visible=!!visible;
  const actualTravel=initialized?Math.hypot(x-lastX,z-lastZ):0;
  lastX=x;lastZ=z;initialized=true;
  travel+=actualTravel;
  const speed=Math.hypot(vx,vz);
  if(speed>.11)heading=Math.atan2(vx,vz);
  root.rotation.y=heading;
  root.position.set(x,0,z);
  clock+=Math.max(0,Math.min(.10,dt));
  const active=forcePreviewWalk||(walking&&speed>.12&&actualTravel>.0005);
  blend+=(Number(active)-blend)*(1-Math.exp(-dt*9.8));
  if(active)distancePhase+=forcePreviewWalk?dt:
    actualTravel/.76*SEOUL_GIRL_3D_META.walkCycleSeconds;
  pose=blend>.34?'walk':'idle';
  poseAt(distancePhase,blend);
 }
 function snapshot(){
  return {assetId:SEOUL_GIRL_3D_META.id,
    rendering:'three-dimensional-mesh',visible:root.visible,
    heightMeters:SEOUL_GIRL_3D_META.heightMeters,
    pose,heading,totalTravel:travel,animationBlend:blend,
    allDirections:true,rigBones:SEOUL_GIRL_3D_META.rig};
 }
 const reset=()=>{initialized=false;blend=0;distancePhase=0;poseAt(0,0);};
 poseAt(0,0);
 return {group:root,body,pivots,update,snapshot,reset,
  dispose(){root.traverse(o=>{if(o.geometry && o.geometry!==sphereGeometry&&
    o.geometry!==boxGeometry&&o.geometry!==cylinderGeometry){
      o.geometry.dispose();
    }})}};
}
function quats(angles){
 const q=new THREE.Quaternion(),e=new THREE.Euler();
 const values=[];
 for(const x of angles){
  e.set(x,0,0);q.setFromEuler(e);
  values.push(q.x,q.y,q.z,q.w);
 }
 return values;
}
export function createSeoulGirlAnimationClips(){
 const times=[0,.19,.38,.57,.76],still=[0,0,0,0,0];
 const limb=(name,values)=>new THREE.QuaternionKeyframeTrack(
   name+'.quaternion',times,quats(values));
 const walk=new THREE.AnimationClip('Walk',.76,[
  limb('LegLeftPivot',[0,.49,0,-.49,0]),
  limb('LegRightPivot',[0,-.49,0,.49,0]),
  limb('ArmLeftPivot',[0,-.35,0,.35,0]),
  limb('ArmRightPivot',[0,.35,0,-.35,0]),
  limb('HeadPivot',still)
 ]);
 const idle=new THREE.AnimationClip('Idle',2,[
  new THREE.QuaternionKeyframeTrack('HeadPivot.quaternion',
    [0,.5,1,1.5,2],quats([0,.015,0,-.015,0]))
 ]);
 return [idle,walk];
}
