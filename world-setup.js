class WorldSetup {
  constructor(worldBuilder) {
    this.worldBuilder = worldBuilder;
  }

  exportForProduction() {
    const worldData = {
      version: '1.0',
      created: new Date().toISOString(),
      isProduction: true,
      objects: this.worldBuilder.placedObjects.map(obj => ({
        modelName: obj.userData.modelName,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        userData: obj.userData
      }))
    };
    
    localStorage.setItem('world-builder-production', JSON.stringify(worldData));
    
    const blob = new Blob([JSON.stringify(worldData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-world-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return worldData;
  }
  
  loadProduction() {
    try {
      const stored = localStorage.getItem('world-builder-production');
      if (stored) {
        localStorage.setItem('world-builder-save', stored);
        location.reload(); 
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load production world:', error);
      return false;
    }
  }
  

  clearProduction() {
    try {
      localStorage.removeItem('world-builder-production');
      localStorage.removeItem('world-builder-save');
      location.reload();
    } catch (error) {
      console.error('Failed to clear production world:', error);
    }
  }
}

if (typeof worldBuilder !== 'undefined') {
  window.worldSetup = new WorldSetup(worldBuilder);
}
