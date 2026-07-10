const mongoose = require('mongoose');

const musicVideoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Meditation Music', 'Sleep Music', 'Focus Music', 'Stress Relief Music', 'Breathing Music', 'Healing Sounds'],
        required: true
    },
    duration: { type: String, default: '' }, // free-form, e.g. "10 min"
    purpose: { type: String, default: '' },  // e.g. "Helps you fall asleep faster"

    youtubeUrl: { type: String, required: true },
    youtubeVideoId: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

musicVideoSchema.index({ isActive: 1, category: 1, displayOrder: 1 });

module.exports = mongoose.model('MusicVideo', musicVideoSchema);
