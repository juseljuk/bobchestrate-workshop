# Workshop Quiz System — Plan

## Top-Level Overview

Add a professional, interactive quiz system to the Bobchestrate Workshop GitHub Pages site (MkDocs + Material theme). Each workshop module gets a 5-question quiz embedded in a dedicated `quiz.md` page. Quiz results are persisted in `localStorage` (browser application data) so scores survive page navigation and refresh. A central **Quiz Dashboard** on the home page (`docs/index.md`) shows the completion status of every quiz, with an option to clear all history.

**Scope for this plan:** Deliver Part 1 (Setup) quiz as a working example, plus the full infrastructure (CSS, JS, dashboard) that all future quizzes will reuse.

**Approach:**
- Self-contained HTML/CSS/JS blocks embedded in Markdown via the `md_in_html` extension (already enabled in `mkdocs.yml`)
- A shared `docs/stylesheets/quiz.css` file for quiz styles, registered in `mkdocs.yml` under `extra_css`
- A shared `docs/javascripts/quiz.js` file for quiz logic and localStorage persistence, registered under `extra_javascript`
- Quiz state stored in `localStorage` under the key `wxo_quiz_results` as a JSON object keyed by quiz ID
- The home page (`docs/index.md`) gets an inline HTML dashboard block that reads `localStorage` and renders a status card per quiz

---

## Sub-Tasks

---

### Sub-Task 1 — Shared CSS file for quiz styling

**Intent:** Create a single stylesheet that styles all quizzes consistently with the Material indigo theme, supports both light and dark mode, and can be reused across all module quizzes without duplication.

**Expected Outcomes:**
- `docs/stylesheets/quiz.css` exists with full quiz widget styles
- Colors use CSS custom properties so both light and dark Material themes are respected
- Styles cover: quiz container, question cards, option buttons (default / selected / correct / incorrect), score banner, progress indicator, "Try Again" button, and the dashboard cards

**Todo List:**
1. Create `docs/stylesheets/` directory
2. Write `docs/stylesheets/quiz.css` with:
   - CSS variables for indigo palette, success green, error red — compatible with Material's `[data-md-color-scheme]` selectors
   - `.quiz-container`, `.quiz-question`, `.quiz-options`, `.quiz-option` button styles
   - State classes: `.correct`, `.incorrect`, `.selected`, `.disabled`
   - `.quiz-score` banner (shown after submit)
   - `.quiz-progress` bar
   - `.quiz-dashboard` grid and `.quiz-card` styles (for the home page)
   - Responsive layout (works on mobile)
3. Register in `mkdocs.yml` under `extra_css: [stylesheets/quiz.css]`

**Relevant Context:**
- `mkdocs.yml` — add `extra_css` key
- Material theme primary color: indigo; accent: indigo
- `[data-md-color-scheme="slate"]` is the dark mode selector in Material theme

**Status:** [ ] pending

---

### Sub-Task 2 — Shared JavaScript for quiz logic and localStorage persistence

**Intent:** Create a single JS module that handles all quiz interactivity (rendering questions, capturing answers, scoring, showing feedback) and persists results to `localStorage` so scores survive navigation and page refresh.

**Expected Outcomes:**
- `docs/javascripts/quiz.js` exists
- `window.WXOQuiz` namespace exposes `init(config)` to boot a quiz from inline config, and `getResults()` / `clearResults()` helpers
- Results stored as `localStorage.setItem('wxo_quiz_results', JSON.stringify({...}))` keyed by quiz `id`
- Each stored result: `{ score, total, passed, completedAt }`
- `clearResults()` removes the key and refreshes any dashboard present on the page
- Dashboard function reads all stored results and renders status cards into a `#quiz-dashboard` element if present on the page
- Registered in `mkdocs.yml` under `extra_javascript`

**Todo List:**
1. Create `docs/javascripts/` directory
2. Write `docs/javascripts/quiz.js` with:
   - `WXOQuiz.init(config)` — renders a quiz into `config.containerId` from `config.questions[]`; each question has `text`, `options[]`, `correctIndex`
   - Answer selection, highlighting correct/incorrect on submit
   - Score calculation; pass threshold = 4/5 (80%)
   - Save result to `localStorage` on completion
   - "Try Again" resets state (but keeps the best score in storage)
   - `WXOQuiz.renderDashboard(elementId)` — reads localStorage, renders a card per known quiz
   - `WXOQuiz.clearResults()` — clears localStorage key, re-renders dashboard
