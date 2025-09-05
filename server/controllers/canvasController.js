const logger = require('../utils/logger');

class CanvasController {
  constructor() {
    this.canvasHistory = new Map(); // roomId -> drawing history
  }

  handleDraw(socket, data) {
    try {
      const { roomId } = socket;
      const { x, y, prevX, prevY, color, lineWidth, tool } = data;
      
      // Store drawing action in history
      if (!this.canvasHistory.has(roomId)) {
        this.canvasHistory.set(roomId, []);
      }
      
      const drawAction = {
        type: 'draw',
        x,
        y,
        prevX,
        prevY,
        color,
        lineWidth,
        tool,
        participantId: socket.participantId,
        timestamp: Date.now()
      };
      
      this.canvasHistory.get(roomId).push(drawAction);
      
      // Broadcast to other participants in the room
      socket.to(roomId).emit('canvas-draw', drawAction);
      
      logger.debug(`Canvas draw action in room ${roomId} by ${socket.participantId}`);
    } catch (error) {
      logger.error('Error handling canvas draw:', error);
    }
  }

  handleClear(socket) {
    try {
      const { roomId } = socket;
      
      // Clear canvas history
      if (this.canvasHistory.has(roomId)) {
        this.canvasHistory.set(roomId, []);
      }
      
      const clearAction = {
        type: 'clear',
        participantId: socket.participantId,
        timestamp: Date.now()
      };
      
      // Broadcast to all participants in the room including sender
      socket.to(roomId).emit('canvas-clear', clearAction);
      socket.emit('canvas-clear', clearAction);
      
      logger.info(`Canvas cleared in room ${roomId} by ${socket.participantId}`);
    } catch (error) {
      logger.error('Error handling canvas clear:', error);
    }
  }

  handleUndo(socket) {
    try {
      const { roomId } = socket;
      const history = this.canvasHistory.get(roomId);
      
      if (history && history.length > 0) {
        const lastAction = history.pop();
        
        const undoAction = {
          type: 'undo',
          undoAction: lastAction,
          participantId: socket.participantId,
          timestamp: Date.now()
        };
        
        // Broadcast to all participants in the room
        socket.to(roomId).emit('canvas-undo', undoAction);
        socket.emit('canvas-undo', undoAction);
        
        logger.debug(`Canvas undo in room ${roomId} by ${socket.participantId}`);
      }
    } catch (error) {
      logger.error('Error handling canvas undo:', error);
    }
  }

  handleAddText(socket, data) {
    try {
      const { roomId } = socket;
      const { x, y, text, fontSize, color } = data;
      
      if (!this.canvasHistory.has(roomId)) {
        this.canvasHistory.set(roomId, []);
      }
      
      const textAction = {
        type: 'text',
        x,
        y,
        text,
        fontSize,
        color,
        participantId: socket.participantId,
        timestamp: Date.now()
      };
      
      this.canvasHistory.get(roomId).push(textAction);
      
      // Broadcast to other participants
      socket.to(roomId).emit('canvas-text', textAction);
      
      logger.debug(`Text added to canvas in room ${roomId} by ${socket.participantId}`);
    } catch (error) {
      logger.error('Error handling canvas text:', error);
    }
  }

  handleAddShape(socket, data) {
    try {
      const { roomId } = socket;
      const { type, startX, startY, endX, endY, color, lineWidth } = data;
      
      if (!this.canvasHistory.has(roomId)) {
        this.canvasHistory.set(roomId, []);
      }
      
      const shapeAction = {
        type: 'shape',
        shapeType: type,
        startX,
        startY,
        endX,
        endY,
        color,
        lineWidth,
        participantId: socket.participantId,
        timestamp: Date.now()
      };
      
      this.canvasHistory.get(roomId).push(shapeAction);
      
      // Broadcast to other participants
      socket.to(roomId).emit('canvas-shape', shapeAction);
      
      logger.debug(`Shape added to canvas in room ${roomId} by ${socket.participantId}`);
    } catch (error) {
      logger.error('Error handling canvas shape:', error);
    }
  }

  getCanvasHistory(roomId) {
    return this.canvasHistory.get(roomId) || [];
  }

  saveCanvasState(roomId, imageData) {
    try {
      // In production, you might want to save this to a database
      // For now, we'll just keep it in memory
      const saveAction = {
        type: 'save',
        imageData,
        timestamp: Date.now()
      };
      
      if (!this.canvasHistory.has(roomId)) {
        this.canvasHistory.set(roomId, []);
      }
      
      this.canvasHistory.get(roomId).push(saveAction);
      
      logger.info(`Canvas state saved for room ${roomId}`);
      return { success: true, timestamp: saveAction.timestamp };
    } catch (error) {
      logger.error('Error saving canvas state:', error);
      throw error;
    }
  }

  clearRoomHistory(roomId) {
    try {
      this.canvasHistory.delete(roomId);
      logger.info(`Canvas history cleared for room ${roomId}`);
    } catch (error) {
      logger.error('Error clearing room history:', error);
    }
  }
}

module.exports = new CanvasController();