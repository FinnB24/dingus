// FinnB24 Retro Webroom - Third/First Person, Mouse Orbit, True FPS, Fast Sprint, Hide Smiley in FPS

const container = document.getElementById('three-canvas');

let sceneState = "main";
let camera, renderer, lastTime;
let keys = {};
let isFirstPerson = false;
let pointerLocked = false;

// FPS and Third Person Camera State
let yaw = 0, pitch = 0; // FPS mode: yaw/pitch
let tpYaw = 0, tpPitch = 0; // Third-person orbit
const PITCH_LIMIT = Math.PI / 2.2; // up/down look clamp for both modes

// Mouse drag state for third person orbit
let isOrbiting = false;
let lastMouseX = 0, lastMouseY = 0;

// --------- SCENE 1: Main Webroom ---------

let scene, playerGroup, ring, angle, velocity, steer, jumpVel, isGrounded;
let floor, portalMeshes, portals;

function initMainScene() {
  // SCENE
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x664aff, 28, 72);

  // CAMERA
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 13);

  // RENDERER
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x664aff, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Pointer lock
    renderer.domElement.addEventListener('click', function (e) {
      // Only try to lock pointer if in FPS mode
      if (isFirstPerson && !pointerLocked) requestPointerLock();
    });

    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
    document.addEventListener('mousemove', onMouseMove, false);

    // Mouse orbit for third person
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseDrag, false);
  }

  // FLOOR: neon checkerboard + grid
  const floorGeo = new THREE.PlaneGeometry(45, 45, 30, 30);
  const colors = [];
  for (let i = 0; i < floorGeo.attributes.position.count; i++) {
    const x = floorGeo.attributes.position.getX(i);
    const z = floorGeo.attributes.position.getZ(i);
    const checker = (Math.floor(x + 22.5) + Math.floor(z + 22.5)) % 2;
    colors.push(checker ? 0.45 : 0.25, 0.28, checker ? 0.7 : 0.4);
  }
  floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const floorMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 18 });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(45, 30, 0xcba7ff, 0xee77ff);
  grid.position.y = 0.018;
  scene.add(grid);

  // Vaporwave sun
  const sunGeo = new THREE.CircleGeometry(4.7, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff0b1, transparent: true, opacity: 0.65 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(-11, 14, -31);
  scene.add(sun);

  // PLAYER: floating pixel smiley
  playerGroup = new THREE.Group();
  // Smiley
  const smileyMat = new THREE.MeshPhongMaterial({ color: 0xfff340, shininess: 55 });
  const smiley = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), smileyMat);
  smiley.castShadow = true;
  smiley.receiveShadow = true;
  smiley.geometry.translate(0, 0, 0);
  playerGroup.add(smiley);
  // Eyes
  for (let dx of [-0.26, 0.26]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.04), new THREE.MeshBasicMaterial({ color: 0x222, transparent: true }));
    eye.position.set(dx, 0.18, 0.56);
    playerGroup.add(eye);
  }
  // Smile
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0x222 }));
  mouth.position.set(0, -0.16, 0.56);
  playerGroup.add(mouth);
  // Glow ring (always visible)
  ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 8, 30), new THREE.MeshBasicMaterial({ color: 0xcba7ff, transparent: true, opacity: 0.32 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.46;
  playerGroup.add(ring);

  playerGroup.position.set(0, 0.7, 5);
  scene.add(playerGroup);

  // CRT TV Portals
  portals = [
    { name: "art", pos: [-8, 1.05, -4], color: 0x81fff9, label: "ART" },
    { name: "music", pos: [8, 1.05, -4], color: 0xff80d9, label: "MUSIC" },
    { name: "about", pos: [-8, 1.05, -13], color: 0xfffa82, label: "ABOUT" },
    { name: "contact", pos: [8, 1.05, -13], color: 0x92ff8a, label: "CONTACT" },
  ];
  portalMeshes = [];
  for (const p of portals) {
    const crt = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 1.3, 0.9),
      new THREE.MeshPhongMaterial({ color: 0x232335, shininess: 22 })
    );
    crt.add(body);
    // Screen
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.99, 0.08),
      new THREE.MeshPhongMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 })
    );
    screen.position.z = 0.49;
    crt.add(screen);
    // Stand
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.22, 10),
      new THREE.MeshPhongMaterial({ color: 0x2a1a44, shininess: 3 })
    );
    stand.position.y = -0.75;
    crt.add(stand);
    crt.position.set(...p.pos);
    crt.castShadow = true; crt.receiveShadow = true;
    crt.userData = { target: p.name };
    scene.add(crt);
    portalMeshes.push(crt);
    // Text label above
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = "bold 40px VT323";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fillText(p.label, 128, 46);
    const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
    const textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.48),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    textMesh.position.set(p.pos[0], p.pos[1] + 1.18, p.pos[2]);
    scene.add(textMesh);
  }

  // Neon ambient + colored point lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.65); dirLight.position.set(12, 13, 9);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0xff80d9, 0.19, 40); pointLight.position.set(-10, 8, -6); scene.add(pointLight);
  const pointLight2 = new THREE.PointLight(0x81fff9, 0.14, 40); pointLight2.position.set(10, 8, -6); scene.add(pointLight2);

  // Player movement state
  angle = 0;
  velocity = 0;
  steer = 0;
  jumpVel = 0;
  isGrounded = true;

  // Mouse look state
  yaw = 0; pitch = 0;
  tpYaw = Math.PI; tpPitch = 0.15;

  camera.lookAt(playerGroup.position);
  window.addEventListener('resize', onWindowResize, false);
  setSmileyVisible(!isFirstPerson);
}

