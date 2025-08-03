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
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                    </div>
                    <p className="text-xl gradient-text font-semibold animate-pulse">Loading agent details...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-bounce-in">
                    <div className="text-8xl mb-6">🤖💔</div>
                    <h2 className="text-3xl font-bold gradient-text mb-4">Agent Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                        The agent you're looking for doesn't exist or has been moved.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-pink-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
        <div className="min-h-screen py-12">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${gradient} rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float`}></div>
                <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${gradient} rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float`} style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Back button */}
                <div className="mb-8 animate-bounce-in">
                    <Link 
                        to="/" 
                        className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-full hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900 dark:hover:to-pink-900 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <span className="transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
                        <span className="ml-2">Back to Catalog</span>
                    </Link>
                </div>

                {/* Main content card */}
                <div className="relative group">
                    {/* Glow effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 animate-glow`}></div>
                    
                    <div className="relative glass dark:glass-dark rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header section */}
                        <div className={`relative bg-gradient-to-r ${gradient} p-8 text-white`}>
                            <div className="flex items-center space-x-6 animate-bounce-in">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float">
                                    <span className="text-4xl">🤖</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black mb-2 animate-pulse-slow">
                                        {agent.name}
                                    </h1>
                                    <div className="flex items-center space-x-4">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                                            v{agent.version || '0.1.0'}
                                        </span>
                                        {agent.streaming && (
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium animate-pulse">
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
                            <div className="animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                                <h2 className="text-2xl font-bold gradient-text mb-4">Description</h2>
                                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {agent.description}
                                </p>
                            </div>

                            {/* Skills */}
                            {agent.skills && agent.skills.length > 0 && (
                                <div className="animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                                    <h2 className="text-2xl font-bold gradient-text mb-4">Skills & Capabilities</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {agent.skills.map((skill, index) => (
                                            <div 
                                                key={skill} 
                                                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                                            >
                                                <div className={`w-8 h-8 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
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
                                <div className="animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                                    <h2 className="text-2xl font-bold gradient-text mb-4">Technical Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protocol Version</div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100">v{agent.protocol_version}</div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Agent Version</div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100">v{agent.version || '0.1.0'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-8 animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                                <a
                                    href={agent.homepage_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 text-white font-bold rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                    <span className="relative flex items-center justify-center space-x-2">
                                        <span>🏠</span>
                                        <span>Visit Homepage</span>
                                    </span>
                                </a>
                                <a
                                    href={agent.openapi_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 hover:from-teal-600 hover:to-green-500 text-white font-bold rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                    <span className="relative flex items-center justify-center space-x-2">
                                        <span>📋</span>
                                        <span>OpenAPI Spec</span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDetail;
