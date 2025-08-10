import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AgentCard from '../components/AgentCard';
import type { Agent } from '../components/AgentCard';

interface TestResult {
    success: boolean;
    agent?: Agent;
    error?: string;
}

const AddAgent: React.FC = () => {
    const [url, setUrl] = useState('');
    const [agentId, setAgentId] = useState('');
    const [protocol, setProtocol] = useState<'a2a' | 'mcp' | 'hybrid'>('a2a');
    const [mcpTransport, setMcpTransport] = useState<'sse' | 'stdio' | 'streamable-http' | ''>('');
    const [mcpSseUrl, setMcpSseUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    const testUrl = async () => {
        if (!url.trim()) {
            setTestResult({ success: false, error: 'Please enter a valid URL' });
            return;
        }

        setIsLoading(true);
        setTestResult(null);

        try {
            const response = await fetch(`http://localhost:8000/test-agent-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: url.trim(),
                    protocol,
                    mcp: mcpTransport || mcpSseUrl ? {
                        transport: mcpTransport || undefined,
                        sseUrl: mcpSseUrl || undefined,
                    } : undefined
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setTestResult({
                    success: true,
                    agent: result.agent,
                });
                // Auto-fill agent ID if not provided
                if (!agentId && result.agent?.agent_id) {
                    setAgentId(result.agent.agent_id);
                }
            } else {
                setTestResult({
                    success: false,
                    error: result.detail || 'Failed to test URL',
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                error: 'Network error: Unable to connect to backend',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addAgent = async () => {
    if (!url.trim() || !agentId.trim()) {
            alert('Please provide both URL and Agent ID');
            return;
        }

        if (!testResult?.success) {
            alert('Please test the URL first to ensure it\'s valid');
            return;
        }

        setIsAdding(true);

        try {
            const response = await fetch(`http://localhost:8000/add-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    id: agentId.trim(),
                    url: url.trim(),
                    protocol,
                    mcp: mcpTransport || mcpSseUrl ? {
                        transport: mcpTransport || undefined,
                        sseUrl: mcpSseUrl || undefined,
                    } : undefined
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setAddSuccess(true);
                // Reset form
                setUrl('');
                setAgentId('');
                setTestResult(null);
            } else {
                alert(result.detail || 'Failed to add agent');
            }
        } catch (error) {
            alert('Network error: Unable to connect to backend');
        } finally {
            setIsAdding(false);
        }
    };

    const resetForm = () => {
        setUrl('');
        setAgentId('');
    setProtocol('a2a');
    setMcpTransport('');
    setMcpSseUrl('');
        setTestResult(null);
        setAddSuccess(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <Link
                            to="/"
                            className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors mr-8"
                        >
                            <span className="text-xl">←</span>
                            <span className="font-semibold">Back to Catalog</span>
                        </Link>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl">➕</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-gray-100 mb-4">
                        Add New Agent
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Discover and add new agents supporting A2A protocol, MCP (Model Context Protocol), or hybrid implementations. Test the connection and preview the agent before adding it to the catalog.
                    </p>
                </div>

                {/* Success Message */}
                {addSuccess && (
                    <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">✅</span>
                            <div>
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                                    Agent Added Successfully!
                                </h3>
                                <p className="text-green-600 dark:text-green-300">
                                    The agent has been added to the catalog and is now available for use.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex space-x-4">
                            <Link
                                to="/"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                View Catalog
                            </Link>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Add Another
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Form Section */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                Agent Configuration
                            </h2>

                            <div className="space-y-6">
                                {/* Protocol */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Protocol
                                    </label>
                                    <div className="flex gap-3">
                                        {(['a2a','mcp','hybrid'] as const).map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setProtocol(p)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${protocol===p? 'bg-purple-600 text-white border-purple-600':'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                                            >
                                                {p.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Choose whether this is an A2A agent, an MCP server, or supports both (Hybrid).
                                    </p>
                                </div>

                                {/* Agent URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Agent URL
                                    </label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="http://localhost:5054"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        The base URL where your agent is running. For MCP SSE, this may be the server origin.
                                    </p>
                                </div>

                                {/* Agent ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Agent ID
                                    </label>
                                    <input
                                        type="text"
                                        value={agentId}
                                        onChange={(e) => setAgentId(e.target.value)}
                                        placeholder="my_custom_agent"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Unique identifier for the agent (will be auto-filled after testing)
                                    </p>
                                </div>

                                {/* MCP Details */}
                                {(protocol === 'mcp' || protocol === 'hybrid') && (
                                    <div className="space-y-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">MCP Details</div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Transport</label>
                                            <select
                                                value={mcpTransport}
                                                onChange={(e) => setMcpTransport(e.target.value as any)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="">Select transport (optional)</option>
                                                <option value="sse">SSE</option>
                                                <option value="stdio">STDIO</option>
                                                <option value="streamable-http">Streamable HTTP</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">SSE URL</label>
                                            <input
                                                type="url"
                                                value={mcpSseUrl}
                                                onChange={(e) => setMcpSseUrl(e.target.value)}
                                                placeholder="http://localhost:5054/sse"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Required for SSE transport.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Test Button */}
                                <button
                                    onClick={testUrl}
                                    disabled={isLoading || !url.trim()}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Testing Connection...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>🔍</span>
                                            <span>Test URL</span>
                                        </span>
                                    )}
                                </button>

                                {/* Test Results */}
                                {testResult && (
                                    <div className={`p-4 rounded-lg ${testResult.success 
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                                    }`}>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xl">
                                                {testResult.success ? '✅' : '❌'}
                                            </span>
                                            <span className={`font-medium ${testResult.success 
                                                ? 'text-green-800 dark:text-green-200' 
                                                : 'text-red-800 dark:text-red-200'
                                            }`}>
                                                {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                                            </span>
                                        </div>
                                        {testResult.error && (
                                            <p className="mt-2 text-red-600 dark:text-red-300 text-sm">
                                                {testResult.error}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Add Agent Button */}
                                {testResult?.success && (
                                    <button
                                        onClick={addAgent}
                                        disabled={isAdding || !agentId.trim()}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                                    >
                                        {isAdding ? (
                                            <span className="flex items-center justify-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Adding Agent...</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center space-x-2">
                                                <span>➕</span>
                                                <span>Add Agent to Catalog</span>
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                                <span>💡</span>
                                <span>Tips for Adding Agents</span>
                            </h3>
                            <ul className="text-blue-600 dark:text-blue-300 text-sm space-y-2">
                                <li>• <strong>A2A Agents:</strong> Ensure your agent is running and accessible at the provided URL</li>
                                <li>• <strong>MCP Servers:</strong> Provide transport details (SSE URL for Server-Sent Events)</li>
                                <li>• <strong>Hybrid Agents:</strong> Support both A2A and MCP protocols</li>
                                <li>• Testing will validate the connection and fetch agent metadata</li>
                                <li>• Agent ID should be unique and descriptive</li>
                                <li>• For MCP SSE transport, ensure the SSE endpoint is accessible</li>
                            </ul>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                Agent Preview
                            </h2>

                            {!testResult && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl">🔍</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Test a URL to see the agent preview
                                    </p>
                                </div>
                            )}

                            {testResult && !testResult.success && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl">❌</span>
                                    </div>
                                    <p className="text-red-600 dark:text-red-300">
                                        Unable to fetch agent data
                                    </p>
                                </div>
                            )}

                            {testResult?.success && testResult.agent && (
                                <div className="space-y-6">
                                    {/* Protocol-specific Information */}
                                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                                            <span>🔌</span>
                                            <span>Protocol Information</span>
                                        </h3>
                                        
                                        <div className="grid gap-4">
                                            {/* Protocol Type */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Protocol Type:</span>
                                                <div className="flex gap-2">
                                                    {(!testResult.agent.protocol || testResult.agent.protocol === 'a2a' || testResult.agent.protocol === 'hybrid') && (
                                                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                                                            A2A
                                                        </span>
                                                    )}
                                                    {(testResult.agent.protocol === 'mcp' || testResult.agent.protocol === 'hybrid' || testResult.agent.mcp) && (
                                                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                                                            MCP
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* A2A Details */}
                                            {(!testResult.agent.protocol || testResult.agent.protocol === 'a2a' || testResult.agent.protocol === 'hybrid') && (
                                                <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                                        <span>🔌</span>
                                                        <span>A2A Protocol Details</span>
                                                    </div>
                                                    <div className="grid gap-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                                            <span className="text-gray-900 dark:text-gray-100 font-mono">
                                                                {testResult.agent.protocol_version || 'v0.2.6'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">OpenAPI URL:</span>
                                                            <span className="text-blue-600 dark:text-blue-400 font-mono text-xs truncate max-w-48">
                                                                {testResult.agent.openapi_url}
                                                            </span>
                                                        </div>
                                                        {testResult.agent.streaming !== undefined && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Streaming:</span>
                                                                <span className={`font-medium ${testResult.agent.streaming ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {testResult.agent.streaming ? '✅ Enabled' : '❌ Disabled'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {testResult.agent.supports_auth !== undefined && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Auth Support:</span>
                                                                <span className={`font-medium ${testResult.agent.supports_auth ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {testResult.agent.supports_auth ? '🔐 Supported' : '❌ Not Supported'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* MCP Details */}
                                            {(testResult.agent.protocol === 'mcp' || testResult.agent.protocol === 'hybrid' || testResult.agent.mcp) && (
                                                <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center space-x-2">
                                                        <span>🧩</span>
                                                        <span>MCP Protocol Details</span>
                                                    </div>
                                                    <div className="grid gap-2 text-sm">
                                                        {testResult.agent.mcp?.transport && (
                                                            <div className="flex justify-between">
                                                                <span className="text-blue-600 dark:text-blue-400">Transport:</span>
                                                                <span className="text-blue-900 dark:text-blue-100 font-mono uppercase">
                                                                    {testResult.agent.mcp.transport}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {testResult.agent.mcp?.sseUrl && (
                                                            <div className="flex justify-between">
                                                                <span className="text-blue-600 dark:text-blue-400">SSE URL:</span>
                                                                <span className="text-blue-900 dark:text-blue-100 font-mono text-xs truncate max-w-48">
                                                                    {testResult.agent.mcp.sseUrl}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!testResult.agent.mcp?.transport && !testResult.agent.mcp?.sseUrl && (
                                                            <div className="text-blue-600 dark:text-blue-400 text-xs italic">
                                                                MCP server detected - specific transport details not provided
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skills Preview */}
                                            {testResult.agent.skills && testResult.agent.skills.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Available Skills ({testResult.agent.skills.length}):
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {testResult.agent.skills.slice(0, 6).map((skill, index) => (
                                                            <span
                                                                key={typeof skill === 'string' ? skill : skill.id || index}
                                                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
                                                            >
                                                                {typeof skill === 'string' ? skill : skill.name}
                                                            </span>
                                                        ))}
                                                        {testResult.agent.skills.length > 6 && (
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                                                +{testResult.agent.skills.length - 6} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Agent Card Preview */}
                                    <div>
                                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                            This is how the agent will appear in the catalog:
                                        </div>
                                        <AgentCard agent={testResult.agent} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Watermark */}
            <div className="text-center py-8">
                <p className="text-xs text-gray-400 dark:text-gray-600 font-light">
                    Conceptualized by Ritaja
                </p>
            </div>
        </div>
    );
};

export default AddAgent;
