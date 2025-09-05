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