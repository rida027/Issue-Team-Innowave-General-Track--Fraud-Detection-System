// Demo data generator for testing the fraud detection system
const crypto = require('crypto');

const generateTransactionId = () => {
  return 'TX' + crypto.randomBytes(8).toString('hex').toUpperCase();
};

const generateUserId = () => {
  return 'USER' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
};

const merchantCategories = [
  'grocery', 'gas_station', 'restaurant', 'online_shopping',
  'pharmacy', 'entertainment', 'travel', 'utilities', 'retail'
];

const transactionTypes = ['debit', 'credit', 'atm', 'online', 'mobile'];

const merchantNames = {
  grocery: ['Walmart', 'Target', 'Kroger', 'Safeway', 'Whole Foods'],
  gas_station: ['Shell', 'Exxon', 'BP', 'Chevron', '7-Eleven'],
  restaurant: ['McDonald\'s', 'Starbucks', 'Subway', 'Pizza Hut', 'KFC'],
  online_shopping: ['Amazon', 'eBay', 'Shopify Store', 'Etsy Shop', 'Online Retailer'],
  pharmacy: ['CVS', 'Walgreens', 'Rite Aid', 'Pharmacy Plus', 'Health Mart'],
  entertainment: ['Netflix', 'Spotify', 'Movie Theater', 'Concert Venue', 'Gaming Store'],
  travel: ['Airlines', 'Hotel', 'Car Rental', 'Uber', 'Lyft'],
  utilities: ['Electric Company', 'Water Dept', 'Internet Provider', 'Phone Company', 'Gas Company'],
  retail: ['Best Buy', 'Home Depot', 'Macy\'s', 'Nike Store', 'Apple Store']
};

const generateDemoTransactions = (count = 50) => {
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const category = merchantCategories[Math.floor(Math.random() * merchantCategories.length)];
    const merchantName = merchantNames[category][Math.floor(Math.random() * merchantNames[category].length)];
    
    // Generate realistic amounts based on category
    let amount;
    switch (category) {
      case 'grocery':
        amount = Math.random() * 200 + 20; // $20-$220
        break;
      case 'gas_station':
        amount = Math.random() * 80 + 20; // $20-$100
        break;
      case 'restaurant':
        amount = Math.random() * 50 + 5; // $5-$55
        break;
      case 'online_shopping':
        amount = Math.random() * 500 + 10; // $10-$510
        break;
      case 'pharmacy':
        amount = Math.random() * 100 + 5; // $5-$105
        break;
      case 'entertainment':
        amount = Math.random() * 30 + 5; // $5-$35
        break;
      case 'travel':
        amount = Math.random() * 1000 + 50; // $50-$1050
        break;
      case 'utilities':
        amount = Math.random() * 300 + 20; // $20-$320
        break;
      case 'retail':
        amount = Math.random() * 200 + 10; // $10-$210
        break;
      default:
        amount = Math.random() * 100 + 10; // $10-$110
    }
    
    // Generate some suspicious transactions
    const isSuspicious = Math.random() < 0.15; // 15% chance of being suspicious
    if (isSuspicious) {
      // Make suspicious transactions larger or at unusual times
      amount *= (Math.random() * 3 + 1); // 1x to 4x normal amount
    }
    
    const hour = isSuspicious && Math.random() < 0.3 ? 
      Math.floor(Math.random() * 4) + 2 : // 2-5 AM for suspicious
      Math.floor(Math.random() * 24); // Any hour for normal
    
    const transaction = {
      transaction_id: generateTransactionId(),
      user_id: generateUserId(),
      amount: Math.round(amount * 100) / 100,
      currency: 'USD',
      merchant_name: merchantName,
      merchant_category: category,
      transaction_type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      location_lat: 40.7128 + (Math.random() - 0.5) * 0.2, // NYC area ±0.1 degrees
      location_lng: -74.0060 + (Math.random() - 0.5) * 0.2,
      device_id: 'DEV' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      // Additional fields for ML
      hour: hour,
      day_of_week: Math.floor(Math.random() * 7),
      user_age: Math.floor(Math.random() * 50) + 18, // 18-68
      account_age_days: Math.floor(Math.random() * 3650) + 1, // 1-10 years
      previous_fraud_count: Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0,
      device_type: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
      is_weekend: Math.random() < 0.3 ? 1 : 0,
      is_holiday: Math.random() < 0.05 ? 1 : 0
    };
    
    transactions.push(transaction);
  }
  
  return transactions;
};

const generateFraudAlerts = (transactions) => {
  const alerts = [];
  
  transactions.forEach(transaction => {
    // Generate fraud alerts for suspicious transactions
    if (transaction.amount > 1000 || 
        transaction.hour >= 2 && transaction.hour <= 5 ||
        transaction.merchant_category === 'online_shopping' && transaction.amount > 500) {
      
      const alert = {
        transaction_id: transaction.transaction_id,
        alert_type: 'FRAUD_ALERT',
        severity: transaction.amount > 2000 ? 'high' : 
                 transaction.amount > 1000 ? 'medium' : 'low',
        confidence_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
        ml_model_used: 'XGBoost + KMeans',
        features: JSON.stringify({
          amount: transaction.amount,
          hour: transaction.hour,
          merchant_category: transaction.merchant_category,
          is_weekend: transaction.is_weekend,
          is_holiday: transaction.is_holiday
        }),
        created_at: new Date().toISOString()
      };
      
      alerts.push(alert);
    }
  });
  
  return alerts;
};

const generateBlockchainRecords = (transactions) => {
  const records = [];
  
  transactions.forEach(transaction => {
    if (transaction.amount > 1000) { // Only record high-value transactions
      const record = {
        transaction_id: transaction.transaction_id,
        cardano_tx_hash: '0x' + crypto.randomBytes(32).toString('hex'),
        nft_id: Math.random() < 0.3 ? 'NFT' + crypto.randomBytes(8).toString('hex').toUpperCase() : null,
        metadata: JSON.stringify({
          transactionID: transaction.transaction_id,
          amount: transaction.amount,
          flag: transaction.amount > 2000 ? 'Suspicious' : 'Legitimate',
          timestamp: transaction.timestamp,
          merchantName: transaction.merchant_name,
          merchantCategory: transaction.merchant_category
        }),
        block_height: Math.floor(Math.random() * 1000000) + 1000000,
        confirmation_status: Math.random() < 0.8 ? 'confirmed' : 'pending',
        created_at: new Date().toISOString()
      };
      
      records.push(record);
    }
  });
  
  return records;
};

module.exports = {
  generateDemoTransactions,
  generateFraudAlerts,
  generateBlockchainRecords,
  generateTransactionId,
  generateUserId
};
