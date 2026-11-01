import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{PublicWalkRoom} from '../src/server/worker.js';
import {PRIVATE_ROOM_PREFIX,validPrivateRoomToken,makePrivateInviteUrl}
  from '../src/multiplayer/PrivateRoomLinks.js';
import {ROOM_CAPACITY} from '../src/multiplayer/protocol.js';

const ORIGIN='https://walking.example';
const token='d96002bc-30f4-4e84-bdf9-3c44116ef2f7';
const otherToken='4073f3cb-cb97-4251-acf5-c9b29b11dbe2';
const request=(path,options={})=>new Request(ORIGIN+path,options);

test('invitation token is an unguessable v4 UUID; copied link carries only room',()=>{
  assert.ok(validPrivateRoomToken(token));
  assert.ok(validPrivateRoomToken(otherToken));
  for(const input of ['',null,'public','a'.repeat(36),
    'd96002bc-30f4-1e84-bdf9-3c44116ef2f7',
    'd96002bc-30f4-4e84-0df9-3c44116ef2f7',
    'd96002bc-30f4-4e84-bdf9-3c44116ef2f7?night=1'])
    assert.equal(validPrivateRoomToken(input),false);
  const url=new URL(makePrivateInviteUrl(
    'https://walking.example/?qa=1&night=1#secret',token));
  assert.equal(url.origin,ORIGIN);
  assert.equal(url.searchParams.get('room'),token);
  assert.equal(url.searchParams.has('qa'),false);
  assert.equal(url.searchParams.has('night'),false);
  assert.equal(url.hash,'');
  assert.throws(()=>makePrivateInviteUrl('https://walking.example','bad'),/Invalid/);
  assert.equal(PRIVATE_ROOM_PREFIX,'bukchon-private-v1-');
  assert.equal(ROOM_CAPACITY,8);
});

test('new private invite is minted only by same-origin POST and is never cached',async()=>{
  const env={ASSETS:{fetch:()=>new Response('assets')}};
  const create=()=>worker.fetch(request('/api/walk/private/create',{
    method:'POST',headers:{Origin:ORIGIN}
  }),env);
  const first=await create(),second=await create();
  assert.equal(first.status,200);
  assert.equal(first.headers.get('Cache-Control'),'no-store');
  assert.equal(first.headers.get('Referrer-Policy'),'no-referrer');
  const a=await first.json(),b=await second.json();
  assert.ok(validPrivateRoomToken(a.room));
  assert.ok(validPrivateRoomToken(b.room));
  assert.notEqual(a.room,b.room);
  assert.equal(a.capacity,8);
  assert.equal((await worker.fetch(request('/api/walk/private/create'),env)).status,405);
  assert.equal((await worker.fetch(request('/api/walk/private/create',{
    method:'POST',headers:{Origin:'https://evil.example'}
  }),env)).status,403);
  assert.equal((await worker.fetch(request('/api/walk/private/create',{
    method:'POST'
  }),env)).status,403);
});

test('private invitations route only to named isolated objects; never to public',async()=>{
  const calls=[];
  const env={
    ASSETS:{fetch:()=>new Response('assets')},
    PUBLIC_WALK_ROOMS:{
      idFromName:name=>name,
      get:id=>({fetch:async r=>{
        calls.push({id,url:r.url});
        return new Response(null,{status:409});
      }})
    }
  };
  const invite=request('/api/walk/join?room='+token,{
    headers:{Upgrade:'websocket',Origin:ORIGIN}});
  const full=await worker.fetch(invite,env);
  assert.equal(full.status,409,'full invite-only room must not roll into public');
  assert.equal(calls.length,1);
  assert.equal(calls[0].id,PRIVATE_ROOM_PREFIX+token);
  const second=await worker.fetch(request('/api/walk/join?room='+otherToken,{
    headers:{Upgrade:'websocket',Origin:ORIGIN}}),env);
  assert.equal(second.status,409);
  assert.equal(calls.length,2);
  assert.equal(calls[1].id,PRIVATE_ROOM_PREFIX+otherToken);
  assert.notEqual(calls[1].id,calls[0].id);
  for(const bad of ['nope','',token+'-bad']){
    const response=await worker.fetch(request('/api/walk/join?room='+bad,{
      headers:{Upgrade:'websocket',Origin:ORIGIN}}),env);
    assert.equal(response.status,400);
    assert.equal(calls.length,2,'never create DO for malformed invite');
  }
  assert.equal((await worker.fetch(request('/api/walk/join?room='+token,{
    headers:{Upgrade:'websocket',Origin:'https://evil.example'}}),env)).status,403);
});

