/**
 * Seed the Landing Page admin content with data matching the current hardcoded index.html.
 * Usage: node seed-landing.js
 * Idempotent — upserts by key='singleton'.
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI missing from .env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const LandingPage = require('./models/LandingPage');

    const data = {
        key: 'singleton',

        // Hero
        heroBadge: '✨ Trusted by 50,000+ users worldwide',
        heroHeadline: 'Transform Your Mental Wellness Journey With Expert Support & AI Guidance',
        heroSubtitle: 'Connect with licensed therapists, wellness coaches, and a supportive community designed to help you build a healthier and happier life.',
        heroCTAs: [
            { text: 'Start Free Assessment', link: 'signup.html', style: 'primary' },
            { text: 'Watch Demo', link: '#how-it-works', style: 'ghost' }
        ],
        heroTrustItems: [
            '1,200+ Licensed Therapists',
            '50,000+ Wellness Sessions',
            '4.9/5 Average Rating'
        ],

        // Features
        features: [
            { icon: 'smile', title: 'AI Wellness Assessment', description: 'Personalized mental health insights powered by WHODAS 2.0 and AI analysis to create your unique wellness plan.' },
            { icon: 'heart', title: 'Licensed Therapists', description: 'Connect with 1,200+ verified mental health professionals for personalized therapy sessions on your schedule.' },
            { icon: 'activity', title: 'Body-Mind Connection', description: 'Holistic health through guided yoga, breathing exercises, nutrition plans, and daily routine management.' },
            { icon: 'users', title: 'Wellness Community', description: 'Mental Spa, Wellness Dating, and Meetups. Build meaningful connections with people who understand.' },
            { icon: 'book', title: 'Youth Support', description: 'Dedicated services for ages 13-24: aptitude testing, career advising, anti-bullying, and anxiety management.' },
            { icon: 'message', title: 'Voice Platform', description: 'Share your story anonymously or publicly. Inspire others and find healing through community storytelling.' }
        ],

        // Platform Showcase
        platformShowcase: [
            {
                tabId: 'dashboard', tabLabel: 'Dashboard',
                badge: '🏠 Your Home Base', title: 'Personalized Wellness Dashboard',
                description: 'Track your daily progress, mood patterns, task completion, and wellness score — all in one beautiful overview.',
                features: ['📊 Daily wellness score & mood tracking', '✅ Personalized daily wellness tasks', '🔥 Streak tracking & habit building', '📈 Weekly progress insights', '🤖 AI wellness chatbot (24/7)'],
                ctaText: 'Get Your Dashboard →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-stat"><span class="sc-mock-emoji">😊</span><div><strong>Today\'s Mood</strong><span>Feeling Good</span></div></div><div class="sc-mock-progress"><span>Wellness Score</span><div class="sc-mock-bar"><div style="width:78%"></div></div><span>78%</span></div><div class="sc-mock-tasks"><strong>Today\'s Tasks</strong><div class="sc-mock-task done">✓ Morning breathing exercise</div><div class="sc-mock-task done">✓ Drink 8 glasses of water</div><div class="sc-mock-task">○ Journal reflection</div><div class="sc-mock-task">○ 30 min screen-free time</div></div><div class="sc-mock-streak">🔥 7-Day Streak</div>'
            },
            {
                tabId: 'healing', tabLabel: 'Healing Zone',
                badge: '💜 Professional Support', title: 'Healing Zone — Licensed Therapy',
                description: 'Browse verified therapists, book sessions that fit your schedule, and get ongoing professional support for your mental health.',
                features: ['👨‍⚕️ 1,200+ licensed & verified therapists', '📅 Flexible scheduling (video, audio, text)', '🎯 AI-powered therapist matching', '📝 Session notes & progress tracking', '🔒 End-to-end encrypted sessions'],
                ctaText: 'Find Your Therapist →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-therapist"><img src="https://ui-avatars.com/api/?name=Dr+Sarah&background=8B5CF6&color=fff&size=48" alt=""><div><strong>Dr. Sarah Wilson</strong><span>Clinical Psychologist • ⭐ 4.9</span><span class="sc-avail">Available Today</span></div></div><div class="sc-mock-therapist"><img src="https://ui-avatars.com/api/?name=Dr+James&background=10B981&color=fff&size=48" alt=""><div><strong>Dr. James Chen</strong><span>Psychiatrist • ⭐ 4.8</span><span class="sc-avail">Next: Tomorrow 2PM</span></div></div><div class="sc-mock-therapist"><img src="https://ui-avatars.com/api/?name=Dr+Priya&background=E67E22&color=fff&size=48" alt=""><div><strong>Dr. Priya Sharma</strong><span>Anxiety Specialist • ⭐ 5.0</span><span class="sc-avail">Available Today</span></div></div>'
            },
            {
                tabId: 'bodymind', tabLabel: 'Body-Mind',
                badge: '🧘 Holistic Wellness', title: 'Body-Mind Connection',
                description: 'Guided yoga, breathing exercises, nutrition plans, and daily routines to nurture both your physical and mental health.',
                features: ['🧘 Guided yoga & meditation library', '🫁 Breathing exercises for anxiety relief', '🥗 Personalized nutrition guidance', '⏰ Daily routine builder', '📱 Quick 3-minute wellness breaks'],
                ctaText: 'Start Body-Mind →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-module" style="background:linear-gradient(135deg,#10B981,#34D399)"><span>🧘</span><strong>Morning Yoga</strong><span>15 min • Beginner</span></div><div class="sc-mock-module" style="background:linear-gradient(135deg,#3B82F6,#60A5FA)"><span>🫁</span><strong>Calm Breathing</strong><span>5 min • Anxiety Relief</span></div><div class="sc-mock-module" style="background:linear-gradient(135deg,#8B5CF6,#A78BFA)"><span>🥗</span><strong>Mood-Boost Foods</strong><span>Nutrition Guide</span></div><div class="sc-mock-module" style="background:linear-gradient(135deg,#F59E0B,#FBBF24)"><span>😴</span><strong>Sleep Routine</strong><span>Wind-down Protocol</span></div>'
            },
            {
                tabId: 'community', tabLabel: 'Community',
                badge: '👥 You\'re Not Alone', title: 'Wellness Community',
                description: 'Join circles of people who understand. Mental Spa for relaxation, Wellness Dating for connections, and Meetups for group activities.',
                features: ['🧖 Mental Spa — immersive relaxation rooms', '💕 Wellness Dating — meaningful connections', '🎉 Weekly meetups & wellness events', '💬 Support circles & group discussions', '🏆 Community achievements & badges'],
                ctaText: 'Join Community →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-circle"><div class="sc-circle-dot" style="background:#10B981"></div><div><strong>Anxiety Support Circle</strong><span>48 members • 92% match</span></div></div><div class="sc-mock-circle"><div class="sc-circle-dot" style="background:#8B5CF6"></div><div><strong>Mindfulness Explorers</strong><span>35 members • 88% match</span></div></div><div class="sc-mock-circle"><div class="sc-circle-dot" style="background:#E67E22"></div><div><strong>Career Growth Hub</strong><span>62 members • 85% match</span></div></div><div class="sc-mock-event"><span>📅</span><div><strong>Wellness Meetup: Saturday</strong><span>Group Meditation • 12 attending</span></div></div>'
            },
            {
                tabId: 'youth', tabLabel: 'Youth Support',
                badge: '🎓 Ages 13-24', title: 'Youth Support Program',
                description: 'Career discovery, confidence building, wellness check-ins, and personal coaching designed specifically for young people.',
                features: ['🧭 Career aptitude testing & matching', '💪 Confidence building challenges', '📋 Weekly wellness check-ins', '👩‍🏫 Personal youth counselors', '🛡️ Anti-bullying & peer pressure support'],
                ctaText: 'Start Youth Program →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-score"><span class="sc-score-num">78%</span><span>Growth Score</span><span class="sc-score-trend">↑ 8% This Month</span></div><div class="sc-mock-careers"><strong>Your Top Matches</strong><div class="sc-career-item"><span>92%</span> Software Engineer</div><div class="sc-career-item"><span>87%</span> Graphic Designer</div><div class="sc-career-item"><span>84%</span> Psychologist</div></div>'
            },
            {
                tabId: 'voice', tabLabel: 'My Voice',
                badge: '💬 Be Heard', title: 'My Voice — Story Platform',
                description: 'Share your wellness journey, read inspiring stories, post anonymously, and connect through community storytelling.',
                features: ['✍️ Share your story (anonymous option)', '📖 Read inspiring recovery stories', '💝 React & support other members', '💬 Discussion forums & comments', '🌟 Featured stories & community spotlight'],
                ctaText: 'Share Your Story →', ctaLink: 'signup.html',
                mockupHtml: '<div class="sc-mock-story"><div class="sc-story-cat">Recovery</div><strong>How I Overcame Social Anxiety</strong><span>By Sarah M. • 4 min read</span><div class="sc-story-reactions">💜 Inspired (42) • 🤝 Relatable (38) • 🌟 Hopeful (29)</div></div><div class="sc-mock-story"><div class="sc-story-cat">Growth</div><strong>Finding My Career at 19</strong><span>Anonymous • 3 min read</span><div class="sc-story-reactions">💜 Inspired (67) • 🤝 Relatable (51)</div></div>'
            }
        ],

        // How It Works
        howItWorks: [
            { title: 'Take Assessment', description: 'Complete our AI-powered WHODAS 2.0 wellness assessment to identify your unique needs and priorities.' },
            { title: 'Get Personalized Plan', description: 'Receive a tailored wellness plan based on your assessment results with recommended services and activities.' },
            { title: 'Connect With Professionals', description: 'Match with licensed therapists, join community groups, or explore holistic wellness resources.' },
            { title: 'Track Progress', description: 'Monitor your wellness journey with progress insights, habit tracking, and ongoing professional support.' }
        ],

        // Stats
        stats: [
            { number: '85%', description: 'Users report improved wellbeing within 60 days' },
            { number: '50K+', description: 'Wellness sessions completed this year' },
            { number: '4.9/5', description: 'Average rating from verified users' },
            { number: '24/7', description: 'Crisis support and AI assistance available' }
        ],

        // Therapists
        therapists: [
            { name: 'Dr. Sarah Wilson', role: 'Clinical Psychologist', experience: '12 Years Experience', color: '#E67E22' },
            { name: 'Dr. James Chen', role: 'Psychiatrist, MD', experience: '18 Years Experience', color: '#10B981' },
            { name: 'Dr. Priya Sharma', role: 'Licensed Clinical Social Worker', experience: '15 Years Experience', color: '#8B5CF6' },
            { name: 'Dr. Amara Johnson', role: 'Family Therapist, PhD', experience: '8 Years Experience', color: '#3B82F6' }
        ],

        // Testimonials
        testimonials: [
            { stars: 5, quote: 'ABLE connected me with a therapist who truly understood my struggles. For the first time in years, I feel hopeful about the future.', authorName: 'Sarah M.', authorRole: 'Healing Zone Member' },
            { stars: 5, quote: 'The Body-Mind breathing exercises helped me overcome daily panic attacks. I went from 3 attacks a week to zero in just 2 months.', authorName: 'James K.', authorRole: 'Body-Mind User' },
            { stars: 5, quote: 'As a 19-year-old dealing with anxiety, the Youth Support program gave me tools my friends don\'t have access to. Life-changing.', authorName: 'Priya R.', authorRole: 'Youth Support Member' }
        ],

        // Pricing
        pricing: [
            { name: 'Free', price: '$0', features: ['AI Wellness Assessment', 'Community Access', 'Basic Breathing Exercises', 'Voice Platform (Read)', 'AI Chatbot Support'], ctaText: 'Get Started Free', ctaLink: 'signup.html', isPopular: false },
            { name: 'Premium', price: '$29', features: ['Everything in Free', 'Unlimited Therapist Sessions', 'Personalized Wellness Plans', 'Progress Tracking Dashboard', 'All Yoga & Nutrition Content', 'Priority Community Events', 'Youth Support Programs'], ctaText: 'Start 7-Day Free Trial', ctaLink: 'signup.html', isPopular: true },
            { name: 'Enterprise', price: 'Custom', features: ['Everything in Premium', 'Team Wellness Programs', 'Dedicated Account Manager', 'Custom Integrations', 'Analytics & Reporting'], ctaText: 'Contact Sales', ctaLink: '#', isPopular: false }
        ],

        // FAQ
        faqItems: [
            { question: 'Are therapists licensed and verified?', answer: 'Yes, all therapists on ABLE are licensed mental health professionals with verified credentials. Each therapist undergoes a thorough background check and credential verification process before joining our platform.' },
            { question: 'How does the AI assessment work?', answer: 'Our AI assessment is based on the WHO Disability Assessment Schedule (WHODAS 2.0). It asks questions about your daily functioning across 6 domains and uses AI to analyze your responses, creating a personalized wellness plan tailored to your needs.' },
            { question: 'Is my data secure and confidential?', answer: 'Absolutely. We use end-to-end encryption for all communications. Your data is stored securely and never shared with third parties. We are HIPAA compliant and follow the highest standards of data protection.' },
            { question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel your subscription at any time with no penalty. If you cancel during a trial period, you won\'t be charged. Your data remains accessible for 30 days after cancellation.' },
            { question: 'What if I\'m in a mental health crisis?', answer: 'If you\'re experiencing a crisis, our AI chatbot provides immediate crisis resources including the 988 Suicide Prevention Lifeline, Crisis Text Line, and emergency services. We also have priority access to therapists for urgent situations.' }
        ],

        // Footer
        footerBrandDescription: 'A Better Life Enabled — your companion for mental wellness, personal growth, and a healthier life.',
        footerProductLinks: [
            { label: 'Healing Zone', href: 'healing-zone.html' },
            { label: 'Body-Mind', href: 'body-mind.html' },
            { label: 'Community', href: 'community.html' },
            { label: 'Youth Support', href: 'youth-support.html' },
            { label: 'Pricing', href: '#pricing' }
        ],
        footerCompanyLinks: [
            { label: 'About Us', href: '#' },
            { label: 'Careers', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Contact', href: '#' }
        ],
        footerLegalLinks: [
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
            { label: 'HIPAA Compliance', href: '#' },
            { label: 'Crisis Support', href: '#' }
        ],

        // Social Proof
        socialProofRating: '4.9/5 based on 12,000+ reviews',
        socialProofUserCount: '+50,000 users',
        socialProofLogos: ['Mental Health Weekly', 'WellnessTech', 'PsychToday', 'HealthLine']
    };

    await LandingPage.findOneAndUpdate(
        { key: 'singleton' },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Landing page content seeded successfully');
    await mongoose.disconnect();
    process.exit(0);
})();
