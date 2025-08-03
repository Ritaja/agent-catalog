# Makefile for Agent Catalog Docker Setup

.PHONY: help build up down logs clean rebuild dev prod

# Default target
help:
	@echo "Agent Catalog Docker Commands:"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs from all services"
	@echo "  make clean     - Clean up containers and images"
	@echo "  make rebuild   - Clean build and start"
	@echo "  make dev       - Start in development mode"
	@echo "  make prod      - Start in production mode"
	@echo "  make test      - Run health checks"
	@echo ""
	@echo "Service-specific commands:"
	@echo "  make logs-backend      - View backend logs"
	@echo "  make logs-frontend     - View frontend logs"
	@echo "  make logs-agents       - View sample agents logs"
	@echo "  make shell-backend     - Access backend container shell"
	@echo "  make shell-frontend    - Access frontend container shell"
	@echo "  make shell-agents      - Access sample agents container shell"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Service-specific logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-agents:
	docker-compose logs -f sample-agents

# Shell access
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-agents:
	docker-compose exec sample-agents bash

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Rebuild everything
rebuild: clean
	docker-compose build --no-cache
	docker-compose up -d

# Development mode (with logs)
dev:
	docker-compose up --build

# Production mode
prod:
	docker-compose -f docker-compose.yml up -d --build

# Test health status
test:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "Testing endpoints..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000/agents"
	@echo "Task Agent: http://localhost:5051"
	@echo "Calendar Agent: http://localhost:5052"
	@echo "Finance Agent: http://localhost:5053"

# Environment setup
setup:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo "Please edit .env file with your Azure Cosmos DB credentials (optional)"; \
	else \
		echo ".env file already exists"; \
	fi

# Quick start
start: setup build up
	@echo "Agent Catalog is starting..."
	@echo "Frontend will be available at: http://localhost:3000"
	@echo "Backend API at: http://localhost:8000"
	@echo "Run 'make logs' to see startup logs"
	@echo "Run 'make test' to check service health"

# Status check
status:
	@echo "=== Docker Compose Services ==="
	@docker-compose ps
	@echo ""
	@echo "=== Service Health ==="
	@docker-compose exec backend curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:8000/agents || echo "Backend: Not responding"
	@docker-compose exec frontend curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:80 || echo "Frontend: Not responding"
	@echo "Sample Agents: $(shell docker-compose exec sample-agents pgrep -f 'agent.py' | wc -l) processes running"

# Development with hot reload
dev-watch:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Update images
update:
	docker-compose pull
	docker-compose build --pull

# Backup (if using volumes)
backup:
	@echo "Creating backup..."
	@docker run --rm -v agent-catalog_backend-data:/backup -v $(PWD):/host alpine tar czf /host/backup-$(shell date +%Y%m%d_%H%M%S).tar.gz -C /backup .
	@echo "Backup completed"

# Show resource usage
stats:
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
