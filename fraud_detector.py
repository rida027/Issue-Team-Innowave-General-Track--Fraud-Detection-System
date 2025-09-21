import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb
import joblib
import json
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class FraudDetector:
    def __init__(self, model_path='./models/'):
        self.model_path = model_path
        self.xgb_model = None
        self.kmeans_model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(model_path, exist_ok=True)
        
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic transaction data for training"""
        np.random.seed(42)
        
        # Generate base transaction data
        data = {
            'amount': np.random.lognormal(4, 1.5, n_samples),
            'hour': np.random.randint(0, 24, n_samples),
            'day_of_week': np.random.randint(0, 7, n_samples),
            'merchant_category': np.random.choice([
                'grocery', 'gas_station', 'restaurant', 'online_shopping',
                'pharmacy', 'entertainment', 'travel', 'utilities'
            ], n_samples),
            'transaction_type': np.random.choice([
                'debit', 'credit', 'atm', 'online', 'mobile'
            ], n_samples),
            'user_age': np.random.randint(18, 80, n_samples),
            'account_age_days': np.random.randint(1, 3650, n_samples),
            'previous_fraud_count': np.random.poisson(0.1, n_samples),
            'location_lat': np.random.normal(40.7128, 0.1, n_samples),
            'location_lng': np.random.normal(-74.0060, 0.1, n_samples),
            'device_type': np.random.choice(['mobile', 'desktop', 'tablet'], n_samples),
            'is_weekend': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            'is_holiday': np.random.choice([0, 1], n_samples, p=[0.95, 0.05])
        }
        
        df = pd.DataFrame(data)
        
        # Create fraud patterns
        fraud_conditions = (
            (df['amount'] > df['amount'].quantile(0.95)) |  # High amount
            (df['hour'].isin([2, 3, 4, 5])) |  # Unusual hours
            (df['merchant_category'] == 'online_shopping') & (df['amount'] > 1000) |  # High online
            (df['previous_fraud_count'] > 0) & (df['amount'] > 500) |  # Previous fraud + high amount
            (df['is_holiday'] == 1) & (df['amount'] > 2000)  # Holiday + high amount
        )
        
        df['is_fraud'] = fraud_conditions.astype(int)
        
        # Add some noise to make it more realistic
        fraud_rate = df['is_fraud'].mean()
        print(f"Generated synthetic data with {fraud_rate:.2%} fraud rate")
        
        return df
    
    def prepare_features(self, df):
        """Prepare features for ML models"""
        df = df.copy()
        
        # Encode categorical variables
        categorical_columns = ['merchant_category', 'transaction_type', 'device_type']
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
            else:
                df[col] = self.label_encoders[col].transform(df[col].astype(str))
        
        # Create additional features
        df['amount_log'] = np.log1p(df['amount'])
        df['amount_per_age'] = df['amount'] / (df['user_age'] + 1)
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Distance from center (assuming NYC as center)
        center_lat, center_lng = 40.7128, -74.0060
        df['distance_from_center'] = np.sqrt(
            (df['location_lat'] - center_lat)**2 + (df['location_lng'] - center_lng)**2
        )
        
        # Select features for training
        self.feature_columns = [
            'amount', 'amount_log', 'hour', 'day_of_week', 'merchant_category',
            'transaction_type', 'user_age', 'account_age_days', 'previous_fraud_count',
            'location_lat', 'location_lng', 'device_type', 'is_weekend', 'is_holiday',
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'amount_per_age', 'distance_from_center'
        ]
        
        return df[self.feature_columns]
    
    def train_models(self, df=None):
        """Train XGBoost and KMeans models"""
        if df is None:
            df = self.generate_synthetic_data()
        
        print("🔄 Training fraud detection models...")
        
        # Prepare features
        X = self.prepare_features(df)
        y = df['is_fraud']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost model
        print("📊 Training XGBoost model...")
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        )
        
        self.xgb_model.fit(X_train, y_train)
        
        # Train KMeans for anomaly detection
        print("🔍 Training KMeans anomaly detector...")
        # Use only non-fraud data for clustering
        non_fraud_data = X_train_scaled[y_train == 0]
        self.kmeans_model = KMeans(n_clusters=5, random_state=42, n_init=10)
        self.kmeans_model.fit(non_fraud_data)
        
        # Evaluate models
        self.evaluate_models(X_test, y_test, X_test_scaled)
        
        # Save models
        self.save_models()
        
        self.is_trained = True
        print("✅ Models trained and saved successfully!")
        
        return {
            'xgb_accuracy': self.xgb_model.score(X_test, y_test),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def evaluate_models(self, X_test, y_test, X_test_scaled):
        """Evaluate model performance"""
        # XGBoost evaluation
        y_pred_xgb = self.xgb_model.predict(X_test)
        y_prob_xgb = self.xgb_model.predict_proba(X_test)[:, 1]
        
        print("\n📈 XGBoost Performance:")
        print(classification_report(y_test, y_pred_xgb))
        
        # KMeans anomaly detection
        distances = self.kmeans_model.transform(X_test_scaled)
        min_distances = np.min(distances, axis=1)
        
        # Use 95th percentile as threshold for anomalies
        threshold = np.percentile(min_distances, 95)
        y_pred_kmeans = (min_distances > threshold).astype(int)
        
        print("\n🔍 KMeans Anomaly Detection Performance:")
        print(classification_report(y_test, y_pred_kmeans))
        
        # Combined model (ensemble)
        combined_score = (y_prob_xgb + (min_distances / np.max(min_distances))) / 2
        y_pred_combined = (combined_score > 0.5).astype(int)
        
        print("\n🎯 Combined Model Performance:")
        print(classification_report(y_test, y_pred_combined))
    
    def predict_fraud(self, transaction_data):
        """Predict fraud for a single transaction"""
        if not self.is_trained:
            self.load_models()
        
        # Convert to DataFrame
        if isinstance(transaction_data, dict):
            df = pd.DataFrame([transaction_data])
        else:
            df = pd.DataFrame(transaction_data)
        
        # Prepare features
        X = self.prepare_features(df)
        
        # XGBoost prediction
        xgb_prob = self.xgb_model.predict_proba(X)[:, 1]
        
        # KMeans anomaly detection
        X_scaled = self.scaler.transform(X)
        distances = self.kmeans_model.transform(X_scaled)
        min_distances = np.min(distances, axis=1)
        threshold = np.percentile(min_distances, 95)
        kmeans_anomaly = (min_distances > threshold).astype(int)
        
        # Combined score
        combined_score = (xgb_prob + (min_distances / np.max(min_distances))) / 2
        
        return {
            'is_fraud': int(combined_score[0] > 0.5),
            'fraud_score': float(combined_score[0]),
            'xgb_probability': float(xgb_prob[0]),
            'kmeans_anomaly': int(kmeans_anomaly[0]),
            'anomaly_distance': float(min_distances[0]),
            'confidence': float(abs(combined_score[0] - 0.5) * 2)
        }
    
    def save_models(self):
        """Save trained models"""
        model_files = {
            'xgb_model.pkl': self.xgb_model,
            'kmeans_model.pkl': self.kmeans_model,
            'scaler.pkl': self.scaler,
            'label_encoders.pkl': self.label_encoders,
            'feature_columns.json': self.feature_columns
        }
        
        for filename, model in model_files.items():
            filepath = os.path.join(self.model_path, filename)
            if filename.endswith('.json'):
                with open(filepath, 'w') as f:
                    json.dump(model, f)
            else:
                joblib.dump(model, filepath)
        
        print(f"💾 Models saved to {self.model_path}")
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            self.xgb_model = joblib.load(os.path.join(self.model_path, 'xgb_model.pkl'))
            self.kmeans_model = joblib.load(os.path.join(self.model_path, 'kmeans_model.pkl'))
            self.scaler = joblib.load(os.path.join(self.model_path, 'scaler.pkl'))
            self.label_encoders = joblib.load(os.path.join(self.model_path, 'label_encoders.pkl'))
            
            with open(os.path.join(self.model_path, 'feature_columns.json'), 'r') as f:
                self.feature_columns = json.load(f)
            
            self.is_trained = True
            print("✅ Models loaded successfully!")
            return True
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    
    def get_feature_importance(self):
        """Get feature importance from XGBoost model"""
        if not self.is_trained:
            self.load_models()
        
        importance = self.xgb_model.feature_importances_
        feature_importance = list(zip(self.feature_columns, importance))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        return feature_importance

# Example usage and training
if __name__ == "__main__":
    detector = FraudDetector()
    
    # Train models with synthetic data
    results = detector.train_models()
    print(f"Training completed: {results}")
    
    # Example prediction
    sample_transaction = {
        'amount': 1500,
        'hour': 3,
        'day_of_week': 1,
        'merchant_category': 'online_shopping',
        'transaction_type': 'online',
        'user_age': 35,
        'account_age_days': 365,
        'previous_fraud_count': 0,
        'location_lat': 40.7128,
        'location_lng': -74.0060,
        'device_type': 'mobile',
        'is_weekend': 0,
        'is_holiday': 0
    }
    
    prediction = detector.predict_fraud(sample_transaction)
    print(f"\n🔍 Sample prediction: {prediction}")
    
    # Feature importance
    importance = detector.get_feature_importance()
    print(f"\n📊 Top 5 most important features:")
    for feature, score in importance[:5]:
        print(f"  {feature}: {score:.4f}")
