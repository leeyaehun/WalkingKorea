import * as THREE from 'three';
import { createBukchonWorld } from './world/BukchonWorld.js';
import { createDamiCompanion } from './characters/DamiCompanion.js';

const $ = (id) => document.getElementById(id);
const canvas = $('world');
const touchDevice = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
const TAU = Math.PI*2;
const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera((Math.PI/2.9)*180/Math.PI,1,.1,240);
const {mesh,material,paths,hill,distanceFromPath,houseSites,vertexCount} = createBukchonWorld();
scene.add(mesh);
const dami=createDamiCompanion(scene,hill);

const state={x:0,z:42,yaw:0,pitch:-.055,vy:0,vx:0,vz:0,night:false,running:false,started:false,modal:false,helpViewed:false,mute:true,elapsed:0,walked:0,quality:1};
const keys=new Set();let lastFrame=0,lastMap=0,lastToast=0,nearSpot=null,stepPhase=0;
const memoryStore={};
const safeStore={getItem(k){try{return window.localStorage.getItem(k)}catch(e){return memoryStore[k]||null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){memoryStore[k]=v}}};
const discovered=new Set(JSON.parse(safeStore.getItem('seoul-stroll-places-bukchon-v02')||'[]'));
const locations=[
 {id:'entrance',name:'북촌 산책의 시작',detail:'낮은 담장 사이를 따라 작은 오르막이 이어져요.',x:0,z:40},
 {id:'crossroad',name:'담장길 갈림길',detail:'오래된 한옥들 사이로 좁은 골목이 나뉘어요. 어느 쪽이든 천천히 걸어 보세요.',x:-5,z:6},
 {id:'east',name:'공방길',detail:'골목이 구부러지는 곳. 지붕 너머로 또 다른 길이 열려요.',x:16,z:9},
 {id:'west',name:'조용한 서쪽 골목',detail:'한옥 담장 옆에 숨은 아주 조용한 산책길이에요.',x:-24,z:-8},
 {id:'turn',name:'굽은 골목',detail:'발걸음을 돌릴 때마다 전혀 다른 지붕의 선이 보여요.',x:0,z:-24},
 {id:'view',name:'북촌 전망길',detail:'언덕 위에서 작은 한옥 지붕들이 겹쳐 보이는 전망 포인트예요.',x:-3,z:-42},
];
const toMap=(x,z)=>[clamp(8+(x+36)*2.12,2,168),clamp(5+(48-z)*1.19,2,123)];
function drawMapLanes(){const root=$('map-roads'),ns='http://www.w3.org/2000/svg';for(const route of paths){const pl=document.createElementNS(ns,'polyline');pl.setAttribute('points',route.samples.map(p=>toMap(p[0],p[1]).join(',')).join(' '));pl.setAttribute('fill','none');pl.setAttribute('stroke','#fffaf0');pl.setAttribute('stroke-width',String(route.width*2.12));pl.setAttribute('stroke-linecap','round');pl.setAttribute('stroke-linejoin','round');root.appendChild(pl);}}
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
function showHelp(){modal('천천히 걸어봐요',`<p>작은 서울의 골목을 자유롭게 산책해요. 별도의 미션이나 시간 제한은 없어요.</p><ul><li><b>W A S D / 방향키</b> — 이동</li><li><b>마우스 드래그</b> — 시점 회전</li><li><b>화면 클릭</b> — 포인터 고정 (ESC 해제)</li><li><b>SHIFT</b> — 조금 더 빠르게 걷기</li><li><b>E</b> — 가까운 장소 둘러보기</li><li><b>N</b> — 낮 / 저녁 변경</li><li><b>P</b> — 현재 화면 사진 저장</li><li><b>모바일</b> — 왼쪽 패드로 이동, 오른쪽 화면을 밀어 시점 회전</li></ul><p class="small-note">북촌에서 영감을 얻어 새롭게 구성한 가상 골목이야. 실제 주택과 주소를 정확하게 재현한 지도가 아니야.</p>`,'HOW TO WALK');}
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

// Dami is the game's first visible guide character, not a replacement for the
// first-person walking controls. The concept art is adapted into a small Three.js
// cat + an illustrated UI card so it is visible on desktop and touch devices.
const guideLines={
 entrance:'여기가 오늘 산책의 시작이에요. 담장 너머 지붕을 봐요.',
 crossroad:'갈림길에선 마음이 가는 쪽으로 천천히 걸어 봐요.',
 east:'공방길에서는 작은 가게들이 기다리고 있어요.',
 west:'서쪽 골목은 조용해요. 발걸음도 느려지는 느낌이죠.',
 turn:'골목이 휘어지는 곳에서 지붕의 곡선을 살펴봐요.',
 view:'전망길에서는 오늘 걸어온 풍경이 한눈에 보여요.'
};
function updateDamiGuide(){
 const p=nearSpot||locations.find(q=>!discovered.has(q.id))||locations[0];
 const line=discovered.size===locations.length?'오늘의 골목을 다 찾았어요. 마음껏 쉬어가요.':(guideLines[p?.id]||'천천히 걷다 보면 작은 아름다움이 보여요.');
 const el=$('dami-line');if(el&&el.textContent!==line)el.textContent=line;
}
function showDami(){
 modal('담이와 함께 걷는 북촌',
 '<div class="dami-about"><img src="/guide-cat.svg" alt="북촌 수호냥이 담이"><p>안녕! 나는 북촌 골목의 작은 수호냥이 <b>담이</b>야. 초록 스카프와 작은 부적 가방을 매고, 네가 서울의 골목을 천천히 발견하도록 곁에서 안내할게.</p></div><p class="small-note">담이의 3D 모습은 가볍게 구현한 첫 버전으로, 앞으로 걷기 동작과 표현을 더 다듬을 예정이에요.</p>',
 'MEET YOUR LITTLE GUIDE');
}
$('dami-card')?.addEventListener('click',showDami);

