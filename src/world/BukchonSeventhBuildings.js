/**
 * D-3: bespoke Bukchon 7-gyeong hanok architecture and deterministic siting.
 *
 * These are real Three.js procedural solids in the shared world mesh, not
 * billboards or copies of the same residential box. Their visual language
 * follows the D-2 six-type concept board and Gahoe-dong's renovated hanoks.
 *
 * Coordinates are the approved, NON-GEOREFERENCED game reconstruction.
 * Preserve the original 5/6-gyeong houses and all navigable road coordinates.
 */
export const SEVENTH_HANOK_DESIGNS=Object.freeze([
  {id:'seven-a',style:'traditional',name:'격자창 전통 주택',s:12.5,side:-1},
  {id:'seven-b',style:'walled',name:'높은 담장과 솟을대문',s:23.2,side:1},
  {id:'seven-c',style:'courtyard',name:'열린 마당 한옥',s:34.0,side:-1},
  {id:'seven-d',style:'corner',name:'ㄱ자 모퉁이 한옥',s:44.9,side:1},
  {id:'seven-e',style:'atelier',name:'개량 한옥 작은 공방',s:56.4,side:-1},
  {id:'seven-f',style:'terraced',name:'석축 위 경사지 한옥',s:68.4,side:1}
]);
export const SEVENTH_HOUSE_FOOTPRINT=Object.freeze({width:7.10,depth:6.55,setback:5.35});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const h2=(x,z)=>Math.hypot(x,z);

function stationAt(samples,target){
  let length=0;
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const segment=h2(dx,dz);
    if(length+segment>=target || i===samples.length-1){
      const t=clamp((target-length)/(segment||1),0,1),denom=segment||1;
      return {x:a[0]+dx*t,z:a[1]+dz*t,
        tx:dx/denom,tz:dz/denom,nx:-dz/denom,nz:dx/denom,s:target};
    }
    length+=segment;
  }
  throw new Error('Missing 7-gyeong station '+target);
}

function localFromWorld(x,z,site){
  const dx=x-site.x,dz=z-site.z,c=Math.cos(site.angle),s=Math.sin(site.angle);
  return {x:dx*c+dz*s,z:-dx*s+dz*c};
}
export function distanceToHanokFootprint(x,z,site){
  const local=localFromWorld(x,z,site);
  const width=site.width??7.35,depth=site.depth??8.55;
  return h2(Math.max(0,Math.abs(local.x)-width*.5),
    Math.max(0,Math.abs(local.z)-depth*.5));
}
function corners(site,padding=0){
  const w=(site.width??7.35)*.5+padding;
  const d=(site.depth??8.55)*.5+padding;
  const c=Math.cos(site.angle),s=Math.sin(site.angle);
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>[
    site.x+x*c-z*s,site.z+x*s+z*c
  ]);
}
/** Oriented rectangle SAT: reject overlapping foundation platforms. */
export function hanokFootprintsOverlap(a,b,padding=.26){
  const ca=corners(a,padding),cb=corners(b,padding);
  for(const rect of [ca,cb]){
    for(let i=0;i<2;i++){
      const p=rect[i],q=rect[i+1],dx=q[0]-p[0],dz=q[1]-p[1];
      const n=h2(dx,dz)||1,axis=[-dz/n,dx/n];
      const dot=p=>p[0]*axis[0]+p[1]*axis[1];
      const valuesA=ca.map(dot),valuesB=cb.map(dot);
      if(Math.max(...valuesA)<Math.min(...valuesB)||
        Math.max(...valuesB)<Math.min(...valuesA))return false;
    }
  }
  return true;
}
function roadClearance(site,path){
  let margin=Infinity;
  const half=(path.widthAt?path.widthAt(path.samples[0][1]):path.width)*.5;
  // A centerline that runs THROUGH any section of the full oriented
  // building footprint will have negative margin and be rejected.
  for(const [x,z] of path.samples)
    margin=Math.min(margin,distanceToHanokFootprint(x,z,site)-half);
  return margin;
}

