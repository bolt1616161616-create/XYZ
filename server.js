const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

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
        lowercase: true
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
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
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

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
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

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            lastLogin: req.user.lastLogin
        }
    });
});

// Logout (client-side token removal)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    res.json({ message: 'Logout successful' });
});

// Protected route for projects
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        // Here you can add project data from database or return static data
        const projects = [
            {
                id: 1,
                title: 'MANASMITRA AI PLATFORM',
                description: 'Revolutionary AI-powered mental health platform with intelligent counselor matching and 24/7 support capabilities.',
                category: 'ai',
                tags: ['AI', 'NEURAL NETWORKS', 'HEALTHCARE', 'RESEARCH'],
                link: 'https://www.linkedin.com/search/results/all/?heroEntityKey=urn%3Ali%3Aorganization%3A104112688&keywords=Manas%20Mitra&origin=ENTITY_SEARCH_HOME_HISTORY',
                image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg'
            },
            {
                id: 2,
                title: 'INTERACTIVE WINDOW SYSTEM',
                description: 'Advanced window management interface with drag, resize, minimize, and maximize functionality.',
                category: 'web',
                tags: ['JAVASCRIPT', 'UI/UX', 'INTERACTIVE'],
                link: 'Port/Menu/HTMLTasks/draggable.html',
                image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'
            },
            {
                id: 3,
                title: 'CONTAINER ORCHESTRATION HUB',
                description: 'Comprehensive Docker management system with monitoring, deployment, and scaling automation.',
                category: 'devops',
                tags: ['DOCKER', 'ORCHESTRATION', 'MONITORING'],
                link: 'Port/Menu/docker.html',
                image: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg'
            },
            {
                id: 4,
                title: 'AWS COMMAND CENTER',
                description: 'Comprehensive AWS infrastructure management with automated scaling and monitoring.',
                category: 'aws',
                tags: ['AWS', 'BOTO3', 'AUTOMATION'],
                link: 'Port/Menu/AWSfiles/boto3.html',
                image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg'
            }
        ];
        
        res.json({ projects });
    } catch (error) {
        console.error('Projects fetch error:', error);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/projects', (req, res) => {
    res.sendFile(path.join(__dirname, 'projec.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});