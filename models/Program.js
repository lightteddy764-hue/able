const mongoose = require('mongoose');

// Wellness Programs (Body-Mind)
const programSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['nutrition', 'yoga', 'breathing', 'routine', 'combined'], required: true },
    
    // Program Structure
    totalDays: { type: Number, required: true },
    sessions: [{
        day: { type: Number },
        title: { type: String },
        description: { type: String },
        type: { type: String, enum: ['video', 'audio', 'article', 'exercise'] },
        duration: { type: Number }, // minutes
        content: { type: String }
    }],
    
    // Meta
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    benefits: [{ type: String }],
    color: { type: String, default: '#E67E22' },
    
    // Stats
    enrolledCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 }
}, { timestamps: true });

// User Program Progress
const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    
    // Progress
    currentDay: { type: Number, default: 1 },
    completedSessions: [{ type: Number }], // day numbers completed
    percentComplete: { type: Number, default: 0 },
    
    // Status
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

progressSchema.index({ user: 1, status: 1 });

const Program = mongoose.model('Program', programSchema);
const Progress = mongoose.model('Progress', progressSchema);

module.exports = { Program, Progress };
