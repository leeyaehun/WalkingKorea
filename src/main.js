import * as THREE from 'three';
import { createBukchonWorld } from './world/BukchonWorld.js';
import {nearSeventhPhotoSpot} from './world/BukchonSeventhViewpoint.js';
import { MAIN_STREET_DISCOVERIES, DEFAULT_MAIN_STREET_PITCH } from './world/BukchonMainStreet.js';
import { createGirlSpriteCompanion } from './characters/GirlSprite.js';
import { createWalkMultiplayer } from './multiplayer/WalkMultiplayer.js';
import {validPrivateRoomToken,makePrivateInviteUrl} from './multiplayer/PrivateRoomLinks.js';
import { createThirdPersonCamera } from './controllers/ThirdPersonCamera.js';
import { cameraRelativeDirection } from './controllers/MovementDirections.js';
import { createBukchonLighting } from './world/BukchonLighting.js';
import { createBukchonNightLights } from './world/BukchonNightLighting.js';
import { createBukchonRenderBudget } from './world/BukchonRenderBudget.js';
import { createBukchonSky, SKY_FOG_DAY, SKY_FOG_NIGHT } from './world/BukchonSky.js';

const $ = (id) => document.getElementById(id);
const canvas = $('world');
const touchDevice = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
const TAU = Math.PI*2;
const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
// Preserve drawing buffer so the existing P-key postcard export still works.
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
const renderBudget=createBukchonRenderBudget({
  renderer,devicePixelRatio:window.devicePixelRatio||1,isTouch:touchDevice
});
const clearColor=new THREE.Color();
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(57,1,.1,240);
// Daytime blue sky and separate moonlit navy night atmosphere.
const sky=createBukchonSky(scene);
const {mesh,material,paths,hill,distanceFromPath,houseSites,seventhBuildings,seventhViewpoint,streetLife,nightFixtures,paving,vertexCount} = createBukchonWorld();
scene.add(mesh);
const lighting=createBukchonLighting({
  renderer,scene,worldMesh:mesh,isTouch:touchDevice
});
const nightLights=createBukchonNightLights({
  fixtures:[...nightFixtures.fixtures,...seventhBuildings.lights],
  uniform:material.uniforms.uNightLampPositions
});
// Single playable character — the illustrated female Seoul walker.
const girl=createGirlSpriteCompanion(scene,hill,camera);
// Private invitations are bearer links; invalid links never auto-join public.
const inviteParam=new URLSearchParams(location.search).get('room');
let inviteToken=validPrivateRoomToken(inviteParam)?inviteParam:null;
let invalidInvite=inviteParam!==null&&!inviteToken;
const multiplayer=createWalkMultiplayer({scene,hill,camera,initialRoomToken:inviteToken,onStatus:label=>{
  const el=$('room-status');if(el)el.textContent=label;
}});

// Begin at the upper lookout on the only accessible Bukchon main alley.
// Keep the original third-person camera and camera-relative WASD controls.
const state={x:-3,z:-42,yaw:Math.PI,pitch:(new URLSearchParams(location.search).get('view')==='night-sky'?0.28:(new URLSearchParams(location.search).get('view')==='namsan'?0.01:DEFAULT_MAIN_STREET_PITCH)),vy:0,vx:0,vz:0,night:new URLSearchParams(location.search).get('night')==='1',running:false,started:false,modal:false,helpViewed:false,mute:true,elapsed:0,walked:0,quality:1};
// Opt-in close-up QA link for this one photo-referenced house. Ordinary
// players keep the existing uphill spawn and camera; no hidden teleport.
if(new URLSearchParams(location.search).get('view')==='hanok5'){
  state.x=-1.0;state.z=52;state.yaw=0;state.pitch=-.12;
}
const keys=new Set();let lastFrame=0,lastMap=0,lastToast=0,nearSpot=null,stepPhase=0;
const memoryStore={};
const safeStore={getItem(k){try{return window.localStorage.getItem(k)}catch(e){return memoryStore[k]||null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){memoryStore[k]=v}}};
const discovered=new Set(JSON.parse(safeStore.getItem('seoul-stroll-places-bukchon-mainline-v03')||'[]'));

