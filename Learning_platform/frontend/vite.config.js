import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/auth': 'http://localhost:8000',
            '/profiles': 'http://localhost:8000',
            '/roadmap': 'http://localhost:8000',
            '/quiz': 'http://localhost:8000',
            // Use sub-path to avoid conflicting with the /assessment React route
            '/assessment/questions': 'http://localhost:8000',
            '/assessment/evaluate': 'http://localhost:8000',
            '/assessment/has_completed': 'http://localhost:8000',
            '/analysis': 'http://localhost:8000',
            '/mentor': 'http://localhost:8000',
            '/upload': 'http://localhost:8000',
            '/groups': 'http://localhost:8000',
            '/email': 'http://localhost:8000',
            '/uploads': 'http://localhost:8000',
            '/ws': { target: 'ws://localhost:8000', ws: true },
        }
    }
})

