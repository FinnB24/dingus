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
import { Reflector } from 'three/addons/objects/Reflector.js';
import { CharacterSystem } from './characterSystem.js';

const infoWindows = new InfoWindows(portfolioAnalytics);
const overlays = new Overlays(portfolioAnalytics);

let gameStarted = false;
let currentScene = 'main';
let spectatorMode = false;
let allModelsLoaded = false;
let eagleVision = null;

const loadingManager = new THREE.LoadingManager();
let totalModelsToLoad = 11 + 39; 
let loadedModels = 0;
let characterSystemReady = false;
let allSystemsReady = false;
let crowMixer = null;

const loadingDisplay = document.createElement('div');
loadingDisplay.id = 'loading-display';
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
  <div style="color:rgb(192, 195, 195) ; font-weight: bold; margin-bottom: 15px;">loading stuff</div>
  <div id="loading-progress">Loading ... 0%</div>
  <div style="margin-top: 10px; height: 4px; background: #333; border-radius: 2px;">
    <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg,rgb(192, 195, 195),rgb(142, 239, 140)); border-radius: 2px; transition: width 0.3s ease;"></div>
  </div>
  <div style="margin-top: 10px; color: #888; font-size: 12px;">wait until models and all of that stuff is loaded...</div>
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
          okButton.textContent = 'ok';
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

  if (progressText) progressText.textContent = `Loading models... ${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;

  loadedModels = loaded;

  if (loaded >= total) {
    if (progressText) progressText.textContent = 'Loading character system...';
    checkAllSystemsReady();
  }
}

function checkAllSystemsReady() {
  if (loadedModels >= totalModelsToLoad && characterSystemReady && !allSystemsReady) {
    allSystemsReady = true;
    allModelsLoaded = true;
    
    const progressText = document.getElementById('loading-progress');
    if (progressText) progressText.textContent = 'All systems ready!';
    
    setTimeout(() => {
      loadingDisplay.style.display = 'none';
      pointerLockManager.setGameInactive();
      
      showHomeOverlay();
      setupFormSubmission();

      if (worldBuilder && worldBuilder.queuedWorldData) {
        setTimeout(async () => {
          const loadedCount = await worldBuilder.loadWorldWhenReady();
        }, 1000);
      }
    }, 800);
  }
}

loadingManager.onProgress = function(url, loaded, total) {
  updateLoadingProgress(loaded, total);
};

loadingManager.onLoad = function() {
  const checkAllSystemsReady = () => {
    if (characterSystem && characterSystem.isLoaded) {
      updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
    } else {
      setTimeout(checkAllSystemsReady, 100);
    }
  };
  
  checkAllSystemsReady();
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
      const container = document.getElementById('three-canvas');
      if (container) {
        setTimeout(() => {
          pointerLockManager.requestLock(container);
        }, 50);
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
    
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);
    
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRequesting) {
        this.cancelRequest();
      }
    });
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
    if (this.isRequesting) {
      this.log('Already requesting, ignoring duplicate request');
      return false;
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
          this.isRequesting = false;
        }
      }, 1000);
      
      return true;
      
    } catch (error) {
      this.isRequesting = false;
      return false;
    }
  }
  
  exitLock() {
    if (this.isLocked()) {
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
    const isLocked = this.isLocked();
    
    if (isLocked) {
      this.isRequesting = false;
      if (this.requestTimeout) {
        clearTimeout(this.requestTimeout);
        this.requestTimeout = null;
      }
      
      this.isGameActive = true;
      gameStarted = true;
      
    } else {
      this.isRequesting = false;
      
      if (this.isGameActive && gameStarted && !overlays.isPaperReadingMode() && 
          !(inventorySystem && inventorySystem.isOpen)) {
        
        this.isGameActive = false;
        gameStarted = false;
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

try {
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');

  const scene = new THREE.Scene();
  const galleryScene = new THREE.Scene();

  const cubeViewerScene = new THREE.Scene();
  const sphereViewerScene = new THREE.Scene();
  const cylinderViewerScene = new THREE.Scene();
  const coneViewerScene = new THREE.Scene();

  let activeScene = scene;

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.8, 5); 
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
  });
  renderer.setClearColor(0x89c4f4);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
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
    if (spectatorMode) {
      controlsDisplay.innerHTML = `
        <div style="color: rgb(192, 195, 195); font-weight: bold; margin-bottom: 8px;">spect. mode</div>
        <div><span style="color: #ffff00;">WASD</span> - Fly</div>
        <div><span style="color: #ffff00;">Mouse</span> - Free</div>
        <div><span style="color: #ffff00;">Space</span> - up</div>
        <div><span style="color: #ffff00;">Shift</span> - down</div>
        <div><span style="color: #ffff00;">Q</span> - Return to gallery</div>
        <div><span style="color: #ffff00;">ESC</span> - Menu</div>
      `;
    } else {
      controlsDisplay.innerHTML = `
        <div style="color: rgb(192, 195, 195); font-weight: bold; margin-bottom: 8px;">controls</div>
        <div><span style="color: #ffff00;">WASD</span> - Move</div>
        <div><span style="color: #ffff00;">Mouse</span> - Look around</div>
        <div><span style="color: #ffff00;">Space</span> - jump</div>
        <div><span style="color: #ffff00;">Shift</span> - sprint</div>
        <div><span style="color: #ffff00;">B</span> - crouch</div>
        <div><span style="color: #ffff00;">ESC</span> - Menu</div>
        <div><span style="color: #ffff00;">E</span> - interact with stuff</div>
        <div><span style="color: #ffff00;">I</span> - Inventory</div>
        <div><span style="color: #ffff00;">V</span> - Detect Interactables</div>
      `;
    }
  }

  updateControlsDisplay();
  document.body.appendChild(controlsDisplay);

  const portalInfoWindow = document.createElement('div');
  portalInfoWindow.id = 'portal-info';
  portalInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 250px;
    height: 150px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid rgb(192, 195, 195);
    border-radius: 10px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgb(192, 195, 195);
    transition: opacity 0.3s ease;
  `;
  portalInfoWindow.innerHTML = `
    <div style="color: rgb(192, 195, 195); font-weight: bold; margin-bottom: 10px;">PORTAL DETECTED</div>
    <div style="margin-bottom: 5px;">Status: <span style="color: #00ff00;">ACTIVE</span></div>
    <div style="margin-bottom: 5px;">Energy: <span style="color: #ffff00;">97.3%</span></div>
    <div style="margin-bottom: 5px;">Destination: <span id="portal-destination" style="color: #ff9900;">--</span></div>
    <div style="margin-bottom: 10px;">Distance: <span id="portal-distance" style="color: rgb(192, 195, 195);">--</span></div>
    <div style="color: #00ff00; font-size: 12px;">Press E to enter portal</div>
  `;
  document.body.appendChild(portalInfoWindow);

  const paperInfoWindow = document.createElement('div');
  paperInfoWindow.id = 'paper-info';
  paperInfoWindow.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
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
    left: 20px;
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
    left: 20px;
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
    left: 20px;
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

  const skyGeo = new THREE.SphereGeometry(60, 16, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  const sunGeo = new THREE.CircleGeometry(3, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

  const dayNightConfig = {
    speedMultiplier: 360,
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
        ambient: 0x404080,
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
      night: { ambient: 0.1, directional: 0.2, sun: 0.3 },
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
    const cestOffset = 2 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cestTime = new Date(utc + (cestOffset * 60000));
    return cestTime;
  }

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

  function lerpIntensity(intensity1, intensity2, factor) {
    return {
      ambient: intensity1.ambient + (intensity2.ambient - intensity1.ambient) * factor,
      directional: intensity1.directional + (intensity2.directional - intensity1.directional) * factor,
      sun: intensity1.sun + (intensity2.sun - intensity1.sun) * factor
    };
  }

  function getSunPosition(hours) {
    const sunAngle = ((hours - 6) / 12) * Math.PI;
    const sunHeight = Math.sin(sunAngle) * 20 + 5;
    const sunX = Math.cos(sunAngle) * 30;
    const sunZ = -40;

    return {
      x: sunX,
      y: Math.max(sunHeight, 2),
      z: sunZ
    };
  }

  function updateDayNightCycle() {
    const currentTime = getAcceleratedTime();
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;

    const realCEST = getCESTTime();
    timeDisplay.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">time</div>
      <div><span style="color: #ffff00;">CEST:</span> ${realCEST.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}</div>
      <div><span style="color: #ffff00;">in game:</span> ${currentTime.toLocaleTimeString('en-GB')}</div>
      <div style="color: #ffff00;""margin-top: 8px; color: #888; font-size: 10px;">${dayNightConfig.speedMultiplier}x speed bc i'm impatient while testing</div>
    `;
    let currentColors, currentIntensity, timeOfDay;

    if (hours >= 5 && hours < 7) {
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
      currentColors = dayNightConfig.colors.day;
      currentIntensity = dayNightConfig.intensity.day;
      timeOfDay = "Day";
    } else if (hours >= 18 && hours < 20) {
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
      currentColors = dayNightConfig.colors.night;
      currentIntensity = dayNightConfig.intensity.night;
      timeOfDay = "Night";
    }

    timeDisplay.innerHTML += `<div><span style="color: #ffff00;">Period:</span> ${timeOfDay}</div>`;

    if (currentScene === 'main') {
      skyMat.color.setHex(currentColors.sky);
      sunMat.color.setHex(currentColors.sun);
      const sunPos = getSunPosition(hours);
      sun.position.set(sunPos.x, sunPos.y, sunPos.z);
      ambLight.color.setHex(currentColors.ambient);
      ambLight.intensity = currentIntensity.ambient;
      dirLight.color.setHex(currentColors.directional);
      dirLight.intensity = currentIntensity.directional;
      sunMat.opacity = currentIntensity.sun;
      scene.fog.color.setHex(currentColors.fog);
      dirLight.position.set(sunPos.x * 0.5, sunPos.y + 5, sunPos.z * 0.5);
    }
  }

  const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
  grid.position.y = 0.01;
  scene.add(grid);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x3d4262, shininess: 10 })
  );
  floor.rotation.x = -Math.PI/2; 
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const mirrorGeometry = new THREE.PlaneGeometry(20, 6);
  const mirror = new Reflector(mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x889999
  });
  mirror.position.set(3, 1, -12);
  mirror.rotation.y = 0;
  scene.add(mirror);

  const mirrorBackMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    side: THREE.FrontSide
  });
  const mirrorBack = new THREE.Mesh(mirrorGeometry, mirrorBackMaterial);
  mirrorBack.position.z = -0.001;
  mirrorBack.rotation.y = Math.PI;
  mirror.add(mirrorBack);

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

  let worldBuilder;
  try {
    worldBuilder = new WorldBuilder(scene, camera, renderer);
    const requiredModels = await worldBuilder.autoLoadWorld();
  } catch (error) {
    console.error('failed to initialize World Builder:', error);
  }

  let inventorySystem;
  try {
    inventorySystem = new InventorySystem(scene, camera, portfolioAnalytics);
  } catch (error) {
    console.error('Failed to initialize Inventory System:', error);
  }

  let modelLoader;
  try {
    modelLoader = new ModelLoader(scene, loadingManager, worldBuilder);
    modelLoader.setTotalModelsCount(totalModelsToLoad);
    modelLoader.loadAllModels(scene, galleryScene, inventorySystem)
      .then(() => {
        updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
      })
      .catch(error => {
        updateLoadingProgress(totalModelsToLoad, totalModelsToLoad);
      });
  } catch (error) {
    console.error('Failed to initialize ModelLoader:', error);
  }
  
  try {
    eagleVision = new EagleVision(scene, galleryScene, renderer, modelLoader, portfolioAnalytics, camera);
  } catch (error) {
    console.error('Failed to initialize Eagle Vision:', error);
  }

  const gallerySky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color:0x2a1810, side:THREE.BackSide }));
  galleryScene.add(gallerySky);

  const galleryAmbLight = new THREE.AmbientLight(0xffffff, 0.3);
  galleryScene.add(galleryAmbLight);

  const gallerySpotLight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI/6, 0.1, 2);
  gallerySpotLight.position.set(0, 15, 0);
  gallerySpotLight.target.position.set(0, 0, 0);
  gallerySpotLight.castShadow = true;
  gallerySpotLight.shadow.mapSize.setScalar(512);
  galleryScene.add(gallerySpotLight);
  galleryScene.add(gallerySpotLight.target);

  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x1a1a1a, shininess: 30 })
  );
  galleryFloor.rotation.x = -Math.PI/2; 
  galleryFloor.position.y = 0;
  galleryFloor.receiveShadow = true;
  galleryScene.add(galleryFloor);

  const galleryGrid = new THREE.GridHelper(44, 22, 0x333333, 0x222222);
  galleryGrid.position.y = 0.01;
  galleryScene.add(galleryGrid);

  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const wallGeometry = new THREE.PlaneGeometry(30, 8);

  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -15);
  galleryScene.add(backWall);

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
    { pos: [10, 2, -14.5], color: 0x44ff44, shape: 'sphere', name: 'Green Sphere' },
    { pos: [-14.5, 2, -5], color: 0x4444ff, shape: 'cylinder', name: 'Blue Cylinder' },
    { pos: [14.5, 2, 5], color: 0xffff44, shape: 'cone', name: 'Yellow Cone' },
  ];

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
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = `#${art.color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(25, 25, 78, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(art.name, 64, 80);
    ctx.fillText('E to View', 64, 90);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    const previewMaterial = new THREE.MeshPhongMaterial({ map: texture });
    const preview = new THREE.Mesh(previewGeometry, previewMaterial);

    frame.position.copy(new THREE.Vector3(...art.pos));
    preview.position.copy(frame.position);
    preview.position.z += 0.02;

    if (art.pos[2] < 0) {
      frame.rotation.y = 0;
      preview.rotation.y = 0;
    } else if (art.pos[0] < 0) {
      frame.rotation.y = Math.PI/2;
      preview.rotation.y = Math.PI/2;
    } else {
      frame.rotation.y = -Math.PI/2;
      preview.rotation.y = -Math.PI/2;
    }
    galleryScene.add(frame);
    galleryScene.add(preview);
    galleryFrames.push(frame);

    const interactiveArea = new THREE.Mesh(interactiveGeometry, interactiveMaterial);
    interactiveArea.position.copy(preview.position);
    interactiveArea.rotation.copy(preview.rotation);
    interactiveArea.userData = { type: 'gallery-frame', artIndex: index, artName: art.shape };
    galleryScene.add(interactiveArea);
    interactiveAreas.push(interactiveArea);
  });

  const sharedGeometries = {
    cube: new THREE.BoxGeometry(4, 4, 4),
    sphere: new THREE.SphereGeometry(2.5, 24, 24),
    cylinder: new THREE.CylinderGeometry(2, 2, 6, 24),
    cone: new THREE.ConeGeometry(2.5, 6, 24)
  };

  function createModelViewerScene(art, scene) {
    const viewerSky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }));
    scene.add(viewerSky);

    const ambLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambLight);

    const spotLight1 = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/4, 0.1, 2);
    spotLight1.position.set(10, 10, 10);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.shadow.mapSize.setScalar(256);
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    const spotLight2 = new THREE.SpotLight(0x4444ff, 1, 50, Math.PI/4, 0.1, 2);
    spotLight2.position.set(-10, 5, -5);
    spotLight2.target.position.set(0, 0, 0);
    spotLight2.shadow.mapSize.setScalar(256);
    scene.add(spotLight2);
    scene.add(spotLight2.target);

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
    scene.userData = { rotatingMesh: mesh };
  }

  createModelViewerScene(artPieces[0], cubeViewerScene);
  createModelViewerScene(artPieces[1], sphereViewerScene);
  createModelViewerScene(artPieces[2], cylinderViewerScene);
  createModelViewerScene(artPieces[3], coneViewerScene);
  
  let characterSystem;
  let characterGroup;

  try {
    characterSystem = new CharacterSystem(scene, loadingManager, portfolioAnalytics);
    
    characterGroup = characterSystem.getCharacterGroup();
    
    characterSystem.loadCharacter().then(() => {
      characterSystemReady = true;
      checkAllSystemsReady();
    }).catch(error => {
      characterSystemReady = true;
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
    
    characterSystemReady = true;
    checkAllSystemsReady();
  }

  function updateLOD() {
    if (!gameStarted || !characterGroup) return;
    const characterPos = characterGroup.position;
    
    const HIGH_DETAIL_DISTANCE = 15;
    const MEDIUM_DETAIL_DISTANCE = 30;
    Object.values(modelLoader.models).forEach(model => {
      if (!model || !model.position) return;
      
      const distance = characterPos.distanceTo(model.position);
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

  const loader = new GLTFLoader(loadingManager);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);
  let returnPortalModel = null;
  const modelCache = new Map();

  function loadModelOptimized(url, callback, progressCallback, errorCallback) {
    if (modelCache.has(url)) {
      callback(modelCache.get(url));
      return;
    }

    loader.load(url, 
      function(gltf) {
        modelCache.set(url, gltf);
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
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

  function registerModelWithWorldBuilder(modelName, gltf) {
    if (worldBuilder) {
      worldBuilder.registerModel(modelName, {
        scene: gltf.scene.clone(),
        animations: gltf.animations || []
      });
    }
  }

  const ambLight = new THREE.AmbientLight(0xffffff, 0.4); 
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.7); 
  dirLight.position.set(10, 14, 4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.mapSize.setScalar(512);
  scene.add(dirLight);

  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  const MOUSE_SENSITIVITY = 0.002;

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement && gameStarted && !overlays.isPaperReadingMode()) {
      mouseX = e.movementX || 0;
      mouseY = e.movementY || 0;

      targetRotationY -= mouseX * MOUSE_SENSITIVITY;
      currentRotationX -= mouseY * MOUSE_SENSITIVITY;
      
      window.targetRotationY = targetRotationY;
      if (spectatorMode) {
        currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
      } else {
        currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
      }
    }
  });

  const keys = {};

  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    if (key === 'i') {
      e.preventDefault();
      e.stopPropagation();
      if (inventorySystem && gameStarted) {
        inventorySystem.toggleInventory();
        return;
      }
    }
    
    if (key === 'v' && !eagleVision?.isActive && gameStarted && !overlays.isPaperReadingMode() && 
      !(inventorySystem && inventorySystem.isOpen) && !spectatorMode) {
      eagleVision?.activate(currentScene);
    }
    
    if (key === 'q' && spectatorMode && currentScene.startsWith('model-')) {
      returnToGallery();
    }
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
  });

  let velocity = new THREE.Vector3();
  let moveSpeed = 5;
  const sprintSpeed = 7;
  const normalSpeed = 3;
  const spectatorSpeed = 15;

  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 8;
  const gravity = 20;

  const raycaster = new THREE.Raycaster();
  const portalDetectionDistance = 3;
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
    if (eagleVision) {
      eagleVision.forceDeactivate();
    }
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    scene.remove(characterGroup);
    galleryScene.add(characterGroup);
    characterGroup.position.set(0, 0, 10);
    updateControlsDisplay();
  }

  function switchToMain() {
    currentScene = 'main';
    activeScene = scene;
    spectatorMode = false;
    if (eagleVision) {
      eagleVision.forceDeactivate();
    }
    galleryScene.remove(characterGroup);
    scene.add(characterGroup);
    characterGroup.position.set(0, 0, 5);
    updateControlsDisplay();
  }

  function switchToModelViewer(artIndex) {
    if (eagleVision) {
      eagleVision.forceDeactivate();
    }
    spectatorMode = true;
    const sceneMap = {
      0: cubeViewerScene,
      1: sphereViewerScene, 
      2: cylinderViewerScene,
      3: coneViewerScene
    };

    currentScene = `model-${artIndex}`;
    activeScene = sceneMap[artIndex];
    galleryScene.remove(characterGroup);
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    targetRotationY = 0;
    currentRotationX = 0;
    updateControlsDisplay();
  }

  function returnToGallery() {
    if (eagleVision) {
      eagleVision.forceDeactivate();
    }
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    galleryScene.add(characterGroup);
    characterGroup.position.set(0, 0, 10);
    targetRotationY = 0;
    currentRotationX = 0;
    updateControlsDisplay();
  }
  window.camera = camera;

  function isObjectBehindMirror(object, camera) {
    const mirrorPosition = new THREE.Vector3(3, 1, -12);
    
    const objectPosition = new THREE.Vector3();
    object.getWorldPosition(objectPosition);
    const cameraPosition = camera.position.clone();
    
    const objectRelativeZ = objectPosition.z - mirrorPosition.z;
    const cameraRelativeZ = cameraPosition.z - mirrorPosition.z;
    
    const objectBehindMirror = objectRelativeZ < -0.5;
    const cameraInFrontOfMirror = cameraRelativeZ > 0.5;
    
        const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    const cameraToMirror = mirrorPosition.clone().sub(cameraPosition).normalize();
    const lookingAtMirror = cameraDirection.dot(cameraToMirror) > 0.5;
    
    const horizontalDistance = Math.sqrt(
      Math.pow(cameraPosition.x - mirrorPosition.x, 2) + 
      Math.pow(cameraPosition.y - mirrorPosition.y, 2)
    );
    const closeToMirror = horizontalDistance < 15;
    
    return objectBehindMirror && cameraInFrontOfMirror && lookingAtMirror && closeToMirror;
  }

  function checkPortalView() {
    if (!gameStarted || overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)) return;
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

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
      const portalModels = modelLoader.getPortalModels();
      portalModels.forEach(portalModel => {
        portalModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPortal = portalModel;
            allMeshes.portalMeshes.push(child);
          }
        });
      });

      if (modelLoader.models.paper) {
        modelLoader.models.paper.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPaper = modelLoader.models.paper;
            allMeshes.paperMeshes.push(child);
          }
        });
      }

      if (modelLoader.models.grave) {
        modelLoader.models.grave.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentTombstone = modelLoader.models.grave;
            allMeshes.tombstoneMeshes.push(child);
          }
        });
      }

      if (modelLoader.models.book2) {
        modelLoader.models.book2.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentBook = modelLoader.models.book2;
            allMeshes.bookMeshes.push(child);
          }
        });
      }

      if (modelLoader.models.scroll) {
        modelLoader.models.scroll.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentScroll = modelLoader.models.scroll;
            allMeshes.scrollMeshes.push(child);
          }
        });
      }

      if (modelLoader.models.key) {
        modelLoader.models.key.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentKey = modelLoader.models.key;
            allMeshes.keyMeshes.push(child);
          }
        });
      }

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
          
          if (key && !isObjectBehindMirror(key, camera)) {
            targetKey = key;
            keyDistance = distance;
          }
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
        
        if (door && !isObjectBehindMirror(door, camera)) {
          targetDoor = door;
          doorDistance = distance;
        }
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
        
        if (paper && !isObjectBehindMirror(paper, camera)) {
          targetPaper = paper;
          paperDistance = distance;
        }
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
    function checkCollision(currentPosition, newPosition) {
    if (currentScene !== 'main') return false;

    const characterRadius = 0.4;

    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;

      if (boxGeometry.type === 'CylinderGeometry') {
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

  function moveCharacter(dt) {
    if (!gameStarted || overlays.isPaperReadingMode() || (inventorySystem && inventorySystem.isOpen)) return;

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
      moveSpeed = keys['shift'] ? sprintSpeed : normalSpeed;

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

      const movementInput = {
        forward: !!(keys['w'] || keys['arrowup']),
        backward: !!(keys['s'] || keys['arrowdown']),
        left: !!(keys['a'] || keys['arrowleft']),
        right: !!(keys['d'] || keys['arrowright']),
        sprinting: !!keys['shift'],
        crouching: !!keys['b'], 
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
          portalInfoWindow.style.display = 'none';
          currentPortalInView = null;
        } else if (currentScene === 'gallery') {
          if (currentPortalInView.userData.type === 'return-portal') {
            switchToMain();
            portalInfoWindow.style.display = 'none';
            currentPortalInView = null;
          } else if (currentPortalInView.userData.type === 'gallery-frame') {
            switchToModelViewer(currentPortalInView.userData.artIndex);
            portalInfoWindow.style.display = 'none';
            currentPortalInView = null;
          }
        }
      }
    }
  }

  let currentCameraHeight = 1.8;
  const CAMERA_TRANSITION_SPEED = 4.0;

  function updateCamera() {
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
  }
    function updateUIVisibility() {
    const showUI = gameStarted && document.pointerLockElement && !overlays.isPaperReadingMode();
    crosshair.style.display = showUI ? 'block' : 'none';
    controlsDisplay.style.display = showUI ? 'block' : 'none';
    timeDisplay.style.display = showUI ? 'block' : 'none'; 
  }

  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && gameStarted && !overlays.isPaperReadingMode() && 
        !(inventorySystem && inventorySystem.isOpen) && !window.isStartingGame) {
      openOverlay('home');
      gameStarted = false;
      portalInfoWindow.style.display = 'none';
      paperInfoWindow.style.display = 'none';
      tombstoneInfoWindow.style.display = 'none';
      bookInfoWindow.style.display = 'none';
      scrollInfoWindow.style.display = 'none';
    } else if (document.pointerLockElement && window.isStartingGame) {
      window.isStartingGame = false;
    }
    
    updateUIVisibility();
  });

  let lastTime = performance.now();

  function animate() {
    let now = performance.now(), dt = (now-lastTime)/1000;
    lastTime = now;
    if (eagleVision) {
      eagleVision.update();
    }
    updateUIVisibility();
    updateDayNightCycle();
    updateLOD();

    modelLoader.update(dt);
    if (characterSystem) {
      characterSystem.update(dt);
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
};