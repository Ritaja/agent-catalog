#!/usr/bin/env python3
"""
A2A Server for Task Agent
This module defines the Task Agent and A2A server setup.
"""
import sqlite3
import pandas as pd
import argparse
from python_a2a import run_server, A2AServer, AgentCard, AgentSkill  # type: ignore
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentExecutor, AgentType  # type: ignore
from langchain_ollama import ChatOllama  # type: ignore

# Sample tasks data
tasks_data = {
    'id': [1, 2, 3],
    'task': ['Write report', 'Schedule meeting', 'Review PR'],
    'completed': [False, False, False]
}
df_tasks = pd.DataFrame(tasks_data)

# Load data into an in-memory SQLite database


def setup_db():
    conn = sqlite3.connect(':memory:')
    df_tasks.to_sql('tasks', conn, index=False, if_exists='replace')
    return conn


conn = setup_db()
cursor = conn.cursor()

# Tool to query tasks using SQL


def tasks_sql_tool(query: str) -> str:
    """Executes SQL queries on sample tasks data."""
    try:
        rows = cursor.execute(query).fetchall()
        return str(rows)
    except Exception as e:
        return f"Error: {e}"


# Wrap the tasks query function into a LangChain Tool
tasks_tool = Tool.from_function(
    func=tasks_sql_tool,
    name='TasksSQL',
    description='Executes SQL queries on sample tasks for personal productivity.'
)

# Initialize ChatOllama LLM
# type: ignore
llm = ChatOllama(model='phi4-mini',
                 base_url='http://ollama:11434')

# Initialize the agent with the tasks tool
agent_executor: AgentExecutor = initialize_agent(
    tools=[tasks_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)


def start_a2a_agent(host: str, port: int):
    """Start the A2A server exposing the Task Agent"""
    # Define A2A agent metadata
    card = AgentCard(
        name="Task Agent",
        description="Query and manage tasks with natural language",
        url=f"http://{host}:{port}",
        version="1.0.0",
        skills=[AgentSkill(
            name="tasks_query",
            description="Answer questions about tasks",
            examples=["Show all incomplete tasks", "List completed tasks"]
        )]
    )

    # Create A2A server subclass
    class TaskAgentServer(A2AServer):
        def __init__(self):
            super().__init__(agent_card=card)
            self.executor = agent_executor

        def handle_message(self, message):
            result = self.executor.invoke({"input": message.content})
            return {"output": result.get("output")}

    server = TaskAgentServer()
    run_server(server, host=host, port=port)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Start A2A server for Task Agent")
    parser.add_argument('--host', default='0.0.0.0',
                        help="Host to bind the A2A server (default: 0.0.0.0)")
    parser.add_argument('--port', type=int, default=5051,
                        help="Port for the A2A server (default: 5051)")
    args = parser.parse_args()

    print(f"🔧 Starting Task Agent A2A server on {args.host}:{args.port}")
    start_a2a_agent(host=args.host, port=args.port)
