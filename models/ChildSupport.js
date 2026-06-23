const mongoose = require('mongoose');

// CMS content for child support page (admin-managed, singleton)
const childSupportPageSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },
    hero: {
        title: { type: String, default: 'Child Support Guide' },
        subtitle: { type: String, default: 'Gentle tools to understand, support, and guide your child.' },
        primaryCta: { type: String, default: 'Choose Child Age Group' }
    },
    ageGroups: [{
        label: { type: String, required: true },
        range: { type: String, default: '' },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true }
    }],
    concerns: [{
        title: { type: String, required: true },
        slug: { type: String, required: true },
        ageGroups: [{ type: String }],
        signs: [{ type: String }],
        whatToDo: [{ type: String }],
        whatToAvoid: [{ type: String }],
        conversationStarters: [{ type: String }],
        whenToSeekHelp: [{ type: String }],
        activities: [{ type: String }],
        isActive: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 }
    }],
    safetyRules: [{
        keyword: { type: String, required: true },
        responseTitle: { type: String, default: '' },
        responseText: { type: String, default: '' },
        severity: { type: String, enum: ['high', 'critical'], default: 'high' }
    }]
}, { timestamps: true });

// Child profiles (minimal data, guardian-owned)
const childProfileSchema = new mongoose.Schema({
    guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nickname: { type: String, required: true, maxlength: 30 },
    ageGroup: { type: String, required: true },
    concerns: [{ type: String }],
    notes: [{
        text: { type: String, maxlength: 500 },
        mood: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    routine: [{
        title: { type: String },
        time: { type: String },
        completed: { type: Boolean, default: false }
    }]
}, { timestamps: true });

childProfileSchema.index({ guardianUserId: 1 });

const ChildSupportPage = mongoose.model('ChildSupportPage', childSupportPageSchema);
const ChildProfile = mongoose.model('ChildProfile', childProfileSchema);

module.exports = { ChildSupportPage, ChildProfile };
