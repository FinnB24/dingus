import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { WorldBuilder } from './worldBuilder.js';
import { InventorySystem } from './inventory.js';
import { ModelLoader } from './modelLoader.js';
import { InfoWindows } from './infoWindows.js';

const infoWindows = new InfoWindows();

let gameStarted = false;
let currentScene = 'main'; // Track  scene 
let spectatorMode = false; // Track if in spectator mode
let allModelsLoaded = false; // Track if all models are loaded
let paperReadingMode = false; // Track if currently reading paper

// Loading manager for better performance
const loadingManager = new THREE.LoadingManager();
let totalModelsToLoad = 11; // portal.glb, church.glb, grave.glb, altar.glb, paper.glb, crow.glb, desk.glb, book1.glb, book2.glb, scroll.glb, desk2.glb
let loadedModels = 0;

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

const paperOverlay = document.createElement('div');
paperOverlay.id = 'paper-overlay';
paperOverlay.style.cssText = `
  position: fixed;
  top: 100px;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 100%);
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.05) 0%, transparent 50%);
  z-index: 4000;
  display: none;
  overflow: hidden;
`;

const paperContainer = document.createElement('div');
paperContainer.style.cssText = `
  position: relative;
  max-width: 400px;
  height: 30%;
  margin: 0 auto;
  background: #f9f7f1;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 60px 80px 40px 80px;
  box-sizing: border-box;
`;

const closeButton = document.createElement('button');
closeButton.id = 'paper-close-btn';
closeButton.innerHTML = '✕';
closeButton.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(139, 69, 19, 0.8);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 4001;
  transition: all 0.3s ease;
`;

closeButton.addEventListener('mouseenter', () => {
  closeButton.style.background = 'rgba(139, 69, 19, 1)';
  closeButton.style.transform = 'scale(1.1)';
});

closeButton.addEventListener('mouseleave', () => {
  closeButton.style.background = 'rgba(139, 69, 19, 0.8)';
  closeButton.style.transform = 'scale(1)';
});

closeButton.addEventListener('click', closePaper);

const paperContent = document.createElement('div');
paperContent.style.cssText = `
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #2c1810;
  line-height: 1.8;
  font-size: 16px;
  text-align: justify;
`;

paperContent.innerHTML = `
  <h1 style="text-align: center; margin-bottom: 30px; color: #1a0e08; font-size: 28px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
    Fuck AI Art.
  </h1>
  
  <div style="height: 100px;"></div>
`;

paperContainer.appendChild(paperContent);
paperOverlay.appendChild(paperContainer);
paperOverlay.appendChild(closeButton);
document.body.appendChild(paperOverlay);

// Create tombstone reading overlay
const tombstoneOverlay = document.createElement('div');
tombstoneOverlay.id = 'tombstone-overlay';
tombstoneOverlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  background-image: 
    radial-gradient(circle at 30% 40%, rgba(64, 64, 64, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(32, 32, 32, 0.4) 0%, transparent 50%);
  z-index: 4000;
  display: none;
  overflow: hidden;
`;

const tombstoneContainer = document.createElement('div');
tombstoneContainer.style.cssText = `
  position: relative;
  max-width: 700px;
  height: 100%;
  margin: 0 auto;
  background: linear-gradient(145deg, #4a4a4a, #2d2d2d);
  box-shadow: 
    0 0 50px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  border: 3px solid #666;
  border-radius: 15px;
  overflow-y: auto;
  padding: 40px 60px;
  box-sizing: border-box;
  margin-top: 50px;
  margin-bottom: 50px;
  height: calc(100vh - 100px);
`;

const tombstoneCloseButton = document.createElement('button');
tombstoneCloseButton.id = 'tombstone-close-btn';
tombstoneCloseButton.innerHTML = '✕';
tombstoneCloseButton.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(64, 64, 64, 0.9);
  border: 2px solid #888;
  border-radius: 50%;
  color: #ccc;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 4001;
  transition: all 0.3s ease;
`;

tombstoneCloseButton.addEventListener('mouseenter', () => {
  tombstoneCloseButton.style.background = 'rgba(96, 96, 96, 1)';
  tombstoneCloseButton.style.transform = 'scale(1.1)';
  tombstoneCloseButton.style.color = '#fff';
});

tombstoneCloseButton.addEventListener('mouseleave', () => {
  tombstoneCloseButton.style.background = 'rgba(64, 64, 64, 0.9)';
  tombstoneCloseButton.style.transform = 'scale(1)';
  tombstoneCloseButton.style.color = '#ccc';
});

tombstoneCloseButton.addEventListener('click', closeTombstone);

const tombstoneContent = document.createElement('div');
tombstoneContent.style.cssText = `
  font-family: 'Courier New', monospace;
  color: #e0e0e0;
  line-height: 1.6;
  font-size: 14px;
  text-align: left;
