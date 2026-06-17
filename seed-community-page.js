/**
 * Seed the Community Page admin collections with realistic content.
 *
 * Usage:
 *   node seed-community-page.js
 *
 * Idempotent — re-running upserts by title (or by `key` for settings),
 * so existing admin-edited items are not duplicated.
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

    const {
        CommunityPageSettings,
        FeaturedCircle,
        CommunitySpace,
        TrendingDiscussion,
        UpcomingEvent,
        Achievement
    } = require('./models/Community');

    /* ---------- Settings (singleton) ---------- */
    await CommunityPageSettings.findOneAndUpdate(
        { key: 'singleton' },
        {
            $set: {
                // Hero
                communitiesJoined: 3,
                newDiscussions: 12,
                eventsThisWeek: 4,
                // Live
                membersOnline: 214,
                liveDiscussions: 12,
                eventsHappeningNow: 3,
                // Activity bar
                discussionsCount: 125,
                eventsThisWeekTotal: 18,
                newMembers: 42,
                reactionsToday: 320
            }
        },
        { upsert: true, new: true }
    );
    console.log('✓ Settings seeded');

    /* ---------- Featured Circles ---------- */
    const circles = [
        {
            title: 'Anxiety Support Circle',
            description: 'Safe space for sharing and coping strategies',
            matchPercent: 92,
            memberCount: 48,
            statusBadge: 'Starting in 2 Hours',
            buttonText: 'Join Circle',
            accentColor: 'green',
            displayOrder: 1
        },
        {
            title: 'Morning Meditation Group',
            description: 'Daily guided meditation with community',
            matchPercent: 88,
            memberCount: 35,
            statusBadge: 'Daily 6 AM',
            buttonText: 'Join Group',
            accentColor: 'blue',
            displayOrder: 2
        },
        {
            title: 'Creative Wellness Club',
            description: 'Express through art, writing & music',
            matchPercent: 84,
            memberCount: 62,
            statusBadge: 'Trending Today',
            buttonText: 'Join Club',
            accentColor: 'purple',
            displayOrder: 3
        }
    ];
    for (const c of circles) {
        await FeaturedCircle.findOneAndUpdate(
            { title: c.title },
            { $set: { ...c, isVisible: true } },
            { upsert: true, new: true }
        );
    }
    console.log(`✓ ${circles.length} featured circles seeded`);

    /* ---------- Community Spaces ---------- */
    const spaces = [
        {
            title: 'Mental Spa',
            description: 'Calming experiences for stress relief and mindfulness',
            image: '/images/mental-spa.png',
            memberCount: 1200,
            activeStat: '18 Live Sessions',
            buttonText: 'Enter Community',
            link: '#',
            accentColor: 'green',
            displayOrder: 1
        },
        {
            title: 'Meaningful Connections',
            description: 'Meet like-minded people who share your wellness values',
            image: '/images/meaningful-connections.png',
            memberCount: 890,
            activeStat: '42 Active Now',
            buttonText: 'Find Connections',
            link: '#',
            accentColor: 'pink',
            displayOrder: 2
        },
        {
            title: 'Wellness Meetups',
            description: 'Local and virtual events for connection and growth',
            image: '/images/wellness-meetups.png',
            memberCount: 340,
            activeStat: '4 Events This Week',
            buttonText: 'View Events',
            link: '#events',
            accentColor: 'purple',
            displayOrder: 3
        }
    ];
    for (const s of spaces) {
        await CommunitySpace.findOneAndUpdate(
            { title: s.title },
            { $set: { ...s, isVisible: true } },
            { upsert: true, new: true }
        );
    }
    console.log(`✓ ${spaces.length} community spaces seeded`);

    /* ---------- Trending Discussions ---------- */
    const discussions = [
        {
            title: 'How meditation changed my anxiety',
            groupName: 'Started by Sarah M.',
            replyCount: 128,
            badge: 'Hot',
            accentColor: 'green',
            isPinned: true,
            displayOrder: 1,
            link: 'my-voice.html'
        },
        {
            title: 'Best morning wellness routines?',
            groupName: 'Started by James K.',
            replyCount: 76,
            badge: 'Active',
            accentColor: 'blue',
            displayOrder: 2,
            link: 'my-voice.html'
        },
        {
            title: 'Weekly gratitude challenge — join us!',
            groupName: '54 participants • Community Circle',
            replyCount: 54,
            badge: 'New',
            accentColor: 'purple',
            displayOrder: 3,
            link: 'my-voice.html'
        },
        {
            title: 'Breathing exercises that actually work',
            groupName: 'Body-Mind Group',
            replyCount: 92,
            badge: 'Popular',
            accentColor: 'orange',
            displayOrder: 4,
            link: 'my-voice.html'
        }
    ];
    for (const d of discussions) {
        await TrendingDiscussion.findOneAndUpdate(
            { title: d.title },
            { $set: { ...d, isHidden: false } },
            { upsert: true, new: true }
        );
    }
    console.log(`✓ ${discussions.length} trending discussions seeded`);

    /* ---------- Upcoming Events (always future-dated relative to today) ---------- */
    function inDays(days, hour = 9, minute = 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(hour, minute, 0, 0);
        return d;
    }
    const events = [
        {
            title: 'Mindful Morning Walk',
            date: inDays(3, 7, 0),
            time: '7 AM',
            location: 'Central Park',
            attendeesCount: 12,
            rsvpEnabled: true,
            buttonText: 'RSVP',
            displayOrder: 1
        },
        {
            title: 'Anxiety Support Circle',
            date: inDays(7, 18, 0),
            time: '6 PM',
            location: 'Online (Zoom)',
            attendeesCount: 24,
            rsvpEnabled: true,
            buttonText: 'RSVP',
            displayOrder: 2
        },
        {
            title: 'Wellness Potluck Dinner',
            date: inDays(10, 18, 30),
            time: '6:30 PM',
            location: 'Community Center',
            attendeesCount: 18,
            rsvpEnabled: true,
            buttonText: 'RSVP',
            displayOrder: 3
        },
        {
            title: 'Creative Writing Workshop',
            date: inDays(14, 19, 0),
            time: '7 PM',
            location: 'Online (Zoom)',
            attendeesCount: 9,
            rsvpEnabled: true,
            buttonText: 'RSVP',
            displayOrder: 4
        }
    ];
    for (const ev of events) {
        await UpcomingEvent.findOneAndUpdate(
            { title: ev.title },
            { $set: { ...ev, isVisible: true } },
            { upsert: true, new: true }
        );
    }
    console.log(`✓ ${events.length} upcoming events seeded`);

    /* ---------- Achievements ---------- */
    const achievements = [
        { title: 'Joined First Circle', icon: '✓', color: '#10B981', isCompleted: true, displayOrder: 1 },
        { title: 'Attended First Event', icon: '✓', color: '#10B981', isCompleted: true, displayOrder: 2 },
        { title: 'Started Discussion', icon: '✓', color: '#10B981', isCompleted: true, displayOrder: 3 },
        { title: 'Become Community Mentor', icon: '○', color: '#9CA3AF', isCompleted: false, displayOrder: 4 },
        { title: 'Host Your First Event', icon: '○', color: '#9CA3AF', isCompleted: false, displayOrder: 5 }
    ];
    for (const a of achievements) {
        await Achievement.findOneAndUpdate(
            { title: a.title },
            { $set: { ...a, isVisible: true } },
            { upsert: true, new: true }
        );
    }
    console.log(`✓ ${achievements.length} achievements seeded`);

    console.log('\nAll community-page content seeded successfully.');
    await mongoose.disconnect();
    process.exit(0);
})().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
