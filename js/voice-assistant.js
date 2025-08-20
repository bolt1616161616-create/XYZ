// JARVIS Voice Assistant
class JarvisVoiceAssistant {
    constructor() {
        this.isListening = false;
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.init();
    }

    init() {
        if (this.isSupported) {
            this.setupSpeechRecognition();
            this.setupSpeechSynthesis();
            this.bindEvents();
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.hideVoiceAssistant();
        }
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('LISTENING...');
            this.startVoiceVisualization();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
            this.updateVoiceStatus('ERROR DETECTED');
            
            setTimeout(() => {
                this.updateVoiceStatus('JARVIS READY');
            }, 2000);
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    setupSpeechSynthesis() {
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
            
            // Initial load
            this.voices = this.synthesis.getVoices();
        }
    }

    bindEvents() {
        const voiceBtn = document.getElementById('voiceBtn');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            });
        }

        // Keyboard shortcut (Ctrl + Space)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            }
        });
    }

    startListening() {
        if (!this.isSupported || this.isListening) return;

        try {
            this.recognition.start();
            this.updateVoiceButton(true);
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    stopListening() {
        if (!this.isSupported || !this.isListening) return;

        try {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceButton(false);
            this.updateVoiceStatus('JARVIS READY');
            this.stopVoiceVisualization();
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
        }
    }

    updateVoiceButton(listening) {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceIcon = document.getElementById('voiceIcon');
        
        if (voiceBtn && voiceIcon) {
            if (listening) {
                voiceBtn.classList.add('listening');
                voiceIcon.className = 'fas fa-stop';
            } else {
                voiceBtn.classList.remove('listening');
                voiceIcon.className = 'fas fa-microphone';
            }
        }
    }

    updateVoiceStatus(status) {
        const statusElement = document.querySelector('.status-text');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    startVoiceVisualization() {
        const voiceBars = document.querySelectorAll('.voice-bar');
        voiceBars.forEach((bar, index) => {
            bar.style.animation = `voice-wave 0.5s ease-in-out infinite alternate`;
            bar.style.animationDelay = `${index * 0.1}s`;
        });
    }

    stopVoiceVisualization() {
        const voiceBars = document.querySelectorAll('.voice-bar');
        voiceBars.forEach(bar => {
            bar.style.animation = '';
        });
    }

    async processVoiceCommand(transcript) {
        this.updateVoiceStatus('PROCESSING...');
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ transcript })
            });

            if (response.ok) {
                const data = await response.json();
                this.handleVoiceResponse(data);
            } else {
                this.handleLocalVoiceCommand(transcript);
            }
        } catch (error) {
            console.error('Voice processing error:', error);
            this.handleLocalVoiceCommand(transcript);
        }
    }

    handleLocalVoiceCommand(transcript) {
        const command = transcript.toLowerCase();
        let response = '';
        let action = null;

        if (command.includes('navigate') || command.includes('go to')) {
            if (command.includes('projects')) {
                response = "Navigating to projects section";
                action = { type: 'navigate', target: 'projects' };
            } else if (command.includes('about')) {
                response = "Navigating to about section";
                action = { type: 'navigate', target: 'about' };
            } else if (command.includes('contact')) {
                response = "Navigating to contact section";
                action = { type: 'navigate', target: 'contact' };
            } else if (command.includes('skills')) {
                response = "Navigating to skills section";
                action = { type: 'navigate', target: 'skills' };
            } else if (command.includes('home')) {
                response = "Navigating to home section";
                action = { type: 'navigate', target: 'home' };
            }
        } else if (command.includes('show') || command.includes('filter')) {
            if (command.includes('ai') || command.includes('artificial intelligence')) {
                response = "Showing AI and Machine Learning projects";
                action = { type: 'filter', target: 'ai' };
            } else if (command.includes('web')) {
                response = "Showing web development projects";
                action = { type: 'filter', target: 'web' };
            } else if (command.includes('devops')) {
                response = "Showing DevOps projects";
                action = { type: 'filter', target: 'devops' };
            } else if (command.includes('aws') || command.includes('cloud')) {
                response = "Showing cloud computing projects";
                action = { type: 'filter', target: 'aws' };
            } else if (command.includes('all')) {
                response = "Showing all projects";
                action = { type: 'filter', target: 'all' };
            }
        } else if (command.includes('hello') || command.includes('hi')) {
            response = "Hello! I'm JARVIS, Yash's AI assistant. I can help you navigate the portfolio or answer questions about his work.";
        } else if (command.includes('help')) {
            response = "I can help you navigate sections, filter projects, or answer questions. Try saying 'go to projects' or 'show AI projects'.";
        } else {
            response = "I'm JARVIS, Yash's AI assistant. I can help you navigate the portfolio, filter projects, or answer questions about his work. Try saying 'show projects' or 'go to about'.";
        }

        this.handleVoiceResponse({ response, action });
    }

    handleVoiceResponse(data) {
        // Speak the response
        this.speak(data.response);
        
        // Execute action if provided
        if (data.action) {
            this.executeAction(data.action);
        }
        
        this.updateVoiceStatus('JARVIS READY');
    }

    executeAction(action) {
        switch (action.type) {
            case 'navigate':
                if (window.jarvisPortfolio) {
                    window.jarvisPortfolio.navigateToSection(action.target);
                }
                break;
            case 'filter':
                if (window.jarvisPortfolio) {
                    window.jarvisPortfolio.filterProjects(action.target);
                }
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a suitable voice
        const preferredVoices = this.voices.filter(voice => 
            voice.lang.includes('en') && 
            (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        );
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onstart = () => {
            this.updateVoiceStatus('SPEAKING...');
        };
        
        utterance.onend = () => {
            this.updateVoiceStatus('JARVIS READY');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.updateVoiceStatus('JARVIS READY');
        };

        this.synthesis.speak(utterance);
    }

    hideVoiceAssistant() {
        const voiceAssistant = document.getElementById('voiceAssistant');
        if (voiceAssistant) {
            voiceAssistant.style.display = 'none';
        }
    }

    // Public methods
    isVoiceSupported() {
        return this.isSupported;
    }

    getCurrentStatus() {
        return {
            listening: this.isListening,
            supported: this.isSupported,
            voicesLoaded: this.voices.length > 0
        };
    }
}

// Initialize Voice Assistant
document.addEventListener('DOMContentLoaded', () => {
    window.jarvisVoice = new JarvisVoiceAssistant();
});

// Export for global access
window.JarvisVoiceAssistant = JarvisVoiceAssistant;