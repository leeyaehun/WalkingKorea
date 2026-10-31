import * as THREE from 'three';

/**
 * Dami — v0.7 sculpted procedural model.
 *
 * A reusable, fully volumetric Three.js model rather than an image plane.
 * The sculpt, calico patches, cloth, stitching, and animated tail are authored
 * as actual meshes. Facing/front is local +Z; dimensions before scale ~1.3m.
 *
 * PBR material + rounded custom geometry; deliberately avoids the earlier
 * exposed-sphere-and-cone prototype look.
 */
export function createDamiModel() {
  const root = new THREE.Group();
  root.name = 'Dami · walking guide · v0.7';
  const mat = (hex, roughness = .91, metalness = 0) =>
    new THREE.MeshStandardMaterial({color:hex,roughness,metalness});
  const M = {
    cream:mat(0xfff4e5), ivory:mat(0xfffbf4), orange:mat(0xe8a661),
    sienna:mat(0xcc854e), brown:mat(0x75645e), peach:mat(0xf9b6a8),
    nose:mat(0xb7766a), dark:mat(0x302923,.25), iris:mat(0x634437,.28),
    shine:mat(0xffffff,.07), sage:mat(0x85936c), sage2:mat(0x687b5d),
    flower:mat(0xf8e6c1), flowerCenter:mat(0xe3b978),
    leather:mat(0x9a694d), leatherDark:mat(0x65432f),
    stitch:mat(0xe2bf91), metal:mat(0xd4a95b,.23,.56),
    goldLight:mat(0xf1d899,.21,.44), ground:mat(0x464132)
  };
  const mesh = (geo,material,parent=root) => {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true; m.receiveShadow = true; parent.add(m);
    return m;
  };
  function orb(parent, material, xyz, scales, seg=32) {
    const m=mesh(new THREE.SphereGeometry(1,seg,Math.max(16,Math.floor(seg*.65))),material,parent);
    m.position.set(...xyz);m.scale.set(...scales);
    return m;
  }
  const path=(pts,r,material,parent=root,tubular=40)=>{
    const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,tubular,r,9,false),material,parent);
  };
  const petal=(x,y,z,material=M.flower,parent=root,sx=.027,sy=.049)=>{
    const m=orb(parent,material,[x,y,z],[sx,sy,.013],12);
    return m;
  };
  function flower(parent,x,y,z,s=.085){
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      const p=orb(parent,M.flower,[x+Math.sin(a)*s*.40,y+Math.cos(a)*s*.40,z],[s*.29,s*.39,s*.13],14);
      p.rotation.z=-a;
    }
    orb(parent,M.flowerCenter,[x,y,z+s*.12],[s*.19,s*.20,s*.16],12);
  }
  // Curved, continuous pear-shaped torso (hand-profiled lathe instead of a
  // primitive sphere stack). Slightly narrower at the shoulders.
  const profile = [
    [.006,.145],[.19,.15],[.31,.19],[.365,.26],[.385,.37],
    [.382,.49],[.350,.63],[.294,.73],[.23,.805],[.05,.835],[0,.836]
  ].map(([r,y])=>new THREE.Vector2(r,y));
  const body=mesh(new THREE.LatheGeometry(profile,48),M.cream);
  body.scale.z=1.07;
  // A small ruff, close-fitting belly and subtle tortoiseshell flank patches.
  orb(root,M.ivory,[0,.42,.226],[.29,.32,.25],40);
  orb(root,M.orange,[-.329,.43,-.004],[.079,.168,.175],24);
  orb(root,M.brown,[.336,.42,-.10],[.083,.16,.154],24);
  orb(root,M.orange,[.07,.58,-.326],[.18,.15,.062],24);

  // Calico tail, with a real curved tube and continuous alternating segments.
  const tailPivot=new THREE.Group();tailPivot.position.set(-.32,.51,-.25);tailPivot.scale.setScalar(.80);root.add(tailPivot);
  const tailCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0), new THREE.Vector3(-.22,-.02,-.02),
    new THREE.Vector3(-.40,.13,-.02),new THREE.Vector3(-.43,.40,.015),
    new THREE.Vector3(-.33,.59,.06), new THREE.Vector3(-.19,.59,.035)
  ]);
  const tailGeometry = new THREE.TubeGeometry(tailCurve,60,.106,12,false);
  tailGeometry.clearGroups();
  for(let i=0;i<60;i++){
    const materialIndex=i<17?0:i<35?1:i<47?2:0;
    tailGeometry.addGroup(i*12*6,12*6,materialIndex);
  }
  mesh(tailGeometry,[M.cream,M.orange,M.brown],tailPivot);
  orb(tailPivot,M.ivory,[-.19,.59,.035],[.113,.112,.113],20);

  // Sculpted head: smooth and cheek-heavy, with a wide expressive face.
  const headPivot=new THREE.Group();
  headPivot.position.set(0,.944,.126);root.add(headPivot);
  const headGeo=new THREE.SphereGeometry(1,124,76);
  const p=headGeo.attributes.position;
  const colors=new Float32Array(p.count*3);
  const ivoryColor=new THREE.Color(0xfffbf4);
  const orangeColor=new THREE.Color(0xe6a76c);
  const brownColor=new THREE.Color(0x80716c);
  const smooth=(a,b,v)=>{const q=Math.max(0,Math.min(1,(v-a)/(b-a)));return q*q*(3-2*q)};
  for(let i=0;i<p.count;i++){
    const bx=p.getX(i),by=p.getY(i),bz=p.getZ(i);
    const cheek=Math.exp(-Math.pow((by+.20)/.28,2))*.065;
    const x=bx*(.435+cheek);
    const y=.378*by+.025*(1-by*by);
    const z=bz*(.348+cheek*.45)+.024*(1-by*by);
    p.setXYZ(i,x,y,z);
    // Organic calico color painted directly on the sculpt. No floating,
    // low-poly polygon overlays that can obscure eyes or leave hard seams.
    const leftShape=y-(.075+.035*Math.sin(11*x+7*z)+.10*(x+.18)**2);
    const rightShape=y-(.086+.030*Math.sin(9*x-5*z)+.09*(x-.20)**2);
    const front=smooth(-.28,-.025,z);
    const back=1-smooth(-.26,.025,z);
    const orangeFront=(1-smooth(-.16,-.02,x))*smooth(-.024,.023,leftShape)*front;
    const brownFront=smooth(.05,.17,x)*smooth(-.020,.022,rightShape)*front;
    const orangeBack=smooth(-.03,.13,x)*smooth(-.015,.035,y)*back;
    const brownBack=(1-smooth(-.13,-.015,x))*smooth(-.02,.035,y)*back;
    const c=ivoryColor.clone();
    const a=Math.min(1,Math.max(orangeFront,orangeBack));
    const b=Math.min(1,Math.max(brownFront,brownBack));
    if(a>b)c.lerp(orangeColor,a);
    else c.lerp(brownColor,b);
    colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  p.needsUpdate=true;
  headGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  headGeo.computeVertexNormals();
  const headMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91});
  const headMesh=mesh(headGeo,headMaterial,headPivot);
  headMesh.name='rounded sculpted head';

  // Surface patches follow the head's actual 3D curvature, not floating flat
  // discs. Dense triangulation keeps smooth borders on the curved head.
  function patch(points,material,front=true){
    const center=points.reduce((a,b)=>[a[0]+b[0]/points.length,a[1]+b[1]/points.length],[0,0]);
    const xs=[],indices=[],rings=13,parts=points.length;
    const project=(x,y)=>{
      const rx=.435+Math.exp(-Math.pow(((y/.378)-.20)/.28,2))*.06;
      const v=Math.min(.992,(x/rx)**2+((y-.025)/.378)**2);
      const z=(front?1:-1)*(.348+.025)*Math.sqrt(Math.max(.008,1-v))+.005*(front?1:-1);
      return [x,y,z+.02];
    };
    xs.push(...project(center[0],center[1]));
    for(let r=1;r<=rings;r++)for(let j=0;j<parts;j++){
      const t=r/rings,q=points[j];
      xs.push(...project(center[0]*(1-t)+q[0]*t,center[1]*(1-t)+q[1]*t));
    }
    for(let j=0;j<parts;j++)indices.push(0,1+j,1+(j+1)%parts);
    for(let r=1;r<rings;r++)for(let j=0;j<parts;j++){
      const a=1+(r-1)*parts+j,b=1+(r-1)*parts+(j+1)%parts,
            c=1+r*parts+j,d=1+r*parts+(j+1)%parts;
      indices.push(a,c,d,a,d,b);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(xs,3));
    geo.setIndex(indices);geo.computeVertexNormals();
    const m=mesh(geo,material,headPivot);m.material.side=THREE.DoubleSide;
    return m;
  }
  // Face color now comes from high-density vertex colors on headGeo.

  // Volumetric rounded-triangle ears, outside cream and inside warm pink.
  function ear(x,material){
    const g=new THREE.Group();headPivot.add(g);g.position.set(x,.285,-.065);
    const shape=new THREE.Shape();
    shape.moveTo(-.137,-.10);
    shape.bezierCurveTo(-.154,.03,-.085,.285,-.017,.327);
    shape.bezierCurveTo(.03,.337,.148,.09,.153,-.10);
    shape.quadraticCurveTo(0,-.17,-.137,-.10);
    const outer=mesh(new THREE.ExtrudeGeometry(shape,{
      depth:.09,steps:1,bevelEnabled:true,bevelThickness:.045,
      bevelSize:.026,bevelSegments:4,curveSegments:12
    }),material,g);
    outer.position.z=-.02;
    const innerShape=new THREE.Shape();
    innerShape.moveTo(-.089,-.06);
    innerShape.quadraticCurveTo(-.055,.155,-.012,.237);
    innerShape.quadraticCurveTo(.039,.162,.092,-.06);
    innerShape.quadraticCurveTo(0,-.096,-.089,-.06);
    const inner=mesh(new THREE.ShapeGeometry(innerShape,18),M.peach,g);
    inner.position.z=.116;inner.scale.set(.92,.92,1);
    g.scale.set(.78,.78,.80);g.rotation.z=x<0?.11:-.11;
    return g;
  }
  const earLeft=ear(-.282,M.orange);
  const earRight=ear(.282,M.brown);

  // Tiny cheek pads give the muzzle depth while preserving large eye spacing.
  orb(headPivot,M.ivory,[-.085,-.198,.330],[.119,.071,.047],32);
  orb(headPivot,M.ivory,[.085,-.198,.330],[.119,.071,.047],32);
  // Brown, wet-look eye lenses with black pupils and light catchlights.
  for(const sign of [-1,1]){
    const x=sign*.158;
    const eye=orb(headPivot,M.iris,[x,-.030,.391],[.079,.111,.032],34);
    orb(headPivot,M.dark,[x+.005,-.032,.423],[.057,.088,.020],30);
    orb(headPivot,M.shine,[x-.022,.021,.447],[.024,.028,.013],18);
    orb(headPivot,M.flowerCenter,[x+.028,-.089,.444],[.012,.014,.009],12);
    const cheek=orb(headPivot,M.peach,[sign*.284,-.164,.280],[.064,.029,.012],30);
    cheek.rotation.z=sign*.10;
    // Ear-to-cheek whiskers carefully curved, not stiff spikes.
    for(let i=0;i<2;i++){
      const sy=-.17-i*.058;
      path([[sign*.325,sy,.288],[sign*.375,sy+.012,.263],[sign*.427,sy+(i?-.013:.029),.231]],.0035,M.brown,headPivot,16);
    }
  }
  // Hand-shaped rose-colored nose and smiling cat mouth.
  orb(headPivot,M.nose,[0,-.179,.398],[.041,.024,.017],20);
  path([[0,-.198,.402],[0,-.219,.405]],.006,M.brown,headPivot,6);
  path([[0,-.219,.405],[-.043,-.239,.403],[-.076,-.218,.395]],.006,M.brown,headPivot,12);
  path([[0,-.219,.405],[.043,-.239,.403],[.076,-.218,.395]],.006,M.brown,headPivot,12);
  // Embroidered eyebrow accents soften the expression.
  for(const side of [-1,1])path([[side*.115,.13,.306],[side*.162,.145,.300],[side*.199,.137,.29]],.0045,M.brown,headPivot,10);

  // Cotton neckerchief: fabric ring, triangular pleated front and tied knot.
  const scarf=mesh(new THREE.TorusGeometry(.255,.080,14,44,Math.PI*2),M.sage);
  scarf.rotation.x=Math.PI/2;scarf.position.set(0,.699,.17);
  // Rounded triangular front cloth, gently curving in 3D.
  const clothVertices=[
     -.249,.695,.450,  .249,.695,.450,  .0,.460,.510,
     -.214,.655,.485, .217,.655,.485, .0,.473,.522
  ];
  const clothGeo=new THREE.BufferGeometry();
  clothGeo.setAttribute('position',new THREE.Float32BufferAttribute(clothVertices,3));
  clothGeo.setIndex([0,1,2,3,5,4]);
  clothGeo.computeVertexNormals();
  const clothMat=M.sage.clone();clothMat.side=THREE.DoubleSide;
  mesh(clothGeo,clothMat,root);
  flower(root,.0,.636,.507,.068);
  const tie=new THREE.Group();tie.position.set(-.274,.692,.09);root.add(tie);
  orb(tie,M.sage2,[0,0,0],[.098,.083,.078],20);
  const bow1=orb(tie,M.sage,[-.11,.02,-.035],[.154,.065,.045],20);bow1.rotation.z=.40;
  const bow2=orb(tie,M.sage,[-.025,-.145,-.015],[.063,.159,.045],20);bow2.rotation.z=.34;

  // Actual curved leather strap, framed satchel and raised stitched flap.
  path([[.171,.760,-.025],[.13,.706,.198],[.047,.61,.306],[-.10,.457,.355],[-.265,.340,.281]],.039,M.leather,root,42);
  const bagPivot=new THREE.Group();
  bagPivot.position.set(-.292,.396,.244);bagPivot.rotation.z=.08;root.add(bagPivot);
  const roundedRect=(w,h,r)=>{
    const s=new THREE.Shape();
    s.moveTo(-w/2+r,-h/2);
    s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return s;
  };
  const bagMesh=mesh(new THREE.ExtrudeGeometry(roundedRect(.26,.28,.056),{
    depth:.116,bevelEnabled:true,bevelSize:.015,bevelThickness:.017,bevelSegments:3,curveSegments:8
  }),M.leather,bagPivot);
  bagMesh.position.z=-.06;
  const flap=mesh(new THREE.ExtrudeGeometry(roundedRect(.253,.143,.035),{
    depth:.017,bevelEnabled:true,bevelSize:.010,bevelThickness:.009,bevelSegments:3
  }),M.leatherDark,bagPivot);flap.position.set(0,.066,.082);
  // Stitching along the flap: individual fine cream thread dots.
  for(let i=-5;i<=5;i++){
    orb(bagPivot,M.stitch,[i*.019,.122,.106],[.004,.004,.003],8);
  }
  flower(bagPivot,0,.052,.126,.048);
  orb(bagPivot,M.metal,[0,-.042,.119],[.020,.020,.010],10);

  const charm=new THREE.Group();charm.position.set(-.155,.220,.388);root.add(charm);
  orb(charm,M.metal,[0,.055,-.008],[.019,.027,.014],12);
  const coin=orb(charm,M.goldLight,[0,0,0],[.061,.074,.018],20);
  // Stylized hanok silhouette etched onto a little gold charm.
  path([[-.035,.005,.02],[0,.039,.021],[.037,.005,.02]],.005,M.leatherDark,charm,10);
  path([[-.027,.005,.025],[-.027,-.032,.025],[.028,-.032,.025],[.028,.005,.025]],.005,M.leatherDark,charm,12);
  orb(charm,M.flowerCenter,[0,-.057,.003],[.026,.025,.013],10);

  // Four independently pivoting plush feet, with three toe accents.
  const feet=[];
  for(const [x,z] of [[-.234,.216],[.234,.216],[-.234,-.205],[.234,-.205]]){
    const leg=new THREE.Group();leg.position.set(x,.24,z);root.add(leg);
    orb(leg,M.cream,[0,-.105,0],[.147,.205,.155],24);
    orb(leg,M.ivory,[0,-.204,.075],[.151,.086,.185],24);
    for(let j=-1;j<=1;j++){
      const toe=orb(leg,M.peach,[j*.046,-.225,.235],[.009,.024,.006],8);
      toe.rotation.z=j*.12;
    }
    feet.push(leg);
  }
  // Subtle local shadow, no dependence on the world shader or receiveShadow.
  const shadow=mesh(new THREE.CircleGeometry(.46,28),new THREE.MeshBasicMaterial({
    color:0x4d4439,transparent:true,opacity:.20,depthWrite:false,side:THREE.DoubleSide
  }));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.011;shadow.castShadow=false;

  function animate(t,isMoving=false){
    headPivot.rotation.z=Math.sin(t*1.52)*.026;
    headPivot.rotation.x=Math.sin(t*.96)*.022;
    tailPivot.rotation.z=Math.sin(t*2.2)*.11;
    tailPivot.rotation.y=Math.sin(t*1.5)*.18;
    body.scale.set(1+.008*Math.sin(t*2.0),1,1+.009*Math.sin(t*2));
    const stride=isMoving ? Math.sin(t*9)*.24 : 0;
    feet[0].rotation.x=stride;feet[3].rotation.x=stride;
    feet[1].rotation.x=-stride;feet[2].rotation.x=-stride;
  }
  return {root,headPivot,tailPivot,feet,materials:M,animate};
}

