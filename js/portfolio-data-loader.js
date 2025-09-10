/**
 * Portfolio Data Loader - Dynamic Content Integration
 * 
 * Progressive enhancement JavaScript for transforming static marketing claims
 * into live, proof-based portfolio metrics from Project Universe API
 * 
 * Security-first approach with comprehensive fallback strategies
 */

class PortfolioDataLoader {
  constructor(options = {}) {
    this.options = {
      dataUrl: options.dataUrl || './data/portfolio.json',
      fallbackUrl: options.fallbackUrl || null,
      cacheKey: 'can-code-portfolio-data',
      cacheTTL: options.cacheTTL || 3600000, // 1 hour
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 2000,
      enableAnimations: options.enableAnimations !== false,
      enableLiveDataBadge: options.enableLiveDataBadge !== false,
      debug: options.debug || false,
      ...options
    };
    
    this.data = null;
    this.isLoading = false;
    this.hasLoaded = false;
    this.loadStartTime = null;
    this.integrationPoints = new Map();
    this.observers = new Set();
    
    // Bind methods
    this.load = this.load.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    this.log('PortfolioDataLoader initialized', this.options);
  }
  
  /**
   * Initialize the portfolio data loader
   */
  async init() {
    try {
      this.log('Initializing portfolio data loader...');
      
      // Register integration points
      this.registerIntegrationPoints();
      
      // Add loading states
      this.showLoadingStates();
      
      // Load data with error handling
      await this.load();
      
      // Set up periodic refresh
      this.setupPeriodicRefresh();
      
      // Set up visibility change handling
      this.setupVisibilityHandling();
      
      this.log('Portfolio data loader initialization complete');
      
    } catch (error) {
      this.handleError('Initialization failed', error);
    }
  }
  
  /**
   * Register DOM integration points for dynamic content
   */
  registerIntegrationPoints() {
    // Hero section transformations
    this.integrationPoints.set('project-count', {
      selector: '[data-portfolio="project-count"], #project-count',
      transform: (data) => `${data.portfolio.scale.projectCount}+`,
      fallback: '126+',
      description: 'Active projects count'
    });
    
    this.integrationPoints.set('loc-analyzed', {
      selector: '[data-portfolio="loc-analyzed"], #loc-analyzed',
      transform: (data) => `${Math.round(data.portfolio.scale.linesOfCode / 1000000)}M+`,
      fallback: '147M+',
      description: 'Lines of code analyzed'
    });
    
    this.integrationPoints.set('avg-health-score', {
      selector: '[data-portfolio="avg-health"], #avg-health',
      transform: (data) => `${data.portfolio.scale.avgHealthScore}/10`,
      fallback: '8.2/10',
      description: 'Average health score'
    });
    
    this.integrationPoints.set('tech-stack-count', {
      selector: '[data-portfolio="tech-stacks"], #tech-stacks',
      transform: (data) => `${data.portfolio.scale.techStackCount}+`,
      fallback: '20+',
      description: 'Technology stacks'
    });
    
    // Quality indicators
    this.integrationPoints.set('excellent-projects', {
      selector: '[data-portfolio="excellent-projects"], #excellent-projects',
      transform: (data) => data.portfolio.quality.excellentProjects,
      fallback: '44',
      description: 'Excellent rated projects'
    });
    
    this.integrationPoints.set('good-projects', {
      selector: '[data-portfolio="good-projects"], #good-projects',
      transform: (data) => data.portfolio.quality.goodProjects,
      fallback: '52',
      description: 'Good rated projects'
    });
    
    this.integrationPoints.set('production-ready-rate', {
      selector: '[data-portfolio="production-ready"], #production-ready',
      transform: (data) => data.portfolio.quality.productionReadyRate,
      fallback: '77%',
      description: 'Production readiness rate'
    });
    
    // Technology expertise
    this.integrationPoints.set('js-percentage', {
      selector: '[data-portfolio="js-percentage"], #js-percentage',
      transform: (data) => `${data.portfolio.technologies.languages.JavaScript}%`,
      fallback: '42%',
      description: 'JavaScript expertise'
    });
    
    this.integrationPoints.set('ts-percentage', {
      selector: '[data-portfolio="ts-percentage"], #ts-percentage',
      transform: (data) => `${data.portfolio.technologies.languages.TypeScript}%`,
      fallback: '38%',
      description: 'TypeScript expertise'
    });
    
    this.integrationPoints.set('react-percentage', {
      selector: '[data-portfolio="react-percentage"], #react-percentage',
      transform: (data) => `${data.portfolio.technologies.frameworks.React}%`,
      fallback: '35%',
      description: 'React framework usage'
    });
    
    // Growth trends
    this.integrationPoints.set('portfolio-growth', {
      selector: '[data-portfolio="growth"], #portfolio-growth',
      transform: (data) => data.portfolio.trends.growth,
      fallback: '12% per quarter',
      description: 'Portfolio growth rate'
    });
    
    this.integrationPoints.set('health-trend', {
      selector: '[data-portfolio="health-trend"], #health-trend',
      transform: (data) => data.portfolio.trends.healthTrend,
      fallback: 'improving',
      description: 'Health trend direction'
    });
    
    // Metadata integration
    this.integrationPoints.set('last-updated', {
      selector: '[data-portfolio="last-updated"], #last-updated',
      transform: (data) => this.formatTimestamp(data.timestamp),
      fallback: 'Recently',
      description: 'Last data update'
    });
    
    this.integrationPoints.set('data-source', {
      selector: '[data-portfolio="data-source"], #data-source',
      transform: (data) => this.formatDataSource(data.metadata.dataPrivacyLevel),
      fallback: 'Static data',
      description: 'Data source type'
    });
    
    this.log(`Registered ${this.integrationPoints.size} integration points`);
  }
  