`;

tombstoneContent.innerHTML = `
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #ccc; font-size: 24px; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
      about page oder so idk who-the-fuck-is-this-person-who-made-this-bs-here maybe in a less self deprecating way lol
    </h1>
  </div>
  
`;

tombstoneContainer.appendChild(tombstoneContent);
tombstoneOverlay.appendChild(tombstoneContainer);
tombstoneOverlay.appendChild(tombstoneCloseButton);
document.body.appendChild(tombstoneOverlay);

// Create book reading overlay
const bookOverlay = document.createElement('div');
bookOverlay.id = 'book-overlay';
bookOverlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2a1810 0%, #1a1008 100%);
  background-image: 
    radial-gradient(circle at 25% 30%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 70%, rgba(218, 165, 32, 0.05) 0%, transparent 50%);
  z-index: 4000;
  display: none;
  overflow: hidden;
`;

const bookContainer = document.createElement('div');
bookContainer.style.cssText = `
  position: relative;
  max-width: 750px;
  height: 100%;
  margin: 0 auto;
  background: linear-gradient(145deg, #3d2f1f, #2a1e10);
  box-shadow: 
    0 0 60px rgba(139, 69, 19, 0.4),
    inset 0 0 30px rgba(218, 165, 32, 0.1);
  border: 3px solid #8b4513;
  border-radius: 10px;
  overflow-y: auto;
  padding: 50px 70px;
  box-sizing: border-box;
  margin-top: 40px;
  margin-bottom: 40px;
  height: calc(100vh - 80px);
`;

const bookCloseButton = document.createElement('button');
bookCloseButton.id = 'book-close-btn';
bookCloseButton.innerHTML = '✕';
bookCloseButton.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(139, 69, 19, 0.9);
  border: 2px solid #d4af37;
  border-radius: 50%;
  color: #f4e4c1;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 4001;
  transition: all 0.3s ease;
`;

bookCloseButton.addEventListener('mouseenter', () => {
  bookCloseButton.style.background = 'rgba(139, 69, 19, 1)';
  bookCloseButton.style.transform = 'scale(1.1)';
  bookCloseButton.style.color = '#fff';
});

bookCloseButton.addEventListener('mouseleave', () => {
  bookCloseButton.style.background = 'rgba(139, 69, 19, 0.9)';
  bookCloseButton.style.transform = 'scale(1)';
  bookCloseButton.style.color = '#f4e4c1';
});

bookCloseButton.addEventListener('click', closeBook);

const bookContent = document.createElement('div');
bookContent.style.cssText = `
  font-family: 'Times New Roman', serif;
  color: #f4e4c1;
  line-height: 1.7;
  font-size: 15px;
  text-align: left;
`;

bookContent.innerHTML = `
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #d4af37; font-size: 26px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
      contact here. evtl socials auch wenn iwann mal aktiv
    </h1>
  </div>
`;

bookContainer.appendChild(bookContent);
bookOverlay.appendChild(bookContainer);
bookOverlay.appendChild(bookCloseButton);
document.body.appendChild(bookOverlay);

// Create scroll feedback overlay
const scrollOverlay = document.createElement('div');
scrollOverlay.id = 'scroll-overlay';
scrollOverlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2a1810 0%, #1a1008 100%);
  background-image: 
    radial-gradient(circle at 30% 40%, rgba(139, 69, 19, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(218, 165, 32, 0.08) 0%, transparent 50%);
  z-index: 4000;
  display: none;
  overflow: hidden;
`;

const scrollContainer = document.createElement('div');
scrollContainer.style.cssText = `
  position: relative;
  max-width: 600px;
  height: auto;
  margin: 50px auto;
  background: linear-gradient(145deg, #3d2f1f, #2a1e10);
  box-shadow: 
    0 0 60px rgba(139, 69, 19, 0.5),
    inset 0 0 30px rgba(218, 165, 32, 0.1);
  border: 3px solid #8b4513;
  border-radius: 15px;
  padding: 40px;
  box-sizing: border-box;
`;

const scrollCloseButton = document.createElement('button');
scrollCloseButton.id = 'scroll-close-btn';
scrollCloseButton.innerHTML = '✕';
scrollCloseButton.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(139, 69, 19, 0.9);
  border: 2px solid #d4af37;
  border-radius: 50%;
  color: #f4e4c1;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 4001;
  transition: all 0.3s ease;
