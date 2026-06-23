const mongoose = require('mongoose');

// CMS content for parenting page (admin-managed, singleton)
const parentingPageSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },
    hero: {
        title: { type: String, default: 'Parenting Support' },
        subtitle: { type: String, default: 'Build calmer communication, stronger routines, and deeper connection with your child.' },
        primaryCta: { type: String, default: 'Choose Your Focus' }
    },
    focusAreas: [{
        title: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String, default: '' },
        icon: { type: String, default: '💬' },
        skills: [{ type: String }],
        scripts: [{
            situation: { type: String },
            sayThis: { type: String },
            avoidThis: { type: String }
        }],
        activities: [{ type: String }],
        isActive: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 }
    }],
    challenges: [{
        title: { type: String, required: true },
        description: { type: String, default: '' },
        durationDays: { type: Number, default: 7 },
        days: [{
            day: { type: Number },
            task: { type: String },
            reflectionPrompt: { type: String }
        }],
        isActive: { type: Boolean, default: true }
    }],
    parentSelfCare: {
        title: { type: String, default: 'Parent Self-Care' },
        description: { type: String, default: 'When parents meet their own mental and physical needs, it benefits both their well-being and their children.' },
        tips: [{ type: String }]
    }
}, { timestamps: true });

// User challenge progress
const parentingChallengeProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: String, required: true },
    challengeTitle: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedDays: [{ type: Number }],
    reflections: [{
        day: { type: Number },
        text: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

parentingChallengeProgressSchema.index({ userId: 1 });

const ParentingPage = mongoose.model('ParentingPage', parentingPageSchema);
const ParentingChallengeProgress = mongoose.model('ParentingChallengeProgress', parentingChallengeProgressSchema);

module.exports = { ParentingPage, ParentingChallengeProgress };
