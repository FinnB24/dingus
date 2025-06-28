// 3D Scene Setup
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setClearColor(0x181b24);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Car (cube) setup
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1.5,0.6,3),
  new THREE.MeshPhongMaterial({ color: 0xef8354 })
);
car.position.set(0,0.3,5);
scene.add(car);

// "Wheels" (visual only)
for(let dx of [-0.6,0.6]){
  for(let dz of [-1.2,1.2]){
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27,0.27,0.22,16),
      new THREE.MeshPhongMaterial({color:0x23263b})
    );
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(dx,-0.21,dz);
    car.add(wheel);
  }
}

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50,50),
  new THREE.MeshPhongMaterial({ color:0x23263b, shininess: 10 })
);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
scene.add(floor);

// Portals (sections)
const portals = [
  { name:"2d",    pos:[-8,0.8,-4], color:0x48e0e4, label:"2D ART" },
  { name:"3d",    pos:[ 8,0.8,-4], color:0x7d40e7, label:"3D ART" },
  { name:"about", pos:[-8,0.8,-13], color:0xfcdc58, label:"ABOUT" },
  { name:"contact",pos:[ 8,0.8,-13], color:0x00e38d, label:"CONTACT" },
];
for (const p of portals) {
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(2.8,2,0.5),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.28 })
  );
  portal.position.set(...p.pos);
  portal.userData = { target:p.name };
  scene.add(portal);
  // Floating text label above
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 36px Montserrat";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.fillText(p.label,128,48);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6,0.55),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],p.pos[1]+1.5,p.pos[2]);
  scene.add(textMesh);
}

// Lighting
const amb = new THREE.AmbientLight(0xffffff,0.7); scene.add(amb);
const dir = new THREE.DirectionalLight(0xffffff,0.7); dir.position.set(10,8,4); scene.add(dir);

let cameraTarget = new THREE.Vector3(0,0,0);
camera.position.set(0,6,16);
camera.lookAt(0,0,0);

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
function moveCar(dt) {
  // Forward/reverse
  if(keys['w']||keys['arrowup']) velocity += 7*dt;
  if(keys['s']||keys['arrowdown']) velocity -= 7*dt;
  // Friction
  velocity *= 0.96;
  // Clamp
  if(velocity>7) velocity=7;
  if(velocity<-4) velocity=-4;
  // Steering
  steer = 0;
  if(keys['a']||keys['arrowleft']) steer = 1.2;
  if(keys['d']||keys['arrowright']) steer = -1.2;
  angle += steer * velocity * dt * 0.6;
  // Move car
  car.rotation.y = angle;
  car.position.x += Math.sin(angle) * velocity * dt;
  car.position.z += Math.cos(angle) * velocity * dt;
  // Clamp to world
  car.position.x = Math.max(Math.min(car.position.x,23),-23);
  car.position.z = Math.max(Math.min(car.position.z,23),-18);
}

// CAMERA FOLLOW LOGIC (Bruno Simon style)
function updateCamera() {
  // Desired camera position is behind and above the car
  const behindDistance = 9;
  const height = 5.2;
  const lookAtOffset = new THREE.Vector3(0,0.6,0);

  // Compute target position
  const target = new THREE.Vector3(
    car.position.x - Math.sin(angle) * behindDistance,
    car.position.y + height,
    car.position.z - Math.cos(angle) * behindDistance + 2.5
  );
  // Smoothly interpolate (lerp) camera position
  camera.position.lerp(target, 0.17);
  // Camera looks at the car (with a little vertical offset)
  const lookAt = car.position.clone().add(lookAtOffset);
  camera.lookAt(lookAt);
}

// Overlay logic
function openOverlay(name) {
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  document.getElementById('overlay-'+name).classList.add('visible');
}
function closeOverlay(name) {
  document.getElementById('overlay-'+name).classList.remove('visible');
}
document.addEventListener('keydown',e=>{
  if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ')) {
    closeOverlay('home');
  }
});

// Portal collision detection
function checkPortals() {
  for(const p of portals) {
    const dx = car.position.x - p.pos[0];
    const dz = car.position.z - p.pos[2];
    if(Math.abs(dx)<2.1 && Math.abs(dz)<2.1) {
      openOverlay(p.name);
      car.position.set(0,0.3,5);
      velocity = 0;
      angle = 0;
      break;
    }
  }
}

// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  // Move car
  if(!document.getElementById('overlay-home').classList.contains('visible')) {
    moveCar(dt);
    checkPortals();
  }
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
