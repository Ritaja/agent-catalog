#!/bin/bash

# Azure Development Environment Setup Script
# This script configures the development environment for Azure deployment

echo "🔧 Setting up Azure development environment..."

# Enable Azure CLI auto-completion for zsh
if command -v az &> /dev/null; then
    echo "✅ Azure CLI found - setting up auto-completion"
    
    # Add Azure CLI completion to zsh
    if [[ "$SHELL" == *"zsh"* ]]; then
        mkdir -p ~/.oh-my-zsh/custom/plugins/azure-cli
        az completion --shell zsh > ~/.oh-my-zsh/custom/plugins/azure-cli/_az
        
        # Add azure-cli to plugins in .zshrc if not already present
        if ! grep -q "azure-cli" ~/.zshrc; then
            sed -i 's/plugins=(/plugins=(azure-cli /' ~/.zshrc
        fi
    fi
    
    # Add helpful Azure aliases
    cat >> ~/.zshrc << 'EOF'

# Azure CLI Aliases for Agent Catalog
alias azlogin='az login'
alias azaccount='az account show'
alias azlist='az account list --output table'
alias azset='az account set --subscription'

# Agent Catalog specific aliases
alias deploy-dev='./azure/scripts/deploy.sh --environment dev'
alias deploy-prod='./azure/scripts/deploy.sh --environment prod'
alias monitor-azure='./azure/scripts/monitor.sh --interactive'
alias cleanup-azure='./azure/scripts/cleanup.sh'
alias test-azure='./azure/scripts/test-deployment.sh'

# Docker aliases for local development
alias dc='docker-compose'
alias dcup='docker-compose up --build'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'

# Quick navigation
alias cdazure='cd azure'
alias cdscripts='cd azure/scripts'
alias cdterraform='cd azure/terraform'

EOF
else
    echo "⚠️  Azure CLI not found - skipping Azure configuration"
fi

# Setup Terraform auto-completion
if command -v terraform &> /dev/null; then
    echo "✅ Terraform found - setting up auto-completion"
    terraform -install-autocomplete 2>/dev/null || true
else
    echo "⚠️  Terraform not found - skipping Terraform configuration"
fi

# Create helpful Azure development files
echo "📝 Creating Azure development helper files..."

# Create .azure-env template
cat > .azure-env.template << 'EOF'
# Azure Environment Configuration Template
# Copy this file to .azure-env and fill in your values

# Azure Subscription
export AZURE_SUBSCRIPTION_ID="your-subscription-id-here"
export AZURE_TENANT_ID="your-tenant-id-here"

# Deployment Configuration
export ENVIRONMENT="dev"
export LOCATION="eastus"
export PROJECT_NAME="agent-catalog"

# Resource Naming (optional)
export RESOURCE_GROUP_NAME="rg-agent-catalog-dev"
export CONTAINER_REGISTRY_NAME="acragentcatalogdev"

# Container Configuration
export MIN_REPLICAS=0
export MAX_REPLICAS=10
export CPU_CORES="0.25"
export MEMORY_SIZE="0.5Gi"

# Ollama Configuration
export OLLAMA_CPU_CORES="1.0"
export OLLAMA_MEMORY_SIZE="4Gi"

# Usage: source .azure-env
EOF

# Create quick start script
cat > azure-quickstart.sh << 'EOF'
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
EOF

chmod +x azure-quickstart.sh

echo ""
echo "✅ Azure development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'az login' to authenticate with Azure"
echo "   2. Copy .azure-env.template to .azure-env and configure"
echo "   3. Run './azure-quickstart.sh' for guided deployment"
echo "   4. Or run './azure/scripts/deploy.sh' directly"
echo ""
echo "💡 Helpful aliases added to your shell:"
echo "   - azlogin, azaccount, azlist"
echo "   - deploy-dev, deploy-prod"
echo "   - monitor-azure, cleanup-azure"
echo "   - dcup, dcdown, dclogs"
echo ""
echo "🔄 Restart your terminal or run 'source ~/.zshrc' to use aliases"
