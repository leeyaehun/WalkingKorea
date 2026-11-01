/**
 * Weather step 05: real-looking, local illumination in the EXISTING world
 * shader. The city is intentionally one BufferGeometry/ShaderMaterial; using
 * 28 conventional Three.js PointLights would add an expensive per-pixel
 * array of dynamic lights and shadow maps to a static environment.
 *
 * Fixtures are real mesh details. Eight nearest warm area lights are
 * evaluated in the single world fragment shader and smoothly illuminate
 * street stones and nearby walls. No extra shadow-casting claims.
 */
export const MAX_VISIBLE_NIGHT_LIGHTS=8;
export const STREET_LIGHT_STATIONS=Object.freeze([-36.5,-26.8,-6.4]);

export function nightEmissionClass(key,frame=null) {
  if(key==='cityLitWindowWarm')return 1;
  if(key==='cityLitWindowCool')return 2;
  if(key==='warmLight'||key==='warmGlass'||key==='lampGlobe')return 3;
  if(key==='hanokPaperWindow'&&frame) {
    // Some homes stay dark; all faces of a single home share that decision.
    const seed=Math.abs(Math.round(frame.x*11+frame.z*5));
    return seed%4<2?4:0;
  }
  return 0;
}

export function buildBukchonNightFixtures({
  houseSites,paths,hill,withFrame,box,cylinder,sphere,distanceFromPath
}) {
  const fixtures=[],stats={hanokSconces:0,streetLamps:0};
  for(const site of houseSites) {
    const localX=(site.index%2===0?-1:1)*2.46;
    const localZ=site.archetype==='facing'?-3.89:-4.52;
    withFrame(site.x,site.z,site.angle,()=>{
      // Small downward wall lantern: dark bracket, gently glowing paper pane
      // and a protective roof. No decorative pots or vegetation.
      box(localX,2.31,localZ+.09,.09,.27,.22,'woodShade');
      box(localX,2.10,localZ-.12,.35,.46,.26,'timber');
      box(localX,2.11,localZ-.264,.27,.34,.025,'lampGlobe');
      box(localX,2.31,localZ-.10,.48,.08,.35,'tileDark');
      box(localX,1.85,localZ-.10,.44,.07,.32,'woodShade');
    },{level:true});
    const c=Math.cos(site.angle),s=Math.sin(site.angle);
    fixtures.push({
      x:site.x+localX*c-localZ*s,
      y:hill(site.x,site.z)+2.07,
      z:site.z+localX*s+localZ*c,
      radius:7.1,
      type:'hanok',index:site.index
    });
    stats.hanokSconces++;
  }

  const road=paths[0];
  for(let i=0;i<STREET_LIGHT_STATIONS.length;i++){
    const z=STREET_LIGHT_STATIONS[i],side=i%2===0?-1:1;
    let point=null;
    for(let j=1;j<road.samples.length;j++){
      const a=road.samples[j-1],b=road.samples[j];
      if(z>Math.max(a[1],b[1])||z<Math.min(a[1],b[1]))continue;
      const t=(z-a[1])/(b[1]-a[1]||1);
      const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1;
      point={x:a[0]+dx*t,nx:-dz/n,nz:dx/n};
      break;
    }
    if(!point)throw Error('Missing light pole lane '+z);
    const x=point.x+point.nx*side*3.08;
    const zz=z+point.nz*side*3.08;
    const outside=paths.every(p=>
      distanceFromPath(x,zz,p)>(p.widthAt?p.widthAt(zz):p.width)*.5+.30);
    if(!outside)throw Error('Night lamp blocks a walkable road '+z);
    const y=hill(x,zz);
    // A modest black metal Seoul alley lamp with shallow amber housing.
    cylinder(x,y+2.15,zz,.064,4.30,'drainIron',9);
    cylinder(x,y+.14,zz,.19,.28,'stoneFoundation',9);
    box(x,y+4.31,zz,.60,.11,.56,'woodShade');
    box(x,y+4.16,zz,.48,.19,.45,'lampGlobe');
    box(x,y+4.04,zz,.51,.045,.45,'copper');
    fixtures.push({x,y:y+4.07,z:zz,radius:9.1,type:'street',index:i});
    stats.streetLamps++;
  }
  return {fixtures,stats};
}

/** Select only eight nearest lights when the avatar travels far enough.
 * No scene lights are spawned: one float vec4 uniform per selected fixture.
 * Sorting is deterministic, and all remaining fixtures still glow as meshes.
 */
export function createBukchonNightLights({fixtures,uniform,max=MAX_VISIBLE_NIGHT_LIGHTS}) {
  const data=new Float32Array(max*4);
  let previousX=Infinity,previousZ=Infinity,previousNight=null,updates=0;
  function update(x,z,night) {
    const moved=Math.hypot(x-previousX,z-previousZ)>1.5;
    if(!moved&&previousNight===night)return;
    data.fill(0);
    if(night) {
      const closest=fixtures.map((f,i)=>({
        f,i,d2:(f.x-x)**2+(f.z-z)**2
      })).sort((a,b)=>a.d2-b.d2||a.i-b.i).slice(0,max);
      closest.forEach(({f},i)=>data.set([f.x,f.y,f.z,f.radius],i*4));
    }
    uniform.value=data;
    previousX=x;previousZ=z;previousNight=night;
    updates++;
  }
  return {update,getStatus:()=>({fixtures:fixtures.length,active:previousNight?max:0,updates}),data};
}
