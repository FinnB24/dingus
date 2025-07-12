import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { WorldBuilder } from './worldBuilder.js';
import { InventorySystem } from './inventory.js';
import { ModelLoader } from './modelLoader.js';
import { InfoWindows } from './infoWindows.js';
import { Overlays } from './overlays.js';
import { portfolioAnalytics } from './analytics.js';
import { EagleVision } from './EagleVision.js';
import { CharacterSystem } from './characterSystem.js';
import { ModelInfoViewer } from './modelInfoViewer.js';
import { Minimap } from './Minimap.js';
import { MobileControls } from './mobileControls.js';
let mobileControls = null;
const infoWindows = new InfoWindows(portfolioAnalytics);
const overlays = new Overlays(portfolioAnalytics);
window.handleWindowResize = handleWindowResize;
let gameStarted = false;
let currentScene = 'main';
let spectatorMode = false;
let allModelsLoaded = false;
let loadingComplete = false;
let minimap= null;
let characterSystem;
let characterGroup;
let eagleVision = null;
const modelViewerDetectionDistance = 4; 
const loadingManager = new THREE.LoadingManager();
let totalModelsToLoad = 11 + 39; 
let loadedModels = 0;
let characterSystemReady = false;
let allSystemsReady = false;
let crowMixer = null;
window.THREE = THREE; 
window.gameStarted = gameStarted;
const loadingDisplay = document.createElement('div');
loadingDisplay.id = 'loading-display';


if (window.mobileControls && window.mobileControls.isMobileDevice()) {
  document.addEventListener('touchstart', (e) => {
    if (window.preventESCOverlay) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });
  
  document.addEventListener('touchend', (e) => {
    if (window.preventESCOverlay) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateGameStarted(value) {
  gameStarted = value;
  window.gameStarted = value;
}

loadingDisplay.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgb(192, 195, 195);
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
  <div id="loading-progress">Loading ... 0%</div>
  <div style="margin-top: 10px; height: 4px; background: #333; border-radius: 2px;">
    <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg,rgb(192, 195, 195),rgb(142, 239, 140)); border-radius: 2px; transition: width 0.3s ease;"></div>
  </div>
  <div style="margin-top: 10px; color: #888; font-size: 12px;">just wait a moment you impatient piece of shit</div>
`;
document.body.appendChild(loadingDisplay);

function setupFormSubmission() {
  overlays.setupFormSubmission();
}

function closePaper() {
  overlays.closePaper();
}

function closeTombstone() {
  overlays.closeTombstone();
}

function closeBook() {
  overlays.closeBook();
}

function closeScroll() {
  overlays.closeScroll();
}

function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.style.display = 'none';
  });
}

function showHomeOverlay() {
  const homeOverlay = document.getElementById('overlay-home');
  if (homeOverlay) {
    homeOverlay.style.display = 'block';
    homeOverlay.classList.add('visible');
    
    const okButton = homeOverlay.querySelector('button');
    if (okButton) {
      if (!okButton.dataset.loadingSet) {
        okButton.disabled = true;
        okButton.style.opacity = '0.5';
        okButton.style.cursor = 'not-allowed';
        okButton.textContent = 'loading...';
        okButton.dataset.loadingSet = 'true';
        
        setTimeout(() => {
          okButton.disabled = false;
          okButton.style.opacity = '1';
          okButton.style.cursor = 'pointer';
          okButton.textContent = 'ok cool whatever. dont care';
          okButton.dataset.loadingSet = 'false';
        }, 500);
      }
    }
  }
}

function updateLoadingProgress(loaded, total) {
  const percentage = Math.round((loaded / total) * 100);
  const progressText = document.getElementById('loading-progress');
  const progressBar = document.getElementById('progress-bar');
  if (progressText) progressText.textContent = `Load models... ${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
  console.log(`Loading progress: ${loaded}/${total} (${percentage}%)`);
  loadedModels = loaded;
  if (loaded >= total) {
    console.log('Models done, checking for character system...');
    if (progressText) progressText.textContent = 'load character system...';
    checkAllSystemsReady();
  }
}

function checkAllSystemsReady() {
  console.log('Checking systems ready:', { 
    modelsLoaded: loadedModels >= totalModelsToLoad,
    characterSystemReady: characterSystemReady,
    allSystemsReady: allSystemsReady,
    characterSystemExists: typeof characterSystem !== 'undefined'
  });
  
  if (loadedModels >= totalModelsToLoad && characterSystemReady && !allSystemsReady) {
    allSystemsReady = true;
    allModelsLoaded = true;
    loadingComplete = true;
    setTimeout(() => {
      enableFullQuality();
    }, 1000);
    const progressText = document.getElementById('loading-progress');
    if (progressText) progressText.textContent = 'All systems ready!';
    
    setTimeout(() => {
      loadingDisplay.style.display = 'none';
      pointerLockManager.setGameInactive();
      showHomeOverlay();
      setupFormSubmission();
      console.log('All systems loaded - showing home overlay');

      if (worldBuilder && worldBuilder.queuedWorldData) {
        setTimeout(async () => {
          const loadedCount = await worldBuilder.loadWorldWhenReady();
          if (loadedCount > 0) {
            console.log(`Auto-loaded world with ${loadedCount} objects`);
          }
        }, 1000);
      }
    }, 800);
  }
}

  loadingManager.onProgress = function(url, loaded, total) {
  updateLoadingProgress(loaded, total);
};

loadingManager.onLoad = function() {
  console.log('LoadingManager: All files loaded, checking systems...');
  const checkAllSystemsReadyAfterLoad = () => {
    if (typeof characterSystem !== 'undefined' && characterSystem && characterSystem.isLoaded) {
      console.log('All systems ready!');
      updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
    } else {
      console.log('Waiting for character system...');
      setTimeout(checkAllSystemsReadyAfterLoad, 100);
    }
  };
  
  checkAllSystemsReadyAfterLoad();
};

window.closeOverlay = function(name) {
  const overlay = document.getElementById('overlay-'+name);
  if (overlay) {
    if (name === 'home') {
      const okButton = overlay.querySelector('button');
      if (okButton && okButton.disabled) {
        return; 
      }
      
      if (!allSystemsReady || !characterSystemReady || !allModelsLoaded) {
        console.log('Systems not ready, showing loading screen again');
        loadingDisplay.style.display = 'block';
        overlay.classList.remove('visible');
        overlay.style.display = 'none';
        const progressText = document.getElementById('loading-progress');
        if (progressText) progressText.textContent = 'Please wait, systems still loading...';
        
        setTimeout(checkAllSystemsReady, 500);
        return;
      }
    }
    
    overlay.classList.remove('visible');
    overlay.style.display = 'none';

    if (name === 'home' && allModelsLoaded && allSystemsReady) {
      console.log('[CloseOverlay] All systems ready, starting game...');
      
      if (mobileControls && mobileControls.isMobileDevice()) {
        updateGameStarted(true);
        console.log('Mobile game started without pointer lock');
        updateUIVisibility();
      } else {
        const container = document.getElementById('three-canvas');
        if (container) {
          setTimeout(() => {
            pointerLockManager.requestLock(container);
          }, 50);
        }
      }
    }
  }
};


window.openOverlay = function(name) {
  if (!allModelsLoaded) return;

  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  const targetOverlay = document.getElementById('overlay-'+name);
  if (targetOverlay) {
    targetOverlay.style.display = 'block';
    targetOverlay.classList.add('visible');
    
    if (name === 'home') {
      const okButton = targetOverlay.querySelector('button');
      if (okButton) {
        okButton.dataset.loadingSet = 'false';
      }
    }
  }

  if (name === 'home') {
    gameStarted = false;
  }
};

hideAllOverlays();

class PointerLockManager {
  constructor() {
    this.isRequesting = false;
    this.requestTimeout = null;
    this.isGameActive = false;
    this.debugMode = true;
    this.isMobileDevice = false;
    
    this.checkMobileDevice();
    
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);
    
    if (!this.isMobileDevice) {
      document.addEventListener('pointerlockchange', this.onPointerLockChange);
      document.addEventListener('pointerlockerror', this.onPointerLockError);
      
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isRequesting) {
          this.log('Document hidden, canceling pointer lock request');
          this.cancelRequest();
        }
      });
    } else {
      this.log('Mobile device detected - pointer lock disabled');
    }
  }

  checkMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
    
    this.isMobileDevice = isMobileUA || (hasTouch && isSmallScreen);
    
    if (window.mobileControls && window.mobileControls.isMobileDevice()) {
      this.isMobileDevice = true;
    }
  }


  
  log(message) {
    if (this.debugMode) {
      console.log(`[PointerLock] ${message}`);
    }
  }
  
  isLocked() {
    return !!document.pointerLockElement;
  }
  
  async requestLock(container) {
     if (this.isMobileDevice) {
      this.log('Pointer lock request skipped - mobile device');
      return true;
    }
    
    if (this.isLocked()) {
      this.log('Already locked');
      return true;
    }
    
    if (!container) {
      this.log('No container provided');
      return false;
    }
    
    if (document.hidden || !document.hasFocus()) {
      this.log('Document not focused/visible, cannot request pointer lock');
      return false;
    }
    
    this.isRequesting = true;
    this.log('Requesting pointer lock...');
    
    try {
      if (this.requestTimeout) {
        clearTimeout(this.requestTimeout);
      }
      
      container.focus();
      await container.requestPointerLock();
      this.requestTimeout = setTimeout(() => {
        if (this.isRequesting && !this.isLocked()) {
          this.log('Request timeout - pointer lock not acquired');
          this.isRequesting = false;
        }
      }, 1000);
      
      return true;
      
    } catch (error) {
      this.log(`Request failed: ${error.message}`);
      this.isRequesting = false;
      return false;
    }
  }
  
  exitLock() {
    if (this.isLocked()) {
      this.log('Exiting pointer lock');
      document.exitPointerLock();
    }
  }
  
  cancelRequest() {
    this.isRequesting = false;
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
    }
  }
  
