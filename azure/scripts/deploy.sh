#!/bin/bash

# Azure Container Apps Deployment Script for Agent Catalog
# This script builds Docker images, pushes them to Azure Container Registry, and deploys using Terraform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AZURE_DIR="$PROJECT_ROOT/azure"
TERRAFORM_DIR="$AZURE_DIR/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration variables
PROJECT_NAME="${PROJECT_NAME:-agent-catalog}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
LOCATION="${LOCATION:-eastus}"
RESOURCE_GROUP_PREFIX="rg-${PROJECT_NAME}-${ENVIRONMENT}"

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        log_info "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        log_info "Visit: https://learn.hashicorp.com/tutorials/terraform/install-cli"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        log_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run 'az login' first."
        exit 1
    fi
    
    log_success "All prerequisites satisfied!"
}

# Function to build and push Docker images
build_and_push_images() {
    local registry_name=$1
    local registry_server="${registry_name}.azurecr.io"
    
    log_info "Building and pushing Docker images to $registry_server..."
    
    # Login to Azure Container Registry
    az acr login --name "$registry_name"
    
    cd "$PROJECT_ROOT"
    
    # Build and push backend image
    log_info "Building backend image..."
    docker build -f Dockerfile.backend -t "${registry_server}/${PROJECT_NAME}-backend:latest" .
    docker push "${registry_server}/${PROJECT_NAME}-backend:latest"
    log_success "Backend image pushed successfully!"
    
    # Build and push frontend image
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t "${registry_server}/${PROJECT_NAME}-frontend:latest" .
    docker push "${registry_server}/${PROJECT_NAME}-frontend:latest"
    log_success "Frontend image pushed successfully!"
    
    # Build and push sample agents image
    log_info "Building sample agents image..."
    docker build -f Dockerfile.sample-agents -t "${registry_server}/${PROJECT_NAME}-sample-agents:latest" .
    docker push "${registry_server}/${PROJECT_NAME}-sample-agents:latest"
    log_success "Sample agents image pushed successfully!"
    
    # Build and push Ollama image
    log_info "Building Ollama image..."
    docker build -f Dockerfile.ollama -t "${registry_server}/${PROJECT_NAME}-ollama:latest" .
    docker push "${registry_server}/${PROJECT_NAME}-ollama:latest"
    log_success "Ollama image pushed successfully!"
    
    log_success "All images built and pushed successfully!"
}

# Function to initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    terraform init
    log_success "Terraform initialized successfully!"
}

# Function to plan Terraform deployment
plan_terraform() {
    log_info "Planning Terraform deployment..."
    cd "$TERRAFORM_DIR"
    
    # Create terraform.tfvars if it doesn't exist
    if [[ ! -f "terraform.tfvars" ]]; then
        log_info "Creating terraform.tfvars file..."
        cat > terraform.tfvars << EOF
project_name = "$PROJECT_NAME"
environment  = "$ENVIRONMENT"
location     = "$LOCATION"

# Container images (will be updated after registry creation)
frontend_image      = "nginx:latest"
backend_image       = "python:3.12-slim"
sample_agents_image = "python:3.12-slim"
ollama_image        = "ollama/ollama:latest"

tags = {
  Environment = "$ENVIRONMENT"
  Project     = "$PROJECT_NAME"
  ManagedBy   = "terraform"
  DeployedBy  = "$(whoami)"
  DeployedAt  = "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
        log_success "terraform.tfvars created!"
    fi
    
    terraform plan -out=tfplan
    log_success "Terraform plan completed successfully!"
}

# Function to apply Terraform deployment
apply_terraform() {
    log_info "Applying Terraform deployment..."
    cd "$TERRAFORM_DIR"
    terraform apply tfplan
    log_success "Terraform deployment completed successfully!"
}

# Function to update Terraform variables with registry images
update_terraform_vars() {
    local registry_name=$1
    local registry_server="${registry_name}.azurecr.io"
    
    log_info "Updating Terraform variables with container images..."
    cd "$TERRAFORM_DIR"
    
    # Update terraform.tfvars with actual image URLs
    cat > terraform.tfvars << EOF
project_name = "$PROJECT_NAME"
environment  = "$ENVIRONMENT"
location     = "$LOCATION"

# Container images
frontend_image      = "${registry_server}/${PROJECT_NAME}-frontend:latest"
backend_image       = "${registry_server}/${PROJECT_NAME}-backend:latest"
sample_agents_image = "${registry_server}/${PROJECT_NAME}-sample-agents:latest"
ollama_image        = "${registry_server}/${PROJECT_NAME}-ollama:latest"

tags = {
  Environment = "$ENVIRONMENT"
  Project     = "$PROJECT_NAME"
  ManagedBy   = "terraform"
  DeployedBy  = "$(whoami)"
  DeployedAt  = "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    log_success "Terraform variables updated!"
}

# Function to display deployment information
show_deployment_info() {
    log_info "Retrieving deployment information..."
    cd "$TERRAFORM_DIR"
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    
    # Get outputs
    FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "Not available")
    BACKEND_URL=$(terraform output -raw backend_url 2>/dev/null || echo "Not available")
    BACKEND_DOCS_URL=$(terraform output -raw backend_docs_url 2>/dev/null || echo "Not available")
    RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "Not available")
    
    echo "📊 Deployment Information:"
    echo "========================="
    echo "🌐 Frontend URL:     $FRONTEND_URL"
    echo "🔧 Backend API URL:  $BACKEND_URL"
    echo "📚 API Docs URL:     $BACKEND_DOCS_URL"
    echo "📦 Resource Group:   $RESOURCE_GROUP"
    echo ""
    
    log_info "You can monitor your deployment in the Azure Portal:"
    log_info "https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP"
    echo ""
    
    log_warning "Note: It may take a few minutes for all services to be fully available."
    log_info "You can check the status using: az containerapp list --resource-group $RESOURCE_GROUP"
}

