import os
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from typing import List, Dict, Optional, Any
import json
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CosmosDBManager:
    def __init__(self):
        # Azure Cosmos DB configuration
        self.endpoint = os.getenv("COSMOS_ENDPOINT", "")
        self.key = os.getenv("COSMOS_KEY", "")
        self.database_name = os.getenv("COSMOS_DATABASE_NAME", "agent-catalog")
        self.agents_container_name = os.getenv(
            "COSMOS_AGENTS_CONTAINER", "agents")
        self.config_container_name = os.getenv(
            "COSMOS_CONFIG_CONTAINER", "configuration")

        if not self.endpoint or not self.key:
            logger.warning("Cosmos DB credentials not found. Using mock mode.")
            self.client = None
            self.database = None
            self.agents_container = None
            self.config_container = None
            self._mock_agents = {}
            self._mock_config = {"agents": []}
        else:
            self._initialize_cosmos_client()

    def _initialize_cosmos_client(self):
        """Initialize Cosmos DB client and create database/containers if they don't exist."""
        try:
            self.client = CosmosClient(self.endpoint, self.key)

            # Create database if it doesn't exist
            try:
                self.database = self.client.create_database(
                    id=self.database_name)
                logger.info(f"Created database: {self.database_name}")
            except exceptions.CosmosResourceExistsError:
                self.database = self.client.get_database_client(
                    self.database_name)
                logger.info(f"Using existing database: {self.database_name}")

            # Create agents container if it doesn't exist
            try:
                self.agents_container = self.database.create_container(
                    id=self.agents_container_name,
                    partition_key=PartitionKey(path="/id"),
                    offer_throughput=400
                )
                logger.info(f"Created container: {self.agents_container_name}")
            except exceptions.CosmosResourceExistsError:
                self.agents_container = self.database.get_container_client(
                    self.agents_container_name)
                logger.info(
                    f"Using existing container: {self.agents_container_name}")

            # Create config container if it doesn't exist
            try:
                self.config_container = self.database.create_container(
                    id=self.config_container_name,
                    partition_key=PartitionKey(path="/id"),
                    offer_throughput=400
                )
                logger.info(f"Created container: {self.config_container_name}")
            except exceptions.CosmosResourceExistsError:
                self.config_container = self.database.get_container_client(
                    self.config_container_name)
                logger.info(
                    f"Using existing container: {self.config_container_name}")

        except Exception as e:
            logger.error(f"Failed to initialize Cosmos DB: {str(e)}")
            logger.warning("Falling back to mock mode")
            self.client = None
            self.database = None
            self.agents_container = None
            self.config_container = None
            self._mock_agents = {}
            self._mock_config = {"agents": []}

    def is_mock_mode(self) -> bool:
        """Check if the database is running in mock mode."""
        return self.client is None

    async def get_all_agents(self) -> List[Dict[str, Any]]:
        """Retrieve all agents from the database."""
        if self.is_mock_mode():
            return list(self._mock_agents.values())

        try:
            items = list(self.agents_container.read_all_items())
            return items
        except Exception as e:
            logger.error(f"Error retrieving agents: {str(e)}")
            return []

    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific agent by ID."""
        if self.is_mock_mode():
            return self._mock_agents.get(agent_id)

        try:
            item = self.agents_container.read_item(
                item=agent_id, partition_key=agent_id)
            return item
        except exceptions.CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error retrieving agent {agent_id}: {str(e)}")
            return None

    async def create_agent(self, agent_data: Dict[str, Any]) -> bool:
        """Create a new agent in the database."""
        # Use agent_id as the primary key, but also set id for Cosmos DB
        agent_id = agent_data.get("agent_id") or agent_data.get("id")
        if not agent_id:
            logger.error("Agent data missing both 'id' and 'agent_id' fields")
            return False

        # Ensure both id and agent_id are set for compatibility
        agent_data["id"] = agent_id
        agent_data["agent_id"] = agent_id

        if self.is_mock_mode():
            self._mock_agents[agent_id] = agent_data
            return True

        try:
            self.agents_container.create_item(body=agent_data)
            return True
        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}")
            return False

    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> bool:
        """Update an existing agent in the database."""
        # Ensure both id and agent_id are set for compatibility
        agent_data["id"] = agent_id
        agent_data["agent_id"] = agent_id

        if self.is_mock_mode():
            if agent_id in self._mock_agents:
                self._mock_agents[agent_id] = agent_data
                return True
            return False

        try:
            self.agents_container.upsert_item(body=agent_data)
            return True
        except Exception as e:
            logger.error(f"Error updating agent {agent_id}: {str(e)}")
            return False

    async def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent from the database."""
        if self.is_mock_mode():
            if agent_id in self._mock_agents:
                del self._mock_agents[agent_id]
                return True
            return False

        try:
            self.agents_container.delete_item(
                item=agent_id, partition_key=agent_id)
            return True
        except exceptions.CosmosResourceNotFoundError:
            return False
        except Exception as e:
            logger.error(f"Error deleting agent {agent_id}: {str(e)}")
            return False

    async def get_configuration(self) -> Dict[str, Any]:
        """Retrieve the agent configuration."""
        if self.is_mock_mode():
            return self._mock_config

        try:
            item = self.config_container.read_item(
                item="main_config", partition_key="main_config")
            return item
        except exceptions.CosmosResourceNotFoundError:
            # Return default configuration if not found
            default_config = {"id": "main_config", "agents": []}
            await self.update_configuration(default_config)
            return default_config
        except Exception as e:
            logger.error(f"Error retrieving configuration: {str(e)}")
            return {"agents": []}

    async def update_configuration(self, config_data: Dict[str, Any]) -> bool:
        """Update the agent configuration."""
        if self.is_mock_mode():
            self._mock_config = config_data
            return True

        try:
            # Ensure the config has an ID for Cosmos DB
            config_data["id"] = "main_config"
            self.config_container.upsert_item(body=config_data)
            return True
        except Exception as e:
            logger.error(f"Error updating configuration: {str(e)}")
            return False

    async def add_agent_to_config(self, agent_id: str, agent_url: str, *, protocol: str = "a2a", mcp: Optional[Dict[str, Any]] = None) -> bool:
        """Add an agent to the configuration.

        Extended to support MCP entries with protocol and mcp metadata.
        """
        config = await self.get_configuration()

        # Check if agent already exists in config
        agent_exists = any(
            a.get('id') == agent_id for a in config.get('agents', []))
        if not agent_exists:
            if 'agents' not in config:
                config['agents'] = []
            entry: Dict[str, Any] = {
                "id": agent_id,
                "url": agent_url,
                "protocol": protocol,
            }
            if mcp:
                entry["mcp"] = mcp
            config['agents'].append(entry)
            return await self.update_configuration(config)
        return True

    async def remove_agent_from_config(self, agent_id: str) -> bool:
        """Remove an agent from the configuration."""
        config = await self.get_configuration()

        if 'agents' in config:
            config['agents'] = [a for a in config['agents']
                                if a.get('id') != agent_id]
            return await self.update_configuration(config)
        return True


# Global database instance
db_manager = CosmosDBManager()
