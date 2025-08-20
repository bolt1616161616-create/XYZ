// Gemini AI Chatbot Integration
class GeminiChatbot {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.messages = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChatHistory();
        this.addWelcomeMessage();
    }

    bindEvents() {
        const chatToggle = document.getElementById('chatToggle');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');
        const minimizeBtn = document.getElementById('minimizeChat');
        const closeBtn = document.getElementById('closeChat');
        const suggestionChips = document.querySelectorAll('.suggestion-chip');

        if (chatToggle) {
            chatToggle.addEventListener('click', () => this.toggleChat());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            chatInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeChat());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeChat());
        }

        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const message = chip.getAttribute('data-message');
                if (message) {
                    chatInput.value = message;
                    this.sendMessage();
                }
            });
        });
    }

    toggleChat() {
        const chatbot = document.getElementById('geminiChatbot');
        const notification = document.getElementById('chatNotification');
        
        if (chatbot) {
            this.isOpen = !this.isOpen;
            chatbot.classList.toggle('active', this.isOpen);
            
            if (this.isOpen) {
                this.focusInput();
                if (notification) {
                    notification.style.display = 'none';
                }
            }
        }
    }

    minimizeChat() {
        const chatbot = document.getElementById('geminiChatbot');
        if (chatbot) {
            this.isMinimized = !this.isMinimized;
            chatbot.classList.toggle('minimized', this.isMinimized);
        }
    }

    closeChat() {
        this.isOpen = false;
        const chatbot = document.getElementById('geminiChatbot');
        if (chatbot) {
            chatbot.classList.remove('active');
        }
    }

    focusInput() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 300);
        }
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
            // Get AI response
            const response = await this.getGeminiResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('I apologize, but I\'m experiencing technical difficulties. Please try again later.', 'bot');
        }
    }

    async getGeminiResponse(message) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/chat/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message,
                    context: this.getConversationContext()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Gemini API error:', error);
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('project')) {
            return "Yash has worked on various exciting projects including ManasMitra (an AI mental health platform), Docker management systems, AWS automation tools, and interactive web applications. You can explore them in the projects section!";
        } else if (lowerMessage.includes('skill') || lowerMessage.includes('technology')) {
            return "Yash is skilled in AI/ML (Python, TensorFlow, PyTorch), web development (JavaScript, React, Flask), cloud technologies (AWS, Docker, Kubernetes), and databases (MySQL, MongoDB). He's constantly learning new technologies!";
        } else if (lowerMessage.includes('experience')) {
            return "Yash is currently pursuing BTech in AI & Data Science and has completed internships in robotics and is currently interning at LinuxWorld Informatics Pvt Ltd, focusing on DevOps, ML, and cloud technologies.";
        } else if (lowerMessage.includes('contact')) {
            return "You can reach Yash at yashagarwala2709@gmail.com or connect with him on LinkedIn. He's always open to discussing AI, technology, and potential collaborations!";
        } else {
            return "Hello! I'm here to help you learn about Yash Agarwal's work in AI, machine learning, and software development. Feel free to ask about his projects, skills, or experience!";
        }
    }

    getConversationContext() {
        return this.messages.slice(-5).map(msg => `${msg.type}: ${msg.content}`).join('\n');
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store message
        this.messages.push({ type, content, timestamp: Date.now() });
        this.saveChatHistory();

        // Animate message appearance
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.id = 'typingIndicator';
        
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingElement);
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

    handleTyping() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (chatInput && sendButton) {
            const hasText = chatInput.value.trim().length > 0;
            sendButton.style.opacity = hasText ? '1' : '0.5';
            sendButton.disabled = !hasText;
        }
    }

    addWelcomeMessage() {
        setTimeout(() => {
            if (this.messages.length === 0) {
                this.addMessage(
                    "Hello! I'm Gemini AI, Yash's intelligent assistant. I can help you navigate his portfolio, answer questions about his projects, or discuss his technical expertise. How can I assist you today?",
                    'bot'
                );
            }
        }, 1000);
    }

    saveChatHistory() {
        try {
            localStorage.setItem('chatHistory', JSON.stringify(this.messages.slice(-20))); // Keep last 20 messages
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const history = localStorage.getItem('chatHistory');
            if (history) {
                this.messages = JSON.parse(history);
                this.messages.forEach(msg => {
                    this.addMessage(msg.content, msg.type);
                });
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    clearHistory() {
        this.messages = [];
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        localStorage.removeItem('chatHistory');
        this.addWelcomeMessage();
    }
}

// Initialize Gemini Chatbot
document.addEventListener('DOMContentLoaded', () => {
    window.geminiChatbot = new GeminiChatbot();
});

// Export for global access
window.GeminiChatbot = GeminiChatbot;