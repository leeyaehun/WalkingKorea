import test from 'node:test';
import assert from 'node:assert/strict';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';
import {FORTY_SEVEN_RETURN_WALL,buildFortySevenReturnWall}
  from '../src/world/BukchonFortySevenReturnWall.js';
import {SEVENTH_JOIN,SEVENTH_LOOP_ROUTE} from '../src/world/BukchonSeventhLoop.js';

function world(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}
test('the last generic RED stripe immediately before the 7g junction is truly REPLACED',()=>{
 const w=world(),r=w.fortySevenReturnWall,f=w.continuousFrontages;
 assert.ok(r);
 assert.equal(r.id,FORTY_SEVEN_RETURN_WALL.id);
 assert.equal(r.length,FORTY_SEVEN_RETURN_WALL.end-FORTY_SEVEN_RETURN_WALL.begin);
 assert.equal(f.customFrontages.length,2);
 assert.equal(f.customFrontages[1].id,r.id);
 assert.ok(!f.runs.some(v=>v.side===-1&&
   Math.min(v.toZ,FORTY_SEVEN_RETURN_WALL.end)-
    Math.max(v.fromZ,FORTY_SEVEN_RETURN_WALL.begin)>.001),
   'generic white and red-band plaster is still drawn under the real decorated wall');
 assert.equal(f.coverageAudit.largeGaps.length,0);
 assert.equal(w.fortySevenVolumes.length,2);
});
test('patterned return wall has real raised stones, ivory/terracotta relief and pitched giwa caps',()=>{
 const w=world(),s=w.fortySevenReturnWall;
 assert.equal(s.westSide,true);
 assert.equal(s.junctionOpen,true);
 assert.ok(s.segments>=8);
 assert.ok(s.stoneBlocks>=32);
 assert.ok(s.redMeanders>=8);
 assert.ok(s.whiteStrokes>=48);
 assert.ok(s.giwaCaps>=3);
 assert.ok(s.minRoadClearance>.60);
 // The west branch remains explicitly reserved; the new photo wall starts
 // AFTER the existing junction opening, never across it.
 assert.ok(FORTY_SEVEN_RETURN_WALL.begin>=SEVENTH_JOIN.lowerZ+SEVENTH_JOIN.halfWidth);
 assert.ok(FORTY_SEVEN_RETURN_WALL.end<w.fortySevenVolumes[1].site.laneZ);
 assert.equal(w.seventhLoopWalls.join.lowerZ,SEVENTH_JOIN.lowerZ);
 assert.deepEqual(w.paths[1].points,SEVENTH_LOOP_ROUTE.points);
});
test('47 side turn remains a real street and the more detailed single mesh stays within mobile budget',()=>{
 const w=world(),g=w.mesh.geometry;
 assert.equal(w.houseSites.length,20);
 assert.equal(w.seventhBuildings.buildings.length,6);
 assert.ok(w.vertexCount<850000,'added wall exhausts mobile vertex budget '+w.vertexCount);
 assert.ok(g.getAttribute('position').array.every(Number.isFinite));
 assert.ok(w.fortySevenReturnWall.minRoadClearance>.60);
 for(const path of w.paths)for(const p of path.samples){
   assert.ok(Number.isFinite(p[0])&&Number.isFinite(p[1]));
 }
 console.info('Photo-quality wall replaces old stripe, world vertices',w.vertexCount);
});
