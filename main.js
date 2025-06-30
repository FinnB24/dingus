import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Game state
let gameStarted = false;
let currentScene = 'main'; // Track which scene we're in
let spectatorMode = false; // Track if in spectator mode
let allModelsLoaded = false; // Track if all models are loaded

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0);

// Loading manager for better performance
const loadingManager = new THREE.LoadingManager();
let totalModelsToLoad = 3; // portal.glb, church.glb, grave.glb
let loadedModels = 0;

// Loading progress display
const loadingDisplay = document.createElement('div');
loadingDisplay.id = 'loading-display';
loadingDisplay.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
  border-radius: 10px;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  padding: 20px;
  z-index: 3000;
  text-align: center;
  min-width: 300px;
  backdrop-filter: blur(10px);
`;
loadingDisplay.innerHTML = `
  <div style="color: #00ffff; font-weight: bold; margin-bottom: 15px;">🌀 LOADING PORTFOLIO</div>
  <div id="loading-progress">Loading models... 0%</div>
  <div style="margin-top: 10px; height: 4px; background: #333; border-radius: 2px;">
    <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ffff, #0080ff); border-radius: 2px; transition: width 0.3s ease;"></div>
  </div>
  <div style="margin-top: 10px; color: #888; font-size: 12px;">Please wait while we prepare the experience...</div>
`;
document.body.appendChild(loadingDisplay);

// Hide all overlays initially
function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.style.display = 'none';
  });
}

// Show home overlay after loading is complete
function showHomeOverlay() {
  const homeOverlay = document.getElementById('overlay-home');
  if (homeOverlay) {
    homeOverlay.style.display = 'block';
    homeOverlay.classList.add('visible');
  }
}

// Update loading progress
function updateLoadingProgress(loaded, total) {
  const percentage = Math.round((loaded / total) * 100);
  const progressText = document.getElementById('loading-progress');
  const progressBar = document.getElementById('progress-bar');
  
  if (progressText) progressText.textContent = `Loading models... ${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
  
  if (loaded >= total) {
    // Show completion message briefly
    if (progressText) progressText.textContent = 'Loading complete! 🎮';
    
    setTimeout(() => {
      loadingDisplay.style.display = 'none';
      allModelsLoaded = true;
      showHomeOverlay();
      console.log('All models loaded - showing home overlay');
    }, 800); // Brief delay to show completion
  }
}

loadingManager.onProgress = function(url, loaded, total) {
  updateLoadingProgress(loaded, total);
};

loadingManager.onLoad = function() {
  console.log('All models loaded successfully!');
  updateLoadingProgress(100, 100);
};

// Make functions globally available for HTML onclick handlers
window.closeOverlay = function(name) {
  const overlay = document.getElementById('overlay-'+name);
  if (overlay) {
    overlay.classList.remove('visible');
    
    // Only start the game when clicking the start button for home overlay AND models are loaded
    if (name === 'home' && allModelsLoaded) {
      gameStarted = true;
      
      if (!isMobile) {
        const container = document.getElementById('three-canvas');
        if (container && !document.pointerLockElement) {
          container.requestPointerLock();
        }
      } else {
        // On mobile, just start the game without pointer lock
        createMobileControls();
      }
    }
  }
};

window.openOverlay = function(name) {
  // Only allow overlay opening if models are loaded
  if (!allModelsLoaded) return;
  
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  const targetOverlay = document.getElementById('overlay-'+name);
  if (targetOverlay) {
    targetOverlay.classList.add('visible');
  }
  
  // Stop game when opening overlay
  if (name === 'home') {
    gameStarted = false;
    hideMobileControls();
  }
};

// Hide overlays initially until models are loaded
hideAllOverlays();

// Mobile controls variables
let mobileControls = null;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickPosition = { x: 0, y: 0 };
let lookSensitivity = 0.003;
let touchStartPos = { x: 0, y: 0 };
let lastTouchPos = { x: 0, y: 0 };

