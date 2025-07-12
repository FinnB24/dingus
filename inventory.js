import * as THREE from 'three';

class InventorySystem {
  constructor(scene, camera, portfolioAnalytics) {
    this.scene = scene;
    this.camera = camera;
    this.portfolioAnalytics = portfolioAnalytics;
    
    this.isOpen = false;
    this.items = [];
    this.selectedItem = null;
    this.selectedSlot = null;
    this.maxSlots = 12;
    
    this.collectibleItems = [];
    this.interactiveObjects = [];
    
    this.inventoryOverlay = null;
    this.itemTooltip = null;
    this.selectedItemDisplay = null;
    
    this.init();
  }
  
  init() {
    this.createInventoryUI();
    this.setupEventListeners();
  }
  
  createInventoryUI() {
    this.inventoryOverlay = document.createElement('div');
    this.inventoryOverlay.id = 'inventory-overlay';
    this.inventoryOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      z-index: 4500;
      justify-content: center;
      align-items: center;
    `;
    
    const inventoryContainer = document.createElement('div');

const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                 /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  inventoryContainer.style.cssText = `
    background: rgba(36, 41, 59, 0.95);
    border: 2px solid rgb(194, 194, 194);
    border-radius: 10px;
    padding: 15px;
    color: white;
    font-family: 'Courier New', monospace;
    text-align: center;
    max-width: 320px;
    width: 90vw;
    position: relative;
    max-height: 80vh;
    overflow-y: auto;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;
} else {
  inventoryContainer.style.cssText = `
    background: rgba(36, 41, 59, 0.95);
    border: 2px solid rgb(194, 194, 194);
    border-radius: 15px;
    padding: 30px;
    color: white;
    font-family: 'Courier New', monospace;
    text-align: center;
    max-width: 500px;
    position: relative;
  `;
}
    
    const title = document.createElement('h2');
title.textContent = 'INVENTORY';

if (isMobile) {
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: rgb(194, 194, 194);
    font-size: 12px;
    letter-spacing: 1px;
  `;
} else {
  title.style.cssText = `
    margin: 0 0 20px 0;
    color: rgb(194, 194, 194);
    font-size: 24px;
    letter-spacing: 2px;
  `;
}
    
    const instructions = document.createElement('div');

if (!isMobile) {
  instructions.style.cssText = `
    margin-bottom: 20px;
    color: #888;
    font-size: 12px;
  `;
  instructions.innerHTML = 'Click to select • Hover for details';
} else {
  instructions.style.display = 'none';
}
    

const inventoryGrid = document.createElement('div');
inventoryGrid.id = 'inventory-grid';

if (isMobile) {
  inventoryGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 15px;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
    justify-content: center;
  `;
} else {
  inventoryGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  `;
}
    
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.dataset.slotIndex = i;
      if (isMobile) {
  slot.style.cssText = `
    width: 45px;
    height: 45px;
    border: 2px solid #666;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 8px;
    text-align: center;
    padding: 2px;
    box-sizing: border-box;
  `;
} else {
  slot.style.cssText = `
    width: 80px;
    height: 80px;
    border: 2px solid #666;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 10px;
    text-align: center;
    padding: 5px;
    box-sizing: border-box;
  `;
}
      
      slot.addEventListener('mouseenter', (e) => this.showItemTooltip(e, i));
      slot.addEventListener('mouseleave', () => this.hideItemTooltip());
      slot.addEventListener('click', () => this.selectItem(i));
      
      inventoryGrid.appendChild(slot);
    }
    
    this.selectedItemDisplay = document.createElement('div');
    this.selectedItemDisplay.id = 'selected-item-display';
    this.selectedItemDisplay.style.cssText = `
      color: #ffff00;
      font-size: 14px;
      margin-bottom: 15px;
      min-height: 20px;
    `;
    this.selectedItemDisplay.textContent = 'Selected: None';
    
    const closeInstr = document.createElement('div');

const closeButton = document.createElement('button');
closeButton.id = 'inventory-close-btn';
closeButton.innerHTML = '✕';
closeButton.style.cssText = `
  position: absolute;
  top: 10px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: rgba(194, 194, 194, 0.2);
  border: 2px solid rgb(194, 194, 194);
  border-radius: 50%;
  color: rgb(194, 194, 194);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  z-index: 4501;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

closeButton.addEventListener('mouseenter', () => {
  closeButton.style.background = 'rgba(194, 194, 194, 0.3)';
  closeButton.style.transform = 'scale(1.1)';
  closeButton.style.color = '#fff';
});

closeButton.addEventListener('mouseleave', () => {
  closeButton.style.background = 'rgba(194, 194, 194, 0.2)';
  closeButton.style.transform = 'scale(1)';
  closeButton.style.color = 'rgb(194, 194, 194)';
});

closeButton.addEventListener('click', () => {
  this.closeInventory();
});

closeButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  this.closeInventory();
  
  window.preventESCOverlay = true;
  setTimeout(() => {
    if (window.mobileControls && window.mobileControls.isMobileDevice()) {
      window.gameStarted = true;
      if (typeof window.updateGameStarted === 'function') {
        window.updateGameStarted(true);
      }
    }
    window.preventESCOverlay = false;
  }, 500); 
});

