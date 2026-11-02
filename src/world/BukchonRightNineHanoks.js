/**
 * Bukchon-ro 11-gil right-side houses, all nine assembled from thirteen
 * screenshot references provided by the user on 2026-11-02.
 *
 * The source street photos are not cadastral measurements. Addresses
 * here are PHOTO LABELS only, and the 99 m game street is compressed.
 * No real hotel logo or householder identifiers are copied.
 *
 * Retain EVERY original house-site center, orientation, collision, route
 * and index. Ten east positions exist; nine get hand-authored street
 * facades, and the remaining scenic upper position retains the approved
 * Hanok Kit. All geometry goes to the ORIGINAL single BufferGeometry.
 *
 * Distinct photographic motifs:
 *  - Nostalgia: glazed high timber windows and rare interlaced circular
 *    flower meander band under two separate brick-line borders.
 *  - 44: dark recessed gate, service pipes and barred street windows.
 *  - 46: honey timber, long glazed lattice sash and spaced granite.
 *  - 48: extra-long horizontal wood windows / terracotta square fret.
 *  - 52: brick corner bay, gray foundation and iron upper window guards.
 *  - 54: two narrow honey-wood entry leaves and pale ornamental masonry.
 *  - 56: lower wall with short tile coping, inset windows and garden.
 *  - 58: low garden-side wall, stepped traditional gate, curved ends.
 *  - 58-1: narrow gray-brick tall chimney with tiny black giwa cap.
 */
