# BoardFlow — Project Plan

## Overview

BoardFlow is a personal board/whiteboard web application. Think of it as an infinite canvas where users can add sticky notes, rich notes, sketches, screenshots, videos, audio recordings, file attachments, roadmaps, link previews, and AI-generated content — all organized spatially on a zoomable board.

Users can create multiple boards, share them with others, chat in real-time, and access everything from any device as a Progressive Web App.

---

## Tech Stack

| Layer | Service | Purpose |
|---|---|---|
| Frontend | Vanilla HTML5/CSS3/JS (ES6 modules) | No framework, no build step, maximum performance |
| Auth + Database | Supabase | PostgreSQL DB, Auth, Realtime, Row Level Security |
| File Storage | Puter.js | User cloud storage (User Pays model, no credit card) |
| Image Hosting | ImgBB | Permanent image hosting via free API |
| Hosting | Cloudflare Pages | Free static hosting, unlimited bandwidth |
| AI | Puter.js | 400+ models, image gen, OCR, TTS, STT |
| Realtime Chat | Supabase Realtime | Board-level messaging, presence |

### Why This Stack?

- **Zero credit card required** for any service
- **No build step** — vanilla JS with ES6 modules, runs directly in browser
- **No backend server** — Supabase + Puter.js handle everything
- **Lightweight** — no React/Vue/Angular overhead
- **Scalable** — each service scales independently

---

## Security Rules

### Supabase Keys

- **Publishable key (`sb_publishable_...`)**: Safe in frontend, replaces the legacy anon JWT. Protected by Row Level Security (RLS).
- **Service role key**: NEVER in frontend code. Only for server-side Edge Functions.
- **JWT Secret**: Never expose. Used internally by Supabase Auth.

### Row Level Security (RLS)

- Enable RLS on **every single table** — no exceptions
- Never use `USING (true)` on tables with user data
- Always use `auth.uid()` to verify user identity in policies
- Test policies as both authenticated AND anonymous users

### Auth Security

- Enable email confirmation for production
- Set minimum password length to 8+ characters
- Disable unused OAuth providers
- Set JWT expiry to reasonable values

---

## Database Schema (Supabase/PostgreSQL)

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### boards

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  template TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### board_members

```sql
CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);
```

### items

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'sticky_note', 'rich_note', 'sketch', 'screenshot',
    'link_card', 'roadmap', 'file', 'audio', 'video',
    'image', 'connection'
  )),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 200,
  rotation FLOAT DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  color TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  file_url TEXT,
  file_provider TEXT,
  file_id TEXT,
  sketch_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

```sql
-- profiles: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- boards: owners have full access, members access based on role
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own boards" ON boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view shared boards" ON boards FOR SELECT USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users create boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own boards" ON boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own boards" ON boards FOR DELETE USING (auth.uid() = user_id);

-- board_members
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View members of own boards" ON board_members FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Owners add members" ON board_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
);
CREATE POLICY "Owners update members" ON board_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
);
CREATE POLICY "Owners remove members" ON board_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
);

-- items: access based on board ownership or membership
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View items on own boards" ON items FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
);
CREATE POLICY "View items on shared boards" ON items FOR SELECT USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = items.board_id AND user_id = auth.uid())
);
CREATE POLICY "Editors manage items" ON items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = items.board_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View chat on own boards" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
);
CREATE POLICY "View chat on shared boards" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM board_members WHERE board_id = chat_messages.board_id AND user_id = auth.uid())
);
CREATE POLICY "Members send messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM board_members WHERE board_id = chat_messages.board_id AND user_id = auth.uid())
  )
);
```

---

## Features (27 Total)

### Core Features

1. **Auth** — Email/password + Google OAuth (Supabase)
2. **Dashboard** — Board list, search, create/rename/delete
3. **Infinite Canvas** — Pan, zoom, grid, mini-map, touch gestures
4. **Sticky Notes** — Draggable, resizable, rotatable, color-coded
5. **Rich Notes** — Markdown editor, checklists, code blocks

### Drawing & Media

6. **Sketches** — Freehand drawing, pen/marker/eraser, undo
7. **Screenshots** — Upload, paste from clipboard, drag-drop
8. **Audio Recording** — Record in-browser, store via Puter.js
9. **Video Upload** — Upload any video, Puter.js storage, player

