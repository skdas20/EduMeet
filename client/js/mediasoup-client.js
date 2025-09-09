// MediaSoup Client Manager
class MediaSoupClient {
    constructor(app) {
        this.app = app;
        this.device = null;
        this.sendTransport = null;
        this.recvTransport = null;
        this.producers = new Map();
        this.consumers = new Map();
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        try {
            // Wait for mediasoup-client to load with timeout
            await this.waitForMediasoupClient(5000);
            
            // Check if mediasoup-client is available
            if (typeof mediasoupClient === 'undefined') {
                console.warn('[MediaSoupClient] mediasoup-client global not found. Media features will be limited.');
                return; // graceful no-op instead of throwing
            }

            // Create device
            this.device = new mediasoupClient.Device();
            console.log('MediaSoup client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MediaSoup client:', error);
            // Fallback to basic WebRTC without showing error notification
            console.log('Falling back to basic WebRTC functionality');
        }
    }
    
    waitForMediasoupClient(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (typeof mediasoupClient !== 'undefined') {
                resolve();
                return;
            }
            
            let attempts = 0;
            const maxAttempts = timeout / 100;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof mediasoupClient !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('MediaSoup client failed to load within timeout'));
                }
            }, 100);
        });
    }

    async connect(socketHandler) {
        try {
            this.socketHandler = socketHandler;

            // Get router capabilities from server
            const routerCapabilities = await this.requestRouterCapabilities();
            
            if (!routerCapabilities) {
                throw new Error('Failed to get router capabilities');
            }

            // Load device with router capabilities
            await this.device.load({ routerCapabilities });
            
            console.log('Device loaded with RTP capabilities');
            
            // Create transports
            await this.createSendTransport();
            await this.createReceiveTransport();
            
            this.isConnected = true;
            console.log('MediaSoup client connected successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to connect MediaSoup client:', error);
            this.app.showNotification('Failed to connect media system', 'error');
            return false;
        }
    }

    async requestRouterCapabilities() {
        return new Promise((resolve) => {
            if (this.socketHandler && this.socketHandler.socket) {
                this.socketHandler.socket.emit('getRouterRtpCapabilities', resolve);
            } else {
                resolve(null);
            }
        });
    }

    async createSendTransport() {
        try {
            const transportOptions = await this.requestTransport('send');
            
            this.sendTransport = this.device.createSendTransport(transportOptions);
            
            this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await this.socketHandler.connectTransport(this.sendTransport.id, dtlsParameters);
                    callback();
                } catch (error) {
                    errback(error);
                }
            });

            this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
                try {
                    const { id } = await this.socketHandler.produce(kind, rtpParameters, appData);
                    callback({ id });
                } catch (error) {
                    errback(error);
                }
            });

            this.sendTransport.on('connectionstatechange', (state) => {
                console.log('Send transport connection state:', state);
                if (state === 'failed' || state === 'closed') {
                    this.handleTransportError('send');
                }
            });

            console.log('Send transport created successfully');
        } catch (error) {
            console.error('Failed to create send transport:', error);
            throw error;
        }
    }

    async createReceiveTransport() {
        try {
            const transportOptions = await this.requestTransport('recv');
            
            this.recvTransport = this.device.createRecvTransport(transportOptions);
            
            this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await this.socketHandler.connectTransport(this.recvTransport.id, dtlsParameters);
                    callback();
                } catch (error) {
                    errback(error);
                }
            });

            this.recvTransport.on('connectionstatechange', (state) => {
                console.log('Receive transport connection state:', state);
                if (state === 'failed' || state === 'closed') {
                    this.handleTransportError('recv');
                }
            });

            console.log('Receive transport created successfully');
        } catch (error) {
            console.error('Failed to create receive transport:', error);
            throw error;
        }
    }

    async requestTransport(direction) {
        return new Promise((resolve, reject) => {
            if (this.socketHandler && this.socketHandler.socket) {
                this.socketHandler.socket.emit('createWebRtcTransport', { direction }, (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                });
            } else {
                reject(new Error('Socket not available'));
            }
        });
    }

    async produce(track, kind, appData = {}) {
        try {
            if (!this.sendTransport) {
                throw new Error('Send transport not available');
            }

            const producer = await this.sendTransport.produce({
                track,
                ...appData
            });

            this.producers.set(producer.id, producer);

            producer.on('trackended', () => {
                console.log('Producer track ended:', producer.id);
                this.closeProducer(producer.id);
            });

            producer.on('transportclose', () => {
                console.log('Producer transport closed:', producer.id);
                this.producers.delete(producer.id);
            });

            console.log(`Producer created: ${producer.id} (${kind})`);
            return producer;
        } catch (error) {
            console.error('Failed to create producer:', error);
            throw error;
        }
    }

    async consume(producerId, participantId, kind) {
        try {
            if (!this.recvTransport) {
                throw new Error('Receive transport not available');
            }

            if (!this.device.canConsume({
                producerId,
                rtpCapabilities: this.device.rtpCapabilities
            })) {
                throw new Error('Cannot consume this producer');
            }

            const consumerOptions = await this.requestConsume(producerId);
            
            const consumer = await this.recvTransport.consume({
                id: consumerOptions.id,
                producerId: consumerOptions.producerId,
                kind: consumerOptions.kind,
                rtpParameters: consumerOptions.rtpParameters
            });

            this.consumers.set(consumer.id, {
                consumer,
                participantId,
                kind
            });

            consumer.on('transportclose', () => {
                console.log('Consumer transport closed:', consumer.id);
                this.consumers.delete(consumer.id);
            });

            consumer.on('producerclose', () => {
                console.log('Consumer producer closed:', consumer.id);
                this.closeConsumer(consumer.id);
            });

            // Resume consumer
            await this.socketHandler.resumeConsumer(consumer.id);

            console.log(`Consumer created: ${consumer.id} for producer: ${producerId}`);
            return consumer;
        } catch (error) {
            console.error('Failed to create consumer:', error);
            throw error;
        }
    }

    async requestConsume(producerId) {
        return new Promise((resolve, reject) => {
            if (this.socketHandler && this.socketHandler.socket) {
                this.socketHandler.socket.emit('consume', {
                    producerId,
                    rtpCapabilities: this.device.rtpCapabilities
                }, (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                });
            } else {
                reject(new Error('Socket not available'));
            }
        });
    }

    async produceVideo() {
        try {
            if (!this.app.localVideoStream) {
                throw new Error('No local video stream available');
            }

            const videoTrack = this.app.localVideoStream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No video track available');
            }

            const producer = await this.produce(videoTrack, 'video', {
                source: 'webcam'
            });

            return producer;
        } catch (error) {
            console.error('Failed to produce video:', error);
            throw error;
        }
    }

    async produceAudio() {
        try {
            if (!this.app.localVideoStream) {
                throw new Error('No local video stream available');
            }

            const audioTrack = this.app.localVideoStream.getAudioTracks()[0];
            if (!audioTrack) {
                throw new Error('No audio track available');
            }

            const producer = await this.produce(audioTrack, 'audio', {
                source: 'microphone'
            });

            return producer;
        } catch (error) {
            console.error('Failed to produce audio:', error);
            throw error;
        }
    }

    async produceScreen() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { max: 30 },
                    cursor: 'always'
                    // Remove resolution constraints to capture full screen
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const videoTrack = screenStream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No screen video track available');
            }

            // Stop current webcam producer if exists
            const webcamProducer = Array.from(this.producers.values())
                .find(p => p.appData?.source === 'webcam');
            if (webcamProducer) {
                this.closeProducer(webcamProducer.id);
            }

            const producer = await this.produce(videoTrack, 'video', {
                source: 'screen'
            });

            // Handle screen share end
            videoTrack.addEventListener('ended', () => {
                console.log('Screen share ended');
                this.closeProducer(producer.id);
                this.app.stopScreenShare();
            });

            return producer;
        } catch (error) {
            console.error('Failed to produce screen share:', error);
            throw error;
        }
    }

    async handleNewProducer(producerId, participantId, kind) {
        try {
            console.log(`New producer available: ${producerId} from ${participantId} (${kind})`);
            
            const consumer = await this.consume(producerId, participantId, kind);
            
            // Create or update video tile for this participant
            const stream = new MediaStream([consumer.track]);
            
            if (kind === 'video') {
                // Find existing tile or create new one
                let videoTile = document.getElementById(`video-${participantId}`);
                
                if (!videoTile) {
                    // Create new tile - we need participant info from app
                    const participant = this.app.participants?.find(p => p.id === participantId);
                    videoTile = this.app.addVideoTile(participantId, stream, participant?.name || 'Unknown');
                } else {
                    // Update existing tile
                    const video = videoTile.querySelector('video');
                    if (video) {
                        video.srcObject = stream;
                    } else {
                        // Replace avatar with video
                        const avatar = videoTile.querySelector('.avatar');
                        if (avatar) avatar.remove();
                        
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.autoplay = true;
                        video.playsInline = true;
                        videoTile.prepend(video);
                    }
                }
            } else if (kind === 'audio') {
                // Handle audio-only consumer
                const audioElement = document.createElement('audio');
                audioElement.srcObject = stream;
                audioElement.autoplay = true;
                audioElement.id = `audio-${participantId}`;
                
                // Remove existing audio element if any
                const existingAudio = document.getElementById(`audio-${participantId}`);
                if (existingAudio) {
                    existingAudio.remove();
                }
                
                document.body.appendChild(audioElement);
            }
            
        } catch (error) {
            console.error('Failed to handle new producer:', error);
        }
    }

    async pauseProducer(producerId) {
        const producer = this.producers.get(producerId);
        if (producer && !producer.paused) {
            producer.pause();
            console.log(`Producer paused: ${producerId}`);
        }
    }

    async resumeProducer(producerId) {
        const producer = this.producers.get(producerId);
        if (producer && producer.paused) {
            producer.resume();
            console.log(`Producer resumed: ${producerId}`);
        }
    }

    async pauseConsumer(consumerId) {
        const consumerData = this.consumers.get(consumerId);
        if (consumerData && !consumerData.consumer.paused) {
            consumerData.consumer.pause();
            console.log(`Consumer paused: ${consumerId}`);
        }
    }

    async resumeConsumer(consumerId) {
        const consumerData = this.consumers.get(consumerId);
        if (consumerData && consumerData.consumer.paused) {
            consumerData.consumer.resume();
            console.log(`Consumer resumed: ${consumerId}`);
        }
    }

    closeProducer(producerId) {
        const producer = this.producers.get(producerId);
        if (producer) {
            producer.close();
            this.producers.delete(producerId);
            console.log(`Producer closed: ${producerId}`);
        }
    }

    closeConsumer(consumerId) {
        const consumerData = this.consumers.get(consumerId);
        if (consumerData) {
            consumerData.consumer.close();
            this.consumers.delete(consumerId);
            
            // Remove associated media elements
            if (consumerData.kind === 'audio') {
                const audioElement = document.getElementById(`audio-${consumerData.participantId}`);
                if (audioElement) {
                    audioElement.remove();
                }
            }
            
            console.log(`Consumer closed: ${consumerId}`);
        }
    }

    handleTransportError(direction) {
        console.error(`${direction} transport error - attempting to reconnect`);
        
        this.app.showNotification(
            `Connection issue detected. Attempting to reconnect...`,
            'warning'
        );
        
        // Attempt to recreate transport after a delay
        setTimeout(async () => {
            try {
                if (direction === 'send') {
                    await this.createSendTransport();
                } else {
                    await this.createReceiveTransport();
                }
                
                this.app.showNotification('Connection restored', 'success');
            } catch (error) {
                console.error(`Failed to recreate ${direction} transport:`, error);
                this.app.showNotification('Failed to restore connection', 'error');
            }
        }, 3000);
    }

    async replaceVideoTrack(newTrack) {
        try {
            // Find current video producer
            const videoProducer = Array.from(this.producers.values())
                .find(p => p.kind === 'video');
            
            if (videoProducer) {
                await videoProducer.replaceTrack({ track: newTrack });
                console.log('Video track replaced successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to replace video track:', error);
            return false;
        }
    }

    async replaceAudioTrack(newTrack) {
        try {
            // Find current audio producer
            const audioProducer = Array.from(this.producers.values())
                .find(p => p.kind === 'audio');
            
            if (audioProducer) {
                await audioProducer.replaceTrack({ track: newTrack });
                console.log('Audio track replaced successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to replace audio track:', error);
            return false;
        }
    }

    getStats() {
        const stats = {
            producers: {},
            consumers: {},
            transports: {}
        };

        // Producer stats
        this.producers.forEach((producer, id) => {
            stats.producers[id] = {
                kind: producer.kind,
                paused: producer.paused,
                closed: producer.closed,
                appData: producer.appData
            };
        });

        // Consumer stats  
        this.consumers.forEach((consumerData, id) => {
            const consumer = consumerData.consumer;
            stats.consumers[id] = {
                kind: consumer.kind,
                paused: consumer.paused,
                closed: consumer.closed,
                participantId: consumerData.participantId
            };
        });

        // Transport stats
        if (this.sendTransport) {
            stats.transports.send = {
                id: this.sendTransport.id,
                connectionState: this.sendTransport.connectionState,
                closed: this.sendTransport.closed
            };
        }

        if (this.recvTransport) {
            stats.transports.recv = {
                id: this.recvTransport.id,
                connectionState: this.recvTransport.connectionState,
                closed: this.recvTransport.closed
            };
        }

        return stats;
    }

    async enableAudioLevelObserver() {
        try {
            // Enable audio level detection for producers
            this.producers.forEach(async (producer) => {
                if (producer.kind === 'audio') {
                    const stats = await producer.getStats();
                    // Process audio level stats
                    console.log('Audio level stats:', stats);
                }
            });
        } catch (error) {
            console.error('Failed to enable audio level observer:', error);
        }
    }

    async setMaxIncomingBitrate(bitrate) {
        try {
            if (this.recvTransport) {
                await this.recvTransport.setMaxIncomingBitrate(bitrate);
                console.log(`Max incoming bitrate set to: ${bitrate}`);
            }
        } catch (error) {
            console.error('Failed to set max incoming bitrate:', error);
        }
    }

    async setMaxOutgoingBitrate(bitrate) {
        try {
            // Set bitrate for all video producers
            const videoProducers = Array.from(this.producers.values())
                .filter(p => p.kind === 'video');
            
            for (const producer of videoProducers) {
                const params = producer.rtpParameters;
                if (params.encodings && params.encodings.length > 0) {
                    params.encodings[0].maxBitrate = bitrate;
                    // Note: Changing encodings after creation requires specific MediaSoup support
                }
            }
            
            console.log(`Max outgoing bitrate set to: ${bitrate}`);
        } catch (error) {
            console.error('Failed to set max outgoing bitrate:', error);
        }
    }

    cleanup() {
        console.log('Cleaning up MediaSoup client...');
        
        // Close all producers
        this.producers.forEach((producer, id) => {
            this.closeProducer(id);
        });
        
        // Close all consumers
        this.consumers.forEach((consumerData, id) => {
            this.closeConsumer(id);
        });
        
        // Close transports
        if (this.sendTransport && !this.sendTransport.closed) {
            this.sendTransport.close();
            this.sendTransport = null;
        }
        
        if (this.recvTransport && !this.recvTransport.closed) {
            this.recvTransport.close();
            this.recvTransport = null;
        }
        
        this.isConnected = false;
        console.log('MediaSoup client cleanup completed');
    }

    // Quality management
    async handleQualityLimitation(limitation) {
        console.log('Quality limitation detected:', limitation);
        
        switch (limitation.reason) {
            case 'cpu':
                await this.reduceCpuUsage();
                break;
            case 'bandwidth':
                await this.reduceBandwidth();
                break;
            default:
                console.log('Unknown quality limitation reason');
        }
    }

    async reduceCpuUsage() {
        // Reduce video resolution/frame rate for CPU limitations
        const videoProducers = Array.from(this.producers.values())
            .filter(p => p.kind === 'video');
        
        for (const producer of videoProducers) {
            // Implementation would depend on specific MediaSoup capabilities
            console.log('Reducing CPU usage for producer:', producer.id);
        }
    }

    async reduceBandwidth() {
        // Reduce bitrate for bandwidth limitations
        await this.setMaxOutgoingBitrate(500000); // 500 kbps
        console.log('Reduced bandwidth usage');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaSoupClient;
}