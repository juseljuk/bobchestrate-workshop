# Plan: Part 2 Workspace Zip + Setup Section

## Top-Level Overview

Participants will not clone the GitHub repo. They need a zip they can download, extract, and open in Bob IDE — giving them the `.bob/` config bundle AND the pre-built `retail-inventory-optimization/` lab content. This plan covers: building the zip, adding a "Workspace Setup" section to both lab README files, and pointing to the zip download from the setup section.

---

## Sub-Task 1 — Build `bobchestrate-confluent.zip`

**Intent:** Create the zip in `advanced/part2-confluent/` by combining the existing `.bob/` config from `advanced/part0-setup/advanced-bob-config/.bob/` with the `retail-inventory-optimization/` directory, excluding the `.venv/`, `__pycache__/`, `*.pyc`, and `.git*` junk.

**Expected Outcomes:**
- `advanced/part2-confluent/bobchestrate-confluent.zip` exists and is valid
- When extracted it produces `bobchestrate-confluent/` containing `.bob/` and `retail-inventory-optimization/`
- `.venv/` is excluded (platform-compiled binaries, not portable)
- `uv.lock` is included (reproducible `uv sync --locked`)

**Zip contents target:**
```
bobchestrate-confluent/
├── .bob/
│   ├── custom_modes.yaml
│   ├── mcp.json
│   ├── rules/
│   │   └── wxo-dev-rule-enhanced.md
│   └── skills/
│       └── wxo-langgraph/   (full skill)
└── retail-inventory-optimization/
    ├── pyproject.toml
    ├── uv.lock
    ├── fashion-inventory-consumer/   (all .py files + .env.example, NO .env)
    ├── fashion-inventory-setup/      (schemas/, sql/, data/)
    └── labs/
        └── part2-watsonx-orchestrate/
            └── inventory-alert-demo-knowledge/  (6 docs)
```

**Excludes:**
- `retail-inventory-optimization/.venv/`
- `**/__pycache__/`
- `**/*.pyc`
- `retail-inventory-optimization/.venv.*`
- Any `.env` files (only `.env.example` goes in)

**Todo List:**
- [ ] Use terminal to build the zip from workspace root with appropriate excludes
- [ ] Verify zip contents with `unzip -l`
- [ ] Confirm extracted folder name is `bobchestrate-confluent/`

**Relevant Context:**
- Source `.bob/` config: `advanced/part0-setup/advanced-bob-config/.bob/`
- Source lab content: `retail-inventory-optimization/` (all subdirs except `.venv/`)

**Status:** [ ] pending

---

## Sub-Task 2 — Add "Workspace Setup" section to `advanced/part2-confluent/README.md`

**Intent:** Add a clearly marked setup block at the very top of the working-directory README (before Section 0) that tells participants: download the zip, extract, open in Bob, run `uv sync --locked`, copy `.env.example`.

**Expected Outcomes:**
- A "Before You Start — Workspace Setup" section appears between the header/overview and Section 0
- Steps match the style of Part 0's Step 3 (download → extract → open in Bob)
- Includes verification checklist before proceeding

**Content outline:**
1. Prerequisites check (Bob IDE installed, ADK connected, Confluent Cloud account ready)
2. Download `bobchestrate-confluent.zip` (link to raw GitHub URL)
3. Extract → `bobchestrate-confluent/` folder
4. Open in Bob IDE → trust the workspace
5. Open terminal → `cd retail-inventory-optimization && uv sync --locked`
6. Copy `.env.example` → `.env` in `fashion-inventory-consumer/`
7. Verification checklist before Section 0

**Relevant Context:**
- Part 0 Step 3 pattern: `advanced/part0-setup/README.md` lines 89–143
- Same `.bob/` bundle as Part 1 — WXO Agent Architect mode and MCP servers work identically

**Status:** [ ] pending

---

## Sub-Task 3 — Add "Workspace Setup" section to `docs-advanced/part2-confluent/README.md`

**Intent:** Same content as Sub-Task 2 but in MkDocs admonition style (matching the `docs-advanced/` file style).

**Expected Outcomes:**
- `docs-advanced/part2-confluent/README.md` has the same setup section
- Uses `!!! note` / `!!! tip` admonitions where appropriate
- GitHub raw download URL points to the correct path

**Status:** [ ] pending

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Zip name: `bobchestrate-confluent.zip` | Distinct from `bobchestrate-advanced.zip`; clearly identifies the lab |
| Location: `advanced/part2-confluent/` | Matches `bobchestrate-advanced.zip` in `advanced/part0-setup/` |
| `.bob/` source: copy from `advanced/part0-setup/advanced-bob-config/.bob/` | Same mode, rule, MCP — no new skill needed for Part 2 |
| `.venv/` excluded | Platform-compiled binaries; participants run `uv sync --locked` to build their own |
| Extracted folder name: `bobchestrate-confluent/` | Clear, distinct, matches zip name |
| Setup section before Section 0 | Participants need workspace ready before any lab content applies |
