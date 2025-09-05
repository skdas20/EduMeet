const mediasoupConfig = require('../config/mediasoup');
const logger = require('../utils/logger');

// Simple participant tracking (for basic functionality)
const participantsByRoom = new Map();

function addParticipant(roomId, participant) {
  if (!participantsByRoom.has(roomId)) {
    participantsByRoom.set(roomId, new Map());
  }
  participantsByRoom.get(roomId).set(participant.id, participant);
  logger.log('info', `Added participant ${participant.name} to room ${roomId}`);
}

function removeParticipant(roomId, participantId) {
  const roomParticipants = participantsByRoom.get(roomId);
  if (roomParticipants) {
    const participant = roomParticipants.get(participantId);
    roomParticipants.delete(participantId);
    logger.log('info', `Removed participant ${participant?.name || participantId} from room ${roomId}`);
  }
}

function listParticipants(roomId) {
  const roomParticipants = participantsByRoom.get(roomId);
  if (!roomParticipants) return [];
  return Array.from(roomParticipants.values());
}

class MediaController {
  
  async createWebRtcTransport(router, direction) {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: mediasoupConfig.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
        maxIncomingBitrate: mediasoupConfig.webRtcTransport.maxIncomingBitrate,
        appData: { direction }
      });

      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          transport.close();
        }
      });

      transport.on('close', () => {
        logger.debug(`Transport closed: ${transport.id}`);
      });

      logger.debug(`WebRTC transport created: ${transport.id} (${direction})`);
      return transport;
    } catch (error) {
      logger.error('Error creating WebRTC transport:', error);
      throw error;
    }
  }

  async createConsumer(router, transport, producerId, rtpCapabilities) {
    try {
      // Check if we can consume the producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Cannot consume producer');
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start paused to avoid issues
      });

      consumer.on('transportclose', () => {
        logger.debug(`Consumer transport closed: ${consumer.id}`);
      });

      consumer.on('producerclose', () => {
        logger.debug(`Consumer producer closed: ${consumer.id}`);
      });

      logger.debug(`Consumer created: ${consumer.id} for producer: ${producerId}`);
      return consumer;
    } catch (error) {
      logger.error('Error creating consumer:', error);
      throw error;
    }
  }

  async createProducer(transport, kind, rtpParameters, appData) {
    try {
      const producer = await transport.produce({
        kind,
        rtpParameters,
        appData
      });

      producer.on('transportclose', () => {
        logger.debug(`Producer transport closed: ${producer.id}`);
      });

      logger.debug(`Producer created: ${producer.id} (${kind})`);
      return producer;
    } catch (error) {
      logger.error('Error creating producer:', error);
      throw error;
    }
  }

  async pauseProducer(producerId, participants) {
    try {
      for (const participant of participants.values()) {
        const producer = participant.producers.get(producerId);
        if (producer && !producer.paused) {
          await producer.pause();
          logger.debug(`Producer paused: ${producerId}`);
        }
      }
    } catch (error) {
      logger.error('Error pausing producer:', error);
      throw error;
    }
  }

  async resumeProducer(producerId, participants) {
    try {
      for (const participant of participants.values()) {
        const producer = participant.producers.get(producerId);
        if (producer && producer.paused) {
          await producer.resume();
          logger.debug(`Producer resumed: ${producerId}`);
        }
      }
    } catch (error) {
      logger.error('Error resuming producer:', error);
      throw error;
    }
  }

  async pauseConsumer(consumerId, participants) {
    try {
      for (const participant of participants.values()) {
        const consumer = participant.consumers.get(consumerId);
        if (consumer && !consumer.paused) {
          await consumer.pause();
          logger.debug(`Consumer paused: ${consumerId}`);
        }
      }
    } catch (error) {
      logger.error('Error pausing consumer:', error);
      throw error;
    }
  }

  async resumeConsumer(consumerId, participants) {
    try {
      for (const participant of participants.values()) {
        const consumer = participant.consumers.get(consumerId);
        if (consumer && consumer.paused) {
          await consumer.resume();
          logger.debug(`Consumer resumed: ${consumerId}`);
        }
      }
    } catch (error) {
      logger.error('Error resuming consumer:', error);
      throw error;
    }
  }

  getTransportStats(transport) {
    try {
      return transport.getStats();
    } catch (error) {
      logger.error('Error getting transport stats:', error);
      return null;
    }
  }

  getProducerStats(producer) {
    try {
      return producer.getStats();
    } catch (error) {
      logger.error('Error getting producer stats:', error);
      return null;
    }
  }

  getConsumerStats(consumer) {
    try {
      return consumer.getStats();
    } catch (error) {
      logger.error('Error getting consumer stats:', error);
      return null;
    }
  }

  async enableRecording(router, audioProducerId, videoProducerId) {
    try {
      // Create plain transport for recording
      const transport = await router.createPlainTransport({
        listenIp: mediasoupConfig.plainTransport.listenIp,
        rtcpMux: false,
        comedia: true,
      });

      const consumers = [];

      if (audioProducerId) {
        const audioConsumer = await transport.consume({
          producerId: audioProducerId,
          rtpCapabilities: router.rtpCapabilities,
        });
        consumers.push(audioConsumer);
      }

      if (videoProducerId) {
        const videoConsumer = await transport.consume({
          producerId: videoProducerId,
          rtpCapabilities: router.rtpCapabilities,
        });
        consumers.push(videoConsumer);
      }

      logger.info('Recording enabled');
      return { transport, consumers };
    } catch (error) {
      logger.error('Error enabling recording:', error);
      throw error;
    }
  }
}

// Export both the class instance and the simple functions
const mediaControllerInstance = new MediaController();
mediaControllerInstance.addParticipant = addParticipant;
mediaControllerInstance.removeParticipant = removeParticipant;
mediaControllerInstance.listParticipants = listParticipants;

module.exports = mediaControllerInstance;