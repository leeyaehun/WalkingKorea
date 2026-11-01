import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  MAX_WALKERS_PER_ROOM,MAX_PUBLIC_ROOMS,WALK_SPAWN,WALK_SEND_INTERVAL_MS,
  distanceToMainStreet,isAllowedWalkPosition,validateMovement
} from '../src/multiplayer/Protocol.js';

test('public walk uses exactly eight seats per automatically spawned room',()=>{
  assert.equal(MAX_WALKERS_PER_ROOM,8);
  assert.ok(MAX_PUBLIC_ROOMS>=3);
  assert.ok(WALK_SEND_INTERVAL_MS>=100&&WALK_SEND_INTERVAL_MS<=200);
  assert.ok(isAllowedWalkPosition(WALK_SPAWN.x,WALK_SPAWN.z));
  const worker=readFileSync(new URL('../src/server/worker.js',import.meta.url),'utf8');
  assert.match(worker,/getByName\('bukchon-public-v1-'\+index\)/);
  assert.match(worker,/if\(peers.length>=MAX_WALKERS_PER_ROOM\)/);
  assert.match(worker,/if\(response.status===409\)continue/);
  assert.match(worker,/acceptWebSocket\(server\)/);
  assert.match(worker,/serializeAttachment/);
  assert.doesNotMatch(worker,/chatMessage|broadcastChat|textMessage|privateRoom/i);
});

test('movement is server validated against the same one-lane geometry',()=>{
  assert.ok(distanceToMainStreet(-3,-42)<.01);
  assert.ok(isAllowedWalkPosition(-2.5,0));
  for(const [x,z] of [[50,0],[0,90],[-32,-20],[0,-60]])
    assert.ok(!isAllowedWalkPosition(x,z),'allowed off-route '+x+','+z);
  const previous={...WALK_SPAWN,vx:0,vz:0,at:1000};
  assert.deepEqual(validateMovement({t:'p',x:-3,z:-41.8,vx:0,vz:1.85},
    previous,1125),{x:-3,z:-41.8,vx:0,vz:1.85,at:1125});
  assert.equal(validateMovement({t:'chat',text:'no'},previous,1125),null);
  assert.equal(validateMovement({t:'p',x:0,z:55,vx:0,vz:1},previous,1125),null);
  assert.equal(validateMovement({t:'p',x:1e9,z:0,vx:0,vz:1},previous,1125),null);
  assert.equal(validateMovement({t:'p',x:NaN,z:-41,vx:0,vz:1},previous,1125),null);
  assert.equal(validateMovement({t:'p',x:-3,z:-41.9,vx:0,vz:1},previous,1001),null);
  assert.equal(validateMovement({t:'p',x:-3,z:-41.9,vx:20,vz:1},previous,1125),null);
});

test('asset worker provides WebSocket route and keeps existing static app',()=>{
  const wrangler=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.equal(wrangler.main,'src/server/worker.js');
  assert.equal(wrangler.assets.not_found_handling,'single-page-application');
  assert.deepEqual(wrangler.assets.run_worker_first,['/api/*']);
  assert.equal(wrangler.assets.binding,'ASSETS');
  assert.equal(wrangler.durable_objects.bindings[0].name,'WALK_ROOMS');
  assert.equal(wrangler.migrations[0].new_sqlite_classes[0],'PublicWalkRoom');
  const worker=readFileSync(new URL('../src/server/worker.js',import.meta.url),'utf8');
  assert.match(worker,/return env\.ASSETS\.fetch\(request\)/);
  assert.match(worker,/origin!==url\.origin/);
});
