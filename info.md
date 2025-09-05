# Edumeet Project Documentation

## Project Structure

```
edumeet/
├── client/
│   ├── assets/
│   │   ├── icons/
│   │   │   └── camera-off.svg
│   │   │   └── camera-on.svg
│   │   │   └── canvas.svg
│   │   │   └── mic-off.svg
│   │   │   └── mic-on.svg
│   │   │   └── pin.svg
│   │   │   └── screen-share.svg
│   │   └── sounds/
│   │       └── join.mp3
│   │       └── leave.mp3
│   ├── css/
│   │   └── canvas.css
│   │   └── icons.css
│   │   └── style.css
│   │   └── video-controls.css
│   ├── js/
│   │   └── canvas.js
│   │   └── main.js
│   │   └── mediasoup-client.js
│   │   └── mobile-fixes.js
│   │   └── socket-handler.js
│   │   └── ui-controls.js
│   │   └── webrtc-manager.js
│   └── index.html
├── server/
│   ├── config/
│   │   └── mediasoup.js
│   ├── controllers/
│   │   └── canvasController.js
│   │   └── mediaController.js
│   │   └── roomController.js
│   │   └── socketController.js
│   ├── models/
│   │   └── Participant.js
│   │   └── Room.js
│   ├── utils/
│   │   └── logger.js
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── README.md
```

# Frontend Code

## client/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>EduMeet - Educational Video Conferencing</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/video-controls.css">
    <link rel="stylesheet" href="css/canvas.css">
    <link rel="stylesheet" href="css/icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome Icons - Updated working version -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
    <style>
        /* Ensure Font Awesome icons display correctly */
        .fas, .fa {
            font-family: "Font Awesome 6 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
            font-weight: 900 !important;
            font-style: normal !important;
            display: inline-block !important;
            font-variant: normal !important;
            text-rendering: auto !important;
            line-height: 1 !important;
        }
        .far {
            font-family: "Font Awesome 6 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
            font-weight: 400 !important;
        }
    </style>
</head>
<body>
    <!-- Loading Screen -->
    <div id="loadingScreen" class="loading-screen">
        <div class="space-background"></div>
        <div class="stars"></div>
        <div class="loading-content">
            <div class="loading-logo">
                <i class="fas fa-rocket"></i>
            </div>
            <div class="loading-spinner">
                <div class="orbit"></div>
                <div class="planet"></div>
            </div>
            <h2 class="loading-title">Launching EduMeet...</h2>
            <p class="loading-subtitle">Preparing your space for learning</p>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
    </div>

    <!-- Join Screen -->
    <div id="joinScreen" class="join-screen">
        <div class="space-background"></div>
        <div class="stars"></div>
        <div class="join-container">
            <div class="logo">
                <i class="fas fa-chalkboard-teacher"></i>
                <h1>EduMeet</h1>
                <p>Interactive Learning Platform</p>
            </div>
            
            <form id="joinForm" class="join-form">
                <div class="form-group">
                    <label for="userName">Your Name</label>
                    <input type="text" id="userName" name="userName" required 
                           placeholder="Enter your full name">
                </div>
                
                <div class="form-group">
                    <label for="roomId">Room ID</label>
                    <div class="room-input-group">
                        <input type="text" id="roomId" name="roomId" 
                               placeholder="Enter room ID">
                        <button type="button" id="generateRoomBtn" class="btn-generate">
                            <i class="fas fa-dice"></i>
                            Generate
                        </button>
                    </div>
                    <small class="form-hint">Leave empty to create a new room automatically</small>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" id="isTeacher" name="isTeacher">
                        <span class="checkmark"></span>
                        I am a teacher/instructor
                    </label>
                </div>
                
                <div class="action-buttons">
                    <button type="button" id="createRoomBtn" class="create-room-btn">
                        <i class="fas fa-plus-circle"></i>
                        Create New Room
                    </button>
                    <button type="submit" class="join-btn">
                        <i class="fas fa-sign-in-alt"></i>
                        Join Existing Room
                    </button>
                </div>
                </button>
            </form>
        </div>
    </div>

    <!-- Main Meeting Interface -->
    <div id="meetingRoom" class="meeting-room hidden">
        <!-- Header -->
        <header class="meeting-header">
            <div class="header-left">
                <h2 id="roomTitle">EduMeet Session</h2>
                <span id="participantCount" class="participant-count">1 participant</span>
            </div>
            <div class="header-center">
                <div class="meeting-time" id="meetingTimer">00:00</div>
            </div>
            <div class="header-right">
                <button id="toggleChat" class="btn-header">
                    <i class="fas fa-comments"></i>
                </button>
                <button id="toggleCanvas" class="btn-header">
                    <i class="fas fa-paint-brush"></i>
                </button>
                <button id="toggleParticipants" class="btn-header">
                    <i class="fas fa-users"></i>
                </button>
                <button id="settingsBtn" class="btn-header">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </header>

        <!-- Main Content Area -->
        <div class="meeting-content">
            <!-- Video Grid -->
            <div class="video-container">
                <div id="videoGrid" class="video-grid">
                    <!-- Videos will be dynamically added here -->
                </div>
                
                <!-- Pinned Video -->
                <div id="pinnedVideo" class="pinned-video hidden">
                    <!-- Pinned video will be shown here -->
                </div>
            </div>

            <!-- Canvas Overlay -->
            <div id="canvasContainer" class="canvas-container hidden">
                <canvas id="sharedCanvas" class="shared-canvas"></canvas>
                <div class="canvas-toolbar">
                    <div class="tool-group">
                        <button id="penTool" class="tool-btn active" data-tool="pen">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button id="eraserTool" class="tool-btn" data-tool="eraser">
                            <i class="fas fa-eraser"></i>
                        </button>
                        <button id="textTool" class="tool-btn" data-tool="text">
                            <i class="fas fa-font"></i>
                        </button>
                        <button id="lineTool" class="tool-btn" data-tool="line">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button id="rectangleTool" class="tool-btn" data-tool="rectangle">
                            <i class="fas fa-square"></i>
                        </button>
                        <button id="circleTool" class="tool-btn" data-tool="circle">
                            <i class="fas fa-circle"></i>
                        </button>
                    </div>
                    
                    <div class="tool-group">
                        <input type="color" id="colorPicker" value="#000000">
                        <input type="range" id="brushSize" min="1" max="20" value="3">
                    </div>
                    
                    <div class="tool-group">
                        <button id="clearCanvas" class="tool-btn danger">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button id="undoCanvas" class="tool-btn">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Participants Panel -->
                <div id="participantsPanel" class="panel">
                    <div class="panel-header">
                        <h3>Participants</h3>
                        <button id="closeParticipants" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        <div id="participantsList" class="participants-list">
                            <!-- Participants will be listed here -->
                        </div>
                    </div>
                </div>

                <!-- Chat Panel -->
                <div id="chatPanel" class="panel">
                    <div class="panel-header">
                        <h3>Chat</h3>
                        <button id="closeChat" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        <div id="chatMessages" class="chat-messages">
                            <!-- Chat messages will appear here -->
                        </div>
                        <div class="chat-input">
                            <input type="text" id="chatInput" placeholder="Type a message...">
                            <button id="sendChat" class="send-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Controls Bar -->
        <div class="controls-bar">
            <div class="controls-left">
                <button id="toggleMic" class="control-btn">
                    <i class="fas fa-microphone"></i>
                </button>
                <button id="toggleCamera" class="control-btn">
                    <i class="fas fa-video"></i>
                </button>
                <button id="shareScreen" class="control-btn">
                    <i class="fas fa-desktop"></i>
                </button>
            </div>
            
            <div class="controls-center">
                <button id="raiseHand" class="control-btn">
                    <i class="fas fa-hand-paper"></i>
                    <span>Raise Hand</span>
                </button>
                <button id="toggleCanvasControl" class="control-btn">
                    <i class="fas fa-paint-brush"></i>
                    <span>Canvas</span>
                </button>
            </div>
            
            <div class="controls-right">
                <button id="recordSession" class="control-btn" disabled>
                    <i class="fas fa-record-vinyl"></i>
                </button>
                <button id="leaveRoom" class="control-btn danger">
                    <i class="fas fa-phone-slash"></i>
                    <span>Leave</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="settingsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Settings</h3>
                <button class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>Audio & Video</h4>
                    <div class="setting-item">
                        <label>Microphone</label>
                        <select id="microphoneSelect">
                            <option>Default Microphone</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Camera</label>
                        <select id="cameraSelect">
                            <option>Default Camera</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Speaker</label>
                        <select id="speakerSelect">
                            <option>Default Speaker</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Display</h4>
                    <div class="setting-item">
                        <label class="switch-container">
                            <input type="checkbox" id="showParticipantNames">
                            <span class="switch"></span>
                            Show participant names
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="switch-container">
                            <input type="checkbox" id="enableSpatialAudio">
                            <span class="switch"></span>
                            Enable spatial audio
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script>
        // Font Awesome Detection and Fallback
        function checkFontAwesome() {
            const testElement = document.createElement('i');
            testElement.className = 'fas fa-home';
            testElement.style.position = 'absolute';
            testElement.style.left = '-9999px';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement, ':before');
            const content = computedStyle.getPropertyValue('content');
            
            document.body.removeChild(testElement);
            
            // If Font Awesome is not working, add fallback class
            if (!content || content === 'none' || content === '""') {
                console.warn('Font Awesome not loaded, using fallbacks');
                document.body.classList.add('no-fa');
            } else {
                console.log('Font Awesome loaded successfully');
            }
        }
        
        // Run check when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkFontAwesome);
        } else {
            checkFontAwesome();
        }
    </script>
    <script src="/socket.io/socket.io.js"></script>
    <!-- MediaSoup Client with fallback -->
    <script>
        // Load MediaSoup client with error handling
        (function() {
            var script = document.createElement('script');
            script.src = 'https://unpkg.com/mediasoup-client@3.6.84/lib/index.min.js';
            script.onload = function() {
                console.log('MediaSoup client loaded successfully');
            };
            script.onerror = function() {
                console.warn('Failed to load MediaSoup client from primary CDN, trying fallback...');
                var fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mediasoup-client/3.6.84/mediasoup-client.min.js';
                fallbackScript.onerror = function() {
                    console.error('All MediaSoup CDN sources failed. Video/audio features will be limited.');
                    window.mediasoupLoadFailed = true;
                };
                document.head.appendChild(fallbackScript);
            };
            document.head.appendChild(script);
        })();
    </script>
    <script src="js/webrtc-manager.js"></script>
    <script src="js/socket-handler.js"></script>
    <script src="js/mediasoup-client.js"></script>
    <script src="js/canvas.js"></script>
    <script src="js/ui-controls.js"></script>
    <script src="js/mobile-fixes.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

## client/css/canvas.css

