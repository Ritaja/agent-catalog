# Container Registry
resource "azurerm_container_registry" "main" {
  name                = substr(lower(replace("cr${var.project_name}${var.environment}${random_id.suffix.hex}", "-", "")), 0, 24)
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = var.tags
}

# Ollama Container App with persistent storage
resource "azurerm_container_app" "ollama" {
  name                         = "ca-ollama-${var.environment}-${random_id.suffix.hex}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    volume {
      name         = "ollama-data"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.ollama.name
    }

    container {
      name   = "ollama"
      image  = var.ollama_image
      cpu    = "1.0"
      memory = "2Gi"

      volume_mounts {
        name = "ollama-data"
        path = "/root/.ollama"
      }

      env {
        name  = "OLLAMA_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "OLLAMA_PORT"
        value = "11434"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 11434
        path      = "/api/version"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 11434
        path      = "/api/version"
      }
    }
  }

  ingress {
    external_enabled = false
    target_port      = 11434
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

# Sample Agents Container App
resource "azurerm_container_app" "sample_agents" {
  name                         = "ca-sample-agents-${var.environment}-${random_id.suffix.hex}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "sample-agents"
      image  = var.sample_agents_image
      cpu    = var.cpu_requests
      memory = var.memory_requests

      env {
        name  = "OLLAMA_BASE_URL"
        value = "http://${azurerm_container_app.ollama.name}:11434"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 5051
        path      = "/"
      }
    }
  }

  ingress {
    external_enabled = false
    target_port      = 5051
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_container_app.ollama]
}

# Backend Container App
resource "azurerm_container_app" "backend" {
  name                         = "ca-backend-${var.environment}-${random_id.suffix.hex}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "backend"
      image  = var.backend_image
      cpu    = var.cpu_requests
      memory = var.memory_requests

      env {
        name  = "COSMOS_ENDPOINT"
        value = azurerm_cosmosdb_account.main.endpoint
      }

      env {
        name        = "COSMOS_KEY"
        secret_name = "cosmos-key"
      }

      env {
        name  = "COSMOS_DATABASE_NAME"
        value = azurerm_cosmosdb_sql_database.main.name
      }

      env {
        name  = "COSMOS_AGENTS_CONTAINER"
        value = azurerm_cosmosdb_sql_container.agents.name
      }

      env {
        name  = "COSMOS_CONFIG_CONTAINER"
        value = azurerm_cosmosdb_sql_container.configuration.name
      }

      liveness_probe {
        transport = "HTTP"
        port      = 8000
        path      = "/agents"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 8000
        path      = "/agents"
      }
    }
  }

  secret {
    name  = "cosmos-key"
    value = azurerm_cosmosdb_account.main.primary_key
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_container_app.sample_agents]
}

# Frontend Container App
resource "azurerm_container_app" "frontend" {
  name                         = "ca-frontend-${var.environment}-${random_id.suffix.hex}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "frontend"
      image  = var.frontend_image
      cpu    = var.cpu_requests
      memory = var.memory_requests

      env {
        name  = "VITE_API_BASE_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 80
        path      = "/"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 80
        path      = "/"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_container_app.backend]
}

# Storage Account for Ollama data persistence
resource "azurerm_storage_account" "main" {
  name                     = substr(lower(replace("st${var.project_name}${var.environment}${random_id.suffix.hex}", "-", "")), 0, 24)
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

resource "azurerm_storage_share" "ollama" {
  name                 = "ollama-data"
  storage_account_name = azurerm_storage_account.main.name
  quota                = 10
}

resource "azurerm_container_app_environment_storage" "ollama" {
  name                         = "ollama-storage"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.main.name
  share_name                   = azurerm_storage_share.ollama.name
  access_key                   = azurerm_storage_account.main.primary_access_key
  access_mode                  = "ReadWrite"
}
