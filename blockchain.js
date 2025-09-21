const express = require('express');
const router = express.Router();
const CardanoIntegration = require('../blockchain/cardano_integration');
const { dbHelpers } = require('../models/database');

// Initialize Cardano integration
const cardanoIntegration = new CardanoIntegration({
  network: process.env.CARDANO_NETWORK || 'preprod',
  walletAddress: process.env.CARDANO_WALLET_ADDRESS,
  walletMnemonic: process.env.CARDANO_WALLET_MNEMONIC,
  apiKey: process.env.BLOCKCHAIN_API_KEY
});

// Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await cardanoIntegration.getBlockchainStats();
    
    res.json({
      success: true,
      blockchain_stats: stats,
      network: process.env.CARDANO_NETWORK || 'preprod',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting blockchain stats:', error);
    res.status(500).json({ 
      error: 'Failed to get blockchain statistics',
      message: error.message 
    });
  }
});

// Record transaction on blockchain
router.post('/record', async (req, res) => {
  try {
    const { transaction_id, metadata } = req.body;
    
    if (!transaction_id) {
      return res.status(400).json({ 
        error: 'Missing required field: transaction_id' 
      });
    }

    // Get transaction details
    const transaction = await dbHelpers.getTransaction(transaction_id);
    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        transaction_id: transaction_id
      });
    }

    // Create fraud prediction based on transaction data
    const fraudPrediction = {
      is_fraud: transaction.is_fraud || false,
      fraud_score: transaction.fraud_score || 0,
      confidence: transaction.fraud_score || 0
    };

    // Record on blockchain
    const blockchainRecord = await cardanoIntegration.createFraudAlertTransaction(
      transaction,
      fraudPrediction
    );

    // Save blockchain record to database
    await dbHelpers.createBlockchainRecord(blockchainRecord);

    res.status(201).json({
      success: true,
      transaction_id: transaction_id,
      blockchain_record: blockchainRecord,
      message: 'Transaction recorded on blockchain successfully'
    });

  } catch (error) {
    console.error('Error recording transaction on blockchain:', error);
    res.status(500).json({ 
      error: 'Failed to record transaction on blockchain',
      message: error.message 
    });
  }
});

// Verify transaction on blockchain
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const verification = await cardanoIntegration.verifyTransactionOnBlockchain(transactionId);
    
    res.json({
      success: true,
      verification: verification,
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ 
      error: 'Failed to verify transaction',
      message: error.message 
    });
  }
});

// Get audit trail
router.get('/audit/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const auditTrail = await cardanoIntegration.getAuditTrail(transactionId);
    
    res.json({
      success: true,
      audit_trail: auditTrail,
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({ 
      error: 'Failed to get audit trail',
      message: error.message 
    });
  }
});

// Query fraud alert from blockchain
router.get('/query/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const alert = await cardanoIntegration.queryFraudAlert(transactionId);
    
    res.json({
      success: true,
      fraud_alert: alert,
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('Error querying fraud alert:', error);
    res.status(500).json({ 
      error: 'Failed to query fraud alert',
      message: error.message 
    });
  }
});

// Get all blockchain records
router.get('/records', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const records = await getBlockchainRecords(limit);
    
    res.json({
      success: true,
      records: records,
      count: records.length
    });

  } catch (error) {
    console.error('Error getting blockchain records:', error);
    res.status(500).json({ 
      error: 'Failed to get blockchain records',
      message: error.message 
    });
  }
});

// Get blockchain record by transaction ID
router.get('/records/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const record = await getBlockchainRecordByTransactionId(transactionId);
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Blockchain record not found',
        transaction_id: transactionId
      });
    }

    res.json({
      success: true,
      record: record,
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('Error getting blockchain record:', error);
    res.status(500).json({ 
      error: 'Failed to get blockchain record',
      message: error.message 
    });
  }
});

// Batch record multiple transactions
router.post('/batch-record', async (req, res) => {
  try {
    const { transaction_ids } = req.body;
    
    if (!Array.isArray(transaction_ids)) {
      return res.status(400).json({ 
        error: 'transaction_ids must be an array' 
      });
    }

    const results = [];
    const errors = [];

    for (const transactionId of transaction_ids) {
      try {
        // Get transaction details
        const transaction = await dbHelpers.getTransaction(transactionId);
        if (!transaction) {
          errors.push({
            transaction_id: transactionId,
            error: 'Transaction not found'
          });
          continue;
        }

        // Create fraud prediction
        const fraudPrediction = {
          is_fraud: transaction.is_fraud || false,
          fraud_score: transaction.fraud_score || 0,
          confidence: transaction.fraud_score || 0
        };

        // Record on blockchain
        const blockchainRecord = await cardanoIntegration.createFraudAlertTransaction(
          transaction,
          fraudPrediction
        );

        // Save to database
        await dbHelpers.createBlockchainRecord(blockchainRecord);

        results.push({
          transaction_id: transactionId,
          blockchain_record: blockchainRecord,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          transaction_id: transactionId,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results: results,
      errors: errors,
      message: `Batch recording completed: ${results.length} successful, ${errors.length} errors`
    });

  } catch (error) {
    console.error('Error in batch recording:', error);
    res.status(500).json({ 
      error: 'Failed to batch record transactions',
      message: error.message 
    });
  }
});

// Create NFT metadata for fraud alert
router.post('/nft-metadata', async (req, res) => {
  try {
    const { fraud_alert } = req.body;
    
    if (!fraud_alert) {
      return res.status(400).json({ 
        error: 'Missing required field: fraud_alert' 
      });
    }

    const nftMetadata = cardanoIntegration.createNFTMetadata(fraud_alert);
    
    res.json({
      success: true,
      nft_metadata: nftMetadata,
      message: 'NFT metadata created successfully'
    });

  } catch (error) {
    console.error('Error creating NFT metadata:', error);
    res.status(500).json({ 
      error: 'Failed to create NFT metadata',
      message: error.message 
    });
  }
});

// Helper functions
async function getBlockchainRecords(limit) {
  return new Promise((resolve, reject) => {
    const { db } = require('../models/database');
    
    const sql = `
      SELECT br.*, t.amount, t.merchant_name, t.merchant_category, t.timestamp as transaction_timestamp
      FROM blockchain_records br
      JOIN transactions t ON br.transaction_id = t.transaction_id
      ORDER BY br.created_at DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getBlockchainRecordByTransactionId(transactionId) {
  return new Promise((resolve, reject) => {
    const { db } = require('../models/database');
    
    const sql = `
      SELECT br.*, t.amount, t.merchant_name, t.merchant_category, t.timestamp as transaction_timestamp
      FROM blockchain_records br
      JOIN transactions t ON br.transaction_id = t.transaction_id
      WHERE br.transaction_id = ?
    `;
    
    db.get(sql, [transactionId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = router;