export function planSeventhHanokSites({path,paths,existingHouses=[]}){
  if(path.kind!=='seventh-loop')throw new Error('Expected 7-gyeong lane');
  const built=[],rejected=[];
  for(const design of SEVENTH_HANOK_DESIGNS){
    let selected=null;
    // Only tiny, reproducible siting shifts are allowed: each house stays
    // in its proposed part of the walking sequence, not anywhere in town.
    for(const delta of [0,1.6,-1.6,3.2,-3.2,4.5,-4.5]){
      const s=design.s+delta;
      if(s<10.2||s>73)continue;
      const lane=stationAt(path.samples,s);
      for(const side of [design.side,-design.side]){
        const angle=Math.atan2(-lane.nx*side,lane.nz*side);
        const site={
          ...design,s,side,angle,
          x:lane.x+lane.nx*side*SEVENTH_HOUSE_FOOTPRINT.setback,
          z:lane.z+lane.nz*side*SEVENTH_HOUSE_FOOTPRINT.setback,
          width:SEVENTH_HOUSE_FOOTPRINT.width,
          depth:SEVENTH_HOUSE_FOOTPRINT.depth,
          roadWidth:path.width,laneX:lane.x,laneZ:lane.z,
          seventh:true,routeIndex:1
        };
        const clearance=Math.min(...paths.map(p=>roadClearance(site,p)));
        if(clearance<.27){rejected.push({id:design.id,s,side,reason:'road'});continue;}
        if(existingHouses.some(h=>hanokFootprintsOverlap(site,h,.26))){
          rejected.push({id:design.id,s,side,reason:'original hanok'});continue;
        }
        if(built.some(h=>hanokFootprintsOverlap(site,h,.40))){
          rejected.push({id:design.id,s,side,reason:'another 7-gyeong hanok'});continue;
        }
        if(built.some(h=>h.side===side&&Math.abs(h.s-s)<8.2)){
          rejected.push({id:design.id,s,side,reason:'same-side frontage'});continue;
        }
        selected={...site,clearance};
        break;
      }
      if(selected)break;
    }
    if(!selected)throw new Error(
      'Cannot place 7-gyeong '+design.id+' safely; tried '+JSON.stringify(rejected.filter(r=>r.id===design.id))
    );
    built.push(selected);
  }
  return {
    buildings:built,
    // The C road's generic walls must not obscure the new facades.
    // Each reserved span is replaced by a full 7.1m authentic wall/gate.
    frontageSpans:built.map(b=>({id:b.id,side:b.side,from:b.s-3.58,to:b.s+3.58})),
    rejected
  };
}

/** Draw six genuinely different hanok silhouette types into one existing
 * THREE.BufferGeometry. All colors resolve through BukchonWorld's existing
 * material/shadow/night shader, with zero network/download cost.
 */
