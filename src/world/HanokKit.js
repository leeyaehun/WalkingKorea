/**
 * Bukchon Hanok Set v1 — three street-facing silhouettes.
 *
 * Procedural, deliberately low-poly geometry: the supplied primitives use
 * BukchonWorld's local building frame and hillside adjustment. No purchased
 * assets or external textures are required.
 *
 * Local axes: -Z faces the walking lane, Y is metres above the site's terrain.
 */
export function createHanokKit({ box, face, sphere, cylinder, textured, signs }) {
  const span = 6.25;
  const eave = 3.54;
  const roofHalfWidth = (span + 1.28) / 2;

  function roofHeight(x, z) {
    const t = Math.min(1, Math.abs(z) / eave);
    const corner = Math.pow(Math.min(1, Math.abs(x) / roofHalfWidth), 3);
    // A shallow, continuously rolling tiled roof with quietly lifted corners.
    return 4.00 - 0.16 * t - 0.78 * Math.sin(t * Math.PI * 0.5) + 0.21 * Math.pow(t, 4) * corner;
  }

  function pitchedRoof() {
    const columns = 16;
    const courses = 9;
    for (const side of [-1, 1]) {
      for (let row = 0; row < courses; row++) {
        const z0 = side * eave * row / courses;
        const z1 = side * eave * (row + 1) / courses;
        for (let col = 0; col < columns; col++) {
          const x0 = -roofHalfWidth + col * roofHalfWidth * 2 / columns;
          const x1 = -roofHalfWidth + (col + 1) * roofHalfWidth * 2 / columns;
          const tileColor = col % 4 === 0 ? 'tileLight' : col % 4 === 1 ? 'tileBase' : 'tileDark';
          face([x0, roofHeight(x0,z0), z0], [x1, roofHeight(x1,z0), z0],
               [x1, roofHeight(x1,z1), z1], [x0, roofHeight(x0,z1), z1], [0,1,0], tileColor);
          // Raised longitudinal seams suggest convex tile rows without using
          // separate meshes for every individual roof tile.
          if (col % 2 === 0) {
            const seamX = x0 + .035;
            face([seamX, roofHeight(seamX,z0)+.025,z0], [seamX+.062,roofHeight(seamX+.062,z0)+.025,z0],
                 [seamX+.062,roofHeight(seamX+.062,z1)+.025,z1], [seamX,roofHeight(seamX,z1)+.025,z1],
                 [0,1,0], 'tileLight');
          }
          // A slight separation line at each overlapping row.
          if (row % 2 === 0) {
            const z = z1 - side * .035;
            face([x0,roofHeight(x0,z)+.012,z], [x1,roofHeight(x1,z)+.012,z],
                 [x1,roofHeight(x1,z)+.034,z+side*.044], [x0,roofHeight(x0,z)+.034,z+side*.044],
                 [0,1,0], 'tileRidge');
          }
        }
      }
      // Thin curled eaves, exposed wooden soffit and evenly spaced rafters.
      for (let col = 0; col < columns; col++) {
        const x = -roofHalfWidth + (col+.5) * roofHalfWidth*2/columns;
        box(x, roofHeight(x,side*eave)-.061, side*(eave+.06), roofHalfWidth*2/columns-.012,.10,.12,'tileRidge');
        if (col%2===0) box(x,roofHeight(x,side*eave)-.12,side*(eave+.13),.20,.11,.16,'tileLight');
      }
      box(0,2.90,side*3.18,span+.75,.13,.15,'timber');
      for (let x=-3.04;x<=3.05;x+=.72) box(x,2.86,side*3.17,.105,.19,.72,'timberLight');
    }
    box(0,4.07,0,span+1.52,.14,.29,'tileRidge');
    for (let x=-roofHalfWidth+.20;x<roofHalfWidth;x+=.44)
      box(x,4.16,0,.30,.08,.35,'tileLight');

    // The narrow timber-framed triangular gables stop the building reading as
    // a floating dark slab, particularly when approached from the side.
    for (const side of [-1,1]) {
      const x=side*(span*.5+.07);
      face([x,2.96,-2.88],[x,2.96,2.88],[x,3.96,0],[x,3.96,0],[side,0,0],'plaster');
      box(x,2.98,0,.11,.13,5.60,'timber');
      for (const z of [-2.4,-1.2,0,1.2,2.4]) {
        const y=roofHeight(x,z)-.16;
        box(x,y-.20,z,.10,.41,.10,'timberLight');
      }
      for (const roofSide of [-1,1]) for(let step=0;step<9;step++) {
        const z0=roofSide*eave*step/9,z1=roofSide*eave*(step+1)/9;
        face([x-.09,roofHeight(x,z0)+.04,z0],[x+.09,roofHeight(x,z0)+.04,z0],
             [x+.09,roofHeight(x,z1)+.04,z1],[x-.09,roofHeight(x,z1)+.04,z1],[0,1,0],'tileRidge');
      }
    }
  }

  function lattice(cx,cy,z,width,height,columns=4,rows=6) {
    box(cx,cy,z,width,height,.08,'timber');
    box(cx,cy,z-.055,width-.15,height-.13,.025,'paper');
    for (const xx of [cx-width*.5+.06,cx+width*.5-.06])
      box(xx,cy,z-.09,.075,height,.035,'timber');
    for (const yy of [cy-height*.5+.06,cy+height*.5-.06])
      box(cx,yy,z-.09,width,.075,.035,'timber');
    for(let i=1;i<columns;i++)
      box(cx-width*.5+width*i/columns,cy,z-.104,.031,height-.14,.028,'timberLight');
    for(let i=1;i<rows;i++)
      box(cx,cy-height*.5+height*i/rows,z-.108,width-.13,.033,.028,'timberLight');
    box(cx,cy-height*.5+.20,z-.116,width-.09,.072,.045,'timber');
  }

  function timberFrame() {
    // House core is recessed behind a proper open wooden porch.
    box(0,.18,.22,span+.16,.36,5.36,'stoneFoundation');
    box(0,.40,.15,span+.10,.12,5.25,'stoneLight');
    box(0,1.56,.34,span,2.58,4.92,'plaster');
    box(0,.46,-2.88,span+.32,.15,1.22,'timberLight');
    for(let x=-3.00;x<=3.01;x+=.60)box(x,.34,-2.96,.045,.10,1.1,'timber');
    for(const x of [-2.99,-1.52,0,1.52,2.99]) {
      box(x,1.66,-2.82,.175,2.68,.23,'timber');
      box(x,1.64,2.72,.14,2.66,.14,'timber');
      box(x,.54,-2.82,.25,.20,.29,'stoneFoundation');
      // Under-eave brackets are larger than window grid, so their rhythm
      // reads clearly at normal walking distance.
      box(x,2.90,-2.80,.36,.14,.42,'timberLight');
    }
    box(0,2.93,-2.81,span+.34,.21,.26,'timber');
    box(0,.58,-2.85,span+.06,.17,.20,'timber');
    for(const x of [-2.35,-1.68,-.86,.86,1.68,2.35])
      box(x,2.72,-2.88,.085,.30,.15,'timberLight');
    // A pair of paper windows + traditional paired centre door.
    lattice(-1.93,1.69,-2.94,1.52,1.81,4,5);
    lattice(1.93,1.69,-2.94,1.52,1.81,4,5);
    lattice(0,1.60,-2.95,1.54,2.03,3,6);
    box(0,1.60,-3.065,.042,2.0,.045,'woodShade');
    for(const x of [-.10,.10])sphere(x,1.47,-3.12,.038,.038,.035,'copper',6,3);
    // Short steps that make the raised wooden maru accessible from the lane.
    box(0,.21,-3.57,1.65,.20,.57,'stoneLight');
    pitchedRoof();
  }

  function stoneWall(cx, w=2, z=-4.16, height=1.62) {
    box(cx,.22,z,w+.06,.44,.36,'stoneFoundation');
    box(cx,.44,z,w+.02,.13,.40,'stoneLight');
    box(cx,.52+height*.48,z,w,height-.56,.28,'plaster');
    box(cx,height+.06,z,w+.11,.12,.43,'timber');
    box(cx,height+.14,z,w+.17,.15,.48,'tileDark');
    // Irregular low-relief stonework is more readable than a single cube.
    for(let j=0;j<3;j++){
      const x=cx-w*.5+.21+j*w*.31;
      box(x,.24,z-.205,w*.23,.18,.025,j%2?'stoneLight':'stoneFoundation');
    }
    for(let j=0;j<4;j++){
      const x=cx-w*.5+.16+j*w*.25;
      box(x,height*.55+(j%2)*.21,z-.169,w*.17,.095,.023,'stoneLight');
    }
  }

  function sideWall() {
    for(const xx of [-3.48,3.48]){
      box(xx,.95,-.35,.28,1.65,7.2,'plaster');
      box(xx,1.84,-.35,.42,.18,7.3,'tileDark');
      box(xx,.28,-.35,.36,.50,7.3,'stoneFoundation');
    }
  }

  function archedGate() {
    // Traditional paired gate with a separate, modest roof and lintel.
    for(const x of [-1.24,1.24]){
      box(x,1.13,-4.28,.19,2.25,.37,'timber');
      box(x,.29,-4.28,.30,.40,.42,'stoneFoundation');
    }
    box(0,2.27,-4.28,2.76,.19,.39,'timber');
    box(0,2.48,-4.29,3.11,.14,.78,'tileDark');
    box(0,2.58,-4.29,2.62,.11,.31,'tileBase');
    for(let i=0;i<12;i++){
      const x=-1.43+(i+.5)*2.86/12;
      box(x,2.55,-4.77,.15,.11,.17,i%3?'tileBase':'tileLight');
    }
    for(const xx of [-.57,.57]){
      box(xx,1.16,-4.42,1.1,1.91,.10,'gateWood');
      box(xx,1.16,-4.49,.96,1.72,.029,'timberLight');
      for(let j=0;j<4;j++)box(xx-.34+j*.225,1.17,-4.52,.024,1.65,.026,'woodShade');
      for(let j=0;j<4;j++)box(xx,.53+j*.42,-4.535,.95,.028,.025,'woodShade');
    }
    for(const x of [-.15,.15]){
      sphere(x,1.23,-4.59,.050,.050,.038,'copper',8,4);
      sphere(x,1.23,-4.63,.022,.022,.020,'woodShade',8,4);
    }
  }

  function planter(x,z,shrub='sage'){
    box(x,.30,z,.48,.48,.48,'stoneFoundation');
    box(x,.55,z,.52,.13,.50,'timber');
    sphere(x,.97,z,.43,.43,.42,shrub,8,5);
    sphere(x-.16,1.17,z,.23,.22,.22,'green',7,4);
  }

  function gateHanok(seed) {
    timberFrame();
    // Wall-and-gate houses are the dominant pattern in residential Bukchon.
    stoneWall(-2.53,2.12,-4.21,1.62);
    stoneWall(2.53,2.12,-4.21,1.62);
    archedGate();
    sideWall();
    if(seed%2===0)planter(3.57,-3.72);
    if(seed%3===0)planter(-3.56,-3.83,'green');
  }

  /**
   * Hanok A01 — the single showcase residential house near the beginning
   * of the walking route. 100% procedural geometry, using the same material
   * palette / altitude-adjusted building frame as the existing village.
   * Other hanok archetypes are intentionally unaffected.
   */
  function featureHanok(seed) {
    gateHanok(seed);
    // An extra roof-edge rhythm and small raised ridge-cap tiles make the
    // curved giwa roof read clearly in the normal third-person camera.
    for (let i = 0; i < 24; i++) {
      const x = -roofHalfWidth + .18 + i * (roofHalfWidth * 2 - .36) / 23;
      box(x, roofHeight(x, -eave) + .010, -eave - .075,
          .22, .075, .17, i % 3 === 0 ? 'tileLight' : 'tileRidge');
    }
    for (let i = 0; i < 19; i++) {
      const x = -roofHalfWidth + .30 + i * (roofHalfWidth * 2 - .60) / 18;
      box(x, 4.20, 0, .18, .095, .24,
          i % 4 === 0 ? 'tileLight' : 'tileBase');
    }

    // Layered timber brackets underneath the roof; more sculpted than a
    // uniformly flat brown bar, but cheap to draw in the shared world mesh.
    for (const x of [-2.92, -1.48, 0, 1.48, 2.92]) {
      box(x, 2.89, -3.16, .27, .11, .43, 'woodShade');
      box(x, 2.80, -3.18, .17, .12, .29, 'timberLight');
      box(x, 2.73, -3.21, .095, .10, .23, 'timber');
    }

    // Carved-looking battens, symmetric latch plates and round studs on the
    // wooden gate. These details face the lane rather than the courtyard.
    for (const x of [-.95, -.19, .19, .95]) {
      box(x, 1.13, -4.566, .035, 1.69, .035, 'timberLight');
    }
    for (const y of [.39, 1.90]) {
      box(0, y, -4.576, 2.16, .045, .038, 'woodShade');
    }
    for (const x of [-.22, .22]) {
      box(x, 1.23, -4.59, .13, .22, .045, 'tileRidge');
      sphere(x, 1.23, -4.645, .038, .055, .022, 'copper', 8, 4);
    }

    // Two enclosed warm paper lanterns, suspended beneath the little
    // entrance roof. No extra WebGL lights or external textures needed.
    for (const x of [-1.62, 1.62]) {
      box(x, 2.28, -4.61, .035, .27, .035, 'woodShade');
      box(x, 2.02, -4.62, .35, .43, .27, 'timber');
      box(x, 2.02, -4.772, .25, .32, .025, 'warmLight');
      box(x, 2.02, -4.790, .035, .33, .025, 'timber');
      box(x, 2.02, -4.795, .26, .036, .025, 'timberLight');
      box(x, 2.27, -4.62, .43, .075, .35, 'tileDark');
      box(x, 1.78, -4.62, .42, .065, .34, 'woodShade');
    }

    // Pebble-footed ceramic onggi jars, with distinct lids and narrow
    // necks, beside a low shrub: small Korean domestic details, not signs.
    for (const [x, z, r, h] of [
      [3.08, -4.68, .23, .52],
      [3.52, -4.54, .17, .38],
      [-3.29, -4.71, .19, .42]
    ]) {
      cylinder(x, .16 + h * .5, z, r, h, 'gateWood', 10);
      cylinder(x, .17 + h, z, r * .80, .09, 'woodShade', 10);
      cylinder(x, .23 + h, z, r * .57, .08, 'copper', 10);
    }
    for (const [x, z] of [[-3.64, -4.07], [3.83, -3.75]]) {
      sphere(x, .62, z, .38, .49, .38, 'deepGreen', 8, 5);
      sphere(x - .15, .95, z - .08, .27, .27, .26, 'sage', 8, 5);
      for (const dx of [-.17, .08, .22]) {
        sphere(x + dx, 1.01 + dx * .5, z - .32, .07, .075, .07,
               'palePink', 6, 4);
      }
    }

    // Subtle irregular foundation stone joints on the street-facing wall.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const x = side * (1.65 + i * .33);
        box(x, .27 + (i % 2) * .09, -4.445, .27, .042, .030,
            i % 2 ? 'stoneLight' : 'stoneFoundation');
      }
    }
  }

  /**
   * Four curated street-house looks. The site picks one using a stable
   * coordinate-based seed; reloading must not reshuffle roof colours.
   * All add-ons are local to the existing building frame.
   */
  function gardenHanok(variant, archetype) {
    if (!variant) return;
    const palettes = [
      null,
      ['tileIndigo', 'tileIndigoLight', 'flowerCoral'],
      ['tileJade', 'tileJadeLight', 'flowerYellow'],
      ['tileInk', 'tileInkLight', 'flowerLilac'],
      ['tilePlum', 'tilePlumLight', 'palePink'],
    ];
    const [tileA, tileB, petals] = palettes[variant];

    // Roof-sized color treatment: easier to see from gameplay distance than
    // tiny decorations. A continuous patch follows the same curved tile
    // profile; contrasting courses retain a real roof-tile rhythm.
    const columns = 12;
    const courses = 9;
    for (const side of [-1, 1]) {
      for (let row = 0; row < courses; row++) {
        const z0 = side * eave * row / courses;
        const z1 = side * eave * (row + 1) / courses;
        for (let col = 0; col < columns; col++) {
          const x0 = -roofHalfWidth + col * (2 * roofHalfWidth / columns);
          const x1 = -roofHalfWidth + (col + 1) * (2 * roofHalfWidth / columns);
          const tone = (col + row) % 5 === 0 ? tileB : tileA;
          face([x0, roofHeight(x0,z0)+.058,z0], [x1, roofHeight(x1,z0)+.058,z0],
               [x1, roofHeight(x1,z1)+.058,z1], [x0, roofHeight(x0,z1)+.058,z1],
               [0,1,0], tone);
          if (col % 3 === 0) {
            const seam = x0 + .034;
            face([seam,roofHeight(seam,z0)+.088,z0],
                 [seam+.055,roofHeight(seam+.055,z0)+.088,z0],
                 [seam+.055,roofHeight(seam+.055,z1)+.088,z1],
                 [seam,roofHeight(seam,z1)+.088,z1],[0,1,0],tileB);
          }
        }
      }
      for (let i = 0; i < 16; i++) {
        const x = -roofHalfWidth + (i+.5) * roofHalfWidth*2/16;
        box(x,roofHeight(x,side*eave)+.053,side*(eave+.105),
            .31,.105,.20,i%3===0?tileB:tileA);
      }
    }
    box(0,4.24,0,span+1.60,.12,.28,tileB);
    for(let i=0;i<16;i++) {
      const x = -roofHalfWidth+.24+i*(roofHalfWidth*2-.48)/15;
      box(x,4.34,0,.16,.10,.23,i%3===0?tileA:tileB);
    }

    // Big clusters of flowers and foliage on the lane-facing side.
    // Their colors differ by house, giving players landmarks in the alley.
    const sideZ=archetype==='cafe' ? -3.57 : -4.03;
    for(const side of [-1,1]) {
      const x=side*(3.23 + (variant%2)*.16);
      cylinder(x,.29,sideZ,.22,.52,'stoneFoundation',9);
      cylinder(x,.59,sideZ,.30,.14,'timberLight',9);
      for(const [dx,dy,dz] of [[-.23,.86,-.08],[.17,.93,.11],[0,1.13,-.09]]) {
        sphere(x+dx,dy,sideZ+dz,.34,.36,.33,variant===2?'deepGreen':'sage',8,5);
      }
      for(let k=0;k<7;k++) {
        const a=k*2.39996+variant*.7;
        sphere(x+Math.cos(a)*.33,1.12+(k%3)*.14,
               sideZ+Math.sin(a)*.27,.105,.11,.095,petals,7,4);
      }
    }

    if(variant===1 || variant===4) {
      // Paired hanging paper lanterns over the small timber gate / porch.
      const z=archetype==='gate' ? -4.73 : -3.28;
      for(const x of [-1.82,1.82]) {
        box(x,2.45,z,.042,.30,.042,'woodShade');
        box(x,2.15,z,.40,.50,.31,'timber');
        box(x,2.15,z-.171,.28,.38,.024,'warmLight');
        box(x,2.15,z-.198,.038,.39,.02,'woodShade');
        box(x,2.15,z-.204,.29,.04,.02,'woodShade');
        box(x,2.44,z,.47,.09,.35,tileA);
        box(x,1.89,z,.46,.07,.34,tileA);
      }
    }
    if(variant===2) {
      // Onggi gathering and a small wooden bench below the roof edge.
      for(const [x,z,r] of [[-3.10,-4.16,.26],[-2.65,-4.10,.18],[3.09,-4.06,.24]]) {
        cylinder(x,.40,z,r,.60,'gateWood',10);
        cylinder(x,.74,z,r*.79,.10,'woodShade',10);
      }
      box(2.15,.56,-3.97,1.13,.13,.42,'timberLight');
      for(const x of [1.68,2.65]) box(x,.29,-3.97,.10,.44,.14,'timber');
    }
    if(variant===3) {
      // Distinctive lattice planter trellis and blossom branches.
      for(const side of [-1,1]) {
        const x=side*3.62;
        for(const y of [.70,1.17,1.63])box(x,y,-3.78,.67,.06,.08,'timberLight');
        for(const dx of [-.27,.27])box(x+dx,1.11,-3.78,.055,1.26,.09,'timber');
        sphere(x,1.80,-3.80,.35,.34,.35,'deepGreen',8,5);
        for(const dx of [-.28,0,.26])
          sphere(x+dx,2.02,-3.86,.115,.12,.12,'flowerLilac',7,4);
      }
    }
    if(variant===4) {
      // Decorated windbreak wall and warm wood lattice panels.
      for(const side of [-1,1]) {
        const x=side*2.65;
        for(let j=0;j<3;j++) box(x+(j-1)*.25,1.34,-4.404,.055,.81,.06,'timberLight');
        box(x,1.55,-4.42,.84,.05,.08,'timber');
        box(x,1.12,-4.42,.84,.05,.08,'timber');
      }
    }
  }

  function facingHanok(seed) {
    timberFrame();
    // Visible porch and paper windows distinguish this from the courtyard homes.
    stoneWall(-3.58,.65,-3.88,1.06);
    stoneWall(3.58,.65,-3.88,1.06);
    if(seed%2===0) {
      planter(3.20,-3.47);
      cylinder(-3.11,.49,-3.44,.25,.72,'stoneFoundation',9);
    } else {
      planter(-3.2,-3.55,'green');
      planter(3.3,-3.56);
    }
    box(0,.10,-3.94,2.65,.18,.56,'stoneFoundation');
  }

  function cafeHanok(seed) {
    timberFrame();
    // The recessed, warm entrance and sign are a distinct storefront—not a
    // residential house with a label pasted over its gate.
    box(0,1.48,-3.18,2.14,2.18,.065,'shopDark');
    box(0,1.54,-3.24,1.87,1.91,.032,'warmGlass');
    for(const x of [-1.0,0,1.0])box(x,1.55,-3.29,.075,2.00,.052,'timber');
    box(0,2.43,-3.30,2.15,.085,.055,'timber');
    box(0,.62,-3.31,2.12,.13,.09,'timber');
    for(const x of [-.65,.65]) sphere(x,1.64,-3.35,.05,.048,.038,'copper',8,4);
    // The glowing interior is a tint painted into the facade, rather than
    // an unbounded real light, keeping the static website lightweight.
    box(0,1.25,-3.365,1.42,.25,.042,'warmLight');
    const sign = seed%2===0 ? signs.hanokCafe : signs.hanokAtelier;
    box(0,2.80,-3.25,2.69,.50,.095,'timber');
    textured(0,2.80,-3.31,2.55,.40,'z',sign);
    // Café stools, pots and sandwich-board, with restrained visual clutter.
    planter(-3.35,-3.77);
    planter(3.28,-3.77,'green');
    box(2.63,.57,-3.61,.90,.09,.33,'timberLight');
    for(const x of [2.32,2.94]) box(x,.31,-3.61,.09,.46,.14,'timber');
    box(-2.73,.91,-3.61,.67,.98,.11,'woodShade');
    box(-2.73,.94,-3.684,.56,.72,.035,'paper');
    box(-2.73,.55,-3.66,.79,.08,.20,'timber');
    for(const x of [-2.98,-2.48]) box(x,.30,-3.57,.09,.43,.1,'timber');
    // A short retaining-wall end piece keeps the shop in the street rhythm.
    stoneWall(3.83,.64,-3.97,1.13);
  }

  function build(type=0, detailVariant=0) {
    // Keep all original residential/café archetypes, but give many houses a
    // roof-sized, visually distinct upgrade instead of one hard-to-find A01.
    if (type === 100) {
      featureHanok(1);
      gardenHanok(detailVariant || 1, 'gate');
      return 'a01';
    }
    const style = type % 8;
    const archetype = style===7 ? 'cafe' : [2,4,6].includes(style) ? 'facing' : 'gate';
    if (archetype==='cafe') cafeHanok(type);
    else if (archetype==='facing') facingHanok(type);
    else gateHanok(type);
    gardenHanok(detailVariant, archetype);
    return archetype;
  }
  return { build };
}
