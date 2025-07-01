import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { WorldBuilder } from './worldBuilder.js';
// Portfolio Analytics System - Privacy-First
class PortfolioAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.events = [];
    this.currentScene = 'main';
    this.sceneStartTime = Date.now();
    
    // Initialize analytics
    this.init();
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  init() {
    // Track initial page load
    this.track('portfolio_loaded', {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    });
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('visibility_change', { 
        hidden: document.hidden,
        timestamp: new Date().toISOString()
      });
    });
    
    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        totalTime: Date.now() - this.sessionStart,
        timestamp: new Date().toISOString()
      });
      this.saveToStorage();
    });
    
    console.log('📊 Portfolio Analytics initialized for FinnB24');
  }
  
  track(event, data = {}) {
    const eventData = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      event,
      data: {
        ...data,
        currentScene: this.currentScene,
        sessionTime: Date.now() - this.sessionStart,
        url: window.location.href
      }
    };
    
    this.events.push(eventData);
    
    // Auto-save every 10 events or immediately for important events
    const importantEvents = ['portfolio_loaded', 'session_end', 'error_occurred'];
    if (this.events.length >= 10 || importantEvents.includes(event)) {
      this.saveToStorage();
    }
    
    // Debug logging (remove in production if desired)
    console.log('📊 Analytics:', event, data);
  }
  
  trackSceneChange(newScene) {
    const timeInPreviousScene = Date.now() - this.sceneStartTime;
    
    this.track('scene_change', {
      fromScene: this.currentScene,
      toScene: newScene,
      timeSpentInPrevious: timeInPreviousScene,
      timestamp: new Date().toISOString()
    });
    
    this.currentScene = newScene;
    this.sceneStartTime = Date.now();
  }
  
  trackInteraction(element, action, details = {}) {
    this.track('user_interaction', {
      element,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  saveToStorage() {
    try {
      const existingData = JSON.parse(localStorage.getItem('finnb24_portfolio_analytics') || '[]');
      const allEvents = [...existingData, ...this.events];
      
      // Keep only last 500 events to prevent storage overflow
      const recentEvents = allEvents.slice(-500);
      
      localStorage.setItem('finnb24_portfolio_analytics', JSON.stringify(recentEvents));
      this.events = []; // Clear current events after saving
      
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }
  
  // Get analytics data for viewing
  getAnalytics() {
    const stored = JSON.parse(localStorage.getItem('finnb24_portfolio_analytics') || '[]');
    return [...stored, ...this.events];
  }
  
  // Generate analytics summary
  getSummary() {
    const allEvents = this.getAnalytics();
    const summary = {
      totalSessions: new Set(allEvents.map(e => e.sessionId)).size,
      totalEvents: allEvents.length,
      scenesVisited: {},
      interactions: {},
      averageSessionTime: 0,
      mostPopularScene: '',
      deviceTypes: {},
      timestamps: {
        firstVisit: allEvents[0]?.timestamp || Date.now(),
        lastActivity: allEvents[allEvents.length - 1]?.timestamp || Date.now()
      }
    };
    
    // Process events
    allEvents.forEach(event => {
      // Count scene visits
      if (event.event === 'scene_change') {
        const scene = event.data.toScene;
        summary.scenesVisited[scene] = (summary.scenesVisited[scene] || 0) + 1;
      }
      
      // Count interactions
      if (event.event === 'user_interaction') {
        const element = event.data.element;
        summary.interactions[element] = (summary.interactions[element] || 0) + 1;
      }
      
      // Track device types
      if (event.event === 'portfolio_loaded') {
        const isMobile = /Mobile|Android|iPhone|iPad/.test(event.data.userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';
        summary.deviceTypes[deviceType] = (summary.deviceTypes[deviceType] || 0) + 1;
      }
    });
    
    // Find most popular scene
    summary.mostPopularScene = Object.keys(summary.scenesVisited).reduce((a, b) => 
      summary.scenesVisited[a] > summary.scenesVisited[b] ? a : b, 'main'
    );
    
    return summary;
  }
  
  // Clear all analytics data
  clearData() {
    localStorage.removeItem('finnb24_portfolio_analytics');
    this.events = [];
    console.log('📊 Analytics data cleared');
  }
  
  // Export analytics data
  exportData() {
    const data = {
      summary: this.getSummary(),
      events: this.getAnalytics(),
      exportedAt: new Date().toISOString(),
      portfolioOwner: 'FinnB24'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finnb24_portfolio_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize analytics
const portfolioAnalytics = new PortfolioAnalytics();

// Make it globally available for debugging
window.portfolioAnalytics = portfolioAnalytics;

// Enhanced Analytics Dashboard - Replace the existing dashboard code
if (window.location.search.includes('analytics=true')) {
  setTimeout(() => {
    const dashboard = document.createElement('div');
    dashboard.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      color: white;
      font-family: 'Courier New', monospace;
      padding: 20px;
      overflow-y: auto;
      z-index: 9999;
      line-height: 1.4;
    `;
    
    function generateDetailedAnalytics() {
      const allEvents = window.portfolioAnalytics ? window.portfolioAnalytics.getAnalytics() : [];
      const summary = window.portfolioAnalytics ? window.portfolioAnalytics.getSummary() : {};
      
      // Detailed breakdown by category
      const sceneStats = {};
      const interactionStats = {};
      const sessionStats = [];
      const timeSpentInScenes = {};
      
      // Process all events for detailed stats
      allEvents.forEach(event => {
        // Scene statistics
        if (event.event === 'scene_change') {
          const scene = event.data.toScene;
          if (!sceneStats[scene]) {
            sceneStats[scene] = {
              visits: 0,
              totalTimeSpent: 0,
              averageTime: 0,
              lastVisited: null
            };
          }
          sceneStats[scene].visits++;
          sceneStats[scene].lastVisited = event.timestamp;
          
          if (event.data.timeSpentInPrevious) {
            const prevScene = event.data.fromScene;
            if (!timeSpentInScenes[prevScene]) timeSpentInScenes[prevScene] = [];
            timeSpentInScenes[prevScene].push(event.data.timeSpentInPrevious);
          }
        }
        
        // Interaction statistics
        if (event.event === 'user_interaction') {
          const element = event.data.element;
          const action = event.data.action;
          const key = `${element}_${action}`;
          
          if (!interactionStats[key]) {
            interactionStats[key] = {
              count: 0,
              element: element,
              action: action,
              details: [],
              lastInteraction: null
            };
          }
          interactionStats[key].count++;
          interactionStats[key].lastInteraction = event.timestamp;
          if (event.data.details) {
            interactionStats[key].details.push(event.data.details);
          }
        }
        
        // Session data
        if (event.event === 'portfolio_loaded') {
          sessionStats.push({
            sessionId: event.sessionId,
            timestamp: event.timestamp,
            userAgent: event.data.userAgent,
            screenSize: event.data.screenSize,
            platform: event.data.platform,
            language: event.data.language
          });
        }
      });
      
      // Calculate average time spent in each scene
      Object.keys(timeSpentInScenes).forEach(scene => {
        if (sceneStats[scene]) {
          const times = timeSpentInScenes[scene];
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          sceneStats[scene].averageTime = avgTime;
          sceneStats[scene].totalTimeSpent = times.reduce((a, b) => a + b, 0);
        }
      });
      
      return {
        summary,
        sceneStats,
        interactionStats,
        sessionStats,
        recentEvents: allEvents.slice(-20)
      };
    }
    
    function formatTime(milliseconds) {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    }
    
    function formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    }
    
    function refreshDashboard() {
      const analytics = generateDetailedAnalytics();
      
      dashboard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #00ffff; padding-bottom: 10px;">
          <h1 style="color: #00ffff; margin: 0;">📊 FinnB24 Portfolio Analytics Dashboard</h1>
          <div>
            <button onclick="refreshDashboard()" style="margin-right: 10px; padding: 8px 15px; background: #004455; color: white; border: 1px solid #00ffff; border-radius: 4px; cursor: pointer;">🔄 Refresh</button>
            <button onclick="window.portfolioAnalytics.exportData()" style="margin-right: 10px; padding: 8px 15px; background: #004455; color: white; border: 1px solid #00ffff; border-radius: 4px; cursor: pointer;">📥 Export</button>
            <button onclick="window.portfolioAnalytics.clearData(); refreshDashboard();" style="margin-right: 10px; padding: 8px 15px; background: #440000; color: white; border: 1px solid #ff0000; border-radius: 4px; cursor: pointer;">🗑️ Clear</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 8px 15px; background: #333; color: white; border: 1px solid #666; border-radius: 4px; cursor: pointer;">✕ Close</button>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <!-- Summary Stats -->
          <div style="background: rgba(0,255,255,0.1); padding: 15px; border-radius: 8px; border: 1px solid #00ffff;">
            <h2 style="color: #00ffff; margin-top: 0;">📈 Overview Summary</h2>
            <div><strong>Total Sessions:</strong> ${analytics.summary.totalSessions || 0}</div>
            <div><strong>Total Events:</strong> ${analytics.summary.totalEvents || 0}</div>
            <div><strong>Most Popular Scene:</strong> ${analytics.summary.mostPopularScene || 'main'}</div>
            <div><strong>Total Interactions:</strong> ${Object.keys(analytics.interactionStats).length}</div>
            <div><strong>Last Activity:</strong> ${analytics.summary.timestamps ? formatDate(analytics.summary.timestamps.lastActivity) : 'None'}</div>
          </div>
          
          <!-- Device Stats -->
          <div style="background: rgba(255,255,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid #ffff00;">
            <h2 style="color: #ffff00; margin-top: 0;">💻 Device Statistics</h2>
            ${Object.entries(analytics.summary.deviceTypes || {}).map(([device, count]) => 
              `<div><strong>${device.charAt(0).toUpperCase() + device.slice(1)}:</strong> ${count} visits</div>`
            ).join('')}
            ${analytics.sessionStats.length > 0 ? `
              <div style="margin-top: 10px; font-size: 12px; color: #ccc;">
                <strong>Latest Session:</strong><br>
                Platform: ${analytics.sessionStats[analytics.sessionStats.length - 1].platform}<br>
                Screen: ${analytics.sessionStats[analytics.sessionStats.length - 1].screenSize}<br>
                Language: ${analytics.sessionStats[analytics.sessionStats.length - 1].language}
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Scene Statistics -->
        <div style="background: rgba(0,255,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid #00ff00; margin-bottom: 20px;">
          <h2 style="color: #00ff00; margin-top: 0;">🎮 Scene/Gallery Statistics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
            ${Object.entries(analytics.sceneStats).map(([scene, stats]) => `
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
                <h3 style="margin: 0 0 8px 0; color: #90ee90;">${scene.replace('gallery', '').replace('3D', '3D Art Gallery')}</h3>
                <div><strong>Visits:</strong> ${stats.visits}</div>
                <div><strong>Avg Time:</strong> ${formatTime(stats.averageTime || 0)}</div>
                <div><strong>Total Time:</strong> ${formatTime(stats.totalTimeSpent || 0)}</div>
                <div style="font-size: 11px; color: #aaa;"><strong>Last Visit:</strong> ${stats.lastVisited ? formatDate(stats.lastVisited) : 'Never'}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Interaction Statistics -->
        <div style="background: rgba(255,0,255,0.1); padding: 15px; border-radius: 8px; border: 1px solid #ff00ff; margin-bottom: 20px;">
          <h2 style="color: #ff00ff; margin-top: 0;">🎯 Interactive Elements Usage</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
            ${Object.entries(analytics.interactionStats).map(([key, stats]) => {
              const elementNames = {
                'paper': '📜 Creative Journey Letter',
                'book': '📚 Contact Grimoire', 
                'scroll': '📜 Feedback Scroll',
                'tombstone': '⚰️ Ancient Tombstone',
                'feedback_form': '✉️ Feedback Form'
              };
              const displayName = elementNames[stats.element] || stats.element;
              
              return `
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
                  <h3 style="margin: 0 0 8px 0; color: #ff99ff;">${displayName}</h3>
                  <div><strong>Action:</strong> ${stats.action}</div>
                  <div><strong>Count:</strong> ${stats.count}</div>
                  <div style="font-size: 11px; color: #aaa;"><strong>Last Used:</strong> ${stats.lastInteraction ? formatDate(stats.lastInteraction) : 'Never'}</div>
                  ${stats.details.length > 0 ? `
                    <div style="font-size: 10px; color: #ccc; margin-top: 5px;">
                      <strong>Details:</strong> ${JSON.stringify(stats.details[stats.details.length - 1])}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Recent Events -->
        <div style="background: rgba(255,165,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid #ffa500;">
          <h2 style="color: #ffa500; margin-top: 0;">⏰ Recent Events (Last 20)</h2>
          <div style="max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
            <pre style="margin: 0; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(analytics.recentEvents, null, 2)}</pre>
          </div>
        </div>
        
        <!-- Raw Summary Data -->
        <div style="background: rgba(128,128,128,0.1); padding: 15px; border-radius: 8px; border: 1px solid #808080; margin-top: 20px;">
          <h2 style="color: #808080; margin-top: 0;">🔍 Raw Summary Data</h2>
          <div style="max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
            <pre style="margin: 0; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(analytics.summary, null, 2)}</pre>
          </div>
        </div>
      `;
    }
    
    // Make refresh function globally available
    window.refreshDashboard = refreshDashboard;
    
    // Initial dashboard load
    refreshDashboard();
    
    document.body.appendChild(dashboard);
  }, 1000);
}

// Game state
let gameStarted = false;
let currentScene = 'main'; // Track which scene we're in
let spectatorMode = false; // Track if in spectator mode
let allModelsLoaded = false; // Track if all models are loaded
let paperReadingMode = false; // Track if currently reading paper
let currentDeskInView = null;

// Loading manager for better performance
const loadingManager = new THREE.LoadingManager();
let totalModelsToLoad = 11; // portal.glb, church.glb, grave.glb, altar.glb, paper.glb, crow.glb, desk.glb, book1.glb, book2.glb, scroll.glb, desk2.glb
let loadedModels = 0;

// Animation mixers
let crowMixer = null;

// Loading progress display
const loadingDisplay = document.createElement('div');
loadingDisplay.id = 'loading-display';
loadingDisplay.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ffff;
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
  <div style="color: #00ffff; font-weight: bold; margin-bottom: 15px;">🌀 LOADING PORTFOLIO</div>
  <div id="loading-progress">Loading models... 0%</div>
  <div style="margin-top: 10px; height: 4px; background: #333; border-radius: 2px;">
    <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ffff, #0080ff); border-radius: 2px; transition: width 0.3s ease;"></div>
  </div>
  <div style="margin-top: 10px; color: #888; font-size: 12px;">Please wait while we prepare the experience...</div>
`;
document.body.appendChild(loadingDisplay);

// Create paper reading overlay
const paperOverlay = document.createElement('div');
paperOverlay.id = 'paper-overlay';
paperOverlay.style.cssText = `
  position: fixed;
  top: 0;
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
  max-width: 800px;
  height: 100%;
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
    Welcome to My Creative Journey
  </h1>
  
  <p style="font-style: italic; text-align: center; margin-bottom: 40px; color: #5a4030;">
    "Art is not what you see, but what you make others see." - Edgar Degas
  </p>
  
  <p>
    Greetings, fellow wanderer of digital realms! You've stumbled upon a fragment of my creative soul, 
    carefully preserved within this virtual space. This portfolio is more than just a collection of works—it's 
    a testament to the countless hours spent chasing ideas, wrestling with pixels, and breathing life into 
    the impossible.
  </p>
  
  <p>
    My name is Eric, though you might know me as FinnB24 in the vast expanse of the internet. I'm a GenZ 
    creative who believes that art should provoke, inspire, and occasionally confuse. From the depths of 
    surreal digital paintings to the intricate geometries of 3D modeling, I explore the boundaries between 
    reality and imagination.
  </p>
  
  <h2 style="color: #3d2418; margin-top: 40px; margin-bottom: 20px;">The Philosophy Behind the Chaos</h2>
  
  <p>
    Every piece you'll encounter here was born from a simple question: "What if?" What if gravity worked 
    sideways? What if colors had emotions? What if time moved in spirals instead of lines? These questions 
    drive me to create worlds that exist nowhere but in the digital ether.
  </p>
  
  <p>
    I'm particularly drawn to surrealism—that beautiful madness that Salvador Dalí and René Magritte 
    pioneered. In our age of digital creation, we have tools they could only dream of. Every shader, 
    every particle system, every impossible geometry is a brush stroke in this new medium.
  </p>
  
  <h2 style="color: #3d2418; margin-top: 40px; margin-bottom: 20px;">A Note on Process</h2>
  
  <p>
    Creation, for me, is rarely linear. It's a dance between intention and accident, between control and 
    chaos. I might start with a simple sketch and end up with a fully animated 3D scene, or begin with 
    a melody and discover it needs visual accompaniment. This interconnectedness of media is what makes 
    modern art so exciting.
  </p>
  
  <p>
    The 3D Art portal in this space represents the core of my creative expression. It showcases my 
    ventures into three-dimensional storytelling and digital sculpture. This is where the magic happens.
  </p>
  
  <h2 style="color: #3d2418; margin-top: 40px; margin-bottom: 20px;">The Technology Behind the Magic</h2>
  
  <p>
    This very experience you're having—walking through a 3D space, interacting with objects, reading 
    this paper—represents the convergence of art and technology that fascinates me. Built with Three.js 
    and powered by WebGL, this portfolio itself is a piece of art, a statement about how we can present 
    creative work in the digital age.
  </p>
  
  <p>
    I believe in the democratization of tools. The software I use—Blender for 3D, GIMP for image editing, 
    Audacity for audio—proves that creativity isn't limited by budget. It's limited only by imagination 
    and persistence.
  </p>
  
  <h2 style="color: #3d2418; margin-top: 40px; margin-bottom: 20px;">Looking Forward</h2>
  
  <p>
    Art is evolution. Every day brings new techniques to master, new concepts to explore, new boundaries 
    to push. I'm constantly learning, constantly experimenting. The works you see here represent where 
    I've been, but they're just stepping stones to where I'm going.
  </p>
  
  <p>
    I invite you to explore, to question, to feel. Art is meant to be experienced, not just observed. 
    Each piece has a story, each composition a purpose. Some might make you smile, others might leave 
    you puzzled. That's exactly as it should be.
  </p>
  
  <p style="margin-top: 50px; font-style: italic; text-align: center; color: #5a4030;">
    Thank you for taking this journey with me. May it inspire your own creative adventures.
  </p>
  
  <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #1a0e08;">
    — Eric (FinnB24)
  </p>
  
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
      ⚰️ SACRED ENGRAVINGS ⚰️
    </h1>
    <div style="color: #888; font-style: italic;">Here lies the essence of the Tarnished Artist</div>
  </div>
  
  <div style="border: 2px solid #555; padding: 30px; border-radius: 10px; background: rgba(0,0,0,0.3);">
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">NAME:</strong> 
      <span style="color: #e0e0e0; margin-left: 10px;">Eric</span>
    </div>
    
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">AGE:</strong> 
      <span style="color: #e0e0e0; margin-left: 10px;">GenZ (I am an adult)</span>
    </div>
    
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">LOCATION:</strong> 
      <span style="color: #e0e0e0; margin-left: 10px;">Somewhere in Europe</span>
    </div>
    
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">PHILOSOPHY:</strong> 
      <span style="color: #e0e0e0; margin-left: 10px;">Procrastination from my irl life</span>
    </div>
    
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">AI OPINION:</strong> 
      <span style="color: #ff6b6b; margin-left: 10px;">Fuck AI (mostly, except in like medical areas)</span>
    </div>
    
    <div style="margin-bottom: 25px;">
      <strong style="color: #bbb;">CREATIVITY SOURCE:</strong> 
      <span style="color: #e0e0e0; margin-left: 10px;">Ideas come from my brain (obv)</span>
    </div>
    
    <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #555;">
      <h3 style="color: #bbb; margin-bottom: 20px;">📜 SACRED RULES & DECREES:</h3>
      
      <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #666;">
        <span style="color: #ffeb3b;">⚡</span> If you have a problem with me, tell me directly & don't spread misinformation
      </div>
      
      <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #666;">
        <span style="color: #ff5722;">⚔️</span> Don't copy my stuff without crediting me (I will find you!)
      </div>
      
      <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #666;">
        <span style="color: #9c27b0;">🎨</span> Surrealism is sick af
      </div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 40px; color: #888; font-style: italic;">
    "Here ends the testimony of the Artist Eric, forever wandering between realms of creation and procrastination"
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
      📞 CONTACT GRIMOIRE 📞
    </h1>
    <div style="color: #b8860b; font-style: italic; font-size: 16px;">Sacred Methods of Communication</div>
  </div>
  
  <div style="border: 2px solid #8b4513; padding: 35px; border-radius: 12px; background: rgba(139, 69, 19, 0.1);">
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">📧 ELECTRONIC CORRESPONDENCE</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37;">
        <strong style="color: #b8860b;">Email:</strong> 
        <span style="color: #f4e4c1; margin-left: 10px; font-family: 'Courier New', monospace;">finco.creative@web.de</span>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">💬 COMMUNICATION ETIQUETTE</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #daa520;">
        <p style="margin: 0; color: #f4e4c1; font-style: italic;">
          "Please get straight to the point - formalities aren't important to me"
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">⏰ RESPONSE EXPECTATIONS</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #cd853f;">
        <p style="margin: 0; color: #f4e4c1;">
          I'll respond on weekends mostly... depends on how busy & motivated I am
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">🌐 SOCIAL MEDIA REALMS</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #b8860b;">
        <p style="margin: 0 0 15px 0; color: #f4e4c1; font-style: italic;">
          "I'm not good at updating social media, but you can find me here:"
        </p>
        <div style="display: grid; gap: 10px;">
          <div style="color: #87ceeb;">🦋 <strong>Bluesky:</strong> <span style="font-family: 'Courier New', monospace;">@finnb24.bsky.social</span></div>
          <div style="color: #ff6b6b;">📺 <strong>YouTube:</strong> <span style="font-family: 'Courier New', monospace;">FinnB24</span></div>
          <div style="color: #e1306c;">📸 <strong>Instagram:</strong> <span style="font-family: 'Courier New', monospace;">@finnb24_creative</span></div>
          <div style="color: #ff8c00;">🎵 <strong>SoundCloud:</strong> <span style="font-family: 'Courier New', monospace;">FinnB24</span></div>
          <div style="color: #000;">📱 <strong>TikTok:</strong> <span style="font-family: 'Courier New', monospace;">@finnb24</span></div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #8b4513;">
      <h3 style="color: #d4af37; margin-bottom: 20px;">⚠️ IMPORTANT NOTICE:</h3>
      <div style="background: rgba(139, 69, 19, 0.2); padding: 20px; border-radius: 8px; border: 1px solid #8b4513;">
        <p style="margin: 0; color: #f4e4c1; text-align: center; font-weight: bold;">
          Quality over quantity - I prefer meaningful conversations over small talk
        </p>
      </div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 40px; color: #b8860b; font-style: italic;">
    "May your messages find swift passage through the digital realm"
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
      📜 FEEDBACK SCROLL 📜
    </h2>
    <div style="color: #b8860b; font-style: italic;">Share your thoughts, brave traveler...</div>
  </div>
  
  <form id="feedback-form" action="https://formspree.io/f/xovwrear" method="POST">
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; color: #d4af37; font-weight: bold;">Your Message:</label>
      <textarea 
        name="message" 
        placeholder="Share your thoughts about the portfolio, suggestions, or just say hello..."
        style="width: 100%; height: 120px; padding: 15px; background: #1a1008; 
               color: #f4e4c1; border: 2px solid #8b4513; border-radius: 8px;
               font-family: 'Times New Roman', serif; resize: vertical; font-size: 15px;
               box-sizing: border-box;"
        required>    
      </textarea>
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; color: #d4af37; font-weight: bold;">Your Name (Optional):</label>
      <input 
        type="text" 
        name="name" 
        placeholder="Anonymous Traveler"
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
        🕊️ Send Message
      </button>
    </div>
    
    <div id="form-status" style="margin-top: 20px; text-align: center; display: none;"></div>
  </form>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #8b4513; text-align: center;">
    <p style="color: #b8860b; font-style: italic; margin: 0; font-size: 14px;">
      "Your words shall be carried by digital ravens to the artist's realm"
    </p>
  </div>
`;

scrollContainer.appendChild(scrollContent);
scrollOverlay.appendChild(scrollContainer);
scrollOverlay.appendChild(scrollCloseButton);
document.body.appendChild(scrollOverlay);


// Create desk info overlay
const deskOverlay = document.createElement('div');
deskOverlay.id = 'desk-overlay';
deskOverlay.style.cssText = `
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

const deskContainer = document.createElement('div');
deskContainer.style.cssText = `
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

const deskCloseButton = document.createElement('button');
deskCloseButton.id = 'desk-close-btn';
deskCloseButton.innerHTML = '✕';
deskCloseButton.style.cssText = `
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

deskCloseButton.addEventListener('mouseenter', () => {
  deskCloseButton.style.background = 'rgba(139, 69, 19, 1)';
  deskCloseButton.style.transform = 'scale(1.1)';
  deskCloseButton.style.color = '#fff';
});

deskCloseButton.addEventListener('mouseleave', () => {
  deskCloseButton.style.background = 'rgba(139, 69, 19, 0.9)';
  deskCloseButton.style.transform = 'scale(1)';
  deskCloseButton.style.color = '#f4e4c1';
});

deskCloseButton.addEventListener('click', closeDesk);

const deskContent = document.createElement('div');
deskContent.style.cssText = `
  font-family: 'Times New Roman', serif;
  color: #f4e4c1;
  line-height: 1.7;
  font-size: 15px;
  text-align: left;
`;

deskContent.innerHTML = `
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #d4af37; font-size: 26px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
      📚 ARTIST'S WORKSPACE 📚
    </h1>
    <div style="color: #b8860b; font-style: italic; font-size: 16px;">The Sacred Desk of Creation</div>
  </div>
  
  <!-- Kudos Section -->
  <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: rgba(212, 175, 55, 0.1); border-radius: 12px; border: 2px solid #d4af37;">
    <h3 style="color: #d4af37; margin: 0 0 15px 0;">💖 SHOW APPRECIATION</h3>
    <div style="margin-bottom: 15px;">
      <span style="color: #f4e4c1; font-size: 18px;">Total Kudos: </span>
      <span id="kudos-count" style="color: #d4af37; font-size: 20px; font-weight: bold;">0</span>
    </div>
    <button id="kudos-button" style="
      background: linear-gradient(145deg, #d4af37, #b8860b); 
      color: #1a1008; 
      padding: 12px 25px; 
      border: none; 
      border-radius: 8px; 
      font-family: 'Times New Roman', serif; 
      font-size: 16px; 
      font-weight: bold;
      cursor: pointer; 
      transition: all 0.3s ease; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 auto;
    ">
      <span id="kudos-icon">💖</span>
      <span id="kudos-text">Give Kudos</span>
    </button>
    <div id="kudos-status" style="margin-top: 10px; font-size: 12px; color: #b8860b; min-height: 18px;"></div>
  </div>
  
  <div style="border: 2px solid #8b4513; padding: 35px; border-radius: 12px; background: rgba(139, 69, 19, 0.1);">
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">🎨 ABOUT THIS WORKSPACE</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37;">
        <p style="margin: 0; color: #f4e4c1;">
          This desk is where the magic happens. Every pixel, every polygon, every creative decision 
          begins here. It's not just furniture—it's a portal to infinite possibilities.
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">🛠️ TOOLS OF THE TRADE</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #daa520;">
        <div style="display: grid; gap: 10px;">
          <div style="color: #87ceeb;">🎭 <strong>Blender:</strong> <span style="color: #f4e4c1;">For 3D modeling and animation</span></div>
          <div style="color: #ff6b6b;">🖼️ <strong>GIMP:</strong> <span style="color: #f4e4c1;">For image editing and digital art</span></div>
          <div style="color: #98fb98;">💻 <strong>VS Code:</strong> <span style="color: #f4e4c1;">For coding this very experience</span></div>
          <div style="color: #dda0dd;">🎵 <strong>Audacity:</strong> <span style="color: #f4e4c1;">For audio editing and sound design</span></div>
          <div style="color: #ffd700;">⚡ <strong>Three.js:</strong> <span style="color: #f4e4c1;">For bringing 3D to the web</span></div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">⏰ CREATIVE WORKFLOW</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #cd853f;">
        <p style="margin: 0 0 15px 0; color: #f4e4c1;">
          <strong>Morning:</strong> Coffee ☕ + Concept sketching + 3D modeling
        </p>
        <p style="margin: 0 0 15px 0; color: #f4e4c1;">
          <strong>Afternoon:</strong> Coding + Testing + Debugging (lots of debugging)
        </p>
        <p style="margin: 0; color: #f4e4c1;">
          <strong>Evening:</strong> Fine-tuning + Rendering + Planning tomorrow's chaos
        </p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #d4af37; margin-bottom: 15px;">🎯 CURRENT PROJECTS</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #b8860b;">
        <div style="display: grid; gap: 10px;">
          <div style="color: #ff8c00;">🌟 <strong>Interactive Portfolio:</strong> <span style="color: #f4e4c1;">You're experiencing it right now!</span></div>
          <div style="color: #32cd32;">🎮 <strong>Game Assets:</strong> <span style="color: #f4e4c1;">3D models for indie games</span></div>
          <div style="color: #ff69b4;">🎨 <strong>Surreal Art Series:</strong> <span style="color: #f4e4c1;">Exploring impossible geometries</span></div>
          <div style="color: #87ceeb;">🔮 <strong>Secret Project:</strong> <span style="color: #f4e4c1;">Can't tell you yet... 😉</span></div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #8b4513;">
      <h3 style="color: #d4af37; margin-bottom: 20px;">💭 CREATIVE PHILOSOPHY:</h3>
      <div style="background: rgba(139, 69, 19, 0.2); padding: 20px; border-radius: 8px; border: 1px solid #8b4513;">
        <p style="margin: 0; color: #f4e4c1; text-align: center; font-style: italic; font-size: 16px;">
          "Every masterpiece was once just a mess of ideas on a cluttered desk. 
          Embrace the chaos, trust the process, and never stop creating."
        </p>
      </div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 40px; color: #b8860b; font-style: italic;">
    "Where imagination meets pixels, and dreams become digital reality"
  </div>
`;

deskContainer.appendChild(deskContent);
deskOverlay.appendChild(deskContainer);
deskOverlay.appendChild(deskCloseButton);
document.body.appendChild(deskOverlay);



// Form submission handling
function setupFormSubmission() {
  const form = document.getElementById('feedback-form');
  const submitBtn = document.getElementById('submit-btn');
  const formStatus = document.getElementById('form-status');
  
  if (form) {
    let isSubmitting = false; // Add flag to prevent multiple submissions
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Prevent multiple submissions
      if (isSubmitting) {
        console.log('Form already submitting, ignoring duplicate submission');
        return;
      }
      
      // Get form data
      const formData = new FormData(form);
      const message = formData.get('message').trim();
      
      // Check if message is empty (additional client-side validation)
      if (!message || message.length < 3) {
        formStatus.innerHTML = `
          <div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); 
                      padding: 15px; border-radius: 8px; border: 1px solid #ff6b6b;">
            ⚠️ <strong>Please enter a message.</strong><br>
            <small>Your feedback message must be at least 3 characters long.</small>
          </div>
        `;
        formStatus.style.display = 'block';
        return;
      }
      
      // Set submitting flag
      isSubmitting = true;
      
      // Update button state
      submitBtn.innerHTML = '🕊️ Sending...';
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
              ✅ <strong>Message sent successfully!</strong><br>
              <small>Your feedback has been delivered to the artist's realm.</small>
            </div>
          `;
          form.reset(); // Clear the form
          
          // Auto-close scroll after successful submission (optional)
          setTimeout(() => {
            closeScroll();
          }, 3000); // Close after 3 seconds
          
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        // Error
        console.error('Form submission error:', error);
        formStatus.innerHTML = `
          <div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); 
                      padding: 15px; border-radius: 8px; border: 1px solid #ff6b6b;">
            ❌ <strong>Failed to send message.</strong><br>
            <small>Please try again or contact directly via email.</small>
          </div>
        `;
      } finally {
        // Reset button state and submission flag
        isSubmitting = false;
        submitBtn.innerHTML = '🕊️ Send Message';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        formStatus.style.display = 'block';
      }
    });
  }
}

function closePaper() {
  paperOverlay.style.display = 'none';
  paperReadingMode = false;
  
  // Re-enable pointer lock if game was started
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeTombstone() {
  tombstoneOverlay.style.display = 'none';
  paperReadingMode = false; // Use same state variable
  
  // Re-enable pointer lock if game was started
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeBook() {
  bookOverlay.style.display = 'none';
  paperReadingMode = false; // Use same state variable
  
  // Re-enable pointer lock if game was started
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeScroll() {
  scrollOverlay.style.display = 'none';
  paperReadingMode = false; // Use same state variable
  
  // Re-enable pointer lock if game was started
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

function closeDesk() {
  deskOverlay.style.display = 'none';
  paperReadingMode = false; // Use same state variable
  
  // Re-enable pointer lock if game was started
  if (gameStarted) {
    const container = document.getElementById('three-canvas');
    if (container) {
      container.requestPointerLock();
    }
  }
}

// GitHub Pages Compatible Global Kudos System
class DeskKudosSystem {
  constructor() {
    this.storageKey = 'finnb24_desk_kudos_global';
    this.userStorageKey = 'finnb24_desk_user_kudos';
    this.githubRepo = 'FinnB24/finco'; // Your repo
    this.issueNumber = 1; // Create issue #1 for kudos storage
    this.apiUrl = `https://api.github.com/repos/${this.githubRepo}/issues/${this.issueNumber}/comments`;
    
    this.totalKudos = 0;
    this.userHasGivenKudos = false;
    this.init();
  }
  
  async init() {
    await this.loadGlobalKudosCount();
    this.loadUserKudosStatus();
    this.setupEventListeners();
    this.updateDisplay();
  }
  
  async loadGlobalKudosCount() {
    try {
      console.log('📊 Loading global kudos count...');
      const response = await fetch(this.apiUrl);
      
      if (response.ok) {
        const comments = await response.json();
        
        // Count comments that contain "KUDOS_VOTE"
        this.totalKudos = comments.filter(comment => 
          comment.body && comment.body.includes('KUDOS_VOTE')
        ).length;
        
        console.log(`✅ Global kudos loaded: ${this.totalKudos}`);
      } else {
        console.warn('⚠️ Could not load global kudos, using local count');
        this.totalKudos = parseInt(localStorage.getItem(this.storageKey) || '0');
      }
    } catch (error) {
      console.warn('⚠️ GitHub API error, using local storage:', error);
      this.totalKudos = parseInt(localStorage.getItem(this.storageKey) || '0');
    }
  }
  
  loadUserKudosStatus() {
    // Check if user has already given kudos (browser-specific)
    const userKudos = localStorage.getItem(this.userStorageKey);
    this.userHasGivenKudos = userKudos === 'true';
  }
  
  setupEventListeners() {
    this.attachButtonListener();
  }
  
  attachButtonListener() {
    const kudosButton = document.getElementById('kudos-button');
    if (kudosButton) {
      kudosButton.addEventListener('click', () => this.giveKudos());
      
      // Add hover effects
      kudosButton.addEventListener('mouseenter', () => {
        if (!this.userHasGivenKudos) {
          kudosButton.style.background = 'linear-gradient(145deg, #ffcc00, #d4af37)';
          kudosButton.style.transform = 'scale(1.05)';
        }
      });
      
      kudosButton.addEventListener('mouseleave', () => {
        if (!this.userHasGivenKudos) {
          kudosButton.style.background = 'linear-gradient(145deg, #d4af37, #b8860b)';
          kudosButton.style.transform = 'scale(1)';
        }
      });
    }
  }
  
  async giveKudos() {
    if (this.userHasGivenKudos) {
      this.showStatus('You\'ve already given kudos! Thank you! 💖', 'info');
      return;
    }
    
    // Show loading state
    this.showStatus('Sending kudos... ✨', 'info');
    const button = document.getElementById('kudos-button');
    const originalText = button ? button.innerHTML : '';
    if (button) {
      button.innerHTML = '<span>⏳</span><span>Sending...</span>';
      button.disabled = true;
    }
    
    try {
      // Send kudos to GitHub API
      const success = await this.sendKudosToGitHub();
      
      if (success) {
        // Increment local count immediately for better UX
        this.totalKudos++;
        this.userHasGivenKudos = true;
        
        // Save to localStorage as backup
        localStorage.setItem(this.storageKey, this.totalKudos.toString());
        localStorage.setItem(this.userStorageKey, 'true');
        
        // Update display
        this.updateDisplay();
        
        // Show success message
        this.showStatus('Thank you for the kudos! 💖✨', 'success');
        
        // Track analytics
        if (typeof portfolioAnalytics !== 'undefined') {
          portfolioAnalytics.trackInteraction('desk', 'give_kudos', { 
            totalKudos: this.totalKudos,
            method: 'github_api',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error('Failed to send kudos');
      }
    } catch (error) {
      console.error('❌ Error giving kudos:', error);
      
      // Fallback to local storage
      this.totalKudos++;
      this.userHasGivenKudos = true;
      localStorage.setItem(this.storageKey, this.totalKudos.toString());
      localStorage.setItem(this.userStorageKey, 'true');
      this.updateDisplay();
      
      this.showStatus('Kudos saved locally! (Network error) 💖', 'success');
    } finally {
      // Reset button
      if (button) {
        button.disabled = false;
      }
    }
  }
  
  async sendKudosToGitHub() {
    try {
      const kudosData = {
        body: `KUDOS_VOTE
        
🎨 **Portfolio Kudos Given!**

- **Timestamp:** ${new Date().toISOString()}
- **From:** Anonymous Visitor
- **Type:** Workspace Appreciation
- **Browser:** ${navigator.userAgent.substring(0, 50)}...
- **Page:** ${window.location.href}

*This kudos was given through the interactive 3D portfolio workspace.*`
      };
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(kudosData)
      });
      
      if (response.status === 201) {
        console.log('✅ Kudos successfully sent to GitHub!');
        return true;
      } else {
        console.warn('⚠️ GitHub API response:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ GitHub API error:', error);
      return false;
    }
  }
  
  updateDisplay() {
    const countElement = document.getElementById('kudos-count');
    const buttonElement = document.getElementById('kudos-button');
    const iconElement = document.getElementById('kudos-icon');
    const textElement = document.getElementById('kudos-text');
    
    if (countElement) {
      countElement.textContent = this.totalKudos;
    }
    
    if (buttonElement && this.userHasGivenKudos) {
      // Update button to show already given state
      buttonElement.style.background = 'linear-gradient(145deg, #666, #444)';
      buttonElement.style.cursor = 'default';
      buttonElement.style.opacity = '0.7';
      buttonElement.disabled = true;
      
      if (iconElement) iconElement.textContent = '✅';
      if (textElement) textElement.textContent = 'Kudos Given';
    }
  }
  
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('kudos-status');
    if (statusElement) {
      const colors = {
        success: '#90ee90',
        info: '#87ceeb',
        error: '#ff6b6b'
      };
      
      statusElement.textContent = message;
      statusElement.style.color = colors[type] || colors.info;
      
      // Clear after 4 seconds
      setTimeout(() => {
        if (statusElement) {
          statusElement.textContent = '';
        }
      }, 4000);
    }
  }
  
  // Get current stats
  getStats() {
    return {
      totalKudos: this.totalKudos,
      userHasGivenKudos: this.userHasGivenKudos,
      timestamp: new Date().toISOString(),
      method: 'github_api'
    };
  }
  
  // Admin function to refresh count from GitHub
  async refreshFromGitHub() {
    await this.loadGlobalKudosCount();
    this.updateDisplay();
    console.log('🔄 Refreshed kudos count from GitHub');
  }
  
  // Admin function to reset local user status (for testing)
  resetUserKudos() {
    localStorage.removeItem(this.userStorageKey);
    this.userHasGivenKudos = false;
    this.updateDisplay();
    console.log('🔄 User kudos status reset');
  }
}

// Initialize kudos system
const deskKudosSystem = new DeskKudosSystem();

// Make it globally available for debugging
window.deskKudosSystem = deskKudosSystem;

// Hide all overlays initially
function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.style.display = 'none';
  });
}

// Show home overlay after loading is complete
function showHomeOverlay() {
  const homeOverlay = document.getElementById('overlay-home');
  if (homeOverlay) {
    homeOverlay.style.display = 'block';
    homeOverlay.classList.add('visible');
  }
}

// Update loading progress
function updateLoadingProgress(loaded, total) {
  const percentage = Math.round((loaded / total) * 100);
  const progressText = document.getElementById('loading-progress');
  const progressBar = document.getElementById('progress-bar');
  
  if (progressText) progressText.textContent = `Loading models... ${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
  
  if (loaded >= total) {
    // Show completion message briefly
    if (progressText) progressText.textContent = 'Loading complete! 🎮';
    
    setTimeout(() => {
      loadingDisplay.style.display = 'none';
      allModelsLoaded = true;
      showHomeOverlay();
      setupFormSubmission(); // Setup form after loading
      console.log('All models loaded - showing home overlay');
      
      // 🌍 AUTO-LOAD WORLD AFTER MODELS ARE LOADED
      if (worldBuilder && worldBuilder.queuedWorldData) {
        setTimeout(async () => {
          const loadedCount = await worldBuilder.loadWorldWhenReady();
          if (loadedCount > 0) {
            console.log(`🌍 Auto-loaded world with ${loadedCount} objects`);
          }
        }, 1000);
      }
    }, 800); // Brief delay to show completion
  }
}

  loadingManager.onProgress = function(url, loaded, total) {
  updateLoadingProgress(loaded, total);
};

loadingManager.onLoad = function() {
  console.log('All models loaded successfully!');
  updateLoadingProgress(100, 100);
};

// Make functions globally available for HTML onclick handlers
window.closeOverlay = function(name) {
  const overlay = document.getElementById('overlay-'+name);
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
    
    // Only start the game when clicking the start button for home overlay AND models are loaded
    if (name === 'home' && allModelsLoaded) {
      gameStarted = true;
      const container = document.getElementById('three-canvas');
      if (container && !document.pointerLockElement) {
        container.requestPointerLock();
      }
    }
  }};

window.openOverlay = function(name) {
  // Only allow overlay opening if models are loaded
  if (!allModelsLoaded) return;
  
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('visible'));
  const targetOverlay = document.getElementById('overlay-'+name);
  if (targetOverlay) {
    targetOverlay.style.display = 'block';
    targetOverlay.classList.add('visible');
  }
  
  // Stop game when opening overlay
  if (name === 'home') {
    gameStarted = false;
  }
};

// Hide overlays initially until models are loaded
hideAllOverlays();

try {
  // 3D Scene Setup
  const container = document.getElementById('three-canvas');
  if (!container) throw new Error('Cannot find #three-canvas element');

  const scene = new THREE.Scene();
  const galleryScene = new THREE.Scene(); // 3D Art Gallery (ONLY gallery)
  
  // Individual model viewer scenes
  const cubeViewerScene = new THREE.Scene();
  const sphereViewerScene = new THREE.Scene();
  const cylinderViewerScene = new THREE.Scene();
  const coneViewerScene = new THREE.Scene();
  
  let activeScene = scene; // Track which scene is currently active
  
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance", // Use high performance GPU
    stencil: false, // Disable stencil buffer for better performance
    depth: true
  });
  renderer.setClearColor(0x89c4f4); // top sky color
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Optimize renderer settings for performance
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  container.appendChild(renderer.domElement);

  // Create crosshair
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

  // Create controls display
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
        <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 SPECTATOR MODE</div>
        <div><span style="color: #ffff00;">WASD</span> - Fly around</div>
        <div><span style="color: #ffff00;">Mouse</span> - Free look</div>
        <div><span style="color: #ffff00;">Space</span> - Fly up</div>
        <div><span style="color: #ffff00;">Shift</span> - Fly down</div>
        <div><span style="color: #ffff00;">Q</span> - Return to gallery</div>
        <div><span style="color: #ffff00;">ESC</span> - Menu</div>
      `;
    } else {
      controlsDisplay.innerHTML = `
        <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🎮 CONTROLS</div>
        <div><span style="color: #ffff00;">WASD</span> - Move</div>
        <div><span style="color: #ffff00;">Mouse</span> - Look around</div>
        <div><span style="color: #ffff00;">Space</span> - Jump</div>
        <div><span style="color: #ffff00;">Shift</span> - Sprint</div>
        <div><span style="color: #ffff00;">ESC</span> - Menu</div>
        <div><span style="color: #ffff00;">E</span> - Use Portal/Read</div>
        <div style="margin-top: 8px; color: #888; font-size: 10px;">Aim crosshair at portals/objects to interact</div>
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
    border: 2px solid #00ffff;
    border-radius: 10px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 15px;
    display: none;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    transition: opacity 0.3s ease;
  `;
  portalInfoWindow.innerHTML = `
    <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">🌀 PORTAL DETECTED</div>
    <div style="margin-bottom: 5px;">Status: <span style="color: #00ff00;">ACTIVE</span></div>
    <div style="margin-bottom: 5px;">Energy: <span style="color: #ffff00;">97.3%</span></div>
    <div style="margin-bottom: 5px;">Destination: <span id="portal-destination" style="color: #ff9900;">--</span></div>
    <div style="margin-bottom: 10px;">Distance: <span id="portal-distance" style="color: #00ffff;">--</span></div>
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
    width: 250px;
    height: 120px;
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
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">📜 DOCUMENT FOUND</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Personal Letter</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Readable</span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #87ceeb;">English</span></div>
    <div style="color: #90ee90; font-size: 12px;">Press E to read</div>
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
    height: 130px;
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
    <div style="color: #aaa; font-weight: bold; margin-bottom: 10px;">⚰️ TOMBSTONE FOUND</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #ccc;">Ancient Grave</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Engraved</span></div>
    <div style="margin-bottom: 5px;">Era: <span style="color: #87ceeb;">Tarnished Age</span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #d4af37;">Runic Script</span></div>
    <div style="color: #90ee90; font-size: 12px;">Press E to read engravings</div>
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
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">📚 GRIMOIRE DISCOVERED</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Contact Registry</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Well-Preserved</span></div>
    <div style="margin-bottom: 5px;">Content: <span style="color: #87ceeb;">Communication Methods</span></div>
    <div style="margin-bottom: 10px;">Language: <span style="color: #daa520;">Ancient Script</span></div>
    <div style="color: #90ee90; font-size: 12px;">Press E to read grimoire</div>
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
    <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">📜 FEEDBACK SCROLL</div>
    <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Message Carrier</span></div>
    <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Enchanted</span></div>
    <div style="margin-bottom: 5px;">Purpose: <span style="color: #87ceeb;">Feedback Collection</span></div>
    <div style="margin-bottom: 10px;">Magic: <span style="color: #daa520;">Active</span></div>
    <div style="color: #90ee90; font-size: 12px;">Press E to leave feedback</div>
  `;
  document.body.appendChild(scrollInfoWindow);






// Create desk info window
const deskInfoWindow = document.createElement('div');
deskInfoWindow.id = 'desk-info';
deskInfoWindow.style.cssText = `
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
deskInfoWindow.innerHTML = `
  <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">📚 WORKSPACE DETECTED</div>
  <div style="margin-bottom: 5px;">Type: <span style="color: #f4e4c1;">Artist's Desk</span></div>
  <div style="margin-bottom: 5px;">Condition: <span style="color: #90ee90;">Active</span></div>
  <div style="margin-bottom: 5px;">Contents: <span style="color: #87ceeb;">Creative Tools</span></div>
  <div style="margin-bottom: 10px;">Status: <span style="color: #daa520;">Inspiration Ready</span></div>
  <div style="color: #90ee90; font-size: 12px;">Press E to explore workspace</div>
`;
document.body.appendChild(deskInfoWindow);





  // =======================================
  // 🎯 SETUP MAIN SCENE
  // =======================================
  
  // Optimized sky (smaller, lower detail for better performance)
  const skyGeo = new THREE.SphereGeometry(60, 16, 16); // Reduced segments
  const skyMat = new THREE.MeshBasicMaterial({ color:0x89c4f4, side:THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);

  // Sun (just a glowing disc)
  const sunGeo = new THREE.CircleGeometry(3, 16); // Reduced segments
  const sunMat = new THREE.MeshBasicMaterial({ color:0xfff0b1, transparent:true, opacity:0.8 });
  const sun = new THREE.Mesh(sunGeo,sunMat);
  sun.position.set(12,16,-40);
  scene.add(sun);

  // =======================================
  // 🌅 DYNAMIC DAY/NIGHT CYCLE SYSTEM
  // =======================================

  // Day/night cycle configuration
  const dayNightConfig = {
    speedMultiplier: 360, // Real time (set to 60 for fast cycle)
    transitionDuration: 0.3, // How smooth transitions are (0-1)
    
    // Time periods (in 24-hour format)
    sunrise: 6,
    sunset: 20,
    
    // Color configurations
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
    
    // Light intensity configurations
    intensity: {
      day: { ambient: 0.4, directional: 0.7, sun: 0.8 },
      night: { ambient: 0.1, directional: 0.2, sun: 0.3 },
      sunset: { ambient: 0.25, directional: 0.4, sun: 0.6 },
      sunrise: { ambient: 0.3, directional: 0.5, sun: 0.7 }
    }
  };

  // Add fog to main scene for better atmosphere
  scene.fog = new THREE.Fog(dayNightConfig.colors.day.fog, 30, 80);

  // Create time display
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

  // Function to get CEST time (Central European Summer Time)
  function getCESTTime() {
    const now = new Date();
    
    // Convert to CEST (UTC+2)
    const cestOffset = 2 * 60; // CEST is UTC+2
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cestTime = new Date(utc + (cestOffset * 60000));
    
    return cestTime;
  }

  // Function to get accelerated time for testing
  function getAcceleratedTime() {
    const realTime = getCESTTime();
    const acceleratedMs = realTime.getTime() * dayNightConfig.speedMultiplier;
    return new Date(acceleratedMs);
  }

  // Function to interpolate between colors
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

  // Function to interpolate between intensity values
  function lerpIntensity(intensity1, intensity2, factor) {
    return {
      ambient: intensity1.ambient + (intensity2.ambient - intensity1.ambient) * factor,
      directional: intensity1.directional + (intensity2.directional - intensity1.directional) * factor,
      sun: intensity1.sun + (intensity2.sun - intensity1.sun) * factor
    };
  }

  // Function to get sun/moon position based on time
  function getSunPosition(hours) {
    // Sun moves in an arc from east to west
    const sunAngle = ((hours - 6) / 12) * Math.PI; // 6 AM to 6 PM = 0 to PI
    const sunHeight = Math.sin(sunAngle) * 20 + 5; // Height varies from 5 to 25
    const sunX = Math.cos(sunAngle) * 30; // X position varies
    const sunZ = -40; // Keep Z constant
    
    return {
      x: sunX,
      y: Math.max(sunHeight, 2), // Don't let it go below horizon
      z: sunZ
    };
  }

  // Function to update day/night cycle
  function updateDayNightCycle() {
    const currentTime = getAcceleratedTime();
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    
    // Update time display
    const realCEST = getCESTTime();
    timeDisplay.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">🕒 TIME</div>
      <div><span style="color: #ffff00;">Real CEST:</span> ${realCEST.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}</div>
      <div><span style="color: #ffff00;">Game Time:</span> ${currentTime.toLocaleTimeString('en-GB')}</div>
      <div style="margin-top: 8px; color: #888; font-size: 10px;">⚡ ${dayNightConfig.speedMultiplier}x speed</div>
    `;
    
    let currentColors, currentIntensity, timeOfDay;
    
    // Determine time of day and calculate transitions
    if (hours >= 5 && hours < 7) {
      // Sunrise transition (5 AM - 7 AM)
      const factor = (hours - 5) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.night.sky, dayNightConfig.colors.sunrise.sky, factor),
        sun: lerpColor(dayNightConfig.colors.night.sun, dayNightConfig.colors.sunrise.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.night.ambient, dayNightConfig.colors.sunrise.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.night.directional, dayNightConfig.colors.sunrise.directional, factor),
        fog: lerpColor(dayNightConfig.colors.night.fog, dayNightConfig.colors.sunrise.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.night, dayNightConfig.intensity.sunrise, factor);
      timeOfDay = `🌅 Sunrise (${Math.round(factor * 100)}%)`;
    } else if (hours >= 7 && hours < 9) {
      // Morning transition (7 AM - 9 AM)
      const factor = (hours - 7) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.sunrise.sky, dayNightConfig.colors.day.sky, factor),
        sun: lerpColor(dayNightConfig.colors.sunrise.sun, dayNightConfig.colors.day.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.sunrise.ambient, dayNightConfig.colors.day.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.sunrise.directional, dayNightConfig.colors.day.directional, factor),
        fog: lerpColor(dayNightConfig.colors.sunrise.fog, dayNightConfig.colors.day.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.sunrise, dayNightConfig.intensity.day, factor);
      timeOfDay = `🌄 Morning (${Math.round(factor * 100)}%)`;
    } else if (hours >= 9 && hours < 18) {
      // Full day (9 AM - 6 PM)
      currentColors = dayNightConfig.colors.day;
      currentIntensity = dayNightConfig.intensity.day;
      timeOfDay = "☀️ Day";
    } else if (hours >= 18 && hours < 20) {
      // Sunset transition (6 PM - 8 PM)
      const factor = (hours - 18) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.day.sky, dayNightConfig.colors.sunset.sky, factor),
        sun: lerpColor(dayNightConfig.colors.day.sun, dayNightConfig.colors.sunset.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.day.ambient, dayNightConfig.colors.sunset.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.day.directional, dayNightConfig.colors.sunset.directional, factor),
        fog: lerpColor(dayNightConfig.colors.day.fog, dayNightConfig.colors.sunset.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.day, dayNightConfig.intensity.sunset, factor);
      timeOfDay = `🌅 Sunset (${Math.round(factor * 100)}%)`;
    } else if (hours >= 20 && hours < 22) {
      // Evening transition (8 PM - 10 PM)
      const factor = (hours - 20) / 2;
      currentColors = {
        sky: lerpColor(dayNightConfig.colors.sunset.sky, dayNightConfig.colors.night.sky, factor),
        sun: lerpColor(dayNightConfig.colors.sunset.sun, dayNightConfig.colors.night.sun, factor),
        ambient: lerpColor(dayNightConfig.colors.sunset.ambient, dayNightConfig.colors.night.ambient, factor),
        directional: lerpColor(dayNightConfig.colors.sunset.directional, dayNightConfig.colors.night.directional, factor),
        fog: lerpColor(dayNightConfig.colors.sunset.fog, dayNightConfig.colors.night.fog, factor)
      };
      currentIntensity = lerpIntensity(dayNightConfig.intensity.sunset, dayNightConfig.intensity.night, factor);
      timeOfDay = `🌆 Evening (${Math.round(factor * 100)}%)`;
    } else {
      // Night (10 PM - 5 AM)
      currentColors = dayNightConfig.colors.night;
      currentIntensity = dayNightConfig.intensity.night;
      timeOfDay = "🌙 Night";
    }
    
    // Update time of day in display
    timeDisplay.innerHTML += `<div><span style="color: #ffff00;">Period:</span> ${timeOfDay}</div>`;
    
    // Apply colors and lighting
    if (currentScene === 'main') {
      // Update sky color
      skyMat.color.setHex(currentColors.sky);
      
      // Update sun/moon color and position
      sunMat.color.setHex(currentColors.sun);
      const sunPos = getSunPosition(hours);
      sun.position.set(sunPos.x, sunPos.y, sunPos.z);
      
      // Update lighting
      ambLight.color.setHex(currentColors.ambient);
      ambLight.intensity = currentIntensity.ambient;
      
      dirLight.color.setHex(currentColors.directional);
      dirLight.intensity = currentIntensity.directional;
      
      // Update sun material opacity based on intensity
      sunMat.opacity = currentIntensity.sun;
      
      // Update fog
      scene.fog.color.setHex(currentColors.fog);
      
      // Position directional light to follow sun
      dirLight.position.set(sunPos.x * 0.5, sunPos.y + 5, sunPos.z * 0.5);
    }
  }

  // Optimized grid helper for ground
  const grid = new THREE.GridHelper(44, 22, 0x9be7ff, 0x3d4262);
  grid.position.y = 0.01;
  scene.add(grid);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x3d4262, shininess: 10 })
  );
  floor.rotation.x = -Math.PI/2; 
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // 🌍 Initialize World Builder
  let worldBuilder;
  try {
    worldBuilder = new WorldBuilder(scene, camera, renderer);
    console.log('🛠️ World Builder system initialized');
    
    // Start auto-loading process
    const requiredModels = await worldBuilder.autoLoadWorld();
    if (requiredModels.length > 0) {
      console.log('🌍 Will auto-load world when models are ready:', requiredModels);
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize World Builder:', error);
  }

  // =======================================
  // 🎯 SETUP 3D ART GALLERY SCENE (ONLY GALLERY)
  // =======================================
  
  // Gallery sky (reuse geometry)
  const gallerySky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color:0x2a1810, side:THREE.BackSide }));
  galleryScene.add(gallerySky);

  // Gallery lighting (optimized)
  const galleryAmbLight = new THREE.AmbientLight(0xffffff, 0.3);
  galleryScene.add(galleryAmbLight);
  
  const gallerySpotLight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI/6, 0.1, 2);
  gallerySpotLight.position.set(0, 15, 0);
  gallerySpotLight.target.position.set(0, 0, 0);
  gallerySpotLight.castShadow = true;
  // Reduce shadow map size for better performance
  gallerySpotLight.shadow.mapSize.setScalar(512);
  galleryScene.add(gallerySpotLight);
  galleryScene.add(gallerySpotLight.target);

  // Gallery floor (reuse plane geometry)
  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(50,50),
    new THREE.MeshPhongMaterial({ color:0x1a1a1a, shininess: 30 })
  );
  galleryFloor.rotation.x = -Math.PI/2; 
  galleryFloor.position.y = 0;
  galleryFloor.receiveShadow = true;
  galleryScene.add(galleryFloor);

  // Gallery grid (reuse)
  const galleryGrid = new THREE.GridHelper(44, 22, 0x333333, 0x222222);
  galleryGrid.position.y = 0.01;
  galleryScene.add(galleryGrid);

   // Create gallery walls with shared materials
  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const wallGeometry = new THREE.PlaneGeometry(30, 8);
  
  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -15);
  galleryScene.add(backWall);
  
  // Side walls
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-15, 4, 0);
  galleryScene.add(leftWall);
  
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(15, 4, 0);
  galleryScene.add(rightWall);

  // Art pieces data
  const artPieces = [
    { pos: [-10, 2, -14.5], color: 0xff4444, shape: 'cube', name: 'Red Cube' },
    { pos: [10, 2, -14.5], color: 0x44ff44, shape: 'sphere', name: 'Green Sphere' },
    { pos: [-14.5, 2, -5], color: 0x4444ff, shape: 'cylinder', name: 'Blue Cylinder' },
    { pos: [14.5, 2, 5], color: 0xffff44, shape: 'cone', name: 'Yellow Cone' },
  ];

  // Create gallery frames and interactive areas with shared geometries
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
    // Create frame (reuse geometry and material)
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    
    // Create canvas preview of the 3D model (optimized canvas size)
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Reduced from 256
    canvas.height = 96;  // Reduced from 192
    const ctx = canvas.getContext('2d');
    
    // Draw a simple preview representation
    ctx.fillStyle = `#${art.color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(25, 25, 78, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial'; // Reduced font size
    ctx.textAlign = 'center';
    ctx.fillText(art.name, 64, 80);
    ctx.fillText('Click to View', 64, 90);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false; // Disable mipmaps for better performance
    texture.minFilter = THREE.LinearFilter;
    
    const previewMaterial = new THREE.MeshPhongMaterial({ map: texture });
    const preview = new THREE.Mesh(previewGeometry, previewMaterial);
    
    // Position frames on walls
    frame.position.copy(new THREE.Vector3(...art.pos));
    preview.position.copy(frame.position);
    preview.position.z += 0.01; // Slightly in front of frame
    
    // Set rotations based on wall
    if (art.pos[2] < 0) { // Back wall
      frame.rotation.y = 0;
      preview.rotation.y = 0;
    } else if (art.pos[0] < 0) { // Left wall
      frame.rotation.y = Math.PI/2;
      preview.rotation.y = Math.PI/2;
    } else { // Right wall
      frame.rotation.y = -Math.PI/2;
      preview.rotation.y = -Math.PI/2;
    }
    
    galleryScene.add(frame);
    galleryScene.add(preview);
    galleryFrames.push(frame);
    
    // Create invisible interactive area (reuse geometry and material)
    const interactiveArea = new THREE.Mesh(interactiveGeometry, interactiveMaterial);
    interactiveArea.position.copy(preview.position);
    interactiveArea.rotation.copy(preview.rotation);
    interactiveArea.userData = { type: 'gallery-frame', artIndex: index, artName: art.shape };
    galleryScene.add(interactiveArea);
    interactiveAreas.push(interactiveArea);
  });

  // =======================================
  // 🎯 SETUP MODEL VIEWER SCENES
  // =======================================
  
  // Shared geometries for model viewer scenes
  const sharedGeometries = {
    cube: new THREE.BoxGeometry(4, 4, 4),
    sphere: new THREE.SphereGeometry(2.5, 24, 24), // Reduced segments
    cylinder: new THREE.CylinderGeometry(2, 2, 6, 24), // Reduced segments
    cone: new THREE.ConeGeometry(2.5, 6, 24) // Reduced segments
  };
  
  function createModelViewerScene(art, scene) {
    // Dark space environment (reuse sky geometry)
    const viewerSky = new THREE.Mesh(skyGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide }));
    scene.add(viewerSky);
    
    // Optimized lighting
    const ambLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambLight);
    
    const spotLight1 = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/4, 0.1, 2);
    spotLight1.position.set(10, 10, 10);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.shadow.mapSize.setScalar(256); // Reduced shadow map size
    scene.add(spotLight1);
    scene.add(spotLight1.target);
    
    const spotLight2 = new THREE.SpotLight(0x4444ff, 1, 50, Math.PI/4, 0.1, 2);
    spotLight2.position.set(-10, 5, -5);
    spotLight2.target.position.set(0, 0, 0);
    spotLight2.shadow.mapSize.setScalar(256); // Reduced shadow map size
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    
    // Use shared geometry
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
    
    // Add some rotation animation
    scene.userData = { rotatingMesh: mesh };
  }

  // Create all model viewer scenes
  createModelViewerScene(artPieces[0], cubeViewerScene);
  createModelViewerScene(artPieces[1], sphereViewerScene);
  createModelViewerScene(artPieces[2], cylinderViewerScene);
  createModelViewerScene(artPieces[3], coneViewerScene);

  // Character
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
    new THREE.SphereGeometry(0.25, 12, 12), // Reduced segments
    new THREE.MeshPhongMaterial({ color: 0x6ce1ff, shininess: 60 })
  );
  characterHead.position.set(0, 1.9, 0);
  characterHead.castShadow = true;
  characterGroup.add(characterHead);

  characterGroup.position.set(0, 0, 5);
  scene.add(characterGroup); // Character is added to main scene initially

  // Collision detection arrays (only for main scene)
  const collisionBoxes = [];

  // =======================================
  // 🎯 COLLISION BOXES (OPTIMIZED)
  // =======================================
  // Add a random standalone collision box (blue wireframe)
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

  // Add a cylinder collision (purple wireframe)
  const cylinderCollisionBox = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3, 12), // Reduced segments
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

  // =======================================
  // 🎯 OPTIMIZED MODEL LOADING
  // =======================================
  
  // Setup optimized loaders
  const loader = new GLTFLoader(loadingManager);
  
  // Optional: Add DRACO compression support for even smaller files
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  let returnPortalModel = null;

  // Optimized model loading with caching
  const modelCache = new Map();
  
  function loadModelOptimized(url, callback, progressCallback, errorCallback) {
    if (modelCache.has(url)) {
      // Return cached model
      callback(modelCache.get(url));
      return;
    }
    
    loader.load(url, 
      function(gltf) {
        // Cache the model
        modelCache.set(url, gltf);
        
        // Optimize loaded model
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Optimize materials
            if (node.material) {
              node.material.needsUpdate = false;
              // Disable unnecessary features for performance
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

  // 🌍 MODEL REGISTRATION FOR WORLD BUILDER
  function registerModelWithWorldBuilder(modelName, gltf) {
    if (worldBuilder) {
      worldBuilder.registerModel(modelName, {
        scene: gltf.scene.clone(),
        animations: gltf.animations || []
      });
    }
  }

  // Load Church Model (optimized) - 🌍 WITH WORLD BUILDER REGISTRATION
  let churchModel = null;
  loadModelOptimized(
    'church.glb',
    function (gltf) {
      console.log('Church model loaded successfully');
      churchModel = gltf.scene;
      churchModel.scale.set(0.07, 0.07, 0.07);
      
      const box = new THREE.Box3().setFromObject(churchModel);
      const center = box.getCenter(new THREE.Vector3());
      
      churchModel.position.set(
        25 - center.x * 0.1,
        0,
        -4 - center.z * 0.1
      );
      
      churchModel.rotation.set(0, 30, 0);
      scene.add(churchModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('church', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Church: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading church model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Grave Model with interactive detection - 🌍 WITH WORLD BUILDER REGISTRATION
  let graveModel = null;
  loadModelOptimized(
    'grave.glb',
    function (gltf) {
      console.log('Grave model loaded successfully');
      graveModel = gltf.scene;
      graveModel.scale.set(0.015, 0.015, 0.015);
      
      const box = new THREE.Box3().setFromObject(graveModel);
      const center = box.getCenter(new THREE.Vector3());
      
      graveModel.position.set(16, 0, 10);
      graveModel.rotation.set(0, 10, 0);
      
      // Mark grave as interactive
      graveModel.userData = {
        type: 'tombstone',
        interactive: true,
        name: 'Ancient Tombstone'
      };
      
      scene.add(graveModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('grave', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Grave: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading grave model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Altar Model - 🌍 WITH WORLD BUILDER REGISTRATION
  let altarModel = null;
  loadModelOptimized(
    'altar.glb',
    function (gltf) {
      console.log('Altar model loaded successfully');
      altarModel = gltf.scene;
      altarModel.scale.set(0.3, 0.3, 0.3);
      
      const box = new THREE.Box3().setFromObject(altarModel);
      const center = box.getCenter(new THREE.Vector3());
      
      altarModel.position.set(
        -15 - center.x * 0.3,
        0,
        -8 - center.z * 0.3
      );
      
      altarModel.rotation.set(0, Math.PI/4, 0);
      scene.add(altarModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('altar', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Altar: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading altar model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Paper Model with interactive detection - 🌍 WITH WORLD BUILDER REGISTRATION
  let paperModel = null;
  loadModelOptimized(
    'paper.glb',
    function (gltf) {
      console.log('Paper model loaded successfully');
      paperModel = gltf.scene;
      paperModel.scale.set(0.5, 0.5, 0.5);
      
      const box = new THREE.Box3().setFromObject(paperModel);
      const center = box.getCenter(new THREE.Vector3());
      
      paperModel.position.set(22, 1, -5);
      paperModel.rotation.set(0, -Math.PI/6, 0);
      
      // Mark paper as interactive
      paperModel.userData = {
        type: 'paper',
        interactive: true,
        name: 'Creative Journey Letter'
      };
      
      scene.add(paperModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('paper', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Paper: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading paper model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Animated Crow Model - 🌍 WITH WORLD BUILDER REGISTRATION
  let crowModel = null;
  loadModelOptimized(
    'crow.glb',
    function (gltf) {
      console.log('Crow model loaded successfully');
      console.log('Crow animations found:', gltf.animations.length);
      
      // Log all animation names for debugging
      gltf.animations.forEach((anim, index) => {
        console.log(`Animation ${index}: ${anim.name || 'Unnamed'}`);
      });
      
      crowModel = gltf.scene;
      crowModel.scale.set(1.1, 1.1, 1.1); // Make crow a bit bigger
      
      const box = new THREE.Box3().setFromObject(crowModel);
      const center = box.getCenter(new THREE.Vector3());
      
      // Position crow on the altar or nearby
      crowModel.position.set(14, 1.4, -18);
      crowModel.rotation.set(0, 10, 0);
      
      // Mark crow as interactive
      crowModel.userData = {
        type: 'crow',
        interactive: true,
        name: 'Messenger Crow'
      };
      
      // Setup animation mixer
      if (gltf.animations && gltf.animations.length > 0) {
        crowMixer = new THREE.AnimationMixer(crowModel);
        
        // Play animation2 (index 1) specifically
        if (gltf.animations.length > 1) {
          const animation2 = crowMixer.clipAction(gltf.animations[1]); // Animation2 is index 1
          animation2.setLoop(THREE.LoopRepeat);
          animation2.play();
          console.log('Playing animation2 on repeat');
        } else {
          console.warn('Animation2 not found, playing first available animation');
          const firstAnimation = crowMixer.clipAction(gltf.animations[0]);
          firstAnimation.setLoop(THREE.LoopRepeat);
          firstAnimation.play();
        }
      }
      
      scene.add(crowModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('crow', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Crow: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading crow model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Desk Model - 🌍 WITH WORLD BUILDER REGISTRATION
  // Load Desk Model (UPDATED TO BE INTERACTIVE) - 🌍 WITH WORLD BUILDER REGISTRATION
let deskModel = null;
loadModelOptimized(
  'desk.glb',
  function (gltf) {
    console.log('Desk model loaded successfully');
    deskModel = gltf.scene;
    deskModel.scale.set(0.65, 0.6, 0.65);
    
    const box = new THREE.Box3().setFromObject(deskModel);
    const center = box.getCenter(new THREE.Vector3());
    
    deskModel.position.set(11, -0.1, -18);
    deskModel.rotation.set(0, 4.5, 0);
    
    // Mark desk as interactive
    deskModel.userData = {
      type: 'desk',
      interactive: true,
      name: 'Artist\'s Workspace'
    };
    
    scene.add(deskModel);
    
    // 🌍 REGISTER WITH WORLD BUILDER
    registerModelWithWorldBuilder('desk', gltf);
    
    loadedModels++;
    updateLoadingProgress(loadedModels, totalModelsToLoad);
  },
  function (xhr) {
    if (xhr.lengthComputable) {
      console.log('Desk: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
    }
  },
  function (error) {
    console.error('Error loading desk model:', error);
    loadedModels++;
    updateLoadingProgress(loadedModels, totalModelsToLoad);
  }
);

  // Load desk2 - 🌍 WITH WORLD BUILDER REGISTRATION
  let desk2Model = null;
  loadModelOptimized(
    'desk2.glb',
    function (gltf) {
      console.log('Desk2 model loaded successfully');
      desk2Model = gltf.scene;
      desk2Model.scale.set(0.3, 0.3, 0.3);
      
      const box = new THREE.Box3().setFromObject(desk2Model);
      const center = box.getCenter(new THREE.Vector3());
      
      desk2Model.position.set(13.5, -2, -18);
      desk2Model.rotation.set(0, 0, 0);
      
      scene.add(desk2Model);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('desk2', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Desk2: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading desk2 model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Book1 Model (Decorative) - 🌍 WITH WORLD BUILDER REGISTRATION
  let book1Model = null;
  loadModelOptimized(
    'book1.glb',
    function (gltf) {
      console.log('Book1 model loaded successfully');
      book1Model = gltf.scene;
      book1Model.scale.set(1.3, 1.3, 1.3);
      
      const box = new THREE.Box3().setFromObject(book1Model);
      const center = box.getCenter(new THREE.Vector3());
      
      book1Model.position.set(11.3, 1.2, -17.9); // On the desk
      book1Model.rotation.set(0, Math.PI/2, 0);
      
      scene.add(book1Model);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('book1', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Book1: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading book1 model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Book2 Model (Interactive Contact Book) - 🌍 WITH WORLD BUILDER REGISTRATION
  let book2Model = null;
  loadModelOptimized(
    'book2.glb',
    function (gltf) {
      console.log('Book2 model loaded successfully');
      book2Model = gltf.scene;
      book2Model.scale.set(0.13, 0.13, 0.13);
      
      const box = new THREE.Box3().setFromObject(book2Model);
      const center = box.getCenter(new THREE.Vector3());
      
      book2Model.position.set(10.2,-0.5, -17.5); // On the desk, next to book1
      book2Model.rotation.set(-0.4, 0.01, 0);
      
      // Mark book2 as interactive for contact info
      book2Model.userData = {
        type: 'book',
        interactive: true,
        name: 'Contact Grimoire'
      };
      
      scene.add(book2Model);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('book2', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Book2: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading book2 model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Scroll Model (Interactive Feedback Form) - 🌍 WITH WORLD BUILDER REGISTRATION
  let scrollModel = null;
  loadModelOptimized(
    'scroll.glb',
    function (gltf) {
      console.log('Scroll model loaded successfully');
      scrollModel = gltf.scene;
      scrollModel.scale.set(0.7, 0.7, 0.7);
      
      const box = new THREE.Box3().setFromObject(scrollModel);
      const center = box.getCenter(new THREE.Vector3());
      
            scrollModel.position.set(13, 1.4, -17.4); // Near desk area, elevated
      scrollModel.rotation.set(0, Math.PI/2, 0);
      
      // Mark scroll as interactive for feedback
      scrollModel.userData = {
        type: 'scroll',
        interactive: true,
        name: 'Feedback Scroll'
      };
      
      scene.add(scrollModel);
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('scroll', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Scroll: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading scroll model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Load Portal Models (UPDATED TO ONLY ONE PORTAL - 3D ART) - 🌍 WITH WORLD BUILDER REGISTRATION
  const portalModels = [];
  loadModelOptimized(
    'portal.glb',
    function (gltf) {
      console.log('Portal model loaded successfully');
      const originalPortal = gltf.scene;
      
      // Create return portal for gallery
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

      // Create main scene portal (ONLY ONE PORTAL - 3D ART)
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
        label: '3D ART',
        destination: '3D SHOWCASE',
        position: new THREE.Vector3(0, 1, -12),
        teleport: true,
        sceneTarget: 'gallery3D'
      };
      
      scene.add(portalModel);
      portalModels.push(portalModel);
      
      // Add floating text label above portal
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.font = "bold 16px Montserrat";
      ctx.fillStyle="#fff";
      ctx.textAlign="center";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 2;
      ctx.fillText('3D ART', 64, 24);
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
      
      // 🌍 REGISTER WITH WORLD BUILDER
      registerModelWithWorldBuilder('portal', gltf);
      
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    },
    function (xhr) {
      if (xhr.lengthComputable) {
        console.log('Portal: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      }
    },
    function (error) {
      console.error('Error loading portal model:', error);
      loadedModels++;
      updateLoadingProgress(loadedModels, totalModelsToLoad);
    }
  );

  // Optimized lighting for main scene
  const ambLight = new THREE.AmbientLight(0xffffff, 0.4); 
  scene.add(ambLight);
  
  const dirLight = new THREE.DirectionalLight(0xfff0b1, 0.7); 
  dirLight.position.set(10, 14, 4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.mapSize.setScalar(512); // Reduced shadow map size
  scene.add(dirLight);

  // Mouse look controls
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  const MOUSE_SENSITIVITY = 0.002;

  // Mouse movement only works when game is started and pointer is locked
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement && gameStarted && !paperReadingMode) {
      mouseX = e.movementX || 0;
      mouseY = e.movementY || 0;
      
      targetRotationY -= mouseX * MOUSE_SENSITIVITY;
      currentRotationX -= mouseY * MOUSE_SENSITIVITY;
      
      // Limit vertical rotation (more freedom in spectator mode)
      if (spectatorMode) {
        currentRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
      } else {
        currentRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, currentRotationX));
      }
    }
  });

  // Movement and physics variables
  const keys = {};

  // Separate handling for keydown and keyup to better manage Q key
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

  // Jump physics
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpForce = 8;
  const gravity = 20;

  // Portal/interactive object detection variables
  const raycaster = new THREE.Raycaster();
  const portalDetectionDistance = 3;
  const deskDetectionDistance = 4; // Same as paper
  const paperDetectionDistance = 4; // Slightly larger for paper
  const tombstoneDetectionDistance = 4; // Same as paper
  const bookDetectionDistance = 4; // Same as paper
  const scrollDetectionDistance = 4; // Same as paper
  let currentPortalInView = null;
  let currentPaperInView = null;
  let currentTombstoneInView = null;
  let currentBookInView = null;
  let currentScrollInView = null;

  // Scene switching functions (SIMPLIFIED - ONLY 3D GALLERY)
  function switchToGallery() {
    portfolioAnalytics.trackSceneChange('gallery3D');
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    // Move character to gallery scene
    scene.remove(characterGroup);
    galleryScene.add(characterGroup);
    
    // Reset character position
    characterGroup.position.set(0, 0, 10);
    
    updateControlsDisplay();
    console.log('Switched to 3D gallery scene');
  }

  function switchToMain() {
    portfolioAnalytics.trackSceneChange('main');
    currentScene = 'main';
    activeScene = scene;
    spectatorMode = false;
    
    // Move character back to main scene from gallery
    galleryScene.remove(characterGroup);
    scene.add(characterGroup);
    
    // Reset character position
    characterGroup.position.set(0, 0, 5);
    
    updateControlsDisplay();
    console.log('Switched to main scene');
  }

  function switchToModelViewer(artIndex) {
    portfolioAnalytics.trackSceneChange(`modelViewer_${artPieces[artIndex].name}`);
    spectatorMode = true;
    
    const sceneMap = {
      0: cubeViewerScene,
      1: sphereViewerScene, 
      2: cylinderViewerScene,
      3: coneViewerScene
    };
    
    currentScene = `model-${artIndex}`;
    activeScene = sceneMap[artIndex];
    
    // Remove character from gallery (spectator mode = no visible character)
    galleryScene.remove(characterGroup);
    
    // Position camera for good view of the model
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    
    // Reset camera rotation
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log(`Switched to model viewer for ${artPieces[artIndex].name}`);
  }

  function returnToGallery() {
    currentScene = 'gallery';
    activeScene = galleryScene;
    spectatorMode = false;
    
    // Add character back to gallery
    galleryScene.add(characterGroup);
    characterGroup.position.set(0, 0, 10);
    
    // Reset camera rotation for normal mode
    targetRotationY = 0;
    currentRotationX = 0;
    
    updateControlsDisplay();
    console.log('Returned to gallery from model viewer');
  }

  function openPaper() {
    portfolioAnalytics.trackInteraction('paper', 'read', { name: 'Creative Journey Letter' });
    paperReadingMode = true;
    deskInfoWindow.style.display = 'none';
    paperOverlay.style.display = 'block';
    
    // Exit pointer lock to allow mouse scrolling
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Hide info windows
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
    portfolioAnalytics.trackInteraction('tombstone', 'read', { name: 'Ancient Tombstone' });
    paperReadingMode = true; // Use same state variable
    deskInfoWindow.style.display = 'none'; 
    tombstoneOverlay.style.display = 'block';
    
    // Exit pointer lock to allow mouse scrolling
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Hide info windows
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
    portfolioAnalytics.trackInteraction('book', 'read', { name: 'Contact Grimoire' });
    paperReadingMode = true; // Use same state variable
    deskInfoWindow.style.display = 'none'; 
    bookOverlay.style.display = 'block';
    
    // Exit pointer lock to allow mouse scrolling
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Hide info windows
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
    portfolioAnalytics.trackInteraction('scroll', 'open', { name: 'Feedback Scroll' });
    paperReadingMode = true; // Use same state variable
    scrollOverlay.style.display = 'block';
    deskInfoWindow.style.display = 'none'; 
    
    // Exit pointer lock to allow mouse scrolling
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Hide info windows
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

  function openDesk() {
  portfolioAnalytics.trackInteraction('desk', 'explore', { name: 'Artist\'s Workspace' });
  paperReadingMode = true; // Use same state variable
  deskOverlay.style.display = 'block';
  
  // Reinitialize kudos system for this session
  setTimeout(() => {
    deskKudosSystem.attachButtonListener();
    deskKudosSystem.updateDisplay();
  }, 100);
  
  // Exit pointer lock to allow mouse scrolling
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  
  // Hide info windows
  portalInfoWindow.style.display = 'none';
  paperInfoWindow.style.display = 'none';
  tombstoneInfoWindow.style.display = 'none';
  bookInfoWindow.style.display = 'none';
  scrollInfoWindow.style.display = 'none';
  deskInfoWindow.style.display = 'none';
  currentPaperInView = null;
  currentPortalInView = null;
  currentTombstoneInView = null;
  currentBookInView = null;
  currentScrollInView = null;
  currentDeskInView = null;
}

  // Function to check if crosshair is directly pointing at any portal or interactive element
  function checkPortalView() {
    if (!gameStarted || paperReadingMode) return;

    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    raycaster.set(camera.position, cameraDirection);

    let allTargetMeshes = [];
    let paperMeshes = [];
    let tombstoneMeshes = [];
    let bookMeshes = [];
    let scrollMeshes = [];
    let deskMeshes = [];
    
    if (currentScene === 'main') {
      // Check portal models in main scene
      portalModels.forEach(portalModel => {
        portalModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPortal = portalModel;
            allTargetMeshes.push(child);
          }
        });
      });
      
      // Check paper model
      if (paperModel) {
        paperModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPaper = paperModel;
            paperMeshes.push(child);
          }
        });
      }

      // Check tombstone model
      if (graveModel) {
        graveModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentTombstone = graveModel;
            tombstoneMeshes.push(child);
          }
        });
      }

      // Check book2 model
      if (book2Model) {
        book2Model.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentBook = book2Model;
            bookMeshes.push(child);
          }
        });
      }

      // Check scroll model
      if (scrollModel) {
        scrollModel.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentScroll = scrollModel;
            scrollMeshes.push(child);
          }
        });
      }
      // Check desk model
if (deskModel) {
  deskModel.traverse((child) => {
    if (child.isMesh) {
      child.userData.parentDesk = deskModel;
      deskMeshes.push(child);
    }
  });
}
    } else if (currentScene === 'gallery') {
      // Check return portal and gallery frames for 3D gallery
      const returnPortal = galleryScene.children.find(child => 
        child.userData && child.userData.type === 'return-portal'
      );
      if (returnPortal) {
        returnPortal.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentPortal = returnPortal;
            allTargetMeshes.push(child);
          }
        });
      }
      
      // Add interactive gallery frames
      allTargetMeshes.push(...interactiveAreas);
    }

    // Priority system: Paper > Scroll > Book > Tombstone > Portals
    
    // Check for paper intersections first (highest priority)
    const paperIntersects = raycaster.intersectObjects(paperMeshes);
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
      // Show paper info window
      paperInfoWindow.style.display = 'block';
      portalInfoWindow.style.display = 'none';
      tombstoneInfoWindow.style.display = 'none';
      bookInfoWindow.style.display = 'none';
      scrollInfoWindow.style.display = 'none';
      currentPaperInView = targetPaper;
      currentPortalInView = null;
      currentTombstoneInView = null;
      currentBookInView = null;
      currentScrollInView = null;
      return; // Priority to paper, don't check others
    } else {
      paperInfoWindow.style.display = 'none';
      currentPaperInView = null;
    }

    // Check for scroll intersections second (very high priority)
    const scrollIntersects = raycaster.intersectObjects(scrollMeshes);
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
      // Show scroll info window
      scrollInfoWindow.style.display = 'block';
      portalInfoWindow.style.display = 'none';
      tombstoneInfoWindow.style.display = 'none';
      bookInfoWindow.style.display = 'none';
      currentScrollInView = targetScroll;
      currentPortalInView = null;
      currentTombstoneInView = null;
      currentBookInView = null;
      return; // Priority to scroll, don't check others
    } else {
      scrollInfoWindow.style.display = 'none';
      currentScrollInView = null;
    }

    // Check for desk intersections third (high priority)
const deskIntersects = raycaster.intersectObjects(deskMeshes);
let targetDesk = null;
let deskDistance = Infinity;

for (const intersect of deskIntersects) {
  const distance = intersect.distance;
  if (distance <= deskDetectionDistance && distance < deskDistance) {
    targetDesk = intersect.object.userData.parentDesk;
    deskDistance = distance;
  }
}

if (targetDesk) {
  // Show desk info window
  deskInfoWindow.style.display = 'block';
  portalInfoWindow.style.display = 'none';
  tombstoneInfoWindow.style.display = 'none';
  bookInfoWindow.style.display = 'none';
  currentDeskInView = targetDesk;
  currentPortalInView = null;
  currentTombstoneInView = null;
  currentBookInView = null;
  return; // Priority to desk, don't check others
} else {
  deskInfoWindow.style.display = 'none';
  currentDeskInView = null;
}


    // Check for book intersections third (high priority)
    const bookIntersects = raycaster.intersectObjects(bookMeshes);
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
      // Show book info window
      bookInfoWindow.style.display = 'block';
      portalInfoWindow.style.display = 'none';
      tombstoneInfoWindow.style.display = 'none';
      currentBookInView = targetBook;
      currentPortalInView = null;
      currentTombstoneInView = null;
      return; // Priority to book, don't check others
    } else {
      bookInfoWindow.style.display = 'none';
      currentBookInView = null;
    }

    // Check for tombstone intersections fourth (medium priority)
    const tombstoneIntersects = raycaster.intersectObjects(tombstoneMeshes);
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
      // Show tombstone info window
      tombstoneInfoWindow.style.display = 'block';
      portalInfoWindow.style.display = 'none';
      currentTombstoneInView = targetTombstone;
      currentPortalInView = null;
      return; // Priority to tombstone, don't check portals
    } else {
      tombstoneInfoWindow.style.display = 'none';
      currentTombstoneInView = null;
    }

    // Check for portal intersections last (lowest priority)
    const intersects = raycaster.intersectObjects(allTargetMeshes);
    let targetObject = null;
    let targetDistance = Infinity;

    for (const intersect of intersects) {
      const distance = intersect.distance;
      
      if (distance <= portalDetectionDistance && distance < targetDistance) {
        if (intersect.object.userData.type === 'gallery-frame') {
          targetObject = intersect.object;
        } else if (intersect.object.userData.parentPortal) {
          targetObject = intersect.object.userData.parentPortal;
        }
        targetDistance = distance;
      }
    }

    if (targetObject) {
      // Show portal info window
      portalInfoWindow.style.display = 'block';
      currentPortalInView = targetObject;
      
      // Update distance and destination display
      const distanceElement = document.getElementById('portal-distance');
      const destinationElement = document.getElementById('portal-destination');
      if (distanceElement) {
        distanceElement.textContent = targetDistance.toFixed(1) + 'm';
      }
      if (destinationElement) {
        if (targetObject.userData.type === 'gallery-frame') {
          destinationElement.textContent = `${artPieces[targetObject.userData.artIndex].name.toUpperCase()} VIEWER`;
        } else if (currentScene === 'main') {
          destinationElement.textContent = targetObject.userData.destination;
        } else {
          destinationElement.textContent = targetObject.userData.destination;
        }
      }
    } else {
      // Hide portal info window
      portalInfoWindow.style.display = 'none';
      currentPortalInView = null;
    }
  }

  // Enhanced collision detection - only for main scene
  function checkCollision(currentPosition, newPosition) {
    if (currentScene !== 'main') return false; // No collisions in gallery or spectator mode
    
    const characterRadius = 0.4;
    
    for (const collisionBox of collisionBoxes) {
      const boxGeometry = collisionBox.geometry;
      const boxPosition = collisionBox.position;
      
      if (boxGeometry.type === 'CylinderGeometry') {
        // Cylinder collision detection
        const cylinderRadius = boxGeometry.parameters.radiusTop;
        const cylinderHeight = boxGeometry.parameters.height;
        const cylinderTop = boxPosition.y + cylinderHeight/2;
        const cylinderBottom = boxPosition.y - cylinderHeight/2;
        
        // Check horizontal distance for both current and new positions
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
        // Box collision detection
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

  // Function to get the ground level at a specific position
  function getGroundLevel(position) {
    if (currentScene !== 'main') return 0; // Gallery has flat ground
    
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
    if (!gameStarted || paperReadingMode) return;
    
    if (spectatorMode) {
      // Spectator mode movement (free flight)
      const spectatorMoveSpeed = spectatorSpeed;
      
      // Get movement directions
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
      
      return; // Skip normal character movement in spectator mode
    }
    
    // Normal character movement
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
    
    // Test movement in X direction
    const testPositionX = characterGroup.position.clone();
    testPositionX.x += desiredVelocity.x;
    if (!checkCollision(characterGroup.position, testPositionX)) {
      characterGroup.position.x = testPositionX.x;
    }
    
    // Test movement in Z direction
    const testPositionZ = characterGroup.position.clone();
    testPositionZ.z += desiredVelocity.z;
    if (!checkCollision(characterGroup.position, testPositionZ)) {
      characterGroup.position.z = testPositionZ.z;
    }
    
    // Jump logic
    if (keys[' '] && !isJumping) {
      isJumping = true;
      jumpVelocity = jumpForce;
    }
    
    // Interactive object activation (SIMPLIFIED FOR ONE GALLERY)
    if (keys['e']) {
      if (currentPaperInView) {
        openPaper();
      } else if (currentScrollInView) {
        openScroll();
      } else if (currentDeskInView) {
        openDesk();
      } else if (currentBookInView) {
        openBook();
      } else if (currentTombstoneInView) {
        openTombstone();
      } else if (currentPortalInView) {
        if (currentScene === 'main' && currentPortalInView.userData.teleport) {
          // Switch to 3D gallery
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
    
    // Apply gravity and update vertical position
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
    
    // Clamp position to boundaries
    characterGroup.position.x = Math.max(Math.min(characterGroup.position.x, 23), -23);
    characterGroup.position.z = Math.max(Math.min(characterGroup.position.z, 23), -18);
    
    characterGroup.rotation.y = targetRotationY;
  }

  function updateCamera() {
    if (spectatorMode) {
      // In spectator mode, camera position is controlled directly
      // Just apply rotation
      camera.rotation.set(currentRotationX, targetRotationY, 0, 'YXZ');
    } else {
      // Normal third-person camera
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
    timeDisplay.style.display = showUI ? 'block' : 'none'; // Add time display
  }

  // Pointer lock exit handler - RESTORED TO SHOW HOME OVERLAY
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && gameStarted && !paperReadingMode) {
      // Show home overlay when exiting pointer lock (ESC key behavior)
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

  // ESC key handler - RESTORED TO EXIT POINTER LOCK
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameStarted && document.pointerLockElement && !paperReadingMode) {
      document.exitPointerLock(); // This will trigger the pointerlockchange event above
    }
    
    // Only allow Enter/Space to start game if models are loaded
    if(document.getElementById('overlay-home').classList.contains('visible') && (e.key==='Enter'||e.key===' ') && allModelsLoaded) {
      closeOverlay('home');
    }
  });

  // Optimized render loop with performance monitoring
  let lastTime = performance.now();
  
  function animate() {
    let now = performance.now(), dt = (now-lastTime)/1000;
    lastTime = now;
    
    updateUIVisibility();
    
    // Update day/night cycle
    updateDayNightCycle();
    
    // Update crow animation
    if (crowMixer) {
      crowMixer.update(dt);
    }
    
    if(gameStarted && !document.getElementById('overlay-home').classList.contains('visible') && !paperReadingMode) {
      moveCharacter(dt);
      checkPortalView();
    }
    
    // Rotate models in viewer scenes (optimized)
    if (activeScene.userData && activeScene.userData.rotatingMesh) {
      activeScene.userData.rotatingMesh.rotation.y += dt * 0.5;
    }
    
    updateCamera();
    renderer.render(activeScene, camera); // Render the active scene
    requestAnimationFrame(animate);
  }

  animate();

} catch (error) {
  console.error('Fatal error in initialization:', error);
  document.body.innerHTML = `
    <div style="padding:20px;color:white;background:rgba(0,0,0,0.8)">
      <h2>Error Loading Scene</h2>
      <p>${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
}

