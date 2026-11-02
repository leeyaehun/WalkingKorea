import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {RIGHT_HANOK_PROFILES,rightHanokForSite,buildRightHanokPhoto}
  from '../src/world/BukchonRightNineHanoks.js';
import {scenicHouseSites} from '../src/world/BukchonStreetLayout.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {SEVENTH_LOOP_ROUTE,SEVENTH_JOIN} from '../src/world/BukchonSeventhLoop.js';
import {onMainStreet} from '../src/multiplayer/protocol.js';

function world(){
 const prev=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=prev;}
}
function capture(profile){
 const calls={box:[],face:[],sphere:[],cylinder:[]};
 const f=k=>(...args)=>calls[k].push(args);
 const info=buildRightHanokPhoto({
   profile,box:f('box'),face:f('face'),sphere:f('sphere'),cylinder:f('cylinder')
 });
 return {info,calls};
}
function bounds(calls){
 const b={xmin:Infinity,xmax:-Infinity,zmin:Infinity,zmax:-Infinity,
   ymin:Infinity,ymax:-Infinity};
 const put=(x,y,z)=>{
   assert.ok([x,y,z].every(Number.isFinite),'NaN in street asset geometry');
   b.xmin=Math.min(b.xmin,x);b.xmax=Math.max(b.xmax,x);
   b.ymin=Math.min(b.ymin,y);b.ymax=Math.max(b.ymax,y);
   b.zmin=Math.min(b.zmin,z);b.zmax=Math.max(b.zmax,z);
 };
 for(const [x,y,z,w,h,d] of calls.box){
   put(x-w/2,y-h/2,z-d/2);put(x+w/2,y+h/2,z+d/2);
 }
 for(const a of calls.face)for(const p of a.slice(0,4))put(...p);
 for(const [x,y,z,rx,ry,rz] of calls.sphere){
   put(x-rx,y-ry,z-rz);put(x+rx,y+ry,z+rz);
 }
 for(const [x,y,z,r,h] of calls.cylinder){
   put(x-r,y-h/2,z-r);put(x+r,y+h/2,z+r);
 }
 return b;
}
const PHOTO_LABELS=['노스텔지어 호스텔','44호','46호','48호','52호','54호','56호','58호','58-1호'];

test('all nine requested user-photo identities map to NINE different ORIGINAL east lots',()=>{
 assert.equal(RIGHT_HANOK_PROFILES.length,9);
 assert.deepEqual(RIGHT_HANOK_PROFILES.map(p=>p.label),PHOTO_LABELS);
 assert.deepEqual(RIGHT_HANOK_PROFILES.map(p=>p.index),[9,11,13,15,17,18,6,5,3]);
 assert.equal(new Set(RIGHT_HANOK_PROFILES.map(p=>p.index)).size,9);
 const w=world(),actual=w.rightPhotoHouses;
 assert.equal(actual.length,9);
 assert.deepEqual(actual.map(x=>x.profile.label).sort(),PHOTO_LABELS.slice().sort());
 assert.deepEqual(actual.map(x=>x.site.index).sort((a,b)=>a-b),[3,5,6,9,11,13,15,17,18]);
 assert.ok(actual.every(x=>x.site.side===1&&x.site.photoRight));
 assert.ok(actual.every(x=>x.site.rightAssetId==='bukchon-right-'+x.profile.id));
 assert.equal(w.houseSites.filter(x=>x.photoRight).length,9);
 assert.equal(w.houseSites.length,20);
 assert.equal(w.houseSites.filter(x=>x.scenic).length,8);
 assert.equal(w.houseSites.filter(x=>x.district).length,11);
 console.info('9 right hanoks at existing plots',
   JSON.stringify(actual.map(x=>({name:x.profile.label,index:x.site.index,z:x.site.laneZ}))));
});

