# gxwechsler blogs — Architecture Document

*April 5, 2026 — v6*

---

## 1. System Overview

gxwechsler blogs consists of two independent blogs, each deployed as a standalone GitHub Pages site from its own repository. Each repo contains its own zero-dependency Node.js build script, content files, templates, and CI/CD pipeline. The two blogs share a common content schema and tag cloud SPA architecture but are otherwise fully decoupled — a commit to one cannot break the other.

**Two sites, two repos:**

- **works_on_work** — Work, institutions, coordination, economics, AI. IBM Plex Mono. Tag cloud SPA.
  - Repo: `gxwechsler/works_on_work`
  - Live URL: `https://gxwechsler.com`

- **white silence black ink (wsbi)** — Literature, phenomenology, cosmos, polis. Libre Franklin + Space Mono. Sphere entry → ripple text → tag cloud SPA.
  - Repo: `gxwechsler/white_silence_black_ink`
  - Live URL: `https://whitesilenceblackinc.com`

**Architecture rationale:** Standalone repos over monorepo. Each blog deploys independently, can be maintained or handed off without exposing the other's infrastructure, and failures are isolated. The cost is duplication of the tag cloud SPA logic across both templates — a minor tax for a solo operator with two blogs that update at different rhythms.

---

## 2. Repository Structures

### 2.1 works_on_work

```
works_on_work/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: build → deploy to GitHub Pages
├── build.js                         # Zero-dependency build script
├── CNAME                            # gxwechsler.com
├── content/
│   ├── posts/
│   │   └── post-001.json            # One JSON file per post
│   ├── about.json                   # About text (bilingual HTML)
│   ├── site.json                    # Site configuration
│   └── unlinked-comments.json       # Unlinked comments array
├── assets/
│   └── downloads/                   # PDFs and other downloadable files
├── templates/
│   └── index.html                   # SPA template — tag cloud + all views
├── docs/                            # Architecture and standards documents
├── dist/                            # Build output (generated, committed)
│   └── index.html                   # SPA with injected post data
├── .gitignore
└── README.md
```

### 2.2 white_silence_black_ink

```
white_silence_black_ink/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: build → deploy to GitHub Pages
├── build.js                         # Zero-dependency build script
├── CNAME                            # whitesilenceblackinc.com
├── content/
│   ├── posts/                       # One JSON file per post
│   ├── about.json                   # About text (bilingual HTML)
│   ├── origin.json                  # Origin text for ripple/clean pages
│   ├── site.json                    # Site configuration
│   └── unlinked-comments.json       # Unlinked comments array
├── assets/                          # Static files (PDFs, images)
├── templates/
│   ├── index.html                   # Landing page (redirects or links)
│   ├── entry.html                   # Sphere entry page — wsbi landing
│   ├── ripple.html                  # SVG ripple text
│   ├── clean.html                   # Clean text, no ripple
│   └── blog.html                    # SPA template — tag cloud + all views
├── docs/                            # Architecture and standards documents
├── dist/                            # Build output (generated, committed)
│   ├── index.html                   # Sphere entry (from entry.html)
│   ├── ripple.html
│   ├── clean.html
│   └── blog.html                    # SPA with injected post data
├── .gitignore
└── README.md
```

wsbi has one published post ("the cave / antigone and the singing axle", 2026-02-28) in `content/posts/`, following the standard content pipeline.

---

## 3. Build System

### 3.1 build.js (per repo)

Each repo has its own `build.js`. Zero external dependencies. Requires only Node.js `fs` and `path`.

**works_on_work build steps:**

1. Clean `dist/` directory
2. Read `templates/index.html`
3. Read all `*.json` files from `content/posts/`, sort by date descending
4. Read `about.json` and `unlinked-comments.json`
5. Replace placeholders in template with stringified JSON
6. Write to `dist/index.html`
7. Copy `assets/` to `dist/assets/`

**wsbi build steps:**

