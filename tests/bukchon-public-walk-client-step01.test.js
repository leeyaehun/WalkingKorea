import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPublicWalkClient} from '../src/multiplayer/PublicWalkClient.js';

class FakeWebSocket {
  static instances=[];
  constructor(url){this.url=url;this.readyState=1;this.sent=[];FakeWebSocket.instances.push(this);}
  send(data){this.sent.push(JSON.parse(data));}
  close(){this.readyState=3;this.onclose?.();}
  receive(data){this.onmessage?.({data:JSON.stringify(data)});}
}
test('joins after Start, sends movement only, handles join and leave',()=>{
  FakeWebSocket.instances=[];
  const events=[],statuses=[];
  const client=createPublicWalkClient({
    WebSocketCtor:FakeWebSocket,
    locationRef:{protocol:'https:',host:'walking.example'},
    onWelcome:p=>events.push(['welcome',p.length]),
    onJoin:p=>events.push(['join',p.id]),
    onMove:p=>events.push(['move',p.id]),
    onLeave:id=>events.push(['leave',id]),
    onStatus:s=>statuses.push(s)
  });
  assert.equal(FakeWebSocket.instances.length,0);
  client.start();
  const socket=FakeWebSocket.instances[0];
  assert.equal(socket.url,'wss://walking.example/api/walk');
  socket.receive({t:'welcome',protocol:1,id:'mine',room:1,max:8,
    players:[{id:'guest',x:-3,z:-42,vx:0,vz:0}]});
  assert.equal(statuses.at(-1).count,2);
  client.tick(0,{started:true,x:-3,z:-42,vx:0,vz:0});
  client.tick(120,{started:true,x:-3,z:-42,vx:0,vz:0});
  client.tick(160,{started:true,x:-3,z:-41.7,vx:0,vz:2});
  assert.equal(socket.sent.length,2);
  assert.ok(socket.sent.every(m=>m.t==='p'&&!('text' in m)));
  socket.receive({t:'join',player:{id:'second',x:-3,z:-42,vx:0,vz:0}});
  socket.receive({t:'p',id:'guest',x:-3,z:-41.8,vx:0,vz:2});
  socket.receive({t:'leave',id:'second'});
  assert.deepEqual(events.slice(-3),[['join','second'],['move','guest'],['leave','second']]);
  client.stop();
  assert.equal(statuses.at(-1).connected,false);
  assert.equal(statuses.at(-1).count,1);
});
test('retains original local walker movement and third-person control',()=>{
  const src=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(src,/publicWalk\.start\(\)/);
  assert.match(src,/publicWalk\.tick\(time/);
  assert.match(src,/remoteWalkers\.update\(dt/);
  assert.match(src,/girl\.update\(\{\.\.\.motion,visible:state\.started\}\)/);
  assert.match(src,/cameraRelativeDirection/);
  assert.match(html,/id="room-status"/);
  const remote=readFileSync(new URL('../src/multiplayer/RemoteWalkers.js',import.meta.url),'utf8');
  assert.match(remote,/createGirlSpriteCompanion\(scene,hill,camera\)/);
});
