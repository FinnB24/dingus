// === State & Constants ===
let scene, camera, renderer, clock, container;
let mode = "drive"; // "drive" or "walk"
let wasd = {w:false,a:false,s:false,d:false,arrowup:false,arrowdown:false,arrowleft:false,arrowright:false, shift:false, ' ':false};
let keys = {};
let warthog, hogAngle=0, hogVel=0, hogSteer=0;
let walker, walkVel=0, walkYaw=0, walkPitch=0;
let walkY = 0.43, walkYVel = 0, walkOnGround = true;
let camLerpAlpha = 0.16;
let buildings = [];
let inRoom = null;
let lastTime = performance.now();
let pointerLocked = false;
let buildingData = [
  {pos:[-10,0.8,-7],size:[5,3,5],name:'2D Art',text:'Here are <b>my 2D artworks</b>. Replace this with your gallery.'},
  {pos:[10,0.8,-7],size:[5,3,5],name:'3D Art',text:'Here are <b>my 3D models</b> and renders.'},
  {pos:[-10,0.8,-18],size:[5,3,5],name:'About',text:'About me: I am FinnB24.<br>This is a Halo-inspired portfolio.'},
  {pos:[10,0.8,-18],size:[5,3,5],name:'Contact',text:'Contact: <a href="mailto:your@email.com">your@email.com</a><br>GitHub: <a href="https://github.com/FinnB24" target="_blank">FinnB24</a>'}
];

// === Overlay helpers ===
function openOverlay(name) {
  document.getElementById('overlay-'+name).classList.add('visible');
  updateCrosshair();
}
function closeOverlay(name) {
  document.getElementById('overlay-'+name).classList.remove('visible');
  updateCrosshair();
}
function updateCrosshair() {
  const crosshair = document.getElementById('crosshair');
  const overlayOpen = !!document.querySelector('.overlay.visible');
  if(mode === "walk" && !overlayOpen && pointerLocked) {
    crosshair.style.display = "block";
    if(!crosshair.querySelector('.crosshair-dot')) {
      let dot = document.createElement('div');
      dot.className = "crosshair-dot";
      crosshair.appendChild(dot);
    }
  } else {
    crosshair.style.display = "none";
    if(crosshair.querySelector('.crosshair-dot')) {
      crosshair.innerHTML = "";
    }
  }
}

// === Scene setup ===
initScene();
function initScene() {
  container = document.getElementById('three-canvas');
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1e2f, 28, 70);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setClearColor(0x0d1e2f, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  clock = new THREE.Clock();

  // Skybox (simple starfield effect)
  makeSkybox();

  // Halo ring (background)
  const haloRingGeo = new THREE.TorusGeometry(38, 0.19, 32, 180);
  const haloRingMat = new THREE.MeshBasicMaterial({ color: 0x71f7ff, transparent: true, opacity: 0.22 });
  const haloRing = new THREE.Mesh(haloRingGeo, haloRingMat);
  haloRing.position.set(0, 24, -80);
  haloRing.rotation.x = Math.PI/2.2;
  haloRing.rotation.z = -Math.PI/18;
  scene.add(haloRing);

  // Ground, grid, and some rocks
  const groundGeo = new THREE.PlaneGeometry(70, 70, 1, 1);
  const groundMat = new THREE.MeshPhongMaterial({ color:0x243547, shininess: 40, reflectivity:0.13 });
  const floor = new THREE.Mesh(groundGeo, groundMat);
  floor.rotation.x = -Math.PI/2; floor.position.y = 0;
  floor.receiveShadow = true; scene.add(floor);

  const grid = new THREE.GridHelper(60, 30, 0x71f7ff, 0x1b3554);
  grid.position.y = 0.012; scene.add(grid);

  for(let i=0;i<7;++i){
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6+Math.random()*1.2,0),
      new THREE.MeshPhongMaterial({color:0x222e3b})
    );
    rock.position.set((Math.random()-0.5)*60,0.32,(Math.random()-0.5)*60);
    rock.castShadow = true; scene.add(rock);
  }

  // Lighting
  scene.add(new THREE.AmbientLight(0x3aefff,0.34));
  const dirLight = new THREE.DirectionalLight(0x71f7ff,0.9); dirLight.position.set(12,27,11);
  dirLight.castShadow = true; dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 80;
  dirLight.shadow.mapSize.set(1600,1600); scene.add(dirLight);

  // Warthog (detailed blocky)
  warthog = makeWarthog();
  // Place in middle, facing south (toward buildings)
  warthog.position.set(0,0.39,-2.5);
  hogAngle = Math.PI; // face toward positive z (toward the doors)
  warthog.rotation.y = hogAngle;
  scene.add(warthog);

  // Walker (person)
  walker = makeWalker();
  walker.position.set(warthog.position.x+1.5,walkY,warthog.position.z+0.4);
  walker.visible = false;
  scene.add(walker);

  // Buildings
  buildings = [];
  for (const b of buildingData) {
    let building = makeBuilding(b.size, b.name, b.text);
    building.position.set(...b.pos);
    buildings.push(building);
    scene.add(building);
  }

  // Camera start position
  camera.position.set(0,7,11);
  camera.lookAt(warthog.position);

  // Input
  window.addEventListener('resize',onResize, false);
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);

  // Pointer lock for mouse look
  renderer.domElement.addEventListener('click', function() {
    if (mode === "walk" && !pointerLocked && !document.querySelector('.overlay.visible')) {
      renderer.domElement.requestPointerLock();
    }
  }, false);

  document.addEventListener('pointerlockchange', onPointerLockChange, false);
  document.addEventListener('mousemove', onMouseMove, false);

  animate();
}

