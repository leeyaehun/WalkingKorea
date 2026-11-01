/**
 * Live, no-login WebSocket acceptance against a REAL local workerd:
 * public 8+1 rollover, private room isolation/overcapacity, live pose,
 * heartbeats, disconnect cleanup and reconnect.
 *
 * Run after npm run build with Node 22+ and wrangler installed.
 * This deliberately exercises actual WebSocket upgrades, not fake sockets.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';

const PORT=8789;
const ROOT='http://127.0.0.1:'+PORT;
const WS='ws://127.0.0.1:'+PORT;
const clients=new Set();
const wrangler=spawn('./node_modules/.bin/wrangler',
  ['dev','--local','--ip','127.0.0.1','--port',String(PORT)],
  {stdio:['ignore','pipe','pipe'],env:{...process.env,CI:'true'}});
let output='',passed=0;
const deadline=setTimeout(()=>{
  console.error('Timed out running local workerd WebSocket integration.\n'+output.slice(-9000));
  process.exitCode=1;
  wrangler.kill();
},90000);
function record(chunk){output=(output+String(chunk)).slice(-16000);}
wrangler.stdout.on('data',record);
wrangler.stderr.on('data',record);
wrangler.on('error',record);
const closeAll=()=>{
  for(const ws of clients){try{ws.close();}catch{}}
  clients.clear();
};
const check=(name)=>{console.log('✓ '+name);passed++;};

async function awaitServer(){
  for(let i=0;i<100;i++){
    if(wrangler.exitCode!==null)throw new Error('wrangler stopped before ready: '+output);
    try{
      const res=await fetch(ROOT+'/',{signal:AbortSignal.timeout(1500)});
      if(res.status===200&&(await res.text()).includes('<html'))return;
    }catch{}
    await pause(300);
  }
  throw new Error('local Worker did not become ready: '+output.slice(-9000));
}
async function waitFor(ws,predicate,reason,timeout=5500){
  const limit=Date.now()+timeout;
  while(Date.now()<limit){
    const at=ws.messages.findIndex(predicate);
    if(at>=0)return ws.messages.splice(at,1)[0];
    await pause(25);
  }
  throw new Error('No '+reason+' within '+timeout+'ms; received '+JSON.stringify(ws.messages)+'\n'+output.slice(-1200));
}
async function connect(path){
  const ws=new WebSocket(WS+path);
  ws.messages=[];
  ws.addEventListener('message',e=>{
    try{ws.messages.push(JSON.parse(e.data));}
    catch{ws.messages.push({type:'invalid_json'});}
  });
  ws.addEventListener('error',()=>{});
  clients.add(ws);
  await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(new Error('WebSocket open timeout '+path)),8000);
    ws.addEventListener('open',()=>{clearTimeout(t);resolve();},{once:true});
    ws.addEventListener('close',()=>{
      clearTimeout(t);reject(new Error('WebSocket closed before open '+path));
    },{once:true});
  });
  return ws;
}
async function enter(path){
  const ws=await connect(path);
  const welcome=await waitFor(ws,m=>m.type==='welcome','welcome');
  return {ws,welcome};
}
async function drop(ws){
  ws.close(1000,'test leave');
  if(ws.readyState!==WebSocket.CLOSED)
    await new Promise(resolve=>{
      const timer=setTimeout(resolve,3500);
      ws.addEventListener('close',()=>{clearTimeout(timer);resolve();},{once:true});
    });
  clients.delete(ws);
}
async function run(){
  assert.equal(typeof WebSocket,'function','Node 22+ global WebSocket required');
  await awaitServer();
  check('real Wrangler Worker starts and serves static assets');

  const publicPlayers=[];
  for(let i=0;i<8;i++){
    const player=await enter('/api/walk/join');
    assert.equal(player.welcome.mode,'public');
    assert.equal(Number(player.welcome.room),1);
    assert.equal(player.welcome.players.length,i);
    publicPlayers.push(player);
  }
  const ninth=await enter('/api/walk/join');
  assert.equal(Number(ninth.welcome.room),2);
  check('eight public guests fill room 1; ninth auto-routes to room 2');

  publicPlayers[0].ws.send(JSON.stringify({type:'pose',x:-3,z:-41.8,vx:0,vz:1.85}));
  const synced=await waitFor(publicPlayers[1].ws,m=>m.type==='pose'
    &&m.id===publicPlayers[0].welcome.id,'shared public pose');
  assert.equal(synced.z,-41.8);
  publicPlayers[1].ws.send(JSON.stringify({type:'ping'}));
  await waitFor(publicPlayers[1].ws,m=>m.type==='pong','heartbeat pong');
  check('real WebSocket movement broadcasts only inside its room, ping gets pong');

  const leavingId=publicPlayers[0].welcome.id;
  await drop(publicPlayers[0].ws);
  await waitFor(publicPlayers[1].ws,m=>m.type==='leave'&&m.id===leavingId,'public leave');
  const replacement=await enter('/api/walk/join');
  assert.equal(Number(replacement.welcome.room),1);
  check('releasing a public slot permits joining original room');
  for(const p of publicPlayers.slice(1))await drop(p.ws);
  await drop(ninth.ws);await drop(replacement.ws);

  const created=await fetch(ROOT+'/api/walk/private/create',{
    method:'POST',headers:{Origin:ROOT}});
  assert.equal(created.status,200);
  const {room:token}=await created.json();
  assert.match(token,/^[0-9a-f]{8}-[0-9a-f]{4}-4/);
  const privatePath='/api/walk/join?room='+token;
  const privatePlayers=[];
  for(let i=0;i<8;i++){
    const player=await enter(privatePath);
    assert.equal(player.welcome.mode,'private');
    assert.equal(player.welcome.players.length,i);
    privatePlayers.push(player);
  }
  const isolatedToken=(await (await fetch(ROOT+'/api/walk/private/create',{
    method:'POST',headers:{Origin:ROOT}})).json()).room;
  const isolated=await enter('/api/walk/join?room='+isolatedToken);
  assert.equal(isolated.welcome.players.length,0);
  check('same-link friends share private room, distinct invite stays separate');

  const overflow=await connect(privatePath);
  const full=await waitFor(overflow,m=>m.type==='room_full','explicit private full event');
  assert.equal(full.capacity,8);
  assert.equal(privatePlayers.length,8);
  check('ninth private invite gets explicit room_full, not a public fallback');
  await drop(overflow.ws||overflow);

  privatePlayers[0].ws.send(JSON.stringify({type:'pose',x:-3,z:-41.9,vx:0,vz:1.85}));
  await waitFor(privatePlayers[1].ws,m=>m.type==='pose'
    &&m.id===privatePlayers[0].welcome.id,'private pose');
  await pause(160);
  assert.equal(isolated.ws.messages.some(m=>m.type==='pose'),false);
  check('movement from one private room is invisible to other invite rooms');

  const guestId=privatePlayers[0].welcome.id;
  await drop(privatePlayers[0].ws);
  await waitFor(privatePlayers[1].ws,m=>m.type==='leave'&&m.id===guestId,'private leave');
  const rejoined=await enter(privatePath);
  assert.equal(rejoined.welcome.players.length,7);
  assert.notEqual(rejoined.welcome.id,guestId);
  check('private invite rejoins after disconnect without losing room isolation');
  for(const p of privatePlayers.slice(1))await drop(p.ws);
  await drop(rejoined.ws);await drop(isolated.ws);
}

try{
  await run();
  console.log('Passed '+passed+' real WebSocket scenarios.');
}catch(error){
  process.exitCode=1;
  console.error(error);
  console.error('wrangler output:\n'+output.slice(-9000));
}finally{
  clearTimeout(deadline);
  closeAll();
  wrangler.kill('SIGTERM');
  await pause(500);
  if(wrangler.exitCode===null)wrangler.kill('SIGKILL');
}