### Links & Embeds

10. **Link Cards** — URL paste with OG preview (title, image, description)
11. **External Links** — Google Drive, YouTube, Dropbox previews
12. **File Attachments** — Any file type, Puter.js/ImgBB storage

### Organization

13. **File Manager** — Full file browser (folders, upload, download, preview, search)
14. **Roadmaps** — Timeline view, milestones, progress tracking
15. **Connection Lines** — Draw arrows/lines linking items

### Collaboration

16. **User Chat** — Real-time board-level chat (Supabase Realtime)
17. **Sharing** — Invite by email, roles (owner/editor/viewer), public share link

### AI (via Puter.js)

18. **AI Assistant** — Chat with AI about board content
19. **AI Image Generation** — Generate images for boards
20. **OCR** — Extract text from screenshots
21. **Text-to-Speech** — Read notes aloud
22. **Speech-to-Text** — Voice dictation for creating notes

### System

23. **i18n** — 15 languages with RTL support
24. **PWA** — Offline support, installable on mobile/desktop
25. **Themes** — Dark/Light mode with CSS custom properties
26. **Board Tools** — Undo/Redo, search, keyboard shortcuts, export
27. **Board Templates** — 35+ templates across 7 categories

---

## i18n — Supported Languages (15)

| # | Language | Code | Direction |
|---|---|---|---|
| 1 | English | `en` | LTR (default) |
| 2 | Arabic | `ar` | RTL |
| 3 | French | `fr` | LTR |
| 4 | Spanish | `es` | LTR |
| 5 | Portuguese | `pt` | LTR |
| 6 | German | `de` | LTR |
| 7 | Russian | `ru` | LTR |
| 8 | Turkish | `tr` | LTR |
| 9 | Hindi | `hi` | LTR |
| 10 | Chinese Simplified | `zh-CN` | LTR |
| 11 | Japanese | `ja` | LTR |
| 12 | Korean | `ko` | LTR |
| 13 | Italian | `it` | LTR |
| 14 | Dutch | `nl` | LTR |
| 15 | Indonesian | `id` | LTR |

### RTL Support

- Only Arabic requires full RTL in v1
- Use CSS logical properties (`margin-inline-start` instead of `margin-left`)
- HTML `dir="rtl"` attribute toggles entire layout
- Auto-detect from browser language, manual override in settings

---

## Board Templates (35+ Across 7 Categories)

### 1. Study & Education (7 templates)
- Exam Prep, Lecture Notes, Research Board, Language Learning, Study Group, Book Summary, Flashcards

### 2. Business & Professional (8 templates)
- Kanban Board, SWOT Analysis, Business Model Canvas, Meeting Notes, Project Plan, Pitch Deck, OKR Board, Sprint Board

### 3. Creative & Design (6 templates)
- Mind Map, Mood Board, Storyboard, Design System, User Journey, Brand Board

### 4. Personal & Life (7 templates)
- Goal Setting, Weekly Planner, Vision Board, Habit Tracker, Journal, Reading List, Travel Planner

### 5. Business Operations (6 templates)
- Roadmap, Retrospective, Risk Assessment, Stakeholder Map, Budget Planner, Competitor Analysis

### 6. Health & Wellness (4 templates)
- Fitness Plan, Meal Planner, Mental Health, Health Tracker

### 7. Team & Collaboration (5 templates)
- Team Onboarding, Brainstorm, Decision Matrix, Problem Solving, Communication Plan

---

## Project Structure

