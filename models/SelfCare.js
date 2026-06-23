const mongoose = require('mongoose');

// CMS content for the self-care page (admin-managed, singleton)
const selfCarePageSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },
    hero: {
        title: { type: String, default: 'Your Self-Care Space' },
        subtitle: { type: String, default: 'Small steps to feel calmer, clearer, and more supported.' },
        primaryCta: { type: String, default: 'Start Today\'s Check-In' },
        secondaryCta: { type: String, default: 'Explore Self-Care Tools' }
    },
    categories: [{
        title: { type: String, required: true },
        description: { type: String, default: '' },
        icon: { type: String, default: '🧘' },
        moodTags: [{ type: String }],
        timeRequired: { type: Number, default: 5 },
        contentType: { type: String, enum: ['breathing', 'journaling', 'movement', 'sleep', 'article', 'grounding', 'music', 'routine'], default: 'article' },
        steps: [{ type: String }],
        isActive: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 }
    }],
    emergencyCard: {
        title: { type: String, default: 'Need urgent help?' },
        description: { type: String, default: 'If you feel unsafe or may hurt yourself or someone else, please contact emergency support or a trusted person immediately.' },
        buttonText: { type: String, default: 'Get Crisis Support' }
    }
}, { timestamps: true });

// User check-in data (per user, per day)
const selfCareCheckInSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: String, enum: ['great', 'okay', 'calm', 'happy', 'stressed', 'sad', 'angry', 'anxious', 'tired', 'overwhelmed'], default: 'okay' },
    energy: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    stressLevel: { type: Number, min: 1, max: 10, default: 5 },
    timeAvailable: { type: Number, default: 5 },
    selectedGoal: { type: String, default: '' },
    recommendedTasks: [{ type: String }],
    completedTasks: [{ type: String }],
    date: { type: Date, default: () => { const d = new Date(); d.setHours(0,0,0,0); return d; } }
}, { timestamps: true });

selfCareCheckInSchema.index({ userId: 1, date: -1 });

const SelfCarePage = mongoose.model('SelfCarePage', selfCarePageSchema);
const SelfCareCheckIn = mongoose.model('SelfCareCheckIn', selfCareCheckInSchema);

module.exports = { SelfCarePage, SelfCareCheckIn };
