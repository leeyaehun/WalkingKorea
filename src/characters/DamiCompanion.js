import * as THREE from 'three';

// An original, lightweight low-poly companion. It uses plain Three.js geometry
// so the initial release does not depend on external model hosts or GLTF files.
export function createDamiCompanion(scene, hill) {
  const root = new THREE.Group();
  const head = new THREE.Group();
  const materials = Object.fromEntries(Object.entries({
    cream: 0xf8eee1, white: 0xfff8ed, orange: 0xe5b07a, gray: 0x928f89,
    sage: 0x819371, darkSage: 0x637960, leather: 0x8c664c,
    blush: 0xf4bba9, dark: 0x34302c, charm: 0xe8c889,
    pink: 0xe9aea7, earth: 0xb9ad95
  }).map(([k, v]) => [k, new THREE.MeshBasicMaterial({ color: v })]));
  const oval = (parent, material, pos, scale, seg = 12) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, 10), materials[material]);
    m.position.set(...pos); m.scale.set(...scale); parent.add(m); return m;
  };
  const cone = (parent, material, pos, radius, height, sides=5) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), materials[material]);
    m.position.set(...pos); parent.add(m); return m;
  };

  // The companion's silhouette is head-forward and legible from alley scale.
  oval(root, 'cream', [0, .45, 0], [.46, .36, .39]);
  oval(root, 'white', [0, .40, .22], [.32, .27, .25]);
  oval(root, 'orange', [-.30, .47, .22], [.17, .19, .11], 10);
  oval(root, 'gray', [.31, .45, -.07], [.12, .17, .17], 10);

  head.position.set(0, .89, .18);
  root.add(head);
  oval(head, 'cream', [0, 0, 0], [.41, .37, .34], 16);
  oval(head, 'orange', [-.22, .11, .16], [.18, .21, .17]);
  oval(head, 'gray', [.24, .17, .12], [.15, .16, .15]);
  const leftEar=cone(head,'orange',[-.25,.33,0],.14,.30,4);
  leftEar.rotation.z=.14; leftEar.rotation.x=.12;
  const rightEar=cone(head,'gray',[.25,.33,0],.14,.30,4);
  rightEar.rotation.z=-.14; rightEar.rotation.x=.12;
  cone(head,'pink',[-.25,.33,.045],.076,.15,4);
  cone(head,'pink',[.25,.33,.045],.076,.15,4);
  oval(head,'dark',[-.13,-.01,.32],[.045,.074,.020]);
  oval(head,'dark',[.13,-.01,.32],[.045,.074,.020]);
  oval(head,'white',[-.145,.016,.34],[.014,.022,.010],8);
  oval(head,'white',[.115,.016,.34],[.014,.022,.010],8);
  oval(head,'blush',[-.24,-.12,.267],[.078,.040,.014],8);
  oval(head,'blush',[.24,-.12,.267],[.078,.040,.014],8);
  oval(head,'pink',[0,-.12,.341],[.036,.021,.018],8);
  // Green kerchief over the chest and a little lucky charm pouch.
  const scarf = new THREE.Mesh(new THREE.CylinderGeometry(.25,.30,.12,16), materials.sage);
  scarf.position.set(0,.70,.10); root.add(scarf);
  cone(root,'sage',[0,.57,.29],.19,.22,3).rotation.x=Math.PI;
  oval(root,'leather',[.30,.45,.15],[.15,.17,.10],10);
  oval(root,'charm',[.31,.35,.258],[.058,.061,.025],10);
  oval(root,'orange',[.31,.30,.26],[.025,.056,.021],8);

  const legs=[];
  for (const [x,z,color] of [[-.25,.24,'cream'],[.25,.24,'cream'],[-.25,-.23,'cream'],[.25,-.23,'cream']]) {
    const pivot=new THREE.Group(); pivot.position.set(x,.23,z); root.add(pivot);
    oval(pivot,color,[0,-.09,0],[.116,.18,.13],10);
    oval(pivot,'white',[0,-.23,.035],[.12,.07,.15],10);
    legs.push(pivot);
  }
  const tailPivot=new THREE.Group();tailPivot.position.set(.34,.57,-.22);root.add(tailPivot);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.075,.105,.50,9),materials.orange);
  tail.rotation.z=-1.0;tail.position.set(.18,.18,0);tailPivot.add(tail);
  oval(tailPivot,'gray',[.36,.38,0],[.09,.10,.09],10);

  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.52,24),new THREE.MeshBasicMaterial({
    color:0x4f5544, transparent:true, opacity:.16, depthWrite:false, side:THREE.DoubleSide
  }));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;root.add(shadow);
  root.scale.set(.86,.86,.86);
  root.visible=false;
  scene.add(root);

  const forward=new THREE.Vector3();
  const position=new THREE.Vector3(0,0,0);
  let initialized=false;
  function update({ x, z, yaw, elapsed, walking, visible }) {
    root.visible=visible;
    if (!visible) { initialized=false;return; }
    forward.set(Math.sin(yaw),0,-Math.cos(yaw));
    const targetX=x+forward.x*3.05+Math.cos(yaw)*.61;
    const targetZ=z+forward.z*3.05+Math.sin(yaw)*.61;
    if(!initialized){position.set(targetX,0,targetZ);initialized=true;}
    const dx=targetX-position.x,dz=targetZ-position.z,dist=Math.hypot(dx,dz);
    const lerp=dist>6 ? 1 : .16;
    position.x+=dx*lerp;position.z+=dz*lerp;
    const bob=.026*Math.sin(elapsed*5);
    root.position.set(position.x,hill(position.x,position.z)+.02+bob,position.z);
    // Face the walking direction, but occasionally glance back at the player.
    const lookAtPlayer=(Math.sin(elapsed*.46)>-.3);
    const targetYaw=lookAtPlayer?Math.atan2(x-position.x,z-position.z):yaw;
    root.rotation.y=targetYaw;
    head.rotation.z=Math.sin(elapsed*1.6)*.035;
    head.rotation.y=Math.sin(elapsed*1.1)*.13;
    tailPivot.rotation.y=Math.sin(elapsed*3.1)*.35;
    const gait=walking?Math.sin(elapsed*9)*.25:0;
    legs[0].rotation.x=gait;legs[3].rotation.x=gait;
    legs[1].rotation.x=-gait;legs[2].rotation.x=-gait;
  }
  return {group:root, update};
}
