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
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out group">
            <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                v{agent.version || '0.1.0'}
            </div>
            <div className="p-6 flex items-start">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {agent.name}
                    </h3>

                    {agent.version && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            v{agent.version}
                        </div>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {agent.description}
                    </p>

                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {agent.streaming && <span>🚀 Streaming</span>}
                        {agent.skills && agent.skills.length > 0 && (
                            <span>
                                {agent.streaming ? ' • ' : ''}Skills ({agent.skills.length})
                            </span>
                        )}
                        {agent.skills && agent.skills.length > 0 && (
                            <span>
                                {' • '}
                                {agent.skills.slice(0, 2).join(' • ')}
                                {agent.skills.length > 2 && ' • ...'}
                            </span>
                        )}
                        {agent.protocol_version && (
                            <span> • Protocol v{agent.protocol_version}</span>
                        )}
                    </div>
                    <Link
                        to={`/agents/${agent.agent_id}`}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        View Details →
                    </Link>
                </div>
            </div>
            <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-all duration-300 ease-in-out pointer-events-none"></div>
            <div className="absolute inset-0 rounded-lg group-hover:bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-20 transition-all duration-300 ease-in-out pointer-events-none"></div>
        </div>
    );
};

export default AgentCard;
