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
        {
            title: 'Career Discovery', description: 'Explore career paths & find your fit', image: '/images/youth-career-discovery.png',
            gradientStart: '#3B82F6', gradientEnd: '#60A5FA', buttonText: 'Start Learning', displayOrder: 1, moduleType: 'lessons',
            lessons: [
                { title: 'How to Discover Your Strengths', type: 'article', duration: '5 min', content: 'Your strengths are the things you do well and enjoy. Start by asking yourself three questions:\n\n1. What activities make me lose track of time?\n2. What do friends and teachers say I am good at?\n3. What problems do I enjoy solving?\n\nWrite down your answers. Patterns will appear — maybe you love organizing, helping people, building things, or explaining ideas. These patterns point toward careers where you will naturally thrive.\n\nTip: Strengths are not fixed. Every skill you practice becomes a future strength.' },
                { title: 'Understanding Career Clusters', type: 'article', duration: '6 min', content: 'Careers group into clusters that share similar skills:\n\n• Technology — building software, data, security\n• Health & Care — nursing, therapy, medicine\n• Creative — design, writing, media, music\n• Business — marketing, finance, management\n• Trades — electrician, mechanic, construction\n• Education & Social — teaching, counseling, social work\n\nYou do not need to pick one forever. Knowing the cluster that excites you helps you choose subjects, internships, and first jobs that move you in the right direction.' },
                { title: 'Activity: Map Your Interests', type: 'activity', duration: '10 min', content: 'Grab a paper or notes app and make three columns:\n\nLIKE | NEUTRAL | DISLIKE\n\nNow sort these activities into the columns:\n- Working with numbers\n- Helping people one-on-one\n- Designing or drawing\n- Leading a group\n- Fixing or building things\n- Writing and explaining\n- Researching and analyzing\n\nLook at your LIKE column. The careers that use those activities most are worth exploring first. Save this list — you will use it when picking your next steps.' },
                { title: 'Reflection: Where Do You See Yourself?', type: 'reflection', duration: '5 min', content: 'Close your eyes and imagine a normal workday five years from now.\n\n- Are you indoors or outdoors?\n- Working alone or with a team?\n- Using your hands, your words, or your ideas?\n- What does a good day feel like?\n\nThere are no wrong answers. This is your vision, not anyone else\u2019s. Note one career that fits the picture and one small step you could take this month to learn more about it.' }
            ]
        },
        {
            title: 'Confidence Building', description: 'Practical exercises to grow self-belief', image: '/images/youth-confidence-building.png',
            gradientStart: '#8B5CF6', gradientEnd: '#A78BFA', buttonText: 'Start Learning', displayOrder: 2, moduleType: 'lessons',
            lessons: [
                { title: 'What Confidence Really Is', type: 'article', duration: '4 min', content: 'Confidence is not about never feeling afraid. It is about trusting that you can handle what comes, even when you are nervous.\n\nConfident people still feel doubt. The difference is they act anyway, and each action builds proof that they can cope. Confidence is a skill you grow through small repeated wins, not a personality trait you are born with.' },
                { title: 'The Power of Self-Talk', type: 'article', duration: '5 min', content: 'The way you talk to yourself shapes how you feel. Harsh self-talk ("I always mess up") drains confidence. Kinder, realistic self-talk builds it.\n\nTry this swap:\n- "I can\u2019t do this" becomes "I can\u2019t do this yet"\n- "I\u2019m so stupid" becomes "I made a mistake and I can learn from it"\n- "Everyone is judging me" becomes "Most people are focused on themselves"\n\nYou are not lying to yourself. You are choosing the most useful true thought.' },
                { title: 'Activity: The Confidence Journal', type: 'activity', duration: '7 min', content: 'Each night for one week, write down:\n\n1. One thing you did today that took a little courage\n2. One thing you are good at\n3. One kind thing someone said or that you did for someone\n\nThis trains your brain to notice evidence of your worth. After a week, read back through your entries. The proof of your growth will be right there in your own handwriting.' },
                { title: 'Power Posture & Breathing', type: 'tip', duration: '3 min', content: 'Your body affects your mind. Before a stressful moment — a presentation, a tough talk, an exam:\n\n1. Stand tall, shoulders back, chin level.\n2. Breathe in slowly for 4 counts.\n3. Hold for 4 counts.\n4. Breathe out for 6 counts.\n5. Repeat 3 times.\n\nThis calms your nervous system and signals to your brain that you are safe and capable. Athletes and speakers use this exact trick before they perform.' },
                { title: 'Reflection: Your Wins', type: 'reflection', duration: '4 min', content: 'Think back to a time you were scared to do something but did it anyway. Maybe a first day, a performance, standing up for a friend.\n\n- How did you feel before?\n- What did you actually do?\n- How did you feel afterward?\n\nThat courage is already inside you. You have done hard things before, which means you can do them again.' }
            ]
        },
        {
            title: 'Wellness Check-In', description: 'Track your mood & build healthy habits', image: '/images/youth-wellness-checkin.png',
            gradientStart: '#10B981', gradientEnd: '#34D399', buttonText: 'Check In Now', displayOrder: 3, moduleType: 'wellness',
            lessons: []
        },
        {
            title: 'Personal Coach', description: 'Connect with a youth counselor', image: '/images/youth-personal-coach.png',
            gradientStart: '#E67E22', gradientEnd: '#F59E0B', buttonText: 'Book Session', displayOrder: 4, moduleType: 'counselor',
            lessons: []
        }
    ]);
    console.log('✅ Programs seeded (with lessons)');

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
