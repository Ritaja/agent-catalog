#!/usr/bin/env python3
"""
Test script for Azure Cosmos DB connectivity.
Run this script to test your Azure Cosmos DB setup.
"""

import asyncio
import sys
import os
from database import db_manager


async def test_cosmos_db():
    """Test Azure Cosmos DB connectivity and basic operations."""
    print("🧪 Testing Azure Cosmos DB Integration...")
    print("=" * 50)

    # Check connection mode
    if db_manager.is_mock_mode():
        print("⚠️  Running in MOCK MODE (no Cosmos DB credentials)")
        print("   This is normal for local development without Azure setup")
    else:
        print("✅ Connected to Azure Cosmos DB")
        print(f"   Endpoint: {db_manager.endpoint}")
        print(f"   Database: {db_manager.database_name}")

    print("\n📦 Testing Database Operations...")

    # Test configuration operations
    print("\n1. Configuration Management:")
    try:
        config = await db_manager.get_configuration()
        print(
            f"   ✅ Retrieved configuration: {len(config.get('agents', []))} agents")

        # Test adding an agent to config
        await db_manager.add_agent_to_config("test_agent", "http://test.example.com")
        updated_config = await db_manager.get_configuration()
        print(
            f"   ✅ Added test agent to config: {len(updated_config.get('agents', []))} agents")

        # Clean up
        await db_manager.remove_agent_from_config("test_agent")
        print("   ✅ Removed test agent from config")

    except Exception as e:
        print(f"   ❌ Configuration test failed: {str(e)}")

    # Test agent operations
    print("\n2. Agent Management:")
    try:
        # Get all agents
        agents = await db_manager.get_all_agents()
        print(f"   ✅ Retrieved {len(agents)} agents")

        # Test creating an agent
        test_agent = {
            "agent_id": "test_agent_123",
            "name": "Test Agent",
            "description": "A test agent for database testing",
            "homepage_url": "http://test.example.com",
            "openapi_url": "http://test.example.com/openapi.json",
            "version": "1.0.0",
            "skills": ["test_skill"],
            "streaming": False,
            "protocol_version": "v0.2.6",
            "input_modes": ["text"],
            "output_modes": ["text"],
            "supports_auth": False
        }

        success = await db_manager.create_agent(test_agent)
        if success:
            print("   ✅ Created test agent")

            # Test retrieving the agent
            retrieved_agent = await db_manager.get_agent("test_agent_123")
            if retrieved_agent:
                print("   ✅ Retrieved test agent")
            else:
                print("   ⚠️  Could not retrieve test agent")

            # Test updating the agent
            test_agent["description"] = "Updated test agent description"
            update_success = await db_manager.update_agent("test_agent_123", test_agent)
            if update_success:
                print("   ✅ Updated test agent")

            # Clean up - delete the test agent
            delete_success = await db_manager.delete_agent("test_agent_123")
            if delete_success:
                print("   ✅ Deleted test agent")
            else:
                print("   ⚠️  Could not delete test agent")
        else:
            print("   ❌ Failed to create test agent")

    except Exception as e:
        print(f"   ❌ Agent management test failed: {str(e)}")

    print("\n" + "=" * 50)
    if db_manager.is_mock_mode():
        print("💡 To test with real Azure Cosmos DB:")
        print("   1. Create an Azure Cosmos DB account")
        print("   2. Update your .env file with the connection details")
        print("   3. Run this test again")
    else:
        print("🎉 Azure Cosmos DB integration is working!")

    print("\n📚 For setup instructions, see: COSMOS_DB_SETUP.md")

if __name__ == "__main__":
    try:
        asyncio.run(test_cosmos_db())
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        sys.exit(1)