export function createDamiCompanion(scene, hill) {
  const model = createDamiModel();
  const root = model.root;
  root.name = 'Dami — playable character';
  root.userData.isPlayableCharacter = true;
  root.visible = false;
  root.scale.setScalar(.94);
  scene.add(root);

  // The streets use a separate shader; these lights illuminate Dami's PBR
  // materials without altering the environment's existing palette.
  const ambient = new THREE.AmbientLight(0xfff5e8, 1.35);
  const sun = new THREE.DirectionalLight(0xffe6bf, 1.20);
  sun.position.set(-2,7,5);
  const fill = new THREE.DirectionalLight(0xc9dbff,.55);
  fill.position.set(4,4,-2);
  scene.add(ambient,sun,fill);

  let heading=Math.PI;
  let initialized=false;

  function update({x,z,vx=0,vz=0,dt=.016,elapsed,walking,visible}) {
    root.visible = !!visible;
    if (!visible) {initialized=false;return;}
    root.position.set(x,hill(x,z)+.04,z);

    // The character's own movement determines the facing direction. Camera
    // turning alone must NOT rotate or translate Dami.
    const speed=Math.hypot(vx,vz);
    if(!initialized) {
      heading = Math.PI; // Face into the village (local +Z points forward).
      root.rotation.y=heading;
      initialized=true;
    }
    if(speed>.12) {
      const desiredHeading=Math.atan2(vx,vz);
      const delta=Math.atan2(Math.sin(desiredHeading-heading),Math.cos(desiredHeading-heading));
      heading += delta*(1-Math.exp(-dt*12));
    }
    root.rotation.y=heading;
    model.animate(elapsed,walking&&speed>.15);
  }
  function snapshot() {
    return {position:[root.position.x,root.position.y,root.position.z],
      heading:root.rotation.y,visible:root.visible,scale:root.scale.x};
  }
  return {group:root,update,model,snapshot};
}
