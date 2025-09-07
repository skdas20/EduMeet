// UI Controls Manager
class UIControls {
    constructor(app) {
        this.app = app;
        this.isFullscreen = false;
        this.gridLayout = 'auto'; // auto, grid, spotlight
        this.volumeLevels = new Map();
        this.audioContext = null;
        this.audioAnalysers = new Map();
        
        this.init();
    }

    init() {
        this.setupAudioContext();
        this.bindAdvancedEvents();
        this.initializeVolumeDetection();
        this.setupKeyboardShortcuts();
        this.setupResponsiveHandlers();
        this.initializeAccessibility();
    }

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    bindAdvancedEvents() {
        // Volume controls
        this.bindVolumeControls();
        
        // Layout controls
        this.bindLayoutControls();
        
        // Advanced video controls
        this.bindVideoQualityControls();
        
        // Recording controls
        this.bindRecordingControls();
        
        // Breakout room controls
        this.bindBreakoutRoomControls();
        
        // Fullscreen controls
        this.bindFullscreenControls();
        
        // Context menus
        this.bindContextMenus();
    }

    bindVolumeControls() {
        // Master volume control
        const masterVolume = document.createElement('div');
        masterVolume.className = 'volume-control-container';
        masterVolume.innerHTML = `
            <div class="volume-control">
                <i class="fas fa-volume-up"></i>
                <input type="range" id="masterVolume" min="0" max="100" value="100" class="volume-slider">
                <span class="volume-value">100%</span>
            </div>
        `;
        
        // Add to controls if teacher
        if (this.app.isTeacher) {
            const controlsBar = document.querySelector('.controls-bar');
            if (controlsBar) {
                controlsBar.appendChild(masterVolume);
            }
        }
        
        // Bind volume slider events
        const volumeSlider = document.getElementById('masterVolume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setMasterVolume(e.target.value);
            });
        }
    }

    bindLayoutControls() {
        // Add layout dropdown to header (single button + dropdown)
        const layoutSwitcher = document.createElement('div');
        layoutSwitcher.className = 'layout-switcher layout-dropdown';
        layoutSwitcher.innerHTML = `
            <button class="btn-header layout-toggle" title="Layouts" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-th-large"></i>
            </button>
            <div class="layout-menu hidden" role="menu" aria-label="Layout options">
                <div class="layout-item" data-layout="auto" role="menuitem">Auto Layout</div>
                <div class="layout-item" data-layout="grid" role="menuitem">Grid Layout</div>
                <div class="layout-item" data-layout="spotlight" role="menuitem">Spotlight Layout</div>
            </div>
        `;

        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            // Insert before existing header buttons so it aligns with chat/canvas/settings
            headerRight.insertBefore(layoutSwitcher, headerRight.firstChild);
        }

        // Dropdown toggle and selection handling
        const toggleBtn = layoutSwitcher.querySelector('.layout-toggle');
        const menu = layoutSwitcher.querySelector('.layout-menu');

        const closeMenu = () => {
            menu.classList.add('hidden');
            toggleBtn.setAttribute('aria-expanded', 'false');
        };

        const openMenu = () => {
            menu.classList.remove('hidden');
            toggleBtn.setAttribute('aria-expanded', 'true');
        };

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu.classList.contains('hidden')) openMenu(); else closeMenu();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!layoutSwitcher.contains(e.target)) closeMenu();
        });

        // Keyboard accessibility: Esc to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        // Menu item clicks
        layoutSwitcher.querySelectorAll('.layout-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const layout = item.dataset.layout;
                this.switchLayout(layout);
                this.setActiveLayoutButton(item);
                closeMenu();
            });
        });

        // Initialize active state for the current layout
        const initialItem = layoutSwitcher.querySelector(`.layout-item[data-layout="${this.gridLayout}"]`);
        if (initialItem) {
            this.setActiveLayoutButton(initialItem);
        }
    }

    bindVideoQualityControls() {
        // Add quality selector for each video tile dynamically
        document.addEventListener('click', (e) => {
            if (e.target.closest('.video-tile')) {
                const videoTile = e.target.closest('.video-tile');
                if (e.ctrlKey || e.metaKey) { // Ctrl/Cmd + click for quality menu
                    e.preventDefault();
                    this.showQualityMenu(videoTile, e.clientX, e.clientY);
                }
            }
        });
    }

    bindRecordingControls() {
        const recordBtn = document.getElementById('recordSession');
        if (recordBtn) {
            // Enable for teachers, show disabled state for students
            if (this.app.isTeacher) {
                recordBtn.disabled = false;
                recordBtn.addEventListener('click', () => {
                    this.app.toggleRecording();
                });
            } else {
                recordBtn.disabled = true;
                recordBtn.title = 'Only teachers can record sessions';
            }
        }
    }

    bindBreakoutRoomControls() {
        if (this.app.isTeacher) {
            // Add breakout room button
            const breakoutBtn = document.createElement('button');
            breakoutBtn.id = 'breakoutRooms';
            breakoutBtn.className = 'control-btn';
            breakoutBtn.innerHTML = '<i class="fas fa-users"></i><span>Breakout</span>';
            breakoutBtn.addEventListener('click', () => this.showBreakoutRoomDialog());
            
            const controlsCenter = document.querySelector('.controls-center');
            if (controlsCenter) {
                controlsCenter.appendChild(breakoutBtn);
            }
        }
    }

    bindFullscreenControls() {
        // Add fullscreen button to each video tile
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('video-tile')) {
                this.addFullscreenButton(e.target);
            }
        });
        
        // Global fullscreen toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.toggleFullscreen();
                }
            }
        });
        
        // Exit fullscreen on Escape
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenUI();
        });
    }

    bindContextMenus() {
        // Right-click context menu for video tiles
        document.addEventListener('contextmenu', (e) => {
            const videoTile = e.target.closest('.video-tile');
            if (videoTile) {
                e.preventDefault();
                this.showVideoContextMenu(videoTile, e.clientX, e.clientY);
            }
        });
        
        // Close context menus on click outside
        document.addEventListener('click', () => {
            this.closeAllContextMenus();
        });
    }

    // Volume Management
    setMasterVolume(volume) {
        const volumePercent = volume / 100;
        
        // Update all audio elements
        document.querySelectorAll('audio, video').forEach(element => {
            if (element.id !== 'previewVideo') { // Don't affect preview
                element.volume = volumePercent;
            }
        });
        
        // Update volume display
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = `${volume}%`;
        }
        
        // Update volume icon
        const volumeIcon = document.querySelector('.volume-control i');
        if (volumeIcon) {
            volumeIcon.className = volume > 0 ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }

    setParticipantVolume(participantId, volume) {
        const audioElement = document.getElementById(`audio-${participantId}`);
        if (audioElement) {
            audioElement.volume = Math.max(0, Math.min(1, volume / 100));
        }
        
        this.volumeLevels.set(participantId, volume);
    }

    initializeVolumeDetection() {
        if (!this.audioContext) return;
        
        const createVolumeAnalyser = (audioElement, participantId) => {
            try {
                const source = this.audioContext.createMediaElementSource(audioElement);
                const analyser = this.audioContext.createAnalyser();
                const gainNode = this.audioContext.createGain();
                
                source.connect(analyser);
                analyser.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                this.audioAnalysers.set(participantId, {
                    analyser,
                    dataArray,
                    gainNode
                });
                
                // Start volume detection
                this.detectVolume(participantId);
                
            } catch (error) {
                console.warn('Failed to create volume analyser:', error);
            }
        };
        
        // Monitor for new audio elements
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'AUDIO' && node.id.startsWith('audio-')) {
                        const participantId = node.id.replace('audio-', '');
                        createVolumeAnalyser(node, participantId);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    detectVolume(participantId) {
        const analyserData = this.audioAnalysers.get(participantId);
        if (!analyserData) return;
        
        const { analyser, dataArray } = analyserData;
        
        const detectLoop = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const average = sum / dataArray.length;
            const volumeLevel = (average / 255) * 100;
            
            // Update UI
            this.updateVolumeIndicator(participantId, volumeLevel);
            
            // Continue detection
            requestAnimationFrame(detectLoop);
        };
        
        detectLoop();
    }

    updateVolumeIndicator(participantId, level) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;
        
        let volumeIndicator = videoTile.querySelector('.volume-indicator');
        if (!volumeIndicator) {
            volumeIndicator = document.createElement('div');
            volumeIndicator.className = 'volume-indicator';
            volumeIndicator.innerHTML = '<div class="volume-level"></div>';
            videoTile.appendChild(volumeIndicator);
        }
        
        const volumeLevel = volumeIndicator.querySelector('.volume-level');
        if (volumeLevel) {
            volumeLevel.style.width = `${Math.min(100, level)}%`;
            
            // Add speaking indicator
            if (level > 10) {
                videoTile.classList.add('speaking');
            } else {
                videoTile.classList.remove('speaking');
            }
        }
    }

    // Layout Management
    switchLayout(layoutType) {
        this.gridLayout = layoutType;
        const videoGrid = document.getElementById('videoGrid');
        
        if (!videoGrid) return;
        
        // Reset all video tiles to default state first
        this.resetVideoTiles();
        
        // Remove existing layout classes
        videoGrid.classList.remove('layout-auto', 'layout-grid', 'layout-spotlight');
        
        switch (layoutType) {
            case 'auto':
                videoGrid.classList.add('layout-auto');
                this.applyAutoLayout();
                break;
            case 'grid':
                videoGrid.classList.add('layout-grid');
                this.applyGridLayout();
                break;
            case 'spotlight':
                videoGrid.classList.add('layout-spotlight');
                this.applySpotlightLayout();
                break;
        }
        
        this.app.showNotification(`Switched to ${layoutType} layout`, 'info');
    }

    applyAutoLayout() {
        const videoGrid = document.getElementById('videoGrid');
        const videoCount = videoGrid.children.length;
        
        // Apply stable auto-layout without causing layout shifts
        videoGrid.style.transition = 'grid-template-columns 0.3s ease';
        
        if (videoCount <= 1) {
            videoGrid.style.gridTemplateColumns = '1fr';
        } else if (videoCount <= 4) {
            videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (videoCount <= 6) {
            videoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            videoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
        
        // Reset any problematic styles from other layouts
        Array.from(videoGrid.children).forEach(tile => {
            tile.style.display = 'block';
            tile.style.gridRow = 'auto';
        });
    }

    applyGridLayout() {
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.style.transition = 'grid-template-columns 0.3s ease';
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        
        // Reset any problematic styles from other layouts
        Array.from(videoGrid.children).forEach(tile => {
            tile.style.display = 'block';
            tile.style.gridRow = 'auto';
        });
    }

    applySpotlightLayout() {
        const videoGrid = document.getElementById('videoGrid');
        
        // Find pinned or first video for spotlight
        const pinnedVideo = videoGrid.querySelector('.video-tile.pinned') || 
                           videoGrid.querySelector('.video-tile');
        
        if (pinnedVideo) {
            const videoCount = videoGrid.children.length;
            
            if (videoCount > 1) {
                // Create a simple spotlight layout
                videoGrid.style.gridTemplateColumns = '1fr';
                videoGrid.style.gridTemplateRows = '3fr auto';
                videoGrid.style.gap = '8px';
                
                // Move spotlight video to front
                if (pinnedVideo !== videoGrid.firstElementChild) {
                    videoGrid.insertBefore(pinnedVideo, videoGrid.firstChild);
                }
                
                // Create thumbnails container
                let thumbnailsContainer = videoGrid.querySelector('.thumbnails-container');
                if (!thumbnailsContainer) {
                    thumbnailsContainer = document.createElement('div');
                    thumbnailsContainer.className = 'thumbnails-container';
                    thumbnailsContainer.style.cssText = `
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        padding: 8px;
                        justify-content: center;
                        flex-wrap: wrap;
                        grid-column: 1;
                        grid-row: 2;
                        background: rgba(0,0,0,0.1);
                        border-radius: 8px;
                        max-height: 120px;
                    `;
                    videoGrid.appendChild(thumbnailsContainer);
                }
                
                // Clear thumbnails container
                thumbnailsContainer.innerHTML = '';
                
                // Style videos for spotlight mode
                Array.from(videoGrid.children).forEach((tile, index) => {
                    if (tile === thumbnailsContainer) return;
                    
                    tile.style.display = 'block';
                    if (index === 0) {
                        // Main spotlight video
                        tile.style.gridColumn = '1';
                        tile.style.gridRow = '1';
                        tile.classList.add('spotlight-main');
                    } else {
                        // Move thumbnails to container
                        tile.style.gridColumn = '';
                        tile.style.gridRow = '';
                        tile.style.width = '120px';
                        tile.style.height = '90px';
                        tile.style.flexShrink = '0';
                        tile.classList.add('spotlight-thumbnail');
                        
                        // Add click handler to switch spotlight
                        tile.addEventListener('click', () => {
                            this.switchSpotlight(tile);
                        });
                        
                        thumbnailsContainer.appendChild(tile);
                    }
                });
            } else {
                // Single video - full screen
                videoGrid.style.gridTemplateColumns = '1fr';
                videoGrid.style.gridTemplateRows = '1fr';
                pinnedVideo.style.gridColumn = '1';
                pinnedVideo.style.gridRow = '1';
                pinnedVideo.classList.add('spotlight-main');
            }
        }
    }

    resetVideoTiles() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;
        
        // Remove thumbnails container if it exists
        const thumbnailsContainer = videoGrid.querySelector('.thumbnails-container');
        if (thumbnailsContainer) {
            // Move all video tiles back to main grid
            Array.from(thumbnailsContainer.children).forEach(tile => {
                if (tile.classList.contains('video-tile')) {
                    videoGrid.appendChild(tile);
                }
            });
            thumbnailsContainer.remove();
        }
        
        // Reset all video tiles to default state
        Array.from(videoGrid.children).forEach(tile => {
            if (!tile.classList.contains('video-tile')) return;
            
            // Clear layout-specific styles
            tile.style.display = 'block';
            tile.style.gridColumn = 'auto';
            tile.style.gridRow = 'auto';
            tile.style.maxHeight = '';
            tile.style.width = '';
            tile.style.height = '';
            tile.style.float = '';
            tile.style.margin = '';
            tile.style.flexShrink = '';
            
            // Remove layout-specific classes
            tile.classList.remove('spotlight-main', 'spotlight-thumbnail');
        });
        
        // Reset grid styles
        videoGrid.style.gridTemplateRows = '';
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        videoGrid.style.gap = '4px';
    }

    switchSpotlight(clickedTile) {
        const videoGrid = document.getElementById('videoGrid');
        const currentMain = videoGrid.querySelector('.video-tile.spotlight-main');
        const thumbnailsContainer = videoGrid.querySelector('.thumbnails-container');
        
        if (currentMain && clickedTile && thumbnailsContainer) {
            // Remove spotlight classes
            currentMain.classList.remove('spotlight-main');
            clickedTile.classList.remove('spotlight-thumbnail');
            
            // Reset styles for current main
            currentMain.style.gridColumn = '';
            currentMain.style.gridRow = '';
            currentMain.style.width = '120px';
            currentMain.style.height = '90px';
            currentMain.style.flexShrink = '0';
            currentMain.classList.add('spotlight-thumbnail');
            
            // Set new main video
            clickedTile.style.gridColumn = '1';
            clickedTile.style.gridRow = '1';
            clickedTile.style.width = '';
            clickedTile.style.height = '';
            clickedTile.style.flexShrink = '';
            clickedTile.classList.add('spotlight-main');
            
            // Move videos to correct positions
            videoGrid.insertBefore(clickedTile, videoGrid.firstChild);
            thumbnailsContainer.appendChild(currentMain);
        }
    }

    setActiveLayoutButton(activeBtn) {
        // Clear active state from any previous layout controls (buttons or menu items)
        document.querySelectorAll('.layout-btn, .layout-item, .layout-toggle').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
        });

        // If a menu item was passed, mark corresponding toggle/button active too
        if (activeBtn && activeBtn.classList.contains('layout-item')) {
            activeBtn.classList.add('active');
            const layoutSwitcher = activeBtn.closest('.layout-switcher');
            if (layoutSwitcher) {
                const toggle = layoutSwitcher.querySelector('.layout-toggle');
                if (toggle) toggle.classList.add('active');
            }
        } else if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // Video Quality Management
    showQualityMenu(videoTile, x, y) {
        this.closeAllContextMenus();
        
        const qualityMenu = document.createElement('div');
        qualityMenu.className = 'quality-menu context-menu';
        qualityMenu.style.left = x + 'px';
        qualityMenu.style.top = y + 'px';
        
        qualityMenu.innerHTML = `
            <div class="menu-item" data-quality="auto">Auto</div>
            <div class="menu-item" data-quality="1080p">1080p</div>
            <div class="menu-item" data-quality="720p">720p</div>
            <div class="menu-item" data-quality="480p">480p</div>
            <div class="menu-item" data-quality="360p">360p</div>
        `;
        
        document.body.appendChild(qualityMenu);
        
        // Bind quality selection
        qualityMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item')) {
                this.changeVideoQuality(videoTile, e.target.dataset.quality);
                qualityMenu.remove();
            }
        });
        
        // Position menu within viewport
        this.positionContextMenu(qualityMenu, x, y);
    }

    changeVideoQuality(videoTile, quality) {
        const participantId = videoTile.dataset.participantId;
        
        if (this.app.mediasoupClient) {
            // Request quality change from MediaSoup
            this.app.mediasoupClient.requestQualityChange(participantId, quality);
        }
        
        this.app.showNotification(`Video quality set to ${quality}`, 'info');
    }

    // Context Menu Management
    showVideoContextMenu(videoTile, x, y) {
        this.closeAllContextMenus();
        
        const participantId = videoTile.dataset.participantId;
        const isLocal = participantId === 'local';
        const isTeacher = this.app.isTeacher;
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'video-context-menu context-menu';
        
        let menuItems = [];
        
        if (!isLocal) {
            menuItems.push('<div class="menu-item" data-action="pin">Pin/Unpin</div>');
            menuItems.push('<div class="menu-item" data-action="volume">Adjust Volume</div>');
            
            if (isTeacher) {
                menuItems.push('<div class="menu-item" data-action="mute">Mute Participant</div>');
                menuItems.push('<div class="menu-item" data-action="remove">Remove Participant</div>');
            }
        }
        
        menuItems.push('<div class="menu-item" data-action="fullscreen">Fullscreen</div>');
        menuItems.push('<div class="menu-item" data-action="stats">Show Stats</div>');
        
        contextMenu.innerHTML = menuItems.join('');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        
        document.body.appendChild(contextMenu);
        
        // Bind context menu actions
        contextMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item')) {
                this.handleContextMenuAction(e.target.dataset.action, videoTile);
                contextMenu.remove();
            }
        });
        
        this.positionContextMenu(contextMenu, x, y);
    }

    handleContextMenuAction(action, videoTile) {
        const participantId = videoTile.dataset.participantId;
        
        switch (action) {
            case 'pin':
                this.app.togglePinParticipant(participantId);
                break;
            case 'volume':
                this.showVolumeSlider(videoTile);
                break;
            case 'mute':
                if (this.app.socketHandler) {
                    this.app.socketHandler.muteParticipant(participantId);
                }
                break;
            case 'remove':
                if (this.app.socketHandler) {
                    this.app.socketHandler.kickParticipant(participantId);
                }
                break;
            case 'fullscreen':
                this.enterVideoFullscreen(videoTile);
                break;
            case 'stats':
                this.showVideoStats(videoTile);
                break;
        }
    }

    closeAllContextMenus() {
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.remove();
        });
    }

    positionContextMenu(menu, x, y) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust position to keep menu in viewport
        if (x + rect.width > viewportWidth) {
            x = viewportWidth - rect.width - 10;
        }
        
        if (y + rect.height > viewportHeight) {
            y = viewportHeight - rect.height - 10;
        }
        
        menu.style.left = Math.max(10, x) + 'px';
        menu.style.top = Math.max(10, y) + 'px';
    }


    // Breakout Room Management
    showBreakoutRoomDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal active';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Breakout Rooms</h3>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="breakout-room-setup">
                        <div class="participants-selection">
                            <h4>Select Participants:</h4>
                            <div class="participants-grid" id="breakoutParticipants">
                                ${this.generateParticipantCheckboxes()}
                            </div>
                        </div>
                        <div class="room-settings">
                            <label>Room Name:</label>
                            <input type="text" id="breakoutRoomName" placeholder="Breakout Room 1">
                            <label>Duration (minutes):</label>
                            <input type="number" id="breakoutDuration" value="15" min="5" max="120">
                        </div>
                        <div class="modal-actions">
                            <button class="cancel-btn">Cancel</button>
                            <button class="create-btn">Create Room</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Bind events
        dialog.querySelector('.close-modal').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.cancel-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.create-btn').addEventListener('click', () => {
            this.createBreakoutRoom(dialog);
            dialog.remove();
        });
    }

    generateParticipantCheckboxes() {
        if (!this.app.participants) return '';
        
        return this.app.participants
            .filter(p => p.id !== this.app.currentUser?.id)
            .map(participant => `
                <label class="participant-checkbox">
                    <input type="checkbox" value="${participant.id}">
                    <span>${participant.name}</span>
                </label>
            `).join('');
    }

    createBreakoutRoom(dialog) {
        const selectedParticipants = Array.from(
            dialog.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        const roomName = dialog.querySelector('#breakoutRoomName').value;
        const duration = parseInt(dialog.querySelector('#breakoutDuration').value);
        
        if (selectedParticipants.length === 0) {
            this.app.showNotification('Please select at least one participant', 'error');
            return;
        }
        
        if (this.app.socketHandler) {
            this.app.socketHandler.createBreakoutRoom(selectedParticipants);
        }
        
        this.app.showNotification(`Breakout room "${roomName}" created`, 'success');
    }

    // Fullscreen Management
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error('Error exiting fullscreen:', err);
            });
        }
    }

    enterVideoFullscreen(videoTile) {
        const video = videoTile.querySelector('video');
        if (video && video.requestFullscreen) {
            video.requestFullscreen().catch(err => {
                console.error('Error entering video fullscreen:', err);
            });
        }
    }

    addFullscreenButton(videoTile) {
        if (videoTile.querySelector('.fullscreen-btn')) return;
        
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.addEventListener('click', () => this.enterVideoFullscreen(videoTile));
        
        videoTile.appendChild(fullscreenBtn);
    }

    updateFullscreenUI() {
        const meetingRoom = document.getElementById('meetingRoom');
        if (meetingRoom) {
            if (this.isFullscreen) {
                meetingRoom.classList.add('fullscreen');
            } else {
                meetingRoom.classList.remove('fullscreen');
            }
        }
    }

    // Statistics
    showVideoStats(videoTile) {
        const participantId = videoTile.dataset.participantId;
        const stats = this.gatherVideoStats(participantId);
        
        const statsModal = document.createElement('div');
        statsModal.className = 'modal active';
        statsModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Video Statistics</h3>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        ${this.formatStats(stats)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(statsModal);
        
        statsModal.querySelector('.close-modal').addEventListener('click', () => {
            statsModal.remove();
        });
    }

    gatherVideoStats(participantId) {
        // Gather stats from MediaSoup client
        const stats = {
            participantId,
            resolution: 'Unknown',
            framerate: 'Unknown',
            bitrate: 'Unknown',
            packetLoss: 'Unknown',
            latency: 'Unknown'
        };
        
        if (this.app.mediasoupClient) {
            const mediasoupStats = this.app.mediasoupClient.getStats();
            // Process MediaSoup stats here
        }
        
        return stats;
    }

    formatStats(stats) {
        return Object.entries(stats).map(([key, value]) => `
            <div class="stat-item">
                <span class="stat-label">${key}:</span>
                <span class="stat-value">${value}</span>
            </div>
        `).join('');
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        // Register shortcuts with visual hints
        this.keyboardShortcuts = {
            'm': { action: () => this.app.toggleMicrophone(), description: 'Toggle Microphone' },
            'v': { action: () => this.app.toggleCamera(), description: 'Toggle Camera' },
            's': { action: () => this.app.toggleScreenShare(), description: 'Share Screen' },
            'c': { action: () => this.app.togglePanel('chat'), description: 'Toggle Chat' },
            'p': { action: () => this.app.togglePanel('participants'), description: 'Toggle Participants' },
            'h': { action: () => this.app.raiseHand(), description: 'Raise Hand' },
            '1': { action: () => this.switchLayout('auto'), description: 'Auto Layout' },
            '2': { action: () => this.switchLayout('grid'), description: 'Grid Layout' },
            '3': { action: () => this.switchLayout('spotlight'), description: 'Spotlight Layout' },
            'shift+s': { action: () => this.app.toggleScreenShare(), description: 'Toggle Screen Share' },
            'r': { action: () => this.app.toggleRecording(), description: 'Toggle Recording (Teachers only)' }
        };
        
        // Add shortcut hints to UI
        this.addShortcutHints();
    }

    addShortcutHints() {
        Object.entries(this.keyboardShortcuts).forEach(([key, config]) => {
            const element = this.findElementForShortcut(key);
            if (element) {
                const hint = document.createElement('div');
                hint.className = 'shortcut-hint';
                hint.textContent = key.toUpperCase();
                element.appendChild(hint);
            }
        });
    }

    findElementForShortcut(key) {
        const mapping = {
            'm': '#toggleMic',
            'v': '#toggleCamera',
            's': '#shareScreen',
            'c': '#toggleChat',
            'p': '#toggleParticipants',
            'h': '#raiseHand',
            'r': '#recordSession'
        };
        
        return document.querySelector(mapping[key]);
    }

    // Responsive Design
    setupResponsiveHandlers() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addListener(this.handleResponsiveChange.bind(this));
        this.handleResponsiveChange(mediaQuery);
    }

    handleResponsiveChange(mediaQuery) {
        if (mediaQuery.matches) {
            this.enableMobileUI();
        } else {
            this.enableDesktopUI();
        }
    }

    enableMobileUI() {
        document.body.classList.add('mobile-ui');
        
        // Adjust layouts for mobile
        if (this.gridLayout === 'grid') {
            this.switchLayout('auto');
        }
        
        // Simplify controls
        document.querySelectorAll('.control-btn span').forEach(span => {
            span.style.display = 'none';
        });
    }

    enableDesktopUI() {
        document.body.classList.remove('mobile-ui');
        
        // Restore control labels
        document.querySelectorAll('.control-btn span').forEach(span => {
            span.style.display = '';
        });
    }

    // Accessibility
    initializeAccessibility() {
        this.setupAriaLabels();
        this.setupFocusManagement();
        this.setupScreenReaderAnnouncements();
    }

    setupAriaLabels() {
        // Add ARIA labels to buttons
        const ariaLabels = {
            '#toggleMic': 'Toggle microphone',
            '#toggleCamera': 'Toggle camera',
            '#shareScreen': 'Share screen',
            '#toggleChat': 'Toggle chat panel',
            '#toggleParticipants': 'Toggle participants panel',
            '#raiseHand': 'Raise hand',
            '#leaveRoom': 'Leave meeting'
        };
        
        Object.entries(ariaLabels).forEach(([selector, label]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('aria-label', label);
            }
        });
    }

    setupFocusManagement() {
        // Focus management for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.manageFocus(e);
            }
        });
    }

    manageFocus(e) {
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        
        document.body.appendChild(liveRegion);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    // Cleanup
    cleanup() {
        // Clean up audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear analysers
        this.audioAnalysers.clear();
        this.volumeLevels.clear();
        
        // Remove context menus
        this.closeAllContextMenus();
        
        console.log('UI Controls cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIControls;
}