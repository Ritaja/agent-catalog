from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any
import json
import httpx
import os
import asyncio


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

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class TestUrlRequest(BaseModel):
    url: str


class AddAgentRequest(BaseModel):
    id: str
    url: str


class TestUrlResponse(BaseModel):
    success: bool
    agent: Optional[Agent] = None
    error: Optional[str] = None


AGENTS_DB: Dict[str, Agent] = {}


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

    return {
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
        'supports_auth': supports_auth
    }


async def load_agents_from_config():
    """Load agent configurations and populate the in-memory database."""
    config_path = os.path.join(os.path.dirname(__file__), 'agents_config.json')

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

    with open(config_path) as cfg:
        cfg_data = json.load(cfg)

    async with httpx.AsyncClient() as client:
        tasks = []
        for entry in cfg_data.get('agents', []):
            tasks.append(fetch_agent_details(
                client, entry, sample_agents_data))

        results = await asyncio.gather(*tasks)

        for agent in results:
            if agent:
                AGENTS_DB[agent.id] = agent


async def fetch_agent_details(client: httpx.AsyncClient, entry: dict, sample_data: dict):
    agent_id = entry.get('id')
    base_url = entry.get('url')
    try:
        resp = await client.get(base_url)
        resp.raise_for_status()
        card = resp.json()

        # Parse using the new parser
        agent_data = parse_agent_data(card, agent_id, base_url)

        # Apply mock data overrides if available
        mock_data = sample_data.get(agent_id, {})
        if mock_data:
            agent_data.update({
                'version': mock_data.get("version", agent_data['version']),
                'skills': mock_data.get("skills", agent_data['skills']),
                'streaming': mock_data.get("streaming", agent_data['streaming'])
            })

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
            protocol_version="v0.2.6"
        )


app = FastAPI()


@app.on_event("startup")
async def startup_event():
    await load_agents_from_config()

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
    return [agent.model_dump(by_alias=True) for agent in AGENTS_DB.values()]


@app.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    """Return details of a single agent by ID."""
    agent = AGENTS_DB.get(agent_id)
    if agent:
        return agent.model_dump(by_alias=True)
    raise HTTPException(status_code=404, detail="Agent not found")


@app.post("/test-agent-url", response_model=TestUrlResponse)
async def test_agent_url(request: TestUrlRequest):
    """Test a URL to see if it's a valid A2A agent."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try to fetch the agent's base endpoint
            try:
                resp = await client.get(request.url)
                resp.raise_for_status()
                card = resp.json()
            except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                # If direct access fails, try common A2A endpoints
                try:
                    resp = await client.get(f"{request.url.rstrip('/')}/")
                    resp.raise_for_status()
                    card = resp.json()
                except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to connect to the URL or parse agent information"
                    )

            # Parse agent data using the new parser
            agent_data = parse_agent_data(card, base_url=request.url)

            # Create a preview agent object
            preview_agent = Agent(**agent_data)

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
                resp = await client.get(request.url)
                resp.raise_for_status()
                card = resp.json()
            except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                try:
                    resp = await client.get(f"{request.url.rstrip('/')}/")
                    resp.raise_for_status()
                    card = resp.json()
                except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError):
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to connect to the provided URL"
                    )

        # Check if agent ID already exists
        if request.id in AGENTS_DB:
            raise HTTPException(
                status_code=409,
                detail=f"Agent with ID '{request.id}' already exists"
            )

        # Parse agent data using the new parser
        agent_data = parse_agent_data(card, request.id, request.url)
        agent = Agent(**agent_data)

        # Add to in-memory database
        AGENTS_DB[request.id] = agent

        # Update the configuration file
        config_path = os.path.join(
            os.path.dirname(__file__), 'agents_config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            config = {"agents": []}

        # Add new agent to config if not already present
        agent_exists = any(a['id'] == request.id for a in config['agents'])
        if not agent_exists:
            config['agents'].append({
                "id": request.id,
                "url": request.url
            })

            with open(config_path, 'w') as f:
                json.dump(config, f, indent=4)

        return {
            "success": True,
            "message": f"Agent '{request.id}' added successfully",
            "agent": agent.model_dump(by_alias=True)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add agent: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
