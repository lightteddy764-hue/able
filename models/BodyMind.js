const mongoose = require('mongoose');

// CMS content for body-mind page (admin-managed, singleton)
const bodyMindPageSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },
    hero: {
        title: { type: String, default: 'Build a Stronger Mind & Healthier Body' },
        subtitle: { type: String, default: 'Personalized nutrition, breathing exercises, movement routines, and mindfulness practices.' },
        checks: [{ type: String }]
    },
    todayRecommendation: {
        title: { type: String, default: "Today's Focus: Reduce Anxiety Through Breathing" },
        description: { type: String, default: 'A 10-minute guided session combining 4-7-8 breathing with progressive muscle relaxation.' },
        duration: { type: String, default: '10 min' },
        level: { type: String, default: 'Beginner' },
        tags: [{ type: String }]
    },
    programs: [{
        title: { type: String },
        description: { type: String },
        totalDays: { type: Number, default: 30 },
        gradientStart: { type: String, default: '#E67E22' },
        gradientEnd: { type: String, default: '#F59E0B' },
        category: { type: String, enum: ['anxiety', 'sleep', 'energy', 'focus', 'routine'], default: 'anxiety' },
        isActive: { type: Boolean, default: true }
    }],
    sessions: [{
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String, enum: ['nutrition', 'yoga', 'breathing', 'routine'], required: true },
        duration: { type: Number, default: 5 },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'beginner' },
        tags: [{ type: String }],
        icon: { type: String, default: '🧘' },
        gradientStart: { type: String, default: '#10B981' },
        gradientEnd: { type: String, default: '#34D399' },
        steps: [{ type: String }],
        isActive: { type: Boolean, default: true }
    }],
    habits: [{
        title: { type: String, required: true },
        icon: { type: String, default: '✓' },
        isActive: { type: Boolean, default: true }
    }]
}, { timestamps: true });

// User progress for body-mind
const bodyMindProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Programs
    activePrograms: [{
        programId: { type: String },
        programTitle: { type: String },
        currentDay: { type: Number, default: 1 },
        startedAt: { type: Date, default: Date.now }
    }],
    // Sessions completed
    completedSessions: [{
        sessionId: { type: String },
        sessionTitle: { type: String },
        category: { type: String },
        completedAt: { type: Date, default: Date.now }
    }],
    // Today's habits
    todayHabits: [{
        habitTitle: { type: String },
        completed: { type: Boolean, default: false },
        date: { type: Date }
    }],
    // Daily routine
    routine: [{
        time: { type: String },
        title: { type: String },
        completed: { type: Boolean, default: false }
    }],
    // Stats
    streak: { type: Number, default: 0 },
    totalSessionsCompleted: { type: Number, default: 0 },
    weeklyGoal: { type: Number, default: 5 },
    weeklyCompleted: { type: Number, default: 0 },
    lastActivityAt: { type: Date }
}, { timestamps: true });

bodyMindProgressSchema.index({ userId: 1 });

const BodyMindPage = mongoose.model('BodyMindPage', bodyMindPageSchema);
const BodyMindProgress = mongoose.model('BodyMindProgress', bodyMindProgressSchema);

module.exports = { BodyMindPage, BodyMindProgress };
