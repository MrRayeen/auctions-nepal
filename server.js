/**
 * Custom Next.js Server with Socket.IO Integration
 * Run this instead of `next dev` for development
 * 
 * Usage: npm run dev:socket
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketIO } = require('./src/lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO on the server
  try {
    const io = initializeSocketIO(server);
    console.log('✅ Socket.IO server initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO:', error);
  }

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Socket.IO ready for WebSocket connections\n`);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
});
