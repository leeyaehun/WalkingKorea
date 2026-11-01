/**
 * Bukchon 5-gyeong LEFT foreground — one photographic-reference house.
 *
 * User reference: ascending Bukchon-ro 11-gil, pale cut-stone wall with
 * Greek-key meander, heavy age-darkened structural wood, wide ivory gable,
 * deep exposed eaves, charcoal handmade giwa and a timber residential gate.
 *
 * These are actual world-space solids in the existing shared buffer, not a
 * photo-plane, mass-produced shop facade or a repeated HanokKit variation.
 * No real private house number, residents' names or copyrighted sign artwork.
 *
 * Local coordinates: -Z faces the road. The existing parent footprint is
 * 7.35m wide x 8.55m deep, centred and leveled by BukchonWorld.withFrame.
 */
export const FIVE_GYEONG_REFERENCE_HANOK=Object.freeze({
  id:'bukchon-05-foreground-left',
  name:'북촌 5경 · 목조 회벽과 화강석 무늬담 한옥',
  landmark:'Bukchon 5-gyeong / left foreground from the lower street',
  street:'북촌로11길',
  side:-1,
  lowerZ:[35,49],
  footprint:{width:7.35,depth:8.55},
  frontZ:-4.20,
  height:4.87
});

/** Never create a second copy or alter any pre-existing building site. */
export function isFiveGyeongHeroSite({routeIndex,side,laneZ}){
  return routeIndex===0&&side===FIVE_GYEONG_REFERENCE_HANOK.side&&
    Number.isFinite(laneZ)&&laneZ>FIVE_GYEONG_REFERENCE_HANOK.lowerZ[0]&&
    laneZ<FIVE_GYEONG_REFERENCE_HANOK.lowerZ[1];
}

