import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {FIVE_GYEONG_REFERENCE_HANOK} from '../src/world/BukchonFiveGyeongHanok.js';
import {FIVE_GYEONG_UPHILL_HANOK,buildFiveGyeongUphillHanok}
 from '../src/world/BukchonFiveGyeongUphillHanok.js';
import {FIVE_GYEONG_THIRD_HANOK,isFiveGyeongThirdSite,buildFiveGyeongThirdHanok}
 from '../src/world/BukchonFiveGyeongThirdHanok.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE} from '../src/world/BukchonSeventhLoop.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function world(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}
function capture(builder){
 const calls={box:[],face:[],sphere:[],cylinder:[]},fn=n=>(...args)=>calls[n].push(args);
 return {asset:builder({box:fn('box'),face:fn('face'),sphere:fn('sphere'),
   cylinder:fn('cylinder')}),calls};
}
function bounds(calls){
 const b={xmin:Infinity,xmax:-Infinity,zmin:Infinity,zmax:-Infinity,
   ymin:Infinity,ymax:-Infinity};
 const add=(x,y,z)=>{
   assert.ok([x,y,z].every(Number.isFinite),'non-finite 3D geometry');
   b.xmin=Math.min(b.xmin,x);b.xmax=Math.max(b.xmax,x);
   b.ymin=Math.min(b.ymin,y);b.ymax=Math.max(b.ymax,y);
   b.zmin=Math.min(b.zmin,z);b.zmax=Math.max(b.zmax,z);
 };
 for(const [x,y,z,w,h,d] of calls.box){
   add(x-w/2,y-h/2,z-d/2);add(x+w/2,y+h/2,z+d/2);
 }
 for(const a of calls.face)for(const p of a.slice(0,4))add(...p);
 for(const [x,y,z,rx,ry,rz] of calls.sphere){
   add(x-rx,y-ry,z-rz);add(x+rx,y+ry,z+rz);
 }
 for(const [x,y,z,r,h] of calls.cylinder){
   add(x-r,y-h/2,z-r);add(x+r,y+h/2,z+r);
 }
 return b;
}
test('second reference house now has real 49cm projecting low eaves that shed rain past windows',()=>{
 const {asset,calls}=capture(buildFiveGyeongUphillHanok);
 assert.equal(asset.id,FIVE_GYEONG_UPHILL_HANOK.id);
 assert.equal(asset.pairedWindows,2);
 assert.equal(asset.meanderCells,17);
 assert.equal(asset.eaves.protectsWindows,true);
 assert.ok(asset.eaves.projectedDepth>=.45,'7cm old roof lip was too shallow');
 assert.ok(asset.eaves.frontLipZ<=-4.62);
 assert.ok(asset.eaves.lowDripY<3.34,'eave still too high over window');
 assert.equal(asset.eaves.realSlopedTileCourses,12);
 assert.ok(asset.rafters>=30);
 const b=bounds(calls);
 assert.ok(b.zmin>=-4.82,'new eave crosses lane-side safe plot');
 assert.ok(b.ymax<5.10);
 console.info('Second house rain eaves',asset.eaves);
});
test('preserve initial 5-gyeong #8 and #10, replace only third uphill #12',()=>{
 const w=world(),houses=[w.fiveGyeongHero,w.fiveGyeongUphill,w.fiveGyeongThird];
 assert.equal(w.houseSites.length,20);
 assert.ok(houses.every(Boolean));
 assert.deepEqual(houses.map(h=>h.site.index),[8,10,12]);
 assert.ok(houses.every(h=>h.site.routeIndex===0&&h.site.side===-1));
 assert.ok(houses[0].site.laneZ>houses[1].site.laneZ);
 assert.ok(houses[1].site.laneZ>houses[2].site.laneZ+7);
 assert.ok(houses[1].site.laneZ<houses[2].site.laneZ+11);
 assert.deepEqual(houses.map(h=>h.site.assetId),[
   FIVE_GYEONG_REFERENCE_HANOK.id,
   FIVE_GYEONG_UPHILL_HANOK.id,
   FIVE_GYEONG_THIRD_HANOK.id
 ]);
 assert.equal(w.houseSites.filter(h=>h.referenceAsset).length,5);
 assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
 assert.equal(w.houseSites.filter(h=>h.district).length,11);
 assert.ok(isFiveGyeongThirdSite(houses[2].site));
 assert.ok(!isFiveGyeongThirdSite(houses[1].site));
 assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
 assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.equal(w.nightFixtures.fixtures.length,23);
 console.info('Third house plot',houses[2].site);
});
test('third house has unique central gate, twin side windows, large RED fret & ornate pale roof rosettes',()=>{
 const {asset,calls}=capture(buildFiveGyeongThirdHanok);
 assert.equal(asset.id,FIVE_GYEONG_THIRD_HANOK.id);
 assert.equal(asset.kind,'reference-third-red-maze-hanok');
 assert.ok(asset.redMeanders>=8);
 assert.ok(asset.graniteBlocks>=40);
 assert.equal(asset.windowPairs,2);
 assert.ok(asset.latticeBars>=30);
 assert.equal(asset.gateLeaves,2);
 assert.ok(asset.gateStuds>=8);
 assert.ok(asset.woodPosts>=10);
 assert.ok(asset.curvedGiwaFaces>=400);
 assert.ok(asset.giwaRibs>=200);
 assert.equal(asset.rosetteCaps,24);
 assert.equal(asset.carvedPetals,48);
 assert.equal(asset.whiteRafterEnds,24);
 assert.ok(asset.gableBeams>=8);
 assert.ok(asset.eaves.projectedDepth>=.50);
 assert.ok(asset.eaves.dripHeight<3.5);
 assert.equal(asset.eaves.rainSheltering,true);
 assert.equal(asset.facade.redTerracotta,true);
 assert.equal(asset.facade.twoSeparateLatticeWindows,true);
 assert.ok(calls.box.length<1450);
 assert.ok(calls.face.length>600);
 assert.ok(calls.sphere.length>=70);
 const materials=new Set(Object.values(calls).flatMap(list=>list.flatMap(
   args=>args.filter(x=>typeof x==='string'))));
 for(const mat of ['brickTerracotta','mortar','plaster','stoneMasonry',
   'stoneLight','woodShade','timberLight','gateWood','tileInk',
   'tileRidge','tileEnd','copper','hanokPaperWindow'])
   assert.ok(materials.has(mat),'missing photo material '+mat);
});
test('three house roofs and fronts remain outside multiplayer road and within safe original lots',()=>{
 const w=world(),h=w.fiveGyeongThird.site;
 const b=bounds(capture(buildFiveGyeongThirdHanok).calls);
 assert.ok(b.xmin>-4.03&&b.xmax<4.03,'roof too wide for neighbors');
 assert.ok(b.zmin>=-4.84&&b.zmax<4.44,'front lip projects into street');
 assert.ok(b.ymin>-.40&&b.ymax<5.31);
 const cs=Math.cos(h.angle),sn=Math.sin(h.angle);
 for(const [x,z] of [[-3.78,-4.66],[0,-4.82],[3.78,-4.66],
   [-3.5,-4.14],[3.5,-4.14],[0,-4.51]]){
   const X=h.x+x*cs-z*sn,Z=h.z+x*sn+z*cs;
   const dist=w.distanceFromPath(X,Z,w.paths[0]);
   assert.ok(dist>2.02,'third house eave blocks the road: '+[x,z,dist]);
   assert.equal(onMainStreet(X,Z),false);
 }
 for(const path of w.paths)for(const [x,z] of path.samples)
   assert.equal(onMainStreet(x,z),true);
 console.info('Third house local bounds',b);
});
test('real photographed facades are built on street, and next-house photo URL works',()=>{
 const src=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 const art=readFileSync(new URL('../src/world/BukchonFiveGyeongThirdHanok.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(src,/else if\(thirdHouse\)/);
 assert.match(src,/buildFiveGyeongThirdHanok\(\{box,face,sphere,cylinder\}\)/);
 assert.match(art,/const FRONT=-4\.14,EAVE_Z=-4\.66/);
 assert.match(art,/rosetteCaps/);
 assert.doesNotMatch(art,/buildHanokKit|courtyard\(/);
 assert.match(main,/get\('view'\)==='hanok5third'/);
 assert.match(main,/state\.x=-1\.15;state\.z=33\.1;state\.yaw=0/);
 assert.match(main,/get\('view'\)==='hanok5upper'/);
 assert.match(main,/third5Gyeong:/);
 assert.match(main,/houseSites,fiveGyeongThird,fortySevenVolumes,seventhBuildings/);
 const w=world(),z=w.fiveGyeongThird.site.laneZ;
 assert.ok(!w.continuousFrontages.runs.some(r=>
   r.side===-1&&r.fromZ<z&&r.toZ>z),
   'old generic red wall obscures third wood gate');
});
test('one finite world mesh with intact 8-player routes under mobile 850K budget',()=>{
 const w=world(),g=w.mesh.geometry;
 assert.ok(w.vertexCount>760000&&w.vertexCount<850000,
   'new house exceeded mobile budget '+w.vertexCount);
 assert.ok(g.getAttribute('position').array.every(Number.isFinite));
 assert.equal(g.getAttribute('position').count,g.getAttribute('materialId').count);
 assert.equal(g.getAttribute('position').count,g.getAttribute('nightEmission').count);
 assert.equal(w.paths.length,2);
 assert.equal(w.houseSites.length,20);
 assert.ok(w.fiveGyeongApproach);
 assert.ok(w.seventhInfill.buildings.length>0);
 console.info('Three photo houses full scene vertices',w.vertexCount);
});
