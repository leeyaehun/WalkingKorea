import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {chooseFacing,createGirlSpriteCompanion} from '../src/characters/GirlSprite.js';
import {cameraRelativeDirection} from '../src/controllers/MovementDirections.js';

const fromRoot=relative=>new URL('../'+relative,import.meta.url);
const source=relative=>readFileSync(fromRoot(relative),'utf8');

test('game initializes only the Seoul female walker and never creates cat avatar',()=>{
  const main=source('src/main.js');
  assert.match(main,/import \{ createGirlSpriteCompanion \} from '.\/characters\/GirlSprite\.js'/);
  assert.match(main,/const girl=createGirlSpriteCompanion\(scene,hill,camera\)/);
  assert.match(main,/girl\.update\(\{\.\.\.motion,visible:state\.started\}\)/);
  assert.match(main,/avatar:girl\.snapshot\(\),selectedAvatar:'girl'/);
  assert.doesNotMatch(main,/createDamiCompanion|DamiCompanion|\bdami\.update\b/);
  assert.doesNotMatch(main,/selectAvatar|switch-avatar|\bstate\.avatar\b|walkingkorea-avatar-v1/);
  assert.doesNotMatch(main,/guide-cat|character\.html|수호냥이|담이/);
});

test('startup, HUD and profile always show woman and link female sprite preview',()=>{
  const html=source('index.html');
  const main=source('src/main.js');
  assert.match(html,/id="intro" class="screen-overlay visible"/);
  assert.match(html,/id="start-btn"/);
  assert.match(html,/src="\/sprites\/girl_portrait\.webp"/);
  assert.match(html,/id="walker-card"/);
  assert.match(html,/href="\/sprite\.html"/);
  assert.match(main,/function showWalker\(/);
  assert.match(main,/function updateWalkerGuide\(/);
  assert.doesNotMatch(html,/data-avatar|character-picker|switch-avatar|guide-cat|담이|수호냥이/);
  assert.doesNotMatch(html,/\/character\.html/);
});

test('cat-only preview, model and portrait files are removed from this build',()=>{
  const conf=source('vite.config.js');
  assert.doesNotMatch(conf,/character:\s*resolve/);
  assert.match(conf,/sprite: resolve\(import\.meta\.dirname, 'sprite\.html'\)/);
  for(const file of [
    'src/characters/DamiCompanion.js',
    'src/characters/dami-viewer.js',
    'character.html',
    'public/guide-cat.svg'
  ])assert.equal(existsSync(fromRoot(file)),false,'old cat asset remains: '+file);
  assert.equal(existsSync(fromRoot('src/characters/GirlSprite.js')),true);
});

test('girl direction, mirroring and existing WASD camera-relative directions remain intact',()=>{
  assert.equal(typeof createGirlSpriteCompanion,'function');
  const camera={position:{x:0,z:9}};
  assert.deepEqual(chooseFacing(Math.PI/2,camera,{x:0,z:0}),
    {direction:2,mirror:false});
  assert.deepEqual(chooseFacing(-Math.PI/2,camera,{x:0,z:0}),
    {direction:2,mirror:true});
  assert.ok(cameraRelativeDirection(0,-1,0).dx<0);
  assert.ok(cameraRelativeDirection(0,1,0).dx>0);
  const main=source('src/main.js');
  assert.match(main,/followCamera\.update/);
  assert.match(main,/function move\(dt\)/);
  assert.match(main,/function savePhoto\(/);
  assert.match(main,/function toggleTime\(/);
});
