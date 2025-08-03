# Project configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "agent-catalog"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "agent-catalog"
    ManagedBy   = "terraform"
  }
}

# Container configuration
variable "frontend_image" {
  description = "Frontend container image"
  type        = string
  default     = "ghcr.io/ritaja/agent-catalog-frontend:latest"
}

variable "backend_image" {
  description = "Backend container image"
  type        = string
  default     = "ghcr.io/ritaja/agent-catalog-backend:latest"
}

variable "sample_agents_image" {
  description = "Sample agents container image"
  type        = string
  default     = "ghcr.io/ritaja/agent-catalog-sample-agents:latest"
}

variable "ollama_image" {
  description = "Ollama container image"
  type        = string
  default     = "ghcr.io/ritaja/agent-catalog-ollama:latest"
}

# Cosmos DB configuration
variable "cosmos_db_throughput" {
  description = "Cosmos DB throughput"
  type        = number
  default     = 400
}

variable "cosmos_db_consistency_level" {
  description = "Cosmos DB consistency level"
  type        = string
  default     = "Session"
}

# Container Apps configuration
variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 10
}

variable "cpu_requests" {
  description = "CPU requests for containers"
  type        = string
  default     = "0.25"
}

variable "memory_requests" {
  description = "Memory requests for containers"
  type        = string
  default     = "0.5Gi"
}
