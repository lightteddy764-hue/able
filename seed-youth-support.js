require('dotenv').config();
const mongoose = require('mongoose');
const {
    YouthPageSettings, SkillProgress, YouthAssessment, YouthProgram,
    YouthCareer, YouthCounselor, YouthChallenge, YouthAchievement, YouthResource
} = require('./models/YouthSupport');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await Promise.all([
        YouthPageSettings.deleteMany({}), SkillProgress.deleteMany({}),
        YouthAssessment.deleteMany({}), YouthProgram.deleteMany({}),
        YouthCareer.deleteMany({}), YouthCounselor.deleteMany({}),
        YouthChallenge.deleteMany({}), YouthAchievement.deleteMany({}),
        YouthResource.deleteMany({})
    ]);

    // Settings
    await YouthPageSettings.create({
        key: 'singleton',
        heroBadge: 'Ages 13–24',
        heroHeadline: 'Your Future Starts Here 🚀',
        heroDescription: 'Get personalized guidance for school, career choices, confidence building, and mental wellness — all in one place.',
        heroFeatures: ['Career Discovery', 'Aptitude Testing', 'Wellness Support', 'Confidence Building'],
        heroButtonText: 'Take Youth Assessment',
        heroButtonLink: '#modules',
        heroGrowthScore: 78,
        heroGrowthLabel: 'Growth Score',
        heroGrowthTrend: '↑ 8% This Month'
    });
    console.log('✅ Settings seeded');

    // Progress
    await SkillProgress.insertMany([
        { label: 'Confidence', percentage: 70, color: '#8B5CF6', displayOrder: 1 },
        { label: 'Wellness', percentage: 55, color: '#10B981', displayOrder: 2 },
        { label: 'Career Clarity', percentage: 40, color: '#3B82F6', displayOrder: 3 },
        { label: 'Social Skills', percentage: 60, color: '#F59E0B', displayOrder: 4 }
    ]);
    console.log('✅ Progress bars seeded');

    // Assessments
    await YouthAssessment.insertMany([
        { icon: '📊', title: 'Career Discovery Assessment', description: 'Find careers that match your personality', iconBgColor: '#EFF6FF', iconColor: '#3B82F6', displayOrder: 1 },
        { icon: '⭐', title: 'Confidence Building Course', description: '7-day program for self-esteem', iconBgColor: '#F3E8FF', iconColor: '#8B5CF6', displayOrder: 2 },
        { icon: '💚', title: 'Exam Stress Toolkit', description: 'Practical tools for test anxiety', iconBgColor: '#ECFDF5', iconColor: '#10B981', displayOrder: 3 }
    ]);
    console.log('✅ Assessments seeded');

    // Programs
    await YouthProgram.insertMany([
        { title: 'Career Discovery', description: '95 career paths • Personality matching', image: '/images/youth-career-discovery.png', gradientStart: '#3B82F6', gradientEnd: '#60A5FA', progressText: '40% Explored', buttonText: 'Continue', displayOrder: 1 },
        { title: 'Confidence Building', description: 'Self-esteem exercises • Daily challenges', image: '/images/youth-confidence-building.png', gradientStart: '#8B5CF6', gradientEnd: '#A78BFA', progressText: '70% Complete', buttonText: 'Continue', displayOrder: 2 },
        { title: 'Wellness Check-In', description: 'Weekly mood tracking • Guided support', image: '/images/youth-wellness-checkin.png', gradientStart: '#10B981', gradientEnd: '#34D399', progressText: 'This Week Available', buttonText: 'Check In', displayOrder: 3 },
        { title: 'Personal Coach', description: 'Book a counselor • Available tomorrow', image: '/images/youth-personal-coach.png', gradientStart: '#E67E22', gradientEnd: '#F59E0B', progressText: '50+ Counselors', buttonText: 'Book Session', displayOrder: 4 }
    ]);
    console.log('✅ Programs seeded');

    // Careers
    await YouthCareer.insertMany([
        { name: 'Software Engineer', matchPercent: 92, skillTags: ['Problem-solving', 'Logic', 'Creativity'], displayOrder: 1 },
        { name: 'Graphic Designer', matchPercent: 87, skillTags: ['Visual thinking', 'Creativity', 'Detail'], displayOrder: 2 },
        { name: 'Psychologist', matchPercent: 84, skillTags: ['Empathy', 'Communication', 'Analysis'], displayOrder: 3 },
        { name: 'Content Creator', matchPercent: 79, skillTags: ['Storytelling', 'Social', 'Innovation'], displayOrder: 4 }
    ]);
    console.log('✅ Careers seeded');

    // Counselor
    await YouthCounselor.create({
        key: 'featured',
        name: 'Sarah Johnson',
        role: 'Youth Development Specialist',
        rating: 4.9,
        experience: 12,
        availability: 'Available Today',
        initials: 'SJ',
        bookingLink: 'healing-zone.html',
        isVerified: true
    });
    console.log('✅ Counselor seeded');

    // Challenges
    await YouthChallenge.insertMany([
        { title: '7-Day Confidence Challenge', duration: '7 Days', status: 'completed', displayOrder: 1 },
        { title: 'Digital Detox', duration: '3 Days', status: 'completed', displayOrder: 2 },
        { title: 'Morning Routine Challenge', duration: '5 Days', status: 'pending', displayOrder: 3 },
        { title: 'Gratitude Journal', duration: '7 Days', status: 'pending', displayOrder: 4 }
    ]);
    console.log('✅ Challenges seeded');

    // Achievements
    await YouthAchievement.insertMany([
        { title: 'First Assessment', icon: '🏆', status: 'earned', color: '#F59E0B', displayOrder: 1 },
        { title: '7-Day Streak', icon: '⭐', status: 'earned', color: '#E67E22', displayOrder: 2 },
        { title: 'Career Explorer', icon: '🎯', status: 'earned', color: '#3B82F6', displayOrder: 3 },
        { title: 'Wellness Learner', icon: '🧠', status: 'locked', color: '#10B981', displayOrder: 4 },
        { title: 'Confidence Master', icon: '💪', status: 'locked', color: '#8B5CF6', displayOrder: 5 },
        { title: 'Community Mentor', icon: '🌟', status: 'locked', color: '#EC4899', displayOrder: 6 }
    ]);
    console.log('✅ Achievements seeded');

    // Resources
    await YouthResource.insertMany([
        { icon: '😔', iconColor: '#EC4899', categoryName: 'Body Image', resourceCount: '4 Resources', mediaCount: '2 Videos', displayOrder: 1 },
        { icon: '🛡️', iconColor: '#EF4444', categoryName: 'Anti-Bullying', resourceCount: '6 Resources', mediaCount: '1 Workshop', displayOrder: 2 },
        { icon: '👥', iconColor: '#F59E0B', categoryName: 'Peer Pressure', resourceCount: '3 Guides', mediaCount: '1 Quiz', displayOrder: 3 },
        { icon: '📝', iconColor: '#3B82F6', categoryName: 'Exam Stress', resourceCount: '5 Tools', mediaCount: '3 Audio', displayOrder: 4 },
        { icon: '💬', iconColor: '#8B5CF6', categoryName: 'Social Media', resourceCount: '4 Articles', mediaCount: '2 Videos', displayOrder: 5 },
        { icon: '❤️', iconColor: '#10B981', categoryName: 'Self-Esteem', resourceCount: '7 Exercises', mediaCount: 'Daily Tips', displayOrder: 6 }
    ]);
    console.log('✅ Resources seeded');

    console.log('\n🎉 Youth Support page seeded successfully!');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
