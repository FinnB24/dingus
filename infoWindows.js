import * as THREE from 'three';

class InfoWindows {
  constructor(portfolioAnalytics) {
    this.portfolioAnalytics = portfolioAnalytics;
    
    this.windows = {
      portal: null,
      paper: null,
      tombstone: null,
      book: null,
      scroll: null,
      key: null,
      door: null
    };
    
    this.createInfoWindows();
  }
  
  createInfoWindows() {
    this.windows.portal = document.getElementById('portal-info') || this.createPortalInfoWindow();
    this.windows.paper = document.getElementById('paper-info') || this.createPaperInfoWindow();
    this.windows.tombstone = document.getElementById('tombstone-info') || this.createTombstoneInfoWindow();
    this.windows.book = document.getElementById('book-info') || this.createBookInfoWindow();
    this.windows.scroll = document.getElementById('scroll-info') || this.createScrollInfoWindow();
    this.windows.key = document.getElementById('key-info') || this.createKeyInfoWindow();
    this.windows.door = document.getElementById('door-info') || this.createDoorInfoWindow();
  }
  
  createPortalInfoWindow() {
    const window = document.createElement('div');
    window.id = 'portal-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 180px;
        height: auto;
        max-height: 120px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgb(192, 195, 195);
        border-radius: 6px;
        color: white;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(192, 195, 195, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
        background: rgba(0, 0, 0, 0.9);
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
    }
    
    window.innerHTML = `
      <div style="color: rgb(192, 195, 195); font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">PORTAL</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #ccc;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Where to: <span id="portal-destination" style="color: #ff9900;">3D Gallery</span></div>
      <div style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};">Dist: <span id="portal-distance" style="color: rgb(192, 195, 195);">--</span></div>
      <div style="color: #00ff00; font-size: ${isMobile ? '8px' : '12px'};">E to enter</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createPaperInfoWindow() {
    const window = document.createElement('div');
    window.id = 'paper-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 140px;
        height: auto;
        max-height: 100px;
        background: rgba(139, 69, 19, 0.9);
        border: 1px solid #d4af37;
        border-radius: 6px;
        color: white;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
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
    }
    
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">DOCUMENT</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #f4e4c1;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Condition: <span style="color: #90ee90;">Readable</span></div>
      <div style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};">Content: <span style="color: #87ceeb;">based.</span></div>
      <div style="color: #90ee90; font-size: ${isMobile ? '8px' : '12px'};">E to read</div>`;
    document.body.appendChild(window);
    return window;
  }
  
  createTombstoneInfoWindow() {
    const window = document.createElement('div');
    window.id = 'tombstone-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 160px;
        height: auto;
        max-height: 120px;
        background: rgba(64, 64, 64, 0.9);
        border: 1px solid #888;
        border-radius: 6px;
        color: #ccc;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(128, 128, 128, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
         position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
        background: rgba(64, 64, 64, 1);
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
    }
    
