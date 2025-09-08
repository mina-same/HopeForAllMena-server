const axios = require('axios');

async function testLogin() {
  const API_URL = 'http://localhost:5001/api';
  
  console.log('Testing login API...\n');
  
  try {
    // Test with admin credentials
    console.log('Testing: admin@azino.com / Admin@2024');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'admin@azino.com',
      password: 'Admin@2024'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Check if server is running
axios.get('http://localhost:5001/api/health')
  .then(() => {
    console.log('Server is running\n');
    testLogin();
  })
  .catch(() => {
    console.log('Server is not running. Please start it with: npm start');
  });