```css
/* Canvas Overlay Styles */

.canvas-container {
    position: fixed;
    top: 60px; /* Below header */
    right: 0;
    width: 400px;
    height: calc(100vh - 60px);
    background: rgba(20, 20, 20, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
}

.canvas-container.active {
    transform: translateX(0);
    pointer-events: all;
}

.shared-canvas {
    flex: 1;
    width: 100%;
    cursor: crosshair;
    background: white;
    margin: 20px;
    border-radius: 8px;
    width: calc(100% - 40px);
    height: calc(100% - 100px);
}

.shared-canvas.eraser {
    cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMTJMMTIgOEwyMCAxNkwxNiAyMEw4IDEyWiIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'), auto;
}

.shared-canvas.text {
    cursor: text;
}

/* Canvas Toolbar */
.canvas-toolbar {
    position: relative;
    padding: 16px 20px;
    background: rgba(45, 45, 45, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    backdrop-filter: blur(10px);
}

.tool-group {
    display: flex;
    gap: 8px;
    align-items: center;
    position: relative;
}

.tool-group:not(:last-child)::after {
    content: '';
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    margin-left: 12px;
}

.tool-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    transition: all 0.3s ease;
    position: relative;
}

.tool-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tool-btn.active {
    background: #ffd700;
    color: #333;
}

.tool-btn.danger {
    background: rgba(244, 67, 54, 0.8);
}

.tool-btn.danger:hover {
    background: rgba(244, 67, 54, 1);
}

/* Tool-specific styles */
#colorPicker {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: none;
    padding: 4px;
}

#colorPicker::-webkit-color-swatch-wrapper {
    padding: 0;
    border: none;
}

#colorPicker::-webkit-color-swatch {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
}

#brushSize {
    width: 80px;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    appearance: none;
}

#brushSize::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
    border: 2px solid #333;
}

#brushSize::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
    border: 2px solid #333;
}

/* Brush Size Indicator */
.brush-size-indicator {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

#brushSize:hover + .brush-size-indicator,
#brushSize:focus + .brush-size-indicator {
    opacity: 1;
}

/* Canvas Actions Feedback */
.canvas-feedback {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 100;
}

.canvas-feedback.show {
    opacity: 1;
}

/* Drawing Cursor with brush size preview */
.canvas-cursor {
    position: fixed;
    border-radius: 50%;
    border: 2px solid #ffd700;
    background: rgba(255, 215, 0, 0.2);
    pointer-events: none;
    z-index: 1000;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.1s ease;
}

.canvas-cursor.show {
    opacity: 1;
}

/* Shape Drawing Preview */
.shape-preview {
    position: absolute;
    pointer-events: none;
    z-index: 60;
}

/* Text Input Modal */
.text-input-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.text-input-modal.active {
    opacity: 1;
    pointer-events: all;
}

.text-input-content {
    background: #2d2d2d;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    color: white;
}

.text-input-header {
    margin-bottom: 16px;
}

.text-input-header h3 {
    font-size: 18px;
    font-weight: 600;
}

.text-input-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.text-input-form input[type="text"] {
    padding: 12px;
    border: 1px solid #444;
    border-radius: 8px;
    background: #333;
    color: white;
    font-size: 16px;
    outline: none;
}

.text-input-form input[type="text"]:focus {
    border-color: #ffd700;
}

.text-size-slider {
    display: flex;
    align-items: center;
    gap: 12px;
}

.text-size-slider label {
    font-size: 14px;
    min-width: 60px;
}

.text-size-slider input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    appearance: none;
}

.text-size-slider input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
}

.text-size-slider span {
    min-width: 30px;
    text-align: right;
    font-size: 14px;
    color: #ffd700;
}

.text-input-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.text-input-actions button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.text-input-actions .cancel-btn {
    background: #666;
    color: white;
}

.text-input-actions .cancel-btn:hover {
    background: #777;
}

.text-input-actions .add-btn {
    background: #ffd700;
    color: #333;
}

.text-input-actions .add-btn:hover {
    background: #ffed4e;
}

/* Collaborative Drawing Indicators */
.drawing-participant {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 70;
    transition: all 0.1s ease;
}

.drawing-participant::after {
    content: attr(data-name);
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.drawing-participant:hover::after {
    opacity: 1;
}

/* Canvas Layer Controls */
.layer-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(45, 45, 45, 0.95);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.layer-controls h4 {
    color: white;
    font-size: 14px;
    margin-bottom: 12px;
    font-weight: 600;
}

.opacity-control {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.opacity-control label {
    color: white;
    font-size: 12px;
    min-width: 50px;
}

.opacity-control input[type="range"] {
    width: 100px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    appearance: none;
}

.opacity-control input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffd700;
    cursor: pointer;
}

.layer-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
}

.layer-toggle label {
    color: white;
    font-size: 12px;
    cursor: pointer;
}

.layer-toggle input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #ffd700;
}

/* Mobile Canvas Controls */
@media (max-width: 768px) {
    .canvas-toolbar {
        top: 10px;
        left: 10px;
        right: 10px;
        max-width: none;
        padding: 12px;
        flex-direction: column;
        gap: 8px;
    }
    
    .tool-group {
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .tool-group::after {
        display: none;
    }
    
    .tool-btn {
        width: 40px;
        height: 40px;
        font-size: 14px;
    }
    
    #brushSize {
        width: 100px;
    }
    
    .layer-controls {
        top: 10px;
        right: 10px;
        padding: 12px;
    }
}

@media (max-width: 480px) {
    .canvas-toolbar {
        position: fixed;
        bottom: 80px;
        top: auto;
        left: 10px;
        right: 10px;
        border-radius: 20px;
        padding: 16px;
    }
    
    .tool-btn {
        width: 36px;
        height: 36px;
        font-size: 12px;
    }
    
    #colorPicker {
        width: 36px;
        height: 36px;
    }
    
    #brushSize {
        width: 80px;
    }
    
    .layer-controls {
        display: none; /* Hide on mobile for space */
    }
    
    .text-input-content {
        margin: 20px;
        width: auto;
    }
}

/* Touch-specific optimizations */
@media (hover: none) and (pointer: coarse) {
    .tool-btn {
        min-width: 48px;
        min-height: 48px;
    }
    
    .shared-canvas {
        touch-action: none; /* Prevent scrolling while drawing */
    }
    
    .brush-size-indicator {
        display: none; /* Touch devices don't have hover */
    }
}

/* High DPI displays */
@media (min-resolution: 192dpi) {
    .shared-canvas {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}

/* Animation for tool selection */
@keyframes tool-select {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* Canvas Panel Mobile Responsive */
@media (max-width: 768px) {
    .canvas-container {
        width: 100%;
        height: 100%;
        top: 0;
        right: 0;
        transform: translateX(100%);
    }
    
    .canvas-container.active {
        transform: translateX(0);
    }
    
    .shared-canvas {
        margin: 10px;
        width: calc(100% - 20px);
        height: calc(100% - 80px);
    }
    
    .canvas-toolbar {
        padding: 12px;
        gap: 8px;
    }
}

.tool-btn.selecting {
    animation: tool-select 0.2s ease;
}
```

## client/css/icons.css

```css
/* Custom Icon Font Fallback */
@font-face {
    font-family: 'IconFont';
    src: url('data:font/woff2;base64,') format('woff2');
    font-weight: normal;
    font-style: normal;
}

/* Font Awesome Icon Fallbacks using Unicode */
.fas, .fa {
    font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "IconFont", Arial, sans-serif !important;
    font-weight: 900 !important;
    font-style: normal !important;
    display: inline-block !important;
    text-rendering: auto !important;
    line-height: 1 !important;
}

/* Specific icon mappings using Unicode characters */
.fa-microphone::before { content: "\f130"; }
.fa-microphone-slash::before { content: "\f131"; }
.fa-video::before { content: "\f03d"; }
.fa-video-slash::before { content: "\f4cc"; }
.fa-desktop::before { content: "\f108"; }
.fa-phone-slash::before { content: "\f3dd"; }
.fa-hand-paper::before { content: "\f256"; }
.fa-paint-brush::before { content: "\f1fc"; }
.fa-comments::before { content: "\f086"; }
.fa-users::before { content: "\f0c0"; }
.fa-cog::before { content: "\f013"; }
.fa-times::before { content: "\f00d"; }
.fa-plus-circle::before { content: "\f055"; }
.fa-sign-in-alt::before { content: "\f2f6"; }
.fa-chalkboard-teacher::before { content: "\f51c"; }
.fa-dice::before { content: "\f522"; }
.fa-rocket::before { content: "\f135"; }
.fa-record-vinyl::before { content: "\f8d9"; }
.fa-paper-plane::before { content: "\f1d8"; }
.fa-pen::before { content: "\f304"; }
.fa-eraser::before { content: "\f12d"; }
.fa-font::before { content: "\f031"; }
.fa-minus::before { content: "\f068"; }
.fa-square::before { content: "\f0c8"; }
.fa-circle::before { content: "\f111"; }
.fa-trash::before { content: "\f1f8"; }
.fa-undo::before { content: "\f0e2"; }
.fa-thumbtack::before { content: "\f08d"; }

/* Fallback for when Font Awesome completely fails */
.icon-fallback {
    font-family: Arial, sans-serif !important;
    font-weight: bold !important;
    font-size: 0.9em !important;
}

/* Text-based fallbacks */
.no-fa .fa-microphone::before { content: "🎤"; font-family: Arial, sans-serif; }
.no-fa .fa-microphone-slash::before { content: "🚫"; font-family: Arial, sans-serif; }
.no-fa .fa-video::before { content: "📹"; font-family: Arial, sans-serif; }
.no-fa .fa-video-slash::before { content: "📵"; font-family: Arial, sans-serif; }
.no-fa .fa-desktop::before { content: "🖥"; font-family: Arial, sans-serif; }
.no-fa .fa-phone-slash::before { content: "📞"; font-family: Arial, sans-serif; }
.no-fa .fa-hand-paper::before { content: "✋"; font-family: Arial, sans-serif; }
.no-fa .fa-paint-brush::before { content: "🎨"; font-family: Arial, sans-serif; }
.no-fa .fa-comments::before { content: "💬"; font-family: Arial, sans-serif; }
.no-fa .fa-users::before { content: "👥"; font-family: Arial, sans-serif; }
.no-fa .fa-cog::before { content: "⚙"; font-family: Arial, sans-serif; }
.no-fa .fa-times::before { content: "✕"; font-family: Arial, sans-serif; }
.no-fa .fa-plus-circle::before { content: "➕"; font-family: Arial, sans-serif; }
.no-fa .fa-sign-in-alt::before { content: "→"; font-family: Arial, sans-serif; }
.no-fa .fa-rocket::before { content: "🚀"; font-family: Arial, sans-serif; }

```

## client/css/style.css