`;

scrollCloseButton.addEventListener('mouseenter', () => {
  scrollCloseButton.style.background = 'rgba(139, 69, 19, 1)';
  scrollCloseButton.style.transform = 'scale(1.1)';
  scrollCloseButton.style.color = '#fff';
});

scrollCloseButton.addEventListener('mouseleave', () => {
  scrollCloseButton.style.background = 'rgba(139, 69, 19, 0.9)';
  scrollCloseButton.style.transform = 'scale(1)';
  scrollCloseButton.style.color = '#f4e4c1';
});

scrollCloseButton.addEventListener('click', closeScroll);

const scrollContent = document.createElement('div');
scrollContent.style.cssText = `
  font-family: 'Times New Roman', serif;
  color: #f4e4c1;
  line-height: 1.6;
  font-size: 16px;
`;

scrollContent.innerHTML = `
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #d4af37; font-size: 28px; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
      anonymus feedback
    </h2>
    <div style="color: #b8860b; font-style: italic;">finally works. fuck yeah</div>
  </div>
  
  <form id="feedback-form" action="https://formspree.io/f/xovwrear" method="POST">
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; color: #d4af37; font-weight: bold;">msg:</label>
      <textarea 
        name="message" 
        placeholder="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        style="width: 100%; height: 120px; padding: 15px; background: #1a1008; 
               color: #f4e4c1; border: 2px solid #8b4513; border-radius: 8px;
               font-family: 'Times New Roman', serif; resize: vertical; font-size: 15px;
               box-sizing: border-box;"
        required>    
      </textarea>
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; color: #d4af37; font-weight: bold;">name/sender (aka second column on frmsp. layout):</label>
      <input 
        type="text" 
        name="name" 
        placeholder="name"
        style="width: 100%; padding: 12px; background: #1a1008; 
               color: #f4e4c1; border: 2px solid #8b4513; border-radius: 8px;
               font-family: 'Times New Roman', serif; font-size: 15px;
               box-sizing: border-box;">
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button type="submit" id="submit-btn" style="background: linear-gradient(145deg, #8b4513, #6b3410); 
              color: #f4e4c1; padding: 15px 40px; border: none; border-radius: 8px; 
              font-family: 'Times New Roman', serif; font-size: 16px; font-weight: bold;
              cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
        yeet.
      </button>
    </div>
    
    <div id="form-status" style="margin-top: 20px; text-align: center; display: none;"></div>
  </form>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #8b4513; text-align: center;">
    <p style="color: #b8860b; font-style: italic; margin: 0; font-size: 14px;">
      " "
    </p>
  </div>
