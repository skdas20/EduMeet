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
