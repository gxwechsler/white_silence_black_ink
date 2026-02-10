# Coding Standards — GZPQB Development Framework

**Version:** 3.0
**Created:** 2025-01-27
**Updated:** 2026-02-07

---

## Part I — Universal Standards

These sections govern all projects regardless of language or stack.

---

## 1. Core Principles

### 1.1 Architecture First
High-quality architecture is non-negotiable. Every component must demonstrate:
- **Single Responsibility**: One module, one purpose
- **Encapsulation**: Hide implementation details; expose clean interfaces
- **Systematic Problem-Solving**: No trial-and-error debugging; understand before acting

### 1.2 Validation Before Execution
Never write code or text without prior validation:
- Confirm requirements and constraints before implementation
- Validate data structures before processing
- Test assumptions explicitly before building on them

### 1.3 Configuration Over Hardcoding
Minimize hardwired shortcuts:
- Extract all environment-specific values to config files
- Use JSON for configuration wherever practical
- Parameterize paths, credentials, model names, endpoints

---

## 2. Claude Communication Protocol

This section governs how to work with Claude (or local LLMs) effectively across sessions.

### 2.1 Session Bootstrap File

Projects that benefit from session continuity maintain a `SESSION_CONTEXT.json` that gets fed to Claude at session start. This is recommended for multi-session development projects, not required for simple content operations.

```json
{
    "project": "project_name",
    "updated": "2025-01-27T14:30:00",
    "session_id": "proj_20250127_001",
    "context_window": 1,

    "state": {
        "phase": "development|testing|refactoring|debugging",
        "current_focus": "What we're working on right now",
        "blocked_by": null
    },

    "validated": [
        "Database schema finalized",
        "API endpoints confirmed",
        "Config structure approved"
    ],

    "pending_validation": [
        "Error handling approach for network failures",
        "Choice of date library"
    ],

    "decisions": [
        {"date": "2025-01-26", "decision": "Use httpx over requests", "reason": "async support"},
        {"date": "2025-01-27", "decision": "JSONL for metrics logging", "reason": "append-friendly"}
    ],

    "files_claude_needs": [
        "config/settings.json",
        "src/core/models.py",
        "docs/architecture.md"
    ],

    "constraints": [
        "Must work offline (local LLM only)",
        "RAM budget: 8GB max",
        "No external dependencies beyond requirements.txt"
    ]
}
```

### 2.2 Request Structure

When asking Claude to write code or text, structure requests as:

```
## Context
[Reference SESSION_CONTEXT.json or summarize relevant state]

## Task
[Single, clear objective]

## Constraints
[What's already validated / what must not change]

## Validation Request
Before implementing, confirm:
1. [Assumption that needs checking]
2. [Design choice that needs approval]
```

### 2.3 Session Handoff

At session end, Claude produces a handoff summary:

```json
{
    "session_id": "proj_20250127_001",
    "completed": [
        "Implemented user authentication module",
        "Added config validation"
    ],
    "in_progress": [
        "Dashboard component — 60% complete"
    ],
    "next_session_should": [
        "Complete dashboard rendering",
        "Add error handling for API timeouts"
    ],
    "new_decisions": [
        {"decision": "Use pydantic for validation", "reason": "type safety"}
    ],
    "update_session_context": {
        "validated": ["+ Authentication flow"],
        "pending_validation": ["- Authentication flow", "+ Rate limiting strategy"]
    }
}
```

### 2.4 Validation-First Dialogue

Claude must never proceed to implementation without explicit validation. Pattern:

```
User: Add a caching layer to the API client.

Claude: Before implementing, I need to validate:
1. Cache backend: filesystem, Redis, or in-memory dict?
2. TTL strategy: fixed duration or invalidation-based?
3. Should cache survive app restart?

[Waits for answers before writing code]
```

This applies to all decisions — architectural, schema, implementation. Claude surfaces assumptions as explicit questions and waits. No exceptions.

### 2.5 Context Window Tracking

Every document produced includes:
```
Session: {session_id}
Context Window: {n}
```

This enables traceability when reviewing outputs across long projects. For projects without SESSION_CONTEXT.json, include the date and a brief session identifier.

---

## 3. Project Structure

### 3.1 Organic Folder Hierarchy

All projects conform to the established system structure:

