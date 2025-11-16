// Create a simple demo account
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function createDemoUser() {
  try {
    const demoUser = {
      email: 'demo@demo.com',
      password: 'demo1234',
      firstName: 'Demo',
      lastName: 'User'
    };

    console.log('Creating demo account...\n');

    try {
      // Try to login first
      const loginResponse = await axios.post(`${API_URL}/auth/login`, demoUser);
      console.log('✅ Demo account already exists!');
      console.log('   You can login with these credentials.\n');
    } catch (err) {
      // If login fails, create the account
      const registerResponse = await axios.post(`${API_URL}/auth/register`, demoUser);
      console.log('✅ Demo account created successfully!\n');
    }

    console.log('========================================');
    console.log('DEMO ACCOUNT CREDENTIALS');
    console.log('========================================');
    console.log('Email:    demo@demo.com');
    console.log('Password: demo1234');
    console.log('========================================\n');
    console.log('🌐 Login at: http://localhost:3002/login');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createDemoUser();
