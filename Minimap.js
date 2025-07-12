import * as THREE from 'three';

class Minimap {
  constructor(scene, camera, characterGroup) {
  this.scene = scene;
  this.mainCamera = camera;
  this.characterGroup = characterGroup;
  this.markers = [];
  this.customMarkers = []; 
  this.mapCloseButton = null;
  this.isFullscreen = false;
  this.isMobile = this.detectMobileDevice();
if (this.isMobile) {
    this.mapSize = { width: 100, height: 100 };
    const maxSize = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    const clampedSize = Math.min(maxSize, 350); // Cap at 350px
    this.fullscreenSize = { 
      width: clampedSize, 
      height: clampedSize  // Force square
    };
  } else {
    this.mapSize = { width: 250, height: 250 };
    this.fullscreenSize = { width: 600, height: 600 };
  }

  this.fullscreenSize = { width: 600, height: 600 };
  
  this.minimapCamera = new THREE.OrthographicCamera(
    -12, 12, 12, -12, 1, 1000
  );
  this.minimapCamera.position.set(0, 50, 0);
  this.minimapCamera.lookAt(new THREE.Vector3(0, 0, 0));
  this.minimapCamera.up.set(0, 0, -1);
  
  this.minimapRenderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true,
    preserveDrawingBuffer: true
  });
  this.minimapRenderer.setSize(this.mapSize.width, this.mapSize.height);
  this.minimapRenderer.setClearColor(0x1a1a1a, 0.8);
  this.minimapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  this.minimapRenderer.domElement.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
  `;
    this.container = document.createElement('div');
this.container.id = 'minimap-container';
this.container.style.cssText = `
  position: fixed;
  top: 5px;   
  left: 20px;
  width: ${this.mapSize.width}px;
  height: ${this.mapSize.height}px;
  background: rgba(36, 41, 59, 0.7);
  border: 2px solid rgb(194, 194, 194);
  border-radius: 5px;
  overflow: hidden;
  z-index: 1000;
  transition: all 0.3s ease;
  cursor: pointer;
`;
    this.container.appendChild(this.minimapRenderer.domElement);
    
    
    this.playerMarker = this.createPlayerMarker();
    this.container.appendChild(this.playerMarker);   
    document.body.appendChild(this.container);
    this.markers = [];
    this.createDefaultMarkers();
    this.navigationTarget = null;
    this.setupEventListeners();
    console.log('Minimap initialized');
  }
  
  createPlayerMarker() {
  const marker = document.createElement('div');
  marker.id = 'minimap-player-marker';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 4 6');
  svg.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  `;
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M 0,6 L 2,4 L 4,6 L 2,0 Z');
  path.setAttribute('fill', 'rgb(255, 255, 0)');
  path.setAttribute('stroke', 'rgba(0,0,0,0.3)');
  path.setAttribute('stroke-width', '0.1');
  svg.appendChild(path);
  
  marker.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 16px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1001;
    transition: transform 0.1s ease;
    transform-origin: center center;
  `;
  
  marker.appendChild(svg);
  return marker;
}
  createDefaultMarkers() {
}
  
  addMarker(position, color = '#ffffff', name = '') {
    const marker = {
      position: position.clone(),
      name: name,
      element: this.createMarkerElement(color, name)
    };
    
    this.container.appendChild(marker.element);
    this.markers.push(marker);
    return marker;
  }
  
  createMarkerElement(color, name) {
    const marker = document.createElement('div');
    marker.className = 'minimap-marker';
    marker.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      background: ${color};
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.8);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1000;
      transition: all 0.3s ease;
    `;
    
    if (name) {
      const tooltip = document.createElement('div');
      tooltip.className = 'minimap-marker-tooltip';
      tooltip.textContent = name;
      tooltip.style.cssText = `
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 10px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        z-index: 1003;
      `;
      marker.appendChild(tooltip);
      
      marker.addEventListener('mouseenter', () => {
        if (this.isFullscreen) {
          tooltip.style.opacity = '1';
        }
      });
      
      marker.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    }
    
    return marker;
  }
  detectMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
  
  return isMobileUA || (hasTouch && isSmallScreen);
}
setupEventListeners() {
  this.container.addEventListener('click', (e) => {
    if (!this.isFullscreen) {
      this.toggleFullscreen();
    }
  });
  
  this.minimapRenderer.domElement.addEventListener('click', (e) => {
    if (this.isFullscreen) {
      e.stopPropagation();
      
      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const worldPos = this.screenToWorld(clickX, clickY);
      const clickedMarker = this.getMarkerAtScreenPosition(clickX, clickY);
      
      if (clickedMarker) {
        this.removeCustomMarker(clickedMarker);
      } else {
        this.handleMinimapClick(worldPos.x, worldPos.z, clickX, clickY);
      }
    }
  });

  window.addEventListener('resize', () => {
    this.updateSize();
  });
}
  screenToWorld(screenX, screenY) {
    if (this.isFullscreen) {
      const worldSize = 50;
      const x = (screenX / this.container.clientWidth) * worldSize - (worldSize / 2);
      const z = (screenY / this.container.clientHeight) * worldSize - (worldSize / 2);
      return { x, z };
    } else {
      const charPos = this.characterGroup.position;
      const viewSize = 25;
      const x = charPos.x + ((screenX / this.container.clientWidth) - 0.5) * (viewSize * 2);
      const z = charPos.z + ((screenY / this.container.clientHeight) - 0.5) * (viewSize * 2);
      return { x, z };
    }
  }
  
