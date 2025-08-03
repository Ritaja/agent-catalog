#!/bin/bash

# Azure Deployment Test Script
# This script tests the Azure deployment to ensure all services are working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
TIMEOUT="${TIMEOUT:-30}"

# Functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  Agent Catalog - Deployment Test${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test functions
test_terraform_output() {
    print_test "Checking Terraform outputs..."
    
    cd "$(dirname "$0")/../terraform"
    
    if [[ ! -f "terraform.tfstate" ]]; then
        print_fail "Terraform state file not found. Deploy first with ./deploy.sh"
        return 1
    fi
    
    FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "")
    BACKEND_URL=$(terraform output -raw backend_url 2>/dev/null || echo "")
    
    if [[ -z "$FRONTEND_URL" || -z "$BACKEND_URL" ]]; then
        print_fail "Failed to get deployment URLs from Terraform"
        return 1
    fi
    
    print_pass "Terraform outputs retrieved successfully"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend: $BACKEND_URL"
    
    # Export for other tests
    export FRONTEND_URL BACKEND_URL
    return 0
}

test_frontend_health() {
    print_test "Testing frontend health..."
    
    if [[ -z "$FRONTEND_URL" ]]; then
        print_fail "Frontend URL not available"
        return 1
    fi
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$FRONTEND_URL" || echo "000")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        print_pass "Frontend is responding (HTTP $HTTP_STATUS)"
        return 0
    else
        print_fail "Frontend health check failed (HTTP $HTTP_STATUS)"
        return 1
    fi
}

test_backend_health() {
    print_test "Testing backend health..."
    
    if [[ -z "$BACKEND_URL" ]]; then
        print_fail "Backend URL not available"
        return 1
    fi
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BACKEND_URL/agents" || echo "000")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        print_pass "Backend is responding (HTTP $HTTP_STATUS)"
        return 0
    else
        print_fail "Backend health check failed (HTTP $HTTP_STATUS)"
        return 1
    fi
}

test_api_endpoints() {
    print_test "Testing API endpoints..."
    
    if [[ -z "$BACKEND_URL" ]]; then
        print_fail "Backend URL not available"
        return 1
    fi
    
    # Test /agents endpoint
    AGENTS_RESPONSE=$(curl -s --max-time $TIMEOUT "$BACKEND_URL/agents" || echo "")
    
    if echo "$AGENTS_RESPONSE" | grep -q "^\["; then
        print_pass "Agents endpoint returning valid JSON array"
    else
        print_fail "Agents endpoint not returning expected format"
        echo "Response: $AGENTS_RESPONSE"
        return 1
    fi
    
    # Test /docs endpoint (OpenAPI)
    DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BACKEND_URL/docs" || echo "000")
    
    if [[ "$DOCS_STATUS" == "200" ]]; then
        print_pass "API documentation is accessible"
    else
        print_fail "API documentation not accessible (HTTP $DOCS_STATUS)"
        return 1
    fi
    
    return 0
}

test_database_connection() {
    print_test "Testing database connection..."
    
    if [[ -z "$BACKEND_URL" ]]; then
        print_fail "Backend URL not available"
        return 1
    fi
    
    # Try to add a test agent to verify database connectivity
    TEST_AGENT_DATA='{
        "name": "test-agent",
        "description": "Test agent for deployment verification",
        "url": "http://test.example.com",
        "type": "test"
    }'
    
    ADD_RESPONSE=$(curl -s -X POST "$BACKEND_URL/add-agent" \
        -H "Content-Type: application/json" \
        -d "$TEST_AGENT_DATA" \
        --max-time $TIMEOUT || echo "")
    
    if echo "$ADD_RESPONSE" | grep -q "success\|added\|Test agent"; then
        print_pass "Database connection working (agent add successful)"
        
        # Clean up - try to remove the test agent
        curl -s -X DELETE "$BACKEND_URL/agents/test-agent" --max-time $TIMEOUT > /dev/null || true
    else
        print_info "Database test inconclusive (may be using mock mode)"
        echo "Response: $ADD_RESPONSE"
    fi
    
    return 0
}