onPointerLockChange() {
  if (this.isMobileDevice || (window.mobileControls && window.mobileControls.isMobileDevice())) {
      this.log('Pointer lock change ignored on mobile device');
      return;
    }
  
  const isLocked = this.isLocked();
  this.log(`Pointer lock changed: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
  
  if (isLocked) {
    this.isRequesting = false;
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
    }
    
    this.isGameActive = true;
    updateGameStarted(true);
    
  } else {
    this.isRequesting = false;
    
    if (this.isGameActive && gameStarted && 
        !overlays.isPaperReadingMode() && 
        !(inventorySystem && inventorySystem.isOpen) &&
        !(minimap && minimap.getIsFullscreen()) &&
        !(modelInfoViewer && modelInfoViewer.isViewerActive()) &&
        !(window.mobileControls && window.mobileControls.isMobileDevice())) {
      
      this.log('Game was active, showing home overlay');
      this.isGameActive = false;
      updateGameStarted(false);
      openOverlay('home');
      const infoWindows = ['portal-info', 'paper-info', 'tombstone-info', 'book-info', 'scroll-info'];
      infoWindows.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
      });
    }
  }
  updateUIVisibility();
}
  
  onPointerLockError(error) {
    this.log(`Pointer lock error: ${error}`);
    this.isRequesting = false;
    if (this.requestTimeout) {
      clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
    }
  }
  
  setGameInactive() {
    this.isGameActive = false;
  }
}
const pointerLockManager = new PointerLockManager();
const modelInfoViewer = new ModelInfoViewer(portfolioAnalytics, () => gameStarted);

window.modelInfoViewer = modelInfoViewer;
window.pointerLockManager = pointerLockManager;

try {
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');
  const scene = new THREE.Scene();
  const galleryScene = new THREE.Scene(); 
  const cubeViewerScene = new THREE.Scene();
  const sphereViewerScene = new THREE.Scene();
  const cylinderViewerScene = new THREE.Scene();
  const churchViewerScene = new THREE.Scene();
  const coneViewerScene = new THREE.Scene(); 
  let activeScene = scene;

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.8, 5);

  const initialAspect = window.innerWidth / window.innerHeight;
  if (initialAspect < 1) {
    camera.fov = 75;
  } else if (initialAspect > 2) {
    camera.fov = 65;
  } else {
    camera.fov = 70;
  }
  camera.updateProjectionMatrix();
const debouncedResize = debounce(handleWindowResize, 150);
window.addEventListener('resize', debouncedResize);

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleWindowResize();
  }, 500);
});

setTimeout(() => {
  handleWindowResize();
}, 200);
const renderer = new THREE.WebGLRenderer({ 
  antialias: false,
  powerPreference: "high-performance",
  stencil: false,
  depth: true
});

const canvas = renderer.domElement;
canvas.id = 'three-canvas-element';
canvas.style.cssText = `
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
`;

container.appendChild(canvas);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false; 
renderer.setClearColor(0x89c4f4);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

container.appendChild(renderer.domElement);

if (mobileControls && mobileControls.isMobileDevice()) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); 
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = false; 
  renderer.setClearColor(0x89c4f4);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
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


  const paperInfoWindow = document.createElement('div');
  paperInfoWindow.id = 'paper-info';
  paperInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 150px;
    height: 8w0px;
    background: rgba(139, 69, 19, 0.9);
    border: 2px solid #d4af37;
    border-radius: 10px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    transition: opacity 0.3s ease;
  `;
  paperInfoWindow.innerHTML = `
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">document found</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Letter</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Readable</span></div>
    <div style="margin-bottom: 5px;">Opinion: <span style="color: #90ee90;">Based.</span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #87ceeb;">English</span></div>
    <div style="color: #90ee90; font-size: 12px;">E to read</div>
  `;
  document.body.appendChild(paperInfoWindow);

  const tombstoneInfoWindow = document.createElement('div');
  tombstoneInfoWindow.id = 'tombstone-info';
  tombstoneInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    height: 190px;
    background: rgba(64, 64, 64, 0.95);
    border: 2px solid #888;
    border-radius: 10px;
    color: #ccc;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(128, 128, 128, 0.5);
    transition: opacity 0.3s ease;
  `;
  tombstoneInfoWindow.innerHTML = `
    <div style="color: #aaa; font-weight: bold; margin-bottom: 10px;">Gravestone found</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #ccc;">ancient Grave (idk maybe change this whole thing for diff model</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">fucked up</span></div>
    <div style="margin-bottom: 5px;">Era: <span style="color: #87ceeb;"> unknown </span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #d4af37;">Runic Script</span></div>
    <div style="color: #90ee90; font-size: 12px;">E to read engravings</div>
  `;
  document.body.appendChild(tombstoneInfoWindow);

  const bookInfoWindow = document.createElement('div');
  bookInfoWindow.id = 'book-info';
  bookInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    height: 130px;
    background: rgba(139, 69, 19, 0.95);
    border: 2px solid #d4af37;
    border-radius: 10px;
    color: #f4e4c1;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    transition: opacity 0.3s ease;
  `;
  bookInfoWindow.innerHTML = `
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">GRIMOIRE found</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Contact registry</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Well-Preserved</span></div>
    <div style="margin-bottom: 5px;">Content: <span style="color: #87ceeb;"> idk see for yourself bivch</span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #daa520;"> idk, readable</span></div>
    <div style="color: #90ee90; font-size: 12px;">E to read</div>
  `;
  document.body.appendChild(bookInfoWindow);

  const scrollInfoWindow = document.createElement('div');
  scrollInfoWindow.id = 'scroll-info';
  scrollInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    height: 130px;
    background: rgba(139, 69, 19, 0.95);
    border: 2px solid #d4af37;
    border-radius: 10px;
    color: #f4e4c1;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    transition: opacity 0.3s ease;
  `;
  scrollInfoWindow.innerHTML = `
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;"> Scroll</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Message Carrier</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;"> *shrugs* </span></div>
    <div style="margin-bottom: 5px;">Purpose: <span style="color: #87ceeb;"> anonymus feedback</span></div>
    <div style="margin-bottom: 10px;">Magic: <span style="color: #daa520;"> Curse of Vanishing bt also Loyalty </span></div>
    <div style="color: #90ee90; font-size: 12px;">Press E</div>
  `;
  document.body.appendChild(scrollInfoWindow);

function enableFullQuality() {
  console.log('Enabling full quality rendering');
  allModelsLoaded = true;
  loadingComplete = true;
  const progressText = document.getElementById('loading-progress');
  if (progressText) progressText.textContent = 'All systems ready!';
  
  setTimeout(() => {
    loadingDisplay.style.display = 'none';
    pointerLockManager.setGameInactive();
    showHomeOverlay();
    setupFormSubmission();
    console.log('All systems loaded - showing home overlay');

    if (worldBuilder && worldBuilder.queuedWorldData) {
      setTimeout(async () => {
        const loadedCount = await worldBuilder.loadWorldWhenReady();
        if (loadedCount > 0) {
          console.log(`Auto-loaded world with ${loadedCount} objects`);
        }
      }, 1000);
    }
  }, 800);
}

//main scenee =======================================
  const skyGeo = new THREE.SphereGeometry(60, 16, 16); 
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  const sunGeo = new THREE.CircleGeometry(3, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

// day/night cycl ======================
  const dayNightConfig = {
    speedMultiplier: 2, //Real time 60 for fast cycle
    transitionDuration: 0.3,

    sunrise: 6,
    sunset: 20,

    colors: {
      day: {
        sky: 0x89c4f4,
        sun: 0xfff0b1,
        ambient: 0xffffff,
        directional: 0xfff0b1,
        fog: 0xc4d4f4
      },
      night: {
        sky: 0x0a0a1a,
        sun: 0x4a4a6a,
        ambient: 0x898989,
        directional: 0x6080ff,
        fog: 0x1a1a2a
      },
      sunset: {
        sky: 0x4a2a1a,
        sun: 0xff6a2a,
        ambient: 0x8a4a2a,
        directional: 0xff8a4a,
        fog: 0x6a3a2a
      },
      sunrise: {
        sky: 0x6a4a3a,
        sun: 0xffaa4a,
        ambient: 0xaa6a4a,
        directional: 0xffaa6a,
        fog: 0x7a4a3a
      }
    },

    intensity: {
      day: { ambient: 0.4, directional: 0.7, sun: 0.8 },
      night: { ambient: 0.3, directional: 0.4, sun: 0.5 },
      sunset: { ambient: 0.25, directional: 0.4, sun: 0.6 },
      sunrise: { ambient: 0.3, directional: 0.5, sun: 0.7 }
    }
  };

  scene.fog = new THREE.Fog(dayNightConfig.colors.day.fog, 30, 80);

  const timeDisplay = document.createElement('div');
  timeDisplay.id = 'time-display';
  timeDisplay.style.cssText = `
    position: fixed;
    top: 190px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 10px;
    z-index: 1000;
    line-height: 1.4;
    min-width: 140px;
  `;
  document.body.appendChild(timeDisplay);

  function getCESTTime() {
    const now = new Date();

    const cestOffset = 2 * 60; // CEST is UTC+2
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cestTime = new Date(utc + (cestOffset * 60000));

    return cestTime;
  }

////////////////////accelerated time for testing
  function getAcceleratedTime() {
    const realTime = getCESTTime();
    const acceleratedMs = realTime.getTime() * dayNightConfig.speedMultiplier;
    return new Date(acceleratedMs);
  }

  function lerpColor(color1, color2, factor) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return (r << 16) | (g << 8) | b;
  }

  ////interp btw intensity values
  function lerpIntensity(intensity1, intensity2, factor) {
    return {
      ambient: intensity1.ambient + (intensity2.ambient - intensity1.ambient) * factor,
      directional: intensity1.directional + (intensity2.directional - intensity1.directional) * factor,
      sun: intensity1.sun + (intensity2.sun - intensity1.sun) * factor
    };
  }

  //sun/moon position based on time
  function getSunPosition(hours) {
    const sunAngle = ((hours - 6) / 12) * Math.PI; //6 AM to 6 PM = 0 to PI
    const sunHeight = Math.sin(sunAngle) * 20 + 5; //Height varies 5 to 25
    const sunX = Math.cos(sunAngle) * 30; // Xposition var
    const sunZ = -40; //Z constant

    return {
      x: sunX,
      y: Math.max(sunHeight, 2),
      z: sunZ
    };
  }

  //update day/night cycle
  function updateDayNightCycle() {
     if (!loadingComplete) return;
    const currentTime = getAcceleratedTime();
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    // Update time display
    const realCEST = getCESTTime();
    timeDisplay.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">time</div>
      <div><span style="color: #ffff00;">CEST:</span> ${realCEST.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}</div>
      <div><span style="color: #ffff00;">in game:</span> ${currentTime.toLocaleTimeString('en-GB')}</div>
      <div style="color: #ffff00;""margin-top: 8px; color: #888; font-size: 10px;">${dayNightConfig.speedMultiplier}x speed bc i'm impatient while testing</div>
      <div <span style="color: #ffff00;">// maybe add Seasonal theme/change oder so as well (needs assets replaced in ex. winter theme i guess? -> 4 Vers per asset?</span> ${realCEST.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}</div>
    `;
    let currentColors, currentIntensity, timeOfDay;
    //time of day and calculate transitions
    if (hours >= 5 && hours < 7) {
      // Sunrise transition5 AM - 7 AM
      const factor = (hours - 5) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.night.sky, dayNightConfig.colors.sunrise.sky, factor),
        sun: lerpColor(dayNightConfig.colors.night.sun, dayNightConfig.colors.sunrise.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.night.ambient, dayNightConfig.colors.sunrise.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.night.directional, dayNightConfig.colors.sunrise.directional, factor),
        fog: lerpColor(dayNightConfig.colors.night.fog, dayNightConfig.colors.sunrise.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.night, dayNightConfig.intensity.sunrise, factor);
      timeOfDay = `Sunrise (${Math.round(factor * 100)}%)`;
    } else if (hours >= 7 && hours < 9) {
      // Morning transition 7 AM - 9 AM
      const factor = (hours - 7) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.sunrise.sky, dayNightConfig.colors.day.sky, factor),
        sun: lerpColor(dayNightConfig.colors.sunrise.sun, dayNightConfig.colors.day.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.sunrise.ambient, dayNightConfig.colors.day.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.sunrise.directional, dayNightConfig.colors.day.directional, factor),
        fog: lerpColor(dayNightConfig.colors.sunrise.fog, dayNightConfig.colors.day.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.sunrise, dayNightConfig.intensity.day, factor);
      timeOfDay = `Morning (${Math.round(factor * 100)}%)`;
    } else if (hours >= 9 && hours < 18) {
      // Full day 9 AM - 6 PM
      currentColors = dayNightConfig.colors.day;
      currentIntensity = dayNightConfig.intensity.day;
      timeOfDay = "Day";
    } else if (hours >= 18 && hours < 20) {
      // Sunset 6 PM - 8 PM
      const factor = (hours - 18) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.day.sky, dayNightConfig.colors.sunset.sky, factor),
        sun: lerpColor(dayNightConfig.colors.day.sun, dayNightConfig.colors.sunset.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.day.ambient, dayNightConfig.colors.sunset.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.day.directional, dayNightConfig.colors.sunset.directional, factor),
        fog: lerpColor(dayNightConfig.colors.day.fog, dayNightConfig.colors.sunset.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.day, dayNightConfig.intensity.sunset, factor);
      timeOfDay = `Sunset (${Math.round(factor * 100)}%)`;
    } else if (hours >= 20 && hours < 22) {
      // Evening 8 PM - 10 PM
      const factor = (hours - 20) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.sunset.sky, dayNightConfig.colors.night.sky, factor),
        sun: lerpColor(dayNightConfig.colors.sunset.sun, dayNightConfig.colors.night.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.sunset.ambient, dayNightConfig.colors.night.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.sunset.directional, dayNightConfig.colors.night.directional, factor),
        fog: lerpColor(dayNightConfig.colors.sunset.fog, dayNightConfig.colors.night.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.sunset, dayNightConfig.intensity.night, factor);
      timeOfDay = `Evening (${Math.round(factor * 100)}%)`;
    } else {
      // Night 10 PM - 5 AM
      currentColors = dayNightConfig.colors.night;
      currentIntensity = dayNightConfig.intensity.night;
      timeOfDay = "Night";
    }

    timeDisplay.innerHTML += `<div><span style="color: #ffff00;">Period:</span> ${timeOfDay}</div>`;
    //colors and lighting
    if (currentScene === 'main') {
      //sky color
      skyMat.color.setHex(currentColors.sky);
      //sun/moon color and pos
      sunMat.color.setHex(currentColors.sun);
      const sunPos = getSunPosition(hours);
      sun.position.set(sunPos.x, sunPos.y, sunPos.z);
      //  lighting
      ambLight.color.setHex(currentColors.ambient);
      ambLight.intensity = currentIntensity.ambient;
      dirLight.color.setHex(currentColors.directional);
      dirLight.intensity = currentIntensity.directional;
      //  sun material opacity  intensity
      sunMat.opacity = currentIntensity.sun;
      scene.fog.color.setHex(currentColors.fog);
      dirLight.position.set(sunPos.x * 0.5, sunPos.y + 5, sunPos.z * 0.5);
    }
  }

  //grid for ground
  const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
  grid.position.y = 0.01;
  scene.add(grid);
  //Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x3d4262, shininess: 10 })
  );
  floor.rotation.x = -Math.PI/2; 
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
 
