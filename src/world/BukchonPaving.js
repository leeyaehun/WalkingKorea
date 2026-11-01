/**
 * Bukchon paving v1 — softened sand-coloured stone slabs, staggered joints,
 * hand-cut edge kerbs, and occasional unobtrusive drains. Every vertex follows
 * the existing winding and sloped pedestrian routes.
 *
 * This is bespoke, deterministic THREE.BufferGeometry (via the world's face()
 * builder), not a repeated texture pasted over a rectangular road.
 */
export function buildPavedAlleys({paths,face,hill}) {
  let tiles=0,drains=0,shoulderMeters=0,endCaps=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shades=['paveWarm','paveCream','paveSand','paveLight','paveStone','paveHoney'];
  const mix=(a,b,t)=>a+(b-a)*t;
  function seeded(n){let x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);}
  function stations(path){
    const p=path.samples,arr=[{x:p[0][0],z:p[0][1],s:0}];
    let length=0;
    for(let i=1;i<p.length;i++){
      const [x,z]=p[i],a=p[i-1],d=Math.hypot(x-a[0],z-a[1]);
      const parts=Math.max(1,Math.ceil(d/.82));
      for(let j=1;j<=parts;j++){
        let v=j/parts;
        arr.push({x:mix(a[0],x,v),z:mix(a[1],z,v),s:length+d*v});
      }
      length+=d;
    }
    for(let i=0;i<arr.length;i++){
      let a=arr[Math.max(0,i-1)],b=arr[Math.min(arr.length-1,i+1)];
      let dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;
      arr[i].nx=-dz/L;arr[i].nz=dx/L;
    }
    return arr;
  }
  function at(q,l,h){
    const x=q.x+q.nx*l,z=q.z+q.nz*l;
    return [x,hill(x,z)+h,z];
  }
  function quad(a,b,la,lb,za,zb,height,col){
    face(at(a,la,height),at(a,lb,height),at(b,lb,height),at(b,la,height),[0,1,0],col);
  }
  for(let pi=0;pi<paths.length;pi++){
    const path=paths[pi],st=stations(path);
    const gutter=.23;
    for(let i=0;i<st.length-1;i++){
      const a=st[i],b=st[i+1];
      // Use the SAME street-width profile as collision and house setbacks.
      const half=(path.widthAt?path.widthAt((a.z+b.z)*.5):path.width)*.5;
      const inner=half-gutter;
      const foot=pi*10007+i*53;
      const lift=pi*.004;
      // Explicit layer separation: grout / asphalt / repair / iron are no
      // longer nearly coplanar at 1-3mm depth differences.
      // Grout shadow surface is visible in the fine gaps between real slabs.
      quad(a,b,-half,half,0,1,.023+lift,'paveGrout');
      // Thin narrow drainage strips form a crisp edge along each house row.
      for(const side of [-1,1]){
        const l0=side*(half-gutter),l1=side*half;
        quad(a,b,Math.min(l0,l1),Math.max(l0,l1),0,1,.064+lift,
          i%7===0?'edgeStoneLight':'edgeStone');
        const kerb=side*(half-gutter-.021);
        quad(a,b,kerb-.022,kerb+.022,0,1,.090+lift,'paveJoint');
        if(i%17===5 || i%23===9){
          const drainL=side*(half-gutter*.48);
          const drainA=drainL-.102,drainB=drainL+.102;
          const da={...a,x:mix(a.x,b.x,.21),z:mix(a.z,b.z,.21)};
          const db={...a,x:mix(a.x,b.x,.79),z:mix(a.z,b.z,.79)};
          da.nx=a.nx;da.nz=a.nz;db.nx=b.nx;db.nz=b.nz;
          quad(da,db,drainA,drainB,0,1,.103+lift,'drainIron');
          for(let k=0;k<4;k++){
            const tt=.08+k*.21;
            const d0={...a,x:mix(da.x,db.x,tt),z:mix(da.z,db.z,tt),nx:a.nx,nz:a.nz};
            const d1={...a,x:mix(da.x,db.x,tt+.09),z:mix(da.z,db.z,tt+.09),nx:b.nx,nz:b.nz};
            quad(d0,d1,drainA+.034,drainB-.034,0,1,.111+lift,'drainGrill');
          }
          drains++;
        }
      }
      // The iconic Gahoe-dong descending lane is smooth muted asphalt
      // between pale stone kerbs, not a bright checkerboard of paving.
      // Branch alleys retain their smaller warm stone slabs.
      if(pi===0){
        // One narrow continuous stone shoulder on BOTH sides. Keep below
        // the kerb tops and stop short of the new property wall at +.79m.
        // This replaces the beige/raw terrain strip visible from the camera.
        for(const side of [-1,1]){
          const from=side*(half+.025),to=side*(half+.71);
          quad(a,b,Math.min(from,to),Math.max(from,to),0,1,.031+lift,
            i%17===0?'stoneWarm':'edgeStoneLight');
          const joint=side*(half+.13);
          quad(a,b,joint-.029,joint+.029,0,1,.048+lift,'paveJoint');
        }
        shoulderMeters+=Math.hypot(b.x-a.x,b.z-a.z)*2;
        quad(a,b,-inner+.035,inner-.035,0,1,.077+lift,
             i%23===0?'asphaltPatch':'asphalt');
        if(i%31===11){
          const repair={...a,x:mix(a.x,b.x,.25),z:mix(a.z,b.z,.25)};
          const repairEnd={...a,x:mix(a.x,b.x,.79),z:mix(a.z,b.z,.79)};
          repair.nx=a.nx;repair.nz=a.nz;
          repairEnd.nx=b.nx;repairEnd.nz=b.nz;
          quad(repair,repairEnd,-.65,.66,0,1,.090+lift,'asphaltPatch');
        }
        tiles++;
        continue;
      }
      // Offset joints and mixed slab widths avoid the generic tiled-grid look.
      const rowWidth=inner*2;
      const columns=pi===0?4:3;
      const stagger=i%3===0?.13:i%3===1?-.11:0;
      let last=-inner+.028;
      for(let col=0;col<columns;col++){
        const proportional=(col+1)/columns;
        const split=-inner+rowWidth*proportional
          +(col<columns-1?(seeded(foot+col)-.5)*.16+stagger*.7:0);
        const finish=col===columns-1?inner-.028:split-.020;
        const begin=last+.008;
        if(finish-begin<.28){last=split;continue;}
        const surface=.051+lift+(seeded(foot+col*3)-.5)*.003;
        const shade=shades[Math.floor(seeded(foot+col*13)*shades.length)];
        // The long sides are skewed very slightly, as if hand-cut; no grid.
        const angle=(seeded(foot+col*19)-.5)*.045;
        quad(a,b,begin+angle,finish+angle,0,1,surface,shade);
        // Occasional pale stone patches resemble repaired small slabs,
        // not paint or artificial road markings.
        if((i+col*7)%29===11){
          const cut=.33;
          const top={...a,x:mix(a.x,b.x,cut),z:mix(a.z,b.z,cut)};
          const end={...a,x:mix(a.x,b.x,.81),z:mix(a.z,b.z,.81)};
          const left=begin+.12,right=Math.min(finish-.05,begin+.53);
          quad(top,end,left,right,0,1,surface+.001,
            (i%2===0?'pavePatch':'paveMossStone'));
        }
        tiles++;
        last=split;
      }
    }
  }
  // The route's walkable collision ends at its last centerline station.
  // A separate short stone threshold OUTSIDE each endpoint makes the
  // asphalt terminate in a proper visual landing rather than a hard edge
  // against the large untextured beige terrain plate. No new walkable
  // segments are added to the actual path/collision graph.
  const main=paths[0];
  if(main){
    const st=stations(main);
    for(const [q,sign] of [[st[0],1],[st.at(-1),-1]]){
      const half=(main.widthAt?main.widthAt(q.z):main.width)*.5;
      const push=t=>({x:q.x-q.nz*t*sign,z:q.z+q.nx*t*sign,
        nx:q.nx,nz:q.nz});
      const near=push(.04),outer=push(2.3),cross=push(.24);
      quad(near,outer,-half-.48,half+.48,0,1,.041,'paveStone');
      quad(near,cross,-half-.54,half+.54,0,1,.081,'edgeStone');
      const far=push(2.33);
      quad(outer,far,-half-.48,half+.48,0,1,.060,'paveJoint');
      endCaps++;
    }
  }
  return {tiles,drains,shoulderMeters,endCaps,
    description:'continuous asphalt, granite shoulders, capped lane ends and distinct depth layers'};
}