// === Skybox ===
function makeSkybox() {
  let skyGeo = new THREE.SphereGeometry(100,32,32);
  let canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  let ctx = canvas.getContext('2d');
  ctx.fillStyle="#111b2c"; ctx.fillRect(0,0,512,512);
  for (let i=0;i<220;++i) {
    let x = Math.random()*512, y = Math.random()*512, r = Math.random()*1.8+0.6;
    ctx.fillStyle=`rgba(113,247,255,${Math.random()*0.6+0.3})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  let tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  let mat = new THREE.MeshBasicMaterial({ map: tex, side:THREE.BackSide });
  let mesh = new THREE.Mesh(skyGeo, mat);
  scene.add(mesh);
}

// ... Warthog, Walker, Building code unchanged ...

// === Input Handlers ===
function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
}
function onKeyDown(e) {
  keys[e.key.toLowerCase()] = true;
  wasd[e.key.toLowerCase()] = true;
  if(e.key === "Shift") wasd.shift = true;
  if(e.key === " ") wasd[" "] = true;
  if (e.key === 'e' || e.key === 'E') tryToggleMode();
  if (inRoom && (e.key==='e'||e.key==='E')) closeOverlay('inroom');
}
function onKeyUp(e) {
  keys[e.key.toLowerCase()] = false;
  wasd[e.key.toLowerCase()] = false;
  if(e.key === "Shift") wasd.shift = false;
  if(e.key === " ") wasd[" "] = false;
}

// === Pointer lock ===
function onPointerLockChange() {
  pointerLocked = !!(document.pointerLockElement === renderer.domElement);
  updateCrosshair();
}
function onMouseMove(e) {
  if (mode === "walk" && pointerLocked) {
    const sensitivity = 0.0022;
    walkYaw -= e.movementX * sensitivity;
    walkPitch -= e.movementY * sensitivity;
    walkPitch = Math.max(-Math.PI/2+0.09, Math.min(Math.PI/2-0.09, walkPitch));
  }
}

// === Toggle between drive/walk ===
function tryToggleMode() {
  if (mode === "drive") {
    if (Math.abs(hogVel)<1.5) {
      walker.position.set(
        warthog.position.x+Math.sin(hogAngle+Math.PI/2)*1.1,
        walkY,
        warthog.position.z+Math.cos(hogAngle+Math.PI/2)*1.1
      );
      walker.visible = true;
      walkYaw = hogAngle;
      walkPitch = 0;
      walkYVel = 0;
      walkOnGround = true;
      mode = "walk";
      updateCrosshair();
    }
  } else if (mode === "walk") {
    let dist = walker.position.distanceTo(warthog.position);
    if (dist<2.1) {
      mode = "drive";
      walker.visible = false;
      if (pointerLocked) document.exitPointerLock();
      updateCrosshair();
    }
  }
}

// === Animation Loop ===
function animate() {
  let now = performance.now(), dt = Math.min((now-lastTime)/1000,0.045);
  lastTime = now;

  if (!document.getElementById('overlay-help').classList.contains('visible') && !inRoom) {
    if (mode==="drive") moveWarthog(dt);
    else moveWalker(dt);
  }

  updateCamera();
  checkBuildings();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// === Warthog drive logic ===
function moveWarthog(dt) {
  // Controls
  hogSteer = 0;
  if(keys['w']||keys['arrowup']) hogVel += 17*dt;
  if(keys['s']||keys['arrowdown']) hogVel -= 17*dt;
  if(keys['a']||keys['arrowleft']) hogSteer = 1.4;
  if(keys['d']||keys['arrowright']) hogSteer = -1.4;
  hogVel *= 0.96;
  if(hogVel>14) hogVel=14; if(hogVel<-7) hogVel=-7;
  hogAngle += hogSteer * Math.sign(hogVel) * dt * (1.2 - Math.abs(hogVel)/15);
  warthog.rotation.y = hogAngle;
  warthog.position.x += Math.sin(hogAngle) * hogVel * dt;
  warthog.position.z += Math.cos(hogAngle) * hogVel * dt;
  warthog.position.x = Math.max(Math.min(warthog.position.x,32),-32);
  warthog.position.z = Math.max(Math.min(warthog.position.z,32),-32);
}

// === Walker logic (WASD + Mouse Look, with Sprint and Jump) ===
function moveWalker(dt) {
  // Movement input
  let moveX = 0, moveZ = 0;
  if(wasd['w']||wasd['arrowup']) moveZ += 1;
  if(wasd['s']||wasd['arrowdown']) moveZ -= 1;
  if(wasd['a']||wasd['arrowleft']) moveX -= 1;
  if(wasd['d']||wasd['arrowright']) moveX += 1;
  let sprint = wasd['shift'] ? 2.1 : 1;
  let speed = 4.2 * sprint;
  // Jump
  if ((wasd[' '] || wasd['space']) && walkOnGround) {
    walkYVel = 6.3;
    walkOnGround = false;
  }
  // Gravity
  walkYVel -= 18 * dt;
  walkY += walkYVel * dt;
  if (walkY <= 0.43) {
    walkY = 0.43;
    walkYVel = 0;
    walkOnGround = true;
  }
  // Combine movement with camera yaw
  let len = Math.hypot(moveX,moveZ);
  if (len>0) {
    moveX/=len; moveZ/=len;
    // Forward = camera yaw, Right = camera yaw + PI/2
    let forward = new THREE.Vector3(Math.sin(walkYaw),0,Math.cos(walkYaw));
    let right = new THREE.Vector3(Math.sin(walkYaw+Math.PI/2),0,Math.cos(walkYaw+Math.PI/2));
    let move = forward.multiplyScalar(moveZ).add(right.multiplyScalar(moveX));
    walker.position.x += move.x * speed * dt;
    walker.position.z += move.z * speed * dt;
    walker.position.x = Math.max(Math.min(walker.position.x,32),-32);
    walker.position.z = Math.max(Math.min(walker.position.z,32),-32);
    walker.rotation.y = walkYaw;
  }
  walker.position.y = walkY;

  // Subtle up/down bob if running
  if (len>0) walker.position.y += 0.03*Math.abs(Math.sin(performance.now()/140));
}

// === Camera follow logic ===
function updateCamera() {
  if (mode === "drive") {
    // Third person chase
    let camDist = 13.5, camHeight = 5.8;
    let hogDir = hogAngle;
    let desiredPos = new THREE.Vector3(
      warthog.position.x - Math.sin(hogDir)*camDist,
      warthog.position.y + camHeight,
      warthog.position.z - Math.cos(hogDir)*camDist
    );
    camera.position.lerp(desiredPos, camLerpAlpha);
    let lookAtTarget = new THREE.Vector3(
      warthog.position.x,
      warthog.position.y + 0.97,
      warthog.position.z
    );
    camera.lookAt(lookAtTarget);
  } else {
    // First person: camera at head
    let eyeHeight = 0.51;
    camera.position.set(
      walker.position.x,
      walker.position.y + eyeHeight,
      walker.position.z
    );
    // Look direction: based on yaw/pitch (mouse look)
    let dir = new THREE.Vector3(
      Math.sin(walkYaw)*Math.cos(walkPitch),
      Math.sin(walkPitch),
      Math.cos(walkYaw)*Math.cos(walkPitch)
    );
    let lookAtTarget = new THREE.Vector3().copy(camera.position).add(dir);
    camera.lookAt(lookAtTarget);
  }
}

// === Check if entering building ===
function checkBuildings() {
  if (mode!=="walk" || inRoom) return;
  for (let i=0; i<buildings.length; ++i) {
    let b = buildings[i];
    let entry = b.position.clone(); entry.z += b.userData.size[2]/2+0.11;
    let dist = walker.position.distanceTo(entry);
    if (dist<0.78) {
      // Enter building!
      inRoom = i;
      showRoom(i);
      return;
    }
  }
}

// === Show overlay when inside a room ===
function showRoom(idx) {
  const b = buildingData[idx];
  document.getElementById('room-title').textContent = b.name;
  document.getElementById('room-content').innerHTML = b.text;
  openOverlay('inroom');
}

// === Overlay close ===
document.querySelector('.overlay#overlay-inroom .close').onclick = function() {
  inRoom = null;
  closeOverlay('inroom');
}

// === Help overlay close ===
document.querySelector('#overlay-help button').onclick = function() {
  closeOverlay('help');
  updateCrosshair();
}
