// Main Application Entry Point
class EduMeet {
    constructor() {
        this.currentUser = null;
        this.roomId = null;
        this.isTeacher = false;
        this.isJoined = false;
        this.startTime = null;
        this.timerInterval = null;
        
        // Participants
        this.participants = [];
        
        // Media streams
        this.localVideoStream = null;
        this.localAudioStream = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        
        // UI state
        this.isSidebarOpen = false;
        this.activePanel = null;
        this.isCanvasActive = false;
        this.pinnedParticipant = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkUrlParams();
        // Don't setup media preview automatically - wait for user interaction
        this.initializeComponents();
        // Start with a brief loading screen, then show join screen
        this.initializeApp();
    }

    initializeComponents() {
        console.log('Initializing components...');
        const componentInit = (name, initFn) => {
            try {
                initFn();
                console.log(`✅ ${name} initialized successfully`);
            } catch (e) {
                console.error(`❌ Failed to initialize ${name}:`, e);
                // Only show notification for critical components
                if (name === 'SocketHandler') {
                    this.showNotification(`${name} failed to load`, 'error');
                } else {
                    console.log(`⚠️ ${name} not available - some features may be limited`);
                }
            }
        };

        // Initialize socket handler first
        componentInit('SocketHandler', () => {
            if (typeof SocketHandler === 'undefined') throw new Error('Class not found');
            console.log('Creating SocketHandler...');
            this.socketHandler = new SocketHandler(this);
            console.log('SocketHandler created:', this.socketHandler);
        });

        componentInit('WebRTCManager', () => {
            if (typeof WebRTCManager === 'undefined') return; // optional
            this.webrtcManager = new WebRTCManager(this);
        });

        componentInit('MediaSoupClient', () => {
            if (typeof MediaSoupClient === 'undefined') return; // optional
            this.mediasoupClient = new MediaSoupClient(this);
        });

        componentInit('CanvasManager', () => {
            if (typeof CanvasManager === 'undefined') return; // optional
            this.canvasManager = new CanvasManager(this);
        });

        componentInit('UIControls', () => {
            if (typeof UIControls === 'undefined') return; // optional
            this.uiControls = new UIControls(this);
        });

        console.log('Components initialization complete');
    }

    async initializeApp() {
        // Show loading screen with realistic initialization steps
        await this.simulateLoading();
        
        // Hide loading screen and show join screen
        this.hideLoadingScreen();
    }

    async simulateLoading() {
        // Simulate realistic loading steps
        const steps = [
            { text: "Initializing WebRTC...", delay: 200 },
            { text: "Connecting to server...", delay: 200 },
            { text: "Setting up media devices...", delay: 200 },
            { text: "Preparing interface...", delay: 200 }
        ];

        for (let step of steps) {
            this.updateLoadingText(step.text);
            await this.delay(step.delay);
        }
    }

