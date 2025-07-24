// sales_transaction_test_axios.js

const axios = require('axios'); // Require Axios

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000'; // Replace with your backend URL (e.g., 'http://your-server-ip:port')
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc5N2QzYjc0ZmUwYzEwMDhmNDJiYTQiLCJ1c2VyRW1haWwiOiJyZWRhbmR3aGl0ZUBlbWFpbC5jb20iLCJidXNpbmVzc0lkIjoiQklaX01EN1pCR1o2IiwiYnVzaW5lc3NOYW1lIjoiUmVkIGFuZCBXaGl0ZSIsImFjY291bnRTdGF0dXMiOiJhY3RpdmUiLCJzdWJzY3JpcHRpb25QbGFuIjoiYmFzaWMiLCJpYXQiOjE3NTI3OTI0NTEsImV4cCI6MTc1Mjg3ODg1MX0.V_Cd-IWb9k2M1Q0Wt9CRaEoFuQA7aOlS4KiKYDdAa50';
const PRODUCT_ID_1 = '6879811e74fe0c1008f42bf4'; // Replace with an actual _id from your MongoDB Product collection // Replace with another actual _id from your MongoDB Product collection
const PRODUCT_ID_2 = '6879811e74fe0c1008f42bf4'; // Replace with an actual _id from your MongoDB Product collection // Replace with another actual _id from your MongoDB Product collection

// --- Transaction Payload ---
const transactionPayload = {
  items: [
    {
      productId: PRODUCT_ID_1,
      quantity: 1
    },
  ],
  paymentMethod: 'cash',
  customerName: 'hello there',
  customerEmail: 'test.axios@example.com',
  customerPhone: '+11234567890',
  discountAmount: 0.75,
  notes: 'Testing transaction from Node.js script using Axios.'
};

// --- Function to create a transaction ---
async function createTestTransaction() {
  if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.error('ERROR: Please replace YOUR_JWT_TOKEN_HERE with an actual valid JWT token.');
    return;
  }
  if (PRODUCT_ID_1 === '60d0fe4f5311236168a10001' || PRODUCT_ID_2 === '60d0fe4f5311236168a10003') {
    console.error('ERROR: Please replace PRODUCT_ID_1 and PRODUCT_ID_2 with actual MongoDB Product _ids.');
    return;
  }

  try {
    console.log('Sending transaction payload:', JSON.stringify(transactionPayload, null, 2));
    console.log(`To URL: ${API_BASE_URL}/api/sales/transactions`);
    console.log(`With Authorization: Bearer ${AUTH_TOKEN.substring(0, 10)}...`); // Show partial token

    const response = await axios.post(
      `${API_BASE_URL}/api/sales/transactions`,
      transactionPayload, // Axios automatically stringifies JSON body
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    // Axios automatically parses JSON responses
    console.log('\n✅ Transaction created successfully!');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log(`Transaction Number: ${response.data.data.transactionNumber}`);

  } catch (error) {
    console.error('\n❌ Error creating transaction!');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    console.error('Axios config:', error.config);
  }
}

// --- Run the test ---
createTestTransaction();