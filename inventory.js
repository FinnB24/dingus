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
    
    const title = document.createElement('h2');
    title.textContent = 'INVENTORY';
    title.style.cssText = `
      margin: 0 0 20px 0;
      color: rgb(194, 194, 194);
      font-size: 24px;
      letter-spacing: 2px;
    `;
    
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-bottom: 20px;
      color: #888;
      font-size: 12px;
    `;
    instructions.innerHTML = 'Click items to select • Hover for details';
    
    const inventoryGrid = document.createElement('div');
    inventoryGrid.id = 'inventory-grid';
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
    
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.dataset.slotIndex = i;
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
    this.selectedItemDisplay.textContent = 'Selected Item: None';
    
    const closeInstr = document.createElement('div');
    closeInstr.style.cssText = `
      color: rgb(194, 194, 194);
      font-size: 16px;
      font-weight: bold;
    `;
    closeInstr.innerHTML = '<kbd style="background: #333; padding: 2px 6px; border-radius: 3px;">I</kbd> to close';
    
    inventoryContainer.appendChild(title);
    inventoryContainer.appendChild(instructions);
    inventoryContainer.appendChild(this.selectedItemDisplay);
    inventoryContainer.appendChild(inventoryGrid);
    inventoryContainer.appendChild(closeInstr);
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
    
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').requestPointerLock();
      
      setTimeout(() => {
        if (!document.pointerLockElement) {
          document.getElementById('three-canvas').requestPointerLock();
        }
      }, 50);
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
      this.selectedItemDisplay.textContent = 'Selected Item: None';
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