export function buildSeventhHanoks({plan,withFrame,box,face,cylinder,sphere,textured,signs,hill}){
  const summary={buildings:plan.buildings,frontageSpans:plan.frontageSpans,
    styles:[],lights:[],gates:0,roofs:0,windows:0,stoneCourses:0,lanterns:0};
  const core=(w=5.75,d=4.65,cz=.40,front=-2.58)=>{
    box(0,-.05,cz,w+.30,.36,d+.27,'stoneFoundation');
    box(0,.17,cz,w+.22,.16,d+.20,'stoneLight');
    box(0,1.47,cz,w,2.50,d,'plaster');
    // Traditional square timber posts are clearly legible at walking scale.
    for(const x of [-w*.5,-w*.25,0,w*.25,w*.5]){
      box(x,1.56,front-.08,.125,2.56,.22,'timber');
      box(x,.46,front-.12,.26,.13,.31,'stoneFoundation');
      box(x,2.81,front-.07,.27,.14,.37,'timberLight');
    }
    box(0,2.89,front-.09,w+.23,.22,.27,'timber');
    box(0,.53,front-.08,w+.08,.16,.23,'timberLight');
  };
  function lattice(x,y,z,w=1.24,h=1.58,cols=4,rows=5){
    box(x,y,z,w,h,.072,'timber');
    box(x,y,z-.05,w-.14,h-.13,.029,'hanokPaperWindow');
    for(let i=1;i<cols;i++)
      box(x-w*.5+w*i/cols,y,z-.098,.035,h-.16,.039,'timberLight');
    for(let j=1;j<rows;j++)
      box(x,y-h*.5+h*j/rows,z-.102,w-.15,.034,.039,'timberLight');
    box(x,y-h*.5+.12,z-.113,w-.08,.06,.045,'timber');
    summary.windows++;
  }
  function roof(cx=0,cz=.35,w=6.5,d=5.6,y=3.20,rise=.88,tone='tileInk'){
    const hw=w*.5,hd=d*.5,ridge=w*.21,roofY=y+rise;
    const edgeColor=tone==='tileInk'?'tileInkLight':
      tone==='tileJade'?'tileJadeLight':
      tone==='tilePlum'?'tilePlumLight':'tileIndigoLight';
    // A central ridge and four sloped hip faces. Courses and longitudinal
    // joint rhythms give these actual curved-looking giwa (not black slabs).
    for(const sign of [-1,1]){
      for(let row=0;row<6;row++){
        const t0=row/6,t1=(row+1)/6;
        for(let col=0;col<12;col++){
          const u0=col/12,u1=(col+1)/12;
          const pt=(t,u)=>{
            const span=hw*(1-t)+ridge*t;
            return [cx+(u*2-1)*span,
              y+rise*t+.036*Math.sin(Math.PI*t),
              cz+sign*hd*(1-t)];
          };
          face(pt(t0,u0),pt(t0,u1),pt(t1,u1),pt(t1,u0),
            [0,1,sign*.60],
            (col+row)%9===0?edgeColor:tone);
          if(col%3===1){
            const a=pt(t0,u0+.008),b=pt(t1,u0+.008);
            const lift=p=>[p[0]+.036,p[1]+.025,p[2]];
            face(a,lift(a),lift(b),b,[0,1,0],edgeColor);
          }
        }
      }
      for(let i=0;i<15;i++){
        const x=cx-hw+(i+.5)*w/15;
        box(x,y-.027,cz+sign*(hd+.045),w/15-.018,.08,.15,
          i%4===0?edgeColor:'tileRidge');
      }
    }
    for(const side of [-1,1]){
      const x=cx+side*hw,rx=cx+side*ridge;
      face([x,y,cz-hd],[rx,roofY,cz],[rx,roofY,cz],
        [x,y,cz+hd],[side*.5,1,0],tone);
      box(x,y-.09,cz,.13,.16,d+.16,'tileRidge');
    }
    box(cx,roofY+.015,cz,w*.43,.14,.23,edgeColor);
    for(let i=0;i<12;i++){
      const x=cx-ridge+(i+.5)*ridge*2/12;
      box(x,roofY+.085,cz,.17,.075,.20,i%3===0?'tileRidge':edgeColor);
    }
    // Exposed rafters and their shadows below the forward eaves.
    for(let x=-hw+.4;x<hw;x+=.7)
      box(cx+x,y-.22,cz-hd+.22,.12,.21,.63,'woodShade');
    summary.roofs++;
  }
  function band(x,w,z,height=1.71,baseColor='stoneMasonry'){
    box(x,.34,z,w,.66,.31,baseColor);
    box(x,.71,z,w,.10,.36,'stoneLight');
    box(x,1.06,z,w,.62,.29,'plaster');
    box(x,1.47,z,w,.23,.315,'brickTerracotta');
    for(let k=0;k<Math.floor(w/.36);k++){
      const xx=x-w*.5+(k+.5)*w/Math.floor(w/.36);
      box(xx,1.47,z-.172,.049,.20,.018,'mortar');
    }
    if(height>1.75){
      box(x,1.78,z,w,.44,.30,'plaster');
      box(x,2.04,z,w,.14,.32,'brick');
    }
    const top=height>1.75?2.16:1.62;
    box(x,top,z,w+.13,.12,.48,'tileRidge');
    face([x-w*.5,top+.04,z-.22],[x+w*.5,top+.04,z-.22],
      [x+w*.5,top+.20,z],[x-w*.5,top+.20,z],[0,1,0],'tileDark');
    face([x-w*.5,top+.20,z],[x+w*.5,top+.20,z],
      [x+w*.5,top+.04,z+.22],[x-w*.5,top+.04,z+.22],
      [0,1,0],'tileInk');
    summary.stoneCourses++;
  }
  function flankWalls(height=1.7,z=-3.17){
    band(-2.46,2.18,z,height);
    band(2.46,2.18,z,height);
  }
  function woodenGate(z=-3.22,raised=false){
    for(const x of [-1.23,1.23]){
      box(x,1.21,z,.20,2.43,.34,'timber');
      box(x,.20,z,.32,.39,.39,'stoneFoundation');
    }
    for(const x of [-.57,.57]){
      box(x,1.12,z-.12,1.09,2.12,.13,'gateWood');
      for(let i=0;i<4;i++)
        box(x-.40+i*.27,1.15,z-.203,.034,1.85,.024,'timberLight');
      for(const y of [.43,1.91])
        box(x,y,z-.22,.95,.045,.038,'woodShade');
    }
    for(const x of [-.18,.18]){
      sphere(x,1.21,z-.24,.053,.068,.028,'copper',7,4);
      sphere(x,1.21,z-.28,.027,.029,.015,'tileDark',7,4);
    }
    box(0,2.33,z,2.83,.18,.39,'timber');
    box(0,2.70,z,3.13,.18,.80,'tileInk');
    box(0,2.84,z,3.26,.12,.19,'tileRidge');
    if(raised){
      box(0,.05,z-.42,2.58,.12,.56,'stoneLight');
      box(0,-.04,z-.78,2.35,.10,.40,'stoneMasonry');
    }
    summary.gates++;
  }
  function lantern(x,z){
    box(x,2.36,z,.06,.29,.08,'woodShade');
    box(x,2.08,z,.36,.41,.28,'timber');
    box(x,2.09,z-.156,.27,.30,.021,'lampGlobe');
    box(x,2.35,z,.42,.07,.33,'tileDark');
    box(x,1.84,z,.41,.07,.30,'woodShade');
    summary.lanterns++;
  }
  function addressPlate(z=-3.40){
    // A compact dark-blue enamel house plate, not a fictitious tourist POI.
    box(3.04,1.46,z,.51,.49,.07,'woodShade');
    box(3.04,1.46,z-.05,.43,.40,.04,'dustyBlue');
    box(3.04,1.58,z-.075,.26,.035,.022,'white');
    box(3.04,1.38,z-.075,.22,.045,.022,'white');
  }
  function jars(x=2.87,z=-2.75){
    for(const i of [0,1]){
      const xx=x+i*.38,r=.18-i*.03,h=.42-i*.10;
      cylinder(xx,.17+h*.5,z+i*.1,r,h,'gateWood',10);
      cylinder(xx,.17+h,z+i*.1,r*.83,.07,'woodShade',9);
    }
  }
  function basicHome(tone='tileInk',decor=0){
    core();
    for(const x of [-1.76,1.76])lattice(x,1.60,-2.55,1.37,1.71,4,6);
    lattice(0,1.52,-2.57,1.33,1.93,3,6);
    roof(0,.29,6.45,5.70,3.19,.92,tone);
    if(decor)jars(2.75,-2.81);
  }
  function buildTraditional(){
    basicHome('tileIndigo',1);
    // Shallow wall lets players SEE the crafted wooden lattice facade.
    flankWalls(1.70);
    woodenGate();
    lantern(-2.02,-3.40);
    addressPlate();
  }
  function buildWalled(){
    basicHome('tileInk');
    // Privacy wall is visibly higher than the traditional house frontage.
    flankWalls(2.12);
    woodenGate(-3.23,true);
    box(-3.51,1.14,-.2,.27,2.20,5.65,'plaster');
    box(3.51,1.14,-.2,.27,2.20,5.65,'plaster');
    box(-3.51,2.28,-.2,.53,.13,5.78,'tileDark');
    box(3.51,2.28,-.2,.53,.13,5.78,'tileDark');
    lantern(-1.49,-3.47);
    addressPlate();
  }
  function buildCourtyard(){
    // A real view through the OPEN wooden doorway to a smaller rear home,
    // not a painted door over a solid wall.
    core(5.36,3.10,1.05,-.55);
    for(const x of [-1.30,1.30])lattice(x,1.54,-.64,1.37,1.65);
    roof(0,1.09,6.07,4.15,3.17,.84,'tileJade');
    flankWalls();
    for(const x of [-1.22,1.22]){
      box(x,1.30,-3.26,.19,2.6,.30,'timber');
      box(x,.22,-3.26,.32,.42,.43,'stoneFoundation');
    }
    box(0,2.64,-3.27,2.72,.26,.38,'timber');
    box(0,2.80,-3.27,2.85,.14,.72,'tileRidge');
    // Through-open gate: inset stepping stones lead into the visible maru.
    for(let i=0;i<5;i++)
      box(0,.055,-2.90+i*.49,1.42,.10,.37,
        i%2?'stoneLight':'stoneMasonry');
    box(0,.53,-.65,3.0,.13,1.10,'timberLight');
    for(const x of [-1.3,1.3])lantern(x,-3.39);
    jars(2.66,-2.90);
    summary.gates++;
  }
  function buildCorner(){
    // L-shaped, clearly different rooflines at the approach to a bend.
    core(4.45,4.45,.49,-2.27);
    lattice(-1.10,1.53,-2.37,1.21,1.76);
    lattice(1.08,1.53,-2.37,1.21,1.76);
    roof(-.69,.26,4.91,5.20,3.24,1.02,'tilePlum');
    box(2.39,1.37,.62,2.36,2.22,4.30,'plaster');
    for(const z of [-.52,.92])
      box(3.60,1.64,z,.06,1.37,.77,'timber');
    roof(2.37,.80,2.82,4.94,2.89,.74,'tileIndigo');
    flankWalls();
    woodenGate();
    lantern(-1.47,-3.40);
    addressPlate();
  }
  function buildAtelier(){
    basicHome('tileJade');
    // Reconstructed workshop: shopfront proportions and lit translucent
    // glazing, not an ordinary home with a random café label attached.
    box(0,1.45,-2.61,2.15,2.17,.10,'shopDark');
    box(0,1.47,-2.69,1.98,1.95,.035,'warmGlass');
    for(const x of [-.97,0,.97])
      box(x,1.47,-2.72,.070,1.96,.053,'timber');
    box(0,2.42,-2.75,2.12,.10,.07,'timberLight');
    box(0,.58,-2.76,2.12,.13,.10,'woodShade');
    for(const x of [-.24,.24])sphere(x,1.39,-2.78,.044,.049,.025,'copper',7,3);
    flankWalls(1.70);
    // Small open outer threshold, not a fake wooden residential door.
    for(const x of [-1.21,1.21])box(x,1.25,-3.22,.15,2.44,.23,'timber');
    box(0,2.45,-3.22,2.60,.17,.30,'timber');
    box(0,2.60,-3.22,2.69,.13,.55,'tileInk');
    box(0,.09,-3.13,2.13,.17,.42,'stoneLight');
    box(0,2.79,-2.79,2.12,.33,.083,'timber');
    textured(0,2.79,-2.84,1.93,.25,'z',signs.hanokAtelier);
    lantern(2.10,-3.42);
    summary.gates++;
  }
  function buildTerraced(){
    // A steep section has a proper built stone retaining course and
    // stair-step entry, while the roof remains level on the hillside.
    box(0,-.19,.25,6.65,.64,5.33,'stoneMasonry');
    box(0,.25,.25,6.63,.25,5.33,'stoneLight');
    basicHome('tileInk',1);
    flankWalls(2.02);
    woodenGate(-3.22,true);
    for(let i=0;i<3;i++)
      box(0,-.04+i*.105,-3.32+i*.25,2.55,.12,.31,
        i%2?'stoneLight':'stoneFoundation');
    for(const x of [-3.35,3.35]){
      box(x,.54,-2.90,.40,1.18,.63,'stoneMasonry');
      box(x,1.12,-2.90,.42,.12,.65,'stoneLight');
    }
    lantern(1.72,-3.46);
    addressPlate();
  }
  for(const site of plan.buildings){
    withFrame(site.x,site.z,site.angle,()=>{
      if(site.style==='traditional')buildTraditional();
      else if(site.style==='walled')buildWalled();
      else if(site.style==='courtyard')buildCourtyard();
      else if(site.style==='corner')buildCorner();
      else if(site.style==='atelier')buildAtelier();
      else if(site.style==='terraced')buildTerraced();
      else throw new Error('Unknown 7-gyeong silhouette '+site.style);
    },{level:true});
    summary.styles.push(site.style);
    // New neighborhood lamps use the same 8-nearest shader, not new lights.
    const lx=site.style==='courtyard'?1.30:-1.48,lz=-3.40;
    const c=Math.cos(site.angle),s=Math.sin(site.angle);
    summary.lights.push({
      x:site.x+lx*c-lz*s,y:hill(site.x,site.z)+2.12,
      z:site.z+lx*s+lz*c,radius:6.5,
      type:'seven-hanok',index:summary.lights.length
    });
  }
  return summary;
}
