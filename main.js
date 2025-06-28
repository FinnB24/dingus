// Retro Dreamcore - FinnB24 Webroom with Jump, Sprint, Scene Switch, FPS/Third-Person Camera Toggle, and Mouse Look

const container = document.getElementById('three-canvas');

// Scene state manager
let sceneState = "main"; // or "art", "music", etc

// Globals for both scenes
let camera, renderer, lastTime;
let keys = {};
let isFirstPerson = false;

// FPS mouse look state
let pointerLocked = false;
let yaw = 0;       // horizontal (left/right)
let pitch = 0;     // vertical (up/down)
const PITCH_LIMIT = Math.PI / 2.2;

// --------- SCENE 1: Main Webroom ---------

let scene, playerGroup, ring, angle, velocity, steer, jumpVel, isGrounded;
let floor, portalMeshes, portals;

function initMainScene() {
  // SCENE
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x664aff, 28, 72);

  // CAMERA
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,5,13);

  // RENDERER
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setClearColor(0x664aff, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Pointer lock: only ever add these once!
    renderer.domElement.addEventListener('click', function() {
      if(isFirstPerson && !pointerLocked){
        requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('mozpointerlockchange', onPointerLockChange, false);

    document.addEventListener('mousemove', onMouseMove, false);
  }

  // FLOOR: neon checkerboard + grid
  const floorGeo = new THREE.PlaneGeometry(45, 45, 30, 30);
  const colors = [];
  for (let i = 0; i < floorGeo.attributes.position.count; i++) {
    const x = floorGeo.attributes.position.getX(i);
    const z = floorGeo.attributes.position.getZ(i);
    const checker = (Math.floor(x+22.5)+Math.floor(z+22.5)) % 2;
    colors.push(checker ? 0.45 : 0.25, 0.28, checker ? 0.7 : 0.4);
  }
  floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const floorMat = new THREE.MeshPhongMaterial({ vertexColors:true, shininess: 18 });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2; floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(45, 30, 0xcba7ff, 0xee77ff);
  grid.position.y = 0.018;
  scene.add(grid);

  // Vaporwave sun
  const sunGeo = new THREE.CircleGeometry(4.7, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.65 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(-11, 14, -31);
  scene.add(sun);

  // PLAYER: floating pixel smiley
  playerGroup = new THREE.Group();
  // Smiley
  const smileyMat = new THREE.MeshPhongMaterial({ color: 0xfff340, shininess: 55 });
  const smiley = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,1.1), smileyMat);
  smiley.castShadow = true;
  smiley.receiveShadow = true;
  smiley.geometry.translate(0, 0, 0);
  playerGroup.add(smiley);
  // Eyes
  for (let dx of [-0.26,0.26]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.17,0.17,0.04), new THREE.MeshBasicMaterial({ color:0x222, transparent:true }));
    eye.position.set(dx, 0.18, 0.56);
    playerGroup.add(eye);
  }
  // Smile
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.08,0.04), new THREE.MeshBasicMaterial({ color:0x222 }));
  mouth.position.set(0, -0.16, 0.56);
  playerGroup.add(mouth);
  // Glow ring
  ring = new THREE.Mesh(new THREE.TorusGeometry(0.78,0.07,8,30), new THREE.MeshBasicMaterial({color:0xcba7ff, transparent:true, opacity:0.32}));
  ring.rotation.x = Math.PI/2;
  ring.position.y = -0.46;
  playerGroup.add(ring);

  playerGroup.position.set(0,0.7,5);
  scene.add(playerGroup);

  // CRT TV Portals
  portals = [
    { name:"art",    pos:[-8,1.05,-4], color:0x81fff9, label:"ART" },
    { name:"music",  pos:[ 8,1.05,-4], color:0xff80d9, label:"MUSIC" },
    { name:"about",  pos:[-8,1.05,-13], color:0xfffa82, label:"ABOUT" },
    { name:"contact",pos:[ 8,1.05,-13], color:0x92ff8a, label:"CONTACT" },
  ];
  portalMeshes = [];
  for (const p of portals) {
    const crt = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.05,1.3,0.9),
      new THREE.MeshPhongMaterial({ color:0x232335, shininess:22 })
    );
    crt.add(body);
    // Screen
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

  // Player movement state
  angle = 0;
  velocity = 0;
  steer = 0;
  jumpVel = 0;
  isGrounded = true;

  // Mouse look state
  yaw = 0;
  pitch = 0;

  // Set up
  camera.lookAt(playerGroup.position);
  window.addEventListener('resize', onWindowResize, false);
}

