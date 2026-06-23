const mongoose = require('mongoose');

const professionalAuditLogSchema = new mongoose.Schema({
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },
    adminId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    action:         { type: String, required: true },
    targetType:     { type: String, default: '' },
    targetId:       { type: mongoose.Schema.Types.ObjectId },
    details:        { type: String, default: '' },
    ip:             { type: String, default: '' },
    userAgent:      { type: String, default: '' }
}, { timestamps: true });

professionalAuditLogSchema.index({ professionalId: 1, createdAt: -1 });
professionalAuditLogSchema.index({ action: 1 });

module.exports = mongoose.model('ProfessionalAuditLog', professionalAuditLogSchema);
