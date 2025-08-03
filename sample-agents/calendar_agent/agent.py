#!/usr/bin/env python3
"""
A2A Server for Calendar Agent
This module defines the Calendar Agent and A2A server setup.
"""
import sqlite3
import pandas as pd
import argparse
from python_a2a import run_server, A2AServer, AgentCard, AgentSkill  # type: ignore
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentExecutor, AgentType  # type: ignore
from langchain_ollama import ChatOllama  # type: ignore

# Sample calendar events data
events_data = {
    'id': [1, 2, 3],
    'title': ['Team Standup', 'Project Deadline', 'One-on-One'],
    'date': ['2025-08-03', '2025-08-15', '2025-08-05'],
    'time': ['09:00', '17:00', '11:00']
}
df_events = pd.DataFrame(events_data)

# Load data into an in-memory SQLite database


def setup_db():
    conn = sqlite3.connect(':memory:')
    df_events.to_sql('events', conn, index=False, if_exists='replace')
    return conn


conn = setup_db()
cursor = conn.cursor()

# Tool to execute SQL on the sample events data


def events_sql_tool(query: str) -> str:
    """Executes SQL queries on sample calendar events data."""
    try:
        rows = cursor.execute(query).fetchall()
        return str(rows)
    except Exception as e:
        return f"Error: {e}"


# Wrap the events query function into a LangChain Tool
events_tool = Tool.from_function(
    func=events_sql_tool,
    name='EventsSQL',
    description='Executes SQL queries on sample calendar events for personal productivity.'
)

# Initialize ChatOllama LLM
# type: ignore
llm = ChatOllama(model='phi4-mini',
                 base_url='http://ollama:11434')

# Initialize the agent with the events tool
agent_executor: AgentExecutor = initialize_agent(
    tools=[events_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)


def start_a2a_agent(host: str, port: int):
    """Start the A2A server exposing the Calendar Agent"""
    # Define A2A agent metadata
    card = AgentCard(
        name="Calendar Agent",
        description="Query your calendar events with natural language",
        url=f"http://{host}:{port}",
        version="1.0.0",
        skills=[AgentSkill(
            name="events_query",
            description="Answer questions about calendar events",
            examples=["What events are today?", "List all upcoming events"]
        )]
    )

    # Create A2A server subclass
    class CalendarAgentServer(A2AServer):
        def __init__(self):
            super().__init__(agent_card=card)
            self.executor = agent_executor

        def handle_message(self, message):
            result = self.executor.invoke({"input": message.content})
            return {"output": result.get("output")}

    server = CalendarAgentServer()
    run_server(server, host=host, port=port)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Start A2A server for Calendar Agent")
    parser.add_argument(
        '--host', default='0.0.0.0',
        help="Host to bind the A2A server (default: 0.0.0.0)"
    )
    parser.add_argument(
        '--port', type=int, default=5052,
        help="Port for the A2A server (default: 5052)"
    )
    args = parser.parse_args()

    print(f"🔧 Starting Calendar Agent A2A server on {args.host}:{args.port}")
    start_a2a_agent(host=args.host, port=args.port)
