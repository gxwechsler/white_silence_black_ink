# gxwechsler-blogs — Architecture Document v5

*February 10, 2026*

---

## 1. Overview

Two independent static blogs authored by Guillermo Wechsler, each with its own repository, build pipeline, custom domain, and GitHub Pages deployment.

| Property | works_on_work | white_silence_black_ink |
|---|---|---|
| Repository | `gxwechsler/works_on_work` | `gxwechsler/white_silence_black_ink` |
| Domain | `gxwechsler.com` | `whitesilenceblackinc.com` |
| Subject | Work, institutions, coordination, economics | Literature, phenomenology, cosmos, polis |
| About text (EN) | TBD | "exploring the polis, from the cosmos, in a lifespan." |
| About text (ES) | TBD | "explorando la polis, desde el cosmos, en el lapso de una vida." |

The blogs are **completely independent** — no shared landing page, no cross-linking, no shared infrastructure.

---

## 2. Repository Structure (per blog)

```
<repo>/
├── build.js                    # Static site generator (zero deps)
├── CNAME                       # Custom domain for GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: build → deploy to gh-pages
├── .gitignore                  # dist/ excluded from source control
├── templates/
│   ├── index.html              # SPA (tag cloud, posts, about, archive)
│   └── ...                     # Additional pages (wsbi: entry, ripple, clean)
├── content/
│   ├── site.json               # Site-level config (contact_email, etc.)
│   ├── about.json              # About text (EN/ES)
│   ├── posts/                  # One .json file per post
│   ├── unlinked-comments.json  # Orphaned comments
│   └── origin.json             # (wsbi only) Founding text
├── assets/                     # Static assets (images, fonts, etc.)
├── dist/                       # Build output (gitignored)
└── docs/
    ├── architecture.md
    └── coding_standards.md
```

---

## 3. Build System

### 3.1 build.js

Zero-dependency Node.js script. Each repo has its own `build.js` adapted from the shared original.

**Content injection pipeline:**

| Placeholder | Source file | Injected as |
|---|---|---|
| `/*__POSTS_JSON__*/` | `content/posts/*.json` | JSON array (sorted by date desc) |
| `/*__UNLINKED_JSON__*/` | `content/unlinked-comments.json` | JSON array |
| `/*__ABOUT_JSON__*/` | `content/about.json` | JSON object `{en, es}` |
| `/*__CONTACT_EMAIL__*/` | `content/site.json` → `contact_email` | String |
| `<!-- __ORIGIN_HTML__ -->` | `content/origin.json` (wsbi only) | HTML string |

### 3.2 site.json

Site-level configuration stored as content, not hardcoded in templates.

```json
{
  "contact_email": "mo_@me.com"
}
```

Extensible — future fields (site name, social links, etc.) go here.

### 3.3 Build output

| Blog | Input | Output |
|---|---|---|
| works_on_work | `templates/index.html` | `dist/index.html` |
| wsbi | `templates/entry.html` | `dist/index.html` |
| wsbi | `templates/ripple.html` | `dist/ripple.html` (origin injected) |
| wsbi | `templates/clean.html` | `dist/clean.html` (origin injected) |
| wsbi | `templates/blog.html` | `dist/blog.html` (data + email injected) |

### 3.4 dist/ policy

- `dist/` is gitignored
- CI/CD builds from source on every push
- Local `dist/` is for development preview only

---

## 4. SPA Architecture

Both blogs use the same single-page application pattern:

### 4.1 Views

| View | Description |
|---|---|
| Cloud | Tag cloud — weighted by slot position |
| Tag List | Posts filtered by selected tag |
| Post | Full post with body, tags, downloads, comments, contact email |
| About | About text + contact email |
| Archive | Posts with `archived: true` |
| Unlinked | Comments not attached to active posts |

### 4.2 Bilingual support

- Language toggle (EN/ES) in nav
- All UI labels in `labels` object
- Post content: `title`, `body`, `dedication` keyed by `{en, es}`
- About text: keyed by `{en, es}`
- Current language stored in `currentLang` state variable

### 4.3 Slot system

Five slots per post (`slots[0]` through `slots[4]`), each containing zero or more tags. Slot position determines tag weight in the cloud:

| Slot | Weight |
|---|---|
| 0 | 5 (highest) |
| 1 | 4 |
| 2 | 3 |
| 3 | 2 |
| 4 | 1 (lowest) |

---

## 5. Post Schema

```json
{
  "id": "unique-slug",
  "date": "2026-02-07",
  "title": { "en": "Title", "es": "Título" },
  "body": { "en": "<p>HTML content</p>", "es": "<p>Contenido HTML</p>" },
  "dedication": { "en": "For X", "es": "Para X" },
  "slots": [["tag1"], ["tag2", "tag3"], [], [], []],
  "downloads": { "en": "url", "es": "url" },
  "license": "CC BY-NC 4.0",
  "comments": [
    { "author": "Name", "date": "2026-02-07", "text": "Comment text" }
  ],
  "archived": false
}
```