function interact(){if(!nearSpot || state.modal)return;markFound(nearSpot);modal(nearSpot.name,`<p>${nearSpot.detail}</p><p class="small-note">발견한 장소 ${discovered.size} / ${locations.length} · 이 골목은 실제 지도의 정확한 재현이 아닌 서울에서 영감을 받은 공간이야.</p>`,'YOU FOUND A LITTLE PLACE');}
function nearUpdate(){let m=null,dist=4.5;for(const p of locations){let d=Math.hypot(state.x-p.x,state.z-p.z);if(d<dist){dist=d;m=p;}}nearSpot=m;updateDamiGuide();let hint=$('hint');if(m&&!state.modal&&state.started){hint.innerHTML=`<b>${touchDevice?'터치':'E'}</b>  ${m.name} 둘러보기`;hint.classList.add('visible');$('touch-interact').classList.add('visible');}else{hint.classList.remove('visible');$('touch-interact').classList.remove('visible');}}
$('touch-interact').onclick=interact;
function isWalkable(x,z){return paths.some(p=>distanceFromPath(x,z,p)<p.width*.5+.33);}
function move(dt){if(!state.started||state.modal)return;
 let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
 let strafe=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 forward+=-touchInput.y;strafe+=touchInput.x;
 let length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length;}
 const dx=Math.sin(state.yaw)*forward+Math.cos(state.yaw)*strafe;
 const dz=-Math.cos(state.yaw)*forward+Math.sin(state.yaw)*strafe;
 const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?7:4.25);
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
const look=$('touch-look');look.addEventListener('pointerdown',e=>{if(!state.started)return;lookPointer=e.pointerId;look.setPointerCapture(e.pointerId);lookLast={x:e.clientX,y:e.clientY};});look.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;state.yaw+=(e.clientX-lookLast.x)*.005;state.pitch=clamp(state.pitch-(e.clientY-lookLast.y)*.004,-.85,.85);lookLast={x:e.clientX,y:e.clientY};});look.addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null;});look.addEventListener('pointercancel',e=>{if(e.pointerId===lookPointer)lookPointer=null;});
function requestPointer(){if(state.started&&!state.modal&&!touchDevice)canvas.requestPointerLock?.();}
canvas.addEventListener('pointerdown',e=>{if(touchDevice)return;dragging=true;lastMouse={x:e.clientX,y:e.clientY};if(state.started&&!state.modal)requestPointer();});
window.addEventListener('pointerup',()=>{dragging=false;});
window.addEventListener('mousemove',e=>{if(!state.started||state.modal||touchDevice)return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(dragging){dx=e.clientX-lastMouse.x;dy=e.clientY-lastMouse.y;}state.yaw+=dx*.0027;state.pitch=clamp(state.pitch-dy*.0022,-.87,.87);lastMouse={x:e.clientX,y:e.clientY};});
window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(state.modal)closeModal();return;}
 if(!state.started||state.modal)return;
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyE')interact();if(e.code==='KeyN')toggleTime();if(e.code==='KeyP')savePhoto();if(e.code==='KeyH')showHelp();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchInput.x=touchInput.y=0;});
$('start-btn').onclick=()=>{state.started=true;$('intro').classList.remove('visible');if(touchDevice){$('touch-ui').setAttribute('aria-hidden','false');}toast('담이와 함께 북촌 골목을 걸어 봐요. ✳',3500);};
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
  const dt=Math.min(.06,Math.max(.001,(time-lastFrame)/1000||.016));
  lastFrame=time;
  state.elapsed+=dt;
  move(dt);
  const moving=Math.hypot(state.vx,state.vz)>.3;
  const bob=moving&&state.started&&!state.modal?Math.sin(stepPhase*2)*.047:0;
  const cx=state.x, cy=hill(state.x,state.z)+1.72+bob, cz=state.z;
  camera.position.set(cx,cy,cz);
  const fx=Math.sin(state.yaw)*Math.cos(state.pitch);
  const fy=Math.sin(state.pitch);
  const fz=-Math.cos(state.yaw)*Math.cos(state.pitch);
  camera.lookAt(cx+fx,cy+fy,cz+fz);
  const fog=state.night?[.31,.37,.45]:[.72,.78,.76];
  material.uniforms.uNight.value=state.night?1:0;
  material.uniforms.uFogColor.value.setRGB(...fog);
  renderer.setClearColor(new THREE.Color().setRGB(...fog),1);
  dami.update({x:state.x,z:state.z,yaw:state.yaw,elapsed:state.elapsed,walking:moving,visible:state.started});
  renderer.render(scene,camera);
  if(time-lastMap>180){lastMap=time;mapUpdate();nearUpdate();}
  if(lastToast&&time>lastToast){$('toast').classList.remove('visible');lastToast=0;}
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
console.info(`[Seoul Stroll Bukchon v0.6] Three.js ready: ${vertexCount.toLocaleString()} vertices, ${houseSites.length} hanok houses, ${paths.length} walkable lanes, ${locations.length} discoveries.`);
