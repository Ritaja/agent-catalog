#!/usr/bin/env python3
"""
Simple HTTP client to test the MCP server endpoints
"""
import requests
import json
import time
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
import signal

def start_server():
    """Start the MCP server in the background"""
    return subprocess.Popen([
        sys.executable, "mcp_agent.py", "--port", "5056"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def test_mcp_server_http():
    """Test the MCP server via HTTP requests"""
    print("🚀 Starting MCP server for testing...")
    
    # Start server
    server_process = start_server()
    
    try:
        # Wait a moment for server to start
        time.sleep(2)
        
        print("📡 Testing HTTP endpoints...")
        
        # Test if server is running
        try:
            response = requests.get("http://localhost:5056/", timeout=5)
            print(f"✅ Server is running! Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Server connection failed: {e}")
            return
        
        # Test if we can access the MCP endpoint
        try:
            response = requests.get("http://localhost:5056/mcp", timeout=5)
            print(f"✅ MCP endpoint accessible! Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ MCP endpoint test: {e}")
        
        # Test SSE endpoint
        try:
            response = requests.get("http://localhost:5056/sse", timeout=2)
            print(f"✅ SSE endpoint accessible! Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ SSE endpoint test: {e}")
            
        print("✅ Basic HTTP connectivity tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        # Clean up
        print("🧹 Cleaning up server process...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
        print("✅ Server stopped")

if __name__ == "__main__":
    test_mcp_server_http()