export const RIGHT_HANOK_PROFILES=Object.freeze([
  Object.freeze({id:'nostalgia',label:'노스텔지어 호스텔',index:9,
    side:1,z:46.27,kind:'floral',wood:'woodShade',gateX:-2.11,gateW:1.28,
    roofTop:4.66,roofDrip:3.14,windows:'glass',feature:'floral'}),
  Object.freeze({id:'44',label:'44호',index:11,
    side:1,z:37.29,kind:'brick',wood:'woodShade',gateX:1.78,gateW:1.47,
    roofTop:4.63,roofDrip:3.22,windows:'steel',feature:'pipe'}),
  Object.freeze({id:'46',label:'46호',index:13,
    side:1,z:28.33,kind:'square',wood:'timberLight',gateX:-1.73,gateW:1.48,
    roofTop:4.58,roofDrip:3.15,windows:'lattice',feature:'slot'}),
  Object.freeze({id:'48',label:'48호',index:15,
    side:1,z:19.44,kind:'square',wood:'timberLight',gateX:2.12,gateW:1.38,
    roofTop:4.53,roofDrip:3.12,windows:'long',feature:'utility'}),
  Object.freeze({id:'52',label:'52호',index:17,
    side:1,z:10.50,kind:'brick',wood:'woodShade',gateX:-1.92,gateW:1.40,
    roofTop:4.71,roofDrip:3.27,windows:'steel',feature:'brickCorner'}),
  Object.freeze({id:'54',label:'54호',index:19,
    side:1,z:1.50,kind:'brick',wood:'timberLight',gateX:1.88,gateW:1.54,
    roofTop:4.45,roofDrip:3.08,windows:'steel',feature:'number'}),
  Object.freeze({id:'56',label:'56호',index:6,
    side:1,z:-9.20,kind:'square',wood:'timberLight',gateX:-1.86,gateW:1.63,
    roofTop:4.55,roofDrip:3.13,windows:'lattice',feature:'garden'}),
  Object.freeze({id:'58',label:'58호',index:5,
    side:1,z:-17.60,kind:'square',wood:'timberLight',gateX:1.83,gateW:1.52,
    roofTop:4.68,roofDrip:3.22,windows:'lattice',feature:'gardenRoof'}),
  Object.freeze({id:'58-1',label:'58-1호',index:3,
    side:1,z:-30.30,kind:'plain',wood:'woodShade',gateX:-1.73,gateW:1.65,
    roofTop:4.60,roofDrip:3.23,windows:'steel',feature:'chimney'})
]);
export const RIGHT_HANOK_PROFILE_BY_INDEX=new Map(RIGHT_HANOK_PROFILES.map(p=>[p.index,p]));
export function rightHanokForSite(site){
 const p=RIGHT_HANOK_PROFILE_BY_INDEX.get(site.index);
 if(!p || site.side!==1)return null;
 if(site.routeIndex!=null && site.routeIndex!==0)return null;
 const z=site.laneZ??site.z;
 return Math.abs(z-p.z)<1.2?p:null;
}
export function buildRightHanokPhoto({box,face,sphere,cylinder,profile}){
 if(!RIGHT_HANOK_PROFILES.includes(profile))
   throw new Error('Unrecognized original right-side Bukchon photo house');
 const stats={
   id:'bukchon-right-'+profile.id,reference:profile.label,kind:'right-photo-hanok',
   feature:profile.feature,windowStyle:profile.windows,
   stoneBlocks:0,fretMotifs:0,floralPetals:0,latticeBars:0,
   gateLeaves:0,gateStuds:0,roofCourses:0,roofRibs:0,
   tileEndCaps:0,rafterEnds:0,woodPosts:0,
   barredWindows:0,serviceDetails:0,roofDrip:profile.roofDrip,
   roofTop:profile.roofTop,hasDeepEave:true,hasDoor:true,
   roofLipZ:-4.68,wallZ:-4.12
 };
 const FRONT=-4.12,DRIP=-4.68,REAR=4.08;
 const WOOD=profile.wood,woodDark='woodShade';
 const gateX=profile.gateX,gW=profile.gateW;
 const left=gateX-gW/2-.15,right=gateX+gW/2+.15;
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const rect=(x0,x1,y0,y1,z,color,thickness=.048)=>{
   box((x0+x1)/2,(y0+y1)/2,z,x1-x0,y1-y0,thickness,color);
 };
 // The foundation comes from BukchonWorld's existing lot foundation.
 // Keep the actual body inset; all nine street-facing facades are
 // built in front, NOT painted as a photo plane over a generic house.
 box(0,1.93,.41,6.86,2.82,7.15,'plaster');
 box(0,3.40,.38,7.02,.24,7.50,'woodShade');
 box(0,.49,.27,7.01,.22,7.43,'stoneMasonry');
 for(const side of [-1,1]){
   const X=side*3.43;
   box(X,1.80,.08,.22,2.81,7.76,'plaster');
   for(const z of [-3.30,-.80,1.67,3.54]){
     box(X,1.79,z,.21,2.85,.23,WOOD);
     box(X,.35,z,.33,.57,.32,'stoneMasonry');
     stats.woodPosts++;
   }
   box(X,3.28,.16,.19,.23,7.83,'timber');
   // Road-view gable is a real construction, not a roof floating
   // over a rectangular block or a pasted image.
   const sign=[side,0,0],x=X+side*.043;
   face([x,3.47,-3.05],[x,3.47,3.05],
     [x,profile.roofTop-.18,0],[x,profile.roofTop-.18,0],
     sign,'plaster');
   for(const sz of [-1,1]){
     const beam=(x0,y0,z0,x1,y1,z1)=>{
       face([x0,y0+.075,z0],[x1,y1+.075,z1],
         [x1,y1-.075,z1],[x0,y0-.075,z0],sign,WOOD);
     };
     beam(x,3.50,sz*3.10,x,profile.roofTop-.17,0);
   }
 }
 box(0,1.90,3.89,6.89,2.95,.22,'plaster');
 // Lower masonry/frieze is segmented on either side of the REAL door
 // opening: no invisible generic plaster wall covers the gate or sash.
 function plasterStonePanel(x0,x1,k){
   const W=x1-x0;
   if(W<.19)return;
   const cx=(x0+x1)/2;
   box(cx,1.13,FRONT+.055,W,2.12,.20,'stoneMasonry');
   box(cx,.12,FRONT-.078,W+.04,.19,.26,'stoneFoundation');
   const count=Math.max(2,Math.ceil(W/.51));
   for(let row=0;row<3;row++){
     for(let j=0;j<count;j++){
       const bw=W/count,xx=x0+(j+.5)*bw;
       if(j===count-1 && xx+bw*.48>x1-.005)continue;
       box(xx,.38+row*.25,FRONT-.068,bw-.032,.211,.058,
         (row+j+k)%7===0?'stoneLight':
         (row+j)%3===0?'stoneGrey':'stoneMasonry');
       stats.stoneBlocks++;
     }
   }
   rect(x0,x1,1.03,1.12,FRONT-.105,'stoneLight',.09);
   const y0=1.13,y1=profile.kind==='floral'?2.34:2.03;
   box(cx,(y0+y1)/2,FRONT-.083,W,y1-y0,.09,
     profile.kind==='plain'?'plaster':
     profile.kind==='brick'?'brickWarm':'brickTerracotta');
   rect(x0,x1,y0,y0+.072,FRONT-.14,'plaster');
   rect(x0,x1,y1-.073,y1,FRONT-.14,'plaster');
   if(profile.kind==='floral'){
     // The characteristic flower-circle frieze in screenshot #1 and #13:
     // TWO orange square Greek-key bands framing overlapping gray rings.
     const beltL=1.43,beltH=2.01;
     box(cx,(beltL+beltH)/2,FRONT-.145,W,beltH-beltL,.06,'plaster');
     const cells=Math.max(2,Math.floor(W/.43));
     for(let i=0;i<cells;i++){
       const px=x0+(i+.5)*W/cells,rz=FRONT-.194;
       for(let v=0;v<6;v++){
         const t=v*Math.PI*2/6;
         const nx=Math.cos(t)*.19,ny=Math.sin(t)*.18;
         // Faceted decorative petals: tiny 3D relief, not flat decals.
         sphere(px+nx,1.71+ny,rz,.047,.054,.026,
           v%2===0?'brickTerracotta':'stoneGrey',5,3);
         stats.floralPetals++;
       }
       sphere(px,1.71,rz-.022,.041,.041,.018,'tileEnd',6,3);
       // Framing miniature square fret pairs.
       for(const yy of [1.27,2.17]){
         rect(px-.17,px+.17,yy-.017,yy+.025,FRONT-.202,'plaster');
         rect(px-.17,px-.12,yy-.05,yy+.06,FRONT-.211,'plaster');
         rect(px+.12,px+.17,yy-.06,yy+.055,FRONT-.211,'plaster');
         stats.fretMotifs++;
       }
     }
   }else if(profile.kind==='square'||profile.kind==='brick'){
     const cells=Math.max(2,Math.round(W/(profile.kind==='brick'?.53:.45)));
     for(let i=0;i<cells;i++){
       const xx=x0+i*W/cells,cw=W/cells,z=FRONT-.158;
       rect(xx+.047,xx+cw-.045,y0+.09,y0+.138,z,'plaster');
       rect(xx+.044,xx+.095,y0+.09,y1-.10,z,'plaster');
       rect(xx+cw-.098,xx+cw-.048,y0+.09,y1-.13,z,'plaster');
       rect(xx+.10,xx+cw-.12,y1-.132,y1-.083,z,'plaster');
       rect(xx+.12,xx+cw*.64,y0+.33,y0+.383,z,'plaster');
       stats.fretMotifs++;
     }
   }else{
     for(let k=0;k<2;k++){
       rect(x0+.08,x1-.08,1.28+k*.27,1.32+k*.27,FRONT-.15,
         k===0?'brickTerracotta':'stoneGrey');
       stats.fretMotifs++;
     }
   }
   box(cx,y1+.045,FRONT-.045,W,.115,.21,'stoneLight');
   // Above band, white exterior plaster and exposed warm wood rails.
   box(cx,2.77,FRONT+.019,W,.95,.19,'plaster');
   box(cx,3.31,FRONT-.041,W,.14,.24,'woodShade');
   box(cx,2.19,FRONT-.018,W,.13,.22,WOOD);
   // Every actual window opening is built as wood + opaque/pale paper or
   // dark glass, with 3D mullions and – where photographed – iron bars.
   const windows=Math.max(1,Math.min(2,Math.round(W/1.4)));
   for(let j=0;j<windows;j++){
     const center=x0+(j+.5)*W/windows,ww=Math.min(1.55,W/windows-.16);
     if(ww<.32)continue;
     const by=2.46,ht=profile.windows==='long'?.95:.82;
     box(center,by,FRONT-.127,ww,ht,.12,WOOD);
     box(center,by,FRONT-.198,ww-.13,ht-.12,.036,
       profile.windows==='glass'?'warmGlass':'hanokPaperWindow');
     const nCol=profile.windows==='long'?6:4;
     for(let column=1;column<nCol;column++){
       const xx=center-ww*.45+column*ww*.90/nCol;
       box(xx,by,FRONT-.234,.031,ht-.08,.042,WOOD);
       stats.latticeBars++;
     }
     const rows=profile.windows==='long'?3:4;
     for(let row=1;row<rows;row++){
       const yy=by-ht*.42+row*ht*.84/rows;
       box(center,yy,FRONT-.248,ww-.12,.033,.042,'timberLight');
       stats.latticeBars++;
     }
     if(profile.windows==='steel'){
       for(let a=0;a<5;a++){
         const px=center-ww*.43+a*ww*.86/4;
         box(px,by,FRONT-.286,.025,ht+.045,.034,'stoneGrey');
         stats.barredWindows++;
       }
       rect(center-ww*.49,center+ww*.49,by-.24,by-.21,
         FRONT-.292,'stoneGrey',.05);
     }
     box(center,by-ht*.5-.04,FRONT-.167,ww+.10,.10,.25,'timberLight');
   }
 }
 plasterStonePanel(-3.44,left,0);
 plasterStonePanel(right,3.44,1);
 // Deep wooden twin leaf gate: the forward pillars and timber canopy are
 // proud of the leaf surfaces by 35 cm, creating a TRUE recessed portal.
 const doorZ=FRONT+.36,gateH=profile.feature==='gardenRoof'?2.46:2.54;
 box(gateX,1.35,doorZ+.13,gW+.16,2.56,.20,'plaster');
 for(const side of [-1,1]){
   const px=gateX+side*(gW*.5+.09);
   box(px,1.52,FRONT-.13,.22,3.09,.38,WOOD);
   box(px,.36,FRONT-.14,.38,.57,.49,'stoneFoundation');
   box(px,2.85,FRONT-.15,.34,.16,.49,'woodShade');
   stats.woodPosts++;
   const xx=gateX+side*gW*.25;
   box(xx,1.32,doorZ-.048,gW*.484,gateH,.095,
     profile.windows==='glass'?'woodShade':'gateWood');
   for(let i=1;i<6;i++){
     const bx=xx-gW*.241+i*gW*.482/6;
     box(bx,1.34,doorZ-.115,.049,gateH-.18,.040,WOOD);
   }
   for(const y of [.40,1.77]){
     box(xx,y,doorZ-.124,gW*.47,.058,.054,'woodShade');
     for(const dx of [-.28,-.12,.12,.28]){
       sphere(xx+dx*gW*.4,y,doorZ-.158,
         .015,.021,.016,'drainIron',5,3);
       stats.gateStuds++;
     }
   }
   cylinder(gateX+side*.14,1.40,doorZ-.182,.055,.07,'drainIron',8);
   stats.gateLeaves++;
 }
 box(gateX,2.78,FRONT-.17,gW+.48,.19,.42,'timberLight');
 box(gateX,2.95,FRONT-.165,gW+.52,.15,.40,'woodShade');
 box(gateX,.035,FRONT-.23,gW+.20,.10,.34,'stoneLight');
 for(let i=0;i<3;i++)
   box(gateX,.048,FRONT-.18+i*.19,gW+.05,.046,.17,
     i%2===0?'stoneGrey':'stoneFoundation');
 // Deep 56-cm sheltered rain-eave: every street-side house in the series
 // has a visible exposed timber undercarriage and white rounded ends.
 for(let x=-3.40;x<=3.41;x+=.47){
   box(x,3.39,-4.15,.16,.15,.82,'woodShade');
   box(x,3.27,-4.43,.13,.12,.38,WOOD);
   sphere(x,3.22,-4.66,.056,.067,.063,'stoneLight',6,3);
   stats.rafterEnds++;
 }
 box(0,3.29,-4.38,7.54,.13,.59,'woodShade');
 box(0,3.18,-4.56,7.53,.095,.22,'timber');
 // 2-sided gabled roof, dark overlapping giwa with restrained shade
 // variation, individually visible rows, ridge and end-cap segments.
 const roofY=(x,z)=>{
   const span=z<0?4.68:4.08,t=clamp(Math.abs(z)/span,0,1);
   return profile.roofTop-(z<0?
     profile.roofTop-profile.roofDrip:1.33)*t**1.24
     -.07*(Math.abs(x)/3.78)**2+.12*(Math.abs(x)/3.78)**4*t**4;
 };
 const roofPoint=(x,z,lift=0)=>[x,roofY(x,z)+lift,z];
 for(const s of [-1,1]){
   const L=s<0?4.68:4.08;
   for(let row=0;row<8;row++){
     const z0=s*L*row/8,z1=s*L*(row+1)/8;
     for(let col=0;col<12;col++){
       const x0=-3.78+col*.63,x1=x0+.63;
       face(roofPoint(x0,z0),roofPoint(x1,z0),
         roofPoint(x1,z1),roofPoint(x0,z1),
         [0,1,s*.36],
         (row+col+profile.index)%7===0?'tileInkLight':
         (row+col)%3===0?'tileIndigo':'tileInk');
       stats.roofCourses++;
       if(col%2===0){
         const bx=x0+.11;
         face(roofPoint(bx,z0,.05),roofPoint(bx+.08,z0,.052),
           roofPoint(bx+.08,z1,.022),roofPoint(bx,z1,.025),
           [0,1,s*.32],'tileRidge');
         stats.roofRibs++;
       }
     }
   }
   const ez=s*L;
   box(0,roofY(0,ez)-.04,ez,7.60,.13,.15,'tileRidge');
   for(let i=0;i<12;i++){
     const x=-3.55+(i+.5)*7.10/12,yy=roofY(x,ez)-.015;
     sphere(x,yy,ez+s*.051,.13,.11,.073,
       i%5===0?'tileLight':'tileEnd',7,3);
     if(s<0){
       stats.tileEndCaps++;
       if(profile.feature==='chimney'||profile.feature==='floral'){
         sphere(x,yy,ez-.075,.054,.052,.028,'stoneLight',6,3);
         stats.floralPetals++;
       }
     }
   }
 }
 box(0,profile.roofTop+.038,0,7.38,.16,.31,'tileInkLight');
 // Optional faithfully distinct photo props, never actual signs.
 if(profile.feature==='pipe'||profile.feature==='brickCorner'||
    profile.feature==='utility'||profile.feature==='number'){
   const svcX=profile.gateX>0?-3.30:3.30;
   box(svcX,1.45,FRONT-.23,.07,2.41,.082,'brickTerracotta');
   box(svcX-.20,1.74,FRONT-.24,.39,.49,.17,'stoneGrey');
   box(svcX-.20,1.74,FRONT-.341,.22,.27,.036,'stoneLight');
   box(svcX-.20,1.75,FRONT-.365,.11,.13,.045,'warmGlass');
   box(svcX-.20,2.55,FRONT-.19,.26,.062,.092,'brickWarm');
   stats.serviceDetails+=5;
 }
 if(profile.feature==='brickCorner'){
   // #52's projecting rough-brick corner and visible high iron-bar
   // upper windows. No turn is blocked by the corner detailing.
   for(let y=.48;y<3.26;y+=.22){
     box(3.48,y,FRONT+.11,.17,.17,.34,
       Math.floor(y*10)%3===0?'brickDark':'brickWarm');
     stats.serviceDetails++;
   }
   box(3.43,3.34,FRONT+.08,.27,.19,.52,'timber');
 }
 if(profile.feature==='chimney'){
   // The unmistakable tall pale stacked-brick chimney pictured near
   // the hilltop overlook. It is behind the street eave.
   for(let j=0;j<13;j++){
     box(1.74,3.70+j*.19,1.02,.67,.175,.71,
       j%4===0?'stoneGrey':'stoneLight');
     stats.serviceDetails++;
   }
   box(1.74,6.19,1.02,.94,.14,.96,'tileInk');
   for(const sx of [-1,1])
     box(1.74+sx*.35,6.28,1.02,.13,.16,.86,'tileRidge');
 }
 if(profile.feature==='garden'||profile.feature==='gardenRoof'){
   // Greenery belongs in the rear/side forecourt, well behind the
   // road-facing lip. No giant spherical bushes inside walking lane.
   for(const x of [-2.97,2.98]){
     box(x,.38,2.72,.65,.70,.71,'stoneFoundation');
     sphere(x,.94,2.72,.57,.57,.58,'namsanPine',7,4);
     sphere(x+.24,1.29,2.65,.39,.42,.37,'namsanOlive',6,3);
     stats.serviceDetails+=3;
   }
   if(profile.feature==='gardenRoof'){
     box(0,1.18,3.95,4.42,1.67,.19,'plaster');
     box(0,2.13,3.86,4.70,.12,.35,'tileInk');
   }
 }
 if(profile.feature==='floral'){
   // Warm amber wood trim highlights hostel-like architecture, with no
   // real operator branding, logo or inaccessible visitor information.
   for(const x of [-3.24,-1.38,1.22,3.18])
     box(x,3.45,FRONT-.07,.26,.27,.30,'timberLight');
   stats.serviceDetails+=4;
 }
 if(profile.feature==='slot'){
   box(gateX>0?-2.81:2.81,2.31,FRONT-.26,.53,.45,.12,'gateWood');
   for(let i=0;i<5;i++){
     box(gateX>0?-2.81:2.81,2.11+i*.083,FRONT-.337,.44,.028,.043,'timberLight');
     stats.serviceDetails++;
   }
 }
 // Stepped granite curb and domestic drainage match the narrow uphill.
 for(let i=0;i<11;i++){
   const x=-3.42+(i+.5)*6.84/11;
   box(x,.032,FRONT-.36,6.84/11-.025,.049,.15,
     i%4===0?'drainIron':'stoneGrey');
 }
 return stats;
}
