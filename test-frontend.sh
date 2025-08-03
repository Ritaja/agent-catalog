#!/bin/bash

# Quick test to verify frontend port forwarding is working

echo "Testing Frontend Port Forwarding Fix..."
echo "======================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        printf "${GREEN}✓ $2${NC}\n"
    else
        printf "${RED}✗ $2${NC}\n"
    fi
}

# Test if containers are running
echo "Checking if containers are running..."
if docker-compose ps | grep -q "Up"; then
    print_status 0 "Docker containers are running"
else
    print_status 1 "Docker containers are not running. Please run 'docker-compose up' first"
    exit 1
fi

# Wait a moment for services to be ready
echo "Waiting for services to initialize..."
sleep 5

# Test frontend accessibility
echo "Testing frontend accessibility..."
if curl -f -s -o /dev/null http://localhost:3000; then
    print_status 0 "Frontend is accessible on http://localhost:3000"
    
    # Test if it returns HTML content
    if curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
        print_status 0 "Frontend returns valid HTML content"
    else
        print_status 1 "Frontend doesn't return valid HTML content"
    fi
else
    print_status 1 "Frontend is NOT accessible on http://localhost:3000"
fi

# Test backend through frontend proxy (if in development mode)
echo "Testing backend connectivity..."
if curl -f -s -o /dev/null http://localhost:8000/agents; then
    print_status 0 "Backend is directly accessible on http://localhost:8000"
else
    print_status 1 "Backend is NOT directly accessible on http://localhost:8000"
fi

echo
echo "Test completed. If frontend is not accessible, try:"
echo "1. docker-compose down && docker-compose up --build"
echo "2. Check logs: docker-compose logs frontend"
echo "3. For development mode: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build"
