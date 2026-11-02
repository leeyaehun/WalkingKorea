import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE} from '../src/world/BukchonSeventhLoop.js';
import {
  FIVE_GYEONG_REFERENCE_HANOK,isFiveGyeongHeroSite,
  buildFiveGyeongReferenceHanok
} from '../src/world/BukchonFiveGyeongHanok.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';
import {FIVE_GYEONG_APPROACH_WALL,buildFiveGyeongApproach}
  from '../src/world/BukchonFiveGyeongApproach.js';

function world(){
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=old;}
}
function captureAsset(){
  const calls={box:[],face:[],sphere:[],cylinder:[]};
  const make=(name)=>(...args)=>calls[name].push(args);
  const detail=buildFiveGyeongReferenceHanok({
    box:make('box'),face:make('face'),
    sphere:make('sphere'),cylinder:make('cylinder')
  });
  return {calls,detail};
}
test('photo-referenced 5-gyeong asset has unique real 3D architecture, not a cloned house',()=>{
  const {calls,detail}=captureAsset();
  assert.equal(detail.id,FIVE_GYEONG_REFERENCE_HANOK.id);
  assert.equal(detail.kind,'reference-hanok');
  assert.ok(detail.roofQuads>=460,'two real tiled gable/gate roof slopes missing');
  assert.ok(detail.tileRibs>=200,'raised giwa roof tile relief missing');
  assert.ok(detail.tileEndCaps>=60,'round ceramic roof caps missing');
  assert.ok(detail.woodPosts>=6,'heavy post rhythm missing');
  assert.ok(detail.woodBrackets>=6);
  assert.ok(detail.woodRafters>=20);
  assert.ok(detail.graniteBlocks>=32,'cut stone masonry not actually modeled');
  assert.ok(detail.fretMotifs>=7,'photographic Greek-key wall pattern missing');
  assert.ok(detail.latticeWindows>=6,'real timber grid windows missing');
  assert.equal(detail.gateLeaves,2);
  assert.equal(detail.lanterns,1);
  assert.equal(detail.courtyardDepth,4);
  assert.ok(calls.face.length>660,'missing bespoke roof/relief geometry');
  const palette=new Set(Object.values(calls).flatMap(a=>a.flatMap(args=>
    args.filter(v=>typeof v==='string'))));
  for(const c of ['plaster','timber','woodShade','stoneMasonry',
    'stoneLight','stoneGrey','tileInk','tileRidge','tileEnd',
    'hanokPaperWindow','gateWood','brickTerracotta'])
    assert.ok(palette.has(c),'missing visual material '+c);
  assert.ok(calls.box.length<1600,'one house is over-budget');
  assert.equal(detail.rearWing.attached,true,'rear wing is not part of one architectural compound');
  assert.equal(detail.rearWing.windows,6,'rear wing missing side elevation lattice');
  assert.ok(detail.roofQuads>650,'the new rear roof is not modeled in 3D');
});
test('every physical 3D detail is finite and the extended courtyard stays AWAY from the road',()=>{
  const {calls}=captureAsset();
  let ext={xmin:Infinity,xmax:-Infinity,zmin:Infinity,zmax:-Infinity,
    ymin:Infinity,ymax:-Infinity};
  const register=(x,y,z)=>{
    assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
    ext.xmin=Math.min(ext.xmin,x);ext.xmax=Math.max(ext.xmax,x);
    ext.ymin=Math.min(ext.ymin,y);ext.ymax=Math.max(ext.ymax,y);
    ext.zmin=Math.min(ext.zmin,z);ext.zmax=Math.max(ext.zmax,z);
  };
  for(const [x,y,z,w,h,d] of calls.box){
    register(x-w*.5,y-h*.5,z-d*.5);
    register(x+w*.5,y+h*.5,z+d*.5);
  }
  for(const f of calls.face){
    for(const point of f.slice(0,4))register(...point);
  }
  for(const [x,y,z,rx,ry,rz] of calls.sphere){
    register(x-rx,y-ry,z-rz);register(x+rx,y+ry,z+rz);
  }
  for(const [x,y,z,r,h] of calls.cylinder){
    register(x-r,y-h*.5,z-r);register(x+r,y+h*.5,z+r);
  }
  assert.ok(ext.xmin>=-4.0&&ext.xmax<=4.0,'asset extends into neighbor lot');
  assert.ok(ext.zmin>=-4.78,'entrance canopy intrudes on walking street');
  assert.ok(ext.zmax>11&&ext.zmax<12.4,'attached rear wing did not extend behind the original compound');
  assert.ok(ext.ymin>=-.10&&ext.ymax<=5.0,'roof height inconsistent');
  console.info('5-gyeong hero local 3D bounds',JSON.stringify(ext));
});
test('exactly one original west-side house is replaced without creating another lot',()=>{
  const w=world(),hero=w.fiveGyeongHero;
  assert.ok(hero,'world must mount the photo-referenced 5-gyeong house');
  assert.equal(w.houseSites.length,20,'house count changes the 5/6 street');
  assert.equal(w.houseSites.filter(s=>s.referenceAsset).length,5,
    'three houses on the original west side now have unique photo assets');
  assert.equal(w.houseSites.filter(s=>s.scenic).length,8);
  assert.equal(w.houseSites.filter(s=>s.district).length,11);
  assert.equal(hero.site.side,-1,'photograph is LEFT foreground looking uphill');
  assert.equal(hero.site.routeIndex,0);
  assert.ok(hero.site.laneZ>35&&hero.site.laneZ<49);
  assert.ok(isFiveGyeongHeroSite(hero.site));
  assert.equal(hero.site.assetId,FIVE_GYEONG_REFERENCE_HANOK.id);
  assert.equal(hero.asset.kind,'reference-hanok');
  assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
  assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
  assert.equal(w.seventhBuildings.buildings.length,6);
  assert.ok(w.seventhInfill.buildings.length>0);
  assert.equal(hero.asset.rearWing.attached,true);
  assert.ok(w.fiveGyeongApproach,'foreground still uses generic red stripe instead of real granite');
  assert.equal(w.fiveGyeongApproach.id,FIVE_GYEONG_APPROACH_WALL.id);
  assert.equal(w.nightFixtures.stats.hanokSconces,20);
  assert.equal(w.nightFixtures.fixtures.length,23);
  console.info('5-gyeong hero original lot:',JSON.stringify(hero.site));
});
test('the photographed lower 5-gyeong frontage is no longer a generic red-stripe wall',async()=>{
  const w=world(),f=w.continuousFrontages,a=w.fiveGyeongApproach;
  const special=FIVE_GYEONG_APPROACH_WALL;
  assert.equal(f.customFrontages.length,1);
  assert.equal(f.customFrontages[0].id,special.id);
  assert.equal(f.customFrontages[0].side,-1);
  assert.ok(a.segments>=12,'ornate house wall is missing');
  assert.ok(a.reliefBlocks>25,'granite blocks are not geometric solids');
  assert.ok(a.meanders>=12,'repeating grey/white relief missing');
  assert.ok(a.giwa>=6,'tile-capped low wall absent');
  assert.ok(a.roadClearance>.62,'frontage enters playable path');
  assert.ok(a.coverage.begin<50&&a.coverage.end===55);
  assert.ok(!f.runs.some(r=>r.side===-1 &&
    Math.min(r.toZ,special.end)-Math.max(r.fromZ,special.begin)>.001),
    'old red-striped generic plaster still drawn directly behind new wall');
  assert.equal(f.coverageAudit.largeGaps.length,0,
    'forgot to count the replacement granite wall in the street frontage');
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/world/BukchonFiveGyeongApproach.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/brickTerracotta|'brickWarm'/,
    'this wall should not recreate the old broad red stripe');
});

