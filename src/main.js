import * as THREE from 'three';
import { createBukchonWorld } from './world/BukchonWorld.js';
import { createDamiCompanion } from './characters/DamiCompanion.js';
import { createGirlSpriteCompanion } from './characters/GirlSprite.js';
import { createThirdPersonCamera } from './controllers/ThirdPersonCamera.js';
import { cameraRelativeDirection } from './controllers/MovementDirections.js';
import { createBukchonLighting } from './world/BukchonLighting.js';
import { createBukchonSky, SKY_FOG_DAY, SKY_FOG_NIGHT } from './world/BukchonSky.js';

const $ = (id) => document.getElementById(id);
const canvas = $('world');
const touchDevice = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
const TAU = Math.PI*2;
const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(57,1,.1,240);
// Clear blue day sky and sparse, softly feathered procedural clouds.
// Preserve the previous night-sky appearance until weather phase 04.
const sky=createBukchonSky(scene);
const {mesh,material,paths,hill,distanceFromPath,houseSites,streetLife,paving,vertexCount} = createBukchonWorld();
scene.add(mesh);
const lighting=createBukchonLighting({
  renderer,scene,worldMesh:mesh,isTouch:touchDevice
});
const dami=createDamiCompanion(scene,hill);
const girl=createGirlSpriteCompanion(scene,hill,camera);
const avatars={dami,girl};

// Start on the upper lookout, looking DOWN the old lane toward Namsan.
// The paths and camera-relative WASD controls remain unchanged.
const state={x:-3,z:-42,yaw:Math.PI,pitch:(new URLSearchParams(location.search).get('view')==='namsan'?0.01:-0.35),vy:0,vx:0,vz:0,night:false,running:false,started:false,modal:false,helpViewed:false,mute:true,elapsed:0,walked:0,quality:1,avatar:'dami'};
const keys=new Set();let lastFrame=0,lastMap=0,lastToast=0,nearSpot=null,stepPhase=0;
const memoryStore={};
const safeStore={getItem(k){try{return window.localStorage.getItem(k)}catch(e){return memoryStore[k]||null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){memoryStore[k]=v}}};
const discovered=new Set(JSON.parse(safeStore.getItem('seoul-stroll-places-bukchon-v02')||'[]'));
const initialAvatar=safeStore.getItem('walkingkorea-avatar-v1');
if(initialAvatar==='girl')state.avatar='girl';
const avatarProfiles={
 dami:{name:'수호냥이 담이',label:'YOU ARE DAMI',image:'/guide-cat.svg',hello:'담이가 되어 골목을 천천히 걸어볼까?'},
 girl:{name:'서울 산책자',label:'SEOUL WALKER',image:'/sprites/girl_portrait.webp',hello:'내 발걸음으로 북촌의 작은 골목을 발견해요.'}
};
function selectAvatar(kind,{announce=false}={}){
 if(!avatars[kind])return;
 state.avatar=kind;
 safeStore.setItem('walkingkorea-avatar-v1',kind);
 document.querySelectorAll('[data-avatar]').forEach(b=>{
   const active=b.dataset.avatar===kind;
   b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
 });
 const profile=avatarProfiles[kind];
 const photo=$('avatar-photo'),title=$('avatar-name'),kicker=$('avatar-kicker');
 if(photo)photo.src=profile.image;
 if(title)title.textContent=profile.name;
 if(kicker)kicker.textContent=profile.label+' · THIRD PERSON';
 if($('intro-character-name'))$('intro-character-name').textContent=kind==='dami'?'오늘은 담이가 되어볼까요?':'오늘은 서울 산책자가 되어볼까요?';
 if($('intro-character-description'))$('intro-character-description').textContent=profile.hello;
 if($('intro-avatar-portrait'))$('intro-avatar-portrait').src=profile.image;
 const preview=$('avatar-preview-link');
 if(preview)preview.href=kind==='girl'?'/sprite.html':'/character.html';
 if($('walker-keys'))$('walker-keys').textContent=kind==='dami'?'W A S D 담이 걷기 · 마우스 카메라 · E 둘러보기':'W A S D 걷기 · 마우스 카메라 · E 둘러보기';
 updateDamiGuide();
 if(announce&&state.started)toast(profile.name+'로 변경했어요. ✳');
}

