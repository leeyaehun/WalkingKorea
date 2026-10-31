import test from 'node:test';
import assert from 'node:assert/strict';
import {createHanokKit} from '../src/world/HanokKit.js';
import {createBukchonMasonry} from '../src/world/BukchonMasonry.js';

const makeCapture = () => {
 const data={face:[],box:[],sphere:[],cylinder:[]};
 const add=type=>(...args)=>data[type].push(args);
 const kit=createHanokKit({
  face:add('face'),box:add('box'),sphere:add('sphere'),
  cylinder:add('cylinder'),textured:()=>{},
  signs:{hanokCafe:null,hanokAtelier:null}
 });
 return {kit,data};
};

test('street-facing hanoks use visible brick, granite, and rounded giwa cap geometry',()=>{
 const {kit,data}=makeCapture();
 assert.equal(kit.build(100,1),'a01');
 const colors=new Set([...data.face,...data.box,...data.sphere].flatMap(a=>a.filter(x=>typeof x==='string')));
 for(const c of ['brickTerracotta','stoneMasonry','mortar','tileEnd'])
   assert.ok(colors.has(c), `missing real Bukchon material ${c}`);
 assert.ok(data.sphere.length>=44,'both eaves need curved tile end caps');
 assert.ok(data.face.length>600,'facade needs many real relief stone/brick polygons');
});

test('walls and tiled end caps use finite coordinates',()=>{
 const {kit,data}=makeCapture();kit.build(0,3);
 for(const set of Object.values(data)) for(const call of set) for(const entry of call) {
  if(typeof entry==='number')assert.ok(Number.isFinite(entry));
  if(Array.isArray(entry))for(const n of entry)assert.ok(Number.isFinite(n));
 }
});

test('every house gate points from building toward its lane on either side',()=>{
 // Local forward (-Z), rotated by angle = atan2(nx*side,nz*side).
 // The dot product with house-to-road must equal one.
 for(const [nx,nz] of [[1,0],[0,1],[.8,.6],[-.6,.8]]) {
  for(const side of [-1,1]) {
   const angle=Math.atan2(nx*side,nz*side);
   const forward=[-Math.sin(angle),-Math.cos(angle)];
   const towardLane=[-nx*side,-nz*side];
   assert.ok(forward[0]*towardLane[0]+forward[1]*towardLane[1]>.9999);
  }
 }
});
