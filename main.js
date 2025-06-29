import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Game state
let gameStarted = false;

// Make functions globally available for HTML onclick handlers
window.closeOverlay = function(name) {
  const overlay = document.getElementById('overlay-'+name);
  if (overlay) {
    overlay.classList.remove('visible');
    
    // Only start the game when clicking the start button for home overlay
    if (name === 'home') {
      gameStarted = true;
      const container = document.getElementById('three-canvas');
      if (container && !document.pointerLockElement) {
        container.requestPointerLock();
      }
    }
  }
};

window.openOverlay = function(name) {
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  document.getElementById('overlay-'+name).classList.add('visible');
  
  // Stop game when opening overlay
  if (name === 'home') {
    gameStarted = false;
  }
};

try {
  // 3D Scene Setup
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setClearColor(0x89c4f4); // top sky color
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Create crosshair
  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    z-index: 1000;
    pointer-events: none;
  `;
  crosshair.innerHTML = `
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 12px;
      background: rgba(255, 255, 255, 0.8);
      transform: translate(-50%, -50%);
      border-radius: 1px;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 2px;
      background: rgba(255, 255, 255, 0.8);
      transform: translate(-50%, -50%);
      border-radius: 1px;
    "></div>
  `;
  document.body.appendChild(crosshair);

  // Create controls display
  const controlsDisplay = document.createElement('div');
  controlsDisplay.id = 'controls-display';
  controlsDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 12px;
    z-index: 1000;
    line-height: 1.4;
    min-width: 200px;
  `;
  controlsDisplay.innerHTML = `
    <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 CONTROLS</div>
    <div><span style="color: #ffff00;">WASD</span> - Move</div>
    <div><span style="color: #ffff00;">Mouse</span> - Look around</div>
    <div><span style="color: #ffff00;">Space</span> - Jump</div>
    <div><span style="color: #ffff00;">Shift</span> - Sprint</div>
    <div><span style="color: #ffff00;">ESC</span> - Menu</div>
    <div style="margin-top: 8px; color: #888; font-size: 10px;">Aim crosshair at portals to scan</div>
  `;
  document.body.appendChild(controlsDisplay);

  // Create portal info window
  const portalInfoWindow = document.createElement('div');
  portalInfoWindow.id = 'portal-info';
  portalInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 250px;
    height: 150px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #00ffff;
    border-radius: 10px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    transition: opacity 0.3s ease;
  `;
  portalInfoWindow.innerHTML = `
    <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">🌀 PORTAL DETECTED</div>
    <div style="margin-bottom: 5px;">Status: <span style="color: #00ff00;">ACTIVE</span></div>
    <div style="margin-bottom: 5px;">Energy: <span style="color: #ffff00;">97.3%</span></div>
    <div style="margin-bottom: 5px;">Destination: <span id="portal-destination" style="color: #ff9900;">--</span></div>
    <div style="margin-bottom: 10px;">Distance: <span id="portal-distance" style="color: #00ffff;">--</span></div>
    <div style="color: #888; font-size: 12px;">Portal scan only</div>
  `;
  document.body.appendChild(portalInfoWindow);

  // Sky gradient (fake by big sphere)
  const skyGeo = new THREE.SphereGeometry(80,32,32);
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  // Sun (just a glowing disc)
  const sunGeo = new THREE.CircleGeometry(3,32);
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

  // Grid helper for ground
  const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
  grid.position.y = 0.01;
  scene.add(grid);

  // Character
  const characterGroup = new THREE.Group();
  const characterBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 1.2, 4, 8),
    new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 60 })
  );
  characterBody.castShadow = true;
  characterBody.receiveShadow = true;
  characterBody.position.y = 1.1;
  characterGroup.add(characterBody);

  const characterHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 60 })
  );
  characterHead.position.set(0, 1.9, 0);
  characterHead.castShadow = true;
  characterGroup.add(characterHead);

  characterGroup.position.set(0, 0, 5);
  scene.add(characterGroup);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x3d4262, shininess: 10 })
  );
  floor.rotation.x = -Math.PI/2; 
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Collision detection arrays
  const collisionBoxes = [];

  // =======================================
  // 🎯 RANDOM BOX COLLISION STARTS HERE
  // =======================================
  // Add a random standalone collision box (blue wireframe)
  const randomCollisionBox = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 1.5), // width, height, depth
    new THREE.MeshBasicMaterial({ 
      color: 0x0066ff, // Blue color
      transparent: true, 
      opacity: 0.4,
      wireframe: true 
    })
  );
  randomCollisionBox.position.set(10, 0, 8); // x, y, z position
  randomCollisionBox.userData = { type: 'collision', name: 'random_obstacle' };
  scene.add(randomCollisionBox);
  collisionBoxes.push(randomCollisionBox);
  // =======================================
  // 🎯 RANDOM BOX COLLISION ENDS HERE
  // =======================================

  // =======================================
  // 🎯 CYLINDER COLLISION STARTS HERE
  // =======================================
  // Add a cylinder collision (purple wireframe)
  const cylinderCollisionBox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3, 16), // radiusTop, radiusBottom, height, segments
    new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, // Purple color
      transparent: true, 
      opacity: 0.4,
      wireframe: true 
    })
  );
  cylinderCollisionBox.position.set(-5, 0, 10); // x, y, z position
  cylinderCollisionBox.userData = { type: 'collision', name: 'cylinder_obstacle' };
  scene.add(cylinderCollisionBox);
  collisionBoxes.push(cylinderCollisionBox);
  // =======================================
  // 🎯 CYLINDER COLLISION ENDS HERE
  // =======================================

  // Load Church Model
  let churchModel = null;
  const loader = new GLTFLoader();

  loader.load(
    'church.glb',
    function (gltf) {
      console.log('Church model loaded successfully');
      churchModel = gltf.scene;
      churchModel.scale.set(0.08, 0.08, 0.08);
      
      const box = new THREE.Box3().setFromObject(churchModel);
      const center = box.getCenter(new THREE.Vector3());
      
      churchModel.position.set(
        25 - center.x * 0.1,
        0,
        -4 - center.z * 0.1
      );
      
      churchModel.rotation.set(0, 30, 0);
      
      churchModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      scene.add(churchModel);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error('Error loading church model:', error);
    }
  );

  // Load Grave Model
  let graveModel = null;

  loader.load(
    'grave.glb',
    function (gltf) {
      console.log('Grave model loaded successfully');
      graveModel = gltf.scene;
      graveModel.scale.set(0.4, 0.4, 0.4);
      
      const box = new THREE.Box3().setFromObject(graveModel);
      const center = box.getCenter(new THREE.Vector3());
      
      graveModel.position.set(
        -1 - center.x * 0.1,
        2,
        -1 - center.z * 0.1
      );
      
      graveModel.rotation.set(0, -30, 0);
      
      graveModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      scene.add(graveModel);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error('Error loading grave model:', error);
    }
  );

  // Portal Models and Data - All portals grouped together
  const portals = [
    { name:"2d",      pos:[-8, 1, -4],  label:"2D ART",  destination:"2D ART GALLERY" },
    { name:"about",   pos:[-8, 1, -13], label:"ABOUT",   destination:"ABOUT PAGE" },
    { name:"contact", pos:[8, 1, -13],  label:"CONTACT", destination:"CONTACT FORM" },
    { name:"3d",      pos:[8, 1, -4],   label:"3D ART",  destination:"3D SHOWCASE" },
  ];
  
  const portalModels = [];
  let loadedPortals = 0;

  // Load Portal Models for each section
  portals.forEach((portalData, index) => {
    loader.load(
      'portal.glb',
      function (gltf) {
        console.log(`Portal ${portalData.name} loaded successfully`);
        const portalModel = gltf.scene.clone();
        portalModel.scale.set(0.5, 0.5, 0.5);
        
        const box = new THREE.Box3().setFromObject(portalModel);
        const center = box.getCenter(new THREE.Vector3());
        
        portalModel.position.set(
          portalData.pos[0] - center.x * 0.5,
          portalData.pos[1],
          portalData.pos[2] - center.z * 0.5
        );
        
        portalModel.rotation.set(0, index * (Math.PI/2), 0); // Different rotation for each portal
        
        portalModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        portalModel.userData = { 
          target: portalData.name, 
          label: portalData.label,
          destination: portalData.destination,
          position: new THREE.Vector3(...portalData.pos)
        };
        
        scene.add(portalModel);
        portalModels.push(portalModel);
        
        // Add floating text label above each portal
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = "bold 36px Montserrat";
        ctx.fillStyle="#fff";
        ctx.textAlign="center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        ctx.fillText(portalData.label, 128, 48);
        const tex = new THREE.Texture(canvas); 
        tex.needsUpdate = true;
        
        const textMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 0.55),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        textMesh.position.set(portalData.pos[0], portalData.pos[1] + 2.5, portalData.pos[2]);
        scene.add(textMesh);
        
        loadedPortals++;
      },
      function (xhr) {
        console.log(`Portal ${portalData.name}: ` + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      function (error) {
        console.error(`Error loading portal ${portalData.name}:`, error);
      }
    );
  });

  // Lighting
  const ambLight = new THREE.AmbientLight(0xffffff,0.4); scene.add(ambLight);
  const dirLight = new THREE.DirectionalLight(0xfff0b1,0.7); 
  dirLight.position.set(10,14,4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.mapSize.set(1024,1024);
  scene.add(dirLight);

  // Mouse look controls
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  const MOUSE_SENSITIVITY = 0.002;

  // Mouse movement only works when game is started and pointer is locked
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement && gameStarted) {
      mouseX = e.movementX || 0;
      mouseY = e.movementY || 0;
      
      targetRotationY -= mouseX * MOUSE_SENSITIVITY;
      currentRotationX -= mouseY * MOUSE_SENSITIVITY;
      
      // Limit vertical rotation
      currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
    }
  });

  // Movement and physics variables
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
  window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
  
  let velocity = new THREE.Vector3();
  let moveSpeed = 5;
  const sprintSpeed = 10;
  const normalSpeed = 5;

  // Jump physics
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 8;
  const gravity = 20;

  // Portal detection variables
  const raycaster = new THREE.Raycaster();
  const portalDetectionDistance = 3;
  let currentPortalInView = null;

  // Function to check if crosshair is directly pointing at any portal
  function checkPortalView() {
    if (!gameStarted || portalModels.length === 0) return;

    // Cast a ray from the camera center (where crosshair is pointing)
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    raycaster.set(camera.position, cameraDirection);

    // Create an array to hold all portal meshes for raycasting
    const allPortalMeshes = [];
    portalModels.forEach(portalModel => {
      portalModel.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPortal = portalModel;
          allPortalMeshes.push(child);
        }
      });
    });

    // Check for intersections with portal meshes
    const intersects = raycaster.intersectObjects(allPortalMeshes);
    
    let targetPortal = null;
    let targetDistance = Infinity;

    // Find the closest portal intersection within range
    for (const intersect of intersects) {
      const distance = intersect.distance;
      
      // Only consider portals within 3 meters
      if (distance <= portalDetectionDistance && distance < targetDistance) {
        targetPortal = intersect.object.userData.parentPortal;
        targetDistance = distance;
      }
    }

    if (targetPortal) {
      // Show portal info window
      portalInfoWindow.style.display = 'block';
      currentPortalInView = targetPortal;
      
      // Update distance and destination display
      const distanceElement = document.getElementById('portal-distance');
      const destinationElement = document.getElementById('portal-destination');
      if (distanceElement) {
        distanceElement.textContent = targetDistance.toFixed(1) + 'm';
      }
      if (destinationElement) {
        destinationElement.textContent = targetPortal.userData.destination;
      }
    } else {
      // Hide portal info window
      portalInfoWindow.style.display = 'none';
      currentPortalInView = null;
    }
  }

  // Enhanced collision detection - only blocks movement when trying to move INTO objects
  function checkCollision(currentPosition, newPosition) {
    const characterRadius = 0.4;
    
    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;
      
      if (boxGeometry.type === 'CylinderGeometry') {
        // Cylinder collision detection
        const cylinderRadius = boxGeometry.parameters.radiusTop;
        const cylinderHeight = boxGeometry.parameters.height;
        const cylinderTop = boxPosition.y + cylinderHeight/2;
        const cylinderBottom = boxPosition.y - cylinderHeight/2;
        
        // Check horizontal distance for both current and new positions
        const currentDx = currentPosition.x - boxPosition.x;
        const currentDz = currentPosition.z - boxPosition.z;
        const currentDistance = Math.sqrt(currentDx * currentDx + currentDz * currentDz);
        
        const newDx = newPosition.x - boxPosition.x;
        const newDz = newPosition.z - boxPosition.z;
        const newDistance = Math.sqrt(newDx * newDx + newDz * newDz);
        
        // Only block movement if:
        // 1. We're moving closer to the cylinder center (not away)
        // 2. We would be inside the cylinder after movement
        // 3. We're at the right height level
        if (newDistance < (cylinderRadius + characterRadius) &&
            newDistance <= currentDistance && // Only block if moving closer
            newPosition.y < cylinderTop && 
            newPosition.y + 2 > cylinderBottom) {
          return true; // Block movement into cylinder
        }
      } else {
        // Box collision detection
        const boxWidth = boxGeometry.parameters.width;
        const boxHeight = boxGeometry.parameters.height;
        const boxDepth = boxGeometry.parameters.depth;
        
        const boxMinX = boxPosition.x - boxWidth / 2;
        const boxMaxX = boxPosition.x + boxWidth / 2;
        const boxMinZ = boxPosition.z - boxDepth / 2;
        const boxMaxZ = boxPosition.z + boxDepth / 2;
        const boxMinY = boxPosition.y - boxHeight / 2;
        const boxMaxY = boxPosition.y + boxHeight / 2;
        
        // Check if character would collide with this box
        const wouldCollideX = newPosition.x + characterRadius > boxMinX && newPosition.x - characterRadius < boxMaxX;
        const wouldCollideZ = newPosition.z + characterRadius > boxMinZ && newPosition.z - characterRadius < boxMaxZ;
        const wouldCollideY = newPosition.y < boxMaxY && newPosition.y + 2 > boxMinY;
        
        // Check if currently colliding
        const currentlyCollidingX = currentPosition.x + characterRadius > boxMinX && currentPosition.x - characterRadius < boxMaxX;
        const currentlyCollidingZ = currentPosition.z + characterRadius > boxMinZ && currentPosition.z - characterRadius < boxMaxZ;
        
        // Calculate distances to box center for both positions
        const currentDistanceToCenter = Math.sqrt(
          Math.pow(currentPosition.x - boxPosition.x, 2) + 
          Math.pow(currentPosition.z - boxPosition.z, 2)
        );
        const newDistanceToCenter = Math.sqrt(
          Math.pow(newPosition.x - boxPosition.x, 2) + 
          Math.pow(newPosition.z - boxPosition.z, 2)
        );
        
        // Only block movement if:
        // 1. We would collide after movement
        // 2. We're moving closer to the box center (not away)
        // 3. We're at the right height level
        if (wouldCollideX && wouldCollideZ && wouldCollideY &&
            newDistanceToCenter <= currentDistanceToCenter) { // Only block if moving closer
          return true; // Block movement into box
        }
      }
    }
    return false; // Allow movement
  }

  // Function to get the ground level at a specific position (including collision box tops)
  function getGroundLevel(position) {
    let groundLevel = 0; // Default ground level
    
    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;
      
      if (boxGeometry.type === 'CylinderGeometry') {
        // Cylinder top surface check
        const cylinderRadius = boxGeometry.parameters.radiusTop;
        const cylinderHeight = boxGeometry.parameters.height;
        const cylinderTop = boxPosition.y + cylinderHeight/2;
        
        // Check horizontal distance (X-Z plane)
        const dx = position.x - boxPosition.x;
        const dz = position.z - boxPosition.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        
        // If character is EXACTLY on top of cylinder (within radius, not outside)
        if (horizontalDistance <= cylinderRadius && cylinderTop > groundLevel) {
          groundLevel = cylinderTop;
        }
      } else {
        // Box top surface check
        const boxWidth = boxGeometry.parameters.width;
        const boxDepth = boxGeometry.parameters.depth;
        const boxHeight = boxGeometry.parameters.height;
        const boxTop = boxPosition.y + boxHeight/2;
        
        const boxMinX = boxPosition.x - boxWidth / 2;
        const boxMaxX = boxPosition.x + boxWidth / 2;
        const boxMinZ = boxPosition.z - boxDepth / 2;
        const boxMaxZ = boxPosition.z + boxDepth / 2;
        
        // If character is EXACTLY on top of box (within bounds, not outside)
        if (position.x >= boxMinX && position.x <= boxMaxX &&
            position.z >= boxMinZ && position.z <= boxMaxZ &&
            boxTop > groundLevel) {
          groundLevel = boxTop;
        }
      }
    }
    
    return groundLevel;
  }

  function moveCharacter(dt) {
    // Only move if game is started
    if (!gameStarted) return;
    
    // Get forward direction based on camera rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    
    // Get right direction
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    
    // Reset horizontal velocity
    velocity.x = 0;
    velocity.z = 0;
    
    // Sprint check
    moveSpeed = keys['shift'] ? sprintSpeed : normalSpeed;
    
    // Calculate desired movement
    let desiredVelocity = new THREE.Vector3();
    
    if (keys['w'] || keys['arrowup']) {
      desiredVelocity.x += forward.x * moveSpeed * dt;
      desiredVelocity.z += forward.z * moveSpeed * dt;
    }
    if (keys['s'] || keys['arrowdown']) {
      desiredVelocity.x -= forward.x * moveSpeed * dt;
      desiredVelocity.z -= forward.z * moveSpeed * dt;
    }
    if (keys['a'] || keys['arrowleft']) {
      desiredVelocity.x -= right.x * moveSpeed * dt;
      desiredVelocity.z -= right.z * moveSpeed * dt;
    }
    if (keys['d'] || keys['arrowright']) {
      desiredVelocity.x += right.x * moveSpeed * dt;
      desiredVelocity.z += right.z * moveSpeed * dt;
    }
    
    // Test movement in X direction
    const testPositionX = characterGroup.position.clone();
    testPositionX.x += desiredVelocity.x;
    if (!checkCollision(characterGroup.position, testPositionX)) {
      characterGroup.position.x = testPositionX.x;
    }
    
    // Test movement in Z direction
    const testPositionZ = characterGroup.position.clone();
    testPositionZ.z += desiredVelocity.z;
    if (!checkCollision(characterGroup.position, testPositionZ)) {
      characterGroup.position.z = testPositionZ.z;
    }
    
    // Jump logic
    if (keys[' '] && !isJumping) {
      isJumping = true;
      jumpVelocity = jumpForce;
    }
    
    // Apply gravity and update vertical position
    if (isJumping || characterGroup.position.y > 0) {
      jumpVelocity -= gravity * dt;
      characterGroup.position.y += jumpVelocity * dt;
    }
    
    // Get the ground level at current position (including collision box tops)
    const currentGroundLevel = getGroundLevel(characterGroup.position);
    
    // Check for ground collision
    if (characterGroup.position.y <= currentGroundLevel) {
      characterGroup.position.y = currentGroundLevel;
      isJumping = false;
      jumpVelocity = 0;
    }
    
    // If we're above ground level but not jumping, start falling
    if (!isJumping && characterGroup.position.y > currentGroundLevel) {
      isJumping = true;
      jumpVelocity = 0; // Start falling without initial upward velocity
    }
    
    // Clamp position to boundaries
    characterGroup.position.x = Math.max(Math.min(characterGroup.position.x, 23), -23);
    characterGroup.position.z = Math.max(Math.min(characterGroup.position.z, 23), -18);
    
    // Update character rotation
    characterGroup.rotation.y = targetRotationY;
  }

  // Camera update
  function updateCamera() {
    const eyeHeight = 1.8;
    
    camera.position.copy(characterGroup.position);
    camera.position.y += eyeHeight;
    
    camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
  }

  // Show/hide UI elements based on game state
  function updateUIVisibility() {
    const showUI = gameStarted && document.pointerLockElement;
    crosshair.style.display = showUI ? 'block' : 'none';
    controlsDisplay.style.display = showUI ? 'block' : 'none';
  }

  // Pointer lock exit handler
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && gameStarted) {
      // If game has started and pointer lock is exited, show home overlay and stop game
      openOverlay('home');
      gameStarted = false;
      // Hide portal info when exiting
      portalInfoWindow.style.display = 'none';
    }
    updateUIVisibility();
  });

  // ESC key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameStarted && document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ')) {
      closeOverlay('home');
    }
  });

  // Main render loop
  let lastTime = performance.now();
  function animate() {
    let now = performance.now(), dt = (now-lastTime)/1000;
    lastTime = now;
    
    // Update UI visibility
    updateUIVisibility();
    
    // Only process movement and portal viewing if game is started
    if(gameStarted && !document.getElementById('overlay-home').classList.contains('visible')) {
      moveCharacter(dt);
      checkPortalView(); // Check if crosshair is pointing at portal
    }
    
    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

} catch (error) {
  console.error('Fatal error in initialization:', error);
  document.body.innerHTML = `
    <div style="padding:20px;color:white;background:rgba(0,0,0,0.8)">
      <h2>Error Loading Scene</h2>
      <p>${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
}