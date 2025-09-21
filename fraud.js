const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../models/database');
const CardanoIntegration = require('../blockchain/cardano_integration');
const { spawn } = require('child_process');
const path = require('path');

// Initialize Cardano integration
const cardanoIntegration = new CardanoIntegration({
  network: process.env.CARDANO_NETWORK || 'preprod',
  walletAddress: process.env.CARDANO_WALLET_ADDRESS,
  walletMnemonic: process.env.CARDANO_WALLET_MNEMONIC,
  apiKey: process.env.BLOCKCHAIN_API_KEY
});

// Get fraud statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await dbHelpers.getFraudStats();
    
    // Get blockchain stats
    const blockchainStats = await cardanoIntegration.getBlockchainStats();
    
    res.json({
      success: true,
      fraud_stats: stats,
      blockchain_stats: blockchainStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fraud stats:', error);
    res.status(500).json({ 
      error: 'Failed to get fraud statistics',
      message: error.message 
    });
  }
});

// Get fraud alerts
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || 'active';
    
    // Query fraud alerts from database
    const alerts = await getFraudAlerts(limit, status);
    
    res.json({
      success: true,
      alerts: alerts,
      count: alerts.length,
      status: status
    });

  } catch (error) {
    console.error('Error getting fraud alerts:', error);
    res.status(500).json({ 
      error: 'Failed to get fraud alerts',
      message: error.message 
    });
  }
});

// Create fraud alert and record on blockchain
router.post('/alert', async (req, res) => {
  try {
    const { transaction_id, alert_type, severity, confidence_score, ml_model_used, features } = req.body;
    
    // Validate required fields
    if (!transaction_id || !alert_type || !severity || !confidence_score) {
      return res.status(400).json({ 
        error: 'Missing required fields: transaction_id, alert_type, severity, confidence_score' 
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

    // Create fraud alert in database
    const alertData = {
      transaction_id,
      alert_type,
      severity,
      confidence_score,
      ml_model_used: ml_model_used || 'XGBoost + KMeans',
      features: JSON.stringify(features || {})
    };

    const alertResult = await dbHelpers.createFraudAlert(alertData);

    // Record fraud alert on Cardano blockchain
    const fraudPrediction = {
      is_fraud: true,
      fraud_score: confidence_score,
      confidence: confidence_score
    };

    const blockchainRecord = await cardanoIntegration.createFraudAlertTransaction(
      transaction,
      fraudPrediction
    );

    // Update alert with blockchain information
    await updateFraudAlertWithBlockchain(alertResult.id, blockchainRecord);

    // Create blockchain record in database
    await dbHelpers.createBlockchainRecord(blockchainRecord);

    res.status(201).json({
      success: true,
      alert_id: alertResult.id,
      transaction_id: transaction_id,
      blockchain_record: blockchainRecord,
      message: 'Fraud alert created and recorded on blockchain'
    });

  } catch (error) {
    console.error('Error creating fraud alert:', error);
    res.status(500).json({ 
      error: 'Failed to create fraud alert',
      message: error.message 
    });
  }
});

// Batch process fraud alerts to blockchain
router.post('/alerts/batch', async (req, res) => {
  try {
    const { alerts } = req.body;
    
    if (!Array.isArray(alerts)) {
      return res.status(400).json({ 
        error: 'Alerts must be an array' 
      });
    }

    const results = [];
    const errors = [];

    for (const alertData of alerts) {
      try {
        // Get transaction details
        const transaction = await dbHelpers.getTransaction(alertData.transaction_id);
        if (!transaction) {
          errors.push({
            transaction_id: alertData.transaction_id,
            error: 'Transaction not found'
          });
          continue;
        }

        // Create fraud alert
        const alert = await dbHelpers.createFraudAlert(alertData);

        // Record on blockchain
        const fraudPrediction = {
          is_fraud: true,
          fraud_score: alertData.confidence_score,
          confidence: alertData.confidence_score
        };

        const blockchainRecord = await cardanoIntegration.createFraudAlertTransaction(
          transaction,
          fraudPrediction
        );

        // Update alert and create blockchain record
        await updateFraudAlertWithBlockchain(alert.id, blockchainRecord);
        await dbHelpers.createBlockchainRecord(blockchainRecord);

        results.push({
          alert_id: alert.id,
          transaction_id: alertData.transaction_id,
          blockchain_record: blockchainRecord,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          transaction_id: alertData.transaction_id,
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
      message: `Batch processing completed: ${results.length} successful, ${errors.length} errors`
    });

  } catch (error) {
    console.error('Error in batch processing fraud alerts:', error);
    res.status(500).json({ 
      error: 'Failed to process batch fraud alerts',
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

// Get audit trail for transaction
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

// Retrain ML models
router.post('/retrain', async (req, res) => {
  try {
    const { force_retrain = false } = req.body;
    
    // Run model training
    const trainingResult = await retrainModels(force_retrain);
    
    res.json({
      success: true,
      training_result: trainingResult,
      message: 'Models retrained successfully'
    });

  } catch (error) {
    console.error('Error retraining models:', error);
    res.status(500).json({ 
      error: 'Failed to retrain models',
      message: error.message 
    });
  }
});

// Get model performance metrics
router.get('/model-performance', async (req, res) => {
  try {
    const performance = await getModelPerformance();
    
    res.json({
      success: true,
      performance: performance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({ 
      error: 'Failed to get model performance',
      message: error.message 
    });
  }
});

// Helper functions
async function getFraudAlerts(limit, status) {
  return new Promise((resolve, reject) => {
    const { db } = require('../models/database');
    
    const sql = `
      SELECT fa.*, t.amount, t.merchant_name, t.merchant_category, t.timestamp as transaction_timestamp
      FROM fraud_alerts fa
      JOIN transactions t ON fa.transaction_id = t.transaction_id
      WHERE fa.status = ?
      ORDER BY fa.created_at DESC
      LIMIT ?
    `;
    
    db.all(sql, [status, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function updateFraudAlertWithBlockchain(alertId, blockchainRecord) {
  return new Promise((resolve, reject) => {
    const { db } = require('../models/database');
    
    const sql = `
      UPDATE fraud_alerts 
      SET cardano_tx_hash = ?, cardano_nft_id = ?
      WHERE id = ?
    `;
    
    db.run(sql, [blockchainRecord.cardano_tx_hash, blockchainRecord.nft_id, alertId], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

async function retrainModels(forceRetrain) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml/fraud_detector.py'),
      '--retrain',
      forceRetrain ? '--force' : ''
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse training results
          const lines = output.trim().split('\n');
          const resultLine = lines.find(line => line.includes('Training completed:'));
          
          if (resultLine) {
            const resultStr = resultLine.split('Training completed: ')[1];
            const result = JSON.parse(resultStr);
            resolve(result);
          } else {
            resolve({
              status: 'completed',
              message: 'Models retrained successfully'
            });
          }
        } catch (error) {
          resolve({
            status: 'completed',
            message: 'Models retrained successfully'
          });
        }
      } else {
        reject(new Error(`Training failed: ${errorOutput}`));
      }
    });
  });
}

async function getModelPerformance() {
  return new Promise((resolve, reject) => {
    const { db } = require('../models/database');
    
    const sql = `
      SELECT * FROM model_performance 
      ORDER BY training_date DESC 
      LIMIT 10
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = router;
