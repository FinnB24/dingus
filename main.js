// 3D Scene Setup
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb6e4c6, 22, 55);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0xb6e4c6, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Sunlight
const dirLight = new THREE.DirectionalLight(0xfdf6d8, 0.67);
dirLight.position.set(17, 18, 1);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 60;
dirLight.shadow.mapSize.set(1024,1024);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x7fbf7f, 0.6));

// Sky (soft gradient)
const skyGeo = new THREE.SphereGeometry(80,32,32);
const skyMat = new THREE.MeshBasicMaterial({ color:0xb6e4c6, side:THREE.BackSide });
const sky = new THREE.Mesh(skyGeo,skyMat);
scene.add(sky);

// Sun (glowy orb)
const sunGeo = new THREE.SphereGeometry(2.5, 24, 24);
const sunMat = new THREE.MeshBasicMaterial({ color:0xfff5c6, transparent:true, opacity:0.82 });
const sun = new THREE.Mesh(sunGeo,sunMat);
sun.position.set(14,15,-39);
scene.add(sun);

// Ground (soft grassy)
const grassMat = new THREE.MeshPhongMaterial({ color:0x88c96c, shininess: 20 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), grassMat);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Scatter trees and magic mushrooms!
function makeTree(x, z, h) {
  // trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14,0.19,h*0.39, 7),
    new THREE.MeshPhongMaterial({ color: 0x7d5c3a })
  );
  trunk.position.set(x, h/2, z); trunk.castShadow=true;
  scene.add(trunk);
  // foliage
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(h*0.32, 11, 11),
    new THREE.MeshPhongMaterial({ color: 0x2c6139 })
  );
  foliage.position.set(x, h*0.80, z);
  foliage.castShadow=true; foliage.receiveShadow=true;
  scene.add(foliage);
}
function makeMushroom(x, z, h, capColor, capEdge) {
  // stalk
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09,0.13,h*0.52, 9),
    new THREE.MeshPhongMaterial({ color: 0xf9f3e7 })
  );
  stalk.position.set(x, h/2, z);
  scene.add(stalk);
  // cap
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(h*0.22, 13, 9, 0, Math.PI*2, 0, Math.PI*0.6),
    new THREE.MeshPhongMaterial({ color: capColor })
  );
  cap.position.set(x, h*0.9, z);
  scene.add(cap);
  // rim (optional)
  if(capEdge) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(h*0.21, 0.028, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    rim.position.set(x, h*0.92, z);
    rim.rotation.x = Math.PI/2;
    scene.add(rim);
  }
}

// Forest background
for(let i=0;i<24;++i){
  let x = (Math.random()-0.5)*44, z = (Math.random()-0.5)*44;
  if(Math.abs(x)<4 && Math.abs(z-5)<6) continue; // keep center clear
  let h = 2.2+Math.random()*2.5;
  makeTree(x, z, h);
}
for(let i=0;i<18;++i){
  let x = (Math.random()-0.5)*44, z = (Math.random()-0.5)*44;
  if(Math.abs(x)<3 && Math.abs(z-5)<5) continue;
  let h = 0.43+Math.random()*0.43;
  let color = (Math.random()>0.65) ? 0xf24444 : 0xe3c653;
  makeMushroom(x, z, h, color, true);
}

// Magic creature (bunny)
const bunny = new THREE.Group();
// body
const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.37, 18, 16),
  new THREE.MeshPhongMaterial({ color: 0xfaf7e0, shininess: 90 })
);
body.castShadow = true;
body.position.y = 0.38;
bunny.add(body);
// feet
for(let dx of [-0.17,0.17]){
  const foot = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 12, 8),
    new THREE.MeshPhongMaterial({ color: 0xfaf7e0 })
  );
  foot.position.set(dx,0.08,0.18);
  bunny.add(foot);
}
// face
const nose = new THREE.Mesh(
  new THREE.SphereGeometry(0.04, 10, 8),
  new THREE.MeshPhongMaterial({ color: 0xf2a8a7 })
);
nose.position.set(0,0.32,0.37); bunny.add(nose);
for(let i=-1;i<=1;i+=2){
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 8),
    new THREE.MeshPhongMaterial({ color: 0x3b2c1b })
  );
  eye.position.set(i*0.10,0.36,0.36);
  bunny.add(eye);
}
// ears
for(let i=-1;i<=1;i+=2){
  const ear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07,0.13,0.51, 8),
    new THREE.MeshPhongMaterial({ color: 0xfaf7e0 })
  );
  ear.position.set(i*0.17,0.68,0.13);
  ear.rotation.z = i*0.18;
  ear.rotation.x = -0.11;
  bunny.add(ear);
  // pink inner
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03,0.06,0.36, 6),
    new THREE.MeshPhongMaterial({ color: 0xf2a8a7 })
  );
  inner.position.set(i*0.17,0.71,0.16);
  inner.rotation.z = i*0.18;
  inner.rotation.x = -0.11;
  bunny.add(inner);
}
// fake shadow
const bunnyShadowGeo = new THREE.PlaneGeometry(0.87, 0.68);
const bunnyShadowMat = new THREE.MeshBasicMaterial({color:0x0a0a1a, transparent:true, opacity:0.14});
const bunnyShadow = new THREE.Mesh(bunnyShadowGeo, bunnyShadowMat);
bunnyShadow.rotation.x = -Math.PI/2;
bunnyShadow.position.y = 0.01;
bunny.add(bunnyShadow);

