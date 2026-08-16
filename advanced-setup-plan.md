# Advanced Workshop: Setup Guide + wxo-langgraph Skill Integration Plan

## Overview

The advanced workshop currently has no standalone setup guide — prerequisites are only mentioned
briefly in `advanced/README.md`. Participants arriving without the foundation workshop context
cannot get started independently. Additionally, the `wxo-langgraph` Bob skill exists and is
fully documented in `.bob/skills/wxo-langgraph/` but is never referenced in the advanced lab
docs — participants don't know it exists.

**Goal:**
1. Ship a pre-wired Bob config zip (`advanced-bob-config.zip`) that collapses environment setup
   into a single download-and-unzip step.
2. Add a full standalone setup guide (`advanced/part0-setup/README.md`) that a participant with
   zero foundation workshop context can follow cold.
3. Add a "Using Bob for this lab" section to Part 1's README introducing the `wxo-langgraph` skill.
4. Wire Part 0 into the advanced workshop navigation.

**Scope:**
- New file: `advanced/part0-setup/advanced-bob-config/` — the folder to be zipped (contains `.bob/`)
- New file: `advanced/part0-setup/README.md` — standalone setup guide
- New file: `docs-advanced/part0-setup/README.md` — identical copy (MkDocs source)
- Edit: `advanced/part1-langgraph/README.md` — add "Using Bob for this lab" section
- Edit: `docs-advanced/part1-langgraph/README.md` — identical edit
- Edit: `advanced/README.md` — add Part 0 row to topics table + update footer link
- Edit: `docs-advanced/index.md` — identical edit
- Edit: `mkdocs-advanced.yml` — add Part 0 to nav