toggleFullscreen() {
  this.isFullscreen = !this.isFullscreen;
  
  if (this.isFullscreen) {
    if (this.isMobile) {
      const maxSize = Math.min(window.innerWidth, window.innerHeight) * 0.8;
      const clampedSize = Math.min(maxSize, 350); // Cap at 350px
      this.fullscreenSize = { 
        width: clampedSize, 
        height: clampedSize  // Force square
      };
    }
    this.container.style.width = `${this.fullscreenSize.width}px`;
    this.container.style.height = `${this.fullscreenSize.height}px`;
    this.container.style.top = '50%';
    this.container.style.left = '50%';
    this.container.style.bottom = 'auto';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.background = 'rgba(36, 41, 59, 0.95)';
    this.container.style.border = '3px solid rgb(194, 194, 194)';
    this.container.style.cursor = 'crosshair';
    
    if (!this.isMobile && document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    this.savedMiniCameraState = {
      position: this.minimapCamera.position.clone(),
      target: new THREE.Vector3()
    };
    this.minimapCamera.getWorldDirection(this.savedMiniCameraState.target);
    
    this.minimapCamera.left = -25;
    this.minimapCamera.right = 25;
    this.minimapCamera.top = 25;
    this.minimapCamera.bottom = -25;
    this.minimapCamera.position.set(0, 50, 0);
    this.minimapCamera.lookAt(0, 0, 0);
    this.minimapCamera.updateProjectionMatrix();
        
    if (!this.mapCloseButton) {
      this.createMapCloseButton();
    }
    this.mapCloseButton.style.display = 'flex';
    console.log('Map fullscreen opened, close button should be visible');
    
  } else {
    this.container.style.width = `${this.mapSize.width}px`;
    this.container.style.height = `${this.mapSize.height}px`;
    this.container.style.top = this.isMobile ? '5px' : '20px';
    this.container.style.left = '20px';
    this.container.style.bottom = 'auto';
    this.container.style.transform = 'none';
    this.container.style.background = 'rgba(36, 41, 59, 0.7)';
    this.container.style.border = '2px solid rgb(194, 194, 194)';
    this.container.style.cursor = 'pointer';
    
    if (!this.isMobile) {
      setTimeout(() => {
        if (document.getElementById('three-canvas')) {
          document.getElementById('three-canvas').requestPointerLock();
        }
      }, 100);
    }
    
    const viewSize = 12;
    this.minimapCamera.left = -viewSize;
    this.minimapCamera.right = viewSize;
    this.minimapCamera.top = viewSize;
    this.minimapCamera.bottom = -viewSize;
    this.minimapCamera.near = 1;
    this.minimapCamera.far = 1000;
    this.minimapCamera.up.set(0, 0, -1);
    this.minimapCamera.updateProjectionMatrix();
        
    if (this.mapCloseButton) {
      this.mapCloseButton.style.display = 'none';
    }
    console.log('Map closed, close button hidden');
  }
  
  this.updateSize();
  
  requestAnimationFrame(() => {
    if (!this.isFullscreen && this.characterGroup) {
      const charPos = this.characterGroup.position;
      this.minimapCamera.position.set(charPos.x, 50, charPos.z);
      this.minimapCamera.lookAt(charPos.x, 0, charPos.z);
      this.minimapCamera.updateMatrixWorld(true);
    }
    
    this.minimapRenderer.render(this.scene, this.minimapCamera);
    
    requestAnimationFrame(() => {
      this.minimapRenderer.render(this.scene, this.minimapCamera);
    });
  });
}

createMapCloseButton() {
  this.mapCloseButton = document.createElement('button');
  this.mapCloseButton.id = 'map-close-btn';
  this.mapCloseButton.innerHTML = '✕';
  
  const buttonSize = this.isMobile ? '50px' : '40px';
  const fontSize = this.isMobile ? '24px' : '20px';
  const topPosition = this.isMobile ? '10px' : '15px';
  const rightPosition = this.isMobile ? '10px' : '15px';
  
  this.mapCloseButton.style.cssText = `
    position: absolute;
    top: ${topPosition};
    right: ${rightPosition};
    width: ${buttonSize};
    height: ${buttonSize};
    background: rgba(194, 194, 194, 0.9);
    border: 2px solid rgb(194, 194, 194);
    border-radius: 50%;
    color: white;
    font-size: ${fontSize};
    font-weight: bold;
    cursor: pointer;
    z-index: 1004;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  `;

  this.mapCloseButton.addEventListener('mouseenter', () => {
    this.mapCloseButton.style.background = 'rgba(194, 194, 194, 1)';
    this.mapCloseButton.style.transform = 'scale(1.1)';
  });

  this.mapCloseButton.addEventListener('mouseleave', () => {
    this.mapCloseButton.style.background = 'rgba(194, 194, 194, 0.9)';
    this.mapCloseButton.style.transform = 'scale(1)';
  });

  this.mapCloseButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Map close button clicked');
    this.toggleFullscreen();
  });

  this.mapCloseButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Map close button touched');
    this.mapCloseButton.style.background = 'rgba(255, 255, 255, 0.8)';
    this.mapCloseButton.style.transform = 'scale(0.95)';
  });

  this.mapCloseButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Map close button touch ended - closing map');
    
    this.mapCloseButton.style.background = 'rgba(194, 194, 194, 0.9)';
    this.mapCloseButton.style.transform = 'scale(1)';
    
    this.toggleFullscreen();
  });

  this.mapCloseButton.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  this.container.appendChild(this.mapCloseButton);
  console.log('Map close button created and added to container (mobile-friendly)');
}

