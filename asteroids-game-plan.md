# Bobchestrate Asteroids Game — Plan

## Top-Level Overview

Build a browser-playable "Bobchestrate Coins" Asteroids clone that workshop participants earn access to by completing all advanced quizzes. The game runs as a single self-contained HTML/CSS/JS file deployed to **IBM Cloud Code Engine** (`eu-de` region) as a containerised static web server (nginx). The game URL is surfaced on the Advanced Workshop Quiz Progress page (`docs-advanced/quiz-progress/index.md`) only when every entry in `AVAILABLE_QUIZZES` for the advanced workshop carries a `passed: true` result in `localStorage` key `wxo_quiz_results_advanced`. The unlock threshold rises automatically as new quizzes are added to `AVAILABLE_QUIZZES` — no logic changes required.

**Why Code Engine instead of GitHub Pages?**
- The game file can be kept private (not committed to the public repo) — the URL is the "secret" reward
- Trivial to redeploy / update without a full site build pipeline
- URL stays stable between workshop runs; instructors control access by sharing/not sharing the URL
- Code Engine scales to zero, so it costs nothing when not in use

**Scope:**
- A single `game/` directory in the repo containing the game HTML, a `Dockerfile`, and a deployment script
- The game HTML embeds all JS and CSS inline — zero external CDN dependencies, works offline
- The Quiz Progress page (`docs-advanced/quiz-progress/index.md`) gains an "unlock" panel rendered by `docs-advanced/javascripts/quiz.js` — visible only when every `AVAILABLE_QUIZZES` entry in the advanced registry is passed
- **Keyboard-only controls** — no touch/mobile support needed; this is a workshop laptop game

---

## Sub-Tasks

---

### Sub-Task 1 — Asteroids game core (HTML/JS/CSS, single file)

**Intent:** Build the playable game as a fully self-contained `game/index.html`. All rendering uses the HTML5 Canvas API; no frameworks, no CDN links. Gameplay replicates classic Asteroids with maximum Bobchestrate branding: the ship renders as the IBM Bob spark/lightning bolt shape, coins bear the Bobchestrate "B" monogram, the start screen prominently features the workshop logo treatment, and the full deep-purple + gold colour language of the advanced workshop is used throughout.