test('PHOTO profiles are distinctive, not nine copies of a single generic wall',()=>{
 const ids=new Set(),appearances=new Set();
 for(const p of RIGHT_HANOK_PROFILES){
   ids.add(p.id);
   appearances.add([p.wood,p.gateX,p.gateW,p.roofTop,p.windows,p.kind,p.feature].join('|'));
   assert.equal(p.side,1);
   assert.ok(p.roofTop>4.4&&p.roofTop<4.8);
   assert.ok(p.roofDrip<3.4);
   assert.ok(rightHanokForSite({index:p.index,side:1,laneZ:p.z})===p);
   assert.equal(rightHanokForSite({index:p.index,side:-1,laneZ:p.z}),null);
   assert.equal(rightHanokForSite({index:p.index,side:1,laneZ:p.z+4}),null);
   assert.equal(rightHanokForSite({index:p.index,side:1,routeIndex:1,laneZ:p.z}),null);
 }
 assert.equal(ids.size,9);assert.equal(appearances.size,9);
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.kind==='floral'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.feature==='chimney'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.feature==='garden'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.feature==='brickCorner'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.windows==='steel'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.windows==='glass'));
 assert.ok(RIGHT_HANOK_PROFILES.some(p=>p.windows==='long'));
});

test('every hand-authored right 3D house has physical granite/red fret, wooden gates, glazed lattice and sheltered giwa roofs',()=>{
 for(const p of RIGHT_HANOK_PROFILES){
   const {info,calls}=capture(p);
   assert.equal(info.id,'bukchon-right-'+p.id);
   assert.equal(info.kind,'right-photo-hanok');
   assert.equal(info.reference,p.label);
   assert.ok(info.stoneBlocks>=14,p.id+' missing stone foundation relief');
   assert.ok(info.fretMotifs>=2,p.id+' missing architectural frieze');
   assert.ok(info.latticeBars>=10,p.id+' missing wood mullions');
   assert.equal(info.gateLeaves,2);
   assert.ok(info.gateStuds>=16);
   assert.equal(info.roofCourses,192,'each two-sided giwa roof is really articulated');
   assert.equal(info.roofRibs,96);
   assert.equal(info.tileEndCaps,12);
   assert.ok(info.rafterEnds>=14);
   assert.ok(info.woodPosts>=8);
   assert.equal(info.hasDeepEave,true);
   assert.ok(info.wallZ-info.roofLipZ>=.5,'roof lip is not outside sash');
   assert.ok(info.roofDrip<3.4,'roof is too high above wooden windows');
   assert.ok(calls.face.length>200);
   assert.ok(calls.box.length<700,'building too expensive on mobile');
   const materials=new Set(Object.values(calls).flatMap(a=>a.flatMap(
     args=>args.filter(v=>typeof v==='string'))));
   for(const name of ['plaster','stoneFoundation','stoneMasonry','stoneLight',
     'gateWood','tileInk','tileRidge','tileEnd','woodShade','timberLight',
     'stoneGrey','hanokPaperWindow'])
      if(name!=='hanokPaperWindow'||p.windows!=='glass')
        assert.ok(materials.has(name),p.id+' lacks photo material '+name);
 }
});

test('hostel floral wall has separate raised flower circles; 52 has brick corner; 58-1 has capped chimney',()=>{
 const hostel=capture(RIGHT_HANOK_PROFILES[0]),corner=capture(RIGHT_HANOK_PROFILES[4]),
   chimney=capture(RIGHT_HANOK_PROFILES[8]);
 assert.ok(hostel.info.floralPetals>=24,'hostel long-wall flower belt missing');
 assert.ok(hostel.info.fretMotifs>=8,'hostel TWO brick-border meanders missing');
 assert.ok(corner.info.barredWindows>=5,'52 iron window guard missing');
 assert.ok(corner.info.serviceDetails>=13,'52 brick corner and gas meter missing');
 assert.ok(chimney.info.serviceDetails>=13,'58-1 brick chimney not built');
 const roof=bounds(chimney.calls);
 assert.ok(roof.ymax>6.2&&roof.ymax<6.8,'distinct high brick cap not visible');
 const a=bounds(hostel.calls),b=bounds(corner.calls);
 assert.ok(a.ymax<5.2&&b.ymax<5.2,'unintended tall tower on normal roof');
});

