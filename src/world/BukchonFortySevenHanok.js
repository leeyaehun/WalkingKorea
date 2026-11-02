/**
 * Bukchon 5-gyeong, west frontage: two related but NOT identical hanok
 * volumes between the previous #43-style courtyard and the 7-gyeong
 * side-alley mouth. Screenshot-guided game reconstruction, NOT surveyed
 * cadastral footprints of street address 47.
 *
 * Photo features: a low continuous dark giwa roof with white exposed
 * rafters, carved circular floral end tiles, warm honey/aged-brown wood,
 * grey dressed granite beneath a red/ivory bent meander band, strong
 * timber gates with a deep vestibule and lattice paper windows. The
 * upper section is less ornate and turns toward a side alley near z=1.5.
 *
 * One model replaces site index 14; the other site index 16. Both are
 * actual 3D primitives in the original BukchonWorld shared mesh.
 * They are intentionally related as the TWO visible volumes of a single
 * #47-inspired streetscape, without repeating the #43 house verbatim.
 */
export const FORTY_SEVEN_PLOTS=Object.freeze([
  Object.freeze({id:'bukchon-47-west-main-volume',index:14,side:-1,
    routeIndex:0,zMin:17,zMax:22,part:'main-house'}),
  Object.freeze({id:'bukchon-47-west-alley-volume',index:16,side:-1,
    routeIndex:0,zMin:8,zMax:13,part:'gatehouse'})
]);
export function fortySevenPartAt({index,side,routeIndex,laneZ}){
  return FORTY_SEVEN_PLOTS.find(p=>p.index===index&&p.side===side&&
    p.routeIndex===routeIndex&&laneZ>p.zMin&&laneZ<p.zMax)||null;
}

