// === Elden Ring Tribute: Tarnished Journey ===
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6a5130, 22, 62);

// Camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1200);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0x2f2b20, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Distant Erdtree (simplified)
const erdtreeGeo = new THREE.ConeGeometry(2.6, 18, 36);
const erdtreeMat = new THREE.MeshBasicMaterial({ color:0xeedc82, transparent:true, opacity:0.32 });
const erdtree = new THREE.Mesh(erdtreeGeo, erdtreeMat);
erdtree.position.set(0,9,-65);
scene.add(erdtree);

// Ground (brown-green fading)
const groundGeo = new THREE.PlaneGeometry(70,70,1,1);
const groundMat = new THREE.MeshPhongMaterial({ color:0x6e613a, shininess: 12 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2; ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// Subtle misty overlay
const mistGeo = new THREE.PlaneGeometry(70, 40);
const mistMat = new THREE.MeshBasicMaterial({color:0xeedc8266, transparent:true, opacity:0.06});
const mist = new THREE.Mesh(mistGeo, mistMat);
mist.position.set(0,7,-12);
scene.add(mist);

// --- CHURCH MODEL: GLB LOADING ---
// Change the filename below as needed (e.g. "my-church.glb")
const CHURCH_MODEL_PATH = "my-church.glb";
// Place the model near the center but offset from portals
const CHURCH_MODEL_POSITION = { x: 0, y: 0, z: -10 }; // Change as needed

let churchModel = null;
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load(
  CHURCH_MODEL_PATH,
  function(gltf) {
    churchModel = gltf.scene;
    // Optional: scale and position the church
    churchModel.position.set(CHURCH_MODEL_POSITION.x, CHURCH_MODEL_POSITION.y, CHURCH_MODEL_POSITION.z);
    // Try to fit the scale to the scene
    let scale = 1;
    // Auto-scale if you want, or set manually:
    // scale = 0.5; // For big models, try 0.1, 0.5, etc.
    churchModel.scale.set(scale, scale, scale);
    churchModel.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    scene.add(churchModel);
  },
  undefined,
  function(err) {
    console.error("Failed to load GLB model:", err);
  }
);


// Sites of Grace (portals)
const sites = [
  { name:"gear",   pos:[-10,0.85,-7], color:0xffe36f, label:"WEAPONS" },
  { name:"ashes",  pos:[ 10,0.85,-7], color:0xd2f6f8, label:"SPIRIT ASHES" },
  { name:"about",  pos:[-10,0.85,-16], color:0xcfc488, label:"ABOUT" },
  { name:"contact",pos:[ 10,0.85,-16], color:0xffd900, label:"CONTACT" }
];
const siteMeshes = [];
for (const s of sites) {
  // Main glowing pillar (cylinder)
  const grace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 2.3, 28),
    new THREE.MeshPhongMaterial({ color:s.color, emissive:s.color, emissiveIntensity:0.38, transparent:true, opacity:0.82 })
  );
  grace.position.set(...s.pos);
  grace.castShadow = true;
  grace.receiveShadow = true;
  grace.userData = { target:s.name };
  scene.add(grace);
  siteMeshes.push(grace);
  // Glowing base circle
  const base = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.15, 40),
    new THREE.MeshBasicMaterial({ color:s.color, transparent:true, opacity:0.31, side:THREE.DoubleSide })
  );
  base.position.set(s.pos[0], 0.03, s.pos[2]);
  base.rotation.x = -Math.PI/2;
  scene.add(base);
  // Floating label (canvas texture)
  const canvas = document.createElement('canvas');
  canvas.width = 250; canvas.height = 56;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 32px Garamond";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.shadowColor = "#ffd900";
  ctx.shadowBlur = 16;
  ctx.fillText(s.label,125,40);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5,0.46),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(s.pos[0],s.pos[1]+1.7,s.pos[2]);
  scene.add(textMesh);
}

// --- Tarnished on Spectral Steed (Simple figure) ---
const tarnished = new THREE.Group();
// Horse body
const horseBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.75,0.36,1.4),
  new THREE.MeshPhongMaterial({ color:0x9298ae, shininess: 18 })
);
horseBody.position.set(0, 0.23, 0);
horseBody.castShadow = true;
tarnished.add(horseBody);
// Horse head
const horseHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.32,0.21,0.32),
  new THREE.MeshPhongMaterial({ color:0x9298ae })
);
horseHead.position.set(0, 0.39, 0.73);
tarnished.add(horseHead);
// Horse legs
for (let dx of [-0.24,0.24]) {
  for (let dz of [-0.52,0.52]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07,0.09,0.42,8),
      new THREE.MeshPhongMaterial({color:0x22242c})
    );
    leg.position.set(dx,-0.17,dz);
    tarnished.add(leg);
  }
}
// Rider body
const bodyRider = new THREE.Mesh(
  new THREE.CylinderGeometry(0.13,0.13,0.34, 12),
  new THREE.MeshPhongMaterial({ color:0xbda56a })
);
bodyRider.position.set(0,0.49,0.13);
tarnished.add(bodyRider);
// Rider head (helmet)
const headRider = new THREE.Mesh(
  new THREE.SphereGeometry(0.14, 16, 12),
  new THREE.MeshPhongMaterial({ color:0xddd492, shininess: 32 })
);
headRider.position.set(0,0.68,0.13);
tarnished.add(headRider);
// Tiny plume
const plume = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045,0.02,0.23,8),
  new THREE.MeshPhongMaterial({ color:0x7c5a1f })
);
plume.position.set(0,0.82,0.13);
tarnished.add(plume);
// Sword (on back)
const sword = new THREE.Mesh(
  new THREE.BoxGeometry(0.07,0.37,0.07),
  new THREE.MeshPhongMaterial({ color:0xa4a4a4 })
);
sword.position.set(-0.13,0.58,0.01);
sword.rotation.z = 0.4;
tarnished.add(sword);

