#!/usr/bin/env python3
"""
A2A Server for Finance Agent
This module defines the Finance Agent and A2A server setup.
"""
import sqlite3
import pandas as pd
import argparse
from python_a2a import run_server, A2AServer, AgentCard, AgentSkill  # type: ignore
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentExecutor, AgentType  # type: ignore
from langchain_ollama import ChatOllama  # type: ignore

# Generate sample stock market data
data = {
    'symbol': ['AAPL', 'GOOG', 'MSFT', 'TSLA', 'AMZN'],
    'price': [150.0, 2800.5, 300.3, 720.1, 3300.2],
    'volume': [1000000, 1500000, 1200000, 800000, 900000]
}
df = pd.DataFrame(data)

# Load data into an in-memory SQLite database


def setup_db():
    conn = sqlite3.connect(':memory:')
    df.to_sql('stocks', conn, index=False, if_exists='replace')
    return conn


conn = setup_db()
cursor = conn.cursor()

# Tool to execute SQL on the sample data


def sql_query_tool(query: str) -> str:
    """Executes a SQL query against the sample stock data."""
    try:
        rows = cursor.execute(query).fetchall()
        return str(rows)
    except Exception as e:
        return f'Error: {e}'


# Wrap the query function into a LangChain Tool
sql_tool = Tool.from_function(
    func=sql_query_tool,
    name='SQLExecutor',
    description='Executes SQL queries on sample stock market data.'
)

# Initialize ChatOllama LLM
# type: ignore
llm = ChatOllama(model='phi4-mini',
                 base_url='http://host.docker.internal:11434')

# Initialize the agent with the SQL tool
agent_executor: AgentExecutor = initialize_agent(
    tools=[sql_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)


def start_a2a_agent(host: str, port: int):
    """Start the A2A server exposing the Finance Agent"""
    # Define A2A agent metadata
    card = AgentCard(
        name="Finance Agent",
        description="Answer finance questions from natural language",
        url=f"http://{host}:{port}",
        version="1.0.0",
        skills=[AgentSkill(
            name="finance_query",
            description="Answer stock data questions",
            examples=["What is the price of AAPL?",
                "Show top 3 stocks by volume"]
        )]
    )

    # Create A2A server subclass
    class FinanceAgentServer(A2AServer):
        def __init__(self):
            super().__init__(agent_card=card)
            self.executor = agent_executor

        def handle_message(self, message):
            result = self.executor.invoke({"input": message.content})
            return {"output": result.get("output")}

    server = FinanceAgentServer()
    run_server(server, host=host, port=port)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Start A2A server for Finance Agent")
    parser.add_argument(
        '--host', default='0.0.0.0',
        help="Host to bind the A2A server (default: 0.0.0.0)"
    )
    parser.add_argument(
        '--port', type=int, default=5053,
        help="Port for the A2A server (default: 5053)"
    )
    args = parser.parse_args()

    print(f"🔧 Starting Finance Agent A2A server on {args.host}:{args.port}")
    start_a2a_agent(host=args.host, port=args.port)