---

## 6. Comments & Contact

### 6.1 Contact model

No real-time comment submission form. Each post displays a contact email line:

```
questions or comments → mo_@me.com
```

The email also appears on the about page. Bilingual labels:
- EN: "questions or comments →"
- ES: "preguntas o comentarios →"

Email is sourced from `content/site.json` and injected by `build.js`.

### 6.2 Comment workflow

1. Reader emails the author
2. Author curates the exchange
3. Author adds comment to post's `comments` array in JSON
4. Rebuild and deploy

Moderation by architecture — no automated submission, no spam, no moderation queue.

### 6.3 Comment display

Comments render in the post view below the tags/downloads sections. Each shows `author · date` and comment body. If no comments: "no comments yet" / "sin comentarios aún".

### 6.4 Unlinked comments

Comments from posts that have been archived or deleted. Displayed in a dedicated view accessible from the tag cloud.

---

## 7. wsbi-specific: Entry Page

### 7.1 Composition

The entry page (`entry.html` → `dist/index.html`) presents:

- **Header**: `white_silence_black_ink` (left) + `about` link (right) — on white background, outside the panel
- **Floating panel**: A rectangular surface (max-width 480px) with `rgba(0,0,0,0.025)` background and soft box-shadow, centered on the page
- **Spheres**: Two black spheres (90px and 65px) at the bottom of the panel, linking to `ripple.html`
- **Footer**: `gxwechsler` — on white background, below the panel

### 7.2 Navigation flow

```
entry (index.html)
  → ripple.html (animated origin text, bilingual)
    → clean.html (static origin text, bilingual)
      ↔ ripple.html (toggle between animated/static)
    → blog.html (SPA)
  → blog.html#about (via header link)
```

### 7.3 Origin text

Externalized to `content/origin.json`. Build.js reads it and injects HTML into `ripple.html` and `clean.html` via `<!-- __ORIGIN_HTML__ -->` placeholder.

```json
{
  "title": "...",
  "date": null,
  "attribution": "...",
  "location": "...",
  "body": {
    "en": "<p>English HTML</p>",
    "es": "<p>Spanish HTML</p>"
  }
}
```

Metadata fields (`title`, `date`, `attribution`, `location`) stored for content system completeness; not currently rendered. Display is side-by-side two-column (EN | ES).

---

## 8. Deployment

### 8.1 GitHub Pages

Each repo deploys independently via GitHub Actions:

1. Push to `main` triggers workflow
2. `node build.js` generates `dist/`
3. Contents of `dist/` deployed to `gh-pages` branch
4. GitHub Pages serves from `gh-pages`

### 8.2 Custom domains

| Domain | Repo | DNS Provider |
|---|---|---|
| `gxwechsler.com` | `gxwechsler/works_on_work` | GoDaddy |
| `whitesilenceblackinc.com` | `gxwechsler/white_silence_black_ink` | GoDaddy |

**DNS configuration (per domain):**

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | gxwechsler.github.io |

**CNAME file** in each repo root contains the bare domain (e.g., `gxwechsler.com`).

**HTTPS** enforced via GitHub Pages settings after DNS propagation.

### 8.3 Authentication

SSH key-based authentication to GitHub:
- Key: `~/.ssh/id_ed25519` (ed25519, no passphrase)
- Persistent via `~/.ssh/config` with macOS Keychain integration
- Push command: `git push origin main`

---

## 9. Design System

### 9.1 Typography

| Role | Font | Weight |
|---|---|---|
| Display / UI | Space Mono | 400 |
| Body | Libre Franklin | 300, 400, 500 |

### 9.2 Color tokens

```css
--black: #0a0a0a;
--dark: #3a3a3a;
--mid: #6b6b6b;
--light: #999;
--faint: #bbb;
--ghost: #e5e5e5;
--white: #fafafa;
--indigo: #1a1a4e;
```

### 9.3 Aesthetic principles

Swiss International Typographic Style: mathematical precision, generous white space, austere beauty. No decorative elements. Hierarchy through weight, size, and color value only.

---

## 10. Migration from Monorepo

The original `gxwechsler-blogs` monorepo is to be archived after successful migration to two independent repos. Migration checklist:

- [ ] Create `gxwechsler/works_on_work` repo
- [ ] Create `gxwechsler/white_silence_black_ink` repo
- [ ] Split build.js per repo
- [ ] Move content and templates
- [ ] Set up GitHub Actions per repo
- [ ] Configure DNS at GoDaddy
- [ ] Add CNAME files
- [ ] Enable HTTPS in GitHub Pages
- [ ] Verify both sites live on custom domains
- [ ] Archive `gxwechsler-blogs`

---

*End of Architecture Document v5.*
