#!/usr/bin/env node

/**
 * Security Audit Script for Rubber Ducky Live API
 * Tests API endpoints for proper authentication and security measures
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

// Test endpoints without authentication
const testEndpoints = [
  // Debug endpoints - should be blocked in production
  { path: '/api/debug-auth', expectAuth: true, description: 'Debug auth endpoint' },
  { path: '/api/debug-db', expectAuth: true, description: 'Debug database endpoint' },
  { path: '/api/debug-nextauth-db', expectAuth: true, description: 'Debug NextAuth database endpoint' },
  
  // Health endpoint - should work without auth but limit info
  { path: '/api/health', expectAuth: false, description: 'Health check endpoint' },
  
  // Protected endpoints - should require authentication
  { path: '/api/chat', method: 'POST', expectAuth: true, description: 'Chat endpoint' },
  { path: '/api/sessions', expectAuth: true, description: 'Sessions endpoint' },
  { path: '/api/agents', expectAuth: true, description: 'Agents endpoint' },
  { path: '/api/stars', expectAuth: true, description: 'Stars endpoint' },
  { path: '/api/export/pdf', method: 'POST', expectAuth: true, description: 'PDF export endpoint' },
];

async function testEndpoint(endpoint) {
  const { path, method = 'GET', expectAuth, description } = endpoint;
  const url = `${baseUrl}${path}`;
  
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   URL: ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Add basic request body for POST requests
    if (method === 'POST') {
      options.body = JSON.stringify({ test: true });
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Non-JSON response' };
    }
    
    if (expectAuth) {
      if (status === 401 || status === 403) {
        console.log(`   ✅ SECURE: Returns ${status} (authentication required)`);
        return { passed: true, status, secure: true };
      } else if (status === 404 && process.env.NODE_ENV === 'production') {
        console.log(`   ✅ SECURE: Returns 404 in production (endpoint hidden)`);
        return { passed: true, status, secure: true };
      } else {
        console.log(`   ⚠️  VULNERABLE: Returns ${status} without auth`);
        console.log(`   📄 Response:`, JSON.stringify(data, null, 2));
        return { passed: false, status, secure: false, data };
      }
    } else {
      if (status >= 200 && status < 300) {
        console.log(`   ✅ ACCESSIBLE: Returns ${status} (public endpoint)`);
        
        // Check if production info is properly limited
        if (path === '/api/health' && process.env.NODE_ENV === 'production') {
          if (data.version || data.environment) {
            console.log(`   ⚠️  INFO LEAK: Exposing version/environment in production`);
            return { passed: false, status, secure: false, data };
          }
        }
        
        return { passed: true, status, secure: true };
      } else {
        console.log(`   ❌ ERROR: Returns ${status}`);
        return { passed: false, status, secure: false, data };
      }
    }
  } catch (error) {
    console.log(`   ❌ NETWORK ERROR: ${error.message}`);
    return { passed: false, error: error.message, secure: false };
  }
}

async function runSecurityAudit() {
  console.log('🛡️  Starting Security Audit for Rubber Ducky Live API');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=' .repeat(60));
  
  const results = [];
  let secureCount = 0;
  let totalCount = 0;
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({
      endpoint: endpoint.path,
      description: endpoint.description,
      ...result
    });
    
    totalCount++;
    if (result.secure) {
      secureCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SECURITY AUDIT SUMMARY');
  console.log('=' .repeat(60));
  
  const securityScore = Math.round((secureCount / totalCount) * 100);
  console.log(`🔒 Security Score: ${secureCount}/${totalCount} (${securityScore}%)`);
  
  if (securityScore >= 90) {
    console.log('✅ EXCELLENT: Strong security posture');
  } else if (securityScore >= 75) {
    console.log('⚠️  GOOD: Minor security improvements needed');
  } else {
    console.log('❌ CRITICAL: Significant security vulnerabilities found');
  }
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.secure ? '✅ SECURE' : '❌ VULNERABLE';
    console.log(`   ${status}: ${result.description} (${result.endpoint})`);
  });
  
  // Recommendations
  const vulnerableEndpoints = results.filter(r => !r.secure);
  if (vulnerableEndpoints.length > 0) {
    console.log('\n🔧 RECOMMENDATIONS:');
    vulnerableEndpoints.forEach(result => {
      console.log(`   • Secure ${result.endpoint}: ${result.description}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   • Run this audit before each deployment');
  console.log('   • Set up automated security scanning in CI/CD');
  console.log('   • Review and rotate API keys regularly');
  console.log('   • Monitor access logs for suspicious activity');
  
  // Exit with appropriate code
  process.exit(securityScore >= 90 ? 0 : 1);
}

// Run the audit
runSecurityAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});