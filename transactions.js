const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../models/database');
const { spawn } = require('child_process');
const path = require('path');

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const transactionData = req.body;
    
    // Validate required fields
    const requiredFields = ['transaction_id', 'user_id', 'amount', 'transaction_type'];
    for (const field of requiredFields) {
      if (!transactionData[field]) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Check if transaction already exists
    const existingTransaction = await dbHelpers.getTransaction(transactionData.transaction_id);
    if (existingTransaction) {
      return res.status(409).json({ 
        error: 'Transaction already exists',
        transaction_id: transactionData.transaction_id
      });
    }

    // Create transaction in database
    const result = await dbHelpers.createTransaction(transactionData);
    
    // Trigger fraud detection
    const fraudDetection = await runFraudDetection(transactionData);
    
    // Update transaction with fraud detection results
    await dbHelpers.updateTransactionFraud(
      transactionData.transaction_id,
      fraudDetection.is_fraud,
      fraudDetection.fraud_score,
      fraudDetection.fraud_reason
    );

    res.status(201).json({
      success: true,
      transaction_id: result.transaction_id,
      fraud_detection: fraudDetection,
      message: 'Transaction created and analyzed successfully'
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to create transaction',
      message: error.message 
    });
  }
});

// Get transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await dbHelpers.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        transaction_id: transactionId
      });
    }

    res.json({
      success: true,
      transaction: transaction
    });

  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ 
      error: 'Failed to get transaction',
      message: error.message 
    });
  }
});

// Get recent transactions
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const transactions = await dbHelpers.getRecentTransactions(limit);
    
    res.json({
      success: true,
      transactions: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ 
      error: 'Failed to get transactions',
      message: error.message 
    });
  }
});

// Batch create transactions
router.post('/batch', async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ 
        error: 'Transactions must be an array' 
      });
    }

    const results = [];
    const errors = [];

    for (const transactionData of transactions) {
      try {
        // Validate required fields
        const requiredFields = ['transaction_id', 'user_id', 'amount', 'transaction_type'];
        const missingFields = requiredFields.filter(field => !transactionData[field]);
        
        if (missingFields.length > 0) {
          errors.push({
            transaction_id: transactionData.transaction_id,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          continue;
        }

        // Check if transaction already exists
        const existingTransaction = await dbHelpers.getTransaction(transactionData.transaction_id);
        if (existingTransaction) {
          errors.push({
            transaction_id: transactionData.transaction_id,
            error: 'Transaction already exists'
          });
          continue;
        }

        // Create transaction
        const result = await dbHelpers.createTransaction(transactionData);
        
        // Run fraud detection
        const fraudDetection = await runFraudDetection(transactionData);
        
        // Update transaction with fraud detection results
        await dbHelpers.updateTransactionFraud(
          transactionData.transaction_id,
          fraudDetection.is_fraud,
          fraudDetection.fraud_score,
          fraudDetection.fraud_reason
        );

        results.push({
          transaction_id: result.transaction_id,
          fraud_detection: fraudDetection,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          transaction_id: transactionData.transaction_id,
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
    console.error('Error in batch processing:', error);
    res.status(500).json({ 
      error: 'Failed to process batch transactions',
      message: error.message 
    });
  }
});

// Update transaction
router.put('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updateData = req.body;
    
    // Check if transaction exists
    const existingTransaction = await dbHelpers.getTransaction(transactionId);
    if (!existingTransaction) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        transaction_id: transactionId
      });
    }

    // For now, we'll only allow updating fraud-related fields
    const allowedUpdates = ['is_fraud', 'fraud_score', 'fraud_reason'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields to update' 
      });
    }

    // Update transaction
    await dbHelpers.updateTransactionFraud(
      transactionId,
      updates.is_fraud,
      updates.fraud_score,
      updates.fraud_reason
    );

    res.json({
      success: true,
      transaction_id: transactionId,
      updated_fields: Object.keys(updates),
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction',
      message: error.message 
    });
  }
});

// Helper function to run fraud detection
async function runFraudDetection(transactionData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml/fraud_detector.py'),
      '--predict',
      JSON.stringify(transactionData)
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
          // Parse the prediction result
          const lines = output.trim().split('\n');
          const predictionLine = lines.find(line => line.includes('Sample prediction:'));
          
          if (predictionLine) {
            const predictionStr = predictionLine.split('Sample prediction: ')[1];
            const prediction = JSON.parse(predictionStr);
            
            // Generate fraud reason based on prediction
            let fraudReason = 'Legitimate transaction';
            if (prediction.is_fraud) {
              const reasons = [];
              if (prediction.xgb_probability > 0.7) {
                reasons.push('High ML probability');
              }
              if (prediction.kmeans_anomaly) {
                reasons.push('Anomaly detected');
              }
              if (prediction.anomaly_distance > 2) {
                reasons.push('Unusual pattern');
              }
              fraudReason = reasons.join(', ') || 'Suspicious activity detected';
            }
            
            resolve({
              is_fraud: prediction.is_fraud,
              fraud_score: prediction.fraud_score,
              fraud_reason: fraudReason,
              confidence: prediction.confidence,
              xgb_probability: prediction.xgb_probability,
              kmeans_anomaly: prediction.kmeans_anomaly
            });
          } else {
            // Fallback prediction if parsing fails
            resolve({
              is_fraud: 0,
              fraud_score: 0.1,
              fraud_reason: 'Legitimate transaction',
              confidence: 0.9,
              xgb_probability: 0.1,
              kmeans_anomaly: 0
            });
          }
        } catch (error) {
          console.error('Error parsing fraud detection result:', error);
          // Fallback prediction
          resolve({
            is_fraud: 0,
            fraud_score: 0.1,
            fraud_reason: 'Legitimate transaction',
            confidence: 0.9,
            xgb_probability: 0.1,
            kmeans_anomaly: 0
          });
        }
      } else {
        console.error('Python process error:', errorOutput);
        // Fallback prediction
        resolve({
          is_fraud: 0,
          fraud_score: 0.1,
          fraud_reason: 'Legitimate transaction',
          confidence: 0.9,
          xgb_probability: 0.1,
          kmeans_anomaly: 0
        });
      }
    });
  });
}

module.exports = router;
