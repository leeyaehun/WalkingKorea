import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE} from '../src/world/BukchonSeventhLoop.js';
import {FIVE_GYEONG_REFERENCE_HANOK} from '../src/world/BukchonFiveGyeongHanok.js';
import {
 FIVE_GYEONG_UPHILL_HANOK,isFiveGyeongUphillSite,
 buildFiveGyeongUphillHanok
} from '../src/world/BukchonFiveGyeongUphillHanok.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function createWorld(){
 const original=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=original;}
}
function capture(){
 const calls={box:[],face:[],sphere:[],cylinder:[]};
 const fn=n=>(...args)=>calls[n].push(args);
 const asset=buildFiveGyeongUphillHanok({
   box:fn('box'),face:fn('face'),sphere:fn('sphere'),
   cylinder:fn('cylinder')
 });
 return {asset,calls};
}
test('uphill next-door is original house #10, NOT first photo-house #8',()=>{
 const w=createWorld(),prev=w.fiveGyeongHero,newHouse=w.fiveGyeongUphill;
 assert.equal(w.houseSites.length,20);
 assert.ok(prev&&newHouse);
 assert.equal(prev.site.index,8);
 assert.equal(prev.site.assetId,FIVE_GYEONG_REFERENCE_HANOK.id);
 assert.equal(newHouse.site.index,10);
 assert.equal(newHouse.site.side,-1);
 assert.equal(newHouse.site.routeIndex,0);
 assert.ok(newHouse.site.laneZ>34&&newHouse.site.laneZ<41);
 assert.ok(prev.site.laneZ>newHouse.site.laneZ+7);
 assert.ok(prev.site.laneZ<newHouse.site.laneZ+12);
 assert.ok(newHouse.site.x<0);
 assert.equal(newHouse.site.assetId,FIVE_GYEONG_UPHILL_HANOK.id);
 assert.equal(newHouse.asset.id,FIVE_GYEONG_UPHILL_HANOK.id);
 assert.equal(newHouse.asset.kind,'reference-uphill-lattice-hanok');
 assert.equal(w.houseSites.filter(h=>h.referenceAsset).length,2);
 assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
 assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
 assert.equal(w.nightFixtures.fixtures.length,23);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.ok(w.seventhInfill.buildings.length>0);
 assert.ok(isFiveGyeongUphillSite(newHouse.site));
 assert.equal(isFiveGyeongUphillSite(prev.site),false);
 console.info('Next photo-house site',JSON.stringify(newHouse.site));
});

test('the second house is distinctly built: double lattice, charcoal meander, RED THIN brick, light round eave',()=>{
 const {asset,calls}=capture();
 assert.equal(asset.pairedWindows,2);
 assert.ok(asset.latticeMullions>=38);
 assert.ok(asset.graniteBlocks>=65);
 assert.equal(asset.meanderCells,17);
 assert.equal(asset.redBrickCourses,38);
 assert.ok(asset.rafters>=12);
 assert.ok(asset.whiteEaveEnds>=55);
 assert.ok(asset.tileQuads>=390);
 assert.ok(asset.raisedTileSeams>=200);
 assert.ok(asset.gableTimbers>=8);
 assert.ok(asset.woodPosts>=10);
 assert.equal(asset.gatewayLeaves,1);
 assert.equal(asset.utilities,1);
 assert.deepEqual(asset.streetFacade.signatures,[
   'dark timber','two pairs lattice','thin red brick',
   'charcoal Korean meander','white rafter ends'
 ]);
 const used=new Set(Object.values(calls).flatMap(e=>e.flatMap(args=>
   args.filter(x=>typeof x==='string'))));
 for(const c of ['tileInk','tileIndigo','tileEnd','stoneLight',
   'stoneGrey','stoneMasonry','plaster','woodShade','timberLight',
   'hanokPaperWindow','brickTerracotta','drainIron','copper'])
   assert.ok(used.has(c),'missing reference material '+c);
 assert.ok(calls.box.length<1300,'too much geometry for a single mobile house');
 assert.ok(calls.face.length>=550,'hand-laid curves and facade relief missing');
 assert.ok(calls.sphere.length>=50,'giwa and white round eave terminals missing');
});

