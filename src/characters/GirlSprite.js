import * as THREE from 'three';

/**
 * WalkingKorea girl, illustrated 2.5D version.
 * Five hand-painted directions (front, front45, side, back45, back).
 * Left-side bearings reuse mirrored views, while a foot-anchored camera-facing
 * sprite always stays visually legible in our free-orbit third-person camera.
 *
 * A full stride advances from actual distance travelled, not render time,
 * so walking into a wall does not cause feet to skate in place.
 */
const DIRECTION_NAMES = ['front', 'front45', 'side', 'back45', 'back'];
const NUM_WALK_FRAMES = 4;
const WALK_STRIDE_METERS = 0.76;
const HALF_SLICE = Math.PI / 8;
const spriteFiles = {
  idle: '/sprites/girl_idle_5x2.webp',
  walk: '/sprites/girl_walk_5x4.webp'
};

function shortestAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function chooseFacing(heading, camera, position) {
  const relative = shortestAngle(Math.atan2(camera.position.x - position.x, camera.position.z - position.z) - heading);
  const magnitude = Math.abs(relative);
  const direction = THREE.MathUtils.clamp(Math.floor((magnitude + HALF_SLICE) / (Math.PI / 4)), 0, 4);
  // Atlas side poses look SCREEN-RIGHT by default. From behind, moving
  // world -X is screen-left; a positive relative bearing requires mirroring.
  return {direction, mirror: relative > 0.02 && direction > 0 && direction < 4};
}

export function createGirlSpriteCompanion(scene, hill, camera) {
  const root = new THREE.Group();
  root.name = 'Seoul Girl / illustrated 2.5D';
  root.userData.isPlayableCharacter = true;
  root.visible = false;
  scene.add(root);

  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 320;
  const faceContext = faceCanvas.getContext('2d', {alpha: true});
  const texture = new THREE.CanvasTexture(faceCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.045,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.name = 'Girl / foot-anchored directional sprite';
  sprite.scale.set(1.47, 1.84, 1);
  // Source pivot is (128,304) in 256 × 320 image, i.e. 5% from bottom.
  sprite.center.set(0.5, 0.05);
  root.add(sprite);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.33, 28),
    new THREE.MeshBasicMaterial({color: 0x5a4a39, opacity: 0.17, transparent: true, side: THREE.DoubleSide, depthWrite: false})
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  root.add(shadow);

  const sheet = {};
  const loadingState = {ready: false, errors: []};
  Promise.all(Object.entries(spriteFiles).map(async ([state, path]) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    await image.decode();
    sheet[state] = image;
  })).then(() => {
    loadingState.ready = true;
    draw('idle', 0, 0, false);
  }).catch(error => {
    loadingState.errors.push(String(error));
    console.error('WalkingKorea girl sprite atlas failed to load:', error);
  });

  let heading = 0;
  let initialized = false;
  let lastX = 0;
  let lastZ = 0;
  let distancePhase = 0;
  let idleClock = 0;
  let motionBlend = 0;
  let lastDrawn = '';
  let currentDirection = 4;
  let currentFrame = 0;
  let currentPose = 'idle';
  let currentMirrored = false;
  let totalTravel = 0;

  function draw(pose, direction, frame, mirror) {
    if (!loadingState.ready) return;
    const key = `${pose}/${direction}/${frame}/${mirror}`;
    if (key === lastDrawn) return;
    lastDrawn = key;
    const image = sheet[pose];
    const column = pose === 'walk' ? frame : direction;
    const row = pose === 'walk' ? direction : frame;
    faceContext.clearRect(0, 0, 256, 320);
    faceContext.save();
    if (mirror) {
      faceContext.translate(256, 0);
      faceContext.scale(-1, 1);
    }
    faceContext.drawImage(image, column * 256, row * 320, 256, 320, 0, 0, 256, 320);
    faceContext.restore();
    texture.needsUpdate = true;
  }

  function update({x, z, vx = 0, vz = 0, dt = 0.016, elapsed = 0, walking = false, visible = true}) {
    root.visible = !!visible;
    if (!visible) {
      initialized = false;
      return;
    }
    root.position.set(x, hill(x, z) + 0.045, z);
    const speed = Math.hypot(vx, vz);
    if (!initialized) {
      heading = 0;
      lastX = x;
      lastZ = z;
      initialized = true;
    }
    const travel = Math.hypot(x - lastX, z - lastZ);
    lastX = x;
    lastZ = z;
    totalTravel += travel;
    if (speed > 0.11) {
      // Five-direction 2.5D sprites must face the actual motion immediately:
      // interpolated heading made the feet moonwalk on sideways inputs.
      heading = Math.atan2(vx, vz);
    }
    const active = walking && speed > 0.13 && travel > 0.0005;
    motionBlend += ((active ? 1 : 0) - motionBlend) * (1 - Math.exp(-dt * 10));
    if (active) distancePhase += travel / WALK_STRIDE_METERS * NUM_WALK_FRAMES;
    idleClock += dt;

    const view = chooseFacing(heading, camera, root.position);
    currentDirection = view.direction;
    currentMirrored = view.mirror;
    currentPose = motionBlend > 0.32 ? 'walk' : 'idle';
    currentFrame = currentPose === 'walk'
      ? Math.floor(distancePhase) % NUM_WALK_FRAMES
      : Math.floor(idleClock / 0.56) % 2;

    draw(currentPose, currentDirection, currentFrame, currentMirrored);
    // Very small head-height motion; feet remain anchored at the same pivot.
    sprite.position.y = currentPose === 'walk' ? 0.008 * Math.sin(distancePhase * Math.PI / 2) : 0;
    shadow.material.opacity = 0.17 - Math.min(0.035, motionBlend * 0.035);
  }

  function snapshot() {
    return {
      visible: root.visible,
      position: [root.position.x, root.position.y, root.position.z],
      heading,
      scale: sprite.scale.x,
      rendering: '2.5d-sprite',
      textureReady: loadingState.ready,
      errors: [...loadingState.errors],
      pose: currentPose,
      direction: DIRECTION_NAMES[currentDirection],
      mirrored: currentMirrored,
      frame: currentFrame,
      distancePhase,
      totalTravel
    };
  }

  function previewPose({pose = 'idle', direction = 0, frame = 0, mirrored = false} = {}) {
    root.visible = true;
    currentPose = pose;
    currentDirection = THREE.MathUtils.clamp(direction, 0, 4);
    currentFrame = frame % (pose === 'walk' ? 4 : 2);
    currentMirrored = mirrored;
    draw(currentPose, currentDirection, currentFrame, currentMirrored);
  }

  return {group: root, update, snapshot, previewPose, material: spriteMaterial, sprite, loadingState};
}