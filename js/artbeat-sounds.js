// artbeat-sounds.js - Global Sound System for ArtBeat
class ArtBeatSounds {
    constructor() {
        this.sounds = {};
        this.isEnabled = localStorage.getItem('artbeatSoundsEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('artbeatSoundVolume')) || 0.5;
        this.initializeSounds();
        this.setupGlobalEventListeners();
        this.setupKonamiCode();
    }

    initializeSounds() {
        // ArtBeat specific sounds
        this.sounds = {
            // Navigation sounds
            navigation: this.createBeep(600, 0.1, 'triangle'),
            hover: this.createBeep(1200, 0.05, 'sine'),
            
            // Interaction sounds
            click: this.createBeep(800, 0.1, 'sine'),
            success: this.createBeep([400, 600, 800], 0.2, 'sine'),
            error: this.createBeep(200, 0.3, 'sawtooth'),
            
            // Artist discovery sounds
            discover: this.createBeep([600, 900, 1200], 0.25, 'sine'),
            follow: this.createBeep([800, 1000], 0.15, 'triangle'),
            
            // Challenge sounds
            challenge: this.createBeep([440, 660, 880], 0.2, 'square'),
            
            // Form sounds
            type: this.createBeep(1000, 0.05, 'sine'),
            submit: this.createBeep([600, 800, 1000], 0.15, 'sine'),
            
            // Star rating sounds
            star: this.createBeep(1200, 0.08, 'sine'),
            
            // Upload sounds
            upload: this.createBeep([500, 700, 900], 0.3, 'triangle'),
            
            // Monetization sound
            monetize: this.createBeep([300, 500, 700], 0.2, 'square')
        };
    }

    createBeep(frequency, duration, type = 'sine') {
        return () => {
            if (!this.isEnabled) return;

            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (Array.isArray(frequency)) {
                    frequency.forEach((freq, index) => {
                        setTimeout(() => {
                            this.playTone(audioContext, freq, duration / 2, type);
                        }, index * 50);
                    });
                } else {
                    this.playTone(audioContext, frequency, duration, type);
                }
            } catch (error) {
                console.log('Audio context not supported:', error);
            }
        };
    }

    playTone(audioContext, frequency, duration, type) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    play(soundName) {
        if (this.sounds[soundName] && this.isEnabled) {
            this.sounds[soundName]();
        }
    }

