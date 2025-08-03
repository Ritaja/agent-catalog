import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AgentDetail from './pages/AgentDetail';
import AddAgent from './pages/AddAgent';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-500">
            <header className="relative z-10 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold">🤖</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100">
                            Agent Catalog
                        </h1>
                    </div>
                    <button
                        onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                        className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-300"
                    >
                        <span className="flex items-center space-x-2">
                            <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                        </span>
                    </button>
                </div>
            </header>
            <main className="relative z-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/agents/:agent_id" element={<AgentDetail />} />
                    <Route path="/add-agent" element={<AddAgent />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;
