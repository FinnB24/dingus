import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class ModelLoader {
  constructor(scene, loadingManager = null, worldBuilder = null) {
    this.scene = scene;
    this.loadingManager = loadingManager || new THREE.LoadingManager();
    this.worldBuilder = worldBuilder;
    this.loader = new GLTFLoader(this.loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(dracoLoader);
    this.modelCache = new Map();
    this.loadedModels = 0;
    this.totalModelsToLoad = 0;
    this.models = {
      church: null,
      grave: null,
      altar: null,
      paper: null,
      crow: null,
      desk: null,
      desk2: null,
      book1: null,
      book2: null,
      scroll: null,
      portal: [],
      key: null,
      door: null
    };
    this.mixers = {
      crow: null
    };
  }
  
  setTotalModelsCount(count) {
    this.totalModelsToLoad = count;
  }
  
  registerModelWithWorldBuilder(modelName, gltf) {
    if (this.worldBuilder) {
      this.worldBuilder.registerModel(modelName, {
        scene: gltf.scene.clone(),
        animations: gltf.animations || []
      });
    }
  }
  
  loadModelOptimized(url, callback, progressCallback, errorCallback) {
    if (this.modelCache.has(url)) {
      callback(this.modelCache.get(url));
      return;
    }
    
    this.loader.load(url, 
      (gltf) => {
        this.modelCache.set(url, gltf);
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

  updateLoadingProgress(progressCallback) {
    this.loadedModels++;
    if (progressCallback) {
      progressCallback(this.loadedModels, this.totalModelsToLoad);
    }
  }
  
  loadChurchModel(inventorySystem) {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'church.glb',
        (gltf) => {
          this.models.church = gltf.scene;
          this.models.church.scale.set(0.1, 0.1, 0.1);
          const box = new THREE.Box3().setFromObject(this.models.church);
          const center = box.getCenter(new THREE.Vector3());
          this.models.church.position.set(0,0,-5
          );
          this.models.church.rotation.set(0, -2*Math.PI/4, 0);
          this.scene.add(this.models.church);
          this.registerModelWithWorldBuilder('church', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadGraveModel(inventorySystem) {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'grave.glb',
        (gltf) => {
          this.models.grave = gltf.scene;
          this.models.grave.scale.set(0.015, 0.015, 0.015);
          const box = new THREE.Box3().setFromObject(this.models.grave);
          const center = box.getCenter(new THREE.Vector3());
          this.models.grave.position.set(16, 0, 10);
          this.models.grave.rotation.set(0, 10, 0);
          this.models.grave.userData = {
            type: 'tombstone',
            interactive: true,
            name: 'Ancient Tombstone'
          };
          
          this.scene.add(this.models.grave);
          this.registerModelWithWorldBuilder('grave', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadAltarModel() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'altar.glb',
        (gltf) => {
          this.models.altar = gltf.scene;
          this.models.altar.scale.set(0.3, 0.3, 0.3);
          const box = new THREE.Box3().setFromObject(this.models.altar);
          const center = box.getCenter(new THREE.Vector3());
          this.models.altar.position.set(
            -15 - center.x * 0.3,
            0,
            -8 - center.z * 0.3
          );
          
          this.models.altar.rotation.set(0, Math.PI/4, 0);
          this.scene.add(this.models.altar);
          this.registerModelWithWorldBuilder('altar', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadPaperModel() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'paper.glb',
        (gltf) => {
          this.models.paper = gltf.scene;
          this.models.paper.scale.set(0.5, 0.5, 0.5);
          const box = new THREE.Box3().setFromObject(this.models.paper);
          const center = box.getCenter(new THREE.Vector3());
          this.models.paper.position.set(22, 1, -5);
          this.models.paper.rotation.set(0, -Math.PI/6, 0);
          
          this.models.paper.userData = {
            type: 'paper',
            interactive: true,
            name: 'Letter'
          };
          
          this.scene.add(this.models.paper);
          this.registerModelWithWorldBuilder('paper', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadKeyModel(inventorySystem) {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'key.glb',
        (gltf) => {
          this.models.key = gltf.scene;
          this.models.key.scale.set(0.005, 0.005, 0.005);
          
          this.models.key.position.set(-10, 3, 5);
          this.models.key.rotation.set(0, Math.PI/4, 0);
          const originalY = this.models.key.position.y;
          this.models.key.userData = {
            type: 'key',
            interactive: true,
            collectible: true,
            name: 'Key',
            animation: {
              originalY: originalY,
              time: 0,
              speed: 0.6,
              amplitude: 0.2,
              rotationSpeed: 0.5
            }
          };
          const itemData = {
            name: 'Key',
            description: 'can unlock something',
            id: 'golden_key'
          };
          
          this.models.key.userData.itemData = itemData;
          if (inventorySystem) {
            inventorySystem.registerCollectibleItem(this.models.key, itemData);
          }
          this.scene.add(this.models.key);
          this.registerModelWithWorldBuilder('key', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }

  loadDoorModel(inventorySystem) {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'door.glb',
        (gltf) => {
          this.models.door = gltf.scene;
          this.models.door.scale.set(0.03, 0.03, 0.03);
          this.models.door.position.set(15, 1, -10);
          this.models.door.rotation.set(0, 0, 0);
          
          this.models.door.userData = {
            type: 'door',
            interactive: true,
            isLocked: true,
            requiredItem: 'Key',
            name: 'Door'
          };
          
          if (inventorySystem) {
            inventorySystem.registerInteractiveObject(this.models.door, 'Key', function(door, item) {
              door.position.z -= 3;
            });
          }
          this.scene.add(this.models.door);
          this.registerModelWithWorldBuilder('door', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadCrowModel() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'crow.glb',
        (gltf) => {
          this.models.crow = gltf.scene;
          this.models.crow.scale.set(1.1, 1.1, 1.1);
          const box = new THREE.Box3().setFromObject(this.models.crow);
          const center = box.getCenter(new THREE.Vector3());
          this.models.crow.position.set(14, 1.4, -18);
          this.models.crow.rotation.set(0, 10, 0);
          this.models.crow.userData = {
            type: 'crow',
            interactive: true,
            name: 'Messenger Crow'
          };
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixers.crow = new THREE.AnimationMixer(this.models.crow);
            
            if (gltf.animations.length > 1) {
              const animation = this.mixers.crow.clipAction(gltf.animations[1]);
              animation.setLoop(THREE.LoopRepeat);
              animation.play();
            } else {
              const firstAnimation = this.mixers.crow.clipAction(gltf.animations[0]);
              firstAnimation.setLoop(THREE.LoopRepeat);
              firstAnimation.play();
            }
          }
          
          this.scene.add(this.models.crow);
          this.registerModelWithWorldBuilder('crow', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadDeskModel() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'desk.glb',
        (gltf) => {
          this.models.desk = gltf.scene;
          this.models.desk.scale.set(0.65, 0.6, 0.65);
          const box = new THREE.Box3().setFromObject(this.models.desk);
          const center = box.getCenter(new THREE.Vector3());
          this.models.desk.position.set(11, -0.1, -18);
          this.models.desk.rotation.set(0, 4.5, 0);
          this.scene.add(this.models.desk);
          this.registerModelWithWorldBuilder('desk', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }

  loadDesk2Model() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'desk2.glb',
        (gltf) => {
          this.models.desk2 = gltf.scene;
          this.models.desk2.scale.set(0.3, 0.3, 0.3);
          const box = new THREE.Box3().setFromObject(this.models.desk2);
          const center = box.getCenter(new THREE.Vector3());
          this.models.desk2.position.set(13.5, -2, -18);
          this.models.desk2.rotation.set(0, 0, 0);
          this.scene.add(this.models.desk2);
          this.registerModelWithWorldBuilder('desk2', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadBook1Model() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'book1.glb',
        (gltf) => {
          this.models.book1 = gltf.scene;
          this.models.book1.scale.set(1.3, 1.3, 1.3);
          const box = new THREE.Box3().setFromObject(this.models.book1);
          const center = box.getCenter(new THREE.Vector3());
          this.models.book1.position.set(11.3, 1.2, -17.9);
          this.models.book1.rotation.set(0, Math.PI/2, 0);
          this.scene.add(this.models.book1);
          this.registerModelWithWorldBuilder('book1', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadBook2Model() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'book2.glb',
        (gltf) => {
          this.models.book2 = gltf.scene;
          this.models.book2.scale.set(0.13, 0.13, 0.13);
          const box = new THREE.Box3().setFromObject(this.models.book2);
          const center = box.getCenter(new THREE.Vector3());
          this.models.book2.position.set(10.2, -0.5, -17.5);
          this.models.book2.rotation.set(-0.4, 0.01, 0);
          this.models.book2.userData = {
            type: 'book',
            interactive: true,
            name: 'Contact Grimoire'
          };
          
          this.scene.add(this.models.book2);
          this.registerModelWithWorldBuilder('book2', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadScrollModel() {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'scroll.glb',
        (gltf) => {
          this.models.scroll = gltf.scene;
          this.models.scroll.scale.set(0.7, 0.7, 0.7);
          
          const box = new THREE.Box3().setFromObject(this.models.scroll);
          const center = box.getCenter(new THREE.Vector3()); 
          this.models.scroll.position.set(13, 1.4, -17.4);
          this.models.scroll.rotation.set(0, Math.PI/2, 0);
          this.models.scroll.userData = {
            type: 'scroll',
            interactive: true,
            name: 'Feedback Scroll'
          };
          
          this.scene.add(this.models.scroll);
          this.registerModelWithWorldBuilder('scroll', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  loadPortalModels(scene, galleryScene) {
    return new Promise((resolve) => {
      this.loadModelOptimized(
        'portal.glb',

        (gltf) => {
          const originalPortal = gltf.scene;

          const returnPortal = originalPortal.clone();
          returnPortal.scale.set(0.5, 0.5, 0.5);
          const box = new THREE.Box3().setFromObject(returnPortal);
          const center = box.getCenter(new THREE.Vector3());
          returnPortal.position.set(
            0 - center.x * 0.5,
            1,
            15 - center.z * 0.5
          );
          returnPortal.rotation.set(0, Math.PI, 0);
          returnPortal.userData = { 
            type: 'return-portal',
            destination: 'MAIN WORLD',
            position: new THREE.Vector3(0, 1, 15)
          };
          galleryScene.add(returnPortal);


          const portalModel = originalPortal.clone();
          portalModel.scale.set(0.5, 0.5, 0.5);
          const portalBox = new THREE.Box3().setFromObject(portalModel);
          const portalCenter = portalBox.getCenter(new THREE.Vector3());
          portalModel.position.set(
            0 - portalCenter.x * 0.5,
            1,
            -12 - portalCenter.z * 0.5
          );
          portalModel.rotation.set(0, 0, 0);
          portalModel.userData = { 
            target: '3d', 
            label: 'gallery1',
            destination: '3d art maybe',
            position: new THREE.Vector3(0, 1, -12),
            teleport: true,
            externalUrl: 'https://finnb24.github.io/space-hub/'
//////////// FOR ACTUAL PORTAL USE, JUST PUT THIS HERE!!    externalUrl: 'https://www.example.com/'
          };
          scene.add(portalModel);

          this.models.portal.push(portalModel);

          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          ctx.font = "bold 16px Montserrat";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 2;
          ctx.fillText('3d art', 64, 24);
          const tex = new THREE.Texture(canvas); 
          tex.needsUpdate = true;
          tex.generateMipmaps = false;
          tex.minFilter = THREE.LinearFilter;
          const textMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 0.5),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
          );
          textMesh.position.set(0, 3.5, -12);
          scene.add(textMesh);
          
          this.registerModelWithWorldBuilder('portal', gltf);
          this.updateLoadingProgress(resolve);
        },
        (xhr) => {
        },
        (error) => {
          this.updateLoadingProgress(resolve);
        }
      );
    });
  }
  
  async loadAllModels(scene, galleryScene, inventorySystem) {
  const criticalModels = [
    () => this.loadKeyModel(inventorySystem),
    () => this.loadDoorModel(inventorySystem)
  ];
  
  const secondaryModels = [
    () => this.loadChurchModel(),
    () => this.loadGraveModel(),
    () => this.loadAltarModel(),
    () => this.loadPaperModel()
  ];
  
  const tertiaryModels = [
    () => this.loadCrowModel(),
    () => this.loadDeskModel(),
    () => this.loadDesk2Model(),
    () => this.loadBook1Model(),
    () => this.loadBook2Model(),
    () => this.loadScrollModel(),
    () => this.loadPortalModels(scene, galleryScene)
  ];
  
  for (const loadFn of criticalModels) {
    await loadFn();
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  for (const loadFn of secondaryModels) {
    await loadFn();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  Promise.all(tertiaryModels.map(fn => fn()));
}
  
  update(dt) {
    if (this.mixers.crow) {
      this.mixers.crow.update(dt);
    }
    
    if (this.models.key && this.models.key.parent) {
      const keyModel = this.models.key;
      const animation = keyModel.userData.animation;
      
      if (animation) {
        animation.time += dt * animation.speed;
        const newY = animation.originalY + Math.sin(animation.time) * animation.amplitude;
        keyModel.position.y = newY;
        keyModel.rotation.y += dt * animation.rotationSpeed;
      }
    }
  }

  getPortalModels() {
    return this.models.portal;
  }
}

export { ModelLoader };
