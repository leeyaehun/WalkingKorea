/**
 * 5-gyeong third west-hand hanok — THREE actual Naver street-view angles,
 * NOT a repeated clone of site #8 or #10. User reference (2026-11-01):
 * - substantial low-dripping charcoal giwa roof with carved pale-grey
 *   round end-caps and a second row of white exposed circular rafters;
 * - warm brown heavy timber beams over plaster fields;
 * - TWO small lattice windows beside an asymmetric central plank gate;
 * - distinctive thick RED/terracotta Korean square meander band outlined
 *   with warm ivory above staggered pale granite dressed stone;
 * - gabled side view, realistic service pipes and stone doorstep.
 *
 * The house replaces exactly the original west-hand site index 12, near
 * lane station z=28.3 and about 9m uphill from site #10. No new lots.
 * Local -Z faces the street; geometry is inside the single world mesh.
 */
export const FIVE_GYEONG_THIRD_HANOK=Object.freeze({
 id:'bukchon-05-third-terracotta-gate-hanok',
 label:'북촌 5경 · 붉은 무늬담과 기와 대문 한옥',
 originalIndex:12,side:-1,routeIndex:0,
 lowerLaneZ:25.0,upperLaneZ:32.0,
 footprint:Object.freeze({width:7.35,depth:8.55}),
 signature:'ornate-giwa-rosettes-terra-maze-central-door',
 referenceViews:3
});
export function isFiveGyeongThirdSite({index,side,routeIndex,laneZ}){
 const s=FIVE_GYEONG_THIRD_HANOK;
 return index===s.originalIndex && side===s.side &&
   routeIndex===s.routeIndex && laneZ>s.lowerLaneZ &&
   laneZ<s.upperLaneZ;
}

