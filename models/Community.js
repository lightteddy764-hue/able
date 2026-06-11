const mongoose = require('mongoose');

// Community Groups/Circles
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
    onlineCount: { type: Number, default: 0 }
}, { timestamps: true });

// Community Events
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Event Details
    type: { type: String, enum: ['online', 'in-person', 'hybrid'], default: 'online' },
    location: { type: String, default: '' },
    date: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // minutes
    
    // Attendees
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: { type: Number, default: 50 },
    
    // Status
    status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' }
}, { timestamps: true });

// Discussion Posts
const discussionSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    
    // Engagement
    replies: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    replyCount: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Status
    isPinned: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    tags: [{ type: String }]
}, { timestamps: true });

discussionSchema.index({ isTrending: 1, createdAt: -1 });
eventSchema.index({ date: 1, status: 1 });

const Community = mongoose.model('Community', communitySchema);
const Event = mongoose.model('Event', eventSchema);
const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = { Community, Event, Discussion };
