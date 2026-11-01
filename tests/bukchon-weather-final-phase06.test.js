import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBukchonRenderBudget} from '../src/world/BukchonRenderBudget.js';
import {SKY_DAY_PALETTE,SKY_FOG_DAY,SKY_FOG_NIGHT,skyFragmentShader} from '../src/world/BukchonSky.js';
import {createBukchonWorld} from '../src/world/BukchonWorld.js';

function mockRenderer(){
 return {values:[],setPixelRatio(value){this.values.push(value);}};
}
function frames(budget,{ms=30,number=120,now=0,playing=true,visible=true}={}){
 for(let i=0;i<number;i++){
   now+=ms;
   budget.observe(ms,now,{playing,visible});
 }
 return now;
}
function makeWorld(){
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:2048,height:2048,
   getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{return createBukchonWorld();}
 finally{globalThis.document=previous;}
}

test('pixel ratio reduces only after sustained slow rendering, with a bounded floor',()=>{
 const renderer=mockRenderer();
 const budget=createBukchonRenderBudget({renderer,devicePixelRatio:3,isTouch:true});
 assert.equal(budget.getStatus().ceiling,1.2);
 assert.equal(budget.getStatus().floor,.8);
 assert.deepEqual(renderer.values,[1.2]);
 let time=frames(budget,{ms:29,number:119});
 assert.equal(budget.getStatus().pixelRatio,1.2);
 time=frames(budget,{ms:29,number:1,now:time});
 assert.equal(budget.getStatus().pixelRatio,1.05);
 time=frames(budget,{ms:29,number:240,now:time});
 assert.equal(budget.getStatus().pixelRatio,.8);
 assert.ok(budget.getStatus().changes>=3);
 assert.ok(renderer.values.every(n=>n>=.8&&n<=1.2));
});

test('single dropped frame, background tab and unstarted intro do not reduce image quality',()=>{
 const renderer=mockRenderer();
 const budget=createBukchonRenderBudget({renderer,devicePixelRatio:2,isTouch:false});
 assert.equal(budget.getStatus().ceiling,1.6);
 let time=frames(budget,{ms:35,number:115,playing:false});
 time=frames(budget,{ms:35,number:115,visible:false,now:time});
 budget.observe(1000,time+1000,{playing:true,visible:true});
 const state=budget.getStatus();
 assert.equal(state.pixelRatio,1.6);
 assert.equal(state.changes,0);
 assert.equal(state.sampledFrames,0);
});

test('resolution restores slowly after sustained fast frames without constant toggling',()=>{
 const renderer=mockRenderer();
 const budget=createBukchonRenderBudget({renderer,devicePixelRatio:1.5,isTouch:false});
 let time=frames(budget,{ms:29,number:120});
 assert.equal(budget.getStatus().pixelRatio,1.35);
 time=frames(budget,{ms:16,number:120,now:time});
 assert.equal(budget.getStatus().pixelRatio,1.35);
 // Recovery waits at least 8s since the last quality change (600 x 16ms).
 time=frames(budget,{ms:16,number:480,now:time});
 assert.ok(budget.getStatus().pixelRatio>1.35);
 assert.ok(budget.getStatus().pixelRatio<=1.5);
});

test('day sky avoids night celestial shader computation and preserves its palette',()=>{
 assert.equal(SKY_DAY_PALETTE.horizon,0xd4e9f6);
 assert.equal(SKY_DAY_PALETTE.middle,0x91c9ef);
 assert.equal(SKY_DAY_PALETTE.zenith,0x4e9bdc);
 assert.deepEqual(SKY_FOG_DAY,[.72,.82,.90]);
 assert.deepEqual(SKY_FOG_NIGHT,[.14,.20,.30]);
 assert.match(skyFragmentShader,/if\(uNight<\.01\)\{[\s\S]*?gl_FragColor=vec4\(daylight,1\.0\);[\s\S]*?return;/);
 assert.match(skyFragmentShader,/float distantStars/);
});

test('night shadow sampling is skipped, light falloff avoids per-pixel square roots',()=>{
 const world=makeWorld(),shader=world.material.fragmentShader;
 assert.match(shader,/if\(uNight<0\.5\)occluded=clamp\(1\.0-getShadowMask\(\)/);
 assert.match(shader,/float d2=dot\(offset,offset\)/);
 assert.match(shader,/smoothstep\(0\.0,lamp\.w\*lamp\.w,d2\)/);
 assert.match(shader,/col\+=glow\*uNight/);
 assert.ok(world.vertexCount<850000);
 assert.equal(world.houseSites.length,20);
 assert.equal(world.paths.length,1);
 assert.equal(world.skyline.buildings,39);
 assert.equal(world.nightFixtures.fixtures.length,23);
 assert.equal('planters' in world.streetLife.counts,false);
 assert.equal(world.mesh.geometry.getAttribute('position').count,
   world.mesh.geometry.getAttribute('nightEmission').count);
});

test('postcard export keeps preservation buffer, QA exposes pixel ratio and draw-call count',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/preserveDrawingBuffer:true/);
 assert.match(main,/canvas\.toDataURL\('image\/png'\)/);
 assert.match(main,/createBukchonRenderBudget/);
 assert.match(main,/renderBudget\.observe\(frameMs,time,/);
 assert.match(main,/rendererStats:\{calls:renderer\.info\.render\.calls/);
 assert.match(main,/performance:renderBudget\.getStatus\(\)/);
 assert.match(main,/night:state\.night/);
 assert.match(main,/cameraRelativeDirection/);
});