closeFullscreen() {
  if (!this.isFullscreen) return;
  
  this.isFullscreen = false;
  this.container.style.width = `${this.mapSize.width}px`;
  this.container.style.height = `${this.mapSize.height}px`;
  this.container.style.top = '20px';
  this.container.style.left = '20px';
  this.container.style.bottom = 'auto';
  this.container.style.transform = 'none';
  this.container.style.background = 'rgba(36, 41, 59, 0.7)';
  this.container.style.border = '2px solid rgb(194, 194, 194)';
  this.container.style.cursor = 'pointer';
  
  if (this.mapCloseButton) {
    this.mapCloseButton.style.display = 'none';
  }
  
  const viewSize = 12;
  this.minimapCamera.left = -viewSize;
  this.minimapCamera.right = viewSize;
  this.minimapCamera.top = viewSize;
  this.minimapCamera.bottom = -viewSize;
  this.minimapCamera.near = 1;
  this.minimapCamera.far = 1000;
  this.minimapCamera.up.set(0, 0, -1);
  this.minimapCamera.updateProjectionMatrix();
  
  this.updateSize();
  
  requestAnimationFrame(() => {
    if (!this.isFullscreen && this.characterGroup) {
      const charPos = this.characterGroup.position;
      this.minimapCamera.position.set(charPos.x, 50, charPos.z);
      this.minimapCamera.lookAt(charPos.x, 0, charPos.z);
      this.minimapCamera.updateMatrixWorld(true);
    }
    
    this.minimapRenderer.render(this.scene, this.minimapCamera);
    
    const container = document.getElementById('three-canvas');
    if (container && window.gameStarted) {
      setTimeout(() => {
        container.requestPointerLock();
      }, 50);
    }
  });
}

