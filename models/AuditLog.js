const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminUsername: { type: String },
    action: { type: String, required: true }, // e.g. 'user.block', 'story.approve', 'landing.update'
    targetType: { type: String }, // e.g. 'User', 'Story', 'Therapist', 'LandingPage'
    targetId: { type: String },
    details: { type: String },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
