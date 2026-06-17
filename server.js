require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, whodasScore, severityLevel, whodasAnswers } = req.body;

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        // Create user
        const user = new User({
            name,
            email,
            password,
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
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

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

// Update profile
app.put('/api/me', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Don't allow password update here
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
        if (notifications) updates.notifications = notifications;
        if (privacy) updates.privacy = privacy;
        if (appearance) updates.appearance = appearance;
        if (wellnessGoals) updates.wellnessGoals = wellnessGoals;
        if (preferredSessionType) updates.preferredSessionType = preferredSessionType;
        if (preferredSchedule) updates.preferredSchedule = preferredSchedule;
        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
app.put('/api/me/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
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

// Delete own account
app.delete('/api/me', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
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
            user: { name: user.name, plan: user.plan, streak, completedTasks: user.completedTasks, sessionsBooked: user.sessionsBooked },
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
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory, userData } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.json({ response: getFallbackResponse(message, userData), source: 'fallback' });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

// ===== ADMIN ROUTES =====
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

app.post('/admin/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

function adminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Not admin' });
        next();
    } catch(e) { res.status(401).json({ error: 'Invalid token' }); }
}

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

// ============================================================
// YOUTH SUPPORT PAGE — Admin CRUD + Public read endpoints
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

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log('🤖 AI Chatbot:', process.env.GEMINI_API_KEY ? '✅ Gemini ENABLED' : '⚠️ Fallback mode');
});
