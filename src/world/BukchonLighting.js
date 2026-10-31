import * as THREE from 'three';

/**
 * Phase 04 — directional sun and shadow-frustum rig.
 *
 * The hanok city is one shared geometry using a custom ShaderMaterial.
 * It casts and receives a real THREE directional shadow map. Camera-relative
 * frustum tracking keeps resolution useful at the 40m flagship alley while
 * protecting mobile performance: the static-world shadow map only updates
 * after the player crosses a 2.4m threshold or lighting mode changes.
 *
 * No new props, no new materials, no change to the walkable map.
 */
export const SUN_DIRECTION = new THREE.Vector3(-0.47,0.81,0.35).normalize();
export const SHADOW_VIEW_RADIUS = 39;
export const SHADOW_UPDATE_DISTANCE = 2.4;

export function createBukchonLighting({renderer,scene,worldMesh,isTouch=false}) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isTouch ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const sun = new THREE.DirectionalLight(0xffe1ba,2.0);
  const target = new THREE.Object3D();
  scene.add(target);
  sun.target = target;
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouch ? 1024 : 2048,isTouch ? 1024 : 2048);
  sun.shadow.bias = -0.00024;
  sun.shadow.normalBias = 0.045;
  sun.shadow.radius = isTouch ? 1.35 : 2.2;
  const c = sun.shadow.camera;
  c.left = -SHADOW_VIEW_RADIUS;
  c.right = SHADOW_VIEW_RADIUS;
  c.top = SHADOW_VIEW_RADIUS;
  c.bottom = -SHADOW_VIEW_RADIUS;
  c.near = 0.5;
  c.far = 180;
  c.updateProjectionMatrix();
  scene.add(sun);

  // The world is static; this combined scene mesh is the actual shadow caster
  // as well as receiver. No fake opaque black polygon is projected on the road.
  worldMesh.castShadow = true;
  worldMesh.receiveShadow = true;

  let lastX=Infinity,lastZ=Infinity,lastNight=null,refreshes=0;
  function update({x,z,hill,night=false}) {
    const moved=Math.hypot(x-lastX,z-lastZ)>=SHADOW_UPDATE_DISTANCE;
    if(moved||night!==lastNight) {
      const y=hill(x,z)+1.25;
      target.position.set(x,y,z);
      sun.position.copy(target.position).addScaledVector(SUN_DIRECTION,75);
      sun.target.updateMatrixWorld();
      sun.updateMatrixWorld();
      renderer.shadowMap.needsUpdate=true;
      refreshes++;
      lastX=x; lastZ=z;lastNight=night;
    }
    // Sun position remains fixed in direction; intensity changes for evening.
    sun.intensity=night ? .12 : 2.0;
    sun.color.setHex(night ? 0xb6c7ec : 0xffe1ba);
  }
  return {
    sun,update,
    getStatus(){return {enabled:renderer.shadowMap.enabled,
      mapSize:sun.shadow.mapSize.x,refreshes,
      updatingAutomatically:renderer.shadowMap.autoUpdate};}
  };
}
