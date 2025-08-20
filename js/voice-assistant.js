// JARVIS Voice Assistant System
class JARVISVoiceAssistant {
    constructor() {
        this.isListening = false;
        this.isEnabled = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentVoice = null;
        this.init();
    }

    init() {
        this.checkBrowserSupport();
        this.createVoiceInterface();
        this.setupSpeechRecognition();
        this.loadVoices();
        this.bindEvents();
    }

    checkBrowserSupport() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }
        
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            return false;
        }
        
        this.isEnabled = true;
        return true;
    }

    createVoiceInterface() {
        const voiceContainer = document.createElement('div');
        voiceContainer.id = 'jarvisVoice';
        voiceContainer.className = 'jarvis-voice-assistant';
        voiceContainer.innerHTML = `
            <button class="voice-btn" id="voiceBtn">
                <i class="fas fa-microphone" id="voiceIcon"></i>
                <div class="voice-pulse"></div>
            </button>
            <div class="voice-status" id="voiceStatus">
                <span class="status-text">JARVIS READY</span>
                <div class="voice-visualizer">
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                </div>
            </div>
        `;
        
        // Insert into loading screen or body
        const loadingScreen = document.querySelector('.jarvis-loading');
        if (loadingScreen) {
            loadingScreen.appendChild(voiceContainer);
        } else {
            document.body.appendChild(voiceContainer);
        }
    }

    setupSpeechRecognition() {
        if (!this.isEnabled) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('LISTENING...', 'listening');
            this.startVoiceVisualizer();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
            this.updateVoiceStatus('ERROR - TRY AGAIN', 'error');
            setTimeout(() => {
                this.updateVoiceStatus('JARVIS READY', 'ready');
            }, 2000);
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Find a suitable voice (prefer male, English)
        this.currentVoice = this.voices.find(voice => 
            voice.lang.includes('en') && 
            (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Alex'))
        ) || this.voices.find(voice => voice.lang.includes('en')) || this.voices[0];

        // Load voices when they become available
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }

    bindEvents() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceContainer = document.getElementById('jarvisVoice');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleListening());
        }

        // Show/hide voice status on hover
        if (voiceContainer) {
            voiceContainer.addEventListener('mouseenter', () => {
                this.showVoiceStatus();
            });
            
            voiceContainer.addEventListener('mouseleave', () => {
                if (!this.isListening) {
                    this.hideVoiceStatus();
                }
            });
        }

        // Keyboard shortcut (Ctrl + J for JARVIS)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'j') {
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    toggleListening() {
        if (!this.isEnabled) {
            this.speak('Voice recognition is not supported in this browser.');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.showVoiceStatus();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        this.isListening = false;
        this.updateVoiceStatus('JARVIS READY', 'ready');
        this.stopVoiceVisualizer();
        
        setTimeout(() => {
            this.hideVoiceStatus();
        }, 2000);
    }

    async processVoiceCommand(transcript) {
        console.log('Voice command received:', transcript);
        
        this.updateVoiceStatus('PROCESSING...', 'processing');
        
        try {
            // Send to voice processing endpoint
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    transcript: transcript
                })
            });

            const data = await response.json();
            
            // Speak the response
            this.speak(data.response);
            
            // Execute any actions
            if (data.action) {
                this.executeAction(data.action, data.target);
            }
            
        } catch (error) {
            console.error('Voice processing error:', error);
            this.speak('I apologize, but I encountered an error processing your request.');
        }
        
        this.updateVoiceStatus('COMMAND EXECUTED', 'success');
        setTimeout(() => {
            this.updateVoiceStatus('JARVIS READY', 'ready');
        }, 2000);
    }

    executeAction(action, target) {
        switch (action) {
            case 'navigate':
                this.navigateToSection(target);
                break;
            case 'filter':
                this.filterProjects(target);
                break;
            case 'scroll':
                this.scrollToElement(target);
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    navigateToSection(section) {
        const element = document.getElementById(`${section}-section`) || document.getElementById(section);
        if (element) {
            
            element.scrollIntoView({ behavior: 'smooth' });
            
            // Update active navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${section}`) {
                    link.classList.add('active');
                }
            });
        }
    }

    filterProjects(category) {
        const allProjects = document.querySelectorAll('.project-item');
        allProjects.forEach(project => {
            if (category === 'all' || project.classList.contains(category)) {
                project.style.display = 'block';
            } else {
                project.style.display = 'none';
            }
        });
    }

    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }    
    }
        chatInput.value = '';
        
        // Optionally, you can add the message to the chat history
        this.addMessageToChatHistory(message, 'user');
    }
    addMessageToChatHistory(message, sender) {
        const chatHistory = document.getElementById('chatHistory');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.textContent = message;
        chatHistory.appendChild(messageElement);
        
        // Scroll to the bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
        chatbot.classList.toggle('minimized');
        this.isOpen = !chatbot.classList.contains('minimized');
        
        if (this.isOpen) {
            this.updateVoiceStatus('JARVIS READY', 'ready');
        } else {
            this.updateVoiceStatus('JARVIS MINIMIZED', 'minimized');
        }
    }
    updateVoiceStatus(message, status) {
        const voiceStatus = document.getElementById('voiceStatus');
        const statusText = voiceStatus.querySelector('.status-text');
        statusText.textContent = message;
        
        voiceStatus.className = `voice-status ${status}`;
    }
    startVoiceVisualizer() {
        const visualizer = document.querySelector('.voice-visualizer');
        if (!visualizer) return;

        visualizer.classList.add('active');
        const bars = visualizer.querySelectorAll('.voice-bar');
        
        bars.forEach((bar, index) => {
            bar.style.animationDelay = `${index * 0.1}s`;
            bar.classList.add('active');
        });
    }
    stopVoiceVisualizer() {
        const visualizer = document.querySelector('.voice-visualizer');
        if (!visualizer) return;

        visualizer.classList.remove('active');
        const bars = visualizer.querySelectorAll('.voice-bar');
        
        bars.forEach(bar => {
            bar.classList.remove('active');
        });
    }
    speak(message) {
        if (!this.isEnabled || !this.synthesis) return;

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = this.currentVoice;
        utterance.lang = 'en-US';
        
        this.synthesis.speak(utterance);
    }
    showVoiceStatus() {
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            voiceStatus.style.display = 'block';
        }
    
    hideVoiceStatus() {
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            voiceStatus.style.display = 'none';
        }
    }
    }
    