test('new second facade and its decorative roof are INSIDE the approved single plot, not paved path',()=>{
 const {calls}=capture();
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,
   minY=Infinity,maxY=-Infinity;
 const add=(x,y,z)=>{
   assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
 };
 for(const [x,y,z,w,h,d] of calls.box){
   add(x-w*.5,y-h*.5,z-d*.5);add(x+w*.5,y+h*.5,z+d*.5);
 }
 for(const args of calls.face)for(const p of args.slice(0,4))add(...p);
 for(const [x,y,z,rx,ry,rz] of calls.sphere){
   add(x-rx,y-ry,z-rz);add(x+rx,y+ry,z+rz);
 }
 for(const [x,y,z,rx,h] of calls.cylinder){
   add(x-rx,y-h*.5,z-rx);add(x+rx,y+h*.5,z+rx);
 }
 assert.ok(minX>-4.02&&maxX<4.02,'eaves cross the neighboring property');
 assert.ok(minZ>-4.82&&maxZ<4.43,'roof or doorstep goes into pedestrian lane / adjacent house');
 assert.ok(minY>-.5&&maxY<5.05);
 console.info('uphill hanok local asset bounds',JSON.stringify({minX,maxX,minZ,maxZ,minY,maxY}));
 const w=createWorld(),h=w.fiveGyeongUphill.site;
 const c=Math.cos(h.angle),s=Math.sin(h.angle);
 for(const [x,z] of [[0,-4.43],[-3.05,-4.68],
   [3.39,-4.41],[-3.79,-4.10],[3.79,-4.10]]){
   const worldX=h.x+x*c-z*s,worldZ=h.z+x*s+z*c;
   const dist=w.distanceFromPath(worldX,worldZ,w.paths[0]);
   assert.ok(dist>2.0,'model blocks the narrow 5-gyeong lane '+[x,z,dist]);
   assert.equal(onMainStreet(worldX,worldZ),false);
 }
 for(const path of w.paths)
   for(const [x,z] of path.samples)
     assert.equal(onMainStreet(x,z),true);
});

test('new frontage is the actual visible house skin; old front facing generic block is not duplicated',()=>{
 const worldSource=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 const art=readFileSync(new URL('../src/world/BukchonFiveGyeongUphillHanok.js',import.meta.url),'utf8');
 assert.match(worldSource,/if\(photoHouse\)\{/);
 assert.match(worldSource,/else if\(uphillHouse\)\{/);
 assert.match(worldSource,/buildFiveGyeongUphillHanok\(\{box,face,sphere,cylinder\}\)/);
 assert.doesNotMatch(art,/courtyard\(|buildHanokKit/);
 assert.match(art,/pairedWindow\(-1\.68,2\.54\)/);
 assert.match(art,/pairedWindow\(1\.70,2\.54\)/);
 assert.match(art,/const FRONT=-4\.15/);
 const w=createWorld(),f=w.continuousFrontages,z=w.fiveGyeongUphill.site.laneZ;
 assert.ok(!f.runs.some(r=>r.side===-1&&r.fromZ<z&&r.toZ>z),
   'generic red wall still hides new house windows');
 assert.equal(w.fiveGyeongHero.site.assetId,FIVE_GYEONG_REFERENCE_HANOK.id);
 assert.equal(w.fiveGyeongApproach.coverage.begin,49.76);
});

test('camera QA can preview the REAL upper 5-gyeong plot immediately; original default never changes',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/get\('view'\)==='hanok5upper'/);
 assert.match(main,/state\.x=-1\.0;state\.z=42\.4;state\.yaw=0/);
 assert.match(main,/get\('view'\)==='hanok5'/);
 assert.match(main,/state\.x=-1\.0;state\.z=52;state\.yaw=0/);
 assert.match(main,/const state=\{x:-3,z:-42,yaw:Math\.PI/);
 assert.match(main,/photographic5GyeongHouses:/);
 assert.match(main,/multiplayer\.start\(\)/);
 const w=createWorld(),positions=w.houseSites
   .filter(h=>h.referenceAsset).map(h=>({index:h.index,x:h.x,z:h.z}));
 assert.deepEqual(positions.map(h=>h.index),[8,10]);
});

test('complete world renderer, night materials and 8-player road remain within mobile budget',()=>{
 const w=createWorld(),geo=w.mesh.geometry;
 assert.ok(w.vertexCount>755000&&w.vertexCount<850000,
   'single house is too expensive '+w.vertexCount);
 assert.ok(geo.getAttribute('position').array.every(Number.isFinite));
 assert.equal(geo.getAttribute('position').count,
   geo.getAttribute('materialId').count);
 assert.equal(geo.getAttribute('position').count,
   geo.getAttribute('nightEmission').count);
 assert.equal(w.paths.length,2);
 assert.equal(w.houseSites.length,20);
 console.info('World after second photographic hanok: vertices',w.vertexCount);
});
