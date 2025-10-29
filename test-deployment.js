// Test script to verify Vercel deployment
const axios = require('axios');

// Replace with your actual Vercel domain
const BASE_URL = 'https://your-server-domain.vercel.app';

async function testDeployment() {
  console.log('🚀 Testing Vercel Deployment...\n');

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/api/health',
      method: 'GET'
    },
    {
      name: 'Books API (Public)',
      endpoint: '/api/books',
      method: 'GET'
    },
    {
      name: 'Categories API (Public)',
      endpoint: '/api/categories',
      method: 'GET'
    },
    {
      name: 'Authors API (Public)',
      endpoint: '/api/authors',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 10000
      });
      
      console.log(`✅ ${test.name}: Status ${response.status}`);
      if (test.endpoint === '/api/health') {
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.message || 'Unknown error'}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Deployment test completed!');
}

// Run the test
testDeployment().catch(console.error);
