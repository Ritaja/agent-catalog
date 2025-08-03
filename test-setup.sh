#!/bin/bash

# Test script to verify Docker setup is working
# This script tests all services after they are started

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        printf "${GREEN}✓ $2${NC}\n"
    else
        printf "${RED}✗ $2${NC}\n"
    fi
}

echo "Testing Agent Catalog Docker Setup..."
echo "======================================"

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 15

# Test backend health
echo "Testing backend..."
if curl -f -s http://localhost:8000/agents > /dev/null; then
    print_status 0 "Backend is responding on port 8000"
    
    # Test API endpoints
    agents_response=$(curl -s http://localhost:8000/agents)
    if echo "$agents_response" | grep -q '\['; then
        print_status 0 "Backend returns valid JSON response"
    else
        print_status 1 "Backend response format issue"
    fi
else
    print_status 1 "Backend is not responding on port 8000"
fi

# Test frontend
echo "Testing frontend..."
if curl -f -s http://localhost:3000 > /dev/null; then
    print_status 0 "Frontend is responding on port 3000"
else
    print_status 1 "Frontend is not responding on port 3000"
fi

# Test sample agents ports
echo "Testing sample agents..."
for port in 5051 5052 5053; do
    if nc -z localhost $port 2>/dev/null; then
        print_status 0 "Port $port is open (sample agent)"
    else
        print_status 1 "Port $port is not accessible"
    fi
done

# Test container status
echo "Checking container status..."
running_containers=$(docker-compose ps --services --filter "status=running" | wc -l)
total_containers=$(docker-compose ps --services | wc -l)

if [ "$running_containers" -eq "$total_containers" ] && [ "$total_containers" -gt 0 ]; then
    print_status 0 "All containers are running ($running_containers/$total_containers)"
else
    print_status 1 "Some containers are not running ($running_containers/$total_containers)"
    echo "Container status:"
    docker-compose ps
fi

echo
echo "Test completed. If all tests pass, the setup is working correctly!"
echo "Access the application at: http://localhost:3000"
