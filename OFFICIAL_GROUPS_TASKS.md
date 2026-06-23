# Official Community Groups — Task Tracker

## Overview
Admin-created official groups where only admin/professionals can post, users can join/read/react/comment.

---

## STATUS KEY
- ✅ Done
- 🔨 In Progress
- ⬜ Not Started

---

## PHASE 1: Backend Models

### 1.1 Update Community Model
- ✅ Added fields to `models/Community.js`:
  - groupType, createdByType, createdByAdmin, createdByProfessional
  - postingPermission, commentingEnabled, reactionsEnabled
  - joinPolicy, isOfficial, isFeatured, coverImage, category, rules

### 1.2 Create OfficialGroupPost Model
- ✅ Created `models/OfficialGroupPost.js` with all fields:
  - groupId, authorType, adminId, professionalId
  - title, content, summary, contentType
  - sourceRefs, attachments, reactions, comments
  - isPinned, status, viewCount, savedBy

---

## PHASE 2: API Routes

### 2.1 Public / User Routes
- ✅ `GET /api/community/official-groups` — List all visible official groups
- ✅ `GET /api/community/official-groups/:id` — Single group detail
- ✅ `GET /api/community/official-groups/:id/posts` — Published posts in group
- ✅ `POST /api/community/official-groups/:id/join` — Join group (check joinPolicy)
- ✅ `DELETE /api/community/official-groups/:id/leave` — Leave group
- ✅ `POST /api/community/official-posts/:postId/react` — React (toggle, checks reactionsEnabled)
- ✅ `POST /api/community/official-posts/:postId/comment` — Comment (checks commentingEnabled + crisis detection)
- ✅ `POST /api/community/official-posts/:postId/save` — Save/unsave post
- ✅ `POST /api/community/official-posts/:postId/report` — Report post

### 2.2 Admin Routes
- ✅ `GET /admin/api/community-page/official-groups` — List all
- ✅ `POST /admin/api/community-page/official-groups` — Create group
- ✅ `PUT /admin/api/community-page/official-groups/:id` — Update group
- ✅ `DELETE /admin/api/community-page/official-groups/:id` — Delete group + posts
- ✅ `POST /admin/api/community-page/official-groups/:id/posts` — Create post
- ✅ `PUT /admin/api/community-page/official-posts/:postId` — Edit post
- ✅ `DELETE /admin/api/community-page/official-posts/:postId` — Delete post
- ✅ `PUT /admin/api/community-page/official-posts/:postId/pin` — Pin/unpin
- ✅ `PUT /admin/api/community-page/official-posts/:postId/hide` — Hide/show

### 2.3 Professional Routes
- ✅ `GET /professional/api/community/official-groups` — Groups where can post
- ✅ `POST /professional/api/community/official-groups/:id/posts` — Create post (permission enforced)
- ✅ `PUT /professional/api/community/official-posts/:postId` — Edit own post
- ✅ `DELETE /professional/api/community/official-posts/:postId` — Delete own post

---

## PHASE 3: Admin Panel

### 3.1 Add "Official Groups" Tab to `/admin/community-page.html`
- ✅ List all official groups (table with name, category, posting permission, members, posts, featured, status)
- ✅ Create group modal/form:
  - Group Name, Description, Category
  - Group Type selector
  - Cover Image upload (file → base64)
  - Posting Permission dropdown
  - Join Policy dropdown
  - Comments Enabled toggle
  - Reactions Enabled toggle
  - Featured toggle
  - Community Rules textarea
- ✅ Edit group (re-uses form, prefilled)
- ✅ Delete group (cascades to posts)
- ✅ Create post inside group (title, content, summary, type, sources, pin toggle, status)
- ✅ Manage posts (pin/unpin, hide/show, edit, delete)
- ✅ Posts view shows ALL statuses (admin endpoint added) — drafts and hidden visible to admin
- ✅ Back navigation between groups view and posts view

