/**
 * Socket.IO Server Setup Utilities
 * For use with custom Next.js servers
 */

import { Server as HTTPServer } from 'http';
import { initializeSocketIO } from '@/lib/socket';

/**
 * Initialize Socket.IO on an HTTP server
 * Use this in a custom server.ts file for production deployments
 */
export function setupSocket(httpServer: HTTPServer) {
  return initializeSocketIO(httpServer);
}

/**
 * For production deployments with custom servers:
 * 
 * In your custom server.ts or server-start.js:
 * 
 * const { createServer } = require('http');
 * const { parse } = require('url');
 * const next = require('next');
 * const { setupSocket } = require('./src/lib/socketServer');
 * 
 * const dev = process.env.NODE_ENV !== 'production';
 * const app = next({ dev });
 * const handle = app.getRequestHandler();
 * 
 * app.prepare().then(() => {
 *   const server = createServer((req, res) => {
 *     handle(req, res);
 *   });
 * 
 *   const io = setupSocket(server);
 * 
 *   server.listen(3000, (err?: any) => {
 *     if (err) throw err;
 *     console.log('> Ready on http://localhost:3000');
 *     console.log('> Socket.IO server initialized');
 *   });
 * });
 */

/**
 * For development with next dev, Socket.IO will be automatically
 * initialized on the first client WebSocket connection.
 */

