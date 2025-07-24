const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const LOGIN_URL = `${BASE_URL}/api/auth/login`;

// Test credentials - Update these with your actual test user
const testUser = {
  email: 'redandwhite@email.com',
  password: 'redandwhite'
};

async function testLogin() {
  console.log('🔐 Testing login with:', testUser.email);
  
  try {
    const response = await axios.post(LOGIN_URL, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    // Additional debugging info
    if (error.response?.status === 401) {
      console.log('\n🔍 Debug suggestions:');
      console.log('1. Check if user exists in database');
      console.log('2. Verify email is exactly:', testUser.email.toLowerCase());
      console.log('3. Check if accountStatus is "active"');
      console.log('4. Verify password is correctly hashed in database');
      console.log('5. Check server console logs for more details');
    }
  }
}

// Test database connection and user existence
async function testUserExists() {
  console.log('\n🔍 Additional test - checking if we can reach the server...');
  
  try {
    // Try to hit a different endpoint or the same one with wrong data to see server response
    const response = await axios.post(LOGIN_URL, {
      email: '',
      password: ''
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Server is responding (got expected 400 for empty fields)');
    } else {
      console.log('⚠️  Server response:', error.response?.status, error.response?.data);
    }
  }
}

// Run tests
console.log('🚀 Starting authentication tests...\n');
testLogin().then(() => {
  testUserExists();
});

// Quick checklist for debugging
console.log('\n📋 Debugging Checklist:');
console.log('□ Server running on port 3000?');
console.log('□ Database connected?');
console.log('□ User exists with correct email?');
console.log('□ User accountStatus is "active"?');
console.log('□ Password was hashed when creating user?');
console.log('□ Check server console for detailed logs');