function socket(){
  return {
    messages:[],attachment:null,
    serializeAttachment(v){this.attachment=structuredClone(v);},
    deserializeAttachment(){return this.attachment;},
    send(v){this.messages.push(JSON.parse(v));},
    close(){}
  };
}
test('private room supports two friends, caps at eight, and reopens a freed seat',async()=>{
  const oldPair=globalThis.WebSocketPair,oldResponse=globalThis.Response;
  const members=[];
  globalThis.WebSocketPair=class{
    constructor(){this[0]=socket();this[1]=socket();}
  };
  globalThis.Response=class extends oldResponse{
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
    const upgrade=request('/api/walk/join?room='+token,{
      headers:{Upgrade:'websocket'}});
    for(let i=0;i<8;i++){
      assert.equal(room.fetch(upgrade).status,101);
      const welcome=members.at(-1).messages.find(x=>x.type==='welcome');
      assert.equal(welcome.mode,'private');
      assert.equal(welcome.room,null);
      assert.equal(welcome.players.length,i);
      assert.equal(welcome.capacity,8);
    }
    assert.equal(room.fetch(upgrade).status,409);
    assert.equal(members.length,8);
    const departed=members.shift();
    const id=departed.deserializeAttachment().id;
    await room.webSocketClose(departed);
    assert.equal(members[0].messages.findLast(x=>x.type==='count').count,7);
    assert.ok(members[0].messages.some(x=>x.type==='leave'&&x.id===id));
    assert.equal(room.fetch(upgrade).status,101);
    assert.equal(members.length,8);
  }finally{
    if(oldPair===undefined)delete globalThis.WebSocketPair;
    else globalThis.WebSocketPair=oldPair;
    globalThis.Response=oldResponse;
  }
});

test('invite UI and client do not expose chat, voice or public-room fallback',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const client=readFileSync(new URL('../src/multiplayer/WalkMultiplayer.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const wrangler=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  for(const fragment of ['id="private-create-btn"','id="intro-copy-invite"',
    'id="intro-public-room"','id="room-menu-btn"','id="start-button-label"'])
    assert.ok(html.includes(fragment),fragment);
  assert.match(html,/name="referrer" content="no-referrer"/);
  assert.match(main,/fetch\('\/api\/walk\/private\/create'/);
  assert.match(main,/history\.replaceState/);
  assert.match(main,/inviteToken\?'비공개 산책방 대기':'공개 산책방 대기'/);
  assert.match(main,/multiplayer\.switchRoom\(token\)/);
  assert.match(main,/\$\('start-btn'\)\.disabled=invalidInvite/);
  assert.match(client,/roomToken\?base\+'\?room='/);
  assert.match(client,/function switchRoom\(nextToken=null\)/);
  assert.match(client,/if\(started\)connect\(\)/);
  assert.match(client,/mode:roomToken\?'private':'public'/);
  assert.match(css,/\[hidden\]\{display:none!important\}/);
  assert.doesNotMatch(html,/id="chat"|id="message-box"|id="voice-control"/);
  assert.equal(wrangler.durable_objects.bindings.length,1,
    'reuse existing DO namespace, do not add risky migration');
  assert.equal(wrangler.migrations.length,1);
});
