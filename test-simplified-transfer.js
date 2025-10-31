const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testUser = {
  email: 'admin@example.com',
  password: 'admin@123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Testing login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSimplifiedTransfer() {
  try {
    console.log('📦 Testing simplified transfer creation...');
    
    // Test with simplified structure
    const transferData = {
      type: 'internal', // Simplified type
      sourceLocationId: '4060c757-8fd5-4f91-ae87-1cfccf092c28', // Main Warehouse
      sourceLocationType: 'warehouse',
      destinationLocationId: '1b23431a-7a4a-4614-ae48-90dcee71c156', // Secondary Warehouse
      destinationLocationType: 'warehouse',
      items: [
        {
          productId: '054b97e8-b50c-4b06-ad18-61a81d3041bb', // pen
          quantity: 5
        }
      ],
      notes: 'Test simplified transfer'
    };

    const response = await axios.post(`${BASE_URL}/transfers`, transferData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Transfer created successfully:', response.data.transferNumber);
    console.log('Status:', response.data.status);
    console.log('Auto-approved:', response.data.status === 'approved');
    
    return response.data.id;
  } catch (error) {
    console.log('❌ Transfer creation failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testDeliveryAndAcceptance(transferId) {
  if (!transferId) return;

  try {
    console.log('🚚 Testing delivery...');
    const deliverResponse = await axios.post(`${BASE_URL}/transfers/${transferId}/deliver`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Transfer delivered:', deliverResponse.data.status);

    console.log('✅ Testing acceptance...');
    const acceptResponse = await axios.post(`${BASE_URL}/transfers/${transferId}/accept`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Transfer accepted and completed:', acceptResponse.data.status);
    
  } catch (error) {
    console.log('❌ Delivery/Acceptance failed:', error.response?.data?.message || error.message);
  }
}

async function testExternalTransfer() {
  try {
    console.log('🏪 Testing external transfer (shop to warehouse)...');
    
    const transferData = {
      type: 'external',
      sourceLocationId: '3880f71d-0222-4087-b1a9-0e64d657ad38', // TechCorp Solutions Store 1
      sourceLocationType: 'shop',
      destinationLocationId: '4060c757-8fd5-4f91-ae87-1cfccf092c28', // Main Warehouse
      destinationLocationType: 'warehouse',
      items: [
        {
          productId: '054b97e8-b50c-4b06-ad18-61a81d3041bb', // pen
          quantity: 2
        }
      ],
      notes: 'Test external transfer'
    };

    const response = await axios.post(`${BASE_URL}/transfers`, transferData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ External transfer created:', response.data.transferNumber);
    console.log('Status:', response.data.status);
    
    return response.data.id;
  } catch (error) {
    console.log('❌ External transfer failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Simplified Transfer API Tests...\n');
  
  // Test login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test simplified transfer
  const transferId = await testSimplifiedTransfer();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test delivery and acceptance
  await testDeliveryAndAcceptance(transferId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test external transfer
  await testExternalTransfer();
  
  console.log('\n🏁 Simplified Transfer API Tests Completed!');
}

// Run the tests
runTests().catch(console.error);




