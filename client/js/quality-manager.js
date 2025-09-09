// Quality Manager - Adaptive video/audio quality based on network conditions
class QualityManager {
    constructor(app) {
        this.app = app;
        this.currentVideoQuality = 'hd'; // hd, standard, low
        this.currentAudioQuality = 'high'; // high, medium, low
        this.networkMonitor = null;
        this.qualityCheckInterval = null;
        this.lastQualityChange = 0;
        this.qualityChangeDelay = 5000; // 5 seconds between changes
        
        // Quality presets matching professional standards
        this.videoQualities = {
            uhd: {
                width: { ideal: 3840, min: 1920 },
                height: { ideal: 2160, min: 1080 },
                frameRate: { ideal: 60, min: 30 },
                bitrate: { ideal: 8000000, min: 4000000 } // 8 Mbps
            },
            fhd: {
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                frameRate: { ideal: 30, min: 24 },
                bitrate: { ideal: 2500000, min: 1500000 } // 2.5 Mbps
            },
            hd: {
                width: { ideal: 1280, min: 960 },
                height: { ideal: 720, min: 540 },
                frameRate: { ideal: 30, min: 24 },
                bitrate: { ideal: 1200000, min: 800000 } // 1.2 Mbps
            },
            standard: {
                width: { ideal: 960, min: 640 },
                height: { ideal: 540, min: 480 },
                frameRate: { ideal: 24, min: 20 },
                bitrate: { ideal: 600000, min: 400000 } // 600 Kbps
            },
            low: {
                width: { ideal: 640, min: 320 },
                height: { ideal: 480, min: 240 },
                frameRate: { ideal: 20, min: 15 },
                bitrate: { ideal: 300000, min: 200000 } // 300 Kbps
            }
        };
        
        this.audioQualities = {
            high: {
                sampleRate: { ideal: 48000, min: 44100 },
                channelCount: { ideal: 2, min: 1 },
                bitrate: { ideal: 128000, min: 96000 } // 128 Kbps
            },
            medium: {
                sampleRate: { ideal: 44100, min: 22050 },
                channelCount: { ideal: 2, min: 1 },
                bitrate: { ideal: 96000, min: 64000 } // 96 Kbps
            },
            low: {
                sampleRate: { ideal: 22050, min: 16000 },
                channelCount: { ideal: 1, min: 1 },
                bitrate: { ideal: 64000, min: 32000 } // 64 Kbps
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupNetworkMonitoring();
        this.startWebRTCStatsMonitoring();
        console.log('Quality Manager initialized');
    }
    
    setupNetworkMonitoring() {
        // Use Network Information API if available
        if ('connection' in navigator) {
            this.networkMonitor = navigator.connection;
            
            this.networkMonitor.addEventListener('change', () => {
                this.handleNetworkChange();
            });
            
            // Initial quality assessment
            setTimeout(() => this.handleNetworkChange(), 1000);
        }
        
        // Fallback: Monitor WebRTC stats for network quality
        this.startWebRTCStatsMonitoring();
    }
    
    handleNetworkChange() {
        if (!this.networkMonitor) return;
        
        const connection = this.networkMonitor;
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink; // Mbps
        const rtt = connection.rtt; // Round-trip time
        
        console.log(`Network change detected: ${effectiveType}, ${downlink}Mbps, ${rtt}ms RTT`);
        
        // Determine optimal quality based on network conditions
        let recommendedVideoQuality, recommendedAudioQuality;
        
        if (effectiveType === '4g' && downlink >= 10 && rtt < 100) {
            recommendedVideoQuality = 'fhd';
            recommendedAudioQuality = 'high';
        } else if (effectiveType === '4g' && downlink >= 5 && rtt < 200) {
            recommendedVideoQuality = 'hd';
            recommendedAudioQuality = 'high';
        } else if (effectiveType === '3g' || (downlink >= 1.5 && rtt < 300)) {
            recommendedVideoQuality = 'standard';
            recommendedAudioQuality = 'medium';
        } else {
            recommendedVideoQuality = 'low';
            recommendedAudioQuality = 'low';
        }
        
        this.adjustQuality(recommendedVideoQuality, recommendedAudioQuality);
    }
    
    startWebRTCStatsMonitoring() {
        this.qualityCheckInterval = setInterval(() => {
            this.checkWebRTCStats();
        }, 5000); // Check every 5 seconds
    }
    
    async checkWebRTCStats() {
        if (!this.app.webrtcManager || !this.app.webrtcManager.peerConnections) {
            return;
        }
        
        // Analyze WebRTC stats from all peer connections
        for (const [peerId, pc] of this.app.webrtcManager.peerConnections) {
            try {
                const stats = await pc.getStats();
                const networkStats = this.analyzeWebRTCStats(stats);
                
                if (networkStats.shouldAdjustQuality) {
                    this.adjustQualityBasedOnStats(networkStats);
                }
            } catch (error) {
                console.warn('Failed to get WebRTC stats:', error);
            }
        }
    }
    
    analyzeWebRTCStats(stats) {
        let packetsLost = 0;
        let totalPackets = 0;
        let currentRTT = 0;
        let availableBandwidth = 0;
        
        stats.forEach(stat => {
            if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                packetsLost += stat.packetsLost || 0;
                totalPackets += stat.packetsReceived || 0;
            } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                currentRTT = stat.currentRoundTripTime * 1000; // Convert to ms
                availableBandwidth = stat.availableOutgoingBitrate || 0;
            }
        });
        
        const packetLossRate = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;
        
        return {
            packetLossRate,
            rtt: currentRTT,
            bandwidth: availableBandwidth,
            shouldAdjustQuality: packetLossRate > 5 || currentRTT > 300 || availableBandwidth < 500000
        };
    }
    