closeMinimap() {
  if (!this.isFullscreen) return;
  
  console.log('Closing minimap via X button');
  
  this.isFullscreen = false;
  
  this.container.style.width = `${this.mapSize.width}px`;
  this.container.style.height = `${this.mapSize.height}px`;
  this.container.style.top = '20px';
  this.container.style.left = '20px';
  this.container.style.bottom = 'auto';
  this.container.style.transform = 'none';
  this.container.style.background = 'rgba(36, 41, 59, 0.7)';
  this.container.style.border = '2px solid rgb(194, 194, 194)';
  this.container.style.cursor = 'pointer';
  
  if (this.mapCloseButton) {
    this.mapCloseButton.style.display = 'none';
  }
  
  const viewSize = 12;
  this.minimapCamera.left = -viewSize;
  this.minimapCamera.right = viewSize;
  this.minimapCamera.top = viewSize;
  this.minimapCamera.bottom = -viewSize;
  this.minimapCamera.near = 1;
  this.minimapCamera.far = 1000;
  this.minimapCamera.up.set(0, 0, -1);
  this.minimapCamera.updateProjectionMatrix();
  
  this.updateSize();
  
  setTimeout(() => {
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').requestPointerLock();
    }
  }, 100);
  
  requestAnimationFrame(() => {
    if (!this.isFullscreen && this.characterGroup) {
      const charPos = this.characterGroup.position;
      this.minimapCamera.position.set(charPos.x, 50, charPos.z);
      this.minimapCamera.lookAt(charPos.x, 0, charPos.z);
      this.minimapCamera.updateMatrixWorld(true);
    }
    
    this.minimapRenderer.render(this.scene, this.minimapCamera);
    
    requestAnimationFrame(() => {
      this.minimapRenderer.render(this.scene, this.minimapCamera);
    });
  });
}

create3DMarker(position, color = '#ff6b6b', name = 'Custom Marker') {
  const markerGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
  const markerMaterial = new THREE.MeshPhongMaterial({ 
    color: color,
    shininess: 100,
    emissive: color,
    emissiveIntensity: 0.1
  });
  
  const marker3D = new THREE.Mesh(markerGeometry, markerMaterial);
  marker3D.position.copy(position);
  marker3D.position.y = 0.75;
  marker3D.castShadow = true;
  marker3D.receiveShadow = true;
  marker3D.userData = {
    type: 'minimap-marker',
    name: name,
    originalY: marker3D.position.y,
    time: Math.random() * Math.PI * 2, 
    isCustomMarker: true
  };
  
  this.scene.add(marker3D);
  return marker3D;
}

updateSize() {
  const width = this.container.clientWidth;
  const height = this.container.clientHeight;
  console.log(`Updating minimap renderer size to: ${width}x${height}`);
  this.minimapRenderer.setSize(width, height, false); // false prevents setting CSS size
  const canvas = this.minimapRenderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  this.minimapCamera.updateProjectionMatrix();
}
  getIsFullscreen() {
  return this.isFullscreen;
}

handleMinimapClick(x, z, screenX, screenY) {
  const clampedX = Math.max(Math.min(x, 23), -23);
  const clampedZ = Math.max(Math.min(z, 23), -18);
  console.log(`Minimap: Creating custom marker at (${clampedX.toFixed(1)}, ${clampedZ.toFixed(1)})`);
  this.createCustomMarkerDirect(new THREE.Vector3(clampedX, 0, clampedZ));
}

