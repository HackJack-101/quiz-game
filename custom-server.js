/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

let app;
let handle;

if (dev) {
  // Development mode: use next() as before
  const next = require('next');
  app = next({ dev, hostname, port });
  handle = app.getRequestHandler();
} else {
  // Production mode with standalone output: use the standalone server
  // The standalone server is already built and ready to use
  const NextServer = require('next/dist/server/next-server').default;

  process.env.NODE_ENV = 'production';
  process.chdir(__dirname);

  const nextConfig = require('./.next/required-server-files.json').config;

  app = new NextServer({
    hostname,
    port,
    dir: __dirname,
    dev: false,
    conf: nextConfig,
  });

  handle = app.getRequestHandler();
}

const prepareServer = dev ? app.prepare() : Promise.resolve();

prepareServer.then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach io to global for access in API routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-game', (gameId) => {
      const room = `game-${gameId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
