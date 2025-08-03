#!/bin/bash

# Azure Infrastructure Cleanup Script for Agent Catalog
# This script safely destroys all resources created by Terraform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/azure/terraform"

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

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Check if Terraform state exists
    if [[ ! -f "$TERRAFORM_DIR/terraform.tfstate" ]]; then
        log_warning "No Terraform state found at $TERRAFORM_DIR/terraform.tfstate"
        log_warning "This might mean no resources were deployed, or state was moved."
        
        read -p "Do you want to continue and check for resources manually? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled."
            exit 0
        fi
    fi
    
    log_success "Prerequisites checked!"
}

# Function to show current resources
show_current_resources() {
    log_info "Showing current resources..."
    
    cd "$TERRAFORM_DIR"
    
    # Try to get resource group from Terraform state
    if [[ -f "terraform.tfstate" ]]; then
        RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "")
        
        if [[ -n "$RESOURCE_GROUP" ]]; then
            log_info "Resources in resource group: $RESOURCE_GROUP"
            echo ""
            
            # Show Container Apps
            echo "📱 Container Apps:"
            az containerapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Status:properties.provisioningState,Location:location}" -o table 2>/dev/null || echo "  None found or inaccessible"
            echo ""
            
            # Show Cosmos DB
            echo "🗄️  Cosmos DB Accounts:"
            az cosmosdb list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Location:location,Status:documentEndpoint}" -o table 2>/dev/null || echo "  None found or inaccessible"
            echo ""
            
            # Show Container Registries
            echo "📦 Container Registries:"
            az acr list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Location:location,Sku:sku.name}" -o table 2>/dev/null || echo "  None found or inaccessible"
            echo ""
            
            # Show Storage Accounts
            echo "💾 Storage Accounts:"
            az storage account list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Location:location,Sku:sku.name}" -o table 2>/dev/null || echo "  None found or inaccessible"
            echo ""
            
            # Show all resources
            echo "📋 All Resources:"
            az resource list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Type:type,Location:location}" -o table 2>/dev/null || echo "  None found or inaccessible"
            
        else
            log_warning "Could not determine resource group from Terraform state."
        fi
    else
        log_warning "No Terraform state file found."
        
        # Try to find resource groups that match our naming pattern
        log_info "Searching for resource groups matching pattern: rg-$PROJECT_NAME-$ENVIRONMENT-*"
        MATCHING_RGS=$(az group list --query "[?starts_with(name, 'rg-$PROJECT_NAME-$ENVIRONMENT-')].name" -o tsv 2>/dev/null || echo "")
        
        if [[ -n "$MATCHING_RGS" ]]; then
            echo "Found potential resource groups:"
            echo "$MATCHING_RGS"
        else
            log_info "No matching resource groups found."
        fi
    fi
}

# Function to backup Terraform state
backup_terraform_state() {
    log_info "Creating backup of Terraform state..."
    
    cd "$TERRAFORM_DIR"
    
    if [[ -f "terraform.tfstate" ]]; then
        BACKUP_FILE="terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)"
        cp terraform.tfstate "$BACKUP_FILE"
        log_success "Terraform state backed up to: $BACKUP_FILE"
    else
        log_warning "No Terraform state file to backup."
    fi
}

# Function to destroy via Terraform
destroy_via_terraform() {
    log_info "Destroying resources via Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    if [[ -f "terraform.tfstate" ]]; then
        # Show what will be destroyed
        log_info "Planning destruction..."
        terraform plan -destroy -out=destroy.tfplan
        
        echo ""
        log_warning "⚠️  The following resources will be DESTROYED:"
        terraform show destroy.tfplan
        echo ""
        
        # Confirm destruction
        log_warning "⚠️  This action cannot be undone!"
        read -p "Are you sure you want to destroy these resources? (type 'yes' to confirm): " -r
        echo ""
        
        if [[ $REPLY == "yes" ]]; then
            log_info "Destroying resources..."
            terraform apply destroy.tfplan
            
            # Clean up plan file
            rm -f destroy.tfplan
            
            log_success "Resources destroyed via Terraform!"
        else
            log_info "Destruction cancelled."
            rm -f destroy.tfplan
            exit 0
        fi
    else
        log_error "No Terraform state file found. Cannot destroy via Terraform."
        return 1
    fi
}