    setupGlobalEventListeners() {
        // Navigation sounds
        document.addEventListener('click', (e) => {
            // Custom sound attributes
            if (e.target.hasAttribute('data-sound')) {
                this.play(e.target.getAttribute('data-sound'));
                return;
            }

            // Bootstrap-specific elements
            if (e.target.classList.contains('btn-primary') || 
                e.target.classList.contains('btn-success')) {
                this.play('success');
            } else if (e.target.classList.contains('btn-danger')) {
                this.play('error');
            } else if (e.target.classList.contains('btn')) {
                this.play('click');
            }

            // Navigation links
            if (e.target.classList.contains('nav-link') || 
                e.target.closest('.navbar-brand') ||
                e.target.tagName === 'A') {
                this.play('navigation');
            }

            // Star rating
            if (e.target.classList.contains('starbtn') || 
                e.target.closest('.starbtn')) {
                this.play('star');
            }

            // Follow buttons
            if (e.target.classList.contains('seguir') || 
                e.target.classList.contains('follow-btn')) {
                this.play('follow');
            }

            // Monetization buttons
            if (e.target.classList.contains('monetizabtn') || 
                e.target.closest('.monetizabtn')) {
                this.play('monetize');
            }

            // Artist discovery buttons
            if (e.target.classList.contains('cat-btn')) {
                this.play('discover');
            }
        });

        // Form interactions
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.play('type');
            }
        });

        document.addEventListener('submit', (e) => {
            this.play('submit');
        });

        // File upload detection
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.files.length > 0) {
                this.play('upload');
            }
        });
    }

    toggleSounds(enabled) {
        this.isEnabled = enabled;
        localStorage.setItem('artbeatSoundsEnabled', enabled);
        this.updateControlPanel();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('artbeatSoundVolume', this.volume);
        this.updateControlPanel();
    }

    setupKonamiCode() {
        const konamiCode = [
            'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
            'KeyB', 'KeyA'
        ];
        let konamiIndex = 0;
        
        document.addEventListener('keydown', (event) => {
            if (event.code === konamiCode[konamiIndex]) {
                konamiIndex++;
                
                if (konamiIndex === konamiCode.length) {
                    // Konami code completed!
                    this.createSoundControlPanel();
                    konamiIndex = 0; // Reset for next use
                    
                    // Play a sound effect
                    console.log('🎮 Konami Code Activated! Sound panel unlocked!');
                    this.play('success');
                }
            } else {
                konamiIndex = 0; // Reset on wrong key
            }
        });
    }

    createSoundControlPanel() {
        if (document.getElementById('artbeatSoundControls')) return;

        const controlPanel = document.createElement('div');
        controlPanel.id = 'artbeatSoundControls';
        controlPanel.innerHTML = `
            <div class="position-fixed" style="bottom: 20px; right: 20px; z-index: 1050;">
                <div class="card bg-dark text-white shadow" style="width: 280px;">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">🎵 Controles de Som</h6>
                        <div>
                            <button class="btn btn-sm btn-outline-light me-2" id="toggleSoundPanel" style="padding: 2px 8px;">
                                <i class="fas fa-chevron-down" id="panelIcon"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-light" id="closeSoundPanel" style="padding: 2px 8px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body" id="soundPanelBody">
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="artbeatSoundToggle" ${this.isEnabled ? 'checked' : ''}>
                            <label class="form-check-label" for="artbeatSoundToggle">
                                Ativar Sons
                            </label>
                        </div>
                        <div class="mb-3">
                            <label for="artbeatVolumeSlider" class="form-label small">Volume</label>
                            <input type="range" class="form-range" min="0" max="100" value="${this.volume * 100}" id="artbeatVolumeSlider">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">0%</small>
                                <small class="text-muted" id="volumeDisplay">${Math.round(this.volume * 100)}%</small>
                                <small class="text-muted">100%</small>
                            </div>
                        </div>
                        <div class="d-grid gap-2">
                            <small class="text-muted mb-2">🎵 Testar Sons:</small>
                            <div class="row g-1">
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testNavigationSound">🧭 Navigation</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testHoverSound">👆 Hover</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testClickSound">👆 Click</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testSuccessSound">✅ Success</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testErrorSound">❌ Error</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testDiscoverSound">🎲 Discover</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testFollowSound">👥 Follow</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testChallengeSound">🏆 Challenge</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testTypeSound">⌨️ Type</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testSubmitSound">📤 Submit</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testStarSound">⭐ Star</button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testUploadSound">📁 Upload</button>
                                </div>
                                <div class="col-12">
                                    <button class="btn btn-sm btn-outline-light w-100" id="testMonetizeSound">💰 Monetize</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(controlPanel);
        this.attachControlPanelEvents();
    }

    attachControlPanelEvents() {
        // Toggle panel visibility
        const toggleBtn = document.getElementById('toggleSoundPanel');
        const panelBody = document.getElementById('soundPanelBody');
        const panelIcon = document.getElementById('panelIcon');
        let panelExpanded = true;

        toggleBtn.addEventListener('click', () => {
            panelExpanded = !panelExpanded;
            panelBody.style.display = panelExpanded ? 'block' : 'none';
            panelIcon.className = panelExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        });

        // Close panel completely
        const closeBtn = document.getElementById('closeSoundPanel');
        closeBtn.addEventListener('click', () => {
            const panel = document.getElementById('artbeatSoundControls');
            if (panel) {
                panel.remove();
            }
        });

        // Sound toggle
        document.getElementById('artbeatSoundToggle').addEventListener('change', (e) => {
            this.toggleSounds(e.target.checked);
        });

        // Volume control
        const volumeSlider = document.getElementById('artbeatVolumeSlider');
        const volumeDisplay = document.getElementById('volumeDisplay');
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setVolume(volume);
            volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
        });

        // Test buttons for all sounds
        const soundTests = [
            { id: 'testNavigationSound', sound: 'navigation' },
            { id: 'testHoverSound', sound: 'hover' },
            { id: 'testClickSound', sound: 'click' },
            { id: 'testSuccessSound', sound: 'success' },
            { id: 'testErrorSound', sound: 'error' },
            { id: 'testDiscoverSound', sound: 'discover' },
            { id: 'testFollowSound', sound: 'follow' },
            { id: 'testChallengeSound', sound: 'challenge' },
            { id: 'testTypeSound', sound: 'type' },
            { id: 'testSubmitSound', sound: 'submit' },
            { id: 'testStarSound', sound: 'star' },
            { id: 'testUploadSound', sound: 'upload' },
            { id: 'testMonetizeSound', sound: 'monetize' }
        ];

        soundTests.forEach(test => {
            const button = document.getElementById(test.id);
            if (button) {
                button.addEventListener('click', () => {
                    this.play(test.sound);
                });
            }
        });
    }

    updateControlPanel() {
        const toggle = document.getElementById('artbeatSoundToggle');
        const slider = document.getElementById('artbeatVolumeSlider');
        const display = document.getElementById('volumeDisplay');
        
        if (toggle) toggle.checked = this.isEnabled;
        if (slider) slider.value = this.volume * 100;
        if (display) display.textContent = `${Math.round(this.volume * 100)}%`;
    }
}

// Initialize when DOM is loaded
let artbeatSounds;
document.addEventListener('DOMContentLoaded', () => {
    artbeatSounds = new ArtBeatSounds();
    
    // Make globally accessible
    window.ArtBeatSounds = artbeatSounds;
    window.playArtBeatSound = (soundName) => {
        if (window.ArtBeatSounds) {
            window.ArtBeatSounds.play(soundName);
        }
    };
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArtBeatSounds;
}