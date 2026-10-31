import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser=await chromium.launch({
 headless:true,
 args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']
});
await fs.mkdir('qa-screenshots',{recursive:true});
const page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('PAGE: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE: '+m.text());});
const base=process.env.WK_BASE_URL||'http://127.0.0.1:4173/';
const response=await page.goto(base+'?qa=1',{waitUntil:'networkidle',timeout:60000});
if(!response||response.status()!==200)errors.push('Bad page HTTP response');
await page.locator('#start-btn').click();
await page.waitForTimeout(500);
const sample=()=>page.evaluate(()=>window.__wkQA?.());
const start=await sample();
if(!start||start.mode!=='third-person')errors.push('Third-person QA state unavailable');
if(!start?.avatar?.visible)errors.push('Playable Dami hidden');
if(start&&Math.hypot(start.player[0]-start.avatar.position[0],start.player[1]-start.avatar.position[2])>.05)
 errors.push('Dami not anchored on player before movement');
await page.screenshot({path:'qa-screenshots/dami-thirdperson-start.png',animations:'disabled'});

await page.keyboard.down('w');
await page.waitForTimeout(900);
const stepA=await sample();
await page.waitForTimeout(650);
const stepB=await sample();
await page.waitForTimeout(1050);
const during=await sample();
await page.keyboard.up('w');
await page.screenshot({path:'qa-screenshots/dami-thirdperson-walk.png',animations:'disabled'});
await page.waitForTimeout(850);
const stopped=await sample();
await page.screenshot({path:'qa-screenshots/dami-thirdperson-stop.png',animations:'disabled'});

if(start&&during&&stopped){
 const startGait=start.avatar.gait,walkGait=during.avatar.gait,stopGait=stopped.avatar.gait;
 if(!startGait||!walkGait||!stopGait)errors.push('Procedural gait data unavailable');
 else {
  console.log(JSON.stringify({stepA:stepA?.avatar?.gait,stepB:stepB?.avatar?.gait,
    idle:startGait,moving:walkGait,stopped:stopGait}));
  if(startGait.paws.length!==4)errors.push('Dami lacks four articulated paws');
  if(!startGait.paws.every(p=>p.grounded))errors.push('At rest, not all paws are grounded');
  if(walkGait.traveled<.35)errors.push('Stride is not tied to real ground travel');
  if(stepA&&stepB&&stepB.avatar.gait.phase-stepA.avatar.gait.phase<.38)
    errors.push('Paw cycle does not advance while walking');
  if(!walkGait.paws.some(p=>p.y>.10))
    errors.push('No visible swinging paw lift');
  if(walkGait.contactCount<2)
    errors.push('Two diagonally planted paws are not maintained');
  if(stopGait.blend>.45)
    errors.push('Feet do not settle after releasing W');
 }
 const playerTravel=Math.hypot(during.player[0]-start.player[0],during.player[1]-start.player[1]);
 const modelTravel=Math.hypot(during.avatar.position[0]-start.avatar.position[0],during.avatar.position[2]-start.avatar.position[2]);
 const cameraTravel=Math.hypot(during.camera.camera[0]-start.camera.camera[0],during.camera.camera[2]-start.camera.camera[2]);
 console.log(JSON.stringify({playerTravel,modelTravel,cameraTravel,start,during,stopped}));
 if(playerTravel<.35)errors.push('W did not translate the player avatar (distance '+playerTravel.toFixed(3)+'m)');
 if(Math.abs(playerTravel-modelTravel)>.07)errors.push('Character and player positions diverged');
 if(cameraTravel>playerTravel+1.5)errors.push('Camera moves more than the character unexpectedly');
 if(Math.abs(during.avatar.heading)<1.4)errors.push('W did not turn Dami to face into village');
 if(Math.hypot(stopped.avatar.position[0]-stopped.player[0],stopped.avatar.position[2]-stopped.player[1])>.05)
   errors.push('Stopped player and avatar coordinates diverged');
 // Rotating the camera alone must not walk or rotate the character.
 // Stationary Dami must not keep treading in place.
 await page.waitForTimeout(550);
 const still=await sample();
 if(stopped?.avatar?.gait&&still?.avatar?.gait&&still.avatar.gait.phase-stopped.avatar.gait.phase>.15)
   errors.push('Feet keep cycling when the player is no longer moving');
 const beforeOrbit=await sample();
 await page.mouse.move(600,450);
 await page.mouse.down();
 await page.mouse.move(810,452,{steps:8});
 await page.mouse.up();
 await page.waitForTimeout(250);
 const afterOrbit=await sample();
 const orbitChange=Math.abs(afterOrbit.viewYaw-beforeOrbit.viewYaw);
 const movingWhileOrbit=Math.hypot(afterOrbit.player[0]-beforeOrbit.player[0],afterOrbit.player[1]-beforeOrbit.player[1]);
 console.log(JSON.stringify({orbitChange,movingWhileOrbit,beforeOrbit,afterOrbit}));
 if(orbitChange<.10)errors.push('Mouse did not rotate camera');
 if(movingWhileOrbit>.12)errors.push('Camera-only mouse input translated Dami');
 await page.screenshot({path:'qa-screenshots/dami-thirdperson-orbit.png',animations:'disabled'});
}

await page.goto(base+'character.html',{waitUntil:'networkidle'});
await page.locator('[data-angle="180"]').click();
await page.waitForTimeout(600);
await page.screenshot({path:'qa-screenshots/dami-360-viewer.png',animations:'disabled'});
await browser.close();
if(errors.length){console.error('THIRD_PERSON_QA_FAIL',JSON.stringify(errors));process.exitCode=1;}
else console.log('THIRD_PERSON_QA_PASS');
