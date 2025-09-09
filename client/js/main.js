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
        this.waitingParticipants = [];
        this.canAdmitParticipants = false;
        this.isCreator = false;
        this.isInWaitingRoom = false;
        
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
        this.subtitlesEnabled = false;
        
        // Screen sharing state
        this.isScreenSharing = false;
        this.screenStream = null;
        
        // Quality management
        this.qualityManager = null;
        
        // Recording state
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        
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

        componentInit('QualityManager', () => {
            if (typeof QualityManager === 'undefined') return; // optional
            this.qualityManager = new QualityManager(this);
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
        // Note: Canvas button is handled in bindHeaderControls() method

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
        // Reaction button
        const sendReactionBtn = document.getElementById('sendReaction');
        if (sendReactionBtn) {
            sendReactionBtn.addEventListener('click', () => this.sendReaction());
        }

        // Emoji picker event listeners
        const emojiOptions = document.querySelectorAll('.emoji-option');
        emojiOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const emoji = e.target.getAttribute('data-emoji');
                this.selectEmoji(emoji);
            });
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emojiPicker');
            const sendReactionBtn = document.getElementById('sendReaction');
            
            if (emojiPicker && sendReactionBtn && 
                !emojiPicker.contains(e.target) && 
                !sendReactionBtn.contains(e.target)) {
                emojiPicker.classList.remove('show');
            }
        });

        // Wait for DOM to be fully ready - add a delay
        setTimeout(() => {
            this.bindHeaderControls();
        }, 100);
    }

    bindHeaderControls() {
        // Header controls
        const toggleChat = document.getElementById('toggleChat');
        const toggleCanvas = document.getElementById('toggleCanvas');
        const toggleParticipants = document.getElementById('toggleParticipants');
        const settingsBtn = document.getElementById('settingsBtn');

        console.log('🔧 Binding header controls...');
        console.log('Button elements found:', {
            toggleChat: !!toggleChat,
            toggleCanvas: !!toggleCanvas, 
            toggleParticipants: !!toggleParticipants,
            settingsBtn: !!settingsBtn
        });

        // Test if elements are clickable
        if (toggleChat) {
            const styles = window.getComputedStyle(toggleChat);
            console.log('Chat button style:', {
                pointerEvents: styles.pointerEvents,
                display: styles.display,
                visibility: styles.visibility,
                position: styles.position,
                zIndex: styles.zIndex
            });
        }

        // Add global click test
        document.addEventListener('click', (e) => {
            if (e.target.id && e.target.id.startsWith('toggle')) {
                console.log('🎯 Global click detected on:', e.target.id, e.target);
            }
        });

        if (toggleChat) {
            console.log('✅ Binding chat button');
            toggleChat.addEventListener('click', (e) => {
                console.log('🎯 Chat button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Direct approach - force show chat panel
                const chatPanel = document.getElementById('chatPanel');
                const sidebar = document.querySelector('.sidebar');
                
                if (chatPanel && sidebar) {
                    console.log('🔍 Chat elements found:', {
                        chatPanel: !!chatPanel,
                        sidebar: !!sidebar,
                        chatPanelClasses: chatPanel.className,
                        sidebarClasses: sidebar.className
                    });
                    
                    // Toggle visibility
                    const isVisible = chatPanel.classList.contains('active');
                    console.log('🔍 Is chat visible?', isVisible);
                    
                    if (isVisible) {
                        console.log('🔄 Hiding chat panel');
                        chatPanel.classList.remove('active');
                        sidebar.classList.remove('visible');
                    } else {
                        console.log('🔄 Showing chat panel');
                        // Hide other panels
                        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                        
                        // Show chat panel
                        sidebar.classList.add('visible');
                        chatPanel.classList.add('active');
                        this.activePanel = 'chat';
                        
                        console.log('✅ Chat panel should now be visible');
                        console.log('🔍 Final classes:', {
                            chatPanelClasses: chatPanel.className,
                            sidebarClasses: sidebar.className
                        });
                    }
                } else {
                    console.log('❌ Missing elements:', {
                        chatPanel: !!chatPanel,
                        sidebar: !!sidebar
                    });
                }
            });
        } else {
            console.log('❌ Chat button not found');
        }
        
        if (toggleCanvas) {
            console.log('✅ Binding canvas button');
            toggleCanvas.addEventListener('click', (e) => {
                console.log('🎯 Canvas button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Use the togglePanel approach for consistency
                this.togglePanel('canvas');
            });
        } else {
            console.log('❌ Canvas button not found');
        }
        
        if (toggleParticipants) {
            console.log('✅ Binding participants button');
            toggleParticipants.addEventListener('click', (e) => {
                console.log('🎯 Participants button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Direct approach - force show participants panel
                const participantsPanel = document.getElementById('participantsPanel');
                const sidebar = document.querySelector('.sidebar');
                
                if (participantsPanel && sidebar) {
                    console.log('🔍 Participants elements found:', {
                        participantsPanel: !!participantsPanel,
                        sidebar: !!sidebar,
                        participantsPanelClasses: participantsPanel.className,
                        sidebarClasses: sidebar.className
                    });
                    
                    // Toggle visibility
                    const isVisible = participantsPanel.classList.contains('active');
                    console.log('🔍 Is participants visible?', isVisible);
                    
                    if (isVisible) {
                        console.log('🔄 Hiding participants panel');
                        participantsPanel.classList.remove('active');
                        sidebar.classList.remove('visible');
                    } else {
                        console.log('🔄 Showing participants panel');
                        // Hide other panels
                        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                        
                        // Show participants panel
                        sidebar.classList.add('visible');
                        participantsPanel.classList.add('active');
                        this.activePanel = 'participants';
                        
                        console.log('✅ Participants panel should now be visible');
                        console.log('🔍 Final classes:', {
                            participantsPanelClasses: participantsPanel.className,
                            sidebarClasses: sidebar.className
                        });
                    }
                } else {
                    console.log('❌ Missing elements:', {
                        participantsPanel: !!participantsPanel,
                        sidebar: !!sidebar
                    });
                }
            });
        } else {
            console.log('❌ Participants button not found');
        }
        
        if (settingsBtn) {
            console.log('✅ Binding settings button');
            settingsBtn.addEventListener('click', (e) => {
                console.log('🎯 Settings button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.showSettings();
            });
        } else {
            console.log('❌ Settings button not found');
        }

        // Subtitles toggle - moved to bindHeaderControls
        const subtitlesBtn = document.getElementById('toggleSubtitles');
        if (subtitlesBtn) {
            console.log('✅ Binding subtitles button');
            subtitlesBtn.addEventListener('click', (e) => {
                console.log('🎯 Subtitles button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.toggleSubtitles();
            });
        } else {
            console.log('❌ Subtitles button not found');
        }

        // Close panel buttons - moved to avoid duplicates

        // Panel close buttons
        const closeChat = document.getElementById('closeChat');
        const closeParticipants = document.getElementById('closeParticipants');

        if (closeChat) {
            closeChat.addEventListener('click', () => {
                console.log('Close chat clicked');
                this.closePanel();
            });
        }
        if (closeParticipants) {
            closeParticipants.addEventListener('click', () => {
                console.log('Close participants clicked');
                this.closePanel();
            });
        }

        // Add click handler for pinned video area to allow unpinning
        const pinnedVideo = document.getElementById('pinnedVideo');
        if (pinnedVideo) {
            pinnedVideo.addEventListener('click', (e) => {
                if (e.target === pinnedVideo || e.target.tagName === 'VIDEO') {
                    if (this.pinnedParticipant) {
                        this.togglePinParticipant(this.pinnedParticipant);
                    }
                }
            });
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
                const joinResult = await this.socketHandler.joinRoom(roomId, userName, isTeacher);
                if (joinResult && joinResult.waiting) {
                    // waiting room: socket-handler will show waiting screen when server emits event
                    this.updateLoadingText('Waiting for host to admit you...');
                    // keep loading screen briefly before showing waiting UI
                    await this.delay(300);
                } else {
                    this.updateLoadingText('Setting up interface...');
                    await this.delay(500);

                    // Switch to meeting interface
                    this.showMeetingRoom();
                    this.startTimer();
                }
            }
            
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
                // Professional-grade media constraints for HD quality
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

    updateLocalVideoTile(stream) {
        this.replaceVideoTileStream('local', stream);
        
        // Update the local video stream reference
        if (this.localVideoStream && this.localVideoStream !== stream) {
            this.localVideoStream.getTracks().forEach(track => track.stop());
        }
        this.localVideoStream = stream;
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
            
            // Detect screen sharing based on video track settings
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && this.isScreenSharing && isLocal) {
                // Only mark as screen sharing if we're actually screen sharing
                videoTile.classList.add('screen-sharing');
                video.setAttribute('data-screen-share', 'true');
            }
            
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
        
        // Apply layout stabilization after adding new tile
        this.stabilizeVideoLayout();
        
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
            
            // Apply layout stabilization after removing tile
            this.stabilizeVideoLayout();
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
            const pinnedVideo = document.getElementById('pinnedVideo');
            const videoGrid = document.getElementById('videoGrid');
            
            // Hide pinned video area
            pinnedVideo.classList.add('hidden');
            pinnedVideo.innerHTML = '';
            
            // CSS will handle showing video grid normally
            
            // Remove pin styling from all tiles
            document.querySelectorAll('.video-tile.pinned').forEach(tile => {
                tile.classList.remove('pinned');
            });
            
            // Update pin button state
            const pinBtn = document.querySelector(`#video-${participantId} .pin-btn`);
            if (pinBtn) {
                pinBtn.classList.remove('active');
                pinBtn.title = 'Pin participant';
            }
        } else {
            // Pin new participant
            const previousPinned = this.pinnedParticipant;
            this.pinnedParticipant = participantId;
            const videoTile = document.getElementById(`video-${participantId}`);
            
            if (videoTile) {
                // Remove previous pin styling
                if (previousPinned) {
                    const prevTile = document.getElementById(`video-${previousPinned}`);
                    if (prevTile) {
                        prevTile.classList.remove('pinned');
                        const prevPinBtn = prevTile.querySelector('.pin-btn');
                        if (prevPinBtn) {
                            prevPinBtn.classList.remove('active');
                            prevPinBtn.title = 'Pin participant';
                        }
                    }
                }
                
                // Create pinned video
                const pinnedVideo = document.getElementById('pinnedVideo');
                const videoElement = videoTile.querySelector('video');
                
                if (videoElement && videoElement.srcObject) {
                    // Create new video element for pinned area
                    const pinnedVideoElement = document.createElement('video');
                    pinnedVideoElement.srcObject = videoElement.srcObject;
                    pinnedVideoElement.autoplay = true;
                    pinnedVideoElement.playsInline = true;
                    pinnedVideoElement.muted = participantId === 'local'; // Mute only local video
                    
                    // Create participant info overlay
                    const participantInfo = videoTile.querySelector('.participant-info');
                    const infoClone = participantInfo ? participantInfo.cloneNode(true) : null;
                    
                    // Create close button for pinned video
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'pinned-close-btn';
                    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    closeBtn.onclick = () => this.togglePinParticipant(this.pinnedParticipant);
                    
                    // Clear and populate pinned video container
                    pinnedVideo.innerHTML = '';
                    pinnedVideo.appendChild(pinnedVideoElement);
                    pinnedVideo.appendChild(closeBtn);
                    if (infoClone) {
                        pinnedVideo.appendChild(infoClone);
                    }
                    
                    // Show pinned video
                    pinnedVideo.classList.remove('hidden');
                    
                    // CSS will handle dimming the background grid automatically
                    
                    // Add pin styling to original tile
                    videoTile.classList.add('pinned');
                    
                    // Update pin button state
                    const pinBtn = videoTile.querySelector('.pin-btn');
                    if (pinBtn) {
                        pinBtn.classList.add('active');
                        pinBtn.title = 'Unpin participant';
                    }
                }
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
                await this.startScreenShare();
            } else {
                await this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error toggling screen share:', error);
            let errorMessage = 'Could not start screen sharing';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Screen sharing permission denied';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Screen sharing not supported';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async startScreenShare() {
        const button = document.getElementById('shareScreen');
        
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen sharing not supported in this browser');
        }
        
        try {
            // Request screen sharing permission with optimal settings
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    frameRate: { ideal: 30, max: 60 }
                    // Remove any resolution constraints to capture full screen
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.screenStream = screenStream;

            // Use WebRTC manager if available
            if (this.webrtcManager) {
                await this.webrtcManager.replaceVideoTrack(screenStream.getVideoTracks()[0]);
                if (screenStream.getAudioTracks().length > 0) {
                    await this.webrtcManager.replaceAudioTrack(screenStream.getAudioTracks()[0]);
                }
            } else {
                // Fallback: Update local video tile directly
                this.updateLocalVideoTile(screenStream);
            }

            this.isScreenSharing = true;
            button.classList.add('active', 'screen-sharing');
            button.title = 'Stop screen sharing';
            
            // Add screen sharing indicator to local video tile
            const localTile = document.getElementById('video-local');
            if (localTile) {
                localTile.classList.add('screen-sharing');
                const video = localTile.querySelector('video');
                if (video) {
                    video.setAttribute('data-screen-share', 'true');
                }
            }
            
            this.showNotification('Screen sharing started', 'success');

            // Listen for screen share end (user clicks stop in browser)
            screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                this.stopScreenShare();
            });

            // Notify other participants via socket
            if (this.socketHandler) {
                this.socketHandler.socket.emit('screen-share-started', {
                    participantId: this.socketHandler.socket.id || 'local',
                    userId: this.currentUser?.id || this.socketHandler.socket.id
                });
            }

        } catch (error) {
            throw error; // Re-throw to be handled by toggleScreenShare
        }
    }

    async stopScreenShare() {
        const button = document.getElementById('shareScreen');
        
        try {
            // Stop screen stream tracks
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
                this.screenStream = null;
            }

            // Get original camera stream back with professional quality
            if (this.isVideoEnabled || this.isAudioEnabled) {
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

                const originalStream = await navigator.mediaDevices.getUserMedia(constraints);

                // Use WebRTC manager if available
                if (this.webrtcManager) {
                    if (originalStream.getVideoTracks().length > 0) {
                        await this.webrtcManager.replaceVideoTrack(originalStream.getVideoTracks()[0]);
                    }
                    if (originalStream.getAudioTracks().length > 0) {
                        await this.webrtcManager.replaceAudioTrack(originalStream.getAudioTracks()[0]);
                    }
                } else {
                    // Fallback: Update local video tile directly
                    this.updateLocalVideoTile(originalStream);
                }

                this.localVideoStream = originalStream;
            }

            this.isScreenSharing = false;
            button.classList.remove('active', 'screen-sharing');
            button.title = 'Share screen';
            
            // Remove screen sharing indicator from local video tile
            const localTile = document.getElementById('video-local');
            if (localTile) {
                localTile.classList.remove('screen-sharing');
                const video = localTile.querySelector('video');
                if (video) {
                    video.removeAttribute('data-screen-share');
                }
            }
            
            this.showNotification('Screen sharing stopped', 'info');

            // Notify other participants via socket
            if (this.socketHandler) {
                this.socketHandler.socket.emit('screen-share-stopped', {
                    participantId: this.socketHandler.socket.id || 'local',
                    userId: this.currentUser?.id || this.socketHandler.socket.id
                });
            }
            
        } catch (error) {
            console.error('Error stopping screen share:', error);
            this.showNotification('Error stopping screen share', 'error');
        }
    }

    async toggleRecording() {
        if (!this.isTeacher) {
            this.showNotification('Only teachers can record sessions', 'error');
            return;
        }

        try {
            if (!this.isRecording) {
                await this.startRecording();
            } else {
                await this.stopRecording();
            }
        } catch (error) {
            console.error('Error toggling recording:', error);
            let errorMessage = 'Could not start recording';
            
            if (error.name === 'NotSupportedError') {
                errorMessage = 'Recording not supported in this browser';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'Recording permission denied';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async startRecording() {
        const button = document.getElementById('recordSession');
        
        // Check for browser support
        if (!window.MediaRecorder) {
            throw new Error('Recording not supported in this browser');
        }

        try {
            // Get the canvas stream for recording the entire meeting
            let recordingStream;
            
            if (this.isScreenSharing && this.screenStream) {
                // If screen sharing, record the screen share
                recordingStream = this.screenStream;
            } else {
                // Record the entire meeting by capturing the video grid
                const videoGrid = document.getElementById('videoGrid');
                if (videoGrid) {
                    // Create a canvas to composite all video tiles
                    recordingStream = await this.createCompositeStream();
                } else {
                    // Fallback to screen capture
                    recordingStream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            mediaSource: 'screen',
                            frameRate: { ideal: 30 }
                        },
                        audio: true
                    });
                }
            }

            // Setup MediaRecorder
            const options = {
                mimeType: this.getSupportedMimeType()
            };

            this.mediaRecorder = new MediaRecorder(recordingStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showNotification('Recording error occurred', 'error');
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            
            this.isRecording = true;
            button.classList.add('active', 'recording');
            button.title = 'Stop recording';
            
            this.showNotification('Recording started', 'success');

            // Add recording indicator to UI
            this.recordingStartTime = Date.now();
            this.showRecordingIndicator();
            this.startRecordingTimer();

        } catch (error) {
            throw error;
        }
    }

    async stopRecording() {
        const button = document.getElementById('recordSession');
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.isRecording = false;
        button.classList.remove('active', 'recording');
        button.title = 'Start recording';
        
        this.hideRecordingIndicator();
        this.stopRecordingTimer();
        this.showNotification('Recording stopped. Preparing download...', 'info');
    }

    async createCompositeStream() {
        try {
            // First try to capture the browser tab containing the meeting
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'browser',
                    frameRate: { ideal: 30 }
                    // Removed width/height constraints to capture full resolution
                },
                audio: true
            });
            
            return displayStream;
        } catch (error) {
            // Fallback to general screen capture
            console.log('Browser tab capture not available, using screen capture');
            return await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 30 }
                    // Removed width/height constraints to capture full resolution
                },
                audio: true
            });
        }
    }

    getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm'; // fallback
    }

    saveRecording() {
        if (this.recordedChunks.length === 0) {
            this.showNotification('No recording data to save', 'warning');
            return;
        }

        const blob = new Blob(this.recordedChunks, {
            type: this.getSupportedMimeType()
        });

        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `meeting-recording-${timestamp}.webm`;

        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        this.showNotification(`Recording saved as ${filename}`, 'success');
        this.recordedChunks = [];
    }

    showRecordingIndicator() {
        // Create recording indicator
        let indicator = document.getElementById('recordingIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'recordingIndicator';
            indicator.className = 'recording-indicator';
            indicator.innerHTML = `
                <div class="recording-dot"></div>
                <span>REC</span>
                <span class="recording-duration">00:00</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.classList.add('active');
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            if (this.recordingStartTime) {
                const elapsed = Date.now() - this.recordingStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const durationElement = document.querySelector('.recording-duration');
                if (durationElement) {
                    durationElement.textContent = timeString;
                }
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.recordingStartTime = null;
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
        const button = document.getElementById('toggleCanvas');
        
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
        console.log('🎯 togglePanel called with:', panelName);
        const panels = {
            'chat': 'chatPanel',
            'canvas': 'canvasContainer', 
            'participants': 'participantsPanel'
        };

        const sidebar = document.querySelector('.sidebar');
        const targetPanel = document.getElementById(panels[panelName]);
        const button = document.getElementById(`toggle${panelName.charAt(0).toUpperCase() + panelName.slice(1)}`);

        console.log('🔍 Panel elements:', {
            panelName,
            panelId: panels[panelName],
            sidebar: !!sidebar,
            targetPanel: !!targetPanel,
            button: !!button,
            currentActivePanel: this.activePanel
        });

        if (this.activePanel === panelName) {
            // Close current panel
            this.closePanel();
        } else {
            // Close other panels first
            this.closePanel();
            
            // Open target panel
            if (targetPanel) {
                // For canvas, handle differently since it's not in sidebar
                if (panelName === 'canvas') {
                    console.log('🎨 Activating canvas panel');
                    console.log('🎨 Canvas element:', targetPanel);
                    console.log('🎨 Canvas classes before:', targetPanel.className);
                    
                    targetPanel.classList.remove('hidden');
                    targetPanel.classList.add('active'); // Enable CSS transform
                    targetPanel.style.display = 'flex';
                    targetPanel.style.visibility = 'visible';
                    targetPanel.style.opacity = '1';
                    
                    if (button) button.classList.add('active');
                    this.activePanel = panelName;
                    
                    console.log('🎨 Canvas classes after:', targetPanel.className);
                    console.log('🎨 Canvas style:', targetPanel.style.cssText);
                    
                    // Initialize canvas if not already done
                    if (!this.isCanvasActive && this.canvasManager) {
                        console.log('🎨 Initializing canvas manager');
                        this.canvasManager.activate();
                        // Resize canvas when it becomes visible
                        setTimeout(() => {
                            if (this.canvasManager.resizeCanvas) {
                                this.canvasManager.resizeCanvas();
                            }
                        }, 100);
                        this.isCanvasActive = true;
                    } else {
                        console.log('🎨 Canvas manager status:', {
                            isCanvasActive: this.isCanvasActive,
                            hasCanvasManager: !!this.canvasManager
                        });
                    }
                } else {
                    // For chat and participants panels in sidebar
                    console.log('🚀 Activating sidebar panel:', panelName);
                    
                    // First make sure all other panels in sidebar are hidden
                    document.querySelectorAll('.sidebar .panel').forEach(panel => {
                        panel.classList.remove('active');
                        panel.style.display = 'none';
                    });
                    
                    // Show the target panel
                    targetPanel.classList.add('active');
                    targetPanel.style.display = 'flex';
                    
                    // Show the sidebar itself
                    sidebar.classList.add('visible');
                    sidebar.style.display = 'flex';
                    
                    // Add button active state
                    if (button) button.classList.add('active');
                    
                    // Mark as active
                    this.activePanel = panelName;
                    
                    console.log('✅ Sidebar should now be visible with panel:', panelName);
                    console.log('📊 Sidebar classes:', sidebar.className);
                    console.log('📊 Panel classes:', targetPanel.className);
                }
            } else {
                console.error('Target panel not found for:', panelName);
            }
        }
    }

    closePanel() {
        console.log('🔒 Closing panel:', this.activePanel);
        
        // Close regular panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none';
        });
        
        // Close canvas
        const canvasContainer = document.getElementById('canvasContainer');
        if (canvasContainer) {
            canvasContainer.classList.add('hidden');
            canvasContainer.classList.remove('active'); // Remove active class for CSS transform
            canvasContainer.style.display = 'none';
        }
        
        // Remove active state from buttons
        document.querySelectorAll('.btn-header').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide sidebar completely
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('visible', 'active');
            sidebar.style.display = 'none';
            console.log('🔒 Sidebar hidden');
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
        // If we can admit, show waiting participants at top
        if (this.canAdmitParticipants && this.waitingParticipants && this.waitingParticipants.length > 0) {
            const waitingHeader = document.createElement('div');
            waitingHeader.className = 'waiting-section';
            waitingHeader.innerHTML = `<h4>Waiting to join</h4>`;
            participantsList.appendChild(waitingHeader);

            this.waitingParticipants.forEach(wp => {
                const waitingItem = document.createElement('div');
                waitingItem.className = 'participant-item waiting';
                waitingItem.innerHTML = `
                    <div class="participant-avatar">${wp.name.charAt(0).toUpperCase()}</div>
                    <div class="participant-info">
                        <div class="participant-name">${wp.name}</div>
                        <div class="participant-status">Waiting</div>
                    </div>
                    <div class="participant-controls">
                        <button class="btn btn-success btn-sm" onclick="window.eduMeet.admitParticipant('${wp.id}')">Admit</button>
                        <button class="btn btn-danger btn-sm" onclick="window.eduMeet.denyParticipant('${wp.id}')">Deny</button>
                    </div>
                `;
                participantsList.appendChild(waitingItem);
            });
        }
        
        // Start with participants array and add current user at the front
        let allParticipants = [...(participants || [])];
        
        // Remove any existing current user entries to prevent duplicates
        allParticipants = allParticipants.filter(p => p.id !== this.currentUser?.id);
        
        // Always add current user at the front if they exist
        if (this.currentUser && this.currentUser.id) {
            allParticipants.unshift({
                id: this.currentUser.id,
                name: this.currentUser.name,
                isTeacher: this.isTeacher,
                hasVideo: this.isVideoEnabled,
                hasAudio: this.isAudioEnabled
            });
        }
        
        // Debug info
        console.log(`Current user: ${this.currentUser?.name} (${this.currentUser?.id})`);
        console.log(`Other participants: ${allParticipants.slice(1).map(p => p.name).join(', ')}`);
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

            // Audio/Video status indicators
            const statusIndicators = document.createElement('div');
            statusIndicators.className = 'status-indicators';

            if (!participant.hasAudio) {
                const micBtn = document.createElement('button');
                micBtn.className = 'status-indicator muted';
                micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                micBtn.title = 'Microphone muted';
                statusIndicators.appendChild(micBtn);
            }

            if (!participant.hasVideo) {
                const videoBtn = document.createElement('button');
                videoBtn.className = 'status-indicator video-off';
                videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                videoBtn.title = 'Camera off';
                statusIndicators.appendChild(videoBtn);
            }

            controls.appendChild(statusIndicators);

            // Moderator controls - only show for creator/teacher and not for themselves
            if (this.isTeacher && participant.id !== this.currentUser?.id) {
                const moderatorControls = document.createElement('div');
                moderatorControls.className = 'moderator-controls';

                // Mute/Unmute participant button
                const muteBtn = document.createElement('button');
                muteBtn.className = `moderator-btn mute-btn ${participant.hasAudio ? 'active' : 'inactive'}`;
                muteBtn.innerHTML = participant.hasAudio ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';
                muteBtn.title = participant.hasAudio ? 'Mute participant' : 'Unmute participant';
                muteBtn.onclick = () => this.toggleParticipantAudio(participant.id, participant.hasAudio);

                // Disable/Enable video button
                const videoToggleBtn = document.createElement('button');
                videoToggleBtn.className = `moderator-btn video-btn ${participant.hasVideo ? 'active' : 'inactive'}`;
                videoToggleBtn.innerHTML = participant.hasVideo ? '<i class="fas fa-video-slash"></i>' : '<i class="fas fa-video"></i>';
                videoToggleBtn.title = participant.hasVideo ? 'Disable participant video' : 'Enable participant video';
                videoToggleBtn.onclick = () => this.toggleParticipantVideo(participant.id, participant.hasVideo);

                // Remove participant button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'moderator-btn remove-btn';
                removeBtn.innerHTML = '<i class="fas fa-user-times"></i>';
                removeBtn.title = 'Remove participant from meeting';
                removeBtn.onclick = () => this.removeParticipant(participant.id, participant.name);

                moderatorControls.appendChild(muteBtn);
                moderatorControls.appendChild(videoToggleBtn);
                moderatorControls.appendChild(removeBtn);
                controls.appendChild(moderatorControls);
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

    // ═══════════════════════════════════════════════════════════════════════════
    // MODERATOR CONTROLS - Creator/Teacher Authority Functions
    // ═══════════════════════════════════════════════════════════════════════════

    toggleParticipantAudio(participantId, currentAudioState) {
        console.log(`🔇 Moderator toggling audio for participant ${participantId}, current state: ${currentAudioState}`);
        
        if (!this.isTeacher) {
            this.showNotification('You do not have permission to control other participants', 'error');
            return;
        }

        const action = currentAudioState ? 'mute' : 'unmute';
        console.log(`SENDING ${action} command for participant ${participantId}`);
        
        const payload = {
            targetParticipantId: participantId,
            mute: currentAudioState, // If they have audio, we want to mute them (mute: true)
            moderatorId: this.currentUser.id,
            moderatorName: this.currentUser.name
        };
        console.log('🔇 SENDING moderatorMuteParticipant payload:', payload);
        
        // Emit to server
        this.socketHandler.socket.emit('moderatorMuteParticipant', payload);

        // Show confirmation
        this.showNotification(
            `${action === 'mute' ? 'Muted' : 'Unmuted'} participant`, 
            'info'
        );
    }

    toggleParticipantVideo(participantId, currentVideoState) {
        console.log(`📹 Moderator toggling video for participant ${participantId}, current state: ${currentVideoState}`);
        
        if (!this.isTeacher) {
            this.showNotification('You do not have permission to control other participants', 'error');
            return;
        }

        const action = currentVideoState ? 'disable' : 'enable';
        console.log(`Sending video ${action} command for participant ${participantId}`);
        
        // Emit to server
        this.socketHandler.socket.emit('moderatorToggleParticipantVideo', {
            targetParticipantId: participantId,
            disableVideo: currentVideoState,
            moderatorId: this.currentUser.id,
            moderatorName: this.currentUser.name
        });

        // Show confirmation
        this.showNotification(
            `${currentVideoState ? 'Disabled' : 'Enabled'} participant video`, 
            'info'
        );
    }

    removeParticipant(participantId, participantName) {
        console.log(`👤❌ Moderator removing participant ${participantId} (${participantName})`);
        
        if (!this.isTeacher) {
            this.showNotification('You do not have permission to remove participants', 'error');
            return;
        }

        // Show confirmation dialog
        if (confirm(`Are you sure you want to remove "${participantName}" from the meeting?`)) {
            console.log(`Confirmed removal of participant ${participantId}`);
            
            // Emit to server
            this.socketHandler.socket.emit('moderatorRemoveParticipant', {
                targetParticipantId: participantId,
                targetParticipantName: participantName,
                moderatorId: this.currentUser.id,
                moderatorName: this.currentUser.name
            });

            // Show confirmation
            this.showNotification(
                `Removed "${participantName}" from the meeting`, 
                'warning'
            );
        } else {
            console.log('Participant removal cancelled by moderator');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════

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

        // Stop screen sharing streams
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }

        // Stop recording
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.stopRecordingTimer();

        // Close socket connection
        if (this.socketHandler) {
            this.socketHandler.disconnect();
        }

        // Clean up mediasoup
        if (this.mediasoupClient) {
            this.mediasoupClient.cleanup();
        }

        // Clean up quality manager
        if (this.qualityManager) {
            this.qualityManager.cleanup();
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

    // Layout stabilization method
    stabilizeVideoLayout() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid || !this.uiControls) return;
        
        // Temporarily disable transitions to prevent layout shifts
        videoGrid.classList.add('stable');
        
        // Reapply current layout after a brief delay
        setTimeout(() => {
            if (this.uiControls && this.uiControls.gridLayout) {
                this.uiControls.switchLayout(this.uiControls.gridLayout);
            }
            
            // Re-enable transitions
            setTimeout(() => {
                videoGrid.classList.remove('stable');
            }, 100);
        }, 50);
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

    // Waiting Room UI Methods
    showWaitingRoom(data) {
        this.isInWaitingRoom = true;
        
        // Hide join screen
        const joinScreen = document.getElementById('joinScreen');
        if (joinScreen) joinScreen.style.display = 'none';
        
        // Show waiting room screen
        let waitingScreen = document.getElementById('waitingScreen');
        if (!waitingScreen) {
            waitingScreen = this.createWaitingRoomScreen();
            document.body.appendChild(waitingScreen);
        }
        
        waitingScreen.style.display = 'flex';
        
        // Update message
        const messageEl = waitingScreen.querySelector('.waiting-message');
        if (messageEl) {
            messageEl.textContent = data.message || 'Waiting for host to admit you...';
        }
        
        // Update room info
        const roomInfoEl = waitingScreen.querySelector('.waiting-room-info');
        if (roomInfoEl) {
            roomInfoEl.innerHTML = `
                <h3>Joining Room: ${data.roomId}</h3>
                <p>Your name: ${this.currentUser.name}</p>
            `;
        }
    }

    hideWaitingRoom() {
        this.isInWaitingRoom = false;
        const waitingScreen = document.getElementById('waitingScreen');
        if (waitingScreen) {
            waitingScreen.style.display = 'none';
        }
    }

    showAccessDenied(message) {
        this.showNotification(message || 'Access to the meeting was denied', 'error');
        
        // Redirect back to join screen
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    createWaitingRoomScreen() {
        const waitingScreen = document.createElement('div');
        waitingScreen.id = 'waitingScreen';
        waitingScreen.className = 'waiting-screen';
        waitingScreen.innerHTML = `
            <div class="waiting-content">
                <div class="waiting-spinner">
                    <div class="spinner"></div>
                </div>
                <div class="waiting-room-info">
                    <h3>Joining Room</h3>
                </div>
                <div class="waiting-message">
                    Waiting for host to admit you...
                </div>
                <div class="waiting-actions">
                    <button type="button" class="leave-waiting-btn" onclick="window.location.href='/'">
                        <i class="fas fa-sign-out-alt"></i>
                        Leave Waiting Room
                    </button>
                </div>
            </div>
        `;
        return waitingScreen;
    }

    initializeWaitingRoomUI(waitingParticipants = []) {
        if (!this.canAdmitParticipants) return;
        
        this.waitingParticipants = waitingParticipants;
        
        // Add waiting room panel to sidebar or create floating panel
        this.createWaitingRoomPanel();
        this.updateWaitingParticipantsList(waitingParticipants);
    }

    createWaitingRoomPanel() {
        if (!this.canAdmitParticipants) return;
    // Waiting room control will be shown via participants panel badge
        
        // Create waiting room panel
        if (!document.getElementById('waitingRoomPanel')) {
            const panel = document.createElement('div');
            panel.id = 'waitingRoomPanel';
            panel.className = 'waiting-room-panel';
            panel.innerHTML = `
                <div class="panel-header">
                    <h3>Waiting Room</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
                </div>
                <div class="panel-content">
                    <div class="waiting-list" id="waitingList">
                        <p class="no-waiting">No one is waiting</p>
                    </div>
                    <div class="waiting-room-settings">
                        <label class="toggle-label">
                            <input type="checkbox" id="waitingRoomToggle" ${this.waitingRoomEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Enable Waiting Room
                        </label>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            
            // Add event listener for waiting room toggle
            const toggle = panel.querySelector('#waitingRoomToggle');
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.socketHandler.emitToggleWaitingRoom(e.target.checked);
                });
            }
        }
    }

    // Play bell and flash participants badge when a join request arrives
    showJoinRequestNotification(waitingParticipant) {
        // Increment internal list (already added elsewhere)
        // Play sound
        try {
            const audio = new Audio('assets/sounds/join.mp3');
            audio.play().catch(() => {});
        } catch (e) {
            console.warn('Could not play notification sound', e);
        }

        // Flash badge and show small toast
        this.showNotification(`${waitingParticipant.name} requested to join`, 'info');
        this.updateParticipantsBadge();
    }

    updateParticipantsBadge() {
        const badge = document.getElementById('participantsBadge');
        if (!badge) return;
        const count = this.waitingParticipants ? this.waitingParticipants.length : 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        // add wiggle animation briefly
        const btn = document.getElementById('toggleParticipants');
        if (btn && count > 0) {
            btn.classList.add('has-waiting');
            setTimeout(() => btn.classList.remove('has-waiting'), 1200);
        }
    }

    // Reaction sending and animation
    sendReaction() {
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker) {
            // Toggle emoji picker visibility
            if (emojiPicker.classList.contains('show')) {
                emojiPicker.classList.remove('show');
            } else {
                emojiPicker.classList.add('show');
                
                // Hide picker after 5 seconds if no selection
                setTimeout(() => {
                    emojiPicker.classList.remove('show');
                }, 5000);
            }
        }
    }

    // Method to actually send the selected emoji
    selectEmoji(emoji) {
        if (this.socketHandler) {
            this.socketHandler.emit('reaction', { emoji });
        }
        // Animate locally on user's own tile
        this.showReactionOnTile(this.currentUser?.id || 'local', emoji);
        
        // Hide picker after selection
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker) {
            emojiPicker.classList.remove('show');
        }
    }

    showReactionOnTile(participantId, emoji) {
        const videoTile = document.getElementById(`video-${participantId}`) || document.getElementById('pinnedVideo');
        if (!videoTile) return;
        const anim = document.createElement('div');
        anim.className = 'reaction-anim';
        anim.textContent = emoji;
        videoTile.style.position = 'relative';
        videoTile.appendChild(anim);
        setTimeout(() => anim.remove(), 2000);
    }

    // Subtitles toggle (UI only placeholder)
    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        this.showNotification(`Subtitles ${this.subtitlesEnabled ? 'enabled' : 'disabled'}`, 'info');
        const btn = document.getElementById('toggleSubtitles');
        if (btn) btn.classList.toggle('active', this.subtitlesEnabled);
    }

    toggleWaitingRoomPanel() {
        const panel = document.getElementById('waitingRoomPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    addWaitingParticipantToUI(waitingParticipant) {
        if (!this.canAdmitParticipants) return;
        
        this.waitingParticipants.push(waitingParticipant);
    this.updateWaitingParticipantsList(this.waitingParticipants);
    this.updateParticipantsBadge();
        
        // Show notification
        this.showNotification(`${waitingParticipant.name} is waiting to join`, 'info');
    }

    removeWaitingParticipantFromUI(waitingParticipantId) {
        if (!this.canAdmitParticipants) return;
        
        this.waitingParticipants = this.waitingParticipants.filter(wp => wp.id !== waitingParticipantId);
    this.updateWaitingParticipantsList(this.waitingParticipants);
    this.updateParticipantsBadge();
    }

    updateWaitingParticipantsList(waitingParticipants) {
        if (!this.canAdmitParticipants) return;
        
        this.waitingParticipants = waitingParticipants;
        const waitingList = document.getElementById('waitingList');
        const waitingSection = document.getElementById('waitingSection');
        
        if (!waitingList || !waitingSection) return;
        
        if (waitingParticipants.length === 0) {
            waitingSection.style.display = 'none';
            waitingList.innerHTML = '';
        } else {
            waitingSection.style.display = 'block';
            waitingList.innerHTML = waitingParticipants.map(wp => `
                <div class="waiting-participant" data-id="${wp.id}">
                    <div class="participant-info">
                        <div class="participant-name">${wp.name}</div>
                        <div class="participant-time">Waiting since ${new Date(wp.joinedAt).toLocaleTimeString()}</div>
                    </div>
                    <div class="participant-actions">
                        <button class="btn btn-success btn-sm" onclick="window.eduMeet.admitParticipant('${wp.id}')">
                            <i class="fas fa-check"></i> Admit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.eduMeet.denyParticipant('${wp.id}')">
                            <i class="fas fa-times"></i> Deny
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        this.updateParticipantsBadge();
    }

    admitParticipant(waitingParticipantId) {
        if (!this.canAdmitParticipants) return;
        
        this.socketHandler.emitAdmitParticipant(waitingParticipantId);
        
        // Find participant name for notification
        const participant = this.waitingParticipants.find(wp => wp.id === waitingParticipantId);
        if (participant) {
            this.showNotification(`Admitting ${participant.name} to the meeting`, 'success');
        }
    }

    denyParticipant(waitingParticipantId) {
        if (!this.canAdmitParticipants) return;
        
        this.socketHandler.emitDenyParticipant(waitingParticipantId);
        
        // Find participant name for notification
        const participant = this.waitingParticipants.find(wp => wp.id === waitingParticipantId);
        if (participant) {
            this.showNotification(`Denied ${participant.name} access to the meeting`, 'info');
        }
    }

    updateWaitingRoomSetting(enabled) {
        this.waitingRoomEnabled = enabled;
        
        const toggle = document.getElementById('waitingRoomToggle');
        if (toggle) {
            toggle.checked = enabled;
        }
        
        this.showNotification(`Waiting room ${enabled ? 'enabled' : 'disabled'}`, 'info');
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
    
    // Add debug methods for testing
    window.testPanels = () => {
        console.log('🔧 Testing panel functions...');
        if (window.eduMeet) {
            window.eduMeet.togglePanel('chat');
        }
    };
    
    window.testButton = (buttonId) => {
        console.log('🔧 Testing button:', buttonId);
        const btn = document.getElementById(buttonId);
        if (btn) {
            console.log('Button found:', btn);
            btn.click();
        } else {
            console.log('Button not found');
        }
    };
    
    // Force show panels for testing
    window.forceShowPanel = (panelName) => {
        console.log('🔧 Force showing panel:', panelName);
        const panelIds = {
            'chat': 'chatPanel',
            'participants': 'participantsPanel',
            'canvas': 'canvasContainer'
        };
        
        const panel = document.getElementById(panelIds[panelName]);
        const sidebar = document.querySelector('.sidebar');
        
        console.log('Panel element:', panel);
        console.log('Sidebar element:', sidebar);
        
        if (panel) {
            panel.style.display = 'flex';
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
            panel.classList.add('active');
        }
        
        if (sidebar) {
            sidebar.classList.add('visible');
        }
    };
    
    // Quick console commands for testing
    window.showChat = () => window.forceShowPanel('chat');
    window.showParticipants = () => window.forceShowPanel('participants');
    window.showCanvas = () => window.forceShowPanel('canvas');
    
    console.log('🎯 Available test commands:');
    console.log('- window.showChat()');
    console.log('- window.showParticipants()');
    console.log('- window.showCanvas()');
    console.log('- window.testButton("toggleChat")');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.eduMeet && document.hidden) {
        // Pause non-essential features when tab is hidden
    } else if (window.eduMeet && !document.hidden) {
        // Resume features when tab is visible
    }
});