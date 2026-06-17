const mongoose = require('mongoose');

/* ===== Existing models (kept) ===== */

// Community Groups/Circles (raw data — usually populated by users)
const communitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['mental-spa', 'connections', 'meetups', 'support-circle'], required: true },

    // Members
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },

    // Settings
    isPrivate: { type: Boolean, default: false },
    tags: [{ type: String }],
    color: { type: String, default: '#E67E22' },

    // Activity
    lastActivity: { type: Date, default: Date.now },
    onlineCount: { type: Number, default: 0 },

    // Moderation
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

// Community Events (raw)
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['online', 'in-person', 'hybrid'], default: 'online' },
    location: { type: String, default: '' },
    date: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: { type: Number, default: 50 },
    status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' }
}, { timestamps: true });

// Discussion Posts (raw)
const discussionSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    replies: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    replyCount: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    tags: [{ type: String }]
}, { timestamps: true });

discussionSchema.index({ isTrending: 1, createdAt: -1 });
eventSchema.index({ date: 1, status: 1 });

/* ===== NEW: Curated content for the public community page ===== */

// Singleton — stats and hero text shown on community.html
const communityPageSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },

    // Hero stats (top of community.html)
    communitiesJoined: { type: Number, default: 3 },
    newDiscussions: { type: Number, default: 12 },
    eventsThisWeek: { type: Number, default: 4 },

    // Live indicators
    membersOnline: { type: Number, default: 214 },
    liveDiscussions: { type: Number, default: 12 },
    eventsHappeningNow: { type: Number, default: 3 },

    // Activity bar (bottom)
    discussionsCount: { type: Number, default: 125 },
    eventsThisWeekTotal: { type: Number, default: 18 },
    newMembers: { type: Number, default: 42 },
    reactionsToday: { type: Number, default: 320 }
}, { timestamps: true });

// Featured circles / groups (the "Recommended For You" cards)
const featuredCircleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    matchPercent: { type: Number, default: 90 },        // e.g. 92
    memberCount: { type: Number, default: 0 },          // e.g. 48
    statusBadge: { type: String, default: '' },         // e.g. "Starting in 2 Hours"
    buttonText: { type: String, default: 'Join Circle' },
    accentColor: { type: String, default: 'green' },    // green | blue | purple | orange
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// Community Spaces (Mental Spa / Meaningful Connections / Wellness Meetups cards)
const communitySpaceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },               // base64 or URL
    memberCount: { type: Number, default: 0 },
    activeStat: { type: String, default: '' },          // e.g. "18 Live Sessions"
    buttonText: { type: String, default: 'Enter Community' },
    link: { type: String, default: '#' },
    accentColor: { type: String, default: 'green' },    // green | pink | purple
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

// Curated trending discussions shown on the community page
const trendingDiscussionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    groupName: { type: String, default: '' },           // e.g. "Started by Sarah M."
    replyCount: { type: Number, default: 0 },
    badge: { type: String, default: 'Active' },         // Hot | Active | New | Popular
    accentColor: { type: String, default: 'green' },    // green | blue | purple | orange
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    link: { type: String, default: 'my-voice.html' }
}, { timestamps: true });

// Curated upcoming events shown on the community page
const upcomingEventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, default: '' },                 // free-form, e.g. "7 AM"
    location: { type: String, default: '' },
    attendeesCount: { type: Number, default: 0 },
    rsvpEnabled: { type: Boolean, default: true },
    buttonText: { type: String, default: 'RSVP' },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Achievement badges in "Your Community Progress"
const achievementSchema = new mongoose.Schema({
    title: { type: String, required: true },            // "Joined First Circle"
    icon: { type: String, default: '✓' },                // emoji or character
    color: { type: String, default: '#10B981' },         // hex color
    isCompleted: { type: Boolean, default: false },      // template default — per-user later
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

const Community = mongoose.model('Community', communitySchema);
const Event = mongoose.model('Event', eventSchema);
const Discussion = mongoose.model('Discussion', discussionSchema);

const CommunityPageSettings = mongoose.model('CommunityPageSettings', communityPageSettingsSchema);
const FeaturedCircle = mongoose.model('FeaturedCircle', featuredCircleSchema);
const CommunitySpace = mongoose.model('CommunitySpace', communitySpaceSchema);
const TrendingDiscussion = mongoose.model('TrendingDiscussion', trendingDiscussionSchema);
const UpcomingEvent = mongoose.model('UpcomingEvent', upcomingEventSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = {
    Community,
    Event,
    Discussion,
    CommunityPageSettings,
    FeaturedCircle,
    CommunitySpace,
    TrendingDiscussion,
    UpcomingEvent,
    Achievement
};
