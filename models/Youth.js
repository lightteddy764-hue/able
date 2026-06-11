const mongoose = require('mongoose');

// Aptitude Assessment Results
const aptitudeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Results
    personalityType: { type: String, default: '' },
    strengths: [{ type: String }],
    learningStyle: { type: String, default: '' },
    
    // Career Matches
    careerMatches: [{
        career: { type: String },
        matchPercent: { type: Number },
        traits: [{ type: String }]
    }],
    
    // Scores
    scores: {
        confidence: { type: Number, default: 0 },
        wellness: { type: Number, default: 0 },
        careerClarity: { type: Number, default: 0 },
        socialSkills: { type: Number, default: 0 }
    },
    
    // Growth tracking
    growthScore: { type: Number, default: 0 },
    growthHistory: [{
        score: { type: Number },
        date: { type: Date, default: Date.now }
    }],
    
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Youth Challenges
const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, default: 7 }, // days
    category: { type: String, enum: ['confidence', 'wellness', 'social', 'academic', 'digital'], required: true },
    
    // Participants
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        progress: { type: Number, default: 0 },
        completedDays: [{ type: Number }],
        joinedAt: { type: Date, default: Date.now }
    }],
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Achievements/Badges
const achievementSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badge: { type: String, required: true }, // e.g. "first-assessment", "7-day-streak"
    title: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    earnedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ user: 1 });

const Aptitude = mongoose.model('Aptitude', aptitudeSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = { Aptitude, Challenge, Achievement };
