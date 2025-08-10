from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any
from urllib.parse import urlparse
import json
import httpx
import os
import asyncio
from database import db_manager


class Skill(BaseModel):
    id: str
    name: str
    description: str
    examples: List[str] = []
    tags: List[str] = []


class Agent(BaseModel):
    id: str = Field(..., alias="agent_id")
    name: str
    description: str
    homepage_url: str
    openapi_url: str
    version: str = "1.0.0"
    skills: List[Union[str, Skill]] = []
    streaming: bool = False
    protocol_version: str = "v0.2.6"
    input_modes: List[str] = []
    output_modes: List[str] = []
    supports_auth: bool = False
    # Agent protocol type: 'a2a' or 'mcp' or 'hybrid'
    protocol: str = "a2a"
    # Optional MCP metadata (e.g., SSE URL)
    class MCPInfo(BaseModel):
        transport: Optional[str] = None
        sseUrl: Optional[str] = None
        # MCP Server Capabilities
        tools: List[Dict[str, Any]] = []
        resources: List[Dict[str, Any]] = []
        prompts: List[Dict[str, Any]] = []
        # Connection metadata
        server_name: Optional[str] = None
        server_version: Optional[str] = None
        capabilities: Dict[str, Any] = {}
        last_scanned: Optional[str] = None

    mcp: Optional[MCPInfo] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class TestUrlRequest(BaseModel):
    url: str
    # Optional hint to treat this URL as MCP when no A2A card is found
    protocol: Optional[str] = None  # 'a2a' | 'mcp'
    mcp: Optional[Agent.MCPInfo] = None


class AddAgentRequest(BaseModel):
    id: str
    url: str
    protocol: Optional[str] = None  # 'a2a' | 'mcp' | 'hybrid'
    # Optional MCP metadata provided by the user
    class MCPInfo(BaseModel):
        transport: Optional[str] = None
        sseUrl: Optional[str] = None

    mcp: Optional[MCPInfo] = None


class TestUrlResponse(BaseModel):
    success: bool
    agent: Optional[Agent] = None
    error: Optional[str] = None


def infer_mcp_metadata(agent_id: Optional[str], base_url: Optional[str]) -> Optional[dict]:
    """Infer MCP metadata for known sample agents.

    Currently infers the SSE URL for the finance_agent running on port 5054,
    preserving the scheme and hostname from the provided base_url.
    """
    try:
        if agent_id == 'finance_agent' and base_url:
            parsed = urlparse(base_url)
            scheme = parsed.scheme or 'http'
            host = parsed.hostname or 'localhost'
            return {
                'transport': 'sse',
                'sseUrl': f"{scheme}://{host}:5054/sse"
            }
    except Exception:
        pass
    return None


