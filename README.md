# BoardFlow

Personal board and whiteboard app — infinite canvas, AI, real-time collaboration, PWA, 15 languages, 35+ templates, 27 features.

Built with vanilla HTML/CSS/JS (ES6+). No build step. No credit card. No server.

## Features

- **Canvas** — infinite pan/zoom, dot grid, minimap, touch gestures
- **Items** — sticky notes, rich notes, sketches, link cards, roadmaps, files, images, audio, video
- **AI** (Puter.js) — chat, image generation, OCR, text-to-speech, speech-to-text
- **Collaboration** — real-time board chat, share by email or link, viewer/editor roles
- **PWA** — installable, offline support, mobile-friendly
- **i18n** — 15 languages (Arabic, Chinese, English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Dutch, Portuguese, Russian, Spanish, Turkish) with RTL support
- **Templates** — 35+ boards across 7 categories
- **Search** — find items by title/content with Ctrl+F
- **Export** — board as PNG or PDF
- **Themes** — light and dark

## Quick Start

```bash
# Serve the project (no install required)
npx serve .

# Open http://localhost:3000
```

The app runs in **demo mode** by default — boards are saved to localStorage. No signup, no API keys.

## Production Setup (Optional)

To use cloud sync, AI, and file uploads:

1. **Supabase** (auth + database)
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL from `AGENTS.md` (Database Schema)
   - Copy your URL and anon key

2. **Puter.js** (AI + file storage) — works out of the box, no setup

3. **ImgBB** (image hosting)
   - Sign up at [api.imgbb.com](https://api.imgbb.com)
   - Get your API key

Copy `config.example.js` to `js/config.js` and fill in your keys.

## Deploy to Cloudflare Pages

```bash
# Install wrangler (one-time)
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy . --project-name boardflow
```

The first deploy creates the project. Subsequent deploys update it. URL will be `https://boardflow.pages.dev`.

## Project Structure

```
boardflow/
├── index.html
├── manifest.json
├── sw.js                          # Service worker
├── _headers                       # Cloudflare headers (CSP, X-Frame-Options, etc.)
├── _redirects                     # SPA fallback
├── config.example.js              # Template for user's config
├── css/                           # 21 CSS files (variables, components, themes, responsive)
├── js/                            # 42 JS files
│   ├── app.js                     # Main entry
│   ├── pwa.js                     # Service worker registration + install prompt
│   ├── auth/                      # Login, signup, auth state
│   ├── board/                     # Canvas, items, drag-drop, history, connections
│   ├── components/                # Sticky notes, sketches, file manager, etc.
│   ├── ai/                        # Puter.js AI integration
│   ├── sharing/                   # Share manager, permissions
│   ├── templates/                 # 35+ templates
│   ├── i18n/                      # Translation engine + 15 locale files
│   ├── ui/                        # Modal, toast, sidebar, search, context menu
│   └── utils/                     # Helpers, storage, image utils, dom
└── assets/icons/                  # favicon, PWA icons
```

See `AGENTS.md` for the full design plan and `DESIGN.md` for the visual design system.

## License

MIT