const locations=MAIN_STREET_DISCOVERIES;
const photoSpot=seventhViewpoint.spot;
const isNearPhotoSpot=()=>nearSeventhPhotoSpot(state.x,state.z,photoSpot);
const toMap=(x,z)=>[clamp(8+(x+36)*2.12,2,168),clamp(5+(48-z)*1.19,2,123)];
function drawMapLanes(){
 const root=$('map-roads'),ns='http://www.w3.org/2000/svg';
 for(const route of paths){
  const pl=document.createElementNS(ns,'polyline');
  pl.setAttribute('points',route.samples.map(p=>toMap(p[0],p[1]).join(',')).join(' '));
  pl.setAttribute('fill','none');
  pl.setAttribute('stroke','#fffaf0');
  pl.setAttribute('stroke-width',String(route.width*2.12));
  pl.setAttribute('stroke-linecap','round');
  pl.setAttribute('stroke-linejoin','round');
  root.appendChild(pl);
 }
 for(const site of houseSites){
  if(!site.decorated)continue;
  const [cx,cy]=toMap(site.x,site.z);
  const marker=document.createElementNS(ns,'circle');
  marker.setAttribute('cx',String(cx));
  marker.setAttribute('cy',String(cy));
  marker.setAttribute('r',site.archetype==='a01'?'3.25':'2.4');
  marker.setAttribute('fill',site.archetype==='a01'?'#b95e4c':'#d98d9b');
  marker.setAttribute('stroke','#fff6e8');
  marker.setAttribute('stroke-width','0.75');
  marker.setAttribute('data-hanok-variant',String(site.detailVariant));
  const tooltip=document.createElementNS(ns,'title');
  tooltip.textContent=site.archetype==='a01'?'한옥 A01':'기와와 목재 디테일이 있는 한옥';
  marker.appendChild(tooltip);
  root.appendChild(marker);
 }
 // Six individual hanoks on the playable 7-gyeong route.
 for(const site of seventhBuildings.buildings){
   const [cx,cy]=toMap(site.x,site.z);
   const marker=document.createElementNS(ns,'circle');
   marker.setAttribute('cx',String(cx));
   marker.setAttribute('cy',String(cy));
   marker.setAttribute('r','2.6');
   marker.setAttribute('fill','#756855');
   marker.setAttribute('stroke','#fff6e8');
   marker.setAttribute('stroke-width','.7');
   const tip=document.createElementNS(ns,'title');
   tip.textContent=site.name;
   marker.appendChild(tip);
   root.appendChild(marker);
 }
 const seventh=paths.find(path=>path.kind==='seventh-loop');
 if(seventh){
  const ns='http://www.w3.org/2000/svg';
  const [x,y]=toMap(-23.4,-28.1);
  const title=document.createElementNS(ns,'text');
  title.setAttribute('x',String(x+7));
  title.setAttribute('y',String(y));
  title.setAttribute('fill','#734d36');
  title.setAttribute('font-size','7.2');
  title.setAttribute('font-weight','700');
  title.setAttribute('pointer-events','none');
  title.textContent='북촌 7경';
  root.appendChild(title);
 }
}
drawMapLanes();
function mapUpdate(){const spot=$('player-spot');const [px,py]=toMap(state.x,state.z);spot.setAttribute('cx',String(clamp(px,3,167)));spot.setAttribute('cy',String(clamp(py,3,122)));$('discovery-count').textContent=`${discovered.size} / ${locations.length}`;
 $('compass-label').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(((state.yaw%TAU+TAU)%TAU)/(TAU/8))%8];$('compass-needle').style.transform=`rotate(${state.yaw}rad)`;}