```
~/Organic_Apps/
├── {project_name}/
│   ├── config/                  # If applicable
│   ├── src/                     # If applicable
│   ├── tests/                   # If applicable
│   ├── docs/
│   └── ...                      # Structure adapts to project type

~/Organic_Data/
├── {project_name}/
│   ├── raw/                     # Immutable source data
│   ├── processed/               # Transformed data
│   ├── outputs/                 # Generated files (timestamped)
│   └── metrics/                 # Impact dashboard logs (if applicable)
```

The directory structure adapts to the project. Python apps use `src/`, `config/`, `tests/`. Static sites use `sites/`, `shared/`, `templates/`, `content/`. The invariant is: `~/Organic_Apps/` for code, `~/Organic_Data/` for data, and clear separation of concerns within each.

### 3.2 Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| App folder | lowercase_snake | `yt_transcriber` |
| Output files | `{name}_{YYYYMMDD}_{HHMMSS}.{ext}` | `report_20250127_143022.md` |
| Config files | lowercase | `settings.json` |
| Source modules | lowercase_snake | `mcp_client.py`, `build.js` |
| Classes | PascalCase | `ImpactMetrics` |
| Functions | lowercase_snake (Python) or camelCase (JS) | `fetch_indicators`, `buildWsbi` |
| CSS classes | kebab-case | `tag-cloud`, `ripple-text` |
| JSON content files | kebab-case or `{type}-NNN.json` | `about.json`, `post-001.json` |

---

## 4. Secrets Management

### 4.1 Rules
- **Never commit secrets** — all credentials in `config/secrets.env` or equivalent
- **Always gitignore** — verify `.gitignore` includes `secrets.env`, `*.pem`, `*.key`
- **Load via environment** — use `python-dotenv`, `os.environ`, or `process.env`
- **Tokens in ephemeral locations** — e.g., `/tmp/ghtoken.txt` for PATs

### 4.2 Pattern (Python)
```python
from dotenv import load_dotenv
import os

load_dotenv("config/secrets.env")
api_key = os.environ.get("ANTHROPIC_API_KEY")
```

### 4.3 Pattern (Node.js)
```javascript
// For simple cases, read from file or env
const token = fs.readFileSync('/tmp/ghtoken.txt', 'utf-8').trim();
// Or use process.env
const apiKey = process.env.API_KEY;
```

---

## 5. Git Conventions

### 5.1 Commit Messages
```
{type}: {short description}

{optional body with context}

Session: {session_id}
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `config`

Examples:
- `feat: add impact dashboard component`
- `fix: correct token counting in API adapter`
- `refactor: extract validation into separate module`

### 5.2 Branching
- `main` — stable, deployable
- `dev` — integration branch (if needed)
- `feat/{feature-name}` — feature work
- `fix/{issue-description}` — bug fixes

### 5.3 Standard .gitignore (Base)

Every project starts from this base and extends as needed:

```gitignore
# Secrets
config/secrets.env
*.pem
*.key

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

Project-specific additions (examples):
```gitignore
# Python projects
__pycache__/
*.pyc
.venv/
*.egg-info/

# Static site projects
dist/

# Data-heavy projects
*.jsonl
outputs/
```

---

## 6. Document Governance

### 6.1 Document Hierarchy

Projects may maintain several types of documentation. When they conflict, this hierarchy applies:

| Document | Purpose | Authority |
|---|---|---|
| **Architecture Document (AD)** | Source of truth for system design, data models, component relationships | Highest — defines what the system *is* |
| **Coding Standards** | Govern process, conventions, and communication protocol | Governs how work *happens* |
| **Handover Document** | Snapshot for session continuity — current state, known issues, how-to | Operational — reflects a point in time |
| **README** | Onboarding and quick reference for new collaborators | Derived from AD; kept in sync |

### 6.2 Update Rules

- The AD is updated when architecture changes (new components, changed data models, new build steps). Version-stamped.
- Coding Standards are updated when process or conventions change. Version-stamped.
- Handover documents are produced per session and may become stale. Each new session can produce a new one.
- When a handover contradicts the AD, the AD is authoritative.

### 6.3 Reference Convention

Documents reference each other by name and section:
- "See AD §4.3 (Tag System)" — not "see the architecture doc"
- "Per Coding Standards §2.4" — not "per our coding rules"

This enables Claude and human collaborators to locate the exact source.

---

## 7. Quality Gates