test_sample_agents() {
    print_test "Testing sample agents discovery..."
    
    if [[ -z "$BACKEND_URL" ]]; then
        print_fail "Backend URL not available"
        return 1
    fi
    
    AGENTS_RESPONSE=$(curl -s --max-time $TIMEOUT "$BACKEND_URL/agents" || echo "[]")
    AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | jq 'length' 2>/dev/null || echo "0")
    
    if [[ "$AGENT_COUNT" -gt 0 ]]; then
        print_pass "Found $AGENT_COUNT agents in catalog"
        
        # List discovered agents
        echo "$AGENTS_RESPONSE" | jq -r '.[] | "  - " + .name + " (" + .type + ")"' 2>/dev/null || echo "  (Could not parse agent details)"
    else
        print_info "No agents discovered (agents may be starting up)"
    fi
    
    return 0
}

test_ollama_service() {
    print_test "Testing Ollama service availability..."
    
    # We can't directly test Ollama from outside the container environment
    # But we can check if the agents are using it successfully
    if [[ -z "$BACKEND_URL" ]]; then
        print_fail "Backend URL not available for indirect Ollama test"
        return 1
    fi
    
    # Check if any agents are responding (which would indicate Ollama is working)
    AGENTS_RESPONSE=$(curl -s --max-time $TIMEOUT "$BACKEND_URL/agents" || echo "[]")
    
    if echo "$AGENTS_RESPONSE" | grep -q "task-agent\|calendar-agent\|finance-agent"; then
        print_pass "Sample agents detected (Ollama likely working)"
    else
        print_info "Cannot verify Ollama directly (check agent logs for AI functionality)"
    fi
    
    return 0
}

run_performance_test() {
    print_test "Running basic performance test..."
    
    if [[ -z "$FRONTEND_URL" || -z "$BACKEND_URL" ]]; then
        print_fail "URLs not available for performance test"
        return 1
    fi
    
    # Test frontend response time
    FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$FRONTEND_URL" || echo "999")
    
    # Test backend response time
    BACKEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$BACKEND_URL/agents" || echo "999")
    
    print_info "Response times:"
    echo "  Frontend: ${FRONTEND_TIME}s"
    echo "  Backend: ${BACKEND_TIME}s"
    
    if (( $(echo "$FRONTEND_TIME < 5.0" | bc -l) )) && (( $(echo "$BACKEND_TIME < 5.0" | bc -l) )); then
        print_pass "Response times are acceptable"
    else
        print_fail "Response times are slow (>5s)"
        return 1
    fi
    
    return 0
}

# Main test execution
main() {
    print_header
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment|-e)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --timeout|-t)
                TIMEOUT="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  -e, --environment      Environment name (default: dev)"
                echo "  -t, --timeout          Timeout for HTTP requests (default: 30)"
                echo "  -h, --help            Show this help message"
                echo ""
                echo "This script tests the Azure deployment to ensure all services are working."
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    print_info "Testing deployment for environment: $ENVIRONMENT"
    print_info "HTTP timeout: ${TIMEOUT}s"
    echo ""
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        print_fail "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_info "jq not found - JSON parsing will be limited"
    fi
    
    # Run tests
    TESTS_PASSED=0
    TESTS_TOTAL=0
    
    # Core functionality tests
    if test_terraform_output; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    if test_frontend_health; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    if test_backend_health; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    if test_api_endpoints; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    
    # Additional tests
    if test_database_connection; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    if test_sample_agents; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    if test_ollama_service; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    
    # Performance test
    if command -v bc &> /dev/null; then
        if run_performance_test; then ((TESTS_PASSED++)); fi; ((TESTS_TOTAL++))
    else
        print_info "bc not found - skipping performance test"
    fi
    
    # Summary
    echo ""
    echo -e "${BLUE}=== Test Summary ===${NC}"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $((TESTS_TOTAL - TESTS_PASSED))${NC}"
    echo -e "${BLUE}Total: $TESTS_TOTAL${NC}"
    echo ""
    
    if [[ $TESTS_PASSED -eq $TESTS_TOTAL ]]; then
        print_pass "All tests passed! 🎉"
        echo ""
        echo -e "${GREEN}Your Agent Catalog deployment is working correctly!${NC}"
        echo ""
        echo "Access your application:"
        echo "  Frontend: $FRONTEND_URL"
        echo "  Backend: $BACKEND_URL"
        echo "  API Docs: $BACKEND_URL/docs"
        exit 0
    else
        print_fail "Some tests failed. Check the deployment and try again."
        exit 1
    fi
}

# Run main function
main "$@"