// Create mobile controls
function createMobileControls() {
  if (!isMobile || mobileControls) return;

  mobileControls = document.createElement('div');
  mobileControls.id = 'mobile-controls';
  mobileControls.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 500;
    pointer-events: none;
  `;

  // Movement joystick (left side)
  const joystick = document.createElement('div');
  joystick.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 30px;
    width: 120px;
    height: 120px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    pointer-events: auto;
    touch-action: none;
  `;

  const joystickKnob = document.createElement('div');
  joystickKnob.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.1s ease;
  `;

  joystick.appendChild(joystickKnob);

  // Look area (right side)
  const lookArea = document.createElement('div');
  lookArea.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 100%;
    pointer-events: auto;
    touch-action: none;
    background: transparent;
  `;

  // Action buttons (right side)
  const actionButtons = document.createElement('div');
  actionButtons.style.cssText = `
    position: absolute;
    bottom: 30px;
    right: 30px;
    pointer-events: auto;
  `;

  // Jump button
  const jumpButton = document.createElement('div');
  jumpButton.innerHTML = '⬆';
  jumpButton.style.cssText = `
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    margin-bottom: 10px;
    touch-action: none;
    user-select: none;
  `;

  // Action button (E key equivalent)
  const actionButton = document.createElement('div');
  actionButton.innerHTML = 'E';
  actionButton.style.cssText = `
    width: 60px;
    height: 60px;
    background: rgba(0, 255, 255, 0.1);
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #00ffff;
    touch-action: none;
    user-select: none;
  `;

  // Sprint button (bottom right)
  const sprintButton = document.createElement('div');
  sprintButton.innerHTML = '🏃';
  sprintButton.style.cssText = `
    position: absolute;
    bottom: 30px;
    right: 110px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 0, 0.1);
    border: 2px solid rgba(255, 255, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: yellow;
    touch-action: none;
    user-select: none;
    pointer-events: auto;
  `;

  // Q button for spectator mode (top right)
  const qButton = document.createElement('div');
  qButton.innerHTML = 'Q';
  qButton.style.cssText = `
    position: absolute;
    top: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: rgba(255, 0, 255, 0.1);
    border: 2px solid rgba(255, 0, 255, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #ff00ff;
    touch-action: none;
    user-select: none;
    pointer-events: auto;
  `;

  actionButtons.appendChild(jumpButton);
  actionButtons.appendChild(actionButton);

  mobileControls.appendChild(joystick);
  mobileControls.appendChild(lookArea);
  mobileControls.appendChild(actionButtons);
  mobileControls.appendChild(sprintButton);
  mobileControls.appendChild(qButton);

  document.body.appendChild(mobileControls);

  // Joystick event handlers
  function handleJoystickStart(e) {
    e.preventDefault();
    const rect = joystick.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
    joystickActive = true;
    
    const touch = e.touches ? e.touches[0] : e;
    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickEnd(e) {
    e.preventDefault();
    joystickActive = false;
    joystickPosition.x = 0;
    joystickPosition.y = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    keys['w'] = false;
    keys['a'] = false;
    keys['s'] = false;
    keys['d'] = false;
  }

  function updateJoystick(x, y) {
    const deltaX = x - joystickCenter.x;
    const deltaY = y - joystickCenter.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40; // Half of joystick radius

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      joystickPosition.x = Math.cos(angle) * maxDistance;
      joystickPosition.y = Math.sin(angle) * maxDistance;
    } else {
      joystickPosition.x = deltaX;
      joystickPosition.y = deltaY;
    }

    joystickKnob.style.transform = `translate(${-50 + (joystickPosition.x / maxDistance) * 50}%, ${-50 + (joystickPosition.y / maxDistance) * 50}%)`;

    // Update movement keys based on joystick position
    const threshold = 10;
    keys['w'] = joystickPosition.y < -threshold;
    keys['s'] = joystickPosition.y > threshold;
    keys['a'] = joystickPosition.x < -threshold;
    keys['d'] = joystickPosition.x > threshold;
  }

  // Look area event handlers
  function handleLookStart(e) {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    touchStartPos.x = touch.clientX;
    touchStartPos.y = touch.clientY;
    lastTouchPos.x = touch.clientX;
    lastTouchPos.y = touch.clientY;
  }

  function handleLookMove(e) {
    if (!gameStarted) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    
    const deltaX = touch.clientX - lastTouchPos.x;
    const deltaY = touch.clientY - lastTouchPos.y;

    targetRotationY -= deltaX * lookSensitivity;
    currentRotationX -= deltaY * lookSensitivity;

    // Limit vertical rotation
    if (spectatorMode) {
      currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
    } else {
      currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
    }

    lastTouchPos.x = touch.clientX;
    lastTouchPos.y = touch.clientY;
  }

  // Button event handlers
  function handleJumpPress() {
    keys[' '] = true;
    jumpButton.style.background = 'rgba(255, 255, 255, 0.3)';
    setTimeout(() => {
      keys[' '] = false;
      jumpButton.style.background = 'rgba(255, 255, 255, 0.1)';
    }, 150);
  }

  function handleActionPress() {
    keys['e'] = true;
    actionButton.style.background = 'rgba(0, 255, 255, 0.3)';
    setTimeout(() => {
      keys['e'] = false;
      actionButton.style.background = 'rgba(0, 255, 255, 0.1)';
    }, 150);
  }

  function handleSprintStart() {
    keys['shift'] = true;
    sprintButton.style.background = 'rgba(255, 255, 0, 0.3)';
  }

  function handleSprintEnd() {
    keys['shift'] = false;
    sprintButton.style.background = 'rgba(255, 255, 0, 0.1)';
  }

  function handleQPress() {
    if (spectatorMode && currentScene.startsWith('model-')) {
      returnToGallery();
      qButton.style.background = 'rgba(255, 0, 255, 0.3)';
      setTimeout(() => {
        qButton.style.background = 'rgba(255, 0, 255, 0.1)';
      }, 150);
    }
  }

  // Add event listeners
  joystick.addEventListener('touchstart', handleJoystickStart);
  joystick.addEventListener('touchmove', handleJoystickMove);
  joystick.addEventListener('touchend', handleJoystickEnd);
  joystick.addEventListener('mousedown', handleJoystickStart);
  joystick.addEventListener('mousemove', handleJoystickMove);
  joystick.addEventListener('mouseup', handleJoystickEnd);

  lookArea.addEventListener('touchstart', handleLookStart);
  lookArea.addEventListener('touchmove', handleLookMove);
  lookArea.addEventListener('mousedown', handleLookStart);
  lookArea.addEventListener('mousemove', handleLookMove);

  jumpButton.addEventListener('touchstart', handleJumpPress);
  jumpButton.addEventListener('mousedown', handleJumpPress);

  actionButton.addEventListener('touchstart', handleActionPress);
  actionButton.addEventListener('mousedown', handleActionPress);

  sprintButton.addEventListener('touchstart', handleSprintStart);
  sprintButton.addEventListener('touchend', handleSprintEnd);
  sprintButton.addEventListener('mousedown', handleSprintStart);
  sprintButton.addEventListener('mouseup', handleSprintEnd);

  qButton.addEventListener('touchstart', handleQPress);
  qButton.addEventListener('mousedown', handleQPress);

  console.log('Mobile controls created');
}

