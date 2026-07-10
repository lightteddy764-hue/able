require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the reverse proxy (Render/Heroku/etc.) so rate-limit & req.ip work correctly
app.set('trust proxy', 1);

// ===== SECURITY MIDDLEWARE =====
// Helmet — secure HTTP headers (relaxed CSP for inline scripts)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS — restrict origins in production
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Rate limiting — general (skips static assets so page loads don't burn the budget)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // ~130/min, plenty for normal browsing
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Don't rate-limit static files (HTML, CSS, JS, images)
        if (/\.(html|css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|map)$/i.test(req.path)) return true;
        if (req.path === '/' || req.path.startsWith('/images/') || req.path.startsWith('/uploads/')) return true;
        return false;
    },
    message: { error: 'Too many requests, please try again later' }
});
app.use(generalLimiter);

// Rate limiting — auth endpoints (stricter, but not painful during testing)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // up from 10 — still blocks brute force, friendlier for legitimate retries
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again in 15 minutes' }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

// JWT Helper
function generateToken(user) {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Auth Middleware
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ===== AUTH ROUTES =====

// Signup
app.post('/api/signup', authLimiter, async (req, res) => {
    try {
        const { name, email, password, whodasScore, severityLevel, whodasAnswers, gender, dateOfBirth, hobbies, interests } = req.body;

        // Input validation
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
        if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be 2-100 characters' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        // Check if user exists
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        // Calculate age from DOB
        let age;
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            gender: gender || '',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            age: age || undefined,
            hobbies: hobbies || [],
            interests: interests || [],
            assessment: {
                completed: whodasScore !== undefined,
                whodasScore: whodasScore || 0,
                severityLevel: severityLevel || '',
                whodasAnswers: whodasAnswers || {},
                completedAt: whodasScore !== undefined ? new Date() : null
            }
        });

        await user.save();
        const token = generateToken(user);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: user._id, name: user.name, email: user.email, assessment: user.assessment }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email?.toLowerCase?.().trim() });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        if (user.isBlocked) return res.status(403).json({ error: 'Account blocked. Contact support.' });

        // Reactivate if deactivated
        if (user.status === 'deactivated') {
            user.status = 'active';
            await user.save();
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, assessment: user.assessment }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user profile
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's recent activity
app.get('/api/me/activity', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('recentActivity careProgress').lean();
        res.json({
            recentActivity: (user.recentActivity || []).slice(-20).reverse(),
            careProgress: user.careProgress || {}
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update profile
app.put('/api/me', authMiddleware, async (req, res) => {
    try {
        const allowed = ['name', 'phone', 'bio', 'avatar', 'wellnessGoals', 'preferredSessionType', 'preferredSchedule'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        // Validation
        if (updates.name && (updates.name.length < 2 || updates.name.length > 100)) return res.status(400).json({ error: 'Name must be 2-100 characters' });
        if (updates.phone && updates.phone.length > 20) return res.status(400).json({ error: 'Phone too long' });
        if (updates.bio && updates.bio.length > 500) return res.status(400).json({ error: 'Bio max 500 characters' });
        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user settings (notifications, privacy, appearance, wellness preferences)
app.put('/api/me/settings', authMiddleware, async (req, res) => {
    try {
        const { notifications, privacy, appearance, wellnessGoals, preferredSessionType, preferredSchedule } = req.body;
        const updates = {};
        // Safe partial merge for nested objects (not overwrite)
        if (notifications) {
            const user = await User.findById(req.user.id).select('notifications').lean();
            updates.notifications = { ...(user.notifications || {}), ...notifications };
        }
        if (privacy) {
            const user = await User.findById(req.user.id).select('privacy').lean();
            updates.privacy = { ...(user.privacy || {}), ...privacy };
        }
        if (appearance) {
            const user = await User.findById(req.user.id).select('appearance').lean();
            updates.appearance = { ...(user.appearance || {}), ...appearance };
        }
        if (wellnessGoals) updates.wellnessGoals = wellnessGoals;
        if (preferredSessionType) updates.preferredSessionType = preferredSessionType;
        if (preferredSchedule) updates.preferredSchedule = preferredSchedule;
        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password — strong validation
app.put('/api/me/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
        // Strong password: 8+ chars, uppercase, lowercase, number, special
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!strongRegex.test(newPassword)) return res.status(400).json({ error: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' });
        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Safe data export — excludes sensitive internal fields
app.get('/api/me/export', authMiddleware, async (req, res) => {
    try {
        const { password: confirmPass } = req.query;
        if (!confirmPass) return res.status(400).json({ error: 'Password confirmation required. Add ?password=yourpassword' });
        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(confirmPass);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });
        // Export safe data only
        const exportData = await User.findById(req.user.id).select('-password -loginAttempts -lockUntil -__v').lean();
        delete exportData._id;
        // Add related data
        const Story = require('./models/Story');
        const stories = await Story.find({ author: req.user.id }).select('title category content createdAt status').lean();
        const { SelfCareCheckIn } = require('./models/SelfCare');
        const checkins = await SelfCareCheckIn.find({ userId: req.user.id }).select('-__v').lean();
        exportData.stories = stories;
        exportData.selfCareCheckins = checkins;
        res.json({ exportedAt: new Date(), data: exportData });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Deactivate account — requires password confirmation
app.put('/api/me/deactivate', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password required to deactivate' });
        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });
        user.status = 'deactivated';
        await user.save();
        res.json({ message: 'Account deactivated. You can reactivate by logging in again.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete account — requires password, removes all related data
app.delete('/api/me', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password required to delete account' });
        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });
        // Delete all related data
        const Story = require('./models/Story');
        const WellnessTask = require('./models/WellnessTask');
        const { SelfCareCheckIn } = require('./models/SelfCare');
        const { ChildProfile } = require('./models/ChildSupport');
        const { ParentingChallengeProgress } = require('./models/Parenting');
        await Promise.all([
            Story.deleteMany({ author: req.user.id }),
            WellnessTask.deleteMany({ user: req.user.id }),
            SelfCareCheckIn.deleteMany({ userId: req.user.id }),
            ChildProfile.deleteMany({ guardianUserId: req.user.id }),
            ParentingChallengeProgress.deleteMany({ userId: req.user.id }),
            ProfessionalSession.deleteMany({ userId: req.user.id })
        ]);
        // Remove user reactions/comments from other stories
        await Story.updateMany({}, { $pull: { 'reactions.inspired': req.user.id, 'reactions.relatable': req.user.id, 'reactions.hopeful': req.user.id, 'reactions.thankYou': req.user.id, 'comments': { user: req.user.id } } });
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account and all data permanently deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Upload user avatar
const userAvatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/professionals'),
    filename: (req, file, cb) => { const ext = file.originalname.split('.').pop(); cb(null, 'user-' + req.user.id + '-' + Date.now() + '.' + ext); }
});
const userAvatarUpload = multer({ storage: userAvatarStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) cb(null, true); else cb(new Error('Only JPG, PNG, WebP, GIF allowed')); } });

app.post('/api/me/avatar', authMiddleware, (req, res) => {
    userAvatarUpload.single('avatar')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        if (!req.file) return res.status(400).json({ error: 'No file provided' });
        const avatarUrl = '/uploads/professionals/' + req.file.filename;
        await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
        res.json({ message: 'Avatar uploaded', avatarUrl });
    });
});

// Save mood
app.post('/api/mood', authMiddleware, async (req, res) => {
    try {
        const { mood } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if mood already logged today — update instead of adding duplicate
        const user = await User.findById(req.user.id);
        const todayMood = user.moodHistory.find(m => {
            const mDate = new Date(m.date);
            mDate.setHours(0, 0, 0, 0);
            return mDate.getTime() === today.getTime();
        });
        
        if (todayMood) {
            todayMood.mood = mood;
        } else {
            user.moodHistory.push({ mood, date: new Date() });
        }
        await user.save();
        res.json({ message: 'Mood saved', mood });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get mood history for current user
app.get('/api/mood/history', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('moodHistory').lean();
        res.json({ moodHistory: user.moodHistory || [] });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== WELLNESS TASKS API =====
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const WellnessTask = require('./models/WellnessTask');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let todayTasks = await WellnessTask.findOne({ user: req.user.id, date: today });
        
        if (!todayTasks) {
            // Create default tasks for today
            todayTasks = new WellnessTask({
                user: req.user.id,
                date: today,
                tasks: [
                    { title: 'Drink 8 glasses of water', completed: false },
                    { title: 'Complete morning check-in', completed: false },
                    { title: '10-minute breathing exercise', completed: false },
                    { title: 'Journal reflection', completed: false },
                    { title: '30 min screen-free time', completed: false }
                ]
            });
            await todayTasks.save();
        }
        
        res.json({ tasks: todayTasks.tasks, date: todayTasks.date });
    } catch (error) {
        console.error('Tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/tasks/:index', authMiddleware, async (req, res) => {
    try {
        const WellnessTask = require('./models/WellnessTask');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const index = parseInt(req.params.index);
        
        const todayTasks = await WellnessTask.findOne({ user: req.user.id, date: today });
        if (!todayTasks || !todayTasks.tasks[index]) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Only allow checking (not unchecking)
        if (todayTasks.tasks[index].completed) {
            return res.status(400).json({ error: 'Task already completed today. You can uncheck it tomorrow!' });
        }
        
        todayTasks.tasks[index].completed = true;
        todayTasks.tasks[index].completedAt = new Date();
        await todayTasks.save();
        
        // Update user's completed tasks count
        await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: 1 } });
        
        res.json({ message: 'Task completed!', tasks: todayTasks.tasks });
    } catch (error) {
        console.error('Task update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== DASHBOARD DATA API =====
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const WellnessTask = require('./models/WellnessTask');
        const user = await User.findById(req.user.id).select('-password').lean();
        
        // Get today's mood
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMood = user.moodHistory?.find(m => {
            const mDate = new Date(m.date);
            mDate.setHours(0, 0, 0, 0);
            return mDate.getTime() === today.getTime();
        });
        
        // Get last 7 days mood data for chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weekMoods = (user.moodHistory || []).filter(m => new Date(m.date) >= sevenDaysAgo);
        
        // Get today's tasks
        const todayTasks = await WellnessTask.findOne({ user: req.user.id, date: today }).lean();
        const tasksCompleted = todayTasks ? todayTasks.tasks.filter(t => t.completed).length : 0;
        const totalTasks = todayTasks ? todayTasks.tasks.length : 5;
        
        // Calculate streak
        let streak = 0;
        const sortedMoods = (user.moodHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        const checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const hasEntry = sortedMoods.some(m => {
                const mDate = new Date(m.date);
                mDate.setHours(0, 0, 0, 0);
                return mDate.getTime() === checkDate.getTime();
            });
            if (hasEntry) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
        }
        
        // Calculate wellness score (based on mood + tasks)
        const moodScores = { great: 100, good: 80, okay: 60, low: 40, struggling: 20 };
        const recentMoods = (user.moodHistory || []).slice(-7);
        let wellnessScore = 70; // default
        if (recentMoods.length > 0) {
            const avg = recentMoods.reduce((sum, m) => sum + (moodScores[m.mood] || 60), 0) / recentMoods.length;
            wellnessScore = Math.round(avg);
        }
        
        res.json({
            user: { name: user.name, gender: user.gender, plan: user.plan, streak, completedTasks: user.completedTasks, sessionsBooked: user.sessionsBooked },
            todayMood: todayMood?.mood || null,
            weekMoods,
            wellnessScore,
            tasksCompleted,
            totalTasks
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== ADMIN: Mood Analytics API =====
app.get('/admin/api/mood-analytics', adminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get all users with mood data
        const users = await User.find({ 'moodHistory.0': { $exists: true } }).select('moodHistory name').lean();
        
        // Aggregate mood data by day
        const dailyMoods = {};
        const moodCounts = { great: 0, good: 0, okay: 0, low: 0, struggling: 0 };
        let totalEntries = 0;
        
        users.forEach(user => {
            (user.moodHistory || []).forEach(entry => {
                const entryDate = new Date(entry.date);
                if (entryDate >= startDate) {
                    const dayKey = entryDate.toISOString().split('T')[0];
                    if (!dailyMoods[dayKey]) dailyMoods[dayKey] = { great: 0, good: 0, okay: 0, low: 0, struggling: 0, total: 0 };
                    dailyMoods[dayKey][entry.mood] = (dailyMoods[dayKey][entry.mood] || 0) + 1;
                    dailyMoods[dayKey].total++;
                    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
                    totalEntries++;
                }
            });
        });
        
        // Calculate average wellness score per day
        const moodScores = { great: 100, good: 80, okay: 60, low: 40, struggling: 20 };
        const dailyScores = Object.entries(dailyMoods).map(([date, data]) => {
            const score = Object.entries(data)
                .filter(([k]) => k !== 'total')
                .reduce((sum, [mood, count]) => sum + (moodScores[mood] || 60) * count, 0) / data.total;
            return { date, score: Math.round(score), total: data.total };
        }).sort((a, b) => a.date.localeCompare(b.date));
        
        res.json({
            totalEntries,
            totalUsers: users.length,
            moodDistribution: moodCounts,
            dailyScores,
            dailyMoods
        });
    } catch (error) {
        console.error('Admin mood analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Task Analytics
app.get('/admin/api/task-analytics', adminAuth, async (req, res) => {
    try {
        const WellnessTask = require('./models/WellnessTask');
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        const taskRecords = await WellnessTask.find({ date: { $gte: startDate } }).populate('user', 'name').lean();
        
        // Daily completion rates
        const dailyCompletion = {};
        taskRecords.forEach(record => {
            const dayKey = new Date(record.date).toISOString().split('T')[0];
            if (!dailyCompletion[dayKey]) dailyCompletion[dayKey] = { completed: 0, total: 0, users: 0 };
            const completed = record.tasks.filter(t => t.completed).length;
            dailyCompletion[dayKey].completed += completed;
            dailyCompletion[dayKey].total += record.tasks.length;
            dailyCompletion[dayKey].users++;
        });
        
        const dailyRates = Object.entries(dailyCompletion).map(([date, data]) => ({
            date,
            rate: Math.round((data.completed / data.total) * 100),
            users: data.users,
            completed: data.completed,
            total: data.total
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        // Most/least completed tasks
        const taskStats = {};
        taskRecords.forEach(record => {
            record.tasks.forEach(t => {
                if (!taskStats[t.title]) taskStats[t.title] = { completed: 0, total: 0 };
                taskStats[t.title].total++;
                if (t.completed) taskStats[t.title].completed++;
            });
        });
        
        res.json({ dailyRates, taskStats, totalRecords: taskRecords.length });
    } catch (error) {
        console.error('Admin task analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== AI CHATBOT ENDPOINT =====
// Crisis detection keywords
const CRISIS_KEYWORDS = [
    'kill myself', 'suicide', 'want to die', 'end my life', 'no reason to live',
    'hurt myself', 'self harm', 'self-harm', 'cutting myself',
    'want to disappear', 'better off dead', 'nobody cares', 'give up on life',
    'overdose', 'jump off', 'hang myself', 'slit my', 'end it all'
];

function detectCrisis(message) {
    const lower = (message || '').toLowerCase();
    return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

const CRISIS_RESPONSE = `🚨 I'm really concerned about what you're sharing. You matter, and help is available right now.

📞 **Emergency Services**: 911
📞 **Suicide & Crisis Lifeline**: 988 (call or text, 24/7)
💬 **Crisis Text Line**: Text HOME to 741741
📞 **SAMHSA Helpline**: 1-800-662-4357 (free, 24/7)

Please reach out to one of these services — trained counselors are ready to help you right now. You don't have to face this alone.

⚠️ I am an AI assistant, not a therapist or emergency service. If you are in immediate danger, please call 911.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory, userData } = req.body;

        // SAFETY: Crisis detection — always takes priority
        if (detectCrisis(message)) {
            return res.json({ response: CRISIS_RESPONSE, source: 'crisis-safety' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.json({ response: getFallbackResponse(message, userData), source: 'fallback' });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: buildPrompt(message, conversationHistory || [], userData || {}) }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return res.json({ response: data.candidates[0].content.parts[0].text, source: 'ai' });
        } else {
            console.error('Gemini API error:', JSON.stringify(data));
            return res.json({ response: getFallbackResponse(message, userData), source: 'fallback' });
        }
    } catch (error) {
        console.error('AI Error:', error.message);
        res.json({ response: getFallbackResponse(req.body.message, req.body.userData), source: 'fallback' });
    }
});

// ============================================================
// MUSIC — Wellness Music Videos (YouTube embed only, never downloaded/stored)
// ============================================================
const MusicVideo = require('./models/MusicVideo');

// Extract YouTube video ID from various URL formats
function extractYoutubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/ // raw ID
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

// ----- Public: List active music videos -----
app.get('/api/music', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };
        if (category) filter.category = category;
        const videos = await MusicVideo.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.json({ videos });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Public: Single video detail -----
app.get('/api/music/:id', async (req, res) => {
    try {
        const video = await MusicVideo.findOne({ _id: req.params.id, isActive: true }).lean();
        if (!video) return res.status(404).json({ error: 'Video not found' });
        res.json(video);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Admin: List all music videos (active + inactive) -----
app.get('/admin/api/music', adminAuth, async (req, res) => {
    try {
        const videos = await MusicVideo.find({}).sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.json({ videos });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Admin: Create music video -----
app.post('/admin/api/music', adminAuth, async (req, res) => {
    try {
        const { title, description, category, duration, purpose, youtubeUrl, thumbnailUrl, isActive, displayOrder } = req.body;
        if (!title || !category || !youtubeUrl) return res.status(400).json({ error: 'Title, category, and YouTube URL are required' });
        const videoId = extractYoutubeId(youtubeUrl);
        if (!videoId) return res.status(400).json({ error: 'Could not extract a valid YouTube video ID from that URL' });
        const video = await MusicVideo.create({
            title, description: description || '', category,
            duration: duration || '', purpose: purpose || '',
            youtubeUrl, youtubeVideoId: videoId,
            thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            isActive: isActive !== false,
            displayOrder: displayOrder || 0
        });
        res.status(201).json(video);
    } catch (e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

// ----- Admin: Update music video -----
app.put('/admin/api/music/:id', adminAuth, async (req, res) => {
    try {
        const { title, description, category, duration, purpose, youtubeUrl, thumbnailUrl, isActive, displayOrder } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;
        if (duration !== undefined) updates.duration = duration;
        if (purpose !== undefined) updates.purpose = purpose;
        if (isActive !== undefined) updates.isActive = isActive;
        if (displayOrder !== undefined) updates.displayOrder = displayOrder;
        if (youtubeUrl !== undefined) {
            const videoId = extractYoutubeId(youtubeUrl);
            if (!videoId) return res.status(400).json({ error: 'Could not extract a valid YouTube video ID from that URL' });
            updates.youtubeUrl = youtubeUrl;
            updates.youtubeVideoId = videoId;
            if (!thumbnailUrl) updates.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;

        const video = await MusicVideo.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!video) return res.status(404).json({ error: 'Not found' });
        res.json(video);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Admin: Delete music video -----
app.delete('/admin/api/music/:id', adminAuth, async (req, res) => {
    try {
        const video = await MusicVideo.findByIdAndDelete(req.params.id);
        if (!video) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Video deleted' });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ===== WELLNESS PLAYGROUND — AI Creative Activities =====
app.post('/api/playground/generate', authMiddleware, async (req, res) => {
    try {
        const { prompt, activity } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });

        const apiKey = process.env.GEMINI_API_KEY;
        let responseText = '';

        if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
            try {
                const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.9, maxOutputTokens: 400 }
                    })
                });
                const data = await aiRes.json();
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } catch(e) { console.error('Playground AI error:', e.message); }
        }

        // Fallback responses
        if (!responseText) {
            const fallbacks = {
                poem: 'In stillness I find my breath,\nA gentle rhythm, soft and deep.\nThe world may rush and pull and press,\nBut here, within, I choose to keep\nA moment just for me — to rest,\nTo honor all I feel inside.\nNo judgment here, no need to prove,\nJust gratitude for being alive.',
                dream: 'Dreams often reflect our subconscious processing daily emotions and unresolved thoughts. The images you described suggest your mind is working through themes of transition and growth. Pay attention to recurring symbols — they often point to what needs your conscious attention. Consider journaling about how the dream made you feel when you woke up.',
                imagination: 'Your imagination reveals a creative and introspective mind. The themes you described suggest a deep desire for connection and meaning. This kind of rich inner life is a strength — it indicates emotional intelligence and the ability to envision possibilities beyond current circumstances. Channel this into creative expression or goal-setting.',
                psych: 'Based on your reflections, you show strong self-awareness and emotional depth. You appear to value authenticity and meaningful connections. Your coping style leans toward introspection, which serves you well but may benefit from balance with outward expression. Growth suggestion: try sharing one vulnerable thought with someone you trust this week.'
            };
            responseText = fallbacks[activity] || fallbacks.poem;
        }

        // Award points
        const scoreGained = activity === 'psych' ? 8 : 5;
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { completedTasks: 1, 'careProgress.selfCareTasksCompleted': 1 },
            $push: { recentActivity: { $each: [{ type: 'playground', title: 'Playground: ' + (activity || 'creative'), description: 'Completed a wellness activity', icon: '🎨', page: 'playground', createdAt: new Date() }], $slice: -20 } }
        });

        res.json({ response: responseText, scoreGained });
    } catch(e) { console.error('Playground error:', e); res.status(500).json({ error: 'Server error' }); }
});

// ===== MIRA — Personalized AI Assistant (Dashboard Avatar Chat) =====

// Bot's own name/persona is gender-matched to the user (same pairing as the dashboard avatar)
function getBotName(user) {
    return user.gender === 'male' ? 'Arjun' : 'Mira';
}

// Smart fallback when Gemini is unavailable — uses real user data
function generateMiraFallback(firstName, user, message) {
    const botName = getBotName(user);
    const msg = (message || '').toLowerCase();
    const hobbies = user.hobbies || [];
    const interests = user.interests || [];
    const streak = user.streak || 0;
    const recentMoods = (user.moodHistory || []).slice(-3).map(m => m.mood);
    const lastMood = recentMoods[recentMoods.length - 1] || '';

    // Greeting patterns
    if (/^(hi|hey|hello|hii|sup|yo|good morning|good evening)/i.test(msg)) {
        const greets = [
            `Hey ${firstName}! 😊 Great to see you. How's your day going?`,
            `Hi ${firstName}! I'm ${botName}, your wellness buddy. What's on your mind today?`,
            `Hello ${firstName}! 🌟 Ready to make today count?`
        ];
        return { response: greets[Math.floor(Math.random() * greets.length)], mood: 'greeting' };
    }

    // Name/about me
    if (/my name|who am i|about me/i.test(msg)) {
        let resp = `You're ${user.name || firstName}! `;
        if (hobbies.length) resp += `I know you enjoy ${hobbies.slice(0, 3).join(', ')}. `;
        if (interests.length) resp += `You're interested in ${interests.slice(0, 2).join(' and ')}. `;
        resp += `I'm here to support your wellness journey. 💛`;
        return { response: resp, mood: 'present' };
    }

    // Progress/streak
    if (/progress|streak|how am i doing|score|stats/i.test(msg)) {
        let resp = streak > 0 ? `You're on a ${streak}-day streak, ${firstName}! 🔥 ` : `Start logging your mood daily to build a streak! `;
        if (lastMood) resp += `Your last mood was "${lastMood}". `;
        resp += streak >= 7 ? `Incredible consistency — keep it going!` : `Every day you show up matters.`;
        return { response: resp, mood: streak > 3 ? 'celebrate' : 'present' };
    }

    // Mood/feelings
    if (/mood|feel|stressed|anxious|sad|happy|great|low|struggling|tired|overwhelmed/i.test(msg)) {
        if (/stressed|anxious|overwhelmed/i.test(msg)) {
            return { response: `I hear you, ${firstName}. Try a quick breathing exercise — 4 counts in, hold 4, out for 6. Even 2 minutes can shift things. 🧘`, mood: 'empathy' };
        }
        if (/sad|low|struggling|tired/i.test(msg)) {
            return { response: `That takes courage to share, ${firstName}. Be gentle with yourself today. A short walk or calling a friend can help. You're not alone. 💛`, mood: 'empathy' };
        }
        if (/happy|great|good|amazing/i.test(msg)) {
            return { response: `Love that energy, ${firstName}! 🌟 Ride this wave — maybe try something new from your hobbies today?`, mood: 'celebrate' };
        }
        return { response: `Thanks for checking in. Try logging your mood on the dashboard — it helps me understand you better over time.`, mood: 'talk' };
    }

    // Hobbies
    if (/hobby|hobbies|interests|what do i like|bored|something to do/i.test(msg)) {
        if (hobbies.length) {
            const h = hobbies[Math.floor(Math.random() * hobbies.length)];
            return { response: `How about some ${h} today, ${firstName}? You listed it as one of your favorites! Even 15 minutes can lift your mood. 🌱`, mood: 'present' };
        }
        return { response: `Try exploring the Community section — there are circles for yoga, meditation, creative arts, and more!`, mood: 'present' };
    }

    // Suggestions/what to do
    if (/suggest|recommend|what should i|help me|what to do|tip/i.test(msg)) {
        const suggestions = [
            `Try a 5-minute breathing session on Body-Mind — it's a quick reset. 🫁`,
            `Have you checked the Community page? Joining a circle can boost your mood.`,
            `How about logging your mood? Tracking patterns helps you understand yourself better.`,
            `The Self-Care section has quick activities tailored to how you're feeling.`,
            hobbies.length ? `Since you love ${hobbies[0]}, maybe dedicate 20 minutes to it today?` : `Try exploring the Healing Zone — real therapists are available.`
        ];
        return { response: `${firstName}, here's an idea: ${suggestions[Math.floor(Math.random() * suggestions.length)]}`, mood: 'present' };
    }

    // Therapy/professional help
    if (/therap|counselor|professional|talk to someone|need help/i.test(msg)) {
        return { response: `If you'd like to talk to a professional, check the Healing Zone — we have verified therapists ready to help. No judgment, just support. 💚`, mood: 'empathy' };
    }

    // Default — personalized with user context
    const defaults = [
        `I'm here for you, ${firstName}! You can ask me about your progress, mood tips, or what to do next.`,
        `${firstName}, try telling me how you feel today, or ask for a wellness suggestion. I'll do my best! 🌿`,
        `Not sure what to ask? Try: "What should I do today?" or "How's my progress?" — I'll personalize it for you!`
    ];
    return { response: defaults[Math.floor(Math.random() * defaults.length)], mood: 'talk' };
}

app.post('/api/mira/chat', authMiddleware, async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        // Crisis check
        if (detectCrisis(message)) {
            return res.json({ response: 'I care about your safety. If you are in crisis, please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741. You are not alone. 💛', mood: 'concern' });
        }

        // Gather user context
        const user = await User.findById(req.user.id).select('name gender age hobbies interests wellnessGoals moodHistory streak completedTasks sessionsBooked careProgress assessment').lean();
        const recentMoods = (user.moodHistory || []).slice(-7).map(m => m.mood);
        const moodStr = recentMoods.length ? recentMoods.join(', ') : 'not logged yet';

        const userContext = `
User profile:
- Name: ${user.name}
- Gender: ${user.gender || 'not specified'}
- Age: ${user.age || 'unknown'}
- Hobbies: ${(user.hobbies || []).join(', ') || 'none listed'}
- Interests: ${(user.interests || []).join(', ') || 'none listed'}
- Wellness goals: ${(user.wellnessGoals || []).join(', ') || 'general wellness'}
- Recent moods (last 7 days): ${moodStr}
- Day streak: ${user.streak || 0}
- Tasks completed: ${user.completedTasks || 0}
- Sessions booked: ${user.sessionsBooked || 0}
- WHODAS severity: ${user.assessment?.severityLevel || 'not assessed'}
`;

        const botName = getBotName(user);
        const systemPrompt = `You are ${botName}, ABLE's warm and supportive wellness assistant. You live inside the user's dashboard as their personal wellness buddy.

Rules:
- Be warm, supportive, concise (2-3 sentences max per response).
- Use the user's first name naturally.
- Reference their hobbies, interests, moods, and progress when relevant.
- Encourage small wins and consistency.
- Never diagnose or prescribe medication.
- If they seem stressed, suggest a specific ABLE feature (breathing exercise, self-care check-in, community circle, etc.).
- Stay conversational and friendly — like a kind friend, not a robot.
- Use occasional emojis but don't overdo it.

${userContext}

Conversation so far:
${(history || []).slice(-6).map(h => `${h.role}: ${h.text}`).join('\n')}
User: ${message}
${botName}:`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            const firstName = (user.name || '').split(' ')[0] || 'there';
            return res.json(generateMiraFallback(firstName, user, message));
        }

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 150 }
            })
        });
        const data = await aiRes.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Mira Gemini error:', JSON.stringify(data).slice(0, 500));
            // Fall back to smart templates
            const firstName = (user.name || '').split(' ')[0] || 'there';
            return res.json(generateMiraFallback(firstName, user, message));
        }
        const text = data.candidates[0].content.parts[0].text;

        // Determine mood of response for avatar pose
        let mood = 'talk';
        const lower = text.toLowerCase();
        if (/proud|great|amazing|wonderful|streak|congrat/i.test(lower)) mood = 'celebrate';
        else if (/try|suggest|recommend|how about|breath|exercise/i.test(lower)) mood = 'present';
        else if (/hear you|understand|tough|hard|sorry/i.test(lower)) mood = 'empathy';
        else if (/hi|hey|hello|welcome|morning|evening/i.test(lower)) mood = 'greeting';

        res.json({ response: text, mood });
    } catch (e) {
        console.error('Mira chat error:', e.message);
        res.json({ response: "I'm having a moment — try again in a sec! 🌿", mood: 'talk' });
    }
});

// AI Prompt Builder
function buildPrompt(message, history, userData) {
    return `You are ABLE Wellness Assistant, a compassionate mental health support chatbot for the ABLE platform.

GUIDELINES:
- Be warm, empathetic, and informative
- Keep responses 3-5 sentences, detailed but concise
- Focus on ABLE's specific services and their features
- Never provide medical diagnoses or medication advice
- If someone asks about a specific service, give detailed features and benefits
- Use the user's name when appropriate

ABLE SERVICES (provide specific details when asked):
1. Enable-Healing Zone: Licensed & verified therapists, personalized sessions, flexible scheduling, secure communication. For depression, anxiety, trauma, PTSD, relationships.
2. Capable-Body-Mind Connection: Nutritional advice for mental wellness, guided yoga sessions, breathing exercises, routine management. Benefits: stress reduction, focus, relaxation, balanced lifestyle.
3. Suitable-Community Circle: Mental Spa (immersive relaxation), Wellness Dating (find like-minded people), Wellness Meetups (group activities). Benefits: belonging, meaningful relationships, shared growth.
4. Viable-Youth Support: For ages 13-24. Aptitude testing, career advising, support for anxiety, body-image issues, bullying. Benefits: guidance, emotional support, healthy development.
5. Valuable-Voice Platform: Share personal stories, anonymous sharing, forums/discussions, community feedback. Benefits: feeling heard, inspiring others, learning from experiences.

USER CONTEXT: Name: ${userData.name || 'Anonymous'}, Age: ${userData.age || 'N/A'}, Severity Level: ${userData.severityLevel || 'Not assessed'}

CONVERSATION HISTORY:
${(history || []).slice(-6).map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')}

USER MESSAGE: ${message}

Respond helpfully and specifically. If they ask about a service, describe its features and benefits. If they want to sign up, explain the process:`;
}

// Fallback responses - matches quick-reply button values
function getFallbackResponse(message, userData) {
    const lowerMessage = (message || '').toLowerCase();
    const name = userData?.name || 'there';
    
    if (lowerMessage.includes('enable') || lowerMessage.includes('healing zone') || lowerMessage.includes('find a therapist')) {
        return `🌸 Our Enable-Healing Zone connects you with world-class licensed therapists, ${name}. They specialize in depression, anxiety, trauma, PTSD, and more. Features include personalized sessions, flexible scheduling, and secure communication. Sign up to browse therapist profiles and book your first session!`;
    }
    if (lowerMessage.includes('capable') || lowerMessage.includes('body-mind') || lowerMessage.includes('body mind') || lowerMessage.includes('yoga') || lowerMessage.includes('nutrition') || lowerMessage.includes('breathing')) {
        return `🧘 The Capable-Body-Mind Connection offers holistic wellness: nutritional advice for mental wellness, guided yoga sessions, breathing exercises for calm, and routine management. It's perfect for reducing stress, improving focus, and building a balanced lifestyle.`;
    }
    if (lowerMessage.includes('suitable') || lowerMessage.includes('community') || lowerMessage.includes('circle') || lowerMessage.includes('meetup') || lowerMessage.includes('dating') || lowerMessage.includes('spa')) {
        return `👥 The Suitable-Community Circle includes: Mental Spa for immersive relaxation, Wellness Dating to meet like-minded people, and Wellness Meetups for group wellness activities. It's all about building meaningful connections and feeling supported, ${name}.`;
    }
    if (lowerMessage.includes('viable') || lowerMessage.includes('youth') || lowerMessage.includes('career') || lowerMessage.includes('aptitude')) {
        return `🎓 Viable-Youth Support is designed for ages 13-24. It includes aptitude testing, career advising, and wellness support for anxiety, body-image issues, and bullying. Great for building confidence and finding direction!`;
    }
    if (lowerMessage.includes('valuable') || lowerMessage.includes('voice') || lowerMessage.includes('story') || lowerMessage.includes('share') || lowerMessage.includes('forum')) {
        return `💬 The Valuable-Voice Platform lets you share your wellness journey, read inspiring stories, post anonymously, and participate in forums. Your story matters — it can heal both you and others who need to hear it, ${name}.`;
    }
    if (lowerMessage.includes('sign up') || lowerMessage.includes('register') || lowerMessage.includes('get started') || lowerMessage.includes('join') || lowerMessage.includes('account')) {
        return `📝 Getting started is easy, ${name}! Click "Start Your Wellness Journey" on the homepage, fill in your name and email, create a password, and you're in. You'll get access to all our wellness tools including therapists, yoga, community events, and more.`;
    }
    if (lowerMessage.includes('crisis') || lowerMessage.includes('emergency') || lowerMessage.includes('resource')) {
        return `📞 Crisis Resources: National Suicide Prevention Lifeline: 988 | Crisis Text Line: Text HOME to 741741 | SAMHSA: 1-800-662-4357 (free, 24/7) | Emergency: 911. You're not alone, ${name}. Help is always available. 💛`;
    }
    if (lowerMessage.includes('all services') || lowerMessage.includes('what do you offer')) {
        return `Here are ABLE's 5 wellness services: 🌸 Enable-Healing Zone (therapists), 🧘 Capable-Body-Mind (yoga, nutrition), 👥 Suitable-Community (spa, meetups, dating), 🎓 Viable-Youth (aptitude, career), 💬 Valuable-Voice (stories, forums). Which interests you most, ${name}?`;
    }
    if (lowerMessage.includes('thank') || lowerMessage.includes('bye')) {
        return `You're welcome, ${name}! Remember, ABLE is always here for you. Take care and don't hesitate to come back anytime. Wishing you wellness and peace! 🌟`;
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `I can help you with: 🧭 Exploring our 5 wellness services, 📋 Taking the WHODAS 2.0 assessment, 📞 Finding crisis resources, 📝 Getting started with ABLE, and answering questions about mental wellness. What would you like to do, ${name}?`;
    }
    return `I'd love to help you, ${name}! I can tell you about our wellness services (therapy, yoga, community, youth support, stories), help you sign up, or provide crisis resources. What interests you most?`;
}

// ===== PUBLIC STORIES API =====
app.get('/api/stories', async (req, res) => {
    try {
        const Story = require('./models/Story');
        const stories = await Story.find({ status: 'published' }).sort({ createdAt: -1 }).limit(50).lean();
        res.json({ stories });
    } catch(e) {
        console.error('Stories fetch error:', e);
        res.json({ stories: [] });
    }
});

// User submits a story (goes to pending review)
app.post('/api/stories', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const { title, category, content, image } = req.body;
        const user = await User.findById(req.user.id);
        
        const story = new Story({
            title,
            category,
            content,
            image: image || '',
            author: user._id,
            authorName: user.name,
            isAnonymous: false,
            status: 'pending' // needs admin approval
        });
        await story.save();
        res.json({ message: 'Story submitted for review', story });
    } catch(e) {
        console.error('Story submit error:', e);
        res.status(500).json({ error: 'Failed to submit story' });
    }
});

// Get single story by ID
app.get('/api/stories/:id', async (req, res) => {
    try {
        const Story = require('./models/Story');
        const story = await Story.findById(req.params.id).populate('author', 'name').populate('comments.user', 'name').lean();
        if (!story) return res.status(404).json({ error: 'Story not found' });
        // Increment read count
        await Story.findByIdAndUpdate(req.params.id, { $inc: { readCount: 1 } });
        story.readCount = (story.readCount || 0) + 1;
        
        // Check if user has reacted (if token provided)
        let userReactions = [];
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                if (userId) {
                    ['inspired','relatable','hopeful','thankYou'].forEach(r => {
                        if (story.reactions[r]?.some(id => id.toString() === userId)) {
                            userReactions.push(r);
                        }
                    });
                }
            } catch(e) {} // ignore invalid token for public view
        }
        
        res.json({ story, userReactions });
    } catch(e) {
        console.error('Story fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch story' });
    }
});

// React to a story
app.post('/api/stories/:id/react', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const { reaction } = req.body; // inspired, relatable, hopeful, thankYou
        const validReactions = ['inspired', 'relatable', 'hopeful', 'thankYou'];
        if (!validReactions.includes(reaction)) return res.status(400).json({ error: 'Invalid reaction' });
        
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found' });
        
        const userId = req.user.id;
        const reactionArray = story.reactions[reaction];
        const index = reactionArray.findIndex(id => id.toString() === userId);
        
        if (index > -1) {
            reactionArray.splice(index, 1); // Remove reaction (toggle off)
        } else {
            reactionArray.push(userId); // Add reaction
        }
        
        await story.save();
        res.json({ 
            message: index > -1 ? 'Reaction removed' : 'Reaction added',
            toggled: index === -1,
            reactions: {
                inspired: story.reactions.inspired.length,
                relatable: story.reactions.relatable.length,
                hopeful: story.reactions.hopeful.length,
                thankYou: story.reactions.thankYou.length
            }
        });
    } catch(e) {
        console.error('React error:', e);
        res.status(500).json({ error: 'Failed to react' });
    }
});

// Add comment to a story
app.post('/api/stories/:id/comment', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const { text, isAnonymous } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
        
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found' });
        
        story.comments.push({ user: req.user.id, text: text.trim(), isAnonymous: !!isAnonymous });
        await story.save();
        
        const populated = await Story.findById(req.params.id).populate('comments.user', 'name').lean();
        res.json({ message: 'Comment added', comments: populated.comments });
    } catch(e) {
        console.error('Comment error:', e);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// User gets their own stories
app.get('/api/my-stories', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const stories = await Story.find({ author: req.user.id }).sort({ createdAt: -1 }).lean();
        res.json({ stories });
    } catch(e) {
        res.json({ stories: [] });
    }
});

// Edit own story (only draft/pending)
app.put('/api/stories/:id', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const story = await Story.findOne({ _id: req.params.id, author: req.user.id, status: { $in: ['pending', 'draft'] } });
        if (!story) return res.status(404).json({ error: 'Story not found or cannot be edited' });
        const { title, category, content, image } = req.body;
        if (title) story.title = title;
        if (category) story.category = category;
        if (content) story.content = content;
        if (image !== undefined) story.image = image;
        await story.save();
        res.json({ message: 'Story updated', story });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Delete own story (only draft/pending)
app.delete('/api/stories/:id', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const story = await Story.findOne({ _id: req.params.id, author: req.user.id, status: { $in: ['pending', 'draft'] } });
        if (!story) return res.status(404).json({ error: 'Story not found or cannot be deleted' });
        await Story.findByIdAndDelete(req.params.id);
        res.json({ message: 'Story deleted' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Report a story
app.post('/api/stories/:id/report', authMiddleware, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const { reason } = req.body;
        await Story.findByIdAndUpdate(req.params.id, { $inc: { reportCount: 1 }, isReported: true });
        res.json({ message: 'Story reported. Our team will review it.' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Bookmark a story
app.post('/api/stories/:id/bookmark', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.bookmarkedStories) user.bookmarkedStories = [];
        const idx = user.bookmarkedStories.indexOf(req.params.id);
        if (idx > -1) { user.bookmarkedStories.splice(idx, 1); await user.save(); return res.json({ message: 'Bookmark removed', bookmarked: false }); }
        user.bookmarkedStories.push(req.params.id);
        await user.save();
        res.json({ message: 'Story bookmarked!', bookmarked: true });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ===== ADMIN ROUTES =====
const Admin = require('./models/Admin');
const AuditLog = require('./models/AuditLog');

// Audit log helper
async function logAudit(req, action, targetType, targetId, details) {
    try {
        await AuditLog.create({
            adminId: req.adminUser?._id,
            adminUsername: req.adminUser?.username || 'unknown',
            action, targetType, targetId,
            details: typeof details === 'string' ? details : JSON.stringify(details),
            ip: req.ip || req.connection?.remoteAddress
        });
    } catch(e) { console.error('Audit log error:', e.message); }
}

app.post('/admin/api/login', authLimiter, async (req, res) => {
    try {
        const { user, pass } = req.body;
        if (!user || !pass) return res.status(400).json({ error: 'Username and password required' });

        const admin = await Admin.findOne({ username: user.toLowerCase().trim() });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        // Check lockout
        if (admin.isLocked()) {
            return res.status(423).json({ error: 'Account locked. Try again later.' });
        }

        const isMatch = await admin.comparePassword(pass);
        if (!isMatch) {
            // Increment failed attempts
            admin.loginAttempts += 1;
            if (admin.loginAttempts >= 5) {
                admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock 30 min
            }
            await admin.save();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!admin.isActive) return res.status(403).json({ error: 'Account disabled' });

        // Reset attempts on successful login
        admin.loginAttempts = 0;
        admin.lockUntil = null;
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, role: admin.role, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, role: admin.role });
    } catch(e) {
        console.error('Admin login error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

function adminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.role || !['superadmin', 'admin', 'moderator'].includes(decoded.role)) {
            return res.status(403).json({ error: 'Not admin' });
        }
        req.adminUser = decoded;
        next();
    } catch(e) { res.status(401).json({ error: 'Invalid token' }); }
}

// Admin: Get audit logs
app.get('/admin/api/audit-logs', adminAuth, async (req, res) => {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ logs });
});

app.get('/admin/api/dashboard', adminAuth, async (req, res) => {
    try {
        const Story = require('./models/Story');
        const Therapist = require('./models/Therapist');
        const Session = require('./models/Session');
        const { Community } = require('./models/Community');

        const [users, stories, therapists, communities, sessions] = await Promise.all([
            User.find().sort({ createdAt: -1 }).limit(50).select('-password').lean(),
            Story.find().sort({ createdAt: -1 }).limit(20).populate('author', 'name').lean(),
            Therapist.find().sort({ rating: -1 }).lean(),
            Community.countDocuments(),
            Session.countDocuments()
        ]);

        res.json({
            counts: { users: users.length, stories: stories.length, therapists: therapists.length, communities, sessions },
            users, stories, therapists
        });
    } catch(e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/admin/api/users/:id', adminAuth, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

app.put('/admin/api/users/:id/block', adminAuth, async (req, res) => {
    const { isBlocked } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isBlocked });
    res.json({ message: isBlocked ? 'User blocked' : 'User unblocked' });
});

app.put('/admin/api/users/:id/plan', adminAuth, async (req, res) => {
    const { plan } = req.body;
    await User.findByIdAndUpdate(req.params.id, { plan });
    res.json({ message: 'Plan updated' });
});

app.delete('/admin/api/stories/:id', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

// Stories CRUD
app.get('/admin/api/stories', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    const stories = await Story.find().sort({ createdAt: -1 }).populate('author', 'name').lean();
    res.json({ stories });
});

app.post('/admin/api/stories', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    const { title, category, authorName, content, readTime, isAnonymous, isFeatured, image } = req.body;
    const story = new Story({
        title, category, content, readTime, isAnonymous, isFeatured,
        image: image || '',
        authorName: authorName || 'Anonymous',
        status: 'published',
        author: null
    });
    await story.save();
    res.json({ message: 'Story created', story });
});

app.put('/admin/api/stories/:id', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    await Story.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Story updated' });
});

// Approve story
app.put('/admin/api/stories/:id/approve', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    await Story.findByIdAndUpdate(req.params.id, { status: 'published' });
    res.json({ message: 'Story approved and published' });
});

// Reject story
app.put('/admin/api/stories/:id/reject', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    await Story.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ message: 'Story rejected' });
});

// Get pending stories
app.get('/admin/api/stories/pending', adminAuth, async (req, res) => {
    const Story = require('./models/Story');
    const stories = await Story.find({ status: 'pending' }).sort({ createdAt: -1 }).populate('author', 'name email').lean();
    res.json({ stories });
});

app.delete('/admin/api/therapists/:id', adminAuth, async (req, res) => {
    const Therapist = require('./models/Therapist');
    await Therapist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

// Admin: Get all therapists
app.get('/admin/api/therapists', adminAuth, async (req, res) => {
    const Therapist = require('./models/Therapist');
    const therapists = await Therapist.find().sort({ createdAt: -1 }).lean();
    res.json({ therapists });
});

// Admin: Create therapist
app.post('/admin/api/therapists', adminAuth, async (req, res) => {
    const Therapist = require('./models/Therapist');
    const therapist = new Therapist(req.body);
    await therapist.save();
    res.json({ message: 'Therapist created', therapist });
});

// Admin: Update therapist
app.put('/admin/api/therapists/:id', adminAuth, async (req, res) => {
    const Therapist = require('./models/Therapist');
    await Therapist.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Therapist updated' });
});

// ===== PUBLIC THERAPIST API =====
app.get('/api/therapists', async (req, res) => {
    try {
        const Therapist = require('./models/Therapist');
        const { category, sort } = req.query;
        
        let query = { isActive: true };
        if (category && category !== 'All') {
            query.specializations = { $regex: category, $options: 'i' };
        }
        
        let sortObj = { rating: -1 };
        if (sort === 'experience') sortObj = { experience: -1 };
        else if (sort === 'available') sortObj = { isAvailableToday: -1, rating: -1 };
        else if (sort === 'rating') sortObj = { rating: -1 };
        
        const therapists = await Therapist.find(query).sort(sortObj).lean();
        res.json({ therapists });
    } catch (e) {
        console.error('Therapists fetch error:', e);
        res.json({ therapists: [] });
    }
});

// Serve admin static files
app.use('/admin', express.static('admin'));

// ============================================================
// COMMUNITY PAGE — Admin CRUD + Public read endpoints
// All admin routes are protected by adminAuth.
// Public routes are read-only and used by community.html.
// ============================================================
const {
    CommunityPageSettings,
    FeaturedCircle,
    CommunitySpace,
    TrendingDiscussion,
    UpcomingEvent,
    Achievement,
    Discussion: RawDiscussion,
    Community: RawCommunity
} = require('./models/Community');

// ----- Public: full community page data in one call -----
app.get('/api/community-page', async (req, res) => {
    try {
        let settings = await CommunityPageSettings.findOne({ key: 'singleton' }).lean();
        if (!settings) {
            settings = await CommunityPageSettings.create({ key: 'singleton' });
            settings = settings.toObject();
        }
        const [circles, spaces, discussions, events, achievements] = await Promise.all([
            FeaturedCircle.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
            CommunitySpace.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
            TrendingDiscussion.find({ isHidden: false }).sort({ isPinned: -1, displayOrder: 1, createdAt: -1 }).lean(),
            UpcomingEvent.find({ isVisible: true, date: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } }).sort({ date: 1 }).lean(),
            Achievement.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: 1 }).lean()
        ]);
        res.json({ settings, circles, spaces, discussions, events, achievements });
    } catch (e) {
        console.error('community-page GET error:', e);
        res.status(500).json({ error: 'Failed to load community page data' });
    }
});

// ----- Admin: settings (singleton) -----
app.get('/admin/api/community-page/settings', adminAuth, async (req, res) => {
    let settings = await CommunityPageSettings.findOne({ key: 'singleton' });
    if (!settings) settings = await CommunityPageSettings.create({ key: 'singleton' });
    res.json(settings);
});

app.put('/admin/api/community-page/settings', adminAuth, async (req, res) => {
    const updates = { ...req.body };
    delete updates._id; delete updates.key;
    const settings = await CommunityPageSettings.findOneAndUpdate(
        { key: 'singleton' },
        { $set: updates },
        { new: true, upsert: true }
    );
    res.json(settings);
});

// ----- Generic CRUD factory for the curated collections -----
function crud(path, Model) {
    app.get(`/admin/api/community-page/${path}`, adminAuth, async (req, res) => {
        const items = await Model.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.json(items);
    });
    app.post(`/admin/api/community-page/${path}`, adminAuth, async (req, res) => {
        try {
            const item = await Model.create(req.body);
            res.status(201).json(item);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.put(`/admin/api/community-page/${path}/:id`, adminAuth, async (req, res) => {
        try {
            const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!item) return res.status(404).json({ error: 'Not found' });
            res.json(item);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.delete(`/admin/api/community-page/${path}/:id`, adminAuth, async (req, res) => {
        await Model.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    });
    app.put(`/admin/api/community-page/${path}/:id/toggle`, adminAuth, async (req, res) => {
        const field = req.body.field || 'isVisible';
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        item[field] = !item[field];
        await item.save();
        res.json(item);
    });
}

crud('circles', FeaturedCircle);
crud('spaces', CommunitySpace);
crud('discussions', TrendingDiscussion);
crud('events', UpcomingEvent);
crud('achievements', Achievement);

// ----- Moderation: raw user-generated communities & discussions -----
app.get('/admin/api/community-page/moderation/communities', adminAuth, async (req, res) => {
    const items = await RawCommunity.find({ status: { $in: ['pending', 'approved', 'rejected'] } })
        .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
});

app.put('/admin/api/community-page/moderation/communities/:id', adminAuth, async (req, res) => {
    const { status } = req.body; // approved | rejected | pending
    const item = await RawCommunity.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(item);
});

app.get('/admin/api/community-page/moderation/discussions', adminAuth, async (req, res) => {
    const items = await RawDiscussion.find({}).sort({ createdAt: -1 }).limit(100)
        .populate('author', 'name email').lean();
    res.json(items);
});

app.put('/admin/api/community-page/moderation/discussions/:id', adminAuth, async (req, res) => {
    const allowed = ['isHidden', 'isPinned', 'isReported'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    const item = await RawDiscussion.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(item);
});

app.delete('/admin/api/community-page/moderation/discussions/:id', adminAuth, async (req, res) => {
    await RawDiscussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

app.put('/admin/api/community-page/moderation/users/:id/block-community', adminAuth, async (req, res) => {
    const { blocked } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isCommunityBlocked: !!blocked });
    res.json({ message: 'Updated' });
});

// ----- Community User Interactions -----
// Join Circle
app.post('/api/community/circles/:id/join', authMiddleware, async (req, res) => {
    try {
        const circle = await FeaturedCircle.findById(req.params.id);
        if (!circle) return res.status(404).json({ error: 'Circle not found' });
        // Check if already joined (store in user's community data)
        const user = await User.findById(req.user.id);
        if (!user.joinedCircles) user.joinedCircles = [];
        if (user.joinedCircles.includes(req.params.id)) return res.json({ message: 'Already joined', alreadyJoined: true });
        user.joinedCircles.push(req.params.id);
        await user.save();
        circle.memberCount = (circle.memberCount || 0) + 1;
        await circle.save();
        await logActivity(req.user.id, 'community', 'Joined Circle', circle.title, '👥', 'community');
        res.json({ message: 'Joined!', memberCount: circle.memberCount });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Leave Circle
app.delete('/api/community/circles/:id/leave', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.joinedCircles) return res.json({ message: 'Not a member' });
        user.joinedCircles = user.joinedCircles.filter(c => c.toString() !== req.params.id);
        await user.save();
        await FeaturedCircle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: -1 } });
        res.json({ message: 'Left circle' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Get user's circles
app.get('/api/community/my-circles', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).select('joinedCircles').lean();
    res.json({ joinedCircles: user.joinedCircles || [] });
});

// RSVP Event
app.post('/api/community/events/:id/rsvp', authMiddleware, async (req, res) => {
    try {
        const event = await UpcomingEvent.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        const user = await User.findById(req.user.id);
        if (!user.rsvpEvents) user.rsvpEvents = [];
        if (user.rsvpEvents.includes(req.params.id)) return res.json({ message: 'Already RSVPed', alreadyRsvp: true });
        user.rsvpEvents.push(req.params.id);
        await user.save();
        event.attendeesCount = (event.attendeesCount || 0) + 1;
        await event.save();
        await logActivity(req.user.id, 'community', 'RSVP Event', event.title, '📅', 'community');
        res.json({ message: 'RSVP confirmed!', attendeesCount: event.attendeesCount });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Cancel RSVP
app.delete('/api/community/events/:id/rsvp', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.rsvpEvents) return res.json({ message: 'Not RSVPed' });
        user.rsvpEvents = user.rsvpEvents.filter(e => e.toString() !== req.params.id);
        await user.save();
        await UpcomingEvent.findByIdAndUpdate(req.params.id, { $inc: { attendeesCount: -1 } });
        res.json({ message: 'RSVP cancelled' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Get user's RSVPed events
app.get('/api/community/my-events', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).select('rsvpEvents').lean();
    res.json({ rsvpEvents: user.rsvpEvents || [] });
});

// Reply to discussion
app.post('/api/community/discussions/:id/reply', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text required' });
        const { Discussion } = require('./models/Community');
        const disc = await Discussion.findById(req.params.id);
        if (!disc) return res.status(404).json({ error: 'Discussion not found' });
        disc.replies.push({ user: req.user.id, text: text.trim() });
        disc.replyCount = disc.replies.length;
        await disc.save();
        await logActivity(req.user.id, 'community', 'Replied to Discussion', disc.title, '💬', 'community');
        res.json({ message: 'Reply added', replyCount: disc.replyCount });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Get discussion with replies
app.get('/api/community/discussions/:id', async (req, res) => {
    try {
        const { Discussion } = require('./models/Community');
        const disc = await Discussion.findById(req.params.id).populate('author', 'name').populate('replies.user', 'name').lean();
        if (!disc) return res.status(404).json({ error: 'Not found' });
        res.json(disc);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ============================================================
// OFFICIAL COMMUNITY GROUPS
// ============================================================
const OfficialGroupPost = require('./models/OfficialGroupPost');
const { professionalAuth: profAuthForGroups, professionalAuthLight: profAuthLightForGroups } = require('./middleware/professionalAuth');

// Public: List official groups
app.get('/api/community/official-groups', async (req, res) => {
    try {
        const groups = await RawCommunity.find({ isOfficial: true, status: 'approved' }).sort({ isFeatured: -1, createdAt: -1 }).lean();
        res.json({ groups });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Public: Single group detail
app.get('/api/community/official-groups/:id', async (req, res) => {
    try {
        const group = await RawCommunity.findOne({ _id: req.params.id, isOfficial: true }).lean();
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Public: Get posts in a group
app.get('/api/community/official-groups/:id/posts', async (req, res) => {
    try {
        const posts = await OfficialGroupPost.find({ groupId: req.params.id, status: 'published' }).sort({ isPinned: -1, createdAt: -1 }).populate('professionalId', 'fullName title profilePhoto').lean();
        res.json({ posts });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Join official group
app.post('/api/community/official-groups/:id/join', authMiddleware, async (req, res) => {
    try {
        const group = await RawCommunity.findOne({ _id: req.params.id, isOfficial: true });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.joinPolicy === 'invite_only') return res.status(403).json({ error: 'This group is invite-only' });
        if (group.members.includes(req.user.id)) return res.json({ message: 'Already a member', alreadyJoined: true });
        group.members.push(req.user.id);
        group.memberCount = group.members.length;
        await group.save();
        await logActivity(req.user.id, 'community', 'Joined Official Group', group.name, '🏛️', 'community');
        res.json({ message: 'Joined!', memberCount: group.memberCount });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Leave official group
app.delete('/api/community/official-groups/:id/leave', authMiddleware, async (req, res) => {
    try {
        const group = await RawCommunity.findOne({ _id: req.params.id, isOfficial: true });
        if (!group) return res.status(404).json({ error: 'Not found' });
        group.members = group.members.filter(m => m.toString() !== req.user.id);
        group.memberCount = group.members.length;
        await group.save();
        res.json({ message: 'Left group' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: React to official post
app.post('/api/community/official-posts/:postId/react', authMiddleware, async (req, res) => {
    try {
        const { type } = req.body;
        const post = await OfficialGroupPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        // Check if group allows reactions
        const group = await RawCommunity.findById(post.groupId);
        if (group && !group.reactionsEnabled) return res.status(403).json({ error: 'Reactions disabled in this group' });
        // Toggle reaction
        const existingIdx = post.reactions.findIndex(r => r.userId.toString() === req.user.id && r.type === (type || 'like'));
        if (existingIdx > -1) { post.reactions.splice(existingIdx, 1); }
        else { post.reactions.push({ userId: req.user.id, type: type || 'like' }); }
        await post.save();
        res.json({ message: 'Reaction updated', reactionCount: post.reactions.length });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Comment on official post
app.post('/api/community/official-posts/:postId/comment', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim() || text.length > 1000) return res.status(400).json({ error: 'Comment required (max 1000 chars)' });
        const post = await OfficialGroupPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        // Check if group allows comments
        const group = await RawCommunity.findById(post.groupId);
        if (group && !group.commentingEnabled) return res.status(403).json({ error: 'Comments disabled in this group' });
        // Crisis detection on comment
        if (detectCrisis(text)) {
            post.comments.push({ userId: req.user.id, text: text.trim(), status: 'reported' });
            await post.save();
            return res.json({ message: 'Comment saved. If you are in crisis, please reach out to 988 Suicide & Crisis Lifeline.', flagged: true });
        }
        post.comments.push({ userId: req.user.id, text: text.trim(), status: 'published' });
        await post.save();
        res.json({ message: 'Comment added', commentCount: post.comments.filter(c => c.status === 'published').length });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Save/bookmark official post
app.post('/api/community/official-posts/:postId/save', authMiddleware, async (req, res) => {
    try {
        const post = await OfficialGroupPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const idx = post.savedBy.indexOf(req.user.id);
        if (idx > -1) { post.savedBy.splice(idx, 1); await post.save(); return res.json({ message: 'Unsaved', saved: false }); }
        post.savedBy.push(req.user.id);
        await post.save();
        res.json({ message: 'Post saved!', saved: true });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Report official post
app.post('/api/community/official-posts/:postId/report', authMiddleware, async (req, res) => {
    try {
        // Just flag — admin will review
        res.json({ message: 'Post reported. Our team will review it.' });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Admin: Official Groups CRUD -----
app.get('/admin/api/community-page/official-groups', adminAuth, async (req, res) => {
    const groups = await RawCommunity.find({ isOfficial: true }).sort({ createdAt: -1 }).lean();
    res.json({ groups });
});

// Admin: fetch single group (any status) + posts (any status)
app.get('/admin/api/community-page/official-groups/:id', adminAuth, async (req, res) => {
    try {
        const group = await RawCommunity.findOne({ _id: req.params.id, isOfficial: true }).lean();
        if (!group) return res.status(404).json({ error: 'Not found' });
        res.json({ group });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin/api/community-page/official-groups/:id/posts', adminAuth, async (req, res) => {
    try {
        const posts = await OfficialGroupPost.find({ groupId: req.params.id })
            .sort({ isPinned: -1, createdAt: -1 })
            .populate('professionalId', 'fullName title profilePhoto')
            .populate('adminId', 'username')
            .lean();
        res.json({ posts });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/admin/api/community-page/official-groups', adminAuth, async (req, res) => {
    try {
        const { name, description, category, postingPermission, joinPolicy, commentingEnabled, reactionsEnabled, isFeatured, coverImage, rules, type } = req.body;
        if (!name) return res.status(400).json({ error: 'Group name required' });
        const group = await RawCommunity.create({
            name, description: description || '', type: type || 'support-circle',
            category: category || '', postingPermission: postingPermission || 'admin_only',
            joinPolicy: joinPolicy || 'open', commentingEnabled: commentingEnabled !== false,
            reactionsEnabled: reactionsEnabled !== false, isFeatured: !!isFeatured,
            coverImage: coverImage || '', rules: rules || '',
            isOfficial: true, groupType: 'official_group', createdByType: 'admin',
            createdByAdmin: req.adminUser.id, status: 'approved'
        });
        await logAudit(req, 'official_group.create', 'Community', group._id, name);
        res.status(201).json(group);
    } catch(e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

app.put('/admin/api/community-page/official-groups/:id', adminAuth, async (req, res) => {
    try {
        const allowed = ['name','description','category','postingPermission','joinPolicy','commentingEnabled','reactionsEnabled','isFeatured','coverImage','rules','type','status'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        const group = await RawCommunity.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!group) return res.status(404).json({ error: 'Not found' });
        res.json(group);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/admin/api/community-page/official-groups/:id', adminAuth, async (req, res) => {
    await RawCommunity.findByIdAndDelete(req.params.id);
    await OfficialGroupPost.deleteMany({ groupId: req.params.id });
    await logAudit(req, 'official_group.delete', 'Community', req.params.id, 'Deleted');
    res.json({ message: 'Group and all posts deleted' });
});

// ----- Admin: Official Group Posts -----
app.post('/admin/api/community-page/official-groups/:id/posts', adminAuth, async (req, res) => {
    try {
        const { title, content, summary, contentType, sourceRefs, isPinned, status } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
        const post = await OfficialGroupPost.create({
            groupId: req.params.id, authorType: 'admin', adminId: req.adminUser.id,
            title, content, summary: summary || '', contentType: contentType || 'announcement',
            sourceRefs: sourceRefs || [], isPinned: !!isPinned, status: status || 'published'
        });
        await logAudit(req, 'official_post.create', 'OfficialGroupPost', post._id, title);
        res.status(201).json(post);
    } catch(e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

app.put('/admin/api/community-page/official-posts/:postId', adminAuth, async (req, res) => {
    const allowed = ['title','content','summary','contentType','sourceRefs','isPinned','status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const post = await OfficialGroupPost.findByIdAndUpdate(req.params.postId, updates, { new: true });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
});

app.delete('/admin/api/community-page/official-posts/:postId', adminAuth, async (req, res) => {
    await OfficialGroupPost.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted' });
});

app.put('/admin/api/community-page/official-posts/:postId/pin', adminAuth, async (req, res) => {
    const post = await OfficialGroupPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ isPinned: post.isPinned });
});

app.put('/admin/api/community-page/official-posts/:postId/hide', adminAuth, async (req, res) => {
    const post = await OfficialGroupPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.status = post.status === 'hidden' ? 'published' : 'hidden';
    await post.save();
    res.json({ status: post.status });
});

// ----- Admin: Posts inside Featured Circles (separate model — uses same OfficialGroupPost schema with groupModel='FeaturedCircle') -----
app.get('/admin/api/community-page/circles/:id/posts', adminAuth, async (req, res) => {
    try {
        const circle = await FeaturedCircle.findById(req.params.id).lean();
        if (!circle) return res.status(404).json({ error: 'Circle not found' });
        const posts = await OfficialGroupPost.find({ groupId: req.params.id, groupModel: 'FeaturedCircle' })
            .sort({ isPinned: -1, createdAt: -1 })
            .populate('professionalId', 'fullName title profilePhoto')
            .populate('adminId', 'username')
            .lean();
        res.json({ circle, posts });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/admin/api/community-page/circles/:id/posts', adminAuth, async (req, res) => {
    try {
        const circle = await FeaturedCircle.findById(req.params.id);
        if (!circle) return res.status(404).json({ error: 'Circle not found' });
        const { title, content, summary, contentType, sourceRefs, isPinned, status } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
        const post = await OfficialGroupPost.create({
            groupId: req.params.id, groupModel: 'FeaturedCircle',
            authorType: 'admin', adminId: req.adminUser.id,
            title, content, summary: summary || '',
            contentType: contentType || 'announcement',
            sourceRefs: sourceRefs || [],
            isPinned: !!isPinned, status: status || 'published'
        });
        await logAudit(req, 'circle_post.create', 'OfficialGroupPost', post._id, title);
        res.status(201).json(post);
    } catch(e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

// Existing PUT/DELETE/pin/hide for /official-posts/:postId already work for circle posts (lookup is by postId, not by group type)

// Public: get single circle detail
app.get('/api/community/circles/:id', async (req, res) => {
    try {
        const circle = await FeaturedCircle.findById(req.params.id).lean();
        if (!circle) return res.status(404).json({ error: 'Circle not found' });
        res.json({ circle });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Public: list posts in a circle
app.get('/api/community/circles/:id/posts', async (req, res) => {
    try {
        const posts = await OfficialGroupPost.find({ groupId: req.params.id, groupModel: 'FeaturedCircle', status: 'published' })
            .sort({ isPinned: -1, createdAt: -1 })
            .populate('professionalId', 'fullName title profilePhoto')
            .lean();
        res.json({ posts });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Professional: Post in Official Groups -----
app.get('/professional/api/community/official-groups', profAuthForGroups, async (req, res) => {
    const groups = await RawCommunity.find({ isOfficial: true, postingPermission: 'admin_and_professionals', status: 'approved' }).lean();
    res.json({ groups });
});

app.post('/professional/api/community/official-groups/:id/posts', profAuthForGroups, async (req, res) => {
    try {
        const group = await RawCommunity.findOne({ _id: req.params.id, isOfficial: true });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.postingPermission !== 'admin_and_professionals') return res.status(403).json({ error: 'You do not have posting permission in this group' });
        const { title, content, summary, contentType, sourceRefs } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
        const post = await OfficialGroupPost.create({
            groupId: req.params.id, authorType: 'professional', professionalId: req.professional._id,
            title, content, summary: summary || '', contentType: contentType || 'guide',
            sourceRefs: sourceRefs || [], status: 'published'
        });
        res.status(201).json(post);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/professional/api/community/official-posts/:postId', profAuthForGroups, async (req, res) => {
    const post = await OfficialGroupPost.findOne({ _id: req.params.postId, professionalId: req.professional._id });
    if (!post) return res.status(404).json({ error: 'Post not found or not yours' });
    const { title, content, summary, contentType } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (summary !== undefined) post.summary = summary;
    if (contentType) post.contentType = contentType;
    await post.save();
    res.json(post);
});

app.delete('/professional/api/community/official-posts/:postId', profAuthForGroups, async (req, res) => {
    const post = await OfficialGroupPost.findOneAndDelete({ _id: req.params.postId, professionalId: req.professional._id });
    if (!post) return res.status(404).json({ error: 'Not found or not yours' });
    res.json({ message: 'Post deleted' });
});

// ============================================================
// BODY-MIND — API Routes
// ============================================================
const { BodyMindPage, BodyMindProgress } = require('./models/BodyMind');

// Public: Get body-mind page content
app.get('/api/body-mind', async (req, res) => {
    try {
        let data = await BodyMindPage.findOne({ key: 'singleton' }).lean();
        if (!data) data = { sessions: [], programs: [], habits: [] };
        res.json(data);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Get user progress
app.get('/api/body-mind/progress', authMiddleware, async (req, res) => {
    try {
        let progress = await BodyMindProgress.findOne({ userId: req.user.id }).lean();
        if (!progress) progress = { activePrograms: [], completedSessions: [], todayHabits: [], routine: [], streak: 0, totalSessionsCompleted: 0, weeklyCompleted: 0 };
        res.json(progress);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Start a session
app.post('/api/body-mind/session/:sessionId/start', authMiddleware, async (req, res) => {
    res.json({ message: 'Session started', sessionId: req.params.sessionId });
});

// Auth: Complete a session
app.post('/api/body-mind/session/:sessionId/complete', authMiddleware, async (req, res) => {
    try {
        const { sessionTitle, category } = req.body;
        let progress = await BodyMindProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new BodyMindProgress({ userId: req.user.id });
        progress.completedSessions.push({ sessionId: req.params.sessionId, sessionTitle: sessionTitle || 'Session', category: category || 'breathing', completedAt: new Date() });
        progress.totalSessionsCompleted += 1;
        progress.weeklyCompleted += 1;
        progress.lastActivityAt = new Date();
        await progress.save();
        await logActivity(req.user.id, 'session', 'Session Completed', sessionTitle || 'Body-Mind Session', '🧘', 'body-mind');
        res.json({ message: 'Session completed!', progress });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Toggle habit
app.put('/api/body-mind/habit', authMiddleware, async (req, res) => {
    try {
        const { habitTitle, completed } = req.body;
        let progress = await BodyMindProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new BodyMindProgress({ userId: req.user.id });
        const today = new Date(); today.setHours(0,0,0,0);
        const existing = progress.todayHabits.find(h => h.habitTitle === habitTitle && new Date(h.date).toDateString() === today.toDateString());
        if (existing) { existing.completed = completed; }
        else { progress.todayHabits.push({ habitTitle, completed, date: today }); }
        progress.lastActivityAt = new Date();
        await progress.save();
        res.json({ message: 'Habit updated', todayHabits: progress.todayHabits });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Save routine
app.put('/api/body-mind/routine', authMiddleware, async (req, res) => {
    try {
        const { routine } = req.body;
        let progress = await BodyMindProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new BodyMindProgress({ userId: req.user.id });
        progress.routine = routine || [];
        await progress.save();
        res.json({ message: 'Routine saved', routine: progress.routine });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Start program
app.post('/api/body-mind/program/:programId/start', authMiddleware, async (req, res) => {
    try {
        const { programTitle } = req.body;
        let progress = await BodyMindProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new BodyMindProgress({ userId: req.user.id });
        const existing = progress.activePrograms.find(p => p.programId === req.params.programId);
        if (existing) return res.json({ message: 'Already in progress', progress });
        progress.activePrograms.push({ programId: req.params.programId, programTitle: programTitle || 'Program', currentDay: 1 });
        await progress.save();
        await logActivity(req.user.id, 'program', 'Program Started', programTitle, '🏋️', 'body-mind');
        res.json({ message: 'Program started!', progress });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Body-Mind CMS
app.get('/admin/api/body-mind', adminAuth, async (req, res) => {
    let data = await BodyMindPage.findOne({ key: 'singleton' });
    if (!data) data = await BodyMindPage.create({ key: 'singleton' });
    res.json(data);
});
app.put('/admin/api/body-mind', adminAuth, async (req, res) => {
    const updates = { ...req.body }; delete updates._id; delete updates.key;
    const data = await BodyMindPage.findOneAndUpdate({ key: 'singleton' }, { $set: updates }, { new: true, upsert: true });
    res.json(data);
});

// ============================================================
// CARE HUB — Self-Care, Child Support, Parenting
// ============================================================
const { SelfCarePage, SelfCareCheckIn } = require('./models/SelfCare');
const { ChildSupportPage, ChildProfile } = require('./models/ChildSupport');
const { ParentingPage, ParentingChallengeProgress } = require('./models/Parenting');

// ----- Self-Care Recommendation Engine -----
function recommendSelfCare({ mood, energy, stressLevel, timeAvailable }) {
    if (stressLevel >= 8) return ['breathing', 'grounding', 'talk-to-someone'];
    if (mood === 'sad' && energy === 'low') return ['journaling', 'music', 'rest-reset'];
    if (mood === 'angry') return ['grounding', 'movement', 'breathing'];
    if (mood === 'overwhelmed') return ['breathing', 'grounding', 'journaling'];
    if (mood === 'tired' && energy === 'low') return ['sleep', 'routine', 'movement'];
    if (mood === 'stressed') return ['breathing', 'journaling', 'movement'];
    if (timeAvailable <= 2) return ['breathing'];
    if (timeAvailable <= 5) return ['breathing', 'journaling'];
    return ['routine', 'movement', 'journaling'];
}

// ----- Activity Logger Helper -----
async function logActivity(userId, type, title, description, icon, page) {
    try {
        await User.findByIdAndUpdate(userId, {
            lastActive: new Date(),
            $push: { recentActivity: { $each: [{ type, title, description, icon, page, createdAt: new Date() }], $slice: -50 } }
        });
    } catch(e) { console.error('Activity log error:', e.message); }
}

// Public: Get self-care page content
app.get('/api/self-care', async (req, res) => {
    try {
        let data = await SelfCarePage.findOne({ key: 'singleton' }).lean();
        if (!data) data = await SelfCarePage.create({ key: 'singleton' });
        res.json(data);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Self-care check-in
app.post('/api/self-care/checkin', authMiddleware, async (req, res) => {
    try {
        const { mood, energy, stressLevel, timeAvailable, selectedGoal } = req.body;
        if (!mood || !energy) return res.status(400).json({ error: 'Mood and energy required' });
        const recommended = recommendSelfCare({ mood, energy, stressLevel: stressLevel || 5, timeAvailable: timeAvailable || 5 });
        const today = new Date(); today.setHours(0,0,0,0);
        const checkin = await SelfCareCheckIn.findOneAndUpdate(
            { userId: req.user.id, date: today },
            { mood, energy, stressLevel, timeAvailable, selectedGoal, recommendedTasks: recommended },
            { upsert: true, new: true }
        );
        // Log activity + update progress
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'careProgress.selfCareCheckIns': 1 }, $set: { 'careProgress.lastSelfCareCheckin': new Date() } });
        await logActivity(req.user.id, 'checkin', 'Self-Care Check-In', `Feeling ${mood}, ${energy} energy`, '🧘', 'self-care');
        res.json({ checkin, recommended });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Complete a self-care task
app.post('/api/self-care/complete-task', authMiddleware, async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) return res.status(400).json({ error: 'Task name required' });
        const today = new Date(); today.setHours(0,0,0,0);
        // Find or create today's check-in
        let checkin = await SelfCareCheckIn.findOne({ userId: req.user.id, date: today });
        if (!checkin) {
            checkin = await SelfCareCheckIn.create({ userId: req.user.id, date: today, mood: 'okay', energy: 'medium', completedTasks: [] });
        }
        if (!checkin.completedTasks.includes(task)) checkin.completedTasks.push(task);
        await checkin.save();
        // Log activity
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'careProgress.selfCareTasksCompleted': 1, completedTasks: 1 } });
        await logActivity(req.user.id, 'task', 'Task Completed', task, '✅', 'self-care');
        res.json({ completedTasks: checkin.completedTasks });
    } catch(e) {
        console.error('Self-care complete-task error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// Auth: Get self-care history
app.get('/api/self-care/history', authMiddleware, async (req, res) => {
    try {
        const history = await SelfCareCheckIn.find({ userId: req.user.id }).sort({ date: -1 }).limit(30).lean();
        res.json({ history });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Public: Get child support page content
app.get('/api/child-support', async (req, res) => {
    try {
        let data = await ChildSupportPage.findOne({ key: 'singleton' }).lean();
        if (!data) data = await ChildSupportPage.create({ key: 'singleton' });
        res.json(data);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Child profiles CRUD
app.get('/api/child-profiles', authMiddleware, async (req, res) => {
    const profiles = await ChildProfile.find({ guardianUserId: req.user.id }).lean();
    res.json({ profiles });
});
app.post('/api/child-profiles', authMiddleware, async (req, res) => {
    try {
        const { nickname, ageGroup, concerns } = req.body;
        if (!nickname || !ageGroup) return res.status(400).json({ error: 'Nickname and age group required' });
        const count = await ChildProfile.countDocuments({ guardianUserId: req.user.id });
        if (count >= 5) return res.status(400).json({ error: 'Maximum 5 child profiles' });
        const profile = await ChildProfile.create({ guardianUserId: req.user.id, nickname, ageGroup, concerns: concerns || [] });
        res.status(201).json(profile);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});
app.put('/api/child-profiles/:id', authMiddleware, async (req, res) => {
    const profile = await ChildProfile.findOneAndUpdate({ _id: req.params.id, guardianUserId: req.user.id }, req.body, { new: true });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    res.json(profile);
});
app.delete('/api/child-profiles/:id', authMiddleware, async (req, res) => {
    await ChildProfile.findOneAndDelete({ _id: req.params.id, guardianUserId: req.user.id });
    res.json({ message: 'Deleted' });
});

// Auth: Child support recommendation
app.post('/api/child-support/recommend', authMiddleware, async (req, res) => {
    try {
        const { ageGroup, concern } = req.body;
        const page = await ChildSupportPage.findOne({ key: 'singleton' }).lean();
        if (!page) return res.status(404).json({ error: 'Page not found' });
        const match = page.concerns.find(c => c.slug === concern && c.ageGroups.includes(ageGroup) && c.isActive);
        if (!match) return res.json({ found: false, message: 'No specific guidance found for this combination.' });
        // Log activity
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'careProgress.childSupportGuidesViewed': 1 }, $set: { 'careProgress.lastChildSupportView': new Date() } });
        await logActivity(req.user.id, 'guide', 'Child Support Guide', `${match.title} (${ageGroup} years)`, '👶', 'child-support');
        res.json({ found: true, concern: match });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Public: Get parenting page content
app.get('/api/parenting', async (req, res) => {
    try {
        let data = await ParentingPage.findOne({ key: 'singleton' }).lean();
        if (!data) data = await ParentingPage.create({ key: 'singleton' });
        res.json(data);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Start a parenting challenge
app.post('/api/parenting/challenge/start', authMiddleware, async (req, res) => {
    try {
        const { challengeId, challengeTitle } = req.body;
        const existing = await ParentingChallengeProgress.findOne({ userId: req.user.id, challengeId, isCompleted: false });
        if (existing) return res.json({ progress: existing, message: 'Already in progress' });
        const progress = await ParentingChallengeProgress.create({ userId: req.user.id, challengeId, challengeTitle });
        // Log activity
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'careProgress.parentingChallengesStarted': 1 }, $set: { 'careProgress.lastParentingActivity': new Date() } });
        await logActivity(req.user.id, 'challenge', 'Challenge Started', challengeTitle, '🏆', 'parenting');
        res.status(201).json({ progress });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Complete a challenge day
app.put('/api/parenting/challenge/:challengeId/day/:day', authMiddleware, async (req, res) => {
    try {
        const { reflection } = req.body;
        const day = parseInt(req.params.day);
        const progress = await ParentingChallengeProgress.findOne({ userId: req.user.id, challengeId: req.params.challengeId, isCompleted: false });
        if (!progress) return res.status(404).json({ error: 'Challenge not found' });
        if (!progress.completedDays.includes(day)) progress.completedDays.push(day);
        if (reflection) progress.reflections.push({ day, text: reflection });
        // Check if all days completed
        const page = await ParentingPage.findOne({ key: 'singleton' }).lean();
        const challenge = page?.challenges?.find(c => c._id?.toString() === req.params.challengeId);
        if (challenge && progress.completedDays.length >= challenge.durationDays) progress.isCompleted = true;
        await progress.save();
        res.json({ progress });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth: Get user's challenge progress
app.get('/api/parenting/challenges', authMiddleware, async (req, res) => {
    const progress = await ParentingChallengeProgress.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ progress });
});

// ----- Admin: Care Hub CMS -----
app.get('/admin/api/self-care', adminAuth, async (req, res) => {
    let data = await SelfCarePage.findOne({ key: 'singleton' });
    if (!data) data = await SelfCarePage.create({ key: 'singleton' });
    res.json(data);
});
app.put('/admin/api/self-care', adminAuth, async (req, res) => {
    const updates = { ...req.body }; delete updates._id; delete updates.key;
    const data = await SelfCarePage.findOneAndUpdate({ key: 'singleton' }, { $set: updates }, { new: true, upsert: true });
    res.json(data);
});

app.get('/admin/api/child-support', adminAuth, async (req, res) => {
    let data = await ChildSupportPage.findOne({ key: 'singleton' });
    if (!data) data = await ChildSupportPage.create({ key: 'singleton' });
    res.json(data);
});
app.put('/admin/api/child-support', adminAuth, async (req, res) => {
    const updates = { ...req.body }; delete updates._id; delete updates.key;
    const data = await ChildSupportPage.findOneAndUpdate({ key: 'singleton' }, { $set: updates }, { new: true, upsert: true });
    res.json(data);
});

app.get('/admin/api/parenting', adminAuth, async (req, res) => {
    let data = await ParentingPage.findOne({ key: 'singleton' });
    if (!data) data = await ParentingPage.create({ key: 'singleton' });
    res.json(data);
});
app.put('/admin/api/parenting', adminAuth, async (req, res) => {
    const updates = { ...req.body }; delete updates._id; delete updates.key;
    const data = await ParentingPage.findOneAndUpdate({ key: 'singleton' }, { $set: updates }, { new: true, upsert: true });
    res.json(data);
});

// ============================================================
// LICENSED PROFESSIONALS PORTAL
// ============================================================
const Professional = require('./models/Professional');
const ProfessionalSession = require('./models/ProfessionalSession');
const { professionalAuth, professionalAuthLight } = require('./middleware/professionalAuth');

const PROF_SECRET = process.env.PROFESSIONAL_JWT_SECRET || process.env.JWT_SECRET;

// ----- Professional Auth Routes -----
app.post('/professional/api/signup', authLimiter, async (req, res) => {
    try {
        const { fullName, email, password, phone, title, licenseNumber, licensingAuthority, licenseCountry, licenseState, experienceYears, specializations, sessionTypes, languages, bio, profilePhoto } = req.body;
        // Validation
        if (!fullName || fullName.length < 2) return res.status(400).json({ error: 'Full name required (min 2 chars)' });
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required' });
        if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!title) return res.status(400).json({ error: 'Professional title required' });
        if (!licenseNumber) return res.status(400).json({ error: 'License number required' });
        if (!licensingAuthority) return res.status(400).json({ error: 'Licensing authority required' });
        if (!specializations || !specializations.length) return res.status(400).json({ error: 'At least one specialization required' });
        if (!sessionTypes || !sessionTypes.length) return res.status(400).json({ error: 'At least one session type required' });

        const existing = await Professional.findOne({ email: email.toLowerCase().trim() });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        const professional = new Professional({
            fullName, email: email.toLowerCase().trim(), password, phone, title,
            licenseNumber, licensingAuthority, licenseCountry, licenseState,
            experienceYears: experienceYears || 0, specializations, sessionTypes,
            languages: languages || [], bio: bio || '', profilePhoto: profilePhoto || ''
        });
        professional.profileCompleteness = professional.calculateCompleteness();
        await professional.save();

        res.status(201).json({ message: 'Professional account submitted for review. You will be able to access the dashboard after approval.' });
    } catch (e) {
        console.error('Professional signup error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/professional/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const professional = await Professional.findOne({ email: email.toLowerCase().trim() });
        if (!professional) return res.status(401).json({ error: 'Invalid credentials' });

        if (professional.isLocked()) return res.status(423).json({ error: 'Account locked. Try again later.' });

        const isMatch = await professional.comparePassword(password);
        if (!isMatch) {
            professional.loginAttempts += 1;
            if (professional.loginAttempts >= 5) professional.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await professional.save();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check status
        if (professional.status === 'pending_verification') return res.status(403).json({ error: 'Your profile is still under review.', status: 'pending_verification' });
        if (professional.status === 'rejected') return res.status(403).json({ error: 'Your application was not approved. Contact support.', status: 'rejected' });
        if (professional.status === 'suspended') return res.status(403).json({ error: 'Your professional account is suspended.', status: 'suspended' });

        professional.loginAttempts = 0;
        professional.lockUntil = null;
        professional.lastLoginAt = new Date();
        await professional.save();

        const token = jwt.sign({ id: professional._id, type: 'professional' }, PROF_SECRET, { expiresIn: '8h' });
        res.json({ token, status: professional.status, name: professional.fullName });
    } catch (e) {
        console.error('Professional login error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/professional/api/status', professionalAuthLight, (req, res) => {
    res.json({ status: req.professional.status, name: req.professional.fullName, profileCompleteness: req.professional.profileCompleteness });
});

// ----- Professional Dashboard -----
app.get('/professional/api/dashboard', professionalAuth, async (req, res) => {
    try {
        const p = req.professional;
        const [pending, upcoming, completed] = await Promise.all([
            ProfessionalSession.countDocuments({ professionalId: p._id, status: 'requested' }),
            ProfessionalSession.countDocuments({ professionalId: p._id, status: { $in: ['accepted', 'confirmed'] } }),
            ProfessionalSession.countDocuments({ professionalId: p._id, status: 'completed' })
        ]);
        const recentRequests = await ProfessionalSession.find({ professionalId: p._id, status: 'requested' }).sort({ createdAt: -1 }).limit(5).populate('userId', 'name').lean();
        res.json({ profile: { fullName: p.fullName, title: p.title, status: p.status, profileCompleteness: p.profileCompleteness, isAvailableToday: p.isAvailableToday, rating: p.rating, totalSessions: p.totalSessions }, counts: { pending, upcoming, completed }, recentRequests });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Professional Profile -----
app.get('/professional/api/profile', professionalAuth, (req, res) => { const p = req.professional.toObject(); delete p.password; res.json(p); });
app.put('/professional/api/profile', professionalAuth, async (req, res) => {
    try {
        const allowed = ['fullName','title','bio','specializations','languages','sessionTypes','experienceYears','profilePhoto','responseTime','phone','nextAvailable'];
        const updates = {}; allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        const p = await Professional.findByIdAndUpdate(req.professional._id, updates, { new: true }).select('-password');
        p.profileCompleteness = p.calculateCompleteness(); await p.save();
        res.json(p);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});
app.put('/professional/api/password', professionalAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Valid passwords required' });
    const p = await Professional.findById(req.professional._id);
    if (!(await p.comparePassword(currentPassword))) return res.status(401).json({ error: 'Current password incorrect' });
    p.password = newPassword; await p.save();
    res.json({ message: 'Password updated' });
});

// ----- Availability -----
app.get('/professional/api/availability', professionalAuth, (req, res) => { res.json({ availability: req.professional.availability, isAvailableToday: req.professional.isAvailableToday, vacationMode: req.professional.vacationMode }); });
app.put('/professional/api/availability', professionalAuth, async (req, res) => { const updates = {}; ['availability','maxSessionsPerDay','sessionDuration','breakTime','vacationMode'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; }); const p = await Professional.findByIdAndUpdate(req.professional._id, updates, { new: true }).select('-password'); res.json(p); });
app.put('/professional/api/availability/today', professionalAuth, async (req, res) => { await Professional.findByIdAndUpdate(req.professional._id, { isAvailableToday: !!req.body.isAvailableToday }); res.json({ isAvailableToday: !!req.body.isAvailableToday }); });

// ----- Professional Photo Upload -----
const profStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/professionals'),
    filename: (req, file, cb) => { const ext = file.originalname.split('.').pop(); cb(null, req.professional._id + '-' + Date.now() + '.' + ext); }
});
const profUpload = multer({ storage: profStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) cb(null, true); else cb(new Error('Only JPG, PNG, WebP, GIF allowed')); } });

app.post('/professional/api/upload-photo', professionalAuth, (req, res) => {
    profUpload.single('photo')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        if (!req.file) return res.status(400).json({ error: 'No file provided' });
        const photoUrl = '/uploads/professionals/' + req.file.filename;
        await Professional.findByIdAndUpdate(req.professional._id, { profilePhoto: photoUrl });
        res.json({ message: 'Photo uploaded', photoUrl });
    });
});

// ----- Session Management -----
app.get('/professional/api/requests', professionalAuth, async (req, res) => { const requests = await ProfessionalSession.find({ professionalId: req.professional._id, status: 'requested' }).sort({ createdAt: -1 }).populate('userId', 'name').lean(); res.json({ requests }); });
app.get('/professional/api/sessions', professionalAuth, async (req, res) => { const query = { professionalId: req.professional._id }; if (req.query.status) query.status = req.query.status; const sessions = await ProfessionalSession.find(query).sort({ createdAt: -1 }).limit(50).populate('userId', 'name').lean(); res.json({ sessions }); });
app.put('/professional/api/sessions/:id/accept', professionalAuth, async (req, res) => { const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'confirmed'; s.scheduledAt = s.requestedAt; await s.save(); res.json({ message: 'Accepted', session: s }); });
app.put('/professional/api/sessions/:id/reject', professionalAuth, async (req, res) => { if (!req.body.reason) return res.status(400).json({ error: 'Reason required' }); const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'rejected'; s.rejectReason = req.body.reason; await s.save(); res.json({ message: 'Rejected', session: s }); });
app.put('/professional/api/sessions/:id/reschedule', professionalAuth, async (req, res) => { if (!req.body.suggestedNewTime) return res.status(400).json({ error: 'Time required' }); const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'reschedule_suggested'; s.suggestedNewTime = new Date(req.body.suggestedNewTime); await s.save(); res.json({ message: 'Reschedule suggested', session: s }); });
app.put('/professional/api/sessions/:id/complete', professionalAuth, async (req, res) => { const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'completed'; await s.save(); await Professional.findByIdAndUpdate(req.professional._id, { $inc: { totalSessions: 1 } }); res.json({ message: 'Completed', session: s }); });
app.put('/professional/api/sessions/:id/cancel', professionalAuth, async (req, res) => { const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'cancelled'; s.cancelReason = req.body.reason || 'Cancelled by professional'; await s.save(); res.json({ message: 'Cancelled', session: s }); });
app.put('/professional/api/sessions/:id/private-note', professionalAuth, async (req, res) => { if (!req.body.note) return res.status(400).json({ error: 'Note required' }); const s = await ProfessionalSession.findOne({ _id: req.params.id, professionalId: req.professional._id }); if (!s) return res.status(404).json({ error: 'Not found' }); s.professionalPrivateNote = req.body.note; await s.save(); res.json({ message: 'Note saved' }); });

// ----- Professional Posts/Blog -----
app.get('/professional/api/posts', professionalAuth, async (req, res) => {
    const p = await Professional.findById(req.professional._id).select('posts').lean();
    res.json({ posts: (p.posts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/professional/api/posts', professionalAuth, async (req, res) => {
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    if (title.length > 200) return res.status(400).json({ error: 'Title max 200 chars' });
    if (content.length > 5000) return res.status(400).json({ error: 'Content max 5000 chars' });
    const p = await Professional.findById(req.professional._id);
    p.posts.push({ title, content, category: category || 'tip' });
    await p.save();
    res.status(201).json({ message: 'Post created', post: p.posts[p.posts.length - 1] });
});

app.put('/professional/api/posts/:postId', professionalAuth, async (req, res) => {
    const { title, content, category, isPublished } = req.body;
    const p = await Professional.findById(req.professional._id);
    const post = p.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (isPublished !== undefined) post.isPublished = isPublished;
    await p.save();
    res.json({ message: 'Post updated', post });
});

app.delete('/professional/api/posts/:postId', professionalAuth, async (req, res) => {
    const p = await Professional.findById(req.professional._id);
    p.posts.pull({ _id: req.params.postId });
    await p.save();
    res.json({ message: 'Post deleted' });
});

// Public: Get professional profile + posts
app.get('/api/professionals/:id/posts', async (req, res) => {
    try {
        const p = await Professional.findOne({ _id: req.params.id, status: 'approved' }).select('posts fullName title').lean();
        if (!p) return res.status(404).json({ error: 'Not found' });
        const posts = (p.posts || []).filter(post => post.isPublished).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ posts, professionalName: p.fullName, professionalTitle: p.title });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- User Booking -----
app.get('/api/professionals', async (req, res) => {
    try {
        const query = { status: 'approved' };
        if (req.query.specialization) query.specializations = { $regex: req.query.specialization, $options: 'i' };
        if (req.query.sessionType) query.sessionTypes = req.query.sessionType;
        if (req.query.availableToday === 'true') query.isAvailableToday = true;
        if (req.query.language) query.languages = { $regex: req.query.language, $options: 'i' };
        // Sort options
        let sortObj = { rating: -1 };
        if (req.query.sort === 'highestRated') sortObj = { rating: -1 };
        else if (req.query.sort === 'mostExperienced') sortObj = { experienceYears: -1 };
        else if (req.query.sort === 'newest') sortObj = { createdAt: -1 };
        else if (req.query.sort === 'mostSessions') sortObj = { totalSessions: -1 };
        const professionals = await Professional.find(query)
            .select('-password -licenseDocumentUrl -loginAttempts -lockUntil -notificationSettings -posts')
            .sort(sortObj).lean();
        res.json({ professionals });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});
app.get('/api/professionals/:id', async (req, res) => { try { const p = await Professional.findOne({ _id: req.params.id, status: 'approved' }).select('-password -licenseDocumentUrl -loginAttempts -lockUntil -notificationSettings').lean(); if (!p) return res.status(404).json({ error: 'Not found' }); res.json(p); } catch(e) { res.status(500).json({ error: 'Server error' }); } });
app.post('/api/professionals/:id/request-session', authMiddleware, async (req, res) => { try { const { sessionType, concern, requestedAt, userNote } = req.body; if (!sessionType || !concern || !requestedAt) return res.status(400).json({ error: 'Session type, concern, and time required' }); if (new Date(requestedAt) <= new Date()) return res.status(400).json({ error: 'Time must be future' }); const p = await Professional.findOne({ _id: req.params.id, status: 'approved' }); if (!p) return res.status(404).json({ error: 'Not found' });
        // Prevent duplicate pending requests
        const existing = await ProfessionalSession.findOne({ userId: req.user.id, professionalId: p._id, status: { $in: ['requested', 'reschedule_suggested'] } });
        if (existing) return res.status(400).json({ error: 'You already have a pending request with this professional. Please wait for their response.' });
        const session = await ProfessionalSession.create({ userId: req.user.id, professionalId: p._id, sessionType, concern, requestedAt: new Date(requestedAt), userNote: userNote || '' }); await logActivity(req.user.id, 'session', 'Session Requested', `With ${p.fullName}`, '📅', 'healing-zone'); res.status(201).json({ message: 'Session requested', session }); } catch(e) { res.status(500).json({ error: 'Server error' }); } });
app.get('/api/my-professional-sessions', authMiddleware, async (req, res) => { const sessions = await ProfessionalSession.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate('professionalId', 'fullName title profilePhoto').lean(); res.json({ sessions }); });
app.delete('/api/my-professional-sessions/:id/cancel', authMiddleware, async (req, res) => { const s = await ProfessionalSession.findOne({ _id: req.params.id, userId: req.user.id, status: { $in: ['requested', 'reschedule_suggested'] } }); if (!s) return res.status(404).json({ error: 'Not found' }); s.status = 'cancelled'; s.cancelReason = 'Cancelled by user'; await s.save(); res.json({ message: 'Cancelled' }); });

// ----- Admin: Professionals -----
app.get('/admin/api/professionals', adminAuth, async (req, res) => {
    const query = req.query.status ? { status: req.query.status } : {};
    const professionals = await Professional.find(query).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ professionals });
});
// GET single professional (for admin detail/review view)
app.get('/admin/api/professionals/:id', adminAuth, async (req, res) => {
    try {
        const p = await Professional.findById(req.params.id).select('-password').lean();
        if (!p) return res.status(404).json({ error: 'Professional not found' });
        const sessionStats = await ProfessionalSession.aggregate([
            { $match: { professionalId: p._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        res.json({ professional: p, sessionStats });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});
// PUT edit professional profile (admin override)
app.put('/admin/api/professionals/:id', adminAuth, async (req, res) => {
    try {
        const allowed = ['fullName','title','bio','specializations','languages','sessionTypes','experienceYears','profilePhoto','licenseNumber','licensingAuthority','licenseCountry','licenseState','status','rejectionReason','suspendedReason'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        const p = await Professional.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!p) return res.status(404).json({ error: 'Not found' });
        await logAudit(req, 'professional.edited', 'Professional', req.params.id, JSON.stringify(updates));
        res.json(p);
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});
app.put('/admin/api/professionals/:id/approve', adminAuth, async (req, res) => {
    await Professional.findByIdAndUpdate(req.params.id, { status: 'approved', rejectionReason: '', suspendedReason: '' });
    await logAudit(req, 'professional.approve', 'Professional', req.params.id, 'Approved');
    res.json({ message: 'Approved' });
});
app.put('/admin/api/professionals/:id/reject', adminAuth, async (req, res) => {
    await Professional.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: req.body.reason || '' });
    await logAudit(req, 'professional.reject', 'Professional', req.params.id, req.body.reason);
    res.json({ message: 'Rejected' });
});
app.put('/admin/api/professionals/:id/suspend', adminAuth, async (req, res) => {
    await Professional.findByIdAndUpdate(req.params.id, { status: 'suspended', suspendedReason: req.body.reason || '' });
    await logAudit(req, 'professional.suspend', 'Professional', req.params.id, req.body.reason);
    res.json({ message: 'Suspended' });
});
app.put('/admin/api/professionals/:id/reactivate', adminAuth, async (req, res) => {
    await Professional.findByIdAndUpdate(req.params.id, { status: 'approved', suspendedReason: '' });
    await logAudit(req, 'professional.reactivate', 'Professional', req.params.id, 'Reactivated');
    res.json({ message: 'Reactivated' });
});
app.delete('/admin/api/professionals/:id', adminAuth, async (req, res) => {
    await Professional.findByIdAndDelete(req.params.id);
    await logAudit(req, 'professional.deleted', 'Professional', req.params.id, 'Deleted');
    res.json({ message: 'Deleted' });
});
app.get('/admin/api/professional-sessions', adminAuth, async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.professionalId) query.professionalId = req.query.professionalId;
        const sessions = await ProfessionalSession.find(query).sort({ createdAt: -1 }).limit(200)
            .populate('userId', 'name email')
            .populate('professionalId', 'fullName title').lean();
        // Summary stats
        const [total, pending, confirmed, completed, cancelled] = await Promise.all([
            ProfessionalSession.countDocuments(),
            ProfessionalSession.countDocuments({ status: 'requested' }),
            ProfessionalSession.countDocuments({ status: { $in: ['accepted','confirmed'] } }),
            ProfessionalSession.countDocuments({ status: 'completed' }),
            ProfessionalSession.countDocuments({ status: 'cancelled' })
        ]);
        res.json({ sessions, stats: { total, pending, confirmed, completed, cancelled } });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Serve professional portal
app.use('/professional', express.static('public/professional'));

// ============================================================
const {
    YouthPageSettings,
    SkillProgress,
    YouthAssessment,
    YouthProgram,
    YouthCareer,
    YouthCounselor,
    YouthChallenge,
    YouthAchievement,
    YouthResource
} = require('./models/YouthSupport');
const YouthProfile = require('./models/YouthProfile');

// ----- Public: full youth support page data in one call -----
app.get('/api/youth-support', async (req, res) => {
    try {
        let settings = await YouthPageSettings.findOne({ key: 'singleton' }).lean();
        if (!settings) {
            settings = await YouthPageSettings.create({
                key: 'singleton',
                heroFeatures: ['Career Discovery', 'Aptitude Testing', 'Wellness Support', 'Confidence Building']
            });
            settings = settings.toObject();
        }
        let counselor = await YouthCounselor.findOne({ key: 'featured' }).lean();
        if (!counselor) {
            counselor = await YouthCounselor.create({ key: 'featured' });
            counselor = counselor.toObject();
        }
        const [progress, assessments, programs, careers, challenges, achievements, resources] = await Promise.all([
            SkillProgress.find({ isVisible: true }).sort({ displayOrder: 1 }).lean(),
            YouthAssessment.find({ isVisible: true, status: 'active' }).sort({ displayOrder: 1 }).lean(),
            YouthProgram.find({ isVisible: true }).sort({ displayOrder: 1 }).lean(),
            YouthCareer.find({ isVisible: true }).sort({ displayOrder: 1 }).lean(),
            YouthChallenge.find({ isVisible: true }).sort({ displayOrder: 1 }).lean(),
            YouthAchievement.find().sort({ displayOrder: 1 }).lean(),
            YouthResource.find({ isVisible: true }).sort({ displayOrder: 1 }).lean()
        ]);
        res.json({ settings, counselor, progress, assessments, programs, careers, challenges, achievements, resources });
    } catch (e) {
        console.error('youth-support GET error:', e);
        res.status(500).json({ error: 'Failed to load youth support data' });
    }
});

// ----- Youth Support: User Routes -----
app.get('/api/youth/me', authMiddleware, async (req, res) => {
    let profile = await YouthProfile.findOne({ userId: req.user.id }).lean();
    if (!profile) profile = { assessmentCompleted: false };
    res.json(profile);
});

app.post('/api/youth/assessment', authMiddleware, async (req, res) => {
    try {
        const { ageGroup, focusAreas, confidenceScore, wellnessScore, careerClarityScore, socialSkillsScore, interests, learningStyle } = req.body;
        if (!ageGroup || !focusAreas?.length) return res.status(400).json({ error: 'Age group and focus areas required' });
        const profile = await YouthProfile.findOneAndUpdate(
            { userId: req.user.id },
            { ageGroup, focusAreas, confidenceScore: confidenceScore || 50, wellnessScore: wellnessScore || 50, careerClarityScore: careerClarityScore || 30, socialSkillsScore: socialSkillsScore || 40, interests: interests || [], learningStyle: learningStyle || 'videos', assessmentCompleted: true },
            { upsert: true, new: true }
        );
        await logActivity(req.user.id, 'assessment', 'Youth Assessment', 'Completed youth assessment', '📋', 'youth-support');
        res.json({ message: 'Assessment saved!', profile });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/youth/modules/:moduleId/complete', authMiddleware, async (req, res) => {
    try {
        const { moduleTitle } = req.body;
        let profile = await YouthProfile.findOne({ userId: req.user.id });
        if (!profile) profile = new YouthProfile({ userId: req.user.id });
        if (!profile.completedModules.includes(req.params.moduleId)) {
            profile.completedModules.push(req.params.moduleId);
            // Boost scores
            profile.confidenceScore = Math.min(100, profile.confidenceScore + 5);
            profile.wellnessScore = Math.min(100, profile.wellnessScore + 3);
        }
        await profile.save();
        await logActivity(req.user.id, 'module', 'Module Completed', moduleTitle || 'Youth Module', '🎯', 'youth-support');
        res.json({ message: 'Module completed!', profile });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

// Mark a single lesson within a module complete
app.post('/api/youth/lessons/:lessonKey/complete', authMiddleware, async (req, res) => {
    try {
        const { lessonTitle } = req.body;
        let profile = await YouthProfile.findOne({ userId: req.user.id });
        if (!profile) profile = new YouthProfile({ userId: req.user.id });
        if (!profile.completedLessons) profile.completedLessons = [];
        if (!profile.completedLessons.includes(req.params.lessonKey)) {
            profile.completedLessons.push(req.params.lessonKey);
            profile.confidenceScore = Math.min(100, profile.confidenceScore + 2);
            profile.careerClarityScore = Math.min(100, profile.careerClarityScore + 2);
        }
        await profile.save();
        await logActivity(req.user.id, 'lesson', 'Lesson Completed', lessonTitle || 'Youth Lesson', '📖', 'youth-support');
        res.json({ message: 'Lesson completed!', profile });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/youth/challenges/:challengeId/complete', authMiddleware, async (req, res) => {
    try {
        const { challengeTitle } = req.body;
        let profile = await YouthProfile.findOne({ userId: req.user.id });
        if (!profile) profile = new YouthProfile({ userId: req.user.id });
        if (!profile.completedChallenges.includes(req.params.challengeId)) {
            profile.completedChallenges.push(req.params.challengeId);
            profile.confidenceScore = Math.min(100, profile.confidenceScore + 3);
            profile.socialSkillsScore = Math.min(100, profile.socialSkillsScore + 5);
        }
        await profile.save();
        await logActivity(req.user.id, 'challenge', 'Challenge Completed', challengeTitle || 'Youth Challenge', '🏆', 'youth-support');
        res.json({ message: 'Challenge completed!', profile });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/youth/careers/:careerId/save', authMiddleware, async (req, res) => {
    try {
        let profile = await YouthProfile.findOne({ userId: req.user.id });
        if (!profile) profile = new YouthProfile({ userId: req.user.id });
        if (!profile.savedCareers.includes(req.params.careerId)) {
            profile.savedCareers.push(req.params.careerId);
            profile.careerClarityScore = Math.min(100, profile.careerClarityScore + 5);
        }
        await profile.save();
        res.json({ message: 'Career saved!', profile });
    } catch(e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/youth/saved-careers', authMiddleware, async (req, res) => {
    const profile = await YouthProfile.findOne({ userId: req.user.id }).select('savedCareers').lean();
    res.json({ savedCareers: profile?.savedCareers || [] });
});

// ----- Admin: Youth Page Settings (singleton) -----
app.get('/admin/api/youth-support/settings', adminAuth, async (req, res) => {
    let settings = await YouthPageSettings.findOne({ key: 'singleton' });
    if (!settings) settings = await YouthPageSettings.create({ key: 'singleton', heroFeatures: ['Career Discovery', 'Aptitude Testing', 'Wellness Support', 'Confidence Building'] });
    res.json(settings);
});

app.put('/admin/api/youth-support/settings', adminAuth, async (req, res) => {
    const updates = { ...req.body };
    delete updates._id; delete updates.key;
    const settings = await YouthPageSettings.findOneAndUpdate(
        { key: 'singleton' },
        { $set: updates },
        { new: true, upsert: true }
    );
    res.json(settings);
});

// ----- Admin: Counselor (singleton) -----
app.get('/admin/api/youth-support/counselor', adminAuth, async (req, res) => {
    let counselor = await YouthCounselor.findOne({ key: 'featured' });
    if (!counselor) counselor = await YouthCounselor.create({ key: 'featured' });
    res.json(counselor);
});

app.put('/admin/api/youth-support/counselor', adminAuth, async (req, res) => {
    const updates = { ...req.body };
    delete updates._id; delete updates.key;
    const counselor = await YouthCounselor.findOneAndUpdate(
        { key: 'featured' },
        { $set: updates },
        { new: true, upsert: true }
    );
    res.json(counselor);
});

// ----- Generic CRUD for youth support collections -----
function youthCrud(path, Model) {
    app.get(`/admin/api/youth-support/${path}`, adminAuth, async (req, res) => {
        const items = await Model.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.json(items);
    });
    app.post(`/admin/api/youth-support/${path}`, adminAuth, async (req, res) => {
        try {
            const item = await Model.create(req.body);
            res.status(201).json(item);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.put(`/admin/api/youth-support/${path}/:id`, adminAuth, async (req, res) => {
        try {
            const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!item) return res.status(404).json({ error: 'Not found' });
            res.json(item);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.delete(`/admin/api/youth-support/${path}/:id`, adminAuth, async (req, res) => {
        await Model.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    });
    app.put(`/admin/api/youth-support/${path}/:id/toggle`, adminAuth, async (req, res) => {
        const field = req.body.field || 'isVisible';
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        item[field] = !item[field];
        await item.save();
        res.json(item);
    });
}

youthCrud('progress', SkillProgress);
youthCrud('assessments', YouthAssessment);
youthCrud('programs', YouthProgram);
youthCrud('careers', YouthCareer);
youthCrud('challenges', YouthChallenge);
youthCrud('achievements', YouthAchievement);
youthCrud('resources', YouthResource);

// ===== LANDING PAGE ROUTES =====
const LandingPage = require('./models/LandingPage');

// Public — get landing page data
app.get('/api/landing', async (req, res) => {
    try {
        const data = await LandingPage.findOne({ key: 'singleton' }).lean();
        if (!data) return res.json(null);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin — get landing page data
app.get('/admin/api/landing', adminAuth, async (req, res) => {
    try {
        let data = await LandingPage.findOne({ key: 'singleton' });
        if (!data) data = await LandingPage.create({ key: 'singleton' });
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin — update landing page data
app.put('/admin/api/landing', adminAuth, async (req, res) => {
    try {
        const data = await LandingPage.findOneAndUpdate(
            { key: 'singleton' },
            req.body,
            { upsert: true, new: true, runValidators: true }
        );
        res.json(data);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// MARKETPLACE — API Routes
// ============================================================
const MarketplaceListing = require('./models/MarketplaceListing');

// Marketplace image upload (up to 5 images, max 3MB each)
const marketplaceStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/marketplace'),
    filename: (req, file, cb) => { const ext = file.originalname.split('.').pop(); cb(null, 'mp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext); }
});
const marketplaceUpload = multer({
    storage: marketplaceStorage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true); else cb(new Error('Only JPG, PNG, WebP, GIF allowed')); }
});

// Upload marketplace images (returns array of URLs)
app.post('/api/marketplace/upload-images', authMiddleware, (req, res) => {
    marketplaceUpload.array('images', 5)(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files provided' });
        const urls = req.files.map(f => '/uploads/marketplace/' + f.filename);
        res.json({ message: 'Uploaded', images: urls });
    });
});

// Professional version of the same upload
app.post('/professional/api/marketplace/upload-images', profAuthForGroups, (req, res) => {
    marketplaceUpload.array('images', 5)(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files provided' });
        const urls = req.files.map(f => '/uploads/marketplace/' + f.filename);
        res.json({ message: 'Uploaded', images: urls });
    });
});

const LISTING_TYPE_LABELS = {
    spa: 'Spa', mental_health_center: 'Mental Health Center', therapy_clinic: 'Therapy Clinic',
    yoga_studio: 'Yoga Studio', meditation_center: 'Meditation Center', fitness_wellness: 'Fitness & Wellness',
    nutrition_store: 'Nutrition Store', wellness_product_store: 'Wellness Product Store',
    professional_service: 'Professional Service', other: 'Other'
};

// ----- Public: Browse approved listings -----
app.get('/api/marketplace', async (req, res) => {
    try {
        const { type, city, search, featured, priceRange, page = 1, limit = 20 } = req.query;
        const filter = { status: 'approved' };
        if (type) filter.listingType = type;
        if (city) filter['location.city'] = new RegExp(city, 'i');
        if (priceRange) filter.priceRange = priceRange;
        if (featured === 'true') filter.isFeatured = true;
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ businessName: regex }, { description: regex }, { tags: regex }, { services: regex }];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [listings, total] = await Promise.all([
            MarketplaceListing.find(filter)
                .select('-reports -licenseNumber -qualification -professionalAssociation')
                .sort({ isFeatured: -1, createdAt: -1 })
                .skip(skip).limit(parseInt(limit)).lean(),
            MarketplaceListing.countDocuments(filter)
        ]);
        res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// NOTE: Specific routes MUST come before /:id to avoid matching
app.get('/api/marketplace/my-listings', authMiddleware, async (req, res) => {
    const listings = await MarketplaceListing.find({ submittedByUser: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ listings });
});

app.get('/api/marketplace/my-bookings', authMiddleware, async (req, res) => {
    const bookings = await MarketplaceBooking.find({ userId: req.user.id })
        .populate('listingId', 'businessName listingType images location')
        .sort({ createdAt: -1 }).lean();
    res.json({ bookings });
});

app.get('/api/marketplace/:id', async (req, res) => {
    try {
        const listing = await MarketplaceListing.findOne({ _id: req.params.id, status: 'approved' })
            .select('-reports -licenseNumber -qualification -professionalAssociation')
            .populate('linkedProfessionalId', 'fullName title profilePhoto rating specializations')
            .lean();
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        // Increment views
        await MarketplaceListing.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });
        res.json(listing);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- User: Manage own listings (view/edit/delete) — submission only via professional portal -----
app.put('/api/marketplace/my-listings/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await MarketplaceListing.findOne({ _id: req.params.id, submittedByUser: req.user.id });
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        const editable = ['businessName', 'listingType', 'description', 'services', 'location', 'contact', 'images', 'openingHours', 'priceRange', 'tags'];
        editable.forEach(k => { if (req.body[k] !== undefined) listing[k] = req.body[k]; });
        await listing.save();
        res.json(listing);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/marketplace/my-listings/:id', authMiddleware, async (req, res) => {
    const r = await MarketplaceListing.findOneAndDelete({ _id: req.params.id, submittedByUser: req.user.id });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Listing deleted' });
});

// Report
app.post('/api/marketplace/:id/report', authMiddleware, async (req, res) => {
    try {
        const { reason, details } = req.body;
        const listing = await MarketplaceListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Not found' });
        listing.reports.push({ userId: req.user.id, reason: reason || 'other', details: details || '' });
        await listing.save();
        res.json({ message: 'Report submitted. Our team will review it.' });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Professional: Submit listing -----
app.post('/professional/api/marketplace/submit', profAuthForGroups, async (req, res) => {
    try {
        if (req.professional.status !== 'approved') return res.status(403).json({ error: 'Only approved professionals can submit marketplace listings' });
        const { businessName, listingType, description, services, location, contact, images, openingHours, priceRange, tags, licenseNumber, qualification, professionalAssociation } = req.body;
        if (!businessName || !listingType || !description) return res.status(400).json({ error: 'Business name, type, and description are required' });
        const listing = await MarketplaceListing.create({
            businessName, listingType, description,
            services: services || [], location: location || {}, contact: contact || {},
            images: images || [], openingHours: openingHours || [],
            priceRange: priceRange || 'unknown', tags: tags || [],
            submittedByType: 'professional', submittedByProfessional: req.professional._id,
            isProfessionalLinked: true, linkedProfessionalId: req.professional._id,
            licenseNumber: licenseNumber || '', qualification: qualification || '',
            professionalAssociation: professionalAssociation || '',
            status: 'pending'
        });
        res.status(201).json({ message: 'Listing submitted for review', listing });
    } catch (e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

app.get('/professional/api/marketplace/my-listings', profAuthForGroups, async (req, res) => {
    const listings = await MarketplaceListing.find({ submittedByProfessional: req.professional._id }).sort({ createdAt: -1 }).lean();
    res.json({ listings });
});

app.put('/professional/api/marketplace/my-listings/:id', profAuthForGroups, async (req, res) => {
    try {
        const listing = await MarketplaceListing.findOne({ _id: req.params.id, submittedByProfessional: req.professional._id });
        if (!listing) return res.status(404).json({ error: 'Not found' });
        const editable = ['businessName', 'listingType', 'description', 'services', 'location', 'contact', 'images', 'openingHours', 'priceRange', 'tags'];
        editable.forEach(k => { if (req.body[k] !== undefined) listing[k] = req.body[k]; });
        await listing.save();
        res.json(listing);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ----- Admin: Manage marketplace -----
app.get('/admin/api/marketplace', adminAuth, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.listingType = type;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [listings, total] = await Promise.all([
            MarketplaceListing.find(filter)
                .populate('submittedByUser', 'name email')
                .populate('submittedByProfessional', 'fullName email')
                .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            MarketplaceListing.countDocuments(filter)
        ]);
        // Stats
        const [pending, approved, rejected, suspended] = await Promise.all([
            MarketplaceListing.countDocuments({ status: 'pending' }),
            MarketplaceListing.countDocuments({ status: 'approved' }),
            MarketplaceListing.countDocuments({ status: 'rejected' }),
            MarketplaceListing.countDocuments({ status: 'suspended' })
        ]);
        res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), stats: { pending, approved, rejected, suspended } });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin/api/marketplace/:id', adminAuth, async (req, res) => {
    const listing = await MarketplaceListing.findById(req.params.id)
        .populate('submittedByUser', 'name email')
        .populate('submittedByProfessional', 'fullName email profilePhoto')
        .populate('linkedProfessionalId', 'fullName title specializations')
        .lean();
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json(listing);
});

app.put('/admin/api/marketplace/:id/approve', adminAuth, async (req, res) => {
    const listing = await MarketplaceListing.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.adminUser.id, approvedAt: new Date(), rejectionReason: '' }, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    await logAudit(req, 'marketplace.approve', 'MarketplaceListing', listing._id, listing.businessName);
    res.json(listing);
});

app.put('/admin/api/marketplace/:id/reject', adminAuth, async (req, res) => {
    const { reason } = req.body;
    const listing = await MarketplaceListing.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason || 'Does not meet guidelines' }, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    await logAudit(req, 'marketplace.reject', 'MarketplaceListing', listing._id, reason || 'rejected');
    res.json(listing);
});

app.put('/admin/api/marketplace/:id/suspend', adminAuth, async (req, res) => {
    const listing = await MarketplaceListing.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json(listing);
});

app.put('/admin/api/marketplace/:id/hide', adminAuth, async (req, res) => {
    const listing = await MarketplaceListing.findByIdAndUpdate(req.params.id, { status: 'hidden' }, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json(listing);
});

app.put('/admin/api/marketplace/:id/feature', adminAuth, async (req, res) => {
    const listing = await MarketplaceListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Not found' });
    listing.isFeatured = !listing.isFeatured;
    await listing.save();
    res.json({ isFeatured: listing.isFeatured });
});

app.put('/admin/api/marketplace/:id', adminAuth, async (req, res) => {
    const editable = ['businessName', 'listingType', 'description', 'services', 'location', 'contact', 'images', 'openingHours', 'priceRange', 'tags', 'status', 'isFeatured'];
    const updates = {};
    editable.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const listing = await MarketplaceListing.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json(listing);
});

app.delete('/admin/api/marketplace/:id', adminAuth, async (req, res) => {
    await MarketplaceListing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted' });
});

// ============================================================
// MARKETPLACE BOOKINGS
// ============================================================
const MarketplaceBooking = require('./models/MarketplaceBooking');

// User: Book a marketplace listing
app.post('/api/marketplace/:id/book', authMiddleware, async (req, res) => {
    try {
        const listing = await MarketplaceListing.findOne({ _id: req.params.id, status: 'approved' });
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        const { serviceRequested, preferredDate, preferredTime, note } = req.body;
        if (!preferredDate) return res.status(400).json({ error: 'Preferred date is required' });
        const booking = await MarketplaceBooking.create({
            listingId: listing._id,
            userId: req.user.id,
            professionalId: listing.submittedByProfessional || listing.linkedProfessionalId || null,
            serviceRequested: serviceRequested || '',
            preferredDate: new Date(preferredDate),
            preferredTime: preferredTime || '',
            note: note || '',
            status: 'pending'
        });
        res.status(201).json({ message: 'Booking request sent! You will be notified when the provider responds.', booking });
    } catch (e) { res.status(500).json({ error: e.message || 'Server error' }); }
});

// User: Cancel booking
app.put('/api/marketplace/bookings/:id/cancel', authMiddleware, async (req, res) => {
    const booking = await MarketplaceBooking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (['completed', 'cancelled'].includes(booking.status)) return res.status(400).json({ error: 'Cannot cancel this booking' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled', booking });
});

// User: Confirm rescheduled time
app.put('/api/marketplace/bookings/:id/confirm', authMiddleware, async (req, res) => {
    const booking = await MarketplaceBooking.findOne({ _id: req.params.id, userId: req.user.id, status: 'rescheduled' });
    if (!booking) return res.status(404).json({ error: 'Booking not found or not rescheduled' });
    booking.status = 'accepted';
    booking.userConfirmed = true;
    booking.preferredDate = booking.offeredDate;
    booking.preferredTime = booking.offeredTime;
    await booking.save();
    res.json({ message: 'Confirmed! Your appointment is set.', booking });
});

// Professional: View bookings for my listings
app.get('/professional/api/marketplace/bookings', profAuthForGroups, async (req, res) => {
    try {
        // Get all listings by this professional
        const myListings = await MarketplaceListing.find({ submittedByProfessional: req.professional._id }).select('_id').lean();
        const listingIds = myListings.map(l => l._id);
        // Also include directly assigned bookings
        const bookings = await MarketplaceBooking.find({
            $or: [{ listingId: { $in: listingIds } }, { professionalId: req.professional._id }]
        })
            .populate('listingId', 'businessName listingType')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 }).lean();
        res.json({ bookings });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Professional: Accept booking
app.put('/professional/api/marketplace/bookings/:id/accept', profAuthForGroups, async (req, res) => {
    const booking = await MarketplaceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    const { responseNote } = req.body;
    booking.status = 'accepted';
    booking.responseNote = responseNote || 'Confirmed. See you then!';
    await booking.save();
    res.json({ message: 'Booking accepted', booking });
});

// Professional: Reject booking
app.put('/professional/api/marketplace/bookings/:id/reject', profAuthForGroups, async (req, res) => {
    const booking = await MarketplaceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    const { responseNote } = req.body;
    booking.status = 'rejected';
    booking.responseNote = responseNote || 'Unable to accommodate this request.';
    await booking.save();
    res.json({ message: 'Booking rejected', booking });
});

// Professional: Offer alternative time
app.put('/professional/api/marketplace/bookings/:id/reschedule', profAuthForGroups, async (req, res) => {
    const booking = await MarketplaceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    const { offeredDate, offeredTime, responseNote } = req.body;
    if (!offeredDate) return res.status(400).json({ error: 'Offered date required' });
    booking.status = 'rescheduled';
    booking.offeredDate = new Date(offeredDate);
    booking.offeredTime = offeredTime || '';
    booking.responseNote = responseNote || 'I have another time available — please confirm.';
    await booking.save();
    res.json({ message: 'Alternative time offered', booking });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log('🤖 AI Chatbot:', process.env.GEMINI_API_KEY ? '✅ Gemini ENABLED' : '⚠️ Fallback mode');
});
