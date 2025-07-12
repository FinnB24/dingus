import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class CharacterSystem {
  constructor(scene, loadingManager, portfolioAnalytics) {
    this.scene = scene;
    this.loadingManager = loadingManager;
    this.portfolioAnalytics = portfolioAnalytics;
    this.headBone = null; 
    this.jumpState = 'grounded';
    this.jumpStartTime = 0;
    this.landingTimer = 0;
    this.wasGrounded = true;
    this.character = null;
    this.characterGroup = new THREE.Group();
    this.mixer = null;
    this.animations = new Map();
    this.currentState = 'idle';
    this.currentAction = null;
    this.isLoaded = false;
    this.loadingProgress = 0;
    this.usesFallback = false;
    
    this.movementState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprinting: false,
      crouching: false,
      moving: false
    };
    
    this.loader = new GLTFLoader(this.loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(dracoLoader);
    this.characterGroup.position.set(0, 0, 5);
    this.scene.add(this.characterGroup);
  }
  
  async loadCharacter() {
  try {
    console.log('Attempting to load Manny character...');
    const baseCharacter = await this.loadModelWithFallback('./characters/SKM_Manny.glb');
    
    if (baseCharacter) {
      console.log('Base character loaded!');
      this.character = baseCharacter.scene;
      this.character.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      const bbox = new THREE.Box3().setFromObject(this.character);
      const size = bbox.getSize(new THREE.Vector3());

      if (size.y < 0.5) {
        this.character.scale.set(100, 100, 100);
      } else if (size.y > 10) {
        this.character.scale.set(0.01, 0.01, 0.01);
      } else {
        this.character.scale.set(1, 1, 1);
      }
      
      this.character.position.set(0, 0, 0);
      this.character.rotation.y = Math.PI;
      this.characterGroup.add(this.character);
      this.mixer = new THREE.AnimationMixer(this.character);
      await this.loadAvailableAnimations();
      this.playAnimation('idle', 'MM_Unarmed_Idle_Ready');
      console.log('Character system ready with essential animations:', this.animations.size);
      this.usesFallback = false;
      setTimeout(() => {
        this.headBone = this.findHeadBone();
        if (this.headBone) {
          console.log('Head bone found and ready for camera mounting');
        }
      }, 100);
      
    } else {
      throw new Error('Failed to load base character model');
    }
    
    this.isLoaded = true;
    
    if (this.portfolioAnalytics) {
      this.portfolioAnalytics.trackInteraction('character', 'loaded', {
        animationCount: this.animations.size,
        usesFallback: this.usesFallback
      });
    }
    
  } catch (error) {
    console.warn('Character loading failed, creating fallback:', error);
    this.createFallbackCharacter();
  }
}

  findHeadBone() {
    if (!this.character) return null;
    let headBone = null;
    this.character.traverse((child) => {
      if (child.isBone || child.isObject3D) {
        const name = child.name.toLowerCase();
        if (name.includes('head') || 
            name.includes('mixamorig_head') ||
            name.includes('neck') ||
            name === 'head_01' ||
            name === 'head') {
          headBone = child;
        }
      }
    });
    
    if (!headBone) {
      return this.character;
    }
    return headBone;
  }

  getHeadWorldPosition() {
    if (!this.headBone) {
      this.headBone = this.findHeadBone();
    }
    
    if (this.headBone) {
      const worldPosition = new THREE.Vector3();
      this.headBone.getWorldPosition(worldPosition);
      return worldPosition;
    }
    
    const fallbackPosition = this.characterGroup.position.clone();
    fallbackPosition.y += 1.7;
    return fallbackPosition;
  }

  async loadModelWithFallback(url) {
    try {
      return await this.loadModel(url);
    } catch (error) {
      return null;
    }
  }
  
  async loadAvailableAnimations() {
  const essentialAnimations = [
    './characters/idle/MM_Unarmed_Idle_Ready.glb',
    './characters/walk/MM_Unarmed_Walk_Fwd.glb',
    './characters/run/MM_Unarmed_Jog_Fwd.glb',
    './characters/jump/MM_Jump.glb',
    './characters/jump/MM_Fall_Loop.glb',
    './characters/jump/MM_Land.glb'
  ];
  
  const remainingAnimations = [
    './characters/idle/MM_Unarmed_IdleBreak_Fidget.glb',
    './characters/idle/MM_Unarmed_IdleBreak_Scan.glb',
    './characters/idle/MM_Unarmed_Crouch_Idle.glb',

    './characters/walk/MM_Unarmed_Walk_Bwd.glb',
    './characters/walk/MM_Unarmed_Walk_Left.glb',
    './characters/walk/MM_Unarmed_Walk_Right.glb',
    './characters/walk/MM_Unarmed_Walk_Fwd_Left.glb',
    './characters/walk/MM_Unarmed_Walk_Fwd_Right.glb',
    './characters/walk/MM_Unarmed_Walk_Bwd_Left.glb',
    './characters/walk/MM_Unarmed_Walk_Bwd_Right.glb',
    
    './characters/run/MM_Unarmed_Jog_Bwd.glb',
    './characters/run/MM_Unarmed_Jog_Left.glb',
    './characters/run/MM_Unarmed_Jog_Right.glb',
    './characters/run/MM_Unarmed_Jog_Fwd_Left.glb',
    './characters/run/MM_Unarmed_Jog_Fwd_Right.glb',
    './characters/run/MM_Unarmed_Jog_Bwd_left.glb',
    './characters/run/MM_Unarmed_Jog_Bwd_Right.glb',
    
    './characters/crouch/MM_Unarmed_Crouch_Walk_Fwd.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Bwd.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Left.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Right.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Fwd_Left.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Fwd_Right.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Bwd_Left.glb',
    './characters/crouch/MM_Unarmed_Crouch_Walk_Bwd_Right.glb',
    './characters/crouch/MM_Unarmed_Crouch_TurnLeft_90.glb',
    './characters/crouch/MM_Unarmed_Crouch_TurnRight_90.glb'
  ];
  
  console.log(`Loading ${essentialAnimations.length} essential animations first...`);
  let loadedCount = 0;
  
  for (let i = 0; i < essentialAnimations.length; i++) {
    const file = essentialAnimations[i];
    const gltf = await this.loadModelWithFallback(file);
    
    if (gltf && gltf.animations && gltf.animations.length > 0) {
      const animationName = this.getAnimationName(file);
      this.animations.set(animationName, gltf.animations[0]);
      loadedCount++;
      console.log(`Loaded essential animation: ${animationName}`);
    } else {
      console.warn(`Failed to load essential animation: ${file}`);
    }
    
    this.loadingProgress = ((i + 1) / (essentialAnimations.length + remainingAnimations.length)) * 100;
    if (i < essentialAnimations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`Essential animations loaded: ${loadedCount}/${essentialAnimations.length}`);
  console.log('Available essential animations:', Array.from(this.animations.keys()));
  setTimeout(() => {
    this.loadRemainingAnimations(remainingAnimations, loadedCount);
  }, 1000);
  
  return Promise.resolve();
}

async loadRemainingAnimations(remainingAnimations, initialLoadedCount) {
  console.log(`Loading ${remainingAnimations.length} remaining animations in background`);
  let loadedCount = initialLoadedCount;
  
  for (let i = 0; i < remainingAnimations.length; i++) {
    const file = remainingAnimations[i];
    const gltf = await this.loadModelWithFallback(file);
    
    if (gltf && gltf.animations && gltf.animations.length > 0) {
      const animationName = this.getAnimationName(file);
      this.animations.set(animationName, gltf.animations[0]);
      loadedCount++;
      console.log(`Background loaded: ${animationName} (${loadedCount} total)`);
    } else {
      console.warn(`Failed to background load: ${file}`);
    }
    
    this.loadingProgress = ((loadedCount) / (remainingAnimations.length + 6)) * 100;
    if (i < remainingAnimations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  
  console.log(`ANIMATIONS LOADED: ${loadedCount} total`);
  console.log('Final animation list:', Array.from(this.animations.keys()).sort());
  
  const problemAnimations = [
    'MM_Unarmed_Crouch_Walk_Fwd_Left',
    'MM_Unarmed_Crouch_Walk_Fwd_Right', 
    'MM_Unarmed_Walk_Bwd_Right',
    'MM_Unarmed_Jog_Bwd_Right',
    'MM_Unarmed_Crouch_Walk_Bwd_Right'
  ];

  console.log('CHECKING PROBLEM ANIMATIONS:');
  problemAnimations.forEach(name => {
    console.log(`  ${name}: ${this.animations.has(name) ? 'EXISTS' : 'MISSING'}`);
  });
   
  console.log('JUMP ANIMATIONS CHECK:');
  const jumpAnimations = ['MM_Jump', 'MM_Fall_Loop', 'MM_Land'];
  jumpAnimations.forEach(name => {
    console.log(`  ${name}: ${this.animations.has(name) ? 'EXISTS' : 'MISSING'}`);
  });
  
  if (typeof this.onAllAnimationsLoaded === 'function') {
    this.onAllAnimationsLoaded();
  }
}
  
  loadModel(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
  }
  
  getAnimationName(filePath) {
    return filePath.split('/').pop().replace('.glb', '');
  }
  
  createFallbackCharacter() {
    this.characterGroup.clear();
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ff88,
      shininess: 60 
    });
    const fallbackCharacter = new THREE.Mesh(geometry, material);
    fallbackCharacter.castShadow = true;
    fallbackCharacter.receiveShadow = true;
    fallbackCharacter.position.set(0, 1.1, 0);
    this.characterGroup.add(fallbackCharacter);
    this.isLoaded = true;
    this.usesFallback = true;
  }
  
  updateMovementState(newMovementState) {
    const previousMovementState = { ...this.movementState };
    this.movementState = { ...newMovementState };
    if (!this.isLoaded) return;
    
    if (this.mixer && this.animations.size > 0) {
      const newState = this.determineAnimationState();
      const stateChanged = newState !== this.currentState;
      const directionChanged = this.hasDirectionChanged(previousMovementState, this.movementState);
      
      if (stateChanged) {
        this.transitionToState(newState);
      } else if (directionChanged && (newState === 'walk' || newState === 'run' || newState === 'crouchWalk')) {
        this.transitionToState(newState);
      }
    }
    
    if (this.usesFallback && this.characterGroup.children.length > 0) {
      const fallbackCharacter = this.characterGroup.children[0];
      if (fallbackCharacter && fallbackCharacter.material) {
        if (this.jumpState === 'jumping') {
          fallbackCharacter.material.color.setHex(0x00ffff);
        } else if (this.jumpState === 'falling') {
          fallbackCharacter.material.color.setHex(0xffff00);
        } else if (this.jumpState === 'landing') {
          fallbackCharacter.material.color.setHex(0xff00ff);
        } else if (this.movementState.crouching) {
          fallbackCharacter.material.color.setHex(0xff6600);
        } else if (this.movementState.sprinting) {
          fallbackCharacter.material.color.setHex(0xff0066);
        } else if (this.movementState.moving) {
          fallbackCharacter.material.color.setHex(0x0066ff);
        } else {
          fallbackCharacter.material.color.setHex(0x00ff88);
        }
      }
    }
  }

  hasDirectionChanged(oldState, newState) {
    return (
      oldState.forward !== newState.forward ||
      oldState.backward !== newState.backward ||
      oldState.left !== newState.left ||
      oldState.right !== newState.right
    );
  }
  
  determineAnimationState() {
    const { moving, sprinting, crouching } = this.movementState;

    if (this.jumpState === 'jumping') {
      return 'jump';
    }
    if (this.jumpState === 'falling') {
      return 'fall';
    }
    if (this.jumpState === 'landing') {
      return 'land';
    }
    
    if (crouching) {
      return moving ? 'crouchWalk' : 'crouch';
    }
    
    if (moving) {
      return sprinting ? 'run' : 'walk';
    }
    return 'idle';
  }
  
  transitionToState(newState) {
    this.currentState = newState;
    
    let animationName;
    
    switch (newState) {
      case 'idle':
        animationName = this.findAvailableAnimation(['MM_Unarmed_Idle_Ready', 'MM_Unarmed_IdleBreak_Fidget']);
        break;
        
      case 'walk':
        animationName = this.getDirectionalAnimation('walk');
        break;
        
      case 'run':
        animationName = this.getDirectionalAnimation('run');
        break;
        
      case 'crouch':
        animationName = this.findAvailableAnimation([
          'MM_Unarmed_Crouch_Idle',
          'MM_Unarmed_Crouch_Walk_Fwd',
          'MM_Unarmed_Idle_Ready'
        ]);
        break;
        
      case 'crouchWalk':
        animationName = this.getDirectionalAnimation('crouch');
        break;
        
      case 'jump':
        animationName = this.getDirectionalAnimation('jump');
        break;
        
      case 'fall':
        animationName = this.getDirectionalAnimation('fall');
        break;
        
      case 'land':
        animationName = this.getDirectionalAnimation('land');
        break;
        
      default:
        animationName = this.findAvailableAnimation(['MM_Unarmed_Idle_Ready']);
    }
    
    if (animationName) {
      this.playAnimation(newState, animationName);
    }
  }
  
  findAvailableAnimation(preferredNames) {
    for (const name of preferredNames) {
      if (this.animations.has(name)) {
        return name;
      }
    }
    
    if (this.animations.size > 0) {
      return this.animations.keys().next().value;
    }
    
    return null;
  }

  updateJumpState(isGrounded, jumpVelocity, isJumping) {
    const now = performance.now();
    
    if (this.jumpState === 'jumping' && !isJumping && jumpVelocity <= 0) {
    }
    else if (!isGrounded && jumpVelocity <= 0 && this.jumpState === 'jumping') {
      this.jumpState = 'falling';
      this.transitionToState('fall');
    }
    else if (isGrounded && !this.wasGrounded && this.jumpState !== 'grounded') {
      this.jumpState = 'landing';
      this.landingTimer = now;
      this.transitionToState('land');
    }
    else if (this.jumpState === 'landing' && (now - this.landingTimer) > 300) {
      this.jumpState = 'grounded';
    }
    else if (isGrounded && this.jumpState !== 'landing') {
      this.jumpState = 'grounded';
    }
    
    this.wasGrounded = isGrounded;
  }

  forceJumpAnimation() {
    this.jumpState = 'jumping';
    this.jumpStartTime = performance.now();
    
    this.transitionToState('jump');
    
    const jumpAnimationName = this.getDirectionalAnimation('jump');
    if (jumpAnimationName) {
      this.playAnimation('jump', jumpAnimationName);
    }
  }

  getDirectionalAnimation(type) {
    const { forward, backward, left, right, sprinting, crouching } = this.movementState;
    
    let animationName = null;

    if (type === 'jump') {
      animationName = 'MM_Jump';
    }
    else if (type === 'fall') {
      animationName = 'MM_Fall_Loop';
    }
    else if (type === 'land') {
      animationName = 'MM_Land';
    }
    else if (crouching && sprinting && forward && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd_Right';
    }
    else if (crouching && sprinting && forward && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd_Left';
    }
    else if (crouching && sprinting && backward && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd_Left';
    }
    else if (crouching && sprinting && backward && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd_Right';
    }
    else if (crouching && sprinting && forward) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd';
    }
    else if (crouching && sprinting && backward) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd';
    }
    else if (crouching && sprinting && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Left';
    }
    else if (crouching && sprinting && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Right';
    }
    else if (crouching && forward && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd_Right';
    }
    else if (crouching && forward && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd_Left';
    }
    else if (crouching && backward && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd_Left';
    }
    else if (crouching && backward && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd_Right';
    }
    else if (crouching && forward) {
      animationName = 'MM_Unarmed_Crouch_Walk_Fwd';
    }
    else if (crouching && backward) {
      animationName = 'MM_Unarmed_Crouch_Walk_Bwd';
    }
    else if (crouching && left) {
      animationName = 'MM_Unarmed_Crouch_Walk_Left';
    }
    else if (crouching && right) {
      animationName = 'MM_Unarmed_Crouch_Walk_Right';
    }
    else if (sprinting && forward && left) {
      animationName = 'MM_Unarmed_Jog_Fwd_Left';
    }
    else if (sprinting && forward && right) {
      animationName = 'MM_Unarmed_Jog_Fwd_Right';
    }
    else if (sprinting && backward && left) {
      animationName = 'MM_Unarmed_Jog_Bwd_Left';
    }
    else if (sprinting && backward && right) {
      animationName = 'MM_Unarmed_Jog_Bwd_Right';
    }
    else if (sprinting && forward) {
      animationName = 'MM_Unarmed_Jog_Fwd';
    }
    else if (sprinting && backward) {
      animationName = 'MM_Unarmed_Jog_Bwd';
    }
    else if (sprinting && left) {
      animationName = 'MM_Unarmed_Jog_Left';
    }
    else if (sprinting && right) {
      animationName = 'MM_Unarmed_Jog_Right';
    }
    else if (forward && left) {
      animationName = 'MM_Unarmed_Walk_Fwd_Left';
    }
    else if (forward && right) {
      animationName = 'MM_Unarmed_Walk_Fwd_Right';
    }
    else if (backward && left) {
      animationName = 'MM_Unarmed_Walk_Bwd_Left';
    }
    else if (backward && right) {
      animationName = 'MM_Unarmed_Walk_Bwd_Right';
    }
    else if (forward) {
      animationName = 'MM_Unarmed_Walk_Fwd';
    }
    else if (backward) {
      animationName = 'MM_Unarmed_Walk_Bwd';
    }
    else if (left) {
      animationName = 'MM_Unarmed_Walk_Left';
    }
    else if (right) {
      animationName = 'MM_Unarmed_Walk_Right';
    }
    
    if (animationName && this.animations.has(animationName)) {
      return animationName;
    }
    
    if (animationName) {
      const alternativeNames = [
        animationName.replace('_Right', '_right'),
        animationName.replace('_Left', '_left'),
        animationName.replace('Bwd_', 'bwd_'),
        animationName.replace('Fwd_', 'fwd_')
      ];
      
      for (const altName of alternativeNames) {
        if (this.animations.has(altName)) {
          return altName;
        }
      }
    }
    
    const fallbackName = 'MM_Unarmed_Walk_Fwd';
    if (this.animations.has(fallbackName)) {
      return fallbackName;
    }
    
    return this.findAvailableAnimation([animationName, fallbackName]);
  }
  
  playAnimation(state, animationName) {
    if (!this.mixer) {
      return;
    }
    
    if (!animationName) {
      return;
    }
    
    if (!this.animations.has(animationName)) {
      return;
    }

    if (this.currentAction) {
      this.currentAction.fadeOut(0.2);
    }

    const clip = this.animations.get(animationName);
    const clonedClip = clip.clone();
    
    clonedClip.tracks = clonedClip.tracks.filter(track => {
      const trackName = track.name.toLowerCase();
      const isRootPosition = trackName.includes('.position') && 
                            (trackName.includes('hips') || 
                             trackName.includes('root') || 
                             trackName.includes('mixamorig_hips'));
      
      if (isRootPosition) {
        return false;
      }
      return true;
    });
    
    const action = this.mixer.clipAction(clonedClip);
    
    action.reset();
    action.fadeIn(0.2);
    action.play();
    
    if (state === 'jump' || state === 'land') {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat);
    }
    
    this.currentAction = action;
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
      
      if (this.character && !this.usesFallback) {
        this.character.position.set(0, 0, 0);
      }
    }
    
    if (this.characterGroup && window.targetRotationY !== undefined) {
      this.characterGroup.rotation.y = window.targetRotationY;
    }
    
    if (this.usesFallback && this.movementState.moving && this.characterGroup.children.length > 0) {
      const fallbackCharacter = this.characterGroup.children[0];
      if (fallbackCharacter) {
        fallbackCharacter.position.y = 1.1 + Math.sin(Date.now() * 0.01) * 0.05;
      }
    } else if (this.usesFallback && this.characterGroup.children.length > 0) {
      const fallbackCharacter = this.characterGroup.children[0];
      if (fallbackCharacter) {
        fallbackCharacter.position.y = 1.1;
      }
    }
  }
  
  getCharacterGroup() {
    return this.characterGroup;
  }
  
  setPosition(x, y, z) {
    this.characterGroup.position.set(x, y, z);
  }
  
  getPosition() {
    return this.characterGroup.position.clone();
  }
  
  setRotation(y) {
    this.characterGroup.rotation.y = y;
  }
  
  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    if (this.characterGroup) {
      this.scene.remove(this.characterGroup);
    }
    
    this.animations.clear();
  }
}

export { CharacterSystem }; 
