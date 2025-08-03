#!/bin/bash

# Azure Container Apps Status and Monitoring Script for Agent Catalog
# This script provides monitoring and status information for deployed resources

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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🔷 $1${NC}"; }

# Configuration variables
PROJECT_NAME="${PROJECT_NAME:-agent-catalog}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

# Function to check prerequisites
check_prerequisites() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed."
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run 'az login' first."
        exit 1
    fi
}

# Function to get resource group
get_resource_group() {
    cd "$TERRAFORM_DIR"
    
    if [[ -f "terraform.tfstate" ]]; then
        terraform output -raw resource_group_name 2>/dev/null || echo ""
    else
        # Try to find resource groups that match our pattern
        az group list --query "[?starts_with(name, 'rg-$PROJECT_NAME-$ENVIRONMENT-')].name" -o tsv 2>/dev/null | head -1 || echo ""
    fi
}

# Function to show deployment overview
show_deployment_overview() {
    log_header "Deployment Overview"
    
    RESOURCE_GROUP=$(get_resource_group)
    
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_warning "No resource group found for project '$PROJECT_NAME' environment '$ENVIRONMENT'"
        return 1
    fi
    
    log_info "Resource Group: $RESOURCE_GROUP"
    
    # Get basic info
    RG_INFO=$(az group show --name "$RESOURCE_GROUP" --query "{location:location,status:properties.provisioningState}" -o json 2>/dev/null || echo "{}")
    LOCATION=$(echo "$RG_INFO" | jq -r '.location // "Unknown"')
    STATUS=$(echo "$RG_INFO" | jq -r '.status // "Unknown"')
    
    echo "  Location: $LOCATION"
    echo "  Status: $STATUS"
    echo ""
    
    # Show URLs if available
    cd "$TERRAFORM_DIR"
    if [[ -f "terraform.tfstate" ]]; then
        FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "Not available")
        BACKEND_URL=$(terraform output -raw backend_url 2>/dev/null || echo "Not available")
        BACKEND_DOCS_URL=$(terraform output -raw backend_docs_url 2>/dev/null || echo "Not available")
        
        echo "🌐 Application URLs:"
        echo "  Frontend:    $FRONTEND_URL"
        echo "  Backend API: $BACKEND_URL"
        echo "  API Docs:    $BACKEND_DOCS_URL"
        echo ""
    fi
}

# Function to show container apps status
show_container_apps_status() {
    log_header "Container Apps Status"
    
    RESOURCE_GROUP=$(get_resource_group)
    
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_warning "No resource group found."
        return 1
    fi
    
    # Get container apps
    APPS=$(az containerapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Status:properties.provisioningState,Replicas:properties.template.scale.minReplicas,FQDN:properties.configuration.ingress.fqdn,CPU:properties.template.containers[0].resources.cpu,Memory:properties.template.containers[0].resources.memory}" -o json 2>/dev/null || echo "[]")
    
    if [[ $(echo "$APPS" | jq length) -eq 0 ]]; then
        log_warning "No container apps found in resource group."
        return 1
    fi
    
    echo "$APPS" | jq -r '.[] | "📱 \(.Name): \(.Status) (CPU: \(.CPU), Memory: \(.Memory))"'
    echo ""
    
    # Show detailed status for each app
    for APP_NAME in $(echo "$APPS" | jq -r '.[].Name'); do
        echo "🔍 Details for $APP_NAME:"
        
        # Get revision status
        REVISIONS=$(az containerapp revision list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "[].{Name:name,Active:properties.active,Replicas:properties.replicas,CreatedTime:properties.createdTime}" -o table 2>/dev/null || echo "No revisions found")
        echo "$REVISIONS" | head -5  # Show only latest 5 revisions
        echo ""
        
        # Check health status
        log_info "Checking health for $APP_NAME..."
        APP_FQDN=$(echo "$APPS" | jq -r ".[] | select(.Name == \"$APP_NAME\") | .FQDN")
        if [[ "$APP_FQDN" != "null" && -n "$APP_FQDN" ]]; then
            if curl -s --max-time 10 "https://$APP_FQDN" > /dev/null 2>&1; then
                log_success "$APP_NAME is responding"
            else
                log_warning "$APP_NAME is not responding or has issues"
            fi
        else
            log_info "$APP_NAME does not have external ingress"
        fi
        echo ""
    done
}

# Function to show logs
show_logs() {
    local app_name=$1
    local lines=${2:-50}
    
    RESOURCE_GROUP=$(get_resource_group)
    
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_warning "No resource group found."
        return 1
    fi
    
    if [[ -z "$app_name" ]]; then
        # Show available apps
        log_info "Available container apps:"
        az containerapp list --resource-group "$RESOURCE_GROUP" --query "[].name" -o table 2>/dev/null || echo "No apps found"
        return 1
    fi
    
    log_header "Logs for $app_name (last $lines lines)"
    
    # Get logs
    az containerapp logs show --name "$app_name" --resource-group "$RESOURCE_GROUP" --tail "$lines" 2>/dev/null || {
        log_warning "Could not retrieve logs for $app_name"
        log_info "This might be due to:"
        log_info "  - App is still starting up"
        log_info "  - No logs available yet"
        log_info "  - Insufficient permissions"
    }
}

