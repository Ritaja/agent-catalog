import React, { useEffect, useState } from 'react';
import AgentCard, { Agent } from '../components/AgentCard';

const Home: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");

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
        return <p className="text-center py-10">Loading agents...</p>;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Sample Agent Directory
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                        Explore sample A2A-compatible agent configurations included with this template
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
                        Replace these with your own agents to create your internal directory
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {filtered.length} agents found
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                            Sort by:
                        </label>
                        <select className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm">
                            <option>Name</option>
                            <option>Recently Added</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filtered.map(agent => (
                        <AgentCard key={agent.id} agent={agent} />
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No agents found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
