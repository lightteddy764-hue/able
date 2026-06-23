# OLD PAGES UPGRADE — Task Tracker

## Priority Order & Status
1. ✅ Body-Mind — COMPLETE (backend + frontend)
2. ✅ Healing Zone — COMPLETE (backend + frontend)
3. ✅ Community — COMPLETE (backend + frontend)
4. ✅ Youth Support — COMPLETE (backend + frontend)
5. 🔨 My Voice — Backend done, frontend needs polish

---

## STATUS KEY
- ✅ Done
- 🔨 In Progress
- ⬜ Not Started

---

## 1. BODY-MIND PAGE — ✅ COMPLETE

### Backend ✅
- ✅ Model: `models/BodyMind.js` (BodyMindPage + BodyMindProgress)
- ✅ Seed: `seed-bodymind.js` (10 sessions, 3 programs, 7 habits)
- ✅ `GET /api/body-mind` — Public page content
- ✅ `GET /api/body-mind/progress` — User progress
- ✅ `POST /api/body-mind/session/:id/complete` — Complete session
- ✅ `PUT /api/body-mind/habit` — Toggle habit
- ✅ `PUT /api/body-mind/routine` — Save routine
- ✅ `POST /api/body-mind/program/:id/start` — Start program
- ✅ `GET/PUT /admin/api/body-mind` — Admin CMS

### Frontend ✅
- ✅ Fetch sessions/programs/habits from API
- ✅ Progress ring from real data
- ✅ Start session → exercise modal (breathing timer, yoga steps)
- ✅ Complete session → save → update ring → toast
- ✅ Habit checkboxes save to backend/localStorage
- ✅ Programs: Start/Continue → save progress
- ✅ Today's recommendation from DB
- ✅ Category tabs filter sessions
- ✅ Guest state + toast notifications

---

## 2. HEALING ZONE PAGE — ✅ COMPLETE

### Backend ✅
- ✅ Model: `models/Professional.js` + `models/ProfessionalSession.js`
- ✅ 20 professionals seeded
- ✅ `GET /api/professionals` — List approved
- ✅ `POST /api/professionals/:id/request-session` — Book
- ✅ `GET /api/my-professional-sessions` — User sessions
- ✅ `DELETE /api/my-professional-sessions/:id/cancel`
- ✅ Duplicate prevention

### Frontend ✅
- ✅ Real professionals from DB
- ✅ Category filter + sort
- ✅ Booking modal (type, concern, time, note)
- ✅ Therapist detail modal (click card)
- ✅ "My Sessions" panel with cancel
- ✅ Result count display
- ✅ "View Full Profile" link
- ✅ Avatar stack rotates with real professionals

---

## 3. COMMUNITY PAGE — ✅ COMPLETE

### Backend ✅
- ✅ `GET /api/community-page` — All curated content
- ✅ `POST /api/community/circles/:id/join`
- ✅ `DELETE /api/community/circles/:id/leave`
- ✅ `GET /api/community/my-circles`
- ✅ `POST /api/community/events/:id/rsvp`
- ✅ `DELETE /api/community/events/:id/rsvp`
- ✅ `GET /api/community/my-events`
- ✅ `POST /api/community/discussions/:id/reply`
- ✅ `GET /api/community/discussions/:id`

### Frontend ✅
- ✅ Dynamic content loading + skeletons
- ✅ "Join Circle" → POST → "✓ Joined" → toast
- ✅ "RSVP" → POST → "✓ Going" → toast
- ✅ Discussion modal with replies + add reply
- ✅ Guest prompt for actions
- ✅ User's joined state on load

---

## 4. YOUTH SUPPORT PAGE — ✅ COMPLETE

### Backend ✅
- ✅ Model: `models/YouthProfile.js`
- ✅ `GET /api/youth/me`
- ✅ `POST /api/youth/assessment`
- ✅ `POST /api/youth/modules/:id/complete`
- ✅ `POST /api/youth/challenges/:id/complete`
- ✅ `POST /api/youth/careers/:id/save`
- ✅ `GET /api/youth/saved-careers`

### Frontend ✅
- ✅ CMS content loads dynamically
- ✅ Assessment modal (age, focus, sliders, chips, interests)
- ✅ Personalized progress bars (real scores)
- ✅ Growth score = average of 4 scores
- ✅ Hero button → assessment
- ✅ Challenge/career save functions

---

## 5. MY VOICE PAGE — ✅ COMPLETE

### Backend ✅
- ✅ `GET /api/stories`
- ✅ `POST /api/stories` (pending review)
- ✅ `GET /api/stories/:id`
- ✅ `POST /api/stories/:id/react`
- ✅ `POST /api/stories/:id/comment`
- ✅ `GET /api/my-stories`
- ✅ `PUT /api/stories/:id` (edit draft/pending)
- ✅ `DELETE /api/stories/:id` (delete draft/pending)
- ✅ `POST /api/stories/:id/report`
- ✅ `POST /api/stories/:id/bookmark`

### Frontend ✅
- ✅ Loads stories from API
- ✅ Category filter
- ✅ Submit story form
- ✅ My stories with status badges
- ✅ Story detail modal (full content + reactions + comments + report + bookmark)
- ✅ Reaction toggle with optimistic UI + active state
- ✅ Comment form in modal → reload on post
- ✅ Bookmark button
- ✅ Report button with confirmation
- ✅ Edit own drafts (opens compose with data pre-filled)
- ✅ Delete own drafts (with confirmation)
- ✅ Form supports both create and edit mode
- ⬜ Search box + sort

---

## REMAINING WORK (Polish Items)

### High Priority — ✅ ALL DONE
- ✅ My Voice: Story detail modal with reactions/comments
- ✅ My Voice: Edit/delete drafts
- ✅ Dashboard: Activity from all pages (logActivity wired everywhere)

### Medium Priority
- ⬜ Body-Mind: Routine timeline editor
- ⬜ Healing Zone: "Find My Match" quiz
- ⬜ Community: Circle/Space detail modals
- ⬜ Youth: Module detail modal with lessons
- ⬜ Youth: Career detail with roadmap
- ⬜ My Voice: Search + sort

### Low Priority (Nice to Have)
- ⬜ Body-Mind: Achievement unlocks
- ⬜ Community: Achievement unlocks
- ⬜ Youth: Achievement unlocks
- ⬜ Healing Zone: Loading skeleton
- ⬜ All pages: Confirmation dialogs
- ⬜ All pages: Reusable modal component
