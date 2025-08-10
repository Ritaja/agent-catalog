#!/usr/bin/env python3
"""
Run all sample agents concurrently: finance (both A2A and MCP), calendar, and task agents.
The finance agent runs in both A2A and MCP modes on different ports for comparison.
"""
import subprocess
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HOST = '0.0.0.0'

# Define agent names, ports, and server types
AGENTS = [
    ('finance_agent', 5053, 'a2a'),      # Finance agent as A2A server
    ('finance_agent', 5054, 'mcp'),      # Finance agent as MCP server
    ('calendar_agent', 5052, 'a2a'),     # Calendar agent (A2A only)
    ('task_agent', 5051, 'a2a'),         # Task agent (A2A only)
]

processes = []

try:
    for name, port, server_type in AGENTS:
        # Choose the correct entrypoint for finance MCP vs A2A
        if name == 'finance_agent' and server_type == 'mcp':
            script_path = os.path.join(SCRIPT_DIR, name, 'mcp_agent.py')
        else:
            script_path = os.path.join(SCRIPT_DIR, name, 'agent.py')

        # Build command arguments
        cmd_args = [
            sys.executable,
            script_path,
            '--host', HOST,
            '--port', str(port)
        ]

        # Finance agent specifics
        if name == 'finance_agent':
            if server_type == 'mcp':
                # Use SSE transport for the HTTP-based FastMCP server
                cmd_args.extend(['--transport', 'sse'])
                print(f"Starting {name} on port {port} (MCP via SSE)...")
            else:
                # A2A mode handled by agent.py
                cmd_args.extend(['--server-type', 'a2a'])
                print(f"Starting {name} on port {port} (A2A mode)...")
        else:
            print(f"Starting {name} on port {port}...")

        p = subprocess.Popen(cmd_args)
        processes.append((f"{name}_{server_type}", p))

    print("All agents started:")
    print("  - Finance Agent (A2A): http://0.0.0.0:5053")
    print("  - Finance Agent (MCP - SSE): http://0.0.0.0:5054")
    print("  - Calendar Agent (A2A): http://0.0.0.0:5052")
    print("  - Task Agent (A2A): http://0.0.0.0:5051")
    print("\nPress Ctrl+C to exit.")
    # Keep the main thread alive while agents run
    import time
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down agents...")
    for name, p in processes:
        p.terminate()
    sys.exit(0)