```
boardflow/
├── index.html                    # SPA entry point
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
├── config.example.js             # Template for user's config
├── package.json                  # Dev dependencies (serve, wrangler)
├── .gitignore
├── _headers                      # Cloudflare Pages headers
├── _redirects                    # Cloudflare Pages SPA fallback
├── css/
│   ├── variables.css             # Theme variables (dark/light)
│   ├── reset.css                 # CSS reset/normalize
│   ├── main.css                  # Global styles
│   ├── rtl.css                   # RTL overrides
│   ├── responsive.css            # Media queries (mobile/tablet/desktop)
│   ├── auth.css                  # Login/signup pages
│   ├── dashboard.css             # Board list page
│   ├── board.css                 # Board canvas page
│   └── components/
│       ├── sticky-note.css
│       ├── rich-note.css
│       ├── sketch.css
│       ├── link-card.css
│       ├── roadmap.css
│       ├── file-manager.css
│       ├── media-player.css
│       ├── chat.css
│       ├── ai-assistant.css
│       ├── template-gallery.css
│       ├── toolbar.css
│       └── minimap.css
├── js/
│   ├── app.js                    # Main entry, router init
│   ├── config.js                 # Supabase/Puter/ImgBB keys
│   ├── router.js                 # Client-side SPA hash router
│   ├── auth/
│   │   ├── auth.js               # Auth state management
│   │   ├── login.js              # Login page logic
│   │   └── signup.js             # Signup page logic
│   ├── board/
│   │   ├── board-manager.js      # Board CRUD operations
│   │   ├── canvas.js             # Pan/zoom/grid/minimap
│   │   ├── item-manager.js       # Create/edit/delete items
│   │   ├── drag-drop.js          # Drag & drop system
│   │   ├── selection.js          # Multi-select
│   │   ├── history.js            # Undo/redo
│   │   └── connections.js        # Lines between items
│   ├── components/
│   │   ├── sticky-note.js
│   │   ├── rich-note.js
│   │   ├── sketch.js
│   │   ├── screenshot.js
│   │   ├── link-card.js
│   │   ├── roadmap.js
│   │   ├── file-manager.js
│   │   ├── media-player.js
│   │   ├── audio-record.js
│   │   └── video-upload.js
│   ├── ai/
│   │   └── ai-assistant.js       # Puter.js AI integration
│   ├── sharing/
│   │   ├── share-manager.js
│   │   └── permissions.js
│   ├── templates/
│   │   ├── template-engine.js    # Template loading system
│   │   └── template-gallery.js   # Template browser UI
│   ├── i18n/
│   │   ├── i18n.js               # Translation engine
│   │   └── locales/              # 15 language JSON files
│   │       ├── en.json, ar.json, fr.json, es.json
│   │       ├── pt.json, de.json, ru.json, tr.json
│   │       ├── hi.json, zh-CN.json, ja.json
│   │       ├── ko.json, it.json, nl.json, id.json
│   ├── ui/
│   │   ├── modal.js
│   │   ├── toast.js
│   │   ├── context-menu.js
│   │   ├── toolbar.js
│   │   ├── sidebar.js
│   │   └── search.js
│   ├── utils/
│   │   ├── storage.js            # IndexedDB local cache
│   │   ├── helpers.js
│   │   ├── dom.js
│   │   └── image-utils.js        # Compression, processing
│   └── pwa.js                    # Service worker registration
├── assets/
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   ├── images/                   # Static images
│   └── templates/                # Template JSON files + thumbnails
└── README.md
```

---

## Build Phases

### Phase 1: Foundation (~15 files)
**Goal**: App skeleton with auth and routing

- `index.html` — SPA shell with all CSS/JS imports
- `manifest.json` — PWA manifest
- `config.example.js` — Config template
- `package.json` — Dev dependencies
- `.gitignore`
- `_headers` — Cloudflare security headers
- `_redirects` — SPA fallback
- `css/variables.css` — CSS custom properties (colors, spacing, fonts)
- `css/reset.css` — CSS reset
- `css/main.css` — Global layout styles
- `js/config.js` — Supabase/Puter/ImgBB configuration
- `js/app.js` — Main entry point
- `js/router.js` — Hash-based SPA router
- `js/auth/auth.js` — Auth state management
- `js/auth/login.js` — Login page
- `js/auth/signup.js` — Signup page
- `css/auth.css` — Auth page styles

### Phase 2: Dashboard (~10 files)
**Goal**: Board management and template gallery

- `js/board/board-manager.js` — Board CRUD (create, read, update, delete)
- `js/ui/sidebar.js` — Sidebar navigation
- `js/ui/modal.js` — Modal dialog system
- `js/ui/toast.js` — Toast notifications
- `js/templates/template-engine.js` — Template loading
- `js/templates/template-gallery.js` — Template browser UI
- `css/dashboard.css` — Dashboard styles
- `css/components/template-gallery.css` — Template gallery styles
- `css/components/toolbar.css` — Toolbar styles

