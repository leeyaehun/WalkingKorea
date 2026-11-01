/**
 * Bukchon 5-gyeong: one reference-sculpted NEXT-UPHILL hanok.
 *
 * The photographs show an exceptionally recognizable long roadside
 * facade: aged dark timber, two pairs of fine lattice windows, warm
 * white infills, a thin terracotta band surrounding CHARCOAL square
 * meander relief over dressed grey granite, white round exposed rafter
 * ends beneath a long curved giwa eave, and an asymmetric side gate.
 *
 * IMPORTANT: NOT the earlier photographed house (index 8), which has
 * a big plaster front gable. This second house is original index 10,
 * west side, z≈37.51 — immediately uphill from that previous house.
 *
 * Local -Z is the road-facing direction; units are game metres.
 * All surfaces are physical geometry in BukchonWorld's shared mesh.
 */
export const FIVE_GYEONG_UPHILL_HANOK=Object.freeze({
  id:'bukchon-05-uphill-lattice-hanok',
  label:'북촌 5경 · 긴 격자창과 전돌 무늬담 한옥',
  originalIndex:10,side:-1,routeIndex:0,
  lowerLaneZ:34,upperLaneZ:41,
  footprint:Object.freeze({width:7.35,depth:8.55}),
  facadeStyle:'aged-dark-timber-double-lattice-over-granite',
  photoReferences:3,
  streetFacing:true
});

export function isFiveGyeongUphillSite({index,side,routeIndex,laneZ}){
  const cfg=FIVE_GYEONG_UPHILL_HANOK;
  return index===cfg.originalIndex&&side===cfg.side&&
    routeIndex===cfg.routeIndex&&laneZ>cfg.lowerLaneZ&&
    laneZ<cfg.upperLaneZ;
}

