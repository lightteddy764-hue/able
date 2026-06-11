// Seed script: Add sample therapists to the database
require('dotenv').config();
const mongoose = require('mongoose');
const Therapist = require('./models/Therapist');

const therapists = [
    {
        name: 'Dr. Sarah Mitchell',
        title: 'Clinical Psychologist',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        specializations: ['Anxiety', 'Depression', 'Stress', 'Mindfulness'],
        experience: 12,
        education: 'PhD Clinical Psychology, Stanford University',
        licenseNumber: 'PSY-28491',
        isVerified: true,
        sessionTypes: ['video', 'audio', 'chat'],
        languages: ['English', 'Spanish'],
        sessionRate: 120,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 4.9,
        reviewCount: 234,
        totalSessions: 2300,
        responseTime: '1 hour',
        bio: 'I specialize in evidence-based therapies for anxiety and depression. My approach combines CBT with mindfulness techniques to help clients build lasting resilience and emotional well-being.',
        approach: 'CBT, Mindfulness-Based Stress Reduction, ACT',
        isActive: true
    },
    {
        name: 'Dr. Priya Sharma',
        title: 'Licensed Clinical Social Worker',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        specializations: ['Trauma', 'PTSD', 'Relationships', 'Self-Esteem'],
        experience: 15,
        education: 'MSW, Columbia University | EMDR Certified',
        licenseNumber: 'LCSW-19284',
        isVerified: true,
        sessionTypes: ['video', 'chat'],
        languages: ['English', 'Hindi', 'Urdu'],
        sessionRate: 100,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 5.0,
        reviewCount: 312,
        totalSessions: 3100,
        responseTime: '30 min',
        bio: 'With 15 years of experience in trauma recovery, I help clients heal from past wounds using EMDR and somatic experiencing. I create a safe, culturally-sensitive space for healing.',
        approach: 'EMDR, Somatic Experiencing, Narrative Therapy',
        isActive: true
    },
    {
        name: 'Dr. James Wilson',
        title: 'Marriage & Family Therapist',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        specializations: ['Relationships', 'Family', 'Grief', 'Trauma'],
        experience: 9,
        education: 'PsyD, UCLA | Gottman Method Certified',
        licenseNumber: 'MFT-44721',
        isVerified: true,
        sessionTypes: ['video', 'in-person'],
        languages: ['English'],
        sessionRate: 150,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 4.8,
        reviewCount: 189,
        totalSessions: 1800,
        responseTime: '2 hours',
        bio: 'I help couples and families navigate conflict, rebuild trust, and create deeper connections. I also specialize in grief counseling and life transitions.',
        approach: 'Gottman Method, EFT, Family Systems',
        isActive: true
    },
    {
        name: 'Dr. Michael Chen',
        title: 'Psychiatrist',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        specializations: ['Addiction', 'Depression', 'Grief', 'OCD'],
        experience: 18,
        education: 'MD Psychiatry, Johns Hopkins | Board Certified',
        licenseNumber: 'MD-88123',
        isVerified: true,
        sessionTypes: ['video', 'audio'],
        languages: ['English', 'Mandarin'],
        sessionRate: 200,
        isAvailableToday: false,
        nextAvailable: 'Tomorrow',
        rating: 4.9,
        reviewCount: 156,
        totalSessions: 4200,
        responseTime: '3 hours',
        bio: 'As a board-certified psychiatrist, I provide comprehensive care combining medication management with therapy. I specialize in treatment-resistant depression and addiction recovery.',
        approach: 'Integrative Psychiatry, CBT, Motivational Interviewing',
        isActive: true
    },
    {
        name: 'Dr. Amara Johnson',
        title: 'Child & Family Therapist',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        specializations: ['Family', 'Self-Esteem', 'Anxiety', 'Youth'],
        experience: 8,
        education: 'PhD Child Psychology, NYU',
        licenseNumber: 'PSY-55239',
        isVerified: true,
        sessionTypes: ['video', 'in-person'],
        languages: ['English', 'French'],
        sessionRate: 110,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 4.7,
        reviewCount: 98,
        totalSessions: 950,
        responseTime: '1 hour',
        bio: 'I work with children, teens, and families to build stronger relationships and healthier communication patterns. Specializing in play therapy and adolescent anxiety.',
        approach: 'Play Therapy, CBT for Youth, Family Systems',
        isActive: true
    },
    {
        name: 'Dr. Emily Brooks',
        title: 'Licensed Professional Counselor',
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
        specializations: ['Stress', 'Self-Esteem', 'Relationships', 'Mindfulness'],
        experience: 10,
        education: 'MA Counseling Psychology, University of Michigan',
        licenseNumber: 'LPC-77412',
        isVerified: true,
        sessionTypes: ['video', 'audio', 'chat'],
        languages: ['English'],
        sessionRate: 95,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 4.9,
        reviewCount: 267,
        totalSessions: 2100,
        responseTime: '45 min',
        bio: 'I help women navigate life transitions, relationship challenges, and burnout. My warm, collaborative approach creates space for genuine growth and self-discovery.',
        approach: 'Person-Centered, Mindfulness, Positive Psychology',
        isActive: true
    },
    {
        name: 'Dr. Raj Patel',
        title: 'Clinical Psychologist',
        avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
        specializations: ['OCD', 'Anxiety', 'PTSD', 'Stress'],
        experience: 14,
        education: 'PhD Clinical Psychology, University of Pennsylvania',
        licenseNumber: 'PSY-33891',
        isVerified: true,
        sessionTypes: ['video', 'audio'],
        languages: ['English', 'Hindi', 'Gujarati'],
        sessionRate: 140,
        isAvailableToday: false,
        nextAvailable: 'Wednesday',
        rating: 4.8,
        reviewCount: 145,
        totalSessions: 1650,
        responseTime: '2 hours',
        bio: 'I specialize in OCD, phobias, and anxiety disorders using exposure therapy and CBT. I bring cultural sensitivity to every session and help clients face their fears with compassion.',
        approach: 'ERP, CBT, Acceptance & Commitment Therapy',
        isActive: true
    },
    {
        name: 'Dr. Lisa Rodriguez',
        title: 'Trauma & PTSD Specialist',
        avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
        specializations: ['Trauma', 'PTSD', 'Depression', 'Grief'],
        experience: 11,
        education: 'PsyD, Alliant International | EMDR Level II',
        licenseNumber: 'PSY-61284',
        isVerified: true,
        sessionTypes: ['video', 'audio', 'chat'],
        languages: ['English', 'Spanish', 'Portuguese'],
        sessionRate: 130,
        isAvailableToday: true,
        nextAvailable: 'Today',
        rating: 4.9,
        reviewCount: 201,
        totalSessions: 1900,
        responseTime: '1 hour',
        bio: 'I help survivors of trauma reclaim their lives through EMDR and somatic approaches. I work with complex PTSD, childhood trauma, and grief. Bilingual services available.',
        approach: 'EMDR, Somatic Experiencing, IFS',
        isActive: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing therapists
        await Therapist.deleteMany({});
        console.log('Cleared existing therapists');

        // Insert new therapists
        await Therapist.insertMany(therapists);
        console.log(`✅ Successfully seeded ${therapists.length} therapists!`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
