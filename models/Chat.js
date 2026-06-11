const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true }, // for anonymous users
    
    // Conversation
    messages: [{
        sender: { type: String, enum: ['user', 'bot'], required: true },
        text: { type: String, required: true },
        source: { type: String, enum: ['ai', 'fallback', 'rule'], default: 'rule' },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // State
    conversationState: { type: String, default: 'greeting' },
    userData: {
        name: { type: String, default: '' },
        age: { type: Number },
        mentalState: { type: String, default: '' },
        concerns: { type: String, default: '' },
        whodasAnswers: { type: Object, default: {} },
        whodasScore: { type: Number, default: 0 },
        severityLevel: { type: String, default: '' }
    },
    
    // Meta
    totalMessages: { type: Number, default: 0 },
    crisisDetected: { type: Boolean, default: false },
    servicesRecommended: [{ type: String }]
}, { timestamps: true });

chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Chat', chatSchema);
