/**
 * Weather Step 06 — conservative adaptive pixel budget.
 *
 * Pixel ratio dominates both sky shader work and the fragment-heavy combined
 * city material. Lower resolution only after sustained poor animation
 * cadence, not after a single hitch. Restore slowly with hysteresis.
 *
 * This is a frame-cadence heuristic, NOT a GPU timer or a benchmark.
 * Postcards intentionally keep preserveDrawingBuffer enabled in the renderer.
 */
export function createBukchonRenderBudget({
  renderer,devicePixelRatio=1,isTouch=false
}) {
  const ceiling=Math.min(Math.max(.5,devicePixelRatio),isTouch?1.2:1.6);
  const floor=Math.min(ceiling,isTouch?.8:1.0);
  let pixelRatio=ceiling;
  let count=0,totalMs=0,averageMs=0,changes=0,lastChange=-Infinity;
  let evaluatedFps=0;

  renderer.setPixelRatio(pixelRatio);

  function observe(dtMs,nowMs,{playing=true,visible=true}={}) {
    // RAF hidden-tab pauses, mouse/OS stalls, and the intro overlay
    // are not evidence of a slow GPU. Ignore rather than downscale.
    if(!playing||!visible||!Number.isFinite(dtMs)||dtMs<4||dtMs>120){
      count=0;totalMs=0;return false;
    }
    count++;
    totalMs+=dtMs;
    // Aggregate 120 normal animation frames before evaluating performance.
    if(count<120)return false;
    averageMs=totalMs/count;
    evaluatedFps=1000/averageMs;
    count=0;totalMs=0;
    let next=pixelRatio;
    const cooldown=nowMs-lastChange;
    if(averageMs>23.5 && cooldown>2600){
      next=Math.max(floor,pixelRatio-.15);
    } else if(averageMs<17.2 && cooldown>8000){
      next=Math.min(ceiling,pixelRatio+.10);
    }
    next=Math.round(next*100)/100;
    if(Math.abs(next-pixelRatio)<.015)return false;
    pixelRatio=next;
    lastChange=nowMs;
    changes++;
    renderer.setPixelRatio(pixelRatio);
    return true;
  }
  return {
    observe,
    getStatus(){return {pixelRatio,ceiling,floor,changes,evaluatedFps,
      sampledFrames:count,averageMs};}
  };
}
