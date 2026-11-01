import {mainLaneWidth,sampleMainLaneAtZ} from './BukchonStreetLayout.js';

/**
 * The visible west-hand masonry wall joining the photographed 5-gyeong
 * foreground house to the lower street entrance. Earlier builds used a
 * generic cream-and-RED-stripe fence here, hiding the bespoke 3D house and
 * leaving a featureless expanse beside it. This is the same compound's
 * street enclosure, not a second unrelated building or new walkable road.
 *
 * Coordinates are stylized game-space metres, not a cadastral survey.
 */
export const FIVE_GYEONG_APPROACH_WALL=Object.freeze({
  id:'bukchon-05-granite-meander-approach',
  side:-1,
  begin:49.76,
  end:55,
  height:2.38,
  streetSetback:.80
});

/** Same geometry inputs and terrain used by the live main-street frontage. */
export function buildFiveGyeongApproach({path,hill,face,box,sphere,distanceFromPath}){
  const {side,begin,end,streetSetback}=FIVE_GYEONG_APPROACH_WALL;
  let segments=0,reliefBlocks=0,meanders=0,giwa=0;
  let roadClearance=Infinity;

  function locate(z){
    const lane=sampleMainLaneAtZ(path.samples,z);
    if(!lane)throw Error('Missing photographed 5-gyeong street near '+z);
    const setback=mainLaneWidth(z)*.5+streetSetback;
    const nx=lane.nx*side,nz=lane.nz*side;
    const x=lane.x+nx*setback,zz=lane.z+nz*setback;
    const clearance=distanceFromPath(x,zz,path)-mainLaneWidth(z)*.5;
    roadClearance=Math.min(roadClearance,clearance);
    if(clearance<.62)throw Error('5-gyeong compound wall crossed the road');
    return {x,y:hill(x,zz),z:zz,nx:-nx,nz:-nz};
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  const A=locate(begin),B=locate(end);
  const length=end-begin;
  const units=Math.ceil(length/.42);

  function quad(a,b,y0,y1,col,out=0){
    const aa=[a.x+a.nx*out,a.y+y0,a.z+a.nz*out];
    const bb=[b.x+b.nx*out,b.y+y0,b.z+b.nz*out];
    const cc=[b.x+b.nx*out,b.y+y1,b.z+b.nz*out];
    const dd=[a.x+a.nx*out,a.y+y1,a.z+a.nz*out];
    face(aa,bb,cc,dd,[a.nx,0,a.nz],col);
  }
  // A continuous physical backing surface; no old red ornamental stripe.
  for(let i=0;i<units;i++){
    const a=locate(lerp(begin,end,i/units));
    const b=locate(lerp(begin,end,(i+1)/units));
    quad(a,b,-.08,.59,'stoneMasonry');
    quad(a,b,.59,1.09,'stoneGrey');
    quad(a,b,1.09,2.10,'stoneFoundation');
    quad(a,b,2.10,2.19,'stoneLight');

    // Layered dressed granite joints. Slightly raised to receive sunlight
    // and read as actual masonry from the third-person camera.
    for(let row=0;row<4;row++){
      const t0=(i+(row%2? .16:0))/units;
      const t1=(i+.94+(row%2? .16:0))/units;
      if(t1>1)continue;
      const p=locate(lerp(begin,end,t0)),q=locate(lerp(begin,end,t1));
      const bottom=.13+row*.215,top=bottom+.19;
      quad(p,q,bottom,top,
        (i+row)%5===0?'stoneLight':(i+row)%3===0?'stoneGrey':'stoneMasonry',
        .035+(i%2)*.008);
      reliefBlocks++;
    }

    // THE reference's grey/white repeated right-angle "meander" band.
    // Pale granite linework is modeled as raised tiny quads in front of a
    // dark granite plane: not a single texture or broad painted red strip.
    quad(a,b,1.12,1.96,'stoneGrey',.028);
    const z0=lerp(begin,end,i/units);
    const z1=lerp(begin,end,(i+1)/units);
    const p=locate(z0+.015),q=locate(z1-.015);
    quad(p,q,1.19,1.25,'stoneLight',.068);
    quad(p,q,1.85,1.91,'stoneLight',.068);
    quad(p,q,1.48,1.54,'stoneLight',.068);
    // Alternate turns create linked square C/ㄱ motifs recognizable from
    // both directions along the lower 5-gyeong walk.
    const turn0=locate(lerp(z0,z1,i%2? .72:.26));
    const turn1=locate(lerp(z0,z1,i%2? .28:.73));
    quad(turn0,turn1,1.25,1.32,'stoneLight',.075);
    quad(turn0,turn1,1.69,1.76,'stoneLight',.075);
    const post=locate(lerp(z0,z1,i%2? .68:.26));
    const postEnd=locate(lerp(z0,z1,i%2? .81:.39));
    quad(post,postEnd,1.31,1.75,'stoneLight',.077);
    meanders++;
    // Two actual black clay slopes meeting on a raised coping ridge.
    const aOuter=[a.x+a.nx*.19,a.y+2.24,a.z+a.nz*.19];
    const bOuter=[b.x+b.nx*.19,b.y+2.24,b.z+b.nz*.19];
    const aRidge=[a.x-a.nx*.05,a.y+2.43,a.z-a.nz*.05];
    const bRidge=[b.x-b.nx*.05,b.y+2.43,b.z-b.nz*.05];
    face(aOuter,bOuter,bRidge,aRidge,[0,1,0],'tileInk');
    const aInner=[a.x-a.nx*.26,a.y+2.23,a.z-a.nz*.26];
    const bInner=[b.x-b.nx*.26,b.y+2.23,b.z-b.nz*.26];
    face(aRidge,bRidge,bInner,aInner,[0,1,0],'tileIndigo');
    quad(a,b,2.39,2.45,'tileRidge',-.05);
    if(i%2===0){
      const p=locate((z0+z1)*.5);
      const capOffset=.22;
      sphere(p.x+p.nx*capOffset,p.y+2.20,p.z+p.nz*capOffset,
        .13,.092,.095,i%4?'tileEnd':'stoneLight',7,3);
      giwa++;
    }
    segments++;
  }
  // Structural column at the street's very bottom; it gently closes
  // the space without placing a gate or a post ON the main asphalt.
  const endPost=locate(end-.14);
  box(endPost.x,endPost.y+.93,endPost.z,.34,1.87,.36,'stoneMasonry');
  box(endPost.x,endPost.y+1.98,endPost.z,.43,.19,.45,'tileInk');
  const leftJoin=locate(begin+.11);
  box(leftJoin.x,leftJoin.y+1.09,leftJoin.z,.25,2.16,.31,'stoneFoundation');

  return {id:FIVE_GYEONG_APPROACH_WALL.id,segments,reliefBlocks,
    meanders,giwa,length,roadClearance,
    coverage:{...FIVE_GYEONG_APPROACH_WALL}};
}
