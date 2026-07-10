const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema({
    businessName: { type: String, required: true, trim: true },

    listingType: {
        type: String,
        enum: ['spa', 'mental_health_center', 'therapy_clinic', 'yoga_studio', 'meditation_center', 'fitness_wellness', 'nutrition_store', 'wellness_product_store', 'professional_service', 'other'],
        required: true
    },

    description: { type: String, required: true },
    services: [{ type: String }],

    location: {
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: '' },
        pincode: { type: String, default: '' },
        latitude: { type: Number },
        longitude: { type: Number }
    },

    contact: {
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        website: { type: String, default: '' },
        whatsapp: { type: String, default: '' }
    },

    images: [{ type: String }],

    openingHours: [{
        day: { type: String },
        open: { type: String },
        close: { type: String },
        isClosed: { type: Boolean, default: false }
    }],

    priceRange: {
        type: String,
        enum: ['free', 'low', 'medium', 'premium', 'unknown'],
        default: 'unknown'
    },

    tags: [{ type: String }],

    // Submission info
    submittedByType: { type: String, enum: ['vendor', 'professional', 'admin'], default: 'vendor' },
    submittedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedByProfessional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },

    isProfessionalLinked: { type: Boolean, default: false },
    linkedProfessionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },

    // Approval
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'hidden'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },

    isFeatured: { type: Boolean, default: false },

    // Stats
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },

    // Reports
    reports: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, enum: ['incorrect_information', 'unsafe_claim', 'fake_listing', 'spam', 'inappropriate_content', 'other'], default: 'other' },
        details: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],

    // License (not shown publicly)
    licenseNumber: { type: String, default: '' },
    qualification: { type: String, default: '' },
    professionalAssociation: { type: String, default: '' }
}, { timestamps: true });

marketplaceListingSchema.index({ status: 1, listingType: 1, isFeatured: -1 });
marketplaceListingSchema.index({ 'location.city': 1, status: 1 });
marketplaceListingSchema.index({ submittedByUser: 1 });
marketplaceListingSchema.index({ submittedByProfessional: 1 });

module.exports = mongoose.model('MarketplaceListing', marketplaceListingSchema);