### 7.1 Pre-Commit Checklist
- [ ] No hardcoded paths, credentials, or model names
- [ ] Module/file header states its single responsibility
- [ ] Output files include timestamps in filename
- [ ] Secrets are in `.env` or ephemeral locations, not in code
- [ ] All assumptions validated before implementation
- [ ] Changes are consistent with the AD

### 7.2 Code Review Questions
1. Does this module do exactly one thing?
2. Can configuration change without code change?
3. Are all assumptions validated before use?
4. Would this be clear to a future collaborator (human or AI)?
5. Does this match the current AD? If not, does the AD need updating?

---

## 8. Impact Dashboard

### 8.1 Applicability

The Impact Dashboard is required for projects with external API calls, runtime costs, or resource consumption that should be tracked. It is not required for zero-dependency static sites or pure content projects.

| Project type | Dashboard required |
|---|---|
| API-consuming apps (Anthropic, OpenAI, etc.) | Yes |
| Data processing pipelines | Yes |
| Local LLM integrations | Yes |
| Static sites, content-only projects | No |

### 8.2 Triple-Reading Framework

When applicable, track three perspectives:

| Lens | Metrics | Question |
|------|---------|----------|
| **Economic** | Tokens, API calls, bandwidth, cost | "What does this cost?" |
| **Engineering** | RAM, disk I/O, bandwidth, duration | "What resources consumed?" |
| **User Efficiency** | Tasks done, success rate, interventions | "What value delivered?" |

### 8.3 Implementation

Import from shared utilities (do not reimplement):
```python
from gzpqb_utils.metrics import ImpactMetrics, render_dashboard

metrics = ImpactMetrics(session_id="proj_20250127_001")
metrics.tokens_input += token_count
metrics.tasks_completed += 1

render_dashboard(metrics)
metrics.log_to_file("~/Organic_Data/{project}/metrics/session.jsonl")
```

### 8.4 Checklist (When Applicable)
- [ ] `ImpactMetrics` initialized at startup
- [ ] Token/API counts captured on every external call
- [ ] Tasks logged at completion
- [ ] Dashboard visible or metrics exported to JSONL

---

## Part II — Python Standards

These sections apply to Python projects.

---

## 9. Python Conventions

### 9.1 File Headers
```python
"""
Module: {module_name}
Purpose: {single sentence}
Created: {YYYY-MM-DD}
Session: {session_id} | Context: {n}
"""
```

### 9.2 Import Order
```python
# 1. Standard library
import json
from pathlib import Path

# 2. Third-party
import httpx
from pydantic import BaseModel

# 3. Local modules
from src.core.processor import DataProcessor
```

### 9.3 Type Hints Required
```python
def process_message(content: str, model: str = "llama3.1:8b") -> dict[str, Any]:
    """Process a message through the specified model."""
    ...
```

### 9.4 Error Handling Pattern
```python
def safe_operation(data: dict) -> Result:
    """Validate first, execute second."""
    if not validate_input(data):
        return Result(success=False, error="Invalid input")

    try:
        result = perform_operation(data)
        return Result(success=True, data=result)
    except SpecificError as e:
        logger.error(f"Operation failed: {e}")
        return Result(success=False, error=str(e))
```

### 9.5 JSON Configuration with Pydantic

**Simple configs (<5 parameters):** Validate inline with assertions or basic checks.

**Complex configs (≥5 parameters):** Use JSON Schema or Pydantic:
```python
from pydantic import BaseModel

class ModelConfig(BaseModel):
    model_name: str
    temperature: float = 0.7
    max_tokens: int = 1000
```

**Loading pattern:**
```python
CONFIG_DIR = Path(__file__).parent.parent / "config"

def load_config(name: str) -> dict:
    """Load JSON configuration."""
    with open(CONFIG_DIR / f"{name}.json") as f:
        return json.load(f)
```

### 9.6 Testing Standards

**Structure:**
```
tests/
├── unit/              # Pure function tests, no I/O
├── integration/       # Tests with real dependencies
└── fixtures/          # Shared test data
```

**Naming:** Test files: `test_{module_name}.py`. Test functions: `test_{function_name}_{scenario}`.

**When to test:** All validation functions (critical path), data transformations, integration points (adapters). Skip tests for simple wrappers, UI-only code, configuration loading.