function isObjectInViewport(object, camera) {
  if (!camera.frustum) {
    camera.frustum = new THREE.Frustum();
    camera.projectionScreenMatrix = new THREE.Matrix4();
  }
  camera.projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  camera.frustum.setFromProjectionMatrix(camera.projectionScreenMatrix);
  const boundingBox = new THREE.Box3().setFromObject(object);
  return camera.frustum.intersectsBox(boundingBox);
}
  //Ini World Builder
let worldBuilder;
  try {
    worldBuilder = new WorldBuilder(scene, camera, renderer);
    console.log(' World Builder system initialized');
    //auto-loading
    const requiredModels = await worldBuilder.autoLoadWorld();
    if (requiredModels.length > 0) {
      console.log('Will auto-load world when models are ready:', requiredModels);
    }
  } catch (error) {
    console.error('failed to initialize World Builder:', error);
  }

  
  //InvSys
  let inventorySystem;
try {
  inventorySystem = new InventorySystem(scene, camera, portfolioAnalytics);
  console.log('Inventory System initialized');
  window.inventorySystem = inventorySystem;
} catch (error) {
  console.error('Failed to initialize Inventory System:', error);
}

// Init ModelLoade
let modelLoader;
try {
  modelLoader = new ModelLoader(scene, loadingManager, worldBuilder);
  modelLoader.setTotalModelsCount(totalModelsToLoad);
  // Load models
  console.log('Starting to load all models...');
  modelLoader.loadAllModels(scene, galleryScene, inventorySystem)
    .then(() => {
      console.log('All models loaded successfully!');
      updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
    })
    .catch(error => {
      console.error('Error loading models:', error);
      updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
    });
  console.log('ModelLoader initialized');
} catch (error) {
  console.error('Failed to initialize ModelLoader:', error);
}
try {
  eagleVision = new EagleVision(scene, galleryScene, renderer, modelLoader, portfolioAnalytics, camera);
  window.eagleVision = eagleVision;
  console.log('Eagle Vision system initialized');
} catch (error) {
  console.error('Failed to initialize Eagle Vision:', error);
}

