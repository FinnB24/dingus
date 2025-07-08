class PortfolioAnalytics {
  constructor() {
    this.interactions = [];
  }
  
  trackInteraction(category, action, props = {}) {
    const interaction = {
      timestamp: new Date().toISOString(),
      category,
      action,
      props
    };
    
    this.interactions.push(interaction);
    
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000);
    }
  }

  getData() {
    return {
      totalInteractions: this.interactions.length,
      interactions: this.interactions
    };
  }

  clearData() {
    this.interactions = [];
  }
}

export const portfolioAnalytics = new PortfolioAnalytics();

window.portfolioAnalytics = portfolioAnalytics;