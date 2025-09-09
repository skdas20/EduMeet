// Simple WebRTC Manager for Peer-to-Peer Communication
class WebRTCManager {
    constructor(app) {
        this.app = app;
        this.localStream = null;
        this.peerConnections = new Map();
        this.makingOffer = new Map();
        this.socketHandler = null;
        
        // ICE servers configuration
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];
        
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.mediaEncoder = null;
    }

    init(socketHandler) {
        this.socketHandler = socketHandler;
        this.bindSocketEvents();
        
        // Initialize media encoder for professional quality
        if (typeof MediaEncoder !== 'undefined') {
            this.mediaEncoder = new MediaEncoder();
            console.log('Media encoder initialized');
        }
        
        console.log('WebRTC Manager initialized');
    }

    bindSocketEvents() {
        console.log('WebRTC socket events will be handled by SocketHandler');
    }

    async initializeLocalMedia() {
        try {
            if (this.localStream && this.localStream.active) {
                console.log('Local media already initialized');
                return this.localStream;
            }

            const constraints = {
                video: this.isVideoEnabled ? {
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    frameRate: { ideal: 30, min: 24 },
                    aspectRatio: { ideal: 16/9 },
                    facingMode: 'user'
                } : false,
                audio: this.isAudioEnabled ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 48000, min: 44100 },
                    channelCount: { ideal: 2, min: 1 },
                    sampleSize: { ideal: 16, min: 16 },
                    latency: { ideal: 0.01, max: 0.05 },
                    // Professional audio processing
                    googEchoCancellation: true,
                    googExperimentalEchoCancellation: true,
                    googAutoGainControl: true,
                    googExperimentalAutoGainControl: true,
                    googNoiseSuppression: true,
                    googExperimentalNoiseSuppression: true,
                    googHighpassFilter: true,
                    googTypingNoiseDetection: true
                } : false
            };

            console.log('Requesting user media with constraints:', constraints);
            
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (mediaError) {
                console.warn('Failed to get media with both audio/video, trying alternatives...', mediaError);
                
                if (constraints.video && constraints.audio) {
                    try {
                        console.log('Trying video only...');
                        this.localStream = await navigator.mediaDevices.getUserMedia({
                            video: constraints.video,
                            audio: false
                        });
                        this.isAudioEnabled = false;
                        this.app.showNotification('Camera access granted, but microphone unavailable', 'warning');
                    } catch (videoError) {
                        try {
                            console.log('Trying audio only...');
                            this.localStream = await navigator.mediaDevices.getUserMedia({
                                video: false,
                                audio: constraints.audio
                            });
                            this.isVideoEnabled = false;
                            this.app.showNotification('Microphone access granted, but camera unavailable', 'warning');
                        } catch (audioError) {
                            console.error('No media access available');
                            this.isVideoEnabled = false;
                            this.isAudioEnabled = false;
                            this.app.showNotification('Camera and microphone unavailable. You can still join and see others.', 'info');
                            return null;
                        }
                    }
                } else {
                    throw mediaError;
                }
            }
            
            console.log('Local media stream obtained:', {
                video: this.localStream.getVideoTracks().length > 0,
                audio: this.localStream.getAudioTracks().length > 0
            });
            
            this.isVideoEnabled = this.localStream.getVideoTracks().length > 0;
            this.isAudioEnabled = this.localStream.getAudioTracks().length > 0;
            
            if (this.app.addVideoTile && this.app.currentUser) {
                this.app.addVideoTile('local', this.localStream, this.app.currentUser.name, true);
            }

            console.log('Local media initialized with WebRTC Manager');
            return this.localStream;
        } catch (error) {
            console.error('Failed to get local media:', error);
            this.app.showNotification('Unable to access camera/microphone.', 'warning');
            this.isVideoEnabled = false;
            this.isAudioEnabled = false;
            
            if (this.app.addVideoTile && this.app.currentUser) {
                this.app.addVideoTile('local', null, this.app.currentUser.name, true);
            }
            
            return null;
        }
    }

    async createPeerConnection(participantId) {
        const peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers,
            bundlePolicy: 'balanced',
            rtcpMuxPolicy: 'require',
            iceCandidatePoolSize: 10,
            sdpSemantics: 'unified-plan'
        });
        
        // Configure professional encoding if available
        if (this.mediaEncoder) {
            this.mediaEncoder.configurePeerConnection(peerConnection);
        }

        this.makingOffer.set(participantId, false);

        if (!this.localStream) {
            console.warn('Local stream not available, initializing...');
            await this.initializeLocalMedia();
        }

        if (this.localStream && this.localStream.active) {
            this.localStream.getTracks().forEach(track => {
                console.log(`Adding local ${track.kind} track to peer connection for ${participantId}`);
                peerConnection.addTrack(track, this.localStream);
            });
        } else {
            console.warn('No local stream available for peer connection');
        }

        peerConnection.ontrack = (event) => {
            console.log('Received remote track from:', participantId, event.track.kind);
            const remoteStream = event.streams[0];
            if (remoteStream) {
                this.addRemoteVideo(participantId, remoteStream);
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`Sending ICE candidate to ${participantId}`);
                this.socketHandler.socket.emit('ice-candidate', {
                    to: participantId,
                    candidate: event.candidate
                });
            } else {
                console.log(`ICE gathering complete for ${participantId}`);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${participantId}:`, peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                console.log(`✅ Successfully connected to ${participantId}`);
            } else if (peerConnection.connectionState === 'failed') {
                this.handleConnectionFailure(participantId);
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${participantId}:`, peerConnection.iceConnectionState);
        };

        this.peerConnections.set(participantId, peerConnection);
        return peerConnection;
    }

    async createOffer(participantId) {
        try {
            console.log(`🔄 Creating WebRTC offer for participant: ${participantId}`);
            
            // Use socket ID comparison to determine who initiates
            const shouldIOffer = this.app.currentUser.id < participantId;
            
            if (!shouldIOffer) {
                console.log(`Waiting for offer from ${participantId} (they have lower ID)`);
                // Just create the connection, but don't send offer
                await this.createPeerConnection(participantId);
                return;
            }
            
            const peerConnection = await this.createPeerConnection(participantId);
            this.makingOffer.set(participantId, true);
            
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            console.log(`📤 Sending offer to ${participantId}:`, offer.type);
            console.log('Socket available:', !!this.socketHandler?.socket);
            console.log('Socket connected:', this.socketHandler?.socket?.connected);
            
            if (this.socketHandler?.socket?.connected) {
                console.log(`📡 EMITTING offer event to server with data:`, {
                    to: participantId,
                    offer: { type: offer.type, sdp: offer.sdp ? 'present' : 'missing' }
                });
                this.socketHandler.socket.emit('offer', {
                    to: participantId,
                    offer: offer
                });
                console.log('✅ Offer sent to:', participantId);
            } else {
                console.error('❌ Socket not connected, cannot send offer');
            }
            
            this.makingOffer.set(participantId, false);
        } catch (error) {
            console.error('❌ Failed to create offer for', participantId, ':', error);
            this.makingOffer.set(participantId, false);
        }
    }

    async handleOffer(participantId, offer) {
        try {
            console.log(`📥 Received offer from ${participantId}:`, offer.type);
            
            let peerConnection = this.peerConnections.get(participantId);
            
            if (!peerConnection) {
                peerConnection = await this.createPeerConnection(participantId);
            }
            
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            console.log(`📤 Sending answer to ${participantId}:`, answer.type);
            console.log('Socket available:', !!this.socketHandler?.socket);
            console.log('Socket connected:', this.socketHandler?.socket?.connected);
            
            if (this.socketHandler?.socket?.connected) {
                console.log(`📡 EMITTING answer event to server with data:`, {
                    to: participantId,
                    answer: { type: answer.type, sdp: answer.sdp ? 'present' : 'missing' }
                });
                this.socketHandler.socket.emit('answer', {
                    to: participantId,
                    answer: answer
                });
                console.log('✅ Answer sent to:', participantId);
            } else {
                console.error('❌ Socket not connected, cannot send answer');
            }
        } catch (error) {
            console.error('❌ Failed to handle offer from', participantId, ':', error);
        }
    }

    async handleAnswer(participantId, answer) {
        try {
            console.log(`📥 Received answer from ${participantId}:`, answer.type);
            const peerConnection = this.peerConnections.get(participantId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(answer);
                console.log('✅ Answer processed from:', participantId);
            } else {
                console.error('❌ No peer connection found for:', participantId);
            }
        } catch (error) {
            console.error('❌ Failed to handle answer from', participantId, ':', error);
        }
    }

    async handleIceCandidate(participantId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (peerConnection) {
                await peerConnection.addIceCandidate(candidate);
            }
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }

    addRemoteVideo(participantId, stream) {
        console.log('Adding remote video for participant:', participantId);
        
        const participantInfo = this.app.participants?.find(p => p.id === participantId);
        const participantName = participantInfo?.name || 'Unknown';
        
        if (this.app.addVideoTile) {
            this.app.addVideoTile(participantId, stream, participantName, false);
        } else {
            console.error('Main app addVideoTile method not available');
        }
    }

    removeRemoteVideo(participantId) {
        console.log('WebRTC: Removing remote video for:', participantId);
    }

    getParticipantName(participantId) {
        if (this.app.participants) {
            const participant = this.app.participants.find(p => p.id === participantId);
            return participant ? participant.name : 'Unknown';
        }
        return 'Participant';
    }

    closePeerConnection(participantId) {
        const peerConnection = this.peerConnections.get(participantId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(participantId);
        }
        this.removeRemoteVideo(participantId);
    }

    async toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                if (videoTrack.enabled) {
                    videoTrack.enabled = false;
                    videoTrack.stop();
                    this.isVideoEnabled = false;
                    console.log('Video disabled and camera released');
                    this.app.showNotification('Camera turned off and released', 'info');
                } else {
                    try {
                        const newVideoStream = await navigator.mediaDevices.getUserMedia({ 
                            video: {
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                                frameRate: { ideal: 30 }
                            }
                        });
                        
                        const newVideoTrack = newVideoStream.getVideoTracks()[0];
                        
                        this.peerConnections.forEach(async (pc) => {
                            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                            if (sender) {
                                await sender.replaceTrack(newVideoTrack);
                            } else {
                                pc.addTrack(newVideoTrack, this.localStream);
                            }
                        });
                        
                        if (this.localStream.getVideoTracks().length > 0) {
                            this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
                        }
                        this.localStream.addTrack(newVideoTrack);
                        
                        if (this.app.replaceVideoTileStream) {
                            this.app.replaceVideoTileStream('local', this.localStream);
                        }
                        
                        this.isVideoEnabled = true;
                        console.log('Video enabled with new camera track');
                        this.app.showNotification('Camera turned on', 'success');
                    } catch (error) {
                        console.error('Failed to re-enable video:', error);
                        this.isVideoEnabled = false;
                        this.app.showNotification('Camera unavailable (may be in use by another tab)', 'warning');
                    }
                }
                
                if (this.socketHandler?.socket?.connected) {
                    this.socketHandler.socket.emit('toggle-video', { enabled: this.isVideoEnabled });
                }
                
                console.log('Video toggled:', this.isVideoEnabled);
                return this.isVideoEnabled;
            }
        }
        return false;
    }

    async toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                if (audioTrack.enabled) {
                    audioTrack.enabled = false;
                    audioTrack.stop();
                    this.isAudioEnabled = false;
                    console.log('Audio disabled and microphone released');
                    this.app.showNotification('Microphone turned off and released', 'info');
                } else {
                    try {
                        const newAudioStream = await navigator.mediaDevices.getUserMedia({ 
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true,
                                sampleRate: { ideal: 48000, min: 44100 },
                                channelCount: { ideal: 2, min: 1 },
                                sampleSize: { ideal: 16, min: 16 },
                                latency: { ideal: 0.01, max: 0.05 },
                                // Professional audio processing
                                googEchoCancellation: true,
                                googExperimentalEchoCancellation: true,
                                googAutoGainControl: true,
                                googExperimentalAutoGainControl: true,
                                googNoiseSuppression: true,
                                googExperimentalNoiseSuppression: true,
                                googHighpassFilter: true,
                                googTypingNoiseDetection: true
                            }
                        });
                        
                        const newAudioTrack = newAudioStream.getAudioTracks()[0];
                        
                        this.peerConnections.forEach(async (pc) => {
                            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                            if (sender) {
                                await sender.replaceTrack(newAudioTrack);
                            } else {
                                pc.addTrack(newAudioTrack, this.localStream);
                            }
                        });
                        
                        if (this.localStream.getAudioTracks().length > 0) {
                            this.localStream.removeTrack(this.localStream.getAudioTracks()[0]);
                        }
                        this.localStream.addTrack(newAudioTrack);
                        
                        this.isAudioEnabled = true;
                        console.log('Audio enabled with new microphone track');
                        this.app.showNotification('Microphone turned on', 'success');
                    } catch (error) {
                        console.error('Failed to re-enable audio:', error);
                        this.isAudioEnabled = false;
                        this.app.showNotification('Microphone unavailable (may be in use by another tab)', 'warning');
                    }
                }
                
                if (this.socketHandler?.socket?.connected) {
                    this.socketHandler.socket.emit('toggle-audio', { enabled: this.isAudioEnabled });
                }
                
                console.log('Audio toggled:', this.isAudioEnabled);
                return this.isAudioEnabled;
            }
        }
        return false;
    }

    handleConnectionFailure(participantId) {
        console.log('Connection failed with:', participantId);
        this.app.showNotification(`Connection lost with ${this.getParticipantName(participantId)}`, 'warning');
        
        setTimeout(() => {
            this.createOffer(participantId);
        }, 3000);
    }

    async replaceVideoTrack(newVideoTrack) {
        if (!this.localStream) return;

        try {
            // Replace video track in local stream
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                this.localStream.removeTrack(oldVideoTrack);
                oldVideoTrack.stop();
            }
            
            if (newVideoTrack) {
                this.localStream.addTrack(newVideoTrack);
            }

            // Update all peer connections
            for (const [participantId, peerConnection] of this.peerConnections) {
                const sender = peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender && newVideoTrack) {
                    await sender.replaceTrack(newVideoTrack);
                    console.log(`Replaced video track for ${participantId}`);
                }
            }

            // Update local video tile
            if (this.app.updateLocalVideoTile) {
                this.app.updateLocalVideoTile(this.localStream);
            }

        } catch (error) {
            console.error('Error replacing video track:', error);
            throw error;
        }
    }

    async replaceAudioTrack(newAudioTrack) {
        if (!this.localStream) return;

        try {
            // Replace audio track in local stream
            const oldAudioTrack = this.localStream.getAudioTracks()[0];
            if (oldAudioTrack) {
                this.localStream.removeTrack(oldAudioTrack);
                oldAudioTrack.stop();
            }
            
            if (newAudioTrack) {
                this.localStream.addTrack(newAudioTrack);
            }

            // Update all peer connections
            for (const [participantId, peerConnection] of this.peerConnections) {
                const sender = peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'audio'
                );
                
                if (sender && newAudioTrack) {
                    await sender.replaceTrack(newAudioTrack);
                    console.log(`Replaced audio track for ${participantId}`);
                }
            }

        } catch (error) {
            console.error('Error replacing audio track:', error);
            throw error;
        }
    }

    cleanup() {
        this.peerConnections.forEach((pc, participantId) => {
            this.closePeerConnection(participantId);
        });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        console.log('WebRTC Manager cleaned up');
    }
}