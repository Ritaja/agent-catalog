import React from 'react';
import { Link } from 'react-router-dom';

export interface Skill {
    id: string;
    name: string;
    description: string;
    examples?: string[];
    tags?: string[];
}

export interface Agent {
    agent_id: string;
    name: string;
    description: string;
    homepage_url: string;
    openapi_url: string;
    version?: string;
    skills?: (string | Skill)[];
    streaming?: boolean;
    protocol_version?: string;
    input_modes?: string[];
    output_modes?: string[];
    supports_auth?: boolean;
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
                        {agent.supports_auth && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                                🔐 Auth Support
                            </span>
                        )}
                        {agent.input_modes && agent.input_modes.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg">
                                📥 {agent.input_modes.join(', ')}
                            </span>
                        )}
                        {agent.output_modes && agent.output_modes.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow-lg">
                                📤 {agent.output_modes.join(', ')}
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
                            <div className="space-y-2">
                                {agent.skills.slice(0, 3).map((skill, index) => {
                                    if (typeof skill === 'string') {
                                        return (
                                            <span 
                                                key={skill} 
                                                className="inline-block text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 mr-1 mb-1"
                                            >
                                                {skill}
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <div key={skill.id || index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {skill.name}
                                                    </span>
                                                    {skill.tags && skill.tags.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {skill.tags.slice(0, 2).map((tag, tagIndex) => (
                                                                <span 
                                                                    key={tagIndex} 
                                                                    className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {skill.description && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                        {skill.description}
                                                    </p>
                                                )}
                                                {skill.examples && skill.examples.length > 0 && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                        <span className="font-medium">Examples: </span>
                                                        <span className="italic">"{skill.examples.slice(0, 2).join('", "')}"</span>
                                                        {skill.examples.length > 2 && <span>...</span>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                })}
                                {agent.skills.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                        +{agent.skills.length - 3} more skills available
                                    </div>
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
