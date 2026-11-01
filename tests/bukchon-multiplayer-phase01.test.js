import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOM_CAPACITY,SPAWN,onMainStreet,sanitizePose,plausibleStep}
  from '../src/multiplayer/protocol.js';
import worker,{PublicWalkRoom} from '../src/server/worker.js';

test('pose protocol allows only the original 99m walkable main road',()=>{
  assert.equal(ROOM_CAPACITY,8);
  assert.equal(onMainStreet(SPAWN.x,SPAWN.z),true);
  assert.equal(onMainStreet(-1,55),true);
  assert.equal(onMainStreet(-24,-8),false);
  assert.equal(onMainStreet(40,20),false);
  assert.equal(onMainStreet(Number.NaN,0),false);
  assert.deepEqual(sanitizePose({type:'pose',x:-3,z:-42,vx:0,vz:0}),
    {x:-3,z:-42,vx:0,vz:0});
  for(const bad of [null,{type:'chat',text:'hi'},
    {type:'pose',x:12,z:12,vx:0,vz:0},
    {type:'pose',x:-3,z:-42,vx:100,vz:0},
    {type:'pose',x:-3,z:-42,vx:NaN,vz:0},
    {type:'pose',x:'-3',z:-42,vx:0,vz:0}])
    assert.equal(sanitizePose(bad),null);
  assert.ok(plausibleStep(SPAWN,{x:-3,z:-41.9},110));
  assert.ok(!plausibleStep(SPAWN,{x:-3,z:-25},110));
});

function socket(){
  return {
    messages:[],attachment:null,
    serializeAttachment(value){this.attachment=structuredClone(value);},
    deserializeAttachment(){return this.attachment;},
    send(message){this.messages.push(JSON.parse(message));},
    close(){}
  };
}

test('Durable Object caps room at 8; every player gets identity and presence',async()=>{
  const oldPair=globalThis.WebSocketPair,oldResponse=globalThis.Response;
  const members=[];
  globalThis.WebSocketPair=class {
    constructor(){this[0]=socket();this[1]=socket();}
  };
  globalThis.Response=class extends oldResponse {
    constructor(body,options={}){
      if(options.status===101){
        super(null,{status:200});
        Object.defineProperty(this,'status',{value:101});
        this.webSocket=options.webSocket;
      }else super(body,options);
    }
  };
  try{
    const ctx={getWebSockets:()=>members,
      acceptWebSocket:ws=>members.push(ws)};
    const room=new PublicWalkRoom(ctx,{});
    const request=new Request('https://example.com/api/walk/join?slot=1',
      {headers:{Upgrade:'websocket'}});
    for(let i=0;i<ROOM_CAPACITY;i++){
      const response=room.fetch(request);
      assert.equal(response.status,101);
      assert.equal(members.length,i+1);
      const welcome=members.at(-1).messages.find(m=>m.type==='welcome');
      assert.ok(welcome?.id&&welcome.capacity===8);
      assert.equal(welcome.players.length,i);
    }
    assert.equal(room.fetch(request).status,409);
    assert.equal(members.length,ROOM_CAPACITY);
    const first=members[0],second=members[1];
    const fakeId='spoofed';
    await room.webSocketMessage(first,JSON.stringify({
      type:'pose',id:fakeId,x:-3,z:-41.8,vx:0,vz:1.85
    }));
    const pose=second.messages.findLast(m=>m.type==='pose');
    assert.ok(pose);
    assert.notEqual(pose.id,fakeId);
    assert.equal(pose.z,-41.8);
    const before=second.messages.length;
    await room.webSocketMessage(first,JSON.stringify({type:'chat',message:'no'}));
    await room.webSocketMessage(first,JSON.stringify({
      type:'pose',x:99,z:10,vx:0,vz:0
    }));
    assert.equal(second.messages.length,before,'chat/off-street updates rejected');
    const leavingId=first.deserializeAttachment().id;
    members.splice(0,1);
    await room.webSocketClose(first);
    assert.ok(second.messages.some(m=>m.type==='leave'&&m.id===leavingId));
    assert.equal(room.fetch(request).status,101,'open slot must be reused');
  }finally{
    if(oldPair===undefined)delete globalThis.WebSocketPair;
    else globalThis.WebSocketPair=oldPair;
    globalThis.Response=oldResponse;
  }
});

test('router retries full public rooms without defining private rooms or chat',async()=>{
  const selected=[];
  const env={
    ASSETS:{fetch:()=>new Response('static')},
    PUBLIC_WALK_ROOMS:{
      idFromName:name=>name,
      get:id=>({fetch:async request=>{
        selected.push({id,url:request.url});
        return new Response(null,{status:selected.length===1?409:200});
      }})
    }
  };
  const r=await worker.fetch(new Request('https://example.com/api/walk/join',{
    headers:{Upgrade:'websocket',Origin:'https://example.com'}}),env);
  assert.equal(r.status,200);
  assert.equal(selected.length,2);
  assert.ok(selected[0].id.endsWith('-0'));
  assert.ok(selected[1].id.endsWith('-1'));
  assert.match(selected[1].url,/slot=2/);
  assert.equal((await worker.fetch(
    new Request('https://example.com/api/walk/join'),env)).status,426);
  assert.equal((await worker.fetch(
    new Request('https://example.com/api/walk/join',{
      headers:{Upgrade:'websocket',Origin:'https://attacker.example'}}),env)).status,403);
  assert.equal((await worker.fetch(new Request('https://example.com/'),env)).status,200);
  assert.equal(selected.length,2);
});

test('frontend uses 2.5D female sprite with interpolation and HUD; no messaging UI',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const client=readFileSync(new URL('../src/multiplayer/WalkMultiplayer.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.match(main,/multiplayer\.start\(\)/);
  assert.match(main,/multiplayer\.update\(motion\)/);
  assert.match(main,/girl\.update\(/);
  assert.match(client,/createGirlSpriteCompanion\(scene,hill,camera\)/);
  assert.match(client,/Math\.exp\(-Math\.min\(\.12,dt\)/);
  assert.match(client,/\/api\/walk\/join/);
  assert.match(html,/id="room-status"/);
  assert.doesNotMatch(html,/id="chat|id="message-box|id="voice-control/);
  assert.equal(config.main,'./src/server/worker.js');
  assert.equal(config.assets.binding,'ASSETS');
  assert.ok(config.assets.run_worker_first.includes('/api/*'));
  assert.deepEqual(config.migrations[0].new_sqlite_classes,['PublicWalkRoom']);
  assert.equal(config.durable_objects.bindings[0].name,'PUBLIC_WALK_ROOMS');
});