const locations=[
 {id:'entrance',name:'북촌 산책의 시작',detail:'낮은 담장 사이를 따라 작은 오르막이 이어져요.',x:0,z:40},
 {id:'crossroad',name:'담장길 갈림길',detail:'오래된 한옥들 사이로 좁은 골목이 나뉘어요. 어느 쪽이든 천천히 걸어 보세요.',x:-5,z:6},
 {id:'east',name:'공방길',detail:'골목이 구부러지는 곳. 지붕 너머로 또 다른 길이 열려요.',x:16,z:9},
 {id:'west',name:'조용한 서쪽 골목',detail:'한옥 담장 옆에 숨은 아주 조용한 산책길이에요.',x:-24,z:-8},
 {id:'turn',name:'굽은 골목',detail:'발걸음을 돌릴 때마다 전혀 다른 지붕의 선이 보여요.',x:0,z:-24},
 {id:'view',name:'북촌 전망길',detail:'언덕 위에서 작은 한옥 지붕들이 겹쳐 보이는 전망 포인트예요.',x:-3,z:-42},
];
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
  tooltip.textContent=site.archetype==='a01'?'한옥 A01':'꽃과 기와가 꾸며진 한옥';
  marker.appendChild(tooltip);
  root.appendChild(marker);
 }
}
drawMapLanes();
function mapUpdate(){const spot=$('player-spot');const [px,py]=toMap(state.x,state.z);spot.setAttribute('cx',String(clamp(px,3,167)));spot.setAttribute('cy',String(clamp(py,3,122)));$('discovery-count').textContent=`${discovered.size} / ${locations.length}`;
 $('compass-label').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.round(((state.yaw%TAU+TAU)%TAU)/(TAU/8))%8];$('compass-needle').style.transform=`rotate(${state.yaw}rad)`;}
function pointsMap(){const svg=$('map-pois');const ns='http://www.w3.org/2000/svg';locations.forEach(p=>{let e=document.createElementNS(ns,'circle');e.setAttribute('cx',String(toMap(p.x,p.z)[0]));e.setAttribute('cy',String(toMap(p.x,p.z)[1]));e.setAttribute('r','3.2');e.setAttribute('fill',discovered.has(p.id)?'#dc8b69':'#b9b2a4');e.dataset.id=p.id;svg.appendChild(e);});}
pointsMap();mapUpdate();
function markFound(p){if(discovered.has(p.id))return;discovered.add(p.id);safeStore.setItem('seoul-stroll-places-bukchon-v02',JSON.stringify([...discovered]));const marker=$('map-pois').querySelector(`[data-id="${p.id}"]`);if(marker)marker.setAttribute('fill','#dc8b69');mapUpdate();}
function toast(msg,ms=3000){$('toast').textContent=msg;$('toast').classList.add('visible');lastToast=performance.now()+ms;}
function modal(title,body,kicker='SEOUL STROLL'){state.modal=true;$('modal-content').innerHTML=`<span class="modal-kicker">${kicker}</span><h2 id="modal-title">${title}</h2>${body}`;$('modal').classList.add('visible');$('modal').setAttribute('aria-hidden','false');document.exitPointerLock?.();}
function closeModal(){state.modal=false;$('modal').classList.remove('visible');$('modal').setAttribute('aria-hidden','true');}
$('modal-close').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal();});
function showHelp(){modal('내 캐릭터로 서울을 걸어요',`<p>담이나 2.5D 여성 산책자 중 원하는 캐릭터를 선택해 작은 서울의 골목을 산책해요. 카메라는 뒤에서 따라오고, 시간 제한은 없어요.</p><ul><li><b>W A S D / 방향키</b> — 담이 이동 (카메라 방향 기준)</li><li><b>마우스 드래그</b> — 담이 주변 시점 회전</li><li><b>화면 클릭</b> — 포인터 고정 (ESC 해제)</li><li><b>SHIFT</b> — 조금 더 빠르게 걷기</li><li><b>E</b> — 가까운 장소 둘러보기</li><li><b>N</b> — 낮 / 저녁 변경</li><li><b>P</b> — 현재 화면 사진 저장</li><li><b>모바일</b> — 왼쪽 패드로 이동, 오른쪽 화면을 밀어 시점 회전</li></ul><p class="small-note">북촌에서 영감을 얻어 새롭게 구성한 가상 골목이야. 실제 주택과 주소를 정확하게 재현한 지도가 아니야.</p>`,'HOW TO WALK');}
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

