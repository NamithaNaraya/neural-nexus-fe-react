import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@neo4j-nvl/react', 'echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Enable streaming: tell http-proxy not to buffer responses
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // For streaming endpoints, ensure no accept-encoding so proxy doesn't buffer
            if (req.url?.includes('stream-answer')) {
              proxyReq.setHeader('Accept-Encoding', 'identity');
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (req.url?.includes('stream-answer')) {
              // Disable buffering for streaming responses
              proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
              proxyRes.headers['x-accel-buffering'] = 'no';
              delete proxyRes.headers['content-length'];
            }
          });
        },
      },
    },
  },
})
