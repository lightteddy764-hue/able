const mongoose = require('mongoose');

const marketplaceBookingSchema = new mongoose.Schema({
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },

    // Booking details
    serviceRequested: { type: String, default: '' },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, default: '' },
    note: { type: String, default: '', maxlength: 500 },

    // Status flow: pending → accepted / rejected / rescheduled
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'rescheduled', 'cancelled', 'completed'],
        default: 'pending'
    },

    // Professional response
    responseNote: { type: String, default: '' },
    offeredDate: { type: Date },
    offeredTime: { type: String, default: '' },

    // User confirms rescheduled time
    userConfirmed: { type: Boolean, default: false }
}, { timestamps: true });

marketplaceBookingSchema.index({ listingId: 1, status: 1 });
marketplaceBookingSchema.index({ userId: 1, status: 1 });
marketplaceBookingSchema.index({ professionalId: 1, status: 1 });

module.exports = mongoose.model('MarketplaceBooking', marketplaceBookingSchema);
