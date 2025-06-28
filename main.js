// Retro Dreamcore - FinnB24 Webroom

const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x664aff, 28, 72);

// Camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0x664aff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Dreamcore grid floor (checkerboard, neon border)
const floorGeo = new THREE.PlaneGeometry(45, 45, 30, 30);
const colors = [];
for (let i = 0; i < floorGeo.attributes.position.count; i++) {
  const x = floorGeo.attributes.position.getX(i);
  const z = floorGeo.attributes.position.getZ(i);
  const checker = (Math.floor(x+22.5)+Math.floor(z+22.5)) % 2;
  colors.push(checker ? 0.45 : 0.25, 0.28, checker ? 0.7 : 0.4); // purple/blue
}
floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const floorMat = new THREE.MeshPhongMaterial({ vertexColors:true, shininess: 18 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Neon grid lines overlay (extra retro)
const grid = new THREE.GridHelper(45, 30, 0xcba7ff, 0xee77ff);
grid.position.y = 0.018;
scene.add(grid);

// Vaporwave sun (pixel disc, with subtle glow)
const sunGeo = new THREE.CircleGeometry(4.7, 24);
const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.65 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(-11, 14, -31);
scene.add(sun);

// Main character: floating pixel smiley (emojis for quick mockup, replace with 3D later)
const playerGroup = new THREE.Group();
// Smiley face (pixel cube)
const smileyMat = new THREE.MeshPhongMaterial({ color: 0xfff340, shininess: 55 });
const smiley = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,1.1), smileyMat);
smiley.castShadow = true;
smiley.receiveShadow = true;
playerGroup.add(smiley);
// Eyes (black cubes)
for (let dx of [-0.26,0.26]) {
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.17,0.17,0.04), new THREE.MeshBasicMaterial({ color:0x222, transparent:true }));
  eye.position.set(dx, 0.18, 0.56);
  playerGroup.add(eye);
}
// Smile (black bar)
const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.08,0.04), new THREE.MeshBasicMaterial({ color:0x222 }));
mouth.position.set(0, -0.16, 0.56);
playerGroup.add(mouth);
// Glow ring
const ringGeo = new THREE.TorusGeometry(0.78,0.07,8,30);
const ringMat = new THREE.MeshBasicMaterial({color:0xcba7ff, transparent:true, opacity:0.32});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI/2;
ring.position.y = -0.46;
playerGroup.add(ring);

playerGroup.position.set(0,0.7,5);
scene.add(playerGroup);

// CRT TV Portals (sections) with glowing animation
const portals = [
  { name:"art",    pos:[-8,1.05,-4], color:0x81fff9, label:"ART" },
  { name:"music",  pos:[ 8,1.05,-4], color:0xff80d9, label:"MUSIC" },
  { name:"about",  pos:[-8,1.05,-13], color:0xfffa82, label:"ABOUT" },
  { name:"contact",pos:[ 8,1.05,-13], color:0x92ff8a, label:"CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  // CRT TV body (cube, with screen and frame)
  const crt = new THREE.Group();
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.05,1.3,0.9),
    new THREE.MeshPhongMaterial({ color:0x232335, shininess:22 })
  );
  crt.add(body);
  // Screen (front face, glowing)
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.65,0.99,0.08),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.25, transparent:true, opacity:0.85 })
  );
  screen.position.z = 0.49;
  crt.add(screen);
  // Stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18,0.16,0.22,10),
    new THREE.MeshPhongMaterial({ color: 0x2a1a44, shininess: 3 })
  );
  stand.position.y = -0.75;
  crt.add(stand);
  crt.position.set(...p.pos);
  crt.castShadow = true; crt.receiveShadow = true;
  crt.userData = { target:p.name };
  scene.add(crt);
  portalMeshes.push(crt);
  // Text label above
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 40px VT323";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.fillText(p.label,128,46);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2,0.48),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],p.pos[1]+1.18,p.pos[2]);
  scene.add(textMesh);
}

