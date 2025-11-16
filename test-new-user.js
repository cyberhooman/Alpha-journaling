// Script to test new user registration with sample trade
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testNewUserRegistration() {
  try {
    const timestamp = Date.now();
    const newUser = {
      email: `testuser${timestamp}@example.com`,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    };

    console.log('========================================');
    console.log('Testing New User Registration');
    console.log('========================================\n');

    // Step 1: Register new user
    console.log('Step 1: Registering new user...');
    console.log(`Email: ${newUser.email}\n`);

    const registerResponse = await axios.post(`${API_URL}/auth/register`, newUser);

    console.log('✅ User registered successfully!');
    console.log(`User ID: ${registerResponse.data.user.id}`);
    console.log(`Token: ${registerResponse.data.token.substring(0, 20)}...\n`);

    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;

    // Step 2: Check if sample trade was created
    console.log('Step 2: Checking for sample trade...\n');

    const tradesResponse = await axios.get(`${API_URL}/trades`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const trades = tradesResponse.data;

    if (trades.length === 0) {
      console.log('❌ No trades found! Sample trade was not created.');
    } else if (trades.length === 1) {
      console.log('✅ Sample trade created successfully!\n');
      console.log('Trade Details:');
      console.log('==================');
      console.log(`ID: ${trades[0].id}`);
      console.log(`Symbol: ${trades[0].symbol}`);
      console.log(`Side: ${trades[0].side}`);
      console.log(`Entry: $${trades[0].entry_price} | Exit: $${trades[0].exit_price}`);
      console.log(`Quantity: ${trades[0].quantity}`);
      console.log(`P&L: $${trades[0].pnl} (${trades[0].pnl_percentage}%)`);
      console.log(`Status: ${trades[0].status}`);
      console.log(`Strategy: ${trades[0].strategy}`);
      console.log(`Setup: ${trades[0].setup}\n`);

      if (trades[0].notes) {
        console.log('Notes (first 100 chars):');
        console.log(trades[0].notes.substring(0, 100) + '...\n');
      }

      console.log('========================================');
      console.log('✅ TEST PASSED!');
      console.log('Sample trade is automatically created for new users');
      console.log('========================================\n');

      console.log(`🌐 View in browser:`);
      console.log(`   Dashboard: http://localhost:3002`);
      console.log(`   Trades: http://localhost:3002/trades`);
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Password: ${newUser.password}`);
    } else {
      console.log(`⚠️  Found ${trades.length} trades (expected 1 sample trade)`);
    }

  } catch (error) {
    console.error('\n❌ Test Failed!');
    if (error.response) {
      console.error('Error:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testNewUserRegistration();
