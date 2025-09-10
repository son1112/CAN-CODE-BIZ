/**
 * Portfolio Data Visualizations
 * 
 * Interactive charts and visualizations for portfolio metrics
 * Lightweight, dependency-free implementations with progressive enhancement
 */

class PortfolioVisualizations {
  constructor(options = {}) {
    this.options = {
      enableAnimations: options.enableAnimations !== false,
      animationDuration: options.animationDuration || 1000,
      theme: options.theme || 'light',
      responsive: options.responsive !== false,
      debug: options.debug || false,
      ...options
    };
    
    this.charts = new Map();
    this.resizeObserver = null;
    this.animationFrameId = null;
    
    this.log('PortfolioVisualizations initialized', this.options);
  }
  
  /**
   * Initialize all visualizations
   */
  init(data) {
    if (!data || !data.portfolio) {
      this.log('No data provided for visualizations');
      return;
    }
    
    this.data = data;
    
    try {
      // Create visualizations
      this.createTechnologyDistribution();
      this.createHealthScoreGauge();
      this.createQualityDistribution();
      this.createTrendIndicators();
      this.createPortfolioStats();
      
      // Set up responsive handling
      this.setupResponsiveHandling();
      
      this.log('All visualizations initialized');
      
    } catch (error) {
      this.log('Visualization initialization failed:', error);
    }
  }
  
