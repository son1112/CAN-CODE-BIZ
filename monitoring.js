// CAN.CODE Website Monitoring & Health Check
// This file can be used for external monitoring services or internal health checks

class HealthMonitor {
    constructor() {
        this.metrics = {
            uptime: 0,
            responseTime: 0,
            errors: 0,
            lastCheck: new Date(),
            status: 'unknown'
        };
        
        this.endpoints = [
            { name: 'Main Site', url: window.location.origin + '/' },
            { name: 'Styles', url: window.location.origin + '/styles.min.css' },
            { name: 'Service Worker', url: window.location.origin + '/sw.js' }
        ];
    }
    
    async checkHealth() {
        const startTime = performance.now();
        const results = {
            timestamp: new Date().toISOString(),
            checks: []
        };
        
        for (const endpoint of this.endpoints) {
            try {
                const checkStart = performance.now();
                const response = await fetch(endpoint.url, { 
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                const responseTime = performance.now() - checkStart;
                
                results.checks.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: response.ok ? 'healthy' : 'unhealthy',
                    statusCode: response.status,
                    responseTime: Math.round(responseTime),
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                results.checks.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 'error',
                    error: error.message,
                    responseTime: null,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Calculate overall health
        const totalTime = performance.now() - startTime;
        const healthyCount = results.checks.filter(c => c.status === 'healthy').length;
        const overallHealth = healthyCount / results.checks.length;
        
        results.overall = {
            status: overallHealth === 1 ? 'healthy' : overallHealth > 0.5 ? 'degraded' : 'unhealthy',
            healthScore: Math.round(overallHealth * 100),
            totalResponseTime: Math.round(totalTime),
            checksCount: results.checks.length,
            healthyCount: healthyCount
        };
        
        return results;
    }
    
    async runContinuousMonitoring() {
        // Run health check every 5 minutes
        const runCheck = async () => {
            try {
                const health = await this.checkHealth();
                console.log('🏥 Health Check:', health);
                
                // Store results
                localStorage.setItem('can-code-health', JSON.stringify(health));
                
                // Send to analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'health_check', {
                        event_category: 'Site Monitoring',
                        custom_parameter_1: health.overall.status,
                        value: health.overall.healthScore
                    });
                }
                
                // Alert on issues
                if (health.overall.status === 'unhealthy') {
                    console.warn('🚨 Site health issues detected!', health);
                }
                
            } catch (error) {
                console.error('Health check failed:', error);
            }
        };
        
        // Initial check
        await runCheck();
        
        // Schedule regular checks
        setInterval(runCheck, 300000); // 5 minutes
    }
    
    // Performance monitoring
    monitorPerformance() {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const metrics = {
                dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                tcp: Math.round(perfData.connectEnd - perfData.connectStart),
                ttfb: Math.round(perfData.responseStart - perfData.requestStart),
                download: Math.round(perfData.responseEnd - perfData.responseStart),
                dom: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                total: Math.round(perfData.loadEventEnd - perfData.navigationStart)
            };
            
            console.log('⚡ Performance Metrics:', metrics);
            
            // Store performance data
            localStorage.setItem('can-code-performance-detailed', JSON.stringify({
                timestamp: new Date().toISOString(),
                metrics: metrics
            }));
            
            // Alert on slow performance
            if (metrics.total > 5000) { // 5 seconds
                console.warn('⚠️ Slow page load detected:', metrics.total + 'ms');
            }
        });
    }
    
    // Resource monitoring
    monitorResources() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('failed') || entry.transferSize === 0) {
                    console.warn('📦 Resource loading issue:', {
                        name: entry.name,
                        duration: entry.duration,
                        transferSize: entry.transferSize
                    });
                }
            }
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
}

// Initialize monitoring when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonitoring);
} else {
    initMonitoring();
}

function initMonitoring() {
    // Only run on production or when explicitly enabled
    const shouldMonitor = window.location.hostname !== 'localhost' || 
                         localStorage.getItem('enable-monitoring') === 'true';
    
    if (shouldMonitor) {
        const monitor = new HealthMonitor();
        monitor.runContinuousMonitoring();
        monitor.monitorPerformance();
        monitor.monitorResources();
        
        console.log('🔍 Website monitoring initialized');
        
        // Expose for manual checks
        window.canCodeMonitor = monitor;
    }
}

// Export for external monitoring services
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HealthMonitor };
}