createCustomMarkerDirect(position) {
  const markerCount = this.customMarkers.length + 1;
  const defaultName = `Marker ${markerCount}`;
  const marker = this.addCustomMarker(position, '#ff6b6b', defaultName);
  console.log(`Added custom marker: "${defaultName}" at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
}

checkAndRemoveNearbyMarkers(playerPosition, removeDistance = 2.0) {
  const markersToRemove = [];
  this.customMarkers.forEach(marker => {
    const distance = playerPosition.distanceTo(marker.position);
    if (distance <= removeDistance) {
      console.log(`Player is within ${removeDistance} units of marker "${marker.name}" (distance: ${distance.toFixed(2)}), removing marker`);
      markersToRemove.push(marker);
    }
  });
  
  markersToRemove.forEach(marker => {
    this.removeCustomMarker(marker);
  });
  
  return markersToRemove.length;
}

addCustomMarker(position, color = '#ff6b6b', name = 'Custom Marker') {
  const markerElement = this.createCustomMarkerElement(color, name);
  const marker3D = this.create3DMarker(position, color, name);
  const marker = {
    position: position.clone(),
    name: name,
    element: markerElement,
    marker3D: marker3D, 
    isCustom: true,
    id: Date.now() + Math.random() 
  };
  
  this.container.appendChild(marker.element);
  this.customMarkers.push(marker);
  this.markers.push(marker);   
  console.log(`Added custom marker: ${name} at position:`, position); 
  return marker;
}

createCustomMarkerElement(color, name) {
  const marker = document.createElement('div');
  marker.className = 'minimap-custom-marker';
  marker.style.cssText = `
    position: absolute;
    width: 10px;
    height: 10px;
    background: ${color};
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 1001;
    transition: all 0.3s ease;
    box-shadow: 0 0 5px rgba(0,0,0,0.5);
  `;
  
  marker.addEventListener('mouseenter', () => {
    marker.style.transform = 'translate(-50%, -50%) scale(1.2)';
    marker.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
  });
  
  marker.addEventListener('mouseleave', () => {
    marker.style.transform = 'translate(-50%, -50%) scale(1)';
    marker.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
  });
  
  return marker;
}

getMarkerAtScreenPosition(screenX, screenY) {
  const clickThreshold = 20;
  
  for (const marker of this.customMarkers) {
    const markerRect = marker.element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const markerX = markerRect.left + markerRect.width/2 - containerRect.left;
    const markerY = markerRect.top + markerRect.height/2 - containerRect.top;
    const distance = Math.sqrt(
      Math.pow(screenX - markerX, 2) + Math.pow(screenY - markerY, 2)
    );
    
    if (distance <= clickThreshold) {
      return marker;
    }
  }
  return null;
}

animate3DMarkers(deltaTime) {
  this.customMarkers.forEach(marker => {
    if (marker.marker3D && marker.marker3D.userData) {
      const userData = marker.marker3D.userData;
      userData.time += deltaTime * 2; 
      marker.marker3D.position.y = userData.originalY + Math.sin(userData.time) * 0.2;
      marker.marker3D.rotation.y += deltaTime * 0.5;
    }
  });
}


removeCustomMarker(marker) {
  const customIndex = this.customMarkers.indexOf(marker);
  if (customIndex > -1) {
    this.customMarkers.splice(customIndex, 1);
  }
  
  const markerIndex = this.markers.indexOf(marker);
  if (markerIndex > -1) {
    this.markers.splice(markerIndex, 1);
  }
  
  if (marker.marker3D) {
    this.scene.remove(marker.marker3D);
    marker.marker3D.geometry.dispose();
    marker.marker3D.material.dispose();
  }
  
  if (marker.element && marker.element.parentNode) {
    marker.element.parentNode.removeChild(marker.element);
  }
  
  console.log(`Removed custom marker: "${marker.name}"`);
}

  addNavigationMarker(position) {
    if (this.navigationTarget && this.navigationTarget.element) {
      this.navigationTarget.element.remove();
    }
    
    const marker = document.createElement('div');
    marker.id = 'navigation-target';
    marker.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid yellow;
      border-radius: 50%;
      background: rgba(255, 255, 0, 0.3);
      transform: translate(-50%, -50%);
      z-index: 999;
      pointer-events: none;
      animation: pulse 1.5s infinite;
    `;
    
    if (!document.getElementById('minimap-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'minimap-pulse-style';
      style.textContent = `
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.container.appendChild(marker);
    this.navigationTarget = {
      position: position,
      element: marker
    };
  }
  
update() {
  if (!this.characterGroup) {
    console.warn('Minimap: Character group not available yet');
    return;
  }
  
  const charPos = this.characterGroup.position;
  
  if (this.isFullscreen) {
    this.minimapCamera.position.set(0, 50, 0);
    this.minimapCamera.lookAt(0, 0, 0);
    this.updatePlayerMarkerFullscreen();
  } else {
    this.minimapCamera.position.set(charPos.x, 50, charPos.z);
    this.minimapCamera.lookAt(charPos.x, 0, charPos.z);
    this.minimapCamera.updateMatrixWorld(true);
    this.playerMarker.style.left = '50%';
    this.playerMarker.style.top = '50%';
  }
  
  if (window.targetRotationY !== undefined) {
    const rotationDegrees = -(window.targetRotationY * 180 / Math.PI);
    
    if (this.isFullscreen) {
      this.playerMarker.style.transform = 
        `translate(-50%, -50%) rotate(${rotationDegrees}deg)`;
    } else {
      this.playerMarker.style.transform = 
        `translate(-50%, -50%) rotate(${rotationDegrees}deg)`;
    }
  }
  
  this.updateMarkers();
  
  try {
    this.minimapRenderer.render(this.scene, this.minimapCamera);
  } catch (error) {
    console.error('Minimap render error:', error);
  }
}

  updatePlayerMarkerFullscreen() {
    if (!this.isFullscreen) return;
    const charPos = this.characterGroup.position;
    const worldSize = 50;
    const screenX = ((charPos.x + 25) / worldSize) * this.container.clientWidth;
    const screenY = ((charPos.z + 25) / worldSize) * this.container.clientHeight;
    this.playerMarker.style.left = `${screenX}px`;
    this.playerMarker.style.top = `${screenY}px`;
  }
  
  updateMarkers() {
  const charPos = this.characterGroup.position;
  this.markers.forEach(marker => {
    if (this.isFullscreen) {
      const worldSize = 50;
      const screenX = ((marker.position.x + 25) / worldSize) * this.container.clientWidth;
      const screenY = ((marker.position.z + 25) / worldSize) * this.container.clientHeight;
      marker.element.style.left = `${screenX}px`;
      marker.element.style.top = `${screenY}px`;
      marker.element.style.display = 'block';
      if (marker.isCustom) {
        marker.element.style.width = '10px';
        marker.element.style.height = '10px';
      } else {
        marker.element.style.width = '8px';
        marker.element.style.height = '8px';
      }
      
    } else {
      const dx = marker.position.x - charPos.x;
      const dz = marker.position.z - charPos.z;
      const viewSize = 12;
      const mapCenterX = this.container.clientWidth / 2;
      const mapCenterY = this.container.clientHeight / 2;
      const scale = this.container.clientWidth / (viewSize * 2);
      const screenX = mapCenterX + dx * scale;
      const screenY = mapCenterY + dz * scale;
      const isVisible = Math.abs(dx) < viewSize && Math.abs(dz) < viewSize;
      marker.element.style.left = `${screenX}px`;
      marker.element.style.top = `${screenY}px`;
      marker.element.style.display = isVisible ? 'block' : 'none';
      
      if (marker.isCustom) {
        marker.element.style.width = '8px';
        marker.element.style.height = '8px';
      } else {
        marker.element.style.width = '6px';
        marker.element.style.height = '6px';
      }
    }
  });
  
  if (this.navigationTarget) {
    if (this.isFullscreen) {
      const worldSize = 50;
      const screenX = ((this.navigationTarget.position.x + 25) / worldSize) * this.container.clientWidth;
      const screenY = ((this.navigationTarget.position.z + 25) / worldSize) * this.container.clientHeight;
      this.navigationTarget.element.style.left = `${screenX}px`;
      this.navigationTarget.element.style.top = `${screenY}px`;
      
    } else {
      const dx = this.navigationTarget.position.x - charPos.x;
      const dz = this.navigationTarget.position.z - charPos.z;
      const viewSize = 12;
      const mapCenterX = this.container.clientWidth / 2;
      const mapCenterY = this.container.clientHeight / 2;
      const scale = this.container.clientWidth / (viewSize * 2);
      const screenX = mapCenterX + dx * scale;
      const screenY = mapCenterY + dz * scale;
      this.navigationTarget.element.style.left = `${screenX}px`;
      this.navigationTarget.element.style.top = `${screenY}px`;
    }
  }
}
  
  setScene(scene) {
    this.scene = scene;
  }
  
  setVisible(visible) {
    this.container.style.display = visible ? 'block' : 'none';
  }
  
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.minimapRenderer.dispose();
  }
}

export { Minimap };