// 3d galleyy scene=======================================
  //ssky
  const gallerySky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color:0x2a1810, side:THREE.BackSide }));
  galleryScene.add(gallerySky);
  // lighting
  const galleryAmbLight = new THREE.AmbientLight(0xffffff, 0.3);
  galleryScene.add(galleryAmbLight);
  const gallerySpotLight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI/6, 0.1, 2);
  gallerySpotLight.position.set(0, 15, 0);
  gallerySpotLight.target.position.set(0, 0, 0);
  gallerySpotLight.castShadow = true;
  // llow shadow map size for better perf
  gallerySpotLight.shadow.mapSize.setScalar(512);
  galleryScene.add(gallerySpotLight);
  galleryScene.add(gallerySpotLight.target);
  //floor
  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x1a1a1a, shininess: 30 })
  );
  galleryFloor.rotation.x = -Math.PI/2; 
  galleryFloor.position.y = 0;
  galleryFloor.receiveShadow = true;
  galleryScene.add(galleryFloor);
  //grid
  const galleryGrid = new THREE.GridHelper(44, 22, 0x333333, 0x222222);
  galleryGrid.position.y = 0.01;
  galleryScene.add(galleryGrid);
   //gallery walls w shared mat
  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const wallGeometry = new THREE.PlaneGeometry(30, 8);
  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -15);
  galleryScene.add(backWall);
  ///Side walls
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-15, 4, 0);
  galleryScene.add(leftWall);
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(15, 4, 0);
  galleryScene.add(rightWall);

