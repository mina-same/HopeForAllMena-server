const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const users = [
  { email: 'admin@azino.com', password: 'Admin@2024', role: 'admin' },
  { email: 'editor@azino.com', password: 'Editor@2024', role: 'editor' },
  { email: 'user@azino.com', password: 'User@2024', role: 'user' }
];

async function testAllLogins() {
  console.log('🔐 Testing login for all users...\n');
  
  for (const user of users) {
    try {
      console.log(`Testing ${user.role.toUpperCase()}: ${user.email}`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier: user.email,
        password: user.password
      });
      
      if (response.data.status === 'success') {
        console.log(`✅ Login successful! Role: ${response.data.data.user.role}`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      }
    } catch (error) {
      console.log(`❌ Login failed for ${user.email}`);
      if (error.response) {
        console.log(`   Error: ${error.response.data.message}`);
      }
    }
    console.log('');
  }
  
  console.log('✨ All login tests completed!');
}

testAllLogins();
