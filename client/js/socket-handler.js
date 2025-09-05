// Socket Handler for Real-time Communication
class SocketHandler {
    constructor(app) {
        this.app = app;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        
        this.eventHandlers = new Map();
        this.init();
    }

    init() {
        try {
            console.log('Attempting to connect to socket.io server...');
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isLocalNetwork = window.location.hostname.includes('192.168');
            
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const serverUrl = isProduction ? 'http://103.181.200.66:3000' : '';
            
            let socketOptions = {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            };
            
            if (isMobile || isLocalNetwork) {
                socketOptions.upgrade = true;
                socketOptions.rememberUpgrade = true;
            }
            
            this.socket = io(serverUrl, socketOptions);
            console.log('Socket.io connection initiated');
            
            this.bindSocketEvents();
            console.log('Socket handler initialized');
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.app.showNotification('Failed to connect to server', 'error');
        }
    }

    bindSocketEvents() {
        console.log('🔧 Binding socket events...');
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ SOCKET CONNECTED to server, Socket ID:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            
            if (this.app.webrtcManager) {
                this.app.webrtcManager.init(this);
                console.log('WebRTC manager initialized with socket connection');
            }
            
            this.app.showNotification('Connected to server', 'success');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.app.showNotification('Connection lost. Attempting to reconnect...', 'warning');
            
            if (reason === 'io server disconnect') {
                return;
            }
            
            this.handleReconnection();
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ SOCKET CONNECTION ERROR:', error);
            this.handleConnectionError();
        });

        // Room events
        this.socket.on('room-joined', (data) => {
            console.log('Successfully joined room:', data);
            this.handleRoomJoined(data);
        });

        this.socket.on('user-joined', (data) => {
            console.log('User joined:', data);
            this.handleUserJoined(data);
        });

        this.socket.on('user-left', (data) => {
            console.log('User left:', data);
            this.handleUserLeft(data);
        });

        // Media state events - CRITICAL FIX
        this.socket.on('participant-video-toggle', (data) => {
            console.log('Media toggle: participant', data.participantId, 'video', data.enabled);
            this.handleParticipantMediaToggle(data.participantId, 'video', data.enabled);
        });

        this.socket.on('participant-audio-toggle', (data) => {
            console.log('Media toggle: participant', data.participantId, 'audio', data.enabled);
            this.handleParticipantMediaToggle(data.participantId, 'audio', data.enabled);
        });

        // Request media state from existing participants
        this.socket.on('request-media-state', (data) => {
            console.log('Request for media state from new participant:', data.newParticipantId);
            this.sendCurrentMediaState(data.newParticipantId);
        });

        // WebRTC signaling events
        this.socket.on('offer', async (data) => {
            console.log('🔵 RECEIVED WebRTC offer from:', data.from);
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleOffer(data.from, data.offer);
            }
        });

        this.socket.on('answer', async (data) => {
            console.log('🔵 RECEIVED WebRTC answer from:', data.from);
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleAnswer(data.from, data.answer);
            }
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('🔵 RECEIVED ICE candidate from:', data.from);
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleIceCandidate(data.from, data.candidate);
            }
        });

        // UI events
        this.socket.on('participant-pinned', (data) => {
            this.handleParticipantPinned(data);
        });

        this.socket.on('hand-raised', (data) => {
            this.handleHandRaised(data);
        });

        // Chat events
        this.socket.on('chat-message', (data) => {
            this.handleChatMessage(data);
        });

        // Canvas events
        this.socket.on('canvas-draw', (data) => {
            this.handleCanvasEvent('canvas-draw', data);
        });

        this.socket.on('canvas-clear', (data) => {
            this.handleCanvasEvent('canvas-clear', data);
        });

        this.socket.on('canvas-undo', (data) => {
            this.handleCanvasEvent('canvas-undo', data);
        });

        this.socket.on('canvas-text', (data) => {
            this.handleCanvasEvent('canvas-text', data);
        });

        this.socket.on('canvas-shape', (data) => {
            this.handleCanvasEvent('canvas-shape', data);
        });

        this.socket.on('canvas-cursor', (data) => {
            this.handleCanvasEvent('canvas-cursor', data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.app.showNotification(error.message || 'An error occurred', 'error');
        });
        
        console.log('🔧 All socket events bound successfully');
    }

    // Connection management
    handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.app.showNotification('Failed to reconnect. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimeout = setTimeout(() => {
            if (!this.isConnected) {
                this.socket.connect();
            }
        }, delay);
    }

    handleConnectionError() {
        if (!this.isConnected) {
            this.app.showNotification('Unable to connect to server', 'error');
        }
    }

    addEventListener(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
        console.log(`Registered event handler for: ${eventType}`);
    }

    removeEventListener(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(eventType, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(eventType, data);
        } else {
            console.error('Socket not connected, cannot emit:', eventType);
        }
    }

    // Room management
    async joinRoom(roomId, userName, isTeacher) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected to server'));
                return;
            }

            const joinData = {
                roomId,
                userName,
                isTeacher
            };

            this.socket.emit('join-room', joinData);

            const timeout = setTimeout(() => {
                reject(new Error('Join room timeout'));
            }, 10000);

            this.socket.once('room-joined', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async handleRoomJoined(data) {
        console.log('\n=== CLIENT: ROOM JOINED ===');
        console.log('Raw data received:', data);
        console.log('My ID:', data.yourId);
        console.log('Existing participants:', data.participants);
        
        // Store participant info
        this.app.currentUser.id = data.yourId;
        this.app.participants = data.participants || [];
        
        console.log('App participants set to:', this.app.participants);
        
        // Add video tiles for existing participants
        data.participants.forEach(participant => {
            if (participant.id !== data.yourId) {
                console.log('Adding video tile for existing participant:', participant.name);
                this.app.addVideoTile(participant.id, null, participant.name, false);
                
                // Update their media state if provided
                if (participant.hasVideo !== undefined) {
                    this.app.updateVideoTileMediaState(participant.id, participant.hasVideo, participant.hasAudio);
                }
            }
        });
        
        // Initialize WebRTC connections AFTER a delay to ensure both sides are ready
        if (this.app.webrtcManager) {
            console.log('Waiting before initializing WebRTC connections...');
            setTimeout(() => {
                console.log('Initializing WebRTC for existing participants...');
                data.participants.forEach(participant => {
                    if (participant.id !== data.yourId) {
                        console.log('Creating offer for existing participant:', participant.id, participant.name);
                        this.app.webrtcManager.createOffer(participant.id);
                    }
                });
                
                // Send our media state after WebRTC is initialized
                setTimeout(() => {
                    this.announceMediaState();
                }, 1000);
            }, 2000);
        }
        
        // Update participants list
        this.app.updateParticipantsList(this.app.participants);
        console.log('=== END ROOM JOINED ===\n');
    }

    // CRITICAL: Announce media state to all participants
    announceMediaState() {
        if (!this.socket?.connected || !this.app.webrtcManager) return;
        
        const videoEnabled = this.app.webrtcManager.isVideoEnabled;
        const audioEnabled = this.app.webrtcManager.isAudioEnabled;
        
        console.log('📢 Announcing media state to room:', { videoEnabled, audioEnabled });
        
        // Emit media state to everyone in the room
        this.socket.emit('toggle-video', { enabled: videoEnabled });
        this.socket.emit('toggle-audio', { enabled: audioEnabled });
    }

    handleUserJoined(data) {
        console.log('\n=== CLIENT: USER JOINED ===');
        console.log('New user data:', data);
        
        if (this.app.participants) {
            const existingParticipant = this.app.participants.find(p => p.id === data.participantId);
            if (!existingParticipant) {
                this.app.participants.push({
                    id: data.participantId,
                    name: data.userName,
                    isTeacher: data.isTeacher,
                    hasVideo: false,
                    hasAudio: false
                });
                
                console.log('Updated participants:', this.app.participants.map(p => p.name));
                
                this.app.updateParticipantsList(this.app.participants);
                this.app.addVideoTile(data.participantId, null, data.userName, false);
                
                // Create WebRTC offer after a delay
                if (this.app.webrtcManager) {
                    setTimeout(() => {
                        console.log('🔄 Creating offer for new participant:', data.participantId);
                        this.app.webrtcManager.createOffer(data.participantId);
                        
                        // Send our current media state to the new participant
                        setTimeout(() => {
                            this.sendCurrentMediaState(data.participantId);
                        }, 500);
                    }, 2000);
                }
            }
        }
        
        if (typeof this.app.onUserJoined === 'function') {
            this.app.onUserJoined(data);
        }
        console.log('=== END USER JOINED ===\n');
    }

    sendCurrentMediaState(targetParticipantId) {
        if (!this.socket?.connected || !this.app.webrtcManager) return;
        
        const videoEnabled = this.app.webrtcManager.isVideoEnabled;
        const audioEnabled = this.app.webrtcManager.isAudioEnabled;
        
        console.log(`📤 Sending media state to ${targetParticipantId}: video=${videoEnabled}, audio=${audioEnabled}`);
        
        // Send direct media state update
        this.socket.emit('participant-media-state', {
            to: targetParticipantId,
            videoEnabled: videoEnabled,
            audioEnabled: audioEnabled
        });
    }

    handleParticipantMediaToggle(participantId, type, enabled) {
        console.log(`Media toggle: ${participantId} ${type} ${enabled ? 'enabled' : 'disabled'}`);
        
        if (this.app.participants) {
            const participant = this.app.participants.find(p => p.id === participantId);
            if (participant) {
                if (type === 'video') {
                    participant.hasVideo = enabled;
                } else if (type === 'audio') {
                    participant.hasAudio = enabled;
                }
                
                this.app.updateVideoTileMediaState(
                    participantId, 
                    participant.hasVideo, 
                    participant.hasAudio
                );
                
                this.app.updateParticipantsList(this.app.participants);
            }
        }
        
        if (typeof this.app.onParticipantToggle === 'function') {
            this.app.onParticipantToggle(participantId, type, enabled);
        }
    }

    handleUserLeft(data) {
        console.log('User left:', data);
        
        if (this.app.participants) {
            const beforeCount = this.app.participants.length;
            this.app.participants = this.app.participants.filter(
                p => p.id !== data.participantId
            );
            console.log(`Participants count: ${beforeCount} -> ${this.app.participants.length}`);
            
            this.app.updateParticipantsList(this.app.participants);
        }
        
        this.app.removeVideoTile(data.participantId);
        
        if (this.app.webrtcManager) {
            this.app.webrtcManager.closePeerConnection(data.participantId);
        }
        
        if (typeof this.app.onUserLeft === 'function') {
            this.app.onUserLeft(data);
        }
    }

    // UI event handlers
    handleParticipantPinned(data) {
        if (data.participantId && data.participantId !== this.app.currentUser?.id) {
            this.app.togglePinParticipant(data.participantId);
        }
    }

    handleHandRaised(data) {
        const participant = this.app.participants?.find(p => p.id === data.participantId);
        const name = participant ? participant.name : 'Someone';
        this.app.showNotification(`${name} raised their hand`, 'info');
    }

    // Chat handling
    handleChatMessage(data) {
        if (typeof this.app.onChatMessage === 'function') {
            this.app.onChatMessage(data);
        } else {
            this.app.addChatMessage(
                data.participantId,
                data.participantName,
                data.message,
                data.timestamp,
                data.participantId === this.app.currentUser?.id
            );
        }
    }

    // Canvas event handling
    handleCanvasEvent(eventType, data) {
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in canvas event handler for ${eventType}:`, error);
            }
        });
    }

    // Emit methods for UI actions
    emitToggleVideo(enabled) {
        this.socket.emit('toggle-video', { enabled });
    }

    emitToggleAudio(enabled) {
        this.socket.emit('toggle-audio', { enabled });
    }

    emitPinParticipant(participantId) {
        this.socket.emit('pin-participant', { participantId });
    }

    emitRaiseHand() {
        this.socket.emit('raise-hand');
    }

    emitChatMessage(message) {
        this.socket.emit('chat-message', { message });
    }

    // Cleanup
    disconnect() {
        console.log('Disconnecting from server...');
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        this.eventHandlers.clear();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        console.log('Socket handler disconnected');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocketHandler;
}