function pointsMap(){const svg=$('map-pois');const ns='http://www.w3.org/2000/svg';locations.forEach(p=>{let e=document.createElementNS(ns,'circle');e.setAttribute('cx',String(toMap(p.x,p.z)[0]));e.setAttribute('cy',String(toMap(p.x,p.z)[1]));e.setAttribute('r','3.2');e.setAttribute('fill',discovered.has(p.id)?'#dc8b69':'#b9b2a4');e.dataset.id=p.id;svg.appendChild(e);});
 // A distinct camera-shaped pin, independent of the six old discoveries.
 const [cx,cy]=toMap(photoSpot.x,photoSpot.z);
 const pin=document.createElementNS(ns,'circle');
 pin.setAttribute('cx',String(cx));pin.setAttribute('cy',String(cy));
 pin.setAttribute('r','4');pin.setAttribute('fill','#486457');
 pin.setAttribute('stroke','#fff8e8');pin.setAttribute('stroke-width','1.15');
 pin.setAttribute('data-photo-spot',photoSpot.id);
 const tip=document.createElementNS(ns,'title');tip.textContent=photoSpot.name+' · 포토스팟';
 pin.appendChild(tip);svg.appendChild(pin);
 const lens=document.createElementNS(ns,'circle');
 lens.setAttribute('cx',String(cx));lens.setAttribute('cy',String(cy));
 lens.setAttribute('r','1.35');lens.setAttribute('fill','#fff8e8');
 lens.setAttribute('pointer-events','none');svg.appendChild(lens);
}
pointsMap();mapUpdate();
function markFound(p){if(discovered.has(p.id))return;discovered.add(p.id);safeStore.setItem('seoul-stroll-places-bukchon-mainline-v03',JSON.stringify([...discovered]));const marker=$('map-pois').querySelector(`[data-id="${p.id}"]`);if(marker)marker.setAttribute('fill','#dc8b69');mapUpdate();}
function toast(msg,ms=3000){$('toast').textContent=msg;$('toast').classList.add('visible');lastToast=performance.now()+ms;}
function modal(title,body,kicker='SEOUL STROLL'){state.modal=true;$('modal-content').innerHTML=`<span class="modal-kicker">${kicker}</span><h2 id="modal-title">${title}</h2>${body}`;$('modal').classList.add('visible');$('modal').setAttribute('aria-hidden','false');document.exitPointerLock?.();}
function closeModal(){state.modal=false;$('modal').classList.remove('visible');$('modal').setAttribute('aria-hidden','true');}
$('modal-close').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal();});

