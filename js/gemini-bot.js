// Gemini AI Chatbot System
class GeminiChatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.init();
    }

    init() {
        this.createChatInterface();
        this.bindEvents();
        this.showWelcomeMessage();
    }

    createChatInterface() {
        // Create chat toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'chatToggle';
        toggleBtn.className = 'chat-toggle-btn';
        toggleBtn.innerHTML = `
            <i class="fas fa-comments"></i>
            <div class="notification-badge" id="chatNotification">1</div>
        `;
        document.body.appendChild(toggleBtn);

        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'geminiChatbot';
        chatContainer.className = 'gemini-chatbot';
        chatContainer.innerHTML = `
            <div class="chatbot-header">
                <div class="bot-avatar">
                    <i class="fas fa-robot"></i>
                    <div class="avatar-pulse"></div>
                </div>
                <div class="bot-info">
                    <h4>GEMINI AI</h4>
                    <span class="bot-status">ONLINE</span>
                </div>
                <div class="chat-controls">
                    <button class="control-btn" id="minimizeChat">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="control-btn" id="closeChat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="message bot-message">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>Hello! I'm Gemini AI, Yash's intelligent assistant. I can help you navigate his portfolio, answer questions about his projects, or discuss his technical expertise. How can I assist you today?</p>
                    </div>
                </div>
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-wrapper">
                    <input type="text" id="chatInput" placeholder="Ask me about Yash's work..." maxlength="500">
                    <button id="sendMessage" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="input-suggestions">
                    <button class="suggestion-chip" data-message="Tell me about Yash's AI projects">AI Projects</button>
                    <button class="suggestion-chip" data-message="What technologies does Yash use?">Technologies</button>
                    <button class="suggestion-chip" data-message="Show me his experience">Experience</button>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
    }

    bindEvents() {
        const toggleBtn = document.getElementById('chatToggle');
        const closeBtn = document.getElementById('closeChat');
        const minimizeBtn = document.getElementById('minimizeChat');
        const sendBtn = document.getElementById('sendMessage');
        const chatInput = document.getElementById('chatInput');
        const suggestions = document.querySelectorAll('.suggestion-chip');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.closeChat());
        minimizeBtn.addEventListener('click', () => this.minimizeChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        suggestions.forEach(chip => {
            chip.addEventListener('click', () => {
                const message = chip.getAttribute('data-message');
                chatInput.value = message;
                this.sendMessage();
            });
        });
    }

    toggleChat() {
        const chatbot = document.getElementById('geminiChatbot');
        const notification = document.getElementById('chatNotification');
        
        if (this.isOpen) {
            this.closeChat();
        } else {
            chatbot.classList.add('active');
            this.isOpen = true;
            notification.style.display = 'none';
            
            // Focus on input
            setTimeout(() => {
                document.getElementById('chatInput').focus();
            }, 300);
        }
    }

    closeChat() {
        const chatbot = document.getElementById('geminiChatbot');
        chatbot.classList.remove('active', 'minimized');
        this.isOpen = false;
    }

    minimizeChat() {
        const chatbot = document.getElementById('geminiChatbot');
        chatbot.classList.toggle('minimized');
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get auth token
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('/api/chat/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: message,
                    context: this.getContext()
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot');
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('I apologize, but I\'m having trouble connecting right now. Please try again later.', 'bot');
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store in history
        this.messageHistory.push({ content, sender, timestamp: Date.now() });
        
        // Animate message appearance
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 100);
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    getContext() {
        return {
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            messageCount: this.messageHistory.length
        };
    }

    showWelcomeMessage() {
        // Show notification badge
        setTimeout(() => {
            const notification = document.getElementById('chatNotification');
            if (notification) {
                notification.style.display = 'flex';
                notification.classList.add('pulse');
            }
        }, 2000);
    }
}

// Initialize Gemini Chatbot
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});