// Dami is the player avatar in third-person. The camera orbits and follows;
// movement keys translate Dami in world space and steer her body independently.
const guideLines={
 entrance:'오늘은 내가 북촌 골목을 걸어볼 차례야.',
 crossroad:'갈림길이네. 어느 골목으로 가볼까?',
 east:'공방길엔 작은 가게들이 있겠지?',
 west:'서쪽 골목은 조용하네. 천천히 걸어야지.',
 turn:'골목이 굽어지는 곳이야. 지붕도 예쁘다.',
 view:'저 위에서 오늘 걸어온 길을 내려다볼까?'
};
function updateDamiGuide(){
 const p=nearSpot||locations.find(q=>!discovered.has(q.id))||locations[0];
 const line=state.avatar==='girl'
  ? (discovered.size===locations.length?'오늘의 골목을 다 발견했어요. 잠깐 쉬어갈까요?':'작은 돌길을 따라 천천히 걸어봐요.')
  : (discovered.size===locations.length?'오늘의 골목을 다 찾았어. 이제 쉬어볼까?':(guideLines[p?.id]||'천천히 걷다 보면 작은 아름다움이 보여요.'));
 const el=$('dami-line');if(el&&el.textContent!==line)el.textContent=line;
}
function showDami(){
 if(state.avatar==='girl'){
   modal('나의 서울 산책자',
   '<div class="dami-about"><img src="/sprites/girl_portrait.webp" alt="서울 여성 산책자"><p>갈색 단발머리에 꽃 장식, 코랄빛 가디건, 플리츠 치마와 작은 노리개 가방을 챙겼어요. 서울 골목을 천천히 걸어요.</p></div><p class="small-note">현재 캐릭터는 승인된 콘셉트를 바탕으로 제작한 Three.js 3D 에셋입니다.</p>',
   'YOUR WALKING CHARACTER');
   return;
 }
 modal('내가 바로 담이!',
 '<div class="dami-about"><img src="/guide-cat.svg" alt="북촌 수호냥이 담이"><p>안녕! 나는 북촌 골목의 작은 수호냥이 <b>담이</b>야. 이제 네가 직접 날 움직여서 골목을 탐험하는 거야. 초록 스카프와 부적 가방을 챙겼으니 출발해볼까?</p></div><p class="small-note">새로운 담이는 둥근 머리와 삼색 무늬, 스카프와 한옥 참을 실제 입체 메시로 만든 3D 캐릭터예요. 정면과 뒷면까지 직접 돌려볼 수 있어요.</p><a class="modal-action" style="display:inline-block;text-decoration:none" href="/character.html">담이 3D 모델 360° 보기 ↗</a>',
 'MEET YOUR LITTLE GUIDE');
}
$('dami-card')?.addEventListener('click',showDami);
document.querySelectorAll('[data-avatar]').forEach(b=>b.addEventListener('click',()=>selectAvatar(b.dataset.avatar,{announce:true})));
$('switch-avatar')?.addEventListener('click',()=>{
 modal('함께 걸을 캐릭터 선택',
  '<p>원하는 캐릭터로 언제든 산책을 이어갈 수 있어요.</p><div class="modal-character-choices"><button id="modal-dami" class="avatar-option"><img src="/guide-cat.svg" alt=""><strong>수호냥이 담이</strong></button><button id="modal-girl" class="avatar-option"><img src="/sprites/girl_portrait.webp" alt=""><strong>서울 산책자</strong></button></div>',
  'CHOOSE YOUR CHARACTER');
 $('modal-dami').onclick=()=>{selectAvatar('dami',{announce:true});closeModal();};
 $('modal-girl').onclick=()=>{selectAvatar('girl',{announce:true});closeModal();};
});
selectAvatar(state.avatar);

function interact(){if(!nearSpot || state.modal)return;markFound(nearSpot);modal(nearSpot.name,`<p>${nearSpot.detail}</p><p class="small-note">발견한 장소 ${discovered.size} / ${locations.length} · 이 골목은 실제 지도의 정확한 재현이 아닌 서울에서 영감을 받은 공간이야.</p>`,'YOU FOUND A LITTLE PLACE');}
function nearUpdate(){let m=null,dist=4.5;for(const p of locations){let d=Math.hypot(state.x-p.x,state.z-p.z);if(d<dist){dist=d;m=p;}}nearSpot=m;updateDamiGuide();let hint=$('hint');if(m&&!state.modal&&state.started){hint.innerHTML=`<b>${touchDevice?'터치':'E'}</b>  ${m.name} 둘러보기`;hint.classList.add('visible');$('touch-interact').classList.add('visible');}else{hint.classList.remove('visible');$('touch-interact').classList.remove('visible');}}
$('touch-interact').onclick=interact;
function isWalkable(x,z){
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
 if(e.code==='KeyE')interact();if(e.code==='KeyN')toggleTime();if(e.code==='KeyP')savePhoto();if(e.code==='KeyH')showHelp();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchInput.x=touchInput.y=0;});
