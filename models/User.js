const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    
    // Wellness Data
    assessment: {
        completed: { type: Boolean, default: false },
        whodasScore: { type: Number, default: 0 },
        severityLevel: { type: String, enum: ['', 'mild', 'moderate', 'severe'], default: '' },
        whodasAnswers: { type: Object, default: {} },
        completedAt: { type: Date }
    },
    
    // Preferences
    wellnessGoals: [{ type: String }],
    preferredSessionType: { type: String, default: 'video' },
    preferredSchedule: { type: String, default: 'morning' },
    
    // Mood tracking
    moodHistory: [{
        mood: { type: String },
        date: { type: Date, default: Date.now }
    }],
    
    // Settings
    notifications: {
        sessions: { type: Boolean, default: true },
        community: { type: Boolean, default: true },
        wellness: { type: Boolean, default: false },
        storyReactions: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
    },
    privacy: {
        profileVisible: { type: Boolean, default: true },
        anonymousMode: { type: Boolean, default: false },
        twoFactor: { type: Boolean, default: false }
    },
    appearance: {
        darkMode: { type: Boolean, default: false },
        reduceAnimations: { type: Boolean, default: false },
        compactView: { type: Boolean, default: false },
        textSize: { type: String, enum: ['small', 'normal', 'large'], default: 'normal' }
    },
    
    // Subscription
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    planExpiresAt: { type: Date },
    isBlocked: { type: Boolean, default: false },
    
    // Activity
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    completedTasks: { type: Number, default: 0 },
    sessionsBooked: { type: Number, default: 0 }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