// Neon ambient + colored point lights
scene.add(new THREE.AmbientLight(0xffffff,0.45));
const dirLight = new THREE.DirectionalLight(0xfff0b1,0.65); dirLight.position.set(12,13,9);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 40;
dirLight.shadow.mapSize.set(1024,1024);
scene.add(dirLight);
const pointLight = new THREE.PointLight(0xff80d9, 0.19, 40); pointLight.position.set(-10,8,-6); scene.add(pointLight);
const pointLight2 = new THREE.PointLight(0x81fff9, 0.14, 40); pointLight2.position.set(10,8,-6); scene.add(pointLight2);

// Camera start position and follow logic
let cameraTarget = new THREE.Vector3();
camera.position.set(0,5,13);
camera.lookAt(playerGroup.position);

// Responsive
window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);

// Movement/physics
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let velocity = 0, angle = 0, steer = 0;
function movePlayer(dt) {
  // Forward/reverse (floaty controls)
  if(keys['w']||keys['arrowup']) velocity += 11.0*dt;
  if(keys['s']||keys['arrowdown']) velocity -= 11.0*dt;
  // Friction
  velocity *= 0.95;
  if(velocity>8) velocity=8;
  if(velocity<-6) velocity=-6;
  // Steering
  steer = 0;
  if(keys['a']||keys['arrowleft']) steer = 1.6;
  if(keys['d']||keys['arrowright']) steer = -1.6;
  angle += steer * Math.sign(velocity) * dt * (1.2 - Math.abs(velocity)/15);
  // Move smiley
  playerGroup.rotation.y = angle;
  playerGroup.position.x += Math.sin(angle) * velocity * dt;
  playerGroup.position.z += Math.cos(angle) * velocity * dt;
  playerGroup.position.x = Math.max(Math.min(playerGroup.position.x,21),-21);
  playerGroup.position.z = Math.max(Math.min(playerGroup.position.z,21),-17);
  // Floating bob
  playerGroup.position.y = 0.7 + 0.13*Math.sin(performance.now()/520);
  ring.rotation.z += dt*1.2;
}

// Camera follow: smooth chase from behind
let camLerpAlpha = 0.15;
function updateCamera() {
  // Offset behind the smiley, slightly above
  const camDist = 9.3, camHeight = 3.7;
  const playerDir = angle;
  const desiredPos = new THREE.Vector3(
    playerGroup.position.x - Math.sin(playerDir)*camDist,
    playerGroup.position.y + camHeight,
    playerGroup.position.z - Math.cos(playerDir)*camDist
  );
  camera.position.lerp(desiredPos, camLerpAlpha);
  const lookAtTarget = new THREE.Vector3(
    playerGroup.position.x,
    playerGroup.position.y + 0.27,
    playerGroup.position.z
  );
  camera.lookAt(lookAtTarget);
}

// Overlay logic
function openOverlay(name) {
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  document.getElementById('overlay-'+name).classList.add('visible');
}
function closeOverlay(name) {
  document.getElementById('overlay-'+name).classList.remove('visible');
}
// Allow Enter key to close the home overlay
document.addEventListener('keydown',e=>{
  if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ')) {
    closeOverlay('home');
  }
});

// Portal collision detection
function checkPortals() {
  for(const [i,p] of portals.entries()) {
    const dx = playerGroup.position.x - p.pos[0];
    const dz = playerGroup.position.z - p.pos[2];
    if(Math.abs(dx)<1.7 && Math.abs(dz)<1.3) {
      openOverlay(p.name);
      // Reset player position so it's not stuck in the portal
      playerGroup.position.set(0,0.7,5);
      velocity = 0;
      angle = 0;
      break;
    }
  }
}

// Animate portals (CRT screen glow + bounce)
let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for(let i=0; i<portalMeshes.length; ++i) {
    const crt = portalMeshes[i];
    crt.children[1].material.emissiveIntensity = 0.25 + 0.19*Math.abs(Math.sin(portalAnimTime*1.5+i));
    crt.position.y = portals[i].pos[1] + 0.17*Math.sin(portalAnimTime*1.1+i);
    crt.rotation.y = Math.sin(performance.now()/900 + i)*0.09;
  }
}

// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  // Move player
  if(!document.getElementById('overlay-home').classList.contains('visible')) {
    movePlayer(dt);
    checkPortals();
  }
  animatePortals(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