### Phase 3: Canvas (~8 files)
**Goal**: Infinite canvas with pan/zoom and drag-drop

- `js/board/canvas.js` — Infinite canvas (pan, zoom, grid)
- `js/board/item-manager.js` — Item CRUD on board
- `js/board/drag-drop.js` — Drag & drop system
- `js/board/selection.js` — Multi-select
- `js/ui/minimap.js` — Mini-map navigation
- `css/board.css` — Board canvas styles
- `css/components/minimap.css` — Minimap styles
- `js/utils/helpers.js` — Utility functions

**TEST CHECKPOINT 1**: User can sign up, login, create boards, pan/zoom canvas

### Phase 4: Notes (~6 files)
**Goal**: Sticky notes and rich text notes

- `js/components/sticky-note.js` — Sticky note component
- `js/components/rich-note.js` — Markdown rich note
- `js/ui/context-menu.js` — Right-click context menus
- `css/components/sticky-note.css` — Sticky note styles
- `css/components/rich-note.css` — Rich note styles
- `js/utils/dom.js` — DOM helper utilities

### Phase 5: Sketch (~3 files)
**Goal**: Drawing tool

- `js/components/sketch.js` — Canvas drawing tool
- `css/components/sketch.css` — Sketch tool styles
- `js/board/history.js` — Undo/redo system

### Phase 6: File Management (~5 files)
**Goal**: File uploads and file manager

- `js/components/file-manager.js` — File browser UI
- `js/components/screenshot.js` — Screenshot capture/upload
- `js/utils/storage.js` — IndexedDB local cache
- `js/utils/image-utils.js` — Image compression
- `css/components/file-manager.css` — File manager styles

### Phase 7: Media (~6 files)
**Goal**: Link cards, audio, video

- `js/components/link-card.js` — URL preview with OG fetch
- `js/components/audio-record.js` — Audio recording
- `js/components/video-upload.js` — Video upload
- `js/components/media-player.js` — Media playback
- `css/components/link-card.css` — Link card styles
- `css/components/media-player.css` — Media player styles

### Phase 8: Organization (~5 files)
**Goal**: Roadmaps, connections, file attachments

- `js/components/roadmap.js` — Timeline/roadmap component
- `js/board/connections.js` — Lines between items
- `css/components/roadmap.css` — Roadmap styles
- `js/board/connections.js` — Connection lines
- Template JSON files for all 35+ templates

**TEST CHECKPOINT 2**: All board content types work. Files upload, links preview, audio/video play.

### Phase 9: AI (~3 files)
**Goal**: AI assistant integration

- `js/ai/ai-assistant.js` — Puter.js AI (chat, image gen, OCR, TTS)
- `css/components/ai-assistant.css` — AI assistant UI styles
- AI feature UI panels

### Phase 10: Collaboration (~5 files)
**Goal**: Chat and sharing

- `js/sharing/share-manager.js` — Board sharing
- `js/sharing/permissions.js` — Access control
- `js/components/chat.js` — Real-time chat (Supabase Realtime)
- `css/components/chat.css` — Chat styles

### Phase 11: i18n (~17 files)
**Goal**: 15 language translations

- `js/i18n/i18n.js` — Translation engine
- 15 locale JSON files (en, ar, fr, es, pt, de, ru, tr, hi, zh-CN, ja, ko, it, nl, id)
- `css/rtl.css` — RTL layout overrides

### Phase 12: PWA + Themes (~5 files)
**Goal**: Progressive Web App and theme system

- `sw.js` — Service worker (caching, offline)
- Update `manifest.json` with full PWA config
- `js/pwa.js` — Service worker registration
- `css/variables.css` — Dark/light theme variables
- PWA icons (192x192, 512x512)

### Phase 13: Polish (~5 files)
**Goal**: Final touches

- `css/responsive.css` — Mobile/tablet/desktop media queries
- `js/ui/search.js` — Board search
- Keyboard shortcuts system
- Board export (PNG/PDF)
- `README.md` — Project documentation

**TEST CHECKPOINT 3**: Full app tested on mobile and desktop, all 27 features working.

