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
                body: JSON.stringify({ url: url.trim() }),
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
                    url: url.trim() 
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
                        Discover and add new A2A agents by providing their URL. Test the connection and preview the agent before adding it to the catalog.
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
                                        The base URL where your A2A agent is running
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
                                <li>• Ensure your agent is running and accessible at the provided URL</li>
                                <li>• The agent should implement the A2A protocol endpoints</li>
                                <li>• Testing will validate the connection and fetch agent metadata</li>
                                <li>• Agent ID should be unique and descriptive</li>
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
                                <div>
                                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                        This is how the agent will appear in the catalog:
                                    </div>
                                    <AgentCard agent={testResult.agent} />
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