    updateLoadingText(text) {
        const subtitle = document.querySelector('.loading-subtitle');
        if (subtitle) {
            subtitle.textContent = text;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    hideLoadingScreen() {
        console.log('Hiding loading screen...');
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(1.1)';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                console.log('Loading screen hidden');
            }, 500);
        }
    }

    showLoadingScreen() {
        console.log('Showing loading screen...');
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
            loadingScreen.style.transform = 'scale(1)';
        }
    }

    bindEvents() {
        // Join form
        const joinForm = document.getElementById('joinForm');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => this.handleJoinRoom(e));
        }

        // Room creation buttons
        const createRoomBtn = document.getElementById('createRoomBtn');
        const generateRoomBtn = document.getElementById('generateRoomBtn');
        
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => this.handleCreateRoom());
        }
        if (generateRoomBtn) {
            generateRoomBtn.addEventListener('click', () => this.generateRoomId());
        }

        // Preview controls
        const togglePreviewCamera = document.getElementById('togglePreviewCamera');
        const togglePreviewMic = document.getElementById('togglePreviewMic');
        
        if (togglePreviewCamera) {
            togglePreviewCamera.addEventListener('click', () => this.togglePreviewVideo());
        }
        if (togglePreviewMic) {
            togglePreviewMic.addEventListener('click', () => this.togglePreviewAudio());
        }

        // Main controls
        this.bindMainControls();
        
        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('resize', () => this.handleResize());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    bindMainControls() {
        // Video/Audio controls
        const toggleMic = document.getElementById('toggleMic');
        const toggleCamera = document.getElementById('toggleCamera');
        const shareScreen = document.getElementById('shareScreen');
        const leaveRoom = document.getElementById('leaveRoom');
        const raiseHand = document.getElementById('raiseHand');
        const toggleCanvasControl = document.getElementById('toggleCanvasControl');

        if (toggleMic) {
            toggleMic.addEventListener('click', () => this.toggleMicrophone());
        }
        if (toggleCamera) {
            toggleCamera.addEventListener('click', () => this.toggleCamera());
        }
        if (shareScreen) {
            shareScreen.addEventListener('click', () => this.toggleScreenShare());
        }
        if (leaveRoom) {
            leaveRoom.addEventListener('click', () => this.leaveRoom());
        }
        if (raiseHand) {
            raiseHand.addEventListener('click', () => this.raiseHand());
        }
        if (toggleCanvasControl) {
            toggleCanvasControl.addEventListener('click', () => this.toggleCanvas());
        }

        // Header controls
        const toggleChat = document.getElementById('toggleChat');
        const toggleCanvas = document.getElementById('toggleCanvas');
        const toggleParticipants = document.getElementById('toggleParticipants');
        const settingsBtn = document.getElementById('settingsBtn');

        if (toggleChat) {
            toggleChat.addEventListener('click', () => this.togglePanel('chat'));
        }
        if (toggleCanvas) {
            toggleCanvas.addEventListener('click', () => this.toggleCanvas());
        }
        if (toggleParticipants) {
            toggleParticipants.addEventListener('click', () => this.togglePanel('participants'));
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Panel close buttons
        const closeChat = document.getElementById('closeChat');
        const closeParticipants = document.getElementById('closeParticipants');

        if (closeChat) {
            closeChat.addEventListener('click', () => this.closePanel());
        }
        if (closeParticipants) {
            closeParticipants.addEventListener('click', () => this.closePanel());
        }

        // Chat
        const chatInput = document.getElementById('chatInput');
        const sendChat = document.getElementById('sendChat');

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
        if (sendChat) {
            sendChat.addEventListener('click', () => this.sendChatMessage());
        }

        // Modal close
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Click outside modal to close
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room') || window.location.pathname.split('/room/')[1];
        
        if (roomFromUrl) {
            const roomInput = document.getElementById('roomId');
            if (roomInput) {
                roomInput.value = roomFromUrl;
            }
        }
    }


    async setupMediaPreview() {
        try {
            const constraints = {
                video: { width: 320, height: 240 },
                audio: false // Don't enable audio for preview to avoid feedback
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const previewVideo = document.getElementById('previewVideo');
            
            if (previewVideo) {
                previewVideo.srcObject = stream;
                this.localVideoStream = stream;
            }
        } catch (error) {
            console.warn('Could not setup media preview:', error);
            this.showNotification('Could not access camera. Please check permissions.', 'warning');
        }
    }

    async enablePreviewIfNeeded() {
        // Only start preview when user clicks camera button
        if (!this.localVideoStream) {
            await this.setupMediaPreview();
        }
    }

    async togglePreviewVideo() {
        const button = document.getElementById('togglePreviewCamera');
        const video = document.getElementById('previewVideo');
        
        if (this.localVideoStream && this.localVideoStream.getVideoTracks().length > 0) {
            // Stop current stream and release camera
            this.localVideoStream.getVideoTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped and released');
            });
            video.srcObject = null;
            this.localVideoStream = null;
            this.isVideoEnabled = false;
            button.classList.add('disabled');
            this.showNotification('Camera turned off and released', 'info');
        } else {
            // Start video stream
            try {
                await this.enablePreviewIfNeeded();
                this.isVideoEnabled = true;
                button.classList.remove('disabled');
                this.showNotification('Camera turned on', 'success');
            } catch (error) {
                this.showNotification('Could not access camera', 'error');
            }
        }
    }

    togglePreviewAudio() {
        const button = document.getElementById('togglePreviewMic');
        this.isAudioEnabled = !this.isAudioEnabled;
        
        if (this.isAudioEnabled) {
            button.classList.remove('disabled');
        } else {
            button.classList.add('disabled');
        }
    }

    async handleJoinRoom(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userName = formData.get('userName').trim();
        let roomId = formData.get('roomId').trim();
        const isTeacher = formData.has('isTeacher');

        if (!userName) {
            this.showNotification('Please enter your name', 'error');
            return;
        }

        // If no room ID provided, generate one
        if (!roomId) {
            roomId = this.generateRoomId();
        }

        this.currentUser = {
            name: userName,
            isTeacher: isTeacher
        };
        this.roomId = roomId;
        this.isTeacher = isTeacher;

        // Update URL
        window.history.pushState({}, '', `/room/${roomId}`);

        // Show loading with progress
        this.showLoadingScreen();
        this.updateLoadingText('Initializing media...');

        try {
            // Initialize media
            await this.initializeMedia();
            this.updateLoadingText('Connecting to room...');
            
            // Connect to room
            if (this.socketHandler) {
                await this.socketHandler.joinRoom(roomId, userName, isTeacher);
            }
            
            this.updateLoadingText('Setting up interface...');
            await this.delay(500);

            // Switch to meeting interface
            this.showMeetingRoom();
            this.startTimer();
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.showNotification('Failed to join room. Please try again.', 'error');
        } finally {
            this.hideLoadingScreen();
        }
    }

    generateRoomId() {
        // Generate a unique room ID with timestamp
        const adjectives = ['Bright', 'Smart', 'Quick', 'Cool', 'Swift', 'Bold', 'Wise', 'Kind'];
        const nouns = ['Eagle', 'Tiger', 'Shark', 'Wolf', 'Lion', 'Bear', 'Fox', 'Hawk'];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        
        const roomId = `${adjective}${noun}${timestamp}`;
        
        // Update the input field
        const roomInput = document.getElementById('roomId');
        if (roomInput) {
            roomInput.value = roomId;
        }
        
        console.log('Generated unique room ID:', roomId);
        return roomId;
    }

    async handleCreateRoom() {
        const userName = document.getElementById('userName').value.trim();
        
        if (!userName) {
            this.showNotification('Please enter your name first', 'error');
            document.getElementById('userName').focus();
            return;
        }

        // Generate new room ID
        const roomId = this.generateRoomId();
        
        // Mark as teacher by default when creating room
        const teacherCheckbox = document.getElementById('isTeacher');
        if (teacherCheckbox) {
            teacherCheckbox.checked = true;
        }

        // Auto-submit the form
        setTimeout(() => {
            const form = document.getElementById('joinForm');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
            }
        }, 500);
    }

    async initializeMedia() {
        try {
            // Initialize WebRTC manager if available
            if (this.webrtcManager) {
                this.webrtcManager.init(this.socketHandler);
                await this.webrtcManager.initializeLocalMedia();
                
                console.log('WebRTC media initialized');
            } else {
                // Fallback to simple media access
                const constraints = {
                    video: this.isVideoEnabled ? {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    } : false,
                    audio: this.isAudioEnabled ? {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 48000
                    } : false
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // Stop preview stream
                if (this.localVideoStream) {
                    this.localVideoStream.getTracks().forEach(track => track.stop());
                }
                
                this.localVideoStream = stream;
                
                // Add local video tile - make sure currentUser is properly set
                if (this.currentUser && this.currentUser.name) {
                    this.addVideoTile('local', stream, this.currentUser.name, true);
                } else {
                    console.error('Current user not properly initialized for local video tile');
                }
            }
            
        } catch (error) {
            console.error('Error initializing media:', error);
            throw error;
        }
    }

    // Helper to update local tile stream when tracks are replaced
    replaceVideoTileStream(participantId, stream) {
        const tile = document.querySelector(`.video-tile[data-participant-id="${participantId}"] video`);
        if (tile) {
            tile.srcObject = stream;
        }
    }

    updateLocalVideoTrack(stream) {
        this.replaceVideoTileStream('local', stream);
    }

    showMeetingRoom() {
        document.getElementById('joinScreen').classList.add('hidden');
        document.getElementById('meetingRoom').classList.remove('hidden');
        
        // Update room title
        const roomTitle = document.getElementById('roomTitle');
        if (roomTitle) {
            roomTitle.textContent = `Room: ${this.roomId}`;
        }
        
        // Hide canvas button for students
        if (!this.isTeacher) {
            const canvasBtn = document.getElementById('toggleCanvasControl');
            if (canvasBtn) {
                canvasBtn.style.display = 'none';
            }
        }
        
        this.isJoined = true;
        console.log(`Joined as ${this.isTeacher ? 'teacher' : 'student'}`);
    }

    addVideoTile(participantId, stream, name, isLocal = false) {
        const videoGrid = document.getElementById('videoGrid');
        const existingTile = document.getElementById(`video-${participantId}`);
        
        if (existingTile) {
            // Update existing tile with stream
            const video = existingTile.querySelector('video');
            const avatar = existingTile.querySelector('.avatar');
            
            if (stream && stream.getTracks().length > 0) {
                if (video) {
                    // Update existing video element
                    video.srcObject = stream;
                    video.style.display = 'block';
                } else {
                    // Create new video element
                    const newVideo = document.createElement('video');
                    newVideo.srcObject = stream;
                    newVideo.autoplay = true;
                    newVideo.muted = isLocal;
                    newVideo.playsInline = true;
                    // Insert video as first child
                    existingTile.insertBefore(newVideo, existingTile.firstChild);
                }
                
                // Hide avatar when video is available
                if (avatar) {
                    avatar.style.display = 'none';
                }
                
                console.log(`Updated video tile for ${participantId} with stream`);
            }
            return existingTile;
        }

        // Create new video tile
        const videoTile = document.createElement('div');
        videoTile.className = 'video-tile';
        videoTile.id = `video-${participantId}`;
        videoTile.dataset.participantId = participantId;

        const hasVideo = stream && stream.getVideoTracks().length > 0 && 
                         stream.getVideoTracks()[0].enabled;
        
        if (stream && stream.getTracks().length > 0) {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = isLocal; // Mute local video to prevent feedback
            video.playsInline = true;
            video.style.display = hasVideo ? 'block' : 'none';
            videoTile.appendChild(video);
            
            // Also add avatar for when video is disabled
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = name.charAt(0).toUpperCase();
            avatar.style.display = hasVideo ? 'none' : 'flex';
            videoTile.appendChild(avatar);
        } else {
            // Show avatar when no stream
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = name.charAt(0).toUpperCase();
            avatar.style.display = 'flex';
            videoTile.appendChild(avatar);
        }

        // Add participant info
        const participantInfo = document.createElement('div');
        participantInfo.className = 'participant-info';
        participantInfo.textContent = isLocal ? `${name} (You)` : name;
        videoTile.appendChild(participantInfo);

        // Add controls
        const videoControls = document.createElement('div');
        videoControls.className = 'video-controls';
        
        const hasAudio = stream && stream.getAudioTracks().length > 0 && 
                         stream.getAudioTracks()[0].enabled;
        if (!hasAudio) {
            const micIcon = document.createElement('div');
            micIcon.className = 'control-icon muted';
            micIcon.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            videoControls.appendChild(micIcon);
        }

        if (!hasVideo) {
            const videoIcon = document.createElement('div');
            videoIcon.className = 'control-icon';
            videoIcon.innerHTML = '<i class="fas fa-video-slash"></i>';
            videoControls.appendChild(videoIcon);
        }

        videoTile.appendChild(videoControls);

        // Add pin button (except for local)
        if (!isLocal) {
            const pinBtn = document.createElement('button');
            pinBtn.className = 'pin-btn';
            pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
            pinBtn.addEventListener('click', () => this.togglePinParticipant(participantId));
            videoTile.appendChild(pinBtn);
        }

        videoGrid.appendChild(videoTile);
        console.log(`Created new video tile for ${participantId}`);
        return videoTile;
    }

    replaceVideoTileStream(participantId, stream) {
        const tile = document.getElementById(`video-${participantId}`);
        if (tile) {
            const video = tile.querySelector('video');
            if (video) {
                video.srcObject = stream;
                video.style.display = 'block';
            } else if (stream) {
                const newVideo = document.createElement('video');
                newVideo.srcObject = stream;
                newVideo.autoplay = true;
                newVideo.playsInline = true;
                newVideo.muted = (participantId === 'local');
                tile.insertBefore(newVideo, tile.firstChild);
            }
            
            // Update avatar visibility
            const avatar = tile.querySelector('.avatar');
            if (avatar && stream && stream.getVideoTracks().length > 0) {
                avatar.style.display = 'none';
            }
        }
    }

    removeVideoTile(participantId) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (videoTile) {
            videoTile.remove();
        }
    }

    updateVideoTileMediaState(participantId, videoEnabled, audioEnabled) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;

        // Update video controls
        const videoControls = videoTile.querySelector('.video-controls');
        if (videoControls) {
            // Remove existing icons
            videoControls.innerHTML = '';

            // Add audio icon if muted
            if (!audioEnabled) {
                const micIcon = document.createElement('div');
                micIcon.className = 'control-icon muted';
                micIcon.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                videoControls.appendChild(micIcon);
            }

            // Add video icon if disabled
            if (!videoEnabled) {
                const videoIcon = document.createElement('div');
                videoIcon.className = 'control-icon';
                videoIcon.innerHTML = '<i class="fas fa-video-slash"></i>';
                videoControls.appendChild(videoIcon);
            }
        }

        // Show/hide avatar based on video state
        const video = videoTile.querySelector('video');
        const avatar = videoTile.querySelector('.avatar');

        if (videoEnabled && video) {
            video.style.display = 'block';
            if (avatar) avatar.style.display = 'none';
        } else {
            if (video) video.style.display = 'none';
            if (avatar) {
                avatar.style.display = 'flex';
            } else {
                // Create avatar if it doesn't exist
                const newAvatar = document.createElement('div');
                newAvatar.className = 'avatar';
                newAvatar.textContent = this.getParticipantName(participantId).charAt(0).toUpperCase();
                videoTile.appendChild(newAvatar);
            }
        }
    }

    getParticipantName(participantId) {
        if (participantId === 'local') return this.currentUser?.name || 'You';
        const participant = this.participants?.find(p => p.id === participantId);
        return participant ? participant.name : 'Unknown';
    }

    togglePinParticipant(participantId) {
        if (this.pinnedParticipant === participantId) {
            // Unpin
            this.pinnedParticipant = null;
            document.getElementById('pinnedVideo').classList.add('hidden');
            document.getElementById('videoGrid').classList.remove('hidden');
            
            // Remove pin styling
            document.querySelectorAll('.video-tile.pinned').forEach(tile => {
                tile.classList.remove('pinned');
            });
        } else {
            // Pin new participant
            this.pinnedParticipant = participantId;
            const videoTile = document.getElementById(`video-${participantId}`);
            
            if (videoTile) {
                // Move to pinned area
                const pinnedVideo = document.getElementById('pinnedVideo');
                const videoClone = videoTile.cloneNode(true);
                videoClone.id = `pinned-${participantId}`;
                videoClone.classList.add('pinned');
                
                pinnedVideo.innerHTML = '';
                pinnedVideo.appendChild(videoClone);
                pinnedVideo.classList.remove('hidden');
                
                // Hide grid or show smaller version
                document.getElementById('videoGrid').style.opacity = '0.3';
                
                // Add pin styling
                videoTile.classList.add('pinned');
            }
        }

        // Notify other participants
        if (this.socketHandler) {
            this.socketHandler.emitPinParticipant(participantId);
        }
    }

    toggleMicrophone() {
        const button = document.getElementById('toggleMic');
        
        // Use WebRTC manager if available
        if (this.webrtcManager) {
            this.webrtcManager.toggleAudio().then((enabled) => {
                this.isAudioEnabled = enabled;
                if (enabled) {
                    button.classList.remove('disabled');
                } else {
                    button.classList.add('disabled');
                }
            });
        } else {
            // Fallback to direct stream manipulation
            if (this.localVideoStream) {
                const audioTracks = this.localVideoStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    this.isAudioEnabled = !audioTracks[0].enabled;
                    audioTracks[0].enabled = this.isAudioEnabled;
                    
                    if (this.isAudioEnabled) {
                        button.classList.remove('disabled');
                    } else {
                        button.classList.add('disabled');
                    }

                    // Notify server
                    if (this.socketHandler) {
                        this.socketHandler.socket.emit('toggle-audio', { enabled: this.isAudioEnabled });
                    }
                }
            }
        }
    }

    toggleCamera() {
        const button = document.getElementById('toggleCamera');
        
        // Use WebRTC manager if available
        if (this.webrtcManager) {
            this.webrtcManager.toggleVideo().then((enabled) => {
                this.isVideoEnabled = enabled;
                if (enabled) {
                    button.classList.remove('disabled');
                } else {
                    button.classList.add('disabled');
                }
            });
        } else {
            // Fallback to direct stream manipulation
            if (this.localVideoStream) {
                const videoTracks = this.localVideoStream.getVideoTracks();
                if (videoTracks.length > 0) {
                    this.isVideoEnabled = !videoTracks[0].enabled;
                    videoTracks[0].enabled = this.isVideoEnabled;
                    
                    if (this.isVideoEnabled) {
                        button.classList.remove('disabled');
                    } else {
                        button.classList.add('disabled');
                    }

                    // Update local video tile
                    const localTile = document.getElementById('video-local');
                    if (localTile) {
                        const video = localTile.querySelector('video');
                        const avatar = localTile.querySelector('.avatar');
                        
                        if (this.isVideoEnabled) {
                            if (avatar) avatar.style.display = 'none';
                            if (video) video.style.display = 'block';
                        } else {
                            if (video) video.style.display = 'none';
                            if (avatar) {
                                avatar.style.display = 'flex';
                            } else {
                                // Create avatar if it doesn't exist
                                const newAvatar = document.createElement('div');
                                newAvatar.className = 'avatar';
                                newAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
                                localTile.appendChild(newAvatar);
                            }
                        }
                    }

                    // Notify server
                    if (this.socketHandler) {
                        this.socketHandler.socket.emit('toggle-video', { enabled: this.isVideoEnabled });
                    }
                }
            }
        }
    }

    async toggleScreenShare() {
        const button = document.getElementById('shareScreen');
        
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                // Replace video track
                if (this.localVideoStream) {
                    const videoTrack = screenStream.getVideoTracks()[0];
                    const sender = this.peerConnection?.getSenders().find(s => 
                        s.track && s.track.kind === 'video'
                    );
                    
                    if (sender) {
                        await sender.replaceTrack(videoTrack);
                    }
                }

                this.isScreenSharing = true;
                button.classList.add('active');
                this.showNotification('Screen sharing started', 'success');

                // Listen for screen share end
                screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                    this.stopScreenShare();
                });

            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showNotification('Could not start screen sharing', 'error');
        }
    }

    async stopScreenShare() {
        const button = document.getElementById('shareScreen');
        
        try {
            // Get original camera stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: this.isVideoEnabled,
                audio: this.isAudioEnabled 
            });

            // Replace screen share with camera
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                const sender = this.peerConnection?.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack);
                }
                
                this.localVideoStream = stream;
            }

            this.isScreenSharing = false;
            button.classList.remove('active');
            this.showNotification('Screen sharing stopped', 'info');
            
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }

    raiseHand() {
        const button = document.getElementById('raiseHand');
        button.classList.toggle('active');
        
        if (this.socketHandler) {
            this.socketHandler.emitRaiseHand();
        }

        this.showNotification('Hand raised', 'info');
        
        // Auto-lower hand after 30 seconds
        setTimeout(() => {
            button.classList.remove('active');
        }, 30000);
    }

    toggleCanvas() {
        // Allow both teachers and students to use canvas
        this.isCanvasActive = !this.isCanvasActive;
        const container = document.getElementById('canvasContainer');
        const button = document.getElementById('toggleCanvasControl');
        
        if (this.isCanvasActive) {
            container.classList.remove('hidden');
            container.classList.add('active');
            button.classList.add('active');
            
            if (this.canvasManager) {
                this.canvasManager.activate();
                // Resize canvas when it becomes visible
                setTimeout(() => {
                    if (this.canvasManager.resizeCanvas) {
                        this.canvasManager.resizeCanvas();
                    }
                }, 100);
            }
            
            this.showNotification('Whiteboard activated', 'success');
        } else {
            container.classList.add('hidden');
            container.classList.remove('active');
            button.classList.remove('active');
            
            if (this.canvasManager) {
                this.canvasManager.deactivate();
            }
            
            this.showNotification('Whiteboard closed', 'info');
        }
    }

    togglePanel(panelName) {
        const panels = {
            'chat': 'chatPanel',
            'canvas': 'canvasContainer',
            'participants': 'participantsPanel'
        };

        const sidebar = document.querySelector('.sidebar');
        const targetPanel = document.getElementById(panels[panelName]);
        const button = document.getElementById(`toggle${panelName.charAt(0).toUpperCase() + panelName.slice(1)}`);

        if (this.activePanel === panelName) {
            // Close current panel
            this.closePanel();
        } else {
            // Close other panels
            this.closePanel();
            
            // Open target panel
            if (targetPanel) {
                targetPanel.classList.add('active');
                if (button) button.classList.add('active');
                this.activePanel = panelName;
                
                if (sidebar && window.innerWidth <= 768) {
                    sidebar.classList.add('active');
                }
            }
        }
    }

    closePanel() {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        document.querySelectorAll('.btn-header').forEach(btn => {
            btn.classList.remove('active');
        });

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        
        this.activePanel = null;
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.socketHandler) {
            this.socketHandler.emitChatMessage(message);
            input.value = '';
        }
    }

    addChatMessage(participantId, participantName, message, timestamp, isOwn = false) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;

        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const authorSpan = document.createElement('span');
        authorSpan.className = 'message-author';
        authorSpan.textContent = participantName;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date(timestamp).toLocaleTimeString();
        
        messageHeader.appendChild(authorSpan);
        messageHeader.appendChild(timeSpan);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message;

        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateParticipantsList(participants) {
        console.log('=== CLIENT: updateParticipantsList ===');
        console.log('Input participants:', participants);
        console.log('Current user ID:', this.currentUser?.id);
        
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) {
            console.warn('Participants list element not found');
            return;
        }

        participantsList.innerHTML = '';
        
        // Always add current user first
        const allParticipants = [];
        if (this.currentUser && this.currentUser.id) {
            allParticipants.push({
                id: this.currentUser.id,
                name: this.currentUser.name,
                isTeacher: this.isTeacher,
                hasVideo: this.isVideoEnabled,
                hasAudio: this.isAudioEnabled
            });
        }
        
        // Add other participants (excluding duplicates)
        participants.forEach(participant => {
            if (participant.id !== this.currentUser?.id) {
                allParticipants.push(participant);
            }
        });
        
        console.log(`Total participants to display: ${allParticipants.length}`);
        console.log('All participants:', allParticipants.map(p => `${p.name} (${p.id})`));
        
        allParticipants.forEach(participant => {
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-item';
            participantItem.dataset.participantId = participant.id;

            const avatar = document.createElement('div');
            avatar.className = 'participant-avatar';
            avatar.textContent = participant.name.charAt(0).toUpperCase();

            const info = document.createElement('div');
            info.className = 'participant-info';
            
            const name = document.createElement('div');
            name.className = 'participant-name';
            name.textContent = participant.id === this.currentUser?.id ? `${participant.name} (You)` : participant.name;
            
            const status = document.createElement('div');
            status.className = `participant-status ${participant.isTeacher ? 'teacher' : ''}`;
            status.textContent = participant.isTeacher ? 'Teacher' : 'Student';
            
            info.appendChild(name);
            info.appendChild(status);

            const controls = document.createElement('div');
            controls.className = 'participant-controls';

            // Audio indicator
            if (!participant.hasAudio) {
                const micBtn = document.createElement('button');
                micBtn.className = 'muted';
                micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                controls.appendChild(micBtn);
            }

            // Video indicator
            if (!participant.hasVideo) {
                const videoBtn = document.createElement('button');
                videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                controls.appendChild(videoBtn);
            }

            participantItem.appendChild(avatar);
            participantItem.appendChild(info);
            participantItem.appendChild(controls);
            participantsList.appendChild(participantItem);
        });

        // Update participant count
        const participantCount = document.getElementById('participantCount');
        if (participantCount) {
            const count = allParticipants.length;
            participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
            console.log(`Updated participant count to: ${count}`);
        }
        console.log('=== END updateParticipantsList ===');
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            this.populateDeviceSettings();
        }
    }

    async populateDeviceSettings() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const micSelect = document.getElementById('microphoneSelect');
            const cameraSelect = document.getElementById('cameraSelect');
            const speakerSelect = document.getElementById('speakerSelect');

            [micSelect, cameraSelect, speakerSelect].forEach(select => {
                if (select) select.innerHTML = '';
            });

            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `${device.kind} ${devices.filter(d => d.kind === device.kind).indexOf(device) + 1}`;

                if (device.kind === 'audioinput' && micSelect) {
                    micSelect.appendChild(option.cloneNode(true));
                } else if (device.kind === 'videoinput' && cameraSelect) {
                    cameraSelect.appendChild(option.cloneNode(true));
                } else if (device.kind === 'audiooutput' && speakerSelect) {
                    speakerSelect.appendChild(option.cloneNode(true));
                }
            });
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    }

    closeModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    startTimer() {
        this.startTime = Date.now();
        const timerElement = document.getElementById('meetingTimer');
        
        if (timerElement) {
            this.timerInterval = setInterval(() => {
                const elapsed = Date.now() - this.startTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }
    }

    leaveRoom() {
        if (confirm('Are you sure you want to leave the meeting?')) {
            this.cleanup();
            window.location.href = '/';
        }
    }

    cleanup() {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Stop media streams
        if (this.localVideoStream) {
            this.localVideoStream.getTracks().forEach(track => track.stop());
        }

        // Close socket connection
        if (this.socketHandler) {
            this.socketHandler.disconnect();
        }

        // Clean up mediasoup
        if (this.mediasoupClient) {
            this.mediasoupClient.cleanup();
        }
    }

    handleResize() {
        // Handle responsive layout changes
        if (window.innerWidth <= 768) {
            this.closePanel();
        }
        
        // Resize canvas if active
        if (this.canvasManager && this.isCanvasActive) {
            this.canvasManager.handleResize();
        }
    }

    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.ctrlKey || event.metaKey) return; // Ignore browser shortcuts

        switch (event.key.toLowerCase()) {
            case 'm':
                event.preventDefault();
                this.toggleMicrophone();
                break;
            case 'v':
                event.preventDefault();
                this.toggleCamera();
                break;
            case 's':
                event.preventDefault();
                this.toggleScreenShare();
                break;
            case 'c':
                event.preventDefault();
                this.togglePanel('chat');
                break;
            case 'p':
                event.preventDefault();
                this.togglePanel('participants');
                break;
            case 'h':
                event.preventDefault();
                this.raiseHand();
                break;
            case 'escape':
                event.preventDefault();
                this.closePanel();
                this.closeModal();
                break;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Public API methods for other components
    onUserJoined(participant) {
        console.log('Main: User joined callback:', participant);
        this.showNotification(`${participant.userName} joined the meeting`, 'success');
        // Add to participants list will be handled by updateParticipantsList
        
        // Force update participants count display
        const participantCount = document.getElementById('participantCount');
        if (participantCount) {
            participantCount.textContent = this.participants.length;
        }
    }

    onUserLeft(participant) {
        this.showNotification(`${participant.userName} left the meeting`, 'info');
        this.removeVideoTile(participant.participantId);
    }

    removeVideoTile(participantId) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (videoTile) {
            videoTile.remove();
        }
        // Also remove from WebRTC manager if available
        if (this.webrtcManager) {
            this.webrtcManager.removeRemoteVideo(participantId);
        }
    }

    onChatMessage(data) {
        this.addChatMessage(
            data.participantId,
            data.participantName,
            data.message,
            data.timestamp,
            data.participantId === this.currentUser?.id
        );
    }

    onParticipantToggle(participantId, type, enabled) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (videoTile) {
            if (type === 'video') {
                // Update video display
            } else if (type === 'audio') {
                // Update audio indicators
            }
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eduMeet = new EduMeet();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.eduMeet && document.hidden) {
        // Pause non-essential features when tab is hidden
    } else if (window.eduMeet && !document.hidden) {
        // Resume features when tab is visible
    }
});