// Quick test script to verify API is working
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Test health check
    console.log('Testing health endpoint...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', health.data);

    // Test login/registration
    console.log('\nTesting user registration...');
    const testEmail = 'test@example.com';
    const testPassword = 'Test123!@#';

    let token;
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('✅ Registration successful');
      token = registerRes.data.token;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('User already exists, trying login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: testEmail,
          password: testPassword
        });
        console.log('✅ Login successful');
        token = loginRes.data.token;
      } else {
        throw error;
      }
    }

    // Test creating a trade
    console.log('\nTesting trade creation...');
    const tradeData = {
      symbol: 'AAPL',
      side: 'LONG',
      entryDate: new Date().toISOString(),
      entryPrice: 150.50,
      quantity: 10,
      fees: 2.50,
      status: 'OPEN',
      strategy: 'Momentum',
      notes: 'Test trade from API test script'
    };

    const createTradeRes = await axios.post(`${API_URL}/trades`, tradeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Trade created:', createTradeRes.data);

    // Test getting all trades
    console.log('\nTesting get all trades...');
    const getTradesRes = await axios.get(`${API_URL}/trades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Retrieved ${getTradesRes.data.length} trades`);
    console.log('Trades:', getTradesRes.data);

    console.log('\n🎉 All API tests passed! Your database and API are working correctly.');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\nYou can now use these credentials to log in to the UI.');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();