// Phase 02: the invite link grants access; never list private rooms or chat.
function refreshInviteControls(){
  $('start-button-label').textContent=inviteToken?'비공개 방에서 산책하기':'산책 시작하기';
  $('start-btn').disabled=invalidInvite;
  $('invite-intro-note').hidden=!(inviteToken||invalidInvite);
  $('invite-intro-note').textContent=invalidInvite
    ?'초대 링크 형식이 올바르지 않아요. 공개 방으로 돌아가거나 새 방을 만들어 주세요.'
    :inviteToken?'비공개 초대방이에요. 링크를 받은 친구만 같은 골목에 들어올 수 있어요.':'';
  $('intro-copy-invite').hidden=!inviteToken;
  $('intro-public-room').hidden=!(inviteToken||invalidInvite);
  $('room-menu-btn').title=inviteToken?'비공개 방 초대 및 전환':'친구와 산책방 만들기';
  if(!state.started)$('room-status').textContent=invalidInvite?'잘못된 초대 링크':
    inviteToken?'비공개 산책방 대기':'공개 산책방 대기';
}
function selectRoom(token=null){
  if(token!==null&&!validPrivateRoomToken(token))throw new TypeError('Invalid private room');
  const url=new URL(location.href);
  if(token)url.searchParams.set('room',token);
  else url.searchParams.delete('room');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
  inviteToken=token;invalidInvite=false;
  multiplayer.switchRoom(token);
  refreshInviteControls();
}
async function copyInviteLink(){
  if(!inviteToken)return;
  const link=makePrivateInviteUrl(location.href,inviteToken);
  try{
    await navigator.clipboard.writeText(link);
    toast('초대 링크를 복사했어요. 친구에게 보내 주세요.');
  }catch{
    const input=$('modal-invite-link');
    if(input){input.focus();input.select();}
    else window.prompt('이 링크를 복사해 친구에게 보내세요',link);
    toast('초대 링크를 선택해 복사해 주세요.');
  }
}
function openRoomMenu(){
  modal('함께 산책하는 방',inviteToken
    ?'<p>친구에게 아래 링크를 공유하면 같은 비공개 산책방에서 만날 수 있어요. 최대 8명까지 입장 가능해요.</p><input id="modal-invite-link" class="invite-url" readonly aria-label="친구 초대 링크"><div class="invite-actions"><button id="modal-copy-invite" class="modal-action" type="button">초대 링크 복사</button><button id="modal-public-room" class="room-secondary" type="button">공개 방으로 돌아가기</button></div><p class="small-note">링크를 아는 사람은 입장할 수 있어요. 모르는 사람에게 링크를 공유하지 마세요.</p>'
    :'<p>공개 산책방에서는 다른 방문객과 만나요. 친구와 조용히 걷고 싶다면 초대 링크가 있는 비공개 방을 만들어 보세요.</p><div class="invite-actions"><button id="modal-create-private" class="modal-action" type="button">비공개 방 만들기</button></div><p class="small-note">각 방은 최대 8명이며 문자나 음성 메시지 기능은 없어요.</p>',
    'WALK TOGETHER');
  if(inviteToken){
    $('modal-invite-link').value=makePrivateInviteUrl(location.href,inviteToken);
    $('modal-copy-invite').onclick=copyInviteLink;
    $('modal-public-room').onclick=()=>{
      selectRoom(null);closeModal();toast('공개 산책방으로 돌아왔어요.');
    };
  }else $('modal-create-private').onclick=createPrivateRoom;
}
async function createPrivateRoom(){
  const buttons=[$('private-create-btn'),$('modal-create-private')].filter(Boolean);
  buttons.forEach(b=>b.disabled=true);
  try{
    const response=await fetch('/api/walk/private/create',{
      method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store'
    });
    if(!response.ok)throw new Error('Create failed: '+response.status);
    const body=await response.json();
    if(!validPrivateRoomToken(body.room))throw new Error('Invalid server invite token');
    selectRoom(body.room);
    openRoomMenu();
    toast('비공개 방을 만들었어요. 초대 링크를 복사해 보세요.');
  }catch(error){
    console.warn('Private stroll room could not be created:',error);
    toast('비공개 방을 만들지 못했어요. 다시 시도해 주세요.',4500);
  }finally{buttons.forEach(b=>{if(b.isConnected)b.disabled=false;});}
}
$('private-create-btn').onclick=createPrivateRoom;
$('intro-copy-invite').onclick=copyInviteLink;
$('intro-public-room').onclick=()=>{
  selectRoom(null);toast('공개 산책방을 선택했어요.');
};
$('room-menu-btn').onclick=openRoomMenu;
refreshInviteControls();

