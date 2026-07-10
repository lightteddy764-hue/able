/**
 * Seed wellness music videos (YouTube embed only — no downloads/storage).
 * All video IDs below were verified live via YouTube's oEmbed endpoint.
 * Usage: node seed-music.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MusicVideo = require('./models/MusicVideo');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await MusicVideo.deleteMany({});
    console.log('Cleared existing music videos');

    const videos = [
        {
            title: '5-Minute Meditation You Can Do Anywhere',
            description: 'A short guided meditation to center your mind and reset your focus, wherever you are.',
            category: 'Meditation Music',
            duration: '5 min',
            purpose: 'Quick mental reset and centering',
            youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
            displayOrder: 1
        },
        {
            title: '10-Minute Meditation For Beginners',
            description: 'A gentle, beginner-friendly guided meditation to build a daily mindfulness habit.',
            category: 'Meditation Music',
            duration: '10 min',
            purpose: 'Build a consistent meditation practice',
            youtubeUrl: 'https://www.youtube.com/watch?v=U9YKY7fdwyg',
            displayOrder: 2
        },
        {
            title: 'Flying: Relaxing Sleep Music',
            description: 'Peaceful instrumental music designed to help you unwind, relieve stress, and drift into deep sleep.',
            category: 'Sleep Music',
            duration: '3 hr',
            purpose: 'Helps you fall asleep faster and sleep deeper',
            youtubeUrl: 'https://www.youtube.com/watch?v=1ZYbU82GVz4',
            displayOrder: 1
        },
        {
            title: 'Yoga Nidra - Guided Meditation to Relax',
            description: 'A calming Yoga Nidra practice that guides your body into deep rest before sleep.',
            category: 'Sleep Music',
            duration: '10 min',
            purpose: 'Deep relaxation before bedtime',
            youtubeUrl: 'https://www.youtube.com/watch?v=M0u9GST_j3s',
            displayOrder: 2
        },
        {
            title: 'Study Music Alpha Waves',
            description: 'Alpha wave instrumental music engineered to boost concentration and brain power while you work or study.',
            category: 'Focus Music',
            duration: '3 hr',
            purpose: 'Improve concentration and productivity',
            youtubeUrl: 'https://www.youtube.com/watch?v=WPni755-Krg',
            displayOrder: 1
        },
        {
            title: 'Lofi Hip Hop Radio — Beats to Relax/Study To',
            description: 'The iconic lofi hip hop livestream, perfect background music for deep work or studying.',
            category: 'Focus Music',
            duration: 'Livestream',
            purpose: 'Sustained focus during work or study sessions',
            youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
            displayOrder: 2
        },
        {
            title: 'The Hidden Valley — Ambient Relaxing Music',
            description: 'Ambient soundscape designed specifically to ease stress and anxious thoughts.',
            category: 'Stress Relief Music',
            duration: '2 hr',
            purpose: 'Reduce stress and anxious tension',
            youtubeUrl: 'https://www.youtube.com/watch?v=2OEL4P1Rz04',
            displayOrder: 1
        },
        {
            title: 'Guided Meditation for Reducing Anxiety and Stress',
            description: 'A 20-minute guided practice to help clear mental clutter and calm an anxious mind.',
            category: 'Stress Relief Music',
            duration: '20 min',
            purpose: 'Calm anxiety and settle a racing mind',
            youtubeUrl: 'https://www.youtube.com/watch?v=MIr3RsUWrdo',
            displayOrder: 2
        },
        {
            title: '15 Minute Deep Breathing Exercise',
            description: 'A guided breathing exercise from City of Hope to help you slow down and reset your nervous system.',
            category: 'Breathing Music',
            duration: '15 min',
            purpose: 'Regulate breath and calm the nervous system',
            youtubeUrl: 'https://www.youtube.com/watch?v=F28MGLlpP90',
            displayOrder: 1
        },
        {
            title: 'Yoga Breathing — Alternate Nostril Breathing',
            description: 'A classic pranayama technique to balance energy and quiet the mind through controlled breath.',
            category: 'Breathing Music',
            duration: '8 min',
            purpose: 'Balance energy and improve mental clarity',
            youtubeUrl: 'https://www.youtube.com/watch?v=8VwufJrUhic',
            displayOrder: 2
        },
        {
            title: 'Relaxing Music with Nature Sounds — Waterfall',
            description: 'Natural waterfall ambience paired with gentle music for a grounding, healing listening experience.',
            category: 'Healing Sounds',
            duration: '1 hr',
            purpose: 'Grounding and emotional healing',
            youtubeUrl: 'https://www.youtube.com/watch?v=lE6RYpe9IT0',
            displayOrder: 1
        },
        {
            title: 'Guided Meditation for Positive Energy & Peace',
            description: 'A soothing guided meditation designed to restore inner peace and cultivate positive energy.',
            category: 'Healing Sounds',
            duration: '15 min',
            purpose: 'Restore inner peace and positive energy',
            youtubeUrl: 'https://www.youtube.com/watch?v=86m4RC_ADEY',
            displayOrder: 2
        }
    ];

    for (const v of videos) {
        const match = v.youtubeUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        v.youtubeVideoId = match[1];
        v.thumbnailUrl = `https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg`;
    }

    await MusicVideo.insertMany(videos);
    console.log(`✅ Seeded ${videos.length} music videos across 6 categories`);
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