3. Register in `mkdocs.yml` under `extra_javascript: [javascripts/quiz.js]`

**Relevant Context:**
- `mkdocs.yml` — add `extra_javascript` key
- `localStorage` is available in all modern browsers, no backend needed
- MkDocs Material loads extra JS at the end of `<body>`, so DOM is ready

**Status:** [ ] pending

---

### Sub-Task 3 — Part 1 quiz page

**Intent:** Create the first working quiz as a concrete example for Part 1 (Setup & Environment). 5 questions covering the key concepts from `docs/part1-setup/README.md`.

**Expected Outcomes:**
- `docs/part1-setup/quiz.md` exists with a 5-question quiz
- Quiz ID is `part1-setup`
- Correct answers are clearly grounded in the Part 1 README content
- A "Take the Quiz →" admonition link appears at the bottom of `docs/part1-setup/README.md`
- The quiz page is registered in `mkdocs.yml` nav under Part 1

**Quiz Questions (5):**
1. Which Python versions are supported for this workshop? → 3.11, 3.12, or 3.13 ✓
2. What tool is used to create and manage the Python virtual environment? → `uv` ✓
3. Which IBM product do you use as the AI coding assistant throughout this workshop? → IBM Bob IDE ✓
4. What should you avoid in your workshop folder path? → Spaces ✓
5. What must you do in IBM Bob IDE before using its AI capabilities? → Log in with your IBM ID ✓

**Todo List:**
1. Write `docs/part1-setup/quiz.md`:
   - Page header and brief intro text
   - `<div id="quiz-part1">` container
   - Inline `<script>` that calls `WXOQuiz.init({ id: 'part1-setup', containerId: 'quiz-part1', questions: [...] })`
2. Add a "Take the Quiz →" admonition/tip block at the bottom of `docs/part1-setup/README.md` linking to `quiz.md`
3. Add to `mkdocs.yml` nav under `Part 1 - Setup`: `- Quiz: part1-setup/quiz.md`

**Relevant Context:**
- `docs/part1-setup/README.md` — questions must match content there
- `mkdocs.yml` lines 70-71 — extend the Part 1 nav entry

**Status:** [ ] pending

---

### Sub-Task 4 — Quiz Dashboard on home page

**Intent:** Add a "Quiz Progress" section to `docs/index.md` that shows a status card for every module quiz — score, pass/fail badge, and date completed — all read from `localStorage`. Include a "Clear All Quiz History" button.

**Expected Outcomes:**
- `docs/index.md` has a new `## Quiz Progress` section near the top (after the intro, before Workshop Structure)
- A `<div id="quiz-dashboard">` block is present; the shared JS renders cards into it on page load
- Each card shows: module name, score (e.g. 4/5), pass/fail badge, date completed, or "Not attempted" if no data
- "Clear All Quiz History" button calls `WXOQuiz.clearResults()` and re-renders the dashboard
- The dashboard gracefully shows a placeholder message when no quizzes have been taken yet

**Todo List:**
1. Add `## Quiz Progress` section to `docs/index.md` with a short intro sentence
2. Insert the `<div id="quiz-dashboard"></div>` and "Clear History" button HTML block
3. Add an inline `<script>` that calls `WXOQuiz.renderDashboard('quiz-dashboard')` on `DOMContentLoaded`
4. Define the full quiz registry (all module names + IDs) inside `quiz.js` so the dashboard shows all parts, even unvisited ones

**Relevant Context:**
- `docs/index.md` — insert between line ~19 (after duration section) and line ~78 (Workshop Structure)
- Dashboard must list all 9+ parts (Part 1 through Part 9, including 2b, 3b, 6b) as cards
- Parts without a quiz yet show "Coming soon" badge instead of score

**Status:** [ ] pending

---

## Implementation Notes

- All quiz pages follow the same pattern: `quiz.md` in the module's `docs/` subdirectory
- Quiz IDs use the folder name convention: `part1-setup`, `part2-first-agent`, `part2b-bob-custom-rules`, etc.
- The CSS and JS files are loaded globally by MkDocs on every page — no per-page configuration needed beyond the inline `<script>` call
- "Pass" threshold is 4 out of 5 (80%) — shown as a green badge; below that is an amber "Try again" badge
- The "Try Again" flow re-randomises option order to discourage memorisation
- `localStorage` data is per-browser and per-origin — this is intentional (personal progress tracking, no server needed)
