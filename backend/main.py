from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict
import json
import httpx
import os
import asyncio


class Agent(BaseModel):
    id: str = Field(..., alias="agent_id")
    name: str
    description: str
    homepage_url: str
    openapi_url: str
    version: str = "1.0.0"
    skills: List[str] = []
    streaming: bool = False
    protocol_version: str = "v0.2.6"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


AGENTS_DB: Dict[str, Agent] = {}


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
        name = card.get('name', agent_id)
        description = card.get('description', '')
    except (httpx.RequestError, json.JSONDecodeError):
        name = agent_id
        description = ''

    mock_data = sample_data.get(agent_id, {})

    return Agent(
        agent_id=agent_id,
        name=name,
        description=description,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