function movePlayer(dt) {
  // Movement speed and sprint
  let moveSpeed = 11.0;
  if (keys['shift'] || keys['shiftleft']) moveSpeed = 19.0;

  // Forward/reverse
  if(keys['w']||keys['arrowup']) velocity += moveSpeed*dt;
  if(keys['s']||keys['arrowdown']) velocity -= moveSpeed*dt;
  // Friction
  velocity *= 0.95;
  if(velocity>10) velocity=10;
  if(velocity<-7) velocity=-7;

  // Mouse or keys for angle
  // In first person, angle comes from mouse (yaw)
  // In third person, keep using angle from keys (for fun)
  if (isFirstPerson) {
    angle = yaw;
  } else {
    steer = 0;
    if(keys['a']||keys['arrowleft']) steer = 1.6;
    if(keys['d']||keys['arrowright']) steer = -1.6;
    angle += steer * Math.sign(velocity) * dt * (1.2 - Math.abs(velocity)/15);
    yaw = angle; // keep FPS in sync with car angle if you switch back and forth
  }

  // Jump
  if ((keys[' '] || keys['space']) && isGrounded) {
    jumpVel = 8.7; // jump impulse
    isGrounded = false;
  }

  // Apply jump/gravity
  if (!isGrounded) {
    jumpVel -= 18.8 * dt; // gravity
    playerGroup.position.y += jumpVel * dt;
    if (playerGroup.position.y <= 0.7) { // landed
      playerGroup.position.y = 0.7;
      isGrounded = true;
      jumpVel = 0;
    }
  } else {
    // Floating bob only in 3rd person
    playerGroup.position.y = isFirstPerson ? 0.7 : 0.7 + 0.13*Math.sin(performance.now()/520);
  }

  // Move
  playerGroup.rotation.y = angle;
  // In FPS, move relative to camera (W = forward, S = backward, etc)
  let moveX = 0, moveZ = 0;
  if (isFirstPerson) {
    let forward = 0, right = 0;
    if(keys['w']||keys['arrowup']) forward += 1;
    if(keys['s']||keys['arrowdown']) forward -= 1;
    if(keys['a']||keys['arrowleft']) right -= 1;
    if(keys['d']||keys['arrowright']) right += 1;
    // Normalize diagonal
    if (forward && right) {
      forward *= Math.SQRT1_2;
      right   *= Math.SQRT1_2;
    }
    // Calculate direction from yaw
    const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    moveX = (sinY * forward + cosY * right) * velocity * dt;
    moveZ = (cosY * forward - sinY * right) * velocity * dt;
  } else {
    moveX = Math.sin(angle) * velocity * dt;
    moveZ = Math.cos(angle) * velocity * dt;
  }
  playerGroup.position.x += moveX;
  playerGroup.position.z += moveZ;
  playerGroup.position.x = Math.max(Math.min(playerGroup.position.x,21),-21);
  playerGroup.position.z = Math.max(Math.min(playerGroup.position.z,21),-17);

  ring.rotation.z += dt*1.2;
}

function updateCamera() {
  if (isFirstPerson) {
    // FPS: camera at "forehead" of smiley, looking in yaw/pitch
    const camOffset = new THREE.Vector3(0, 0.31, 0);
    const eye = playerGroup.position.clone().add(camOffset);
    // Apply rotation for look direction
    // Calculate forward vector from yaw and pitch
    const forward = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );
    camera.position.lerp(eye, 0.63);
    camera.lookAt(eye.clone().add(forward));
  } else {
    // Third person: offset behind, slightly above
    const camDist = 9.3, camHeight = 3.7;
    const playerDir = angle;
    const desiredPos = new THREE.Vector3(
      playerGroup.position.x - Math.sin(playerDir)*camDist,
      playerGroup.position.y + camHeight,
      playerGroup.position.z - Math.cos(playerDir)*camDist
    );
    camera.position.lerp(desiredPos, 0.15);
    const lookAtTarget = new THREE.Vector3(
      playerGroup.position.x,
      playerGroup.position.y + 0.27,
      playerGroup.position.z
    );
    camera.lookAt(lookAtTarget);
  }
}

