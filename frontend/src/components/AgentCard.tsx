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
    protocol?: 'a2a' | 'mcp' | 'hybrid';
    // Optional MCP metadata (augmented on the client)
    mcp?: {
        sseUrl?: string;
        transport?: 'sse' | 'stdio' | 'streamable-http';
        // Enhanced MCP metadata
        tools?: Array<{
            name: string;
            description?: string;
            inputSchema?: any;
        }>;
        resources?: Array<{
            uri: string;
            name?: string;
            description?: string;
            mimeType?: string;
        }>;
        prompts?: Array<{
            name: string;
            description?: string;
            arguments?: Array<{
                name: string;
                description?: string;
                required?: boolean;
            }>;
        }>;
        server_name?: string;
        server_version?: string;
        capabilities?: Record<string, any>;
        last_scanned?: string;
    };
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
                        {/* Protocol badges */}
                        {(!agent.protocol || agent.protocol === 'a2a' || agent.protocol === 'hybrid') && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg">
                                🔌 A2A
                            </span>
                        )}
                        {(agent.protocol === 'mcp' || agent.protocol === 'hybrid' || agent.mcp?.sseUrl) && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg">
                                🧩 MCP{agent.mcp?.transport ? ` (${agent.mcp.transport.toUpperCase()})` : ''}
                            </span>
                        )}
                        {/* MCP Tools Badge */}
                        {agent.mcp?.tools && agent.mcp.tools.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-lg">
                                🔧 {agent.mcp.tools.length} MCP Tools
                            </span>
                        )}
                        {/* MCP Resources Badge */}
                        {agent.mcp?.resources && agent.mcp.resources.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-600 text-white shadow-lg">
                                📁 {agent.mcp.resources.length} Resources
                            </span>
                        )}
                        {/* MCP Prompts Badge */}
                        {agent.mcp?.prompts && agent.mcp.prompts.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-400 to-purple-600 text-white shadow-lg">
                                💬 {agent.mcp.prompts.length} Prompts
                            </span>
                        )}
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

                    {/* Protocol Details */}
                    {(agent.protocol === 'mcp' || agent.protocol === 'hybrid' || agent.mcp) && (
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                            <div className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium flex items-center space-x-2">
                                <span>🧩</span>
                                <span>MCP Server Details</span>
                                {agent.mcp?.last_scanned && (
                                    <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                                        Last scanned: {new Date(agent.mcp.last_scanned).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3 text-xs">
                                {/* Server Info */}
                                {agent.mcp?.server_name && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">Server Name:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                                            {agent.mcp.server_name}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Transport Info */}
                                {agent.mcp?.transport && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">Transport:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-mono uppercase bg-blue-100 dark:bg-blue-800/30 px-2 py-0.5 rounded">
                                            {agent.mcp.transport}
                                        </span>
                                    </div>
                                )}
                                
                                {/* SSE URL */}
                                {agent.mcp?.sseUrl && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">Endpoint:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-mono text-xs bg-blue-100 dark:bg-blue-800/30 px-2 py-0.5 rounded truncate max-w-32" title={agent.mcp.sseUrl}>
                                            {agent.mcp.sseUrl.replace(/^https?:\/\//, '').substring(0, 20)}...
                                        </span>
                                    </div>
                                )}
                                
                                {/* Capabilities Overview */}
                                {agent.mcp?.capabilities && Object.keys(agent.mcp.capabilities).length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                                        <div className="text-blue-600 dark:text-blue-400 mb-2 font-medium">Capabilities:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.keys(agent.mcp.capabilities).map((cap) => (
                                                <span 
                                                    key={cap} 
                                                    className="inline-block text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded-full"
                                                >
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Tools Count */}
                                {agent.mcp?.tools && agent.mcp.tools.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">MCP Tools:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                                            {agent.mcp.tools.length} available
                                        </span>
                                    </div>
                                )}
                                
                                {/* Resources Count */}
                                {agent.mcp?.resources && agent.mcp.resources.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">Resources:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                                            {agent.mcp.resources.length} available
                                        </span>
                                    </div>
                                )}
                                
                                {/* Prompts Count */}
                                {agent.mcp?.prompts && agent.mcp.prompts.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-blue-600 dark:text-blue-400">Prompts:</span>
                                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                                            {agent.mcp.prompts.length} available
                                        </span>
                                    </div>
                                )}
                                
                                {/* Protocol Note */}
                                {agent.protocol === 'hybrid' && (
                                    <div className="text-blue-600 dark:text-blue-400 italic mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                                        This agent supports both A2A and MCP protocols
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
