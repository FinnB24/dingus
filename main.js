// Magic Forest Explorer starter: replace car with a sprite, portals with glowing mushrooms

const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6ebf8f, 18, 54);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0x6ebf8f, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Soft ground
const groundGeo = new THREE.PlaneGeometry(50,50,1,1);
const groundMat = new THREE.MeshPhongMaterial({ color:0x3f6e4b, shininess: 18 });
const floor = new THREE.Mesh(groundGeo, groundMat);
floor.rotation.x = -Math.PI/2; floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Trees (simple cones and cylinders, scattered)
for(let i=0;i<16;i++){
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15,0.19,1.2,8),
    new THREE.MeshPhongMaterial({ color:0x7f5e30 })
  );
  trunk.position.set((Math.random()-0.5)*38,0.6,(Math.random()-0.8)*38);
  scene.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.7+Math.random()*0.6,2+Math.random(),10),
    new THREE.MeshPhongMaterial({ color:0x2fbf71, shininess: 12 })
  );
  leaves.position.set(trunk.position.x, trunk.position.y+1.1, trunk.position.z);
  scene.add(leaves);
}

// Fairy explorer ("player")
const explorer = new THREE.Group();
// Body
const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.29, 20, 14),
  new THREE.MeshPhongMaterial({ color: 0xcffafe, shininess: 80 })
);
body.castShadow = true;
explorer.add(body);
// Head
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.19, 14, 12),
  new THREE.MeshPhongMaterial({ color: 0xfceaed })
);
head.position.y = 0.36;
explorer.add(head);
// "Hat" (cone)
const hat = new THREE.Mesh(
  new THREE.ConeGeometry(0.17, 0.23, 10),
  new THREE.MeshPhongMaterial({ color: 0x7d40e7 })
);
hat.position.y = 0.62;
explorer.add(hat);
// Eyes (cute)
for(let i=-1;i<=1;i+=2){
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.045,8,8),
    new THREE.MeshPhongMaterial({ color: 0x233363 })
  );
  eye.position.set(i*0.08, 0.42, 0.16);
  explorer.add(eye);
}
explorer.position.set(0,0.3,5);
scene.add(explorer);

// Portals (glowing mushrooms)
const portals = [
  { name:"2d",    pos:[-8,0.8,-4], color:0xffe84c, label:"2D ART" },
  { name:"3d",    pos:[ 8,0.8,-4], color:0xa4d7ff, label:"3D ART" },
  { name:"about", pos:[-8,0.8,-13], color:0xf9b1e7, label:"ABOUT" },
  { name:"contact",pos:[ 8,0.8,-13], color:0x7d40e7, label:"CONTACT" },
];
const portalMeshes = [];
for (const p of portals) {
  // Mushroom stalk
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 1.1, 12),
    new THREE.MeshPhongMaterial({ color:0xf7f1e5, emissive:p.color, emissiveIntensity:0.15 })
  );
  stalk.position.set(p.pos[0], 0.55, p.pos[2]);
  scene.add(stalk);
  // Cap (glowing)
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 22, 12, 0, Math.PI*2, 0, Math.PI/1.1),
    new THREE.MeshPhongMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.45, transparent:true, opacity:0.92 })
  );
  cap.position.set(p.pos[0], 1.03, p.pos[2]);
  scene.add(cap);
  portalMeshes.push(cap);
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
    new THREE.PlaneGeometry(2.2,0.5),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(p.pos[0],1.75,p.pos[2]);
  scene.add(textMesh);
}

// Lighting & particles
scene.add(new THREE.AmbientLight(0xffffff,0.54));
const dirLight = new THREE.DirectionalLight(0xfff0b1,0.68); dirLight.position.set(10,13,4);
dirLight.castShadow = true;
scene.add(dirLight);

// Firefly particles
const fireflyGeo = new THREE.BufferGeometry();
const fireflyCount = 32;
const fireflyPositions = [];
for(let i=0;i<fireflyCount;i++){
  fireflyPositions.push(
    (Math.random()-0.5)*40, 0.5+Math.random()*5, (Math.random()-0.8)*40
  );
}
fireflyGeo.setAttribute('position', new THREE.Float32BufferAttribute(fireflyPositions, 3));
const fireflyMat = new THREE.PointsMaterial({ color:0xfffcba, size:0.18, transparent:true, opacity:0.6 });
const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
scene.add(fireflies);

// Camera follow logic (as before)
let angle = 0, velocity = 0;
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
function moveExplorer(dt) {
  let move = 0, steer = 0;
  if(keys['w']||keys['arrowup']) move += 8*dt;
  if(keys['s']||keys['arrowdown']) move -= 8*dt;
  if(keys['a']||keys['arrowleft']) steer = 1.5;
  if(keys['d']||keys['arrowright']) steer = -1.5;
  angle += steer * move * dt * 2.1;
  explorer.rotation.y = angle;
  explorer.position.x += Math.sin(angle) * move;
  explorer.position.z += Math.cos(angle) * move;
  explorer.position.x = Math.max(Math.min(explorer.position.x,23),-23);
  explorer.position.z = Math.max(Math.min(explorer.position.z,23),-18);
}
function updateCamera() {
  const camDist = 8, camHeight = 3.3;
  const camDir = angle;
  const desiredPos = new THREE.Vector3(
    explorer.position.x - Math.sin(camDir)*camDist,
    explorer.position.y + camHeight,
    explorer.position.z - Math.cos(camDir)*camDist
  );
  camera.position.lerp(desiredPos, 0.14);
  camera.lookAt(
    explorer.position.x,
    explorer.position.y + 0.5,
    explorer.position.z
  );
}
// Animate portals
let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for(let i=0; i<portalMeshes.length; ++i) {
    portalMeshes[i].material.emissiveIntensity = 0.45 + 0.23*Math.abs(Math.sin(portalAnimTime*1.5+i));
    portalMeshes[i].position.y = portals[i].pos[1] + 0.19*Math.sin(portalAnimTime*1.2+i);
  }
}
// Animate fireflies
function animateFireflies(dt) {
  const positions = fireflies.geometry.attributes.position.array;
  for(let i=0;i<fireflyCount;i++){
    positions[i*3+1] += Math.sin(performance.now()/800 + i)*0.011;
  }
  fireflies.geometry.attributes.position.needsUpdate = true;
}
// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  if(!document.getElementById('overlay-home').classList.contains('visible')) {
    moveExplorer(dt);
  }
  animatePortals(dt);
  animateFireflies(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
