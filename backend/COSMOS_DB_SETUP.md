# Azure Cosmos DB Integration

This document explains how to set up and use Azure Cosmos DB with the Agent Catalog backend.

## Overview

The backend has been updated to use Azure Cosmos DB as the primary database for storing:

- Agent configurations
- Agent details and metadata
- Application configuration

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **Azure Cosmos DB Account**: Create a Cosmos DB account with SQL API

## Setting up Azure Cosmos DB

### 1. Create a Cosmos DB Account

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Click "Create a resource" → "Databases" → "Azure Cosmos DB"
3. Select "SQL API" as the API
4. Choose your subscription, resource group, and account name
5. Select your preferred region
6. Click "Review + Create" and then "Create"

### 2. Get Connection Details

Once your Cosmos DB account is created:

1. Navigate to your Cosmos DB account in the Azure Portal
2. Go to "Keys" in the left sidebar
3. Copy the following values:
   - **URI** (Primary Connection String endpoint)
   - **PRIMARY KEY** (Primary key)

### 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Azure Cosmos DB credentials:
   ```env
   COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOS_KEY=your-primary-key-here
   COSMOS_DATABASE_NAME=agent-catalog
   COSMOS_AGENTS_CONTAINER=agents
   COSMOS_CONFIG_CONTAINER=configuration
   ```

## Database Schema

### Agents Container

- **Partition Key**: `/id`
- **Document Structure**:
  ```json
  {
    "id": "agent_id",
    "agent_id": "agent_id",
    "name": "Agent Name",
    "description": "Agent description",
    "homepage_url": "https://agent.url",
    "openapi_url": "https://agent.url/openapi.json",
    "version": "1.0.0",
    "skills": ["skill1", "skill2"],
    "streaming": true,
    "protocol_version": "v0.2.6",
    "input_modes": ["text"],
    "output_modes": ["text"],
    "supports_auth": false
  }
  ```

### Configuration Container

- **Partition Key**: `/id`
- **Document Structure**:
  ```json
  {
    "id": "main_config",
    "agents": [
      {
        "id": "agent_id",
        "url": "https://agent.url"
      }
    ]
  }
  ```

## API Changes

### New Endpoint: DELETE /agents/{agent_id}

- **Purpose**: Remove an agent from the catalog
- **Response**: Success/failure message

### Updated Endpoints

All existing endpoints now use Azure Cosmos DB:

- `GET /agents` - Retrieves agents from Cosmos DB
- `GET /agents/{agent_id}` - Retrieves specific agent from Cosmos DB
- `POST /add-agent` - Stores new agent in Cosmos DB
- `POST /test-agent-url` - No database interaction (unchanged)

## Fallback Mode

If Azure Cosmos DB credentials are not provided or connection fails, the application will run in "mock mode":

- Uses in-memory storage for development/testing
- Attempts to load from `agents_config.json` if available
- All database operations work but data is not persisted

## Running the Application

1. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Server**:

   ```bash
   python main.py
   ```

   or

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Verify Connection**:
   - Check the console logs for Cosmos DB connection status
   - Visit `http://localhost:8000/agents` to see if agents are loaded

## Development Notes

### Database Manager

The `database.py` module provides a `CosmosDBManager` class that handles:

- Connection management
- CRUD operations for agents
- Configuration management
- Automatic fallback to mock mode

### Error Handling

- Network timeouts are handled gracefully
- Missing credentials trigger fallback mode
- Database errors are logged and return appropriate HTTP status codes

### Performance Considerations

- Containers are created with 400 RU/s throughput (minimum for shared throughput)
- Queries use partition keys for optimal performance
- Connection pooling is handled by the Azure SDK

## Troubleshooting

### Common Issues

1. **"Import azure.cosmos could not be resolved"**

   - Run `pip install -r requirements.txt` to install dependencies

2. **Connection timeout errors**

   - Verify your Azure Cosmos DB endpoint and keys
   - Check network connectivity to Azure
   - Ensure your Azure Cosmos DB account is not paused

3. **Permission errors**

   - Verify you're using the primary key (not read-only key)
   - Check that your Azure Cosmos DB account has the correct permissions

4. **Application running in mock mode unexpectedly**
   - Check that your `.env` file exists and contains the correct values
   - Verify that environment variables are being loaded properly

### Logs

Monitor the application logs for:

- Database connection status on startup
- Error messages from Azure Cosmos DB operations
- Fallback mode activation

## Security Best Practices

1. **Keep credentials secure**:

   - Never commit `.env` files to version control
   - Use Azure Key Vault for production deployments
   - Rotate keys regularly

2. **Network security**:

   - Configure IP filtering on your Cosmos DB account
   - Use VNet integration in production
   - Enable SSL/TLS connections (default)

3. **Access control**:
   - Use resource-specific connection strings when possible
   - Implement proper authentication in your application
   - Monitor access logs in Azure Portal
