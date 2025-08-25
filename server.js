const { createServer } = require('http');
const { URL, parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = 3000;

// Redis configuration
const redisHost = process.env.REDIS_HOST || 'risc-redis-service.risc-ns.svc.cluster.local';
const redisPort = process.env.REDIS_PORT || 6379;

console.log(`Connecting to Redis at ${redisHost}:${redisPort}`);

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    console.log(`Redis retry attempt ${times}`);
    if (times > 10) {
      console.error('Redis retry attempts exhausted');
      return null;
    }
    return Math.min(times * 100, 3000);
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const activeConnections = new Set();
let globalValues = {
  inProgress: 0,
  retry: 0,
  queued: 0,
  finished: 0
};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Log all requests for debugging
      console.log('Request:', req.method, req.url, 'Headers:', req.headers.origin);
      
      // Check if this is a Socket.IO request
      if (req.url.startsWith('/socket.io/')) {
        console.log('Socket.IO request detected:', req.url);
        // Let Socket.IO handle this
        return;
      }
      
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Error handling request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  let timeoutId;
  const clients = new Set();
  const timeoutSendMessage = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      sendMessage();
    }, 1000);
  };
  const sendMessage = async () => {
    try {
      if (clients.size === 0) {
        timeoutSendMessage();
        return;
      }
      // Fetch all Redis queue metrics
      const [inProgress, retry, queued, finished, workers] = await Promise.all([
        redisClient.scan(0, 'MATCH', 'arq:in-progress:*', 'COUNT', 3000).then(([_, keys]) => keys.length).catch(() => 0),
        redisClient.scan(0, 'MATCH', 'arq:retry:*', 'COUNT', 3000).then(([_, keys]) => keys.length).catch(() => 0),
        redisClient.scan(0, 'MATCH', 'arq:job:*', 'COUNT', 3000).then(([_, keys]) => keys.length).catch(() => 0),
        redisClient.scan(0, 'MATCH', 'arq:result:*', 'COUNT', 3000).then(([_, keys]) => keys.length).catch(() => 0),
        redisClient.scan(0, 'MATCH', 'risc:worker:*:heartbeat', 'COUNT', 3000).then(([_, keys]) => keys.length).catch(() => 0)
      ]);

      const queueData = {
        inProgress: inProgress || 0,
        retry: retry || 0,
        queued: queued || 0,
        finished: finished || 0,
        workers: workers || 0
      };

      // Check if values have changed
      const hasChanged = (
        queueData.inProgress !== globalValues.inProgress ||
        queueData.retry !== globalValues.retry ||
        queueData.queued !== globalValues.queued ||
        queueData.finished !== globalValues.finished ||
        queueData.workers !== globalValues.workers
      );

      if (!hasChanged) {
        timeoutSendMessage();
        return;
      }

      // Update global values
      globalValues = { ...globalValues, ...queueData };

      clients.forEach((client) => {
        client.emit('message', JSON.stringify({ 
          type: 'queue-update', 
          ...queueData
        }));
      });
      console.log('Sent queue update:', queueData);
    } catch (error) {
      console.error('Error fetching from Redis:', error);
      // Fallback to 0 if Redis is unavailable
      clients.forEach((client) => {
        client.emit('message', JSON.stringify({ 
          type: 'queue-update', 
          inProgress: 0,
          retry: 0,
          queued: 0,
          finished: 0,
          workers: 0,
          error: error.message
        }));
      });
    }
    timeoutSendMessage();
  } 
  
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6
  });

  io.on('connection', async (socket) => {
    console.log('A client connected:', socket.id);
    clients.add(socket);
    
    // Send immediate update on connection
    try {
      socket.emit('message', JSON.stringify({ 
        type: 'message-connect',
        message: true
      }));
      console.log('Sent initial message to', socket.id);
    } catch (error) {
      console.error('Error getting initial queue data from Redis:', error);
      socket.emit('message', JSON.stringify({ 
        type: 'message-connect', 
        message: false
      }));
      sendMessage();
    }

    socket.on('disconnect', (reason) => {
      clients.delete(socket);
      console.log('A client disconnected:', socket.id, 'reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });
  
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server ready`);
    
    // Start sending messages
    sendMessage();
  });
});
