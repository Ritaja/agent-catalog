#!/usr/bin/env python3
"""
Run all A2A sample agents concurrently: finance, calendar, and task agents.
"""
import subprocess
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HOST = '0.0.0.0'

# Define agent names and ports
AGENTS = [
    ('finance_agent', 5053),
    ('calendar_agent', 5052),
    ('task_agent', 5051),
]

processes = []

try:
    for name, port in AGENTS:
        script_path = os.path.join(SCRIPT_DIR, name, 'agent.py')
        print(f"Starting {name} on port {port}...")
        p = subprocess.Popen([
            sys.executable,
            script_path,
            '--host', HOST,
            '--port', str(port)
        ])
        processes.append((name, p))

    print("All agents started. Press Ctrl+C to exit.")
    # Keep the main thread alive while agents run
    import time
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down agents...")
    for name, p in processes:
        p.terminate()
    sys.exit(0)
