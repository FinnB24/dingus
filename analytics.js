/**
 * Simple analytics tracker for the portfolio
 */
class PortfolioAnalytics {
  constructor() {
    this.interactions = [];
    console.log('Portfolio Analytics initialized');
  }
  
  /**
   * Track user interaction with the portfolio
   * @param {string} category - Category of interaction (e.g., 'portal', 'paper', 'model')
   * @param {string} action - Action performed (e.g., 'view', 'click', 'enter')
   * @param {Object} props - Additional properties to track
   */
  trackInteraction(category, action, props = {}) {
    const interaction = {
      timestamp: new Date().toISOString(),
      category,
      action,
      props
    };
    
    this.interactions.push(interaction);
    console.debug(`Analytics: ${category} ${action}`, props);
    
    // Keep max 1000 interactions in memory
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000);
    }
  }
  
  /**
   * Get analytics data
   */
  getData() {
    return {
      totalInteractions: this.interactions.length,
      interactions: this.interactions
    };
  }
  
  /**
   * Clear analytics data
   */
  clearData() {
    this.interactions = [];
  }
}

// Export a global instance
export const portfolioAnalytics = new PortfolioAnalytics();

// Make it available globally for debugging
window.portfolioAnalytics = portfolioAnalytics;
