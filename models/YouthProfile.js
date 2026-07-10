const mongoose = require('mongoose');

const youthProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    ageGroup: { type: String, enum: ['13-15', '16-18', '19-24'], default: '16-18' },
    focusAreas: [{ type: String }],
    confidenceScore: { type: Number, default: 50, min: 0, max: 100 },
    wellnessScore: { type: Number, default: 50, min: 0, max: 100 },
    careerClarityScore: { type: Number, default: 30, min: 0, max: 100 },
    socialSkillsScore: { type: Number, default: 40, min: 0, max: 100 },
    interests: [{ type: String }],
    learningStyle: { type: String, enum: ['videos', 'reading', 'tasks', 'mentorship'], default: 'videos' },
    completedModules: [{ type: String }],
    completedLessons: [{ type: String }],
    completedChallenges: [{ type: String }],
    earnedAchievements: [{ type: String }],
    savedCareers: [{ type: String }],
    assessmentCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('YouthProfile', youthProfileSchema);
