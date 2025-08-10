#!/usr/bin/env python3
"""
In-memory tests for the Finance Agent FastMCP Server using fastmcp.Client
"""
import asyncio
from fastmcp import Client
from mcp_agent import create_mcp_server


async def test_in_memory_fastmcp():
    server = create_mcp_server()
    async with Client(server) as client:
        print("\n➡️ Call: stock_price(symbol='AAPL')")
        res = await client.call_tool("stock_price", {"symbol": "AAPL"})
        print(res.data)

        print("\n➡️ Call: sql_query('SELECT symbol, price FROM stocks ORDER BY price DESC LIMIT 2')")
        res = await client.call_tool(
            "sql_query",
            {"query": "SELECT symbol, price FROM stocks ORDER BY price DESC LIMIT 2"},
        )
        print(res.data)

        print("\n➡️ Call: top_stocks_by_volume(limit=3)")
        res = await client.call_tool("top_stocks_by_volume", {"limit": 3})
        print(res.data)

        print("\n➡️ Call: market_summary()")
        res = await client.call_tool("market_summary", {})
        print(res.data)


if __name__ == "__main__":
    asyncio.run(test_in_memory_fastmcp())