---

## External Service Setup

### Supabase (No Credit Card)

1. Go to https://supabase.com and sign up
2. Create a new project
3. Go to Project Settings → API
4. Copy the **Project URL** and **anon/public key**
5. Run the SQL schema from the Database Schema section above
6. Enable Email Auth in Authentication → Providers
7. Enable Google OAuth if desired (requires Google Cloud Console setup)

### Puter.js (No Setup)

1. Add to HTML: `<script src="https://js.puter.com/v2/"></script>`
2. That's it. No API key, no configuration, no account needed.
3. Users authenticate through Puter's built-in auth when they use storage/AI.

### ImgBB (No Credit Card)

1. Go to https://api.imgbb.com/
2. Sign up for free account
3. Get your API key from the API section
4. Free tier: 32MB per image, permanent hosting

### Cloudflare Pages (No Credit Card)

1. Install wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Deploy: `wrangler pages deploy . --project-name boardflow`
4. Get free `.pages.dev` URL instantly

---

## Environment Configuration

```javascript
// js/config.js
const CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',

  // Puter.js (no config needed, just include the script)
  PUTER_ENABLED: true,

  // ImgBB
  IMGBB_API_KEY: 'your-imgbb-api-key',

  // App
  APP_NAME: 'BoardFlow',
  DEFAULT_LANGUAGE: 'en',
  AUTO_SAVE_INTERVAL: 30000 // 30 seconds
};
```

---

## Canvas Behavior

- **Pan**: Click and drag on empty canvas area, or two-finger drag on mobile
- **Zoom**: Scroll wheel (desktop), pinch gesture (mobile)
- **Grid**: Toggleable dot grid, snaps items when enabled
- **Mini-map**: Bottom-right corner, shows board overview
- **Select**: Click item to select, Shift+click for multi-select
- **Move**: Drag selected items
- **Resize**: Corner handles on selected items
- **Rotate**: Rotation handle above selected items
- **Delete**: Delete/Backspace key, or context menu
- **Context menu**: Right-click on canvas or items

---

## File Upload Flow

```
User uploads file
    ↓
File type detected
    ↓
├── Image (< 5MB) → ImgBB API (permanent)
├── Image (> 5MB) → Puter.js cloud storage
├── Video → Puter.js cloud storage
├── Audio → Puter.js cloud storage
├── Other file → Puter.js cloud storage
    ↓
File URL + provider stored in Supabase items table
    ↓
Board item created with file reference
```

---

## AI Features (Puter.js)

All AI features use Puter.js "User Pays" model. Users cover their own AI costs through their Puter accounts.

```javascript
// Chat with AI
const response = await puter.ai.chat("Summarize these notes", {
  model: 'openai/gpt-5.4-nano'
});

// Generate image
const image = await puter.ai.txt2img("A futuristic city at sunset");

// Extract text from image (OCR)
const text = await puter.ai.img2txt(imageUrl);

// Text to speech
const audio = await puter.ai.txt2speech("Hello world", {
  voice: "Joanna",
  engine: "neural"
});

// Speech to text
const result = await puter.ai.speech2txt(audioBlob);
```

---

## Responsive Breakpoints

```css
/* Mobile: 320px - 767px */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */

@media (max-width: 767px) {
  /* Mobile: bottom toolbar, swipe gestures, full-screen modals */
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet: side toolbar, touch + mouse */
}

@media (min-width: 1024px) {
  /* Desktop: full toolbar, keyboard shortcuts, side panels */
}
```

---

## Notes

- This is a frontend-only application. No backend server needed.
- All data persistence goes through Supabase (relational data) and Puter.js (files).
- The canvas uses DOM elements (not HTML Canvas) for easier styling and accessibility.
- Items are absolutely positioned divs inside a transform-container for pan/zoom.
- IndexedDB is used for offline caching of recently accessed boards.
- Service worker caches static assets for PWA offline support.

---

## Commands

```bash
# Install dev dependencies
npm install

# Run local dev server
npx serve .

# Deploy to Cloudflare Pages
npx wrangler pages deploy . --project-name boardflow

# Or with direct upload
npx wrangler pages deploy dist/ --project-name boardflow
```
