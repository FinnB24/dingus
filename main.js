// --- Walker state ---
let walkerYVel = 0;
let walkerIsGrounded = true;

// --- Replace moveWalker function ---
function moveWalker(dt) {
  let moveX = 0, moveZ = 0;
  let speed = 4.2;
  // Sprint
  if (keys['shift'] || keys['shiftleft'] || keys['shiftright']) speed *= 1.63;

  // Movement keys
  if(wasd['w']||wasd['arrowup']) moveZ += 1;
  if(wasd['s']||wasd['arrowdown']) moveZ -= 1;
  if(wasd['a']||wasd['arrowleft']) moveX -= 1;
  if(wasd['d']||wasd['arrowright']) moveX += 1;
  let len = Math.hypot(moveX,moveZ);
  // --- Movement direction based on camera yaw ---
  if (len>0) {
    moveX/=len; moveZ/=len;
    let yaw = walkYaw;
    let forward = new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
    let right = new THREE.Vector3(Math.sin(yaw - Math.PI/2),0,Math.cos(yaw - Math.PI/2));
    let move = forward.multiplyScalar(moveZ).add(right.multiplyScalar(moveX));
    walker.position.x += move.x * speed * dt;
    walker.position.z += move.z * speed * dt;
    walker.position.x = Math.max(Math.min(walker.position.x,32),-32);
    walker.position.z = Math.max(Math.min(walker.position.z,32),-32);
    walker.rotation.y = walkYaw;
  }

  // --- Gravity & Jump ---
  // Simple ground detection: y <= ground (0.43)
  if (walker.position.y <= 0.43) {
    walker.position.y = 0.43;
    walkerIsGrounded = true;
    walkerYVel = 0;
  } else {
    walkerIsGrounded = false;
  }

  // Apply gravity if not grounded
  if (!walkerIsGrounded) walkerYVel -= 18*dt;

  // Apply vertical movement
  walker.position.y += walkerYVel * dt;

  // Bobbing (visual)
  if (walkerIsGrounded) {
    walker.position.y += 0.03*Math.abs(Math.sin(performance.now()/320));
  }
}

// --- Add this to your onKeyDown handler ---
function onKeyDown(e) {
  keys[e.key.toLowerCase()] = true;
  wasd[e.key.toLowerCase()] = true;
  // --- Jump ---
  if ((e.key === ' ' || e.code === 'Space') && mode === "walk" && walkerIsGrounded) {
    walkerYVel = 7.3;
    walkerIsGrounded = false;
  }
  if (e.key === 'e' || e.key === 'E') tryToggleMode();
  if (inRoom && (e.key==='e'||e.key==='E')) closeOverlay('inroom');
}