```css
/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    min-height: -webkit-fill-available; /* Mobile Safari fix */
    overflow: hidden;
    position: fixed; /* Prevent mobile scroll issues */
    width: 100%;
    height: 100%;
    -webkit-overflow-scrolling: touch;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

/* Loading Screen */
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    z-index: 9999;
    overflow: hidden;
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.space-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%),
        url('https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=1080&fit=crop&crop=center&q=80') center/cover;
    background-blend-mode: multiply;
    animation: zoomIn 3s ease-out infinite alternate;
}

.stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(2px 2px at 20px 30px, #eee, transparent),
        radial-gradient(2px 2px at 40px 70px, #fff, transparent),
        radial-gradient(1px 1px at 90px 40px, #fff, transparent),
        radial-gradient(1px 1px at 130px 80px, #fff, transparent),
        radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: twinkle 4s ease-in-out infinite alternate;
}

.loading-content {
    position: relative;
    z-index: 10;
    text-align: center;
    animation: fadeInUp 1.5s ease-out;
}

.loading-logo {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
}

.loading-logo i {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
}

.loading-spinner {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 2rem auto;
}

.orbit {
    position: absolute;
    width: 100px;
    height: 100px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: orbit 2s linear infinite;
}

.planet {
    position: absolute;
    top: 5px;
    left: 50%;
    width: 12px;
    height: 12px;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
}

.loading-title {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    background: linear-gradient(45deg, #fff, #ccc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.loading-subtitle {
    font-size: 1rem;
    margin-bottom: 2rem;
    opacity: 0.8;
    color: #b0b0b0;
}

.progress-bar {
    width: 300px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin: 0 auto;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
    border-radius: 2px;
    animation: loadProgress 3s ease-in-out infinite;
}

@keyframes zoomIn {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
}

@keyframes twinkle {
    0% { opacity: 0.3; }
    100% { opacity: 1; }
}

@keyframes fadeInUp {
    0% { 
        opacity: 0; 
        transform: translateY(50px); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes orbit {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes loadProgress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
}

.loading-screen p {
    font-size: 16px;
    opacity: 0.8;
}

/* Join Screen */
.join-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%),
        url('https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=1080&fit=crop&crop=center&q=80') center/cover;
    background-blend-mode: multiply;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    z-index: 1000;
    overflow-y: auto;
}

.join-container {
    background: rgba(15, 15, 30, 0.8);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.3),
        0 0 50px rgba(75, 179, 244, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    max-width: 500px;
    animation: slideInUp 0.8s ease-out;
}

@keyframes slideInUp {
    0% {
        opacity: 0;
        transform: translateY(50px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.logo {
    text-align: center;
    margin-bottom: 40px;
}

.logo i {
    font-size: 60px;
    margin-bottom: 15px;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
}

.logo h1 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(45deg, #fff, #e0e0e0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.logo p {
    font-size: 16px;
    opacity: 0.8;
    color: #b0b0b0;
}

.join-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: 500;
    font-size: 14px;
}

.form-group input {
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 16px;
    outline: none;
    transition: all 0.3s ease;
}

.form-group input:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
}

.form-group input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

/* Checkbox */
.checkbox-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 14px;
}

.checkbox-container input[type="checkbox"] {
    opacity: 0;
    position: absolute;
}

.checkmark {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    margin-right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.checkbox-container input[type="checkbox"]:checked ~ .checkmark {
    background: #ffd700;
    border-color: #ffd700;
}

.checkmark:after {
    content: "✓";
    color: #333;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.checkbox-container input[type="checkbox"]:checked ~ .checkmark:after {
    opacity: 1;
}

/* Room Input Group */
.room-input-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

.room-input-group input {
    flex: 1;
}

.btn-generate {
    background: linear-gradient(45deg, #4ecdc4, #45b7d1);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

.btn-generate:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(78, 205, 196, 0.3);
}

.form-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 5px;
    display: block;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 30px;
}

.create-room-btn {
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
}

.create-room-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
}

.join-btn {
    background: linear-gradient(45deg, #4ecdc4, #45b7d1);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
}

.join-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(78, 205, 196, 0.4);
}

/* Media Preview */
.media-preview {
    margin: 20px 0;
}

.preview-video {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    background: #222;
}

.preview-video video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-controls {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    gap: 10px;
}

.btn-icon {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.btn-icon:hover {
    background: rgba(0, 0, 0, 0.9);
}

.btn-icon.disabled {
    background: rgba(255, 0, 0, 0.7);
}

/* Join Button */
.join-btn {
    padding: 16px 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #333;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.join-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);
}

.join-btn:active {
    transform: translateY(0);
}

/* Meeting Room */
.meeting-room {
    width: 100%;
    height: 100vh;
    background: #1a1a1a;
    color: white;
    display: flex;
    flex-direction: column;
}

.hidden {
    display: none !important;
}

/* Header */
.meeting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #2d2d2d;
    border-bottom: 1px solid #444;
    position: relative;
    z-index: 100;
}

.header-left h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
}

.participant-count {
    font-size: 14px;
    color: #888;
}

.header-center .meeting-time {
    font-size: 18px;
    font-weight: 500;
    color: #ffd700;
}

.header-right {
    display: flex;
    gap: 12px;
}

.btn-header {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: #444;
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.btn-header:hover {
    background: #555;
}

.btn-header.active {
    background: #ffd700;
    color: #333;
}

/* Main Content */
.meeting-content {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
}

.video-container {
    flex: 1;
    position: relative;
    background: #000;
}

.video-grid {
    width: 100%;
    height: 100%;
    display: grid;
    gap: 4px;
    padding: 8px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    grid-auto-rows: minmax(180px, 1fr);
}

/* Video Tiles */
.video-tile {
    position: relative;
    background: #333;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

.video-tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.video-tile .participant-info {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    backdrop-filter: blur(4px);
}

.video-tile .video-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
}

.video-tile .control-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 10px;
}

.video-tile .control-icon.muted {
    background: rgba(255, 0, 0, 0.7);
}

.video-tile .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(45deg, #667eea, #764ba2);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    font-weight: bold;
    color: white;
}

.video-tile .pin-btn {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.video-tile:hover .pin-btn {
    opacity: 1;
}

.video-tile.pinned {
    border: 2px solid #ffd700;
}

/* Pinned Video */
.pinned-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 50;
}

/* Sidebar */
.sidebar {
    width: 350px;
    background: #2d2d2d;
    border-left: 1px solid #444;
    position: relative;
    z-index: 10;
}

.panel {
    width: 100%;
    height: 100%;
    background: #2d2d2d;
    display: none;
}

.panel.active {
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #333;
    border-bottom: 1px solid #444;
}

.panel-header h3 {
    font-size: 18px;
    font-weight: 600;
}

.close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #888;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: #444;
    color: white;
}

.panel-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

/* Participants List */
.participants-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.participant-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #333;
    border-radius: 8px;
    gap: 12px;
}

.participant-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(45deg, #667eea, #764ba2);
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    color: white;
    font-size: 16px;
}

.participant-info {
    flex: 1;
}

.participant-name {
    font-weight: 500;
    margin-bottom: 2px;
}

.participant-status {
    font-size: 12px;
    color: #888;
}

.participant-status.teacher {
    color: #ffd700;
}

.participant-controls {
    display: flex;
    gap: 8px;
}

.participant-controls button {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: #444;
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 10px;
    transition: all 0.3s ease;
}

.participant-controls button:hover {
    background: #555;
}

.participant-controls button.muted {
    background: #ff4444;
}

/* Chat */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
    max-height: 400px;
}

.chat-message {
    margin-bottom: 16px;
    padding: 12px;
    background: #333;
    border-radius: 12px;
    border-bottom-left-radius: 4px;
}

.chat-message.own {
    background: #ffd700;
    color: #333;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 4px;
    margin-left: 20px;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.message-author {
    font-weight: 600;
    font-size: 14px;
}

.message-time {
    font-size: 12px;
    color: #888;
}

.chat-message.own .message-time {
    color: #666;
}

.message-content {
    font-size: 14px;
    line-height: 1.4;
}

.chat-input {
    display: flex;
    gap: 8px;
}

.chat-input input {
    flex: 1;
    padding: 12px;
    border: 1px solid #444;
    border-radius: 20px;
    background: #333;
    color: white;
    outline: none;
}

.chat-input input:focus {
    border-color: #ffd700;
}

.send-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: #ffd700;
    color: #333;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.send-btn:hover {
    background: #ffed4e;
}

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.modal.active {
    opacity: 1;
    pointer-events: all;
}

.modal-content {
    background: #2d2d2d;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    color: white;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #444;
}

.modal-header h3 {
    font-size: 20px;
    font-weight: 600;
}

.close-modal {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #888;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
}

.close-modal:hover {
    background: #444;
    color: white;
}

.modal-body {
    padding: 24px;
}

/* Settings */
.settings-section {
    margin-bottom: 24px;
}

.settings-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #ffd700;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.setting-item label {
    font-size: 14px;
    font-weight: 500;
}

.setting-item select {
    padding: 8px 12px;
    border: 1px solid #444;
    border-radius: 6px;
    background: #333;
    color: white;
    min-width: 150px;
}

/* Switch */
.switch-container {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.switch-container input[type="checkbox"] {
    opacity: 0;
    position: absolute;
}

.switch {
    width: 44px;
    height: 24px;
    background: #444;
    border-radius: 12px;
    position: relative;
    margin-right: 12px;
    transition: background 0.3s ease;
}

.switch:after {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.3s ease;
}

.switch-container input[type="checkbox"]:checked ~ .switch {
    background: #ffd700;
}

.switch-container input[type="checkbox"]:checked ~ .switch:after {
    transform: translateX(20px);
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast.success {
    background: #4caf50;
}

.toast.error {
    background: #f44336;
}

.toast.info {
    background: #2196f3;
}

.toast.warning {
    background: #ff9800;
}

/* Responsive Design */
@media (max-width: 768px) {
    .sidebar {
        width: 100%;
        position: absolute;
        top: 0;
        right: -100%;
        height: 100%;
        transition: right 0.3s ease;
        z-index: 200;
    }
    
    .sidebar.active {
        right: 0;
    }
    
    .video-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: minmax(200px, 1fr);
    }
    
    .join-container {
        margin: 20px;
        padding: 30px;
    }
    
    .meeting-header {
        padding: 12px 16px;
    }
    
    .controls-bar {
        padding: 12px 16px;
    }
}

@media (max-width: 480px) {
    .logo i {
        font-size: 48px;
    }
    
    .logo h1 {
        font-size: 28px;
    }
    
    .join-container {
        padding: 24px;
    }
    
    .controls-center .control-btn span,
    .controls-right .control-btn span {
        display: none;
    }
}

/* Mobile-specific fixes */
@media screen and (max-width: 480px) {
    html {
        height: 100%;
        height: -webkit-fill-available;
    }
    
    body {
        height: 100%;
        height: -webkit-fill-available;
        position: fixed;
        overflow: hidden;
        background-attachment: fixed;
    }
    
    .loading-screen {
        height: 100vh;
        height: -webkit-fill-available;
    }
    
    .meeting-room {
        height: 100vh;
        height: -webkit-fill-available;
        overflow: hidden;
    }
    
    .join-screen {
        height: 100vh;
        height: -webkit-fill-available;
        overflow: hidden;
    }
    
    /* Prevent zoom on input focus */
    input, select, textarea {
        font-size: 16px !important;
    }
    
    /* Fix video tiles on mobile */
    .video-grid {
        gap: 8px;
        padding: 8px;
    }
    
    .video-tile {
        min-height: 120px;
        border-radius: 8px;
    }
    
    /* Adjust controls for mobile */
    .controls-bar {
        padding: 8px 12px;
        height: auto;
        min-height: 60px;
    }
    
    .control-btn {
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
        font-size: 16px;
    }
    
    /* Header adjustments */
    .meeting-header {
        padding: 8px 12px;
        min-height: 50px;
    }
    
    .btn-header {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        font-size: 14px;
    }
    
    /* Sidebar adjustments */
    .sidebar {
        width: 100vw !important;
        right: -100vw;
    }
    
    .sidebar.active {
        right: 0;
    }
    
    /* Canvas adjustments */
    .canvas-container {
        top: 50px;
        bottom: 60px;
    }
    
    .canvas-toolbar {
        padding: 8px;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .tool-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
    }
}

/* Touch-specific styles */
@media (hover: none) and (pointer: coarse) {
    .control-btn:hover,
    .btn-header:hover,
    .tool-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        transform: none;
    }
    
    .video-tile:hover .pin-btn {
        opacity: 1;
    }
}
    
    .header-right {
        gap: 8px;
    }
    
    .btn-header {
        width: 36px;
        height: 36px;
    }
}
```

## client/css/video-controls.css

```css
/* Video Controls Specific Styles */

/* Controls Bar */
.controls-bar {
    background: #2d2d2d;
    padding: 16px 24px;
    border-top: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 100;
}

.controls-left,
.controls-center,
.controls-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.control-btn {
    min-width: 48px;
    height: 48px;
    border: none;
    border-radius: 24px;
    background: #444;
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    padding: 0 16px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.control-btn:hover {
    background: #555;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-btn:active {
    transform: translateY(0);
}

.control-btn i {
    font-size: 18px;
}

.control-btn span {
    font-size: 14px;
    white-space: nowrap;
}

/* Button States */
.control-btn.active {
    background: #ffd700;
    color: #333;
}

.control-btn.active:hover {
    background: #ffed4e;
}

.control-btn.disabled {
    background: #ff4444;
    cursor: not-allowed;
}

.control-btn.disabled:hover {
    background: #ff6666;
    transform: none;
    box-shadow: none;
}

.control-btn.danger {
    background: #ff4444;
}

.control-btn.danger:hover {
    background: #ff6666;
}

/* Specific Button Styles */
#toggleMic {
    background: #4caf50;
}

#toggleMic.disabled {
    background: #ff4444;
}

#toggleCamera {
    background: #2196f3;
}

#toggleCamera.disabled {
    background: #ff4444;
}

#shareScreen {
    background: #9c27b0;
}

#shareScreen.active {
    background: #ffd700;
    color: #333;
}

#recordSession {
    background: #f44336;
}

#recordSession.active {
    background: #ff1744;
    animation: pulse-record 2s infinite;
}

@keyframes pulse-record {
    0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
    100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
}

/* Volume Indicators */
.volume-indicator {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
}

.volume-level {
    height: 100%;
    background: #4caf50;
    width: 0%;
    transition: width 0.1s ease;
    border-radius: 2px;
}

/* Screen Share Overlay */
.screen-share-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    color: white;
    text-align: center;
}

.screen-share-content h3 {
    font-size: 24px;
    margin-bottom: 16px;
}

.screen-share-content p {
    font-size: 16px;
    margin-bottom: 24px;
    opacity: 0.8;
}

.screen-share-options {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
}

.share-option {
    padding: 16px 24px;
    border: 2px solid #444;
    border-radius: 12px;
    background: transparent;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 150px;
}

.share-option:hover {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
}

.share-option i {
    display: block;
    font-size: 32px;
    margin-bottom: 8px;
}

/* Connection Status Indicator */
.connection-status {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4caf50;
    border: 2px solid #2d2d2d;
}

.connection-status.poor {
    background: #ff9800;
}

.connection-status.bad {
    background: #f44336;
}

.connection-status.disconnected {
    background: #666;
}

/* Keyboard Shortcuts Indicator */
.shortcut-hint {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.control-btn:hover .shortcut-hint {
    opacity: 1;
}

/* Advanced Controls Menu */
.advanced-controls {
    position: absolute;
    top: -120px;
    right: 0;
    background: #2d2d2d;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: all 0.3s ease;
    min-width: 200px;
}

.advanced-controls.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
}

.advanced-control-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
    gap: 12px;
}

.advanced-control-item:hover {
    background: #444;
}

.advanced-control-item i {
    width: 16px;
    text-align: center;
}

/* Audio Level Visualization */
.audio-visualizer {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: 8px;
}

.audio-bar {
    width: 3px;
    height: 12px;
    background: rgba(76, 175, 80, 0.3);
    border-radius: 1px;
    transition: all 0.1s ease;
}

.audio-bar.active {
    background: #4caf50;
    height: 16px;
}

/* Video Quality Indicator */
.quality-indicator {
    position: absolute;
    top: -30px;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.control-btn:hover .quality-indicator {
    opacity: 1;
}

/* Notification Badges */
.notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    background: #f44336;
    color: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 11px;
    font-weight: bold;
    border: 2px solid #2d2d2d;
}

/* Hand Raise Animation */
#raiseHand.active {
    animation: hand-wave 0.6s ease-in-out infinite alternate;
}

@keyframes hand-wave {
    0% { transform: rotate(-10deg); }
    100% { transform: rotate(10deg); }
}

/* Responsive Controls */
@media (max-width: 768px) {
    .controls-bar {
        padding: 12px 16px;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .control-btn {
        min-width: 44px;
        height: 44px;
        padding: 0 12px;
    }
    
    .control-btn span {
        display: none;
    }
    
    .controls-center,
    .controls-right {
        gap: 8px;
    }
    
    .advanced-controls {
        right: -50px;
        min-width: 150px;
    }
}

@media (max-width: 480px) {
    .controls-bar {
        justify-content: center;
    }
    
    .controls-left,
    .controls-center,
    .controls-right {
        gap: 6px;
    }
    
    .control-btn {
        min-width: 40px;
        height: 40px;
        border-radius: 20px;
    }
    
    .control-btn i {
        font-size: 16px;
    }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
    .control-btn {
        min-width: 52px;
        height: 52px;
    }
    
    .shortcut-hint {
        display: none;
    }
    
    .control-btn:hover {
        transform: none;
        box-shadow: none;
    }
    
    .control-btn:active {
        transform: scale(0.95);
    }
}
```

## client/js/canvas.js

