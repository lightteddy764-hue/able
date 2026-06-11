const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
    
    // Session Details
    type: { type: String, enum: ['video', 'audio', 'chat', 'in-person'], required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 50 }, // minutes
    
    // Status
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
    
    // Notes
    userNotes: { type: String, default: '' },
    therapistNotes: { type: String, default: '' },
    
    // Rating (after session)
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: '' },
    
    // Payment
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'free'], default: 'free' }
}, { timestamps: true });

sessionSchema.index({ user: 1, scheduledAt: -1 });
sessionSchema.index({ therapist: 1, scheduledAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