test('ALL nine facades remain on east private plots and do NOT enter narrow public or seven-viewpoint lanes',()=>{
 const w=world();
 for(const v of w.rightPhotoHouses){
   const b=bounds(capture(v.profile).calls);
   assert.ok(b.xmin>=-3.95&&b.xmax<=3.95,
     'roof reaches next house: '+v.profile.label);
   assert.ok(b.zmin>=-4.85&&b.zmax<4.30,
     'roof crosses house allotment boundary '+v.profile.label);
   assert.ok(b.ymin>-.4&&b.ymax<6.8);
   const c=Math.cos(v.site.angle),s=Math.sin(v.site.angle);
   for(const [x,z] of [[-3.5,-4.81],[0,-4.81],[3.5,-4.81],
     [-3.39,-4.12],[3.39,-4.12],[0,-4.56]]){
     const X=v.site.x+x*c-z*s,Z=v.site.z+x*s+z*c;
     const d=Math.min(...w.paths.map(p=>
       w.distanceFromPath(X,Z,p)));
     assert.ok(d>1.75,v.profile.label+' 3D facade hits road at '+[x,z,d]);
     assert.equal(onMainStreet(X,Z),false);
   }
 }
});

test('left photo houses #39→47 and 7-gyeong branch do not move when all nine right houses are designed',()=>{
 const w=world(),left=w.houseSites.filter(h=>h.referenceAsset);
 assert.deepEqual(left.map(h=>h.index),[8,10,12,14,16]);
 assert.deepEqual(left.map(h=>h.side),[-1,-1,-1,-1,-1]);
 assert.equal(w.fortySevenVolumes.length,2);
 assert.ok(w.fortySevenReturnWall.length>2.5);
 assert.equal(w.fiveGyeongThird.site.index,12);
 assert.equal(w.seventhLoopWalls.join.lowerZ,SEVENTH_JOIN.lowerZ);
 assert.deepEqual(w.paths[0].points,MAIN_STREET_ROUTE.points);
 assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
 assert.ok(w.continuousFrontages.coverageAudit.largeGaps.length===0);
 assert.equal(w.frontage.count,3,'old café slot must not create an extra overlapping plaster connector');
 assert.equal(w.houseSites.filter(h=>h.infill).length,1);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.equal(w.nightFixtures.fixtures.length,23);
 for(const lane of w.paths)for(const [x,z] of lane.samples)
   assert.equal(onMainStreet(x,z),true);
 const scenic=scenicHouseSites(w.paths[0].samples);
 for(const p of scenic){
   const a=w.houseSites.find(h=>h.index===p.index);
   assert.ok(Math.hypot(a.x-p.x,a.z-p.z)<1e-9,'scenic photo house was relocated');
 }
});

test('real game opens three east-side review viewpoints with user-facing labels and normal default spawn retained',()=>{
 const s=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const worldSrc=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.match(s,/get\('view'\)==='hanokright'/);
 assert.match(s,/get\('view'\)==='hanokrightmiddle'/);
 assert.match(s,/get\('view'\)==='hanokrightupper'/);
 assert.match(s,/state\.x=-1\.0;state\.z=52;state\.yaw=0/);
 assert.match(s,/state\.x=-1\.88;state\.z=6\.8;state\.yaw=0/);
 assert.match(s,/const state=\{x:-3,z:-42,yaw:Math\.PI/);
 assert.match(s,/rightPhotoHouses:rightPhotoHouses\.map/);
 assert.match(worldSrc,/buildRightHanokPhoto\(/);
 assert.match(worldSrc,/frontageSkip:!!rightPhoto&&site\.type===0/);
 assert.match(s,/multiplayer\.start\(\)/);
});
test('nine custom east-side hanoks actually REDUCE world vertex cost, preserving mobile static draw call and night shader',()=>{
 const w=world(),g=w.mesh.geometry;
 assert.ok(w.vertexCount>700000&&w.vertexCount<850000,
    'nine 3D houses exceed 850k mobile scene budget '+w.vertexCount);
 assert.equal(g.getAttribute('position').count,g.getAttribute('materialId').count);
 assert.equal(g.getAttribute('position').count,g.getAttribute('nightEmission').count);
 assert.ok(g.getAttribute('position').array.every(Number.isFinite));
 assert.equal(w.houseSites.length,20);
 assert.equal(w.rightPhotoHouses.length,9);
 console.info('Nine east photo-hanoks, five west originals: vertexCount',w.vertexCount);
});
