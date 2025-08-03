import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Agent } from '../components/AgentCard';

const AgentDetail: React.FC = () => {
    const { agent_id } = useParams<{ agent_id: string }>();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (agent_id) {
            fetch(`/agents/${agent_id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Agent not found');
                    return res.json();
                })
                .then((data: Agent) => setAgent(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [agent_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700 dark:text-gray-300 font-semibold">Loading agent details...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-8xl mb-6">🤖💔</div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Agent Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                        The agent you're looking for doesn't exist or has been moved.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
                    >
                        ← Back to Catalog
                    </Link>
                </div>
            </div>
        );
    }

    const gradients = [
        'from-purple-400 via-pink-500 to-red-500',
        'from-blue-400 via-purple-500 to-pink-500',
        'from-green-400 via-blue-500 to-purple-500',
        'from-yellow-400 via-orange-500 to-red-500',
        'from-pink-400 via-purple-500 to-indigo-500',
        'from-cyan-400 via-blue-500 to-purple-500',
    ];
    
    const gradient = gradients[Math.abs(agent_id?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % gradients.length];

    return (
        <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button */}
                <div className="mb-8">
                    <Link 
                        to="/" 
                        className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <span>←</span>
                        <span className="ml-2">Back to Catalog</span>
                    </Link>
                </div>

                {/* Main content card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header section */}
                    <div className="bg-blue-600 p-8 text-white">
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-4xl">🤖</span>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black mb-2">
                                    {agent.name}
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                        v{agent.version || '0.1.0'}
                                    </span>
                                    {agent.streaming && (
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                            🚀 Streaming
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content section */}
                    <div className="p-8 space-y-8">
                        {/* Description */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                                {agent.description}
                            </p>
                        </div>

                        {/* Skills */}
                        {agent.skills && agent.skills.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Skills & Capabilities</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {agent.skills.map((skill, index) => (
                                        <div 
                                            key={skill} 
                                            className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                        >
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                ⚡
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Technical Details */}
                        {agent.protocol_version && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Technical Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protocol Version</div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100">v{agent.protocol_version}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Agent Version</div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100">v{agent.version || '0.1.0'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-8">
                            <a
                                href={agent.homepage_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-center transition-all duration-300"
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <span>🏠</span>
                                    <span>Visit Homepage</span>
                                </span>
                            </a>
                            <a
                                href={agent.openapi_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-center transition-all duration-300"
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <span>📋</span>
                                    <span>OpenAPI Spec</span>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDetail;
