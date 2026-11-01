import {mainLaneWidth,sampleMainLaneAtZ} from './BukchonStreetLayout.js';

/**
 * Main-alley Step 03 — enclosing the visible bare lots.
 *
 * Derive wall runs from actual house frontage occupancy, not a second
 * imaginary road. Follow the same centerline and hill as paving/collision.
 * The walls are in the existing single world mesh, with low granite plinth,
 * brick inlay, limestone limewash and curved black-tile coping.
 *
 * The two vanished side-road openings are NOT crossings:
 * one gains a new hanok (assembled in BukchonWorld), while the other
 * gains a distinct roofed timber gate. No new accessible road is added.
 */
export const GAP_GATE=Object.freeze({z:-23.6,side:1,halfWidth:1.48});
export const FRONTAGE_HALF_SPAN=3.58;
const GAP_PADDING=.12;
const min=Math.min,max=Math.max;

export function buildContinuousFrontages({
  path,houses,hill,face,box,distanceFromPath,existingConnectors=[]
}){
  const fromZ=path.points.at(-1)[1],toZ=path.points[0][1];
  const summary={wallSegments:0,coveredMeters:0,bySide:{west:0,east:0},
    pillars:0,gates:0,gatePositions:[],runs:[],roadClearance:Infinity,
    existingConnectorMeters:existingConnectors.reduce((n,s)=>n+s.length,0),
    reservedConnectorSpans:[]};
  const sample=(z,side)=>{
    const lane=sampleMainLaneAtZ(path.samples,z);
    if(!lane)throw new Error('No main street center at '+z);
    const clearance=mainLaneWidth(z)*.5+.79;
    const x=lane.x+lane.nx*side*clearance;
    const zz=lane.z+lane.nz*side*clearance;
    const dist=distanceFromPath(x,zz,path)-mainLaneWidth(zz)*.5;
    if(dist<.56)throw new Error('Street-facing facade intrudes into path at '+z);
    summary.roadClearance=min(summary.roadClearance,dist);
    return {x,z:zz,y:hill(x,zz),nx:lane.nx*side,nz:lane.nz*side};
  };
  function quad(a,b,ya,yb,color,dy0=0,dy1=0) {
    // Texture projection and shading happen in the existing face() builder.
    const nx=(a.nx+b.nx)*.5,nz=(a.nz+b.nz)*.5;
    face([a.x,a.y+ya+dy0,a.z],[b.x,b.y+ya+dy1,b.z],
         [b.x,b.y+yb+dy1,b.z],[a.x,a.y+yb+dy0,a.z],
         [nx,0,nz],color);
  }
  function runWall(z0,z1,side){
    const parts=Math.ceil((z1-z0)/.93);
    for(let i=0;i<parts;i++){
      const a=sample(z0+(z1-z0)*i/parts,side);
      const b=sample(z0+(z1-z0)*(i+1)/parts,side);
      const seam=(i%7===0);
      quad(a,b,-.06,.57,seam?'stoneGrey':'stoneMasonry');
      quad(a,b,.57,.64,'stoneLight');
      quad(a,b,.64,1.53,'plaster');
      // A Korean hanok neighborhood wall rhythm: red ornamental bricks
      // through the pale rendering, not one flat featureless white plane.
      quad(a,b,1.53,1.94,seam?'brickTerracotta':'brick');
      quad(a,b,1.94,2.12,'mortar');
      quad(a,b,2.12,2.21,'tileRidge');
      // Tile ridge rises in the center of a shallow pitched coping.
      const roofA=[a.x+a.nx*.14,a.y+2.17,a.z+a.nz*.14];
      const roofB=[b.x+b.nx*.14,b.y+2.17,b.z+b.nz*.14];
      const ridgeA=[a.x-a.nx*.05,a.y+2.38,a.z-a.nz*.05];
      const ridgeB=[b.x-b.nx*.05,b.y+2.38,b.z-b.nz*.05];
      face(roofA,roofB,ridgeB,ridgeA,[0,1,0],'tileDark');
      const eaveA=[a.x-a.nx*.22,a.y+2.16,a.z-a.nz*.22];
      const eaveB=[b.x-b.nx*.22,b.y+2.16,b.z-b.nz*.22];
      face(ridgeA,ridgeB,eaveB,eaveA,[0,1,0],'tileIndigo');
      summary.wallSegments++;
    }
    const length=z1-z0;
    summary.coveredMeters+=length;
    summary.bySide[side<0?'west':'east']+=length;
    // Periodic masonry piers interrupt long stretches, without vegetation.
    for(let z=z0+2.0;z<z1-1.5;z+=5.3){
      const p=sample(z,side);
      box(p.x,p.y+1.01,p.z,.36,2.03,.36,'stoneMasonry');
      box(p.x,p.y+2.18,p.z,.48,.23,.48,'tileDark');
      summary.pillars++;
    }
  }
  function roofedGateway(){
    const {z,side,halfWidth}=GAP_GATE;
    const a=sample(z-halfWidth,side),b=sample(z+halfWidth,side);
    const m=sample(z,side),y=m.y;
    // Timber gateway is embedded in one unbroken property frontage,
    // not a hole in the walkable road or a new playable side alley.
    quad(a,b,-.03,.43,'stoneFoundation');
    quad(a,b,.43,2.87,'gateWood');
    quad(a,b,2.87,3.01,'timberLight');
    const toXZ=(u,sideOffset=0)=>{
      const p=sample(z+u,side);
      return [p.x+p.nx*sideOffset,p.z+p.nz*sideOffset,p.y];
    };
    for(const u of [-halfWidth,-.036,.036,halfWidth]){
      const [x,zz,gy]=toXZ(u,-.05);
      box(x,gy+1.57,zz,.13,3.02,.20,u===0?'timberLight':'timber');
    }
    for(let u=-halfWidth+.28;u<halfWidth-.10;u+=.36){
      const p=sample(z+u,side);
      box(p.x,p.y+1.72,p.z,.045,2.05,.12,'woodShade');
    }
    const topA=[a.x,a.y+3.07,a.z],topB=[b.x,b.y+3.07,b.z];
    const backA=[a.x-a.nx*.66,a.y+3.07,a.z-a.nz*.66];
    const backB=[b.x-b.nx*.66,b.y+3.07,b.z-b.nz*.66];
    const ridgeA=[m.x,m.y+3.58,m.z];
    const ridgeB=[m.x-m.nx*.66,m.y+3.58,m.z-m.nz*.66];
    face(topA,ridgeA,ridgeB,backA,[0,1,0],'tileDark');
    face(ridgeA,topB,backB,ridgeB,[0,1,0],'tileIndigo');
    quad(a,b,3.04,3.15,'tileRidge');
    const pin=sample(z,side);
    box(pin.x,pin.y+1.33,pin.z,.038,.18,.15,'copper');
    summary.gates++;
    summary.gatePositions.push({z,side,x:m.x,roadClearance:
      distanceFromPath(m.x,m.z,path)-mainLaneWidth(z)*.5});
  }

  // An interval for each existing house's street-facing facade. Never place
  // a generic wall across its actual door or window.
  for(const side of [-1,1]){
    const spans=houses.filter(h=>h.side===side || (h.side==null &&
      Math.sign(h.x-sample(h.z,1).x)===side))
      .map(h=>({begin:max(fromZ,(h.laneZ??h.z)-FRONTAGE_HALF_SPAN),
                end:min(toZ,(h.laneZ??h.z)+FRONTAGE_HALF_SPAN)}));
    if(side===GAP_GATE.side)spans.push({begin:GAP_GATE.z-GAP_GATE.halfWidth,
      end:GAP_GATE.z+GAP_GATE.halfWidth});
    // Step 04: Original short connecting stone walls are ALREADY present
    // in the shared mesh. In Step 03 we added a second wall over precisely
    // those spans, causing depth-buffer flickering in grey foundations.
    // Treat old connector intervals as OCCUPIED rather than draw duplicates.
    for(const link of existingConnectors.filter(s=>s.side===side)){
      const half=link.length*.5+.16;
      const begin=max(fromZ,link.midpoint.z-half);
      const end=min(toZ,link.midpoint.z+half);
      spans.push({begin,end});
      summary.reservedConnectorSpans.push({side,begin,end});
    }
    const cuts=spans.filter(v=>v.end>v.begin)
      .sort((a,b)=>a.begin-b.begin);
    const merged=[];
    for(const entry of cuts){
      if(!merged.length||entry.begin>merged.at(-1).end)
        merged.push({...entry});
      else merged.at(-1).end=max(merged.at(-1).end,entry.end);
    }
    let cursor=fromZ;
    for(const entry of [...merged,{begin:toZ,end:toZ}]){
      const stop=max(cursor,entry.begin);
      if(stop-cursor>.08){
        const begin=cursor+GAP_PADDING,end=stop-GAP_PADDING;
        if(end>begin+.08){
          runWall(begin,end,side);
          summary.runs.push({side,fromZ:begin,toZ:end,length:end-begin});
        }
      }
      cursor=max(cursor,entry.end);
    }
  }
  roofedGateway();
  return summary;
}
