import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {FORTY_SEVEN_PLOTS,fortySevenPartAt,buildFortySevenVolume}
  from '../src/world/BukchonFortySevenHanok.js';
import {FIVE_GYEONG_REFERENCE_HANOK} from '../src/world/BukchonFiveGyeongHanok.js';
import {FIVE_GYEONG_UPHILL_HANOK} from '../src/world/BukchonFiveGyeongUphillHanok.js';
import {FIVE_GYEONG_THIRD_HANOK} from '../src/world/BukchonFiveGyeongThirdHanok.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE,SEVENTH_JOIN} from '../src/world/BukchonSeventhLoop.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function makeWorld(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}
function capture(part){
 const calls={box:[],face:[],sphere:[],cylinder:[]};
 const callback=k=>(...args)=>calls[k].push(args);
 const data=buildFortySevenVolume({part,box:callback('box'),face:callback('face'),
   sphere:callback('sphere'),cylinder:callback('cylinder')});
 return {calls,data};
}
function getBounds(calls){
 const b={xmin:Infinity,xmax:-Infinity,
   ymin:Infinity,ymax:-Infinity,zmin:Infinity,zmax:-Infinity};
 const accept=(x,y,z)=>{
   assert.ok([x,y,z].every(Number.isFinite));
   b.xmin=Math.min(b.xmin,x);b.xmax=Math.max(b.xmax,x);
   b.ymin=Math.min(b.ymin,y);b.ymax=Math.max(b.ymax,y);
   b.zmin=Math.min(b.zmin,z);b.zmax=Math.max(b.zmax,z);
 };
 for(const [x,y,z,w,h,d] of calls.box){
   accept(x-w/2,y-h/2,z-d/2);accept(x+w/2,y+h/2,z+d/2);
 }
 for(const a of calls.face)for(const p of a.slice(0,4))accept(...p);
 for(const [x,y,z,rx,ry,rz] of calls.sphere){
   accept(x-rx,y-ry,z-rz);accept(x+rx,y+ry,z+rz);
 }
 for(const [x,y,z,r,h] of calls.cylinder){
   accept(x-r,y-h/2,z-r);accept(x+r,y+h/2,z+r);
 }
 return b;
}
test('47 is built on exactly original west slots 14 and 16, following three earlier photo houses',()=>{
 const w=makeWorld(),v=w.fortySevenVolumes;
 assert.equal(v.length,2);
 assert.deepEqual(v.map(x=>x.site.index),[14,16]);
 assert.deepEqual(v.map(x=>x.site.compoundPart),['main-house','gatehouse']);
 assert.deepEqual(v.map(x=>x.site.assetId),FORTY_SEVEN_PLOTS.map(x=>x.id));
 assert.ok(v.every(x=>x.site.side===-1&&x.site.routeIndex===0));
 assert.ok(v[0].site.laneZ>17&&v[0].site.laneZ<22);
 assert.ok(v[1].site.laneZ>8&&v[1].site.laneZ<13);
 assert.ok(v[1].site.laneZ>SEVENTH_JOIN.lowerZ+7);
 assert.equal(w.houseSites.length,20);
 assert.equal(w.houseSites.filter(s=>s.scenic).length,8);
 assert.equal(w.houseSites.filter(s=>s.district).length,11);
 assert.deepEqual(w.houseSites.filter(s=>s.referenceAsset).map(s=>s.index),[8,10,12,14,16]);
 assert.deepEqual(w.houseSites.filter(s=>s.referenceAsset).slice(0,3).map(s=>s.assetId),[
   FIVE_GYEONG_REFERENCE_HANOK.id,FIVE_GYEONG_UPHILL_HANOK.id,
   FIVE_GYEONG_THIRD_HANOK.id
 ]);
 console.info('47 hanok plots',JSON.stringify(v.map(x=>x.site)));
});
test('site selection never rewrites the house opposite 47 or the previous house 43',()=>{
 for(const p of FORTY_SEVEN_PLOTS){
   const laneZ=(p.zMin+p.zMax)/2;
   assert.equal(fortySevenPartAt({index:p.index,side:-1,routeIndex:0,laneZ}).id,p.id);
   assert.equal(fortySevenPartAt({index:p.index,side:1,routeIndex:0,laneZ}),null);
   assert.equal(fortySevenPartAt({index:p.index,side:-1,routeIndex:1,laneZ}),null);
 }
 assert.equal(fortySevenPartAt({index:12,side:-1,routeIndex:0,laneZ:28.3}),null);
 assert.throws(()=>capture('other'),/Unknown 47-streetscape/);
});
test('two related, not duplicated 47 volumes have real granite/terracotta gate and deep flower giwa roofs',()=>{
 const a=capture('main-house'),b=capture('gatehouse');
 for(const {data,calls} of [a,b]){
   assert.equal(data.kind,'reference-47-hanok');
   assert.ok(data.graniteBlocks>45);
   assert.ok(data.terracottaMeanders>=5);
   assert.ok(data.whiteFretStrokes>=25);
   assert.equal(data.latticeWindows,2);
   assert.ok(data.latticeBars>=35);
   assert.ok(data.woodPosts>=10);
   assert.equal(data.gateLeaves,2);
   assert.ok(data.gateStuds>=12);
   assert.ok(data.gateRecess>.30);
   assert.ok(data.roofTiles>=430);
   assert.ok(data.tileRibs>=210);
   assert.equal(data.flowerCaps,23);
   assert.equal(data.whiteRafterEnds,23);
   assert.equal(data.carvedPetals,32);
   assert.ok(data.eaveRafters>=32);
   assert.ok(data.gableBeams>=8);
   assert.ok(data.eave.projectedDepth>=.50);
   assert.ok(data.eave.dripHeight<3.43);
   assert.equal(data.eave.rainshed,true);
   assert.equal(data.streetFacade.plainBranding,true);
   assert.ok(calls.face.length>620);
   assert.ok(calls.box.length<1400);
   const palette=new Set(Object.values(calls).flatMap(arr=>arr.flatMap(args=>
     args.filter(v=>typeof v==='string'))));
   for(const mat of ['stoneMasonry','stoneLight','stoneGrey','brickTerracotta',
     'plaster','woodShade','timberLight','gateWood','hanokPaperWindow',
     'tileInk','tileRidge','tileEnd','copper','drainIron'])
     assert.ok(palette.has(mat),'missing visible surface '+mat);
 }
 assert.notEqual(a.data.eave.dripHeight,b.data.eave.dripHeight);
 assert.notEqual(a.data.volume,b.data.volume);
});
test('both roof overhangs and recessed gates clear original narrow public walking corridor',()=>{
 const w=makeWorld();
 for(const v of w.fortySevenVolumes){
   const b=getBounds(capture(v.asset.volume).calls);
   assert.ok(b.xmin>-4&&b.xmax<4,'overlap next house');
   assert.ok(b.zmin>=-4.83&&b.zmax<4.40,'rain eave hits lane');
   assert.ok(b.ymin>-.40&&b.ymax<5.3);
   const c=Math.cos(v.site.angle),s=Math.sin(v.site.angle);
   for(const [x,z] of [[-3.5,-4.81],[0,-4.81],[3.5,-4.81],
     [-3.49,-4.16],[3.49,-4.16],[0,-4.53]]){
     const X=v.site.x+x*c-z*s,Z=v.site.z+x*s+z*c;
     const d=w.distanceFromPath(X,Z,w.paths[0]);
     assert.ok(d>1.97,'photo house enters walkway '+[v.site.index,x,z,d]);
     assert.equal(onMainStreet(X,Z),false);
   }
   console.info('47 volume 3D bounds',v.asset.volume,b);
 }
});
test('the actual 7-viewpoint side alley is still connected and the 47-to-branch strip has no bare wall gaps',()=>{
 const w=makeWorld();
 assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
 assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
 assert.equal(w.seventhLoopWalls.join.lowerZ,SEVENTH_JOIN.lowerZ);
 assert.equal(w.paths[1].points[0][1],1.5);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.ok(w.seventhInfill.buildings.length>0);
 assert.equal(w.nightFixtures.fixtures.length,23);
 assert.equal(w.continuousFrontages.coverageAudit.largeGaps.length,0);
 assert.ok(!w.continuousFrontages.runs.some(r=>r.side===-1&&
   [19.44,10.50].some(z=>r.fromZ<z&&r.toZ>z)),
   'an old generic plaster wall masks the two designed street facades');
 for(const path of w.paths)for(const [x,z] of path.samples)
   assert.equal(onMainStreet(x,z),true,'old shared multiplayer road changed');
 assert.ok(w.distanceFromPath(-2.11,1.5,w.paths[0])<.8);
 assert.ok(w.distanceFromPath(-8.6,1.3,w.paths[1])<.06);
});
test('direct actual-game photo review links and finite single mobile mesh remain intact',()=>{
 const s=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const art=readFileSync(new URL('../src/world/BukchonFortySevenHanok.js',import.meta.url),'utf8');
 const worldSource=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.match(s,/get\('view'\)==='hanok47'/);
 assert.match(s,/state\.x=-1\.35;state\.z=24\.8;state\.yaw=0/);
 assert.match(s,/get\('view'\)==='hanok47alley'/);
 assert.match(s,/state\.x=-1\.82;state\.z=6\.4;state\.yaw=Math\.PI/);
 assert.match(s,/const state=\{x:-3,z:-42,yaw:Math\.PI/);
 assert.match(s,/fortySeven:\{parts:fortySevenVolumes\.map/);
 assert.match(s,/multiplayer\.start\(\)/);
 assert.match(art,/const frontRoof=-4\.68/);
 assert.match(art,/gateZ=front\+\.34/);
 assert.doesNotMatch(art,/buildHanokKit|courtyard\(/);
 assert.match(worldSource,/else if\(fortySevenPlot\)/);
 const w=makeWorld(),geo=w.mesh.geometry;
 assert.ok(w.vertexCount>785000&&w.vertexCount<850000,
   'exceeds existing mobile world budget '+w.vertexCount);
 assert.ok(geo.getAttribute('position').array.every(Number.isFinite));
 assert.equal(geo.getAttribute('position').count,
   geo.getAttribute('materialId').count);
 assert.equal(geo.getAttribute('position').count,
   geo.getAttribute('nightEmission').count);
 console.info('World vertices with five handmade street houses',w.vertexCount);
});
