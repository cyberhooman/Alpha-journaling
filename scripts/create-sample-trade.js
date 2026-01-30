// Script to create a sample trade
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function createSampleTrade() {
  try {
    // Step 1: Register or login a user
    console.log('Step 1: Authenticating user...\n');

    let token;
    const userData = {
      email: 'demo@example.com',
      password: 'Demo123!',
      firstName: 'Demo',
      lastName: 'User'
    };

    // Try to login first
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      token = loginResponse.data.token;
      console.log('✅ Logged in successfully!');
    } catch (loginError) {
      // If login fails, try to register
      console.log('User not found, registering new user...');
      const registerResponse = await axios.post(`${API_URL}/auth/register`, userData);
      token = registerResponse.data.token;
      console.log('✅ User registered successfully!');
    }

    // Step 2: Create sample trade data - A winning AAPL long trade
    console.log('\nStep 2: Creating sample trade...\n');

    const sampleTrade = {
      symbol: 'AAPL',
      side: 'LONG',
      entryDate: '2024-10-15T09:30:00',
      exitDate: '2024-10-15T15:45:00',
      entryPrice: 178.50,
      exitPrice: 182.75,
      quantity: 100,
      stopLoss: 176.00,
      takeProfit: 183.00,
      fees: 2.50,
      status: 'CLOSED',
      strategy: 'Momentum Trading',
      setup: 'Bull Flag Breakout',
      timeframe: '5m',
      marketType: 'STOCKS',
      broker: 'Interactive Brokers',
      entryReasoning: 'Strong bullish momentum after breaking above the 50-day moving average. Volume spike confirmed the breakout with positive market sentiment. RSI showed healthy momentum without being overbought.',
      exitReasoning: 'Target reached at resistance level. Took profit as planned at $182.75, which was 2.4x the risk. Volume started decreasing near the target.',
      notes: 'Great execution on this trade. Followed the trading plan perfectly. Entry was well-timed after confirmation candle. Exit could have been slightly better but stuck to the plan.',
      confidenceLevel: 8,
      emotionalState: 'Calm and focused'
    };

    console.log('Trade Details:');
    console.log(`  Symbol: ${sampleTrade.symbol}`);
    console.log(`  Side: ${sampleTrade.side}`);
    console.log(`  Entry: $${sampleTrade.entryPrice} | Exit: $${sampleTrade.exitPrice}`);
    console.log(`  Quantity: ${sampleTrade.quantity} shares`);
    console.log(`  Strategy: ${sampleTrade.strategy}`);
    console.log(`  Setup: ${sampleTrade.setup}\n`);

    const response = await axios.post(`${API_URL}/trades`, sampleTrade, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Sample trade created successfully!\n');
    console.log('Trade Details:');
    console.log('  ID:', response.data.id);
    console.log('  Symbol:', response.data.symbol);
    console.log('  Entry Price: $' + response.data.entry_price);
    console.log('  Exit Price: $' + response.data.exit_price);
    console.log('  P&L: $' + response.data.pnl);
    console.log('  P&L %: ' + response.data.pnl_percentage + '%');
    console.log('  Status:', response.data.status);
    console.log('\n📊 You can now view this trade at: http://localhost:3002/trades');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createSampleTrade();