function showHelp(){modal('여자 캐릭터로 서울을 걸어요',`<p>2.5D 여성 산책자가 되어 서울 골목을 천천히 걸어봐요. 카메라는 뒤에서 따라오고, 시간 제한은 없어요.</p><ul><li><b>W A S D / 방향키</b> — 산책자 이동 (카메라 방향 기준)</li><li><b>마우스 드래그</b> — 주변 시점 회전</li><li><b>화면 클릭</b> — 포인터 고정 (ESC 해제)</li><li><b>SHIFT</b> — 조금 더 빠르게 걷기</li><li><b>E</b> — 가까운 장소 둘러보기</li><li><b>N</b> — 낮 / 저녁 변경</li><li><b>F</b> — 북촌 7경 포토스팟에서 골목 구도 맞추기</li><li><b>P</b> — 현재 화면 사진 저장</li><li><b>모바일</b> — 왼쪽 패드로 이동, 오른쪽 화면을 밀어 시점 회전</li></ul><p class="small-note">북촌에서 영감을 얻어 새롭게 구성한 가상 골목이야. 실제 주택과 주소를 정확하게 재현한 지도가 아니야.</p>`,'HOW TO WALK');}
$('help-btn').onclick=showHelp;
function showPostcards(){modal('발견한 골목 이야기',`<p>산책하다 발견한 장소는 여기 기록돼요. 가까이에서 <b>E</b>를 누르면 골목에 숨은 이야기를 볼 수 있어요.</p><div class="place-list">${locations.map((p,i)=>`<div class="place-chip ${discovered.has(p.id)?'found':''}">${discovered.has(p.id)?'✳ '+p.name:'○ 아직 발견하지 못한 곳 '+(i+1)}</div>`).join('')}</div><p class="small-note">기록은 현재 브라우저에만 저장돼요. 로그인이나 서버 계정은 없어.</p>`,'YOUR LITTLE MEMORIES');}
$('postcards-btn').onclick=showPostcards;
const voteChoices=['성수 골목','익선동 한옥길','홍대 밤거리','한강 산책로'];
$('idea-btn').onclick=()=>{
 const prev=safeStore.getItem('seoul-stroll-vote')||'';
 modal('다음엔 어디를 걸을까요?',`<p>서울 산책은 아직 첫 번째 작은 골목만 열려 있어요. 다음에 보고 싶은 동네를 골라 주세요.</p><div class="vote-options">${voteChoices.map(s=>`<button class="vote-option ${prev===s?'selected':''}" data-choice="${s}">${s}</button>`).join('')}</div><p id="vote-result" class="small-note">${prev?'이 브라우저에서 선택한 동네: '+prev:'체험판: 투표는 이 브라우저에만 저장돼. 아직 개발자에게 자동 전송되지 않아.'}</p><hr style="border:0;border-top:1px solid #e1dfd6;margin:22px 0"><p>이 무료 산책 프로젝트가 마음에 들었다면, 나중에 연결될 <b>자율 후원</b>으로 새 골목 제작을 도울 수 있어요.</p><p class="small-note">후원 링크는 아직 설정되지 않았어. 실제 후원 계정을 만든 뒤 src/main.js의 SUPPORT_URL 값을 바꿔 연결할 수 있어.</p>${SUPPORT_URL?'<a class="modal-action" style="display:inline-block;text-decoration:none" href="'+SUPPORT_URL+'" target="_blank" rel="noopener noreferrer">커피 한 잔 후원하기 ↗</a>':''}`,'NEXT NEIGHBORHOOD');
 document.querySelectorAll('.vote-option').forEach(b=>b.onclick=()=>{safeStore.setItem('seoul-stroll-vote',b.dataset.choice);document.querySelectorAll('.vote-option').forEach(x=>x.classList.toggle('selected',x===b));$('vote-result').textContent='이 브라우저에서 선택한 동네: '+b.dataset.choice+' (서버 전송 전)';});
};
const SUPPORT_URL=''; // Set your actual Buy Me a Coffee / Ko-fi link here when ready.

// The female Seoul walker is the only playable avatar. World-space
// movement and the third-person follow camera remain unchanged.
function updateWalkerGuide(){
  const line=discovered.size===locations.length
    ?'오늘의 골목을 다 발견했어요. 잠깐 쉬어갈까요?'
    :'작은 돌길을 따라 천천히 걸어봐요.';
  const el=$('walker-line');if(el&&el.textContent!==line)el.textContent=line;
}
function showWalker(){
  modal('나의 서울 산책자',
    '<div class="walker-about"><img src="/sprites/girl_portrait.webp" alt="서울 여성 산책자"><p>갈색 단발머리에 꽃 장식, 코랄빛 가디건, 플리츠 치마와 작은 노리개 가방을 챙겼어요. 서울 골목을 천천히 걸어요.</p></div><p class="small-note">게임 속 캐릭터는 2.5D 일러스트 스프라이트로 표현돼요.</p><a class="modal-action" style="display:inline-block;text-decoration:none" href="/sprite.html">걷기 애니메이션 보기 ↗</a>',
    'YOUR WALKING CHARACTER');
}
$('walker-card')?.addEventListener('click',showWalker);

