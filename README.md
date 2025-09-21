# Issue-Team-Innowave-General-Track--Fraud-Detection-System
A comprehensive AI-powered fraud detection system that combines machine learning models (XGBoost + KMeans) with Cardano blockchain integration for immutable fraud alert recording.
# AI Fraud Detection System with Cardano Blockchain Integration

A comprehensive AI-powered fraud detection system that combines machine learning models (XGBoost + KMeans) with Cardano blockchain integration for immutable fraud alert recording.

## 🚀 Features

### Core Functionality
- **ML Fraud Detection**: XGBoost classifier + KMeans anomaly detection
- **Blockchain Integration**: Cardano blockchain for immutable fraud alert storage
- **Real-time Processing**: Live transaction monitoring and fraud detection
- **Modern Web UI**: React-based dashboard with real-time analytics
- **RESTful API**: Complete backend API for all operations

### AI/ML Components
- **XGBoost Model**: Gradient boosting for fraud classification
- **KMeans Clustering**: Anomaly detection for unusual patterns
- **Feature Engineering**: Advanced feature extraction and preprocessing
- **Model Performance Tracking**: Accuracy, precision, recall, F1-score monitoring

### Blockchain Features
- **Cardano Integration**: Preprod/Mainnet support
- **Fraud Alert Recording**: Immutable transaction metadata storage
- **NFT Minting**: Optional NFT creation for fraud alerts
- **Audit Trail**: Complete blockchain verification system

### Dashboard Features
- **Real-time Analytics**: Live fraud detection metrics
- **Transaction Management**: Complete transaction lifecycle management
- **Fraud Alert Monitoring**: Alert status and blockchain confirmation tracking
- **Geographic Analysis**: Fraud distribution mapping
- **Model Performance**: ML model accuracy and performance metrics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js API    │    │  Python ML      │
│                 │    │                 │    │                 │
│  - Dashboard    │◄──►│  - Express.js   │◄──►│  - XGBoost      │
│  - Analytics    │    │  - SQLite DB    │    │  - KMeans       │
│  - Transactions │    │  - Cardano API  │    │  - Scikit-learn │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Cardano         │
                       │ Blockchain      │
                       │                 │
                       │ - Fraud Alerts  │
                       │ - NFT Minting   │
                       │ - Audit Trail   │
                       └─────────────────┘

<img width="1273" height="654" alt="image" src="https://github.com/user-attachments/assets/ba4db200-2cac-4c7d-a9ca-945e835aa246" />

```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- Python 3.8+
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-fraud-detection
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp config.env .env
# Edit .env with your configuration
```

5. **Initialize the database and train models**
```bash
# Start the server (this will initialize the database)
npm start

# In another terminal, train the ML models
python ml/fraud_detector.py
```

### Frontend Setup

1. **Navigate to client directory**
```bash
cd client
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

## 🚀 Usage

### Starting the System

1. **Start the backend server**
```bash
npm start
# Server runs on http://localhost:5000
```

2. **Start the frontend**
```bash
cd client
npm start
# Frontend runs on http://localhost:3000
```

3. **Access the dashboard**
- Open http://localhost:3000 in your browser
- The system will automatically initialize with sample data

### API Endpoints

#### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get specific transaction
- `POST /api/transactions/batch` - Batch create transactions

#### Fraud Detection
- `GET /api/fraud/stats` - Get fraud statistics
- `GET /api/fraud/alerts` - Get fraud alerts
- `POST /api/fraud/alert` - Create fraud alert
- `POST /api/fraud/retrain` - Retrain ML models

#### Blockchain
- `GET /api/blockchain/stats` - Get blockchain statistics
- `POST /api/blockchain/record` - Record transaction on blockchain
- `GET /api/blockchain/verify/:id` - Verify transaction on blockchain
- `GET /api/blockchain/audit/:id` - Get audit trail

#### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/fraud-stats` - Get fraud statistics
- `GET /api/analytics/transaction-volume` - Get transaction volume data
- `GET /api/analytics/accuracy-metrics` - Get model accuracy metrics

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=./data/fraud_detection.db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Cardano Configuration
CARDANO_NETWORK=preprod
CARDANO_WALLET_MNEMONIC=your-wallet-mnemonic-here
CARDANO_WALLET_ADDRESS=your-wallet-address-here

