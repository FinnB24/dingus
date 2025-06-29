// === Elden Ring 3D Portfolio Main ===

// Setup
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x201a0e, 0.065);

// Camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.2, 6);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setClearColor(0x18120a);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// PointerLockControls for Elden Ring-style camera
const controls = new THREE.PointerLockControls(camera, document.body);
let controlsEnabled = false;

// Sky: dark, faint gold gradient
const skyGeo = new THREE.SphereGeometry(90,32,32);
const skyMat = new THREE.MeshBasicMaterial({ color:0x1a1511, side:THREE.BackSide });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// "Erdtree" Sun (Elden Ring reference)
const sunGeo = new THREE.SphereGeometry(5, 48, 32);
const sunMat = new THREE.MeshBasicMaterial({
  color: 0xf7e29f,
  transparent: true,
  opacity: 0.95,
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(20, 30, -45);
scene.add(sun);

// Erdtree branches (simple gold lines)
for (let i=0; i<7; ++i) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(20,30,-45),
    new THREE.Vector3(18+5*Math.sin(i), 38+Math.random()*4, -39+Math.cos(i)*7),
    new THREE.Vector3(18+12*Math.sin(i), 43+Math.random()*2, -32+Math.cos(i)*17)
  ]);
  const pts = curve.getPoints(32);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color:0xffeb9b, linewidth: 2, transparent:true, opacity:0.67 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
}

// Ground - faded grass with a swirl
const floorTex = new THREE.TextureLoader().load('https://i.imgur.com/OUh1FSt.jpg');
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(5,5);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(70,70,1,1),
  new THREE.MeshPhongMaterial({ color:0x2b2610, map:floorTex })
);
floor.rotation.x = -Math.PI/2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Golden fog portal sections (like Elden Ring fog walls)
const portals = [
  { name:"2d",    pos:[-10,1.2,-6], color:0xffecb0, label:"2D ART" },
  { name:"3d",    pos:[ 10,1.2,-6], color:0xe1d7ea, label:"3D ART" },
  { name:"about", pos:[-10,1.2,-18], color:0xf5e7bd, label:"ABOUT" },
  { name:"contact",pos:[ 10,1.2,-18], color:0xb6e5ab, label:"CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  const fogMat = new THREE.MeshPhongMaterial({
    color: p.color,
    transparent: true,
    opacity: 0.62,
    emissive: p.color,
    emissiveIntensity: 0.36
  });
  const fogWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7,1.7,3.2,32,1,true),
    fogMat
  );
  fogWall.position.set(...p.pos);
  fogWall.castShadow = true;
  fogWall.receiveShadow = true;
  fogWall.userData = { target:p.name };
  scene.add(fogWall);
  portalMeshes.push(fogWall);

  // Floating label
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 72;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 36px 'UnifrakturCook', serif";
  ctx.fillStyle = "#fbe9a7";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 7;
  ctx.fillText(p.label, 160, 58);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6,0.6),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0], p.pos[1]+2.25, p.pos[2]);
  scene.add(textMesh);
}

// Lighting
const amb = new THREE.AmbientLight(0xf9e499, 0.55); scene.add(amb);
const dir = new THREE.DirectionalLight(0xf7e29f, 0.72);
dir.position.set(12,20,6);
dir.castShadow = true;
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 80;
dir.shadow.mapSize.set(2048,2048);
scene.add(dir);

// Player (stylized capsule = Tarnished)
const playerGeo = new THREE.CapsuleGeometry(0.43, 1.1, 12,24);
const playerMat = new THREE.MeshPhongMaterial({ color:0xe4c97f, shininess: 110, emissive:0x312816, emissiveIntensity:0.1 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.castShadow = true;
player.position.set(0,1,9);
scene.add(player);

// Shadow under player
const shadowGeo = new THREE.CircleGeometry(0.7, 32);
const shadowMat = new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.16 });
const shadow = new THREE.Mesh(shadowGeo, shadowMat);
shadow.rotation.x = -Math.PI/2;
shadow.position.set(0,0.011,9);
scene.add(shadow);

// Responsive
window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);

// Movement system
const move = { forward:0, back:0, left:0, right:0, jump:0, sprint:0 };
const keys = {};
let canJump = false;
let velocity = new THREE.Vector3();
let onGround = false;
let stamina = 100;
let staminaDrain = 0;
const maxStamina = 100;
const groundLevel = 0.0;

// Keyboard input
window.addEventListener('keydown', e => {
  if (!controlsEnabled) return;
  switch (e.code) {
    case 'KeyW': move.forward=1; break;
    case 'KeyS': move.back=1; break;
    case 'KeyA': move.left=1; break;
    case 'KeyD': move.right=1; break;
    case 'ShiftLeft': move.sprint=1; break;
    case 'Space':
      if (onGround && stamina>12) {
        velocity.y = 5.5;
        canJump = false;
        stamina -= 12;
      }
      break;
  }
});
window.addEventListener('keyup', e => {
  switch (e.code) {
    case 'KeyW': move.forward=0; break;
    case 'KeyS': move.back=0; break;
    case 'KeyA': move.left=0; break;
    case 'KeyD': move.right=0; break;
    case 'ShiftLeft': move.sprint=0; break;
  }
});