  /**
   * Technology distribution chart (horizontal bars)
   */
  createTechnologyDistribution() {
    const container = document.querySelector('[data-chart="tech-distribution"]');
    if (!container) return;
    
    const languages = this.data.portfolio.technologies.languages;
    const frameworks = this.data.portfolio.technologies.frameworks;
    
    container.innerHTML = `
      <div class="chart-container">
        <h3 class="chart-title">Technology Expertise</h3>
        
        <div class="tech-section">
          <h4 class="tech-section-title">Languages</h4>
          <div class="tech-bars" data-chart-section="languages">
            ${Object.entries(languages)
              .sort(([,a], [,b]) => b - a)
              .map(([tech, percentage]) => `
                <div class="tech-bar-item">
                  <span class="tech-label">${tech}</span>
                  <div class="tech-bar-container">
                    <div class="tech-bar" 
                         data-percentage="${percentage}"
                         style="width: 0%; background-color: ${this.getTechColor(tech)}">
                    </div>
                    <span class="tech-percentage">${percentage}%</span>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
        
        <div class="tech-section">
          <h4 class="tech-section-title">Frameworks</h4>
          <div class="tech-bars" data-chart-section="frameworks">
            ${Object.entries(frameworks)
              .sort(([,a], [,b]) => b - a)
              .map(([tech, percentage]) => `
                <div class="tech-bar-item">
                  <span class="tech-label">${tech}</span>
                  <div class="tech-bar-container">
                    <div class="tech-bar" 
                         data-percentage="${percentage}"
                         style="width: 0%; background-color: ${this.getTechColor(tech)}">
                    </div>
                    <span class="tech-percentage">${percentage}%</span>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Animate bars
    if (this.options.enableAnimations) {
      setTimeout(() => this.animateTechBars(container), 100);
    } else {
      this.setTechBarsImmediate(container);
    }
    
    this.charts.set('tech-distribution', container);
    this.log('Technology distribution chart created');
  }
  
  /**
   * Health score gauge visualization
   */
  createHealthScoreGauge() {
    const container = document.querySelector('[data-chart="health-gauge"]');
    if (!container) return;
    
    const healthScore = this.data.portfolio.scale.avgHealthScore;
    const percentage = (healthScore / 10) * 100;
    
    container.innerHTML = `
      <div class="chart-container">
        <h3 class="chart-title">Portfolio Health Score</h3>
        <div class="gauge-container">
          <div class="gauge">
            <div class="gauge-fill" data-percentage="${percentage}"></div>
            <div class="gauge-cover">
              <div class="gauge-score">
                <span class="gauge-value" data-value="${healthScore}">0</span>
                <span class="gauge-max">/10</span>
              </div>
              <div class="gauge-label">Health Score</div>
            </div>
          </div>
          <div class="gauge-description">
            ${this.getHealthDescription(healthScore)}
          </div>
        </div>
      </div>
    `;
    
    if (this.options.enableAnimations) {
      setTimeout(() => this.animateGauge(container, healthScore, percentage), 200);
    } else {
      this.setGaugeImmediate(container, healthScore, percentage);
    }
    
    this.charts.set('health-gauge', container);
    this.log('Health gauge created');
  }
  
  /**
   * Quality distribution donut chart
   */
  createQualityDistribution() {
    const container = document.querySelector('[data-chart="quality-distribution"]');
    if (!container) return;
    
    const quality = this.data.portfolio.quality;
    const total = quality.excellentProjects + quality.goodProjects + quality.needsAttentionProjects;
    
    const data = [
      { label: 'Excellent', value: quality.excellentProjects, color: '#10B981' },
      { label: 'Good', value: quality.goodProjects, color: '#3B82F6' },
      { label: 'Needs Attention', value: quality.needsAttentionProjects, color: '#F59E0B' }
    ];
    
    container.innerHTML = `
      <div class="chart-container">
        <h3 class="chart-title">Project Quality Distribution</h3>
        <div class="donut-container">
          <div class="donut-chart">
            <svg class="donut-svg" viewBox="0 0 100 100">
              <circle class="donut-background" cx="50" cy="50" r="35" 
                      fill="none" stroke="#e5e7eb" stroke-width="8"/>
              ${this.createDonutSegments(data, total)}
            </svg>
            <div class="donut-center">
              <span class="donut-total">${total}</span>
              <span class="donut-label">Projects</span>
            </div>
          </div>
          <div class="donut-legend">
            ${data.map(item => `
              <div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${item.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    if (this.options.enableAnimations) {
      setTimeout(() => this.animateDonut(container), 300);
    }
    
    this.charts.set('quality-distribution', container);
    this.log('Quality distribution chart created');
  }
  
  /**
   * Trend indicators with arrows and colors
   */
  createTrendIndicators() {
    const container = document.querySelector('[data-chart="trend-indicators"]');
    if (!container) return;
    
    const trends = this.data.portfolio.trends;
    
    const indicators = [
      {
        label: 'Portfolio Growth',
        value: trends.growth,
        trend: 'up',
        icon: '📈'
      },
      {
        label: 'Health Trend',
        value: trends.healthTrend,
        trend: trends.healthTrend === 'improving' ? 'up' : trends.healthTrend === 'declining' ? 'down' : 'stable',
        icon: trends.healthTrend === 'improving' ? '🔺' : trends.healthTrend === 'declining' ? '🔻' : '➖'
      },
      {
        label: 'Modernization',
        value: trends.modernizationRate,
        trend: 'up',
        icon: '🚀'
      }
    ];
    
    container.innerHTML = `
      <div class="chart-container">
        <h3 class="chart-title">Portfolio Trends</h3>
        <div class="trends-grid">
          ${indicators.map(indicator => `
            <div class="trend-card trend-${indicator.trend}">
              <div class="trend-icon">${indicator.icon}</div>
              <div class="trend-content">
                <div class="trend-label">${indicator.label}</div>
                <div class="trend-value">${indicator.value}</div>
              </div>
              <div class="trend-arrow">
                ${this.getTrendArrow(indicator.trend)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    if (this.options.enableAnimations) {
      setTimeout(() => this.animateTrendCards(container), 100);
    }
    
    this.charts.set('trend-indicators', container);
    this.log('Trend indicators created');
  }
  
  /**
   * Portfolio stats cards with counters
   */
  createPortfolioStats() {
    const container = document.querySelector('[data-chart="portfolio-stats"]');
    if (!container) return;
    
    const scale = this.data.portfolio.scale;
    
    const stats = [
      {
        label: 'Active Projects',
        value: scale.projectCount,
        suffix: '+',
        icon: '🏗️',
        color: '#3B82F6'
      },
      {
        label: 'Lines of Code',
        value: Math.round(scale.linesOfCode / 1000000),
        suffix: 'M+',
        icon: '⚡',
        color: '#10B981'
      },
      {
        label: 'Tech Stacks',
        value: scale.techStackCount,
        suffix: '+',
        icon: '🛠️',
        color: '#F59E0B'
      },
      {
        label: 'Avg Health',
        value: scale.avgHealthScore,
        suffix: '/10',
        icon: '💎',
        color: '#8B5CF6'
      }
    ];
    
    container.innerHTML = `
      <div class="chart-container">
        <h3 class="chart-title">Portfolio Overview</h3>
        <div class="stats-grid">
          ${stats.map(stat => `
            <div class="stat-card" style="border-left-color: ${stat.color}">
              <div class="stat-icon">${stat.icon}</div>
              <div class="stat-content">
                <div class="stat-value" data-target="${stat.value}" data-suffix="${stat.suffix}">
                  0${stat.suffix}
                </div>
                <div class="stat-label">${stat.label}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    if (this.options.enableAnimations) {
      setTimeout(() => this.animateStatCounters(container), 200);
    } else {
      this.setStatCountersImmediate(container);
    }
    
    this.charts.set('portfolio-stats', container);
    this.log('Portfolio stats created');
  }
  
  /**
   * Animation methods
   */
  animateTechBars(container) {
    const bars = container.querySelectorAll('.tech-bar');
    
    bars.forEach((bar, index) => {
      setTimeout(() => {
        const percentage = bar.dataset.percentage;
        bar.style.transition = 'width 0.8s ease-out';
        bar.style.width = `${percentage}%`;
      }, index * 100);
    });
  }
  
  setTechBarsImmediate(container) {
    const bars = container.querySelectorAll('.tech-bar');
    bars.forEach(bar => {
      bar.style.width = `${bar.dataset.percentage}%`;
    });
  }
  
  animateGauge(container, targetScore, targetPercentage) {
    const gaugeFill = container.querySelector('.gauge-fill');
    const gaugeValue = container.querySelector('.gauge-value');
    
    let currentScore = 0;
    const increment = targetScore / 50;
    
    const updateGauge = () => {
      currentScore += increment;
      if (currentScore >= targetScore) {
        currentScore = targetScore;
      }
      
      const currentPercentage = (currentScore / 10) * 100;
      
      gaugeFill.style.background = `conic-gradient(
        from 0deg,
        ${this.getHealthColor(currentScore)} 0deg,
        ${this.getHealthColor(currentScore)} ${currentPercentage * 3.6}deg,
        #e5e7eb ${currentPercentage * 3.6}deg,
        #e5e7eb 360deg
      )`;
      
      gaugeValue.textContent = currentScore.toFixed(1);
      
      if (currentScore < targetScore) {
        requestAnimationFrame(updateGauge);
      }
    };
    
    requestAnimationFrame(updateGauge);
  }
  
  setGaugeImmediate(container, score, percentage) {
    const gaugeFill = container.querySelector('.gauge-fill');
    const gaugeValue = container.querySelector('.gauge-value');
    
    gaugeFill.style.background = `conic-gradient(
      from 0deg,
      ${this.getHealthColor(score)} 0deg,
      ${this.getHealthColor(score)} ${percentage * 3.6}deg,
      #e5e7eb ${percentage * 3.6}deg,
      #e5e7eb 360deg
    )`;
    
    gaugeValue.textContent = score;
  }
  
  animateDonut(container) {
    const segments = container.querySelectorAll('.donut-segment');
    
    segments.forEach((segment, index) => {
      setTimeout(() => {
        segment.style.transition = 'stroke-dashoffset 1s ease-out';
        segment.style.strokeDashoffset = '0';
      }, index * 200);
    });
  }
  
  animateStatCounters(container) {
    const counters = container.querySelectorAll('.stat-value');
    
    counters.forEach((counter, index) => {
      setTimeout(() => {
        this.animateCounter(counter);
      }, index * 150);
    });
  }
  
  animateCounter(counter) {
    const target = parseFloat(counter.dataset.target);
    const suffix = counter.dataset.suffix;
    const duration = 1000;
    const increment = target / (duration / 16);
    
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current >= target) {
        current = target;
      }
      
      const displayValue = target % 1 === 0 ? Math.floor(current) : current.toFixed(1);
      counter.textContent = `${displayValue}${suffix}`;
      
      if (current < target) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  }
  
  setStatCountersImmediate(container) {
    const counters = container.querySelectorAll('.stat-value');
    counters.forEach(counter => {
      const target = counter.dataset.target;
      const suffix = counter.dataset.suffix;
      counter.textContent = `${target}${suffix}`;
    });
  }
  
  animateTrendCards(container) {
    const cards = container.querySelectorAll('.trend-card');
    
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }
  
  /**
   * Utility methods
   */
  getTechColor(tech) {
    const colors = {
      'JavaScript': '#F7DF1E',
      'TypeScript': '#3178C6',
      'Python': '#3776AB',
      'Go': '#00ADD8',
      'Ruby': '#CC342D',
      'React': '#61DAFB',
      'Express': '#000000',
      'Next.js': '#000000',
      'FastAPI': '#009688',
      'Rails': '#CC0000',
      'Other': '#6B7280'
    };
    
    return colors[tech] || '#6B7280';
  }
  
  getHealthColor(score) {
    if (score >= 8.5) return '#10B981'; // Green
    if (score >= 7.0) return '#3B82F6'; // Blue
    if (score >= 5.5) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  }
  
  getHealthDescription(score) {
    if (score >= 9.0) return 'Exceptional portfolio health with minimal technical debt';
    if (score >= 8.0) return 'Strong portfolio health with good maintenance practices';
    if (score >= 7.0) return 'Healthy portfolio with some areas for improvement';
    if (score >= 6.0) return 'Adequate portfolio health requiring attention';
    return 'Portfolio health needs significant improvement';
  }
  
  getTrendArrow(trend) {
    const arrows = {
      'up': '<svg viewBox="0 0 20 20" class="trend-arrow-svg trend-up"><path d="M10 3l7 7-1.41 1.41L10 5.83l-5.59 5.58L3 10l7-7z"/></svg>',
      'down': '<svg viewBox="0 0 20 20" class="trend-arrow-svg trend-down"><path d="M10 17l-7-7 1.41-1.41L10 14.17l5.59-5.58L17 10l-7 7z"/></svg>',
      'stable': '<svg viewBox="0 0 20 20" class="trend-arrow-svg trend-stable"><path d="M3 10h14M10 3l7 7-7 7"/></svg>'
    };
    
    return arrows[trend] || arrows.stable;
  }
  
  createDonutSegments(data, total) {
    let cumulativePercentage = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
      
      cumulativePercentage += percentage;
      
      return `
        <circle class="donut-segment"
                cx="50" cy="50" r="${radius}"
                fill="none"
                stroke="${item.color}"
                stroke-width="8"
                stroke-dasharray="${strokeDasharray}"
                stroke-dashoffset="${strokeDashoffset}"
                transform="rotate(-90 50 50)"
                data-value="${item.value}"
                data-label="${item.label}">
        </circle>
      `;
    }).join('');
  }
  
  /**
   * Responsive handling
   */
  setupResponsiveHandling() {
    if (!this.options.responsive) return;
    
    this.resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        this.handleResize(entry.target);
      });
    });
    
    this.charts.forEach(chart => {
      this.resizeObserver.observe(chart);
    });
  }
  
  handleResize(chart) {
    // Recalculate dimensions if needed
    const rect = chart.getBoundingClientRect();
    if (rect.width < 300) {
      chart.classList.add('compact');
    } else {
      chart.classList.remove('compact');
    }
  }
  
  /**
   * Public API
   */
  updateData(newData) {
    this.data = newData;
    this.refresh();
  }
  
  refresh() {
    this.charts.clear();
    this.init(this.data);
  }
  
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.charts.clear();
  }
  
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[PortfolioVisualizations] ${message}`, ...args);
    }
  }
}

// CSS styles for visualizations (inject into document)
const visualizationStyles = `
<style>
/* Chart Container Styles */
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

/* Technology Distribution */
.tech-section {
  margin-bottom: 1.5rem;
}

.tech-section-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #6b7280;
}

.tech-bar-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tech-label {
  min-width: 80px;
  font-size: 0.875rem;
  color: #374151;
}

.tech-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.tech-bar {
  height: 8px;
  border-radius: 4px;
  transition: width 0.8s ease-out;
  min-width: 2px;
}

.tech-percentage {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 30px;
}

/* Health Gauge */
.gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge {
  position: relative;
  width: 200px;
  height: 100px;
  margin-bottom: 1rem;
}

.gauge-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 200px 200px 0 0;
  background: conic-gradient(from 0deg, #e5e7eb 0deg, #e5e7eb 360deg);
}

.gauge-cover {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 160px;
  height: 80px;
  background: white;
  border-radius: 160px 160px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-score {
  display: flex;
  align-items: baseline;
  font-weight: 700;
}

.gauge-value {
  font-size: 2rem;
  color: #1f2937;
}

.gauge-max {
  font-size: 1rem;
  color: #6b7280;
  margin-left: 2px;
}

.gauge-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.gauge-description {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 300px;
}

/* Quality Distribution Donut */
.donut-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.donut-chart {
  position: relative;
  width: 200px;
  height: 200px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-dashoffset 1s ease-out;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-total {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.donut-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-label {
  font-size: 0.875rem;
  color: #374151;
  min-width: 120px;
}

.legend-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

/* Trend Indicators */
.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.trend-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.trend-card.trend-up {
  border-left: 4px solid #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.trend-card.trend-down {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%);
}

.trend-card.trend-stable {
  border-left: 4px solid #6b7280;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.trend-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.trend-content {
  flex: 1;
}

.trend-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.trend-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.trend-arrow {
  margin-left: 0.5rem;
}

.trend-arrow-svg {
  width: 20px;
  height: 20px;
}

.trend-arrow-svg.trend-up {
  fill: #10b981;
}

.trend-arrow-svg.trend-down {
  fill: #ef4444;
}

.trend-arrow-svg.trend-stable {
  fill: #6b7280;
}

/* Portfolio Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #3b82f6;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
  }
  
  .donut-container {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .trends-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .gauge {
    width: 150px;
    height: 75px;
  }
  
  .gauge-cover {
    top: 15px;
    left: 15px;
    width: 120px;
    height: 60px;
  }
  
  .gauge-value {
    font-size: 1.5rem;
  }
  
  .donut-chart {
    width: 150px;
    height: 150px;
  }
}

.compact .chart-title {
  font-size: 1rem;
}

.compact .stat-card {
  padding: 1rem;
}

.compact .stat-value {
  font-size: 1.5rem;
}

/* Loading States */
.portfolio-loading {
  opacity: 0.6;
  position: relative;
}

.portfolio-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.portfolio-value-changing {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
</style>
`;

// Inject styles if in browser environment
if (typeof document !== 'undefined') {
  const existingStyles = document.querySelector('[data-portfolio-visualizations]');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.innerHTML = visualizationStyles;
    styleElement.setAttribute('data-portfolio-visualizations', 'true');
    document.head.appendChild(styleElement.firstElementChild);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioVisualizations;
}

// Global availability for direct script inclusion
if (typeof window !== 'undefined') {
  window.PortfolioVisualizations = PortfolioVisualizations;
}