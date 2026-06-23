const mongoose = require('mongoose');

// Singleton — Hero section + page settings
const youthPageSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },

    // Hero Section
    heroBadge: { type: String, default: 'Ages 13–24' },
    heroHeadline: { type: String, default: 'Your Future Starts Here 🚀' },
    heroDescription: { type: String, default: 'Get personalized guidance for school, career choices, confidence building, and mental wellness — all in one place.' },
    heroFeatures: [{ type: String }],
    heroButtonText: { type: String, default: 'Take Youth Assessment' },
    heroButtonLink: { type: String, default: '#modules' },
    heroGrowthScore: { type: Number, default: 78 },
    heroGrowthLabel: { type: String, default: 'Growth Score' },
    heroGrowthTrend: { type: String, default: '↑ 8% This Month' }
}, { timestamps: true });

// Skill Progress Bars
const skillProgressSchema = new mongoose.Schema({
    label: { type: String, required: true },
    percentage: { type: Number, default: 50, min: 0, max: 100 },
    color: { type: String, default: '#8B5CF6' },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Assessments & Toolkits (Recommended section)
const youthAssessmentSchema = new mongoose.Schema({
    icon: { type: String, default: '📊' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    link: { type: String, default: '#' },
    iconBgColor: { type: String, default: '#EFF6FF' },
    iconColor: { type: String, default: '#3B82F6' },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Support Program Cards (Growth Modules)
const youthProgramSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    gradientStart: { type: String, default: '#3B82F6' },
    gradientEnd: { type: String, default: '#60A5FA' },
    progressText: { type: String, default: '' },
    buttonText: { type: String, default: 'Continue' },
    buttonLink: { type: String, default: '#' },
    // Real, completable content inside each module
    moduleType: { type: String, enum: ['lessons', 'wellness', 'counselor'], default: 'lessons' },
    lessons: [{
        title: { type: String, required: true },
        type: { type: String, enum: ['article', 'activity', 'tip', 'reflection'], default: 'article' },
        duration: { type: String, default: '5 min' },
        content: { type: String, default: '' }
    }],
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Career Matches
const youthCareerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    matchPercent: { type: Number, default: 85, min: 0, max: 100 },
    skillTags: [{ type: String }],
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Featured Counselor
const youthCounselorSchema = new mongoose.Schema({
    key: { type: String, default: 'featured', unique: true },
    name: { type: String, default: 'Sarah Johnson' },
    role: { type: String, default: 'Youth Development Specialist' },
    rating: { type: Number, default: 4.9, min: 0, max: 5 },
    experience: { type: Number, default: 12 },
    availability: { type: String, default: 'Available Today' },
    initials: { type: String, default: 'SJ' },
    photo: { type: String, default: '' },
    bookingLink: { type: String, default: 'healing-zone.html' },
    isVerified: { type: Boolean, default: true }
}, { timestamps: true });

// Weekly Challenges
const youthChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: String, default: '7 Days' },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Achievements
const youthAchievementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    status: { type: String, enum: ['earned', 'locked'], default: 'locked' },
    color: { type: String, default: '#F59E0B' },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Resource Categories
const youthResourceSchema = new mongoose.Schema({
    icon: { type: String, default: '📚' },
    iconColor: { type: String, default: '#EC4899' },
    categoryName: { type: String, required: true },
    resourceCount: { type: String, default: '4 Resources' },
    mediaCount: { type: String, default: '2 Videos' },
    link: { type: String, default: '#' },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Models
const YouthPageSettings = mongoose.model('YouthPageSettings', youthPageSettingsSchema);
const SkillProgress = mongoose.model('SkillProgress', skillProgressSchema);
const YouthAssessment = mongoose.model('YouthAssessment', youthAssessmentSchema);
const YouthProgram = mongoose.model('YouthProgram', youthProgramSchema);
const YouthCareer = mongoose.model('YouthCareer', youthCareerSchema);
const YouthCounselor = mongoose.model('YouthCounselor', youthCounselorSchema);
const YouthChallenge = mongoose.model('YouthChallenge', youthChallengeSchema);
const YouthAchievement = mongoose.model('YouthAchievement', youthAchievementSchema);
const YouthResource = mongoose.model('YouthResource', youthResourceSchema);

module.exports = {
    YouthPageSettings,
    SkillProgress,
    YouthAssessment,
    YouthProgram,
    YouthCareer,
    YouthCounselor,
    YouthChallenge,
    YouthAchievement,
    YouthResource
};