# Function to show metrics
show_metrics() {
    log_header "Resource Metrics"
    
    RESOURCE_GROUP=$(get_resource_group)
    
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_warning "No resource group found."
        return 1
    fi
    
    # Show resource usage
    log_info "Resource usage summary:"
    
    # Container Apps
    APPS_COUNT=$(az containerapp list --resource-group "$RESOURCE_GROUP" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    echo "  📱 Container Apps: $APPS_COUNT"
    
    # Cosmos DB
    COSMOS_COUNT=$(az cosmosdb list --resource-group "$RESOURCE_GROUP" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    echo "  🗄️  Cosmos DB Accounts: $COSMOS_COUNT"
    
    # Storage Accounts
    STORAGE_COUNT=$(az storage account list --resource-group "$RESOURCE_GROUP" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    echo "  💾 Storage Accounts: $STORAGE_COUNT"
    
    # Container Registries
    REGISTRY_COUNT=$(az acr list --resource-group "$RESOURCE_GROUP" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    echo "  📦 Container Registries: $REGISTRY_COUNT"
    
    echo ""
    
    # Show costs (if available)
    log_info "Attempting to retrieve cost information..."
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    
    # Note: Azure Cost Management requires special permissions
    az consumption usage list --start-date "$(date -d '7 days ago' +%Y-%m-%d)" --end-date "$(date +%Y-%m-%d)" --query "[?contains(instanceName, '$RESOURCE_GROUP')].{Resource:instanceName,Cost:pretaxCost,Currency:currency}" -o table 2>/dev/null || {
        log_warning "Could not retrieve cost information."
        log_info "You can view costs in the Azure Portal: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/CostAnalysisViewBlade"
    }
}

# Function to test endpoints
test_endpoints() {
    log_header "Endpoint Testing"
    
    cd "$TERRAFORM_DIR"
    if [[ ! -f "terraform.tfstate" ]]; then
        log_warning "No Terraform state found. Cannot retrieve endpoint URLs."
        return 1
    fi
    
    FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "")
    BACKEND_URL=$(terraform output -raw backend_url 2>/dev/null || echo "")
    
    if [[ -n "$FRONTEND_URL" ]]; then
        log_info "Testing frontend endpoint: $FRONTEND_URL"
        if curl -s --max-time 15 "$FRONTEND_URL" > /dev/null; then
            log_success "Frontend is accessible"
        else
            log_error "Frontend is not accessible"
        fi
        echo ""
    fi
    
    if [[ -n "$BACKEND_URL" ]]; then
        log_info "Testing backend endpoint: $BACKEND_URL/agents"
        if curl -s --max-time 15 "$BACKEND_URL/agents" > /dev/null; then
            log_success "Backend API is accessible"
            
            # Test specific endpoints
            log_info "Testing API endpoints..."
            
            # Test agents endpoint
            AGENTS_RESPONSE=$(curl -s --max-time 10 "$BACKEND_URL/agents" 2>/dev/null || echo "[]")
            AGENTS_COUNT=$(echo "$AGENTS_RESPONSE" | jq length 2>/dev/null || echo "unknown")
            echo "  📊 Agents endpoint: $AGENTS_COUNT agents found"
            
            # Test docs endpoint
            if curl -s --max-time 10 "$BACKEND_URL/docs" > /dev/null; then
                echo "  📚 API docs: Available at $BACKEND_URL/docs"
            else
                echo "  📚 API docs: Not accessible"
            fi
            
        else
            log_error "Backend API is not accessible"
        fi
        echo ""
    fi
    
    if [[ -z "$FRONTEND_URL" && -z "$BACKEND_URL" ]]; then
        log_warning "No endpoint URLs found in Terraform state."
    fi
}

# Function to show help
show_help() {
    echo "Azure Container Apps Monitoring Script for Agent Catalog"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  status          Show deployment overview and status (default)"
    echo "  apps            Show container apps detailed status"
    echo "  logs [APP]      Show logs for specific app"
    echo "  metrics         Show resource metrics and usage"
    echo "  test            Test all endpoints"
    echo "  watch           Watch status in real-time (5-second intervals)"
    echo "  help            Show this help message"
    echo ""
    echo "Options for 'logs' command:"
    echo "  APP             Name of the container app"
    echo "  --lines N       Number of log lines to show (default: 50)"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_NAME    Project name (default: agent-catalog)"
    echo "  ENVIRONMENT     Environment (default: dev)"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 apps"
    echo "  $0 logs ca-backend-dev-abc123"
    echo "  $0 metrics"
    echo "  $0 test"
    echo "  PROJECT_NAME=my-agents $0 status"
}

# Function to watch status
watch_status() {
    log_info "Watching deployment status (Press Ctrl+C to stop)..."
    echo ""
    
    while true; do
        clear
        echo "🔄 Agent Catalog Status - $(date)"
        echo "================================"
        echo ""
        
        show_deployment_overview
        show_container_apps_status
        
        echo ""
        log_info "Refreshing in 5 seconds... (Press Ctrl+C to stop)"
        sleep 5
    done
}

# Main script logic
main() {
    check_prerequisites
    
    case "${1:-status}" in
        "status")
            show_deployment_overview
            echo ""
            show_container_apps_status
            ;;
        "apps")
            show_container_apps_status
            ;;
        "logs")
            if [[ "$3" == "--lines" && -n "$4" ]]; then
                show_logs "$2" "$4"
            else
                show_logs "$2"
            fi
            ;;
        "metrics")
            show_metrics
            ;;
        "test")
            test_endpoints
            ;;
        "watch")
            watch_status
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

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}🛑 Monitoring stopped.${NC}"; exit 0' INT

# Run main function with all arguments
main "$@"
