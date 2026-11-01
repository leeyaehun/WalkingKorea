/**
 * Weather / background Step 03 — layered Seoul residential skyline.
 *
 * Deterministically authored, three depth bands: modest downtown blocks
 * near the hanok roof line, residential/apartment midline, and distant
 * office + apartment silhouettes. NOT a surveyed reconstruction of Seoul.
 *
 * Preserve a lower, irregular visual notch around the N Seoul Tower axis:
 * skyline geometry must frame the landmark, not hide the landmark base
 * behind 30m high foreground boxes. 3D balconies, frame recesses, rooftop
 * stairwells and parapets replace generic cuboids with painted windows.
 *
 * Reuse the one shared world mesh, atlas and existing colored material shader.
 * No vegetation, imported photo/texture, separate mesh or draw calls.
 */
export const SEOUL_VIEWPOINT = Object.freeze({x:-3,z:-42});
export const NAMSAN_VIEW_TARGET = Object.freeze({x:17,z:158});

export const SEOUL_BUILDINGS = Object.freeze([
  // x, z, width, depth, height, profile, palette; closest, varied lower city
  [-91,88,8,9,12,'mixed',0],[-80,86,9,8,16,'mixed',1],
  [-66,92,8,8,22,'apartment',0],[-52,88,10,8,17,'mixed',2],
  [-39,95,8,9,24,'apartment',1],[-28,89,9,7,16,'office',0],
  [-17,93,7,7,11,'mixed',1],[-7,90,8,7,7,'mixed',0],
  [6,94,7,7,7.5,'mixed',2],[22,90,7,7,8,'mixed',1],
  [37,90,8,8,18,'apartment',1],[51,89,11,9,21,'office',2],
  [66,93,8,9,17,'mixed',1],[81,88,10,9,25,'apartment',0],
  [95,96,8,9,15,'mixed',2],

  // Midcity slab apartments, mid-rise offices, lower buildings at view axis.
  [-97,111,8,8,22,'apartment',1],[-83,107,10,10,32,'apartment',0],
  [-69,112,8,8,28,'office',2],[-55,109,9,10,33,'apartment',2],
  [-40,110,11,10,23,'mixed',1],[-27,113,8,9,17,'office',0],
  [-14,109,7,8,10,'mixed',2],[-1,111,7,8,8,'mixed',0],
  [18,112,7,8,11,'mixed',1],[42,106,11,10,29,'apartment',1],
  [57,109,10,10,36,'apartment',0],[71,111,7,10,24,'office',2],
  [87,105,9,9,32,'apartment',2],[100,109,7,8,21,'mixed',1],

  // Receding third skyline, facades use fewer panels at distance.
  [-88,119,8,7,39,'apartment',2],[-71,117,9,8,31,'office',1],
  [-53,118,9,8,36,'apartment',0],[-35,121,9,8,30,'apartment',1],
  [-18,119,7,8,18,'mixed',0],[-5,118,7,8,10,'mixed',1],
  [23,120,7,7,11,'mixed',2],[50,119,9,8,35,'apartment',1],
  [67,120,8,8,43,'apartment',0],[86,117,9,9,38,'office',2]
]);

export function projectedTowerAxis(z,from=SEOUL_VIEWPOINT,to=NAMSAN_VIEW_TARGET) {
  const t=(z-from.z)/(to.z-from.z);
  return from.x+(to.x-from.x)*t;
}

export function skylineViewClearance(b) {
  const [x,z,w,,h]=b;
  const distance=Math.max(0,Math.abs(x-projectedTowerAxis(z))-w*.5);
  // Nearby tall structures can flank the tower, but avoid a giant, straight
  // opening. Low urban roof shapes are still present within the notch.
  return distance>8.8||h<=12.0;
}