**Non-goals:**
- No changes to the `wxo-langgraph` skill files themselves
- No changes to `import-all.sh`
- No changes to the foundation workshop docs
- No changes to the existing `.bob/` at the workspace root (that's for the workshop maintainer)

---

## Sub-Task 1: Create the pre-wired Bob config bundle

**Intent:** Produce a folder (`advanced/part0-setup/advanced-bob-config/`) containing a clean,
portable `.bob/` tree that participants download as a zip and unzip into their workspace folder.
This replaces the manual steps of installing MCP servers, importing the custom mode, adding the
workspace rule, and fetching the skill — all of which the foundation workshop does as separate
manual steps.

**What the bundle contains:**
```
advanced-bob-config/
└── .bob/
    ├── mcp.json                          ← both MCP servers pre-wired; WXO_MCP_WORKING_DIRECTORY set to ""
    ├── custom_modes.yaml                 ← WXO Agent Architect mode
    ├── rules/
    │   └── wxo-dev-rule-enhanced.md      ← the enhanced wxO dev rule
    └── skills/
        └── wxo-langgraph/
            ├── SKILL.md
            ├── constraints.md
            ├── patterns/
            │   ├── external-llm.py
            │   ├── hello-world.py
            │   ├── orchestrator-agent.yaml
            │   └── production-agent.py
            └── ref/
                ├── agent-yaml.md
                ├── cli.md
                └── troubleshooting.md
```

**Key change from the current `.bob/mcp.json`:**
- `WXO_MCP_WORKING_DIRECTORY` set to `""` (empty string)
- After unzip, participants run "watsonx Orchestrate: Install MCP Servers" from the Command Palette
  once — this stamps the correct absolute workspace path into their local `mcp.json`

**Expected Outcomes:**
- `advanced/part0-setup/advanced-bob-config/.bob/mcp.json` exists with `WXO_MCP_WORKING_DIRECTORY: ""`
- `advanced/part0-setup/advanced-bob-config/.bob/custom_modes.yaml` exists (verbatim copy)
- `advanced/part0-setup/advanced-bob-config/.bob/rules/wxo-dev-rule-enhanced.md` exists (verbatim copy)
- All 11 skill files exist under `advanced/part0-setup/advanced-bob-config/.bob/skills/wxo-langgraph/`
- No `.DS_Store` files included

**Todo List:**
1. Create directory `advanced/part0-setup/advanced-bob-config/.bob/`
2. Write `mcp.json` — copy current `.bob/mcp.json` verbatim, set `WXO_MCP_WORKING_DIRECTORY` to `""`
3. Copy `.bob/custom_modes.yaml` → `advanced/part0-setup/advanced-bob-config/.bob/custom_modes.yaml`
4. Copy `.bob/rules/wxo-dev-rule-enhanced.md` → `advanced/part0-setup/advanced-bob-config/.bob/rules/wxo-dev-rule-enhanced.md`
5. Copy all 11 skill files from `.bob/skills/wxo-langgraph/` → `advanced/part0-setup/advanced-bob-config/.bob/skills/wxo-langgraph/`

**Relevant Context:**
- Source `.bob/mcp.json` — read above (hardcoded path to fix)
- Source `.bob/custom_modes.yaml` — read above
- Skill files — `.bob/skills/wxo-langgraph/` (11 files confirmed)

**Status:** [ ] pending

---

## Sub-Task 2: Create `advanced/part0-setup/README.md`

**Intent:** Full standalone setup guide matching the depth and structure of `docs/part1-setup/README.md`.
A participant on a fresh machine with no prior workshop context can follow it cold. The advanced-specific
flow replaces the foundation's 12 steps with a streamlined 10-step flow where the zip download
collapses MCP servers, custom mode, rule, and skill into one step.

**Step outline:**
1. Prerequisites Check (Python 3.11–3.13, uv, Bob IDE, wxO access)
2. Verify Python installation
3. Verify uv installation
4. Create workshop folder (`bobchestrate-advanced/`)
5. Open IBM Bob IDE and login with IBM ID
6. Open the folder in IBM Bob IDE
7. Download and unzip the Bob config bundle → unzip into workspace root
8. Install ADK VS Code extension (needed for the "Install MCP Servers" command in step 9)
9. Run "watsonx Orchestrate: Install MCP Servers" command → stamps correct workspace path
10. Create Python virtual environment
11. Install watsonx Orchestrate SDK (via status bar click)
12. Get wxO API key + URL → activate environment (Option A CLI / Option B Bob)
13. Get Groq API key (console.groq.com) and News API key (newsapi.org) — needed for Part 1
14. Understand the advanced workshop structure
15. Using Bob in the advanced workshop (good prompts, skill awareness, session management)
16. Troubleshooting (orchestrate not found, auth failed, Bob not responding)
17. Quick reference commands
18. Next steps → Part 1

**Advanced-specific differences from the foundation guide:**
- Folder: `bobchestrate-advanced/` (not `bobchestrate-ws/`)
- Step 7 (zip download + unzip) replaces foundation's steps 7 + 8 (MCP install + mode import)
- Step 9 (run "Install MCP Servers") is a single command to fix the working directory path
- Step 13 is new: Groq + News API key instructions
- "Understand the workshop structure" shows `advanced/` layout only
- "Using Bob" section mentions the `wxo-langgraph` skill is pre-loaded and auto-activates
- No knowledge check quiz (the advanced workshop has separate quizzes per part)

**Expected Outcomes:**
- File exists at `advanced/part0-setup/README.md`
- Identical copy at `docs-advanced/part0-setup/README.md`
- A cold participant can follow it without referring to any other guide
- Groq and News API key instructions are clear (where to get them, what env vars to set)
- The zip download step explains clearly: download `advanced-bob-config.zip`, unzip into
  your `bobchestrate-advanced/` folder, open in Bob IDE

**Todo List:**
1. Write `advanced/part0-setup/README.md` following the step outline above
2. Copy verbatim to `docs-advanced/part0-setup/README.md`

**Relevant Context:**
- Foundation guide to mirror in structure: `docs/part1-setup/README.md` (full content in plan context)
- API keys confirmed needed: `GROQ_API_KEY` (console.groq.com), `NEWS_API_KEY` (newsapi.org)
  — sourced from `advanced/part1-langgraph/import-all.sh`
- Bundle download: link to `advanced/part0-setup/advanced-bob-config.zip` in the repo
  (GitHub raw download pattern — same as the foundation's `wxo-agent-architect-export.yaml`)

**Status:** [ ] pending

---

## Sub-Task 3: Add "Using Bob for this lab" section to Part 1 READMEs

**Intent:** Introduce the `wxo-langgraph` skill contextually at the top of Part 1, so participants
know Bob has deep LangGraph-for-wxO knowledge and can use it from the first exercise.

**Content:**
- Short paragraph: the `wxo-langgraph` skill is pre-loaded in the Bob config bundle. It gives Bob
  deep knowledge of the LangGraph-for-wxO entry point contract, platform constraints, credential
  patterns, checkpointers, memory API, and common errors. It activates automatically when the
  topic matches — no command needed.
- Example prompt table (6–8 rows), one per lab section:

| When you're on… | Example prompt |
|---|---|
| Section 2 — Hello World | "Show me the minimal agent.yaml and create_agent structure for wxO" |
| Section 3 — Pure LangGraph | "Help me set up ChatOpenAI with Groq backend using a wxO connection" |
| Section 5 — Tools | "What's the difference between lc_tool and wxO @tool? Show me a tool example" |
| Section 6 — Credentials | "How do I access my news_api connection key inside the agent code?" |
| Section 7 — Checkpointers | "When should I use SQLite vs PostgreSQL checkpointer?" |
| Section 8 — Memory | "Show me how to read and write cross-session memory with the Agentic SDK" |
| Debugging | "My agent import fails with a 50 MB error — how do I fix it?" |

- Note: Bob knows all platform constraints (messages-only persistence, 50 MB limit, etc.) so
  generated code is platform-correct by default.

**Placement:** After the "> Native wxO agents are not just for simple tasks..." callout block
and before `## wxO LangGraph Limitations (Read First)`.

**Expected Outcomes:**
- Both `advanced/part1-langgraph/README.md` and `docs-advanced/part1-langgraph/README.md` have
  the section at the correct position
- Section is ~30 lines, scannable, not repetitive of existing content

**Todo List:**
1. Identify exact insertion line in `advanced/part1-langgraph/README.md`
2. Write and insert the section
3. Apply identical insert to `docs-advanced/part1-langgraph/README.md`

**Relevant Context:**
- Insertion target confirmed: after "> **Native wxO agents are not just for simple tasks.**..."
  callout, before `## wxO LangGraph Limitations (Read First)`
- Skill routing table in `.bob/skills/wxo-langgraph/SKILL.md` — source for example prompt topics

**Status:** [ ] pending

---

## Sub-Task 4: Update navigation and index files

**Intent:** Wire Part 0 into the advanced workshop navigation so participants are routed through
setup before Part 1.

**Changes:**
- `mkdocs-advanced.yml`: add "Part 0 - Setup" nav entry before "Part 1 - LangGraph Agents"
- `advanced/README.md`: add Part 0 row to topics table (Setup & Environment, 15 min, ⭐), update
  footer link from Part 1 to Part 0
- `docs-advanced/index.md`: identical changes

**Expected Outcomes:**
- `mkdocs-advanced.yml` nav has Part 0 before Part 1
- Both index files have Part 0 as the first topic table entry and updated footer link

**Todo List:**
1. Edit `mkdocs-advanced.yml`
2. Edit `advanced/README.md`
3. Edit `docs-advanced/index.md`

**Relevant Context:**
- Current nav in `mkdocs-advanced.yml` (read above): Home → Quiz Progress → Part 1
- Current footer in both index files: `Let's go! → [Advanced Part 1: LangGraph Agents](...)`

**Status:** [ ] pending