// Fake shadow
const tShadowGeo = new THREE.PlaneGeometry(1.2,2.0);
const tShadowMat = new THREE.MeshBasicMaterial({color:0x15120a, transparent:true, opacity:0.12});
const tShadow = new THREE.Mesh(tShadowGeo, tShadowMat);
tShadow.rotation.x = -Math.PI/2;
tShadow.position.y = 0.01;
tarnished.add(tShadow);

// Starting position
tarnished.position.set(0,0.33,5);
scene.add(tarnished);

// Lighting
const ambLight = new THREE.AmbientLight(0xf6edc3,0.43); scene.add(ambLight);
const dirLight = new THREE.DirectionalLight(0xfff0b1,0.85); dirLight.position.set(7,12,5);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.mapSize.set(1024,1024);
scene.add(dirLight);

// Camera start position and follow logic
let cameraTarget = new THREE.Vector3();
camera.position.set(0,5,13);
camera.lookAt(tarnished.position);

// Responsive
window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);

// Movement/physics (steed is faster, feels floaty)
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let velocity = 0, angle = 0, steer = 0;
function moveTarnished(dt) {
  // Forward/reverse (speedy)
  if(keys['w']||keys['arrowup']) velocity += 16*dt;
  if(keys['s']||keys['arrowdown']) velocity -= 15*dt;
  // Friction
  velocity *= 0.96;
  if(velocity>13) velocity=13;
  if(velocity<-9) velocity=-9;
  // Steering (steer more at slow speeds)
  steer = 0;
  if(keys['a']||keys['arrowleft']) steer = 1.5;
  if(keys['d']||keys['arrowright']) steer = -1.5;
  angle += steer * Math.sign(velocity) * dt * (1.45 - Math.abs(velocity)/17);
  // Move
  tarnished.rotation.y = angle;
  tarnished.position.x += Math.sin(angle) * velocity * dt;
  tarnished.position.z += Math.cos(angle) * velocity * dt;
  tarnished.position.x = Math.max(Math.min(tarnished.position.x,33),-33);
  tarnished.position.z = Math.max(Math.min(tarnished.position.z,33),-18);
}

// Camera follow: smooth chase from behind
let camLerpAlpha = 0.13;
function updateCamera() {
  const camDist = 10.5, camHeight = 4.6;
  const charDir = angle;
  const desiredPos = new THREE.Vector3(
    tarnished.position.x - Math.sin(charDir)*camDist,
    tarnished.position.y + camHeight,
    tarnished.position.z - Math.cos(charDir)*camDist
  );
  camera.position.lerp(desiredPos, camLerpAlpha);
  const lookAtTarget = new THREE.Vector3(
    tarnished.position.x,
    tarnished.position.y + 0.85,
    tarnished.position.z
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

// Site of Grace collision detection
function checkSites() {
  for(const [i,s] of sites.entries()) {
    const dx = tarnished.position.x - s.pos[0];
    const dz = tarnished.position.z - s.pos[2];
    if(Math.abs(dx)<1.4 && Math.abs(dz)<1.4) {
      openOverlay(s.name);
      // Reset position
      tarnished.position.set(0,0.33,5);
      velocity = 0;
      angle = 0;
      break;
    }
  }
}

// Animate Sites of Grace (pulse, float, glow)
let siteAnimTime = 0;
function animateSites(dt) {
  siteAnimTime += dt;
  for(let i=0; i<siteMeshes.length; ++i) {
    siteMeshes[i].material.emissiveIntensity = 0.32 + 0.28*Math.abs(Math.sin(siteAnimTime*1.2+i));
    siteMeshes[i].scale.y = 1 + 0.13*Math.sin(siteAnimTime*1.8+i);
    siteMeshes[i].position.y = sites[i].pos[1] + 0.12*Math.sin(siteAnimTime*1.3+i);
  }
}

// Main render loop
let lastTime = performance.now();
function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  // Move
  if(!document.getElementById('overlay-home').classList.contains('visible')) {
    moveTarnished(dt);
    checkSites();
  }
  animateSites(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
