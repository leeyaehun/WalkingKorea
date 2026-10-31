import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base='https://walkingkorea.leeyaehun.workers.dev';
const browser=await chromium.launch({
 headless:true,
 args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']
});
await fs.mkdir('qa-screenshots',{recursive:true});
let fatal=[];
async function inspect(url,file,action){
 const page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url,{waitUntil:'networkidle',timeout:60000});
 if(response.status()!==200)errors.push('HTTP '+response.status());
 await page.waitForTimeout(1400);
 if(action)await action(page,errors);
 await page.screenshot({path:'qa-screenshots/'+file,animations:'disabled'});
 const canvas=await page.locator('canvas').first().evaluate(e=>({width:e.width,height:e.height}));
 if(canvas.width===0||canvas.height===0)errors.push('Zero-size WebGL canvas');
 console.log(JSON.stringify({file,url,status:response.status(),canvas,errors}));
 if(errors.length)fatal.push(...errors.map(e=>file+': '+e));
 await page.close();
}
try{
 await inspect(base+'/character.html','dami-front.png',async(page)=>{
  await page.locator('[data-angle="0"]').click();await page.waitForTimeout(800);
  const ready=page.waitForEvent('download',{timeout:30000});
  await page.locator('#download-glb').click();
  const model=await ready;
  if(!model.suggestedFilename().endsWith('.glb'))errors.push('GLB download did not return a .glb filename');
  else console.log('GLB_DOWNLOAD=PASS '+model.suggestedFilename());
 });
 await inspect(base+'/character.html','dami-back.png',async(page)=>{
  await page.locator('[data-angle="180"]').click();await page.waitForTimeout(1000);
 });
 await inspect(base+'/','dami-in-game.png',async(page)=>{
  await page.locator('#start-btn').click();await page.waitForTimeout(900);
 });
}finally{await browser.close();}
if(fatal.length){console.error('LIVE_BROWSER_ERRORS',fatal);process.exitCode=1;}
else console.log('LIVE_BROWSER_QA=PASS');
