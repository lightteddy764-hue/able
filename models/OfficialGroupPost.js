const mongoose = require('mongoose');

const officialGroupPostSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Which collection groupId points to. 'Community' = official group, 'FeaturedCircle' = circle card.
    groupModel: { type: String, enum: ['Community', 'FeaturedCircle'], default: 'Community' },

    // Author
    authorType: { type: String, enum: ['admin', 'professional'], required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },

    // Content
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    summary: { type: String, default: '', maxlength: 500 },
    contentType: { type: String, enum: ['announcement', 'guide', 'learning', 'challenge', 'resource', 'safety'], default: 'announcement' },

    // References & attachments
    sourceRefs: [{ type: String }],
    attachments: [{
        title: { type: String },
        url: { type: String },
        type: { type: String }
    }],

    // Reactions
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['like', 'helpful', 'insightful', 'thank_you'], default: 'like' },
        createdAt: { type: Date, default: Date.now }
    }],

    // Comments
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 1000 },
        status: { type: String, enum: ['published', 'hidden', 'reported'], default: 'published' },
        createdAt: { type: Date, default: Date.now }
    }],

    // Status
    isPinned: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'published' },
    viewCount: { type: Number, default: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

officialGroupPostSchema.index({ groupId: 1, status: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('OfficialGroupPost', officialGroupPostSchema);
