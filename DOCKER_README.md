# Docker Setup for Agent Catalog

This document explains how to run the entire Agent Catalog project using Docker and Docker Compose.

## Quick Start

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd agent-catalog
   ```

2. **Configure environment variables** (optional):

   ```bash
   cp .env.example .env
   # Edit .env with your Azure Cosmos DB credentials (optional - will run in mock mode if not provided)
   ```

3. **Build and start all services**:

   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Sample Agents:
     - Task Agent: http://localhost:5051
     - Calendar Agent: http://localhost:5052
     - Finance Agent: http://localhost:5053

## Services Overview

The Docker setup includes three main services:

### Frontend Service

- **Container**: `agent-catalog-frontend`
- **Port**: 3000 (mapped to container port 80)
- **Technology**: React + Vite + TypeScript + Tailwind CSS
- **Web Server**: Nginx
- **Build**: Multi-stage build with Node.js builder and Nginx runtime

### Backend Service

- **Container**: `agent-catalog-backend`
- **Port**: 8000
- **Technology**: FastAPI + Python 3.12
- **Database**: Azure Cosmos DB (with mock mode fallback)
- **Features**: CORS enabled, auto-reload in development

### Sample Agents Service

- **Container**: `agent-catalog-sample-agents`
- **Ports**: 5051, 5052, 5053
- **Technology**: Python 3.12 + LangChain
- **Agents**: Task Agent, Calendar Agent, Finance Agent

## Docker Commands

### Development Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in detached mode (background)
docker-compose up -d

# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs sample-agents

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose up --no-deps backend
```

### Individual Container Commands

```bash
# Build individual containers
docker build -f Dockerfile.backend -t agent-catalog-backend .
docker build -f Dockerfile.frontend -t agent-catalog-frontend .
docker build -f Dockerfile.sample-agents -t agent-catalog-sample-agents .

# Run individual containers
docker run -p 8000:8000 agent-catalog-backend
docker run -p 3000:80 agent-catalog-frontend
docker run -p 5051:5051 -p 5052:5052 -p 5053:5053 agent-catalog-sample-agents
```

## Configuration

### Environment Variables

Create a `.env` file from `.env.example` and configure:

```env
# Azure Cosmos DB Configuration (optional)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key-here
COSMOS_DATABASE_NAME=agent-catalog
COSMOS_AGENTS_CONTAINER=agents
COSMOS_CONFIG_CONTAINER=configuration
```

**Note**: If Azure Cosmos DB credentials are not provided, the backend will run in mock mode with in-memory storage.

### Port Configuration

Default ports can be changed in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3000:80" # Change 3000 to your preferred port
  backend:
    ports:
      - "8000:8000" # Change first 8000 to your preferred port
  sample-agents:
    ports:
      - "5051:5051" # Task Agent
      - "5052:5052" # Calendar Agent
      - "5053:5053" # Finance Agent
```

## Health Checks

All services include health checks:

- **Frontend**: HTTP check on port 80
- **Backend**: HTTP check on `/agents` endpoint
- **Sample Agents**: HTTP checks on all three agent ports

View health status:

```bash
docker-compose ps
```

## Development Workflow

### Hot Reloading

For development with hot reloading:

1. **Backend**: Mount source code as volume:

   ```yaml
   volumes:
     - ./backend:/app:ro
   ```

2. **Frontend**: Use development mode:
   ```bash
   # Alternative: Run frontend in development mode outside Docker
   cd frontend
   npm run dev
   ```

### Debugging

Access container shells for debugging:

```bash
# Backend container
docker-compose exec backend bash

# Frontend container
docker-compose exec frontend sh

# Sample agents container
docker-compose exec sample-agents bash
```

## Production Deployment

### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    restart: always

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - COSMOS_ENDPOINT=${COSMOS_ENDPOINT}
      - COSMOS_KEY=${COSMOS_KEY}
    restart: always

  sample-agents:
    build:
      context: .
      dockerfile: Dockerfile.sample-agents
    restart: always
```

Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling

Scale specific services:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale sample agents to 2 instances
docker-compose up -d --scale sample-agents=2
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:

   ```bash
   # Check what's using the port
   lsof -i :3000
   # Or change ports in docker-compose.yml
   ```

2. **Build failures**:

   ```bash
   # Clean build
   docker-compose build --no-cache

   # Remove all containers and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

3. **Permission issues**:

   ```bash
   # Fix file permissions (Linux/Mac)
   sudo chown -R $USER:$USER .
   ```

4. **Memory issues**:
   ```bash
   # Increase Docker memory limit in Docker Desktop
   # Or add memory limits to docker-compose.yml
   ```

### Logs and Monitoring

Monitor all services:

```bash
# Live logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Database Issues

If using Azure Cosmos DB:

1. **Check connection**:

   ```bash
   docker-compose exec backend python -c "from database import db_manager; print('Connected:', db_manager.is_connected())"
   ```

2. **Mock mode**: If Cosmos DB is unavailable, the backend automatically falls back to mock mode.

## Security Considerations

### Production Security

1. **Environment Variables**:

   - Never commit `.env` files
   - Use Docker secrets for sensitive data
   - Rotate credentials regularly

2. **Network Security**:

   - Use reverse proxy (nginx/Apache) in production
   - Enable HTTPS with SSL certificates
   - Configure firewall rules

3. **Container Security**:
   - Use specific version tags instead of `latest`
   - Run containers as non-root users
   - Regularly update base images

### Example with SSL

```yaml
version: "3.8"
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/ssl/certs
```

## Maintenance

### Regular Maintenance

```bash
# Update images
docker-compose pull

# Clean up unused resources
docker system prune -f

# Backup volumes (if using)
docker run --rm -v agent-catalog_backend-data:/backup alpine tar czf - /backup > backup.tar.gz
```

### Monitoring

Consider adding monitoring services:

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```
