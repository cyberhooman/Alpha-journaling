// Quick test to verify login works
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('Testing login...\n');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testuser1762049497657@example.com',
      password: 'Test123!'
    });

    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user.email);
    console.log('Token:', loginResponse.data.token.substring(0, 30) + '...\n');

    // Test getting trades
    const tradesResponse = await axios.get(`${API_URL}/trades`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    console.log(`✅ Found ${tradesResponse.data.length} trade(s)`);
    if (tradesResponse.data.length > 0) {
      console.log('First trade:', tradesResponse.data[0].symbol);
    }

    console.log('\n✅ All tests passed! Login is working correctly.');
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