    adjustQualityBasedOnStats(networkStats) {
        const now = Date.now();
        if (now - this.lastQualityChange < this.qualityChangeDelay) {
            return; // Prevent frequent quality changes
        }
        
        let newVideoQuality = this.currentVideoQuality;
        let newAudioQuality = this.currentAudioQuality;
        
        if (networkStats.packetLossRate > 10 || networkStats.rtt > 500) {
            // Severe network issues
            newVideoQuality = 'low';
            newAudioQuality = 'low';
        } else if (networkStats.packetLossRate > 5 || networkStats.rtt > 300) {
            // Moderate network issues
            if (this.currentVideoQuality === 'fhd') newVideoQuality = 'hd';
            else if (this.currentVideoQuality === 'hd') newVideoQuality = 'standard';
            
            if (this.currentAudioQuality === 'high') newAudioQuality = 'medium';
        } else if (networkStats.packetLossRate < 2 && networkStats.rtt < 100 && networkStats.bandwidth > 2000000) {
            // Good network conditions - can upgrade quality
            if (this.currentVideoQuality === 'standard') newVideoQuality = 'hd';
            else if (this.currentVideoQuality === 'hd' && networkStats.bandwidth > 4000000) newVideoQuality = 'fhd';
            
            if (this.currentAudioQuality === 'medium') newAudioQuality = 'high';
        }
        
        this.adjustQuality(newVideoQuality, newAudioQuality);
    }
    
    async adjustQuality(videoQuality, audioQuality) {
        const now = Date.now();
        if (now - this.lastQualityChange < this.qualityChangeDelay) {
            return; // Prevent frequent quality changes
        }
        
        if (videoQuality === this.currentVideoQuality && audioQuality === this.currentAudioQuality) {
            return; // No change needed
        }
        
        console.log(`Adjusting quality: Video ${this.currentVideoQuality} → ${videoQuality}, Audio ${this.currentAudioQuality} → ${audioQuality}`);
        
        try {
            await this.applyVideoQuality(videoQuality);
            await this.applyAudioQuality(audioQuality);
            
            this.currentVideoQuality = videoQuality;
            this.currentAudioQuality = audioQuality;
            this.lastQualityChange = now;
            
            // Notify user about quality change
            this.showQualityNotification(videoQuality, audioQuality);
            
        } catch (error) {
            console.error('Failed to adjust quality:', error);
        }
    }
    
