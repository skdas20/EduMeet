const { v4: uuidv4 } = require('uuid');
const mediasoupConfig = require('../config/mediasoup');
const Room = require('../models/Room');
const Participant = require('../models/Participant');
const logger = require('../utils/logger');

class RoomController {
  
  async createRoom(roomId, worker) {
    try {
      // Create router
      const router = await worker.createRouter({
        mediaCodecs: mediasoupConfig.router.mediaCodecs
      });

      router.on('workerclose', () => {
        logger.info('Router closed because worker closed');
      });

      const room = new Room(roomId, router);
      logger.info(`Room created: ${roomId}`);
      return room;
    } catch (error) {
      logger.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(socket, room, userName, isTeacher = false) {
    try {
      // Use socket.id as participantId for WebRTC compatibility
      const participantId = socket.id;
      const participant = new Participant(participantId, socket.id, userName, isTeacher);
      
      room.participants.set(participantId, participant);
      
      logger.info(`Participant joined room ${room.id}: ${userName} (${participantId})`);
      return participant;
    } catch (error) {
      logger.error('Error joining room:', error);
      throw error;
    }
  }

  leaveRoom(participantId, room) {
    try {
      const participant = room.participants.get(participantId);
      
      if (participant) {
        // Close all transports
        if (participant.sendTransport) {
          participant.sendTransport.close();
        }
        if (participant.recvTransport) {
          participant.recvTransport.close();
        }
        
        // Close all producers
        for (const producer of participant.producers.values()) {
          producer.close();
        }
        
        // Close all consumers
        for (const consumer of participant.consumers.values()) {
          consumer.close();
        }
        
        room.participants.delete(participantId);
        logger.info(`Participant left room ${room.id}: ${participant.name} (${participantId})`);
      }
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  }

  getRoomInfo(room) {
    return {
      id: room.id,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isTeacher: p.isTeacher,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio
      })),
      participantCount: room.participants.size
    };
  }

  async createBreakoutRoom(mainRoom, participantIds) {
    try {
      const breakoutRoomId = `${mainRoom.id}-breakout-${uuidv4()}`;
      const breakoutRoom = await this.createRoom(breakoutRoomId, mainRoom.router.worker);
      
      // Move participants to breakout room
      for (const participantId of participantIds) {
        const participant = mainRoom.participants.get(participantId);
        if (participant) {
          mainRoom.participants.delete(participantId);
          breakoutRoom.participants.set(participantId, participant);
        }
      }
      
      logger.info(`Breakout room created: ${breakoutRoomId}`);
      return breakoutRoom;
    } catch (error) {
      logger.error('Error creating breakout room:', error);
      throw error;
    }
  }
}

module.exports = new RoomController();