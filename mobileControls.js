import * as THREE from 'three';

class MobileControls {
  constructor(characterSystem, camera, gameStateManager, inventorySystem = null) {
  this.characterSystem = characterSystem;
  this.camera = camera;
  this.gameStateManager = gameStateManager;
  this.inventorySystem = inventorySystem;
    this.isMobile = this.detectMobileDevice();
    this.isVisible = false;
    
    this.movementState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprinting: false,
      crouching: false,
      moving: false
    };
    
    this.activeTouches = new Map();
    
    this.movementJoystick = {
      active: false,
      touchId: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      maxDistance: 50
    };
    
    this.lookJoystick = {
      active: false,
      touchId: null, 
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      maxDistance: 50,
      sensitivity: 0.02
    };
    
    if (typeof window.targetRotationY === 'undefined') {
      window.targetRotationY = 0;
    }
    if (typeof window.currentRotationX === 'undefined') {
      window.currentRotationX = 0;
    }
    
    if (this.isMobile) {
    this.disablePointerLockOnMobile();
    this.createMobileControls();
    this.setupEventListeners();
    console.log('Mobile controls initialized with multitouch support');
  }
  }
  
disablePointerLockOnMobile() {
  const originalRequestPointerLock = HTMLElement.prototype.requestPointerLock;
  const originalExitPointerLock = Document.prototype.exitPointerLock;
  
  HTMLElement.prototype.requestPointerLock = function() {
    if (window.mobileControls && window.mobileControls.isMobileDevice()) {
      console.log('Pointer lock completely disabled on mobile');
      return Promise.resolve();
    }
    return originalRequestPointerLock.call(this);
  };
  
  Document.prototype.exitPointerLock = function() {
    if (window.mobileControls && window.mobileControls.isMobileDevice()) {
      console.log('Pointer lock exit disabled on mobile');
      return;
    }
    return originalExitPointerLock.call(this);
  };
  
  document.body.mobileControls = this;
}
  detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);
    
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
    
    const hasOrientation = 'orientation' in window;
    
    console.log('Mobile detection:', {
      userAgent: isMobileUA,
      hasTouch: hasTouch,
      smallScreen: isSmallScreen,
      hasOrientation: hasOrientation
    });
    
    return isMobileUA || (hasTouch && isSmallScreen);
  }
  
  createMobileControls() {
  this.container = document.createElement('div');
  this.container.id = 'mobile-controls';
  this.container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2000;
    display: none;
    touch-action: none;
  `;
  
  this.createMovementJoystick();
  this.createLookJoystick();
  this.createActionButtons();
  this.createMenuButtons();
    
  document.body.appendChild(this.container);
}
  
  createMovementJoystick() {
    this.movementJoystickContainer = document.createElement('div');
    this.movementJoystickContainer.className = 'movement-joystick-container';
    this.movementJoystickContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 100px;
      height: 100px;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      touch-action: none;
    `;
    
    this.movementJoystickBase = document.createElement('div');
    this.movementJoystickBase.className = 'movement-joystick-base';
    this.movementJoystickBase.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 3px solid rgba(255, 255, 255, 0.3);
      position: relative;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    `;
    
    this.movementJoystickKnob = document.createElement('div');
    this.movementJoystickKnob.className = 'movement-joystick-knob';
    this.movementJoystickKnob.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 255, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.8);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;
  
    const movementLabel = document.createElement('div');
    movementLabel.style.cssText = `
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Courier New', monospace;
      font-size: 10px;
      text-align: center;
      pointer-events: none;
    `;
    movementLabel.textContent = ' ';
    
    this.movementJoystickBase.appendChild(this.movementJoystickKnob);
    this.movementJoystickContainer.appendChild(this.movementJoystickBase);
    this.movementJoystickContainer.appendChild(movementLabel);
    this.container.appendChild(this.movementJoystickContainer);
  }
  
  createLookJoystick() {
    this.lookJoystickContainer = document.createElement('div');
    this.lookJoystickContainer.className = 'look-joystick-container';
    this.lookJoystickContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      width: 100px;
      height: 100px;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      touch-action: none;
    `;
    
    this.lookJoystickBase = document.createElement('div');
    this.lookJoystickBase.className = 'look-joystick-base';
    this.lookJoystickBase.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 3px solid rgba(255, 255, 255, 0.3);
      position: relative;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    `;
    
    this.lookJoystickKnob = document.createElement('div');
    this.lookJoystickKnob.className = 'look-joystick-knob';
    this.lookJoystickKnob.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 255, 0, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.8);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;
    
    const lookLabel = document.createElement('div');
    lookLabel.style.cssText = `
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Courier New', monospace;
      font-size: 10px;
      text-align: center;
      pointer-events: none;
    `;
    lookLabel.textContent = ' ';
    
    this.lookJoystickBase.appendChild(this.lookJoystickKnob);
    this.lookJoystickContainer.appendChild(this.lookJoystickBase);
    this.lookJoystickContainer.appendChild(lookLabel);
    this.container.appendChild(this.lookJoystickContainer);
  }
  
  createActionButtons() {
  this.buttonContainer = document.createElement('div');
  this.buttonContainer.className = 'action-buttons';
  this.buttonContainer.style.cssText = `
    position: absolute;
    bottom: 30px;
    right: 30px;
    width: 100px;
    height: 100px;
    pointer-events: none;
  `;
  
  const radius = 80;
  const centerX = 50;
  const centerY = 50;
  
  const angles = [
    -200 * Math.PI / 180,  // Jump
    -150 * Math.PI / 180,   // Sprint
    -100 * Math.PI / 180,   // Crouch
    -50 * Math.PI / 180,   // V
  ];
  
  // Jump
  this.jumpButton = this.createActionButton('JUMP', 'rgba(0, 255, 0, 0.7)');
  this.jumpButton.style.position = 'absolute';
  this.jumpButton.style.left = `${centerX + Math.cos(angles[0]) * radius - 30}px`;
  this.jumpButton.style.top = `${centerY + Math.sin(angles[0]) * radius - 30}px`;
  this.jumpButton.style.pointerEvents = 'auto';
  this.jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    this.handleJump();
  }, { passive: false });
  
  // Sprint
  this.sprintButton = this.createActionButton('SPRINT', 'rgba(255, 255, 0, 0.7)');
  this.sprintButton.style.position = 'absolute';
  this.sprintButton.style.left = `${centerX + Math.cos(angles[1]) * radius - 30}px`;
  this.sprintButton.style.top = `${centerY + Math.sin(angles[1]) * radius - 30}px`;
  this.sprintButton.style.pointerEvents = 'auto';
  
  this.sprintButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sprint button pressed');
    this.movementState.sprinting = true;
    this.updateButtonState(this.sprintButton, true);
    this.updateCharacterMovement();
  }, { passive: false });
  
  this.sprintButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sprint button released');
    this.movementState.sprinting = false;
    this.updateButtonState(this.sprintButton, false);
    this.updateCharacterMovement();
  }, { passive: false });
  
  this.sprintButton.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    this.movementState.sprinting = false;
    this.updateButtonState(this.sprintButton, false);
    this.updateCharacterMovement();
  }, { passive: false });
  
  // Crouch
  this.crouchButton = this.createActionButton('CROUCH', 'rgba(255, 100, 0, 0.7)');
  this.crouchButton.style.position = 'absolute';
  this.crouchButton.style.left = `${centerX + Math.cos(angles[2]) * radius - 30}px`;
  this.crouchButton.style.top = `${centerY + Math.sin(angles[2]) * radius - 30}px`;
  this.crouchButton.style.pointerEvents = 'auto';
  
  this.crouchButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Crouch button pressed - toggling state');
    this.movementState.crouching = !this.movementState.crouching;
    this.updateButtonState(this.crouchButton, this.movementState.crouching);
    this.updateCharacterMovement();
    
    if (window.keys) {
      window.keys['b'] = true;
      setTimeout(() => {
        if (window.keys) window.keys['b'] = false;
      }, 100);
    }
  }, { passive: false });

  // V
this.detectButton = this.createActionButton('V', 'rgba(0,200,255,0.7)');
this.detectButton.style.position = 'absolute';
this.detectButton.style.left = `${centerX + Math.cos(angles[3]) * radius - 30}px`;
this.detectButton.style.top = `${centerY + Math.sin(angles[3]) * radius - 30}px`;
this.detectButton.style.pointerEvents = 'auto';

this.detectButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Mobile V button pressed - activating Eagle Vision');
  this.handleEagleVision();
}, { passive: false });
  
  this.buttonContainer.appendChild(this.detectButton);
  this.buttonContainer.appendChild(this.jumpButton);
  this.buttonContainer.appendChild(this.sprintButton);
  this.buttonContainer.appendChild(this.crouchButton);
  this.container.appendChild(this.buttonContainer);
}

handleInventoryToggle() {
  console.log('handleInventoryToggle called');
  console.log('gameStarted:', window.gameStarted || (typeof gameStarted !== 'undefined' ? gameStarted : false));
 
  let inv = null;
  
  if (window.inventorySystem) {
    inv = window.inventorySystem;
    console.log('Found inventory via window.inventorySystem');
  } else if (this.inventorySystem) {
    inv = this.inventorySystem;
    console.log('Found inventory via this.inventorySystem');
  } else if (typeof inventorySystem !== 'undefined') {
    inv = inventorySystem;
    console.log('Found inventory via global inventorySystem');
  }
  
  if (inv && typeof inv.toggleInventory === 'function') {
    console.log('Calling toggleInventory()');
    
    window.preventESCOverlay = true;
    inv.toggleInventory();
    
    setTimeout(() => {
      window.preventESCOverlay = false;
    }, 200);
    
  } else {
    console.error('Could not access inventory system or toggleInventory method');
    console.log('Available inventory object:', inv);
  }
}

  createMenuButtons() {
  this.menuButtonContainer = document.createElement('div');
  this.menuButtonContainer.className = 'menu-buttons';
  this.menuButtonContainer.style.cssText = `
    position: absolute;
    bottom: 30px; 
    left: 30px;
    width: 100px;
    height: 100px;
    pointer-events: none;
    z-index: 2000;
  `;
  
  const radius = 80; // Distance joystick center
  const centerX = 50;
  const centerY = 60; 
  
  const angles = [
    20 * Math.PI / 180,  // j
    -20 * Math.PI / 180,  // m
    -60 * Math.PI / 180,  // e
    -100 * Math.PI / 180,   // i
  ];
  
  //j
this.inspectButton = this.createMenuButton('J', 'rgba(0,255,255,0.7)');
this.inspectButton.style.position = 'absolute';
this.inspectButton.style.left = `${centerX + Math.cos(angles[0]) * radius - 20}px`;
this.inspectButton.style.top = `${centerY + Math.sin(angles[0]) * radius - 20}px`;
this.inspectButton.style.pointerEvents = 'auto';
this.inspectButton.style.zIndex = '2001';

this.inspectButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Mobile J button touchend triggered');
  this.handleInspect();
}, { passive: false });

this.inspectButton.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Mobile J button click triggered');
  this.handleInspect();
});
    
  // Map
  this.mapButton = this.createMenuButton('M', 'rgba(255, 150, 0, 0.7)');
  this.mapButton.style.position = 'absolute';
  this.mapButton.style.left = `${centerX + Math.cos(angles[1]) * radius - 20}px`;
  this.mapButton.style.top = `${centerY + Math.sin(angles[1]) * radius - 20}px`;
  this.mapButton.style.pointerEvents = 'auto';
  this.mapButton.style.zIndex = '2001';
  
  this.mapButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile M button touchend triggered');
    this.handleMap();
  }, { passive: false });

  this.mapButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile M button click triggered');
    this.handleMap();
  });

  //E
  this.menuInteractButton = this.createMenuButton('E', 'rgba(0,150,255,0.7)');
  this.menuInteractButton.style.position = 'absolute';
  this.menuInteractButton.style.left = `${centerX + Math.cos(angles[2]) * radius - 20}px`;
  this.menuInteractButton.style.top = `${centerY + Math.sin(angles[2]) * radius - 20}px`;
  this.menuInteractButton.style.pointerEvents = 'auto';
  this.menuInteractButton.style.zIndex = '2001';
  
  this.menuInteractButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.handleInteract();
  }, { passive: false });

  //I 
  this.inventoryButton = this.createMenuButton('I', 'rgba(150, 0, 255, 0.7)');
  this.inventoryButton.style.position = 'absolute';
  this.inventoryButton.style.left = `${centerX + Math.cos(angles[3]) * radius - 20}px`;
  this.inventoryButton.style.top = `${centerY + Math.sin(angles[3]) * radius - 20}px`;
  this.inventoryButton.style.pointerEvents = 'auto';
  this.inventoryButton.style.zIndex = '2001';
  
  this.inventoryButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile I button touchend triggered');
    this.handleInventoryToggle();
  }, { passive: false });

  this.inventoryButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile I button click triggered');
    this.handleInventoryToggle();
  });

  //ESC
  this.escButton = this.createMenuButton('ESC', 'rgba(255, 0, 0, 0.3)');
  this.escButton.style.position = 'fixed';
  this.escButton.style.top = '5px';
  this.escButton.style.left = '130px';
  this.escButton.style.zIndex = '1500';
  this.escButton.style.pointerEvents = 'auto';
  
  this.escButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    this.handleEscape();
  }, { passive: false });
  
  document.body.appendChild(this.escButton);
  
  this.menuButtonContainer.appendChild(this.menuInteractButton);
  this.menuButtonContainer.appendChild(this.inspectButton);
  this.menuButtonContainer.appendChild(this.mapButton);
  this.menuButtonContainer.appendChild(this.inventoryButton);
  this.container.appendChild(this.menuButtonContainer);
}
  
  createActionButton(text, color) {
    const button = document.createElement('div');
    button.className = 'action-button';
    button.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      transition: all 0.1s ease;
      touch-action: none;
    `;
    button.textContent = text;
    return button;
  }
  
  createMenuButton(text, color) {
  const button = document.createElement('div');
  button.className = 'menu-button';
  button.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: ${color};
    border: 2px solid rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.1s ease;
    touch-action: manipulation;
    pointer-events: auto;
    position: relative;
    z-index: 2001;
  `;
  button.textContent = text;
  return button;
}
  
  setupEventListeners() {
  this.movementJoystickContainer.addEventListener('touchstart', (e) => this.handleMovementJoystickStart(e), { passive: false });
  this.movementJoystickContainer.addEventListener('touchmove', (e) => this.handleMovementJoystickMove(e), { passive: false });
  this.movementJoystickContainer.addEventListener('touchend', (e) => this.handleMovementJoystickEnd(e), { passive: false });
  this.movementJoystickContainer.addEventListener('touchcancel', (e) => this.handleMovementJoystickEnd(e), { passive: false });
  
  this.lookJoystickContainer.addEventListener('touchstart', (e) => this.handleLookJoystickStart(e), { passive: false });
  this.lookJoystickContainer.addEventListener('touchmove', (e) => this.handleLookJoystickMove(e), { passive: false });
  this.lookJoystickContainer.addEventListener('touchend', (e) => this.handleLookJoystickEnd(e), { passive: false });
  this.lookJoystickContainer.addEventListener('touchcancel', (e) => this.handleLookJoystickEnd(e), { passive: false });
  
  document.addEventListener('contextmenu', (e) => {
    if (this.isVisible) {
      e.preventDefault();
    }
  });
  
  document.addEventListener('touchstart', (e) => {
    if (this.isVisible && 
        e.target.closest('#mobile-controls') && 
        !e.target.closest('.overlay')) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.addEventListener('touchmove', (e) => {
    if (this.isVisible && 
        e.target.closest('#mobile-controls') && 
        !e.target.closest('.overlay')) {
      e.preventDefault();
    }
  }, { passive: false });
  
  window.addEventListener('orientationchange', () => {
    setTimeout(() => this.handleOrientationChange(), 100);
  });
  
  window.addEventListener('resize', () => {
    if (this.isMobile) {
      this.handleResize();
    }
  });
}
  
createLandscapePrompt() {
  if (window.innerHeight > window.innerWidth) {
    const prompt = document.createElement('div');
    prompt.id = 'landscape-prompt';
    prompt.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Courier New', monospace;
      z-index: 9999;
      text-align: center;
    `;
    
    prompt.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 20px;">📱 ↻</div>
      <div style="font-size: 18px; margin-bottom: 10px;">Please rotate your device</div>
      <div style="font-size: 14px;">This game works best in landscape mode</div>
    `;
    
    document.body.appendChild(prompt);
    
    const checkOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        prompt.remove();
      } else {
        setTimeout(checkOrientation, 500);
      }
    };
    setTimeout(checkOrientation, 1000);
  }
}
forceLandscapeOrientation() {
  if (!this.isMobile) return;
  
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch((error) => {
      console.log('Could not lock orientation:', error);
      this.applyCSSLandscapeForce();
    });
  } else {
    this.applyCSSLandscapeForce();
  }
}

applyCSSLandscapeForce() {
  if (window.innerHeight > window.innerWidth) {
    console.log('Forcing landscape via CSS rotation');
    
    document.body.style.transformOrigin = 'left top';
    document.body.style.transform = 'rotate(90deg) translateY(-100vh)';
    document.body.style.position = 'absolute';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.width = '100vh';
    document.body.style.height = '100vw';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      if (window.renderer) {
        window.renderer.setSize(window.innerHeight, window.innerWidth);
        if (window.camera) {
          window.camera.aspect = window.innerHeight / window.innerWidth;
          window.camera.updateProjectionMatrix();
        }
      }
    }, 100);
  }
}

handleCrouch() {
  console.log('Mobile Crouch button pressed');
  
  this.movementState.crouching = !this.movementState.crouching;
  this.updateButtonState(this.crouchButton, this.movementState.crouching);
  
  if (window.keys) {
    window.keys['b'] = true;
    setTimeout(() => {
      if (window.keys) window.keys['b'] = false;
    }, 100);
  }
  
  if (this.characterSystem && this.characterSystem.updateMovementState) {
    const currentMovementInput = {
      forward: this.movementState.forward,
      backward: this.movementState.backward,
      left: this.movementState.left,
      right: this.movementState.right,
      sprinting: this.movementState.sprinting,
      crouching: this.movementState.crouching,
      moving: this.movementState.moving
    };
    
    this.characterSystem.updateMovementState(currentMovementInput);
    console.log('Mobile crouch state updated:', this.movementState.crouching);
  } else {
    console.error('Character system not available for mobile crouch');
  }
}

handleEagleVision() {
  console.log('Mobile V button pressed - handleEagleVision called');
  
  if (window.handleEagleVision) {
    window.handleEagleVision();
    
    this.updateButtonState(this.detectButton, true);
    
    setTimeout(() => {
      this.updateButtonState(this.detectButton, false);
    }, 500);
  } else {
    console.error('window.handleEagleVision not available');
  }
  
  if (window.keys) {
    window.keys['v'] = true;
    setTimeout(() => {
      if (window.keys) window.keys['v'] = false;
    }, 100);
  }
}

  handleMovementJoystickStart(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (this.movementJoystick.active) return;
  
  const touch = e.changedTouches[0];
  const rect = this.movementJoystickContainer.getBoundingClientRect();
  
  this.movementJoystick.active = true;
  this.movementJoystick.touchId = touch.identifier;
  this.movementJoystick.center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  this.movementJoystick.startPos = {
    x: touch.clientX,
    y: touch.clientY
  };
  
  console.log('Movement joystick started with touch ID:', touch.identifier);
  this.updateMovementJoystickVisuals();
}

  handleMovementJoystickMove(e) {
  if (!this.movementJoystick.active) return;
  e.preventDefault();
  e.stopPropagation();
  
  let controllingTouch = null;
  
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === this.movementJoystick.touchId) {
      controllingTouch = e.touches[i];
      break;
    }
  }
  
  if (!controllingTouch) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.movementJoystick.touchId) {
        controllingTouch = e.changedTouches[i];
        break;
      }
    }
  }
  
  if (!controllingTouch) {
    console.log('Movement: Could not find controlling touch');
    return;
  }
  
  const deltaX = controllingTouch.clientX - this.movementJoystick.center.x;
  const deltaY = controllingTouch.clientY - this.movementJoystick.center.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const clampedDistance = Math.min(distance, this.movementJoystick.maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  
  this.movementJoystick.currentPos = {
    x: Math.cos(angle) * clampedDistance,
    y: Math.sin(angle) * clampedDistance
  };
  
  const deadzone = 10;
  if (clampedDistance > deadzone) {
    const normalizedX = this.movementJoystick.currentPos.x / this.movementJoystick.maxDistance;
    const normalizedY = this.movementJoystick.currentPos.y / this.movementJoystick.maxDistance;
    
    this.movementState.forward = normalizedY < -0.3;
    this.movementState.backward = normalizedY > 0.3;
    this.movementState.left = normalizedX < -0.3;
    this.movementState.right = normalizedX > 0.3;
    this.movementState.moving = true;
  } else {
    this.movementState.forward = false;
    this.movementState.backward = false;
    this.movementState.left = false;
    this.movementState.right = false;
    this.movementState.moving = false;
  }
    
  this.updateMovementJoystickVisuals();
  this.updateCharacterMovement();
}
handleInspect() {
  console.log('Mobile J button pressed - handleInspect called');
  
  const gameStarted = window.gameStarted || (typeof gameStarted !== 'undefined' ? gameStarted : false);
  
  if (!gameStarted) {
    console.log('Game not started, ignoring J button');
    return;
  }
  
  if (window.overlays?.isPaperReadingMode() || 
      window.inventorySystem?.isOpen || 
      window.modelInfoViewer?.isViewerActive()) {
    console.log('Overlay open, ignoring J button');
    return;
  }
  
  if (window.keys) {
    window.keys['j'] = true;
    setTimeout(() => {
      if (window.keys) window.keys['j'] = false;
    }, 100);
  }
  
  if (window.handleModelInspect) {
    console.log('Calling desktop model inspect function');
    window.handleModelInspect();
  } else {
    console.error('handleModelInspect function not available');
  }
}

handleMovementJoystickEnd(e) {
  if (!this.movementJoystick.active) return;
  e.preventDefault();
  e.stopPropagation();
  
  let isControllingTouch = false;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === this.movementJoystick.touchId) {
      isControllingTouch = true;
      break;
    }
  }
  
  if (!isControllingTouch) return;
  
  this.movementJoystick.active = false;
  this.movementJoystick.touchId = null;
  this.movementJoystick.currentPos = { x: 0, y: 0 };
  
  this.movementState.forward = false;
  this.movementState.backward = false;
  this.movementState.left = false;
  this.movementState.right = false;
  this.movementState.moving = false;
  
  console.log('Movement joystick ended');
  this.updateMovementJoystickVisuals();
  this.updateCharacterMovement();
}

  
  handleLookJoystickStart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.lookJoystick.active) return;
    
    const touch = e.changedTouches[0];
    const rect = this.lookJoystickContainer.getBoundingClientRect();
    
    this.lookJoystick.active = true;
    this.lookJoystick.touchId = touch.identifier;
    this.lookJoystick.center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.lookJoystick.startPos = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    console.log('Look joystick started with touch ID:', touch.identifier);
    this.updateLookJoystickVisuals();
  }

  updateContinuousLook() {
    if (!this.lookJoystick.active) return;
    
    const distance = Math.sqrt(
      this.lookJoystick.currentPos.x * this.lookJoystick.currentPos.x + 
      this.lookJoystick.currentPos.y * this.lookJoystick.currentPos.y
    ) / this.lookJoystick.maxDistance;
    
    if (distance > 0.2) { 
      const normalizedX = this.lookJoystick.currentPos.x / this.lookJoystick.maxDistance;
      const normalizedY = this.lookJoystick.currentPos.y / this.lookJoystick.maxDistance;
      
      const speedMultiplier = Math.pow(distance, 1.5);
      
      const baseHorizontalSpeed = 0.06;
      const baseVerticalSpeed = 0.04;
      
      const rotationSpeedX = normalizedX * baseHorizontalSpeed * speedMultiplier;
      const rotationSpeedY = normalizedY * baseVerticalSpeed * speedMultiplier;
      
      if (typeof window.targetRotationY !== 'undefined') {
        window.targetRotationY -= rotationSpeedX;
      }
      
      if (typeof window.currentRotationX !== 'undefined') {
        window.currentRotationX -= rotationSpeedY;
        window.currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, window.currentRotationX));
      }
    }
  }
update(deltaTime) {
    this.updateContinuousLook();
  }

  handleLookJoystickMove(e) {
  if (!this.lookJoystick.active) return;
  e.preventDefault();
  e.stopPropagation();
  
  let controllingTouch = null;
  
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === this.lookJoystick.touchId) {
      controllingTouch = e.touches[i];
      break;
    }
  }
  
  if (!controllingTouch) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookJoystick.touchId) {
        controllingTouch = e.changedTouches[i];
        break;
      }
    }
  }
  
  if (!controllingTouch) {
    console.log('Look: Could not find controlling touch');
    return;
  }
  
  const rect = this.lookJoystickContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const deltaX = controllingTouch.clientX - centerX;
  const deltaY = controllingTouch.clientY - centerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const clampedDistance = Math.min(distance, this.lookJoystick.maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  
  this.lookJoystick.currentPos = {
    x: Math.cos(angle) * clampedDistance,
    y: Math.sin(angle) * clampedDistance
  };
  
  const deadzone = 15;
  if (clampedDistance > deadzone) {
    const normalizedX = this.lookJoystick.currentPos.x / this.lookJoystick.maxDistance;
    const normalizedY = this.lookJoystick.currentPos.y / this.lookJoystick.maxDistance;
    
    const speedMultiplier = Math.pow(clampedDistance / this.lookJoystick.maxDistance, 1.5);
    
    const baseHorizontalSpeed = 0.08;
    const baseVerticalSpeed = 0.05;
    
    const rotationSpeedX = normalizedX * baseHorizontalSpeed * speedMultiplier;
    const rotationSpeedY = normalizedY * baseVerticalSpeed * speedMultiplier;
    
    if (typeof window.targetRotationY !== 'undefined') {
      window.targetRotationY -= rotationSpeedX;
      console.log('Updating targetRotationY:', window.targetRotationY);
    } else {
      console.warn('window.targetRotationY is undefined!');
    }
    
    if (typeof window.currentRotationX !== 'undefined') {
      window.currentRotationX -= rotationSpeedY;
      window.currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, window.currentRotationX));
      console.log('Updating currentRotationX:', window.currentRotationX);
    } else {
      console.warn('window.currentRotationX is undefined!');
    }
    
    console.log('Look rotation applied:', {
      normalizedX: normalizedX.toFixed(2),
      normalizedY: normalizedY.toFixed(2),
      rotationSpeedX: rotationSpeedX.toFixed(3),
      rotationSpeedY: rotationSpeedY.toFixed(3),
      targetRotationY: window.targetRotationY?.toFixed(2),
      currentRotationX: window.currentRotationX?.toFixed(2)
    });
  }
  
  this.updateLookJoystickVisuals();
}
  
  handleLookJoystickEnd(e) {
    if (!this.lookJoystick.active) return;
    e.preventDefault();
    e.stopPropagation();
    
    let isControllingTouch = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookJoystick.touchId) {
        isControllingTouch = true;
        break;
      }
    }
    
    if (!isControllingTouch) return;
    
    this.lookJoystick.active = false;
    this.lookJoystick.touchId = null;
    this.lookJoystick.currentPos = { x: 0, y: 0 };
    
    console.log('Look joystick ended');
    this.updateLookJoystickVisuals();
  }
  
  updateMovementJoystickVisuals() {
    const knobX = this.movementJoystick.currentPos.x;
    const knobY = this.movementJoystick.currentPos.y;
    
    this.movementJoystickKnob.style.transform = 
      `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    if (this.movementJoystick.active) {
      this.movementJoystickKnob.style.background = 'rgba(0, 255, 0, 1)';
      this.movementJoystickBase.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
      this.movementJoystickKnob.style.background = 'rgba(0, 255, 0, 0.8)';
      this.movementJoystickBase.style.background = 'rgba(255, 255, 255, 0.1)';
    }
  }
  
  updateLookJoystickVisuals() {
    const knobX = this.lookJoystick.currentPos.x;
    const knobY = this.lookJoystick.currentPos.y;
    
    this.lookJoystickKnob.style.transform = 
      `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    if (this.lookJoystick.active) {
      this.lookJoystickKnob.style.background = 'rgba(0, 150, 255, 1)';
      this.lookJoystickBase.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
      this.lookJoystickKnob.style.background = 'rgba(0, 150, 255, 0.8)';
      this.lookJoystickBase.style.background = 'rgba(255, 255, 255, 0.1)';
    }
  }
  
  updateButtonState(button, active) {
  if (active) {
    button.style.transform = 'scale(0.9)';
    button.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.5)';
    if (button === this.detectButton) {
      button.style.background = 'rgba(0, 255, 255, 1)'; 
    }
  } else {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    if (button === this.detectButton) {
      button.style.background = 'rgba(0,200,255,0.7)'; 
    }
  }
}
  
  updateCharacterMovement() {
    if (this.characterSystem && this.characterSystem.updateMovementState) {
      this.characterSystem.updateMovementState(this.movementState);
    }
  }
  
  handleJump() {
  console.log('Mobile Jump button pressed');
  
  if (window.keys) {
    window.keys[' '] = true;
    setTimeout(() => {
      if (window.keys) window.keys[' '] = false;
    }, 100);
  }
  
  if (this.characterSystem) {
    if (!window.isJumping) {
      window.isJumping = true;
      window.jumpVelocity = window.jumpForce || 8;
      
      this.characterSystem.forceJumpAnimation();
      this.characterSystem.updateJumpState(false, window.jumpVelocity, true);
      
      console.log('Mobile jump executed');
    } else {
      console.log('Already jumping, ignoring mobile jump');
    }
  } else {
    console.error('Character system not available for mobile jump');
  }
}
  handleInteract() {
  console.log('Mobile E button pressed');
  
  if (window.keys) {
    window.keys['e'] = true;
    setTimeout(() => {
      window.keys['e'] = false;
    }, 100);
  }
  
  try {
    if (window.currentKeyInView && window.inventorySystem) {
      const keyData = window.currentKeyInView.userData.itemData;
      if (window.inventorySystem.addItem(keyData)) {
        const scene = window.scene || document.querySelector('canvas').scene;
        if (scene) scene.remove(window.currentKeyInView);
        if (window.modelLoader && window.modelLoader.models.key === window.currentKeyInView) {
          window.modelLoader.models.key = null;
        }
        if (window.infoWindows && window.infoWindows.windows.key) {
          window.infoWindows.windows.key.style.display = 'none';
        }
        window.currentKeyInView = null;
        document.querySelectorAll('#key-info-temp').forEach(el => el.remove());
      }
      return;
    }
    
    if (window.currentDoorInView && window.inventorySystem) {
      if (window.inventorySystem.useItemOn(window.currentDoorInView)) {
        document.querySelectorAll('#door-info-temp').forEach(el => el.remove());
        window.currentDoorInView = null;
      }
      return;
    }
    
    if (window.currentPaperInView && window.overlays) {
      window.overlays.openPaper();
      return;
    }
    
    if (window.currentScrollInView && window.overlays) {
      window.overlays.openScroll();
      return;
    }
    
    if (window.currentBookInView && window.overlays) {
      window.overlays.openBook();
      return;
    }
    
    if (window.currentTombstoneInView && window.overlays) {
      window.overlays.openTombstone();
      return;
    }
    
    if (window.currentPortalInView) {
      const currentScene = window.currentScene || 'main';
      
      if (currentScene === 'main' && window.currentPortalInView.userData.teleport) {
        if (window.switchToGallery) window.switchToGallery();
        const portalInfo = document.getElementById('portal-info');
        if (portalInfo) portalInfo.style.display = 'none';
        window.currentPortalInView = null;
      } else if (currentScene === 'gallery') {
        if (window.currentPortalInView.userData.type === 'return-portal') {
          if (window.switchToMain) window.switchToMain();
          const portalInfo = document.getElementById('portal-info');
          if (portalInfo) portalInfo.style.display = 'none';
          window.currentPortalInView = null;
        } else if (window.currentPortalInView.userData.type === 'gallery-frame') {
          if (window.switchToModelViewer) {
            window.switchToModelViewer(window.currentPortalInView.userData.artIndex);
          }
          const portalInfo = document.getElementById('portal-info');
          if (portalInfo) portalInfo.style.display = 'none';
          window.currentPortalInView = null;
        }
      }
      return;
    }
    
    console.log('No interaction target found');
    
  } catch (error) {
    console.error('Error in mobile interact handler:', error);
    if (window.keys) {
      window.keys['e'] = true;
      setTimeout(() => {
        window.keys['e'] = false;
      }, 100);
    }
  }
}
  
  handleEscape() {
    console.log('Mobile ESC button pressed');
    if (window.openOverlay) {
      window.openOverlay('home');
    }
  }
  
  handleInventory() {
    if (window.keys) {
      window.keys['i'] = true;
      setTimeout(() => {
        window.keys['i'] = false;
      }, 100);
    }
  }
  
handleMap() {
  console.log('Mobile M button pressed');
  
  if (window.minimap && typeof window.minimap.toggleFullscreen === 'function') {
    console.log('Toggling minimap fullscreen');
    window.minimap.toggleFullscreen();
  } else {
    console.error('Minimap not available or toggleFullscreen method missing');
  }
  
  if (window.keys) {
    window.keys['m'] = true;
    setTimeout(() => {
      window.keys['m'] = false;
    }, 100);
  }
}
  
  handleOrientationChange() {
    console.log('Orientation changed');
    this.handleResize();
  }
  
  handleResize() {
  if (window.handleWindowResize) {
    window.handleWindowResize();
  }
  
  if (window.refitSceneToScreen) {
    setTimeout(() => {
      window.refitSceneToScreen();
    }, 100);
  }
  
  const isLandscape = window.innerWidth > window.innerHeight;
  
  if (isLandscape) {
    this.movementJoystickContainer.style.bottom = '60px';
    this.movementJoystickContainer.style.left = '60px';
    this.lookJoystickContainer.style.bottom = '60px';
    this.lookJoystickContainer.style.right = '60px';
    this.buttonContainer.style.top = '60px';
    this.buttonContainer.style.right = '20px';
  } else {
    this.movementJoystickContainer.style.bottom = '100px';
    this.movementJoystickContainer.style.left = '40px';
    this.lookJoystickContainer.style.bottom = '100px';
    this.lookJoystickContainer.style.right = '40px';
    this.buttonContainer.style.top = '200px';
    this.buttonContainer.style.right = '20px';
  }
}
show() {
  if (this.isMobile && this.container) {
    const overlaysVisible = document.querySelector('.overlay[style*="display: block"]') || 
                           document.querySelector('.overlay.visible');
    
    if (!overlaysVisible) {
      this.container.style.display = 'block';
      this.isVisible = true;
      console.log('Mobile controls shown');
    }
  }
}

hide() {
  if (this.container) {
    this.container.style.display = 'none';
    this.isVisible = false;
    console.log('Mobile controls hidden');
  }
}
  
  isMobileDevice() {
    return this.isMobile;
  }
  
  isControlsVisible() {
    return this.isVisible;
  }
  
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

debugTouchInfo(e, joystickName) {
  console.log(`${joystickName} touches:`, {
    touchesLength: e.touches.length,
    changedTouchesLength: e.changedTouches.length,
    allTouchIds: Array.from(e.touches).map(t => t.identifier),
    changedTouchIds: Array.from(e.changedTouches).map(t => t.identifier),
    movementActive: this.movementJoystick.active,
    movementTouchId: this.movementJoystick.touchId,
    lookActive: this.lookJoystick.active,
    lookTouchId: this.lookJoystick.touchId
  });
}

}
export { MobileControls };