function hideMobileControls() {
  if (mobileControls) {
    mobileControls.remove();
    mobileControls = null;
  }
}

try {
  // 3D Scene Setup
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');

  const scene = new THREE.Scene();
  const galleryScene = new THREE.Scene();
  // Individual model viewer scenes
  const cubeViewerScene = new THREE.Scene();
  const sphereViewerScene = new THREE.Scene();
  const cylinderViewerScene = new THREE.Scene();
  const coneViewerScene = new THREE.Scene();
  
  let activeScene = scene; // Track which scene is currently active
  
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance", // Use high performance GPU
    stencil: false, // Disable stencil buffer for better performance
    depth: true
  });
  renderer.setClearColor(0x89c4f4); // top sky color
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Optimize renderer settings for performance
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
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

  function updateControlsDisplay() {
    if (isMobile) {
      if (spectatorMode) {
        controlsDisplay.innerHTML = `
          <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 MOBILE SPECTATOR</div>
          <div><span style="color: #ffff00;">Joystick</span> - Fly around</div>
          <div><span style="color: #ffff00;">Touch & Drag</span> - Look</div>
          <div><span style="color: #ffff00;">Q Button</span> - Return to gallery</div>
        `;
      } else {
        controlsDisplay.innerHTML = `
          <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">📱 MOBILE CONTROLS</div>
          <div><span style="color: #ffff00;">Joystick</span> - Move</div>
          <div><span style="color: #ffff00;">Touch & Drag</span> - Look around</div>
          <div><span style="color: #ffff00;">⬆ Button</span> - Jump</div>
          <div><span style="color: #ffff00;">🏃 Button</span> - Sprint</div>
          <div><span style="color: #ffff00;">E Button</span> - Use Portal</div>
          <div style="margin-top: 8px; color: #888; font-size: 10px;">Aim crosshair at portals to scan</div>
        `;
      }
    } else {
      if (spectatorMode) {
        controlsDisplay.innerHTML = `
          <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 SPECTATOR MODE</div>
          <div><span style="color: #ffff00;">WASD</span> - Fly around</div>
          <div><span style="color: #ffff00;">Mouse</span> - Free look</div>
          <div><span style="color: #ffff00;">Space</span> - Fly up</div>
          <div><span style="color: #ffff00;">Shift</span> - Fly down</div>
          <div><span style="color: #ffff00;">Q</span> - Return to gallery</div>
          <div><span style="color: #ffff00;">ESC</span> - Menu</div>
        `;
      } else {
        controlsDisplay.innerHTML = `
          <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 CONTROLS</div>
          <div><span style="color: #ffff00;">WASD</span> - Move</div>
          <div><span style="color: #ffff00;">Mouse</span> - Look around</div>
          <div><span style="color: #ffff00;">Space</span> - Jump</div>
          <div><span style="color: #ffff00;">Shift</span> - Sprint</div>
          <div><span style="color: #ffff00;">ESC</span> - Menu</div>
          <div><span style="color: #ffff00;">E</span> - Use Portal</div>
          <div style="margin-top: 8px; color: #888; font-size: 10px;">Aim crosshair at portals to scan</div>
        `;
      }
    }
  }

  updateControlsDisplay();
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
    <div style="color: #00ff00; font-size: 12px;">${isMobile ? 'Press E button to enter portal' : 'Press E to enter portal'}</div>
  `;
  document.body.appendChild(portalInfoWindow);

  // =======================================
  // 🎯 SETUP MAIN SCENE
  // =======================================
  
  // Optimized sky (smaller, lower detail for better performance)
  const skyGeo = new THREE.SphereGeometry(60, 16, 16); // Reduced segments
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  // Sun (just a glowing disc)
  const sunGeo = new THREE.CircleGeometry(3, 16); // Reduced segments
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

  // Optimized grid helper for ground
  const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
  grid.position.y = 0.01;
  scene.add(grid);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x3d4262, shininess: 10 })
  );
  floor.rotation.x = -Math.PI/2; 
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // =======================================
  // 🎯 SETUP GALLERY SCENE
  // =======================================
  
  // Gallery sky (reuse geometry)
  const gallerySky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color:0x2a1810, side:THREE.BackSide }));
  galleryScene.add(gallerySky);

  // Gallery lighting (optimized)
  const galleryAmbLight = new THREE.AmbientLight(0xffffff, 0.3);
  galleryScene.add(galleryAmbLight);
  
  const gallerySpotLight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI/6, 0.1, 2);
  gallerySpotLight.position.set(0, 15, 0);
  gallerySpotLight.target.position.set(0, 0, 0);
  gallerySpotLight.castShadow = true;
  // Reduce shadow map size for better performance
  gallerySpotLight.shadow.mapSize.setScalar(512);
  galleryScene.add(gallerySpotLight);
  galleryScene.add(gallerySpotLight.target);

  // Gallery floor (reuse plane geometry)
  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x1a1a1a, shininess: 30 })
  );
  galleryFloor.rotation.x = -Math.PI/2; 
  galleryFloor.position.y = 0;
  galleryFloor.receiveShadow = true;
  galleryScene.add(galleryFloor);

  // Gallery grid (reuse)
  const galleryGrid = new THREE.GridHelper(44, 22, 0x333333, 0x222222);
  galleryGrid.position.y = 0.01;
  galleryScene.add(galleryGrid);

  // Create gallery walls with shared materials
  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const wallGeometry = new THREE.PlaneGeometry(30, 8);
  
  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -15);
  galleryScene.add(backWall);
  
  // Side walls
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-15, 4, 0);
  galleryScene.add(leftWall);
  
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(15, 4, 0);
  galleryScene.add(rightWall);

  // Art pieces data
  const artPieces = [
    { pos: [-10, 2, -14.5], color: 0xff4444, shape: 'cube', name: 'Red Cube' },
    { pos: [10, 2, -14.5], color: 0x44ff44, shape: 'sphere', name: 'Green Sphere' },
    { pos: [-14.5, 2, -5], color: 0x4444ff, shape: 'cylinder', name: 'Blue Cylinder' },
    { pos: [14.5, 2, 5], color: 0xffff44, shape: 'cone', name: 'Yellow Cone' },
  ];

  // Create gallery frames and interactive areas with shared geometries
  const galleryFrames = [];
  const interactiveAreas = [];
  const frameGeometry = new THREE.PlaneGeometry(4, 3);
  const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  const previewGeometry = new THREE.PlaneGeometry(3.5, 2.5);
  const interactiveGeometry = new THREE.PlaneGeometry(4, 3);
  const interactiveMaterial = new THREE.MeshBasicMaterial({ 
    transparent: true, 
    opacity: 0,
    side: THREE.DoubleSide 
  });

  artPieces.forEach((art, index) => {
    // Create frame (reuse geometry and material)
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    
    // Create canvas preview of the 3D model (optimized canvas size)
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Reduced from 256
    canvas.height = 96;  // Reduced from 192
    const ctx = canvas.getContext('2d');
    
    // Draw a simple preview representation
    ctx.fillStyle = `#${art.color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(25, 25, 78, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial'; // Reduced font size
    ctx.textAlign = 'center';
    ctx.fillText(art.name, 64, 80);
    ctx.fillText('Click to View', 64, 90);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false; // Disable mipmaps for better performance
    texture.minFilter = THREE.LinearFilter;
    
    const previewMaterial = new THREE.MeshPhongMaterial({ map: texture });
    const preview = new THREE.Mesh(previewGeometry, previewMaterial);
    
    // Position frames on walls
    frame.position.copy(new THREE.Vector3(...art.pos));
    preview.position.copy(frame.position);
    preview.position.z += 0.01; // Slightly in front of frame
    
    // Set rotations based on wall
    if (art.pos[2] < 0) { // Back wall
      frame.rotation.y = 0;
      preview.rotation.y = 0;
    } else if (art.pos[0] < 0) { // Left wall
      frame.rotation.y = Math.PI/2;
      preview.rotation.y = Math.PI/2;
    } else { // Right wall
      frame.rotation.y = -Math.PI/2;
      preview.rotation.y = -Math.PI/2;
    }
    
    galleryScene.add(frame);
    galleryScene.add(preview);
    galleryFrames.push(frame);
    
    // Create invisible interactive area (reuse geometry and material)
    const interactiveArea = new THREE.Mesh(interactiveGeometry, interactiveMaterial);
    interactiveArea.position.copy(preview.position);
    interactiveArea.rotation.copy(preview.rotation);
    interactiveArea.userData = { type: 'gallery-frame', artIndex: index, artName: art.shape };
    galleryScene.add(interactiveArea);
    interactiveAreas.push(interactiveArea);
  });

  // =======================================
  // 🎯 SETUP MODEL VIEWER SCENES (OPTIMIZED)
  // =======================================
  
  // Shared geometries for model viewer scenes
  const sharedGeometries = {
    cube: new THREE.BoxGeometry(4, 4, 4),
    sphere: new THREE.SphereGeometry(2.5, 24, 24), // Reduced segments
    cylinder: new THREE.CylinderGeometry(2, 2, 6, 24), // Reduced segments
    cone: new THREE.ConeGeometry(2.5, 6, 24) // Reduced segments
  };
  
  function createModelViewerScene(art, scene) {
    // Dark space environment (reuse sky geometry)
    const viewerSky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }));
    scene.add(viewerSky);
    
    // Optimized lighting
    const ambLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambLight);
    
    const spotLight1 = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/4, 0.1, 2);
    spotLight1.position.set(10, 10, 10);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.shadow.mapSize.setScalar(256); // Reduced shadow map size
    scene.add(spotLight1);
    scene.add(spotLight1.target);
    
    const spotLight2 = new THREE.SpotLight(0x4444ff, 1, 50, Math.PI/4, 0.1, 2);
    spotLight2.position.set(-10, 5, -5);
    spotLight2.target.position.set(0, 0, 0);
    spotLight2.shadow.mapSize.setScalar(256); // Reduced shadow map size
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    
    // Use shared geometry
    const geometry = sharedGeometries[art.shape];
    
    const material = new THREE.MeshPhongMaterial({ 
      color: art.color, 
      shininess: 100,
      emissive: art.color,
      emissiveIntensity: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    
    // Add some rotation animation
    scene.userData = { rotatingMesh: mesh };
  }

  // Create all model viewer scenes
  createModelViewerScene(artPieces[0], cubeViewerScene);
  createModelViewerScene(artPieces[1], sphereViewerScene);
  createModelViewerScene(artPieces[2], cylinderViewerScene);
  createModelViewerScene(artPieces[3], coneViewerScene);

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
    new THREE.SphereGeometry(0.25, 12, 12), // Reduced segments
    new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 60 })
  );
  characterHead.position.set(0, 1.9, 0);
  characterHead.castShadow = true;
  characterGroup.add(characterHead);

  characterGroup.position.set(0, 0, 5);
  scene.add(characterGroup); // Character is added to main scene initially

  // Collision detection arrays (only for main scene)
  const collisionBoxes = [];

  // =======================================
  // 🎯 COLLISION BOXES (OPTIMIZED)
  // =======================================
  // Add a random standalone collision box (blue wireframe)
  const randomCollisionBox = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 1.5),
    new THREE.MeshBasicMaterial({ 
      color: 0x0066ff,
      transparent: true, 
      opacity: 0.4,
      wireframe: true 
    })
  );
  randomCollisionBox.position.set(10, 1, 8);
  randomCollisionBox.userData = { type: 'collision', name: 'random_obstacle' };
  scene.add(randomCollisionBox);
  collisionBoxes.push(randomCollisionBox);

  // Add a cylinder collision (purple wireframe)
  const cylinderCollisionBox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3, 12), // Reduced segments
    new THREE.MeshBasicMaterial({ 
      color: 0xff00ff,
      transparent: true, 
      opacity: 0.4,
      wireframe: true 
    })
  );
  cylinderCollisionBox.position.set(-5, 1.5, 10);
  cylinderCollisionBox.userData = { type: 'collision', name: 'cylinder_obstacle' };
  scene.add(cylinderCollisionBox);
  collisionBoxes.push(cylinderCollisionBox);

  // =======================================
  // 🎯 OPTIMIZED MODEL LOADING
  // =======================================
  
  // Setup optimized loaders
  const loader = new GLTFLoader(loadingManager);
  
  // Optional: Add DRACO compression support for even smaller files
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  let returnPortalModel = null;

  // Optimized model loading with caching
  const modelCache = new Map();
  
  function loadModelOptimized(url, callback, progressCallback, errorCallback) {
    if (modelCache.has(url)) {
      // Return cached model
      callback(modelCache.get(url));
      return;
    }
    
    loader.load(url, 
      function(gltf) {
        // Cache the model
        modelCache.set(url, gltf);
        
        // Optimize loaded model
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Optimize materials
            if (node.material) {
              node.material.needsUpdate = false;
              // Disable unnecessary features for performance
              if (node.material.map) {
                node.material.map.generateMipmaps = false;
                node.material.map.minFilter = THREE.LinearFilter;
              }
            }
          }
        });
        
        callback(gltf);
      },
      progressCallback,
      errorCallback
    );
  }

  // Load Church Model (optimized)
  let churchModel = null;
  loadModelOptimized(
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
      scene.add(churchModel);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Church: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading church model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Grave Model (optimized)
  let graveModel = null;
  loadModelOptimized(
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
      scene.add(graveModel);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Grave: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading grave model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Portal Models (optimized with reuse)
  loadModelOptimized(
    'portal.glb',
    function (gltf) {
      console.log('Portal model loaded successfully');
      const originalPortal = gltf.scene;
      
      // Create return portal for gallery
      returnPortalModel = originalPortal.clone();
      returnPortalModel.scale.set(0.5, 0.5, 0.5);
      
      const box = new THREE.Box3().setFromObject(returnPortalModel);
      const center = box.getCenter(new THREE.Vector3());
      
      returnPortalModel.position.set(
        0 - center.x * 0.5,
        1,
        15 - center.z * 0.5
      );
      
      returnPortalModel.rotation.set(0, Math.PI, 0);
      
      returnPortalModel.userData = { 
        type: 'return-portal',
        destination: 'MAIN WORLD',
        position: new THREE.Vector3(0, 1, 15)
      };
      
      galleryScene.add(returnPortalModel);

      // Create main scene portals (reuse the same model)
      const portals = [
        { name:"2d",      pos:[-8, 1, -4],  label:"2D ART",  destination:"2D ART GALLERY", teleport: false },
        { name:"about",   pos:[-8, 1, -13], label:"ABOUT",   destination:"ABOUT PAGE", teleport: false },
        { name:"contact", pos:[8, 1, -13],  label:"CONTACT", destination:"CONTACT FORM", teleport: false },
        { name:"3d",      pos:[8, 1, -4],   label:"3D ART",  destination:"3D SHOWCASE", teleport: true },
      ];
      
      portals.forEach((portalData, index) => {
        const portalModel = originalPortal.clone();
        portalModel.scale.set(0.5, 0.5, 0.5);
        
        const box = new THREE.Box3().setFromObject(portalModel);
        const center = box.getCenter(new THREE.Vector3());
        
        portalModel.position.set(
          portalData.pos[0] - center.x * 0.5,
          portalData.pos[1],
          portalData.pos[2] - center.z * 0.5
        );
        
        portalModel.rotation.set(0, index * (Math.PI/2), 0);
        
        portalModel.userData = { 
          target: portalData.name, 
          label: portalData.label,
          destination: portalData.destination,
          position: new THREE.Vector3(...portalData.pos),
          teleport: portalData.teleport
        };
        
        scene.add(portalModel);
        portalModels.push(portalModel);
        
        // Add floating text label above each portal (optimized canvas)
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Reduced from 256
        canvas.height = 32;  // Reduced from 64
        const ctx = canvas.getContext('2d');
        ctx.font = "bold 18px Montserrat"; // Reduced font size
        ctx.fillStyle="#fff";
        ctx.textAlign="center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 2;
        ctx.fillText(portalData.label, 64, 24);
        const tex = new THREE.Texture(canvas); 
        tex.needsUpdate = true;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        
        const textMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 0.55),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        textMesh.position.set(portalData.pos[0], portalData.pos[1] + 2.5, portalData.pos[2]);
        scene.add(textMesh);
      });
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Portal: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading portal model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  const portalModels = [];

  // Optimized lighting for main scene
  const ambLight = new THREE.AmbientLight(0xffffff, 0.4); 
  scene.add(ambLight);
  
  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.7); 
  dirLight.position.set(10, 14, 4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.mapSize.setScalar(512); // Reduced shadow map size
  scene.add(dirLight);

  // Mouse look controls
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  const MOUSE_SENSITIVITY = 0.002;

  // Mouse movement only works when game is started and pointer is locked
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement && gameStarted && !isMobile) {
      mouseX = e.movementX || 0;
      mouseY = e.movementY || 0;
      
      targetRotationY -= mouseX * MOUSE_SENSITIVITY;
      currentRotationX -= mouseY * MOUSE_SENSITIVITY;
      
      // Limit vertical rotation (more freedom in spectator mode)
      if (spectatorMode) {
        currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
      } else {
        currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
      }
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Movement and physics variables
  const keys = {};
  
  // Separate handling for keydown and keyup to better manage Q key
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    // Handle Q key press immediately for spectator mode return
    if (key === 'q' && spectatorMode && currentScene.startsWith('model-')) {
      returnToGallery();
      console.log('Q key pressed - returning to gallery');
    }
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
  
  let velocity = new THREE.Vector3();
  let moveSpeed = 5;
  const sprintSpeed = 10;
  const normalSpeed = 5;
  const spectatorSpeed = 15;

  // Jump physics
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 8;
  const gravity = 20;

  // Portal detection variables
  const raycaster = new THREE.Raycaster();
  const portalDetectionDistance = 3;
  let currentPortalInView = null;

  // Scene switching functions
  function switchToGallery() {
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    // Move character to gallery scene
    scene.remove(characterGroup);
    galleryScene.add(characterGroup);
    
    // Reset character position
    characterGroup.position.set(0, 0, 10);
    
    updateControlsDisplay();
    console.log('Switched to gallery scene');
  }

  function switchToMain() {
    currentScene = 'main';
    activeScene = scene;
    spectatorMode = false;
    
    // Move character back to main scene
    galleryScene.remove(characterGroup);
    scene.add(characterGroup);
    
    // Reset character position
    characterGroup.position.set(0, 0, 5);
    
    updateControlsDisplay();
    console.log('Switched to main scene');
  }

  function switchToModelViewer(artIndex) {
    spectatorMode = true;
    
    const sceneMap = {
      0: cubeViewerScene,
      1: sphereViewerScene, 
      2: cylinderViewerScene,
      3: coneViewerScene
    };
    
    currentScene = `model-${artIndex}`;
    activeScene = sceneMap[artIndex];
    
    // Remove character from gallery (spectator mode = no visible character)
    galleryScene.remove(characterGroup);
    
    // Position camera for good view of the model
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    
    // Reset camera rotation
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log(`Switched to model viewer for ${artPieces[artIndex].name}`);
  }

  function returnToGallery() {
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    // Add character back to gallery
    galleryScene.add(characterGroup);
    characterGroup.position.set(0, 0, 10);
    
    // Reset camera rotation for normal mode
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log('Returned to gallery from model viewer');
  }

  // Function to check if crosshair is directly pointing at any portal or interactive element
  function checkPortalView() {
    if (!gameStarted) return;

    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    raycaster.set(camera.position, cameraDirection);

    let allTargetMeshes = [];
    
    if (currentScene === 'main') {
      // Check portal models in main scene
      portalModels.forEach(portalModel => {
        portalModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPortal = portalModel;
            allTargetMeshes.push(child);
          }
        });
      });
    } else if (currentScene === 'gallery') {
      // Check return portal and gallery frames
      if (returnPortalModel) {
        returnPortalModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPortal = returnPortalModel;
            allTargetMeshes.push(child);
          }
        });
      }
      
      // Add interactive gallery frames
      allTargetMeshes.push(...interactiveAreas);
    }

    // Check for intersections
    const intersects = raycaster.intersectObjects(allTargetMeshes);
    
    let targetObject = null;
    let targetDistance = Infinity;

    // Find the closest intersection within range
    for (const intersect of intersects) {
      const distance = intersect.distance;
      
      if (distance <= portalDetectionDistance && distance < targetDistance) {
        if (intersect.object.userData.type === 'gallery-frame') {
          targetObject = intersect.object;
        } else if (intersect.object.userData.parentPortal) {
          targetObject = intersect.object.userData.parentPortal;
        }
        targetDistance = distance;
      }
    }

    if (targetObject) {
      // Show portal info window
      portalInfoWindow.style.display = 'block';
      currentPortalInView = targetObject;
      
      // Update distance and destination display
      const distanceElement = document.getElementById('portal-distance');
      const destinationElement = document.getElementById('portal-destination');
      if (distanceElement) {
        distanceElement.textContent = targetDistance.toFixed(1) + 'm';
      }
      if (destinationElement) {
        if (targetObject.userData.type === 'gallery-frame') {
          destinationElement.textContent = `${artPieces[targetObject.userData.artIndex].name.toUpperCase()} VIEWER`;
        } else if (currentScene === 'main') {
          destinationElement.textContent = targetObject.userData.destination;
        } else {
          destinationElement.textContent = targetObject.userData.destination;
        }
      }
    } else {
      // Hide portal info window
      portalInfoWindow.style.display = 'none';
      currentPortalInView = null;
    }
  }

  // Enhanced collision detection - only for main scene
  function checkCollision(currentPosition, newPosition) {
    if (currentScene !== 'main') return false; // No collisions in gallery or spectator mode
    
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
        
        if (newDistance < (cylinderRadius + characterRadius) &&
            newDistance <= currentDistance &&
            newPosition.y < cylinderTop && 
            newPosition.y + 2 > cylinderBottom) {
          return true;
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
        
        const wouldCollideX = newPosition.x + characterRadius > boxMinX && newPosition.x - characterRadius < boxMaxX;
        const wouldCollideZ = newPosition.z + characterRadius > boxMinZ && newPosition.z - characterRadius < boxMaxZ;
        const wouldCollideY = newPosition.y < boxMaxY && newPosition.y + 2 > boxMinY;
        
        const currentDistanceToCenter = Math.sqrt(
          Math.pow(currentPosition.x - boxPosition.x, 2) + 
          Math.pow(currentPosition.z - boxPosition.z, 2)
        );
