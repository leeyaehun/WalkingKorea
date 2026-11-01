import {distanceToHanokFootprint,hanokFootprintsOverlap} from './BukchonSeventhBuildings.js';
import {sampleRouteAtDistance} from './BukchonSeventhViewpoint.js';

// D-5: uneven two-sided residential massing behind the six D-3 addresses.
// These are real background homes, not extra POIs, billboards, or clones.
export const SEVENTH_INFILL_SEEDS=Object.freeze([
  {id:'lower-corner',s:9.4,side:1,kind:'corner',width:5.2,depth:4.7,setback:8.8},
  {id:'lower-courtyard',s:15.6,side:-1,kind:'courtyard',width:4.7,depth:4.4,setback:9.5},
  {id:'west-terrace',s:22.6,side:1,kind:'terrace',width:5.4,depth:4.8,setback:9.7},
  {id:'west-narrow',s:30.1,side:-1,kind:'narrow',width:4.5,depth:4.1,setback:9.0},
  {id:'mid-corner',s:38.9,side:1,kind:'corner',width:5.0,depth:4.6,setback:9.6},
  {id:'mid-courtyard',s:46.0,side:-1,kind:'courtyard',width:4.8,depth:4.3,setback:9.3},
  {id:'bend-terrace',s:53.0,side:1,kind:'terrace',width:5.5,depth:4.8,setback:9.8},
  {id:'bend-narrow',s:60.8,side:-1,kind:'narrow',width:4.6,depth:4.2,setback:9.2},
  {id:'upper-corner',s:67.1,side:1,kind:'corner',width:5.2,depth:4.6,setback:9.7},
  {id:'upper-courtyard',s:73.6,side:-1,kind:'courtyard',width:4.8,depth:4.3,setback:9.1},
  // The inside edge is squeezed by the preserved 5/6 road. These narrow
  // roofed corner compounds keep that edge continuously built without
  // claiming a walkable metre of either street.
  {id:'inside-gate-01',s:11.2,side:1,kind:'edge',width:3.2,depth:.80,setback:3.0},
  {id:'inside-gate-02',s:24.2,side:1,kind:'edge-tall',width:3.7,depth:.82,setback:3.0},
  {id:'inside-gate-03',s:37.0,side:1,kind:'edge-stone',width:3.0,depth:.78,setback:3.0},
  {id:'inside-gate-04',s:50.0,side:1,kind:'edge-tall',width:3.9,depth:.84,setback:3.0},
  {id:'inside-gate-05',s:63.0,side:1,kind:'edge-stone',width:3.3,depth:.80,setback:3.0},
  {id:'inside-corner',s:74.2,side:1,kind:'edge-tall',width:3.8,depth:.84,setback:3.0}
]);

const roadMargin=(site,path)=>Math.min(...path.samples.map(([x,z])=>
  distanceToHanokFootprint(x,z,site)-(path.widthAt?path.widthAt(z):path.width)*.5));

export function planSeventhInfill({path,paths,houses=[]}){
  const buildings=[],rejected=[];
  for(const seed of SEVENTH_INFILL_SEEDS){
    let selected=null;
    for(const shift of [0,-1.1,1.1,-2.2,2.2]){
      const lane=sampleRouteAtDistance(path.samples,seed.s+shift);
      const angle=Math.atan2(-lane.nx*seed.side,lane.nz*seed.side);
      // Original D-3 homes may use the first terrace. Climb a little higher
      // rather than leaving the other side of the lane visibly empty.
      for(const setback of seed.kind.startsWith('edge')?[seed.setback]:[seed.setback,12.2,15.0,17.5]){
        const site={...seed,s:seed.s+shift,setback,angle,
          x:lane.x+lane.nx*seed.side*setback,
          z:lane.z+lane.nz*seed.side*setback};
        const clearance=Math.min(...paths.map(p=>roadMargin(site,p)));
        if(clearance<.62){rejected.push({id:seed.id,reason:'road'});continue;}
        if([...houses,...buildings].some(h=>hanokFootprintsOverlap(site,h,.38))){
          rejected.push({id:seed.id,reason:'lot'});continue;
        }
        selected={...site,clearance};break;
      }
      if(selected)break;
    }
    if(selected)buildings.push(selected);
  }
  return {buildings,rejected};
}

export function buildSeventhInfill({plan,withFrame,box,face}){
  let roofs=0,retainingSteps=0,wallRuns=0;
  const roof=(w,d,tone)=>{
    const hw=w*.5,hd=d*.5,ridge=w*.18;
    for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<8;col++){
      const t0=row/4,t1=(row+1)/4,u0=col/8,u1=(col+1)/8;
      const point=(t,u)=>{const span=hw*(1-t)+ridge*t;return [(u*2-1)*span,3.0+.72*t,side*hd*(1-t)];};
      face(point(t0,u0),point(t0,u1),point(t1,u1),point(t1,u0),[0,1,side*.45],(row+col)%6===0?'tileRidge':tone);
    }
    box(0,3.76,0,w*.39,.13,.22,'tileInkLight');roofs++;
  };
  for(const site of plan.buildings){
    withFrame(site.x,site.z,site.angle,()=>{
      const w=site.width,d=site.depth,tone=site.kind==='terrace'||site.kind==='edge-tall'?'tilePlum':site.kind==='corner'||site.kind==='edge-stone'?'tileIndigo':'tileInk';
      for(let step=0;step<3;step++){
        box(0,-.18+step*.22,-d*.5-.13-step*.14,w+.34-step*.20,.22,.32,'stoneMasonry');
        box(0,-.05+step*.22,-d*.5-.13-step*.14,w+.25-step*.20,.07,.36,'stoneLight');retainingSteps++;
      }
      box(0,.30,0,w+.12,.52,d+.12,'stoneFoundation');
      box(0,1.50,0,w,2.42,d,'plaster');
      for(const x of [-w*.39,0,w*.39]){box(x,1.54,-d*.5-.05,.11,2.38,.14,'timber');box(x,2.72,-d*.5-.09,.22,.10,.28,'timberLight');}
      if(site.kind==='corner'){box(w*.38,1.42,.38,w*.28,2.05,d*.70,'plaster');roof(w*.68,d*.86,'tileJade');}
      else roof(w+.54,d+.42,tone);
      const wallH=site.kind==='terrace'||site.kind==='edge-tall'?2.08:site.kind==='edge-stone'?1.88:1.62;
      box(0,wallH*.5,-d*.5-.62,w+.52,wallH,.24,wallH>1.8?'brickTerracotta':'plaster');
      box(0,wallH+.04,-d*.5-.62,w+.68,.12,.38,'tileDark');wallRuns++;
    },{level:true});
  }
  return {buildings:plan.buildings,rejected:plan.rejected,roofs,retainingSteps,wallRuns};
}