$('start-btn').onclick=()=>{state.started=true;document.body.classList.add('playing');$('intro').classList.remove('visible');if(touchDevice){$('touch-ui').setAttribute('aria-hidden','false');}toast('북촌 전망길에서 내리막 골목을 따라 서울 풍경을 만나보세요. ✿',4500);};
function toggleTime(){state.night=!state.night;$('toggle-time').textContent=state.night?'☀':'☾';toast(state.night?'조용한 서울의 저녁이에요.':'햇살이 돌아왔어요.');}
$('toggle-time').onclick=toggleTime;
// Synthesized ambience avoids third-party sound/licensing dependencies. WebAudio begins after click.
let audioCtx=null,ambientSource=null,ambientGain=null,footstepTimer=0;
function audioInit(){if(audioCtx)return;const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;audioCtx=new AudioContext();let samples=audioCtx.sampleRate*2,buf=audioCtx.createBuffer(1,samples,audioCtx.sampleRate);let data=buf.getChannelData(0),lp=0;for(let i=0;i<samples;i++){lp=lp*.985+(Math.random()*2-1)*.015;data[i]=lp*.37;}ambientSource=audioCtx.createBufferSource();ambientSource.buffer=buf;ambientSource.loop=true;ambientGain=audioCtx.createGain();ambientGain.gain.value=.21;const low=audioCtx.createBiquadFilter();low.type='lowpass';low.frequency.value=400;ambientSource.connect(low);low.connect(ambientGain);ambientGain.connect(audioCtx.destination);ambientSource.start();}
function audioStep(dt,movement){footstepTimer+=dt;if(footstepTimer<.38/Math.max(.8,movement/4))return;footstepTimer=0;if(!audioCtx||state.mute)return;const now=audioCtx.currentTime;let oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(155+Math.random()*35,now);oscillator.frequency.exponentialRampToValueAtTime(74,now+.095);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.018,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+.1);oscillator.connect(gain);gain.connect(audioCtx.destination);oscillator.start(now);oscillator.stop(now+.11);}
$('toggle-sound').onclick=()=>{audioInit();state.mute=!state.mute;if(audioGainAvailable())ambientGain.gain.setTargetAtTime(state.mute?0:.22,audioCtx.currentTime,.1);$('toggle-sound').textContent=state.mute?'♩':'♪';toast(state.mute?'소리를 껐어요.':'조용한 바람 소리를 켰어요.');};
function audioGainAvailable(){return audioCtx&&ambientGain;}
function savePhoto(){const a=document.createElement('a');a.download='seoul-stroll-postcard.png';a.href=canvas.toDataURL('image/png');a.click();toast('산책 사진을 저장했어요.');}
function resize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, touchDevice?1.25:1.6));
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  camera.aspect = window.innerWidth/Math.max(1,window.innerHeight);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);
resize();
function render(time=0) {
  const dt=Math.min(.12,Math.max(.001,(time-lastFrame)/1000||.016));
  lastFrame=time;
  state.elapsed+=dt;
  move(dt);
  const moving=Math.hypot(state.vx,state.vz)>.15;
  // Only the chosen avatar is visible. Both share the same movement,
  // path collision, follow camera, and interactive exploration system.
  const motion={x:state.x,z:state.z,vx:state.vx,vz:state.vz,dt,elapsed:state.elapsed,walking:moving};
  dami.update({...motion,visible:state.started&&state.avatar==='dami'});
  girl.update({...motion,visible:state.started&&state.avatar==='girl'});
  followCamera.update({x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch,dt,moving});
  const fog=state.night?SKY_FOG_NIGHT:SKY_FOG_DAY;
  sky.update(camera,state.night);
  lighting.update({x:state.x,z:state.z,hill,night:state.night});
  material.uniforms.uNight.value=state.night?1:0;
  material.uniforms.uShadowStrength.value=state.night?.12:.86;
  material.uniforms.uFogColor.value.setRGB(...fog);
  renderer.setClearColor(new THREE.Color().setRGB(...fog),1);
  renderer.render(scene,camera);
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
    avatar:avatars[state.avatar].snapshot(),selectedAvatar:state.avatar,
    paving,camera:followCamera.snapshot(),
    decoratedHouses:houseSites.filter(site=>site.decorated).length, houses:houseSites.length,
    streetDetails:streetLife.counts, utilityCrossings:streetLife.lines.length,
    viewYaw:state.yaw,started:state.started
  });
}

console.info(`[Seoul Stroll Bukchon v0.12 scenic alley] Three.js ready: ${vertexCount.toLocaleString()} vertices, ${houseSites.length} hanok houses, ${paths.length} walkable lanes, ${locations.length} discoveries.`);