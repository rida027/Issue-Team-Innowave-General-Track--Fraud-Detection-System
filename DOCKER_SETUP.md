# Docker Setup for AI Fraud Detection System

## 🐳 Docker Installation

If you prefer to use Docker instead of local installation, follow this guide.

## 📋 Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
2. **Docker Compose** - Usually included with Docker Desktop

## 🚀 Quick Start with Docker

### Step 1: Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data models

# Train ML models
RUN python3 ml/fraud_detector.py

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - JWT_SECRET=your-jwt-secret-here
      - CARDANO_NETWORK=preprod
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    restart: unless-stopped

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    depends_on:
      - backend
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Step 3: Create Frontend Dockerfile
```dockerfile
# client/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 4: Build and Run
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Docker Commands

### Basic Commands
```bash
# Build the image
docker build -t fraud-detection .

# Run the container
docker run -p 5000:5000 fraud-detection

# Run with environment variables
docker run -p 5000:5000 -e NODE_ENV=production fraud-detection

# Run interactively
docker run -it fraud-detection /bin/sh
```

### Development Commands
```bash
# Build without cache
docker-compose build --no-cache

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs backend

# Execute commands in running container
docker-compose exec backend /bin/sh
```

## 📊 Docker Volumes

### Persistent Data
```yaml
volumes:
  - ./data:/app/data          # Database and logs
  - ./models:/app/models      # ML models
  - ./logs:/app/logs          # Application logs
```

### Backup and Restore
```bash
# Backup data
docker run --rm -v fraud-detection_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restore data
docker run --rm -v fraud-detection_data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## 🚀 Production Deployment

### Production docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - JWT_SECRET=${JWT_SECRET}
      - CARDANO_NETWORK=mainnet
      - CARDANO_WALLET_MNEMONIC=${CARDANO_WALLET_MNEMONIC}
      - CARDANO_WALLET_ADDRESS=${CARDANO_WALLET_ADDRESS}
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Production Frontend Dockerfile
```dockerfile
# client/Dockerfile.prod
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security Considerations

### Docker Security
```bash
# Run as non-root user
USER node

# Use specific versions
FROM node:18.17.0-alpine

# Scan for vulnerabilities
docker scan fraud-detection

# Use secrets management
docker secret create jwt_secret jwt_secret.txt
```

### Environment Variables
```bash
# Create .env file
JWT_SECRET=your-super-secret-jwt-key
CARDANO_WALLET_MNEMONIC=your-wallet-mnemonic
CARDANO_WALLET_ADDRESS=your-wallet-address
```

## 📈 Monitoring and Logging

### Logging Configuration
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 🚀 Scaling with Docker Swarm

### Initialize Swarm
```bash
docker swarm init
```

### Deploy Stack
```bash
docker stack deploy -c docker-compose.yml fraud-detection
```

### Scale Services
```bash
docker service scale fraud-detection_backend=3
docker service scale fraud-detection_frontend=2
```

## 🔧 Troubleshooting

### Common Docker Issues

#### 1. Port conflicts
```bash
# Check what's using the port
netstat -tulpn | grep :5000

# Change port in docker-compose.yml
ports:
  - "5001:5000"
```

#### 2. Permission issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./data
sudo chown -R $USER:$USER ./models
```

#### 3. Build failures
```bash
# Clean build
docker-compose build --no-cache

# Check build logs
docker-compose build --progress=plain
```

#### 4. Container won't start
```bash
# Check container logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart services
docker-compose restart
```

## 📊 Performance Optimization

### Resource Limits
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Caching
```yaml
services:
  redis:
    image: redis:alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

---

**Docker makes deployment easy! 🐳**
