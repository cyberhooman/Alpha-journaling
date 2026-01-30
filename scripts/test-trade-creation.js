// Test script to verify trade creation and persistence
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testTradeCreation() {
  try {
    console.log('🧪 Testing Trade Creation and Persistence\n');
    console.log('=' .repeat(60));

    // Login with demo account
    console.log('\n1️⃣ Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@demo.com',
      password: 'demo1234'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully');

    // Get current trade count
    console.log('\n2️⃣ Getting current trades...');
    const initialTrades = await axios.get(`${API_URL}/trades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${initialTrades.data.length} existing trades`);

    // Create a new trade
    console.log('\n3️⃣ Creating a new trade...');
    const newTrade = {
      symbol: 'TEST',
      side: 'LONG',
      entryDate: new Date().toISOString(),
      entryPrice: 100.00,
      quantity: 10,
      fees: 1.00,
      status: 'OPEN',
      strategy: 'Test Strategy',
      notes: 'This is a test trade to verify persistence'
    };

    const createRes = await axios.post(`${API_URL}/trades`, newTrade, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Trade created successfully');
    console.log(`   Trade ID: ${createRes.data.id}`);
    console.log(`   Symbol: ${createRes.data.symbol}`);

    // Verify trade was saved
    console.log('\n4️⃣ Verifying trade was saved...');
    const updatedTrades = await axios.get(`${API_URL}/trades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Now have ${updatedTrades.data.length} trades`);

    // Verify the new trade exists
    const foundTrade = updatedTrades.data.find(t => t.id === createRes.data.id);
    if (foundTrade) {
      console.log('✅ New trade found in database');
    } else {
      throw new Error('Trade not found in database!');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 SUCCESS! Trade creation is working correctly!\n');
    console.log('Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Log in with:');
    console.log('   Email: demo@demo.com');
    console.log('   Password: demo1234');
    console.log('3. Go to "New Trade" and create a trade');
    console.log('4. Refresh the page - your trade should still be there!');
    console.log('\n✨ Your trading journal is ready to use!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('\nPlease check:');
    console.error('- Server is running on port 5000');
    console.error('- Database is properly initialized');
    console.error('- You ran create-demo-user.js first');
    process.exit(1);
  }
}

testTradeCreation();