export function buildFortySevenVolume({box,face,sphere,cylinder,part}){
  if(!FORTY_SEVEN_PLOTS.some(p=>p.part===part))
    throw Error('Unknown 47-streetscape house volume: '+part);
  const isMain=part==='main-house';
  const plot=FORTY_SEVEN_PLOTS.find(p=>p.part===part);
  const detail={id:plot.id,kind:'reference-47-hanok',
    volume:part,photoInspired:true,
    graniteBlocks:0,terracottaMeanders:0,whiteFretStrokes:0,
    latticeWindows:0,latticeBars:0,woodPosts:0,
    gateLeaves:0,gateStuds:0,gateRecess:0,
    roofTiles:0,tileRibs:0,flowerCaps:0,
    carvedPetals:0,whiteRafterEnds:0,eaveRafters:0,
    utilityPieces:0,gableBeams:0
  };
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const front=-4.16;
  const frontRoof=-4.68;
  const rearRoof=4.08;
  const halfWidth=3.82;
  const ridgeY=isMain?4.89:4.67;
  const dripY=isMain?3.31:3.15;
  const gateX=isMain?-1.56:1.08;
  const gateWidth=isMain?1.60:1.95;

  // This is the same original 7.35 x 8.55m graded building lot, not
  // two more houses pasted on empty terrain.
  box(0,-.16,.02,7.30,.31,8.51,'stoneFoundation');
  box(0,.10,.02,7.22,.12,8.45,'stoneLight');
  box(0,1.90,.38,6.90,2.92,7.12,'plaster');
  box(0,3.40,.30,6.98,.23,7.21,'woodShade');
  box(0,.54,.30,6.99,.20,7.20,'timberLight');

  // Warm, structural wooden beams and genuine lime-plastered SIDE
  // elevations. The gatehouse's rear eave is one course lower than the
  // main volume, giving two roofline silhouettes from the downhill view.
  for(const side of [-1,1]){
    const x=side*3.42;
    box(x,1.80,.28,.20,2.79,7.40,'plaster');
    for(const z of [-3.29,-1.15,1.12,3.42]){
      box(x,1.85,z,.22,2.81,.25,
        isMain?'timberLight':'woodShade');
      box(x,.41,z,.38,.35,.36,'stoneMasonry');
      detail.woodPosts++;
    }
    box(x,3.36,.30,.26,.26,7.45,'timber');
    box(x,.47,.31,.29,.15,7.47,'stoneLight');
  }
  box(0,1.85,3.93,6.86,2.93,.17,'plaster');
  box(0,3.41,3.93,7.12,.16,.24,'woodShade');

  // Real facade wall bands are split at the recessed wooden doorway;
  // generic district walls are NOT built across these two original lots.
  const doorLeft=gateX-gateWidth*.5-.13;
  const doorRight=gateX+gateWidth*.5+.13;
  const panels=[[-3.49,doorLeft],[doorRight,3.49]];
  function stoneWall(x0,x1,variant){
    const w=x1-x0,c=(x0+x1)/2;
    if(w<.25)return;
    box(c,.79,front-.05,w,1.52,.22,'stoneMasonry');
    box(c,.13,front-.15,w+.015,.20,.33,'stoneFoundation');
    const rows=5,stepY=.23,cols=Math.max(3,Math.round(w/.41));
    for(let row=0;row<rows;row++){
      for(let i=0;i<cols;i++){
        const blockW=w/cols;
        const x=x0+(i+.5)*blockW+(row%2?.018:0);
        if(x+(blockW-.034)*.5>x1-.008)continue;
        box(x,.27+row*stepY,front-.185,blockW-.034,.197,.056,
          (row+i+variant)%7===0?'stoneGrey':
          (row+i)%3===0?'stoneLight':'stoneMasonry');
        detail.graniteBlocks++;
      }
    }
    box(c,1.44,front-.13,w,.13,.33,'stoneLight');
    box(c,1.495,front-.235,w,.048,.04,'plaster');

    // Red/ivory Korean-square maze relief like the photographs, but
    // proportioned differently across the two house volumes.
    const low=1.53,high=isMain?2.13:2.03;
    box(c,(low+high)/2,front-.16,w,high-low,.13,'brickTerracotta');
    box(c,low,front-.247,w,.065,.063,'stoneLight');
    box(c,high,front-.247,w,.065,.063,'stoneLight');
    const count=Math.max(2,Math.floor(w/(isMain?.50:.59)));
    const unit=w/count;
    for(let i=0;i<count;i++){
      const cx=x0+(i+.5)*unit,z=front-.259;
      const w1=unit*.82,h=high-low;
      box(cx,high-.075,z,w1,.052,.045,'plaster');
      box(cx,low+.077,z,w1,.053,.045,'plaster');
      box(cx-unit*.33,(low+high)/2,z,.054,h-.12,.045,'plaster');
      box(cx+unit*.32,low+h*.44,z,.056,h*.64,.048,'plaster');
      box(cx+(i%2?.07:-.07),low+h*.65,z,w1*.43,.054,.05,'plaster');
      box(cx+(i%2?-.06:.06),low+h*.39,z,w1*.38,.050,.047,'plaster');
      detail.terracottaMeanders++;
      detail.whiteFretStrokes+=6;
    }
    box(c,high+.09,front-.18,w,.16,.30,'timberLight');

    // The MAIN section has taller paired windows. The neighboring
    // recessed gatehouse presents a quieter row of FOUR separate screens.
    const yc=2.79,windowH=isMain?1.03:1.11;
    const maxW=Math.min(isMain?1.68:2.24,w-.22);
    if(maxW>.55){
      box(c,yc,front-.195,maxW,windowH,.13,'timber');
      box(c,yc,front-.269,maxW-.15,windowH-.15,.036,'hanokPaperWindow');
      for(const side of [-1,1]){
        const cx=c+side*maxW*.248;
        box(cx,yc,front-.308,maxW*.48,windowH-.12,.028,'hanokPaperWindow');
        for(let col=1;col<=4;col++){
          const px=cx-maxW*.226+col*maxW*.452/5;
          box(px,yc,front-.333,.035,windowH-.13,.041,'timberLight');
          detail.latticeBars++;
        }
        for(let row=1;row<=5;row++){
          const py=yc-windowH*.45+row*windowH*.90/6;
          box(cx,py,front-.343,maxW*.47,.032,.044,
            (row+variant)%3===0?'woodShade':'timberLight');
          detail.latticeBars++;
        }
        box(cx,yc-windowH*.48,front-.348,maxW*.49,.07,.040,'timber');
      }
      box(c,yc,front-.340,.095,windowH+.11,.057,'woodShade');
      box(c,yc-windowH*.52,front-.259,maxW+.15,.14,.27,'timberLight');
      box(c,yc+windowH*.52,front-.242,maxW+.18,.15,.31,'woodShade');
      detail.latticeWindows++;
    }
    // Distinct white plaster panes beside the living-room screens.
    box(x0+.10,2.80,front+.025,.09,1.11,.078,'plaster');
    box(x1-.10,2.80,front+.025,.09,1.11,.078,'plaster');
  }
  panels.forEach(([a,b],i)=>stoneWall(a,b,i));

  // Recess the double-leaf residential gateway 34cm behind the front
  // posts so it reads as a REAL inset portal, not wallpaper on a wall.
  const gateZ=front+.34;
  const gateH=isMain?2.36:2.58;
  box(gateX,1.31,gateZ+.12,gateWidth+.13,2.50,.17,'plaster');
  for(const side of [-1,1]){
    const cx=gateX+side*(gateWidth*.5+.065);
    box(cx,1.37,front-.07,.21,2.69,.32,'timber');
    box(cx,.24,front-.08,.40,.49,.43,'stoneFoundation');
    box(cx,2.74,front-.08,.39,.18,.41,'woodShade');
    detail.woodPosts++;
    const leafX=gateX+side*gateWidth*.25;
    box(leafX,1.24,gateZ-.05,gateWidth*.48,gateH,.12,'gateWood');
    for(let j=0;j<6;j++){
      const xx=leafX-gateWidth*.23+(j+.5)*gateWidth*.46/6;
      box(xx,1.25,gateZ-.131,.066,gateH-.16,.046,
        (j+Math.sign(side))%3===0?'timberLight':'gateWood');
    }
    for(const y of [.44,1.77]){
      box(leafX,y,gateZ-.141,gateWidth*.45,.071,.042,'woodShade');
      for(const stud of [-.23,-.08,.08,.23]){
        sphere(leafX+stud*gateWidth*.5,y,gateZ-.179,
          .020,.026,.016,'drainIron',6,3);
        detail.gateStuds++;
      }
    }
    cylinder(gateX+side*.14,1.36,gateZ-.221,.078,.07,'drainIron',10);
    sphere(gateX+side*.14,1.35,gateZ-.258,.047,.06,.026,'copper',8,4);
    detail.gateLeaves++;
  }
  box(gateX,2.68,front-.05,gateWidth+.43,.17,.37,'timberLight');
  box(gateX,2.82,front-.06,gateWidth+.52,.13,.39,'woodShade');
  box(gateX,.035,front-.25,gateWidth+.26,.12,.38,'stoneLight');
  // Grey individual dark stone flags go all the way into the recessed
  // gateway. Without these the entry would look pasted on top of sand.
  for(let j=0;j<3;j++){
    box(gateX,.046,front-.21+j*.22,gateWidth+.03,.055,.19,
      j%2===0?'stoneGrey':'stoneFoundation');
  }
  detail.gateRecess=+(gateZ-front).toFixed(3);

  // Exposed load-bearing timber with visible wood blocks under the eave.
  for(const x of [-3.38,-2.70,-2.02,-1.32,-.64,.07,.76,1.44,2.12,2.81,3.40]){
    box(x,3.47,-3.94,.23,.20,.69,'woodShade');
    box(x,3.37,-4.20,.16,.15,.74,'timber');
    box(x,3.28,-4.40,.11,.13,.51,'timberLight');
    detail.eaveRafters++;
  }
  box(0,3.28,-4.39,7.60,.10,.56,'woodShade');
  box(0,3.20,-4.53,7.63,.085,.25,'timber');
  for(let x=-3.55;x<3.55;x+=.31){
    box(x,3.17,-4.53,.10,.09,.28,'timberLight');
    detail.eaveRafters++;
  }

  // Long roof ridge parallel to the street, descending to a true drip
  // line ~52cm past the photographed stone/wood facade. Main roof has
  // a subtle higher crown; the gatehouse is visibly smaller.
  const roofY=(x,z)=>{
    const span=z<0?-frontRoof:rearRoof,
      t=clamp(Math.abs(z)/span,0,1),
      b=clamp(Math.abs(x)/halfWidth,0,1);
    return ridgeY-(z<0?(ridgeY-dripY):1.43)*Math.pow(t,1.27)
      -.10*b*b+.13*b**4*t**4;
  };
  const pt=(x,z,lift=0)=>[x,roofY(x,z)+lift,z];
  for(const sign of [-1,1]){
    const L=sign<0?-frontRoof:rearRoof;
    for(let row=0;row<12;row++){
      const z0=sign*L*row/12,z1=sign*L*(row+1)/12;
      for(let col=0;col<18;col++){
        const x0=-halfWidth+col*2*halfWidth/18,
          x1=-halfWidth+(col+1)*2*halfWidth/18;
        face(pt(x0,z0),pt(x1,z0),pt(x1,z1),pt(x0,z1),
          [0,1,sign*.38],
          (row+col*3)%13===0?'tileInkLight':
          (row+col)%4===0?'tileIndigo':'tileInk');
        detail.roofTiles++;
        if(col%2===0){
          const bx=x0+.086;
          face(pt(bx,z0,.053),pt(bx+.082,z0,.054),
            pt(bx+.082,z1,.031),pt(bx,z1,.026),
            [0,1,sign*.32],
            col%4===0?'tileInkLight':'tileRidge');
          detail.tileRibs++;
        }
      }
    }
    const ez=sign*L;
    box(0,roofY(0,ez)-.02,ez,7.67,.13,.16,'tileRidge');
    for(let i=0;i<23;i++){
      const x=-3.55+(i+.5)*7.10/23;
      const yy=roofY(x,ez)-.032;
      sphere(x,yy,ez+sign*.061,.119,.115,.069,
        i%5===0?'tileLight':'tileEnd',8,4);
      if(sign<0){
        // A 47-specific rosette is less dense than the ornate 43 model:
        // four carved petal reliefs on every third clay end-cap.
        if(i%3===0){
          const q=ez-.059;
          for(const [dx,dy] of [[-.039,0],[.039,0],[0,.040],[0,-.040]]){
            sphere(x+dx,yy+dy,q,.028,.029,.018,'stoneLight',6,3);
            detail.carvedPetals++;
          }
        }
        sphere(x,3.20,ez-.065,.091,.099,.064,
          i%4===0?'mortar':'stoneLight',7,3);
        detail.flowerCaps++;
        detail.whiteRafterEnds++;
      }
    }
  }
  box(0,ridgeY+.061,0,7.38,.18,.32,'tileInkLight');
  for(let i=0;i<20;i++){
    const xx=-3.44+(i+.5)*6.88/20;
    box(xx,ridgeY+.142,0,.18,.074,.23,
      i%6===0?'tileLight':'tileRidge');
  }
  for(const side of [-1,1])
    box(side*3.74,3.42,0,.14,.14,8.40,'tileRidge');

  // Physical triangular side plaster gable with old honey timber
  // framing. Even at steep camera angles, it is a HOUSE not a box cap.
  function sideGable(side){
    const xx=side*3.48,normal=[side,0,0],
      bottom=3.56,top=ridgeY-.17,w=3.37;
    face([xx,bottom,-w],[xx,bottom,w],
      [xx,top,0],[xx,top,0],normal,'plaster');
    const brace=(z0,y0,z1,y1)=>{
      const dz=z1-z0,dy=y1-y0,
        length=Math.hypot(dz,dy)||1,
        ez=-dy/length*.135,ey=dz/length*.135;
      face([xx+side*.06,y0+ey,z0+ez],
        [xx+side*.06,y1+ey,z1+ez],
        [xx+side*.06,y1-ey,z1-ez],
        [xx+side*.06,y0-ey,z0-ez],
        normal,isMain?'timberLight':'woodShade');
      detail.gableBeams++;
    };
    brace(-w,bottom,0,top);brace(0,top,w,bottom);
    for(const y of [bottom+.14,bottom+.40]){
      const span=Math.max(.2,(top-y)/(top-bottom)*w);
      box(xx+side*.08,y,0,.14,.14,span*2,'timberLight');
      detail.gableBeams++;
    }
    box(xx+side*.095,top-.37,0,.12,.68,.18,'timber');
    detail.gableBeams++;
  }
  sideGable(-1);sideGable(1);

  // The photographs show realistic domestic service pieces. The final
  // gatehouse also has a discreet unbranded vertical entry marker (no
  // copied hotel name, private identity or trademark/sign design).
  const serviceX=isMain?3.27:-3.24,serviceZ=front-.205;
  box(serviceX,1.32,serviceZ,.07,2.08,.079,'brickTerracotta');
  box(serviceX-.18,2.27,serviceZ,.32,.075,.080,'brickWarm');
  box(serviceX-.29,1.69,serviceZ-.022,.43,.52,.20,'stoneGrey');
  box(serviceX-.29,1.69,serviceZ-.147,.30,.32,.039,'stoneLight');
  box(serviceX-.29,1.72,serviceZ-.193,.16,.14,.037,'warmGlass');
  box(serviceX-.04,.42,serviceZ-.03,.05,.66,.082,'drainIron');
  detail.utilityPieces=6;
  if(!isMain){
    box(-3.15,1.73,front-.29,.18,1.56,.12,'woodShade');
    box(-3.15,1.75,front-.367,.11,1.32,.045,'timber');
    detail.utilityPieces+=2;
  }

  // A low practical drainage channel beside the granite threshold.
  for(let i=0;i<12;i++){
    const xx=-3.36+(i+.5)*6.72/12;
    box(xx,.040,front-.37,6.72/12-.030,.07,.15,
      i%4===0?'drainIron':'stoneGrey');
  }

  detail.eave={frontLipZ:frontRoof,wallZ:front,
    projectedDepth:front-frontRoof,dripHeight:roofY(0,frontRoof),
    lowerThanWindows:dripY<3.42,rainshed:true};
  detail.streetFacade={part,windowPanels:detail.latticeWindows,
    highWoodenGate:true,redIvoryFret:true,carvedGiwaEnds:true,
    plainBranding:true};
  return detail;
}
