// Test script to find correct Eupago MB WAY endpoint
// Run with: node test-mbway.js

// Load environment variables (ES module style)
import dotenv from 'dotenv';
dotenv.config();

const EUPAGO_CLIENT_ID = process.env.EUPAGO_CLIENT_ID;
const EUPAGO_CLIENT_SECRET = process.env.EUPAGO_CLIENT_SECRET;

if (!EUPAGO_CLIENT_ID || !EUPAGO_CLIENT_SECRET) {
  console.error('❌ Please set EUPAGO_CLIENT_ID and EUPAGO_CLIENT_SECRET in .env');
  process.exit(1);
}

const credentials = Buffer.from(`${EUPAGO_CLIENT_ID}:${EUPAGO_CLIENT_SECRET}`).toString('base64');

const endpoints = [
  'https://clientes.eupago.pt/api/v1.02/mbway',
  'https://sandbox.eupago.pt/api/v1.02/mbway',
  'https://api.eupago.pt/v1.02/mbway',
  'https://clientes.eupago.pt/clientes/rest_api/mbway',
  'https://sandbox.eupago.pt/clientes/rest_api/mbway'
];

const testData = {
  payment: {
    identifier: "TEST-" + Date.now(),
    amount: {
      value: 0.01,
      currency: "EUR"
    },
    customerPhone: "919792186",
    countryCode: "+351"
  },
  customer: {
    notify: true,
    email: "test@test.com"
  }
};

async function testEndpoint(url) {
  console.log(`\n🔍 Testing: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(testData)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
      
      if (response.ok || data.estado === 'ok') {
        console.log('   ✅ THIS ENDPOINT WORKS!');
        return true;
      }
    } else {
      const text = await response.text();
      console.log('   Response (first 100 chars):', text.substring(0, 100));
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  return false;
}

async function main() {
  console.log('🧪 Testing Eupago MB WAY Endpoints');
  console.log('Using Client ID:', EUPAGO_CLIENT_ID.substring(0, 10) + '...');
  
  for (const endpoint of endpoints) {
    const works = await testEndpoint(endpoint);
    if (works) {
      console.log('\n✅ FOUND WORKING ENDPOINT:', endpoint);
      break;
    }
  }
  
  console.log('\n💡 Tip: Check https://clientes.eupago.pt/ documentation for the correct endpoint');
  console.log('💡 Or contact Eupago support: suporte@eupago.pt');
}

main();
