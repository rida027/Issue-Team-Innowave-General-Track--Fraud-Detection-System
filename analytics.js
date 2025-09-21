const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../models/database');
const { db } = require('../models/database');

// Get comprehensive analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [
      fraudStats,
      recentTransactions,
      fraudAlerts,
      blockchainRecords,
      modelPerformance
    ] = await Promise.all([
      getFraudStatistics(),
      getRecentTransactions(20),
      getRecentFraudAlerts(10),
      getRecentBlockchainRecords(10),
      getModelPerformanceMetrics()
    ]);

    res.json({
      success: true,
      dashboard: {
        fraud_stats: fraudStats,
        recent_transactions: recentTransactions,
        fraud_alerts: fraudAlerts,
        blockchain_records: blockchainRecords,
        model_performance: modelPerformance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      message: error.message 
    });
  }
});

// Get fraud statistics with time-based analysis
router.get('/fraud-stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const stats = await getFraudStatistics(period);
    
    res.json({
      success: true,
      fraud_statistics: stats,
      period: period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fraud statistics:', error);
    res.status(500).json({ 
      error: 'Failed to get fraud statistics',
      message: error.message 
    });
  }
});

// Get transaction volume analytics
router.get('/transaction-volume', async (req, res) => {
  try {
    const { period = '7d', group_by = 'day' } = req.query;
    const volumeData = await getTransactionVolume(period, group_by);
    
    res.json({
      success: true,
      transaction_volume: volumeData,
      period: period,
      group_by: group_by,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting transaction volume:', error);
    res.status(500).json({ 
      error: 'Failed to get transaction volume',
      message: error.message 
    });
  }
});

// Get fraud detection accuracy metrics
router.get('/accuracy-metrics', async (req, res) => {
  try {
    const metrics = await getAccuracyMetrics();
    
    res.json({
      success: true,
      accuracy_metrics: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting accuracy metrics:', error);
    res.status(500).json({ 
      error: 'Failed to get accuracy metrics',
      message: error.message 
    });
  }
});

// Get merchant category analysis
router.get('/merchant-analysis', async (req, res) => {
  try {
    const analysis = await getMerchantCategoryAnalysis();
    
    res.json({
      success: true,
      merchant_analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting merchant analysis:', error);
    res.status(500).json({ 
      error: 'Failed to get merchant analysis',
      message: error.message 
    });
  }
});

// Get geographic fraud distribution
router.get('/geographic-distribution', async (req, res) => {
  try {
    const distribution = await getGeographicDistribution();
    
    res.json({
      success: true,
      geographic_distribution: distribution,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting geographic distribution:', error);
    res.status(500).json({ 
      error: 'Failed to get geographic distribution',
      message: error.message 
    });
  }
});

// Get blockchain activity metrics
router.get('/blockchain-activity', async (req, res) => {
  try {
    const activity = await getBlockchainActivity();
    
    res.json({
      success: true,
      blockchain_activity: activity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting blockchain activity:', error);
    res.status(500).json({ 
      error: 'Failed to get blockchain activity',
      message: error.message 
    });
  }
});

// Get risk score distribution
router.get('/risk-distribution', async (req, res) => {
  try {
    const distribution = await getRiskScoreDistribution();
    
    res.json({
      success: true,
      risk_distribution: distribution,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting risk distribution:', error);
    res.status(500).json({ 
      error: 'Failed to get risk distribution',
      message: error.message 
    });
  }
});

// Get model performance over time
router.get('/model-performance-trend', async (req, res) => {
  try {
    const trend = await getModelPerformanceTrend();
    
    res.json({
      success: true,
      model_performance_trend: trend,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting model performance trend:', error);
    res.status(500).json({ 
      error: 'Failed to get model performance trend',
      message: error.message 
    });
  }
});

// Helper functions
async function getFraudStatistics(period = '30d') {
  return new Promise((resolve, reject) => {
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "AND timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "AND timestamp >= datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "AND timestamp >= datetime('now', '-90 days')";
        break;
      default:
        dateFilter = "AND timestamp >= datetime('now', '-30 days')";
    }

    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_count,
        ROUND(AVG(fraud_score), 4) as avg_fraud_score,
        COUNT(DISTINCT user_id) as unique_users,
        ROUND(SUM(CASE WHEN is_fraud = 1 THEN amount ELSE 0 END), 2) as fraud_amount,
        ROUND(SUM(amount), 2) as total_amount,
        ROUND(COUNT(CASE WHEN is_fraud = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as fraud_rate
      FROM transactions
      WHERE 1=1 ${dateFilter}
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getRecentTransactions(limit) {
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

async function getRecentFraudAlerts(limit) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT fa.*, t.amount, t.merchant_name, t.merchant_category
      FROM fraud_alerts fa
      JOIN transactions t ON fa.transaction_id = t.transaction_id
      ORDER BY fa.created_at DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getRecentBlockchainRecords(limit) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT br.*, t.amount, t.merchant_name
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

async function getModelPerformanceMetrics() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM model_performance 
      ORDER BY training_date DESC 
      LIMIT 1
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getTransactionVolume(period, groupBy) {
  return new Promise((resolve, reject) => {
    let dateFilter = '';
    let groupByClause = '';
    
    switch (period) {
      case '7d':
        dateFilter = "AND timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "AND timestamp >= datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "AND timestamp >= datetime('now', '-90 days')";
        break;
    }
    
    switch (groupBy) {
      case 'hour':
        groupByClause = "strftime('%Y-%m-%d %H:00:00', timestamp)";
        break;
      case 'day':
        groupByClause = "date(timestamp)";
        break;
      case 'week':
        groupByClause = "strftime('%Y-%W', timestamp)";
        break;
      default:
        groupByClause = "date(timestamp)";
    }

    const sql = `
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_count
      FROM transactions
      WHERE 1=1 ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY period DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getAccuracyMetrics() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN is_fraud = 1 AND fraud_score > 0.5 THEN 1 ELSE 0 END) as true_positives,
        SUM(CASE WHEN is_fraud = 0 AND fraud_score <= 0.5 THEN 1 ELSE 0 END) as true_negatives,
        SUM(CASE WHEN is_fraud = 0 AND fraud_score > 0.5 THEN 1 ELSE 0 END) as false_positives,
        SUM(CASE WHEN is_fraud = 1 AND fraud_score <= 0.5 THEN 1 ELSE 0 END) as false_negatives
      FROM transactions
      WHERE timestamp >= datetime('now', '-30 days')
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else {
        if (row) {
          const { total_predictions, true_positives, true_negatives, false_positives, false_negatives } = row;
          const accuracy = (true_positives + true_negatives) / total_predictions;
          const precision = true_positives / (true_positives + false_positives) || 0;
          const recall = true_positives / (true_positives + false_negatives) || 0;
          const f1_score = 2 * (precision * recall) / (precision + recall) || 0;
          
          resolve({
            accuracy: Math.round(accuracy * 10000) / 100,
            precision: Math.round(precision * 10000) / 100,
            recall: Math.round(recall * 10000) / 100,
            f1_score: Math.round(f1_score * 10000) / 100,
            total_predictions,
            true_positives,
            true_negatives,
            false_positives,
            false_negatives
          });
        } else {
          resolve({});
        }
      }
    });
  });
}

async function getMerchantCategoryAnalysis() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        merchant_category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_count,
        ROUND(AVG(fraud_score), 4) as avg_fraud_score,
        ROUND(COUNT(CASE WHEN is_fraud = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as fraud_rate
      FROM transactions
      WHERE merchant_category IS NOT NULL
      AND timestamp >= datetime('now', '-30 days')
      GROUP BY merchant_category
      ORDER BY fraud_rate DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getGeographicDistribution() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ROUND(location_lat, 2) as lat,
        ROUND(location_lng, 2) as lng,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud_count,
        ROUND(COUNT(CASE WHEN is_fraud = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as fraud_rate
      FROM transactions
      WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL
      AND timestamp >= datetime('now', '-30 days')
      GROUP BY ROUND(location_lat, 2), ROUND(location_lng, 2)
      HAVING transaction_count >= 5
      ORDER BY fraud_rate DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getBlockchainActivity() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT transaction_id) as unique_transactions,
        COUNT(CASE WHEN nft_id IS NOT NULL THEN 1 END) as nft_count,
        COUNT(CASE WHEN confirmation_status = 'confirmed' THEN 1 END) as confirmed_count
      FROM blockchain_records
      WHERE created_at >= datetime('now', '-30 days')
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getRiskScoreDistribution() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        CASE 
          WHEN fraud_score < 0.2 THEN 'Low Risk'
          WHEN fraud_score < 0.5 THEN 'Medium Risk'
          WHEN fraud_score < 0.8 THEN 'High Risk'
          ELSE 'Very High Risk'
        END as risk_category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions WHERE timestamp >= datetime('now', '-30 days')), 2) as percentage
      FROM transactions
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY risk_category
      ORDER BY 
        CASE 
          WHEN risk_category = 'Low Risk' THEN 1
          WHEN risk_category = 'Medium Risk' THEN 2
          WHEN risk_category = 'High Risk' THEN 3
          WHEN risk_category = 'Very High Risk' THEN 4
        END
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getModelPerformanceTrend() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        training_date,
        accuracy,
        precision_score,
        recall_score,
        f1_score,
        test_data_size
      FROM model_performance
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