1. Clean `dist/` directory
2. Copy static pages: `entry.html` → `dist/index.html`, `ripple.html`, `clean.html`
3. Read `templates/blog.html`
4. Inject post/about/unlinked data (same placeholder scheme)
5. Write to `dist/blog.html`
6. Copy `assets/` to `dist/assets/`

**Data injection placeholders** (inside `<script>` tags in SPA templates):

| Placeholder | Replaced with |
|---|---|
| `/*__POSTS_JSON__*/` | Stringified array of post objects |
| `/*__UNLINKED_JSON__*/` | Stringified array of unlinked comment objects |
| `/*__ABOUT_JSON__*/` | Stringified `{ en, es }` about object |

### 3.2 CI/CD — deploy.yml (per repo)

Each repo has its own GitHub Actions workflow. Identical structure.

Trigger: push to `main` or manual `workflow_dispatch`.

Steps: checkout → Node 20 → `node build.js` → upload `dist/` as Pages artifact → deploy via `actions/deploy-pages@v4`.

Permissions: `contents: read`, `pages: write`, `id-token: write`.

---

## 4. works_on_work

### 4.1 Visual Identity

| Property | Value |
|---|---|
| Font | IBM Plex Mono (300, 400, 500; italic 300, 400) |
| Palette | `--black: #1a1a1a`, `--dark: #444`, `--mid: #888`, `--light: #bbb`, `--faint: #ccc`, `--ghost: #e8e8e8`, `--white: #ffffff` |
| Responsive breakpoint | 640px |
| Scrollbar | 3px, ghost color |

### 4.2 Architecture — Single-Page Application

One `index.html` file. All content embedded as JSON. Six views toggled by JavaScript. No page reloads.

**Header:** `works_on_work` (clickable → cloud) | `archive` · `about` · `ES/EN`

**Views:**

| View | ID | Description |
|---|---|---|
| Cloud | `viewCloud` | Tag cloud as landing page. Tags sized and colored by cumulative weight. Hover dims all except hovered. Click → Tag List. |
| Tag List | `viewTagList` | Posts filtered by selected tag, sorted by slot relevance. Each entry: date, title, tags with slot indicator dots. |
| Post | `viewPost` | Full post: date, title, body (HTML), dedication (optional, italic), tags section, downloads (optional), license, comments, navigation. |
| About | `viewAbout` | Title + body text (HTML). |
| Archive | `viewArchive` | "Posts no longer in the cloud." Lists archived posts by date/title. |
| Unlinked Comments | `viewUnlinked` | Unlinked comments with reference links to originating posts. Also appears as a tag in the cloud if any exist. |

**Navigation flow:**

```
Cloud → click tag → Tag List → click post → Post
                                              ↓
Cloud ← "← home" ←←←←←←←←←←←←←←←←←←←←←←←←←←
                                              ↓
Tag List ← "← back to [tag]" ←←←←←←←←←←←←←←←

Header links: archive, about (always accessible)
Hash routing: #about, #archive, #unlinked (for external links)
```

### 4.3 Tag System — 5-Slot Weighted Cloud

Each post has 5 tag slots. Slot position determines weight:

| Slot | Weight | Indicator Color |
|---|---|---|
| Slot 1 | 5 points | `#1a1a1a` (black) |
| Slot 2 | 4 points | `#444` (dark) |
| Slot 3 | 3 points | `#888` (mid) |
| Slot 4 | 2 points | `#bbb` (light) |
| Slot 5 | 1 point | `#ccc` (faint) |

**Cloud rendering:** Cumulative scores across all non-archived posts. Tags shuffled randomly on each render. Font size: 11px (minimum weight) → 36px (maximum weight). Color: `#ccc` → `#1a1a1a`. Font weight: 300 / 400 / 500 based on ratio thresholds (0.35, 0.7).

**Slot indicators:** Small colored dots (4px circles) shown next to tag names in post listings.

### 4.4 Content Model — Post JSON

