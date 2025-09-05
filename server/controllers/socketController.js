module.exports = function (io, socket, { roomController, mediaController, canvasController, logger }) {
  console.log(`\n=== SOCKET CONTROLLER LOADED ===`);
  console.log(`Socket ID: ${socket.id} connected to controller`);
  
  socket.on('join-room', ({ roomId, userName, isTeacher }) => {
    console.log(`\n=== JOIN ROOM EVENT ===`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Room ID: ${roomId}`);
    console.log(`User Name: ${userName}`);
    console.log(`Is Teacher: ${isTeacher}`);
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName || 'Anonymous';
    socket.isTeacher = isTeacher || false;
    
    logger.log('info', `${socket.userName} (${socket.id}) joined room ${roomId} as ${isTeacher ? 'teacher' : 'student'}`);
    
    // Get existing participants BEFORE adding new one
    const existingParticipants = mediaController.listParticipants(roomId);
    console.log(`Existing participants (${existingParticipants.length}):`, existingParticipants.map(p => p.name));
    
    // Add participant to room
    const participant = { 
      id: socket.id, 
      name: socket.userName, 
      isTeacher: socket.isTeacher,
      joinedAt: new Date()
    };
    mediaController.addParticipant(roomId, participant);
    
    // Get ALL participants after adding new one
    const allParticipants = mediaController.listParticipants(roomId);
    console.log(`All participants after join (${allParticipants.length}):`, allParticipants.map(p => p.name));
    
    // Notify new user about existing participants (excluding themselves)
    const existingForNewUser = existingParticipants; // Don't include self
    socket.emit('room-joined', {
      roomId: roomId,
      participants: existingForNewUser,
      yourId: socket.id
    });
    console.log(`Sent to new user - existing participants: ${existingForNewUser.length}`);
    
    // Notify others about new participant
    socket.to(roomId).emit('user-joined', {
      participantId: socket.id,
      userName: socket.userName,
      isTeacher: socket.isTeacher
    });
    
    // Ask existing participants to send their current media state to the new participant
    socket.to(roomId).emit('request-media-state', { 
      newParticipantId: socket.id 
    });
    
    console.log(`Notified others in room about new participant: ${socket.userName}`);
    console.log(`=== END JOIN ROOM ===\n`);
  });

  // Handle media signaling
  console.log(`🔧 REGISTERING WebRTC event handlers for socket: ${socket.id}`);
  
  socket.on('offer', ({ to, offer }) => {
    console.log(`🔄 SERVER: Relaying offer from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Offer details:`, { type: offer?.type, sdp: offer?.sdp ? 'present' : 'missing' });
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    console.log(`📤 SERVER: Relaying answer from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Answer details:`, { type: answer?.type, sdp: answer?.sdp ? 'present' : 'missing' });
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    console.log(`🧊 SERVER: Relaying ICE candidate from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Candidate details:`, { type: candidate?.type, address: candidate?.address });
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Test socket communication
  socket.on('test-ping', (data) => {
    console.log(`🏓 SERVER: Relaying test ping from ${socket.id} to room ${socket.roomId}`);
    socket.to(socket.roomId).emit('test-ping', { ...data, relayedBy: 'server' });
  });

  // Test WebRTC event reception
  socket.on('test-webrtc', (data) => {
    console.log(`🧪 SERVER: TEST WebRTC event received from ${socket.id}:`, data);
    socket.to(data.to).emit('test-webrtc-reply', { from: socket.id, ...data });
  });

  // Media state updates
  socket.on('toggle-video', ({ enabled }) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('participant-video-toggle', {
        participantId: socket.id,
        enabled: enabled
      });
    }
  });

  socket.on('toggle-audio', ({ enabled }) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('participant-audio-toggle', {
        participantId: socket.id,
        enabled: enabled
      });
    }
  });

  // Handle media state sharing
  socket.on('participant-media-state', ({ to, videoEnabled, audioEnabled }) => {
    console.log(`📺 SERVER: Relaying media state from ${socket.id} to ${to} - video: ${videoEnabled}, audio: ${audioEnabled}`);
    socket.to(to).emit('participant-video-toggle', {
      participantId: socket.id,
      enabled: videoEnabled
    });
    socket.to(to).emit('participant-audio-toggle', {
      participantId: socket.id,
      enabled: audioEnabled
    });
  });

  socket.on('canvas-update', (data) => {
    if (!socket.roomId) return;
    canvasController.updateCanvas(socket.roomId, data);
    socket.to(socket.roomId).emit('canvas-update', data);
  });

  socket.on('signal', (payload) => {
    // simple relay for signaling (sockets only). For real mediasoup, replace with proper handlers.
    const { to, from, data } = payload;
    if (to) io.to(to).emit('signal', { from, data });
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      mediaController.removeParticipant(socket.roomId, socket.id);
      socket.to(socket.roomId).emit('user-left', { 
        participantId: socket.id,
        userName: socket.userName 
      });
      logger.log('info', `${socket.userName} (${socket.id}) left room ${socket.roomId}`);
    }
  });
};
