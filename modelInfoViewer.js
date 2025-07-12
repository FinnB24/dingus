import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class ModelInfoViewer {
  constructor(portfolioAnalytics = null, gameStartedCallback = null) {
  this.portfolioAnalytics = portfolioAnalytics || {
    trackInteraction: () => {}
  };
  
  this.gameStarted = gameStartedCallback || (() => window.gameStarted || false);
    this.gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    this.modelUrlMap = {
      'church': './church.glb',
      'grave': './grave.glb',
      'altar': './altar.glb',
      'paper': './paper.glb',
      'key': './key.glb',
      'door': './door.glb',
      'crow': './crow.glb',
      'desk': './desk.glb',
      'desk2': './desk2.glb',
      'book1': './book1.glb',
      'book2': './book2.glb',
      'scroll': './scroll.glb',
      'portal': './portal.glb'
    };
    
    this.modelInfoMap = {
      'church': {
        name: 'Ruined church',
        description: 'yappping.'
      },
      'grave': {
        name: 'Tombstone',
        description: 'he died of cringe idk.'
      },
      'altar': {
        name: 'Stone Table',
        description: 'idk why i put it in the scene in the first place tbh.'
      },
      'paper': {
        name: 'Paper',
        description: 'paper.'
      },
      'scroll': {
        name: 'Text Scroll',
        description: 'has text on it. maybe.'
      },
      'book2': {
        name: 'Book',
        description: 'contact info maybe'
      },
      'key': {
        name: 'Key',
        description: 'forgot to put textures/materials on it'
      },
      'door': {
        name: 'Door',
        description: 'noticed doorframe is incomplete.'
      },
      'crow': {
        name: 'Crow',
        description: 'messenger.'
      },
      'desk': {
        name: 'Desk',
        description: '╯°□°)╯︵ ┻━┻'
      },
      'desk2': {
        name: 'another desk',
        description: 'idk why but this one is very buggy.'
      },
      'book1': {
        name: 'Books & papers',
        description: 'a more organised version of my actual desk.'
      },
      'portal': {
        name: 'Portal',
        description: 'might actually replace with nether portal'
      }
    };
    
    this.infoOverlay = null;
    this.viewerContainer = null;
    this.loadingIndicator = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = null;
    this.currentModelName = null;
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);
    this.isActive = false;
    this.isLoading = false;
    this.createOverlay();
    this.setupViewer();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.closeViewer();
      }
    });
  }
  
  createOverlay() {
  this.infoOverlay = document.createElement('div');
  this.infoOverlay.id = 'model-info-overlay';
  this.infoOverlay.style.cssText = `
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

  const contentContainer = document.createElement('div');
  
  const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

 if (isMobile) {
  contentContainer.style.cssText = `
    position: relative;
    width: 95%;
    height: 95%;
    margin: 10px auto;
    display: flex;
    flex-direction: row;
  `;
}
else {
    contentContainer.style.cssText = `
      position: relative;
      max-width: 1600px;
      width: 95%;
      height: 95%;
      margin: 15px auto;
      display: flex;
      flex-direction: row;
    `;
  }
  
  const infoPanel = document.createElement('div');
  
  if (isMobile) {
  infoPanel.style.cssText = `
    flex: 2;
    background: linear-gradient(145deg, #3d2f1f, #2a1e10);
    box-shadow: 0 0 30px rgba(139, 69, 19, 0.5), inset 0 0 15px rgba(218, 165, 32, 0.1);
    border: 2px solid #8b4513;
    border-radius: 10px 0 0 10px;
    padding: 15px 25px; 
    color: #f4e4c1;
    font-family: 'Times New Roman', serif;
    overflow-y: auto;
    min-height: 0;
  `;
 } else {
    infoPanel.style.cssText = `
      flex: 2;
      background: linear-gradient(145deg, #3d2f1f, #2a1e10);
      box-shadow: 0 0 60px rgba(139, 69, 19, 0.5), inset 0 0 30px rgba(218, 165, 32, 0.1);
      border: 3px solid #8b4513;
      border-radius: 15px 0 0 15px;
      padding: 40px;
      color: #f4e4c1;
      font-family: 'Times New Roman', serif;
      overflow-y: auto;
    `;
  }
  
  this.viewerContainer = document.createElement('div');
  
  if (isMobile) {
  this.viewerContainer.style.cssText = `
    flex: 3;
    background: #1a1a1a;
    border: 2px solid #8b4513;
    border-left: none;
    border-radius: 0 10px 10px 0;
    position: relative;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  `;
} else {
    this.viewerContainer.style.cssText = `
    flex: 3;  
      background: #1a1a1a;
      border: 3px solid #8b4513;
      border-left: none;
      border-radius: 0 15px 15px 0;
      position: relative;
    `;
  }

  const infoContent = document.createElement('div');
  infoContent.id = 'model-info-content';
  
  if (isMobile) {
    infoContent.style.cssText = `
      line-height: 1.6;
      font-size: 10px;
    `;
  } else {
    infoContent.style.cssText = `
      line-height: 1.8;
      font-size: 18px;
    `;
  }
  
  infoContent.innerHTML = `
    <div id="model-info-text">Loading model information...</div>
  `;
  infoPanel.appendChild(infoContent);
  
  this.loadingIndicator = document.createElement('div');
  this.loadingIndicator.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: #d4af37;
    padding: ${isMobile ? '15px 30px' : '25px 50px'};
    border-radius: 15px;
    font-family: 'Courier New', monospace;
    font-size: ${isMobile ? '14px' : '18px'};
    z-index: 10;
    display: none;
  `;
  this.loadingIndicator.textContent = 'Loading model...';
  this.viewerContainer.appendChild(this.loadingIndicator);
  
  const closeButton = document.createElement('button');
  closeButton.id = 'model-viewer-close-btn';
  closeButton.innerHTML = '✕';
  
  if (isMobile) {
    closeButton.style.cssText = `
      position: fixed;
      top: 15px;
      right: 15px;
      width: 40px;
      height: 40px;
      background: rgba(139, 69, 19, 0.9);
      border: 2px solid #d4af37;
      border-radius: 50%;
      color: #f4e4c1;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      z-index: 4001;
      transition: all 0.3s ease;
    `;
  } else {
    closeButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: rgba(139, 69, 19, 0.9);
      border: 2px solid #d4af37;
      border-radius: 50%;
      color: #f4e4c1;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      z-index: 4001;
      transition: all 0.3s ease;
    `;
  }

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(139, 69, 19, 1)';
    closeButton.style.transform = 'scale(1.1)';
    closeButton.style.color = '#fff';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(139, 69, 19, 0.9)';
    closeButton.style.transform = 'scale(1)';
    closeButton.style.color = '#f4e4c1';
  });

  closeButton.addEventListener('click', () => {
    this.closeViewer();
  });

  closeButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.closeViewer();
  });
  
const instructions = document.createElement('div');
instructions.style.cssText = `
  position: absolute;
  bottom: ${isMobile ? '10px' : '20px'};
  left: 0;
  width: 100%;
  text-align: center;
  color: #d4af37;
  font-size: ${isMobile ? '12px' : '16px'};
  font-family: 'Courier New', monospace;
  pointer-events: none;
`;

if (isMobile) {
  instructions.innerHTML = `Drag=rotate | Two fingers=Move | Pinch=Zoom`;
} else {
  instructions.innerHTML = `Click+Drag=rotate | Shift+Drag=move | Scroll=zoom`;
}
  
  this.viewerContainer.appendChild(instructions);
  
  contentContainer.appendChild(infoPanel);
  contentContainer.appendChild(this.viewerContainer);
  this.infoOverlay.appendChild(contentContainer);
  this.infoOverlay.appendChild(closeButton);
  document.body.appendChild(this.infoOverlay);
}

updateModelInfo(modelInfo) {
  const infoText = document.getElementById('model-info-text');
  if (!infoText) return;
  
  const hasGalleryVersion = this.hasGalleryEquivalent(this.currentModelName);
  const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const titleSize = isMobile ? '16px' : '28px';
  const subSize = isMobile ? '14px' : '20px';
  const textSize = isMobile ? '12px' : '16px';
  
  infoText.innerHTML = `
    <h3 style="color: #d4af37; margin-bottom: 15px; font-size: ${titleSize};">${modelInfo.name}</h3>
    <p style="margin-bottom: 20px; line-height: 1.6;"><strong style="font-size: ${subSize};">Description:</strong> ${modelInfo.description}</p>
    <br>
    ${hasGalleryVersion ? `
    <div">
      <p style="margin-bottom: 10px; font-size: ${textSize};"> Model is also available 3D Gallery for closer inspection. 
      <button id="mark-in-gallery-btn" style="
        background: linear-gradient(145deg, #8b4513, #6b3410);
        color: #f4e4c1;
        padding: ${isMobile ? '5px 10px' : '10px 15px'};
        border: none;
        border-radius: 2px;
        font-family: 'Times New Roman', serif;
        font-size: ${textSize};
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">Set Marker</button></p>
    </div>
    ` : ''}
  `;
  
  if (hasGalleryVersion) {
    const galleryBtn = document.getElementById('mark-in-gallery-btn');
    if (galleryBtn) {
      galleryBtn.addEventListener('mouseenter', () => {
        galleryBtn.style.background = 'linear-gradient(145deg, #a0541a, #7d3f12)';
        galleryBtn.style.transform = 'translateY(-2px)';
      });
      
      galleryBtn.addEventListener('mouseleave', () => {
        galleryBtn.style.background = 'linear-gradient(145deg, #8b4513, #6b3410)';
        galleryBtn.style.transform = 'translateY(0)';
      });
      
      galleryBtn.addEventListener('click', () => {
        this.markGalleryPath();
      });
    }
  }
}

hasGalleryEquivalent(modelName) {
  const galleryModels = {
    'cube': 'cube',
    'sphere': 'sphere', 
    'cylinder': 'cylinder',
    'cone': 'cone',
    'church': 'church'
  };
  
  return galleryModels.hasOwnProperty(modelName);
}

getGalleryFramePosition(modelName) {
  const framePositions = {
    'cube': { x: -10, z: -14.5 },      // Red Cube - back wall left
    'sphere': { x: 10, z: -14.5 },     // Green Sphere - back wall right  
    'cylinder': { x: -14.5, z: -5 },   // Blue Cylinder - left wall
    'cone': { x: 14.5, z: 5 },         // Yellow Cone - right wall
    'church': { x: 0, z: -14.5 }       // Church - back wall center
  };
  
  return framePositions[modelName] || null;
}

markGalleryPath() {
  console.log('markGalleryPath called for model:', this.currentModelName);
  
  if (!this.currentModelName) {
    console.error('No current model name');
    return;
  }
  let minimap = null;
  if (window.minimap) {
    minimap = window.minimap;
    console.log('Found minimap via window.minimap');
  } else if (typeof window.minimap !== 'undefined') {
    minimap = window.minimap;
    console.log('Found minimap via typeof check');
  }
  
  if (!minimap) {
    console.error('Minimap not available. Available window properties:', Object.keys(window).filter(k => k.includes('minimap')));
    const galleryBtn = document.getElementById('mark-in-gallery-btn');
    if (galleryBtn) {
      galleryBtn.textContent = 'Minimap loading...';
      galleryBtn.style.background = 'linear-gradient(145deg, #cc8800, #aa6600)';
      
      setTimeout(() => {
        console.log('Retrying minimap access...');
        if (window.minimap) {
          console.log('Minimap now available, calling markGalleryPath again');
          this.markGalleryPath();
        } else {
          galleryBtn.textContent = 'Minimap not ready';
          galleryBtn.style.background = 'linear-gradient(145deg, #cc4444, #aa3333)';
          
          setTimeout(() => {
            galleryBtn.textContent = 'Set Marker';
            galleryBtn.style.background = 'linear-gradient(145deg, #8b4513, #6b3410)';
          }, 2000);
        }
      }, 1000);
    }
    return;
  }
  
  console.log('Minimap found:', minimap);
  console.log('Minimap has addCustomMarker method:', typeof minimap.addCustomMarker === 'function');
  this.clearNavigationMarkers();
  const portalPosition = new THREE.Vector3(0, 1, -12);
  console.log('Creating portal marker at:', portalPosition);
  
  try {
    if (typeof minimap.addCustomMarker === 'function') {
      this.portalMarker = minimap.addCustomMarker(
        portalPosition, 
        '#00ffff', 
        'Portal to Gallery'
      );
      console.log('Portal marker created:', this.portalMarker);
    } else {
      console.error('addCustomMarker method not available on minimap');
      return;
    }
  } catch (error) {
    console.error('Error creating portal marker:', error);
    return;
  }

  const framePosition = this.getGalleryFramePosition(this.currentModelName);
  console.log('Frame position for', this.currentModelName, ':', framePosition);
  if (framePosition) {
    this.galleryFramePosition = new THREE.Vector3(framePosition.x, 0, framePosition.z);
    this.targetModelName = this.currentModelName;
    console.log('Stored gallery frame position:', this.galleryFramePosition);
  } else {
    console.warn('No frame position found for model:', this.currentModelName);
  }
  
  const galleryBtn = document.getElementById('mark-in-gallery-btn');
  if (galleryBtn) {
    galleryBtn.textContent = 'Path Marked!';
    galleryBtn.style.background = 'linear-gradient(145deg, #228b22, #1e6b1e)';
    
    setTimeout(() => {
      galleryBtn.textContent = 'Set Marker';
      galleryBtn.style.background = 'linear-gradient(145deg, #8b4513, #6b3410)';
    }, 2000);
  }
  
  setTimeout(() => {
    this.closeViewer();
  }, 1000);
  
  if (this.portfolioAnalytics) {
    this.portfolioAnalytics.trackInteraction('model_viewer', 'mark_gallery_path', {
      modelName: this.currentModelName
    });
  }
  
  console.log(`Marked path to gallery for ${this.currentModelName}`);
}

clearNavigationMarkers() {
  const minimap = window.minimap;
  if (!minimap) {
    console.warn('Minimap not available for clearing markers');
    return;
  }
  
  console.log('Clearing navigation markers...');
  
  if (this.portalMarker) {
    try {
      minimap.removeCustomMarker(this.portalMarker);
      console.log('Portal marker removed');
    } catch (error) {
      console.error('Error removing portal marker:', error);
    }
    this.portalMarker = null;
  }
  
  if (this.galleryMarker) {
    try {
      minimap.removeCustomMarker(this.galleryMarker);
      console.log('Gallery marker removed');
    } catch (error) {
      console.error('Error removing gallery marker:', error);
    }
    this.galleryMarker = null;
  }
}

onGalleryEntered() {
  console.log('onGalleryEntered called');
  console.log('Gallery frame position:', this.galleryFramePosition);
  console.log('Target model name:', this.targetModelName);
  if (!this.galleryFramePosition || !this.targetModelName) {
    console.log('No gallery navigation data, skipping marker creation');
    return;
  }
  
  const minimap = window.minimap;
  if (!minimap) {
    console.error('Minimap not available in gallery');
    return;
  }
  
  console.log('Removing portal marker...');
  if (this.portalMarker) {
    minimap.removeCustomMarker(this.portalMarker);
    this.portalMarker = null;
    console.log('Portal marker removed');
  }
  
  console.log('Creating gallery frame marker...');
  try {
    this.galleryMarker = minimap.addCustomMarker(
      this.galleryFramePosition,
      '#ff6b00',
      `${this.targetModelName.toUpperCase()} Frame`
    );
    console.log('Gallery marker created:', this.galleryMarker);
  } catch (error) {
    console.error('Error creating gallery marker:', error);
  }
  
  console.log(`Added gallery marker for ${this.targetModelName} at frame position`);
}

onGalleryExited() {
  if (this.galleryMarker) {
    const minimap = window.minimap;
    if (minimap) {
      minimap.removeCustomMarker(this.galleryMarker);
    }
    this.galleryMarker = null;
  }
  
  this.galleryFramePosition = null;
  this.targetModelName = null;
}


  setupViewer() {
  setTimeout(() => {
    const width = this.viewerContainer.clientWidth || 400;
    const height = this.viewerContainer.clientHeight || 300;
    
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.viewerContainer.appendChild(this.renderer.domElement);
  }, 50);
  //camera
  this.camera.position.set(0, 0, 5);
  this.camera.lookAt(0, 0, 0);
  //lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  this.scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  this.scene.add(directionalLight);
  const gridHelper = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
  gridHelper.position.y = -1;
  this.scene.add(gridHelper);

  //OrbitControls
   this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  this.controls.enableDamping = true;
  this.controls.dampingFactor = 0.1;
  this.controls.rotateSpeed = 0.7;
  this.controls.minDistance = 0.5; 
  this.controls.maxDistance = 20;
  this.controls.zoomSpeed = 1.2;

  // Check if mobile device
  const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    this.controls.enablePan = true;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,    // One finger = rotate
      TWO: THREE.TOUCH.DOLLY_PAN  // Two finger = zoom + pan
    };
  } else {
    this.controls.enablePan = false;
  }

  this.shiftKeyPressed = false;
  
  if (!isMobile) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Shift' && this.isActive) {
        this.shiftKeyPressed = true;
        this.controls.enablePan = true;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' && this.isActive) {
        this.shiftKeyPressed = false;
        this.controls.enablePan = false;
      }
    });
    
    window.addEventListener('blur', () => {
      if (this.isActive) {
        this.shiftKeyPressed = false;
        this.controls.enablePan = false;
      }
    });
  }
  
  window.addEventListener('blur', () => {
    if (this.isActive) {
      this.shiftKeyPressed = false;
      this.controls.enablePan = false;
    }
  });
  
  window.addEventListener('resize', () => {
  if (this.isActive) {
    this.updateViewerSize();
  }
});
  this.animate();
}

updateViewerSize() {
  const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const computedStyle = window.getComputedStyle(this.viewerContainer);
  let width = parseInt(computedStyle.width) || this.viewerContainer.clientWidth;
  let height = parseInt(computedStyle.height) || this.viewerContainer.clientHeight;
  
  if ((!width || !height) && isMobile) {
    const containerRect = this.viewerContainer.getBoundingClientRect();
    width = containerRect.width || 300;
    height = containerRect.height || 200;
  }
  
  console.log(`Updating model viewer renderer size to: ${width}x${height}`);
  
  if (width > 10 && height > 10) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    
    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    this.renderer.render(this.scene, this.camera);
    setTimeout(() => this.renderer.render(this.scene, this.camera), 10);
    setTimeout(() => this.renderer.render(this.scene, this.camera), 100);
    
    console.log(`Model viewer resized successfully to: ${width}x${height}`);
  } else {
    console.warn(`Model viewer container dimensions not ready: ${width}x${height}`);
    setTimeout(() => this.updateViewerSize(), 100);
  }
}

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (!this.isActive) return;
    
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  

shouldIgnoreObject(object) {
  if (this.isMirror(object)) {
    console.log('Ignoring mirror object');
    return true;
  }
  
  const name = (object.name || '').toLowerCase();
  if (name.includes('mirror') || 
      name.includes('ground') || 
      name.includes('plane') || 
      name.includes('grid') ||
      name.includes('sun') ||
      name.includes('moon') ||
      name.includes('sky') ||
      name.includes('sphere') ||
      name.includes('helper')) {
    return true;
  }
  
  if (object.userData) {
    if (object.userData.type === 'collision' || 
        object.userData.name === 'random_obstacle' ||
        object.userData.name === 'cylinder_obstacle') {
      return true;
    }
  }
  
  if (object.geometry) {
    if (object.geometry instanceof THREE.SphereGeometry) {
      const parameters = object.geometry.parameters;
      if (parameters && parameters.radius > 30) {
        console.log('Ignoring sky sphere geometry');
        return true;
      }
    }
    
    if (object.geometry instanceof THREE.CircleGeometry) {
      console.log('Ignoring circle geometry (sun/moon)');
      return true;
    }
    
    if ((object.geometry instanceof THREE.BoxGeometry || 
         object.geometry instanceof THREE.CylinderGeometry) && 
        object.material && 
        (object.material.wireframe || 
         object.material.transparent && object.material.opacity < 0.5)) {
      console.log('Ignoring collision geometry');
      return true;
    }
  }
  
  if (object.material) {
    if (object.material.wireframe) {
      return true;
    }
    
    if (object.material.side === THREE.BackSide) {
      console.log('Ignoring BackSide material (likely skybox)');
      return true;
    }
  }
  
  if (name.includes('helper') || object.isHelper) {
    return true;
  }
  
  if (object.type === 'Reflector' || 
     (object.children && object.children.some(child => child.type === 'Reflector'))) {
    return true;
  }
  
  if (object.geometry && object.geometry.type === 'PlaneGeometry' && 
      object.rotation.x < -1 && object.rotation.x > -2) {
    return true;
  }
  
  return false;
}

isMirror(object) {
  if (object.type === 'Reflector') {
    return true;
  }
  
  if (object.children && object.children.some(child => child.type === 'Reflector')) {
    return true;
  }
  
  if (object.geometry && object.geometry instanceof THREE.PlaneGeometry) {
    const params = object.geometry.parameters;
    
    if (params && 
        Math.abs(params.width - 20) < 0.1 && 
        Math.abs(params.height - 6) < 0.1) {
      return true;
    }
    
    if (object.position && 
        Math.abs(object.position.x - 3) < 1 && 
        Math.abs(object.position.y - 1) < 1 && 
        Math.abs(object.position.z - (-12)) < 1) {
      return true;
    }
  }
  
  if (object.parent && object.parent.type === 'Reflector') {
    return true;
  }
  
  if (object.material && object.material.color) {
    const color = object.material.color;
    const mirrorColor = new THREE.Color(0x889999);
    if (Math.abs(color.r - mirrorColor.r) < 0.1 && 
        Math.abs(color.g - mirrorColor.g) < 0.1 && 
        Math.abs(color.b - mirrorColor.b) < 0.1) {
      return true;
    }
  }
  return false;
}

  openViewer(object) {
  if (!object || this.shouldIgnoreObject(object)) {
    console.log('Ignoring object:', object?.name || 'unnamed');
    return;
  }
  
  const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isActive = true;
  this.infoOverlay.style.display = 'block';
    this.camera.position.set(0, 0, 5);
    this.controls.reset();
    while (this.modelGroup.children.length > 0) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
    const modelName = this.identifyModelFromObject(object);
    this.currentModelName = modelName;
    
    if (modelName) {
      this.loadingIndicator.style.display = 'block';
      this.isLoading = true;
      const modelUrl = this.modelUrlMap[modelName];
      
      if (modelUrl) {
        this.loadModel(modelUrl, modelName);
      } else {
        console.error('No URL found for model:', modelName);
        this.loadingIndicator.style.display = 'none';
        this.isLoading = false;
      }
    } else {
      console.error('Could not identify model from object:', object);
      const fallbackObject = object.clone();
      this.fitObjectToView(fallbackObject);
      this.modelGroup.add(fallbackObject);
      this.updateModelInfo({
        name: object.userData?.name || 'Unknown Object',
        type: object.userData?.type || 'Generic Object',
        description: 'No detailed information available for this object.'
      });
    }
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    if (this.portfolioAnalytics) {
      this.portfolioAnalytics.trackInteraction('model_viewer', 'open', { 
        modelName: modelName || 'unknown' 
      });
    }
    
const updateRendererSize = () => {
  this.infoOverlay.style.display = 'none';
  this.infoOverlay.offsetHeight;
  this.infoOverlay.style.display = 'block';
  
  setTimeout(() => {
    this.updateViewerSize();
  }, 10);
};

setTimeout(updateRendererSize, 50);
if (isMobile) {
  setTimeout(updateRendererSize, 200);
  setTimeout(updateRendererSize, 500);
  setTimeout(updateRendererSize, 1000);
}


  }
  
  loadModel(url, modelName) {
  console.log(`Loading complete model from URL: ${url}, model name: ${modelName}`);
  if (modelName === 'church') {
    console.log('special handling for church model');
    const churchPaths = [
      './church.glb', 
      '/church.glb',
      './models/church.glb',
      './assets/church.glb',
      'church.glb'
    ];
    
    this.tryLoadingFromPaths(churchPaths, modelName);
    return;
  }
  
  this.gltfLoader.load(
    url,
    (gltf) => {
      this.handleModelLoadSuccess(gltf, modelName);
    },
    (progress) => {
      const percent = progress.loaded / progress.total * 100;
      if (progress.total) {
        this.loadingIndicator.textContent = `Loading model... ${percent.toFixed(0)}%`;
      }
    },
    (error) => {
      console.error(`Error loading model from ${url}:`, error);
      this.loadingIndicator.style.display = 'none';
      this.isLoading = false;
      
      this.updateModelInfo({
        name: 'Error Loading Model',
        type: 'Error',
        description: `Failed to load model: ${error.message}`
      });
    }
  );
}
  tryLoadingFromPaths(paths, modelName) {
  console.log(`Trying to load ${modelName} from multiple paths:`, paths);
  this.tryNextPath(paths, 0, modelName);
}
tryNextPath(paths, index, modelName) {
  if (index >= paths.length) {
    console.error(`Failed to load ${modelName} from any path`);
    this.loadingIndicator.style.display = 'none';
    this.isLoading = false;
    this.updateModelInfo({
      name: 'Error Loading Model',
      type: 'Error',
      description: `Failed to load ${modelName} model from any known path`
    });
    return;
  }
  
  const path = paths[index];
  console.log(`Attempting to load from path: ${path}`);
  
  this.gltfLoader.load(
    path,
    (gltf) => {
      console.log(`Successfully loaded ${modelName} from ${path}`);
      this.handleModelLoadSuccess(gltf, modelName);
    },
    (progress) => {
      const percent = progress.loaded / progress.total * 100;
      if (progress.total) {
        this.loadingIndicator.textContent = `Loading ${modelName}... ${percent.toFixed(0)}% (Attempt ${index + 1}/${paths.length})`;
      }
    },
    (error) => {
      console.warn(`Failed to load ${modelName} from ${path}:`, error);
      this.tryNextPath(paths, index + 1, modelName);
    }
  );
}
handleModelLoadSuccess(gltf, modelName) {
  this.loadingIndicator.style.display = 'none';
  this.isLoading = false;
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.needsUpdate = true;
      }
    }
  });
  
  this.fitObjectToView(model);
  this.modelGroup.add(model);
  const modelInfo = this.modelInfoMap[modelName] || {
    name: modelName.charAt(0).toUpperCase() + modelName.slice(1),
    type: '3D Model',
    description: 'A 3D model in the portfolio.'
  };
  
  this.updateModelInfo(modelInfo);
  
  console.log(`Successfully loaded model: ${modelName}`);
}

  fitObjectToView(object) {
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 3 / maxDim;
      object.scale.multiplyScalar(scale);
      object.position.x = -center.x * scale;
      object.position.y = -center.y * scale;
      object.position.z = -center.z * scale;
    }
  }
  
  identifyModelFromObject(object) {
  console.log('Identifying model for object:', object);
  console.log('Object userData:', object.userData);
  console.log('Object name:', object.name);
  const isChurchPart = this.checkIfChurchPart(object);
  if (isChurchPart) {
    console.log('Identified as CHURCH model via special check');
    return 'church';
  }
  
  if (object.userData) {
    if (object.userData.parentPortal) return 'portal';
    if (object.userData.parentPaper) return 'paper';
    if (object.userData.parentTombstone) return 'grave';
    if (object.userData.parentBook) return 'book2';
    if (object.userData.parentScroll) return 'scroll';
    if (object.userData.parentKey) return 'key';
    if (object.userData.parentDoor) return 'door';
    if (object.userData.modelName === 'church') return 'church';
    if (object.userData.modelName) return object.userData.modelName;
  }
    
    if (object.userData && object.userData.name) {
      const name = object.userData.name.toLowerCase();
      if (name.includes('church')) return 'church';
      if (name.includes('tombstone')) return 'grave';
      if (name.includes('altar')) return 'altar';
      if (name.includes('letter')) return 'paper';
      if (name.includes('grimoire')) return 'book2';
      if (name.includes('scroll')) return 'scroll';
      if (name.includes('key')) return 'key';
      if (name.includes('door')) return 'door';
      if (name.includes('crow')) return 'crow';
      if (name.includes('desk')) return name.includes('desk2') ? 'desk2' : 'desk';
    }
    
    let current = object;
    while (current.parent && !current.parent.isScene) {
      current = current.parent;
      
      if (current.userData) {
        if (current.userData.parentPortal) return 'portal';
        if (current.userData.parentPaper) return 'paper';
        if (current.userData.parentTombstone) return 'grave';
        if (current.userData.parentBook) return 'book2';
        if (current.userData.parentScroll) return 'scroll';
        if (current.userData.parentKey) return 'key';
        if (current.userData.parentDoor) return 'door';
        if (current.userData.modelName) return current.userData.modelName;
        if (current.userData.name) {
          const name = current.userData.name.toLowerCase();
          if (name.includes('church')) return 'church';
          if (name.includes('tombstone')) return 'grave';
          if (name.includes('altar')) return 'altar';
          if (name.includes('letter')) return 'paper';
          if (name.includes('grimoire')) return 'book2';
          if (name.includes('scroll')) return 'scroll';
          if (name.includes('key')) return 'key';
          if (name.includes('door')) return 'door';
          if (name.includes('crow')) return 'crow';
          if (name.includes('desk')) return name.includes('desk2') ? 'desk2' : 'desk';
        }
      }
    }
    
    if (window.modelLoader && window.modelLoader.models) {
      const worldPos = new THREE.Vector3();
      object.getWorldPosition(worldPos);
      let closestModel = null;
      let closestDistance = Infinity;
      Object.entries(window.modelLoader.models).forEach(([name, model]) => {
        if (model && model.position) {
          const modelPos = new THREE.Vector3();
          model.getWorldPosition(modelPos);
          const distance = worldPos.distanceTo(modelPos);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestModel = name;
          }
        }
      });
      if (closestModel && closestDistance < 10) {
        return closestModel;
      }
    }
    
    if (object.name) {
      const name = object.name.toLowerCase();
      if (name.includes('church')) return 'church';
      if (name.includes('grave') || name.includes('tombstone')) return 'grave';
      if (name.includes('altar')) return 'altar';
      if (name.includes('paper') || name.includes('letter')) return 'paper';
      if (name.includes('book')) return name.includes('book2') ? 'book2' : 'book1';
      if (name.includes('scroll')) return 'scroll';
      if (name.includes('key')) return 'key';
      if (name.includes('door')) return 'door';
      if (name.includes('crow')) return 'crow';
      if (name.includes('desk')) return name.includes('desk2') ? 'desk2' : 'desk';
      if (name.includes('portal')) return 'portal';
    }
    
    console.warn('Could not identify model from object:', object);
    return null;
  }
  
  checkIfChurchPart(object) {
  if (object.name && object.name.toLowerCase().includes('church')) {
    return true;
  }
  
  if (object.userData && object.userData.name && 
      object.userData.name.toLowerCase().includes('church')) {
    return true;
  }
  
  const churchParts = ['wall', 'floor', 'window', 'door', 'roof', 'pillar', 'column'];
  const name = (object.name || '').toLowerCase();
  
  for (const part of churchParts) {
    if (name.includes(part)) {
      console.log(`Potential church part found: ${part} in ${name}`);
      let parent = object.parent;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.userData && parent.userData.modelName === 'church') {
          return true;
        }
        
        if (parent.name && parent.name.toLowerCase().includes('church')) {
          return true;
        }
        
        parent = parent.parent;
        depth++;
      }
      
      if (object.geometry) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const volume = size.x * size.y * size.z;
        
        if (volume > 10) {
          console.log(`Large architectural element (volume=${volume}), assuming church`);
          return true;
        }
      }
    }
  }
  
  if (window.modelLoader && window.modelLoader.models && window.modelLoader.models.church) {
    const churchModel = window.modelLoader.models.church;
    const churchPos = new THREE.Vector3();
    churchModel.getWorldPosition(churchPos);
    const objPos = new THREE.Vector3();
    object.getWorldPosition(objPos);
    const distance = churchPos.distanceTo(objPos);
    if (distance < 15) {
      console.log(`Object is within ${distance.toFixed(2)} units of church position`);
      return true;
    }
  }
  return false;
}

closeViewer() {
  this.isActive = false;
  this.infoOverlay.style.display = 'none';
  this.currentModelName = null;
  if (this.loadingIndicator) {
    this.loadingIndicator.style.display = 'none';
  }
  if (this.portfolioAnalytics) {
    this.portfolioAnalytics.trackInteraction('model_viewer', 'close');
  }
  
  if (window.pointerLockManager && this.gameStarted()) {
    setTimeout(() => {
      const canvas = document.getElementById('three-canvas');
      if (canvas) {
        console.log('ModelInfoViewer: Using pointerLockManager to request lock');
        window.pointerLockManager.requestLock(canvas);
      }
    }, 50);
  }
  
  if (typeof window.onOverlayClose === 'function') {
    window.onOverlayClose();
  }
}


  isViewerActive() {
    return this.isActive;
  }


}
export { ModelInfoViewer };