```json
{
  "id": "post-001",
  "date": "2026-02-05",
  "title": { "en": "English title", "es": "Título en español" },
  "body": { "en": "<p>HTML paragraphs</p>", "es": null },
  "dedication": { "en": "Optional, italic. Can contain <a> links.", "es": "..." },
  "slots": [
    ["tag1", "tag2"],
    ["tag3"],
    [],
    ["tag4"],
    []
  ],
  "downloads": { "en": "assets/downloads/file-en.pdf", "es": null },
  "license": "CC BY 4.0",
  "archived": false,
  "comments": [
    { "author": "Name", "date": "2026-02-05", "text": "Comment text" }
  ]
}
```

**Rules:**
- `id` must be unique across all posts.
- `body` values are HTML strings (paragraphs as `<p>` tags).
- `dedication` can contain `<a>` tags (rendered as HTML).
- `slots` is always a 5-element array of string arrays. Empty slots are `[]`.
- `archived: true` removes the post from the tag cloud; it appears only in Archive view.
- `downloads` are optional PDF links; `null` or omitted to skip.
- `comments` is an array; empty `[]` shows "no comments yet".

### 4.5 Other Content Files

**about.json:**
```json
{
  "en": "<p>HTML about text</p><p>author / location</p>",
  "es": "<p>Texto en español</p><p>autor / ubicación</p>"
}
```

**unlinked-comments.json:**
```json
[
  {
    "date": "2026-02-05",
    "author": "Name",
    "postId": "post-001",
    "text": "Unlinked comment text"
  }
]
```

If this array is non-empty, "unlinked_comments" appears as a tag in the cloud.

### 4.6 Bilingual System

Full EN/ES toggle. All UI labels translated:

| English | Spanish |
|---|---|
| archive | archivo |
| about | acerca |
| ← all tags | ← todas las etiquetas |
| ← home | ← inicio |
| tags | etiquetas |
| download | descargar |
| comments | comentarios |
| no comments yet | sin comentarios aún |
| Toggle shows: ES | Toggle shows: EN |

Language state persists across view switches within the session.

---

## 5. white silence black ink (wsbi)

### 5.1 Visual Identity

| Property | Value |
|---|---|
| Body font | Libre Franklin 300/400 |
| Display font | Space Mono 400 |
| Palette | `#0a0a0a` (black), `#fafafa` (background), `#6b6b6b` (gray), `#e5e5e5` (light gray), `#1a1a4e` (indigo accent) |
| Responsive breakpoint | 600px (entry, ripple, clean), 640px (blog SPA) |

### 5.2 Architecture — Multi-Page Flow → SPA

wsbi has a four-stage entry sequence, then a tag cloud blog SPA.

```
[Sphere Entry]  →  [Ripple Text]  ↔  [Clean Text]  →  [Tag Cloud Blog]
 index.html         ripple.html        clean.html       blog.html
```

### 5.3 Page 1: Sphere Entry (index.html)

- Minimal page. `#fafafa` background.
- Header: "white silence black ink" (left), "about" link → `blog.html#about` (right).
- Two black CSS spheres (90px and 65px) with radial gradients, specular highlights (`::before`), and drop shadows (`::after`).
- Spheres positioned at bottom-center inside a `.surface` div with a subtle gradient creating a barely-visible ground plane.
- Both spheres link to `ripple.html`.
- Hover: sphere lifts 3px, gradient lightens.
- Footer: "gxwechsler" centered.

### 5.4 Page 2: Ripple Text (ripple.html)

- Bilingual literary text — the "blanco / white" origin text.
- Two columns: English (left-aligned), Spanish (right-aligned). Language labels in Space Mono.
- Header: "white silence black ink" in Space Mono.
- SVG `feTurbulence` + `feDisplacementMap` filter applied via `.ripple-text` class.
- Animation: `requestAnimationFrame` loop modulating `baseFrequency` (sine/cosine) and `seed` to create water-like distortion. Scale: 6. Speed: 0.008 per frame.
- Footer: "stop ripple" → `clean.html` | "enter →" → `blog.html`

### 5.5 Page 3: Clean Text (clean.html)

