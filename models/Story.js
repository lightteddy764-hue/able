const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'Anonymous' },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['recovery', 'anxiety', 'growth', 'gratitude', 'advice', 'relationships'], required: true },
    isAnonymous: { type: Boolean, default: false },
    
    // Engagement
    reactions: {
        inspired: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        relatable: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        hopeful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        thankYou: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        isAnonymous: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Metrics
    readCount: { type: Number, default: 0 },
    readTime: { type: Number, default: 3 }, // minutes
    isFeatured: { type: Boolean, default: false },
    
    // Status
    status: { type: String, enum: ['published', 'draft', 'pending', 'rejected'], default: 'published' },
    
    // Image
    image: { type: String, default: '' }
}, { timestamps: true });

storySchema.index({ category: 1, createdAt: -1 });
storySchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Story', storySchema);
