// Media Encoder - Professional encoding settings for WebRTC
class MediaEncoder {
    constructor() {
        this.preferredVideoCodecs = ['H264', 'VP9', 'VP8', 'AV1'];
        this.preferredAudioCodecs = ['opus', 'G722', 'PCMU', 'PCMA'];
        
        // Professional encoding parameters
        this.encodingParameters = {
            video: {
                maxBitrate: 2500000, // 2.5 Mbps max for 1080p
                maxFramerate: 30,
                scaleResolutionDownBy: 1.0,
                scalabilityMode: 'L1T3', // 3 temporal layers for better quality
                adaptivePtime: true,
                networkAdaptation: {
                    enabled: true,
                    maxBitrateVariation: 0.8 // Allow 80% bitrate variation
                }
            },
            audio: {
                maxBitrate: 128000, // 128 Kbps for high-quality audio
                adaptivePtime: true,
                fec: true, // Forward Error Correction
                dtx: true, // Discontinuous Transmission
                networkAdaptation: {
                    enabled: true,
                    maxBitrateVariation: 0.5
                }
            }
        };
    }
    
    // Configure WebRTC peer connection with professional settings
    configurePeerConnection(pc) {
        // Set codec preferences
        this.setCodecPreferences(pc);
        
        // Configure encoding parameters
        this.configureEncodingParameters(pc);
        
        console.log('Peer connection configured with professional encoding settings');
    }
    
    setCodecPreferences(pc) {
        if (!pc.setCodecPreferences) {
            console.warn('setCodecPreferences not supported');
            return;
        }
        
        try {
            // Get available codecs
            const codecs = RTCRtpSender.getCapabilities('video')?.codecs || [];
            const audioCodecs = RTCRtpSender.getCapabilities('audio')?.codecs || [];
            
            // Sort video codecs by preference
            const sortedVideoCodecs = this.sortCodecsByPreference(codecs, this.preferredVideoCodecs);
            const sortedAudioCodecs = this.sortCodecsByPreference(audioCodecs, this.preferredAudioCodecs);
            
            // Apply codec preferences
            const transceivers = pc.getTransceivers();
            transceivers.forEach(transceiver => {
                if (transceiver.receiver.track?.kind === 'video') {
                    pc.setCodecPreferences(transceiver, sortedVideoCodecs);
                } else if (transceiver.receiver.track?.kind === 'audio') {
                    pc.setCodecPreferences(transceiver, sortedAudioCodecs);
                }
            });
            
        } catch (error) {
            console.warn('Failed to set codec preferences:', error);
        }
    }
    
    sortCodecsByPreference(availableCodecs, preferredCodecs) {
        const sorted = [];
        
        // Add preferred codecs first
        preferredCodecs.forEach(preferredName => {
            const codec = availableCodecs.find(c => 
                c.mimeType.toLowerCase().includes(preferredName.toLowerCase())
            );
            if (codec && !sorted.find(s => s.mimeType === codec.mimeType)) {
                // Add codec-specific optimizations
                const optimizedCodec = this.optimizeCodec(codec);
                sorted.push(optimizedCodec);
            }
        });
        
        // Add remaining codecs
        availableCodecs.forEach(codec => {
            if (!sorted.find(s => s.mimeType === codec.mimeType)) {
                sorted.push(codec);
            }
        });
        
        return sorted;
    }
    
    optimizeCodec(codec) {
        const optimized = { ...codec };
        
        // H.264 optimizations
        if (codec.mimeType.includes('H264')) {
            optimized.sdpFmtpLine = this.enhanceH264Parameters(codec.sdpFmtpLine);
        }
        // VP9 optimizations
        else if (codec.mimeType.includes('VP9')) {
            optimized.sdpFmtpLine = this.enhanceVP9Parameters(codec.sdpFmtpLine);
        }
        // Opus optimizations
        else if (codec.mimeType.includes('opus')) {
            optimized.sdpFmtpLine = this.enhanceOpusParameters(codec.sdpFmtpLine);
        }
        
        return optimized;
    }
    
    enhanceH264Parameters(existingParams = '') {
        const params = new Map();
        
        // Parse existing parameters
        if (existingParams) {
            existingParams.split(';').forEach(param => {
                const [key, value] = param.trim().split('=');
                if (key && value) params.set(key, value);
            });
        }
        
        // Add/override professional H.264 parameters
        params.set('profile-level-id', '42e01f'); // Baseline profile, level 3.1
        params.set('level-asymmetry-allowed', '1');
        params.set('packetization-mode', '1');
        params.set('max-fr', '30');
        params.set('max-mbps', '40500'); // For 1080p30
        params.set('max-smbps', '40500');
        
        return Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join(';');
    }
    
    enhanceVP9Parameters(existingParams = '') {
        const params = new Map();
        
        if (existingParams) {
            existingParams.split(';').forEach(param => {
                const [key, value] = param.trim().split('=');
                if (key && value) params.set(key, value);
            });
        }
        
        // VP9 professional parameters
        params.set('profile-id', '0');
        params.set('max-fr', '30');
        params.set('max-fs', '8160'); // For 1080p
        
        return Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join(';');
    }
    