    window.innerHTML = `
      <div style="color: #aaa; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">GRAVESTONE</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #ccc;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Condition: <span style="color: #90ee90;">Weathered</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Cause of death: <span style="color: #87ceeb;">Died of cringe</span></div>
      <div style="color: #90ee90; font-size: ${isMobile ? '8px' : '12px'};">E to read</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createBookInfoWindow() {
    const window = document.createElement('div');
    window.id = 'book-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 160px;
        height: auto;
        max-height: 100px;
        background: rgba(139, 69, 19, 0.9);
        border: 1px solid #d4af37;
        border-radius: 6px;
        color: #f4e4c1;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
         position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
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
    }
    
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">Book</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #f4e4c1;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">contains: <span style="color: #90ee90;">idk read it yourself bivch</span></div>
      <div style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};">Language: <span style="color: #daa520;">Readable</span></div>
      <div style="color: #90ee90; font-size: ${isMobile ? '8px' : '12px'};">E to read</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createScrollInfoWindow() {
    const window = document.createElement('div');
    window.id = 'scroll-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 160px;
        height: auto;
        max-height: 100px;
        background: rgba(139, 69, 19, 0.9);
        border: 1px solid #d4af37;
        border-radius: 6px;
        color: #f4e4c1;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
         position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
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
    }
    
    window.innerHTML = `
      <div style="color: #d4af37; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">SCROLL</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #f4e4c1;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Purpose: <span style="color: #90ee90;">anonymous yapping</span></div>
      <div style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};">Magic: <span style="color: #daa520;">Curse of vanishing</span></div>
      <div style="color: #90ee90; font-size: ${isMobile ? '8px' : '12px'};">Press E</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createKeyInfoWindow() {
    const window = document.createElement('div');
    window.id = 'key-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 150px;
        height: auto;
        max-height: 80px;
        background: rgba(98, 90, 65, 0.9);
        border: 1px solid #ffd700;
        border-radius: 6px;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
         position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
        background: rgba(98, 90, 65, 0.95);
        border: 2px solid #ffd700;
        border-radius: 10px;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        padding: 15px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        transition: opacity 0.3s ease;
      `;
    }
    
    window.innerHTML = `
      <div style="color: #ffd700; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">KEY</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #f4e4c1;">Collectible</span></div>
      <div style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};">Purpose: <span style="color: #87ceeb;">unlocks something</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">some idiot probably lost it <span style="color: #f4e4c1;"> </span></div>
      <div style="color: #90ee90; font-size: ${isMobile ? '8px' : '12px'};">E to collect</div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  createDoorInfoWindow() {
    const window = document.createElement('div');
    window.id = 'door-info';
    
    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 150px;
        height: auto;
        max-height: 90px;
        background: rgba(64, 64, 64, 0.9);
        border: 1px solid #a0a0a0;
        border-radius: 6px;
        color: #ddd;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        padding: 6px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(160, 160, 160, 0.3);
        transition: opacity 0.3s ease;
        overflow: hidden;
      `;
    } else {
      window.style.cssText = `
          position: fixed;
        top: 20px;
        right: 20px;
        width: 250px;
        height: 190px
        background: rgba(64, 64, 64, 1);
        border: 2px solid #a0a0a0;
        border-radius: 10px;
        color: #ddd;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        padding: 15px;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(160, 160, 160, 0.5);
        transition: opacity 0.3s ease;
      `;
    }
    
    window.innerHTML = `
      <div style="color: #a0a0a0; font-weight: bold; margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '10px' : '14px'};">DOOR</div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Type: <span style="color: #f4e4c1;">Interactable</span></div>
      <div style="margin-bottom: ${isMobile ? '2px' : '5px'}; font-size: ${isMobile ? '8px' : '12px'};">Status: <span style="color: #ff6b6b;">Locked</span></div>
      <div id="door-hint" style="margin-bottom: ${isMobile ? '4px' : '10px'}; font-size: ${isMobile ? '8px' : '12px'};"><span style="color: #87ceeb;">can be unlocked</span></div>
    `;
    document.body.appendChild(window);
    return window;
  }
  
  showKeyInfo(key) {
    if (this.windows.key) {
      this.windows.key.style.display = 'block';
      this.hideAllExcept('key');
      
      if (key.userData.itemData && key.userData.itemData.name) {
        const keyTitle = this.windows.key.querySelector('div');
        if (keyTitle) {
          keyTitle.textContent = `${key.userData.itemData.name}`;
        }
      }
      
      this.portfolioAnalytics.trackInteraction('key', 'view', { 
        name: key.userData.itemData?.name || 'Key' 
      });
    }
  }
  
  showDoorInfo(door, hint) {
    if (this.windows.door) {
      this.windows.door.style.display = 'block';
      this.hideAllExcept('door');
      
      if (hint) {
        const doorHint = document.getElementById('door-hint');
        
        if (doorHint) {
          if (hint.includes('Press E')) {
            doorHint.innerHTML = `<span style="color: #00ff00;">E to unlock</span>`;
          } else {
            doorHint.innerHTML = `<span style="color: #87ceeb;">${hint}</span>`;
          }
        }
      }
      
      this.portfolioAnalytics.trackInteraction('door', 'view', { hint: hint || 'key' });
    }
  }
  
  showPaperInfo(paper) {
    if (this.windows.paper) {
      this.windows.paper.style.display = 'block';
      this.hideAllExcept('paper');
      this.portfolioAnalytics.trackInteraction('paper', 'view', { name: paper.userData.name });
    }
  }
  
  showTombstoneInfo(tombstone) {
    if (this.windows.tombstone) {
      this.windows.tombstone.style.display = 'block';
      this.hideAllExcept('tombstone');
      this.portfolioAnalytics.trackInteraction('tombstone', 'view', { name: tombstone.userData.name });
    }
  }
  
  showBookInfo(book) {
    if (this.windows.book) {
      this.windows.book.style.display = 'block';
      this.hideAllExcept('book');
      this.portfolioAnalytics.trackInteraction('book', 'view', { name: book.userData.name });
    }
  }
  
  showScrollInfo(scroll) {
    if (this.windows.scroll) {
      this.windows.scroll.style.display = 'block';
      this.hideAllExcept('scroll');
      this.portfolioAnalytics.trackInteraction('scroll', 'view', { name: scroll.userData.name });
    }
  }
  
  showPortalInfo(portal, distance) {
    if (this.windows.portal) {
      this.windows.portal.style.display = 'block';
      this.hideAllExcept('portal');

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
      
      const destination = portal.userData.type === 'gallery-frame' ? 
        portal.userData.artName : (portal.userData.destination || 'unknown');
      
      this.portfolioAnalytics.trackInteraction('portal', 'view', { 
        destination: destination, 
        distance: distance.toFixed(1) 
      });
    }
  }
  
  hideAllExcept(exceptType) {
    Object.keys(this.windows).forEach(type => {
      if (type !== exceptType && this.windows[type]) {
        this.windows[type].style.display = 'none';
      }
    });
  }
  
  hideAllWindows() {
    Object.values(this.windows).forEach(window => {
      if (window) {
        window.style.display = 'none';
      }
    });
  }
}

export { InfoWindows };