    async applyVideoQuality(quality) {
        const videoConstraints = this.buildVideoConstraints(quality);
        
        if (this.app.webrtcManager && this.app.webrtcManager.localStream) {
            const videoTrack = this.app.webrtcManager.localStream.getVideoTracks()[0];
            if (videoTrack) {
                try {
                    await videoTrack.applyConstraints(videoConstraints);
                    console.log(`Applied video quality: ${quality}`);
                } catch (error) {
                    console.warn('Failed to apply video constraints, recreating stream:', error);
                    await this.recreateVideoStream(videoConstraints);
                }
            }
        }
    }
    
    async applyAudioQuality(quality) {
        const audioConstraints = this.buildAudioConstraints(quality);
        
        if (this.app.webrtcManager && this.app.webrtcManager.localStream) {
            const audioTrack = this.app.webrtcManager.localStream.getAudioTracks()[0];
            if (audioTrack) {
                try {
                    await audioTrack.applyConstraints(audioConstraints);
                    console.log(`Applied audio quality: ${quality}`);
                } catch (error) {
                    console.warn('Failed to apply audio constraints:', error);
                    // Audio constraints changes are less critical, continue
                }
            }
        }
    }
    
    async recreateVideoStream(videoConstraints) {
        if (!this.app.webrtcManager) return;
        
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false // Keep existing audio
            });
            
            const newVideoTrack = newStream.getVideoTracks()[0];
            await this.app.webrtcManager.replaceVideoTrack(newVideoTrack);
            
        } catch (error) {
            console.error('Failed to recreate video stream:', error);
        }
    }
    
    buildVideoConstraints(quality) {
        const preset = this.videoQualities[quality] || this.videoQualities.hd;
        
        return {
            width: preset.width,
            height: preset.height,
            frameRate: preset.frameRate,
            aspectRatio: { ideal: 16/9 },
            facingMode: 'user'
        };
    }
    
    buildAudioConstraints(quality) {
        const preset = this.audioQualities[quality] || this.audioQualities.high;
        
        return {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: preset.sampleRate,
            channelCount: preset.channelCount,
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
        };
    }
    
    showQualityNotification(videoQuality, audioQuality) {
        const videoLabel = this.getQualityLabel(videoQuality);
        const audioLabel = this.getQualityLabel(audioQuality);
        
        if (this.app.showNotification) {
            this.app.showNotification(
                `Quality adjusted: ${videoLabel} video, ${audioLabel} audio`,
                'info',
                2000
            );
        }
    }
    
    getQualityLabel(quality) {
        const labels = {
            uhd: '4K',
            fhd: 'Full HD',
            hd: 'HD',
            standard: 'Standard',
            low: 'Low',
            high: 'High',
            medium: 'Medium'
        };
        return labels[quality] || quality;
    }
    
    // Manual quality control methods
    setVideoQuality(quality) {
        if (this.videoQualities[quality]) {
            this.adjustQuality(quality, this.currentAudioQuality);
        }
    }
    
    setAudioQuality(quality) {
        if (this.audioQualities[quality]) {
            this.adjustQuality(this.currentVideoQuality, quality);
        }
    }
    
    getCurrentQualityInfo() {
        return {
            video: {
                quality: this.currentVideoQuality,
                settings: this.videoQualities[this.currentVideoQuality]
            },
            audio: {
                quality: this.currentAudioQuality,
                settings: this.audioQualities[this.currentAudioQuality]
            }
        };
    }
    
    cleanup() {
        if (this.qualityCheckInterval) {
            clearInterval(this.qualityCheckInterval);
            this.qualityCheckInterval = null;
        }
        
        if (this.networkMonitor) {
            this.networkMonitor.removeEventListener('change', this.handleNetworkChange);
        }
        
        console.log('Quality Manager cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QualityManager;
}