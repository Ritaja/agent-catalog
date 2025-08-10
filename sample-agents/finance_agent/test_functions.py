#!/usr/bin/env python3
"""
Test the Finance Agent MCP server functions directly
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mcp_agent import setup_db, sql_query_tool, get_stock_price, get_top_stocks_by_volume, get_market_summary, get_stocks_resource

def test_functions():
    """Test all the finance agent functions"""
    print("🧪 Testing Finance Agent MCP Functions")
    print("=" * 50)
    
    # Initialize database
    setup_db()
    print("✅ Database initialized")
    
    # Test SQL query tool
    print("\n1. Testing SQL Query Tool:")
    result = sql_query_tool("SELECT * FROM stocks")
    print(result)
    
    # Test get stock price
    print("\n2. Testing Get Stock Price:")
    result = get_stock_price("AAPL")
    print(result)
    
    # Test get top stocks by volume
    print("\n3. Testing Get Top Stocks by Volume:")
    result = get_top_stocks_by_volume(3)
    print(result)
    
    # Test market summary
    print("\n4. Testing Market Summary:")
    result = get_market_summary()
    print(result)
    
    # Test stocks resource
    print("\n5. Testing Stocks Resource:")
    result = get_stocks_resource()
    print(result)
    
    print("\n✅ All tests completed successfully!")

if __name__ == "__main__":
    test_functions()