- Same bilingual text without the SVG filter.
- Footer: "view with ripple" → `ripple.html` | "enter →" → `blog.html`

### 5.6 Page 4: Tag Cloud Blog (blog.html)

Same SPA architecture as works_on_work, reskinned with wsbi identity:

- Libre Franklin for body text (font-weight: 300), Space Mono for labels/meta.
- `#fafafa` background instead of `#ffffff`.
- Indigo accent (`#1a1a4e`) on hover for post titles and tag links.
- Post body at 15px (vs 13px in works_on_work) for readability.
- Same 6 views: Cloud, Tag List, Post, About, Archive, Unlinked Comments.
- Same 5-slot tag system, bilingual toggle, hash routing.

**Content model is identical to works_on_work** — separate `content/posts/*.json`, `about.json`, `unlinked-comments.json` files.

### 5.7 Origin Text

The bilingual text displayed on ripple and clean pages is the founding text of the blog. Content sourced from `content/origin.json`. This text begins "…páramo, a moan, one lone point in the vastness of the white…" (EN) / "…páramo, jime un punto solo en la vastedad del blanco…" (ES).

---

## 6. Shared Conventions

The two repos are independent but share the following by convention, not by code:

| Convention | Detail |
|---|---|
| Content schema | Post JSON structure is identical (see §4.4) |
| Tag system | 5-slot weighted cloud, same logic |
| Bilingual | EN/ES toggle, same label translations |
| Build pattern | Zero-dependency `build.js`, placeholder injection |
| CI/CD | GitHub Actions, Node 20, `actions/deploy-pages@v4` |
| Docs | Architecture and coding standards in `docs/` |

**Cross-linking:** Posts in either blog can link to posts in the other via HTML `<a>` tags in the body or dedication fields, using full URLs.

**Divergence is expected.** The blogs serve different domains (work vs. literature). Features, templates, or content structures may diverge over time. The shared conventions are a starting point, not a constraint.

---

## 7. Deployment

| Dimension | works_on_work | wsbi |
|---|---|---|
| Repo | `gxwechsler/works_on_work` | `gxwechsler/white_silence_black_ink` |
| Local path | `~/Organic_Apps/works_on_work/` | `~/Organic_Apps/white_silence_black_ink/` |
| Git auth | SSH | HTTPS |
| CNAME | `gxwechsler.com` | `whitesilenceblackinc.com` |
| Trigger | Push to `main` | Push to `main` |
| Runtime | GitHub Actions, ubuntu-latest, Node 20 | GitHub Actions, ubuntu-latest, Node 20 |
| Build | `node build.js` | `node build.js` |
| Output | `dist/` | `dist/` |
| Deploy | `actions/deploy-pages@v4` | `actions/deploy-pages@v4` |

---

## 8. Relationships Between Sites

| Dimension | works_on_work | wsbi |
|---|---|---|
| Domain | Work, institutions, AI, economics | Literature, phenomenology, cosmos, polis |
| Font | IBM Plex Mono | Libre Franklin + Space Mono |
| Entry | Direct to tag cloud | Sphere → ripple → clean → tag cloud |
| Background | `#ffffff` | `#fafafa` |
| Accent | None (grayscale only) | Indigo `#1a1a4e` |
| Post body size | 13px | 15px |
| Content language | EN primary, ES secondary | Bilingual equal weight |

---

## 9. Deprecated and Cleaned Up

**Monorepo (`gxwechsler/gxwechsler-blogs`):** An earlier architectural design that hosted both blogs in a single repository under `sites/works_on_work/` and `sites/wsbi/` with a shared build script and landing page. This design was superseded by the two standalone repos before the first content was published from it. The monorepo may be archived or deleted at the operator's discretion.

**Stale local copy (`~/white_silence_black_ink/`):** A second local clone of the wsbi repo existed outside `~/Organic_Apps/`. Replaced by moving the working copy to the canonical path on April 5, 2026. No duplicate local clones should exist outside `~/Organic_Apps/`.

---

*End of architecture document.*
