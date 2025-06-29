// ================
// Elden Ring Style 3D Portfolio (WASD+Mouse+Jump+Sprint)
// FinnB24 - 2024
// ================

// --- SCENE SETUP ---
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();

// Elden Ring "golden fog" atmosphere/fog
scene.fog = new THREE.FogExp2(0x20180f, 0.045);

// Camera & controls
const camera = new THREE.PerspectiveCamera(76, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x20180f, 1); // deep brown-black
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// --- PointerLockControls for player camera ---
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
let controlsEnabled = false;

// --- Sky: Elden Ring style (dark, golden, foggy) ---
const skyGeo = new THREE.SphereGeometry(160, 40, 40);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x59421a, side: THREE.BackSide });
const sky = new THREE.Mesh(skyGeo, skyMat);
sky.position.y = -30;
scene.add(sky);

// --- Sun/Moon (faint gold disc) ---
const sunGeo = new THREE.CircleGeometry(6, 42);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xf4da8e, transparent: true, opacity: 0.22 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(18, 35, -65);
scene.add(sun);

// Floor: Ruined stone
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(65, 65),
  new THREE.MeshPhongMaterial({
    color: 0x463c2d,
    shininess: 6,
    specular: 0x927c32,
    map: null
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Faint gold rune patterns (fake with mesh overlays)
for (let i = 0; i < 4; ++i) {
  const rune = new THREE.Mesh(
    new THREE.RingGeometry(2.5 + i * 2.3, 2.7 + i * 2.3, 55),
    new THREE.MeshBasicMaterial({ color: 0xcbb46b, transparent: true, opacity: 0.06 })
  );
  rune.position.set(0, 0.02 + i * 0.03, 0);
  rune.rotation.x = -Math.PI / 2;
  scene.add(rune);
}

// --- Lighting (Elden Ring: gold + faint blue fill) ---
const amb = new THREE.AmbientLight(0xcbb46b, 0.24); scene.add(amb);
const blueFill = new THREE.HemisphereLight(0x6ca6c1, 0x2c2517, 0.22);
scene.add(blueFill);
const dir = new THREE.DirectionalLight(0xf4da8e, 0.85);
dir.position.set(13, 25, 9);
dir.castShadow = true;
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 90;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

// --- Player (Elden Ring style 'Tarnished' sphere) ---
const playerGroup = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 22, 18),
  new THREE.MeshStandardMaterial({
    color: 0xd7c175,
    roughness: 0.32,
    metalness: 0.48,
    emissive: 0xcbb46b,
    emissiveIntensity: 0.11
  })
);
body.castShadow = true;
body.receiveShadow = true;
playerGroup.add(body);
// "Cape" (flat black plane behind)
const cape = new THREE.Mesh(
  new THREE.PlaneGeometry(0.48, 1.19),
  new THREE.MeshBasicMaterial({ color: 0x16120c, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
);
cape.position.set(0, -0.12, -0.50);
playerGroup.add(cape);
// "Glow" (golden bloom, fake with transparent sphere)
const aura = new THREE.Mesh(
  new THREE.SphereGeometry(0.53, 18, 10),
  new THREE.MeshBasicMaterial({ color: 0xcbb46b, transparent: true, opacity: 0.16 })
);
playerGroup.add(aura);
playerGroup.position.set(0, 0.5, 7);
scene.add(playerGroup);

// --- Portals (sections), like Sites of Grace ---
const portals = [
  { name: "2d", pos: [-8, 0.8, -4], color: 0x48e0e4, label: "2D ART" },
  { name: "3d", pos: [8, 0.8, -4], color: 0x7d40e7, label: "3D ART" },
  { name: "about", pos: [-8, 0.8, -13], color: 0xfcdc58, label: "ABOUT" },
  { name: "contact", pos: [8, 0.8, -13], color: 0x00e38d, label: "CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  // Portal: glowing vertical ring (like a Site of Grace)
  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.22, 28, 64),
    new THREE.MeshPhongMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.33,
      shininess: 120,
      transparent: true,
      opacity: 0.87
    })
  );
  portal.position.set(...p.pos);
  portal.castShadow = true;
  portal.receiveShadow = true;
  portal.userData = { target: p.name };
  scene.add(portal);
  portalMeshes.push(portal);

  // Floating text label (gold)
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 68;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 38px Cardo";
  ctx.fillStyle = "#cbb46b";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 7;
  ctx.fillText(p.label, 128, 52);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.65),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  textMesh.position.set(p.pos[0], p.pos[1] + 1.6, p.pos[2]);
  scene.add(textMesh);
}

// --- Responsive ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// --- Player movement state ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let move = { x: 0, z: 0, y: 0 };
let velocity = { x: 0, y: 0, z: 0 };
let canJump = false, isSprinting = false;
let playerOnGround = false;
const walkSpeed = 4.07, sprintSpeed = 8.7, jumpStrength = 7.4, gravity = 19.5;