inventoryContainer.appendChild(title);
if (!isMobile) {
  inventoryContainer.appendChild(instructions);
}
inventoryContainer.appendChild(this.selectedItemDisplay);
inventoryContainer.appendChild(inventoryGrid);
inventoryContainer.appendChild(closeButton);
inventoryContainer.appendChild(this.selectedItemDisplay);
inventoryContainer.appendChild(inventoryGrid);
inventoryContainer.appendChild(closeButton);
    this.inventoryOverlay.appendChild(inventoryContainer);
    document.body.appendChild(this.inventoryOverlay);
    
    this.createTooltip();
  }
  
  createTooltip() {
    this.itemTooltip = document.createElement('div');
    this.itemTooltip.id = 'item-tooltip';
    this.itemTooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid rgb(194, 194, 194);
      border-radius: 8px;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      display: none;
      z-index: 5000;
      pointer-events: none;
      max-width: 200px;
    `;
    document.body.appendChild(this.itemTooltip);
  }
  
  setupEventListeners() {
}
  toggleInventory() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.openInventory();
    } else {
      this.closeInventory();
    }
  }
  
  openInventory() {
    this.isOpen = true;
    this.inventoryOverlay.style.display = 'flex';
    
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    this.updateInventoryDisplay();
    
    this.portfolioAnalytics.trackInteraction('inventory', 'open');
  }
  
closeInventory() {
  this.isOpen = false;
  this.inventoryOverlay.style.display = 'none';
  this.hideItemTooltip();
  
  const isMobile = window.mobileControls && window.mobileControls.isMobileDevice();
  
  if (isMobile) {
    console.log('Closing inventory on mobile - no pointer lock needed');
    
    window.preventESCOverlay = true;
    
    if (typeof window.updateGameStarted === 'function') {
      window.updateGameStarted(true);
    } else {
      window.gameStarted = true;
    }
    
    setTimeout(() => {
      if (typeof window.updateUIVisibility === 'function') {
        window.updateUIVisibility();
      }
      setTimeout(() => {
        window.preventESCOverlay = false;
      }, 200);
    }, 100);
    
  } else {
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').requestPointerLock();
      
      setTimeout(() => {
        if (!document.pointerLockElement) {
          document.getElementById('three-canvas').requestPointerLock();
        }
      }, 50);
    }
  }
  
  this.portfolioAnalytics.trackInteraction('inventory', 'close');
}
  
  updateInventoryDisplay() {
    const slots = document.querySelectorAll('.inventory-slot');
    
    slots.forEach((slot, index) => {
      slot.textContent = '';
      slot.style.background = 'rgba(0, 0, 0, 0.3)';
      slot.style.border = '2px solid #666';
      
      if (this.items[index]) {
        const item = this.items[index];
        slot.textContent = item.name;
        slot.style.background = 'rgba(0, 100, 200, 0.2)';
        
        if (this.selectedSlot === index) {
          slot.style.border = '2px solid #ffff00';
          slot.style.background = 'rgba(255, 255, 0, 0.2)';
        }
      }
    });
    
    if (this.selectedItem) {
      this.selectedItemDisplay.textContent = `Selected Item: ${this.selectedItem.name}`;
    } else {
      this.selectedItemDisplay.textContent = 'Selected: None';
    }
  }
  
  showItemTooltip(event, slotIndex) {
    const item = this.items[slotIndex];
    if (!item) return;
    
    this.itemTooltip.innerHTML = `
      <strong style="color: rgb(194, 194, 194);">${item.name}</strong><br>
      <div style="color: #ccc; margin-top: 5px; font-size: 11px;">
        ${item.description}
      </div>
    `;
    
    this.itemTooltip.style.display = 'block';
    this.itemTooltip.style.left = (event.clientX + 10) + 'px';
    this.itemTooltip.style.top = (event.clientY - 10) + 'px';
  }
  
  hideItemTooltip() {
    this.itemTooltip.style.display = 'none';
  }
  
  selectItem(slotIndex) {
    const item = this.items[slotIndex];
    
    if (item) {
      this.selectedItem = item;
      this.selectedSlot = slotIndex;
      this.portfolioAnalytics.trackInteraction('inventory', 'select_item', { itemName: item.name });
    } else {
      this.selectedItem = null;
      this.selectedSlot = null;
    }
    
    this.updateInventoryDisplay();
  }
  
  addItem(item) {
    if (this.items.length >= this.maxSlots) {
      return false;
    }
    
    this.items.push(item);
    this.portfolioAnalytics.trackInteraction('inventory', 'add_item', { itemName: item.name });
    
    this.showCollectionMessage(item.name);
    
    return true;
  }
  
  removeItem(itemName) {
    const index = this.items.findIndex(item => item.name === itemName);
    if (index !== -1) {
      const removedItem = this.items.splice(index, 1)[0];
      
      if (this.selectedItem && this.selectedItem.name === itemName) {
        this.selectedItem = null;
        this.selectedSlot = null;
      } else if (this.selectedSlot !== null && this.selectedSlot > index) {
        this.selectedSlot--;
      }
      this.portfolioAnalytics.trackInteraction('inventory', 'remove_item', { itemName: itemName });
      
      if (this.isOpen) {
        this.updateInventoryDisplay();
      }
      return removedItem;
    }
    return null;
  }
  
  hasItem(itemName) {
    return this.items.some(item => item.name === itemName);
  }
  
  showCollectionMessage(itemName) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(105, 105, 105, 0.9);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      padding: 15px 25px;
      border-radius: 10px;
      border: 2px solid rgb(1, 1, 1);
      z-index: 6000;
      animation: fadeInOut 3s ease-in-out forwards;
    `;
    
    message.textContent = `${itemName} picked up`;
    document.body.appendChild(message);
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      document.body.removeChild(message);
      document.head.removeChild(style);
    }, 3000);
  }
  
  registerCollectibleItem(object, itemData) {
    object.userData.collectible = true;
    object.userData.itemData = itemData;
    this.collectibleItems.push(object);
  }
  
  registerInteractiveObject(object, requiredItem, onUse) {
    object.userData.interactive = true;
    object.userData.requiredItem = requiredItem;
    object.userData.onUse = onUse;
    object.userData.isLocked = true;
    this.interactiveObjects.push(object);
  }
  
  canInteractWith(object) {
    if (!object.userData.interactive) return false;
    if (!object.userData.isLocked) return false;
    
    const requiredItem = object.userData.requiredItem;
    return this.selectedItem && this.selectedItem.name === requiredItem;
  }
  
  useItemOn(object) {
    if (!this.canInteractWith(object)) return false;
    
    const requiredItem = object.userData.requiredItem;
    const onUse = object.userData.onUse;
    
    if (onUse) {
      onUse(object, this.selectedItem);
    }
    
    object.userData.isLocked = false;
    
    this.removeItem(requiredItem);
    
    this.portfolioAnalytics.trackInteraction('inventory', 'use_item', { 
      itemName: requiredItem,
      targetObject: object.userData.name || 'unknown'
    });
    
    return true;
  }
  
  getInteractionHint(object) {
    if (!object.userData.interactive) return null;
    
    if (object.userData.isLocked) {
      const requiredItem = object.userData.requiredItem;
      if (this.selectedItem && this.selectedItem.name === requiredItem) {
        return `Press E to use ${requiredItem}`;
      } else {
        return `Requires: ${requiredItem}`;
      }
    } else {
      return 'Already unlocked';
    }
  }
}

export { InventorySystem };