// Mouse lock for camera look
document.addEventListener('click', e=>{
  // Only lock if overlays not visible
  if(!document.querySelector('.overlay.visible')) controls.lock();
});
controls.addEventListener('lock',()=>{
  controlsEnabled = true;
  document.body.style.cursor = "none";
});
controls.addEventListener('unlock',()=>{
  controlsEnabled = false;
  document.body.style.cursor = "";
});

// Overlay logic
function openOverlay(name) {
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  document.getElementById('overlay-'+name).classList.add('visible');
  controls.unlock();
}
function closeOverlay(name) {
  document.getElementById('overlay-'+name).classList.remove('visible');
  if(name==='home') controls.lock();
}
// Allow Enter key to close the home overlay
document.addEventListener('keydown',e=>{
  if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ')) {
    closeOverlay('home');
  }
});

// Stamina bar UI
function setStamina(val) {
  stamina = Math.max(0, Math.min(maxStamina, val));
  const bar = document.getElementById('elden-stamina');
  bar.style.width = (300 * stamina / maxStamina) + 'px';
}
setStamina(stamina);

// Movement + physics (Elden Ring style)
function movePlayer(dt) {
  // Direction relative to camera
  let dir = new THREE.Vector3();
  let camDir = controls.getDirection(new THREE.Vector3()).clone();
  camDir.y = 0; camDir.normalize();

  let right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0)).normalize();
  let moveVec = new THREE.Vector3();

  moveVec.addScaledVector(camDir, (move.forward-move.back));
  moveVec.addScaledVector(right, (move.right-move.left));
  moveVec.normalize();

  // Speed
  let speed = move.sprint && stamina>0 ? 7.1 : 3.35;
  if(moveVec.length()===0) speed = 0;

  // Sprint drain
  if(move.sprint && speed>0 && stamina>0) {
    stamina -= dt*25; staminaDrain=1;
  } else if(!move.sprint && stamina<maxStamina) {
    stamina += dt*13; staminaDrain=0;
  } else if(stamina<maxStamina && speed===0) {
    stamina += dt*20;
  }
  setStamina(stamina);

  // Apply movement
  velocity.x += moveVec.x * speed * dt * 7.4;
  velocity.z += moveVec.z * speed * dt * 7.4;

  // Friction
  velocity.x *= 0.78;
  velocity.z *= 0.78;

  // Gravity
  velocity.y -= 18.5 * dt;

  // Collisions: Ground
  if(player.position.y + velocity.y*dt <= 1.0) {
    velocity.y = 0;
    player.position.y = 1.0;
    onGround = true;
  } else {
    onGround = false;
  }

  // Move
  player.position.addScaledVector(velocity, dt);
  shadow.position.set(player.position.x, 0.011, player.position.z);

  // Clamp within bounds
  player.position.x = Math.max(Math.min(player.position.x, 32), -32);
  player.position.z = Math.max(Math.min(player.position.z, 32), -22);

  // Camera follows player (Elden Ring style: over-shoulder, slightly above)
  const camTarget = new THREE.Vector3(
    player.position.x, player.position.y + 1.15, player.position.z
  );
  controls.getObject().position.lerp(camTarget, 0.28);
}

// Portal collision detection (cylinder test)
function checkPortals() {
  for(const [i,p] of portals.entries()) {
    const dx = player.position.x - p.pos[0];
    const dz = player.position.z - p.pos[2];
    if(Math.sqrt(dx*dx + dz*dz) < 1.5) {
      openOverlay(p.name);
      // Reset player position
      player.position.set(0,1,9);
      velocity.set(0,0,0);
      setTimeout(()=>controls.lock(), 350);
      break;
    }
  }
}

// Animate portals (glow, floating)
let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for(let i=0; i<portalMeshes.length; ++i) {
    portalMeshes[i].material.opacity = 0.62 + 0.22*Math.abs(Math.sin(portalAnimTime*1.4+i));
    portalMeshes[i].material.emissiveIntensity = 0.26 + 0.23*Math.abs(Math.sin(portalAnimTime*1.2+i));
    portalMeshes[i].position.y = portals[i].pos[1] + 0.17*Math.sin(portalAnimTime*1.0+i);
  }
}

// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = Math.min((now-lastTime)/1000, 0.045);
  lastTime = now;
  // Move player
  if(controlsEnabled && !document.querySelector('.overlay.visible')) {
    movePlayer(dt);
    checkPortals();
  }
  animatePortals(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
