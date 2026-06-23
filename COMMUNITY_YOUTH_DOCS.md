# Community & Youth Support — Complete A-to-Z Documentation

---

## COMMUNITY PAGE (`/community.html`)

### What It Is
A wellness community platform where users can join support circles, RSVP to events, participate in discussions, and track community progress.

### Data Source
- **CMS Content:** `GET /api/community-page` (admin-managed)
- **User Interactions:** Join/Leave/RSVP/Reply routes
- **Model:** `models/Community.js`
- **Admin:** `/admin/community-page.html`
- **Seed:** `seed-community-page.js`

---

### Database Models (in `models/Community.js`)

#### 1. CommunityPageSettings (singleton)
```
{
  key: 'singleton',
  communitiesJoined: Number,
  newDiscussions: Number,
  eventsThisWeek: Number,
  membersOnline: Number,
  liveDiscussions: Number,
  eventsHappeningNow: Number,
  discussionsCount: Number,
  eventsThisWeekTotal: Number,
  newMembers: Number,
  reactionsToday: Number
}
```

#### 2. FeaturedCircle
```
{
  title: String,
  description: String,
  matchPercent: Number (0-100),
  memberCount: Number,
  statusBadge: String (e.g. "Starting in 2 Hours"),
  buttonText: String,
  accentColor: String (green/blue/purple/orange),
  displayOrder: Number,
  isVisible: Boolean
}
```

#### 3. CommunitySpace
```
{
  title: String,
  description: String,
  image: String (URL or base64),
  memberCount: Number,
  activeStat: String (e.g. "18 Live Sessions"),
  buttonText: String,
  link: String,
  accentColor: String,
  displayOrder: Number,
  isVisible: Boolean
}
```

#### 4. TrendingDiscussion
```
{
  title: String,
  groupName: String (e.g. "Started by Sarah M."),
  replyCount: Number,
  badge: String (Hot/Active/New/Popular),
  accentColor: String,
  isPinned: Boolean,
  isHidden: Boolean,
  displayOrder: Number,
  link: String
}
```

#### 5. UpcomingEvent
```
{
  title: String,
  date: Date,
  time: String,
  location: String,
  attendeesCount: Number,
  rsvpEnabled: Boolean,
  buttonText: String,
  isVisible: Boolean,
  displayOrder: Number
}
```

#### 6. Achievement
```
{
  title: String,
  icon: String,
  color: String (hex),
  isCompleted: Boolean,
  displayOrder: Number,
  isVisible: Boolean
}
```

#### 7. Community (raw user-generated groups)
```
{
  name: String,
  description: String,
  type: 'mental-spa' | 'connections' | 'meetups' | 'support-circle',
  members: [ObjectId → User],
  memberCount: Number,
  isPrivate: Boolean,
  tags: [String],
  color: String,
  lastActivity: Date,
  onlineCount: Number,
  status: 'pending' | 'approved' | 'rejected'
}
```

#### 8. Discussion (raw user-generated)
```
{
  author: ObjectId → User,
  community: ObjectId → Community,
  title: String,
  content: String,
  replies: [{ user: ObjectId, text: String, createdAt: Date }],
  replyCount: Number,
  likes: [ObjectId → User],
  isPinned: Boolean,
  isTrending: Boolean,
  isHidden: Boolean,
  isReported: Boolean,
  tags: [String]
}
```

#### 9. Event (raw)
```
{
  title: String,
  description: String,
  community: ObjectId,
  host: ObjectId → User,
  type: 'online' | 'in-person' | 'hybrid',
  location: String,
  date: Date,
  duration: Number (minutes),
  attendees: [ObjectId → User],
  maxAttendees: Number,
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
}
```

### User Model Fields (for community)
```
User.joinedCircles: [ObjectId → FeaturedCircle]
User.rsvpEvents: [ObjectId → UpcomingEvent]
```

---

### API Routes

#### Public
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/community-page` | All curated page content (settings, circles, spaces, discussions, events, achievements) |

#### Authenticated User
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/community/circles/:id/join` | Join a circle → increments memberCount |
| DELETE | `/api/community/circles/:id/leave` | Leave circle → decrements memberCount |
| GET | `/api/community/my-circles` | User's joined circle IDs |
| POST | `/api/community/events/:id/rsvp` | RSVP to event → increments attendeesCount |
| DELETE | `/api/community/events/:id/rsvp` | Cancel RSVP |
| GET | `/api/community/my-events` | User's RSVPed event IDs |
| POST | `/api/community/discussions/:id/reply` | Add reply to discussion |
| GET | `/api/community/discussions/:id` | Get discussion with all replies |

#### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET/PUT | `/admin/api/community-page/settings` | Edit hero stats |
| CRUD | `/admin/api/community-page/circles` | Manage featured circles |
| CRUD | `/admin/api/community-page/spaces` | Manage community spaces |
| CRUD | `/admin/api/community-page/discussions` | Manage trending discussions |
| CRUD | `/admin/api/community-page/events` | Manage upcoming events |
| CRUD | `/admin/api/community-page/achievements` | Manage progress achievements |
| GET/PUT | `/admin/api/community-page/moderation/communities` | Approve/reject user communities |
| GET/PUT/DEL | `/admin/api/community-page/moderation/discussions` | Moderate discussions |

---

### Frontend Sections (community.html)

| Section | What It Shows | Interactive? |
|---------|--------------|-------------|
| Hero | Greeting, stats (joined/discussions/events), live indicators (online/live/now) | Static from CMS |
| Recommended Circles | Cards with match %, members, status, Join button | ✅ Join/Joined toggle |
| Community Spaces | Cards with images (Mental Spa, Connections, Meetups) | Links to spaces |
| Trending Discussions | Titles with reply count, badges | ✅ Click → modal with replies + add reply |
| Upcoming Events | Date cards with RSVP button | ✅ RSVP/Going toggle |
| Community Progress | Achievement timeline | Shows from CMS |
| Activity Bar | Discussions, events, new members, reactions counts | From CMS settings |

### User Flow
1. Guest visits → sees all content, buttons show "Join Circle" / "RSVP"
2. Guest clicks Join → redirected to login
3. Logged-in user clicks Join → POST → button changes to "✓ Joined" → toast
4. User clicks RSVP → POST → button changes to "✓ Going" → attendee count updates
5. User clicks discussion → modal opens with replies → can post reply
6. On page load: user's joined circles loaded → buttons pre-set to "Joined"

---
---

## YOUTH SUPPORT PAGE (`/youth-support.html`)

### What It Is
A personalized youth growth dashboard for ages 13-24 with career discovery, confidence building, wellness tracking, challenges, and counselor access.

### Data Sources
- **CMS Content:** `GET /api/youth-support` (admin-managed)
- **User Profile:** `GET /api/youth/me` (personalized)
- **Models:** `models/YouthSupport.js` + `models/YouthProfile.js`
- **Admin:** `/admin/youth-support.html`
- **Seed:** `seed-youth-support.js`

---

### Database Models

#### CMS Models (in `models/YouthSupport.js`)

##### 1. YouthPageSettings (singleton)
```
{
  key: 'singleton',
  heroBadge: String ("Ages 13–24"),
  heroHeadline: String,
  heroDescription: String,
  heroFeatures: [String],
  heroButtonText: String,
  heroButtonLink: String,
  heroGrowthScore: Number,
  heroGrowthLabel: String,
  heroGrowthTrend: String
}
```

##### 2. SkillProgress
```
{
  label: String ("Confidence"),
  percentage: Number (0-100),
  color: String (hex),
  isVisible: Boolean,
  displayOrder: Number
}
```

##### 3. YouthAssessment (Recommended cards)
```
{
  icon: String (emoji),
  title: String,
  description: String,
  status: 'active' | 'draft' | 'archived',
  link: String,
  iconBgColor: String,
  iconColor: String,
  isVisible: Boolean,
  displayOrder: Number
}
```

##### 4. YouthProgram (Growth Modules)
```
{
  title: String,
  description: String,
  image: String (URL),
  gradientStart: String (hex),
  gradientEnd: String (hex),
  progressText: String,
  buttonText: String,
  buttonLink: String,
  isVisible: Boolean,
  displayOrder: Number
}
```

##### 5. YouthCareer
```
{
  name: String,
  matchPercent: Number (0-100),
  skillTags: [String],
  isVisible: Boolean,
  displayOrder: Number
}
```

##### 6. YouthCounselor (singleton)
```
{
  key: 'featured',
  name: String,
  role: String,
  rating: Number,
  experience: Number,
  availability: String,
  initials: String,
  photo: String,
  bookingLink: String,
  isVerified: Boolean
}
```

##### 7. YouthChallenge
```
{
  title: String,
  duration: String,
  status: 'pending' | 'completed',
  isVisible: Boolean,
  displayOrder: Number
}
```

##### 8. YouthAchievement
```
{
  title: String,
  icon: String (emoji),
  status: 'earned' | 'locked',
  color: String (hex),
  displayOrder: Number
}
```

##### 9. YouthResource
```
{
  icon: String,
  iconColor: String,
  categoryName: String,
  resourceCount: String,
  mediaCount: String,
  link: String,
  isVisible: Boolean,
  displayOrder: Number
}
```

