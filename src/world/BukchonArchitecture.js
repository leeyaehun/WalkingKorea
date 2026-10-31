/**
 * Phase 02: 3D architectural silhouettes for Bukchon-style houses.
 * Geometry only. Shared colors are the existing HanokKit materials; this is
 * deliberately NOT the materials / texture / lighting phase.
 *
 * Local axes: street frontage is -Z. All heights are local metres.
 */
export function createHanokArchitecture({box,face,sphere,roofHeight,roofHalfWidth,eave,span}) {
  const roofY=(x,z)=>roofHeight(x,z);

  function pitchedEavesAndHips() {
    const sideLength=roofHalfWidth*2;
    // The roof needs thickness and under-structure to read as a roof rather
    // than a paper surface, especially in the silhouette against the sky.
    for(const side of [-1,1]){
      for(let i=0;i<18;i++){
        const x0=-roofHalfWidth+i*sideLength/18;
        const x1=-roofHalfWidth+(i+1)*sideLength/18;
        const y0=roofY(x0,side*eave),y1=roofY(x1,side*eave);
        const depth=.18;
        face([x0,y0,side*(eave+.045)],[x1,y1,side*(eave+.045)],
             [x1,y1-depth,side*(eave+.045)],[x0,y0-depth,side*(eave+.045)],
             [0,0,side], 'tileRidge');
        // The eave underside is a lighter timber soffit.
        const zi=side*2.89,zo=side*(eave+.03);
        face([x0,roofY(x0,zi)-.21,zi],[x1,roofY(x1,zi)-.21,zi],
             [x1,y1-.18,zo],[x0,y0-.18,zo],[0,-1,0],'woodShade');
      }
      // Exposed roof rafters are deep enough to be visible from the alley.
      for(let i=0;i<15;i++){
        const x=-roofHalfWidth+.18+i*(sideLength-.36)/14;
        const zInner=side*2.88,zOuter=side*(eave+.055);
        const yInner=roofY(x,zInner)-.18,yOuter=roofY(x,side*eave)-.18;
        const hw=.067;
        face([x-hw,yInner,zInner],[x+hw,yInner,zInner],
             [x+hw,yOuter,zOuter],[x-hw,yOuter,zOuter],
             [0,-1,0],'timber');
        box(x,yInner-.07,zInner,.17,.14,.20,'timberLight');
      }
    }

    // End fascia at the left and right roof verge. An inward-framed inset
    // gable replaces the old floating triangular plaster billboard.
    for(const side of [-1,1]){
      for(let i=0;i<18;i++){
        const z0=-eave+i*eave*2/18;
        const z1=-eave+(i+1)*eave*2/18;
        const x=side*roofHalfWidth;
        face([x,roofY(x,z0),z0],[x,roofY(x,z1),z1],
             [x,roofY(x,z1)-.17,z1],[x,roofY(x,z0)-.17,z0],
             [side,0,0],'tileRidge');
      }
      const x=side*(span*.5+.095);
      box(x,3.15,0,.11,.60,5.10,'timber');
      box(x,3.20,0,.070,.49,4.77,'plaster');
      for(const z of [-2.2,0,2.2]) {
        box(x,3.30,z,.095,.58,.10,'timberLight');
      }
    }

    // Four curved hip ribs run from the short ridge to the lifted corners.
    // Each is a shallow raised 3D ribbon that follows the actual roof.
    const ridgeEnd=2.35;
    for(const sx of [-1,1])for(const sz of [-1,1]){
      for(let step=0;step<9;step++){
        const t0=step/9,t1=(step+1)/9;
        const points=[t0,t1].map(t=>{
          const x=sx*(ridgeEnd+(roofHalfWidth-ridgeEnd)*t);
          const z=sz*(eave*t);
          return {x,z,y:roofY(x,z)+.095};
        });
        const [a,b]=points,half=.092;
        face([a.x-half,a.y,a.z],[a.x+half,a.y,a.z],
             [b.x+half,b.y,b.z],[b.x-half,b.y,b.z],[0,1,0],'tileRidge');
      }
    }
    // A more substantial ridge with terminating ornamental end caps.
    box(0,4.18,0,ridgeEnd*2+.40,.18,.33,'tileRidge');
    for(const sx of [-1,1]){
      sphere(sx*(ridgeEnd+.13),4.23,0,.23,.17,.21,'tileDark',8,4);
    }
  }

  function gateRoof() {
    // An actual two-pitched entry canopy, instead of a flat shelf.
    // Gate beam stays below the canopy so the entrance still reads clearly.
    const halfWidth=1.67,halfDepth=.69,zc=-4.29,peak=2.87;
    const profile=(x,z)=>{
      const slope=Math.abs((z-zc)/halfDepth);
      const uplift=Math.pow(Math.abs(x/halfWidth),3)*.085*slope;
      return peak-.38*slope+uplift;
    };
    for(const side of [-1,1]) {
      for(let row=0;row<4;row++){
        const z0=zc+side*halfDepth*row/4;
        const z1=zc+side*halfDepth*(row+1)/4;
        for(let col=0;col<10;col++){
          const x0=-halfWidth+col*halfWidth*2/10;
          const x1=-halfWidth+(col+1)*halfWidth*2/10;
          face([x0,profile(x0,z0),z0],[x1,profile(x1,z0),z0],
               [x1,profile(x1,z1),z1],[x0,profile(x0,z1),z1],
               [0,1,0],col%3===0?'tileLight':'tileBase');
        }
      }
      // Eave face with real thickness and a below-eave wooden edge.
      const z=zc+side*halfDepth;
      for(let col=0;col<10;col++) {
        const x0=-halfWidth+col*halfWidth*2/10;
        const x1=-halfWidth+(col+1)*halfWidth*2/10;
        const y0=profile(x0,z),y1=profile(x1,z);
        face([x0,y0,z],[x1,y1,z],
             [x1,y1-.13,z],[x0,y0-.13,z],[0,0,side],'tileRidge');
      }
      box(0,2.42,zc+side*.54,3.15,.10,.12,'timber');
    }
    box(0,2.95,zc,3.04,.13,.22,'tileRidge');
    // Structural beam and brackets below the sloped roof.
    box(0,2.40,zc,2.75,.15,.35,'woodShade');
    for(const x of [-1.20,1.20]) {
      box(x,2.33,zc,.30,.28,.43,'timber');
      box(x,2.19,zc,.20,.12,.36,'timberLight');
    }
  }

  function wallCoping(cx,z,width,height) {
    // A coping is a roof-like object: two narrow pitched faces + shadow
    // instead of one dark rectangular slab pasted on a plaster box.
    const y=height+.19, half=.29;
    box(cx,y-.13,z,width+.24,.095,half*2,'woodShade');
    for(const side of [-1,1]) {
      face([cx-width*.5-.13,y+.10,z],[cx+width*.5+.13,y+.10,z],
           [cx+width*.5+.13,y-.085,z+side*half],
           [cx-width*.5-.13,y-.085,z+side*half],[0,1,0],'tileDark');
      for(let i=0;i<Math.max(3,Math.round(width/.44));i++){
        const x=cx-width*.5+(i+.5)*width/Math.max(3,Math.round(width/.44));
        box(x,y-.065,z+side*(half+.015),.25,.085,.13,'tileRidge');
      }
    }
  }

  function openPorchGate() {
    // Distinct open timber portal with physical roof, for exposed-front
    // houses. It must not obscure the recessed front windows.
    for(const x of [-1.38,1.38]) {
      box(x,1.13,-3.91,.16,2.18,.27,'timber');
      box(x,.22,-3.91,.34,.38,.38,'stoneFoundation');
      box(x,2.20,-3.91,.32,.28,.41,'timberLight');
    }
    box(0,2.27,-3.91,3.02,.18,.30,'woodShade');
    // No doors; this is an actual opening to the little porch.
    for(const side of [-1,1]) {
      const z=-3.91+side*.37;
      face([-1.64,2.52,-3.91],[1.64,2.52,-3.91],
           [1.64,2.37,z],[-1.64,2.37,z],[0,1,0],'tileDark');
      box(0,2.37,z,3.34,.085,.09,'tileRidge');
    }
  }

  return { pitchedEavesAndHips,gateRoof,wallCoping,openPorchGate };
}
