/**
 * Bukchon street masonry and giwa end-caps.
 * Real lightweight procedural geometry; the street-facing facade is local -Z.
 * Brick and granite are laid as shallow relief, with contrasting mortar gaps.
 */
export function createBukchonMasonry({box, face, sphere, roofHeight, roofHalfWidth, eave}) {
  function streetMasonry(cx, z, width, height=1.62) {
    const front=z-.207;
    const base=.48, stoneTop=Math.min(height-.37,1.05);
    const brickTop=Math.min(height-.13,1.62);
    box(cx,(base+stoneTop)*.5,front,width-.11,stoneTop-base,.047,'mortar');
    for(let row=0;row<3;row++) {
      const y0=base+(stoneTop-base)*row/3+.014;
      const y1=base+(stoneTop-base)*(row+1)/3-.014;
      const count=Math.max(3,Math.round(width/.38));
      for(let col=0;col<=count;col++) {
        const stagger=(row%2)*.5;
        const x0=Math.max(cx-width*.5+.035,cx-width*.5+(col-stagger)*width/count+.023);
        const x1=Math.min(cx+width*.5-.035,cx-width*.5+(col+1-stagger)*width/count-.023);
        if(x1<=x0)continue;
        const tone=(row+col)%5===0?'stoneGrey':(row+col)%3===0?'stoneWarm':'stoneMasonry';
        face([x0,y0,front-.029],[x1,y0,front-.029],
             [x1,y1,front-.029],[x0,y1,front-.029],[0,0,-1],tone);
      }
    }
    box(cx,(stoneTop+brickTop)*.5,front,width-.11,brickTop-stoneTop,.05,'mortar');
    for(let row=0;row<4;row++) {
      const y0=stoneTop+(brickTop-stoneTop)*row/4+.012;
      const y1=stoneTop+(brickTop-stoneTop)*(row+1)/4-.012;
      const count=Math.max(4,Math.round(width/.28));
      for(let col=0;col<=count;col++) {
        const stagger=(row%2)*.5;
        const x0=Math.max(cx-width*.5+.035,cx-width*.5+(col-stagger)*width/count+.013);
        const x1=Math.min(cx+width*.5-.035,cx-width*.5+(col+1-stagger)*width/count-.013);
        if(x1<=x0)continue;
        const tone=(row+col)%5===0?'brickDark':(row+col)%3===0?'brickWarm':'brickTerracotta';
        face([x0,y0,front-.034],[x1,y0,front-.034],
             [x1,y1,front-.034],[x0,y1,front-.034],[0,0,-1],tone);
      }
    }
    box(cx,stoneTop,front-.035,width-.10,.048,.075,'mortar');
    box(cx,brickTop,front-.035,width-.10,.044,.070,'mortar');
  }

  function sideMasonry(x) {
    const side=x>0?1:-1, surface=x+side*.184;
    const length=6.58,zStart=-3.46;
    for(let row=0;row<3;row++) {
      const y0=.38+row*.225,y1=y0+.203;
      for(let col=0;col<15;col++) {
        const z0=zStart+(col+(row%2)*.5)*length/15+.026;
        const z1=Math.min(zStart+length,z0+length/15-.056);
        if(z1<=z0)continue;
        face([surface,y0,z0],[surface,y1,z0],[surface,y1,z1],[surface,y0,z1],
             [side,0,0],(row+col)%4===0?'stoneGrey':'stoneMasonry');
      }
    }
    for(let row=0;row<3;row++) {
      const y0=1.06+row*.20,y1=y0+.175;
      for(let col=0;col<13;col++) {
        const z0=zStart+(col+(row%2)*.5)*length/13+.029;
        const z1=Math.min(zStart+length,z0+length/13-.06);
        if(z1<=z0)continue;
        face([surface,y0,z0],[surface,y1,z0],[surface,y1,z1],[surface,y0,z1],
             [side,0,0],(row+col)%5===0?'brickDark':'brickTerracotta');
      }
    }
  }

  function roofCaps() {
    // Rounded convex giwa ends; backed by the existing curved roof surface.
    for(const side of [-1,1]) {
      for(let i=0;i<22;i++) {
        const x=-roofHalfWidth+(i+.5)*roofHalfWidth*2/22;
        sphere(x,roofHeight(x,side*eave)+.02,side*(eave+.15),
               .12,.10,.085,i%4===0?'tileLight':'tileEnd',7,4);
      }
    }
  }
  return {streetMasonry,sideMasonry,roofCaps};
}