async def scan_mcp_server_metadata(mcp_info: dict, client: httpx.AsyncClient) -> dict:
    """Scan MCP server to extract detailed metadata including tools, resources, and prompts."""
    metadata = mcp_info.copy()
    
    if not mcp_info.get('sseUrl'):
        return metadata
    
    try:
        # For SSE connections, we need to use the MCP protocol
        # This is a simplified version - in production you'd use the MCP SDK
        sse_url = mcp_info['sseUrl']
        base_url = sse_url.replace('/sse', '')
        
        # Try to get server info via HTTP first (if available)
        try:
            info_response = await client.get(f"{base_url}/info", timeout=5.0)
            if info_response.status_code == 200:
                info_data = info_response.json()
                metadata['server_name'] = info_data.get('name', 'MCP Server')
                metadata['server_version'] = info_data.get('version', '1.0.0')
        except Exception:
            pass
        
        # Try to get capabilities via initialize request
        try:
            # Simulate MCP initialize request
            init_payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "roots": {"listChanged": True},
                        "sampling": {}
                    },
                    "clientInfo": {
                        "name": "agent-catalog",
                        "version": "1.0.0"
                    }
                }
            }
            
            # For HTTP-based endpoints, try direct JSON-RPC
            if '/sse' in sse_url:
                # Try the HTTP equivalent endpoint
                http_url = sse_url.replace('/sse', '/mcp')
                init_response = await client.post(
                    http_url, 
                    json=init_payload,
                    headers={"Content-Type": "application/json"},
                    timeout=5.0
                )
                
                if init_response.status_code == 200:
                    init_data = init_response.json()
                    if 'result' in init_data:
                        result = init_data['result']
                        metadata['capabilities'] = result.get('capabilities', {})
                        metadata['server_name'] = result.get('serverInfo', {}).get('name', metadata.get('server_name', 'MCP Server'))
                        metadata['server_version'] = result.get('serverInfo', {}).get('version', metadata.get('server_version', '1.0.0'))
                        
                        # Extract available capabilities
                        capabilities = result.get('capabilities', {})
                        
                        # List tools if supported
                        if capabilities.get('tools'):
                            try:
                                tools_payload = {
                                    "jsonrpc": "2.0",
                                    "id": 2,
                                    "method": "tools/list",
                                    "params": {}
                                }
                                tools_response = await client.post(
                                    http_url,
                                    json=tools_payload,
                                    headers={"Content-Type": "application/json"},
                                    timeout=5.0
                                )
                                if tools_response.status_code == 200:
                                    tools_data = tools_response.json()
                                    if 'result' in tools_data:
                                        metadata['tools'] = tools_data['result'].get('tools', [])
                            except Exception:
                                pass
                        
                        # List resources if supported
                        if capabilities.get('resources'):
                            try:
                                resources_payload = {
                                    "jsonrpc": "2.0",
                                    "id": 3,
                                    "method": "resources/list",
                                    "params": {}
                                }
                                resources_response = await client.post(
                                    http_url,
                                    json=resources_payload,
                                    headers={"Content-Type": "application/json"},
                                    timeout=5.0
                                )
                                if resources_response.status_code == 200:
                                    resources_data = resources_response.json()
                                    if 'result' in resources_data:
                                        metadata['resources'] = resources_data['result'].get('resources', [])
                            except Exception:
                                pass
                        
                        # List prompts if supported
                        if capabilities.get('prompts'):
                            try:
                                prompts_payload = {
                                    "jsonrpc": "2.0",
                                    "id": 4,
                                    "method": "prompts/list",
                                    "params": {}
                                }
                                prompts_response = await client.post(
                                    http_url,
                                    json=prompts_payload,
                                    headers={"Content-Type": "application/json"},
                                    timeout=5.0
                                )
                                if prompts_response.status_code == 200:
                                    prompts_data = prompts_response.json()
                                    if 'result' in prompts_data:
                                        metadata['prompts'] = prompts_data['result'].get('prompts', [])
                            except Exception:
                                pass
        except Exception as e:
            print(f"Failed to scan MCP metadata: {e}")
        
        # Add timestamp
        from datetime import datetime
        metadata['last_scanned'] = datetime.utcnow().isoformat()
        
    except Exception as e:
        print(f"Error scanning MCP server metadata: {e}")
    
    return metadata


def parse_agent_data(card: dict, agent_id: str = None, base_url: str = None) -> dict:
    """Parse agent data from various A2A formats."""
    # Basic information
    name = card.get('name', agent_id or 'Unknown Agent')
    description = card.get('description', 'No description available')
    version = card.get('version', '1.0.0')

    # Handle different streaming formats
    streaming = False
    if 'streaming' in card:
        streaming = card['streaming']
    elif 'capabilities' in card and isinstance(card['capabilities'], dict):
        streaming = card['capabilities'].get('streaming', False)

    # Handle skills - support both string array and object array
    skills = []
    card_skills = card.get('skills', [])
    if card_skills:
        for skill in card_skills:
            if isinstance(skill, str):
                skills.append(skill)
            elif isinstance(skill, dict):
                skills.append(Skill(
                    id=skill.get('id', ''),
                    name=skill.get('name', skill.get('id', '')),
                    description=skill.get('description', ''),
                    examples=skill.get('examples', []),
                    tags=skill.get('tags', [])
                ))

    # Handle input/output modes
    input_modes = card.get('defaultInputModes', [])
    output_modes = card.get('defaultOutputModes', [])

    # Handle authentication support
    supports_auth = card.get('supportsAuthenticatedExtendedCard', False)

    # Handle agent ID from different locations
    parsed_agent_id = agent_id or card.get(
        'id') or card.get('agent_id') or 'unknown_agent'

    result = {
        'agent_id': parsed_agent_id,
        'name': name,
        'description': description,
        'homepage_url': base_url or card.get('url', ''),
        'openapi_url': f"{(base_url or card.get('url', '')).rstrip('/')}/openapi.json",
        'version': version,
        'skills': skills,
        'streaming': streaming,
        'protocol_version': "v0.2.6",
        'input_modes': input_modes,
        'output_modes': output_modes,
        'supports_auth': supports_auth,
        'protocol': 'a2a',
    }

    # If no MCP info was provided upstream, infer for known samples (finance_agent)
    inferred = infer_mcp_metadata(parsed_agent_id, base_url or card.get('url', ''))
    if inferred:
        result['mcp'] = inferred

    return result