const artPieces = [
  { pos: [-10, 2, -14.5], color: 0xff4444, shape: 'cube', name: 'Red Cube' },
  { pos: [0, 2, -14.5], color: 0x8B4513, shape: 'church', name: 'Church Model' },
  { pos: [10, 2, -14.5], color: 0x44ff44, shape: 'sphere', name: 'Green Sphere' },
  { pos: [-14.5, 2, -5], color: 0x4444ff, shape: 'cylinder', name: 'Blue Cylinder' },
  { pos: [14.5, 2, 5], color: 0xffff44, shape: 'cone', name: 'Yellow Cone' },
];
  //gallery frames + interactive areas
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
    // frame
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    //canvas preview of 3D model 
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 96; 
    const ctx = canvas.getContext('2d');
    //simple preview representation
    ctx.fillStyle = `#${art.color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(25, 25, 78, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial'; 
    ctx.textAlign = 'center';
    ctx.fillText(art.name, 64, 80);
    ctx.fillText('E to View', 64, 90);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false; //ddisable mipmaps
    texture.minFilter = THREE.LinearFilter;
    const previewMaterial = new THREE.MeshPhongMaterial({ map: texture });
    const preview = new THREE.Mesh(previewGeometry, previewMaterial);
    //frames on walls
    frame.position.copy(new THREE.Vector3(...art.pos));
    preview.position.copy(frame.position);
    preview.position.z += 0.02; // Slightly in fron
    //rotations based on wall
    if (art.pos[2] < 0) { // Bac
      frame.rotation.y = 0;
      preview.rotation.y = 0;
    } else if (art.pos[0] < 0) { //Left
      frame.rotation.y = Math.PI/2;
      preview.rotation.y = Math.PI/2;
    } else { //Right
      frame.rotation.y = -Math.PI/2;
      preview.rotation.y = -Math.PI/2;
    }
    galleryScene.add(frame);
    galleryScene.add(preview);
    galleryFrames.push(frame);
    //invis interactive area
    const interactiveArea = new THREE.Mesh(interactiveGeometry, interactiveMaterial);
    interactiveArea.position.copy(preview.position);
    interactiveArea.rotation.copy(preview.rotation);
    interactiveArea.userData = { type: 'gallery-frame', artIndex: index, artName: art.shape };
    galleryScene.add(interactiveArea);
    interactiveAreas.push(interactiveArea);
  });

// modell viewer =======================================
  const sharedGeometries = {
    cube: new THREE.BoxGeometry(4, 4, 4),
    sphere: new THREE.SphereGeometry(2.5, 24, 24),
    cylinder: new THREE.CylinderGeometry(2, 2, 6, 24), 
    cone: new THREE.ConeGeometry(2.5, 6, 24) 
  };

  function createModelViewerScene(art, scene) {
  // Darkspace environment
 const viewerSky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }));
  scene.add(viewerSky);
  //ligting
  const ambLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambLight)

  if (art.shape === 'church') {
    
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
      
    loader.load('church.glb', (gltf) => {
      const churchModel = gltf.scene;
      churchModel.scale.set(0.03, 0.03, 0.03);
      churchModel.position.set(0, -2, 0); 
      
      churchModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      scene.add(churchModel);
    }, undefined, (error) => {
      console.error('Error loading church in gallery viewer:', error);
      const geometry = new THREE.BoxGeometry(4, 4, 4);
      const material = new THREE.MeshPhongMaterial({ 
        color: art.color, 
        shininess: 100,
        emissive: art.color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });
  } else {
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
  }
}

createModelViewerScene(artPieces[0], cubeViewerScene);
createModelViewerScene(artPieces[1], churchViewerScene);
createModelViewerScene(artPieces[2], sphereViewerScene);
createModelViewerScene(artPieces[3], cylinderViewerScene);
createModelViewerScene(artPieces[4], coneViewerScene);

window.minimap = minimap;
function updateLOD() {
  if (!gameStarted || !characterGroup) return;
  const characterPos = characterGroup.position;
  const HIGH_DETAIL_DISTANCE = 15;
  const MEDIUM_DETAIL_DISTANCE = 30;
  Object.values(modelLoader.models).forEach(model => {
    if (!model || !model.position) return;
    
    const distance = characterPos.distanceTo(model.position);
    //shadow casting based on distance
    model.traverse(child => {
      if (child.isMesh) {
        if (distance > MEDIUM_DETAIL_DISTANCE) {
          child.castShadow = false;
          child.receiveShadow = false;
        } else if (distance > HIGH_DETAIL_DISTANCE) {
          child.castShadow = false;
          child.receiveShadow = true;
        } else {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });
  });
}

const collisionBoxes = [];
  // blue wirefram
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
  //purple
  const cylinderCollisionBox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3, 12),
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

  //model load============================
  const loader = new GLTFLoader(loadingManager);
  //DRACO compress -> sollte mit church model testen
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);
  let returnPortalModel = null;
  const modelCache = new Map();
  
  function loadModelOptimized(url, callback, progressCallback, errorCallback) {
  if (modelCache.has(url)) {
    //Return cached
    callback(modelCache.get(url));
    return;
  }

  loader.load(url, 
    function(gltf) {
      //Cache model
      modelCache.set(url, gltf);

      //Optimize loaded model
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          // materials
          if (node.material) {
            node.material.needsUpdate = false;
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

/////// MMODEL REGISRT FOR WORLD BUILDER
  function registerModelWithWorldBuilder(modelName, gltf) {
    if (worldBuilder) {
      worldBuilder.registerModel(modelName, {
        scene: gltf.scene.clone(),
        animations: gltf.animations || []
      });
    }
  }

// lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 0.4); 
  scene.add(ambLight);
  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.7); 
  dirLight.position.set(10, 14, 4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.mapSize.setScalar(512);
  scene.add(dirLight);
  // Mouse look
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  const MOUSE_SENSITIVITY = 0.002;

  document.addEventListener('mousemove', (e) => {
  if (minimap && minimap.getIsFullscreen()) {
    return; 
  }
  
  if (document.pointerLockElement && gameStarted && !overlays.isPaperReadingMode()) {
    mouseX = e.movementX || 0;
    mouseY = e.movementY || 0;
    targetRotationY -= mouseX * MOUSE_SENSITIVITY;
    currentRotationX -= mouseY * MOUSE_SENSITIVITY;
    window.targetRotationY = targetRotationY;
    window.currentRotationX = currentRotationX;
    if (spectatorMode) {
      currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
    } else {
      currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
    }
  }
});

const keys = {};
window.keys = keys;
document.addEventListener('minimap-navigate', (e) => {
  console.log('Navigation target set:', e.detail);
});

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (key === 'i') {
    e.preventDefault();
    e.stopPropagation();
    if (inventorySystem && gameStarted) {
      console.log('I key pressed - toggling inventory');
      inventorySystem.toggleInventory();
      return;
    }
  }
  if (key === 'm' && gameStarted && !overlays.isPaperReadingMode() && 
      !(inventorySystem && inventorySystem.isOpen) && !modelInfoViewer.isViewerActive()) {
    e.preventDefault();
    
    if (minimap && !minimap.getIsFullscreen()) {
      minimap.toggleFullscreen();
    }
  }
if (key === 'j' && gameStarted && !overlays.isPaperReadingMode() && !(inventorySystem && inventorySystem.isOpen) && !modelInfoViewer.isViewerActive()) {
  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const allSceneObjects = [];
  activeScene.traverse((object) => {
    if (object.isMesh) {
      allSceneObjects.push(object);
    }
  });
  
  const intersects = raycaster.intersectObjects(allSceneObjects, true);
  if (intersects.length > 0) {
    let validTarget = null;
    let distance = Infinity;
    
    for (const intersect of intersects) {
      const obj = intersect.object;
      distance = intersect.distance;
      
      if (distance > modelViewerDetectionDistance) {
        console.log(`Object too far: ${distance.toFixed(2)} units (max: ${modelViewerDetectionDistance})`);
        continue;
      }
    
      if (modelInfoViewer.shouldIgnoreObject(obj)) {
        console.log('Skipping ignored object:', obj.name || 'unnamed');
        continue;
      }
      
      let parentObj = obj;
      while (parentObj.parent && parentObj.parent !== activeScene) {
        parentObj = parentObj.parent;
        
        if (parentObj.userData && 
            (parentObj.userData.modelName || 
             parentObj.userData.type && !parentObj.userData.type.includes('collision'))) {
          validTarget = parentObj;
          break;
        }
      }
      
      if (!validTarget) {
        validTarget = obj;
      }
      
      if (validTarget && !modelInfoViewer.shouldIgnoreObject(validTarget)) {
        console.log(`Opening model viewer for: ${validTarget.userData?.name || validTarget.name || 'unnamed object'} (distance: ${distance.toFixed(2)})`);
        modelInfoViewer.openViewer(validTarget);
        
        if (portfolioAnalytics) {
          portfolioAnalytics.trackInteraction('model_viewer', 'trigger', {
            modelName: validTarget.userData?.name || validTarget.name || 'unknown',
            distance: distance.toFixed(2)
          });
        }
        
        break;
      }
    }
    
    if (!validTarget) {
      if (distance <= modelViewerDetectionDistance) {
        console.log('No valid model found among intersected objects');
      } 
    }
  }
}
  if (key === 'v' && !eagleVision?.isActive && gameStarted && !overlays.isPaperReadingMode() && !(inventorySystem && inventorySystem.isOpen) && !spectatorMode) {
    eagleVision?.activate(currentScene);
  }
  
  if (key === 'q' && spectatorMode && currentScene.startsWith('model-')) {
    returnToGallery();
    console.log('Q key pressed - returning to gallery');
  }
});

window.handleEagleVision = function() {
  console.log('handleEagleVision called from mobile');
  
  if (!gameStarted) {
    console.log('Game not started, ignoring V button');
    return;
  }
  
  if (overlays?.isPaperReadingMode() || 
      (inventorySystem && inventorySystem.isOpen) || 
      modelInfoViewer?.isViewerActive() ||
      spectatorMode) {
    console.log('Overlay open or spectator mode, ignoring V button');
    return;
  }
  
  if (eagleVision && !eagleVision.isActive) {
    console.log('Activating Eagle Vision from mobile');
    eagleVision.activate(currentScene);
    
    if (portfolioAnalytics) {
      portfolioAnalytics.trackInteraction('eagle_vision', 'mobile_activate', {
        scene: currentScene
      });
    }
  } else if (eagleVision && eagleVision.isActive) {
    console.log('Eagle Vision already active');
  } else {
    console.error('Eagle Vision system not available');
  }
};

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = false;
  
  console.log(' Key UP:', key, 'Current keys:', Object.keys(keys).filter(k => keys[k]));
});

  let velocity = new THREE.Vector3();
  let moveSpeed = 5;
  const sprintSpeed = 7;
  const normalSpeed = 3;
  const spectatorSpeed = 15;
  // Jump
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 12;
  const gravity = 20;
  window.isJumping = isJumping;
window.jumpVelocity = jumpVelocity;
window.jumpForce = jumpForce;
function updateGlobalJumpVars() {
  window.isJumping = isJumping;
  window.jumpVelocity = jumpVelocity;
}
  // Portal/interactive object var
  const raycaster = new THREE.Raycaster();
  const portalDetectionDistance = 3;
  const modelViewerDetectionDistance = 4;
  const paperDetectionDistance = 4; 
  const tombstoneDetectionDistance = 4;
  const bookDetectionDistance = 4; 
  const scrollDetectionDistance = 4; 
  let currentPortalInView = null;
  let currentPaperInView = null;
  let currentTombstoneInView = null;
  let currentBookInView = null;
  let currentScrollInView = null;

  function switchToGallery() {
  console.log('Switching to gallery...');
  
  if (eagleVision) {
    eagleVision.forceDeactivate();
  }
  if (minimap) {
    minimap.setScene(galleryScene);
  }
  currentScene = 'gallery';
  activeScene = galleryScene;
  spectatorMode = false;
  window.spectatorMode = false;
  
  //character to gallery
  scene.remove(characterGroup);
  galleryScene.add(characterGroup);
  characterGroup.position.set(0, 0, 10);
  if (modelInfoViewer) {
    console.log('Calling modelInfoViewer.onGalleryEntered()');
    modelInfoViewer.onGalleryEntered();
  } else {
    console.error('modelInfoViewer not available');
  }
  
  console.log('Switched to 3D gallery scene');
}

function switchToMain() {
  console.log('Switching to main...');
  currentScene = 'main';
  activeScene = scene;
  spectatorMode = false;
  window.spectatorMode = false;
  
  if (minimap) {
    minimap.setScene(scene);
  }
  if (eagleVision) {
    eagleVision.forceDeactivate();
  }
  // character back to main
  galleryScene.remove(characterGroup);
  scene.add(characterGroup);
  characterGroup.position.set(0, 0, 5);
  // Notify 
  if (modelInfoViewer) {
    console.log('Calling modelInfoViewer.onGalleryExited()');
    modelInfoViewer.onGalleryExited();
  } else {
    console.error('modelInfoViewer not available');
  }
  
  console.log('Switched to main scene');
}

  function switchToModelViewer(artIndex) {
  if (eagleVision) {
    eagleVision.forceDeactivate();
  }
  spectatorMode = true;
  window.spectatorMode = true;
  
  const sceneMap = {
    0: cubeViewerScene,
    1: churchViewerScene,
    2: sphereViewerScene, 
    3: cylinderViewerScene,
    4: coneViewerScene
  };

  currentScene = `model-${artIndex}`;
  activeScene = sceneMap[artIndex];
  //spectator mode
  galleryScene.remove(characterGroup);
  //Pos cam
  camera.position.set(8, 5, 8);
  camera.lookAt(0, 0, 0);
  // Reset cam rot
  targetRotationY = 0;
  currentRotationX = 0;
  console.log(`Switched to model viewer for ${artPieces[artIndex].name}`);
}

  function returnToGallery() {
  if (eagleVision) {
    eagleVision.forceDeactivate();
  }
  currentScene = 'gallery';
  activeScene = galleryScene;
  spectatorMode = false;
  window.spectatorMode = false;
  //back to gallery
  galleryScene.add(characterGroup);
  characterGroup.position.set(0, 0, 10);
  // Reset camera rot
  targetRotationY = 0;
  currentRotationX = 0;

  console.log('Returned to gallery from model viewer');
}

  window.camera = camera;

  function checkPortalView() {
  if (!gameStarted || overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)) return;
  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  //interactive meshes
  let allMeshes = {
    portalMeshes: [],
    paperMeshes: [],
    tombstoneMeshes: [],
    bookMeshes: [],
    scrollMeshes: [],
    keyMeshes: [],
    doorMeshes: []
  };
  if (currentScene === 'main') {
    //  portal meshes
    const portalModels = modelLoader.getPortalModels();
    portalModels.forEach(portalModel => {
      portalModel.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPortal = portalModel;
          allMeshes.portalMeshes.push(child);
        }
      });
    });
    //  paper meshes
    if (modelLoader.models.paper) {
      modelLoader.models.paper.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPaper = modelLoader.models.paper;
          allMeshes.paperMeshes.push(child);
        }
      });
    }
    //tombstone meshes
    if (modelLoader.models.grave) {
      modelLoader.models.grave.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentTombstone = modelLoader.models.grave;
          allMeshes.tombstoneMeshes.push(child);
        }
      });
    }
    //book
    if (modelLoader.models.book2) {
      modelLoader.models.book2.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentBook = modelLoader.models.book2;
          allMeshes.bookMeshes.push(child);
        }
      });
    }
    // scroll meshes
    if (modelLoader.models.scroll) {
      modelLoader.models.scroll.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentScroll = modelLoader.models.scroll;
          allMeshes.scrollMeshes.push(child);
        }
      });
    }
    //k ey meshes
    if (modelLoader.models.key) {
      modelLoader.models.key.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentKey = modelLoader.models.key;
          allMeshes.keyMeshes.push(child);
        }
      });
    }
    //  door meshes
    if (modelLoader.models.door) {
      modelLoader.models.door.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentDoor = modelLoader.models.door;
          allMeshes.doorMeshes.push(child);
        }
      });
    }
  } else if (currentScene === 'gallery') {
    const returnPortal = galleryScene.children.find(child => 
      child.userData && child.userData.type === 'return-portal'
    );
    if (returnPortal) {
      returnPortal.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPortal = returnPortal;
          allMeshes.portalMeshes.push(child);
        }
      });
    }
    allMeshes.portalMeshes.push(...interactiveAreas);
  }

const keyIntersects = raycaster.intersectObjects(allMeshes.keyMeshes);
let targetKey = null;
let keyDistance = Infinity;

if (modelLoader.models.key && modelLoader.models.key.parent) {
  for (const intersect of keyIntersects) {
    const distance = intersect.distance;
    if (distance <= 3 && distance < keyDistance) {
      const key = intersect.object.userData.parentKey;
      
        targetKey = key;
        keyDistance = distance;
     
    }
  }
  if (targetKey) {
    infoWindows.showKeyInfo(targetKey);
    window.currentKeyInView = targetKey;
    return;
  }
}
else {
  window.currentKeyInView = null;
}

const doorIntersects = raycaster.intersectObjects(allMeshes.doorMeshes);
let targetDoor = null;
let doorDistance = Infinity;
for (const intersect of doorIntersects) {
  const distance = intersect.distance;
  if (distance <= 3 && distance < doorDistance) {
    const door = intersect.object.userData.parentDoor;
    
      targetDoor = door;
      doorDistance = distance;
    
  }
}

  if (targetDoor) {
    let hint = "can be unlocked";
    if (inventorySystem) {
      const inventoryHint = inventorySystem.getInteractionHint(targetDoor);
      if (inventoryHint) {
        hint = inventoryHint;
      }
    }
    infoWindows.showDoorInfo(targetDoor, hint);
    window.currentDoorInView = targetDoor;
    return;
  }

const paperIntersects = raycaster.intersectObjects(allMeshes.paperMeshes);
let targetPaper = null;
let paperDistance = Infinity;

for (const intersect of paperIntersects) {
  const distance = intersect.distance;
  if (distance <= paperDetectionDistance && distance < paperDistance) {
    const paper = intersect.object.userData.parentPaper;
    
      targetPaper = paper;
      paperDistance = distance;
    
  }
}

  if (targetPaper) {
    infoWindows.showPaperInfo(targetPaper);
    currentPaperInView = targetPaper;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
    return;
  }

  const scrollIntersects = raycaster.intersectObjects(allMeshes.scrollMeshes);
  let targetScroll = null;
  let scrollDistance = Infinity;

  for (const intersect of scrollIntersects) {
    const distance = intersect.distance;
    if (distance <= scrollDetectionDistance && distance < scrollDistance) {
      targetScroll = intersect.object.userData.parentScroll;
      scrollDistance = distance;
    }
  }

  if (targetScroll) {
    infoWindows.showScrollInfo(targetScroll);
    currentScrollInView = targetScroll;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
    return; 
  }

  const bookIntersects = raycaster.intersectObjects(allMeshes.bookMeshes);
  let targetBook = null;
  let bookDistance = Infinity;

  for (const intersect of bookIntersects) {
    const distance = intersect.distance;
    if (distance <= bookDetectionDistance && distance < bookDistance) {
      targetBook = intersect.object.userData.parentBook;
      bookDistance = distance;
    }
  }

  if (targetBook) {
    infoWindows.showBookInfo(targetBook);
    currentBookInView = targetBook;
    currentPortalInView = null;
    currentTombstoneInView = null;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
    return;
  }

  const tombstoneIntersects = raycaster.intersectObjects(allMeshes.tombstoneMeshes);
  let targetTombstone = null;
  let tombstoneDistance = Infinity;

  for (const intersect of tombstoneIntersects) {
    const distance = intersect.distance;
    if (distance <= tombstoneDetectionDistance && distance < tombstoneDistance) {
      targetTombstone = intersect.object.userData.parentTombstone;
      tombstoneDistance = distance;
    }
  }
  if (targetTombstone) {
    infoWindows.showTombstoneInfo(targetTombstone);
    currentTombstoneInView = targetTombstone;
    currentPortalInView = null;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
    return;
  }

  const portalIntersects = raycaster.intersectObjects(allMeshes.portalMeshes);
  let targetPortal = null;
  let portalDistance = Infinity;

  for (const intersect of portalIntersects) {
    const distance = intersect.distance;
    if (distance <= portalDetectionDistance && distance < portalDistance) {
      if (intersect.object.userData.type === 'gallery-frame') {
        targetPortal = intersect.object;
      } else if (intersect.object.userData.parentPortal) {
        targetPortal = intersect.object.userData.parentPortal;
      }
      portalDistance = distance;
    }
  }

  if (targetPortal) {
    infoWindows.showPortalInfo(targetPortal, portalDistance);
    currentPortalInView = targetPortal;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
  } else {
    infoWindows.hideAllWindows();
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
    window.currentKeyInView = null;
    window.currentDoorInView = null;
  }
}
  // collision detection main scene
  function checkCollision(currentPosition, newPosition) {
    if (currentScene !== 'main') return false; 

    const characterRadius = 0.4;

    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;
      if (boxGeometry.type === 'CylinderGeometry') {
        // Cylinder 
        const cylinderRadius = boxGeometry.parameters.radiusTop;
        const cylinderHeight = boxGeometry.parameters.height;
        const cylinderTop = boxPosition.y + cylinderHeight/2;
        const cylinderBottom = boxPosition.y - cylinderHeight/2;
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
        // Box collision
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
        const newDistanceToCenter = Math.sqrt(
          Math.pow(newPosition.x - boxPosition.x, 2) + 
          Math.pow(newPosition.z - boxPosition.z, 2)
        );

        if (wouldCollideX && wouldCollideZ && wouldCollideY &&
            newDistanceToCenter <= currentDistanceToCenter) {
          return true;
        }
      }
    }
    return false;
  }

  function getGroundLevel(position) {
    if (currentScene !== 'main') return 0; 
    let groundLevel = 0;
    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;
      if (boxGeometry.type === 'CylinderGeometry') {
        const cylinderRadius = boxGeometry.parameters.radiusTop;
        const cylinderHeight = boxGeometry.parameters.height;
        const cylinderTop = boxPosition.y + cylinderHeight/2;
        const dx = position.x - boxPosition.x;
        const dz = position.z - boxPosition.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        if (horizontalDistance <= cylinderRadius && cylinderTop > groundLevel) {
          groundLevel = cylinderTop;
        }
      } else {
        const boxWidth = boxGeometry.parameters.width;
        const boxDepth = boxGeometry.parameters.depth;
        const boxHeight = boxGeometry.parameters.height;
        const boxTop = boxPosition.y + boxHeight/2;
        const boxMinX = boxPosition.x - boxWidth / 2;
        const boxMaxX = boxPosition.x + boxWidth / 2;
        const boxMinZ = boxPosition.z - boxDepth / 2;
        const boxMaxZ = boxPosition.z + boxDepth / 2;
        if (position.x >= boxMinX && position.x <= boxMaxX &&
            position.z >= boxMinZ && position.z <= boxMaxZ &&
            boxTop > groundLevel) {
          groundLevel = boxTop;
        }
      }
    }
    return groundLevel;
  }
function handleModelInspect() {
  if (!gameStarted || overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen) || modelInfoViewer.isViewerActive()) {
    return;
  }
  
  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const allSceneObjects = [];
  activeScene.traverse((object) => {
    if (object.isMesh) {
      allSceneObjects.push(object);
    }
  });
  
  const intersects = raycaster.intersectObjects(allSceneObjects, true);
  if (intersects.length > 0) {
    let validTarget = null;
    let distance = Infinity;
    
    for (const intersect of intersects) {
      const obj = intersect.object;
      distance = intersect.distance;
      
      if (distance > modelViewerDetectionDistance) {
        console.log(`Object too far: ${distance.toFixed(2)} units (max: ${modelViewerDetectionDistance})`);
        continue;
      }
    
      if (modelInfoViewer.shouldIgnoreObject(obj)) {
        console.log('Skipping ignored object:', obj.name || 'unnamed');
        continue;
      }
      
      let parentObj = obj;
      while (parentObj.parent && parentObj.parent !== activeScene) {
        parentObj = parentObj.parent;
        
        if (parentObj.userData && 
            (parentObj.userData.modelName || 
             parentObj.userData.type && !parentObj.userData.type.includes('collision'))) {
          validTarget = parentObj;
          break;
        }
      }
      
      if (!validTarget) {
        validTarget = obj;
      }
      
      if (validTarget && !modelInfoViewer.shouldIgnoreObject(validTarget)) {
        console.log(`Opening model viewer for: ${validTarget.userData?.name || validTarget.name || 'unnamed object'} (distance: ${distance.toFixed(2)})`);
        modelInfoViewer.openViewer(validTarget);
        
        if (portfolioAnalytics) {
          portfolioAnalytics.trackInteraction('model_viewer', 'trigger', {
            modelName: validTarget.userData?.name || validTarget.name || 'unknown',
            distance: distance.toFixed(2)
          });
        }
        
        break;
      }
    }
    
    if (!validTarget) {
      if (distance <= modelViewerDetectionDistance) {
        console.log('No valid model found among intersected objects');
      } 
    }
  }
}

window.handleModelInspect = handleModelInspect;

function moveCharacter(dt) {
  if (!gameStarted || overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)) {
    if (mobileControls) {
      mobileControls.hide();
    }
    return;
  }
  if (keys[' '] && !isJumping) {
    isJumping = true;
    jumpVelocity = jumpForce;
    
    if (characterSystem) {
      characterSystem.forceJumpAnimation();
      characterSystem.updateJumpState(false, jumpForce, true);
    }
  }
  
  if (spectatorMode) {
    const spectatorMoveSpeed = spectatorSpeed;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    let movement = new THREE.Vector3();
    if (keys['w']) movement.add(forward.multiplyScalar(spectatorMoveSpeed * dt));
    if (keys['s']) movement.add(forward.multiplyScalar(-spectatorMoveSpeed * dt));
    if (keys['a']) movement.add(right.multiplyScalar(-spectatorMoveSpeed * dt));
    if (keys['d']) movement.add(right.multiplyScalar(spectatorMoveSpeed * dt));
    if (keys[' ']) movement.add(up.multiplyScalar(spectatorMoveSpeed * dt));
    if (keys['shift']) movement.add(up.multiplyScalar(-spectatorMoveSpeed * dt));
    camera.position.add(movement);
    return;
  }

  if (characterSystem && characterSystem.isLoaded) {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    let desiredVelocity = new THREE.Vector3();

    let inputForward = keys['w'] || keys['arrowup'];
    let inputBackward = keys['s'] || keys['arrowdown'];
    let inputLeft = keys['a'] || keys['arrowleft'];
    let inputRight = keys['d'] || keys['arrowright'];
    let inputSprint = keys['shift'];
    let inputCrouch = keys['b'];
    
    if (mobileControls && mobileControls.isMobileDevice()) {
      const mobileState = mobileControls.movementState;
      inputForward = inputForward || mobileState.forward;
      inputBackward = inputBackward || mobileState.backward;
      inputLeft = inputLeft || mobileState.left;
      inputRight = inputRight || mobileState.right;
      inputSprint = inputSprint || mobileState.sprinting;
      inputCrouch = inputCrouch || mobileState.crouching;
    }

    const currentMoveSpeed = inputSprint ? sprintSpeed : normalSpeed;

    if (inputForward) {
      desiredVelocity.x += forward.x * currentMoveSpeed * dt;
      desiredVelocity.z += forward.z * currentMoveSpeed * dt;
    }
    if (inputBackward) {
      desiredVelocity.x -= forward.x * currentMoveSpeed * dt;
      desiredVelocity.z -= forward.z * currentMoveSpeed * dt;
    }
    if (inputLeft) {
      desiredVelocity.x -= right.x * currentMoveSpeed * dt;
      desiredVelocity.z -= right.z * currentMoveSpeed * dt;
    }
    if (inputRight) {
      desiredVelocity.x += right.x * currentMoveSpeed * dt;
      desiredVelocity.z += right.z * currentMoveSpeed * dt;
    }
    
    const movementInput = {
      forward: inputForward,
      backward: inputBackward,
      left: inputLeft,
      right: inputRight,
      sprinting: inputSprint,
      crouching: inputCrouch,
      moving: Math.abs(desiredVelocity.x) > 0.01 || Math.abs(desiredVelocity.z) > 0.01
    };
    
    characterSystem.updateMovementState(movementInput);
    const currentPos = characterGroup.position;
    const testPositionX = currentPos.clone();
    testPositionX.x += desiredVelocity.x;
    if (!checkCollision(currentPos, testPositionX)) {
      characterGroup.position.x = testPositionX.x;
    }
    const testPositionZ = currentPos.clone();
    testPositionZ.z += desiredVelocity.z;
    if (!checkCollision(currentPos, testPositionZ)) {
      characterGroup.position.z = testPositionZ.z;
    }
    
    if (isJumping || characterGroup.position.y > 0) {
      jumpVelocity -= gravity * dt;
      characterGroup.position.y += jumpVelocity * dt;
    }
    
    const currentGroundLevel = getGroundLevel(characterGroup.position);
    if (characterGroup.position.y <= currentGroundLevel) {
      characterGroup.position.y = currentGroundLevel;
      isJumping = false;
      jumpVelocity = 0;
    }
    if (!isJumping && characterGroup.position.y > currentGroundLevel) {
      isJumping = true;
      jumpVelocity = 0;
    }
    const isGrounded = !isJumping && characterGroup.position.y <= currentGroundLevel;
    characterSystem.updateJumpState(isGrounded, jumpVelocity, isJumping);
    characterGroup.position.x = Math.max(Math.min(characterGroup.position.x, 23), -23);
    characterGroup.position.z = Math.max(Math.min(characterGroup.position.z, 23), -18);
  }

  if (keys['e']) {
    if (window.currentKeyInView && inventorySystem) {
  const keyData = window.currentKeyInView.userData.itemData;
  if (inventorySystem.addItem(keyData)) {
    scene.remove(window.currentKeyInView);
    if (modelLoader.models.key === window.currentKeyInView) {
      modelLoader.models.key = null;
    }
    if (infoWindows && infoWindows.windows.key) {
      infoWindows.windows.key.style.display = 'none';
    }
    window.currentKeyInView = null;
    document.querySelectorAll('#key-info-temp').forEach(el => el.remove());
  }
}
    else if (window.currentDoorInView && inventorySystem) {
      if (inventorySystem.useItemOn(window.currentDoorInView)) {
        document.querySelectorAll('#door-info-temp').forEach(el => el.remove());
        window.currentDoorInView = null;
      }
    }
    if (currentPaperInView) {
      overlays.openPaper();
    } else if (currentScrollInView) {
      overlays.openScroll();
    } else if (currentBookInView) {
      overlays.openBook();
    } else if (currentTombstoneInView) {
      overlays.openTombstone();
    } else if (currentPortalInView) {
      if (currentScene === 'main' && currentPortalInView.userData.teleport) {
        switchToGallery();
        infoWindows.hideAllWindows()
        currentPortalInView = null;
      } else if (currentScene === 'gallery') {
        if (currentPortalInView.userData.type === 'return-portal') {
          switchToMain();
          infoWindows.hideAllWindows()
          currentPortalInView = null;
        } else if (currentPortalInView.userData.type === 'gallery-frame') {
          switchToModelViewer(currentPortalInView.userData.artIndex);
          infoWindows.hideAllWindows()
          currentPortalInView = null;
        }
      }
    }
  }
  updateGlobalJumpVars(); 
}

let currentCameraHeight = 1.8;
const CAMERA_TRANSITION_SPEED = 4.0;

  function updateCamera() {
  targetRotationY = window.targetRotationY || 0;
  currentRotationX = window.currentRotationX || 0;
  
  if (spectatorMode) {
    camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
  } else {
    if (characterSystem && characterSystem.isLoaded && !characterSystem.usesFallback) {
      const headPosition = characterSystem.getHeadWorldPosition();
      const eyeOffset = new THREE.Vector3(0, 0, -0.1);
      eyeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
      camera.position.copy(headPosition);
      camera.position.add(eyeOffset);
      
    } else {
      let eyeHeight = 1.8;
      
      if (characterSystem && characterSystem.isLoaded) {
        const currentState = characterSystem.currentState;
        if (currentState === 'crouch' || currentState === 'crouchWalk') {
          eyeHeight = 1.2;
        }
      }
      camera.position.copy(characterGroup.position);
      camera.position.y += eyeHeight;
    }
    camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
  }
  
  window.targetRotationY = targetRotationY;
  window.currentRotationX = currentRotationX;
}
  function updateCurrentScene(newScene) {
  currentScene = newScene;
  window.currentScene = newScene;
}

function updateUIVisibility() {
  if (mobileControls && mobileControls.isMobileDevice()) {
    const showUI = gameStarted && 
                   !overlays.isPaperReadingMode() && 
                   !(inventorySystem && inventorySystem.isOpen) &&
                   !modelInfoViewer.isViewerActive() &&
                   !(minimap && minimap.getIsFullscreen()) &&
                   !document.querySelector('.overlay.visible');
    
    crosshair.style.display = showUI ? 'block' : 'none';
    timeDisplay.style.display = 'none';
    
    if (showUI) {
      mobileControls.show();
    } else {
      mobileControls.hide();
    }
    
    if (minimap) {
      minimap.setVisible(showUI || (minimap && minimap.getIsFullscreen()));
    }
    return;
  }
  
  const showUI = gameStarted && document.pointerLockElement && 
                 !overlays.isPaperReadingMode() && 
                 !(inventorySystem && inventorySystem.isOpen) &&
                 !modelInfoViewer.isViewerActive() &&
                 !(minimap && minimap.getIsFullscreen());
  
  crosshair.style.display = showUI ? 'block' : 'none';
  timeDisplay.style.display = showUI ? 'block' : 'none';
  
  if (minimap) {
    minimap.setVisible(showUI || (minimap && minimap.getIsFullscreen()));
  }
}

document.addEventListener('pointerlockchange', () => {
  if (window.mobileControls && window.mobileControls.isMobileDevice()) {
    console.log('Pointer lock change ignored - mobile device detected');
    return;
  }
  
  console.log('Pointer lock changed. Locked:', !!document.pointerLockElement, 'Starting game:', !!window.isStartingGame);
  
  if (!document.pointerLockElement && gameStarted && 
      !overlays.isPaperReadingMode() && 
      !(inventorySystem && inventorySystem.isOpen) && 
      !modelInfoViewer.isViewerActive() &&
      !(minimap && minimap.getIsFullscreen()) && 
      !window.isStartingGame) {
    
    console.log('Pointer lock lost, showing home overlay');
    openOverlay('home');
    updateGameStarted(false);
    infoWindows.hideAllWindows()
    paperInfoWindow.style.display = 'none';
    tombstoneInfoWindow.style.display = 'none';
    bookInfoWindow.style.display = 'none';
    scrollInfoWindow.style.display = 'none';
    
    if (mobileControls) {
      mobileControls.hide();
    }
  } else if (document.pointerLockElement && window.isStartingGame) {
    console.log('Pointer lock acquired successfully');
    window.isStartingGame = false;
  }
  
  updateUIVisibility();
});


  let lastTime = performance.now();

  try {
    characterSystem = new CharacterSystem(scene, loadingManager, portfolioAnalytics);
    console.log('Character System initialized');
    characterGroup = characterSystem.getCharacterGroup();
    
    mobileControls = new MobileControls(characterSystem, camera, {
      gameStarted: () => gameStarted,
      isOverlayOpen: () => overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)
    }, inventorySystem);

    characterSystem.loadCharacter().then(() => {
      console.log('Animated Manny character loaded successfully');
      characterSystemReady = true;
      
      try {
        minimap = new Minimap(scene, camera, characterGroup);
        window.minimap = minimap;
        console.log('Minimap system initialized and exposed globally');
      } catch (error) {
        console.error('Failed to initialize Minimap:', error);
      }
      
      checkAllSystemsReady();
    }).catch(error => {
      console.error('Failed to load character, using fallback:', error);
      characterSystemReady = true;
      
      try {
        minimap = new Minimap(scene, camera, characterGroup);
        window.minimap = minimap;
        console.log('Minimap system initialized with fallback and exposed globally');
      } catch (error) {
        console.error('Failed to initialize Minimap:', error);
      }
      
      checkAllSystemsReady();
    });
    
  } catch (error) {
    console.error('Failed to initialize Character System:', error);
    characterGroup = new THREE.Group();
    const characterBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1.2, 4, 8),
      new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 60 })
    );
    characterBody.castShadow = true;
    characterBody.receiveShadow = true;
    characterBody.position.y = 1.1;
    characterGroup.add(characterBody);
    characterGroup.position.set(0, 0, 5);
    scene.add(characterGroup);
    
    mobileControls = new MobileControls(characterSystem, camera, {
      gameStarted: () => gameStarted,
      isOverlayOpen: () => overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)
    }, inventorySystem);
    
    try {
      minimap = new Minimap(scene, camera, characterGroup);
      console.log('Minimap system initialized with emergency fallback');
    } catch (error) {
      console.error('Failed to initialize Minimap:', error);
    }
    
    characterSystemReady = true; 
    checkAllSystemsReady();
  }

function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;

  if (eagleVision) {
    eagleVision.update();
  }

  if (mobileControls && mobileControls.isMobileDevice() && mobileControls.isControlsVisible()) {
    mobileControls.update(dt);
  }

  updateUIVisibility();
  updateDayNightCycle();
  updateLOD();

  if (modelLoader) {
    modelLoader.update(dt);
  }
  
  if (characterSystem) {
    characterSystem.update(dt);
  }
  
  if (minimap && gameStarted) {
    minimap.update();
    minimap.animate3DMarkers(dt);
    
    if (characterGroup) {
      const removedCount = minimap.checkAndRemoveNearbyMarkers(characterGroup.position, 2.0);
      
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} marker(s) by proximity`);
      }
    }
  }
  
  if(gameStarted && !document.getElementById('overlay-home').classList.contains('visible') && !overlays.isPaperReadingMode()) {
    moveCharacter(dt);
    checkPortalView();
  }
  
  if (activeScene.userData && activeScene.userData.rotatingMesh) {
    activeScene.userData.rotatingMesh.rotation.y += dt * 0.5;
  }

  updateCamera();
  renderer.render(activeScene, camera);
  requestAnimationFrame(animate);
}
  animate();

} catch (error) {
  console.error('Fatal error in initialization:', error);
  document.body.innerHTML = `
    <div style="padding:20px;color:white;background:rgba(0,0,0,0.8)">
      <h2>Error Loading Scene</h2>
      <p>${error.message}</p>
      <p>console for more details.</p>
    </div>
  `;
}



