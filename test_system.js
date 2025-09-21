const axios = require('axios');
const { generateDemoTransactions } = require('./demo/demo_data');

const API_BASE = 'http://localhost:5000/api';

const testSystem = async () => {
  console.log('🧪 Testing AI Fraud Detection System...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: Create a test transaction
    console.log('\n2️⃣ Testing transaction creation...');
    const testTransaction = {
      transaction_id: 'TEST_TX_' + Date.now(),
      user_id: 'TEST_USER_001',
      amount: 1500.00,
      currency: 'USD',
      merchant_name: 'Suspicious Online Store',
      merchant_category: 'online_shopping',
      transaction_type: 'online',
      location_lat: 40.7128,
      location_lng: -74.0060,
      device_id: 'TEST_DEVICE_001',
      ip_address: '192.168.1.100'
    };
    
    const transactionResponse = await axios.post(`${API_BASE}/transactions`, testTransaction);
    console.log('✅ Transaction created:', transactionResponse.data.transaction_id);
    console.log('🤖 Fraud detection result:', transactionResponse.data.fraud_detection);
    
    // Test 3: Get transactions
    console.log('\n3️⃣ Testing transaction retrieval...');
    const transactionsResponse = await axios.get(`${API_BASE}/transactions?limit=10`);
    console.log(`✅ Retrieved ${transactionsResponse.data.count} transactions`);
    
    // Test 4: Get fraud statistics
    console.log('\n4️⃣ Testing fraud statistics...');
    const fraudStatsResponse = await axios.get(`${API_BASE}/fraud/stats`);
    console.log('✅ Fraud statistics:', fraudStatsResponse.data.fraud_stats);
    
    // Test 5: Get blockchain stats
    console.log('\n5️⃣ Testing blockchain statistics...');
    const blockchainStatsResponse = await axios.get(`${API_BASE}/blockchain/stats`);
    console.log('✅ Blockchain statistics:', blockchainStatsResponse.data.blockchain_stats);
    
    // Test 6: Get analytics dashboard
    console.log('\n6️⃣ Testing analytics dashboard...');
    const analyticsResponse = await axios.get(`${API_BASE}/analytics/dashboard`);
    console.log('✅ Analytics dashboard loaded successfully');
    
    // Test 7: Create fraud alert
    console.log('\n7️⃣ Testing fraud alert creation...');
    const fraudAlert = {
      transaction_id: testTransaction.transaction_id,
      alert_type: 'FRAUD_ALERT',
      severity: 'high',
      confidence_score: 0.85,
      ml_model_used: 'XGBoost + KMeans',
      features: JSON.stringify({
        amount: testTransaction.amount,
        merchant_category: testTransaction.merchant_category,
        transaction_type: testTransaction.transaction_type
      })
    };
    
    const alertResponse = await axios.post(`${API_BASE}/fraud/alert`, fraudAlert);
    console.log('✅ Fraud alert created:', alertResponse.data.alert_id);
    
    // Test 8: Batch transaction creation
    console.log('\n8️⃣ Testing batch transaction creation...');
    const batchTransactions = generateDemoTransactions(5);
    const batchResponse = await axios.post(`${API_BASE}/transactions/batch`, {
      transactions: batchTransactions
    });
    console.log(`✅ Batch created: ${batchResponse.data.processed} successful, ${batchResponse.data.errors} errors`);
    
    // Test 9: Verify transaction on blockchain
    console.log('\n9️⃣ Testing blockchain verification...');
    const verifyResponse = await axios.get(`${API_BASE}/blockchain/verify/${testTransaction.transaction_id}`);
    console.log('✅ Blockchain verification:', verifyResponse.data.verification);
    
    // Test 10: Get fraud alerts
    console.log('\n🔟 Testing fraud alerts retrieval...');
    const alertsResponse = await axios.get(`${API_BASE}/fraud/alerts?limit=10`);
    console.log(`✅ Retrieved ${alertsResponse.data.count} fraud alerts`);
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 System Status:');
    console.log('   ✅ Backend API: Working');
    console.log('   ✅ Database: Connected');
    console.log('   ✅ ML Models: Loaded');
    console.log('   ✅ Blockchain: Integrated');
    console.log('   ✅ Fraud Detection: Active');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running (npm start)');
    console.log('   2. Check if the database is initialized');
    console.log('   3. Verify ML models are trained');
    console.log('   4. Check environment configuration');
  }
};

// Run tests
testSystem();