    enhanceOpusParameters(existingParams = '') {
        const params = new Map();
        
        if (existingParams) {
            existingParams.split(';').forEach(param => {
                const [key, value] = param.trim().split('=');
                if (key && value) params.set(key, value);
            });
        }
        
        // Opus professional parameters
        params.set('maxaveragebitrate', '128000'); // 128 Kbps
        params.set('maxplaybackrate', '48000'); // 48 kHz
        params.set('stereo', '1'); // Stereo support
        params.set('sprop-stereo', '1');
        params.set('useinbandfec', '1'); // Forward Error Correction
        params.set('usedtx', '1'); // Discontinuous Transmission
        params.set('cbr', '0'); // Variable bitrate for better quality
        
        return Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join(';');
    }
    
    async configureEncodingParameters(pc) {
        const senders = pc.getSenders();
        
        for (const sender of senders) {
            if (sender.track) {
                await this.configureSenderParameters(sender);
            }
        }
    }
    
    async configureSenderParameters(sender) {
        const track = sender.track;
        const params = sender.getParameters();
        
        if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
        }
        
        // Configure based on track type
        if (track.kind === 'video') {
            this.configureVideoEncoding(params.encodings[0]);
        } else if (track.kind === 'audio') {
            this.configureAudioEncoding(params.encodings[0]);
        }
        
        try {
            await sender.setParameters(params);
            console.log(`Configured ${track.kind} encoding parameters`);
        } catch (error) {
            console.warn(`Failed to set ${track.kind} parameters:`, error);
        }
    }
    
    configureVideoEncoding(encoding) {
        const videoParams = this.encodingParameters.video;
        
        // Set professional video encoding parameters
        encoding.maxBitrate = videoParams.maxBitrate;
        encoding.maxFramerate = videoParams.maxFramerate;
        encoding.scaleResolutionDownBy = videoParams.scaleResolutionDownBy;
        encoding.scalabilityMode = videoParams.scalabilityMode;
        encoding.adaptivePtime = videoParams.adaptivePtime;
        
        // Network adaptation settings
        if (videoParams.networkAdaptation.enabled) {
            encoding.networkAdaptation = {
                enabled: true
            };
        }
    }
    
    configureAudioEncoding(encoding) {
        const audioParams = this.encodingParameters.audio;
        
        // Set professional audio encoding parameters
        encoding.maxBitrate = audioParams.maxBitrate;
        encoding.adaptivePtime = audioParams.adaptivePtime;
        encoding.networkAdaptation = audioParams.networkAdaptation;
    }
    
    // Dynamic bitrate adjustment based on network conditions
    async adjustBitrate(sender, targetBitrate, kind = 'video') {
        const params = sender.getParameters();
        
        if (params.encodings && params.encodings.length > 0) {
            const encoding = params.encodings[0];
            const maxBitrate = kind === 'video' ? 
                this.encodingParameters.video.maxBitrate : 
                this.encodingParameters.audio.maxBitrate;
            
            // Ensure bitrate doesn't exceed maximum
            encoding.maxBitrate = Math.min(targetBitrate, maxBitrate);
            
            try {
                await sender.setParameters(params);
                console.log(`Adjusted ${kind} bitrate to ${encoding.maxBitrate} bps`);
            } catch (error) {
                console.warn(`Failed to adjust ${kind} bitrate:`, error);
            }
        }
    }
    
    // Get optimal encoding settings based on resolution
    getOptimalSettings(width, height, frameRate = 30) {
        const resolution = width * height;
        let bitrate, profile;
        
        if (resolution >= 1920 * 1080) { // 1080p+
            bitrate = 2500000;
            profile = 'high';
        } else if (resolution >= 1280 * 720) { // 720p
            bitrate = 1200000;
            profile = 'main';
        } else if (resolution >= 640 * 480) { // 480p
            bitrate = 600000;
            profile = 'baseline';
        } else { // 360p and below
            bitrate = 300000;
            profile = 'baseline';
        }
        
        return {
            maxBitrate: bitrate,
            maxFramerate: frameRate,
            profile: profile,
            level: this.getH264Level(width, height, frameRate)
        };
    }
    
    getH264Level(width, height, frameRate) {
        const mbps = Math.ceil((width * height * frameRate) / (256 * 16));
        
        if (mbps <= 11880) return '31'; // Level 3.1
        if (mbps <= 40500) return '32'; // Level 3.2
        if (mbps <= 108000) return '40'; // Level 4.0
        if (mbps <= 216000) return '41'; // Level 4.1
        return '42'; // Level 4.2
    }
    
    // Monitor encoding statistics
    async getEncodingStats(sender) {
        try {
            const stats = await sender.getStats();
            const encodingStats = {};
            
            stats.forEach(stat => {
                if (stat.type === 'outbound-rtp') {
                    encodingStats.bitrate = stat.bytesSent * 8 / stat.timestamp;
                    encodingStats.framerate = stat.framesEncoded / stat.timestamp * 1000;
                    encodingStats.keyFrames = stat.keyFramesEncoded;
                    encodingStats.qualityLimitationReason = stat.qualityLimitationReason;
                }
            });
            
            return encodingStats;
        } catch (error) {
            console.warn('Failed to get encoding stats:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaEncoder;
}