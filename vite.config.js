import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { proxyKoyeon } from './lib/proxy.js';
export default defineConfig({ plugins: [react(), {name:'koyeon-api', configureServer(server) {server.middlewares.use('/api/koyeon', (req,res)=>proxyKoyeon(req,res));}}] });