`;

scrollContainer.appendChild(scrollContent);
scrollOverlay.appendChild(scrollContainer);
scrollOverlay.appendChild(scrollCloseButton);
document.body.appendChild(scrollOverlay);

//submission handling
// Add a flag to prevent multiple setup calls
let formSubmissionSetup = false;

function setupFormSubmission() {
  const form = document.getElementById('feedback-form');
  const submitBtn = document.getElementById('submit-btn');
  const formStatus = document.getElementById('form-status');
  
  if (form) {
    // Check if event listener is already attached to THIS specific form
    if (form.dataset.submissionSetup === 'true') {
      console.log('Form submission already set up for this form, skipping...');
      return;
    }
    
    let isSubmitting = false; // Per-session flag to prevent rapid double-clicks
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Prevent rapid double-clicks (only during active submission)
      if (isSubmitting) {
        console.log('Form already submitting, ignoring duplicate submission');
        return;
      }
      
      // Get form data
      const formData = new FormData(form);
      const message = formData.get('message').trim();
      
      // Check if message empty
      if (!message || message.length < 3) {
        formStatus.innerHTML = `
          <div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); 
                      padding: 15px; border-radius: 8px; border: 1px solid #ff6b6b;">
             <strong>nu uh. write something.</strong><br>
            <small>at least 3 characters</small>
          </div>
        `;
        formStatus.style.display = 'block';
        return;
      }
      
      // Set submitting flag (temporary, only during request)
      isSubmitting = true;
      
      // Update button
      submitBtn.innerHTML = 'yeeting...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'not-allowed';
      
      // Hide previous status
      formStatus.style.display = 'none';
      
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          portfolioAnalytics.trackInteraction('feedback_form', 'submit_success', {
            messageLength: message.length,
            hasName: !!formData.get('name')
          });
          
          // Success
          formStatus.innerHTML = `
            <div style="color: #90ee90; background: rgba(144, 238, 144, 0.1); 
                        padding: 15px; border-radius: 8px; border: 1px solid #90ee90;">
              <strong>yeeted.</strong><br>
              <small> </small>
            </div>
          `;
          form.reset();
          
          // Auto-close scroll after submission
          setTimeout(() => {
            closeScroll();
          }, 3000);
          
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        formStatus.innerHTML = `
          <div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); 
                      padding: 15px; border-radius: 8px; border: 1px solid #ff6b6b;">
            <strong> didnt work</strong><br>
            <small> try again</small>
          </div>
        `;
      } finally {
        // Reset submitting flag (allows user to submit again after this request completes)
        isSubmitting = false;
        submitBtn.innerHTML = 'yeet.';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        formStatus.style.display = 'block';
      }
    });
    
    // Mark this specific form as having event listener attached
    form.dataset.submissionSetup = 'true';
    console.log('Form submission handler attached');
  }
}

function closePaper() {
  paperOverlay.style.display = 'none';
  paperReadingMode = false;
  
  // Re-enable pointer lock
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeTombstone() {
  tombstoneOverlay.style.display = 'none';
  paperReadingMode = false; 
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeBook() {
  bookOverlay.style.display = 'none';
  paperReadingMode = false;
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeScroll() {
  scrollOverlay.style.display = 'none';
  paperReadingMode = false;
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

// Hide all overlays
function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.style.display = 'none';
  });
}

//home overlay after loading complete
function showHomeOverlay() {
  const homeOverlay = document.getElementById('overlay-home');
  if (homeOverlay) {
    homeOverlay.style.display = 'block';
    homeOverlay.classList.add('visible');
  }
}

// loading
function updateLoadingProgress(loaded, total) {
  const percentage = Math.round((loaded / total) * 100);
  const progressText = document.getElementById('loading-progress');
  const progressBar = document.getElementById('progress-bar');
  
  if (progressText) progressText.textContent = `Loading models... ${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
  
  if (loaded >= total) {
    if (progressText) progressText.textContent = 'completed';
    
    setTimeout(() => {
      loadingDisplay.style.display = 'none';
      allModelsLoaded = true;
      showHomeOverlay();
      setupFormSubmission();
      console.log('All models loaded - showing home overlay');
      
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
  console.log('All models loaded successfully!');
  updateLoadingProgress(100, 100);
};

window.closeOverlay = function(name) {
  const overlay = document.getElementById('overlay-'+name);
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
    
    
    if (name === 'home' && allModelsLoaded) {
      gameStarted = true;
      const container = document.getElementById('three-canvas');
      if (container && !document.pointerLockElement) {
        container.requestPointerLock();
      }
    }
  }};

window.openOverlay = function(name) {
  if (!allModelsLoaded) return;
  
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  const targetOverlay = document.getElementById('overlay-'+name);
  if (targetOverlay) {
    targetOverlay.style.display = 'block';
    targetOverlay.classList.add('visible');
  }
  
  //Stop game when opening overlay
  if (name === 'home') {
    gameStarted = false;
  }
};
hideAllOverlays();

try {
  //3D Scene Setup
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');

  const scene = new THREE.Scene();
  const galleryScene = new THREE.Scene(); // 3D Art Gallery ONLY gallery
  
  //Individual model viewer scenes
  const cubeViewerScene = new THREE.Scene();
  const sphereViewerScene = new THREE.Scene();
  const cylinderViewerScene = new THREE.Scene();
  const coneViewerScene = new THREE.Scene();
  
  let activeScene = scene; //ttrack scene currently active
  
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
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

  // crosshair
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

  //controls display
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
        <div><span style="color: #ffff00;">ESC</span> - Menu</div>
        <div><span style="color: #ffff00;">E</span> - interact with stuff</div>
      `;
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

  // Create paper info window
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

  // Create tombstone info window
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

  // Create book info window
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

  // Create scroll info window
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

  
  //main scenee =======================================
  
  // sky 
  const skyGeo = new THREE.SphereGeometry(60, 16, 16); //rreduced segments
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  //Sun
  const sunGeo = new THREE.CircleGeometry(3, 16); // Reduced segments
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

// day/night cycl =======================================
  
  //config
  const dayNightConfig = {
    speedMultiplier: 360, //Real time 60 for fast cycle
    transitionDuration: 0.3, // smooth transitions (0-1)
    
    //Time periods
    sunrise: 6,
    sunset: 20,
    
    // Color config
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
        sun: 0x4a4a6a, // Moon
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
    
  //Light intensity
    intensity: {
      day: { ambient: 0.4, directional: 0.7, sun: 0.8 },
      night: { ambient: 0.1, directional: 0.2, sun: 0.3 },
      sunset: { ambient: 0.25, directional: 0.4, sun: 0.6 },
      sunrise: { ambient: 0.3, directional: 0.5, sun: 0.7 }
    }
  };

  //fog
  scene.fog = new THREE.Fog(dayNightConfig.colors.day.fog, 30, 80);

  //time display
  const timeDisplay = document.createElement('div');
  timeDisplay.id = 'time-display';
  timeDisplay.style.cssText = `
    position: fixed;
    top: 170px;
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

  //get CEST time
  function getCESTTime() {
    const now = new Date();
    
    //Convert
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

  //interpolate between colors
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

  ////interpolate between intensity values
  function lerpIntensity(intensity1, intensity2, factor) {
    return {
      ambient: intensity1.ambient + (intensity2.ambient - intensity1.ambient) * factor,
      directional: intensity1.directional + (intensity2.directional - intensity1.directional) * factor,
      sun: intensity1.sun + (intensity2.sun - intensity1.sun) * factor
    };
  }

  //get sun/moon position based on time
  function getSunPosition(hours) {
    // Sun moves in arc  east to west
    const sunAngle = ((hours - 6) / 12) * Math.PI; //6 AM to 6 PM = 0 to PI
    const sunHeight = Math.sin(sunAngle) * 20 + 5; //Height varies 5 to 25
    const sunX = Math.cos(sunAngle) * 30; // Xposition var
    const sunZ = -40; //Z constant
    
    return {
      x: sunX,
      y: Math.max(sunHeight, 2), //Don't go below horizon
      z: sunZ
    };
  }

  //update day/night cycle
  function updateDayNightCycle() {
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
    
    //Update time of day in display
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
      
      //fog
      scene.fog.color.setHex(currentColors.fog);
      
      // Pos directional light follow sun
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

  //Initialize World Builder
  let worldBuilder;
  try {
    worldBuilder = new WorldBuilder(scene, camera, renderer);
    console.log(' World Builder system initialized');
    
    // Start auto-loading
    const requiredModels = await worldBuilder.autoLoadWorld();
    if (requiredModels.length > 0) {
      console.log('Will auto-load world when models are ready:', requiredModels);
    }
    
  } catch (error) {
    console.error('failed to initialize World Builder:', error);
  }


  // Initialize Inventory System
let inventorySystem;
try {
  inventorySystem = new InventorySystem(scene, camera, portfolioAnalytics);
  console.log('Inventory System initialized');
} catch (error) {
  console.error('Failed to initialize Inventory System:', error);
}

// Initialize ModelLoader
let modelLoader;
try {
  modelLoader = new ModelLoader(scene, loadingManager, worldBuilder);
  modelLoader.setTotalModelsCount(totalModelsToLoad);
  
  // Load all models
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
  // 3d galleyy scene=======================================
  
  //sky
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

  // Art data
  const artPieces = [
    { pos: [-10, 2, -14.5], color: 0xff4444, shape: 'cube', name: 'Red Cube' },
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
    canvas.width = 128; //  256
    canvas.height = 96;  //  192
    const ctx = canvas.getContext('2d');
    
    //simple preview representation
    ctx.fillStyle = `#${art.color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(25, 25, 78, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial'; // Reduced font size
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
    
    //invisible interactive area
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
    sphere: new THREE.SphereGeometry(2.5, 24, 24), // Red segments
    cylinder: new THREE.CylinderGeometry(2, 2, 6, 24), // Red segmts
    cone: new THREE.ConeGeometry(2.5, 6, 24) // Red seg
  };
  
  function createModelViewerScene(art, scene) {
    // Dark space environment
    const viewerSky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }));
    scene.add(viewerSky);
    
    //lighting
    const ambLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambLight);
    
    const spotLight1 = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/4, 0.1, 2);
    spotLight1.position.set(10, 10, 10);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.shadow.mapSize.setScalar(256); // Red shadow map
    scene.add(spotLight1);
    scene.add(spotLight1.target);
    
    const spotLight2 = new THREE.SpotLight(0x4444ff, 1, 50, Math.PI/4, 0.1, 2);
    spotLight2.position.set(-10, 5, -5);
    spotLight2.target.position.set(0, 0, 0);
    spotLight2.shadow.mapSize.setScalar(256); // shadow
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    
    //shared geometry
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
    
    //rotation animation
    scene.userData = { rotatingMesh: mesh };
  }

  //all model viewer scenes
  createModelViewerScene(artPieces[0], cubeViewerScene);
  createModelViewerScene(artPieces[1], sphereViewerScene);
  createModelViewerScene(artPieces[2], cylinderViewerScene);
  createModelViewerScene(artPieces[3], coneViewerScene);

  //Character
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
    new THREE.SphereGeometry(0.25, 12, 12),
    new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 60 })
  );
  characterHead.position.set(0, 1.9, 0);
  characterHead.castShadow = true;
  characterGroup.add(characterHead);

  characterGroup.position.set(0, 0, 5);
  scene.add(characterGroup); // Character added to main scene initially

  //Collision detection
  const collisionBoxes = [];


  //colision boxes =======================================
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

  //purple wireframe
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


  //model load==================================
  
  //optimized loaders
  const loader = new GLTFLoader(loadingManager);
  
  //DRACO compression support smaller files -> sollte mit church model testen
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  let returnPortalModel = null;

  //model loading w caching
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
        
        //ptimize loaded model
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // materials
            if (node.material) {
              node.material.needsUpdate = false;
              // Disable unnecessary features
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

  // Mouse only work when game started and pointerlocked
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement && gameStarted && !paperReadingMode) {
      mouseX = e.movementX || 0;
      mouseY = e.movementY || 0;
      
      targetRotationY -= mouseX * MOUSE_SENSITIVITY;
      currentRotationX -= mouseY * MOUSE_SENSITIVITY;
      
      //Limit vert rotation
      if (spectatorMode) {
        currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
      } else {
        currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
      }
    }
  });

  const keys = {};

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

  // Jump
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 8;
  const gravity = 20;

  // Portal/interactive object var
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

  // Scene switching
  function switchToGallery() {
    
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    ///Move character to gallery
    scene.remove(characterGroup);
    galleryScene.add(characterGroup);
    
    //Reset character pos
    characterGroup.position.set(0, 0, 10);
    
    updateControlsDisplay();
    console.log('Switched to 3D gallery scene');
  }

  function switchToMain() {
    
    currentScene = 'main';
    activeScene = scene;
    spectatorMode = false;
    
    // character back to main 
    galleryScene.remove(characterGroup);
    scene.add(characterGroup);
    
    // Reset pos
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
    
    //spectator mode
    galleryScene.remove(characterGroup);
    
    //Pos cam
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    
    // Reset cam rot
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log(`Switched to model viewer for ${artPieces[artIndex].name}`);
  }

  function returnToGallery() {
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    //character back to gallery
    galleryScene.add(characterGroup);
    characterGroup.position.set(0, 0, 10);
    
    // Reset camera rot
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log('Returned to gallery from model viewer');
  }

  function openPaper() {
    
    paperReadingMode = true;
    paperOverlay.style.display = 'block';
    
    //Ext pointer lock allow mouse scrolling
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    //hhide info windows
    portalInfoWindow.style.display = 'none';
    paperInfoWindow.style.display = 'none';
    tombstoneInfoWindow.style.display = 'none';
    bookInfoWindow.style.display = 'none';
    scrollInfoWindow.style.display = 'none';
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
  }

  function openTombstone() {
    
    paperReadingMode = true; 
    tombstoneOverlay.style.display = 'block';
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    portalInfoWindow.style.display = 'none';
    paperInfoWindow.style.display = 'none';
    tombstoneInfoWindow.style.display = 'none';
    bookInfoWindow.style.display = 'none';
    scrollInfoWindow.style.display = 'none';
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
  }

  function openBook() {
    
    paperReadingMode = true; 
    bookOverlay.style.display = 'block';
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    portalInfoWindow.style.display = 'none';
    paperInfoWindow.style.display = 'none';
    tombstoneInfoWindow.style.display = 'none';
    bookInfoWindow.style.display = 'none';
    scrollInfoWindow.style.display = 'none';
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
  }

  function openScroll() {
    
    paperReadingMode = true;
    scrollOverlay.style.display = 'block';
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    portalInfoWindow.style.display = 'none';
    paperInfoWindow.style.display = 'none';
    tombstoneInfoWindow.style.display = 'none';
    bookInfoWindow.style.display = 'none';
    scrollInfoWindow.style.display = 'none';
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
  }

 function checkPortalView() {
  if (!gameStarted || paperReadingMode || (inventorySystem && inventorySystem.isOpen)) return;

  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  raycaster.setFromCamera(cameraDirection, camera);

  // Get all interactive meshes
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
    // Get portal meshes
    const portalModels = modelLoader.getPortalModels();
    portalModels.forEach(portalModel => {
      portalModel.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPortal = portalModel;
          allMeshes.portalMeshes.push(child);
        }
      });
    });
    
    // Get paper meshes
    if (modelLoader.models.paper) {
      modelLoader.models.paper.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentPaper = modelLoader.models.paper;
          allMeshes.paperMeshes.push(child);
        }
      });
    }

    // Get tombstone meshes
    if (modelLoader.models.grave) {
      modelLoader.models.grave.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentTombstone = modelLoader.models.grave;
          allMeshes.tombstoneMeshes.push(child);
        }
      });
    }

    // Get book meshes
    if (modelLoader.models.book2) {
      modelLoader.models.book2.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentBook = modelLoader.models.book2;
          allMeshes.bookMeshes.push(child);
        }
      });
    }

    // Get scroll meshes
    if (modelLoader.models.scroll) {
      modelLoader.models.scroll.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentScroll = modelLoader.models.scroll;
          allMeshes.scrollMeshes.push(child);
        }
      });
    }

    // Get key meshes
    if (modelLoader.models.key && inventorySystem) {
      modelLoader.models.key.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentKey = modelLoader.models.key;
          allMeshes.keyMeshes.push(child);
        }
      });
    }

    // Get door meshes
    if (modelLoader.models.door && inventorySystem) {
      modelLoader.models.door.traverse((child) => {
        if (child.isMesh) {
          child.userData.parentDoor = modelLoader.models.door;
          allMeshes.doorMeshes.push(child);
        }
      });
    }
  } else if (currentScene === 'gallery') {
    // Get return portal and gallery frames for gallery
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
    
    // Add interactive gallery frames
    allMeshes.portalMeshes.push(...interactiveAreas);
  }

  // Check for interactions in priority order
  
  // 1. Check for key interaction
  const keyIntersects = raycaster.intersectObjects(allMeshes.keyMeshes);
  let targetKey = null;
  let keyDistance = Infinity;

  for (const intersect of keyIntersects) {
    const distance = intersect.distance;
    if (distance <= 3 && distance < keyDistance) {
      targetKey = intersect.object.userData.parentKey;
      keyDistance = distance;
    }
  }

  if (targetKey && targetKey.userData.collectible) {
    infoWindows.showKeyInfo(targetKey);
    window.currentKeyInView = targetKey;
    return;
  }

  // 2. Check for door interaction
  const doorIntersects = raycaster.intersectObjects(allMeshes.doorMeshes);
  let targetDoor = null;
  let doorDistance = Infinity;

  for (const intersect of doorIntersects) {
    const distance = intersect.distance;
    if (distance <= 3 && distance < doorDistance) {
      targetDoor = intersect.object.userData.parentDoor;
      doorDistance = distance;
    }
  }

  if (targetDoor && inventorySystem) {
    const hint = inventorySystem.getInteractionHint(targetDoor);
    if (hint) {
      infoWindows.showDoorInfo(targetDoor, hint);
      window.currentDoorInView = targetDoor;
      return;
    }
  }

  // If no key or door interaction, hide those windows
  if (infoWindows.windows.key) infoWindows.windows.key.style.display = 'none';
  if (infoWindows.windows.door) infoWindows.windows.door.style.display = 'none';
  window.currentKeyInView = null;
  window.currentDoorInView = null;

  // 3. Check for paper
  const paperIntersects = raycaster.intersectObjects(allMeshes.paperMeshes);
  let targetPaper = null;
  let paperDistance = Infinity;

  for (const intersect of paperIntersects) {
    const distance = intersect.distance;
    if (distance <= paperDetectionDistance && distance < paperDistance) {
      targetPaper = intersect.object.userData.parentPaper;
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
    return;
  }

  // 4. Check for scroll
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
    return; 
  }

  // 5. Check for book
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
    return;
  }

  // 6. Check for tombstone
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
    return;
  }

  // 7. Check for portal
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
  } else {
    // If no interactions were found, hide all info windows
    infoWindows.hideAllWindows();
    currentPaperInView = null;
    currentPortalInView = null;
    currentTombstoneInView = null;
    currentBookInView = null;
    currentScrollInView = null;
  }
}

  // collision detection main scene
  function checkCollision(currentPosition, newPosition) {
    if (currentScene !== 'main') return false; //no collisions in gallery spectator 
    
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
        
        //horizontal distance for both current n new positions
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

  //get ground level at a specific position
  function getGroundLevel(position) {
    if (currentScene !== 'main') return 0; //Gallery flat ground
    
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
    if (!gameStarted || paperReadingMode || (inventorySystem && inventorySystem.isOpen)) return;
  
    if (spectatorMode) {
      // Spect mode movement
      const spectatorMoveSpeed = spectatorSpeed;
      
      //movement directs
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
    
    //Normal character movement
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    
    velocity.x = 0;
    velocity.z = 0;
    
    moveSpeed = keys['shift'] ? sprintSpeed : normalSpeed;
    
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
    
    // Xdirection
    const testPositionX = characterGroup.position.clone();
    testPositionX.x += desiredVelocity.x;
    if (!checkCollision(characterGroup.position, testPositionX)) {
      characterGroup.position.x = testPositionX.x;
    }
    
    // Zdirection
    const testPositionZ = characterGroup.position.clone();
    testPositionZ.z += desiredVelocity.z;
    if (!checkCollision(characterGroup.position, testPositionZ)) {
      characterGroup.position.z = testPositionZ.z;
    }
    
    // Jump
    if (keys[' '] && !isJumping) {
      isJumping = true;
      jumpVelocity = jumpForce;
    }
    
    // Interactive object activation
    if (keys['e']) {
      if (window.currentKeyInView && inventorySystem) {
    const keyData = window.currentKeyInView.userData.itemData;
    if (inventorySystem.addItem(keyData)) {
      scene.remove(window.currentKeyInView);
      window.currentKeyInView = null;
      document.querySelectorAll('#key-info-temp').forEach(el => el.remove());
    }
  }
  // Door interaction
  else if (window.currentDoorInView && inventorySystem) {
    if (inventorySystem.useItemOn(window.currentDoorInView)) {
      document.querySelectorAll('#door-info-temp').forEach(el => el.remove());
      window.currentDoorInView = null;
    }
  }
      if (currentPaperInView) {
        openPaper();
      } else if (currentScrollInView) {
        openScroll();
      } else if (currentBookInView) {
        openBook();
      } else if (currentTombstoneInView) {
        openTombstone();
      } else if (currentPortalInView) {
        if (currentScene === 'main' && currentPortalInView.userData.teleport) {
          // Switch to gallery
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
    
    //gravity update vert pos
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
    
    //Clamp pos to boundaries
    characterGroup.position.x = Math.max(Math.min(characterGroup.position.x, 23), -23);
    characterGroup.position.z = Math.max(Math.min(characterGroup.position.z, 23), -18);
    
    characterGroup.rotation.y = targetRotationY;
  }

  function updateCamera() {
    if (spectatorMode) {
      camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
    } else {
      const eyeHeight = 1.8;
      camera.position.copy(characterGroup.position);
      camera.position.y += eyeHeight;
      camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
    }
  }

  function updateUIVisibility() {
    const showUI = gameStarted && document.pointerLockElement && !paperReadingMode;
    crosshair.style.display = showUI ? 'block' : 'none';
    controlsDisplay.style.display = showUI ? 'block' : 'none';
    timeDisplay.style.display = showUI ? 'block' : 'none'; 
  }

  // Pointer lock exit 
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && gameStarted && !paperReadingMode) {
      // Show home overlay when exiting pointer lock
      openOverlay('home');
      gameStarted = false;
      portalInfoWindow.style.display = 'none';
      paperInfoWindow.style.display = 'none';
      tombstoneInfoWindow.style.display = 'none';
      bookInfoWindow.style.display = 'none';
      scrollInfoWindow.style.display = 'none';
    }
    updateUIVisibility();
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameStarted && document.pointerLockElement && !paperReadingMode) {
      document.exitPointerLock();
    }
    
    // Only allow Enter/Space to start if models are loaded
    if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ') && allModelsLoaded) {
      closeOverlay('home');
    }
  });

  let lastTime = performance.now();
  
  function animate() {
  let now = performance.now(), dt = (now-lastTime)/1000;
  lastTime = now;
  
  updateUIVisibility();
  updateDayNightCycle();
  
  // Model animation updates (including crow) are now handled by modelLoader
  modelLoader.update(dt);
  
  if(gameStarted && !document.getElementById('overlay-home').classList.contains('visible') && !paperReadingMode) {
    moveCharacter(dt);
    checkPortalView();
  }
  
  // Rotate models in viewer
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

//Debug
window.debugWorldBuilder = function() {
  if (worldBuilder) {
    worldBuilder.debugWorldState();
  } else {
    console.log('World Builder not initialized');
  }
};

// Error Handling
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
    
    //Keep last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    
    localStorage.setItem('portfolio_errors', JSON.stringify(this.errors));
    
    // msg
    this.showErrorToUser(type, details);
  }
  
  showErrorToUser(type, details) {
    if (type === 'model_load_failed') {
      console.warn('Some 3D models failed to load. Experience may be limited.');
    }
  }
  
  //Export debug
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
