import * as THREE from 'three';

/**
 * WalkingKorea third-person follow camera.
 * The player is Dami, not the camera. WASD changes Dami's world position.
 * A soft horizontal leash lets the cat visibly walk across the view before
 * the camera follows, while pointer motion orbits around the character.
 */
export function createThirdPersonCamera({camera, hill, isWalkable}) {
  const anchor = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const realAim = new THREE.Vector3();
  let cameraYaw = 0;
  let initialized = false;

  function reset() {
    initialized = false;
  }

  function update({x, z, yaw, pitch, dt, moving}) {
    const terrainY = hill(x, z);
    if (!initialized) {
      anchor.set(x, terrainY, z);
      cameraYaw = yaw;
    }
    const smoothAngle = (a,b) => {
      const delta = Math.atan2(Math.sin(b-a),Math.cos(b-a));
      return a + delta * (1-Math.exp(-dt*9));
    };
    cameraYaw = smoothAngle(cameraYaw,yaw);

    // The leash creates real on-screen character motion: the camera catches
    // up only after Dami has walked ~0.55m away from the frame's centre.
    const dx = x-anchor.x;
    const dz = z-anchor.z;
    const distance = Math.hypot(dx,dz);
    const deadZone = .55;
    if (distance>deadZone) {
      const catchUp=(1-Math.exp(-dt*(moving?5.0:3.2)))*(distance-deadZone)/distance;
      anchor.x += dx*catchUp;
      anchor.z += dz*catchUp;
    }
    anchor.y += (hill(anchor.x,anchor.z)-anchor.y)*(1-Math.exp(-dt*5));

    const tilt = THREE.MathUtils.clamp(-pitch,.16,.89);
    const orbitDistance = 4.55;
    const horizontal = orbitDistance * Math.cos(tilt);
    const vertical = orbitDistance * Math.sin(tilt);

    // Only shorten the boom when it would exit a walkable lane, reducing
    // instances where a house is between Dami and the camera.
    let boom=horizontal;
    for(let attempt=0;attempt<14;attempt++){
      const bx=anchor.x-Math.sin(cameraYaw)*boom;
      const bz=anchor.z+Math.cos(cameraYaw)*boom;
      if(isWalkable(bx,bz)||boom<=1.40)break;
      boom-=.25;
    }
    const lookY=anchor.y + .93;
    desired.set(anchor.x-Math.sin(cameraYaw)*boom,
      Math.max(lookY+vertical, hill(anchor.x-Math.sin(cameraYaw)*boom,anchor.z+Math.cos(cameraYaw)*boom)+1.28),
      anchor.z+Math.cos(cameraYaw)*boom);
    aim.set(anchor.x,lookY,anchor.z);

    if (!initialized) {
      camera.position.copy(desired);
      realAim.copy(aim);
      initialized=true;
    } else {
      camera.position.lerp(desired,1-Math.exp(-dt*7.5));
      realAim.lerp(aim,1-Math.exp(-dt*10));
    }
    camera.lookAt(realAim);
  }

  function snapshot(){
    return {
      camera:[camera.position.x,camera.position.y,camera.position.z],
      lookAt:[realAim.x,realAim.y,realAim.z],
      anchor:[anchor.x,anchor.y,anchor.z]
    };
  }
  return {update,reset,snapshot};
}