```python
def test_validate_config_accepts_valid_input():
    config = {"model_name": "llama3.1:8b", "temperature": 0.7}
    assert validate_config(config) is True
```

---

## 10. Python: Local LLM Integration (Llama, Qwen via MCP)

### 10.1 Model References
Never hardcode model names — use `config/models.json`:
```json
{
    "default": "llama3.1:8b",
    "models": {
        "fast": "llama3.1:8b",
        "reasoning": "qwen3:14b"
    }
}
```

### 10.2 Prompt Management
Store prompts externally in `config/prompts.json`, not as inline strings.

### 10.3 MCP Adapter Pattern
Use the shared `gzpqb_utils` package for MCP integration rather than reimplementing per project.

---

## 11. Python: Shared Utilities Package

To avoid reimplementing patterns across Python projects, maintain a shared package:

```
~/Organic_Apps/gzpqb_utils/
├── metrics.py          # ImpactMetrics, render_dashboard
├── config.py           # load_config, load_secrets
├── mcp_client.py       # MCPModelAdapter
└── validation.py       # Common validators
```

Install locally:
```bash
pip install -e ~/Organic_Apps/gzpqb_utils
```

---

## Part III — Frontend & Static Site Standards

These sections apply to static sites, SPAs, and HTML/CSS/JS projects.

---

## 12. Frontend Conventions

### 12.1 File Headers (JS)
```javascript
/**
 * {filename} — {project_name}
 * Purpose: {single sentence}
 * Created: {YYYY-MM-DD}
 */
```

### 12.2 Build Scripts (Node.js)

- Zero external dependencies unless justified. Prefer Node.js built-ins (`fs`, `path`).
- All build output goes to a dedicated output directory (e.g., `dist/`).
- Build scripts are deterministic: same inputs always produce same outputs.
- Build scripts report what they do: log each file written, warn on missing sources.
- Clean output directory completely before each build — no incremental surprises.

### 12.3 Content-as-JSON Pattern

Static sites that manage structured content use JSON files as the content layer:

- One JSON file per content unit (e.g., one file per post).
- Shared content (about text, unlinked comments, origin text) as standalone JSON files.
- Build script reads JSON at build time and injects into HTML templates via placeholders.
- Templates are "dumb" — they contain placeholders, not logic for reading content.

**Placeholder conventions:**

| Context | Pattern | Example |
|---|---|---|
| Inside `<script>` (JSON data) | `/*__NAME__*/` | `/*__POSTS_JSON__*/` |
| Inside HTML (rendered content) | `<!-- __NAME__ -->` | `<!-- __ORIGIN_HTML__ -->` |

### 12.4 Template Architecture

- Each site is self-contained: one HTML file includes all CSS and JS (no shared runtime dependencies between sites).
- When two sites share logic but differ in styling, duplicate the code rather than extracting a shared module. This preserves full independence.
- CSS goes in `<style>` in `<head>`. JS goes in `<script>` before `</body>` or inline.
- Google Fonts loaded via CDN `<link>` tags with `preconnect`.

### 12.5 Content Schema Validation

JSON content files should be validated against the AD's content model. At minimum, `build.js` should:
- Warn on missing required fields (e.g., `id`, `date`, `title`).
- Warn on malformed structures (e.g., `slots` not a 5-element array).
- Not silently produce broken output.

### 12.6 Bilingual Content

Bilingual fields use `{ "en": "...", "es": "..." }` structure consistently. `null` for a language means the content is not available in that language. The UI handles `null` gracefully (falls back or hides).

### 12.7 Static Site Deployment

- `dist/` is always gitignored. CI builds from source.
- All internal links use relative paths (no absolute URLs to the deployment domain).
- Assets are copied to `dist/` by the build script, preserving directory structure.

---

## 13. Quick Reference

| Element | Convention |
|---------|------------|
| Project location | `~/Organic_Apps/{project}/` |
| Data location | `~/Organic_Data/{project}/` |
| File timestamp | `_YYYYMMDD_HHMMSS` |
| Config files | JSON |
| Secrets | `secrets.env` or ephemeral file (gitignored) |
| Commits | `{type}: {description}` |
| Claude bootstrap | `docs/SESSION_CONTEXT.json` (when applicable) |
| Validation | Always before execution — no exceptions |
| AD | Source of truth for architecture |
| Coding Standards | Source of truth for process |

---

*Standards are living documentation. Update version and timestamp with each revision.*
