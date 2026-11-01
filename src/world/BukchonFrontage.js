/**
 * Phase 02 — bridges very short gaps between adjacent scenic house frontages.
 *
 * Uses the existing house transforms, not a separate randomly placed fence.
 * Only houses on the SAME side of the main road and <11m apart are eligible.
 * Junctions and portals remain open. Geometry remains in the shared world mesh.
 */
export function buildFrontageConnectors({
  houses,face,hill,distanceFromPath,mainPath,paths=[mainPath],district=false
}) {
  const selected=houses.filter(h=>
    (district ? h.district : h.scenic) && h.archetype!=='cafe');
  let count=0,segments=[];
  const frontPoint=(h,lx)=>{
    const lz=h.archetype==='facing'?-3.89:-4.21;
    const c=Math.cos(h.angle),s=Math.sin(h.angle);
    return {x:h.x+lx*c-lz*s,z:h.z+lx*s+lz*c,
      y:hill(h.x,h.z)};
  };
  function polygon(a,b,c,d,normal,color){
    face(a,b,c,d,normal,color);
  }
  for(const routeIndex of (district?[0,1,2]:[0])) {
  const road=paths[routeIndex]||mainPath;
  for(const side of [-1,1]){
    const row=selected.filter(h=>h.side===side &&
       (district?h.routeIndex===routeIndex:true))
       .sort((a,b)=>a.laneZ-b.laneZ);
    for(let i=1;i<row.length;i++){
      const a=row[i-1],b=row[i];
      if(Math.hypot(b.x-a.x,b.z-a.z)>11.2)continue;
      // Pick the closest of the four end-post pairs.
      let best=null;
      for(const ax of [-3.49,3.49])for(const bx of [-3.49,3.49]){
        const p=frontPoint(a,ax),q=frontPoint(b,bx);
        const d=Math.hypot(p.x-q.x,p.z-q.z);
        if(!best||d<best.d)best={p,q,d};
      }
      if(best.d<.12||best.d>(district?4.8:3.25))continue;
      const {p,q,d}=best;
      const mx=(p.x+q.x)*.5,mz=(p.z+q.z)*.5;
      const roadDist=distanceFromPath(mx,mz,road);
      if(roadDist<(road.widthAt?road.widthAt(mz):road.width)*.5+.22)continue;
      // A wall link between houses may never cut across a crossing road.
      if(district && paths.some((other,index)=>index!==routeIndex &&
        [0.2,0.5,0.8].some(t=>{
          const px=p.x+(q.x-p.x)*t,pz=p.z+(q.z-p.z)*t;
          return distanceFromPath(px,pz,other) <
            (other.widthAt?other.widthAt(pz):other.width)*.5+.50;
        })))continue;
      // No side streets remain. Other checks still keep walls off the
      // sole walkable road; open facade spans will be rebuilt in Step 03.
      const dx=(q.x-p.x)/d,dz=(q.z-p.z)/d;
      const nx=dz*.5,nz=-dx*.5; // 0.5m-thick enclosing stone wall
      const base0=p.y-.25,base1=q.y-.25,wallHeight=1.74;
      const front0=[p.x+nx*.34,base0,p.z+nz*.34];
      const front1=[q.x+nx*.34,base1,q.z+nz*.34];
      const back0=[p.x-nx*.34,base0,p.z-nz*.34];
      const back1=[q.x-nx*.34,base1,q.z-nz*.34];
      const topF0=[front0[0],p.y+wallHeight,front0[2]];
      const topF1=[front1[0],q.y+wallHeight,front1[2]];
      const topB0=[back0[0],p.y+wallHeight,back0[2]];
      const topB1=[back1[0],q.y+wallHeight,back1[2]];
      // Step 04 / Z-FIGHT FIX: Before, full-height plaster and the grey
      // granite base occupied the EXACT SAME plane from base to +0.35m.
      // With depth testing, each could win arbitrarily as the camera moved.
      // Split them into non-overlapping vertical bands, not layered decals.
      const plinthF0=[front0[0],p.y+.35,front0[2]];
      const plinthF1=[front1[0],q.y+.35,front1[2]];
      const plinthB0=[back0[0],p.y+.35,back0[2]];
      const plinthB1=[back1[0],q.y+.35,back1[2]];
      polygon(plinthF0,plinthF1,topF1,topF0,[nx,0,nz],'plaster');
      polygon(plinthB1,plinthB0,topB0,topB1,[-nx,0,-nz],'plaster');
      polygon(front0,front1,plinthF1,plinthF0,[nx,0,nz],'stoneFoundation');
      polygon(back1,back0,plinthB0,plinthB1,[-nx,0,-nz],'stoneFoundation');
      polygon(topF0,topF1,topB1,topB0,[0,1,0],'tileDark');
      // Coping forms a rooflet with two sloping sides, like the nearby house walls.
      for(const sign of [-1,1]){
        const at0=[p.x+sign*nx*.45,p.y+wallHeight-.15,p.z+sign*nz*.45];
        const at1=[q.x+sign*nx*.45,q.y+wallHeight-.15,q.z+sign*nz*.45];
        const central0=[p.x,p.y+wallHeight+.09,p.z];
        const central1=[q.x,q.y+wallHeight+.09,q.z];
        polygon(central0,central1,at1,at0,[0,1,0],'tileDark');
      }
      segments.push({length:d,routeIndex,side,from:a.index,to:b.index,midpoint:{x:mx,z:mz},roadDistance:roadDist});
      count++;
    }
  }
  }
  return {count,segments};
}
