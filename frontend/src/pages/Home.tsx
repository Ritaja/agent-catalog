import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AgentCard, { Agent } from '../components/AgentCard';

const Home: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("name");

    useEffect(() => {
        fetch('/agents')
            .then((res) => res.json())
            .then((data: Agent[]) => {
                setAgents(data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                    </div>
                    <p className="text-xl gradient-text font-semibold animate-pulse">Loading agents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-gray-100 mb-6">
                        Sample Agent Directory
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6">
                        🚀 Explore sample A2A-compatible agent configurations included with this template
                    </p>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                        ✨ Replace these with your own agents to create your internal directory
                    </p>

                    {/* Add Agent Button */}
                    <div className="mb-12">
                        <Link
                            to="/add-agent"
                            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <span className="text-2xl">➕</span>
                            <span className="text-lg">Add New Agent</span>
                        </Link>
                    </div>

                    {/* Search Section */}
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="🔍 Search agents..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 placeholder-gray-400"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm">🔍</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{filtered.length}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">agents found</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Sort by:
                        </label>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 cursor-pointer"
                        >
                            <option value="name">Name</option>
                            <option value="recent">Recently Added</option>
                            <option value="version">Version</option>
                        </select>
                    </div>
                </div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((agent, index) => (
                        <div key={agent.agent_id}>
                            <AgentCard agent={agent} />
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-8xl mb-6">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">No agents found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Try adjusting your search terms or filters
                        </p>
                    </div>
                )}
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

export default Home;
