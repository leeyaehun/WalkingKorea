import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.WK_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const errors=[];
await fs.mkdir('qa-screenshots',{recursive:true});
const page=await browser.newPage({viewport:{width:1330,height:880},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push('game: '+e.message));
page.on('response',r=>{if(r.url().includes('/sprites/')&&r.status()!==200)errors.push('sprite HTTP '+r.status()+' '+r.url());});
try {
 await page.goto(base+'?qa=1',{waitUntil:'networkidle',timeout:60000});
 await page.locator('[data-avatar="girl"]').click();
 await page.locator('#start-btn').click();
 await page.waitForFunction(()=>{const x=window.__wkQA?.();return x?.selectedAvatar==='girl' && x?.avatar?.textureReady && x?.avatar?.visible && x?.avatar?.position?.[2]>20;},null,{timeout:30000});
 await page.waitForTimeout(450);
 const before=await page.evaluate(()=>window.__wkQA());
 if(before.avatar.rendering!=='2.5d-sprite')errors.push('3D model still active instead of 2.5D sprite');
 if(before.avatar.errors.length)errors.push('Sprite load: '+before.avatar.errors.join(', '));
 if(!['front','front45','side','back45','back'].includes(before.avatar.direction))errors.push('invalid facing row');
 await page.screenshot({path:'qa-screenshots/girl-25d-idle.png',animations:'disabled',timeout:60000});
 await page.keyboard.down('w');
 await page.waitForTimeout(2200);
 const during=await page.evaluate(()=>window.__wkQA());
 await page.screenshot({path:'qa-screenshots/girl-25d-walking.png',animations:'disabled',timeout:60000});
 await page.keyboard.up('w');
 await page.waitForFunction(()=>window.__wkQA?.().avatar?.pose==='idle',null,{timeout:30000});
 const stopped=await page.evaluate(()=>window.__wkQA());
 if(during.avatar.totalTravel-before.avatar.totalTravel<.23)errors.push('Character did not move');
 if(during.avatar.distancePhase-before.avatar.distancePhase<.5)errors.push('Walk frames did not advance from movement');
 if(during.avatar.pose!=='walk')errors.push('Walk animation not playing');
 if(stopped.avatar.pose!=='idle')errors.push('Idle not restored after stopping');
 const travel=Math.hypot(during.avatar.position[0]-before.avatar.position[0],during.avatar.position[2]-before.avatar.position[2]);
 if(travel<.23)errors.push('Avatar position not driven by WASD');
 const link=await page.locator('#avatar-preview-link').getAttribute('href');
 if(link!=='/sprite.html')errors.push('Girl preview link points to obsolete 3D studio');
 console.log(JSON.stringify({duringPose:during.avatar.pose,frame:during.avatar.frame,view:during.avatar.direction,travel,phase: during.avatar.distancePhase,stoppedPose:stopped.avatar.pose}));

 const gallery=await browser.newPage({viewport:{width:1152,height:820},deviceScaleFactor:1});
 gallery.on('pageerror',e=>errors.push('studio: '+e.message));
 await gallery.goto(base+'sprite.html',{waitUntil:'networkidle',timeout:60000});
 await gallery.waitForFunction(()=>!document.querySelector('#status').textContent.includes('불러오는 중'),{timeout:15000});
 await gallery.screenshot({path:'qa-screenshots/girl-sprite-studio-front.png',animations:'disabled',timeout:60000});
 await gallery.locator('[data-direction="4"]').click();
 await gallery.locator('[data-pose="walk"]').click();
 await gallery.waitForTimeout(500);
 await gallery.screenshot({path:'qa-screenshots/girl-sprite-studio-back-walk.png',animations:'disabled',timeout:60000});
 if(!(await gallery.locator('#status').textContent()).includes('후면'))errors.push('Studio direction switch failed');
 await gallery.close();
} catch(e) {errors.push(e.stack||String(e))}
finally {await browser.close();}
if(errors.length){console.error('SPRITE_QA_FAIL',JSON.stringify(errors));process.exitCode=1;}
else console.log('SPRITE_QA_PASS');
