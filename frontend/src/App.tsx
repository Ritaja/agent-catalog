import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AgentDetail from './pages/AgentDetail';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold">Agent Catalog</h1>
                    <button
                        onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                        className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                    >
                        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                </div>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/agents/:agent_id" element={<AgentDetail />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;