export function buildFiveGyeongUphillHanok({box,face,sphere,cylinder}){
  const stats={id:FIVE_GYEONG_UPHILL_HANOK.id,
    kind:'reference-uphill-lattice-hanok',
    graniteBlocks:0,meanderCells:0,redBrickCourses:0,
    pairedWindows:0,latticeMullions:0,rafters:0,whiteEaveEnds:0,
    tileQuads:0,raisedTileSeams:0,gableTimbers:0,woodPosts:0,
    gatewayLeaves:0,utilities:0,photoMatchedFacades:1
  };
  const FRONT=-4.15;
  const roofW=3.79,roofD=4.08;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // Raised stone plinth of the SAME original plot; heavy, weathered
  // bottom stone and much thinner upper white plaster shell.
  box(0,-.13,.04,7.30,.33,8.50,'stoneFoundation');
  box(0,.13,.04,7.25,.12,8.47,'stoneLight');
  box(0,1.91,.23,6.84,2.69,7.34,'plaster');
  box(0,2.98,.24,6.90,.24,7.40,'timber');
  for(const x of [-3.39,0,3.39]){
    box(x,1.91,-3.57,.20,2.69,.25,'woodShade');
    box(x,.55,-3.57,.35,.24,.37,'stoneFoundation');
    stats.woodPosts++;
  }
  // Back and side wall are actual solid envelopes. The public street
  // sees the lovingly built front while the house remains credible from
  // an orbiting 3rd-person camera.
  for(const side of [-1,1]){
    const x=side*3.43;
    box(x,1.93,.18,.18,2.59,7.46,'plaster');
    for(const z of [-3.32,-1.14,1.08,3.29]){
      box(x,1.84,z,.21,2.60,.22,'timber');
      box(x,.62,z,.36,.25,.33,'stoneFoundation');
      stats.woodPosts++;
    }
    box(x,2.98,.18,.30,.22,7.48,'woodShade');
    box(x,.56,.18,.30,.19,7.46,'timberLight');
  }
  box(0,1.90,3.89,6.85,2.48,.18,'plaster');

  // Exterior photographic facade, closest to the lane, intentionally
  // IN FRONT of the internal basic plaster body. No old generic facade
  // is generated for this ONE site by BukchonWorld.
  box(0,.68,FRONT,7.04,1.31,.27,'stoneMasonry');
  box(0,.13,FRONT-.12,7.18,.16,.37,'stoneFoundation');
  box(0,1.32,FRONT-.12,7.03,.12,.34,'stoneLight');

  // Individual offset grey stone blocks: visible physical relief and
  // mortar cuts at real walking-camera height.
  const cells=16,rows=5,w=6.98/cells;
  for(let r=0;r<rows;r++){
    const y=.19+r*.216;
    for(let i=0;i<cells;i++){
      const x=-3.48+(i+.5)*w + (r%2?.08:0);
      if(x+w*.5>3.49)continue;
      const tone=(r+i*2)%11===0?'stoneGrey':
        (r*3+i)%5===0?'stoneLight':'stoneMasonry';
      box(x,y,FRONT-.166,w-.043,.186,.056,tone);
      stats.graniteBlocks++;
    }
  }
  // Distinct narrow RED-BRICK lines above and below the charcoal/grey
  // square spiral motif. NEVER one broad red strip or a white solid wall.
  for(const y of [1.315,1.888]){
    box(0,y,FRONT-.18,7.06,.088,.090,'brickTerracotta');
    for(let i=0;i<19;i++){
      const x=-3.37+(i+.5)*6.74/19;
      box(x,y,FRONT-.23,.037,.072,.041,'mortar');
      stats.redBrickCourses++;
    }
  }

  const fretY0=1.385,fretY1=1.833;
  box(0,(fretY0+fretY1)*.5,FRONT-.15,7.00,fretY1-fretY0,.09,'stoneGrey');
  const units=17,unitW=6.96/units;
  for(let i=0;i<units;i++){
    const x=-3.48+(i+.5)*unitW;
    const z=FRONT-.217,offset=(i%2===0);
    // Each meander is a raised stepped ㄱ/C-shaped dark granite trace,
    // not a random decorative pattern.
    box(x,fretY1-.041,z,unitW*.84,.062,.043,'woodShade');
    box(x-unitW*.32,1.59,z-.009,.052,.42,.051,'woodShade');
    box(x,fretY0+.047,z,unitW*.80,.064,.048,'woodShade');
    box(x+unitW*.29,1.53,z-.013,.055,.22,.052,'woodShade');
    box(x+(offset?-.073:.073),1.68,z-.022,unitW*.39,.052,.046,'woodShade');
    box(x+(offset?.073:-.073),1.49,z-.021,unitW*.30,.050,.047,'stoneLight');
    stats.meanderCells++;
  }
  // Projecting stone sill above the lower wall and full length roof-
  // sheltering wooden beam (actually separate from the window frames).
  box(0,1.958,FRONT-.20,7.18,.15,.32,'stoneLight');
  box(0,2.074,FRONT-.15,7.13,.17,.29,'woodShade');

  // White paper fields between dark timber structural posts.
  box(0,2.72,FRONT+.14,6.98,1.28,.12,'plaster');
  for(const x of [-3.39,0,3.39]){
    box(x,2.71,FRONT-.13,.23,1.62,.28,'woodShade');
    box(x,3.54,FRONT-.14,.32,.20,.45,'timber');
    stats.woodPosts++;
  }
  box(0,3.55,FRONT-.13,7.11,.22,.43,'woodShade');
  box(0,3.67,FRONT-.21,7.12,.07,.28,'timberLight');

  function pairedWindow(cx,w=2.59){
    const y=2.76,zh=FRONT-.257,h=1.25;
    box(cx,y,zh,w,h,.12,'timber');
    box(cx,y,zh-.074,w-.12,h-.11,.035,'hanokPaperWindow');
    // Heavy wooden center jamb: TWO actual matching sliding windows.
    box(cx,y,zh-.123,.13,h+.08,.075,'woodShade');
    for(const half of [-1,1]){
      const mid=cx+half*w*.25;
      for(let i=1;i<6;i++){
        const x=mid-w*.25+i*w*.5/6;
        box(x,y,zh-.142,.030,h-.13,.042,'timberLight');
        stats.latticeMullions++;
      }
      for(let j=1;j<6;j++){
        box(mid,y-h*.5+j*h/6,zh-.148,w*.5-.11,.029,.042,
          j%2?'timberLight':'woodShade');
        stats.latticeMullions++;
      }
      for(const edge of [mid-w*.25+.055,mid+w*.25-.055]){
        box(edge,y,zh-.149,.055,h-.075,.052,'timber');
      }
      // Small original wooden slide handle, no modern store lettering.
      box(cx+half*.115,2.61,zh-.182,.045,.10,.055,'copper');
    }
    box(cx,2.14,zh-.17,w+.18,.13,.28,'timberLight');
    box(cx,3.40,zh-.13,w+.15,.14,.24,'timber');
    stats.pairedWindows++;
  }
  pairedWindow(-1.68,2.54);
  pairedWindow(1.70,2.54);

  // Heavy roof brackets and hundreds of visible small true eave elements.
  for(let x=-3.32;x<3.37;x+=.56){
    box(x,3.55,-3.80,.23,.18,.72,'timber');
    box(x,3.63,-3.97,.17,.18,.60,'woodShade');
    box(x,3.71,-4.04,.11,.13,.59,'timberLight');
    stats.rafters++;
  }

  function roofY(x,z){
    const a=clamp(Math.abs(z)/roofD,0,1),b=clamp(Math.abs(x)/roofW,0,1);
    const bowed= .145*Math.pow(a,4)*Math.pow(b,4);
    return 4.76-1.30*Math.pow(a,1.21)-.12*Math.pow(b,4)+bowed;
  }
  const pt=(x,z,dy=0)=>[x,roofY(x,z)+dy,z];
  // Two wide pitched GIWA planes, with ridges parallel to the road:
  // deliberately a very different silhouette from the older house's
  // broad *road-facing* triangular plaster gable.
  for(const direction of [-1,1]){
    for(let row=0;row<12;row++){
      const z0=direction*roofD*row/12,z1=direction*roofD*(row+1)/12;
      for(let col=0;col<17;col++){
        const x0=-roofW+(2*roofW)*col/17;
        const x1=-roofW+(2*roofW)*(col+1)/17;
        const tile=(row+col*3)%11===0?'tileInkLight':
          (col+row)%4===0?'tileIndigo':'tileInk';
        face(pt(x0,z0),pt(x1,z0),pt(x1,z1),pt(x0,z1),
          [0,1,direction*.4],tile);
        stats.tileQuads++;
        if(col%2===0){
          const gx=x0+.10,gh=.085;
          face(pt(gx,z0,.06),pt(gx+gh,z0,.06),
            pt(gx+gh,z1,.044),pt(gx,z1,.044),
            [0,1,direction*.3],col%4===0?'tileInkLight':'tileRidge');
          stats.raisedTileSeams++;
        }
      }
    }
    // Dark clay fascia with rounded ceramic eave ends and aged timber
    // circles painted white from weathering, as in both reference photos.
    box(0,3.40,direction*(roofD+.03),7.67,.14,.16,'tileRidge');
    for(let i=0;i<22;i++){
      const x=-3.56+(i+.5)*7.12/22;
      const edgeY=roofY(x,direction*roofD);
      sphere(x,edgeY-.032,direction*(roofD+.12),
        .111,.093,.085,i%4===0?'stoneLight':'tileEnd',8,4);
      stats.whiteEaveEnds++;
      if(direction===-1){
        // 1 more small white rafter END PER tile rhythm is important:
        // the photo has bright round white dots all along the low eaves.
        sphere(x,3.43,direction*(roofD+.25),.10,.103,.08,
          i%3===0?'mortar':'stoneLight',8,4);
        stats.whiteEaveEnds++;
      }
    }
  }
  // Ridge cap with staggered older gray tiles.
  box(0,4.80,0,7.29,.17,.30,'tileInkLight');
  for(let i=0;i<20;i++){
    const x=-3.53+(i+.5)*7.06/20;
    box(x,4.88,0,.20,.075,.22,i%4===0?'stoneLight':'tileRidge');
  }
  for(const x of [-3.73,3.73]){
    box(x,3.47,0,.15,.20,8.05,'tileInk');
  }

  // Light-weight traditional side gable is visible looking diagonally
  // uphill/downhill. The specific gable in the third reference photo
  // has white lime plaster and broad light-honey aging braces.
  function sideGable(x,dir){
    const z0=-3.25,z1=3.25,front=dir*(x+.12);
    const norm=[dir,0,0],edge=3.43,peak=4.43;
    face([front,edge,z0],[front,edge,z1],
      [front,peak,0],[front,peak,0],norm,'plaster');
    // Main large timber silhouette along 2 pitched gable edges.
    function brace(zA,yA,zB,yB,thick=.20){
      const dz=zB-zA,dy=yB-yA,L=Math.hypot(dz,dy)||1;
      const vz=-dy/L*thick*.5,vy=dz/L*thick*.5;
      face([front+dir*.041,yA+vy,zA+vz],
        [front+dir*.041,yB+vy,zB+vz],
        [front+dir*.041,yB-vy,zB-vz],
        [front+dir*.041,yA-vy,zA-vz],norm,'timberLight');
      stats.gableTimbers++;
    }
    brace(z0,edge,0,peak,.28);
    brace(0,peak,z1,edge,.28);
    // Horizontal beams and small vertical joinery.
    for(const y of [3.61,3.90]){
      const span=(peak-y)/(peak-edge)*3.25;
      box(front+dir*.08,y,0,.12,.12,span*2,
        y>3.8?'timber':'timberLight');
      stats.gableTimbers++;
    }
    box(front+dir*.09,3.90,0,.14,.82,.18,'timberLight');
    stats.gableTimbers++;
  }
  sideGable(3.42,1);
  sideGable(3.42,-1);

  // Asymmetric small connecting gate near the uphill property boundary.
  // Keep the large paired windows intact unlike the photo's neighboring
  // large arched entrance: this gate sits in a slightly recessed niche.
  const gx=-3.05,gz=FRONT-.155;
  box(gx,1.20,gz,.78,2.19,.15,'gateWood');
  for(const side of [-1,1]){
    const x=gx+side*.35;
    box(x,1.30,gz-.10,.085,2.35,.20,'woodShade');
  }
  for(let i=0;i<5;i++){
    const x=gx-.31+i*.155;
    box(x,1.18,gz-.116,.035,1.70,.047,'timberLight');
  }
  for(const y of [.47,1.88]){
    box(gx,y,gz-.12,.65,.050,.043,'woodShade');
  }
  sphere(gx+.08,1.29,gz-.16,.034,.041,.030,'copper',7,4);
  box(gx,2.43,gz,.99,.16,.37,'timber');
  box(gx,2.59,gz,1.18,.19,.66,'tileInk');
  box(gx,2.71,gz,1.22,.09,.23,'tileRidge');
  box(gx, .14,gz-.10,.83,.16,.38,'stoneFoundation');
  stats.gatewayLeaves++;

  // Domestic utility texture: the reference shows the muted red gas
  // pipes, a round wall meter, curb drainage and weathered iron detail.
  const utilityX=3.20,uz=FRONT-.235;
  box(utilityX,1.43,uz,.085,2.37,.086,'brickTerracotta');
  box(utilityX-.19,2.35,uz,.42,.077,.075,'brickWarm');
  box(utilityX-.39,1.88,uz-.035,.47,.55,.20,'stoneGrey');
  box(utilityX-.39,1.91,uz-.153,.31,.31,.035,'stoneLight');
  cylinder(utilityX-.39,1.92,uz-.193,.118,.07,'copper',12);
  box(utilityX-.39,1.92,uz-.235,.15,.14,.030,'warmGlass');
  box(utilityX-.22, .58,uz,.045,.84,.10,'drainIron');
  stats.utilities=1;

  // Narrow granite-and-black drain edge belongs to this property and is
  // recessed, NOT another paved road or an obstacle in the 3.24m corridor.
  for(let i=0;i<13;i++){
    const x=-3.37+(i+.5)*6.74/13;
    box(x,.042,FRONT-.32,6.74/13-.014,.065,.18,
      i%3===0?'drainIron':'stoneGrey');
  }
  stats.streetFacade={xFrom:-3.58,xTo:3.58,frontZ:FRONT,
    wallHeight:1.95,windowPairs:2,
    signatures:['dark timber','two pairs lattice','thin red brick','charcoal Korean meander','white rafter ends']};
  return stats;
}