export function buildFiveGyeongReferenceHanok({box,face,sphere,cylinder}){
  const detail={
    id:FIVE_GYEONG_REFERENCE_HANOK.id,
    kind:'reference-hanok',
    footprint:{...FIVE_GYEONG_REFERENCE_HANOK.footprint},
    roofQuads:0,tileRibs:0,tileEndCaps:0,
    woodPosts:0,woodBrackets:0,woodRafters:0,
    graniteBlocks:0,fretMotifs:0,latticeWindows:0,
    gateLeaves:0,lanterns:0,courtyardDepth:0
  };
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const lowerWallZ=-4.18;

  // Stepped granite foundation; the site receives its existing large
  // footing from the world. Here only the visible kerbside courses are new.
  box(0,.28,-.04,7.12,.55,8.05,'stoneFoundation');
  box(0,.56,-.03,7.10,.095,8.06,'stoneLight');
  box(0,.38,lowerWallZ,7.12,.73,.29,'stoneMasonry');
  box(0,.09,lowerWallZ-.035,7.13,.16,.35,'stoneGrey');

  // Recessed inhabited volume. The main front is BEHIND the lane-facing
  // enclosure, giving a credible deep gate / courtyard instead of a shop.
  box(0,1.76,.67,6.25,2.80,5.52,'plaster');
  box(0,.55,.67,6.32,.16,5.64,'stoneLight');
  box(0,3.07,.67,6.40,.27,5.65,'timber');
  box(0,3.24,-2.32,6.55,.22,.22,'woodShade');
  box(0,.63,-2.32,6.18,.15,.26,'timberLight');
  box(0,1.01,-2.49,6.25,.48,.13,'brickTerracotta');
  // Red handmade brick band, interrupted by dark mortar courses.
  for(let course=0;course<2;course++){
    for(let i=0;i<15;i++){
      const x=-3.0+(i+.5)*6/15+(course%2)*.06;
      box(x,.82+course*.24,-2.566,.31,.19,.035,
        (i+course)%5===0?'brickDark':'brickWarm');
    }
  }

  // Thick weathered timber posts and unmistakable heavy aged beam joints.
  const postX=[-3.04,-1.58,0,1.58,3.04];
  for(const x of postX){
    box(x,1.80,-2.57,.20,2.75,.27,'timber');
    box(x,.49,-2.57,.33,.26,.40,'stoneFoundation');
    box(x,3.15,-2.57,.39,.18,.45,'timberLight');
    box(x,3.30,-2.62,.53,.15,.66,'woodShade');
    detail.woodPosts++;
  }
  for(const x of [-3.04,3.04]){
    box(x,1.87,3.36,.18,2.62,.23,'timber');
    box(x,3.05,.33,.20,.22,5.92,'timberLight');
  }
  box(0,2.99,-2.62,6.46,.20,.33,'woodShade');
  box(0,2.78,-2.68,6.26,.11,.21,'timberLight');

  // Korean timber brackets and exposed "seokkarae" at the very deep eaves.
  // This is intentionally stronger than the tiny detail on district houses.
  for(const x of [-2.94,-1.78,-.59,.59,1.78,2.94]){
    box(x,3.17,-2.98,.38,.14,.72,'timber');
    box(x,3.26,-3.10,.27,.16,.53,'timberLight');
    box(x,3.36,-3.13,.17,.18,.82,'woodShade');
    detail.woodBrackets++;
  }
  for(let i=0;i<17;i++){
    const x=-3.28+i*6.56/16;
    box(x,3.15,-3.21,.115,.17,.88,i%4===0?'timberLight':'timber');
    detail.woodRafters++;
  }
  box(0,3.05,-3.44,6.91,.13,.15,'woodShade');

  // Every lattice is a shallow 3D hanji paper screen with physical timber
  // mullions, not a flat window photograph.
  function windowLattice(cx,cy,z,w,h,cols=5,rows=6){
    box(cx,cy,z,w,h,.085,'timber');
    box(cx,cy,z-.064,w-.17,h-.16,.027,'hanokPaperWindow');
    for(const x of [cx-w*.5+.075,cx+w*.5-.075])
      box(x,cy,z-.108,.072,h-.04,.040,'woodShade');
    for(const y of [cy-h*.5+.075,cy+h*.5-.075])
      box(cx,y,z-.108,w-.04,.072,.040,'woodShade');
    for(let i=1;i<cols;i++)
      box(cx-w*.5+i*w/cols,cy,z-.113,.034,h-.13,.036,'timberLight');
    for(let j=1;j<rows;j++)
      box(cx,cy-h*.5+j*h/rows,z-.119,w-.12,.036,.035,'timberLight');
    box(cx,cy-h*.5+.19,z-.132,w-.11,.065,.044,'timber');
    detail.latticeWindows++;
  }
  for(const x of [-2.22,-.80,.75,2.20])
    windowLattice(x,1.80,-2.68,1.12,1.66,4,6);
  // A side elevation is visible when looking up the road; create real
  // under-eave side windows, rather than leaving a featureless cube.
  for(const z of [-1.06,1.50])
    windowLattice(-3.169,1.83,z,1.0,1.54,4,5);

  // Reference-specific LARGE FRONT GABLE: warm lime plaster enclosed
  // between strong diagonal aged wooden rafters, not a generic hip box.
  const zG=-2.73;
  face([-3.02,3.16,zG],[3.02,3.16,zG],
    [0,4.53,zG],[0,4.53,zG],[0,0,-1],'plaster');
  // Triangle has a separate timber bottom sill and slope timbers, with
  // visible half lap and wooden plates.
  box(0,3.17,zG-.045,6.14,.24,.23,'timber');
  function slopedFascia(x0,y0,x1,y1,z,thickness,col){
    const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1;
    const px=-dy/len*thickness*.5,py=dx/len*thickness*.5;
    face([x0+px,y0+py,z],[x1+px,y1+py,z],
      [x1-px,y1-py,z],[x0-px,y0-py,z],[0,0,-1],col);
  }
  slopedFascia(-3.02,3.16,0,4.57,zG-.075,.19,'woodShade');
  slopedFascia(0,4.57,3.02,3.16,zG-.075,.19,'timber');
  box(0,4.55,zG-.17,.35,.22,.32,'timberLight');
  for(const x of [-2.53,-1.62,1.62,2.53])
    box(x,3.23,zG-.13,.11,.19,.21,'timberLight');
  // Low relief plaster surface is broken by two deliberate cross beams.
  box(0,3.52,zG-.060,4.00,.085,.105,'timberLight');
  box(0,3.77,zG-.063,2.76,.055,.102,'woodShade');

  // Pitched main roof with a slightly bowed front eave and upturned
  // corners. 12 real tile courses per side, 18 strips along ridge.
  const halfW=3.73,halfD=3.56;
  const roofY=(x,z)=>{
    const a=clamp(Math.abs(x)/halfW,0,1),b=clamp(Math.abs(z)/halfD,0,1);
    return 4.68-1.32*Math.pow(a,1.38)-.045*b*b+
      .16*Math.pow(a,3)*Math.pow(b,4);
  };
  function roofPoint(x,z,extra=0){return [x,roofY(x,z)+extra,z];}
  for(const side of [-1,1]){
    for(let row=0;row<12;row++){
      const x0=side*halfW*row/12, x1=side*halfW*(row+1)/12;
      for(let col=0;col<18;col++){
        const z0=-halfD+col*2*halfD/18,
          z1=-halfD+(col+1)*2*halfD/18;
        const shade=(col+3*row)%13;
        const tone=shade===0?'tileInkLight':
          shade<4?'tileIndigo':'tileInk';
        face(roofPoint(x0,z0),roofPoint(x1,z0),
          roofPoint(x1,z1),roofPoint(x0,z1),
          [side*.4,1,0],tone);
        detail.roofQuads++;
      }
      // Overlapping convex grey giwa rolls run down each roof plane.
      for(let col=0;col<18;col+=2){
        const z=-halfD+(col+.47)*2*halfD/18;
        const zNext=z+.095;
        face(roofPoint(x0,z,.043),roofPoint(x1,z,.047),
          roofPoint(x1,zNext,.025),roofPoint(x0,zNext,.025),
          [side*.4,1,0],col%6===0?'tileInkLight':'tileRidge');
        detail.tileRibs++;
      }
    }
    // Front-end shingles with actual round curved terminal giwa.
    for(let i=0;i<16;i++){
      const x=side*(i+.5)*halfW/16,y=roofY(x,-halfD);
      sphere(x,y-.03,-halfD-.10,.095,.087,.08,
        i%3===0?'tileLight':'tileEnd',8,4);
      detail.tileEndCaps++;
    }
    for(let j=0;j<17;j++){
      const z=-halfD+(j+.5)*2*halfD/17;
      box(side*(halfW+.05),roofY(side*halfW,z)-.07,z,
        .13,.125,2*halfD/17-.032,j%4===0?'tileInkLight':'tileRidge');
      // exposed edge supporting timber beneath the upturned roof corners
      if(j%2===0)box(side*(halfW-.27),3.13,z,.66,.13,.11,'timberLight');
    }
  }
  // Ridge cap and regularly spaced round-silhouette roof crests.
  box(0,4.73,0,.31,.15,7.05,'tileInkLight');
  for(let j=0;j<19;j++){
    const z=-3.40+j*6.80/18;
    box(0,4.83,z,.40,.11,.20,j%5===0?'tileEnd':'tileRidge');
  }
  // Front and rear eave soffit fascia, true solid beams not painted dark.
  for(const z of [-3.36,3.36])
    box(0,3.12,z,6.90,.13,.12,'woodShade');

  // The photo's prominent PALE GREY CUT-STONE WALL and raised black/grey
  // geometric fret course. Front wall is split at a clearly legible gate.
  function wallPanel(x0,x1,z=lowerWallZ){
    const w=x1-x0,cx=(x0+x1)*.5;
    box(cx,1.09,z,w,1.80,.27,'plaster');
    box(cx,.33,z-.13,w,.65,.046,'stoneMasonry');
    box(cx,.75,z-.141,w,.12,.05,'stoneLight');
    // Individually shaped dressed granite units; staggered mortar joints.
    for(let row=0;row<3;row++){
      const bottom=.54+row*.265,n=Math.max(2,Math.ceil(w/.43));
      for(let i=0;i<n;i++){
        const left=x0+i*w/n, right=x0+(i+1)*w/n;
        const inset=.025,xx=(left+right)*.5+(row%2? .022:0);
        if(xx+w/n*.5>x1-.006)continue;
        box(xx,bottom+.095,z-.163,w/n-inset,.205,.042,
          (row+i)%5===0?'stoneGrey':
          (row+i)%3===0?'stoneLight':'stoneMasonry');
        detail.graniteBlocks++;
      }
    }
    box(cx,1.45,z-.155,w,.080,.080,'stoneLight');
    // Greek-key / manja-inspired continuous rectilinear relief band:
    // a recognizable Bukchon patterned wall, not arbitrary random cubes.
    box(cx,1.72,z-.143,w,.43,.074,'stoneLight');
    const units=Math.max(1,Math.floor(w/.57));
    const step=w/units;
    for(let i=0;i<units;i++){
      const x=x0+(i+.5)*step;
      box(x,1.86,z-.192,step*.78,.049,.042,'stoneGrey');
      box(x-step*.32,1.73,z-.193,.051,.29,.043,'stoneGrey');
      box(x,1.62,z-.193,step*.66,.052,.043,'stoneGrey');
      box(x+step*.28,1.69,z-.193,.050,.15,.043,'stoneGrey');
      box(x+.01,1.75,z-.199,step*.27,.047,.044,'stoneGrey');
      detail.fretMotifs++;
    }
    box(cx,1.995,z-.033,w,.13,.35,'stoneFoundation');
    // Curved giwa coping, front slope in dark tile and pale ceramic ends.
    face([x0,2.02,z-.29],[x1,2.02,z-.29],
      [x1,2.23,z],[x0,2.23,z],[0,1,-.3],'tileInk');
    face([x0,2.23,z],[x1,2.23,z],
      [x1,2.02,z+.27],[x0,2.02,z+.27],[0,1,.3],'tileIndigo');
    box(cx,2.225,z,w+.08,.09,.17,'tileRidge');
    for(let x=x0+.17;x<x1-.05;x+=.34){
      sphere(x,2.00,z-.285,.113,.088,.081,
        Math.floor((x-x0)*9)%4===0?'stoneLight':'tileEnd',7,3);
      detail.tileEndCaps++;
    }
  }
  wallPanel(-3.53,.98);
  wallPanel(3.06,3.53);

  // Wraparound side masonry makes the volume believable in third person.
  for(const side of [-1,1]){
    const x=side*3.51;
    box(x,1.05,-.15,.21,1.84,7.52,'plaster');
    box(x, .41,-.15,.24,.71,7.52,'stoneMasonry');
    box(x,1.90,-.15,.47,.10,7.71,'tileRidge');
    for(let i=0;i<8;i++){
      const zz=-3.50+i*.92;
      box(x+side*.135,.75,zz,.039,.31,.75,
        i%3===0?'stoneGrey':'stoneLight');
      box(x+side*.140,1.15,zz,.041,.049,.81,'stoneGrey');
      detail.graniteBlocks++;
    }
    face([x-side*.23,2.07,-3.8],[x-side*.23,2.07,3.6],
      [x,2.22,3.6],[x,2.22,-3.8],[0,1,0],'tileInk');
  }

  // Wooden gateway set toward one end of the frontage, matching the
  // reference's asymmetry. Opposite from a symmetric village prop.
  const gateX=2.02,gateZ=lowerWallZ-.13;
  for(const x of [gateX-1.03,gateX+1.03]){
    box(x,1.17,gateZ,.20,2.32,.35,'woodShade');
    box(x,.24,gateZ,.34,.46,.46,'stoneFoundation');
    box(x,2.28,gateZ,.30,.19,.46,'timberLight');
    detail.woodPosts++;
  }
  box(gateX,2.39,gateZ,2.35,.23,.43,'timber');
  box(gateX,.19,gateZ,2.04,.20,.48,'stoneFoundation');
  for(const side of [-1,1]){
    const x=gateX+side*.495;
    box(x,1.15,gateZ-.085,.96,2.11,.12,'gateWood');
    for(let i=1;i<5;i++)
      box(x-.46+i*.185,1.15,gateZ-.169,.037,1.97,.045,'timberLight');
    for(const y of [.50,1.79])
      box(x,y,gateZ-.181,.91,.058,.040,'woodShade');
    sphere(gateX+side*.15,1.21,gateZ-.228,.049,.064,.028,'copper',8,4);
    detail.gateLeaves++;
  }
  // A separate little paljak-style gate canopy, with overhanging giwa.
  const canHalf=1.43,canD=.67;
  for(const side of [-1,1]){
    for(let i=0;i<9;i++){
      const x0=gateX+side*canHalf*i/9,
        x1=gateX+side*canHalf*(i+1)/9;
      const canopyY=x=>2.98-.43*Math.pow(Math.abs((x-gateX)/canHalf),1.3);
      for(const zSide of [-1,1]){
        const z0=gateZ+zSide*.04,z1=gateZ+zSide*canD;
        face([x0,canopyY(x0),z0],[x1,canopyY(x1),z0],
          [x1,canopyY(x1)-.06,z1],[x0,canopyY(x0)-.06,z1],
          [side*.25,1,zSide*.2],
          i%4===0?'tileInkLight':'tileInk');
        detail.roofQuads++;
      }
      const x=gateX+side*(i+.5)*canHalf/9;
      sphere(x,2.50,gateZ-canD-.08,.102,.078,.076,
        i%3===0?'tileLight':'tileEnd',7,3);
      detail.tileEndCaps++;
    }
  }
  for(const x of [gateX-1.04,gateX-.50,gateX,gateX+.50,gateX+1.04]){
    box(x,2.46,gateZ-canD+.14,.12,.14,.78,'timber');
    detail.woodRafters++;
  }
  box(gateX,3.02,gateZ,2.56,.14,.17,'tileRidge');
  // Dark drainpipe, restrained small residential wall lantern and door
  // hardware: the reference has lived-in infrastructural details.
  box(-3.25,2.40,-3.31,.06,.09,1.02,'drainIron');
  box(-3.32,1.55,-3.38,.07,1.65,.07,'drainIron');
  box(.50,2.16,gateZ-.27,.050,.35,.058,'woodShade');
  box(.50,1.87,gateZ-.28,.32,.42,.27,'timber');
  box(.50,1.87,gateZ-.429,.24,.31,.029,'lampGlobe');
  box(.50,2.13,gateZ-.28,.38,.074,.29,'tileDark');
  box(.50,1.62,gateZ-.28,.37,.07,.29,'woodShade');
  detail.lanterns++;
  // Courtyard depth is visible through and around the framed gate,
  // instead of a wall completely closing the gate opening.
  for(let i=0;i<4;i++){
    box(gateX,.105,-3.63+i*.43,1.48,.10,.33,
      i%2===0?'stoneLight':'stoneMasonry');
  }
  detail.courtyardDepth=4;
  return detail;
}
