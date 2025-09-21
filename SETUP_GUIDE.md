# AI Fraud Detection System - Setup Guide

## 🚀 Quick Start

This guide will help you set up and run the AI Fraud Detection System with Cardano blockchain integration.

## 📋 Prerequisites

### Required Software
1. **Node.js 16+** - [Download here](https://nodejs.org/)
2. **Python 3.8+** - [Download here](https://python.org/)
3. **Git** - [Download here](https://git-scm.com/)

### Verify Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version
# or
python3 --version

# Check Git
git --version
```

## 🛠️ Installation Steps

### Step 1: Clone and Setup
```bash
# Clone the repository (if from git)
git clone <repository-url>
cd ai-fraud-detection

# Or if you already have the files, navigate to the directory
cd "C:\Users\batoo\Desktop\Ai fraud detction"
```

### Step 2: Install Backend Dependencies
```bash
# Install Node.js packages
npm install

# Install Python packages
pip install -r requirements.txt
```

### Step 3: Configure Environment
```bash
# Copy the example environment file
copy config.env .env

# Edit .env file with your settings
# At minimum, set:
# - JWT_SECRET (any random string)
# - CARDANO_NETWORK=preprod (for testing)
```

### Step 4: Initialize Database and Train Models
```bash
# Train the ML models (this will create the models directory)
python ml/fraud_detector.py

# Seed the database with demo data
node demo/seed_database.js
```

### Step 5: Install Frontend Dependencies
```bash
# Navigate to client directory
cd client

# Install React dependencies
npm install

# Go back to root directory
cd ..
```

### Step 6: Start the System
```bash
# Start the backend server (Terminal 1)
npm start

# Start the frontend (Terminal 2)
cd client
npm start
```

## 🌐 Access the System

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🧪 Testing the System

### Automated Tests
```bash
# Run the system test suite
node test_system.js
```

### Manual Testing
1. Open http://localhost:3000
2. Navigate to the Dashboard
3. Check that data is loading
4. Try creating a new transaction
5. Verify fraud detection is working

## 🔧 Configuration Options

### Environment Variables (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=./data/fraud_detection.db

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Cardano Configuration
CARDANO_NETWORK=preprod
CARDANO_WALLET_MNEMONIC=your-wallet-mnemonic-here
CARDANO_WALLET_ADDRESS=your-wallet-address-here

# ML Model Configuration
ML_MODEL_PATH=./models/
TRAINING_DATA_PATH=./data/training/
```

### Cardano Wallet Setup (Optional)
1. Install a Cardano wallet (Daedalus, Yoroi, or Nami)
2. Create a new wallet or use an existing one
3. Get your mnemonic phrase and wallet address
4. Add them to the .env file

## 📊 Demo Data

The system includes comprehensive demo data:
- 100+ sample transactions
- Various merchant categories
- Realistic fraud patterns
- Blockchain records
- Fraud alerts

### Generate More Demo Data
```bash
# Generate additional demo data
node -e "
const { generateDemoTransactions } = require('./demo/demo_data');
const transactions = generateDemoTransactions(50);
console.log('Generated', transactions.length, 'transactions');
"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Node.js/npm not found
```bash
# Install Node.js from https://nodejs.org/
# Make sure to check "Add to PATH" during installation
```

#### 2. Python not found
```bash
# Install Python from https://python.org/
# Make sure to check "Add to PATH" during installation
```

#### 3. Port already in use
```bash
# Change the port in .env file
PORT=5001
```

#### 4. Database errors
```bash
# Delete the database file and restart
rm data/fraud_detection.db
npm start
```

#### 5. ML model errors
```bash
# Reinstall Python dependencies
pip install --upgrade -r requirements.txt

# Retrain models
python ml/fraud_detector.py
```

### Logs and Debugging
```bash
# Check backend logs
npm start

# Check frontend logs
cd client
npm start

# Check Python ML logs
python ml/fraud_detector.py
```

## 🔄 Development Workflow

### Making Changes
1. Edit the source files
2. Restart the backend server (Ctrl+C, then `npm start`)
3. Frontend will auto-reload
4. Test your changes

### Adding New Features
1. Backend: Add routes in `routes/` directory
2. Frontend: Add components in `client/src/`
3. ML: Modify models in `ml/` directory
4. Blockchain: Update integration in `blockchain/`

## 📈 Performance Optimization

### For Production
1. Set `NODE_ENV=production`
2. Build the frontend: `cd client && npm run build`
3. Use a production database (PostgreSQL)
4. Configure proper logging
5. Set up monitoring

### Scaling
- Use PM2 for process management
- Implement Redis for caching
- Use load balancers for multiple instances
- Set up database replication

## 🛡️ Security Considerations

1. **Change default JWT secret**
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Validate all inputs**
5. **Use environment variables for secrets**
6. **Regular security updates**

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the logs
3. Verify all prerequisites are installed
4. Check the GitHub issues (if applicable)
5. Create a new issue with detailed information

## 🎯 Next Steps

After successful setup:
1. Explore the dashboard
2. Create test transactions
3. Monitor fraud detection
4. Check blockchain integration
5. Customize the system for your needs

## 🚀 Quick Commands Reference

```bash
# Install everything
npm install && pip install -r requirements.txt && cd client && npm install && cd ..

# Train ML models
python ml/fraud_detector.py

# Seed demo data
node demo/seed_database.js

# Start backend
npm start

# Start frontend (in new terminal)
cd client && npm start

# Test system
node test_system.js

# Build for production
cd client && npm run build
```

## 📱 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 1GB free space
- **CPU**: Dual-core processor
- **OS**: Windows 10+, macOS 10.14+, or Linux

### Recommended Requirements
- **RAM**: 8GB+
- **Storage**: 5GB+ free space
- **CPU**: Quad-core processor
- **OS**: Latest version of your operating system

---

**Happy fraud detecting! 🕵️‍♂️**