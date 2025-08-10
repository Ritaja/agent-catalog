# Finance Agent - A2A and FastMCP Server

This directory contains a Finance Agent that can be run as either an A2A (Agent-to-Agent) server or an MCP (Model Context Protocol) server.

## Features

The Finance Agent provides tools to query sample stock market data including:

- SQL query execution on stock data
- Stock price lookups
- Top stocks by volume
- Market summary statistics

## Sample Data

The agent uses sample stock data with the following stocks:

- AAPL: $150.00 (1M volume)
- GOOG: $2800.50 (1.5M volume)
- MSFT: $300.30 (1.2M volume)
- TSLA: $720.10 (800K volume)
- AMZN: $3300.20 (900K volume)

## Running the Servers

### A2A Server (Original)

```bash
# Start A2A server on default port 5053
python agent.py

# Start A2A server with custom host/port
python agent.py --host 0.0.0.0 --port 5053 --server-type a2a
```

### MCP Server (FastMCP)

There are three MCP server implementations:

#### 1. HTTP/SSE MCP Server (FastMCP)

```bash
# Start HTTP-based FastMCP server (SSE transport)
python mcp_agent.py --port 5055 --transport sse
```

#### 2. Stdio MCP Server (Standard)

```bash
# Start stdio-based FastMCP server (standard for MCP)
python mcp_stdio_agent.py --transport stdio
```

#### 3. Unified Agent with MCP option

```bash
# Start MCP server using the unified agent file (SSE transport)
python agent.py --server-type mcp --port 5054
```

## Available Tools

### SQL Query Tool

Execute arbitrary SQL queries against the stocks table:

```sql
SELECT * FROM stocks;
SELECT symbol, price FROM stocks WHERE price > 1000;
SELECT symbol FROM stocks ORDER BY volume DESC LIMIT 3;
```

### Stock Price Tool

Get the price of a specific stock:

```python
get_stock_price("AAPL")  # Returns: "The current price of AAPL is $150.00"
```

### Top Stocks by Volume

Get the top N stocks by trading volume:

```python
get_top_stocks_by_volume(3)  # Returns top 3 stocks by volume
```

### Market Summary

Get overall market statistics:

```python
get_market_summary()  # Returns total volume, average price, etc.
```

## MCP Resources

The MCP server also provides a resource:

- `stocks://data` - Complete stock market dataset

## Dependencies

Install required packages:

```bash
pip install -r requirements.txt
```

Key dependencies:

- `fastmcp` - FastMCP library for MCP server (replaces `mcp`)
- `python_a2a` - A2A server library
- `pandas` - Data manipulation
- `sqlite3` - Database (built-in)

## Testing

### Test Functions Directly

```bash
python test_functions.py
```

### In-Memory FastMCP Testing (recommended)

Uses fastmcp's Client to test the server in-memory (no separate process):

```bash
python test_mcp.py
```

### Test MCP Server HTTP Connectivity (optional)

```bash
python test_server.py
```

### Test MCP Server Stdio (manual JSON-RPC)

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | python mcp_stdio_agent.py
```

## Inspect with MCP Inspector

Use the official MCP Inspector to debug and explore the Finance Agent MCP server.

1. Install MCP Inspector (once):

```bash
npm install -g @modelcontextprotocol/inspector
```

2. Inspect SSE server (HTTP)

- Start the SSE server:

```bash
python mcp_agent.py --port 5055 --transport sse
```

- In another terminal, launch the Inspector UI:

```bash
npx @modelcontextprotocol/inspector
```

- Open the browser (auto-opens or visit http://localhost:6274), set:
  - Transport: SSE
  - Server URL: http://localhost:5055/sse
  - Click Connect, then explore Tools and Resources

CLI alternative (SSE):

```bash
npx @modelcontextprotocol/inspector --cli http://localhost:5055/sse --method tools/list
```

3. Inspect stdio server

- Start stdio server (it reads/write on stdio):

```bash
python mcp_stdio_agent.py --transport stdio
```

- In a separate terminal, point Inspector to the stdio command:

```bash
npx @modelcontextprotocol/inspector --cli python mcp_stdio_agent.py --transport stdio --method tools/list
```

UI mode for stdio:

```bash
npx @modelcontextprotocol/inspector
```

- In the UI set:
  - Transport: stdio
  - Server Command: python
  - Server Args: mcp_stdio_agent.py --transport stdio
  - Click Connect

Tips:

- The Inspector prints a session token in the console and opens your browser with it pre-filled.
- For SSE, you can also set the URL directly via query string, e.g.: http://localhost:6274/?transport=sse&serverUrl=http://localhost:5055/sse

## Architecture

- **agent.py** - A2A agent with optional FastMCP support
- **mcp_agent.py** - HTTP/SSE FastMCP server implementation; also exposes `create_mcp_server()` for in-memory tests
- **mcp_stdio_agent.py** - Stdio FastMCP server implementation (recommended)
- **test_functions.py** - Test all finance functions
- **test_mcp.py** - In-memory FastMCP Client tests (no server process required)
- **test_server.py** - Test HTTP server connectivity

## MCP Protocol Support

The FastMCP servers support the full Model Context Protocol including:

- Tool discovery and execution
- Resource access
- JSON-RPC 2.0 communication
- Both stdio and HTTP transports

The FastMCP version provides better tool definition, automatic documentation, and standardized protocol support compared to the A2A version.
