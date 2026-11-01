import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PublicWalkRoom} from '../src/server/worker.js';
import {createWalkMultiplayer} from '../src/multiplayer/WalkMultiplayer.js';

function fakeSocket(){
  return {
    attachment:{id:'friend-1',pose:{x:-3,z:-42,vx:0,vz:0},lastAt:0,receivedPose:false},
    messages:[],closed:0,
    serializeAttachment(next){this.attachment=structuredClone(next);},
    deserializeAttachment(){return this.attachment;},
    send(data){this.messages.push(JSON.parse(data));},
    close(){this.closed++;}
  };
}

test('server heartbeat responds privately, rate-limits pings and ignores chat',async()=>{
  const first=fakeSocket(),other=fakeSocket();
  const room=new PublicWalkRoom({getWebSockets:()=>[first,other]}, {});
  await room.webSocketMessage(first,JSON.stringify({type:'ping'}));
  assert.equal(first.messages.at(-1)?.type,'pong');
  assert.equal(other.messages.length,0);
  await room.webSocketMessage(first,JSON.stringify({type:'ping'}));
  assert.equal(first.messages.length,1,'repeated heartbeat is rate limited');
  await room.webSocketMessage(first,JSON.stringify({type:'chat',message:'no'}));
  assert.equal(other.messages.length,0);
  const now=Date.now();
  first.serializeAttachment({...first.deserializeAttachment(),lastAt:now-150,lastHeartbeatAt:now});
  await room.webSocketMessage(first,JSON.stringify({
    type:'pose',x:-3,z:-41.9,vx:0,vz:1.85
  }));
  assert.equal(other.messages.at(-1)?.type,'pose');
  assert.equal(other.messages.at(-1)?.z,-41.9);
  assert.equal(other.messages.at(-1)?.id,'friend-1');
});

test('departure broadcasts once, releases presence, and closes errored sockets',async()=>{
  const first=fakeSocket(),other=fakeSocket();
  other.attachment.id='friend-2';
  const room=new PublicWalkRoom({getWebSockets:()=>[first,other]}, {});
  await room.webSocketError(first);
  assert.equal(first.closed,1);
  assert.equal(other.messages.filter(m=>m.type==='leave').length,1);
  assert.equal(other.messages.at(-1)?.count,1);
  await room.webSocketClose(first);
  assert.equal(other.messages.filter(m=>m.type==='leave').length,1,
    'socket close following error cannot double-broadcast departures');
});

test('client watchdog detects sleeping/mobile stale sockets and remains private on full room',()=>{
  const globals=['WebSocket','location','performance','setInterval','clearInterval','setTimeout','clearTimeout','document','window'];
  const originals=Object.fromEntries(globals.map(key=>[key,globalThis[key]]));
  let clock=0,interval=null,retryCallback=null;
  const statuses=[],sockets=[];
  const listeners=new Map();
  class FakeWS {
    static CONNECTING=0;static OPEN=1;static CLOSED=3;
    constructor(url){this.url=url;this.readyState=0;this.sent=[];sockets.push(this);}
    open(){this.readyState=1;this.onopen?.();}
    message(value){this.onmessage?.({data:JSON.stringify(value)});}
    send(value){this.sent.push(JSON.parse(value));}
    close(){this.readyState=3;this.onclose?.();}
  }
  const token='daac8db0-a503-4420-baf5-3c0c8af93194';
  Object.assign(globalThis,{
    WebSocket:FakeWS,
    location:{protocol:'https:',host:'walking.example'},
    performance:{now:()=>clock},
    setInterval:callback=>{interval=callback;return 1;},
    clearInterval:()=>{interval=null;},
    setTimeout:callback=>{retryCallback=callback;return 2;},
    clearTimeout:()=>{retryCallback=null;},
    document:{
      hidden:false,
      addEventListener:(event,cb)=>listeners.set('document-'+event,cb),
      removeEventListener:event=>listeners.delete('document-'+event)
    },
    window:{
      addEventListener:(event,cb)=>listeners.set('window-'+event,cb),
      removeEventListener:event=>listeners.delete('window-'+event)
    }
  });
  try{
    const player=createWalkMultiplayer({scene:{},hill:()=>0,camera:{},
      onStatus:message=>statuses.push(message),initialRoomToken:token});
    player.start();
    assert.equal(sockets.length,1);
    const ws=sockets[0];ws.open();
    ws.message({type:'welcome',id:'me',mode:'private',room:null,players:[]});
    assert.equal(player.getStatus().connected,true);
    clock=16000;interval();
    assert.equal(ws.sent.at(-1)?.type,'ping');
    ws.message({type:'pong'});
    globalThis.document.hidden=true;clock=80000;interval();
    assert.equal(ws.readyState,1,'background tab does not falsely drop connection');
    globalThis.document.hidden=false;
    listeners.get('document-visibilitychange')();
    assert.equal(ws.readyState,3,'stale socket is dropped on mobile resume');
    assert.equal(player.getStatus().connected,false);
    assert.ok(retryCallback);
    retryCallback();retryCallback=null;
    assert.equal(sockets.length,2);
    const next=sockets[1];next.open();
    next.message({type:'room_full',capacity:8});
    assert.equal(player.getStatus().full,true);
    assert.equal(player.getStatus().mode,'private');
    assert.ok(statuses.some(s=>s.includes('정원이 가득 찼어요')));
    assert.ok(retryCallback);
    player.switchRoom(null);
    assert.equal(sockets.length,3);
    assert.equal(sockets[2].url,'wss://walking.example/api/walk/join');
    assert.equal(player.getStatus().full,false);
    player.stop();
    assert.equal(interval,null,'watchdog cleared');
    assert.equal(listeners.size,0,'lifecycle listeners cleared');
  }finally{
    for(const key of globals){
      if(originals[key]===undefined)delete globalThis[key];
      else globalThis[key]=originals[key];
    }
  }
});

test('mobile navigation frees sockets and bfcache restore resumes strolling',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  assert.match(main,/addEventListener\('pagehide',\(\)=>multiplayer\.stop\(\)\)/);
  assert.match(main,/event\.persisted&&state\.started\)multiplayer\.start\(\)/);
  assert.match(main,/pointercancel',resetPad/);
  assert.match(main,/keys\.clear\(\);touchInput\.x=touchInput\.y=0/);
  assert.match(css,/body\.playing \.walker-card \{ bottom:calc\(290px/);
  assert.match(css,/\.touch-pad \{ bottom:calc\(157px/);
  assert.match(css,/max-height:590px/);
});

test('remote walkers share atlas decode instead of fetching a new atlas per player',()=>{
  const sprite=readFileSync(new URL('../src/characters/GirlSprite.js',import.meta.url),'utf8');
  const client=readFileSync(new URL('../src/multiplayer/WalkMultiplayer.js',import.meta.url),'utf8');
  assert.match(sprite,/let atlasPromise=null/);
  assert.match(sprite,/function loadSpriteAtlases\(\)/);
  assert.match(sprite,/atlasPromise=Promise\.all/);
  assert.match(client,/peer\.girl\.dispose\?\.\(\)/);
  assert.match(client,/vx:moving\?peer\.vx:0/);
  assert.match(client,/STALE_CONNECTION_MS=45000/);
  assert.match(client,/CONNECT_TIMEOUT_MS=14000/);
  assert.doesNotMatch(client,/type:'chat'|type:'message'|type:'voice'/);
});