### 3.2 Posts inside Featured Circles
- ✅ Admin Featured Circles tab → each row has 📝 Posts action
- ✅ Same posts management UI reused (one view, two contexts)
- ✅ OfficialGroupPost model extended with `groupModel` field ('Community' | 'FeaturedCircle')
- ✅ Admin routes: `GET/POST /admin/api/community-page/circles/:id/posts`
- ✅ Edit/delete/pin/hide reuse shared `/admin/api/community-page/official-posts/:postId` routes
- ✅ Public route: `GET /api/community/circles/:id/posts`
- ✅ Public users see a "View" button on each circle card → modal shows posts feed with react/save
- ✅ React, comment, save endpoints already work for circle posts (group lookup gracefully returns null)

---

## PHASE 4: Professional Portal

### 4.1 Add to Professional Dashboard/Nav
- ⬜ Show "Official Groups I Can Post In" section
- ⬜ Create post form (if group allows professional posting)
- ⬜ View my posts + status
- ⬜ Professional posts show "Licensed Professional" badge

---

## PHASE 5: Community Page Frontend

### 5.1 Add "Official Groups" Section to `/community.html`
- ✅ Section: "Official ABLE Groups" with cards
- ✅ Card design: Official badge, name, description, category, member count, permission label, Join + View buttons

### 5.2 Group Detail Modal
- ✅ Group name + description + official badge
- ✅ Member count + category + comments status
- ✅ Group rules display
- ✅ Posts feed (pinned first, then newest)
- ✅ Post card: author badge (Admin/Professional), content type badge, title, content, source refs, reactions/comments/saves count
- ⬜ Join/Leave button inside modal
- ⬜ Comment form inside post
- ⬜ React button inside post

### 5.3 User Interactions
- ✅ Join group → POST → "✓ Joined" → toast
- ⬜ React to post inside detail modal
- ⬜ Comment on post inside detail modal
- ⬜ Save post inside detail modal

---

## PHASE 6: Safety & Moderation

- ⬜ Crisis keyword detection on comments
- ⬜ Report button on every post/comment
- ⬜ Admin moderation queue for reported content
- ⬜ Hide unsafe comments (status: 'hidden')
- ⬜ Rate limit comments/reactions (prevent spam)
- ⬜ Audit log for admin/professional post actions
- ⬜ Prevent diagnosis language in comments
- ⬜ Show safety card if crisis detected

---

## PHASE 7: Dashboard Integration

### User Dashboard
- ⬜ "Official Groups You Joined" widget
- ⬜ "Latest Official Updates" feed
- ⬜ "Saved Learning Posts" link

### Professional Dashboard
- ⬜ "Groups I Can Post In" section
- ⬜ "My Recent Guidance Posts" list
- ⬜ "Pending/Hidden Posts" status

### Admin Dashboard
- ⬜ Official Groups count stat
- ⬜ Official Posts this week
- ⬜ Reported Comments count
- ⬜ Professional Posts pending review

---

## PHASE 8: Seed Data

- ✅ Created `seed-official-groups.js` with 5 groups:
  1. "ABLE Official Updates" — admin_only, announcements
  2. "Mental Wellness Learning Circle" — admin_and_professionals, learning
  3. "Youth Growth Announcements" — admin_only, youth
  4. "Professional Guidance Room" — admin_and_professionals, professional
  5. "Weekly Wellness Challenges" — admin_only, challenges
- ✅ Seeded 6 posts across groups (announcements, guides, challenges)

---

## IMPLEMENTATION ORDER

1. ⬜ Models (update Community + create OfficialGroupPost)
2. ⬜ Admin routes (CRUD groups + posts)
3. ⬜ Admin panel tab (create/manage groups + posts)
4. ⬜ Seed data
5. ⬜ User routes (join, leave, react, comment, save, report)
6. ⬜ Community frontend (official groups section + detail modal)
7. ⬜ Professional routes (post if allowed)
8. ⬜ Professional portal integration
9. ⬜ Safety/moderation layer
10. ⬜ Dashboard widgets

---

## KEY RULES

1. **Backend enforcement** — Never rely on frontend to hide buttons. Always check permissions server-side.
2. **No user posts in admin_only** — 403 error if user tries.
3. **Professional check** — Must be `status: 'approved'` AND group must allow professional posting.
4. **Comments moderable** — Every comment has `status` field for admin to hide/approve.
5. **Crisis detection** — Run on comments before saving.
6. **Audit logging** — Log admin/professional post creation/deletion.
7. **No copyrighted content** — Admin posts should use original summaries with source links.