# Function to manual cleanup (fallback)
manual_cleanup() {
    log_warning "Attempting manual cleanup..."
    
    # Search for resource groups matching our pattern
    MATCHING_RGS=$(az group list --query "[?starts_with(name, 'rg-$PROJECT_NAME-$ENVIRONMENT-')].name" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$MATCHING_RGS" ]]; then
        echo "Found resource groups matching pattern:"
        echo "$MATCHING_RGS"
        echo ""
        
        for RG in $MATCHING_RGS; do
            log_warning "⚠️  Found resource group: $RG"
            echo "Resources in this group:"
            az resource list --resource-group "$RG" --query "[].{Name:name,Type:type}" -o table 2>/dev/null || echo "  Could not list resources"
            echo ""
            
            read -p "Do you want to delete resource group '$RG' and all its resources? (y/N): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deleting resource group: $RG"
                az group delete --name "$RG" --yes --no-wait
                log_success "Resource group '$RG' deletion initiated."
                log_info "Note: Deletion may take several minutes to complete."
            else
                log_info "Skipping resource group: $RG"
            fi
            echo ""
        done
    else
        log_info "No resource groups found matching pattern: rg-$PROJECT_NAME-$ENVIRONMENT-*"
    fi
}

# Function to clean Terraform state
clean_terraform_state() {
    log_info "Cleaning Terraform state and temporary files..."
    
    cd "$TERRAFORM_DIR"
    
    # Remove plan files
    rm -f tfplan tfplan-update destroy.tfplan
    
    # Optionally remove state files (ask user)
    if [[ -f "terraform.tfstate" ]]; then
        read -p "Do you want to remove Terraform state files? This will make future deployments start fresh. (y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f terraform.tfstate terraform.tfstate.backup
            rm -rf .terraform/
            log_success "Terraform state cleaned."
        else
            log_info "Terraform state preserved."
        fi
    fi
    
    log_success "Cleanup completed!"
}

# Function to verify cleanup
verify_cleanup() {
    log_info "Verifying cleanup..."
    
    # Check for remaining resource groups
    MATCHING_RGS=$(az group list --query "[?starts_with(name, 'rg-$PROJECT_NAME-$ENVIRONMENT-')].name" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$MATCHING_RGS" ]]; then
        log_warning "⚠️  Some resource groups are still present:"
        echo "$MATCHING_RGS"
        log_info "This might be normal if deletion is still in progress."
        log_info "You can check the status in the Azure Portal or run:"
        log_info "az group list --query \"[?starts_with(name, 'rg-$PROJECT_NAME-$ENVIRONMENT-')]\""
    else
        log_success "✅ No matching resource groups found. Cleanup appears complete!"
    fi
}

# Function to show help
show_help() {
    echo "Azure Infrastructure Cleanup Script for Agent Catalog"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  cleanup         Run full cleanup (default)"
    echo "  show            Show current resources only"
    echo "  terraform       Destroy via Terraform only"
    echo "  manual          Manual cleanup only"
    echo "  verify          Verify cleanup completion"
    echo "  help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_NAME    Project name (default: agent-catalog)"
    echo "  ENVIRONMENT     Environment (default: dev)"
    echo ""
    echo "Examples:"
    echo "  $0 cleanup"
    echo "  PROJECT_NAME=my-agents ENVIRONMENT=prod $0 cleanup"
    echo "  $0 show"
}

# Function to run full cleanup
run_full_cleanup() {
    log_info "🧹 Starting infrastructure cleanup for $PROJECT_NAME ($ENVIRONMENT)..."
    echo ""
    
    # Step 1: Check prerequisites
    check_prerequisites
    echo ""
    
    # Step 2: Show current resources
    show_current_resources
    echo ""
    
    # Step 3: Backup Terraform state
    backup_terraform_state
    echo ""
    
    # Step 4: Try Terraform destroy first
    if destroy_via_terraform; then
        log_success "Terraform destruction completed!"
    else
        log_warning "Terraform destruction failed or was not possible. Trying manual cleanup..."
        echo ""
        manual_cleanup
    fi
    echo ""
    
    # Step 5: Clean up Terraform files
    clean_terraform_state
    echo ""
    
    # Step 6: Verify cleanup
    verify_cleanup
    echo ""
    
    log_success "🎉 Cleanup process completed!"
    log_info "If you see any remaining resources, they may still be deleting."
    log_info "Check the Azure Portal for the final status."
}

# Main script logic
main() {
    case "${1:-cleanup}" in
        "cleanup")
            run_full_cleanup
            ;;
        "show")
            check_prerequisites
            show_current_resources
            ;;
        "terraform")
            check_prerequisites
            backup_terraform_state
            destroy_via_terraform
            verify_cleanup
            ;;
        "manual")
            check_prerequisites
            show_current_resources
            manual_cleanup
            verify_cleanup
            ;;
        "verify")
            verify_cleanup
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