```javascript
// Canvas Manager for Collaborative Drawing
class CanvasManager {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.isActive = false;
    this.isReady = false; // becomes true once we have a non-zero sized canvas
        
        // Drawing state
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentLineWidth = 3;
        this.lastX = 0;
        this.lastY = 0;
        
        // Shape drawing
        this.isDrawingShape = false;
        this.shapeStartX = 0;
        this.shapeStartY = 0;
        this.shapePreview = null;
        
        // Text mode
        this.isTextMode = false;
        this.textModal = null;
        
        // History for undo
        this.drawingHistory = [];
        this.historyStep = -1;
        this.maxHistory = 50;
        
        // Collaborative cursors
        this.remoteCursors = new Map();
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('sharedCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindEvents();
        this.createTextModal();
    }

    setupCanvas() {
        // Set canvas size to match container (may be zero if hidden)
        this.resizeCanvas();

        // If the canvas is hidden (width/height 0) defer full setup until activation
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('CanvasManager: canvas has zero size during setup; deferring initialization until visible');
            return; // don't mark ready yet
        }

        // Set default drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalCompositeOperation = 'source-over';

        try {
            this.saveState();
            this.isReady = true;
        } catch (e) {
            console.warn('CanvasManager: initial saveState failed, will retry later', e);
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        // If container is hidden (display:none) rect sizes will be 0; skip resizing logic
        if (rect.width === 0 || rect.height === 0) {
            return;
        }
        
        // Set canvas size accounting for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale context to match device pixel ratio
    // Reset any existing transforms before scaling (avoid cumulative scaling)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
        this.bindDrawingEvents();
        this.bindToolbarEvents();
        this.bindSocketEvents();
    }

    bindDrawingEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        // Click for text tool
        this.canvas.addEventListener('click', (e) => {
            if (this.currentTool === 'text') {
                this.handleTextClick(e);
            }
        });

        // Cursor tracking for collaboration
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isActive) {
                this.sendCursorPosition(e);
            }
        });
    }

    bindToolbarEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool);
                this.setActiveTool(btn);
            });
        });

        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.currentColor = e.target.value;
            });
        }

        // Brush size
        const brushSize = document.getElementById('brushSize');
        if (brushSize) {
            brushSize.addEventListener('input', (e) => {
                this.currentLineWidth = parseInt(e.target.value);
                this.updateBrushSizeIndicator();
            });
        }

        // Clear canvas
        const clearBtn = document.getElementById('clearCanvas');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the canvas?')) {
                    this.clearCanvas();
                }
            });
        }

        // Undo
        const undoBtn = document.getElementById('undoCanvas');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
    }

    bindSocketEvents() {
        if (this.app.socketHandler) {
            // Register canvas event handlers with the socket handler
            this.app.socketHandler.addEventListener('canvas-draw', (data) => {
                this.handleRemoteDraw(data);
            });

            this.app.socketHandler.addEventListener('canvas-clear', (data) => {
                this.handleRemoteClear(data);
            });

            this.app.socketHandler.addEventListener('canvas-undo', (data) => {
                this.handleRemoteUndo(data);
            });

            this.app.socketHandler.addEventListener('canvas-cursor', (data) => {
                this.updateRemoteCursor(data);
            });

            this.app.socketHandler.addEventListener('canvas-shape', (data) => {
                this.handleRemoteShape(data);
            });

            this.app.socketHandler.addEventListener('canvas-text', (data) => {
                this.handleRemoteText(data);
            });
        }
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.updateCursor();
        
        if (tool === 'text') {
            this.isTextMode = true;
        } else {
            this.isTextMode = false;
        }
    }

    setActiveTool(activeBtn) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    updateCursor() {
        switch (this.currentTool) {
            case 'pen':
                this.canvas.className = 'shared-canvas';
                break;
            case 'eraser':
                this.canvas.className = 'shared-canvas eraser';
                break;
            case 'text':
                this.canvas.className = 'shared-canvas text';
                break;
            default:
                this.canvas.className = 'shared-canvas';
        }
    }

    updateBrushSizeIndicator() {
        // Update cursor size preview
        const cursor = document.querySelector('.canvas-cursor');
        if (cursor) {
            cursor.style.width = this.currentLineWidth * 2 + 'px';
            cursor.style.height = this.currentLineWidth * 2 + 'px';
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
            y: (e.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1)
        };
    }

    startDrawing(e) {
        if (!this.isActive) return;

        this.isDrawing = true;
        const pos = this.getMousePos(e);
        
        if (this.isShapeTool()) {
            this.startShape(pos.x, pos.y);
        } else {
            this.lastX = pos.x;
            this.lastY = pos.y;
        }
    }

    draw(e) {
        if (!this.isActive || !this.isDrawing) return;

        const pos = this.getMousePos(e);
        
        if (this.isShapeTool()) {
            this.drawShapePreview(pos.x, pos.y);
        } else {
            this.drawLine(this.lastX, this.lastY, pos.x, pos.y);
            
            // Send drawing data to other participants
            this.sendDrawingData({
                x: pos.x,
                y: pos.y,
                prevX: this.lastX,
                prevY: this.lastY,
                color: this.currentColor,
                lineWidth: this.currentLineWidth,
                tool: this.currentTool
            });
            
            this.lastX = pos.x;
            this.lastY = pos.y;
        }
    }

    stopDrawing() {
        if (!this.isActive || !this.isDrawing) return;

        if (this.isShapeTool() && this.shapePreview) {
            this.finalizeShape();
        }

        this.isDrawing = false;
        this.saveState();
    }

    drawLine(x1, y1, x2, y2, options = {}) {
        const color = options.color || this.currentColor;
        const lineWidth = options.lineWidth || this.currentLineWidth;
        const tool = options.tool || this.currentTool;

        this.ctx.save();
        
        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = lineWidth * 2; // Make eraser bigger
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeStyle = color;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    isShapeTool() {
        return ['line', 'rectangle', 'circle'].includes(this.currentTool);
    }

    startShape(x, y) {
        this.isDrawingShape = true;
        this.shapeStartX = x;
        this.shapeStartY = y;
        this.createShapePreview();
    }

    createShapePreview() {
        if (this.shapePreview) {
            this.shapePreview.remove();
        }

        this.shapePreview = document.createElement('canvas');
        this.shapePreview.className = 'shape-preview';
        this.shapePreview.width = this.canvas.width;
        this.shapePreview.height = this.canvas.height;
        this.shapePreview.style.width = this.canvas.style.width;
        this.shapePreview.style.height = this.canvas.style.height;
        
        const container = this.canvas.parentElement;
        container.appendChild(this.shapePreview);
    }

    drawShapePreview(x, y) {
        if (!this.shapePreview) return;

        const ctx = this.shapePreview.getContext('2d');
        ctx.clearRect(0, 0, this.shapePreview.width, this.shapePreview.height);
        
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = this.currentLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);

        switch (this.currentTool) {
            case 'line':
                ctx.beginPath();
                ctx.moveTo(this.shapeStartX, this.shapeStartY);
                ctx.lineTo(x, y);
                ctx.stroke();
                break;
            case 'rectangle':
                const width = x - this.shapeStartX;
                const height = y - this.shapeStartY;
                ctx.strokeRect(this.shapeStartX, this.shapeStartY, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(x - this.shapeStartX, 2) + Math.pow(y - this.shapeStartY, 2)
                );
                ctx.beginPath();
                ctx.arc(this.shapeStartX, this.shapeStartY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
        }
    }

    finalizeShape() {
        if (!this.shapePreview) return;

        // Draw shape on main canvas
        const previewCtx = this.shapePreview.getContext('2d');
        const imageData = previewCtx.getImageData(0, 0, this.shapePreview.width, this.shapePreview.height);
        this.ctx.putImageData(imageData, 0, 0);

        // Send shape data to other participants
        this.sendShapeData({
            type: this.currentTool,
            startX: this.shapeStartX,
            startY: this.shapeStartY,
            endX: this.lastX,
            endY: this.lastY,
            color: this.currentColor,
            lineWidth: this.currentLineWidth
        });

        // Clean up
        this.shapePreview.remove();
        this.shapePreview = null;
        this.isDrawingShape = false;
    }

    handleTextClick(e) {
        const pos = this.getMousePos(e);
        this.showTextModal(pos.x, pos.y);
    }

    createTextModal() {
        this.textModal = document.createElement('div');
        this.textModal.className = 'text-input-modal';
        this.textModal.innerHTML = `
            <div class="text-input-content">
                <div class="text-input-header">
                    <h3>Add Text</h3>
                </div>
                <div class="text-input-form">
                    <input type="text" id="textInput" placeholder="Enter text..." maxlength="100">
                    <div class="text-size-slider">
                        <label>Size:</label>
                        <input type="range" id="textSize" min="12" max="72" value="24">
                        <span id="textSizeValue">24px</span>
                    </div>
                    <div class="text-input-actions">
                        <button class="cancel-btn">Cancel</button>
                        <button class="add-btn">Add Text</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.textModal);
        
        // Bind text modal events
        this.textModal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.hideTextModal();
        });
        
        this.textModal.querySelector('.add-btn').addEventListener('click', () => {
            this.addText();
        });
        
        this.textModal.querySelector('#textInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addText();
            }
        });
        
        const sizeSlider = this.textModal.querySelector('#textSize');
        const sizeValue = this.textModal.querySelector('#textSizeValue');
        sizeSlider.addEventListener('input', (e) => {
            sizeValue.textContent = e.target.value + 'px';
        });
        
        // Click outside to close
        this.textModal.addEventListener('click', (e) => {
            if (e.target === this.textModal) {
                this.hideTextModal();
            }
        });
    }

    showTextModal(x, y) {
        this.textX = x;
        this.textY = y;
        this.textModal.classList.add('active');
        this.textModal.querySelector('#textInput').focus();
    }

    hideTextModal() {
        this.textModal.classList.remove('active');
        this.textModal.querySelector('#textInput').value = '';
    }

    addText() {
        const textInput = this.textModal.querySelector('#textInput');
        const sizeSlider = this.textModal.querySelector('#textSize');
        const text = textInput.value.trim();
        const fontSize = parseInt(sizeSlider.value);
        
        if (text) {
            this.drawText(this.textX, this.textY, text, fontSize, this.currentColor);
            
            // Send text data to other participants
            this.sendTextData({
                x: this.textX,
                y: this.textY,
                text: text,
                fontSize: fontSize,
                color: this.currentColor
            });
            
            this.saveState();
        }
        
        this.hideTextModal();
    }

    drawText(x, y, text, fontSize, color) {
        this.ctx.save();
        this.ctx.font = `${fontSize}px Arial, sans-serif`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
        this.sendClearCanvas();
    }

    saveState() {
        // Guard against zero-sized canvas throwing IndexSizeError
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('CanvasManager: saveState skipped (canvas size is 0)');
            return;
        }

        this.historyStep++;

        if (this.historyStep < this.drawingHistory.length) {
            this.drawingHistory.length = this.historyStep;
        }

        this.drawingHistory.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));

        if (this.drawingHistory.length > this.maxHistory) {
            this.drawingHistory.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            const imageData = this.drawingHistory[this.historyStep];
            this.ctx.putImageData(imageData, 0, 0);
            this.sendUndo();
        }
    }

    // Remote event handlers
    handleRemoteDraw(data) {
        this.drawLine(data.prevX, data.prevY, data.x, data.y, {
            color: data.color,
            lineWidth: data.lineWidth,
            tool: data.tool
        });
    }

    handleRemoteClear(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.app.showNotification(`Canvas cleared by ${data.participantName || 'someone'}`, 'info');
    }

    handleRemoteUndo(data) {
        // For simplicity, we'll just show a notification
        // Full implementation would require synced history
        this.app.showNotification(`Undo performed by ${data.participantName || 'someone'}`, 'info');
    }

    updateRemoteCursor(data) {
        let cursor = this.remoteCursors.get(data.participantId);
        
        if (!cursor) {
            cursor = this.createRemoteCursor(data.participantId, data.participantName);
            this.remoteCursors.set(data.participantId, cursor);
        }
        
        cursor.style.left = data.x + 'px';
        cursor.style.top = data.y + 'px';
        cursor.style.display = 'block';
        
        // Hide cursor after inactivity
        clearTimeout(cursor.hideTimeout);
        cursor.hideTimeout = setTimeout(() => {
            cursor.style.display = 'none';
        }, 3000);
    }

    createRemoteCursor(participantId, participantName) {
        const cursor = document.createElement('div');
        cursor.className = 'drawing-participant';
        cursor.setAttribute('data-name', participantName);
        cursor.style.backgroundColor = this.generateParticipantColor(participantId);
        cursor.style.position = 'absolute';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '1000';
        cursor.style.display = 'none';
        
        document.body.appendChild(cursor);
        return cursor;
    }

    generateParticipantColor(participantId) {
        // Generate consistent color based on participant ID
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
        let hash = 0;
        for (let i = 0; i < participantId.length; i++) {
            hash = participantId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // Socket communication methods
    sendDrawingData(data) {
        if (this.app.socketHandler) {
            this.app.socketHandler.emit('canvas-draw', data);
        }
    }

    sendShapeData(data) {
        if (this.app.socketHandler) {
            this.app.socketHandler.emit('canvas-shape', data);
        }
    }

    sendTextData(data) {
        if (this.app.socketHandler) {
            this.app.socketHandler.emit('canvas-text', data);
        }
    }

    sendClearCanvas() {
        if (this.app.socketHandler) {
            this.app.socketHandler.emit('canvas-clear');
        }
    }

    sendUndo() {
        if (this.app.socketHandler) {
            this.app.socketHandler.emit('canvas-undo');
        }
    }

    sendCursorPosition(e) {
        if (this.app.socketHandler) {
            const pos = this.getMousePos(e);
            this.app.socketHandler.emit('canvas-cursor', {
                x: pos.x,
                y: pos.y
            });
        }
    }

    // Public methods
    activate() {
        this.isActive = true;
        // Attempt full initialization if it was deferred earlier
        if (!this.isReady) {
            this.setupCanvas();
        } else {
            this.resizeCanvas(); // Ensure correct size
        }
        console.log('Canvas activated');
    }

    deactivate() {
        this.isActive = false;
        this.isDrawing = false;
        
        // Hide shape preview if active
        if (this.shapePreview) {
            this.shapePreview.remove();
            this.shapePreview = null;
        }
        
        console.log('Canvas deactivated');
    }

    handleResize() {
        if (this.isActive) {
            // Save current canvas content
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Resize canvas
            this.resizeCanvas();
            
            // Restore content (might need scaling)
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    exportCanvas() {
        return this.canvas.toDataURL('image/png');
    }

    importCanvas(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.saveState();
        };
        img.src = dataURL;
    }

    cleanup() {
        // Clean up remote cursors
        this.remoteCursors.forEach(cursor => {
            if (cursor.parentNode) {
                cursor.parentNode.removeChild(cursor);
            }
        });
        this.remoteCursors.clear();
        
        // Clean up text modal
        if (this.textModal && this.textModal.parentNode) {
            this.textModal.parentNode.removeChild(this.textModal);
        }
        
        console.log('Canvas manager cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
```

## client/js/main.js

```javascript
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
            // Update existing tile
            const video = existingTile.querySelector('video');
            if (video && stream) {
                video.srcObject = stream;
            }
            return existingTile;
        }

        // Create new video tile
        const videoTile = document.createElement('div');
        videoTile.className = 'video-tile';
        videoTile.id = `video-${participantId}`;
        videoTile.dataset.participantId = participantId;

        const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
        
        if (hasVideo) {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = isLocal; // Mute local video to prevent feedback
            video.playsInline = true;
            videoTile.appendChild(video);
        } else {
            // Show avatar when no video
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = name.charAt(0).toUpperCase();
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
        
        const hasAudio = stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled;
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
        return videoTile;
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
```

## client/js/mediasoup-client.js

```javascript
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
                    width: { max: 1920 },
                    height: { max: 1080 },
                    frameRate: { max: 30 }
                },
                audio: true
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
```

## client/js/mobile-fixes.js

```javascript
// Mobile-specific fixes and optimizations
class MobileFixes {
    constructor() {
        this.init();
    }

    init() {
        // Detect if we're on mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTouch = 'ontouchstart' in window;

        if (this.isMobile || this.isTouch) {
            this.applyMobileFixes();
        }
    }

    applyMobileFixes() {
        console.log('Applying mobile fixes...');

        // Fix viewport height issues
        this.fixViewportHeight();

        // Prevent zoom on input focus
        this.preventInputZoom();

        // Fix iOS Safari viewport issues
        this.fixIOSViewport();

        // Add touch event handlers
        this.addTouchEventHandlers();

        // Prevent scroll bounce
        this.preventScrollBounce();

        // Fix white screen issues
        this.fixWhiteScreen();
    }

    fixViewportHeight() {
        // Fix for mobile browsers where 100vh doesn't account for address bar
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    preventInputZoom() {
        // Add CSS to prevent zoom on input focus
        const style = document.createElement('style');
        style.textContent = `
            @media screen and (max-width: 768px) {
                input, select, textarea {
                    font-size: 16px !important;
                    transform: scale(1) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    fixIOSViewport() {
        // Fix iOS Safari 100vh issues
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const fixHeight = () => {
                document.body.style.height = `${window.innerHeight}px`;
            };
            
            fixHeight();
            window.addEventListener('resize', fixHeight);
            window.addEventListener('orientationchange', () => {
                setTimeout(fixHeight, 500);
            });
        }
    }

    addTouchEventHandlers() {
        // Improve touch responsiveness
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });

        // Add touch feedback to buttons
        const addTouchFeedback = (selector) => {
            document.addEventListener('touchstart', (e) => {
                if (e.target.matches(selector)) {
                    e.target.classList.add('touch-active');
                }
            });

            document.addEventListener('touchend', (e) => {
                if (e.target.matches(selector)) {
                    setTimeout(() => {
                        e.target.classList.remove('touch-active');
                    }, 150);
                }
            });
        };

        addTouchFeedback('.control-btn');
        addTouchFeedback('.btn-header');
        addTouchFeedback('.tool-btn');
    }

    preventScrollBounce() {
        // Prevent iOS Safari bounce scroll
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.scrollable')) {
                return; // Allow scrolling in designated areas
            }
            e.preventDefault();
        }, { passive: false });
    }

    fixWhiteScreen() {
        // Force repaint to fix white screen issues
        const forceRepaint = () => {
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
        };

        // Apply on load and orientation change
        window.addEventListener('load', forceRepaint);
        window.addEventListener('orientationchange', () => {
            setTimeout(forceRepaint, 100);
        });

        // Fix background rendering issues
        const fixBackground = () => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            if (computedStyle.background === 'none' || computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
                body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        };

        setTimeout(fixBackground, 100);
        window.addEventListener('load', fixBackground);
    }

    // Method to fix specific mobile video issues
    fixMobileVideo() {
        // Ensure video elements work properly on mobile
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.muted = true; // Start muted for autoplay to work
        });
    }

    // Method to handle orientation changes
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Wait for orientation to complete
            setTimeout(() => {
                // Trigger resize events
                window.dispatchEvent(new Event('resize'));
                
                // Fix video tiles layout
                const videoGrid = document.getElementById('videoGrid');
                if (videoGrid) {
                    videoGrid.style.display = 'none';
                    videoGrid.offsetHeight; // Force reflow
                    videoGrid.style.display = '';
                }
            }, 300);
        });
    }
}

// Add touch-active styles
const touchStyles = document.createElement('style');
touchStyles.textContent = `
    .touch-active {
        background-color: rgba(255, 255, 255, 0.2) !important;
        transform: scale(0.95) !important;
        transition: all 0.1s ease !important;
    }
    
    /* Use CSS custom properties for viewport height */
    .loading-screen,
    .meeting-room,
    .join-screen {
        height: 100vh;
        height: calc(var(--vh, 1vh) * 100);
    }
`;
document.head.appendChild(touchStyles);

// Initialize mobile fixes when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileFixes = new MobileFixes();
    });
} else {
    window.mobileFixes = new MobileFixes();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileFixes;
}

```

## client/js/socket-handler.js

```javascript
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
            // Initialize socket connection
            console.log('Attempting to connect to socket.io server...');
            
            // Detect if we're on mobile and use appropriate connection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isLocalNetwork = window.location.hostname.includes('192.168');
            
            let socketOptions = {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            };
            
            // For mobile/network access, ensure proper connection
            if (isMobile || isLocalNetwork) {
                socketOptions.upgrade = true;
                socketOptions.rememberUpgrade = true;
            }
            
            this.socket = io(socketOptions);
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
            
            // Initialize WebRTC manager now that socket is connected
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
                // Server initiated disconnect, don't reconnect
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

        // Media events
        this.socket.on('newProducer', (data) => {
            console.log('New producer available:', data);
            this.handleNewProducer(data);
        });

        this.socket.on('participant-video-toggle', (data) => {
            this.handleParticipantMediaToggle(data.participantId, 'video', data.enabled);
        });

        this.socket.on('participant-audio-toggle', (data) => {
            this.handleParticipantMediaToggle(data.participantId, 'audio', data.enabled);
        });

        // Handle request to send current media state to new participant
        this.socket.on('request-media-state', (data) => {
            this.sendCurrentMediaState(data.newParticipantId);
        });

        // Test socket communication
        this.socket.on('test-ping', (data) => {
            console.log('🏓 RECEIVED test ping:', data);
        });

        this.socket.on('test-webrtc-reply', (data) => {
            console.log('🧪 RECEIVED test WebRTC reply:', data);
        });

        // WebRTC signaling events
        this.socket.on('offer', async (data) => {
            console.log('🔵 RECEIVED WebRTC offer from:', data.from, data);
            console.log('📦 Offer details:', { type: data.offer?.type, sdp: data.offer?.sdp ? 'present' : 'missing' });
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleOffer(data.from, data.offer);
            } else {
                console.error('❌ WebRTC manager not available to handle offer');
            }
        });

        this.socket.on('answer', async (data) => {
            console.log('🔵 RECEIVED WebRTC answer from:', data.from, data);
            console.log('📦 Answer details:', { type: data.answer?.type, sdp: data.answer?.sdp ? 'present' : 'missing' });
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleAnswer(data.from, data.answer);
            } else {
                console.error('❌ WebRTC manager not available to handle answer');
            }
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('🔵 RECEIVED ICE candidate from:', data.from, data);
            console.log('🧊 Candidate details:', { type: data.candidate?.type, address: data.candidate?.address });
            if (this.app.webrtcManager) {
                await this.app.webrtcManager.handleIceCandidate(data.from, data.candidate);
            } else {
                console.error('❌ WebRTC manager not available to handle ICE candidate');
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
        
        // Test ping response
        this.socket.on('test-ping', (data) => {
            console.log('🏓 RECEIVED test ping:', data);
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

    // Event handling for external modules
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

            // Wait for room-joined event
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

    handleRoomJoined(data) {
        console.log('\n=== CLIENT: ROOM JOINED ===');
        console.log('Raw data received:', data);
        console.log('My ID:', data.yourId);
        console.log('Existing participants:', data.participants);
        console.log('Participants count:', data.participants?.length || 0);
        
        // Store participant info - fix the property name
        this.app.currentUser.id = data.yourId;
        this.app.participants = data.participants || [];
        
        console.log('App participants set to:', this.app.participants);
        
        // Add video tiles for existing participants
        data.participants.forEach(participant => {
            if (participant.id !== data.yourId) {
                console.log('Adding video tile for existing participant:', participant.name);
                this.app.addVideoTile(participant.id, null, participant.name, false);
            }
        });
        
        // Initialize WebRTC if available
        if (this.app.webrtcManager) {
            console.log('Initializing WebRTC for existing participants...');
            // Connect to existing participants
            data.participants.forEach(participant => {
                if (participant.id !== data.yourId) {
                    console.log('Creating offer for existing participant:', participant.id, participant.name);
                    setTimeout(() => {
                        console.log('🔄 Actually creating offer now for existing participant:', participant.id);
                        this.app.webrtcManager.createOffer(participant.id);
                    }, 3000); // Increased delay to ensure both ends are fully ready
                }
            });
        }
        
        // Update participants list
        this.app.updateParticipantsList(this.app.participants);
        console.log('=== END ROOM JOINED ===\n');
        
        // Initialize MediaSoup connection (fallback)
        if (this.app.mediasoupClient && this.app.mediasoupClient.device) {
            console.log('Attempting MediaSoup connection...');
            this.app.mediasoupClient.connect(this).then(() => {
                // Start producing media
                this.startMediaProduction();
            }).catch(error => {
                console.warn('MediaSoup connection failed, continuing with WebRTC only:', error);
            });
        } else {
            console.log('MediaSoup not available, using WebRTC only');
        }
        
        // Trigger app callback
        if (typeof this.app.onRoomJoined === 'function') {
            this.app.onRoomJoined(data);
        }

        // After fully joined, announce our current media state (video/audio) once.
        if (this.app.webrtcManager && this.socket?.connected) {
            const videoEnabled = this.app.webrtcManager.isVideoEnabled;
            const audioEnabled = this.app.webrtcManager.isAudioEnabled;
            console.log('Announcing initial media state to room:', { videoEnabled, audioEnabled });
            // Emit through existing toggle events so everyone updates state
            this.socket.emit('toggle-video', { enabled: videoEnabled });
            this.socket.emit('toggle-audio', { enabled: audioEnabled });
        }
        
        // Test socket communication by sending a ping to other participants
        setTimeout(() => {
            console.log('🏓 Sending test ping to verify socket communication...');
            this.socket.emit('test-ping', { from: data.yourId, message: 'Testing socket relay' });
            
            // Test WebRTC event specifically  
            console.log('🧪 Testing WebRTC event reception...');
            this.socket.emit('test-webrtc', { to: 'test', message: 'testing webrtc events' });
        }, 1000);
    }

    async startMediaProduction() {
        try {
            // Produce video if enabled
            if (this.app.isVideoEnabled && this.app.mediasoupClient) {
                await this.app.mediasoupClient.produceVideo();
            }
            
            // Produce audio if enabled
            if (this.app.isAudioEnabled && this.app.mediasoupClient) {
                await this.app.mediasoupClient.produceAudio();
            }
        } catch (error) {
            console.error('Failed to start media production:', error);
        }
    }

    handleUserJoined(data) {
        console.log('\n=== CLIENT: USER JOINED ===');
        console.log('New user data:', data);
        
        // Add to participants list
        if (this.app.participants) {
            const beforeCount = this.app.participants.length;
            
            // Check if participant already exists (prevent duplicates)
            const existingParticipant = this.app.participants.find(p => p.id === data.participantId);
            if (!existingParticipant) {
                this.app.participants.push({
                    id: data.participantId,
                    name: data.userName,
                    isTeacher: data.isTeacher,
                    hasVideo: false, // Will be updated when they send media state
                    hasAudio: false  // Will be updated when they send media state
                });
                console.log(`Participants count: ${beforeCount} -> ${this.app.participants.length}`);
                console.log('Updated participants:', this.app.participants.map(p => p.name));
                
                // Update participants list in UI
                this.app.updateParticipantsList(this.app.participants);
                
                // Add placeholder video tile for the new participant (will show avatar initially)
                this.app.addVideoTile(data.participantId, null, data.userName, false);
                
                // Initialize WebRTC connection with new participant
                if (this.app.webrtcManager) {
                    console.log('🔄 Initiating WebRTC connection for new participant:', data.participantId);
                    // We need to create an offer to establish the connection
                    setTimeout(() => {
                        console.log('🔄 Actually creating offer now for new participant:', data.participantId);
                        this.app.webrtcManager.createOffer(data.participantId);
                    }, 2000); // Give some time for both ends to be ready
                }
            } else {
                console.log('Participant already exists, skipping duplicate');
            }
        }
        
        // Trigger app callback
        if (typeof this.app.onUserJoined === 'function') {
            this.app.onUserJoined(data);
        }
        console.log('=== END USER JOINED ===\n');
    }

    handleUserLeft(data) {
        console.log('User left:', data);
        
        // Remove from participants list
        if (this.app.participants) {
            const beforeCount = this.app.participants.length;
            this.app.participants = this.app.participants.filter(
                p => p.id !== data.participantId
            );
            console.log(`Participants count: ${beforeCount} -> ${this.app.participants.length}`);
            
            this.app.updateParticipantsList(this.app.participants);
        }
        
        // Remove video tile and close WebRTC connection
        this.app.removeVideoTile(data.participantId);
        
        if (this.app.webrtcManager) {
            this.app.webrtcManager.closePeerConnection(data.participantId);
        }
        
        // Trigger app callback
        if (typeof this.app.onUserLeft === 'function') {
            this.app.onUserLeft(data);
        }
    }

    // Media handling
    handleNewProducer(data) {
        console.log('New producer detected:', data);
        
        if (this.app.mediasoupClient) {
            this.app.mediasoupClient.handleNewProducer(
                data.producerId,
                data.participantId,
                data.kind
            );
        }
    }

    handleParticipantMediaToggle(participantId, type, enabled) {
        console.log(`Media toggle: ${participantId} ${type} ${enabled ? 'enabled' : 'disabled'}`);
        
        // Update participants list
        if (this.app.participants) {
            const participant = this.app.participants.find(p => p.id === participantId);
            if (participant) {
                if (type === 'video') {
                    participant.hasVideo = enabled;
                } else if (type === 'audio') {
                    participant.hasAudio = enabled;
                }
                
                // Update the video tile to reflect current state
                this.app.updateVideoTileMediaState(
                    participantId, 
                    participant.hasVideo, 
                    participant.hasAudio
                );
                
                this.app.updateParticipantsList(this.app.participants);
            }
        }
        
        // Trigger app callback
        if (typeof this.app.onParticipantToggle === 'function') {
            this.app.onParticipantToggle(participantId, type, enabled);
        }
    }

    sendCurrentMediaState(targetParticipantId) {
        if (!this.socket || !this.socket.connected) return;
        const videoEnabled = this.app.webrtcManager?.isVideoEnabled ?? false;
        const audioEnabled = this.app.webrtcManager?.isAudioEnabled ?? false;
        console.log('Sending current media state to new participant:', targetParticipantId, { videoEnabled, audioEnabled });
        this.socket.emit('participant-media-state', {
            to: targetParticipantId,
            videoEnabled,
            audioEnabled
        });
    }

    // UI event handlers
    handleParticipantPinned(data) {
        // Handle participant pinning from remote
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
        // Forward to registered event handlers
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in canvas event handler for ${eventType}:`, error);
            }
        });
    }

    // MediaSoup transport methods
    connectTransport(transportId, dtlsParameters) {
        return new Promise((resolve, reject) => {
            this.socket.emit('connectWebRtcTransport', {
                transportId,
                dtlsParameters
            }, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    produce(kind, rtpParameters, appData) {
        return new Promise((resolve, reject) => {
            this.socket.emit('produce', {
                kind,
                rtpParameters,
                appData
            }, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    resumeConsumer(consumerId) {
        return new Promise((resolve, reject) => {
            this.socket.emit('resumeConsumer', {
                consumerId
            }, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    sendCurrentMediaState(targetParticipantId) {
        // Send current video and audio state to the specified participant
        if (this.app.webrtcManager) {
            console.log(`Sending current media state to ${targetParticipantId}:`, {
                video: this.app.webrtcManager.isVideoEnabled,
                audio: this.app.webrtcManager.isAudioEnabled
            });
            
            this.socket.emit('participant-media-state', {
                to: targetParticipantId,
                videoEnabled: this.app.webrtcManager.isVideoEnabled,
                audioEnabled: this.app.webrtcManager.isAudioEnabled
            });
        }
    }

    handleParticipantVideoToggle(data) {
        console.log('📹 Handling video toggle for participant:', data.participantId, 'enabled:', data.enabled);
        
        // Update participant state
        if (this.app.participants) {
            const participant = this.app.participants.find(p => p.id === data.participantId);
            if (participant) {
                participant.hasVideo = data.enabled;
                console.log(`Updated participant ${participant.name} video state:`, data.enabled);
                
                // Update the UI video tile media state
                if (this.app.updateVideoTileMediaState) {
                    this.app.updateVideoTileMediaState(data.participantId, { hasVideo: data.enabled });
                }
            }
        }
    }

    handleParticipantAudioToggle(data) {
        console.log('🎤 Handling audio toggle for participant:', data.participantId, 'enabled:', data.enabled);
        
        // Update participant state
        if (this.app.participants) {
            const participant = this.app.participants.find(p => p.id === data.participantId);
            if (participant) {
                participant.hasAudio = data.enabled;
                console.log(`Updated participant ${participant.name} audio state:`, data.enabled);
                
                // Update the UI video tile media state
                if (this.app.updateVideoTileMediaState) {
                    this.app.updateVideoTileMediaState(data.participantId, { hasAudio: data.enabled });
                }
            }
        }
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

    // Canvas emit methods
    emit(eventType, data) {
        if (this.isConnected) {
            this.socket.emit(eventType, data);
        } else {
            console.warn('Cannot emit event - not connected to server');
        }
    }

    // Event handler registration
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    off(eventType, handler) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Utility methods
    isConnectedToRoom() {
        return this.isConnected && this.app.isJoined;
    }

    getCurrentLatency() {
        if (!this.isConnected) return -1;
        
        return new Promise((resolve) => {
            const start = Date.now();
            this.socket.emit('ping', start, () => {
                resolve(Date.now() - start);
            });
        });
    }

    getConnectionQuality() {
        if (!this.isConnected) return 'disconnected';
        
        return this.getCurrentLatency().then(latency => {
            if (latency < 100) return 'excellent';
            if (latency < 200) return 'good';
            if (latency < 400) return 'fair';
            return 'poor';
        });
    }

    // Recording methods
    startRecording() {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can start recording', 'error');
            return;
        }
        
        this.socket.emit('start-recording');
        this.app.showNotification('Recording started', 'success');
    }

    stopRecording() {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can stop recording', 'error');
            return;
        }
        
        this.socket.emit('stop-recording');
        this.app.showNotification('Recording stopped', 'info');
    }

    // Breakout room methods
    createBreakoutRoom(participantIds) {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can create breakout rooms', 'error');
            return;
        }
        
        this.socket.emit('create-breakout-room', { participantIds });
    }

    joinBreakoutRoom(breakoutRoomId) {
        this.socket.emit('join-breakout-room', { breakoutRoomId });
    }

    leaveBreakoutRoom() {
        this.socket.emit('leave-breakout-room');
    }

    // Admin methods (teacher only)
    muteParticipant(participantId) {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can mute participants', 'error');
            return;
        }
        
        this.socket.emit('mute-participant', { participantId });
    }

    kickParticipant(participantId) {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can remove participants', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to remove this participant?')) {
            this.socket.emit('kick-participant', { participantId });
        }
    }

    updateRoomSettings(settings) {
        if (!this.app.isTeacher) {
            this.app.showNotification('Only teachers can update room settings', 'error');
            return;
        }
        
        this.socket.emit('update-room-settings', settings);
    }

    // Cleanup
    disconnect() {
        console.log('Disconnecting from server...');
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        // Clear event handlers
        this.eventHandlers.clear();
        
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        console.log('Socket handler disconnected');
    }

    // Error recovery
    handleError(error, context = '') {
        console.error(`Socket error ${context}:`, error);
        
        // Show user-friendly error message
        let message = 'An error occurred';
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        this.app.showNotification(message, 'error');
        
        // Attempt recovery based on error type
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
            this.handleReconnection();
        }
    }

    // Debug methods
    getDebugInfo() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id,
            reconnectAttempts: this.reconnectAttempts,
            eventHandlers: Array.from(this.eventHandlers.keys()),
            transportState: this.socket?.connected,
            roomId: this.app.roomId,
            participantId: this.app.currentUser?.id
        };
    }

    enableDebugMode() {
        this.socket?.on('*', (eventName, data) => {
            console.log(`[SOCKET DEBUG] ${eventName}:`, data);
        });
        
        // Log outgoing events
        const originalEmit = this.socket?.emit?.bind(this.socket);
        if (originalEmit) {
            this.socket.emit = (eventName, ...args) => {
                console.log(`[SOCKET DEBUG OUT] ${eventName}:`, args);
                return originalEmit(eventName, ...args);
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocketHandler;
}
```

## client/js/ui-controls.js

```javascript
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
        // Add layout switcher to header
        const layoutSwitcher = document.createElement('div');
        layoutSwitcher.className = 'layout-switcher';
        layoutSwitcher.innerHTML = `
            <button class="btn-header layout-btn active" data-layout="auto" title="Auto Layout">
                <i class="fas fa-th"></i>
            </button>
            <button class="btn-header layout-btn" data-layout="grid" title="Grid Layout">
                <i class="fas fa-th-large"></i>
            </button>
            <button class="btn-header layout-btn" data-layout="spotlight" title="Spotlight Layout">
                <i class="fas fa-user"></i>
            </button>
        `;
        
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(layoutSwitcher, headerRight.firstChild);
        }
        
        // Bind layout events
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchLayout(btn.dataset.layout);
                this.setActiveLayoutButton(btn);
            });
        });
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
        if (recordBtn && this.app.isTeacher) {
            recordBtn.disabled = false;
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
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
        
        if (videoCount <= 1) {
            videoGrid.style.gridTemplateColumns = '1fr';
        } else if (videoCount <= 4) {
            videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (videoCount <= 9) {
            videoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            videoGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }

    applyGridLayout() {
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    }

    applySpotlightLayout() {
        const videoGrid = document.getElementById('videoGrid');
        
        // Find pinned or first video for spotlight
        const pinnedVideo = videoGrid.querySelector('.video-tile.pinned') || 
                           videoGrid.querySelector('.video-tile');
        
        if (pinnedVideo) {
            videoGrid.style.gridTemplateColumns = '1fr';
            
            // Move spotlight video to front
            videoGrid.insertBefore(pinnedVideo, videoGrid.firstChild);
            
            // Hide other videos or show as thumbnails
            Array.from(videoGrid.children).forEach((tile, index) => {
                if (index === 0) {
                    tile.style.display = 'block';
                    tile.style.gridRow = '1 / -1';
                } else {
                    tile.style.display = 'none'; // Or implement thumbnail view
                }
            });
        }
    }

    setActiveLayoutButton(activeBtn) {
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
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

    // Recording Management
    toggleRecording() {
        if (!this.app.isTeacher) return;
        
        const recordBtn = document.getElementById('recordSession');
        const isRecording = recordBtn.classList.contains('active');
        
        if (isRecording) {
            this.app.socketHandler.stopRecording();
            recordBtn.classList.remove('active');
        } else {
            this.app.socketHandler.startRecording();
            recordBtn.classList.add('active');
        }
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
            '3': { action: () => this.switchLayout('spotlight'), description: 'Spotlight Layout' }
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
            'h': '#raiseHand'
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
```

## client/js/webrtc-manager.js

```javascript
// Simple WebRTC Manager for Peer-to-Peer Communication
class WebRTCManager {
    constructor(app) {
        this.app = app;
        this.localStream = null;
        this.peerConnections = new Map();
        this.socketHandler = null;
        
        // ICE servers configuration
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];
        
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
    }

    init(socketHandler) {
        this.socketHandler = socketHandler;
        this.bindSocketEvents();
        console.log('WebRTC Manager initialized');
    }

    bindSocketEvents() {
        // Socket events are now handled by SocketHandler
        // This method is kept for potential future use
        console.log('WebRTC socket events will be handled by SocketHandler');
    }

    async initializeLocalMedia() {
        try {
            // Don't reinitialize if we already have a stream
            if (this.localStream && this.localStream.active) {
                console.log('Local media already initialized');
                return this.localStream;
            }

            const constraints = {
                video: this.isVideoEnabled ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false,
                audio: this.isAudioEnabled ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false
            };

            console.log('Requesting user media with constraints:', constraints);
            
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (mediaError) {
                console.warn('Failed to get media with both audio/video, trying alternatives...', mediaError);
                
                // Try video only if both failed
                if (constraints.video && constraints.audio) {
                    try {
                        console.log('Trying video only...');
                        this.localStream = await navigator.mediaDevices.getUserMedia({
                            video: constraints.video,
                            audio: false
                        });
                        this.isAudioEnabled = false;
                        this.app.showNotification('Camera access granted, but microphone unavailable (may be in use by another tab)', 'warning');
                    } catch (videoError) {
                        // Try audio only if video failed
                        try {
                            console.log('Trying audio only...');
                            this.localStream = await navigator.mediaDevices.getUserMedia({
                                video: false,
                                audio: constraints.audio
                            });
                            this.isVideoEnabled = false;
                            this.app.showNotification('Microphone access granted, but camera unavailable (may be in use by another tab)', 'warning');
                        } catch (audioError) {
                            console.error('No media access available');
                            this.isVideoEnabled = false;
                            this.isAudioEnabled = false;
                            this.app.showNotification('Camera and microphone unavailable (may be in use by another tab). You can still join the meeting and see other participants.', 'info');
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
            
            // Update internal state based on actual tracks
            this.isVideoEnabled = this.localStream.getVideoTracks().length > 0;
            this.isAudioEnabled = this.localStream.getAudioTracks().length > 0;
            
            // Notify server about initial media state
            // DON'T emit here because at this point the user may not have joined a room yet.
            // Socket handler will emit initial state after 'room-joined' to avoid losing events.
            
            // Add local video tile using main app method
            if (this.app.addVideoTile && this.app.currentUser) {
                this.app.addVideoTile('local', this.localStream, this.app.currentUser.name, true);
            }

            console.log('Local media initialized with WebRTC Manager');
            return this.localStream;
        } catch (error) {
            console.error('Failed to get local media:', error);
            this.app.showNotification('Unable to access camera/microphone. You can still join and see other participants.', 'warning');
            this.isVideoEnabled = false;
            this.isAudioEnabled = false;
            
            // Still notify server about disabled state
            if (this.socketHandler && this.socketHandler.socket) {
                this.socketHandler.socket.emit('toggle-video', { enabled: false });
                this.socketHandler.socket.emit('toggle-audio', { enabled: false });
            }
            
            // Add local tile without stream (avatar only)
            if (this.app.addVideoTile && this.app.currentUser) {
                this.app.addVideoTile('local', null, this.app.currentUser.name, true);
            }
            
            return null;
        }
    }

    async createPeerConnection(participantId) {
        const peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers
        });

        // Ensure we have local stream before adding tracks
        if (!this.localStream) {
            console.warn('Local stream not available, initializing...');
            await this.initializeLocalMedia();
        }

        // Add local stream tracks if available
        if (this.localStream && this.localStream.active) {
            this.localStream.getTracks().forEach(track => {
                console.log(`Adding local ${track.kind} track to peer connection for ${participantId}`);
                peerConnection.addTrack(track, this.localStream);
            });
        } else {
            console.warn('No local stream available for peer connection - participant will only receive, not send media');
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('Received remote track from:', participantId, event.track.kind);
            const remoteStream = event.streams[0];
            if (remoteStream) {
                this.addRemoteVideo(participantId, remoteStream);
            }
        };

        // Handle ICE candidates
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

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${participantId}:`, peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                console.log(`✅ Successfully connected to ${participantId}`);
            } else if (peerConnection.connectionState === 'failed') {
                this.handleConnectionFailure(participantId);
            }
        };

        // Handle ICE connection state
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${participantId}:`, peerConnection.iceConnectionState);
        };

        this.peerConnections.set(participantId, peerConnection);
        return peerConnection;
    }

    async createOffer(participantId) {
        try {
            console.log(`🔄 Creating WebRTC offer for participant: ${participantId}`);
            const peerConnection = await this.createPeerConnection(participantId);
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
        } catch (error) {
            console.error('❌ Failed to create offer for', participantId, ':', error);
        }
    }

    async handleOffer(participantId, offer) {
        try {
            console.log(`📥 Received offer from ${participantId}:`, offer.type);
            const peerConnection = await this.createPeerConnection(participantId);
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
        
        // Get participant info
        const participantInfo = this.app.participants?.find(p => p.id === participantId);
        const participantName = participantInfo?.name || 'Unknown';
        
        // Use the main app's addVideoTile method to maintain consistency
        if (this.app.addVideoTile) {
            this.app.addVideoTile(participantId, stream, participantName, false);
        } else {
            console.error('Main app addVideoTile method not available');
        }
    }

    removeRemoteVideo(participantId) {
        // Don't call app.removeVideoTile to avoid circular calls
        console.log('WebRTC: Removing remote video for:', participantId);
        // Just handle the WebRTC side - let the socket handler manage UI
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
                    // Disable and stop the track to release camera
                    videoTrack.enabled = false;
                    videoTrack.stop();
                    this.isVideoEnabled = false;
                    console.log('Video disabled and camera released');
                    this.app.showNotification('Camera turned off and released', 'info');
                } else {
                    // Try to get a new video track
                    try {
                        const newVideoStream = await navigator.mediaDevices.getUserMedia({ 
                            video: {
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                                frameRate: { ideal: 30 }
                            }
                        });
                        
                        // Replace the video track in existing connections
                        const newVideoTrack = newVideoStream.getVideoTracks()[0];
                        
                        // Update all peer connections with new track
                        this.peerConnections.forEach(async (pc) => {
                            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                            if (sender) {
                                await sender.replaceTrack(newVideoTrack);
                            } else {
                                pc.addTrack(newVideoTrack, this.localStream);
                            }
                        });
                        
                        // Update local stream with new video track
                        if (this.localStream.getVideoTracks().length > 0) {
                            this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
                        }
                        this.localStream.addTrack(newVideoTrack);
                        // Update local video element/tile if app has method
                        if (this.app.updateLocalVideoTrack) {
                            this.app.updateLocalVideoTrack(this.localStream);
                        } else if (this.app.replaceVideoTileStream) {
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
                
                // Notify server (if joined)
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
                    // Disable and stop the track to release microphone
                    audioTrack.enabled = false;
                    audioTrack.stop();
                    this.isAudioEnabled = false;
                    console.log('Audio disabled and microphone released');
                    this.app.showNotification('Microphone turned off and released', 'info');
                } else {
                    // Try to get a new audio track
                    try {
                        const newAudioStream = await navigator.mediaDevices.getUserMedia({ 
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true
                            }
                        });
                        
                        // Replace the audio track in existing connections
                        const newAudioTrack = newAudioStream.getAudioTracks()[0];
                        
                        // Update all peer connections with new track
                        this.peerConnections.forEach(async (pc) => {
                            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                            if (sender) {
                                await sender.replaceTrack(newAudioTrack);
                            } else {
                                pc.addTrack(newAudioTrack, this.localStream);
                            }
                        });
                        
                        // Update local stream with new audio track
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
        
        // Try to reconnect
        setTimeout(() => {
            this.createOffer(participantId);
        }, 3000);
    }

    cleanup() {
        // Close all peer connections
        this.peerConnections.forEach((pc, participantId) => {
            this.closePeerConnection(participantId);
        });

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        console.log('WebRTC Manager cleaned up');
    }
}

```

# Backend Code

## server/server.js

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const mediasoup = require('mediasoup');
const { v4: uuidv4 } = require('uuid');

// Import configurations and controllers
const mediasoupConfig = require('./config/mediasoup');
const roomController = require('./controllers/roomController');
const canvasController = require('./controllers/canvasController');
const mediaController = require('./controllers/mediaController');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Global variables
let workers = [];
let nextMediasoupWorkerIdx = 0;
const rooms = new Map();

// Middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.socket.io", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "https://pro.fontawesome.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "https://pro.fontawesome.com", "data:"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'", "ws://localhost:3000", "http://localhost:3000", "ws://192.168.29.62:3000", "http://192.168.29.62:3000"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Initialize MediaSoup workers
async function initializeWorkers() {
  const { numWorkers } = mediasoupConfig;
  
  logger.info(`Starting ${numWorkers} MediaSoup workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: mediasoupConfig.worker.logLevel,
      logTags: mediasoupConfig.worker.logTags,
      rtcMinPort: mediasoupConfig.worker.rtcMinPort,
      rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
    });

    worker.on('died', () => {
      logger.error('MediaSoup worker died, exiting process');
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }
  
  logger.info(`${workers.length} MediaSoup workers initialized successfully`);
}

// Get next worker using round-robin
function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];
  if (++nextMediasoupWorkerIdx === workers.length)
    nextMediasoupWorkerIdx = 0;
  return worker;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userName, isTeacher } = data;
      
      // Create or get room
      let room = rooms.get(roomId);
      if (!room) {
        const worker = getMediasoupWorker();
        room = await roomController.createRoom(roomId, worker);
        rooms.set(roomId, room);
        logger.info(`Created new room: ${roomId}`);
      }
      
      // Join room
      const participant = await roomController.joinRoom(socket, room, userName, isTeacher);
      
      socket.join(roomId);
      socket.roomId = roomId;
      socket.participantId = participant.id;
      
      // Notify others about new participant
      socket.to(roomId).emit('user-joined', {
        participantId: participant.id,
        userName: participant.name,
        isTeacher: participant.isTeacher
      });
      
      // Get existing participants (excluding the one who just joined)
      const existingParticipants = Array.from(room.participants.values())
        .filter(p => p.id !== participant.id)
        .map(p => ({
          id: p.id,
          name: p.name,
          isTeacher: p.isTeacher,
          hasVideo: p.hasVideo || false,
          hasAudio: p.hasAudio || false
        }));

      console.log(`\n=== SERVER: ROOM JOINED ===`);
      console.log(`Participant ID: ${participant.id}`);
      console.log(`Room ID: ${roomId}`);
      console.log(`Existing participants: ${existingParticipants.length}`);
      console.log(`All participants in room: ${room.participants.size}`);
      
      // Send room info to new participant
      socket.emit('room-joined', {
        yourId: participant.id,
        roomId: roomId,
        participants: existingParticipants
      });
      console.log(`=== END SERVER ROOM JOINED ===\n`);
      
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // MediaSoup signaling
  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      const room = rooms.get(socket.roomId);
      if (room) {
        callback(room.router.rtpCapabilities);
      }
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('createWebRtcTransport', async (data, callback) => {
    try {
      const { direction } = data; // 'send' or 'recv'
      const room = rooms.get(socket.roomId);
      const transport = await mediaController.createWebRtcTransport(room.router, direction);
      
      // Store transport
      const participant = room.participants.get(socket.participantId);
      if (direction === 'send') {
        participant.sendTransport = transport;
      } else {
        participant.recvTransport = transport;
      }
      
      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('connectWebRtcTransport', async (data, callback) => {
    try {
      const { transportId, dtlsParameters } = data;
      const room = rooms.get(socket.roomId);
      const participant = room.participants.get(socket.participantId);
      
      let transport;
      if (participant.sendTransport && participant.sendTransport.id === transportId) {
        transport = participant.sendTransport;
      } else if (participant.recvTransport && participant.recvTransport.id === transportId) {
        transport = participant.recvTransport;
      }
      
      if (transport) {
        await transport.connect({ dtlsParameters });
        callback({ success: true });
      }
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('produce', async (data, callback) => {
    try {
      const { kind, rtpParameters, appData } = data;
      const room = rooms.get(socket.roomId);
      const participant = room.participants.get(socket.participantId);
      
      const producer = await participant.sendTransport.produce({
        kind,
        rtpParameters,
        appData
      });
      
      participant.producers.set(producer.id, producer);
      
      // Notify other participants about new producer
      socket.to(socket.roomId).emit('newProducer', {
        producerId: producer.id,
        participantId: socket.participantId,
        kind: producer.kind
      });
      
      callback({ id: producer.id });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('consume', async (data, callback) => {
    try {
      const { producerId, rtpCapabilities } = data;
      const room = rooms.get(socket.roomId);
      const participant = room.participants.get(socket.participantId);
      
      const consumer = await mediaController.createConsumer(
        room.router,
        participant.recvTransport,
        producerId,
        rtpCapabilities
      );
      
      participant.consumers.set(consumer.id, consumer);
      
      callback({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('resumeConsumer', async (data, callback) => {
    try {
      const { consumerId } = data;
      const room = rooms.get(socket.roomId);
      const participant = room.participants.get(socket.participantId);
      const consumer = participant.consumers.get(consumerId);
      
      if (consumer) {
        await consumer.resume();
        callback({ success: true });
      }
    } catch (error) {
      callback({ error: error.message });
    }
  });

  // Canvas events
  socket.on('canvas-draw', (data) => {
    canvasController.handleDraw(socket, data);
  });

  socket.on('canvas-clear', () => {
    canvasController.handleClear(socket);
  });

  socket.on('canvas-undo', () => {
    canvasController.handleUndo(socket);
  });

  // UI Control events
  socket.on('toggle-video', (data) => {
    const { enabled } = data;
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      participant.hasVideo = enabled;
      socket.to(socket.roomId).emit('participant-video-toggle', {
        participantId: socket.participantId,
        enabled
      });
    }
  });

  socket.on('toggle-audio', (data) => {
    const { enabled } = data;
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      participant.hasAudio = enabled;
      socket.to(socket.roomId).emit('participant-audio-toggle', {
        participantId: socket.participantId,
        enabled
      });
    }
  });

  socket.on('pin-participant', (data) => {
    socket.to(socket.roomId).emit('participant-pinned', data);
  });

  socket.on('raise-hand', () => {
    socket.to(socket.roomId).emit('hand-raised', {
      participantId: socket.participantId
    });
  });

  socket.on('chat-message', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      const participant = room.participants.get(socket.participantId);
      io.to(socket.roomId).emit('chat-message', {
        participantId: socket.participantId,
        participantName: participant.name,
        message: data.message,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    if (socket.roomId && socket.participantId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        roomController.leaveRoom(socket.participantId, room);
        socket.to(socket.roomId).emit('user-left', {
          participantId: socket.participantId
        });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomId);
          logger.info(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeWorkers();
    
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 EduMeet server running on port ${PORT}`);
      logger.info(`📚 Access the app at:`);
      logger.info(`   Local:    http://localhost:${PORT}`);
      logger.info(`   Network:  http://192.168.29.62:${PORT}`);
      logger.info(`   Mobile:   Use the Network URL on your phone`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## server/package.json

```json
{
  "name": "edumeet-server",
  "version": "1.0.0",
  "description": "Educational video conferencing platform with live canvas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "mediasoup": "^3.12.9",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "webrtc",
    "video-conferencing",
    "education",
    "mediasoup",
    "socket.io"
  ],
  "author": "EduMeet",
  "license": "MIT"
}
```

## server/config/mediasoup.js

```javascript
const os = require('os');

module.exports = {
  // Number of workers (typically number of CPU cores)
  numWorkers: Object.keys(os.cpus()).length,
  
  worker: {
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'debug',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ],
  },
  
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },
  
  webRtcTransport: {
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: null, // replace with public IP in production
      },
    ],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
  },
  
  plainTransport: {
    listenIp: {
      ip: '0.0.0.0',
      announcedIp: null, // replace with public IP in production
    },
    maxSctpMessageSize: 262144,
  },
};
```

## server/controllers/canvasController.js

```javascript
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
```

## server/controllers/mediaController.js

```javascript
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
```

## server/controllers/roomController.js

```javascript
const { v4: uuidv4 } = require('uuid');
const mediasoupConfig = require('../config/mediasoup');
const Room = require('../models/Room');
const Participant = require('../models/Participant');
const logger = require('../utils/logger');

class RoomController {
  
  async createRoom(roomId, worker) {
    try {
      // Create router
      const router = await worker.createRouter({
        mediaCodecs: mediasoupConfig.router.mediaCodecs
      });

      router.on('workerclose', () => {
        logger.info('Router closed because worker closed');
      });

      const room = new Room(roomId, router);
      logger.info(`Room created: ${roomId}`);
      return room;
    } catch (error) {
      logger.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(socket, room, userName, isTeacher = false) {
    try {
      // Use socket.id as participantId for WebRTC compatibility
      const participantId = socket.id;
      const participant = new Participant(participantId, socket.id, userName, isTeacher);
      
      room.participants.set(participantId, participant);
      
      logger.info(`Participant joined room ${room.id}: ${userName} (${participantId})`);
      return participant;
    } catch (error) {
      logger.error('Error joining room:', error);
      throw error;
    }
  }

  leaveRoom(participantId, room) {
    try {
      const participant = room.participants.get(participantId);
      
      if (participant) {
        // Close all transports
        if (participant.sendTransport) {
          participant.sendTransport.close();
        }
        if (participant.recvTransport) {
          participant.recvTransport.close();
        }
        
        // Close all producers
        for (const producer of participant.producers.values()) {
          producer.close();
        }
        
        // Close all consumers
        for (const consumer of participant.consumers.values()) {
          consumer.close();
        }
        
        room.participants.delete(participantId);
        logger.info(`Participant left room ${room.id}: ${participant.name} (${participantId})`);
      }
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  }

  getRoomInfo(room) {
    return {
      id: room.id,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isTeacher: p.isTeacher,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio
      })),
      participantCount: room.participants.size
    };
  }

  async createBreakoutRoom(mainRoom, participantIds) {
    try {
      const breakoutRoomId = `${mainRoom.id}-breakout-${uuidv4()}`;
      const breakoutRoom = await this.createRoom(breakoutRoomId, mainRoom.router.worker);
      
      // Move participants to breakout room
      for (const participantId of participantIds) {
        const participant = mainRoom.participants.get(participantId);
        if (participant) {
          mainRoom.participants.delete(participantId);
          breakoutRoom.participants.set(participantId, participant);
        }
      }
      
      logger.info(`Breakout room created: ${breakoutRoomId}`);
      return breakoutRoom;
    } catch (error) {
      logger.error('Error creating breakout room:', error);
      throw error;
    }
  }
}

module.exports = new RoomController();
```

## server/controllers/socketController.js

```javascript
module.exports = function (io, socket, { roomController, mediaController, canvasController, logger }) {
  console.log(`\n=== SOCKET CONTROLLER LOADED ===`);
  console.log(`Socket ID: ${socket.id} connected to controller`);
  
  socket.on('join-room', ({ roomId, userName, isTeacher }) => {
    console.log(`\n=== JOIN ROOM EVENT ===`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Room ID: ${roomId}`);
    console.log(`User Name: ${userName}`);
    console.log(`Is Teacher: ${isTeacher}`);
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName || 'Anonymous';
    socket.isTeacher = isTeacher || false;
    
    logger.log('info', `${socket.userName} (${socket.id}) joined room ${roomId} as ${isTeacher ? 'teacher' : 'student'}`);
    
    // Get existing participants BEFORE adding new one
    const existingParticipants = mediaController.listParticipants(roomId);
    console.log(`Existing participants (${existingParticipants.length}):`, existingParticipants.map(p => p.name));
    
    // Add participant to room
    const participant = { 
      id: socket.id, 
      name: socket.userName, 
      isTeacher: socket.isTeacher,
      joinedAt: new Date()
    };
    mediaController.addParticipant(roomId, participant);
    
    // Get ALL participants after adding new one
    const allParticipants = mediaController.listParticipants(roomId);
    console.log(`All participants after join (${allParticipants.length}):`, allParticipants.map(p => p.name));
    
    // Notify new user about existing participants (excluding themselves)
    const existingForNewUser = existingParticipants; // Don't include self
    socket.emit('room-joined', {
      roomId: roomId,
      participants: existingForNewUser,
      yourId: socket.id
    });
    console.log(`Sent to new user - existing participants: ${existingForNewUser.length}`);
    
    // Notify others about new participant
    socket.to(roomId).emit('user-joined', {
      participantId: socket.id,
      userName: socket.userName,
      isTeacher: socket.isTeacher
    });
    
    // Ask existing participants to send their current media state to the new participant
    socket.to(roomId).emit('request-media-state', { 
      newParticipantId: socket.id 
    });
    
    console.log(`Notified others in room about new participant: ${socket.userName}`);
    console.log(`=== END JOIN ROOM ===\n`);
  });

  // Handle media signaling
  console.log(`🔧 REGISTERING WebRTC event handlers for socket: ${socket.id}`);
  
  socket.on('offer', ({ to, offer }) => {
    console.log(`🔄 SERVER: Relaying offer from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Offer details:`, { type: offer?.type, sdp: offer?.sdp ? 'present' : 'missing' });
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    console.log(`📤 SERVER: Relaying answer from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Answer details:`, { type: answer?.type, sdp: answer?.sdp ? 'present' : 'missing' });
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    console.log(`🧊 SERVER: Relaying ICE candidate from ${socket.id} to ${to}`);
    console.log(`📦 SERVER: Candidate details:`, { type: candidate?.type, address: candidate?.address });
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Test socket communication
  socket.on('test-ping', (data) => {
    console.log(`🏓 SERVER: Relaying test ping from ${socket.id} to room ${socket.roomId}`);
    socket.to(socket.roomId).emit('test-ping', { ...data, relayedBy: 'server' });
  });

  // Test WebRTC event reception
  socket.on('test-webrtc', (data) => {
    console.log(`🧪 SERVER: TEST WebRTC event received from ${socket.id}:`, data);
    socket.to(data.to).emit('test-webrtc-reply', { from: socket.id, ...data });
  });

  // Media state updates
  socket.on('toggle-video', ({ enabled }) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('participant-video-toggle', {
        participantId: socket.id,
        enabled: enabled
      });
    }
  });

  socket.on('toggle-audio', ({ enabled }) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('participant-audio-toggle', {
        participantId: socket.id,
        enabled: enabled
      });
    }
  });

  // Handle media state sharing
  socket.on('participant-media-state', ({ to, videoEnabled, audioEnabled }) => {
    console.log(`📺 SERVER: Relaying media state from ${socket.id} to ${to} - video: ${videoEnabled}, audio: ${audioEnabled}`);
    socket.to(to).emit('participant-video-toggle', {
      participantId: socket.id,
      enabled: videoEnabled
    });
    socket.to(to).emit('participant-audio-toggle', {
      participantId: socket.id,
      enabled: audioEnabled
    });
  });

  socket.on('canvas-update', (data) => {
    if (!socket.roomId) return;
    canvasController.updateCanvas(socket.roomId, data);
    socket.to(socket.roomId).emit('canvas-update', data);
  });

  socket.on('signal', (payload) => {
    // simple relay for signaling (sockets only). For real mediasoup, replace with proper handlers.
    const { to, from, data } = payload;
    if (to) io.to(to).emit('signal', { from, data });
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      mediaController.removeParticipant(socket.roomId, socket.id);
      socket.to(socket.roomId).emit('user-left', { 
        participantId: socket.id,
        userName: socket.userName 
      });
      logger.log('info', `${socket.userName} (${socket.id}) left room ${socket.roomId}`);
    }
  });
};

```

## server/models/Participant.js

```javascript
class Participant {
  constructor(id, socketId, name, isTeacher = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.isTeacher = isTeacher;
    this.joinedAt = new Date();
    
    // Media state
    this.hasVideo = false;
    this.hasAudio = false;
    this.isScreenSharing = false;
    this.isPinned = false;
    this.hasRaisedHand = false;
    
    // MediaSoup objects
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // producerId -> Producer
    this.consumers = new Map(); // consumerId -> Consumer
    
    // UI state
    this.position = { x: 0, y: 0 }; // For video layout
    this.volume = 1.0;
    this.isMuted = false;
    this.isVideoHidden = false;
    
    // Breakout room
    this.breakoutRoomId = null;
    
    // Permissions
    this.permissions = {
      canShare: true,
      canChat: true,
      canDraw: isTeacher ? true : false,
      canRecord: isTeacher,
      canCreateBreakout: isTeacher,
      canMuteOthers: isTeacher,
      canKickParticipants: isTeacher
    };
  }

  // Media control methods
  toggleVideo(enabled) {
    this.hasVideo = enabled;
  }

  toggleAudio(enabled) {
    this.hasAudio = enabled;
  }

  toggleScreenShare(enabled) {
    this.isScreenSharing = enabled;
  }

  pin() {
    this.isPinned = true;
  }

  unpin() {
    this.isPinned = false;
  }

  raiseHand() {
    this.hasRaisedHand = true;
  }

  lowerHand() {
    this.hasRaisedHand = false;
  }

  // Producer management
  addProducer(producer) {
    this.producers.set(producer.id, producer);
  }

  removeProducer(producerId) {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  getProducer(producerId) {
    return this.producers.get(producerId);
  }

  // Consumer management
  addConsumer(consumer) {
    this.consumers.set(consumer.id, consumer);
  }

  removeConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  getConsumer(consumerId) {
    return this.consumers.get(consumerId);
  }

  // Transport management
  setSendTransport(transport) {
    if (this.sendTransport) {
      this.sendTransport.close();
    }
    this.sendTransport = transport;
  }

  setRecvTransport(transport) {
    if (this.recvTransport) {
      this.recvTransport.close();
    }
    this.recvTransport = transport;
  }

  // Cleanup
  close() {
    // Close all producers
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    // Close all consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    // Close transports
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
  }

  // Permissions
  updatePermissions(newPermissions) {
    this.permissions = { ...this.permissions, ...newPermissions };
  }

  hasPermission(permission) {
    return this.permissions[permission] || false;
  }

  // Breakout rooms
  moveToBreakoutRoom(breakoutRoomId) {
    this.breakoutRoomId = breakoutRoomId;
  }

  leaveBreakoutRoom() {
    this.breakoutRoomId = null;
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      isTeacher: this.isTeacher,
      joinedAt: this.joinedAt,
      hasVideo: this.hasVideo,
      hasAudio: this.hasAudio,
      isScreenSharing: this.isScreenSharing,
      isPinned: this.isPinned,
      hasRaisedHand: this.hasRaisedHand,
      volume: this.volume,
      isMuted: this.isMuted,
      isVideoHidden: this.isVideoHidden,
      breakoutRoomId: this.breakoutRoomId,
      permissions: this.permissions,
      position: this.position,
      producerIds: Array.from(this.producers.keys()),
      consumerIds: Array.from(this.consumers.keys())
    };
  }
}

module.exports = Participant;
```

## server/models/Room.js

```javascript
class Room {
  constructor(id, router) {
    this.id = id;
    this.router = router;
    this.participants = new Map(); // participantId -> Participant
    this.createdAt = new Date();
    this.isRecording = false;
    this.recordingData = null;
    this.breakoutRooms = new Map(); // breakoutId -> Room
    this.settings = {
      allowScreenShare: true,
      allowChat: true,
      allowCanvas: true,
      maxParticipants: 50,
      recordingEnabled: false,
      muteOnJoin: false,
      videoOffOnJoin: false,
      waitingRoomEnabled: false,
    };
  }

  getParticipant(participantId) {
    return this.participants.get(participantId);
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId) {
    return this.participants.delete(participantId);
  }

  getParticipants() {
    return Array.from(this.participants.values());
  }

  getParticipantCount() {
    return this.participants.size;
  }

  getTeachers() {
    return this.getParticipants().filter(p => p.isTeacher);
  }

  getStudents() {
    return this.getParticipants().filter(p => !p.isTeacher);
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.getParticipants().map(p => p.toJSON()),
      participantCount: this.getParticipantCount(),
      createdAt: this.createdAt,
      isRecording: this.isRecording,
      settings: this.settings,
      breakoutRooms: Array.from(this.breakoutRooms.keys())
    };
  }
}

module.exports = Room;
```

## server/utils/logger.js

```javascript
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }

  writeToFile(level, formattedMessage) {
    if (!this.enableFileLogging) return;
    
    const filename = `edumeet-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, formattedMessage + '\n');
  }

  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m',  // yellow
      info: '\x1b[36m',  // cyan
      debug: '\x1b[90m'  // gray
    };
    
    const reset = '\x1b[0m';
    console.log(`${colors[level] || ''}${formattedMessage}${reset}`);
    
    // File output
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Middleware for Express logging
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl, ip } = req;
        const { statusCode } = res;
        
        const level = statusCode >= 400 ? 'error' : 'info';
        this.log(level, `${method} ${originalUrl}`, {
          statusCode,
          duration: `${duration}ms`,
          ip: ip || 'unknown'
        });
      });
      
      next();
    };
  }
}

module.exports = new Logger();
```

# Project README

```markdown
# EduMeet (minimal scaffold)

This repository contains a minimal scaffold for an EduMeet-like app with server and client directories.

Server:
This workspace contains the EduMeet application. It includes a Node/Express backend (`server/`) and a static client (`client/`) that implements video chat, a collaborative whiteboard, and basic room/participant management using Socket.IO and WebRTC.

Quick start
-----------

1. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open the client in a browser: http://localhost:3000

Generate a full project README
------------------------------

This repo includes `generate_full_readme.sh` which will create `FULL_README.md` containing a tree of the repository and the full contents of files under `client/` and `server/`.

Usage:

```bash
./generate_full_readme.sh
```

What this snapshot contains
--------------------------

- Server: Express + Socket.IO controllers and a `socketController.js` that handles room join/leave and relays WebRTC signaling events.
- Client: static HTML/CSS/JS implementing UI, canvas, WebRTC manager, socket handler, and fallback handling for mediasoup.

Notes and troubleshooting
-------------------------
- If your browser reports camera already in use, close other tabs or apps using the camera.
- If WebRTC offers are created but not answered, check server logs to ensure the `offer`/`answer`/`ice-candidate` events are received and relayed.
- Use the browser console to inspect signaling logs — this project logs offers/answers and ICE events for debugging.
```
