const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Clinical Psychologist"
    avatar: { type: String, default: '' },
    
    // Professional Info
    specializations: [{ type: String }], // anxiety, depression, trauma, etc.
    experience: { type: Number, required: true }, // years
    education: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: true },
    
    // Session Info
    sessionTypes: [{ type: String, enum: ['video', 'audio', 'chat', 'in-person'] }],
    languages: [{ type: String }],
    sessionRate: { type: Number, default: 0 }, // per session in dollars
    
    // Availability
    availability: {
        monday: [{ start: String, end: String }],
        tuesday: [{ start: String, end: String }],
        wednesday: [{ start: String, end: String }],
        thursday: [{ start: String, end: String }],
        friday: [{ start: String, end: String }],
        saturday: [{ start: String, end: String }],
        sunday: [{ start: String, end: String }]
    },
    isAvailableToday: { type: Boolean, default: true },
    nextAvailable: { type: String, default: 'Today' },
    
    // Ratings
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    responseTime: { type: String, default: '1 hour' }, // avg response time
    
    // Bio
    bio: { type: String, default: '' },
    approach: { type: String, default: '' }, // CBT, EMDR, Mindfulness, etc.
    
    // Status
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

therapistSchema.index({ specializations: 1, rating: -1 });
therapistSchema.index({ isAvailableToday: 1 });

module.exports = mongoose.model('Therapist', therapistSchema);
