import {mainLaneWidth,sampleMainLaneAtZ} from './BukchonStreetLayout.js';

/**
 * The LAST short section between the 47-inspired recessed gatehouse
 * (original west main-road plot index 16) and the existing OPEN entrance
 * to the 7-gyeong western loop, z=1.5 with a half-span of 2.6m.
 *
 * The generic white wall with a thick continuous red stripe still
 * looked flat and artificial in the actual deployed reverse-angle
 * screenshot. This replaces JUST that 2.76m wall run with a low dressed
 * granite enclosure, a relief red/ivory meander frieze and deep giwa
 * coping, carrying the same photo-guided visual grammar to the turn.
 *
 * Neither path nor the junction is changed or covered.
 */
export const FORTY_SEVEN_RETURN_WALL=Object.freeze({
 id:'bukchon-47-west-return-to-seventh-entrance',
 side:-1,
 begin:4.14,
 end:6.90,
 fromPhotoHouse:16,
 junctionZ:1.5,
 width:'existing-west-frontage'
});

export function buildFortySevenReturnWall({
  path,hill,face,box,sphere,distanceFromPath
}){
 const {begin,end,side}=FORTY_SEVEN_RETURN_WALL;
 const stats={id:FORTY_SEVEN_RETURN_WALL.id,
   length:end-begin,segments:0,stoneBlocks:0,
   redMeanders:0,whiteStrokes:0,giwaCaps:0,
   minRoadClearance:Infinity,
   westSide:true,junctionOpen:true
 };
 function at(z){
   const lane=sampleMainLaneAtZ(path.samples,z);
   if(!lane)throw Error('Missing street sample at 47 turn '+z);
   const margin=mainLaneWidth(z)*.5+.81;
   const x=lane.x+lane.nx*side*margin;
   const zz=lane.z+lane.nz*side*margin;
   const y=hill(x,zz);
   const clearance=distanceFromPath(x,zz,path)-mainLaneWidth(z)*.5;
   if(clearance<.61)throw Error('47 end wall intersects main pavement');
   stats.minRoadClearance=Math.min(stats.minRoadClearance,clearance);
   return {x,z:zz,y,
     nx:-lane.nx*side,nz:-lane.nz*side};
 }
 function quad(a,b,low,high,col,offset=0){
   const x0=a.x+a.nx*offset,z0=a.z+a.nz*offset;
   const x1=b.x+b.nx*offset,z1=b.z+b.nz*offset;
   face([x0,a.y+low,z0],[x1,b.y+low,z1],
     [x1,b.y+high,z1],[x0,a.y+high,z0],
     [a.nx,0,a.nz],col);
 }
 const count=Math.ceil((end-begin)/.32);
 for(let i=0;i<count;i++){
   const z0=begin+(end-begin)*i/count;
   const z1=begin+(end-begin)*(i+1)/count;
   const a=at(z0),b=at(z1);
   // Stone footing, deliberate mortar/individual block coursing rather
   // than one flat grey plane. The back wall is not rendered twice.
   quad(a,b,-.08,.21,'stoneFoundation');
   quad(a,b,.21,1.16,'stoneMasonry');
   for(let row=0;row<4;row++){
     const bottom=.23+row*.22;
     quad(a,b,bottom,bottom+.187,
       (i+row)%5===0?'stoneLight':
       (i+row)%3===0?'stoneGrey':'stoneMasonry',
       .041+(row%2)*.012);
     stats.stoneBlocks++;
   }
   quad(a,b,1.11,1.20,'stoneLight',.018);
   // Broad terracotta / white meander matches the photo's short wing
   // wall, not the bland old red band without an architectural pattern.
   quad(a,b,1.22,1.80,'brickTerracotta',.013);
   quad(a,b,1.23,1.285,'plaster',.064);
   quad(a,b,1.742,1.796,'plaster',.064);
   quad(a,b,1.49,1.54,'plaster',.069);
   const third=(z1-z0)/3;
   const c=at(z0+third);
   const d=at(z0+third*2);
   quad(c,d,1.285,1.55,'plaster',.079);
   quad(a,c,1.55,1.75,'plaster',.073);
   quad(d,b,1.29,1.50,'plaster',.077);
   stats.redMeanders++;
   stats.whiteStrokes+=6;
   quad(a,b,1.82,1.96,'stoneLight');
   // Real pitched rooflet on top of a wall, with a higher black ridge.
   const p0=[a.x+a.nx*.23,a.y+2.00,a.z+a.nz*.23];
   const p1=[b.x+b.nx*.23,b.y+2.00,b.z+b.nz*.23];
   const r0=[a.x-a.nx*.02,a.y+2.25,a.z-a.nz*.02];
   const r1=[b.x-b.nx*.02,b.y+2.25,b.z-b.nz*.02];
   const q0=[a.x-a.nx*.23,a.y+2.02,a.z-a.nz*.23];
   const q1=[b.x-b.nx*.23,b.y+2.02,b.z-b.nz*.23];
   face(p0,p1,r1,r0,[0,1,0],i%5===0?'tileInkLight':'tileInk');
   face(r0,r1,q1,q0,[0,1,0],'tileIndigo');
   quad(a,b,2.24,2.30,'tileRidge',-.018);
   if(i%2===0&&i>0&&i<count-1){
     const c=at((z0+z1)/2);
     sphere(c.x+c.nx*.245,c.y+1.99,c.z+c.nz*.245,
       .112,.097,.071,i%4===0?'stoneLight':'tileEnd',8,4);
     stats.giwaCaps++;
   }
   stats.segments++;
 }
 // The stone end-post stops BEFORE the broad 7-gyeong route mouth; no
 // accidental door, bridge or new collision plane across the turn.
 const corner=at(begin+.13);
 box(corner.x,corner.y+.94,corner.z,.25,1.87,.28,'stoneMasonry');
 box(corner.x,corner.y+2.17,corner.z,.37,.15,.42,'tileInk');
 const houseJoin=at(end-.12);
 box(houseJoin.x,houseJoin.y+.90,houseJoin.z,.23,1.80,.28,'stoneGrey');
 box(houseJoin.x,houseJoin.y+2.16,houseJoin.z,.32,.11,.34,'tileRidge');
 return stats;
}
