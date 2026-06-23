const mongoose = require('mongoose');

const professionalSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },

    sessionType: { type: String, enum: ['video', 'audio', 'chat', 'in-person'], required: true },
    concern: { type: String, required: true },
    userNote: { type: String, default: '', maxlength: 1000 },

    requestedAt: { type: Date, required: true },
    scheduledAt: { type: Date },
    suggestedNewTime: { type: Date },

    status: {
        type: String,
        enum: ['requested', 'accepted', 'rejected', 'reschedule_suggested', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'requested'
    },

    rejectReason: { type: String, default: '', maxlength: 500 },
    cancelReason: { type: String, default: '', maxlength: 500 },
    professionalPrivateNote: { type: String, default: '', maxlength: 2000 },
    meetingLink: { type: String, default: '' }
}, { timestamps: true });

professionalSessionSchema.index({ professionalId: 1, status: 1, createdAt: -1 });
professionalSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ProfessionalSession', professionalSessionSchema);