// Hide all but ring for FPS
function setSmileyVisible(isVisible) {
  playerGroup.children.forEach(child => {
    if (child === ring) return;
    child.visible = isVisible;
  });
}

// --------- MOUSE CONTROLS FOR THIRD PERSON ORBIT ---------
function onMouseDown(e) {
  if (!isFirstPerson && e.button === 2) { // right mouse
    isOrbiting = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
}
function onMouseUp(e) {
  if (e.button === 2) isOrbiting = false;
}
function onMouseDrag(e) {
  if (!isFirstPerson && isOrbiting) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    tpYaw -= dx * 0.012;
    tpPitch -= dy * 0.012;
    tpPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, tpPitch));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
}

// --------- POINTER LOCK FPS MOUSE LOOK ---------
function requestPointerLock() {
  renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock ||
    renderer.domElement.mozRequestPointerLock;
  renderer.domElement.requestPointerLock();
}
function onPointerLockChange() {
  pointerLocked = (document.pointerLockElement === renderer.domElement ||
    document.mozPointerLockElement === renderer.domElement);
}
function onMouseMove(event) {
  if (isFirstPerson && pointerLocked) {
    const movementX = event.movementX || event.mozMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || 0;
    yaw -= movementX * 0.0022;
    pitch -= movementY * 0.0015;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  }
}

// --------- MOVEMENT ---------
function movePlayer(dt) {
  // Sprint: very fast
  let moveSpeed = (keys['shift'] || keys['shiftleft']) ? 33.0 : 11.0;

  let moveForward = 0, moveRight = 0;
  if (keys['w'] || keys['arrowup']) moveForward += 1;
  if (keys['s'] || keys['arrowdown']) moveForward -= 1;
  if (keys['a'] || keys['arrowleft']) moveRight -= 1;
  if (keys['d'] || keys['arrowright']) moveRight += 1;
  // Normalize
  if (moveForward && moveRight) {
    moveForward *= Math.SQRT1_2;
    moveRight *= Math.SQRT1_2;
  }

  // Jump
  if ((keys[' '] || keys['space']) && isGrounded) {
    jumpVel = 8.7;
    isGrounded = false;
  }
  // Gravity
  if (!isGrounded) {
    jumpVel -= 18.8 * dt;
    playerGroup.position.y += jumpVel * dt;
    if (playerGroup.position.y <= 0.7) {
      playerGroup.position.y = 0.7;
      isGrounded = true;
      jumpVel = 0;
    }
  } else {
    playerGroup.position.y = isFirstPerson ? 0.7 : 0.7 + 0.13 * Math.sin(performance.now() / 520);
  }

  // FPS mode
  if (isFirstPerson) {
    setSmileyVisible(false);
    angle = yaw;
    const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    playerGroup.position.x += (sinY * moveForward + cosY * moveRight) * moveSpeed * dt;
    playerGroup.position.z += (cosY * moveForward - sinY * moveRight) * moveSpeed * dt;
  } else {
    setSmileyVisible(true);
    // Use the orbit yaw for camera and smiley rotation
    angle = tpYaw;
    playerGroup.rotation.y = angle;
    // Move relative to camera yaw
    const sinY = Math.sin(tpYaw), cosY = Math.cos(tpYaw);
    playerGroup.position.x += (sinY * moveForward + cosY * moveRight) * moveSpeed * dt;
    playerGroup.position.z += (cosY * moveForward - sinY * moveRight) * moveSpeed * dt;
  }

  playerGroup.position.x = Math.max(Math.min(playerGroup.position.x, 21), -21);
  playerGroup.position.z = Math.max(Math.min(playerGroup.position.z, 21), -17);

  ring.rotation.z += dt * 1.2;
}

// --------- CAMERA ---------
function updateCamera() {
  if (isFirstPerson) {
    // FPS: at "forehead"
    const camOffset = new THREE.Vector3(0, 0.31, 0);
    const eye = playerGroup.position.clone().add(camOffset);
    const forward = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );
    camera.position.copy(eye);
    camera.lookAt(eye.clone().add(forward));
  } else {
    // Third person orbit
    const camDist = 9.3, camHeight = 3.7;
    const orbitTarget = playerGroup.position.clone();
    const offset = new THREE.Vector3(
      Math.sin(tpYaw) * Math.cos(tpPitch) * camDist,
      Math.sin(tpPitch) * camDist + camHeight,
      Math.cos(tpYaw) * Math.cos(tpPitch) * camDist
    );
    camera.position.lerp(orbitTarget.clone().add(offset), 0.18);
    camera.lookAt(
      playerGroup.position.x,
      playerGroup.position.y + 0.27,
      playerGroup.position.z
    );
  }
}

