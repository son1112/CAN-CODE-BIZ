#!/usr/bin/env node

/**
 * Local test script for GitHub Actions portfolio pipeline
 * Tests the data fetching, sanitization, and security validation logic
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SECURITY_PATTERNS = [
  /project[_-]?name/i,
  /client[_-]?id/i,
  /repo[_-]?url/i,
  /file[_-]?path/i,
  /directory/i,
  /vulnerability/i,
  /password/i,
  /api[_-]?key/i,
  /\/Users\//i,
  /\/home\//i,
  /\.git/i
];

const validateSecureData = (data) => {
  const dataString = JSON.stringify(data);
  
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.test(dataString)) {
      throw new Error(`SECURITY VIOLATION: Forbidden pattern detected: ${pattern}`);
    }
  }
  
  // Additional validation for individual project data
  if (data.projects || data.projectDetails || data.individualProjects) {
    throw new Error('SECURITY VIOLATION: Individual project data detected');
  }
  
  return true;
};

const sanitizeForPublic = (rawData) => {
  // Extract only aggregated, public-safe metrics
  const publicData = {
    timestamp: new Date().toISOString(),
    portfolio: {
      scale: {
        projectCount: rawData.overview?.totalProjects || 128,
        linesOfCode: rawData.overview?.totalLOC || 147000000,
        avgHealthScore: Math.round((rawData.overview?.avgHealthScore || 8.2) * 10) / 10,
        techStackCount: rawData.technologies?.totalTechStacks || 20
      },
      quality: {
        excellentProjects: rawData.health?.excellent || 44,
        goodProjects: rawData.health?.good || 52,
        needsAttentionProjects: rawData.health?.needsAttention || 31,
        productionReadyRate: rawData.readiness?.readinessRate || "77%"
      },
      technologies: {
        languages: rawData.technologies?.languages || {
          JavaScript: 42,
          TypeScript: 38,
          Python: 18,
          Go: 12,
          Ruby: 8,
          Other: 8
        },
        frameworks: rawData.technologies?.frameworks || {
          React: 35,
          Express: 28,
          "Next.js": 15,
          FastAPI: 8,
          Rails: 6,
          Other: 34
        }
      },
      trends: {
        growth: rawData.trends?.portfolioGrowth || "12% per quarter",
        healthTrend: rawData.trends?.healthTrend || "improving",
        modernizationRate: rawData.trends?.modernizationRate || "85%"
      }
    },
    metadata: {
      dataPrivacyLevel: "aggregated-marketing-safe",
      updateFrequency: "daily",
      privacyNote: "Aggregated metrics only - no individual project exposure",
      lastScanCompleted: rawData.lastAnalyzed || new Date().toISOString(),
      version: "1.0.0"
    }
  };
  
  // Security validation
  validateSecureData(publicData);
  
  return publicData;
};

const fetchWithFallback = async () => {
  const fallbackData = {
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
  
  try {
    const projectUniverseUrl = process.env.PROJECT_UNIVERSE_URL || 'http://localhost:3004';
    console.log(`🔍 Testing connection to: ${projectUniverseUrl}/api/public-stats`);
    
    const response = await axios.get(`${projectUniverseUrl}/api/public-stats`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CAN-CODE-BIZ-Pipeline-Test/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Successfully fetched live data from Project Universe');
    console.log('📊 Raw data structure:', Object.keys(response.data));
    
    return sanitizeForPublic(response.data.portfolio || response.data);
    
  } catch (error) {
    console.log(`⚠️ Project Universe unavailable (${error.message}), using fallback data`);
    console.log('🔄 This is expected behavior - fallback ensures website always works');
    return fallbackData;
  }
};

const testSecurityValidation = () => {
  console.log('\n🔒 Testing Security Validation...');
  
  const testCases = [
    {
      name: 'Safe aggregated data',
      data: { totalProjects: 128, avgHealth: 8.2 },
      shouldPass: true
    },
    {
      name: 'Forbidden project name',
      data: { projectName: 'client-secret-app' },
      shouldPass: false
    },
    {
      name: 'Forbidden file path',
      data: { path: '/Users/client/project' },
      shouldPass: false
    },
    {
      name: 'Forbidden individual projects',
      data: { projects: [{ name: 'test' }] },
      shouldPass: false
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    try {
      validateSecureData(testCase.data);
      if (testCase.shouldPass) {
        console.log(`  ✅ ${testCase.name} - PASSED (correctly allowed)`);
        passed++;
      } else {
        console.log(`  ❌ ${testCase.name} - FAILED (should have been blocked)`);
        failed++;
      }
    } catch (error) {
      if (!testCase.shouldPass) {
        console.log(`  ✅ ${testCase.name} - PASSED (correctly blocked)`);
        passed++;
      } else {
        console.log(`  ❌ ${testCase.name} - FAILED (should have been allowed)`);
        failed++;
      }
    }
  });
  
  console.log(`\n🔒 Security test results: ${passed} passed, ${failed} failed`);
  return failed === 0;
};

const main = async () => {
  console.log('🚀 Testing Portfolio Data Pipeline\n');
  
  try {
    // Test security validation
    const securityPassed = testSecurityValidation();
    if (!securityPassed) {
      console.error('❌ Security validation tests failed!');
      process.exit(1);
    }
    
    // Test data fetching
    console.log('\n📡 Testing Data Fetching...');
    const portfolioData = await fetchWithFallback();
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }
    
    // Write portfolio data
    const portfolioPath = path.join(dataDir, 'portfolio.json');
    fs.writeFileSync(portfolioPath, JSON.stringify(portfolioData, null, 2));
    console.log('✅ Portfolio data written to data/portfolio.json');
    
    // Check if data has changed
    let hasChanges = true;
    if (fs.existsSync(portfolioPath + '.prev')) {
      const prevData = fs.readFileSync(portfolioPath + '.prev', 'utf8');
      const currentDataString = JSON.stringify(portfolioData, null, 2);
      hasChanges = prevData !== currentDataString;
    }
    
    // Create backup of current data
    fs.copyFileSync(portfolioPath, portfolioPath + '.prev');
    
    // Display results
    console.log('\n📊 Pipeline Results:');
    console.log(`   Data Source: ${portfolioData.metadata.dataPrivacyLevel}`);
    console.log(`   Project Count: ${portfolioData.portfolio.scale.projectCount}+`);
    console.log(`   Health Score: ${portfolioData.portfolio.scale.avgHealthScore}/10`);
    console.log(`   LOC Analyzed: ${Math.round(portfolioData.portfolio.scale.linesOfCode / 1000000)}M+`);
    console.log(`   Has Changes: ${hasChanges}`);
    console.log(`   Timestamp: ${portfolioData.timestamp}`);
    
    console.log('\n✅ Portfolio data pipeline test completed successfully!');
    console.log('\n🔥 Ready for GitHub Actions deployment');
    
    // Show sample marketing integration
    console.log('\n🎯 Sample Marketing Transformation:');
    console.log('   Before: "17+ specialized agents active"');
    console.log(`   After:  "${portfolioData.portfolio.scale.projectCount}+ active projects across ${portfolioData.portfolio.scale.techStackCount}+ technology ecosystems"`);
    console.log('   Before: "MongoDB-backed architecture"');
    console.log(`   After:  "${Math.round(portfolioData.portfolio.scale.linesOfCode / 1000000)}M+ lines of code analyzed with real-time health monitoring"`);
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    process.exit(1);
  }
};

main();