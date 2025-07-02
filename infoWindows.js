import * as THREE from 'three';

class InfoWindows {
  constructor(portfolioAnalytics) {
    this.portfolioAnalytics = portfolioAnalytics;
    
    // Store references to all info windows
    this.windows = {
      portal: null,
      paper: null,
      tombstone: null,
      book: null,
      scroll: null,
      key: null,
      door: null
    };
    
    // Create info windows
    this.createInfoWindows();
  }
  
  createInfoWindows() {
    // Portal info window
    this.windows.portal = document.getElementById('portal-info') || this.createPortalInfoWindow();
    
    // Paper info window
    this.windows.paper = document.getElementById('paper-info') || this.createPaperInfoWindow();
    
    // Tombstone info window
    this.windows.tombstone = document.getElementById('tombstone-info') || this.createTombstoneInfoWindow();
    
    // Book info window
    this.windows.book = document.getElementById('book-info') || this.createBookInfoWindow();
    
    // Scroll info window
    this.windows.scroll = document.getElementById('scroll-info') || this.createScrollInfoWindow();
  }
  
  createPortalInfoWindow() {
    const window = document.createElement('div');
    window.id = 'portal-info';
    window.style.cssText = `
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
    window.innerHTML = `
      <div style="color: rgb(192, 195, 195); font-weight: bold; margin-bottom: 10px;">PORTAL DETECTED</div>
      <div style="margin-bottom: 5px;">Status: <span style="color: #00ff00;">ACTIVE</span></div>
      <div style="margin-bottom: 5px;">Energy: <span style="color: #ffff00;">97.3%</span></div>
      <div style="margin-bottom: 5px;">Destination: <span id="portal-destination" style="color: #ff9900;">--</span></div>
      <div style="margin-bottom: 10px;">Distance: <span id="portal-distance" style="color: rgb(192, 195, 195);">--</span></div>
      <div style="color: #00ff00; font-size: 12px;">Press E to enter portal</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createPaperInfoWindow() {
    const window = document.createElement('div');
    window.id = 'paper-info';
    window.style.cssText = `
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
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">document found</div>
      <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Letter</span></div>
      <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Readable</span></div>
      <div style="margin-bottom: 5px;">Opinion: <span style="color: #90ee90;">Based.</span></div>
      <div style="margin-bottom: 10px;">Language: <span style="color: #87ceeb;">English</span></div>
      <div style="color: #90ee90; font-size: 12px;">E to read</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createTombstoneInfoWindow() {
    const window = document.createElement('div');
    window.id = 'tombstone-info';
    window.style.cssText = `
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
    window.innerHTML = `
      <div style="color: #aaa; font-weight: bold; margin-bottom: 10px;">Gravestone found</div>
      <div style="margin-bottom: 5px;">Type: <span style="color: #ccc;">ancient Grave (idk maybe change this whole thing for diff model</span></div>
      <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">fucked up</span></div>
      <div style="margin-bottom: 5px;">Era: <span style="color: #87ceeb;"> unknown </span></div>
      <div style="margin-bottom: 10px;">Language: <span style="color: #d4af37;">Runic Script</span></div>
      <div style="color: #90ee90; font-size: 12px;">E to read engravings</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createBookInfoWindow() {
    const window = document.createElement('div');
    window.id = 'book-info';
    window.style.cssText = `
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
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">GRIMOIRE found</div>
      <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Contact registry</span></div>
      <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Well-Preserved</span></div>
      <div style="margin-bottom: 5px;">Content: <span style="color: #87ceeb;"> idk see for yourself bivch</span></div>
      <div style="margin-bottom: 10px;">Language: <span style="color: #daa520;"> idk, readable</span></div>
      <div style="color: #90ee90; font-size: 12px;">E to read</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createScrollInfoWindow() {
    const window = document.createElement('div');
    window.id = 'scroll-info';
    window.style.cssText = `
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
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;"> Scroll</div>
      <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Message Carrier</span></div>
      <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;"> *shrugs* </span></div>
      <div style="margin-bottom: 5px;">Purpose: <span style="color: #87ceeb;"> anonymus feedback</span></div>
      <div style="margin-bottom: 10px;">Magic: <span style="color: #daa520;"> Curse of Vanishing bt also Loyalty </span></div>
      <div style="color: #90ee90; font-size: 12px;">Press E</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  // Show key info window (dynamically created)
  showKeyInfo(key) {
    if (!this.windows.key) {
      this.windows.key = document.createElement('div');
      this.windows.key.id = 'key-info-temp';
      this.windows.key.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(139, 69, 19, 0.95);
        border: 2px solid #d4af37;
        padding: 15px;
        color: white;
        font-family: 'Courier New', monospace;
        border-radius: 10px;
      `;
      document.body.appendChild(this.windows.key);
    }
    
    this.windows.key.innerHTML = `
      <div style="color: #d4af37; font-weight: bold;">🗝️ ${key.userData.itemData.name}</div>
      <div style="color: #90ee90; font-size: 12px; margin-top: 5px;">Press E to collect</div>
    `;
    this.windows.key.style.display = 'block';
    
    this.portfolioAnalytics.trackInteraction('key', 'view', { name: key.userData.itemData.name });
  }
  
  // Show door info window (dynamically created)
  showDoorInfo(door, hint) {
    if (!this.windows.door) {
      this.windows.door = document.createElement('div');
      this.windows.door.id = 'door-info-temp';
      this.windows.door.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(64, 64, 64, 0.95);
        border: 2px solid #888;
        padding: 15px;
        color: white;
        font-family: 'Courier New', monospace;
        border-radius: 10px;
      `;
      document.body.appendChild(this.windows.door);
    }
    
    this.windows.door.innerHTML = `
      <div style="color: #888; font-weight: bold;">🚪 Locked Door</div>
      <div style="color: #90ee90; font-size: 12px; margin-top: 5px;">${hint}</div>
    `;
    this.windows.door.style.display = 'block';
    
    this.portfolioAnalytics.trackInteraction('door', 'view', { hint: hint });
  }
  
  // Show paper info window
  showPaperInfo(paper) {
    if (this.windows.paper) {
      this.windows.paper.style.display = 'block';
      this.hideAllExcept('paper');
      this.portfolioAnalytics.trackInteraction('paper', 'view', { name: paper.userData.name });
    }
  }
  
  // Show tombstone info window
  showTombstoneInfo(tombstone) {
    if (this.windows.tombstone) {
      this.windows.tombstone.style.display = 'block';
      this.hideAllExcept('tombstone');
      this.portfolioAnalytics.trackInteraction('tombstone', 'view', { name: tombstone.userData.name });
    }
  }
  
  // Show book info window
  showBookInfo(book) {
    if (this.windows.book) {
      this.windows.book.style.display = 'block';
      this.hideAllExcept('book');
      this.portfolioAnalytics.trackInteraction('book', 'view', { name: book.userData.name });
    }
  }
  
  // Show scroll info window
  showScrollInfo(scroll) {
    if (this.windows.scroll) {
      this.windows.scroll.style.display = 'block';
      this.hideAllExcept('scroll');
      this.portfolioAnalytics.trackInteraction('scroll', 'view', { name: scroll.userData.name });
    }
  }
  
  // Show portal info window with distance
  showPortalInfo(portal, distance) {
    if (this.windows.portal) {
      this.windows.portal.style.display = 'block';
      this.hideAllExcept('portal');
      
      // Update portal destination and distance
      const distanceElement = document.getElementById('portal-distance');
      const destinationElement = document.getElementById('portal-destination');
      
      if (distanceElement) {
        distanceElement.textContent = distance.toFixed(1) + 'm';
      }
      
      if (destinationElement) {
        if (portal.userData.type === 'gallery-frame') {
          destinationElement.textContent = `${portal.userData.artName.toUpperCase()} VIEWER`;
        } else {
          destinationElement.textContent = portal.userData.destination || 'UNKNOWN';
        }
      }
      
      // Track interaction
      const destination = portal.userData.type === 'gallery-frame' ? 
        portal.userData.artName : (portal.userData.destination || 'unknown');
      
      this.portfolioAnalytics.trackInteraction('portal', 'view', { 
        destination: destination, 
        distance: distance.toFixed(1) 
      });
    }
  }
  
  // Hide all info windows except the specified one
  hideAllExcept(exceptType) {
    Object.keys(this.windows).forEach(type => {
      if (type !== exceptType && this.windows[type]) {
        this.windows[type].style.display = 'none';
      }
    });
  }
  
  // Hide all info windows
  hideAllWindows() {
    Object.values(this.windows).forEach(window => {
      if (window) {
        window.style.display = 'none';
      }
    });
  }
}

export { InfoWindows };