function setupMobileOptimizations() {
  if (mobileControls && mobileControls.isMobileDevice()) {
    console.log('Applying mobile optimizations...');
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Cap at 1x pixel ratio
    renderer.shadowMap.enabled = false; //shadows
    renderer.antialias = false; //antialiasing
    
    // Reduce renderer size
    const mobileWidth = Math.min(window.innerWidth, 1280);
    const mobileHeight = Math.min(window.innerHeight, 720);
    renderer.setSize(mobileWidth, mobileHeight);
    
    //camera aspect ratio
    camera.aspect = mobileWidth / mobileHeight;
    camera.updateProjectionMatrix();
    
    if (scene.fog) {
      scene.fog.far = 30; // Reduce fog
    }
    
    window.MOBILE_DISABLE_DAY_NIGHT = true;
    console.log('Mobile optimizations applied');
  }
}
window.scene = scene;
window.overlays = overlays;
window.inventorySystem = inventorySystem;
window.modelLoader = modelLoader;
window.infoWindows = infoWindows;
window.currentScene = currentScene;
window.switchToGallery = switchToGallery;
window.currentScene = currentScene; 
window.switchToMain = switchToMain;
window.switchToModelViewer = switchToModelViewer;
window.eagleVision = eagleVision;
window.spectatorMode = spectatorMode;
window.portfolioAnalytics = portfolioAnalytics;
function handleWindowResize() {
    if (typeof camera === 'undefined') {
    console.log('Camera not yet initialized, skipping resize');
    return;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  console.log(`Resizing to: ${width}x${height}`);
  
  const newAspect = width / height;
  camera.aspect = newAspect;
    if (newAspect < 1) {
    camera.fov = 75;
  } else if (newAspect > 2) { 
    camera.fov = 65;
  } else {
    camera.fov = 70;
  }
  
  camera.updateProjectionMatrix();
  
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  
  const canvas = renderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  
  const container = document.getElementById('three-canvas');
  if (container) {
    container.style.width = '100vw';
    container.style.height = '100vh';
  }
  
  if (minimap) {
    minimap.updateSize();
  }
  
  if (characterGroup && !spectatorMode) {
    const charPos = characterGroup.position;
    camera.position.copy(charPos);
    camera.position.y += 1.8;
    
  } else if (spectatorMode) {
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
  }
  
  if (minimap && minimap.minimapCamera) {
    const mapCamera = minimap.minimapCamera;
    mapCamera.aspect = newAspect;
    mapCamera.updateProjectionMatrix();
  }
  
  if (renderer && activeScene && camera) {
    renderer.render(activeScene, camera);
    
    setTimeout(() => {
      renderer.render(activeScene, camera);
    }, 50);
    
    setTimeout(() => {
      renderer.render(activeScene, camera);
    }, 200);
  }
  
  if (overlays) {
    const activeOverlays = document.querySelectorAll('.overlay:not([style*="display: none"])');
    activeOverlays.forEach(overlay => {
      if (overlay.style.display === 'block') {
        overlay.style.transform = 'none';
        setTimeout(() => {
          overlay.style.transform = '';
        }, 10);
      }
    });
  }
  
  console.log('Scene refitted for new dimensions:', {
    aspect: newAspect.toFixed(2),
    fov: camera.fov,
    rendererSize: [renderer.domElement.width, renderer.domElement.height],
    windowSize: [width, height],
    cameraPosition: camera.position,
    characterPosition: characterGroup ? characterGroup.position : 'N/A'
  });
}
function refitSceneToScreen() {
  console.log('Refitting scene to current screen dimensions...');
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  
  if (characterGroup && !spectatorMode) {
    updateCamera(); 
  }
  
  if (minimap) {
    minimap.updateSize();
  }
  renderer.render(activeScene, camera);
  
  console.log('Scene refit complete');
}

window.refitSceneToScreen = refitSceneToScreen;
window.addEventListener('resize', handleWindowResize);

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    handleWindowResize();
  }, 500);
});

setTimeout(() => {
  handleWindowResize();
}, 200);



window.debugWorldBuilder = function() {
  if (worldBuilder) {
    worldBuilder.debugWorldState();
  } else {
    console.log('World Builder not initialized');
  }
};

class StaticErrorReporter {
  constructor() {
    this.errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
    this.setupHandlers();
  }

  setupHandlers() {
    window.addEventListener('error', (event) => {
      this.reportError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError('promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }

  reportError(type, details) {
    const error = {
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      currentScene: window.currentScene || 'unknown'
    };

    this.errors.push(error);
    console.error('Portfolio Error:', error);
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    localStorage.setItem('portfolio_errors', JSON.stringify(this.errors));
    this.showErrorToUser(type, details);
  }

  showErrorToUser(type, details) {
    if (type === 'model_load_failed') {
      console.warn('Some 3D models failed to load. Experience may be limited.');
    }
  }

  exportErrors() {
    const blob = new Blob([JSON.stringify(this.errors, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-errors-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
const errorReporter = new StaticErrorReporter();
window.errorReporter = errorReporter;

window.onOverlayClose = function() {
  console.log('[OverlayClose] Overlay closed via button');
  
};
