const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['superadmin', 'admin', 'moderator'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
}, { timestamps: true });

adminSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = async function(candidate) {
    return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

module.exports = mongoose.model('Admin', adminSchema);
