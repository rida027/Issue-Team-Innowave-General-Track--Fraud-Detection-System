const { dbHelpers } = require('../models/database');
const { generateDemoTransactions, generateFraudAlerts, generateBlockchainRecords } = require('./demo_data');

const seedDatabase = async () => {
  console.log('🌱 Seeding database with demo data...');
  
  try {
    // Generate demo data
    const transactions = generateDemoTransactions(100);
    const fraudAlerts = generateFraudAlerts(transactions);
    const blockchainRecords = generateBlockchainRecords(transactions);
    
    console.log(`📊 Generated ${transactions.length} transactions`);
    console.log(`🚨 Generated ${fraudAlerts.length} fraud alerts`);
    console.log(`🔗 Generated ${blockchainRecords.length} blockchain records`);
    
    // Insert transactions
    console.log('💾 Inserting transactions...');
    for (const transaction of transactions) {
      try {
        await dbHelpers.createTransaction(transaction);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint failed')) {
          console.error('Error inserting transaction:', error.message);
        }
      }
    }
    
    // Update some transactions with fraud detection results
    console.log('🤖 Simulating fraud detection...');
    for (const transaction of transactions) {
      const isFraud = transaction.amount > 1000 || 
                     (transaction.hour >= 2 && transaction.hour <= 5) ||
                     (transaction.merchant_category === 'online_shopping' && transaction.amount > 500);
      
      const fraudScore = isFraud ? 
        Math.random() * 0.4 + 0.6 : // 0.6-1.0 for fraud
        Math.random() * 0.3 + 0.1;  // 0.1-0.4 for legitimate
      
      const fraudReason = isFraud ? 
        (transaction.amount > 2000 ? 'High amount transaction' :
         transaction.hour >= 2 && transaction.hour <= 5 ? 'Unusual time' :
         'Suspicious pattern') : 'Legitimate transaction';
      
      try {
        await dbHelpers.updateTransactionFraud(
          transaction.transaction_id,
          isFraud ? 1 : 0,
          fraudScore,
          fraudReason
        );
      } catch (error) {
        console.error('Error updating transaction fraud:', error.message);
      }
    }
    
    // Insert fraud alerts
    console.log('🚨 Inserting fraud alerts...');
    for (const alert of fraudAlerts) {
      try {
        await dbHelpers.createFraudAlert(alert);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint failed')) {
          console.error('Error inserting fraud alert:', error.message);
        }
      }
    }
    
    // Insert blockchain records
    console.log('🔗 Inserting blockchain records...');
    for (const record of blockchainRecords) {
      try {
        await dbHelpers.createBlockchainRecord(record);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint failed')) {
          console.error('Error inserting blockchain record:', error.message);
        }
      }
    }
    
    console.log('✅ Database seeded successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - ${transactions.length} transactions created`);
    console.log(`   - ${fraudAlerts.length} fraud alerts created`);
    console.log(`   - ${blockchainRecords.length} blockchain records created`);
    console.log(`   - ${transactions.filter(t => t.amount > 1000).length} high-value transactions`);
    console.log(`   - ${transactions.filter(t => t.hour >= 2 && t.hour <= 5).length} unusual time transactions`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('🎉 Demo data seeding completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