// --- Camera Mouse Controls ---
function enableControls() {
  controls.lock();
  controlsEnabled = true;
  document.body.style.cursor = "none";
}
function disableControls() {
  controls.unlock();
  controlsEnabled = false;
  document.body.style.cursor = "auto";
}
renderer.domElement.addEventListener('click', () => {
  if (!controlsEnabled && !document.getElementById('overlay-home').classList.contains('visible')) {
    enableControls();
  }
});
controls.addEventListener('lock', () => { controlsEnabled = true; });
controls.addEventListener('unlock', () => { controlsEnabled = false; });

// Overlay disables controls
function openOverlay(name) {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('visible'));
  document.getElementById('overlay-' + name).classList.add('visible');
  disableControls();
}
function closeOverlay(name) {
  document.getElementById('overlay-' + name).classList.remove('visible');
  if (name === "home") setTimeout(enableControls, 120);
}
// Allow Enter/Space to close the home overlay
document.addEventListener('keydown', e => {
  if (document.getElementById('overlay-home').classList.contains('visible') &&
    (e.key === 'Enter' || e.key === ' ')) {
    closeOverlay('home');
  }
});

// --- WASD+Jump+Sprint Movement ("Elden Ring" style) ---
function movePlayer(dt) {
  // Direction
  let input = { x: 0, z: 0 };
  if (keys['w']) input.z -= 1;
  if (keys['s']) input.z += 1;
  if (keys['a']) input.x -= 1;
  if (keys['d']) input.x += 1;

  // Sprint
  isSprinting = keys['shift'] || keys['shiftleft'];

  // Normalize input vector (no speed boost diagonally)
  let len = Math.hypot(input.x, input.z);
  if (len > 0) {
    input.x /= len;
    input.z /= len;
  }

  // Get camera facing direction (XZ plane)
  let yaw = controls.getObject().rotation.y;
  // Move direction relative to camera
  let moveX = input.x * Math.cos(yaw) - input.z * Math.sin(yaw);
  let moveZ = input.x * Math.sin(yaw) + input.z * Math.cos(yaw);

  let speed = isSprinting ? sprintSpeed : walkSpeed;
  velocity.x += ((moveX * speed) - velocity.x) * 0.18;
  velocity.z += ((moveZ * speed) - velocity.z) * 0.18;

  // Gravity
  if (!playerOnGround) velocity.y -= gravity * dt;
  else velocity.y = 0;

  // Jump
  if ((keys[' '] || keys['space']) && playerOnGround && canJump) {
    velocity.y = jumpStrength;
    canJump = false;
    playerOnGround = false;
  }
  if (!(keys[' '] || keys['space'])) canJump = true;

  // Apply movement
  playerGroup.position.x += velocity.x * dt;
  playerGroup.position.y += velocity.y * dt;
  playerGroup.position.z += velocity.z * dt;

  // Clamp within floor bounds
  playerGroup.position.x = Math.max(Math.min(playerGroup.position.x, 30), -30);
  playerGroup.position.z = Math.max(Math.min(playerGroup.position.z, 30), -18);

  // Simple ground collision
  if (playerGroup.position.y <= 0.5) {
    playerGroup.position.y = 0.5;
    velocity.y = 0;
    playerOnGround = true;
  } else {
    playerOnGround = false;
  }
}

// --- Camera follows player ---
function updateCamera() {
  controls.getObject().position.copy(playerGroup.position).add(new THREE.Vector3(0, 0.6, 0));
}

// --- Portal collision detection ---
function checkPortals() {
  for (const [i, p] of portals.entries()) {
    const dx = playerGroup.position.x - p.pos[0];
    const dz = playerGroup.position.z - p.pos[2];
    if (Math.abs(dx) < 1.6 && Math.abs(dz) < 1.6 && playerGroup.position.y < 2.2) {
      openOverlay(p.name);
      // Reset player position
      playerGroup.position.set(0, 0.5, 7);
      velocity = { x: 0, y: 0, z: 0 };
      break;
    }
  }
}

// --- Animate portals (glow, float) ---
let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for (let i = 0; i < portalMeshes.length; ++i) {
    portalMeshes[i].material.emissiveIntensity = 0.28 + 0.19 * Math.abs(Math.sin(portalAnimTime * 1.4 + i));
    portalMeshes[i].position.y = portals[i].pos[1] + 0.19 * Math.sin(portalAnimTime * 1.15 + i);
    portalMeshes[i].rotation.y += 0.34 * dt;
  }
}

// --- Main render loop ---
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now - lastTime) / 1000;
  lastTime = now;

  if (!document.getElementById('overlay-home').classList.contains('visible') && controlsEnabled) {
    movePlayer(dt);
    checkPortals();
  }
  animatePortals(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