// --------- REST OF GAME LOGIC (unchanged) ---------

function checkPortals() {
  for (const [i, p] of portals.entries()) {
    const dx = playerGroup.position.x - p.pos[0];
    const dz = playerGroup.position.z - p.pos[2];
    if (Math.abs(dx) < 1.7 && Math.abs(dz) < 1.3) {
      if (p.name === "art") {
        switchToArtScene();
      } else {
        openOverlay(p.name);
        playerGroup.position.set(0, 0.7, 5);
        velocity = 0;
        angle = 0;
        jumpVel = 0;
        isGrounded = true;
      }
      break;
    }
  }
}

let portalAnimTime = 0;
function animatePortals(dt) {
  portalAnimTime += dt;
  for (let i = 0; i < portalMeshes.length; ++i) {
    const crt = portalMeshes[i];
    crt.children[1].material.emissiveIntensity = 0.25 + 0.19 * Math.abs(Math.sin(portalAnimTime * 1.5 + i));
    crt.position.y = portals[i].pos[1] + 0.17 * Math.sin(portalAnimTime * 1.1 + i);
    crt.rotation.y = Math.sin(performance.now() / 900 + i) * 0.09;
  }
}

// --------- ART SCENE (unchanged) ---------

let artScene, artCamera, artObjects, artAnimTime;
function initArtScene() {
  artScene = new THREE.Scene();
  artScene.fog = new THREE.Fog(0xffb4fa, 20, 70);
  artCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  artCamera.position.set(0, 6, 18);
  artCamera.lookAt(0, 2, 0);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshPhongMaterial({ color: 0xffb4fa, shininess: 60 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  artScene.add(floor);

  const grid = new THREE.GridHelper(40, 24, 0x9bf6ff, 0xcba7ff);
  grid.position.y = 0.01;
  artScene.add(grid);

  artObjects = [];
  for (let i = 0; i < 6; ++i) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2.5, 0.35),
      new THREE.MeshPhongMaterial({ color: [0x81fff9, 0xff80d9, 0xfffa82, 0x92ff8a, 0xcba7ff, 0xffb4fa][i], shininess: 90 })
    );
    mesh.position.set(-8 + i * 3.2, 2, -2);
    artScene.add(mesh);
    artObjects.push(mesh);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 60px VT323";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 12;
  ctx.fillText("ART GALLERY", 200, 65);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  textMesh.position.set(0, 6, 0);
  artScene.add(textMesh);

  artScene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.45); dirLight.position.set(4, 20, 8);
  dirLight.castShadow = true;
  artScene.add(dirLight);
  artAnimTime = 0;
  window.addEventListener('resize', onWindowResize, false);
}
function animateArtScene(dt) {
  artAnimTime += dt;
  for (let i = 0; i < artObjects.length; ++i) {
    let mesh = artObjects[i];
    mesh.position.y = 2 + Math.sin(artAnimTime * 1.5 + i) * 0.19;
    mesh.rotation.y = Math.sin(artAnimTime + i) * 0.1;
  }
}

// --------- RENDER LOOP AND SCENE SWITCH ---------

function onWindowResize() {
  if (sceneState === "main") {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  } else if (sceneState === "art") {
    artCamera.aspect = window.innerWidth / window.innerHeight;
    artCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function animate() {
  let now = performance.now(), dt = lastTime ? (now - lastTime) / 1000 : 0.016;
  lastTime = now;

  if (sceneState === "main") {
    if (!document.getElementById('overlay-home').classList.contains('visible')) {
      movePlayer(dt);
      checkPortals();
    }
    animatePortals(dt);
    updateCamera();
    renderer.render(scene, camera);
  } else if (sceneState === "art") {
    animateArtScene(dt);
    renderer.render(artScene, artCamera);
  }
  requestAnimationFrame(animate);
}

// --------- EVENT & OVERLAY LOGIC ---------

function openOverlay(name) {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('visible'));
  document.getElementById('overlay-' + name).classList.add('visible');
}
function closeOverlay(name) {
  document.getElementById('overlay-' + name).classList.remove('visible');
}
document.addEventListener('keydown', e => {
  if (document.getElementById('overlay-home').classList.contains('visible') && (e.key === 'Enter' || e.key === ' ')) {
    closeOverlay('home');
  }
});

// Key listeners for movement and camera toggle
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'c') {
    isFirstPerson = !isFirstPerson;
    if (isFirstPerson && !pointerLocked) requestPointerLock();
    if (!isFirstPerson && pointerLocked) document.exitPointerLock();
    setSmileyVisible(!isFirstPerson);
  }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// --------- SCENE SWITCH ---------

function switchToArtScene() {
  sceneState = "art";
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('visible'));
  keys = {};
  if (pointerLocked) document.exitPointerLock();
  pointerLocked = false;
  initArtScene();
}

// --------- INIT ---------

initMainScene();
lastTime = performance.now();
animate();
