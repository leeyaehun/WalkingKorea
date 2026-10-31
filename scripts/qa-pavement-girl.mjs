import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.WK_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,args:[
 '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--no-sandbox'
]});
await fs.mkdir('qa-screenshots',{recursive:true});
const errors=[];
let summaries=[];
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push('PAGE: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE: '+m.text())});
const response=await page.goto(base+'?qa=1',{waitUntil:'networkidle',timeout:60000});
if(response?.status()!==200)errors.push('Non-200 homepage');
await page.waitForFunction(()=>!!window.__wkQA?.());
const first=await page.evaluate(()=>window.__wkQA());
if(first.paving?.tiles<100||first.paving?.drains<5)
 errors.push('Stone paving missing '+JSON.stringify(first.paving));
if(first.selectedAvatar!=='dami')errors.push('Initial avatar mismatch');
if(await page.locator('[data-avatar="girl"]').count()!==1)errors.push('Girl avatar choice unavailable');
await page.screenshot({path:'qa-screenshots/intro-character-picker.png',animations:'disabled'});
await page.locator('[data-avatar="girl"]').click();
await page.waitForTimeout(200);
const selected=await page.evaluate(()=>window.__wkQA());
if(selected.selectedAvatar!=='girl')errors.push('Choosing girl failed');
if((await page.locator('#avatar-name').textContent())!=='서울 산책자')errors.push('Girl HUD label missing');
await page.locator('#start-btn').click();
await page.waitForFunction(()=>window.__wkQA?.().avatar?.visible,{timeout:30000});
await page.waitForTimeout(350);
let still=await page.evaluate(()=>window.__wkQA());
await page.screenshot({path:'qa-screenshots/girl-on-stone-pavement.png',animations:'disabled'});
await page.keyboard.down('w');
await page.waitForTimeout(2000);
let moved=await page.evaluate(()=>window.__wkQA());
await page.keyboard.up('w');
await page.screenshot({path:'qa-screenshots/girl-walking-on-paved-lane.png',animations:'disabled'});
const distance=Math.hypot(moved.player[0]-still.player[0],moved.player[1]-still.player[1]);
if(distance<.25)errors.push('Girl character did not walk: '+distance);
if(Math.hypot(moved.avatar.position[0]-moved.player[0],moved.avatar.position[2]-moved.player[1])>.08)
 errors.push('Girl not aligned with player position');
await page.locator('#switch-avatar').click();
await page.locator('#modal-dami').click();
await page.waitForFunction(()=>{const s=window.__wkQA?.();return s?.selectedAvatar==='dami'&&s?.avatar?.visible;},{timeout:15000});
await page.waitForTimeout(280);
const switched=await page.evaluate(()=>window.__wkQA());
if(switched.selectedAvatar!=='dami'||!switched.avatar.visible)
 errors.push('In-game character switching failed');
await page.screenshot({path:'qa-screenshots/dami-on-new-paving.png',animations:'disabled'});
summaries.push({paving:initialSafe(first.paving),selectedGirl:selected.selectedAvatar,distance,switched:switched.selectedAvatar});

function initialSafe(p){return {tiles:p?.tiles,drains:p?.drains};}
const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
mobile.on('pageerror',e=>errors.push('MOBILE: '+e.message));
await mobile.goto(base+'?qa=1',{waitUntil:'networkidle',timeout:60000});
await mobile.locator('[data-avatar="girl"]').click();
await mobile.screenshot({path:'qa-screenshots/mobile-character-choice.png',animations:'disabled'});
await mobile.locator('#start-btn').click();
await mobile.waitForTimeout(450);
await mobile.screenshot({path:'qa-screenshots/mobile-girl-on-pavement.png',animations:'disabled'});
const mobileAvatar=await mobile.evaluate(()=>window.__wkQA?.().selectedAvatar);
if(mobileAvatar!=='girl')errors.push('Mobile selection lost');
// Release two live WebGL renderers before opening the separate studio;
// SwiftShader otherwise stalls screenshot readbacks on CI machines.
await page.close();
await mobile.close();
// Rotate the real girl mesh from front to back in a dedicated GLB-ready studio.
const studio=await browser.newPage({viewport:{width:900,height:700},deviceScaleFactor:1,acceptDownloads:true});
studio.on('pageerror',e=>errors.push('GIRL STUDIO: '+e.message));
const studioResponse=await studio.goto(base+'girl.html',{waitUntil:'networkidle',timeout:60000});
if(studioResponse?.status()!==200)errors.push('Girl studio not served');
await studio.waitForTimeout(450);
await studio.screenshot({path:'qa-screenshots/girl-studio-front.png',animations:'disabled',timeout:60000});
await studio.locator('[data-angle="180"]').click();
await studio.waitForTimeout(700);
await studio.screenshot({path:'qa-screenshots/girl-studio-back.png',animations:'disabled',timeout:60000});
const filePromise=studio.waitForEvent('download',{timeout:35000});
await studio.locator('#download-glb').click();
const file=await filePromise;
if(!file.suggestedFilename().endsWith('.glb'))errors.push('Girl GLB download name incorrect');
else {
 await file.saveAs('qa-screenshots/WalkingKorea_SeoulGirl_v010.glb');
 const stats=await fs.stat('qa-screenshots/WalkingKorea_SeoulGirl_v010.glb');
 if(stats.size<60000)errors.push('Girl GLB export too small: '+stats.size);
 summaries.push({girlGlbBytes:stats.size});
}
await studio.close();
await browser.close();
console.log(JSON.stringify({check:'paving-and-girl-v010',summaries,errors}));
if(errors.length)process.exitCode=1;
else console.log('PAVING_GIRL_QA_PASS');
