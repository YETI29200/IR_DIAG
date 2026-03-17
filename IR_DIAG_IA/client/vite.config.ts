import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'
import { readFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import type { Connect } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read SCSS files to inject globally (variables first, then charte, then mixins)
const variablesPath = join(__dirname, 'src', 'styles', '_variables.scss')
const chartePath = join(__dirname, 'src', 'styles', '_charte.scss')
const mixinsPath = join(__dirname, 'src', 'styles', '_mixins.scss')

const variables = readFileSync(variablesPath, 'utf-8')
const charte = readFileSync(chartePath, 'utf-8')
const mixins = readFileSync(mixinsPath, 'utf-8')

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // SPA fallback plugin - serves index.html for all routes
    {
      name: 'spa-fallback',
      configureServer(server) {
        return () => {
          // Add SPA fallback middleware as the last middleware
          // This will run after all other middlewares including the proxy
          server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
            const url = (req as any).url || ''
            const pathname = url.split('?')[0]

            // Skip if already handled by other middlewares
            if (pathname.startsWith('/api') ||
              pathname.startsWith('/@') ||
              pathname.startsWith('/node_modules/') ||
              pathname.match(/\.(js|css|ts|tsx|vue|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|json)$/) ||
              pathname.startsWith('/src/')) {
              return next()
            }

            // Serve index.html for SPA routing
            ; (req as any).url = '/index.html'
            next()
          })
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (content: string) => {
          // Inject variables, charte (to override variables), and mixins before the component styles
          return `${variables}\n${charte}\n${mixins}\n${content}`
        }
      }
    }
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces (IPv4 and IPv6)
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        timeout: 180000, // 3 minutes timeout (aligned with server timeout)
        configure: (proxy, _options) => {
          proxy.on('error', (err: Error, req: any, res: any) => {
            console.error('[Vite Proxy] ❌ Proxy error:', err.message);
            console.error('[Vite Proxy] Request:', req.method, req.url);

            // Send error response if headers not sent
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Proxy error',
                message: 'Impossible de se connecter au serveur backend. Vérifiez que le serveur est démarré sur le port 3000.'
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
            console.log('[Vite Proxy] Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
            console.log('[Vite Proxy] Proxy response:', req.method, req.url, '->', proxyRes.statusCode);
          });
          // @ts-ignore - The 'timeout' event might have different type definitions in different Vite/http-proxy versions
          proxy.on('timeout', (req: any, res: any) => {
            console.error('[Vite Proxy] ❌ Proxy timeout:', req.method, req.url);
            if (res && !res.headersSent) {
              res.writeHead(504, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Gateway timeout',
                message: 'La requête a pris trop de temps. Le serveur backend peut être surchargé.'
              }));
            }
          });
        },
      }
    },
    // SPA fallback - serve index.html for all routes
    fs: {
      strict: false
    },
    // Ensure SPA routing works
    middlewareMode: false
  },
  // Ensure SPA routing works on refresh
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  // Fallback to index.html for all routes (SPA mode)
  preview: {
    port: 5173
  }
})
