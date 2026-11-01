import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mainLaneWidth,mainLaneTerrainHeight,smoothMainLane,scenicHillLift,
  sampleMainLaneAtZ,scenicHouseSites
} from '../src/world/BukchonStreetLayout.js';
import {
  MAIN_STREET_ROUTE,MAIN_STREET_DISCOVERIES
} from '../src/world/BukchonMainStreet.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

function makeWorld(){
  const old=globalThis.document;
  globalThis.document={createElement:()=>({width:2048,height:2048,
    getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
  try{return createBukchonWorld();}
  finally{globalThis.document=old;}
}
const near=(a,b,eps=.01)=>assert.ok(Math.abs(a-b)<eps,`${a} not near ${b}`);

test('photo-guided alley is a single long gentle axis, not the old zigzag',()=>{
  const anchors=MAIN_STREET_ROUTE.points;
  assert.equal(anchors.length,11);
  assert.deepEqual(anchors[0],[-1,55]);
  assert.deepEqual(anchors.at(-1),[-3,-44]);
  for(let i=1;i<anchors.length;i++){
    assert.ok(anchors[i][1]<anchors[i-1][1],'never double back in longitudinal direction');
    assert.ok(Math.abs(anchors[i][0]-anchors[i-1][0])<.6,'avoid old sharp bend');
  }
  const samples=smoothMainLane(anchors);
  assert.ok(samples.length>=85&&samples.length<120);
  near(samples[0][0],anchors[0][0],1e-8);
  near(samples.at(-1)[0],anchors.at(-1)[0],1e-8);
  const length=samples.reduce((d,p,i)=>
    i?d+Math.hypot(p[0]-samples[i-1][0],p[1]-samples[i-1][1]):0,0);
  assert.ok(length>99&&length<100);
  for(let i=1;i<samples.length;i++){
    const [x,z]=samples[i],[px,pz]=samples[i-1];
    const run=pz-z;
    assert.ok(run>0&&run<=1.2,'longitudinal paving has a gap');
    assert.ok(Math.abs(x-px)<.085,'centerline should curve gently');
    if(i>1){
      const a=samples[i-2],d0=(px-a[0])/(pz-a[1]),d1=(x-px)/(z-pz);
      assert.ok(Math.abs(d0-d1)<.03,'C1 road curvature discontinuity');
    }
  }
  assert.throws(()=>smoothMainLane([[0,1],[1,2]]),/descending/);
});

test('street width has a smooth human-scale narrow section, shared by collision and paving',()=>{
  near(mainLaneWidth(-44),3.24);
  assert.ok(mainLaneWidth(-24)>3.02&&mainLaneWidth(-24)<3.06);
  assert.ok(mainLaneWidth(55)>3.31&&mainLaneWidth(55)<3.33);
  for(let z=-44;z<=55;z+=.2){
    const w=mainLaneWidth(z);
    assert.ok(w>3.02&&w<3.34,`abnormal width at z=${z}`);
    assert.ok(Math.abs(w-mainLaneWidth(z+.02))<.005,'no curb width jump');
  }
  const w=makeWorld();
  assert.equal(w.paths.length,1);
  for(let z=-43;z<=54;z+=3){
    const sample=sampleMainLaneAtZ(w.paths[0].samples,z);
    assert.ok(sample,'missing road at '+z);
    near(w.paths[0].widthAt(z),mainLaneWidth(z),1e-8);
    assert.ok(w.distanceFromPath(sample.x,sample.z,w.paths[0])<.001);
  }
});

test('terrain climbs smoothly northward without road steps or heavy crossfall',()=>{
  const w=makeWorld(),route=w.paths[0].samples;
  assert.equal(scenicHillLift(-44),1.35);
  assert.equal(scenicHillLift(-4),0);
  let uphill=0;
  for(let i=1;i<route.length;i++){
    const [x,z]=route[i],[px,pz]=route[i-1];
    const rise=mainLaneTerrainHeight(x,z)-mainLaneTerrainHeight(px,pz);
    assert.ok(rise>0,'downhill dip in intended climbing direction');
    const grade=rise/Math.hypot(x-px,z-pz);
    assert.ok(grade>.04&&grade<.14,'unstable slope '+grade);
    uphill+=rise;
    const w2=mainLaneWidth(z);
    const crossfall=Math.abs(mainLaneTerrainHeight(x+w2*.5,z)-
      mainLaneTerrainHeight(x-w2*.5,z));
    assert.ok(crossfall<.02,'road has an artificial bump across its width');
  }
  assert.ok(uphill>7.5&&uphill<8.3,'scenic hillside total rise');
  const scenicRise=w.hill(-3,-44)-w.hill(-3,-4);
  assert.ok(scenicRise>3.8&&scenicRise<4.2);
});

test('houses, kerbs and six discoveries follow the newly rebuilt road',()=>{
  const w=makeWorld(),path=w.paths[0];
  assert.ok(w.paving.tiles>150);
  assert.ok(w.paving.drains>0);
  assert.equal(w.houseSites.filter(h=>h.scenic).length,8);
  assert.ok(w.houseSites.every(h=>!h.district||h.routeIndex===0));
  for(const h of scenicHouseSites(path.samples)){
    const gate={x:h.x+Math.sin(h.angle)*4.6,z:h.z-Math.cos(h.angle)*4.6};
    assert.ok(w.distanceFromPath(gate.x,gate.z,path)>=mainLaneWidth(gate.z)*.5-.15,
      'gate covers street at '+h.index);
  }
  for(const marker of MAIN_STREET_DISCOVERIES){
    const margin=path.widthAt(marker.z)*.5-
      w.distanceFromPath(marker.x,marker.z,path);
    assert.ok(margin>.1,'discovery off the new road: '+marker.id);
  }
  assert.ok(w.distanceFromPath(-3,-42,path)<.2,'female spawn moved off the alley');
  assert.equal(w.nightFixtures.stats.hanokSconces,w.houseSites.length);
  assert.equal('planters' in w.streetLife.counts,false);
  assert.ok(w.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
  assert.ok(w.vertexCount<850000);
});