  /**
   * Load portfolio data with comprehensive error handling and fallback
   */
  async load() {
    if (this.isLoading) {
      this.log('Load already in progress, skipping...');
      return;
    }
    
    this.isLoading = true;
    this.loadStartTime = performance.now();
    
    try {
      this.log('Starting portfolio data load...');
      
      // Try cached data first
      const cachedData = this.getCachedData();
      if (cachedData) {
        this.log('Using cached data');
        this.data = cachedData;
        this.applyData();
        
        // Load fresh data in background
        this.loadFreshData().catch(error => {
          this.log('Background refresh failed', error);
        });
        
        return;
      }
      
      // Load fresh data
      await this.loadFreshData();
      
    } catch (error) {
      this.handleError('Failed to load portfolio data', error);
    } finally {
      this.isLoading = false;
      this.hasLoaded = true;
      
      const loadTime = performance.now() - this.loadStartTime;
      this.log(`Portfolio data load completed in ${Math.round(loadTime)}ms`);
    }
  }
  
  /**
   * Load fresh data from API with retry logic
   */
  async loadFreshData() {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        this.log(`Load attempt ${attempt}/${this.options.retryAttempts}`);
        
        const response = await fetch(this.options.dataUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate data structure
        this.validateData(data);
        
        // Cache successful response
        this.cacheData(data);
        
        // Store and apply data
        this.data = data;
        this.applyData();
        
        this.log('Fresh data loaded successfully');
        return;
        
      } catch (error) {
        lastError = error;
        this.log(`Load attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }
    
    // All attempts failed, try fallback
    if (this.options.fallbackUrl) {
      try {
        this.log('Trying fallback URL...');
        const response = await fetch(this.options.fallbackUrl);
        const data = await response.json();
        this.validateData(data);
        this.data = data;
        this.applyData();
        return;
      } catch (fallbackError) {
        this.log('Fallback also failed:', fallbackError.message);
      }
    }
    
    // Use static fallback
    this.log('Using static fallback data');
    this.data = this.getStaticFallbackData();
    this.applyData();
  }
  
  /**
   * Apply loaded data to DOM integration points
   */
  applyData() {
    if (!this.data) {
      this.log('No data available for application');
      return;
    }
    
    this.log('Applying portfolio data to DOM...');
    
    let appliedCount = 0;
    let skippedCount = 0;
    
    this.integrationPoints.forEach((config, key) => {
      try {
        const elements = document.querySelectorAll(config.selector);
        
        if (elements.length === 0) {
          skippedCount++;
          return;
        }
        
        const newValue = config.transform(this.data);
        
        elements.forEach(element => {
          const oldValue = element.textContent;
          
          if (this.options.enableAnimations && oldValue !== newValue) {
            this.animateValueChange(element, oldValue, newValue);
          } else {
            element.textContent = newValue;
          }
          
          // Add data attributes for styling/debugging
          element.setAttribute('data-portfolio-key', key);
          element.setAttribute('data-portfolio-updated', new Date().toISOString());
        });
        
        appliedCount++;
        this.log(`Applied ${key}: ${newValue} (${elements.length} elements)`);
        
      } catch (error) {
        this.log(`Failed to apply ${key}:`, error.message);
        
        // Apply fallback value
        const elements = document.querySelectorAll(config.selector);
        elements.forEach(element => {
          element.textContent = config.fallback;
        });
      }
    });
    
    this.log(`Data application complete: ${appliedCount} applied, ${skippedCount} skipped`);
    
    // Update live data indicators
    this.updateLiveDataBadges();
    
    // Notify observers
    this.notifyObservers('dataApplied', this.data);
    
    // Track analytics event
    this.trackDataUpdate();
  }
  
  /**
   * Show loading states on integration points
   */
  showLoadingStates() {
    if (!this.options.enableAnimations) return;
    
    this.integrationPoints.forEach((config) => {
      const elements = document.querySelectorAll(config.selector);
      elements.forEach(element => {
        element.classList.add('portfolio-loading');
        element.setAttribute('aria-label', `Loading ${config.description}...`);
      });
    });
  }
  
  /**
   * Hide loading states
   */
  hideLoadingStates() {
    this.integrationPoints.forEach((config) => {
      const elements = document.querySelectorAll(config.selector);
      elements.forEach(element => {
        element.classList.remove('portfolio-loading');
        element.removeAttribute('aria-label');
      });
    });
  }
  
  /**
   * Animate value changes with smooth transitions
   */
  animateValueChange(element, oldValue, newValue) {
    // Add transition class
    element.classList.add('portfolio-value-changing');
    
    // Fade out
    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      element.textContent = newValue;
      
      // Fade back in
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
      
      setTimeout(() => {
        element.classList.remove('portfolio-value-changing');
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      }, 300);
      
    }, 150);
  }
  
  /**
   * Update live data badges and indicators
   */
  updateLiveDataBadges() {
    if (!this.options.enableLiveDataBadge || !this.data) return;
    
    const isLiveData = this.data.metadata.dataPrivacyLevel === 'aggregated-marketing-safe';
    const badges = document.querySelectorAll('[data-live-badge], .live-data-badge');
    
    badges.forEach(badge => {
      if (isLiveData) {
        badge.style.display = 'inline-block';
        badge.textContent = `Live Data • Updated ${this.formatTimestamp(this.data.timestamp)}`;
        badge.classList.add('live-active');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('live-active');
      }
    });
    
    // Update page title if live data
    if (isLiveData) {
      const title = document.querySelector('title');
      if (title && !title.textContent.includes('Live')) {
        title.textContent = title.textContent.replace('17+', `${this.data.portfolio.scale.projectCount}+`);
      }
    }
  }
  
  /**
   * Set up periodic data refresh
   */
  setupPeriodicRefresh() {
    // Refresh every 5 minutes
    const refreshInterval = 5 * 60 * 1000;
    
    setInterval(async () => {
      if (!document.hidden) {
        this.log('Periodic refresh triggered');
        await this.loadFreshData().catch(error => {
          this.log('Periodic refresh failed:', error.message);
        });
      }
    }, refreshInterval);
    
    this.log(`Periodic refresh set up (${refreshInterval / 1000}s interval)`);
  }
  
  /**
   * Set up visibility change handling for efficient loading
   */
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  handleVisibilityChange() {
    if (!document.hidden && this.hasLoaded) {
      // Page became visible, refresh if data is stale
      const cacheAge = Date.now() - (this.getCacheTimestamp() || 0);
      if (cacheAge > this.options.cacheTTL) {
        this.log('Page visible and cache stale, refreshing...');
        this.loadFreshData().catch(error => {
          this.log('Visibility refresh failed:', error.message);
        });
      }
    }
  }
  
  /**
   * Data validation
   */
  validateData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data: not an object');
    }
    
    if (!data.portfolio || !data.portfolio.scale) {
      throw new Error('Invalid data: missing portfolio.scale');
    }
    
    if (!data.metadata) {
      throw new Error('Invalid data: missing metadata');
    }
    
    // Validate required fields
    const required = [
      'portfolio.scale.projectCount',
      'portfolio.scale.linesOfCode', 
      'portfolio.scale.avgHealthScore',
      'portfolio.quality.excellentProjects',
      'portfolio.technologies.languages'
    ];
    
    for (const path of required) {
      if (!this.getNestedValue(data, path)) {
        throw new Error(`Invalid data: missing ${path}`);
      }
    }
    
    this.log('Data validation passed');
  }
  
  /**
   * Cache management
   */
  cacheData(data) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem(this.options.cacheKey, JSON.stringify(cacheEntry));
      this.log('Data cached successfully');
    } catch (error) {
      this.log('Failed to cache data:', error.message);
    }
  }
  
  getCachedData() {
    try {
      const cached = localStorage.getItem(this.options.cacheKey);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;
      
      if (age > this.options.cacheTTL) {
        this.log('Cached data expired');
        localStorage.removeItem(this.options.cacheKey);
        return null;
      }
      
      this.validateData(cacheEntry.data);
      this.log(`Using cached data (age: ${Math.round(age / 1000)}s)`);
      return cacheEntry.data;
      
    } catch (error) {
      this.log('Failed to load cached data:', error.message);
      localStorage.removeItem(this.options.cacheKey);
      return null;
    }
  }
  
  getCacheTimestamp() {
    try {
      const cached = localStorage.getItem(this.options.cacheKey);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      return cacheEntry.timestamp;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Static fallback data
   */
  getStaticFallbackData() {
    return {
      timestamp: new Date().toISOString(),
      portfolio: {
        scale: {
          projectCount: 128,
          linesOfCode: 147000000,
          avgHealthScore: 8.2,
          techStackCount: 20
        },
        quality: {
          excellentProjects: 44,
          goodProjects: 52,
          needsAttentionProjects: 31,
          productionReadyRate: "77%"
        },
        technologies: {
          languages: {
            JavaScript: 42,
            TypeScript: 38,
            Python: 18,
            Go: 12,
            Ruby: 8,
            Other: 8
          },
          frameworks: {
            React: 35,
            Express: 28,
            "Next.js": 15,
            FastAPI: 8,
            Rails: 6,
            Other: 34
          }
        },
        trends: {
          growth: "12% per quarter",
          healthTrend: "improving",
          modernizationRate: "85%"
        }
      },
      metadata: {
        dataPrivacyLevel: "fallback-static",
        updateFrequency: "static",
        privacyNote: "Fallback data - Project Universe unavailable",
        lastScanCompleted: new Date().toISOString(),
        version: "1.0.0-fallback"
      }
    };
  }
  
  /**
   * Utility functions
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recently';
    }
  }
  
  formatDataSource(dataPrivacyLevel) {
    const sources = {
      'aggregated-marketing-safe': 'Live Data',
      'fallback-static': 'Static Data',
      'cached': 'Cached Data'
    };
    
    return sources[dataPrivacyLevel] || 'Unknown';
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Observer pattern for external integrations
   */
  addObserver(callback) {
    this.observers.add(callback);
  }
  
  removeObserver(callback) {
    this.observers.delete(callback);
  }
  
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        this.log('Observer callback failed:', error.message);
      }
    });
  }
  
  /**
   * Analytics integration
   */
  trackDataUpdate() {
    if (typeof gtag !== 'undefined' && this.data) {
      gtag('event', 'portfolio_data_update', {
        event_category: 'Data Integration',
        data_source: this.data.metadata.dataPrivacyLevel,
        project_count: this.data.portfolio.scale.projectCount,
        health_score: this.data.portfolio.scale.avgHealthScore,
        custom_parameter_1: 'dynamic_content'
      });
    }
  }
  
  /**
   * Error handling
   */
  handleError(message, error) {
    this.log(`ERROR: ${message}`, error);
    
    // Use fallback data
    if (!this.data) {
      this.data = this.getStaticFallbackData();
      this.applyData();
    }
    
    // Hide loading states
    this.hideLoadingStates();
    
    // Track error
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `Portfolio Data Error: ${message}`,
        fatal: false
      });
    }
    
    // Notify observers
    this.notifyObservers('error', { message, error });
  }
  
  /**
   * Debug logging
   */
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[PortfolioDataLoader] ${message}`, ...args);
    }
  }
  
  /**
   * Public API methods
   */
  refresh() {
    return this.loadFreshData();
  }
  
  getCurrentData() {
    return this.data;
  }
  
  getLoadingState() {
    return {
      isLoading: this.isLoading,
      hasLoaded: this.hasLoaded,
      loadTime: this.loadStartTime ? performance.now() - this.loadStartTime : null
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioDataLoader;
}

// Global availability for direct script inclusion
if (typeof window !== 'undefined') {
  window.PortfolioDataLoader = PortfolioDataLoader;
}