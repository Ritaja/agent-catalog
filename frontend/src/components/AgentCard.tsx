import React from 'react';
import { Link } from 'react-router-dom';

export interface Agent {
    agent_id: string;
    name: string;
    description: string;
    homepage_url: string;
    openapi_url: string;
    version?: string;
    skills?: string[];
    streaming?: boolean;
    protocol_version?: string;
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    const gradients = [
        'from-purple-400 via-pink-500 to-red-500',
        'from-blue-400 via-purple-500 to-pink-500',
        'from-green-400 via-blue-500 to-purple-500',
        'from-yellow-400 via-orange-500 to-red-500',
        'from-pink-400 via-purple-500 to-indigo-500',
        'from-cyan-400 via-blue-500 to-purple-500',
    ];
    
    const gradient = gradients[Math.abs(agent.agent_id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % gradients.length];

    return (
        <div className="group relative">
            {/* Glow effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-glow`}></div>
            
            {/* Card */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all duration-500 ease-out group-hover:shadow-2xl">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} animate-gradient`}></div>
                </div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12"></div>
                </div>

                {/* Version badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div className={`bg-gradient-to-r ${gradient} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse-slow`}>
                        v{agent.version || '0.1.0'}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-8">
                    {/* Agent Icon */}
                    <div className="mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 animate-float`}>
                            <span className="text-2xl font-bold text-white">🤖</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                        {agent.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-lg">
                        {agent.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {agent.streaming && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg animate-pulse">
                                🚀 Streaming
                            </span>
                        )}
                        {agent.skills && agent.skills.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg">
                                ⚡ {agent.skills.length} Skills
                            </span>
                        )}
                        {agent.protocol_version && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg">
                                🔧 Protocol v{agent.protocol_version}
                            </span>
                        )}
                    </div>

                    {/* Skills Preview */}
                    {agent.skills && agent.skills.length > 0 && (
                        <div className="mb-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Available Skills:</div>
                            <div className="flex flex-wrap gap-1">
                                {agent.skills.slice(0, 3).map((skill, index) => (
                                    <span key={skill} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                                        {skill}
                                    </span>
                                ))}
                                {agent.skills.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                                        +{agent.skills.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <Link
                        to={`/agents/${agent.agent_id}`}
                        className="group/btn relative inline-flex items-center justify-center w-full px-6 py-3 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} transition-all duration-300 group-hover/btn:scale-110`}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"></div>
                        <span className="relative flex items-center space-x-2">
                            <span>View Details</span>
                            <span className="transform group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                        </span>
                    </Link>
                </div>

                {/* Corner decoration */}
                <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                    <div className={`w-full h-full bg-gradient-to-tl ${gradient} transform rotate-45 translate-x-16 translate-y-16`}></div>
                </div>
            </div>
        </div>
    );
};

export default AgentCard;
