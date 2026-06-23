# ABLE Platform — Architecture & Logic Overview

## What We Built

ABLE (A Better Life Enabled) is a mental wellness web platform with:
- **Public-facing pages** (landing, dashboard, features)
- **Admin panel** (manage all content via database)
- **REST API** (Express.js + MongoDB)
- **AI Chatbot** (Gemini-powered with fallback responses)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| AI | Google Gemini API (with fallback) |
| Auth | JWT tokens (user + admin) |
| Hosting | localhost:3000 |

---

## Architecture Pattern

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Public Pages   │────▶│  Express API │────▶│   MongoDB    │
│  (HTML/JS)      │     │  (server.js) │     │  (Models)    │
└─────────────────┘     └──────────────┘     └──────────────┘
                              │
┌─────────────────┐           │
│  Admin Panel    │───────────┘
│  (HTML/JS)      │  (adminAuth protected)
└─────────────────┘
```

**Logic Flow:**
1. Admin edits content in admin panel → saves to MongoDB via API
2. Public page loads → fetches data from public API endpoint
3. Page renders dynamically from database content
4. Fallback: if API fails, pages show static HTML defaults

---

## File Structure

### Models (`/models/`)

| File | Purpose |
|------|---------|
| `User.js` | User accounts, preferences, mood history, notifications, appearance, plan |
| `Story.js` | User-submitted wellness stories (with reactions, comments, moderation) |
| `Therapist.js` | Therapist profiles (name, specializations, rating, availability) |
| `Session.js` | Booked therapy sessions |
| `Community.js` | Community groups, events, discussions + curated page content |
| `WellnessTask.js` | Daily wellness tasks per user |
| `YouthSupport.js` | Youth page content (9 collections: settings, progress, assessments, programs, careers, counselor, challenges, achievements, resources) |
| `LandingPage.js` | Landing page content (singleton: hero, features, showcase, stats, pricing, FAQ, etc.) |
| `Chat.js` | Chat history |
| `Program.js` | Wellness programs |
| `Youth.js` | Youth-specific data |

### Public Pages (`/public/`)

| Page | What It Does | Data Source |
|------|-------------|-------------|
| `index.html` | Landing page with features showcase | `/api/landing` |
| `dashboard.html` | User wellness dashboard (mood, tasks, score) | `/api/dashboard` |
| `healing-zone.html` | Browse & book therapists | `/api/therapists` |
| `body-mind.html` | Yoga, breathing, nutrition content | Static |
| `community.html` | Community circles, events, discussions | `/api/community-page` |
| `youth-support.html` | Youth programs, careers, challenges | `/api/youth-support` |
| `my-voice.html` | Story sharing platform | `/api/stories` |
| `settings.html` | User account settings (profile, privacy, notifications) | `/api/me`, `/api/me/settings` |
| `login.html` | Login form | `/api/login` |
| `signup.html` | Signup + WHODAS assessment | `/api/signup` |

### Admin Pages (`/admin/`)

| Page | Manages | API Endpoints |
|------|---------|---------------|
| `index.html` | Admin login | `/admin/api/login` |
| `dashboard.html` | Overview stats, pending stories | `/admin/api/dashboard` |
| `users.html` | User management (block, plan, delete) | `/admin/api/users/*` |
| `stories.html` | Story moderation (approve/reject) | `/admin/api/stories/*` |
| `therapists.html` | Therapist CRUD | `/admin/api/therapists/*` |
| `community-page.html` | Community page content | `/admin/api/community-page/*` |
| `youth-support.html` | Youth Support page content | `/admin/api/youth-support/*` |
| `landing.html` | Landing page content (all sections) | `/admin/api/landing` |
| `settings.html` | Settings page config & user management | `/admin/api/dashboard` |
| `analytics.html` | Mood & task analytics | `/admin/api/mood-analytics`, `/admin/api/task-analytics` |

---

## API Routes Summary

### Public (no auth)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/landing` | Landing page content |
| GET | `/api/youth-support` | Youth support page content |
| GET | `/api/community-page` | Community page content |
| GET | `/api/stories` | Published stories |
| GET | `/api/stories/:id` | Single story with reactions |
| GET | `/api/therapists` | Active therapists (filterable) |
| POST | `/api/signup` | Create account |
| POST | `/api/login` | User login |
| POST | `/api/chat` | AI chatbot (Gemini or fallback) |

### Authenticated User (JWT token required)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/me` | Get current user profile |
| PUT | `/api/me` | Update profile (name, phone, bio) |
| PUT | `/api/me/settings` | Update notifications, privacy, appearance, wellness goals |
| PUT | `/api/me/password` | Change password |
| DELETE | `/api/me` | Delete own account |
| GET | `/api/dashboard` | Dashboard data (mood, tasks, score, streak) |
| POST | `/api/mood` | Log today's mood |
| GET | `/api/mood/history` | Mood history |
| GET | `/api/tasks` | Today's wellness tasks |
| PUT | `/api/tasks/:index` | Complete a task |
| POST | `/api/stories` | Submit story (pending review) |
| POST | `/api/stories/:id/react` | React to a story |
| POST | `/api/stories/:id/comment` | Comment on a story |
| GET | `/api/my-stories` | User's own stories |

### Admin (admin JWT required)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/admin/api/login` | Admin login (admin/admin) |
| GET | `/admin/api/dashboard` | Stats + recent data |
| GET/PUT | `/admin/api/landing` | Landing page CRUD (singleton) |
| GET/PUT | `/admin/api/youth-support/settings` | Youth hero section |
| GET/PUT | `/admin/api/youth-support/counselor` | Featured counselor |
| CRUD | `/admin/api/youth-support/{progress,assessments,programs,careers,challenges,achievements,resources}` | Youth page collections |
| CRUD | `/admin/api/community-page/{circles,spaces,discussions,events,achievements}` | Community page collections |
| GET/PUT | `/admin/api/community-page/settings` | Community stats |
| CRUD | `/admin/api/therapists` | Therapist management |
| CRUD | `/admin/api/stories` | Story management + approve/reject |
| GET/PUT/DEL | `/admin/api/users/:id` | User management |
| GET | `/admin/api/mood-analytics` | Mood data analytics |
| GET | `/admin/api/task-analytics` | Task completion analytics |

---

## Authentication Logic

### User Auth
1. User signs up → password hashed with bcrypt → JWT token returned
2. Token stored in `localStorage` as `token`
3. Every API call sends `Authorization: Bearer <token>` header
4. Middleware `authMiddleware` verifies JWT and sets `req.user`

### Admin Auth
1. Admin logs in with hardcoded credentials (admin/admin)
2. JWT with `role: 'admin'` issued
3. Token stored as `adminToken` in localStorage
4. Middleware `adminAuth` checks JWT and verifies admin role

---

## Data Flow Examples

### User Views Youth Support Page
```
youth-support.html loads
  → fetch('/api/youth-support')
  → Server queries MongoDB (YouthPageSettings, SkillProgress, YouthAssessment, etc.)
  → Returns JSON with all sections
  → JavaScript renders hero, progress bars, modules, careers, challenges, etc.
```

### Admin Edits Landing Page
```
Admin opens /admin/landing.html
  → fetch('/admin/api/landing') with admin token
  → Form fields populated with current data
  → Admin edits hero headline, adds a feature, changes pricing
  → Clicks "Save All Changes"
  → PUT /admin/api/landing with full document
  → MongoDB updated
  → Public /api/landing now returns new content
  → User refreshes landing page → sees changes immediately
```

### User Saves Settings
```
User on /settings.html
  → Page loads → fetch('/api/me') → populate all fields
  → User changes notification toggles
  → Click "Save Notifications"
  → PUT /api/me/settings { notifications: {...} }
  → MongoDB user document updated
  → Toast "✓ Notifications saved"
```

---

## Seed Scripts

| Script | Purpose |
|--------|---------|
| `seed-landing.js` | Populates landing page content |
| `seed-youth-support.js` | Populates youth support page content |
| `seed-therapists.js` | Populates therapist profiles |
| `seed-community-page.js` | Populates community page content |

Run with: `node <script-name>.js`

---

## Key Design Decisions

1. **Singleton pattern** for page content (one document per page in MongoDB)
2. **No frontend framework** — vanilla JS for speed and simplicity
3. **Admin panel uses same Express server** — served from `/admin/` static folder
4. **Generic CRUD factory** (`youthCrud()`, `crud()`) for repeated collection patterns
5. **Graceful degradation** — if API fails, pages fall back to static HTML
6. **Real-time updates** — admin saves → public pages reflect changes on next load
7. **JWT auth** with separate tokens for users and admins
8. **AI chatbot** with Gemini primary + rule-based fallback when API key missing


---

## Phase 1 Security Upgrades (Implemented)

### 1. Admin Authentication (No More Hardcoded Credentials)
- **Admin model** (`models/Admin.js`) with bcrypt hashed passwords
- Account lockout after 5 failed attempts (30 min lock)
- Role-based access: `superadmin`, `admin`, `moderator`
- JWT tokens expire in 8 hours (was 24h)
- Default admin: `admin` / `Admin@2026!` (created via `seed-admin.js`)

### 2. Rate Limiting
- General: 200 requests per 15 minutes per IP
- Auth endpoints (login/signup): 10 attempts per 15 minutes per IP
- Uses `express-rate-limit` package

### 3. Security Headers (Helmet)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (when HTTPS)
- Referrer-Policy, DNS-Prefetch-Control, etc.

### 4. CORS Protection
- Configurable via `CORS_ORIGIN` env variable
- Defaults to `*` for development, restrict in production

### 5. Input Validation
- Signup: name length (2-100), email regex, password min 6 chars
- Admin login: requires both fields, trimmed/lowercased

### 6. Crisis Detection (Chatbot Safety)
- Pre-Gemini safety layer scans for crisis keywords
- Keywords: suicide, self-harm, wanting to die, etc.
- Returns immediate crisis resources (988, Crisis Text, 911)
- Clearly states bot is NOT a therapist or emergency service
- Source tagged as `crisis-safety` for analytics

### 7. Audit Logging
- **AuditLog model** (`models/AuditLog.js`) tracks admin actions
- Records: who, what action, target, IP address, timestamp
- Queryable via `GET /admin/api/audit-logs`

### 8. Request Size Limits
- JSON body limited to 10MB (was 50MB — reduced attack surface)

---

## Admin Credentials

| Field | Value |
|-------|-------|
| Username | admin |
| Password | Admin@2026! |
| Role | superadmin |

⚠️ Change password after first deployment!