// ✅ Add Debug Helper Function
window.debugWorldBuilder = function() {
  if (worldBuilder) {
    worldBuilder.debugWorldState();
  } else {
    console.log('❌ World Builder not initialized');
  }
};

// ✅ GitHub Pages Compatible Analytics
class GitHubPagesAnalytics {
  constructor() {
    this.events = JSON.parse(localStorage.getItem('portfolio_analytics') || '[]');
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  track(event, data = {}) {
    const eventData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      event,
      data,
      sessionId: this.sessionId,
      sessionTime: Date.now() - this.startTime,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href
    };
    
    this.events.push(eventData);
    
    // Keep only last 1000 events (storage limit)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    localStorage.setItem('portfolio_analytics', JSON.stringify(this.events));
    
    // ✅ Optional: Send to external service (if you want)
    this.sendToExternalService(eventData);
  }
  
  // ✅ Can export data for manual review
  exportData() {
    const blob = new Blob([JSON.stringify(this.events, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // ✅ Optional: Use free external analytics
  sendToExternalService(eventData) {
    // Google Analytics 4 (free)
    if (typeof gtag !== 'undefined') {
      gtag('event', eventData.event, eventData.data);
    }
    
    // Or simple webhook service (like Zapier, IFTTT)
    // fetch('https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK/', {
    //   method: 'POST',
    //   body: JSON.stringify(eventData)
    // }).catch(() => {}); // Fail silently
  }
}

// ✅ GitHub Pages Compatible Error Handling
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
    
    // Keep last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    
    localStorage.setItem('portfolio_errors', JSON.stringify(this.errors));
    
    // ✅ Show user-friendly message
    this.showErrorToUser(type, details);
  }
  
  showErrorToUser(type, details) {
    if (type === 'model_load_failed') {
      console.warn('Some 3D models failed to load. Experience may be limited.');
    }
  }
  
  // ✅ Export for debugging
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

// Initialize error reporting
const errorReporter = new StaticErrorReporter();

// Make available for debugging
window.errorReporter = errorReporter;



// Debug functions for kudos system
window.debugKudos = function() {
  console.log('🔍 Kudos System Debug:', deskKudosSystem.getStats());
};

window.resetKudos = function() {
  deskKudosSystem.resetKudos();
  console.log('🔄 Kudos system reset');
};

window.addTestKudos = function(amount = 10) {
  for(let i = 0; i < amount; i++) {
    localStorage.setItem('finnb24_desk_kudos', (parseInt(localStorage.getItem('finnb24_desk_kudos') || '0') + 1).toString());
  }
  deskKudosSystem.loadKudosCount();
  deskKudosSystem.updateDisplay();
  console.log(`➕ Added ${amount} test kudos`);
};
