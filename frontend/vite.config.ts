import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '/agents': {
                target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV 
                    ? 'http://backend:8000' 
                    : 'http://localhost:8000',
                changeOrigin: true,
            },
            '/test-agent-url': {
                target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV 
                    ? 'http://backend:8000' 
                    : 'http://localhost:8000',
                changeOrigin: true,
            },
            '/add-agent': {
                target: process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV 
                    ? 'http://backend:8000' 
                    : 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
});
