/**
 * Phase 05 — lived-in Bukchon street details.
 *
 * One authored, deterministic pass. Props belong to existing house fronts and
 * real street intersections; no global random clutter and no change to
 * walkable collision / street coordinates / Phase 01–04 lighting.
 *
 * All geometric operations share the existing one-mesh renderer and its
 * mineral/wood/clay material taxonomy. Decorative addresses are fictional.
 */
export function buildBukchonStreetLife({
  box,face,sphere,cylinder,textured,signs,withFrame,
  hill,houseSites,paths,distanceFromPath
}) {
  const houses=houseSites.filter(s=>s.scenic).sort((a,b)=>a.index-b.index);
  const counts={doorsteps:0,plaques:0,downspouts:0,planters:0,
    electricMeters:0,benches:0,storage:0,wires:0,poles:0};
  const entries=[];

  // Within each level-built house local +Y follows its stone platform,
  // local -Z is the lane-facing side of the masonry fence.
  for(const site of houses) {
    const ordinal=site.index;
    let summary={index:ordinal,type:site.archetype,details:[]};
    const add=key=>{counts[key]++;summary.details.push(key)};
    withFrame(site.x,site.z,site.angle,()=>{
      // Compact stone step: stops near the kerb, not on the walking roadway.
      box(0,-.017,-4.61,1.44,.16,.24,'stoneFoundation');
      box(0,.082,-4.50,1.24,.075,.25,'stoneLight');
      box(0,.118,-4.45,1.10,.03,.18,'stoneMasonry');
      add('doorsteps');

      // Small dark wood address plaque with fictional poetic house title.
      // Existing sign atlas maintains Korean glyphs without extra downloads.
      const plaqueX=ordinal%2===0?-1.91:1.91;
      box(plaqueX,1.53,-4.512,.64,.37,.092,'woodShade');
      box(plaqueX,1.53,-4.570,.56,.30,.025,'timberLight');
      textured(plaqueX,1.53,-4.588,.49,.23,'z',
        signs.residences[ordinal%signs.residences.length],-1);
      add('plaques');

      // Discreet utility meter, pipes and the bent downspout at the ends
      // of the facade: these are functionally placed, not scattered props.
      const side=ordinal%2===0?1:-1;
      const meterX=side*2.85;
      box(meterX,1.29,-4.455,.40,.54,.15,'stoneGrey');
      box(meterX,1.34,-4.545,.25,.24,.025,'paper');
      box(meterX,1.11,-4.548,.07,.06,.03,'copper');
      box(meterX,.73,-4.468,.058,.65,.08,'drainIron');
      add('electricMeters');

      const pipeX=-side*3.32;
      cylinder(pipeX,1.36,-3.42,.055,2.65,'drainIron',7);
      cylinder(pipeX,.18,-3.51,.075,.23,'stoneGrey',7);
      box(pipeX,.36,-3.47,.13,.08,.24,'drainIron');
      box(pipeX,2.66,-3.34,.18,.07,.30,'drainIron');
      add('downspouts');

      // Pots and greens stay at the wall's sides, well away from entrances.
      const numPots=ordinal%3===0?3:2;
      for(let p=0;p<numPots;p++){
        const x=(p%2===0?-1:1)*(2.54+(p%3)*.22);
        const z=-4.11+(p%2)*.32;
        const scale=.78+.09*((ordinal+p)%3);
        cylinder(x,.24*scale,z,.245*scale,.46*scale,
          p%2===0?'brickTerracotta':'gateWood',9);
        cylinder(x,.475*scale,z,.28*scale,.055*scale,'brickDark',9);
        cylinder(x,.52*scale,z,.207*scale,.045*scale,'stoneWarm',9);
        for(let k=0;k<3;k++){
          const a=(k*2.399+ordinal*.6);
          sphere(x+Math.cos(a)*.18*scale,.78*scale+k*.065,
            z+Math.sin(a)*.15*scale,.24*scale,.27*scale,.20*scale,
            k===1?'sage':'deepGreen',7,4);
        }
        if(p===numPots-1&&ordinal%2===0)
          sphere(x,.99*scale,z-.10,.09,.09,.10,'flowerCoral',7,4);
        add('planters');
      }

      if(ordinal===1||ordinal===5){
        // Low front-side bench, supported by substantial wooden feet.
        const x=2.18;
        box(x,.43,-3.83,1.14,.13,.45,'timberLight');
        for(const xx of [x-.42,x+.42])
          box(xx,.21,-3.83,.10,.35,.28,'timber');
        box(x,.69,-3.61,1.14,.44,.11,'woodShade');
        add('benches');
      }
      if(ordinal===2||ordinal===6){
        // Orderly onggi storage / small stack of ceramic jars.
        for(const [j,x] of [-2.62,-2.25,-1.93].entries()){
          const radius=.17+j*.018;
          const z=-3.92;
          cylinder(x,.29,z,radius,.56,'gateWood',9);
          cylinder(x,.60,z,radius*.83,.09,'woodShade',9);
          cylinder(x,.67,z,radius*.56,.07,'copper',9);
        }
        add('storage');
      }
    },{level:true});
    entries.push(summary);
  }

  // Two overhead crossing cables add scale and street identity, while staying
  // well ABOVE the player and away from branch-road visibility corridors.
  const upper=paths[0];
  const crossings=[-35.4,-8.7];
  function closestOnRoad(z) {
    let chosen=null;
    for(let i=1;i<upper.samples.length;i++) {
      const a=upper.samples[i-1],b=upper.samples[i];
      const min=Math.min(a[1],b[1]),max=Math.max(a[1],b[1]);
      if(z<min||z>max)continue;
      const t=(z-a[1])/(b[1]-a[1]||1);
      const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1;
      chosen={x:a[0]+dx*t,z,normal:[-dz/n,dx/n]};
      break;
    }
    return chosen;
  }
  function wire(a,b,sag=.22) {
    const pieces=10;
    for(let k=0;k<pieces;k++) {
      function point(t) {
        const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
        const y=a.y+(b.y-a.y)*t-sag*Math.sin(Math.PI*t);
        return [x,y,z];
      }
      const p=point(k/pieces),q=point((k+1)/pieces);
      const half=.012;
      // Two narrow crossed ribbons ensure the line is visible from side
      // and elevated camera views without a high-segment tube mesh.
      face([p[0]-half,p[1],p[2]],[q[0]-half,q[1],q[2]],
        [q[0]+half,q[1],q[2]],[p[0]+half,p[1],p[2]],
        [0,0,1],'woodShade');
      face([p[0],p[1]-half,p[2]],[q[0],q[1]-half,q[2]],
        [q[0],q[1]+half,q[2]],[p[0],p[1]+half,p[2]],
        [0,1,0],'woodShade');
    }
  }
  const lines=[];
  for(const z of crossings) {
    const lane=closestOnRoad(z);
    if(!lane)throw new Error('Missing cable street station '+z);
    const poles=[];
    for(const side of [-1,1]){
      const px=lane.x+lane.normal[0]*side*4.12;
      const pz=lane.z+lane.normal[1]*side*4.12;
      const y=hill(px,pz);
      const road=distanceFromPath(px,pz,upper);
      // Poles remain beyond player collision; never reduce playable road.
      if(road<2.5)throw new Error('Cable pole blocks street');
      cylinder(px,y+2.55,pz,.075,5.1,'woodShade',8);
      cylinder(px,y+5.14,pz,.12,.11,'stoneGrey',7);
      // Compact upper insulating arm, natural timber colour.
      box(px,y+4.94,pz,.38,.10,.10,'timber');
      poles.push({x:px,y:y+5.16,z:pz,road});
      counts.poles++;
    }
    // Two slender power wires, staggered high enough for camera clearance.
    for(let i=0;i<2;i++) {
      const a={...poles[0],y:poles[0].y+i*.17};
      const b={...poles[1],y:poles[1].y+i*.17};
      wire(a,b,.21+i*.035);
      counts.wires++;
    }
    lines.push({z,poles,clearance:Math.min(poles[0].y,poles[1].y)-.245});
  }

  return {counts,entries,lines,houseCount:houses.length};
}