**Expected Outcomes:**
- `game/index.html` exists and is playable when opened directly in a browser (file://) or served from any static server
- Ship controls: Arrow keys / WASD to rotate and thrust, Spacebar to fire; **keyboard only** — no touch/mobile controls
- Gameplay loop:
  - Player starts with 3 lives; score = 0; wave = 1
  - Asteroids: 3 sizes (large → medium → small); shooting a large splits it into 2 medium, medium into 2 small, small destroys it
  - **Bobchestrate Coins** float as collectible gold coin objects (not destroyed by bullets); ship must fly over them to collect; +50 score per coin; 3 coins per wave, each drawn as a glowing gold disc with a "₿" or "★" symbol inside
  - Score: large asteroid 20 pts, medium 50 pts, small 100 pts
  - Wave clear: all asteroids destroyed → next wave with one more asteroid; coins replenish
  - Lives lost when ship collides with an asteroid; brief invincibility + respawn flash after each death; game over at 0 lives
  - High score persisted in `localStorage` key `bobchestrate_asteroids_hi`
- **Branding & Visuals:**
  - Background: deep space black (`#0a0010`) with a faint deep-purple star-field (randomly placed dots, static)
  - Ship: drawn as the IBM Bob spark/lightning-bolt silhouette — a jagged angular shape in bright white with a deep-purple engine glow trail when thrusting
  - Coins: gold glowing discs (`#ffd700`) with a "★" centre, gentle rotation animation, radial gold glow halo
  - Asteroids: jagged polygons in grey-purple (`#7b6fa0`) tones; shatter into smaller fragments on destruction
  - Particle explosions: deep-purple (`#b388ff`) and gold (`#ffd700`) sparks
  - HUD font: monospaced, deep-purple accent text on dark background
  - **Start screen:** "BOBCHESTRATE COINS" title in large deep-purple gradient text; subtitle "Collect the coins. Destroy the asteroids."; "Advanced Workshop Edition" tag; hi-score display; "Press SPACE to play"
  - **Wave banner:** centred overlay reading "WAVE {N}" in deep-purple, fades in/out over 1.5s
  - **Game-over screen:** "GAME OVER" in red-purple; final score, hi-score, "Press SPACE to restart"
  - Lives displayed in HUD as miniature Bob spark icons (same shape as ship, scaled down)
- Fully responsive canvas that fills the viewport on any screen size

**Todo List:**
1. Create `game/` directory
2. Write `game/index.html` with:
   - Canvas element sized to `window.innerWidth × window.innerHeight`, resizes on `window.resize`
   - Game state machine: `MENU` → `PLAYING` → `WAVE_CLEAR` → `PLAYING` → `GAME_OVER` → `MENU`
   - `Ship` class: position, velocity, angle, thrust flag, invincibility timer after respawn, wrap-around screen edges; `draw()` renders the Bob spark shape (angular lightning bolt outline, ~5 path points)
   - `Asteroid` class: size tier (large/medium/small), random jagged polygon shape (8–12 vertices with irregular radius), grey-purple colour, velocity, rotation, wrap-around
   - `Coin` class: position, slow drift velocity, rotation angle (animated), `draw()` renders gold disc with star centre and glow; collection radius check against ship
   - `Bullet` class: velocity, lifetime timer (wrap-around); drawn as a small deep-purple bolt
   - `Particle` class: position, velocity, lifetime, colour (alternates gold/deep-purple); used for explosion and coin-collect effects
   - `StarField`: array of ~150 static faint dots pre-computed at init; redrawn each frame as a background layer
   - Collision detection: circle-based for bullet–asteroid and ship–asteroid; coin collection uses a generous pickup radius (1.5× coin visual radius)
   - Wave management: track asteroid count; when zero → `WAVE_CLEAR` state, show wave banner, pause 1.5s, spawn next wave with `wave + 3` asteroids starting at `wave = 1` with 4
   - HUD layout: Score top-left, "WAVE {N}" top-centre, lives as miniature spark icons top-right
   - High score load/save via `localStorage`
   - Keyboard event listeners (`keydown`/`keyup`) for smooth held-key movement; `requestAnimationFrame` game loop with delta-time capping
3. Keep all JS inline inside a single `<script>` tag; all CSS inline in `<style>`; no external assets
4. Embed the workshop logo text "BOBCHESTRATE" using canvas `fillText` with a deep-purple-to-violet gradient on the start screen — no image file required

**Relevant Context:**
- No existing game code — greenfield
- Advanced workshop palette: primary deep-purple `#651fff`, light purple `#b388ff`, gold `#ffd700`, space black `#0a0010`
- Workshop logo image: `docs-advanced/BWS_Advanced.png` — use as visual reference for the colour language and "Bobchestrate" wordmark treatment, but recreate in canvas text (no image embed required)
- `game/index.html` is the only deliverable for this sub-task

**Status:** [x] done

---

### Sub-Task 2 — Dockerfile and Code Engine deployment (`eu-de`)

**Intent:** Package the game as a minimal nginx container and provide a one-command deployment script so instructors can push it to IBM Cloud Code Engine (`eu-de` region) in minutes. The container serves only the single HTML file.

**Expected Outcomes:**
- `game/Dockerfile` builds a minimal nginx image serving `index.html` on port 8080
- `game/deploy.sh` script accepts the Code Engine project name and app name as variables; it builds, pushes to IBM Container Registry, and deploys/updates the Code Engine application in one run
- `game/README.md` documents the three-step deployment process (prerequisites, environment variables, run deploy.sh)
- The app scales to zero when idle (default Code Engine behaviour — no extra config needed)

**Todo List:**
1. Write `game/Dockerfile`:
   - `FROM nginx:alpine`
   - Copy `index.html` to `/usr/share/nginx/html/`
   - Expose port 8080; override nginx default port via a minimal `nginx.conf` snippet
2. Write `game/nginx.conf`:
   - Single server block listening on 8080; root `/usr/share/nginx/html`; `index index.html`; gzip on
3. Write `game/deploy.sh`:
   - Variables at top: `ICR_REGION` (default `de.icr.io`), `ICR_NAMESPACE`, `IMAGE_NAME`, `CE_PROJECT`, `CE_APP_NAME`, `CE_REGION` (default `eu-de`)
   - Steps: `ibmcloud login --region eu-de`, `ibmcloud cr region-set eu-de`, `ibmcloud cr login`, `docker build`, `docker push`, `ibmcloud ce project select`, `ibmcloud ce application create` (or `update` if already exists), `--wait`
   - Prints the public URL at the end
4. Write `game/README.md` with:
   - Prerequisites (IBM Cloud CLI, Code Engine plugin, Container Registry namespace)
   - Required environment variables
   - Run instructions: `chmod +x deploy.sh && ./deploy.sh`
   - "Sharing the URL" section explaining the access model (URL is the key — only share after all quizzes passed)

**Relevant Context:**
- Code Engine apps are public by default (no auth at the infra level) — secrecy is through URL obscurity
- Target region: `eu-de`; IBM Container Registry endpoint: `de.icr.io`
- nginx:alpine is under 10 MB; the whole image will be ~12 MB
- `ibmcloud ce application create` and `ibmcloud ce application update` — the script should detect which to run using `ibmcloud ce application get` exit code

**Status:** [x] done

---

### Sub-Task 3 — Quiz unlock panel on Advanced Quiz Progress page

**Intent:** Add game-unlock logic to `docs-advanced/javascripts/quiz.js` and surface a locked/unlocked panel in the `docs-advanced/quiz-progress/index.md` dashboard. The panel is always visible (to motivate participants) but shows a locked state with a teaser until all `AVAILABLE_QUIZZES` entries are passed, at which point it reveals the game URL.

**Expected Outcomes:**
- `docs-advanced/javascripts/quiz.js` gains a `checkGameUnlock()` helper that returns `true` when every quiz ID in `AVAILABLE_QUIZZES` has `passed: true` in `localStorage`
- `renderDashboard()` appends a game unlock panel below the quiz grid:
  - **Locked state** (not all passed): 🔒 panel with deep-purple border, teaser copy: "Complete all advanced quizzes to unlock the Bobchestrate Coins arcade game!", no URL shown
  - **Unlocked state** (all passed): 🎮 panel with gold border and a prominent "Play Bobchestrate Coins →" button/link pointing to the Code Engine URL stored in a `GAME_URL` constant at the top of the file
- `GAME_URL` constant is a single easy-to-update string (instructors change this one line before each workshop run)
- `docs-advanced/quiz-progress/index.md` requires no changes — the panel is injected by JS into the existing `<div id="quiz-dashboard">`
- `docs-advanced/stylesheets/quiz.css` gains the styles for `.game-unlock-panel` (locked and unlocked variants)

**Todo List:**
1. Add `GAME_URL` constant near the top of `docs-advanced/javascripts/quiz.js` (placeholder value: `'https://your-app.example.appdomain.cloud'`)
2. Add `checkGameUnlock()` function: iterates `AVAILABLE_QUIZZES`, checks `results[id] && results[id].passed === true` for each; returns `true` only if all pass
3. Extend `renderDashboard()` to append the unlock panel HTML after `</div>` of the quiz-dashboard-grid:
   - Locked: `<div class="game-unlock-panel locked">🔒 <strong>Bobchestrate Coins</strong> — Complete all advanced quizzes to unlock!</div>`
   - Unlocked: `<div class="game-unlock-panel unlocked">🎮 <strong>You unlocked Bobchestrate Coins!</strong> <a href="GAME_URL" ...>Play now →</a></div>`
4. Add CSS to `docs-advanced/stylesheets/quiz.css`:
   - `.game-unlock-panel`: padding, border-radius, margin-top, text styling
   - `.game-unlock-panel.locked`: `border: 2px solid var(--quiz-accent)`, muted background, lock emoji styling
   - `.game-unlock-panel.unlocked`: `border: 2px solid gold`, warm gold background tint, animated pulse on the Play button
5. Verify the unlock logic correctly handles the "future quizzes" case: if `AVAILABLE_QUIZZES` has only 1 entry today, passing that 1 quiz unlocks the game — as more quizzes are added to `AVAILABLE_QUIZZES`, the threshold rises automatically

**Relevant Context:**
- `docs-advanced/javascripts/quiz.js` lines 44–50: `QUIZ_REGISTRY` and `AVAILABLE_QUIZZES` — unlock checks against `AVAILABLE_QUIZZES` only (not registry entries marked "coming soon")
- `docs-advanced/stylesheets/quiz.css`: append new rules; do not modify existing ones
- `docs-advanced/quiz-progress/index.md` line 5: `<div id="quiz-dashboard"></div>` — the existing render target; no file change needed
- The `GAME_URL` placeholder makes it safe to commit to the public repo before the deployment URL is known

**Status:** [x] done

---

## Architecture Diagram

```
Browser (participant)
  ├── Advanced Workshop site (GitHub Pages)
  │     └── quiz-progress/index.md
  │           └── quiz.js: renderDashboard()
  │                 ├── Quiz cards (localStorage: wxo_quiz_results_advanced)
  │                 └── Game Unlock Panel
  │                       ├── LOCKED  → teaser message
  │                       └── UNLOCKED → link to ──────────────────────┐
  │                                                                     ▼
  └── IBM Cloud Code Engine App (nginx)                      game/index.html
        └── game/index.html (self-contained Asteroids)       (Canvas game)
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Single HTML file for the game | Zero build pipeline; trivial to update; works as `file://` for local testing |
| Code Engine (`eu-de`) + nginx | Private URL = access control by obscurity; scales to zero; one `deploy.sh` command; matches preferred IBM Cloud region |
| Keyboard-only controls | Workshop setting is always on a laptop — no touch needed; keeps code simpler |
| `AVAILABLE_QUIZZES` drives the unlock threshold | Passing that array alone gates the unlock — add a new quiz ID to the array and the bar rises automatically, zero logic changes |
| Maximum Bobchestrate branding in canvas | Deep-purple palette, Bob spark ship, gold coins, workshop wordmark — participants immediately recognise it as part of the workshop experience |
| `GAME_URL` constant in quiz.js | Single edit point for instructors; safe to commit with a placeholder value |
| All branding via canvas drawing, no image assets | Game HTML stays a single self-contained file with no external dependencies |

---

## Implementation Notes

- **All game artefacts live under a single `game/` folder** at the root of the repository. Create this folder first. The complete structure is:
  ```
  game/
  ├── index.html      ← the self-contained game (Sub-Task 1)
  ├── Dockerfile      ← nginx container definition (Sub-Task 2)
  ├── nginx.conf      ← nginx config overriding port to 8080 (Sub-Task 2)
  ├── deploy.sh       ← one-command Code Engine deployment script (Sub-Task 2)
  └── README.md       ← deployment instructions for instructors (Sub-Task 2)
  ```
- **Local testing — two methods, both documented in `game/README.md`:**
  1. **Open directly in browser** — because `game/index.html` is fully self-contained (no external fetches), simply double-clicking the file or dragging it into a browser tab works with no server required. This is the fastest iteration loop during development.
  2. **Run the container locally** — mirrors the exact Code Engine runtime before pushing: `docker build -t bobchestrate-coins ./game && docker run -p 8080:8080 bobchestrate-coins`, then open `http://localhost:8080`. Use this to verify the nginx config and port are correct before deploying.
- Sub-Tasks 1 and 2 can be built in parallel (game code and deployment infra are independent)
- Sub-Task 3 should be done after Sub-Task 1 so the actual Code Engine URL can be placed in `GAME_URL` — but can be drafted with a placeholder URL first
- The game does **not** need to read the quiz results — the unlock check lives entirely in the workshop site JS
- No changes are required to `mkdocs-advanced.yml` or any part pages — this is purely additive
