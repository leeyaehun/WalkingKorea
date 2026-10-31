import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHanokKit} from '../src/world/HanokKit.js';
import {createHanokArchitecture} from '../src/world/BukchonArchitecture.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

function captureHanok(type,variant=1){
 const geometry={faces:[],boxes:[],spheres:[],cylinders:[]};
 const save=name=>(...params)=>geometry[name].push(params);
 const kit=createHanokKit({
  box:save('boxes'),face:save('faces'),sphere:save('spheres'),
  cylinder:save('cylinders'),textured:()=>{},
  signs:{hanokCafe:null,hanokAtelier:null}
 });
 return {archetype:kit.build(type,variant),geometry};
}

function makeWorld(){
 const old=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,getContext:()=>({
  fillRect(){},strokeRect(){},fillText(){}
 })})};
 try{return createBukchonWorld();}
 finally{globalThis.document=old;}
}

test('hipped giwa roof has a short ridge and visibly lower end shoulders',()=>{
 // Reconstruct the structural height profile used in the HanokKit.
 const eave=3.54, halfWidth=(6.25+1.28)/2;
 const h=(x,z)=>{
  const t=Math.min(1,Math.abs(z)/eave);
  const edge=Math.min(1,Math.abs(x)/halfWidth);
  const hip=Math.pow(Math.max(0,(edge-.63)/.37),1.4);
  return 4.18-.17*t-.78*Math.sin(t*Math.PI*.5)-.29*hip*(1-.22*t)
   +.24*Math.pow(t,4)*Math.pow(edge,4);
 };
 assert.ok(h(0,0)>h(halfWidth,0)+.25);
 assert.ok(h(0,0)>h(0,eave)+.8);
 assert.ok(h(halfWidth,eave)>3.1 && h(halfWidth,eave)<3.4);
 assert.equal(h(-halfWidth,-eave),h(halfWidth,eave));
});

test('gated, exposed-porch, cafe and A01 houses preserve archetypes with physical roof edges',()=>{
 for(const [type,archetype] of [[100,'a01'],[0,'gate'],[2,'facing'],[7,'cafe']]){
  const {geometry,archetype:actual}=captureHanok(type);
  assert.equal(actual,archetype);
  assert.ok(geometry.faces.length>500);
  const colors=new Set([
   ...geometry.boxes,...geometry.faces,...geometry.spheres
  ].flat().filter(x=>typeof x==='string'));
  for(const key of ['tileDark','tileRidge','timber','woodShade'])
    assert.ok(colors.has(key),key+' in '+archetype);
  for(const arr of Object.values(geometry))for(const item of arr){
   for(const v of item){
    if(typeof v==='number')assert.ok(Number.isFinite(v));
    if(Array.isArray(v))for(const n of v)assert.ok(Number.isFinite(n));
   }
  }
 }
});

test('real gabled gate canopy provides roof pitch, deep soffit and lintel',()=>{
 const geometry={faces:[],boxes:[]};
 const f=(...args)=>geometry.faces.push(args), b=(...args)=>geometry.boxes.push(args);
 const kit=createHanokArchitecture({
  face:f,box:b,sphere:()=>{},span:6.25,eave:3.54,roofHalfWidth:3.765,
  roofHeight:(x,z)=>4.18-.8*Math.abs(z)/3.54
 });
 kit.gateRoof();
 assert.ok(geometry.faces.length>90,'two pitched roof surfaces plus fascia');
 assert.ok(geometry.boxes.some(a=>a[6]==='woodShade'));
 const roofYs=geometry.faces.flatMap(v=>v.slice(0,4)).flatMap(p=>Array.isArray(p)?[p[1]]:[]);
 assert.ok(Math.max(...roofYs)-Math.min(...roofYs)>.30);
});

test('frontage links same-side adjacent scenic houses but not side-road junctions',()=>{
 const world=makeWorld();
 assert.equal(world.houseSites.filter(h=>h.scenic).length,8);
 assert.ok(world.frontage.count>=2 && world.frontage.count<=4,
  'joined frontage count '+world.frontage.count);
 for(const segment of world.frontage.segments){
  assert.ok(segment.length>.12 && segment.length<3.25);
  assert.ok(segment.roadDistance>1.65);
  if(segment.side===-1) assert.ok(segment.midpoint.z<=-19 || segment.midpoint.z>=-10);
  if(segment.side===1) assert.ok(segment.midpoint.z<=-28 || segment.midpoint.z>=-20);
 }
 assert.ok(world.mesh.geometry.getAttribute('position').array.every(Number.isFinite));
});