export function buildSeoulSkyline({box,face}) {
  const stats={buildings:0,apartments:0,offices:0,mixed:0,
    windowPanels:0,balconies:0,roofDetails:0,frames:0,buildingsByDepth:[0,0,0]};
  const layouts=[];
  const facings=[];
  const tones=[
    {wall:'cityConcreteA',edge:'cityShadowA',band:'cityTrimA'},
    {wall:'cityConcreteB',edge:'cityShadowB',band:'cityTrimB'},
    {wall:'cityConcreteC',edge:'cityShadowC',band:'cityTrimC'}
  ];

  function front(x,y,z,w,h,color) {
    face([x-w*.5,y-h*.5,z],[x+w*.5,y-h*.5,z],
         [x+w*.5,y+h*.5,z],[x-w*.5,y+h*.5,z],[0,0,-1],color);
  }

  for(let index=0;index<SEOUL_BUILDINGS.length;index++){
    const [x,z,w,d,height,profile,palette]=SEOUL_BUILDINGS[index];
    if(!skylineViewClearance(SEOUL_BUILDINGS[index]))
      throw new Error('Seoul skyline blocks landmark view: '+index);
    if(!Number.isFinite(height)||height<=0)throw new Error('Invalid skyline height');
    stats.buildings++;
    stats[profile==='mixed'?'mixed':profile==='office'?'offices':'apartments']++;
    const depthBand=z<100?0:z<116?1:2;
    stats.buildingsByDepth[depthBand]++;
    const tone=tones[palette];
    const frontZ=z-d*.5-.018;
    const floors=Math.max(2,Math.floor((height-1.0)/2.65));
    const floorSpacing=(height-.95)/floors;
    const columns=Math.max(2,Math.floor((w-1.15)/1.7));
    const colSpacing=(w-.75)/columns;
    const isFar=depthBand===2;
    const panelsByFloor=isFar?2:1;
    const apartment=profile==='apartment';
    const office=profile==='office';

    // Alternating vertical facade ribbons, not just a grey painted block.
    box(x,height*.5,z,w,height,d,tone.wall);
    box(x-w*.5+.12,height*.5,frontZ-.09,.19,height,.20,tone.edge);
    box(x+w*.5-.12,height*.5,frontZ-.09,.19,height,.20,tone.edge);
    if(index%3===0) {
      const offset=x+w*.30;
      box(offset,height*.5,frontZ-.035,.52,height,.10,tone.band);
      stats.frames++;
    }
    // Thin dark plinth and small layered base visually anchor the slab.
    box(x,.43,z,w+.15,.85,d+.2,'cityPodium');
    const crown=height+.15;
    box(x,crown,z,w+.26,.31,d+.25,tone.band);
    box(x,height+.42,z,w-.27,.24,d-.24,'cityParapet');
    stats.roofDetails+=2;

    // Korean rooftop stairwell enclosures and ordinary HVAC cabinets.
    if(index%4!==1) {
      const rw=Math.min(2.8,w*.34);
      const rh=1.9+(index%3)*.32;
      const rx=x+(index%2?-.2:.2);
      box(rx,height+rh*.5+.45,z+d*.15,rw,rh,Math.min(2.6,d*.5),
        index%2===0?'cityRoofHouse':'cityUtility');
      box(rx,height+rh+.5,z+d*.15,rw+.2,.19,Math.min(2.8,d*.54),'cityParapet');
      stats.roofDetails+=2;
    }
    if(index%3!==0){
      for(let k=0;k<2;k++) {
        const px=x+(k===0?-1:1)*w*.31;
        box(px,height+.62,z+d*.17,.62,.82,.68,'cityUtility');
        stats.roofDetails++;
      }
    }

    // Unit rhythm: recess-like dark windows, cream mullions and balcony
    // ledges. Balcony elements project from the front plane and cast real
    // roof-shadow-map silhouettes instead of being pixel decals.
    for(let f=0;f<floors;f+=panelsByFloor) {
      const cy=.85+(f+.44)*floorSpacing;
      const windowH=Math.min(1.42,floorSpacing*.57);
      const floorWidth=w-.44;
      if(f>0) {
        box(x,cy-floorSpacing*.46,frontZ-.07,floorWidth,.09,.17,tone.band);
        stats.frames++;
      }
      for(let c=0;c<columns;c++){
        const wx=x-(columns-1)*colSpacing*.5+c*colSpacing;
        const blank=(c===columns-1&&index%3===0);
        if(blank) {
          front(wx,cy,frontZ-.032,colSpacing*.70,windowH*.89,'cityStairwell');
          stats.windowPanels++;
          continue;
        }
        // Window panels use cool desaturated glass, no fake night emission
        // (the separately planned lighting step will handle emissive glow).
        const glass=((index+c+f)%7===0)?'cityGlassWarm':
          ((index+c*3+f)%4===0)?'cityGlassPale':'cityGlassBlue';
        // Fixed, sparse occupied-window pattern: no synchronized rows or
        // blinking random numbers, and no warm light in daytime.
        const occupied=((index*29+c*17+f*11)%19);
        const windowType=occupied<4?'cityLitWindowWarm':
          occupied<6?'cityLitWindowCool':glass;
        front(wx,cy,frontZ-.037,colSpacing*.67,windowH,windowType);
        stats.windowPanels++;
        if(!isFar) {
          box(wx,cy,frontZ-.074,.045,windowH,.10,'cityWindowFrame');
          box(wx,cy-windowH*.5,frontZ-.072,colSpacing*.69,.065,.11,'cityWindowFrame');
          stats.frames+=2;
        }
        if(apartment && f%2===(index%2) && (c+index)%3!==1) {
          const ledgeZ=frontZ-.35;
          box(wx,cy-windowH*.5-.13,ledgeZ,colSpacing*.74,.15,.65,'cityBalconySlab');
          box(wx,cy-windowH*.5+.22,ledgeZ-.26,colSpacing*.75,.57,.065,'cityBalconyRail');
          stats.balconies++;
        }
        if(office && c%2===0 && !isFar) {
          box(wx+colSpacing*.35,cy,frontZ-.076,.058,windowH+.12,.12,
            'cityWindowFrame');
          stats.frames++;
        }
      }
    }

    // A few side glazing bands make orbit/parallax believable.
    if(!isFar) {
      const rightX=x+w*.5+.021;
      for(let f=1;f<floors;f+=2) {
        const wy=.85+(f+.44)*floorSpacing;
        face([rightX,wy-.51,z-d*.25],[rightX,wy-.51,z+d*.25],
          [rightX,wy+.51,z+d*.25],[rightX,wy+.51,z-d*.25],
          [1,0,0],'cityGlassPale');
        stats.windowPanels++;
      }
    }
    layouts.push({index,x,z,w,d,height,profile,palette,depthBand,floors,columns});
    facings.push({x,z,h:height,closest:Math.abs(x-projectedTowerAxis(z))-w*.5});
  }

  return {...stats,layouts,facings};
}
