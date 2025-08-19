const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yash_portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('📝 Running in demo mode without MongoDB');
    }
};

connectDB();

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'premium'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    preferences: {
        theme: { type: String, default: 'dark' },
        notifications: { type: Boolean, default: true },
        voiceAssistant: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Demo users for fallback
const demoUsers = [
    {
        id: '1',
        username: 'demo',
        email: 'demo@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user'
    }
];

// Auth middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        let user;
        try {
            user = await User.findById(decoded.userId).select('-password');
        } catch (error) {
            user = demoUsers.find(u => u.id === decoded.userId);
        }
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        let user;
        try {
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ 
                    message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
                });
            }

            user = new User({
                username,
                email,
                password,
                firstName,
                lastName
            });

            await user.save();
        } catch (error) {
            const existingDemoUser = demoUsers.find(u => u.email === email || u.username === username);
            if (existingDemoUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            user = {
                id: Date.now().toString(),
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'user'
            };
            demoUsers.push(user);
        }

        const token = jwt.sign(
            { userId: user._id || user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id || user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        let user;
        let isPasswordValid = false;

        try {
            user = await User.findOne({ email });
            if (user) {
                isPasswordValid = await user.comparePassword(password);
                if (isPasswordValid) {
                    user.lastLogin = new Date();
                    await user.save();
                }
            }
        } catch (error) {
            user = demoUsers.find(u => u.email === email);
            if (user) {
                isPasswordValid = await bcrypt.compare(password, user.password);
            }
        }

        if (!user || !isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id || user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id || user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                preferences: user.preferences || { theme: 'dark', notifications: true, voiceAssistant: true }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({
        user: {
            id: req.user._id || req.user.id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            preferences: req.user.preferences || { theme: 'dark', notifications: true, voiceAssistant: true }
        }
    });
});

// Gemini AI Chat Route
app.post('/api/chat/gemini', authenticateToken, async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
            return res.json({
                response: `Hello! I'm the Gemini AI assistant. You asked: "${message}". This is a demo response since no API key is configured. I can help you with questions about Yash's projects, skills, and experience in AI, web development, and DevOps.`
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are an AI assistant for Yash Agarwal's portfolio. Yash is an AI Engineer and Data Scientist specializing in machine learning, web development, and DevOps. 

Context about Yash:
- BTech student in AI & Data Science at Arya College of Engineering
- Experienced in Python, JavaScript, AWS, Docker, Machine Learning
- Has worked on projects like ManasMitra (AI mental health platform), Docker management systems, AWS automation tools
- Skilled in Flask, React, MongoDB, MySQL, and cloud technologies
- Currently interning at LinuxWorld Informatics Pvt Ltd

User question: ${message}

Please provide a helpful, informative response about Yash's work, skills, or projects. Keep responses concise but informative.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ 
            error: 'Failed to get AI response',
            response: "I'm having trouble connecting to my AI systems right now. Please try again later or contact Yash directly for any questions about his portfolio."
        });
    }
});

// Voice Assistant Route
app.post('/api/voice/process', authenticateToken, async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        // Process voice commands
        const response = await processVoiceCommand(transcript);
        res.json({ response, action: response.action || null });
    } catch (error) {
        console.error('Voice processing error:', error);
        res.status(500).json({ error: 'Failed to process voice command' });
    }
});

async function processVoiceCommand(transcript) {
    const command = transcript.toLowerCase();
    
    if (command.includes('navigate') || command.includes('go to')) {
        if (command.includes('projects')) {
            return { response: "Navigating to projects section", action: 'navigate', target: 'projects' };
        } else if (command.includes('about')) {
            return { response: "Navigating to about section", action: 'navigate', target: 'about' };
        } else if (command.includes('contact')) {
            return { response: "Navigating to contact section", action: 'navigate', target: 'contact' };
        } else if (command.includes('skills')) {
            return { response: "Navigating to skills section", action: 'navigate', target: 'skills' };
        }
    }
    
    if (command.includes('tell me about') || command.includes('what is')) {
        if (command.includes('yash') || command.includes('yourself')) {
            return { 
                response: "Yash Agarwal is an AI Engineer and Data Scientist specializing in machine learning, web development, and DevOps. He's currently pursuing BTech in AI & Data Science and has experience with Python, JavaScript, AWS, and Docker."
            };
        }
    }
    
    if (command.includes('show') || command.includes('display')) {
        if (command.includes('projects')) {
            return { response: "Displaying all projects", action: 'filter', target: 'all' };
        } else if (command.includes('ai') || command.includes('machine learning')) {
            return { response: "Showing AI and Machine Learning projects", action: 'filter', target: 'ai' };
        } else if (command.includes('web')) {
            return { response: "Showing web development projects", action: 'filter', target: 'web' };
        }
    }
    
    return { response: "I'm JARVIS, Yash's AI assistant. I can help you navigate the portfolio, filter projects, or answer questions about Yash's work. Try saying 'show projects' or 'tell me about Yash'." };
}

// Static routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Enhanced Portfolio Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Demo Mode'}`);
    console.log(`📝 Demo credentials: demo@example.com / password`);
});