async def load_agents_from_config():
    """Load agent configurations and populate the database."""
    # Check if we're in mock mode and need to load from file
    if db_manager.is_mock_mode():
        config_path = os.path.join(
            os.path.dirname(__file__), 'agents_config.json')
        if os.path.exists(config_path):
            with open(config_path) as cfg:
                cfg_data = json.load(cfg)
            # Store config in mock database
            await db_manager.update_configuration(cfg_data)
        else:
            # Create default config
            await db_manager.update_configuration({"agents": []})

    # Get configuration from database
    config = await db_manager.get_configuration()

    # Sample mock data for enhanced agent information
    sample_agents_data = {
        "calendar_agent": {
            "version": "2.1.3",
            "skills": ["scheduleEvent", "sendReminder"],
            "streaming": True
        },
        "finance_agent": {
            "version": "1.5.2",
            "skills": ["analyzeExpenses", "generateReport", "predictTrends"],
            "streaming": False
        },
        "task_agent": {
            "version": "3.0.1",
            "skills": ["createTask", "updateStatus"],
            "streaming": True
        }
    }

    async with httpx.AsyncClient() as client:
        tasks = []
        for entry in config.get('agents', []):
            tasks.append(fetch_agent_details(
                client, entry, sample_agents_data))

        results = await asyncio.gather(*tasks)

        for agent in results:
            if agent:
                # Store agent in database
                agent_dict = agent.model_dump(by_alias=True)
                await db_manager.create_agent(agent_dict)


async def fetch_agent_details(client: httpx.AsyncClient, entry: dict, sample_data: dict):
    agent_id = entry.get('id')
    base_url = entry.get('url')
    protocol = entry.get('protocol') or 'a2a'
    mcp_meta = entry.get('mcp')
    try:
        card = None
        if protocol in ('a2a', 'hybrid'):
            resp = await client.get(base_url)
            resp.raise_for_status()
            card = resp.json()

        # Parse using the new parser when we have an A2A card
        agent_data = parse_agent_data(card or {}, agent_id, base_url) if card else {
            'agent_id': agent_id,
            'name': agent_id,
            'description': '',
            'homepage_url': base_url,
            'openapi_url': f"{base_url}/openapi.json",
            'version': '1.0.0',
            'skills': [],
            'streaming': False,
            'protocol_version': 'v0.2.6',
            'input_modes': [],
            'output_modes': [],
            'supports_auth': False,
            'protocol': 'mcp',
        }

        # Attach MCP if provided in config
        if mcp_meta:
            agent_data['mcp'] = mcp_meta
            # Mark protocol appropriately
            if agent_data.get('protocol') == 'a2a' and protocol == 'hybrid':
                agent_data['protocol'] = 'hybrid'
            elif protocol == 'mcp':
                agent_data['protocol'] = 'mcp'

        # Apply mock data overrides if available
        mock_data = sample_data.get(agent_id, {})
        if mock_data:
            agent_data.update({
                'version': mock_data.get("version", agent_data['version']),
                'skills': mock_data.get("skills", agent_data['skills']),
                'streaming': mock_data.get("streaming", agent_data['streaming'])
            })

        # If we have MCP metadata, scan the server for detailed information
        if agent_data.get('mcp'):
            try:
                enhanced_mcp = await scan_mcp_server_metadata(agent_data['mcp'], client)
                agent_data['mcp'] = enhanced_mcp
                
                # Update agent name and description from MCP server info if available
                if enhanced_mcp.get('server_name') and not card:
                    agent_data['name'] = enhanced_mcp['server_name']
                if enhanced_mcp.get('server_version'):
                    agent_data['version'] = enhanced_mcp['server_version']
                    
                # Add MCP-specific skills from tools
                if enhanced_mcp.get('tools'):
                    mcp_skills = []
                    for tool in enhanced_mcp['tools']:
                        skill = Skill(
                            id=tool.get('name', ''),
                            name=tool.get('name', ''),
                            description=tool.get('description', ''),
                            examples=[],
                            tags=['mcp', 'tool']
                        )
                        mcp_skills.append(skill)
                    
                    # Merge with existing skills
                    existing_skills = agent_data.get('skills', [])
                    agent_data['skills'] = existing_skills + mcp_skills
                    
            except Exception as e:
                print(f"Failed to scan MCP metadata for {agent_id}: {e}")

        return Agent(**agent_data)

    except (httpx.RequestError, json.JSONDecodeError):
        # Fallback for connection errors
        mock_data = sample_data.get(agent_id, {})
        return Agent(
            agent_id=agent_id,
            name=agent_id,
            description='',
            homepage_url=base_url,
            openapi_url=f"{base_url}/openapi.json",
            version=mock_data.get("version", "1.0.0"),
            skills=mock_data.get("skills", []),
            streaming=mock_data.get("streaming", False),
            protocol_version="v0.2.6",
            protocol=protocol,
            mcp=mcp_meta
        )


