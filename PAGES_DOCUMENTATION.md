# ABLE Platform — Pages Documentation

## Overview of All User-Facing Pages

This document explains how each page works, what logic it uses, its goal, data source, and user flow.

---

## 1. Youth Support (`/youth-support.html`)

### Goal
Help young people (ages 13–24) discover career paths, build confidence, track wellness, and access counseling — all personalized.

### How It Works
- Page loads → fetches `GET /api/youth-support`
- API returns all sections from MongoDB (YouthPageSettings + 8 collections)
- JavaScript renders every section dynamically from database content
- Admin manages all content via `/admin/youth-support.html`

### Data Source
- **API:** `GET /api/youth-support`
- **Model:** `models/YouthSupport.js` (9 schemas)
- **Admin:** `/admin/youth-support.html`

### Page Sections
| Section | What It Shows |
|---------|--------------|
| Hero | Age badge, headline, description, growth score %, monthly trend |
| Progress Bars | Confidence, Wellness, Career Clarity, Social Skills (% + colored bars) |
| Recommended | Assessment cards (Career Discovery, Confidence Course, Exam Toolkit) |
| Growth Modules | 4 program cards with images, descriptions, progress, action buttons |
| Career Matches | Career names + match % + skill tags |
| Featured Counselor | Name, role, rating, experience, availability, booking link |
| Weekly Challenges | Checklist with completed/pending status |
| Achievements | Badge grid (earned/locked with icons) |
| Support Resources | Category cards (Body Image, Bullying, Peer Pressure, etc.) |

### Logic
- All content is admin-controlled (no hardcoded data)
- Renders client-side from JSON
- No user-specific data — same for all visitors (future: personalize by user assessment)

---

## 2. My Voice (`/my-voice.html`)

### Goal
Let users share wellness stories, read others' journeys, react, comment, and find healing through community storytelling.

