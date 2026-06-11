const mongoose = require('mongoose');

const wellnessTaskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    tasks: [{
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date }
    }]
}, { timestamps: true });

// Unique constraint: one task list per user per day
wellnessTaskSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WellnessTask', wellnessTaskSchema);