function checkPortals() {
  for(const [i,p] of portals.entries()) {
    const dx = playerGroup.position.x - p.pos[0];
    const dz = playerGroup.position.z - p.pos[2];
    if(Math.abs(dx)<1.7 && Math.abs(dz)<1.3) {
      // If it's "art", switch to art gallery scene!
      if(p.name === "art") {
        switchToArtScene();
      } else {
        openOverlay(p.name);
        // Reset player position so it's not stuck in the portal
        playerGroup.position.set(0,0.7,5);
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
  for(let i=0; i<portalMeshes.length; ++i) {
    const crt = portalMeshes[i];
    crt.children[1].material.emissiveIntensity = 0.25 + 0.19*Math.abs(Math.sin(portalAnimTime*1.5+i));
    crt.position.y = portals[i].pos[1] + 0.17*Math.sin(portalAnimTime*1.1+i);
    crt.rotation.y = Math.sin(performance.now()/900 + i)*0.09;
  }
}

// --------- SCENE 2: ART GALLERY (DEMO) ---------

let artScene, artCamera, artObjects, artAnimTime;

function initArtScene() {
  artScene = new THREE.Scene();
  artScene.fog = new THREE.Fog(0xffb4fa, 20, 70);

  artCamera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  artCamera.position.set(0, 6, 18);
  artCamera.lookAt(0,2,0);

  // Shimmering pink ground
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40,40),
    new THREE.MeshPhongMaterial({color:0xffb4fa, shininess: 60})
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  artScene.add(floor);

  // Neon grid
  const grid = new THREE.GridHelper(40, 24, 0x9bf6ff, 0xcba7ff);
  grid.position.y = 0.01;
  artScene.add(grid);

  // Add some "art pieces" (pixel cubes with vaporwave colors)
  artObjects = [];
  for(let i=0; i<6; ++i) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2,2.5,0.35),
      new THREE.MeshPhongMaterial({color: [0x81fff9,0xff80d9,0xfffa82,0x92ff8a,0xcba7ff,0xffb4fa][i], shininess: 90})
    );
    mesh.position.set(-8 + i*3.2, 2, -2);
    artScene.add(mesh);
    artObjects.push(mesh);
  }
  // Title
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.font = "bold 60px VT323";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 12;
  ctx.fillText("ART GALLERY",200,65);
  const tex = new THREE.Texture(canvas); tex.needsUpdate = true;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8,1.6),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  textMesh.position.set(0,6,0);
  artScene.add(textMesh);

  // Lights
  artScene.add(new THREE.AmbientLight(0xffffff,0.7));
  const dirLight = new THREE.DirectionalLight(0xfff0b1,0.45); dirLight.position.set(4,20,8);
  dirLight.castShadow = true;
  artScene.add(dirLight);

  artAnimTime = 0;

  window.addEventListener('resize', onWindowResize, false);
}

function animateArtScene(dt) {
  artAnimTime += dt;
  // Animate art pieces (gentle up/down and color shift)
  for(let i=0; i<artObjects.length; ++i) {
    let mesh = artObjects[i];
    mesh.position.y = 2 + Math.sin(artAnimTime*1.5 + i)*0.19;
    mesh.rotation.y = Math.sin(artAnimTime + i)*0.1;
  }
}

// --------- RENDER LOOP AND SCENE SWITCH ---------

function onWindowResize() {
  if(sceneState === "main") {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  } else if(sceneState === "art") {
    artCamera.aspect = window.innerWidth/window.innerHeight;
    artCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  }
}

function animate() {
  let now = performance.now(), dt = lastTime ? (now-lastTime)/1000 : 0.016;
  lastTime = now;

  if(sceneState === "main") {
    if(!document.getElementById('overlay-home').classList.contains('visible')) {
      movePlayer(dt);
      checkPortals();
    }
    animatePortals(dt);
    updateCamera();
    renderer.render(scene, camera);
  } else if(sceneState === "art") {
    animateArtScene(dt);
    renderer.render(artScene, artCamera);
  }
  requestAnimationFrame(animate);
}

// --------- EVENT & OVERLAY LOGIC ---------

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

// Key listeners for movement and camera toggle
window.addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'c') {
    isFirstPerson = !isFirstPerson;
    // Enable pointer lock if switching to FPS
    if(isFirstPerson && !pointerLocked) requestPointerLock();
    // Exit pointer lock if switching to 3rd person
    if(!isFirstPerson && pointerLocked) document.exitPointerLock();
  }
});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

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

// Mouse move: yaw and pitch
function onMouseMove(event) {
  if (isFirstPerson && pointerLocked) {
    const movementX = event.movementX || event.mozMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || 0;
    yaw -= movementX * 0.0022;
    pitch -= movementY * 0.0015;
    // Clamp pitch (look up/down)
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  }
}

// --------- SCENE SWITCH ---------

function switchToArtScene() {
  sceneState = "art";
  // Remove overlays, reset keys
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  keys = {};
  // Unlock pointer on scene switch
  if(pointerLocked) document.exitPointerLock();
  pointerLocked = false;
  // Initialize art scene
  initArtScene();
}

// --------- INIT ---------

initMainScene();
lastTime = performance.now();
animate();