test('new masonry and gate do not obstruct the playable road or multiplayer',()=>{
  const w=world(),h=w.fiveGyeongHero.site;
  // local -Z faces the lane; the most protruding gate roof tile stays
  // outside the server/client walkway even when measured at its front edge.
  const c=Math.cos(h.angle),s=Math.sin(h.angle);
  const points=[
    [2.02,-4.63], // recessed gateway canopy and ceramic caps
    [-3.53,-4.47], // outside corner of stone wall
    [3.53,-4.47],
    [0,-3.56] // main roof drip edge
  ];
  for(const [lx,lz] of points){
    const x=h.x+lx*c-lz*s,z=h.z+lx*s+lz*c;
    const dist=w.distanceFromPath(x,z,w.paths[0]);
    assert.ok(dist>2.0,'hero asset encroaches on 5/6 pavement: '+[lx,lz,x,z]);
    assert.equal(onMainStreet(x,z),false,'photo facade is mistakenly walkable');
  }
  for(const road of w.paths)for(const [x,z] of road.samples)
    assert.equal(onMainStreet(x,z),true,'existing shared path was changed');
});
test('optional 5-gyeong preview URL begins at the lower street only when explicitly requested',()=>{
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(source,/get\('view'\)==='hanok5'/);
  assert.match(source,/state\.x=-1\.0;state\.z=52;state\.yaw=0/);
  assert.match(source,/const state=\{x:-3,z:-42,yaw:Math\.PI/);
  assert.match(source,/multiplayer\.start\(\)/);
});
test('single-mesh photoreal hanok remains within scene triangle and world fidelity budget',()=>{
  const w=world(),mesh=w.mesh,geo=mesh.geometry;
  assert.ok(geo.getAttribute('position').array.every(Number.isFinite));
  assert.equal(geo.getAttribute('position').count,geo.getAttribute('materialId').count);
  assert.equal(geo.getAttribute('position').count,geo.getAttribute('nightEmission').count);
  assert.ok(w.vertexCount>740000&&w.vertexCount<850000,
    'hero asset unexpectedly exceeds the mobile scene limit '+w.vertexCount);
  assert.ok(w.houseSites.some(x=>x.assetId===FIVE_GYEONG_REFERENCE_HANOK.id));
  console.info('5-gyeong full world vertices',w.vertexCount);
});
