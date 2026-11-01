import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {MAIN_STREET_ROUTE} from '../src/world/BukchonMainStreet.js';
import {mainLaneTerrainHeight} from '../src/world/BukchonStreetLayout.js';
import {
 SEVENTH_LOOP_ROUTE,SEVENTH_LOOP_SAMPLES,SEVENTH_JOIN,
 sampleSeventhLoop,onSeventhLoop
} from '../src/world/BukchonSeventhLoop.js';
import {onMainStreet,sanitizePose} from '../src/multiplayer/protocol.js';

function world(){
 const prior=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=prior;}
}
test('both 7-gyeong junctions join the intact 5/6 main road',()=>{
 const w=world(),main=w.paths[0],loop=w.paths[1];
 assert.equal(w.paths.length,2);
 assert.deepEqual(main.points,MAIN_STREET_ROUTE.points);
 assert.deepEqual(loop.points,SEVENTH_LOOP_ROUTE.points);
 assert.deepEqual(loop.samples,SEVENTH_LOOP_SAMPLES);
 assert.deepEqual(loop.samples,sampleSeventhLoop());
 assert.equal(loop.kind,'seventh-loop');
 assert.equal(loop.width,2.56);
 assert.equal(loop.points[0][1],SEVENTH_JOIN.lowerZ);
 assert.equal(loop.points.at(-1)[1],SEVENTH_JOIN.upperZ);
 for(const p of [loop.samples[0],loop.samples.at(-1)])
   assert.ok(w.distanceFromPath(p[0],p[1],main)<.13,
     'junction detached from original main street: '+p.join(','));
 let traveled=0;
 for(let i=1;i<loop.samples.length;i++){
   const [x,z]=loop.samples[i],a=loop.samples[i-1];
   const step=Math.hypot(x-a[0],z-a[1]);traveled+=step;
   assert.ok(step>.001&&step<.77,'broken road mesh station '+i);
   const slope=Math.abs(mainLaneTerrainHeight(x,z)-
     mainLaneTerrainHeight(a[0],a[1]))/step;
   assert.ok(slope<.22,'steep transition at '+i);
 }
 assert.ok(traveled>72&&traveled<110);
 assert.ok(w.paving.tiles>500);
 assert.ok(w.seventhLoopWalls?.segments>140);
 console.log('loop distance',traveled.toFixed(2),
   'vertices',w.vertexCount,'paving',w.paving.tiles,
   'original walls',w.continuousFrontages.wallSegments);
});

test('client collision and server protocol share the 7-gyeong road',()=>{
 const w=world(),loop=w.paths[1];
 for(const [x,z] of loop.samples){
   assert.ok(w.distanceFromPath(x,z,loop)<1e-6);
   assert.ok(onSeventhLoop(x,z));
   assert.ok(onMainStreet(x,z),'server rejected reachable alley station');
   assert.ok(sanitizePose({type:'pose',x,z,vx:.8,vz:0}));
 }
 for(const [x,z] of [[-24,-8],[-34,-20],[40,20]])
   assert.equal(onMainStreet(x,z),false,'unrelated land became walkable');
});

test('the new paved alley does not intersect an existing 7.35x8.55m hanok platform',()=>{
 const w=world();let nearest={clearance:Infinity};
 for(const h of w.houseSites){
   const cos=Math.cos(h.angle),sin=Math.sin(h.angle);
   for(const [x,z] of w.paths[1].samples){
     const dx=x-h.x,dz=z-h.z;
     const localX=dx*cos+dz*sin,localZ=-dx*sin+dz*cos;
     const cx=Math.max(0,Math.abs(localX)-3.675);
     const cz=Math.max(0,Math.abs(localZ)-4.275);
     const clearance=Math.hypot(cx,cz)-w.paths[1].width*.5;
     if(clearance<nearest.clearance)nearest={clearance,house:h.index,x,z,hx:h.x,hz:h.z};
   }
 }
 console.log('nearest old house to loop:',JSON.stringify(nearest));
 assert.ok(nearest.clearance>.12,'hanok intersects new road: '+JSON.stringify(nearest));
});

test('7-gyeong branch opens west frontage, remaining main street stays enclosed',()=>{
 const w=world(),f=w.continuousFrontages,o=SEVENTH_JOIN;
 assert.equal(f.openings.length,1);
 assert.equal(f.openings[0].lowerZ,o.lowerZ);
 assert.equal(f.coverageAudit.largeGaps.length,0);
 for(const run of f.runs.filter(r=>r.side===o.side)){
   const overlap=Math.min(run.toZ,o.lowerZ+o.halfWidth)-
     Math.max(run.fromZ,o.lowerZ-o.halfWidth);
   assert.ok(overlap<=1e-4,'old wall blocks loop entrance');
 }
 assert.ok(w.seventhLoopWalls.length>72);
 assert.equal(w.paving.endCaps,2,'main end caps must survive');
 assert.ok(w.vertexCount<850000,'single geometry mesh budget');
 assert.ok(w.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
});

test('minimap, touch controls and multiplayer remain attached to the same two paths',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const source=readFileSync(new URL('../src/world/BukchonWorld.js',import.meta.url),'utf8');
 assert.match(main,/for\(const route of paths\)/);
 assert.match(main,/return paths\.some\(p=>distanceFromPath\(x,z,p\)/);
 assert.match(main,/cameraRelativeDirection/);
 assert.match(main,/multiplayer\.update\(motion\)/);
 assert.match(source,/buildSeventhLoopWalls\(/);
 assert.doesNotMatch(source,/housesAlong\(paths\[1\]/);
});
