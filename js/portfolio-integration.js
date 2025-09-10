/**
 * Portfolio Integration Manager
 * 
 * Main integration script that coordinates data loading and visualization updates
 * Handles initialization, error recovery, and progressive enhancement
 */

class PortfolioIntegrationManager {
  constructor(options = {}) {
    this.options = {
      dataUrl: './data/portfolio.json',
      enableVisualizations: options.enableVisualizations !== false,
      enableAnimations: options.enableAnimations !== false,
      enableLiveDataBadge: options.enableLiveDataBadge !== false,
      autoRefreshInterval: options.autoRefreshInterval || 300000, // 5 minutes
      debug: options.debug || false,
      ...options
    };
    
    this.dataLoader = null;
    this.visualizations = null;
    this.isInitialized = false;
    this.refreshIntervalId = null;
    
    this.log('PortfolioIntegrationManager initialized');
  }
  
  /**
   * Initialize the complete portfolio integration system
   */
  async init() {
    try {
      this.log('Starting portfolio integration initialization...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Initialize data loader
      await this.initializeDataLoader();
      
      // Initialize visualizations if enabled
      if (this.options.enableVisualizations) {
        await this.initializeVisualizations();
      }
      
      // Set up automatic refresh
      this.setupAutoRefresh();
      
      // Set up error recovery
      this.setupErrorRecovery();
      
      // Track initialization
      this.trackInitialization();
      
      this.isInitialized = true;
      this.log('Portfolio integration initialization complete');
      
      // Dispatch initialization event
      this.dispatchEvent('portfolioIntegrationReady', {
        hasData: !!this.dataLoader?.getCurrentData(),
        hasVisualizations: !!this.visualizations,
        config: this.options
      });
      
    } catch (error) {
      this.handleError('Integration initialization failed', error);
    }
  }
  
  /**
   * Initialize the data loader component
   */
  async initializeDataLoader() {
    if (!window.PortfolioDataLoader) {
      throw new Error('PortfolioDataLoader not available');
    }
    
    this.dataLoader = new window.PortfolioDataLoader({
      dataUrl: this.options.dataUrl,
      enableAnimations: this.options.enableAnimations,
      enableLiveDataBadge: this.options.enableLiveDataBadge,
      debug: this.options.debug
    });
    
    // Add observer to update visualizations when data changes
    this.dataLoader.addObserver((event, data) => {
      if (event === 'dataApplied' && this.visualizations) {
        this.updateVisualizations(data);
      }
    });
    
    await this.dataLoader.init();
    this.log('Data loader initialized');
  }
  
  /**
   * Initialize visualization components
   */
  async initializeVisualizations() {
    if (!window.PortfolioVisualizations) {
      this.log('PortfolioVisualizations not available, skipping visualization init');
      return;
    }
    
    this.visualizations = new window.PortfolioVisualizations({
      enableAnimations: this.options.enableAnimations,
      debug: this.options.debug
    });
    
    // Initialize with current data if available
    const currentData = this.dataLoader?.getCurrentData();
    if (currentData) {
      this.visualizations.init(currentData);
    }
    
    this.log('Visualizations initialized');
  }
  
  /**
   * Update visualizations with new data
   */
  updateVisualizations(data) {
    if (!this.visualizations || !data) return;
    
    try {
      this.visualizations.updateData(data);
      this.log('Visualizations updated with new data');
    } catch (error) {
      this.log('Failed to update visualizations:', error.message);
    }
  }
  
  /**
   * Set up automatic data refresh
   */
  setupAutoRefresh() {
    if (!this.options.autoRefreshInterval || this.options.autoRefreshInterval <= 0) {
      return;
    }
    
    this.refreshIntervalId = setInterval(async () => {
      if (!document.hidden && this.isInitialized) {
        try {
          this.log('Auto-refresh triggered');
          await this.refresh();
        } catch (error) {
          this.log('Auto-refresh failed:', error.message);
        }
      }
    }, this.options.autoRefreshInterval);
    
    this.log(`Auto-refresh set up (${this.options.autoRefreshInterval / 1000}s interval)`);
  }
  
  /**
   * Set up error recovery mechanisms
   */
  setupErrorRecovery() {
    // Retry failed requests after network comes back online
    window.addEventListener('online', () => {
      if (this.isInitialized) {
        this.log('Network back online, attempting data refresh');
        setTimeout(() => {
          this.refresh().catch(error => {
            this.log('Recovery refresh failed:', error.message);
          });
        }, 1000);
      }
    });
    
    // Handle visibility change for efficient resource usage
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        // Page became visible, check if refresh is needed
        this.checkAndRefreshIfNeeded();
      }
    });
  }
  
  /**
   * Check if refresh is needed and perform it
   */
  async checkAndRefreshIfNeeded() {
    if (!this.dataLoader) return;
    
    const currentData = this.dataLoader.getCurrentData();
    if (!currentData) {
      this.log('No current data, refreshing...');
      await this.refresh();
      return;
    }
    
    // Check data age
    const dataAge = Date.now() - new Date(currentData.timestamp).getTime();
    const maxAge = this.options.autoRefreshInterval || 300000; // 5 minutes
    
    if (dataAge > maxAge) {
      this.log('Data is stale, refreshing...');
      await this.refresh();
    }
  }
  
  /**
   * Manually refresh data and visualizations
   */
  async refresh() {
    if (!this.dataLoader) {
      throw new Error('Data loader not initialized');
    }
    
    try {
      this.log('Starting manual refresh...');
      await this.dataLoader.refresh();
      this.log('Manual refresh completed');
      
      // Dispatch refresh event
      this.dispatchEvent('portfolioRefreshed', {
        timestamp: new Date().toISOString(),
        data: this.dataLoader.getCurrentData()
      });
      
    } catch (error) {
      this.handleError('Manual refresh failed', error);
      throw error;
    }
  }
  
  /**
   * Get current portfolio data
   */
  getCurrentData() {
    return this.dataLoader?.getCurrentData() || null;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    const dataLoaderStatus = this.dataLoader?.getLoadingState() || {};
    
    return {
      isInitialized: this.isInitialized,
      hasData: !!this.getCurrentData(),
      hasVisualizations: !!this.visualizations,
      dataLoader: dataLoaderStatus,
      autoRefreshEnabled: !!this.refreshIntervalId,
      lastRefresh: this.getCurrentData()?.timestamp || null
    };
  }
  
  /**
   * Enhanced hero section integration
   */
  updateHeroSection() {
    const data = this.getCurrentData();
    if (!data) return;
    
    // Update hero title and subtitle with dynamic content
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle) {
      const projectCount = data.portfolio.scale.projectCount;
      const techStacks = data.portfolio.scale.techStackCount;
      
      // Transform title from static to dynamic
      if (!heroTitle.textContent.includes('128+')) {
        heroTitle.innerHTML = heroTitle.innerHTML.replace(
          'AI-Powered Business Solutions',
          `${projectCount}+ Projects • ${techStacks}+ Tech Stacks`
        );
      }
    }
    
    if (heroSubtitle) {
      const locAnalyzed = Math.round(data.portfolio.scale.linesOfCode / 1000000);
      const healthScore = data.portfolio.scale.avgHealthScore;
      const productionReady = data.portfolio.quality.productionReadyRate;
      
      heroSubtitle.innerHTML = `
        ${locAnalyzed}M+ lines of code analyzed • 
        ${healthScore}/10 avg health score • 
        ${productionReady} production ready • 
        Live portfolio metrics
      `;
    }
    
    this.log('Hero section updated with dynamic content');
  }
  
  /**
   * Create and show live data indicators
   */
  createLiveDataIndicators() {
    const data = this.getCurrentData();
    if (!data || data.metadata.dataPrivacyLevel === 'fallback-static') return;
    
    // Create floating live indicator
    const indicator = document.createElement('div');
    indicator.className = 'live-data-indicator';
    indicator.innerHTML = `
      <div class="live-indicator-content">
        <div class="live-pulse"></div>
        <span>Live Data</span>
        <span class="live-timestamp">${this.formatTimestamp(data.timestamp)}</span>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(indicator);
    
    // Add CSS styles
    this.injectLiveIndicatorStyles();
    
    this.log('Live data indicator created');
  }
  
  /**
   * Add proof-based content transformations
   */
  addProofBasedContent() {
    const data = this.getCurrentData();
    if (!data) return;
    
    // Find static claims and add proof badges
    const staticClaims = [
      {
        text: 'MongoDB-backed system',
        proof: `${Math.round(data.portfolio.scale.linesOfCode / 1000000)}M+ LOC analyzed`,
        element: document.querySelector('.hero-subtitle')
      },
      {
        text: '17+ specialized agents',
        proof: `${data.portfolio.scale.projectCount}+ active projects`,
        element: document.querySelector('.hero-subtitle, .lead')
      }
    ];
    
    staticClaims.forEach(claim => {
      if (claim.element && claim.element.textContent.includes(claim.text)) {
        // Add proof badge
        const proofBadge = document.createElement('span');
        proofBadge.className = 'proof-badge';
        proofBadge.textContent = `✓ ${claim.proof}`;
        claim.element.appendChild(proofBadge);
      }
    });
    
    this.log('Proof-based content added');
  }
  
  /**
   * Track analytics events
   */
  trackInitialization() {
    if (typeof gtag === 'undefined') return;
    
    const data = this.getCurrentData();
    
    gtag('event', 'portfolio_integration_init', {
      event_category: 'System',
      has_data: !!data,
      data_source: data?.metadata?.dataPrivacyLevel || 'unknown',
      visualizations_enabled: this.options.enableVisualizations,
      animations_enabled: this.options.enableAnimations
    });
  }
  
  /**
   * Dispatch custom events
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    
    document.dispatchEvent(event);
    this.log(`Event dispatched: ${eventName}`, detail);
  }
  
  /**
   * Error handling
   */
  handleError(message, error) {
    this.log(`ERROR: ${message}`, error);
    
    // Track error in analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `Portfolio Integration: ${message}`,
        fatal: false
      });
    }
    
    // Dispatch error event
    this.dispatchEvent('portfolioIntegrationError', {
      message,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Utility methods
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recently';
    }
  }
  
  injectLiveIndicatorStyles() {
    if (document.querySelector('[data-live-indicator-styles]')) return;
    
    const styles = document.createElement('style');
    styles.setAttribute('data-live-indicator-styles', 'true');
    styles.textContent = `
      .live-data-indicator {
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(16, 185, 129, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        z-index: 1000;
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.5s ease-out;
      }
      
      .live-indicator-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .live-pulse {
        width: 8px;
        height: 8px;
        background: #ffffff;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      .live-timestamp {
        opacity: 0.8;
        font-size: 0.7rem;
      }
      
      .proof-badge {
        display: inline-block;
        background: #10b981;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7rem;
        margin-left: 8px;
        font-weight: 500;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      
      @media (max-width: 768px) {
        .live-data-indicator {
          top: 60px;
          right: 10px;
          font-size: 0.7rem;
          padding: 6px 10px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Debug logging
   */
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[PortfolioIntegrationManager] ${message}`, ...args);
    }
  }
  
  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    
    if (this.visualizations) {
      this.visualizations.destroy();
    }
    
    this.isInitialized = false;
    this.log('Portfolio integration destroyed');
  }
}

// Global initialization function
window.initPortfolioIntegration = function(options = {}) {
  const manager = new window.PortfolioIntegrationManager(options);
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      manager.init().catch(error => {
        console.error('Portfolio integration failed:', error);
      });
    });
  } else {
    // DOM already ready
    manager.init().catch(error => {
      console.error('Portfolio integration failed:', error);
    });
  }
  
  // Store global reference
  window.portfolioIntegration = manager;
  
  return manager;
};

// Auto-initialize with default options if no manual initialization
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-initialize if not manually initialized
  if (!window.portfolioIntegration) {
    const isProduction = window.location.hostname !== 'localhost';
    const debug = !isProduction && window.location.search.includes('debug=true');
    
    window.initPortfolioIntegration({
      debug: debug,
      enableVisualizations: true,
      enableAnimations: true
    });
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioIntegrationManager;
}

// Global availability
if (typeof window !== 'undefined') {
  window.PortfolioIntegrationManager = PortfolioIntegrationManager;
}