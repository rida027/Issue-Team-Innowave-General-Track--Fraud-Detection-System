const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'fraud_detection.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'USD',
          merchant_name TEXT,
          merchant_category TEXT,
          transaction_type TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          location_lat REAL,
          location_lng REAL,
          device_id TEXT,
          ip_address TEXT,
          is_fraud BOOLEAN DEFAULT 0,
          fraud_score REAL DEFAULT 0,
          fraud_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Fraud alerts table
      db.run(`
        CREATE TABLE IF NOT EXISTS fraud_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          confidence_score REAL NOT NULL,
          ml_model_used TEXT NOT NULL,
          features TEXT,
          cardano_tx_hash TEXT,
          cardano_nft_id TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id)
        )
      `);

      // ML model performance table
      db.run(`
        CREATE TABLE IF NOT EXISTS model_performance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model_name TEXT NOT NULL,
          accuracy REAL,
          precision_score REAL,
          recall_score REAL,
          f1_score REAL,
          training_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          test_data_size INTEGER,
          features_used TEXT
        )
      `);

      // Blockchain records table
      db.run(`
        CREATE TABLE IF NOT EXISTS blockchain_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id TEXT NOT NULL,
          cardano_tx_hash TEXT UNIQUE NOT NULL,
          nft_id TEXT,
          metadata TEXT,
          block_height INTEGER,
          confirmation_status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_fraud ON transactions(is_fraud)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_fraud_alerts_transaction ON fraud_alerts(transaction_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_records(cardano_tx_hash)`);

      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
};

// Database helper functions
const dbHelpers = {
  // Transaction operations
  createTransaction: (transactionData) => {
    return new Promise((resolve, reject) => {
      const {
        transaction_id, user_id, amount, currency, merchant_name,
        merchant_category, transaction_type, location_lat, location_lng,
        device_id, ip_address
      } = transactionData;

      const sql = `
        INSERT INTO transactions (
          transaction_id, user_id, amount, currency, merchant_name,
          merchant_category, transaction_type, location_lat, location_lng,
          device_id, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        transaction_id, user_id, amount, currency, merchant_name,
        merchant_category, transaction_type, location_lat, location_lng,
        device_id, ip_address
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, transaction_id });
      });
    });
  },

  getTransaction: (transactionId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  updateTransactionFraud: (transactionId, isFraud, fraudScore, fraudReason) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE transactions 
        SET is_fraud = ?, fraud_score = ?, fraud_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `;
      db.run(sql, [isFraud, fraudScore, fraudReason, transactionId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Fraud alert operations
  createFraudAlert: (alertData) => {
    return new Promise((resolve, reject) => {
      const {
        transaction_id, alert_type, severity, confidence_score,
        ml_model_used, features, cardano_tx_hash, cardano_nft_id
      } = alertData;

      const sql = `
        INSERT INTO fraud_alerts (
          transaction_id, alert_type, severity, confidence_score,
          ml_model_used, features, cardano_tx_hash, cardano_nft_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        transaction_id, alert_type, severity, confidence_score,
        ml_model_used, features, cardano_tx_hash, cardano_nft_id
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  // Blockchain operations
  createBlockchainRecord: (recordData) => {
    return new Promise((resolve, reject) => {
      const {
        transaction_id, cardano_tx_hash, nft_id, metadata, block_height
      } = recordData;

      const sql = `
        INSERT INTO blockchain_records (
          transaction_id, cardano_tx_hash, nft_id, metadata, block_height
        ) VALUES (?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        transaction_id, cardano_tx_hash, nft_id, metadata, block_height
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  // Analytics queries
  getFraudStats: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_count,
          AVG(fraud_score) as avg_fraud_score,
          COUNT(DISTINCT user_id) as unique_users
        FROM transactions
        WHERE timestamp >= datetime('now', '-30 days')
      `;
      db.get(sql, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getRecentTransactions: (limit = 100) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM transactions 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Initialize database on module load
initializeDatabase().catch(console.error);

module.exports = { db, dbHelpers };
