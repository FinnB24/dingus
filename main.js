// 3D Scene Setup
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setClearColor(0x181b24);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Main player: a colored cube
const cubeGeo = new THREE.BoxGeometry(1,1,1);
const cubeMat = new THREE.MeshPhongMaterial({ color: 0xef8354 });
const player = new THREE.Mesh(cubeGeo, cubeMat);
player.position.set(0,0.5,5);
scene.add(player);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40,40),
  new THREE.MeshPhongMaterial({ color:0x23263b, shininess: 10 })
);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
scene.add(floor);

// Portals (sections)
const portals = [
  { name:"2d",    pos:[-6,0.5,-2], color:0x48e0e4, label:"2D ART" },
  { name:"3d",    pos:[ 6,0.5,-2], color:0x7d40e7, label:"3D ART" },
  { name:"about", pos:[-4,0.5,-12], color:0xfcdc58, label:"ABOUT" },
  { name:"contact",pos:[ 4,0.5,-12], color:0x00e38d, label:"CONTACT" },
];
for (const p of portals) {
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(2,2,0.6),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.3 })
  );
  portal.position.set(...p.pos);
  portal.userData = { target:p.name };
  scene.add(portal);
  // Add floating text label above
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 36px Montserrat";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.fillText(p.label,128,48);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2,0.55),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],p.pos[1]+1.5,p.pos[2]);
  scene.add(textMesh);
}

// Lighting
const amb = new THREE.AmbientLight(0xffffff,0.7); scene.add(amb);
const dir = new THREE.DirectionalLight(0xffffff,0.7); dir.position.set(10,8,4); scene.add(dir);

camera.position.set(0,4,12);
camera.lookAt(0,1,0);

window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);

// Movement Controls (WASD / arrows)
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

function movePlayer(dt) {
  let speed = 5 * dt;
  let dx=0, dz=0;
  if(keys['w']||keys['arrowup']) dz -= speed;
  if(keys['s']||keys['arrowdown']) dz += speed;
  if(keys['a']||keys['arrowleft']) dx -= speed;
  if(keys['d']||keys['arrowright']) dx += speed;
  player.position.x += dx;
  player.position.z += dz;
  player.position.x = Math.max(Math.min(player.position.x,18),-18);
  player.position.z = Math.max(Math.min(player.position.z,18),-18);
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
  for(const p of portals) {
    const dx = player.position.x - p.pos[0];
    const dz = player.position.z - p.pos[2];
    if(Math.abs(dx)<1.3 && Math.abs(dz)<1.3) {
      openOverlay(p.name);
      // Reset player position so it's not stuck in the portal
      player.position.set(0,0.5,5);
      break;
    }
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
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
