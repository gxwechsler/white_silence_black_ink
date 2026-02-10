#!/usr/bin/env node

/**
 * build.js — white_silence_black_ink static site generator
 * Purpose: Build multi-page site with origin injection and blog SPA from JSON content
 * Created: 2026-02-09
 *
 * Zero external dependencies. Node.js built-ins only.
 * Reads content from content/, injects into templates/, outputs to dist/.
 *
 * Build output:
 *   templates/entry.html  → dist/index.html
 *   templates/ripple.html → dist/ripple.html  (origin injected)
 *   templates/clean.html  → dist/clean.html   (origin injected)
 *   templates/blog.html   → dist/blog.html    (data + email injected)
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, 'dist');

// ─── Utilities ───────────────────────────────────────────────

function cleanDir(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  fs.mkdirSync(p, { recursive: true });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

function readJSON(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return fallback; }
}

// ─── Content ─────────────────────────────────────────────────

function readPosts() {
  const dir = path.join(ROOT, 'content', 'posts');
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      posts.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
    } catch (e) {
      console.warn(`  ⚠  ${f}: ${e.message}`);
    }
  }
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return posts;
}

function injectData(html) {
  const posts = readPosts();
  const unlinked = readJSON(path.join(ROOT, 'content', 'unlinked-comments.json'), []);
  const about = readJSON(path.join(ROOT, 'content', 'about.json'), { en: '', es: '' });
  const site = readJSON(path.join(ROOT, 'content', 'site.json'), {});

  console.log(`  Found ${posts.length} post(s)`);

  return html
    .replace('/*__POSTS_JSON__*/', JSON.stringify(posts, null, 2))
    .replace('/*__UNLINKED_JSON__*/', JSON.stringify(unlinked, null, 2))
    .replace('/*__ABOUT_JSON__*/', JSON.stringify(about, null, 2))
    .replace('/*__CONTACT_EMAIL__*/', site.contact_email || '');
}

function buildOriginHTML() {
  const origin = readJSON(path.join(ROOT, 'content', 'origin.json'), null);
  if (!origin) return null;
  return `            <div class="column english">
                <div class="lang-label">English</div>
                ${origin.body.en}
            </div>

            <div class="column spanish">
                <div class="lang-label">Español</div>
                ${origin.body.es}
            </div>`;
}

function injectOrigin(html, originHTML) {
  if (!originHTML) return html;
  return html.replace('<!-- __ORIGIN_HTML__ -->', originHTML);
}

// ─── Build ───────────────────────────────────────────────────

function build() {
  const start = Date.now();
  console.log('white_silence_black_ink — build started');
  cleanDir(DIST_DIR);

  // Origin text from content/origin.json
  const originHTML = buildOriginHTML();
  if (originHTML) {
    console.log('  ✓ origin.json loaded');
  } else {
    console.warn('  ⚠  origin.json not found — origin pages will have empty content');
  }

  // Entry page: templates/entry.html → dist/index.html
  const entryPath = path.join(ROOT, 'templates', 'entry.html');
  if (fs.existsSync(entryPath)) {
    fs.copyFileSync(entryPath, path.join(DIST_DIR, 'index.html'));
    console.log('  ✓ index.html (entry)');
  } else {
    console.error('  ✗ templates/entry.html not found — aborting');
    process.exit(1);
  }

  // Origin pages: ripple.html and clean.html with origin injection
  for (const page of ['ripple.html', 'clean.html']) {
    const srcPath = path.join(ROOT, 'templates', page);
    if (fs.existsSync(srcPath)) {
      let html = fs.readFileSync(srcPath, 'utf-8');
      html = injectOrigin(html, originHTML);
      fs.writeFileSync(path.join(DIST_DIR, page), html);
      console.log(`  ✓ ${page} (origin injected)`);
    } else {
      console.warn(`  ⚠  templates/${page} not found`);
    }
  }

  // Blog SPA: templates/blog.html → dist/blog.html
  const blogTpl = path.join(ROOT, 'templates', 'blog.html');
  if (fs.existsSync(blogTpl)) {
    let html = fs.readFileSync(blogTpl, 'utf-8');
    html = injectData(html);
    fs.writeFileSync(path.join(DIST_DIR, 'blog.html'), html);
    console.log('  ✓ blog.html (SPA)');
  } else {
    console.warn('  ⚠  templates/blog.html not found');
  }

  // Assets
  const assetsDir = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyDirSync(assetsDir, path.join(DIST_DIR, 'assets'));
    console.log('  ✓ assets/');
  }

  // CNAME for GitHub Pages custom domain
  const cname = path.join(ROOT, 'CNAME');
  if (fs.existsSync(cname)) {
    fs.copyFileSync(cname, path.join(DIST_DIR, 'CNAME'));
    console.log('  ✓ CNAME');
  }

  console.log(`\n━━━ Build complete in ${((Date.now() - start) / 1000).toFixed(2)}s ━━━\n`);
}

build();
