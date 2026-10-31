/**
 * Camera-relative direction on the XZ ground plane, shared by keyboard
 * and the virtual joystick. At yaw = 0 the camera sits on +Z.
 */
export function cameraRelativeDirection(forward, strafe, yaw) {
  return {
    dx: Math.sin(yaw) * forward + Math.cos(yaw) * strafe,
    dz: -Math.cos(yaw) * forward + Math.sin(yaw) * strafe,
  };
}