# Function to run the full deployment
run_deployment() {
    log_info "🚀 Starting Azure Container Apps deployment for $PROJECT_NAME..."
    echo ""
    
    # Step 1: Check prerequisites
    check_prerequisites
    echo ""
    
    # Step 2: Initialize Terraform (this creates the registry)
    init_terraform
    echo ""
    
    # Step 3: Plan initial deployment
    plan_terraform
    echo ""
    
    # Step 4: Apply initial deployment (creates registry and other resources)
    apply_terraform
    echo ""
    
    # Step 5: Get registry name
    cd "$TERRAFORM_DIR"
    REGISTRY_NAME=$(terraform output -raw container_registry_name)
    log_info "Using container registry: $REGISTRY_NAME"
    echo ""
    
    # Step 6: Build and push images
    build_and_push_images "$REGISTRY_NAME"
    echo ""
    
    # Step 7: Update Terraform variables with image URLs
    update_terraform_vars "$REGISTRY_NAME"
    echo ""
    
    # Step 8: Plan and apply updated deployment
    log_info "Planning updated deployment with container images..."
    terraform plan -out=tfplan-update
    log_info "Applying updated deployment..."
    terraform apply tfplan-update
    echo ""
    
    # Step 9: Show deployment information
    show_deployment_info
}

# Function to show help
show_help() {
    echo "Azure Container Apps Deployment Script for Agent Catalog"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Run full deployment (default)"
    echo "  plan            Plan Terraform deployment only"
    echo "  apply           Apply existing Terraform plan"
    echo "  destroy         Destroy all resources"
    echo "  status          Show deployment status"
    echo "  help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_NAME    Project name (default: agent-catalog)"
    echo "  ENVIRONMENT     Environment (default: dev)"
    echo "  LOCATION        Azure region (default: eastus)"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  PROJECT_NAME=my-agents ENVIRONMENT=prod $0 deploy"
    echo "  $0 destroy"
}

# Function to destroy resources
destroy_resources() {
    log_warning "⚠️  This will destroy ALL resources created by Terraform!"
    log_warning "This action cannot be undone."
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    echo ""
    
    if [[ $REPLY == "yes" ]]; then
        log_info "Destroying resources..."
        cd "$TERRAFORM_DIR"
        terraform destroy -auto-approve
        log_success "Resources destroyed successfully!"
    else
        log_info "Destruction cancelled."
    fi
}

# Function to show deployment status
show_status() {
    cd "$TERRAFORM_DIR"
    
    if [[ ! -f "terraform.tfstate" ]]; then
        log_warning "No Terraform state found. Run deployment first."
        exit 1
    fi
    
    log_info "Current deployment status:"
    echo ""
    
    # Get resource group
    RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "Not available")
    
    if [[ "$RESOURCE_GROUP" != "Not available" ]]; then
        log_info "Container Apps status:"
        az containerapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Status:properties.provisioningState,FQDN:properties.configuration.ingress.fqdn}" -o table
        echo ""
        
        log_info "Cosmos DB status:"
        az cosmosdb list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Status:documentEndpoint}" -o table
        echo ""
        
        show_deployment_info
    else
        log_error "Unable to retrieve resource group information."
    fi
}

# Main script logic
main() {
    case "${1:-deploy}" in
        "deploy")
            run_deployment
            ;;
        "plan")
            check_prerequisites
            init_terraform
            plan_terraform
            ;;
        "apply")
            check_prerequisites
            cd "$TERRAFORM_DIR"
            if [[ -f "tfplan" ]]; then
                apply_terraform
                show_deployment_info
            else
                log_error "No terraform plan found. Run 'plan' first."
                exit 1
            fi
            ;;
        "destroy")
            check_prerequisites
            destroy_resources
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
