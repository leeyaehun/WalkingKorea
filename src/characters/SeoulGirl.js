import * as THREE from 'three';

/**
 * Seoul Stroll "Girl Walker" — original stylized, volumetric character.
 * Warm brown bob, five-petal flower clip with coral tassel, dusty rose cardigan,
 * cream pleated skirt, light trainers and embroidered ivory cross-body bag.
 * Front is +Z; the full figure is about 1.94 units tall before scaling.
 */
export function createGirlModel(){
  const root=new THREE.Group();
  root.name='Seoul Stroll · girl walker · 3D';
  const material=(hex,roughness=.86)=>new THREE.MeshStandardMaterial({color:hex,roughness});
  const M={
    skin:material(0xffd9ba),skinShade:material(0xf5c5a9),
    hair:material(0x5e433a),hairHighlight:material(0x735248),
    coral:material(0xd88b76),coralLight:material(0xe5a68e),
    coralDark:material(0xbb765f),cream:material(0xfff5e7),
    blouse:material(0xfffbf2),skirt:material(0xf2dfc4),
    skirtShadow:material(0xdfc6a6),skirtHighlight:material(0xf9e9d3),
    sole:material(0xb9a68e),shoe:material(0xf2eadc),
    soleWhite:material(0xfff8e9),brown:material(0x684536),
    strap:material(0x8d6450),bag:material(0xf5e5c9),
    bagShade:material(0xe5cba8),eye:material(0x292323,.25),
    eyeLight:material(0xffffff,.10),blush:material(0xf4a58e),
    flower:material(0xfff8e5),flowerGold:material(0xe6c18a),
    accent:material(0xc57561),dark:material(0x403733),
  };
  const geom=(g,m,parent=root)=>{
    const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;parent.add(x);return x;
  };
  const oval=(parent,m,pos,size,seg=32)=>{
    const x=geom(new THREE.SphereGeometry(1,seg,Math.floor(seg*.7)),m,parent);
    x.position.set(...pos);x.scale.set(...size);return x;
  };
  function tube(parent,m,points,r=.01){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return geom(new THREE.TubeGeometry(curve,Math.max(10,points.length*8),r,7,false),m,parent);
  }
  function bentSleeve(parent,side){
    const upper=new THREE.Group();upper.position.set(side*.255,1.14,.005);parent.add(upper);
    const sleeve=oval(upper,M.coral,[side*.09,-.145,.012],[.133,.245,.146],30);
    sleeve.rotation.z=side*.28;
    // Folded ivory cuff and softly rounded glove-free hand.
    const cuff=oval(upper,M.cream,[side*.14,-.317,.026],[.112,.055,.118],24);
    oval(upper,M.skin,[side*.156,-.389,.047],[.088,.105,.090],24);
    oval(upper,M.coralLight,[side*.10,-.132,.105],[.044,.15,.037],16);
    return upper;
  }
  const torsoRig=new THREE.Group();root.add(torsoRig);
  torsoRig.name='upper body and accessories';
  // Skirt is one continuous scalloped pleated surface rather than a
  // collection of disconnected cones.
  const skirtP=new Float32Array((4*72)*3),indices=[],cols=[];
  const cr=new THREE.Color();
  const creamColor=new THREE.Color(0xf2dfc4);
  const darkColor=new THREE.Color(0xe3caaa);
  const lightColor=new THREE.Color(0xffeed8);
  const ys=[.28,.43,.60,.82],rs=[.433,.388,.29,.172];
  for(let row=0;row<4;row++)for(let j=0;j<72;j++){
    const ang=j*Math.PI*2/72;
    const fan=Math.cos(ang*12);
    const radius=rs[row]+fan*(.012+(3-row)*.004);
    const idx=(row*72+j)*3;
    skirtP[idx]=Math.sin(ang)*radius;
    skirtP[idx+1]=ys[row]+(row===0?Math.sin(ang*12)*.017:0);
    skirtP[idx+2]=Math.cos(ang)*radius*.80;
    cr.copy(creamColor);
    cr.lerp(fan>.15?lightColor:darkColor,Math.abs(fan)*.20+(j%5===0?.06:0));
    cols.push(cr.r,cr.g,cr.b);
  }
  for(let row=0;row<3;row++)for(let j=0;j<72;j++){
    const a=row*72+j,b=row*72+(j+1)%72,c=(row+1)*72+j,d=(row+1)*72+(j+1)%72;
    indices.push(a,c,b,b,c,d);
  }
  const skirtG=new THREE.BufferGeometry();
  skirtG.setAttribute('position',new THREE.Float32BufferAttribute(skirtP,3));
  skirtG.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  skirtG.setIndex(indices);skirtG.computeVertexNormals();
  const skirtMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.96});
  const skirt=geom(skirtG,skirtMat,torsoRig);
  oval(torsoRig,M.skirt,[0,.77,0],[.18,.12,.174],32);
  // Inner blouse and jacket split into front panels.
  oval(torsoRig,M.blouse,[0,1.050,.025],[.225,.29,.158],36);
  oval(torsoRig,M.coral,[0,1.056,-.083],[.259,.292,.175],36);
  // Paired rounded panels show an uninterrupted cream opening and buttons.
  for(const side of [-1,1]){
    const panel=oval(torsoRig,M.coralLight,[side*.148,1.043,.162],[.117,.253,.067],28);
    panel.rotation.z=side*.035;
    oval(torsoRig,M.coral,[side*.230,1.038,.020],[.071,.260,.138],24);
  }
  for(const y of [.91,1.060,1.195]){
    oval(torsoRig,M.cream,[.115,y,.232],[.030,.029,.017],16);
  }
  // Rounded white collar flares around the neck.
  for(const side of [-1,1]){
    const collar=oval(torsoRig,M.cream,[side*.091,1.288,.154],[.120,.053,.104],24);
    collar.rotation.z=side*.26;
  }
  oval(torsoRig,M.skin,[0,1.298,.012],[.099,.122,.085],28);
  const arms=[bentSleeve(torsoRig,-1),bentSleeve(torsoRig,1)];
  // Bag strap connects the opposite shoulder to a small rounded ivory bag.
  tube(torsoRig,M.strap,[[.195,1.257,.139],[.148,1.155,.212],[.070,1.001,.248],[-.092,.837,.266],[-.258,.680,.292]],.027);
  const bagPivot=new THREE.Group();bagPivot.position.set(-.297,.682,.236);torsoRig.add(bagPivot);
  const bag=oval(bagPivot,M.bag,[0,0,.01],[.165,.174,.083],32);
  const flap=oval(bagPivot,M.bagShade,[0,.058,.079],[.146,.061,.026],24);
  oval(bagPivot,M.bag,[0,.052,.098],[.139,.048,.019],24);
  // Miniature coral norigae knot on the flap, like the reference concept.
  for(let i=0;i<4;i++){
    const a=i*Math.PI*.5;
    const q=oval(bagPivot,M.accent,[Math.sin(a)*.047,-.010+Math.cos(a)*.047,.110],[.026,.041,.012],12);
    q.rotation.z=-a;
  }
  oval(bagPivot,M.flowerGold,[0,-.008,.133],[.020,.020,.010],12);
  tube(bagPivot,M.accent,[[0,-.043,.117],[0,-.088,.115],[.006,-.135,.115]],.008);
  oval(bagPivot,M.accent,[.006,-.130,.115],[.024,.040,.010],12);
  const headPivot=new THREE.Group();headPivot.position.set(0,1.540,.064);torsoRig.add(headPivot);
  // Hair shell sits behind the face. Wide bob at the lower cheeks, tapered cap.
  oval(headPivot,M.hair,[0,-.075,-.088],[.425,.440,.338],48);
  oval(headPivot,M.hair,[0,-.215,-.105],[.439,.237,.315],40);
  // Rounded face floats just in front of dark-brown bob, fully 3D.
  const face=oval(headPivot,M.skin,[0,-.042,.170],[.330,.335,.280],48);
  oval(headPivot,M.skin,[-.333,-.119,.145],[.060,.105,.069],20);
  oval(headPivot,M.skin,[.333,-.119,.145],[.060,.105,.069],20);
  // Side sweep built from curved, overlapping bangs, no spiky wedge edges.
  const bangs=[
    [-.262,.229,.244,.172,.163,-.24],
    [-.128,.300,.244,.183,.157,-.32],
    [.035,.314,.171,.123,.132,-.48],
    [.192,.294,.083,.110,.100,-.54],
  ];
  for(const [x,y,z,w,h,rot] of bangs){
    const bang=oval(headPivot,M.hair,[x,y,z],[w,h,.103],30);
    bang.rotation.z=rot;
  }
  const leftLock=oval(headPivot,M.hair,[-.337,-.081,.018],[.126,.301,.183],28);
  leftLock.rotation.z=-.13;
  const rightLock=oval(headPivot,M.hair,[.340,-.069,.021],[.123,.300,.185],28);
  rightLock.rotation.z=.10;
  // Smooth cheeks, glossy oval eyes, tiny eyebrows and joyful open smile.
  for(const side of [-1,1]){
    const x=side*.132;
    oval(headPivot,M.eye,[x,-.080,.440],[.047,.076,.024],26);
    oval(headPivot,M.eyeLight,[x-.014,-.049,.464],[.014,.022,.007],14);
    const b=oval(headPivot,M.brown,[x,-.004,.440],[.055,.010,.009],16);
    b.rotation.z=side*.13;
    oval(headPivot,M.blush,[side*.252,-.159,.405],[.078,.036,.013],22);
  }
  oval(headPivot,M.skinShade,[0,-.139,.453],[.017,.013,.007],12);
  oval(headPivot,M.accent,[0,-.204,.446],[.049,.040,.013],20);
  oval(headPivot,M.eyeLight,[0,-.192,.459],[.028,.012,.006],14);
  // Left flower-pin with five petals and two hanging peach tassels.
  const hairPin=new THREE.Group();hairPin.position.set(-.345,.121,.146);headPivot.add(hairPin);
  for(let i=0;i<5;i++){
    const a=Math.PI*2*i/5;
    const petal=oval(hairPin,M.flower,[Math.cos(a)*.054,Math.sin(a)*.054,0],[.040,.054,.019],16);
    petal.rotation.z=a-Math.PI*.5;
  }
  oval(hairPin,M.flowerGold,[0,0,.022],[.035,.034,.021],16);
  for(const xx of [-.035,.027]){
    tube(hairPin,M.accent,[[xx,-.027,-.006],[xx,-.090,-.007],[xx+.007,-.150,-.01]],.011);
    const tassel=oval(hairPin,M.accent,[xx+.007,-.161,-.010],[.028,.059,.026],16);
  }

  // Under-skirt legs, cuff socks, and high-contrast sneakers with soft soles.
  const legs=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*.150,.460,.0);root.add(pivot);
    const stocking=oval(pivot,M.skin,[0,-.137,0],[.079,.202,.093],24);
    oval(pivot,M.cream,[0,-.266,.009],[.083,.079,.094],24);
    const sole=oval(pivot,M.sole,[0,-.359,.083],[.127,.059,.202],28);
    const upper=oval(pivot,M.shoe,[0,-.319,.084],[.124,.085,.183],30);
    oval(pivot,M.soleWhite,[0,-.338,.227],[.086,.058,.055],18);
    for(let i=0;i<3;i++){
      tube(pivot,M.soleWhite,[[-.066,-.265+i*.027,.202],[0,-.265+i*.027,.213],[.066,-.265+i*.027,.202]],.009);
    }
    legs.push(pivot);
  }
  // Ground contact shadow is separate from vertical skirt swing.
  const shadow=geom(new THREE.CircleGeometry(.48,36),
    new THREE.MeshBasicMaterial({color:0x675c52,transparent:true,opacity:.17,side:THREE.DoubleSide,depthWrite:false}),root);
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;shadow.castShadow=false;
  let heading=Math.PI,lastX=0,lastZ=0,initialized=false,phase=0,blend=0,steps=0;
  const pose=(elapsed,moving,dt,travel,speed)=>{
    const target=moving?.98:0;
    blend+=(target-blend)*(1-Math.exp(-dt*(target?10:8)));
    if(travel>.0005&&moving){phase+=travel*Math.PI*2/.74;steps+=travel;}
    const swing=Math.sin(phase),lift=Math.max(0,Math.sin(phase));
    const lean=blend*.024*swing;
    torsoRig.position.y=.010*Math.sin(elapsed*2.0)+blend*(.012+.016*Math.abs(Math.sin(phase)));
    torsoRig.rotation.z=lean;torsoRig.rotation.x=blend*.030*Math.cos(phase);
    skirt.rotation.z=-lean*.32;
    skirt.rotation.y=blend*.025*Math.sin(phase+.5);
    for(let i=0;i<2;i++){
      const sign=i===0?1:-1;
      legs[i].rotation.x=blend*.46*sign*swing;
      legs[i].position.y=.46+blend*(sign===1?lift:Math.max(0,-Math.sin(phase)))*.045;
      arms[i].rotation.x=-blend*.27*sign*swing;
      arms[i].rotation.z=(i===0?-.05:.05)+blend*.018*swing;
    }
    headPivot.rotation.z=-lean*.6+Math.sin(elapsed*.8)*.015;
    headPivot.rotation.x=-torsoRig.rotation.x*.3;
    bagPivot.rotation.z=-blend*.08*Math.sin(phase-.35);
    // Controlled bounce of the hair volume follows the skull automatically.
    shadow.material.opacity=.17-blend*.019;
  };
  function animate(elapsed,moving=false,opts={}) {
    pose(elapsed,moving,Math.max(0,Math.min(opts.dt||1/60,.13)),
      opts.travel||0,opts.speed||0);
  }
  function update({x,z,vx=0,vz=0,dt=.016,elapsed=0,walking=false,visible=true},hill){
    root.visible=visible;
    if(!visible){initialized=false;return;}
    root.position.set(x,hill(x,z)+.045,z);
    if(!initialized){lastX=x;lastZ=z;heading=Math.PI;initialized=true;}
    const distance=Math.hypot(x-lastX,z-lastZ);
    lastX=x;lastZ=z;
    const speed=Math.hypot(vx,vz);
    if(speed>.12){
      const target=Math.atan2(vx,vz);
      const d=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));
      heading+=d*(1-Math.exp(-dt*9));
    }
    root.rotation.y=heading;
    animate(elapsed,walking&&speed>.10,{dt,travel:distance,speed});
  }
  const snapshot=()=>({
    visible:root.visible,position:[root.position.x,root.position.y,root.position.z],
    heading:root.rotation.y,scale:root.scale.x,
    gait:{phase,blend,traveled:steps,feet:legs.map((g,i)=>({side:i?1:-1,rotation:g.rotation.x}))}
  });
  return {root,update,snapshot,animate,materials:M};
}
export function createGirlCompanion(scene,hill){
  const model=createGirlModel();
  model.root.scale.setScalar(.83);
  model.root.visible=false;
  scene.add(model.root);
  // Existing Dami lighting is retained, so both models share the scene light.
  return {
    group:model.root,
    update:state=>model.update(state,hill),
    snapshot:model.snapshot,
    model
  };
}