bunny.position.set(0,0.33,5);
scene.add(bunny);

// Magic portals (glowing fairy rings)
const portals = [
  { name:"2d",    pos:[-8,0.7,-4], color:0xb8f1ff, label:"SKETCHES" },
  { name:"3d",    pos:[ 8,0.7,-4], color:0xa490fd, label:"MODELS" },
  { name:"about", pos:[-8,0.7,-13], color:0xfcdc58, label:"ABOUT" },
  { name:"contact",pos:[ 8,0.7,-13], color:0x00e38d, label:"CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  // Fairy ring (torus)
  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(1.10, 0.19, 21, 44),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.36, shininess: 100, transparent: true, opacity: 0.79 })
  );
  portal.position.set(...p.pos);
  portal.rotation.x = -Math.PI/2;
  portal.castShadow = false;
  portal.receiveShadow = false;
  portal.userData = { target:p.name };
  scene.add(portal);
  portalMeshes.push(portal);
  // Glowy orb in the center
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 12),
    new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.33 })
  );
  orb.position.set(p.pos[0], p.pos[1]+0.12, p.pos[2]);
  scene.add(orb);
  // Floating text label above
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 33px Montserrat";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.shadowColor = "#4ae";
  ctx.shadowBlur = 12;
  ctx.fillText(p.label,128,48);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9,0.44),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],p.pos[1]+1.17,p.pos[2]);
  scene.add(textMesh);
}

// Camera start position and follow logic
let cameraTarget = new THREE.Vector3();
camera.position.set(0,5,13);
camera.lookAt(bunny.position);

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
function moveBunny(dt) {
  // Forward/backward (hop speed)
  if(keys['w']||keys['arrowup']) velocity += 12.5*dt;
  if(keys['s']||keys['arrowdown']) velocity -= 12.5*dt;
  // Friction
  velocity *= 0.95;
  if(velocity>11) velocity=11;
  if(velocity<-6) velocity=-6;
  // Steering (steer more at slow speeds)
  steer = 0;
  if(keys['a']||keys['arrowleft']) steer = 1.7;
  if(keys['d']||keys['arrowright']) steer = -1.7;
  angle += steer * Math.sign(velocity) * dt * (1.2 - Math.abs(velocity)/14);
  // Move bunny
  bunny.rotation.y = angle;
  bunny.position.x += Math.sin(angle) * velocity * dt;
  bunny.position.z += Math.cos(angle) * velocity * dt;
  bunny.position.x = Math.max(Math.min(bunny.position.x,23),-23);
  bunny.position.z = Math.max(Math.min(bunny.position.z,23),-18);
  // Hop animation!
  let hop = Math.abs(Math.sin(performance.now()/180 * Math.abs(velocity)));
  bunny.position.y = 0.33 + hop*0.12;
}

// Camera follow: smooth chase from behind
let camLerpAlpha = 0.14;
function updateCamera() {
  // Offset behind the bunny, slightly above
  const camDist = 9.7, camHeight = 4.7;
  const bunnyDir = angle;
  const desiredPos = new THREE.Vector3(
    bunny.position.x - Math.sin(bunnyDir)*camDist,
    bunny.position.y + camHeight,
    bunny.position.z - Math.cos(bunnyDir)*camDist
  );
  camera.position.lerp(desiredPos, camLerpAlpha);
  const lookAtTarget = new THREE.Vector3(
    bunny.position.x,
    bunny.position.y + 0.8,
    bunny.position.z
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
    const dx = bunny.position.x - p.pos[0];
    const dz = bunny.position.z - p.pos[2];
    if(Math.sqrt(dx*dx+dz*dz)<1.4) {
      openOverlay(p.name);
      // Reset bunny position so it's not stuck in the ring
      bunny.position.set(0,0.33,5);
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
    portalMeshes[i].material.emissiveIntensity = 0.36 + 0.23*Math.abs(Math.sin(portalAnimTime*1.5+i));
    portalMeshes[i].scale.z = 1 + 0.10*Math.sin(portalAnimTime*2.0+i);
    portalMeshes[i].position.y = portals[i].pos[1] + 0.07*Math.sin(portalAnimTime*1.4+i);
  }
}

// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  // Move bunny
  if(!document.getElementById('overlay-home').classList.contains('visible')) {
    moveBunny(dt);
    checkPortals();
  }
  animatePortals(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
