const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professionalSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, default: '' },
    title: { type: String, required: true },
    bio: { type: String, default: '', minlength: 0, maxlength: 1000 },
    profilePhoto: { type: String, default: '' },

    // License
    licenseNumber: { type: String, required: true },
    licensingAuthority: { type: String, required: true },
    licenseCountry: { type: String, default: '' },
    licenseState: { type: String, default: '' },
    licenseDocumentUrl: { type: String, default: '' },

    // Professional details
    specializations: [{ type: String }],
    languages: [{ type: String }],
    sessionTypes: [{ type: String, enum: ['video', 'audio', 'chat', 'in-person'] }],
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },

    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },

    // Availability
    responseTime: { type: String, default: '< 1 hour' },
    isAvailableToday: { type: Boolean, default: false },
    nextAvailable: { type: String, default: '' },
    availability: [{
        day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
        slots: [{ start: String, end: String }],
        isAvailable: { type: Boolean, default: true }
    }],
    maxSessionsPerDay: { type: Number, default: 8 },
    sessionDuration: { type: Number, default: 50 },
    breakTime: { type: Number, default: 10 },
    vacationMode: { type: Boolean, default: false },

    // Status
    status: {
        type: String,
        enum: ['pending_verification', 'approved', 'rejected', 'suspended'],
        default: 'pending_verification'
    },
    rejectionReason: { type: String, default: '' },
    suspendedReason: { type: String, default: '' },
    profileCompleteness: { type: Number, default: 0 },

    // Notification settings
    notificationSettings: {
        emailRequests: { type: Boolean, default: true },
        sessionReminders: { type: Boolean, default: true },
        platformUpdates: { type: Boolean, default: true }
    },

    // Security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },

    // Posts/Blog
    posts: [{
        title: { type: String, required: true, maxlength: 200 },
        content: { type: String, required: true, maxlength: 5000 },
        category: { type: String, enum: ['tip', 'article', 'insight', 'announcement', 'resource'], default: 'tip' },
        isPublished: { type: Boolean, default: true },
        likes: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Hash password
professionalSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
professionalSchema.methods.comparePassword = async function(candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Check lockout
professionalSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Calculate profile completeness
professionalSchema.methods.calculateCompleteness = function() {
    let score = 0;
    if (this.fullName) score += 10;
    if (this.title) score += 10;
    if (this.bio && this.bio.length >= 50) score += 15;
    if (this.profilePhoto) score += 10;
    if (this.specializations?.length) score += 15;
    if (this.sessionTypes?.length) score += 10;
    if (this.languages?.length) score += 5;
    if (this.experienceYears > 0) score += 5;
    if (this.availability?.length) score += 10;
    if (this.phone) score += 5;
    if (this.licenseNumber) score += 5;
    return Math.min(score, 100);
};

// Index for public queries
professionalSchema.index({ status: 1, rating: -1 });

module.exports = mongoose.model('Professional', professionalSchema);
