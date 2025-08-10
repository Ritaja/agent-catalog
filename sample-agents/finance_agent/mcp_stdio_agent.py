#!/usr/bin/env python3
"""
FastMCP Server using stdio transport (standard for MCP)
"""
import sqlite3
import pandas as pd
import argparse
from fastmcp import FastMCP

# Generate sample stock market data
data = {
    'symbol': ['AAPL', 'GOOG', 'MSFT', 'TSLA', 'AMZN'],
    'price': [150.0, 2800.5, 300.3, 720.1, 3300.2],
    'volume': [1000000, 1500000, 1200000, 800000, 900000]
}
df = pd.DataFrame(data)

# Global database connection
conn = None
cursor = None

def setup_db():
    """Initialize the SQLite database with sample stock data."""
    global conn, cursor
    conn = sqlite3.connect(':memory:')
    df.to_sql('stocks', conn, index=False, if_exists='replace')
    cursor = conn.cursor()
    return conn

# Initialize the MCP server
mcp = FastMCP("Finance Agent")

@mcp.tool
def sql_query_tool(query: str) -> str:
    """
    Executes a SQL query against the sample stock data.
    
    Args:
        query: SQL query string to execute against the stocks table
        
    Returns:
        String representation of query results or error message
    """
    try:
        if cursor is None:
            setup_db()
        
        rows = cursor.execute(query).fetchall()
        
        # Get column names for better formatting
        columns = [description[0] for description in cursor.description]
        
        if not rows:
            return "No results found."
        
        # Format results as a readable table
        result = f"Columns: {', '.join(columns)}\n"
        result += "-" * 50 + "\n"
        for row in rows:
            result += " | ".join(str(value) for value in row) + "\n"
        
        return result
    except Exception as e:
        return f'Error executing query: {e}'

@mcp.tool
def get_stock_price(symbol: str) -> str:
    """
    Get the current price of a specific stock symbol.
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL', 'GOOG', 'MSFT')
        
    Returns:
        Price information for the specified stock symbol
    """
    try:
        if cursor is None:
            setup_db()
            
        query = "SELECT symbol, price FROM stocks WHERE symbol = ? COLLATE NOCASE"
        rows = cursor.execute(query, (symbol.upper(),)).fetchall()
        
        if not rows:
            return f"Stock symbol '{symbol}' not found in database."
        
        symbol, price = rows[0]
        return f"The current price of {symbol} is ${price:.2f}"
    except Exception as e:
        return f'Error getting stock price: {e}'

@mcp.tool
def get_top_stocks_by_volume(limit: int = 3) -> str:
    """
    Get the top stocks by trading volume.
    
    Args:
        limit: Number of top stocks to return (default: 3)
        
    Returns:
        List of top stocks by volume
    """
    try:
        if cursor is None:
            setup_db()
            
        query = "SELECT symbol, volume, price FROM stocks ORDER BY volume DESC LIMIT ?"
        rows = cursor.execute(query, (limit,)).fetchall()
        
        if not rows:
            return "No stock data available."
        
        result = f"Top {limit} stocks by volume:\n"
        result += "-" * 40 + "\n"
        for i, (symbol, volume, price) in enumerate(rows, 1):
            result += f"{i}. {symbol}: {volume:,} shares (${price:.2f})\n"
        
        return result
    except Exception as e:
        return f'Error getting top stocks: {e}'

@mcp.tool
def get_market_summary() -> str:
    """
    Get a summary of the current market data including total volume and average price.
    
    Returns:
        Market summary statistics
    """
    try:
        if cursor is None:
            setup_db()
            
        # Get total volume and average price
        query = "SELECT COUNT(*) as count, SUM(volume) as total_volume, AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM stocks"
        row = cursor.execute(query).fetchone()
        
        if not row:
            return "No market data available."
        
        count, total_volume, avg_price, min_price, max_price = row
        
        result = "Market Summary:\n"
        result += "=" * 30 + "\n"
        result += f"Total stocks tracked: {count}\n"
        result += f"Total trading volume: {total_volume:,} shares\n"
        result += f"Average price: ${avg_price:.2f}\n"
        result += f"Price range: ${min_price:.2f} - ${max_price:.2f}\n"
        
        return result
    except Exception as e:
        return f'Error getting market summary: {e}'

@mcp.resource("stocks://data")
def get_stocks_resource() -> str:
    """
    Provides access to the complete stock market dataset.
    
    Returns:
        Complete stock market data in a readable format
    """
    try:
        if cursor is None:
            setup_db()
            
        query = "SELECT * FROM stocks ORDER BY symbol"
        rows = cursor.execute(query).fetchall()
        
        result = "Complete Stock Market Data:\n"
        result += "=" * 50 + "\n"
        result += "Symbol | Price    | Volume\n"
        result += "-" * 30 + "\n"
        
        for symbol, price, volume in rows:
            result += f"{symbol:<6} | ${price:<7.2f} | {volume:,}\n"
        
        return result
    except Exception as e:
        return f'Error accessing stock data: {e}'

def main():
    """Main function to run the MCP server"""
    parser = argparse.ArgumentParser(description="Finance Agent MCP Server")
    parser.add_argument("--transport", choices=["stdio", "sse", "streamable-http"], 
                       default="stdio", help="Transport method")
    args = parser.parse_args()
    
    # Initialize database
    setup_db()
    
    print(f"🚀 Starting Finance Agent MCP server with {args.transport} transport", flush=True)
    print("Available tools: sql_query_tool, get_stock_price, get_top_stocks_by_volume, get_market_summary", flush=True)
    print("Available resources: stocks://data", flush=True)
    
    # Run the server
    mcp.run(transport=args.transport)

if __name__ == "__main__":
    main()
