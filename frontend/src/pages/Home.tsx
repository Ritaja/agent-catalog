import React, { useEffect, useState } from 'react';
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
                <div className="text-center mb-16 animate-bounce-in">
                    <div className="relative inline-block mb-6">
                        <h1 className="text-6xl md:text-7xl font-black gradient-text-rainbow mb-4 animate-pulse-slow">
                            Sample Agent Directory
                        </h1>
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-glow"></div>
                    </div>
                    
                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                        🚀 Explore sample A2A-compatible agent configurations included with this template
                    </p>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                        ✨ Replace these with your own agents to create your internal directory
                    </p>

                    {/* Search Section */}
                    <div className="max-w-2xl mx-auto mb-12 animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Search agents..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-800 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-600 transition-all duration-300 placeholder-gray-400"
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">🔍</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
                    <div className="glass dark:glass-dark px-6 py-3 rounded-2xl animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-text">{filtered.length}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">agents found</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 animate-bounce-in" style={{ animationDelay: '1s' }}>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Sort by:
                        </label>
                        <div className="relative group">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 cursor-pointer hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800 dark:hover:to-pink-800"
                            >
                                <option value="name">Name</option>
                                <option value="recent">Recently Added</option>
                                <option value="version">Version</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((agent, index) => (
                        <div 
                            key={agent.agent_id} 
                            className="animate-bounce-in"
                            style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                        >
                            <AgentCard agent={agent} />
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="text-center py-20 animate-bounce-in">
                        <div className="text-8xl mb-6">🔍</div>
                        <h3 className="text-2xl font-bold gradient-text mb-4">No agents found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Try adjusting your search terms or filters
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
