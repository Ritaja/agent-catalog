#!/bin/bash

# Agent Catalog Docker Setup Script
# This script helps set up and run the Agent Catalog project with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

print_header() {
    echo "=================================================="
    print_color $BLUE "$1"
    echo "=================================================="
}

print_success() {
    print_color $GREEN "✓ $1"
}

print_warning() {
    print_color $YELLOW "⚠ $1"
}

print_error() {
    print_color $RED "✗ $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker daemon is running"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_warning "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please edit .env file with your Azure Cosmos DB credentials (optional)"
        print_warning "If not configured, the backend will run in mock mode"
    else
        print_success ".env file already exists"
    fi
}

# Build and start services
start_services() {
    print_header "Building and Starting Services"
    
    # Build images
    print_color $BLUE "Building Docker images..."
    docker-compose build
    
    # Start services
    print_color $BLUE "Starting services..."
    docker-compose up -d
    
    # Wait a moment for services to start
    print_color $BLUE "Waiting for services to initialize..."
    sleep 10
}

# Check service health
check_health() {
    print_header "Checking Service Health"
    
    # Check Docker Compose status
    print_color $BLUE "Docker Compose Services:"
    docker-compose ps
    
    echo
    print_color $BLUE "Testing service endpoints..."
    
    # Test backend
    if curl -f -s http://localhost:8000/agents > /dev/null 2>&1; then
        print_success "Backend is healthy (http://localhost:8000)"
    else
        print_warning "Backend is not responding (http://localhost:8000)"
    fi
    
    # Test frontend
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is healthy (http://localhost:3000)"
    else
        print_warning "Frontend is not responding (http://localhost:3000)"
    fi
    
    # Check sample agents (ports only)
    for port in 5051 5052 5053; do
        if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null || \
           lsof -i :$port 2>/dev/null > /dev/null || \
           nc -z localhost $port 2>/dev/null; then
            print_success "Sample agent port $port is open"
        else
            print_warning "Sample agent port $port is not responding"
        fi
    done
}

# Show usage information
show_usage() {
    print_header "Agent Catalog is Ready!"
    
    echo
    print_color $GREEN "🌐 Access Points:"
    echo "  Frontend:      http://localhost:3000"
    echo "  Backend API:   http://localhost:8000"
    echo "  API Docs:      http://localhost:8000/docs"
    echo
    echo "  Sample Agents:"
    echo "    Task Agent:     http://localhost:5051"
    echo "    Calendar Agent: http://localhost:5052"
    echo "    Finance Agent:  http://localhost:5053"
    
    echo
    print_color $BLUE "🛠 Useful Commands:"
    echo "  View logs:           docker-compose logs -f"
    echo "  Stop services:       docker-compose down"
    echo "  Restart services:    docker-compose restart"
    echo "  Rebuild:             docker-compose build --no-cache"
    echo
    echo "  Service-specific logs:"
    echo "    Backend:           docker-compose logs -f backend"
    echo "    Frontend:          docker-compose logs -f frontend"
    echo "    Sample Agents:     docker-compose logs -f sample-agents"
    
    echo
    print_color $YELLOW "📝 Notes:"
    echo "  - Backend runs in mock mode if Azure Cosmos DB is not configured"
    echo "  - Edit .env file to configure Azure Cosmos DB credentials"
    echo "  - Use 'make' commands for easier management (if make is installed)"
    echo "  - For development with hot reloading, use: ./setup.sh --dev"
    
    if command -v make &> /dev/null; then
        echo "  - Run 'make help' to see available make commands"
    fi
}

# Main setup function
main() {
    print_header "Agent Catalog Docker Setup"
    
    # Parse command line arguments
    SKIP_BUILD=false
    DEV_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-build    Skip building images (use existing images)"
                echo "  --dev          Start in development mode"
                echo "  --help, -h     Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Run checks
    check_docker
    check_docker_daemon
    setup_env
    
    if [ "$SKIP_BUILD" = false ]; then
        if [ "$DEV_MODE" = true ]; then
            print_color $BLUE "Starting in development mode with hot reloading..."
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
        else
            start_services
        fi
    else
        print_color $BLUE "Skipping build, starting with existing images..."
        if [ "$DEV_MODE" = true ]; then
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        else
            docker-compose up -d
        fi
    fi
    
    check_health
    show_usage
    
    print_color $GREEN "Setup completed successfully!"
}

# Run main function with all arguments
main "$@"