# ML Model Configuration
ML_MODEL_PATH=./models/
TRAINING_DATA_PATH=./data/training/
```

### Cardano Setup

1. **Get a Cardano wallet**
   - Use Daedalus, Yoroi, or Nami wallet
   - Get your mnemonic phrase and address

2. **Configure network**
   - For testing: Use `preprod` network
   - For production: Use `mainnet` network

3. **Update configuration**
   - Add your wallet details to `.env` file

## 📊 ML Model Details

### XGBoost Classifier
- **Purpose**: Binary fraud classification
- **Features**: 20+ engineered features including:
  - Transaction amount and log amount
  - Time-based features (hour, day, weekend)
  - User behavior patterns
  - Geographic features
  - Merchant category encoding

### KMeans Anomaly Detection
- **Purpose**: Detect unusual transaction patterns
- **Clusters**: 5 clusters trained on legitimate transactions
- **Threshold**: 95th percentile distance for anomaly detection

### Feature Engineering
- **Categorical Encoding**: Label encoding for merchant categories
- **Time Features**: Cyclical encoding for hours and days
- **Geographic Features**: Distance from center point
- **Behavioral Features**: User age, account age, previous fraud count

## 🔗 Blockchain Integration

### Fraud Alert Recording
When a transaction is flagged as fraudulent:
1. ML model generates fraud prediction
2. System creates fraud alert metadata
3. Metadata is recorded on Cardano blockchain
4. Transaction hash is stored for verification

### Metadata Structure
```json
{
  "transactionID": "TX12345",
  "amount": 5000,
  "flag": "Suspicious",
  "fraudScore": 0.85,
  "confidence": 0.92,
  "timestamp": "2025-01-21T12:34:00Z",
  "merchantName": "Online Store",
  "merchantCategory": "online_shopping",
  "userId": "user123",
  "mlModel": "XGBoost + KMeans",
  "version": "1.0.0",
  "alertType": "FRAUD_ALERT"
}
```

### NFT Minting (Optional)
- Creates unique NFTs for high-severity fraud alerts
- NFT metadata includes fraud details and transaction info
- Provides additional immutability and traceability

## 📈 Performance Metrics

### Model Performance
- **Accuracy**: ~95% on synthetic data
- **Precision**: ~90% for fraud detection
- **Recall**: ~85% for fraud detection
- **F1-Score**: ~87% overall

### System Performance
- **Transaction Processing**: <100ms per transaction
- **ML Prediction**: <50ms per prediction
- **Blockchain Recording**: 2-5 minutes (Cardano confirmation)
- **Dashboard Refresh**: Real-time updates every 30 seconds

## 🧪 Testing

### Run Tests
```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test

# ML model tests
python -m pytest ml/tests/
```

### Demo Data
The system includes synthetic data generation for testing:
- 10,000+ sample transactions
- Realistic fraud patterns
- Various merchant categories
- Geographic distribution

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
CARDANO_NETWORK=mainnet
```

2. **Build Frontend**
```bash
cd client
npm run build
```

3. **Start Production Server**
```bash
npm start
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] Real-time streaming with WebSockets
- [ ] Advanced ML models (Neural Networks, Ensemble methods)
- [ ] Multi-blockchain support (Ethereum, Polygon)
- [ ] Mobile app integration
- [ ] Advanced analytics and reporting
- [ ] Integration with external fraud databases
- [ ] Automated model retraining pipeline
- [ ] Advanced visualization and dashboards

---

**Built with ❤️ for the Cardano ecosystem**
