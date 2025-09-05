class Participant {
  constructor(id, socketId, name, isTeacher = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.isTeacher = isTeacher;
    this.joinedAt = new Date();
    
    // Media state
    this.hasVideo = false;
    this.hasAudio = false;
    this.isScreenSharing = false;
    this.isPinned = false;
    this.hasRaisedHand = false;
    
    // MediaSoup objects
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // producerId -> Producer
    this.consumers = new Map(); // consumerId -> Consumer
    
    // UI state
    this.position = { x: 0, y: 0 }; // For video layout
    this.volume = 1.0;
    this.isMuted = false;
    this.isVideoHidden = false;
    
    // Breakout room
    this.breakoutRoomId = null;
    
    // Permissions
    this.permissions = {
      canShare: true,
      canChat: true,
      canDraw: isTeacher ? true : false,
      canRecord: isTeacher,
      canCreateBreakout: isTeacher,
      canMuteOthers: isTeacher,
      canKickParticipants: isTeacher
    };
  }

  // Media control methods
  toggleVideo(enabled) {
    this.hasVideo = enabled;
  }

  toggleAudio(enabled) {
    this.hasAudio = enabled;
  }

  toggleScreenShare(enabled) {
    this.isScreenSharing = enabled;
  }

  pin() {
    this.isPinned = true;
  }

  unpin() {
    this.isPinned = false;
  }

  raiseHand() {
    this.hasRaisedHand = true;
  }

  lowerHand() {
    this.hasRaisedHand = false;
  }

  // Producer management
  addProducer(producer) {
    this.producers.set(producer.id, producer);
  }

  removeProducer(producerId) {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  getProducer(producerId) {
    return this.producers.get(producerId);
  }

  // Consumer management
  addConsumer(consumer) {
    this.consumers.set(consumer.id, consumer);
  }

  removeConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  getConsumer(consumerId) {
    return this.consumers.get(consumerId);
  }

  // Transport management
  setSendTransport(transport) {
    if (this.sendTransport) {
      this.sendTransport.close();
    }
    this.sendTransport = transport;
  }

  setRecvTransport(transport) {
    if (this.recvTransport) {
      this.recvTransport.close();
    }
    this.recvTransport = transport;
  }

  // Cleanup
  close() {
    // Close all producers
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    // Close all consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    // Close transports
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
  }

  // Permissions
  updatePermissions(newPermissions) {
    this.permissions = { ...this.permissions, ...newPermissions };
  }

  hasPermission(permission) {
    return this.permissions[permission] || false;
  }

  // Breakout rooms
  moveToBreakoutRoom(breakoutRoomId) {
    this.breakoutRoomId = breakoutRoomId;
  }

  leaveBreakoutRoom() {
    this.breakoutRoomId = null;
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      isTeacher: this.isTeacher,
      joinedAt: this.joinedAt,
      hasVideo: this.hasVideo,
      hasAudio: this.hasAudio,
      isScreenSharing: this.isScreenSharing,
      isPinned: this.isPinned,
      hasRaisedHand: this.hasRaisedHand,
      volume: this.volume,
      isMuted: this.isMuted,
      isVideoHidden: this.isVideoHidden,
      breakoutRoomId: this.breakoutRoomId,
      permissions: this.permissions,
      position: this.position,
      producerIds: Array.from(this.producers.keys()),
      consumerIds: Array.from(this.consumers.keys())
    };
  }
}

module.exports = Participant;