function composeSeventhPhoto(){
 if(!state.started||state.modal||!isNearPhotoSpot())return;
 // Rotate the CAMERA only; no snap teleport or camera rail. The player
 // keeps walking after choosing the angle and is still synced to friends.
 state.yaw=photoSpot.yaw;
 state.pitch=photoSpot.pitch;
 toast('7경의 한옥 골목 구도를 맞췄어요. P 또는 사진 저장으로 촬영해요.',3600);
}
function interact(){
 if(state.modal)return;
 if(nearSpot){
   markFound(nearSpot);
   modal(nearSpot.name,`<p>${nearSpot.detail}</p><p class="small-note">발견한 장소 ${discovered.size} / ${locations.length} · 이 골목은 실제 지도의 정확한 재현이 아닌 서울에서 영감을 받은 공간이야.</p>`,'YOU FOUND A LITTLE PLACE');
 }else if(isNearPhotoSpot())composeSeventhPhoto();
}
function nearUpdate(){
 let m=null,dist=4.5;
 for(const p of locations){
  const d=Math.hypot(state.x-p.x,state.z-p.z);
  if(d<dist){dist=d;m=p;}
 }
 nearSpot=m;
 updateWalkerGuide();
 const hint=$('hint'),touchButton=$('touch-interact');
 const nearbyPhoto=state.started&&!state.modal&&isNearPhotoSpot();
 $('photo-save-btn').hidden=!nearbyPhoto;
 if(m&&!state.modal&&state.started){
  hint.innerHTML=`<b>${touchDevice?'터치':'E'}</b> ${m.name} 둘러보기`;
  hint.classList.add('visible');
  touchButton.textContent='둘러보기';
  touchButton.classList.add('visible');
 }else if(nearbyPhoto){
  hint.innerHTML=touchDevice
   ?'<b>북촌 7경</b> 사진 구도를 맞춰보세요.'
   :'<b>북촌 7경</b> F 구도 맞추기 · P 사진 저장';
  hint.classList.add('visible');
  touchButton.textContent='사진 구도';
  touchButton.classList.add('visible');
 }else{
  hint.classList.remove('visible');
  touchButton.classList.remove('visible');
 }
}
$('touch-interact').onclick=interact;
function isWalkable(x,z){
 // The original 5/6 street and the 7-gyeong loop share walkable collision.
 return paths.some(p=>distanceFromPath(x,z,p)<
   (p.widthAt?p.widthAt(z):p.width)*.5+.33);
}
const followCamera=createThirdPersonCamera({camera,hill,isWalkable});
function move(dt){if(!state.started||state.modal)return;
 let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
 let strafe=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 forward+=-touchInput.y;strafe+=touchInput.x;
 let length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length;}
 const {dx,dz}=cameraRelativeDirection(forward,strafe,state.yaw);
 const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.35:1.85);
 const lerp=1-Math.exp(-dt*10);state.vx+=(dx*speed-state.vx)*lerp;state.vz+=(dz*speed-state.vz)*lerp;
 const nx=state.x+state.vx*dt,nz=state.z+state.vz*dt;
 if(isWalkable(nx,state.z))state.x=nx;else state.vx=0;
 if(isWalkable(state.x,nz))state.z=nz;else state.vz=0;
 const movement=Math.hypot(state.vx,state.vz);state.walked+=movement*dt;stepPhase+=movement*dt*.95;
 if(movement>.5)audioStep(dt,movement);
}
const touchInput={x:0,y:0};let padPointer=null,padOrigin={x:0,y:0},lookPointer=null,lookLast={x:0,y:0},dragging=false,lastMouse={x:0,y:0};
function updatePad(event){let dx=event.clientX-padOrigin.x,dy=event.clientY-padOrigin.y;const len=Math.hypot(dx,dy),max=37;if(len>max){dx*=max/len;dy*=max/len;}touchInput.x=dx/max;touchInput.y=dy/max;$('touch-knob').style.transform=`translate(${dx}px,${dy}px)`;}
const pad=$('touch-pad');pad.addEventListener('pointerdown',e=>{if(!state.started)return;padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);padOrigin={x:e.clientX,y:e.clientY};updatePad(e);});pad.addEventListener('pointermove',e=>{if(e.pointerId===padPointer)updatePad(e);});function resetPad(e){if(e.pointerId!==padPointer)return;padPointer=null;touchInput.x=touchInput.y=0;$('touch-knob').style.transform='translate(0,0)';}pad.addEventListener('pointerup',resetPad);pad.addEventListener('pointercancel',resetPad);
const look=$('touch-look');look.addEventListener('pointerdown',e=>{if(!state.started)return;lookPointer=e.pointerId;look.setPointerCapture(e.pointerId);lookLast={x:e.clientX,y:e.clientY};});look.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;state.yaw+=(e.clientX-lookLast.x)*.005;state.pitch=clamp(state.pitch-(e.clientY-lookLast.y)*.004,-.85,.35);lookLast={x:e.clientX,y:e.clientY};});look.addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null;});look.addEventListener('pointercancel',e=>{if(e.pointerId===lookPointer)lookPointer=null;});
function requestPointer(){if(state.started&&!state.modal&&!touchDevice)canvas.requestPointerLock?.();}
canvas.addEventListener('pointerdown',e=>{if(touchDevice)return;dragging=true;lastMouse={x:e.clientX,y:e.clientY};if(state.started&&!state.modal)requestPointer();});
window.addEventListener('pointerup',()=>{dragging=false;});
window.addEventListener('mousemove',e=>{if(!state.started||state.modal||touchDevice)return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(dragging){dx=e.clientX-lastMouse.x;dy=e.clientY-lastMouse.y;}state.yaw+=dx*.0027;state.pitch=clamp(state.pitch-dy*.0022,-.85,.35);lastMouse={x:e.clientX,y:e.clientY};});
window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(state.modal)closeModal();return;}
 if(!state.started||state.modal)return;
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyE')interact();if(e.code==='KeyF')composeSeventhPhoto();if(e.code==='KeyN')toggleTime();if(e.code==='KeyP')savePhoto();if(e.code==='KeyH')showHelp();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchInput.x=touchInput.y=0;});
// Release slots promptly on navigation; restore a bfcached mobile session.
window.addEventListener('pagehide',()=>multiplayer.stop());
window.addEventListener('pageshow',event=>{
  if(event.persisted&&state.started)multiplayer.start();
});
$('start-btn').onclick=()=>{state.started=true;multiplayer.start();document.body.classList.add('playing');$('intro').classList.remove('visible');if(touchDevice){$('touch-ui').setAttribute('aria-hidden','false');}toast('북촌 전망길에서 내리막 골목을 따라 서울 풍경을 만나보세요. ✿',4500);};
function toggleTime(){state.night=!state.night;$('toggle-time').textContent=state.night?'☀':'☾';toast(state.night?'조용한 서울의 저녁이에요.':'햇살이 돌아왔어요.');}
$('toggle-time').onclick=toggleTime;
// Synthesized ambience avoids third-party sound/licensing dependencies. WebAudio begins after click.
let audioCtx=null,ambientSource=null,ambientGain=null,footstepTimer=0;
function audioInit(){if(audioCtx)return;const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;audioCtx=new AudioContext();let samples=audioCtx.sampleRate*2,buf=audioCtx.createBuffer(1,samples,audioCtx.sampleRate);let data=buf.getChannelData(0),lp=0;for(let i=0;i<samples;i++){lp=lp*.985+(Math.random()*2-1)*.015;data[i]=lp*.37;}ambientSource=audioCtx.createBufferSource();ambientSource.buffer=buf;ambientSource.loop=true;ambientGain=audioCtx.createGain();ambientGain.gain.value=.21;const low=audioCtx.createBiquadFilter();low.type='lowpass';low.frequency.value=400;ambientSource.connect(low);low.connect(ambientGain);ambientGain.connect(audioCtx.destination);ambientSource.start();}
function audioStep(dt,movement){footstepTimer+=dt;if(footstepTimer<.38/Math.max(.8,movement/4))return;footstepTimer=0;if(!audioCtx||state.mute)return;const now=audioCtx.currentTime;let oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(155+Math.random()*35,now);oscillator.frequency.exponentialRampToValueAtTime(74,now+.095);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.018,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+.1);oscillator.connect(gain);gain.connect(audioCtx.destination);oscillator.start(now);oscillator.stop(now+.11);}
$('toggle-sound').onclick=()=>{audioInit();state.mute=!state.mute;if(audioGainAvailable())ambientGain.gain.setTargetAtTime(state.mute?0:.22,audioCtx.currentTime,.1);$('toggle-sound').textContent=state.mute?'♩':'♪';toast(state.mute?'소리를 껐어요.':'조용한 바람 소리를 켰어요.');};
function audioGainAvailable(){return audioCtx&&ambientGain;}
function savePhoto(){
 const a=document.createElement('a');
 a.download=isNearPhotoSpot()?'bukchon-7gyeong-postcard.png':'seoul-stroll-postcard.png';
 a.href=canvas.toDataURL('image/png');
 a.click();
 toast('산책 사진을 저장했어요.');
}
$('photo-save-btn').onclick=savePhoto;
function resize() {
  // The render-budget controller owns DPR; do not override it on resize.
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  camera.aspect = window.innerWidth/Math.max(1,window.innerHeight);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);
resize();
function render(time=0) {
  const frameMs=lastFrame?time-lastFrame:16.7;
  const dt=Math.min(.12,Math.max(.001,frameMs/1000||.016));
  lastFrame=time;
  state.elapsed+=dt;
  move(dt);
  const moving=Math.hypot(state.vx,state.vz)>.15;
  // The female walker alone follows the existing path/camera and input.
  const motion={x:state.x,z:state.z,vx:state.vx,vz:state.vz,dt,elapsed:state.elapsed,walking:moving};
  girl.update({...motion,visible:state.started});
  if(state.started)multiplayer.update(motion);
  followCamera.update({x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch,dt,moving});
  const fog=state.night?SKY_FOG_NIGHT:SKY_FOG_DAY;
  sky.update(camera,state.night);
  lighting.update({x:state.x,z:state.z,hill,night:state.night});
  nightLights.update(state.x,state.z,state.night);
  material.uniforms.uNight.value=state.night?1:0;
  material.uniforms.uShadowStrength.value=state.night?.12:.86;
  material.uniforms.uFogColor.value.setRGB(...fog);
  renderer.setClearColor(clearColor.setRGB(...fog),1);
  renderer.render(scene,camera);
  renderBudget.observe(frameMs,time,{playing:state.started,visible:!document.hidden});
  if(time-lastMap>180){lastMap=time;mapUpdate();nearUpdate();}
  if(lastToast&&time>lastToast){$('toast').classList.remove('visible');lastToast=0;}
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Read-only QA sampling for automated third-person control tests. Active only
// with ?qa=1; does not modify input, player state or normal gameplay.
if(new URLSearchParams(location.search).has('qa')) {
  window.__wkQA=()=>({
    mode:'third-person',player:[state.x,state.z],
    velocity:[state.vx,state.vz],
    avatar:girl.snapshot(),selectedAvatar:'girl',
    multiplayer:multiplayer.getStatus(),
    paving,camera:followCamera.snapshot(),
    seventhPhoto:{...photoSpot,nearby:isNearPhotoSpot(),roofPeeks:seventhViewpoint.roofPeeks.length},
    decoratedHouses:houseSites.filter(site=>site.decorated).length+seventhBuildings.buildings.length,
    houses:houseSites.length+seventhBuildings.buildings.length,
    seventhHouses:seventhBuildings.buildings.map(b=>({id:b.id,style:b.style,x:b.x,z:b.z})),
    streetDetails:streetLife.counts, utilityCrossings:streetLife.lines.length,
    viewYaw:state.yaw,started:state.started,
    night:state.night,
    rendererStats:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      pixelRatio:renderer.getPixelRatio()},
    performance:renderBudget.getStatus(),
    nightLighting:nightLights.getStatus(),sunLighting:lighting.getStatus()
  });
}

console.info(`[Seoul Stroll Bukchon v0.12 scenic alley] Three.js ready: ${vertexCount.toLocaleString()} vertices, ${houseSites.length+seventhBuildings.buildings.length} hanok houses (including 7-gyeong), ${paths.length} walkable lanes, ${locations.length} discoveries.`);