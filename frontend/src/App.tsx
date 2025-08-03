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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-gray-900 dark:text-gray-100 transition-all duration-500">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-40 left-1/2 w-80 h-80 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            <header className="relative z-10 glass dark:glass-dark shadow-xl border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-rainbow rounded-xl flex items-center justify-center animate-glow">
                            <span className="text-2xl font-bold text-white">🤖</span>
                        </div>
                        <h1 className="text-4xl font-black gradient-text-rainbow animate-pulse-slow">
                            Agent Catalog
                        </h1>
                    </div>
                    <button
                        onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                        className="group relative overflow-hidden flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                    >
                        <span className="relative z-10 flex items-center space-x-2">
                            <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                        </span>
                        <div className="absolute inset-0 bg-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                </div>
            </header>
            <main className="relative z-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/agents/:agent_id" element={<AgentDetail />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;
