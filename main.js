// 3D Scene Setup
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x89c4f4, 28, 64);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0x89c4f4, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Sky gradient (big sphere, lighter on top, darker below)
const skyGeo = new THREE.SphereGeometry(80,32,32);
const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
const sky = new THREE.Mesh(skyGeo,skyMat);
scene.add(sky);

// Sun (glow disc)
const sunGeo = new THREE.CircleGeometry(3.5,32);
const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.82 });
const sun = new THREE.Mesh(sunGeo,sunMat);
sun.position.set(13,17,-39);
scene.add(sun);

// Ground (soft gradient using vertex colors, then receive shadow)
const groundGeo = new THREE.PlaneGeometry(50,50,1,1);
const groundMat = new THREE.MeshPhongMaterial({ color:0x5370a8, shininess: 19 });
const floor = new THREE.Mesh(groundGeo, groundMat);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Slightly more visible grid for fun
const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
grid.position.y = 0.012;
scene.add(grid);

// Car (cartoon style)
const carGroup = new THREE.Group();
// Body (rounded edges)
const bodyGeo = new THREE.BoxGeometry(1.7,0.6,2.6);
const bodyMat = new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 90 });
const carBody = new THREE.Mesh(bodyGeo, bodyMat);
carBody.castShadow = true;
carBody.receiveShadow = true;
carBody.geometry.translate(0, 0.17, 0);
carBody.geometry = carBody.geometry.toNonIndexed(); // smooth edges
carGroup.add(carBody);
// Roof
const roof = new THREE.Mesh(
  new THREE.BoxGeometry(1.09, 0.29, 1.27),
  new THREE.MeshPhongMaterial({ color: 0x31406a, shininess: 30 })
);
roof.position.set(0,0.47,-0.15);
roof.castShadow = true;
carGroup.add(roof);
// Wheels (cartoon black, slight bulge)
for(let dx of [-0.74,0.74]){
  for(let dz of [-1.01,1.01]){
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32,0.32,0.26,18),
      new THREE.MeshStandardMaterial({color:0x181b24, metalness:0.7, roughness:0.3})
    );
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(dx,-0.21,dz);
    wheel.castShadow = true;
    carGroup.add(wheel);
  }
}
// Cartoon eyes (front)
for(let i=-1;i<=1;i+=2){
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 14),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  eye.position.set(i*0.38, 0.37, 1.2);
  carGroup.add(eye);
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 12),
    new THREE.MeshPhongMaterial({ color: 0x25344f })
  );
  pupil.position.set(i*0.38, 0.37, 1.29);
  carGroup.add(pupil);
}
// Car shadow (fake soft shadow)
const carShadowGeo = new THREE.PlaneGeometry(1.5,3.1);
const carShadowMat = new THREE.MeshBasicMaterial({color:0x0a0a1a, transparent:true, opacity:0.13});
const carShadow = new THREE.Mesh(carShadowGeo, carShadowMat);
carShadow.rotation.x = -Math.PI/2;
carShadow.position.y = 0.02;
carGroup.add(carShadow);

carGroup.position.set(0,0.33,5);
scene.add(carGroup);

// Portals (sections) with glowing animation & outline
const portals = [
  { name:"2d",    pos:[-8,0.8,-4], color:0x48e0e4, label:"2D ART" },
  { name:"3d",    pos:[ 8,0.8,-4], color:0x7d40e7, label:"3D ART" },
  { name:"about", pos:[-8,0.8,-13], color:0xfcdc58, label:"ABOUT" },
  { name:"contact",pos:[ 8,0.8,-13], color:0x00e38d, label:"CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  // Portal core
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(2.8,2,0.5),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.29 })
  );
  portal.position.set(...p.pos);
  portal.castShadow = true;
  portal.receiveShadow = true;
  portal.userData = { target:p.name };
  scene.add(portal);
  portalMeshes.push(portal);
  // Glowy outline (slightly bigger, transparent)
  const outline = new THREE.Mesh(
    new THREE.BoxGeometry(3.05,2.2,0.7),
    new THREE.MeshBasicMaterial({ color:p.color, transparent:true, opacity:0.21 })
  );
  outline.position.set(...p.pos);
  scene.add(outline);
  // Floating text label above
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 36px Montserrat";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 7;
  ctx.fillText(p.label,128,48);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6,0.55),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],p.pos[1]+1.46,p.pos[2]);
  scene.add(textMesh);
}

// Lighting
const ambLight = new THREE.AmbientLight(0xffffff,0.43); scene.add(ambLight);
const dirLight = new THREE.DirectionalLight(0xfff0b1,0.75); dirLight.position.set(10,14,4);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.set(1024,1024);
scene.add(dirLight);

// Camera start position and follow logic
let cameraTarget = new THREE.Vector3();
camera.position.set(0,5,13);
camera.lookAt(carGroup.position);

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
function moveCar(dt) {
  // Forward/reverse (speed increased)
  if(keys['w']||keys['arrowup']) velocity += 13.5*dt;
  if(keys['s']||keys['arrowdown']) velocity -= 13.5*dt;
  // Friction
  velocity *= 0.96;
  if(velocity>12) velocity=12;
  if(velocity<-7) velocity=-7;
  // Steering (steer more at slow speeds)
  steer = 0;
  if(keys['a']||keys['arrowleft']) steer = 1.5;
  if(keys['d']||keys['arrowright']) steer = -1.5;
  angle += steer * Math.sign(velocity) * dt * (1.3 - Math.abs(velocity)/16);
  // Move car
  carGroup.rotation.y = angle;
  carGroup.position.x += Math.sin(angle) * velocity * dt;
  carGroup.position.z += Math.cos(angle) * velocity * dt;
  carGroup.position.x = Math.max(Math.min(carGroup.position.x,23),-23);
  carGroup.position.z = Math.max(Math.min(carGroup.position.z,23),-18);
}

// Camera follow: smooth chase from behind, like bruno-simon.com
let camLerpAlpha = 0.14; // smoothness
function updateCamera() {
  // Offset behind the car, slightly above
  const camDist = 11, camHeight = 4.7;
  const carDir = angle;
  const desiredPos = new THREE.Vector3(
    carGroup.position.x - Math.sin(carDir)*camDist,
    carGroup.position.y + camHeight,
    carGroup.position.z - Math.cos(carDir)*camDist
  );
  camera.position.lerp(desiredPos, camLerpAlpha);
  const lookAtTarget = new THREE.Vector3(
    carGroup.position.x,
    carGroup.position.y + 0.7,
    carGroup.position.z
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
    const dx = carGroup.position.x - p.pos[0];
    const dz = carGroup.position.z - p.pos[2];
    if(Math.abs(dx)<2.1 && Math.abs(dz)<2.1) {
      openOverlay(p.name);
      // Reset car position so it's not stuck in the portal
      carGroup.position.set(0,0.33,5);
      velocity = 0;
      angle = 0;
      break;
    }
  }
}

// Animate portals (glow, bounce, pulse)
let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for(let i=0; i<portalMeshes.length; ++i) {
    portalMeshes[i].material.emissiveIntensity = 0.32 + 0.22*Math.abs(Math.sin(portalAnimTime*1.5+i));
    portalMeshes[i].scale.y = 1 + 0.08*Math.sin(portalAnimTime*2.1+i);
    portalMeshes[i].position.y = portals[i].pos[1] + 0.19*Math.sin(portalAnimTime*1.2+i);
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
  animatePortals(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
