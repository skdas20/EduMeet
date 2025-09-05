const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const mediasoup = require('mediasoup');
const { v4: uuidv4 } = require('uuid');

// Import configurations and controllers
const mediasoupConfig = require('./config/mediasoup');
const roomController = require('./controllers/roomController');
const canvasController = require('./controllers/canvasController');
const mediaController = require('./controllers/mediaController');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://vercel.app", 
      "https://*.vercel.app",
      "https://edu-meet-sk.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global variables
let workers = [];
let nextMediasoupWorkerIdx = 0;
const rooms = new Map();

// Middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: false  // Disable CSP temporarily
}));
app.use(compression());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "https://vercel.app",
    "https://*.vercel.app",
    "https://edu-meet-sk.vercel.app",
    "http://103.181.200.66:4000",
    "http://103.181.200.66:3000"
  ],
  credentials: true
}));
app.use(express.json());

// Add debug logging for static files
app.use('/css', express.static(path.join(__dirname, '../client/css'), {
  setHeaders: (res, path) => {
    console.log('Serving CSS file:', path);
    res.set('Content-Type', 'text/css');
  }
}));

app.use(express.static(path.join(__dirname, '../client')));

// Initialize MediaSoup workers
async function initializeWorkers() {
  const { numWorkers } = mediasoupConfig;
  
  logger.info(`Starting ${numWorkers} MediaSoup workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: mediasoupConfig.worker.logLevel,
      logTags: mediasoupConfig.worker.logTags,
      rtcMinPort: mediasoupConfig.worker.rtcMinPort,
      rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
    });

    worker.on('died', () => {
      logger.error('MediaSoup worker died, exiting process');
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
  
  logger.info(`${workers.length} MediaSoup workers initialized successfully`);
}

// Get next worker using round-robin
function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];
  if (++nextMediasoupWorkerIdx === workers.length)
    nextMediasoupWorkerIdx = 0;
  return worker;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userName, isTeacher } = data;
      
      // Create or get room
      let room = rooms.get(roomId);
      if (!room) {
        const worker = getMediasoupWorker();
        room = await roomController.createRoom(roomId, worker);
        rooms.set(roomId, room);
        logger.info(`Created new room: ${roomId}`);
      }
      
      // Join room
      const participant = await roomController.joinRoom(socket, room, userName, isTeacher);
      
      socket.join(roomId);
      socket.roomId = roomId;
      socket.participantId = participant.id;
      socket.userName = userName;
      
      // Get existing participants (excluding the one who just joined)
      const existingParticipants = Array.from(room.participants.values())
        .filter(p => p.id !== participant.id)
        .map(p => ({
          id: p.id,
          name: p.name,
          isTeacher: p.isTeacher,
          hasVideo: p.hasVideo || false,
          hasAudio: p.hasAudio || false
        }));

      logger.info(`Participant ${userName} joined room ${roomId}`);
      logger.info(`Existing participants in room: ${existingParticipants.length}`);
      
      // Send room info to new participant first
      socket.emit('room-joined', {
        yourId: participant.id,
        roomId: roomId,
        participants: existingParticipants
      });
      
      // Then notify others about new participant
      socket.to(roomId).emit('user-joined', {
        participantId: participant.id,
        userName: participant.name,
        isTeacher: participant.isTeacher
      });
      
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // CRITICAL: WebRTC Signaling Events - These must be properly relayed!
  socket.on('offer', (data) => {
    logger.info(`📤 Relaying offer from ${socket.id} to ${data.to}`);
    // Use socket.to() to send to specific socket ID
    io.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer
    });
  });

  socket.on('answer', (data) => {
    logger.info(`📤 Relaying answer from ${socket.id} to ${data.to}`);
    // Use io.to() to send to specific socket ID
    io.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    logger.info(`🧊 Relaying ICE candidate from ${socket.id} to ${data.to}`);
    // Use io.to() to send to specific socket ID
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // Media state events
  socket.on('toggle-video', (data) => {
    const { enabled } = data;
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      if (participant) {
        participant.hasVideo = enabled;
        logger.info(`${socket.userName} toggled video: ${enabled}`);
      }
      // Broadcast to everyone else in the room
      socket.to(socket.roomId).emit('participant-video-toggle', {
        participantId: socket.participantId,
        enabled
      });
    }
  });

  socket.on('toggle-audio', (data) => {
    const { enabled } = data;
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      if (participant) {
        participant.hasAudio = enabled;
        logger.info(`${socket.userName} toggled audio: ${enabled}`);
      }
      // Broadcast to everyone else in the room
      socket.to(socket.roomId).emit('participant-audio-toggle', {
        participantId: socket.participantId,
        enabled
      });
    }
  });

  // Direct media state communication
  socket.on('participant-media-state', (data) => {
    const { to, videoEnabled, audioEnabled } = data;
    logger.info(`📺 Sending media state from ${socket.id} to ${to}: video=${videoEnabled}, audio=${audioEnabled}`);
    
    // Send video state
    io.to(to).emit('participant-video-toggle', {
      participantId: socket.id,
      enabled: videoEnabled
    });
    
    // Send audio state
    io.to(to).emit('participant-audio-toggle', {
      participantId: socket.id,
      enabled: audioEnabled
    });
  });

  // MediaSoup signaling (kept for future use)
  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      const room = rooms.get(socket.roomId);
      if (room && room.router) {
        callback(room.router.rtpCapabilities);
      } else {
        callback({ error: 'Room or router not found' });
      }
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('createWebRtcTransport', async (data, callback) => {
    try {
      const { direction } = data;
      const room = rooms.get(socket.roomId);
      if (!room || !room.router) {
        callback({ error: 'Room or router not found' });
        return;
      }
      
      const transport = await mediaController.createWebRtcTransport(room.router, direction);
      
      const participant = room.participants.get(socket.participantId);
      if (direction === 'send') {
        participant.sendTransport = transport;
      } else {
        participant.recvTransport = transport;
      }
      
      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  // Canvas events
  socket.on('canvas-draw', (data) => {
    socket.to(socket.roomId).emit('canvas-draw', {
      ...data,
      participantId: socket.participantId
    });
  });

  socket.on('canvas-clear', () => {
    socket.to(socket.roomId).emit('canvas-clear', {
      participantId: socket.participantId,
      participantName: socket.userName
    });
  });

  socket.on('canvas-undo', () => {
    socket.to(socket.roomId).emit('canvas-undo', {
      participantId: socket.participantId,
      participantName: socket.userName
    });
  });

  socket.on('canvas-text', (data) => {
    socket.to(socket.roomId).emit('canvas-text', {
      ...data,
      participantId: socket.participantId
    });
  });

  socket.on('canvas-shape', (data) => {
    socket.to(socket.roomId).emit('canvas-shape', {
      ...data,
      participantId: socket.participantId
    });
  });

  socket.on('canvas-cursor', (data) => {
    socket.to(socket.roomId).emit('canvas-cursor', {
      ...data,
      participantId: socket.participantId
    });
  });

  // UI Control events
  socket.on('pin-participant', (data) => {
    socket.to(socket.roomId).emit('participant-pinned', data);
  });

  socket.on('raise-hand', () => {
    socket.to(socket.roomId).emit('hand-raised', {
      participantId: socket.participantId
    });
  });

  socket.on('chat-message', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      io.to(socket.roomId).emit('chat-message', {
        participantId: socket.participantId,
        participantName: participant.name,
        message: data.message,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    if (socket.roomId && socket.participantId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        roomController.leaveRoom(socket.participantId, room);
        socket.to(socket.roomId).emit('user-left', {
          participantId: socket.participantId,
          userName: socket.userName
        });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomId);
          logger.info(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeWorkers();
    
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 EduMeet server running on port ${PORT}`);
      logger.info(`📚 Access the app at:`);
      logger.info(`   Local:    http://localhost:${PORT}`);
      logger.info(`   Network:  http://192.168.29.62:${PORT}`);
      logger.info(`   Mobile:   Use the Network URL on your phone`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();