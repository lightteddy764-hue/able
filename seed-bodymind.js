require('dotenv').config();
const mongoose = require('mongoose');
const { BodyMindPage } = require('./models/BodyMind');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    await BodyMindPage.findOneAndUpdate({ key: 'singleton' }, {
        key: 'singleton',
        hero: {
            title: 'Build a Stronger Mind & Healthier Body',
            subtitle: 'Personalized nutrition, breathing exercises, movement routines, and mindfulness practices — all tailored to your wellness goals.',
            checks: ['50+ Guided Sessions', '120 Nutrition Plans', '30 Breathing Programs', 'Personalized For You']
        },
        todayRecommendation: {
            title: "Today's Focus: Reduce Anxiety Through Breathing",
            description: 'A 10-minute guided session combining 4-7-8 breathing with progressive muscle relaxation.',
            duration: '10 min', level: 'Beginner', tags: ['Anxiety Relief']
        },
        programs: [
            { title: '30-Day Anxiety Reset', description: 'Breathing + Yoga + Nutrition combined', totalDays: 30, gradientStart: '#E67E22', gradientEnd: '#F59E0B', category: 'anxiety' },
            { title: 'Better Sleep Program', description: 'Evening routines + Breathing + Nutrition', totalDays: 14, gradientStart: '#8B5CF6', gradientEnd: '#A78BFA', category: 'sleep' },
            { title: 'Morning Energy Routine', description: 'Yoga flow + Hydration + Mindfulness', totalDays: 21, gradientStart: '#10B981', gradientEnd: '#34D399', category: 'energy' }
        ],
        sessions: [
            { title: 'Omega-3 Brain Boost', description: 'Essential fatty acids for brain health and mood regulation', category: 'nutrition', duration: 5, level: 'beginner', tags: ['Anxiety','Mood'], icon: '🐟', image: '/images/bm-omega3-brain-boost.png', gradientStart: '#4CAF50', gradientEnd: '#81C784', steps: ['Understand omega-3 benefits','Best food sources','Daily intake recommendations','Supplement guide','Meal planning tips'] },
            { title: 'Berry Power Smoothies', description: 'Antioxidant-rich smoothie recipes for mental clarity', category: 'nutrition', duration: 3, level: 'beginner', tags: ['Energy','Focus'], icon: '🫐', image: '/images/bm-berry-power-smoothies.png', gradientStart: '#FF9800', gradientEnd: '#FFB74D', steps: ['Choose your berries','Add protein base','Include healthy fats','Blend technique','Best timing for consumption'] },
            { title: 'Gut Health & Mood', description: 'The gut-brain connection and how diet affects your emotions', category: 'nutrition', duration: 6, level: 'intermediate', tags: ['Digestion','Mood'], icon: '🦠', image: '/images/bm-gut-health-mood.png', gradientStart: '#2196F3', gradientEnd: '#64B5F6', steps: ['Gut-brain axis explained','Probiotic foods','Prebiotic fiber sources','Foods to avoid','7-day gut reset plan'] },
            { title: 'Morning Sun Salutation', description: 'Wake up your body with this energizing yoga sequence', category: 'yoga', duration: 15, level: 'beginner', tags: ['Energy','Stretch'], icon: '☀️', image: '/images/bm-morning-sun-salutation.png', gradientStart: '#E67E22', gradientEnd: '#F59E52', steps: ['Mountain pose','Forward fold','Plank','Cobra','Downward dog','Step forward','Rise to mountain','Repeat 3 cycles'] },
            { title: 'Evening Wind-Down', description: 'Gentle poses to release tension and prepare for sleep', category: 'yoga', duration: 20, level: 'beginner', tags: ['Sleep','Calm'], icon: '🌙', image: '/images/bm-evening-wind-down.png', gradientStart: '#3F51B5', gradientEnd: '#7986CB', steps: ['Child pose (2 min)','Cat-cow stretches','Seated forward fold','Supine twist','Legs up the wall','Savasana (5 min)'] },
            { title: 'Anxiety Relief Flow', description: 'Targeted yoga sequence for releasing anxiety from the body', category: 'yoga', duration: 25, level: 'intermediate', tags: ['Anxiety','Strength'], icon: '🧘', image: '/images/bm-anxiety-relief-flow.png', gradientStart: '#E91E63', gradientEnd: '#F06292', steps: ['Grounding breath','Warrior I & II','Tree pose','Bridge pose','Pigeon pose','Final relaxation'] },
            { title: '4-7-8 Relaxing Breath', description: 'The most effective breathing technique for instant calm', category: 'breathing', duration: 5, level: 'beginner', tags: ['Instant Calm'], icon: '🫁', image: '/images/bm-478-relaxing-breath.png', gradientStart: '#E67E22', gradientEnd: '#F59E0B', steps: ['Exhale completely','Inhale through nose for 4 counts','Hold breath for 7 counts','Exhale through mouth for 8 counts','Repeat 4 cycles'] },
            { title: 'Box Breathing', description: 'Navy SEAL technique for focus and stress reduction', category: 'breathing', duration: 4, level: 'beginner', tags: ['Focus','Concentration'], icon: '📦', image: '/images/bm-box-breathing.png', gradientStart: '#3B82F6', gradientEnd: '#60A5FA', steps: ['Inhale for 4 counts','Hold for 4 counts','Exhale for 4 counts','Hold empty for 4 counts','Repeat 6 cycles'] },
            { title: 'Alternate Nostril', description: 'Balance your nervous system and clear your mind', category: 'breathing', duration: 7, level: 'intermediate', tags: ['Brain Balance'], icon: '👃', image: '/images/bm-alternate-nostril.png', gradientStart: '#8B5CF6', gradientEnd: '#A78BFA', steps: ['Close right nostril','Inhale left for 4 counts','Close both, hold 4 counts','Release right, exhale 4 counts','Inhale right 4 counts','Close both, hold 4 counts','Release left, exhale 4 counts','Repeat 8 cycles'] },
            { title: 'Diaphragmatic Breathing', description: 'Deep belly breathing to lower blood pressure and reduce stress', category: 'breathing', duration: 3, level: 'beginner', tags: ['Lower BP','Calm'], icon: '🫁', image: '/images/bm-diaphragmatic-breathing.png', gradientStart: '#10B981', gradientEnd: '#34D399', steps: ['Place hand on belly','Breathe into belly (expand)','Exhale slowly (belly falls)','Keep chest still','Repeat for 3 minutes'] }
        ],
        habits: [
            { title: 'Drank 8 glasses of water', icon: '💧' },
            { title: 'Morning yoga or stretch', icon: '🧘' },
            { title: 'Ate a balanced meal', icon: '🥗' },
            { title: 'Breathing exercise', icon: '🫁' },
            { title: 'Journaling / Gratitude', icon: '✍️' },
            { title: 'Screen-free 30 min', icon: '📵' },
            { title: 'Slept 7-8 hours', icon: '😴' }
        ]
    }, { upsert: true });

    console.log('✅ Body-Mind page content seeded');
    process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