app = FastAPI()


@app.on_event("startup")
async def startup_event():
    await load_agents_from_config()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    pass

# Enable CORS for all origins (you can restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/agents", response_model=List[Agent])
async def get_agents():
    """Return the list of registered A2A agents."""
    agents_data = await db_manager.get_all_agents()
    return agents_data


@app.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    """Return details of a single agent by ID."""
    agent_data = await db_manager.get_agent(agent_id)
    if agent_data:
        return agent_data
    raise HTTPException(status_code=404, detail="Agent not found")


@app.post("/test-agent-url", response_model=TestUrlResponse)
async def test_agent_url(request: TestUrlRequest):
    """Test a URL to see if it's a valid A2A agent."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try to fetch the agent's base endpoint
            try:
                card = None
                if request.protocol in (None, 'a2a', 'hybrid'):
                    resp = await client.get(request.url)
                    resp.raise_for_status()
                    card = resp.json()
            except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                # If direct access fails, try common A2A endpoints
                if request.protocol in (None, 'a2a', 'hybrid'):
                    try:
                        resp = await client.get(f"{request.url.rstrip('/')}/")
                        resp.raise_for_status()
                        card = resp.json()
                    except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                        card = None

            preview_agent: Optional[Agent] = None
            if card:
                # Parse agent data using the new parser
                agent_data = parse_agent_data(card, base_url=request.url)
                # If caller indicates MCP or Hybrid, reflect this and attach MCP metadata
                if request.mcp:
                    agent_data['mcp'] = request.mcp.model_dump(exclude_none=True)
                if request.protocol in ('mcp', 'hybrid'):
                    agent_data['protocol'] = request.protocol
                preview_agent = Agent(**agent_data)
            else:
                # No A2A card found or protocol explicitly MCP: construct an MCP-only agent preview if metadata provided
                if request.protocol in ('mcp', 'hybrid') or request.mcp:
                    # Provide minimal agent shell for MCP display
                    agent_data = {
                        'agent_id': urlparse(request.url).hostname or 'mcp_agent',
                        'name': 'MCP Server',
                        'description': 'Model Context Protocol server',
                        'homepage_url': request.url,
                        'openapi_url': f"{request.url.rstrip('/')}/openapi.json",
                        'version': '1.0.0',
                        'skills': [],
                        'streaming': False,
                        'protocol_version': 'v0.2.6',
                        'input_modes': [],
                        'output_modes': [],
                        'supports_auth': False,
                        'protocol': 'mcp',
                    }
                    if request.mcp:
                        agent_data['mcp'] = request.mcp.model_dump(exclude_none=True)
                    preview_agent = Agent(**agent_data)

            if not preview_agent:
                raise HTTPException(
                    status_code=400,
                    detail="Unable to connect to the URL or parse agent information"
                )

            return TestUrlResponse(
                success=True,
                agent=preview_agent
            )

    except HTTPException:
        raise
    except Exception as e:
        return TestUrlResponse(
            success=False,
            error=f"Connection error: {str(e)}"
        )


@app.post("/add-agent")
async def add_agent(request: AddAgentRequest):
    """Add a new agent to the catalog."""
    try:
        # First test the URL to make sure it's valid
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                card = None
                if request.protocol in (None, 'a2a', 'hybrid'):
                    resp = await client.get(request.url)
                    resp.raise_for_status()
                    card = resp.json()
            except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                if request.protocol in (None, 'a2a', 'hybrid'):
                    try:
                        resp = await client.get(f"{request.url.rstrip('/')}/")
                        resp.raise_for_status()
                        card = resp.json()
                    except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                        card = None
                if not card and request.protocol == 'a2a':
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to connect to the provided URL"
                    )

        # Check if agent ID already exists
        existing_agent = await db_manager.get_agent(request.id)
        if existing_agent:
            raise HTTPException(
                status_code=409,
                detail=f"Agent with ID '{request.id}' already exists"
            )

        # Parse agent data (A2A) or create MCP shell
        if card:
            agent_data = parse_agent_data(card, request.id, request.url)
        else:
            agent_data = {
                'agent_id': request.id,
                'name': request.id,
                'description': '',
                'homepage_url': request.url,
                'openapi_url': f"{request.url.rstrip('/')}/openapi.json",
                'version': '1.0.0',
                'skills': [],
                'streaming': False,
                'protocol_version': 'v0.2.6',
                'input_modes': [],
                'output_modes': [],
                'supports_auth': False,
            }

        # Determine protocol and attach MCP metadata
        desired_protocol = request.protocol or ('a2a' if card else 'mcp')
        agent_data['protocol'] = desired_protocol

        # Attach MCP metadata if provided
        if request.mcp:
            agent_data['mcp'] = request.mcp.model_dump(exclude_none=True)
        agent = Agent(**agent_data)

        # Add to database
        agent_dict = agent.model_dump(by_alias=True)
        success = await db_manager.create_agent(agent_dict)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to save agent to database"
            )

        # Update the configuration
        await db_manager.add_agent_to_config(
            request.id,
            request.url,
            protocol=desired_protocol,
            mcp=agent_data.get('mcp')
        )

        return {
            "success": True,
            "message": f"Agent '{request.id}' added successfully",
            "agent": agent_dict
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add agent: {str(e)}"
        )


@app.post("/agents/{agent_id}/scan-mcp")
async def scan_agent_mcp_metadata(agent_id: str):
    """Scan and update MCP metadata for a specific agent."""
    try:
        # Get existing agent
        existing_agent = await db_manager.get_agent(agent_id)
        if not existing_agent:
            raise HTTPException(
                status_code=404,
                detail=f"Agent with ID '{agent_id}' not found"
            )
        
        # Check if agent has MCP configuration
        if not existing_agent.get('mcp'):
            raise HTTPException(
                status_code=400,
                detail=f"Agent '{agent_id}' does not have MCP configuration"
            )
        
        # Scan MCP metadata
        async with httpx.AsyncClient(timeout=10.0) as client:
            enhanced_mcp = await scan_mcp_server_metadata(existing_agent['mcp'], client)
            
            # Update agent with enhanced MCP metadata
            existing_agent['mcp'] = enhanced_mcp
            
            # Save updated agent
            success = await db_manager.create_agent(existing_agent)
            
            if not success:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to update agent in database"
                )
            
            return {
                "success": True,
                "message": f"MCP metadata scanned for agent '{agent_id}'",
                "mcp_metadata": enhanced_mcp
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scan MCP metadata: {str(e)}"
        )


@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent from the catalog."""
    try:
        # Check if agent exists
        existing_agent = await db_manager.get_agent(agent_id)
        if not existing_agent:
            raise HTTPException(
                status_code=404,
                detail=f"Agent with ID '{agent_id}' not found"
            )

        # Delete from database
        success = await db_manager.delete_agent(agent_id)
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete agent from database"
            )

        # Remove from configuration
        await db_manager.remove_agent_from_config(agent_id)

        return {
            "success": True,
            "message": f"Agent '{agent_id}' deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete agent: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