#### User Profile Model (`models/YouthProfile.js`)
```
{
  userId: ObjectId → User (unique),
  ageGroup: '13-15' | '16-18' | '19-24',
  focusAreas: [String],
  confidenceScore: Number (0-100),
  wellnessScore: Number (0-100),
  careerClarityScore: Number (0-100),
  socialSkillsScore: Number (0-100),
  interests: [String],
  learningStyle: 'videos' | 'reading' | 'tasks' | 'mentorship',
  completedModules: [String],
  completedChallenges: [String],
  earnedAchievements: [String],
  savedCareers: [String],
  assessmentCompleted: Boolean
}
```

---

### API Routes

#### Public
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/youth-support` | All CMS page content (settings + 8 collections) |

#### Authenticated User
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/youth/me` | User's youth profile (scores, completed items) |
| POST | `/api/youth/assessment` | Submit/update assessment (age, focus, scores, interests) |
| POST | `/api/youth/modules/:id/complete` | Mark module complete → boosts confidence +5, wellness +3 |
| POST | `/api/youth/challenges/:id/complete` | Mark challenge complete → boosts confidence +3, social +5 |
| POST | `/api/youth/careers/:id/save` | Save career → boosts careerClarity +5 |
| GET | `/api/youth/saved-careers` | Get user's saved career IDs |

#### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET/PUT | `/admin/api/youth-support/settings` | Edit hero section |
| GET/PUT | `/admin/api/youth-support/counselor` | Edit featured counselor |
| CRUD | `/admin/api/youth-support/progress` | Manage progress bars |
| CRUD | `/admin/api/youth-support/assessments` | Manage recommended cards |
| CRUD | `/admin/api/youth-support/programs` | Manage growth modules |
| CRUD | `/admin/api/youth-support/careers` | Manage career matches |
| CRUD | `/admin/api/youth-support/challenges` | Manage challenges |
| CRUD | `/admin/api/youth-support/achievements` | Manage achievements |
| CRUD | `/admin/api/youth-support/resources` | Manage resource categories |

---

### Frontend Sections (youth-support.html)

| Section | What It Shows | Interactive? |
|---------|--------------|-------------|
| Hero | Age badge, headline, description, features, growth score | ✅ Button opens Assessment modal |
| Progress Bars | Confidence, Wellness, Career Clarity, Social Skills | ✅ Real user scores (if assessed) |
| Recommended | Assessment cards (Career Discovery, Confidence, Exam Toolkit) | Links |
| Growth Modules | Program cards with images, progress, buttons | CMS content |
| Career Matches | Career name + match % + skill tags | ✅ Save career function |
| Counselor | Featured counselor with booking link | Link to healing zone |
| Weekly Challenges | Checklist (completed/pending) | ✅ Complete challenge function |
| Achievements | Badge grid (earned/locked) | Status display |
| Resources | Category cards (Body Image, Bullying, etc.) | Links |

### User Flow
1. Guest visits → sees CMS defaults (static progress bars, modules, careers)
2. Guest clicks "Take Youth Assessment" → login prompt
3. Logged-in user clicks assessment → modal opens with:
   - Age group selector
   - Focus area chips (Career, Confidence, Stress, Social Skills, Study Pressure)
   - Confidence slider (1-10) with live value display
   - Career Clarity slider (1-10)
   - Wellness slider (1-10)
   - Interest chips (Technology, Design, Health, etc.)
   - Learning style dropdown
4. User submits → saved to YouthProfile → progress bars update to real scores
5. Growth Score = average of 4 scores (shown in hero)
6. User completes challenges → scores increase → progress bars animate
7. User saves careers → careerClarity increases
8. User completes modules → confidence/wellness increase

### Score Calculation
- **Growth Score** = (confidence + wellness + careerClarity + socialSkills) / 4
- **Assessment sets initial values**: slider value × 10 (so 1-10 becomes 10-100)
- **Module completion**: confidence +5, wellness +3
- **Challenge completion**: confidence +3, socialSkills +5
- **Career save**: careerClarity +5
- All scores capped at 100

---

### Admin Panel (`/admin/youth-support.html`)

10 tabs managing all content:
1. Hero Section — badge, headline, description, features, button, growth score
2. Skill Progress — % bars with colors and visibility toggles
3. Assessments — recommended action cards (icon, title, description, link)
4. Programs — module cards (image, title, description, gradient, progress text)
5. Careers — career matches (name, match %, skill tags, ordering)
6. Counselor — featured counselor profile (name, role, rating, experience, availability)
7. Challenges — weekly challenges (title, duration, status)
8. Achievements — badges (icon, title, earned/locked, color)
9. Resources — category cards (icon, name, resource count, media count)
10. Moderation — safety content (not fully implemented)

Each tab has:
- Add/Edit/Delete buttons
- Table or card-based list
- Toggle visibility
- Reorder (display order)
- Save to MongoDB via PUT `/admin/api/youth-support/*`