### How It Works
- Page loads → fetches `GET /api/stories` (published stories)
- If logged in → also fetches `GET /api/my-stories` (user's own submissions)
- Category filter buttons re-fetch/filter stories client-side
- Compose form submits via `POST /api/stories` (goes to "pending review")
- Admin approves/rejects stories in `/admin/stories.html`

### Data Source
- **API:** `GET /api/stories`, `POST /api/stories`, `GET /api/my-stories`
- **Model:** `models/Story.js`
- **Admin:** `/admin/stories.html`

### Page Sections
| Section | What It Shows |
|---------|--------------|
| Hero | Stats (2000+ stories, 10k readers, 96% positive), CTA to write |
| Featured Story | Manually highlighted story with read/reaction counts |
| Weekly Challenge | Reflection prompt (static currently) |
| Category Tabs | All, Recovery, Anxiety, Growth, Gratitude, Advice, Relationships |
| Stories Feed | Cards with author, time, category tag, content preview, reactions |
| Sidebar | Trending stories, Collections, Community impact stats |
| Compose Form | Title, category, content textarea, image URL, submit for review |
| My Stories | User's own submissions with status badges (Published/Under Review/Rejected) |

### Logic
- **Story submission flow:** User writes → `POST /api/stories` → status="pending" → Admin approves → status="published" → appears in feed
- **Reactions:** Each story has inspired/relatable/hopeful/thankYou arrays (toggle per user)
- **Comments:** Users can comment on individual stories
- **Time ago:** Shows "5 min ago", "2 hours ago", "3 days ago"
- **Category filtering:** Client-side filter on fetched data
- **Anonymous:** Stories can be posted as anonymous (hides author name)

---

## 3. Community (`/community.html`)

### Goal
Connect users with wellness circles, events, discussions, and community spaces (Mental Spa, Wellness Dating, Meetups).

### How It Works
- Page loads → fetches `GET /api/community-page`
- API returns all curated content from MongoDB (admin-managed)
- JavaScript renders: hero stats, recommended circles, community spaces, trending discussions, upcoming events, progress achievements
- Empty sections auto-hide if no content
- Skeleton loaders shown during fetch

### Data Source
- **API:** `GET /api/community-page`
- **Model:** `models/Community.js` (CommunityPageSettings + FeaturedCircle + CommunitySpace + TrendingDiscussion + UpcomingEvent + Achievement)
- **Admin:** `/admin/community-page.html`

### Page Sections
| Section | What It Shows |
|---------|--------------|
| Hero | Greeting, stats (communities joined, discussions, events), live indicators (online, live discussions, events now) |
| Recommended Circles | Match %, title, description, member count, status badge, join button |
| Community Spaces | Cards with images (Mental Spa, Connections, Meetups), member counts, enter buttons |
| Trending Discussions | Titles with reply counts, badges (Hot/Active/New), accent colors |
| Upcoming Events | Date cards with month/day, title, location, attendees, RSVP button |
| Community Progress | Achievement timeline (Joined First Circle, etc.) — completed/pending states |
| Activity Bar | Discussions count, events this week, new members, reactions today |

### Logic
- **Admin-driven CMS:** All circles, spaces, discussions, events, achievements are CRUD-managed
- **Skeleton loading:** Shows placeholder animations until data arrives
- **Section visibility:** Empty sections collapse with `is-hidden` class
- **Live indicators:** Shows online members, live discussions, happening-now events (from settings)
- **User greeting:** Uses localStorage `userName` for personalized "Welcome Back, {name}"
- **XSS protection:** All content escaped via `escapeHtml()` function

---

## 4. Body-Mind (`/body-mind.html`)

### Goal
Provide holistic wellness through nutrition guidance, yoga sessions, breathing exercises, and daily routine management.

### How It Works
- Currently **static page** (not database-driven yet)
- Content is hardcoded HTML organized in tabbed sections
- Tab switching via JavaScript (Nutrition / Yoga / Breathing / Routine)
- Progress ring and habit tracker are visual only (no backend saving yet)

### Data Source
- **No API currently** — content is static HTML
- Future: could use a BodyMindPage model similar to other CMS pages

### Page Sections
| Section | What It Shows |
|---------|--------------|
| Hero | Title, description, checks (50+ sessions, 120 nutrition plans), progress ring (50% today) |
| Today's Recommendation | Personalized session suggestion with time/level/focus |
| Active Programs | 3 program cards with day progress, progress bars, continue buttons |
| Category Tabs | Nutrition / Yoga / Breathing / Routine — toggleable content |
| Nutrition Tab | 4 session cards (Omega-3, Berry Smoothies, Herbal Teas, Gut Health) |
| Yoga Tab | 4 session cards (Sun Salutation, Wind-Down, Anxiety Flow, Yoga Nidra) |
| Breathing Tab | 4 exercises (4-7-8, Box, Alternate Nostril, Diaphragmatic) |
| Routine Tab | Today's timeline + Habit tracker with checkboxes |
| Achievements | What You'll Achieve (Better Sleep, Lower Anxiety, etc.) |
| Continue CTA | "2 sessions away from weekly goal" motivational prompt |

### Logic
- **Tab switching:** Click pill button → hide all `.bm-tab-content` → show selected tab
- **Static content:** No API calls — good for performance, less flexible for admin
- **Progress ring:** SVG circle with stroke-dashoffset animation
- **Habit tracker:** Checkboxes (no backend persistence yet)

---

## 5. Healing Zone (`/healing-zone.html`)

### Goal
Help users find, filter, and book licensed therapists matched to their needs.

### How It Works
- Page loads → fetches `GET /api/therapists` (all active therapists)
- Renders top 3 as "Recommended" with match %, rest in "All Therapists" grid
- Category chips filter by specialization
- Sort dropdown: Best Match, Highest Rated, Available Today, Most Experience
- Therapist data comes from MongoDB (admin-managed)

### Data Source
- **API:** `GET /api/therapists?category=X&sort=Y`
- **Model:** `models/Therapist.js`
- **Admin:** `/admin/therapists.html`

### Page Sections
| Section | What It Shows |
|---------|--------------|
| Hero | Title, badges (Video/Audio/Chat, 98% Satisfaction, First Free), avatar stack, online count |
| Category Chips | All, Anxiety, Depression, Relationships, Stress, Trauma, Self-Esteem, Grief, Family, Addiction |
| Recommended (Top 3) | Large cards with match %, photo, name, role, rating, trust badges, availability, book button |
| All Therapists | Compact cards with photo, name, specializations, rating, experience, match %, book button |
| Success Stories | 3 static testimonial cards with quotes |
| How It Works | 4-step flow: Assessment → AI Matching → Book Session → Begin Healing |

### Logic
- **Dynamic filtering:** Click category chip → re-fetch with `?category=X`
- **Sorting:** Dropdown triggers re-fetch with `?sort=Y`
- **Match percentage:** Calculated client-side (decreasing from 98% for visual ranking)
- **Online count:** Counts therapists with `isAvailableToday: true`
- **Avatar colors:** Cycles through 8 colors for visual variety
- **Rating stars:** Generates ★/☆ from decimal rating
- **Trust badges:** Shows verified status, total sessions, response time

### Therapist Data Fields
```
name, title, specializations[], experience, rating, reviewCount,
sessionTypes[], isVerified, isAvailableToday, nextAvailable,
totalSessions, responseTime, avatar, isActive
```

---

## Shared Patterns Across All Pages

### Navigation
- All pages use `sidebar-nav.js` (shared dynamic sidebar)
- Auto-detects current page and marks it active
- Single source of truth — edit one file to update all pages

### Chatbot
- All pages include the AI chatbot widget (bottom-right)
- Uses `chatbot.js` for UI + sends messages to `POST /api/chat`
- Crisis detection runs before AI response

### Dashboard Integration
- `dashboard.js` handles mobile nav toggle, user profile loading
- All pages include it for consistent behavior

### Authentication
- Pages check `localStorage.getItem('token')` for logged-in state
- Some features require auth (compose story, check-in, child profiles)
- Guest users can still browse content

### Design System
- Warm light theme: `#FAF7F2` background, white cards, orange accents
- Consistent typography: system font stack, 0.8-1rem body text
- Card style: white, 1px border, 16px radius, subtle shadow
- Responsive: 3 breakpoints (1200px, 768px, 480px)
- Mobile: sidebar collapses, bottom nav appears, grids stack

---

## Page Status Summary

| Page | Data Source | Admin Panel | User Interaction |
|------|-----------|-------------|-----------------|
| Youth Support | MongoDB API | ✅ Full CRUD | View only |
| My Voice | MongoDB API | ✅ Moderation | Submit stories, react, comment |
| Community | MongoDB API | ✅ Full CRUD | View, RSVP (future) |
| Body-Mind | Static HTML | ❌ None | Tab switching, checkboxes |
| Healing Zone | MongoDB API | ✅ Full CRUD | Filter, sort, book (future) |
| Self-Care | MongoDB API | ✅ CMS | Check-in, complete tasks, journal |
| Child Support | MongoDB API | ✅ CMS | Age/concern selector, view guides |
| Parenting | MongoDB API | ✅ CMS | Focus areas, start challenges |
