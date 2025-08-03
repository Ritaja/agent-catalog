#!/bin/bash

# Azure Quick Start Script for Agent Catalog
# This script helps you get started with Azure deployment

echo "🚀 Agent Catalog - Azure Quick Start"
echo "===================================="
echo ""

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "🔐 You need to login to Azure first:"
    echo "   az login"
    echo ""
    read -p "Do you want to login now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        az login
    else
        echo "Please run 'az login' and try again."
        exit 1
    fi
fi

echo "✅ Azure CLI is ready!"
echo ""

# Show current subscription
echo "📋 Current Azure subscription:"
az account show --query "{Name:name, Id:id}" --output table
echo ""

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first."
    exit 1
fi

echo "✅ Terraform is ready!"
echo ""

# Show available commands
echo "🛠️  Available commands:"
echo "   deploy-dev          - Deploy to development environment"
echo "   deploy-prod         - Deploy to production environment"
echo "   monitor-azure       - Monitor Azure deployment"
echo "   cleanup-azure       - Clean up Azure resources"
echo "   test-azure          - Test Azure deployment"
echo ""

echo "🚀 Quick deployment options:"
echo "   1. Deploy to dev:  ./azure/scripts/deploy.sh"
echo "   2. Deploy to prod: ./azure/scripts/deploy.sh --environment prod"
echo "   3. Monitor:        ./azure/scripts/monitor.sh --interactive"
echo ""

read -p "Would you like to start a development deployment now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting development deployment..."
    ./azure/scripts/deploy.sh
else
    echo "ℹ️  Run './azure/scripts/deploy.sh' when you're ready to deploy!"
fi
