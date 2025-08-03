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
        return <p className="text-center">Loading agent details...</p>;
    }

    if (!agent) {
        return <p className="text-center text-red-500">Agent not found</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-gray-900 dark:text-gray-100 space-y-8">
                <Link to="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    &larr;&nbsp;Back to Catalog
                </Link>
                <div className="flex flex-col items-center space-y-4">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {agent.name}
                    </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{agent.description}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <a
                        href={agent.homepage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition"
                    >
                        Homepage
                    </a>
                    <a
                        href={agent.openapi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition"
                    >
                        OpenAPI Spec
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AgentDetail;