export function buildFiveGyeongThirdHanok({box,face,sphere,cylinder}){
 const stat={
   id:FIVE_GYEONG_THIRD_HANOK.id,kind:'reference-third-red-maze-hanok',
   redMeanders:0,graniteBlocks:0,windowPairs:0,latticeBars:0,
   gateLeaves:0,gateStuds:0,woodPosts:0,whiteRafterEnds:0,
   curvedGiwaFaces:0,giwaRibs:0,rosetteCaps:0,carvedPetals:0,
   gableBeams:0,utilityElements:0
 };
 const FRONT=-4.14,EAVE_Z=-4.66,REAR_EAVE=4.09,EAVE_HALF_WIDTH=3.78;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 // Original lot and low stepped granite foundation (never a second house).
 box(0,-.16,.04,7.34,.32,8.55,'stoneFoundation');
 box(0,.055,.02,7.30,.10,8.44,'stoneLight');
 box(0,1.85,.18,6.91,3.09,7.49,'plaster');
 box(0,.40,-3.82,7.08,.79,.32,'stoneMasonry');
 box(0,3.45,.18,7.01,.24,7.57,'timber');
 box(0,3.51,-3.91,7.14,.27,.36,'woodShade');
 box(0,.70,-3.93,7.13,.13,.39,'stoneLight');

 // A run of heavy aged wooden pillars actually takes the eave load.
 for(const x of [-3.46,-.95,1.01,3.47]){
   box(x,1.89,-3.92,.22,2.98,.27,'woodShade');
   box(x,.32,-3.94,.35,.40,.37,'stoneFoundation');
   box(x,3.43,-3.98,.36,.20,.44,'timberLight');
   stat.woodPosts++;
 }
 for(const side of [-1,1]){
   const x=side*3.45;
   box(x,1.94,.16,.20,2.91,7.46,'plaster');
   for(const z of [-3.29,-1.02,1.33,3.43]){
     box(x,1.93,z,.22,2.92,.23,'timber');
     box(x,.42,z,.39,.28,.40,'stoneFoundation');
     stat.woodPosts++;
   }
   box(x,3.45,.10,.27,.24,7.59,'woodShade');
   box(x,.49,.09,.24,.17,7.52,'timberLight');
 }
 box(0,1.90,3.83,6.84,3.02,.22,'plaster');

 // The central wooden gate must remain exposed: all decorative masonry
 // is drawn only in the two left/right photoreference facade sections.
 const gX=-.03,gateHalf=.80;
 const halves=[
   {left:-3.50,right:gX-gateHalf-.15},
   {left:gX+gateHalf+.15,right:3.50}
 ];
 for(const {left,right} of halves){
   const width=right-left,mid=(left+right)*.5;
   box(mid,.85,FRONT-.08,width,1.57,.21,'stoneMasonry');
   box(mid,.10,FRONT-.14,width,.18,.30,'stoneFoundation');
   // Photographic five-row GRANITE dressed coursing with thin stone grout.
   for(let row=0;row<5;row++){
     const count=Math.max(3,Math.floor(width/.39));
     for(let i=0;i<count;i++){
       const w=width/count,shift=(row%2?.06:0);
       const x=left+(i+.5)*w+shift;
       if(x+w*.5>right-.018)continue;
       box(x,.23+row*.235,FRONT-.21,w-.025,.198,.061,
         (i+row)%6===0?'stoneGrey':
         (i+row)%3===0?'stoneLight':'stoneMasonry');
       stat.graniteBlocks++;
     }
   }
   box(mid,1.40,FRONT-.14,width,.115,.29,'stoneLight');
   // Large recognisable terracotta bands are each enclosed by a thin
   // ivory edge. This is NOT the prior house's charcoal grey fret.
   box(mid,1.82,FRONT-.139,width,.74,.13,'brickTerracotta');
   box(mid,1.465,FRONT-.23,width,.066,.060,'mortar');
   box(mid,2.18,FRONT-.23,width,.066,.060,'mortar');
   const units=Math.max(3,Math.floor(width/.49)),step=width/units;
   for(let i=0;i<units;i++){
     const cx=left+(i+.5)*step;
     const z=FRONT-.245,sw=step*.81;
     // Four-sided square labyrinth, alternates opening for a cohesive
     // running motif as in the photos; use real thin solid ivory strokes.
     box(cx,2.075,z,sw,.055,.055,'plaster');
     box(cx-step*.32,1.82,z,.055,.49,.052,'plaster');
     box(cx,1.59,z,sw,.055,.052,'plaster');
     box(cx+step*.30,1.72,z,.056,.30,.052,'plaster');
     box(cx+(i%2?.080:-.080),1.89,z,step*.37,.055,.054,'plaster');
     box(cx+(i%2?-.080:.080),1.77,z,step*.38,.055,.054,'plaster');
     stat.redMeanders++;
   }
   // Deep horizontal wooden sill connects the windows/gate axis.
   box(mid,2.245,FRONT-.145,width,.18,.32,'timber');
 }

 // Upper warm plaster & heavy timber. Unlike the last house's TWO
 // large combined windows, this frontage has one smaller L/R window
 // flanking a prominent VERTICAL plank gate.
 for(const {left,right} of halves){
   const mid=(left+right)*.5,width=right-left;
   box(mid,2.88,FRONT+.12,width,1.29,.11,'plaster');
   box(mid,3.60,FRONT-.14,width+.035,.25,.42,'woodShade');
   const wx=mid,wy=2.93,ww=Math.min(1.37,width-.30),wh=.94;
   const wz=FRONT-.214;
   box(wx,wy,wz,ww,wh,.13,'timber');
   box(wx,wy,wz-.079,ww-.12,wh-.12,.031,'hanokPaperWindow');
   box(wx,wy,wz-.118,.13,wh,.083,'woodShade');
   for(const side of [-1,1]){
     const halfX=wx+side*ww*.245;
     for(let j=1;j<=4;j++){
       const x=halfX-ww*.23+j*ww*.46/5;
       box(x,wy,wz-.141,.036,wh-.17,.039,'timberLight');
       stat.latticeBars++;
     }
     for(let j=1;j<=5;j++){
       const y=wy-wh*.45+j*wh*.9/6;
       box(halfX,y,wz-.147,ww*.44,.030,.040,
         j%2===0?'timber':'timberLight');
       stat.latticeBars++;
     }
   }
   box(wx,wy-wh*.50,wz-.154,ww+.16,.14,.27,'timberLight');
   box(wx,wy+wh*.50,wz-.146,ww+.17,.15,.26,'woodShade');
   stat.windowPairs++;
 }

 // Central tall timber gate, the dominant landmark in the second photo.
 box(gX,1.36,FRONT-.19,1.77,2.66,.18,'woodShade');
 box(gX,1.34,FRONT-.292,1.57,2.43,.078,'gateWood');
 for(const side of [-1,1]){
   const cx=gX+side*.388;
   for(let j=0;j<6;j++){
     const x=cx-.352+(j+.5)*.704/6;
     box(x,1.31,FRONT-.359,.095,2.27,.048,
       j%3===0?'timberLight':'gateWood');
   }
   box(gX+side*.77,1.38,FRONT-.38,.12,2.53,.08,'woodShade');
   for(const y of [.55,1.74]){
     box(cx,y,FRONT-.397,.70,.10,.052,'timber');
     for(const x of [cx-.25,cx+.25]){
       sphere(x,y,FRONT-.431,.028,.034,.018,'copper',6,3);
       stat.gateStuds++;
     }
   }
   // Traditional metal knocker, each leaf mounted independently.
   cylinder(gX+side*.19,1.34,FRONT-.439,.090,.065,'drainIron',10);
   sphere(gX+side*.19,1.31,FRONT-.477,.057,.07,.032,'copper',8,4);
   stat.gateLeaves++;
 }
 box(gX,2.61,FRONT-.36,1.83,.21,.36,'timber');
 box(gX,2.77,FRONT-.26,1.85,.14,.27,'woodShade');
 box(gX,2.89,FRONT-.30,1.79,.11,.26,'timberLight');
 for(let i=0;i<9;i++){
   const x=gX-.72+i*.18;
   box(x,2.73,FRONT-.385,.11,.15,.32,'timber');
 }
 box(gX,.035,FRONT-.36,1.80,.17,.40,'stoneFoundation');
 box(gX,-.005,FRONT-.47,1.66,.10,.19,'stoneLight');

 // Exposed decorative wall wood frame and under-eave bracket assembly.
 for(const x of [-3.28,-2.47,-1.72,-.99,1.07,1.75,2.53,3.26]){
   box(x,3.64,-3.94,.21,.22,.63,'woodShade');
   box(x,3.55,-4.15,.15,.16,.75,'timber');
   box(x,3.45,-4.30,.13,.14,.61,'timberLight');
 }
 box(0,3.39,-4.35,7.55,.12,.57,'woodShade');
 box(0,3.32,-4.46,7.58,.09,.31,'timber');
 for(let x=-3.44;x<3.55;x+=.29){
   box(x,3.30,-4.48,.10,.08,.26,'timberLight');
 }

 // Ceramic tile profile: curves UP at the two outside corners.
 const roofY=(x,z)=>{
   const span=z<0?-EAVE_Z:REAR_EAVE;
   const t=clamp(Math.abs(z)/span,0,1);
   const b=clamp(Math.abs(x)/EAVE_HALF_WIDTH,0,1);
   return 4.95-(z<0?1.57:1.42)*Math.pow(t,1.28)
     -.13*Math.pow(b,2.4)+.13*Math.pow(b,4)*Math.pow(t,4);
 };
 const at=(x,z,lift=0)=>[x,roofY(x,z)+lift,z];
 for(const side of [-1,1]){
   const far=side<0?-EAVE_Z:REAR_EAVE;
   for(let row=0;row<12;row++){
     const z0=side*far*row/12,z1=side*far*(row+1)/12;
     for(let col=0;col<18;col++){
       const x0=-EAVE_HALF_WIDTH+col*(2*EAVE_HALF_WIDTH)/18;
       const x1=-EAVE_HALF_WIDTH+(col+1)*(2*EAVE_HALF_WIDTH)/18;
       face(at(x0,z0),at(x1,z0),at(x1,z1),at(x0,z1),
         [0,1,side*.35],
         (col+row)%11===0?'tileInkLight':
         (col+row*3)%4===0?'tileIndigo':'tileInk');
       stat.curvedGiwaFaces++;
       if(col%2===0){
         const gx=x0+.075;
         face(at(gx,z0,.048),at(gx+.075,z0,.052),
           at(gx+.075,z1,.028),at(gx,z1,.026),
           [0,1,side*.35],
           col%4===0?'tileInkLight':'tileRidge');
         stat.giwaRibs++;
       }
     }
   }
   const eaveZ=side*far;
   const yEdge=side<0?3.30:3.40;
   box(0,yEdge,eaveZ,7.67,.13,.16,'tileRidge');
   for(let i=0;i<24;i++){
     const x=-3.56+(i+.5)*7.12/24;
     const cy=roofY(x,eaveZ)-.035;
     const tipZ=eaveZ+side*.065;
     sphere(x,cy,tipZ,.135,.132,.068,
       i%5===0?'tileLight':'tileEnd',9,4);
     if(side<0){
       // Carved flower/leaf rosette relief on pale tile cap: discrete
       // four petals only for alternating termini, to respect mobile.
       if(i%2===0){
         const iy=cy,sz=tipZ-.063;
         for(const [dx,dy] of [[-.050,0],[.050,0],[0,.050],[0,-.050]]){
           sphere(x+dx,iy+dy,sz,.035,.033,.019,'stoneLight',6,3);
           stat.carvedPetals++;
         }
         sphere(x,iy,sz-.02,.034,.034,.018,'tileRidge',6,3);
       }
       // Second WHITE rafter-end row BELOW the heavy carved caps.
       sphere(x,3.30,eaveZ-.087,.091,.098,.065,
         i%3===0?'mortar':'stoneLight',7,3);
       stat.whiteRafterEnds++;
       stat.rosetteCaps++;
     }
   }
 }
 box(0,5.00,0,7.35,.18,.30,'tileInkLight');
 for(let i=0;i<22;i++){
   const x=-3.46+(i+.5)*6.92/22;
   box(x,5.09,0,.19,.075,.23,i%5===0?'tileLight':'tileRidge');
 }
 for(const x of [-3.72,3.72])
   box(x,3.40,0,.16,.18,8.47,'tileRidge');

 // Gallery roof GABLE facing the side street: broad weathered-wood
 // triangular cornice and white plaster infill, not the last house's
 // unadorned flat side.
 function sideGable(side){
   const x=side*3.53,normal=[side,0,0],pt=(y,z)=>[x,y,z];
   const shoulder=3.59,peak=4.70,half=3.31;
   face(pt(shoulder,-half),pt(shoulder,half),pt(peak,0),pt(peak,0),
     normal,'plaster');
   const slope=(z0,y0,z1,y1)=>{
     const dz=z1-z0,dy=y1-y0,l=Math.hypot(dz,dy)||1;
     const wz=-dy/l*.13,wy=dz/l*.13;
     face([x+side*.058,y0+wy,z0+wz],[x+side*.058,y1+wy,z1+wz],
       [x+side*.058,y1-wy,z1-wz],[x+side*.058,y0-wy,z0-wz],
       normal,'timberLight');
     stat.gableBeams++;
   };
   slope(-half,shoulder,0,peak);
   slope(0,peak,half,shoulder);
   for(const y of [3.63,3.95]){
     const width=(peak-y)/(peak-shoulder)*half;
     box(x+side*.06,y,0,.16,.15,width*2,'timber');
     stat.gableBeams++;
   }
   box(x+side*.10,4.01,0,.16,.74,.16,'timberLight');
   stat.gableBeams++;
   // Exposed under-eave timbers visible from both side camera angles.
   for(const z of [-2.58,-1.63,-.67,.65,1.61,2.55]){
     box(x+side*.10,3.55,z,.33,.13,.22,'woodShade');
   }
 }
 sideGable(-1);sideGable(1);

 // Small modern service objects, restrained and photographically credible.
 const uX=3.32,uZ=FRONT-.18;
 box(uX,1.40,uZ,.075,2.20,.085,'brickTerracotta');
 box(uX-.16,2.26,uZ,.32,.076,.08,'brickWarm');
 box(uX-.27,1.80,uZ-.03,.36,.50,.19,'stoneGrey');
 box(uX-.27,1.81,uZ-.147,.24,.28,.032,'stoneLight');
 box(uX-.27,1.83,uZ-.185,.16,.15,.032,'warmGlass');
 box(uX-.25,.63,uZ-.05,.05,.84,.10,'drainIron');
 stat.utilityElements=6;
 // Actual edge drainage, within the facade setback; no walkable new lane.
 for(let i=0;i<13;i++){
   const xx=-3.29+(i+.5)*6.58/13;
   box(xx,.036,FRONT-.37,6.58/13-.02,.067,.16,
     i%3===0?'drainIron':'stoneGrey');
 }
 stat.eaves={frontLipZ:EAVE_Z,wallZ:FRONT,
   projectedDepth:FRONT-EAVE_Z,
   dripHeight:roofY(0,EAVE_Z),
   rosettes:stat.rosetteCaps,carvedPetals:stat.carvedPetals,
   rainSheltering:true};
 stat.facade={doorPosition:gX,redTerracotta:true,
   twoSeparateLatticeWindows:true,physicalGranite:true,
   pattern:'large ivory-outlined terracotta Korean meander'};
 return stat;
}
