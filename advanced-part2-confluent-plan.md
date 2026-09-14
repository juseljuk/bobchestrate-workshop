# Plan: Advanced Part 2 — Event-Driven AI Agents with Confluent Cloud

## Top-Level Overview

**Goal:** Create an Advanced Part 2 lab for the Bobchestrate advanced workshop that teaches participants how to build an **event-driven AI agent pipeline** — combining Confluent Cloud Kafka + Flink SQL with a watsonx Orchestrate native agent, wired together by a Python consumer application. The lab uses the existing `retail-inventory-optimization/` material as its implementation foundation.

**Scope:** One lab (`part2-confluent-event-driven/`) with multiple sequential sections, matching the structure and voice of Part 1 (LangGraph). Covers: Confluent Cloud setup, Flink SQL velocity detection, Python consumer wiring, Bob-driven agent + knowledge base creation, and end-to-end validation.

**What participants build:** A real-time fashion inventory monitoring pipeline — Kafka events → Flink SQL velocity spike detection → Python consumer → watsonx Orchestrate AI agent → enriched decisions published back to Kafka.

**Approach:** The lab instructs participants to use the `retail-inventory-optimization/` folder already in the workshop repo as the working directory. Bob (in WXO Agent Architect mode) handles the agent, tools, and knowledge base creation via prompts provided in the lab. The lab doc lives in `docs-advanced/part2-confluent/README.md` (and supporting files) and is registered in `mkdocs-advanced.yml`.

**Not in scope:** Building the Python consumer from scratch (it's pre-built), deep Kafka internals, Avro/Protobuf schemas (JSON only), multi-tenant Confluent setup.

---

## Sub-Tasks

### Sub-Task 1 — Draft the lab document structure and section outline

**Intent:** Define the skeleton of the lab — what sections exist, what each teaches, how long it takes, and how it echoes the Part 1 format. No content written yet, just the agreed structure.

**Expected Outcomes:**
- A confirmed section list with titles, duration estimates, and learning objectives
- Agreement on the narrative arc: concept → hands-on → verify → Bob prompt

**Todo List:**
- [ ] Define section 0: What is event-driven AI? (concept — 5 min)
- [ ] Define section 1: Architecture overview (diagram — 5 min)
- [ ] Define section 2: Confluent Cloud setup — environment, cluster, topics, schemas, Flink SQL (15 min)
- [ ] Define section 3: Test the velocity detection pipeline — producer + basic consumer (10 min)
- [ ] Define section 4: Create the AI agent using Bob — tools, knowledge base, agent (20 min)
- [ ] Define section 5: Configure the Python consumer — `.env`, credentials (5 min)
- [ ] Define section 6: Run the end-to-end pipeline and observe (10 min)
- [ ] Define section 7: Understand what happened — schema validation, offset management, agent response anatomy (10 min)
- [ ] Define exercises.md and quiz.md stubs

**Relevant Context:**
- Part 1 pattern: `docs-advanced/part1-langgraph/README.md` — section structure, tone, duration labels, Bob prompt tables, "what you learned" blocks
- Retail lab source: `retail-inventory-optimization/labs/part2-watsonx-orchestrate/README.md` — the 10-step original lab to extract and reshape
- `docs-advanced/index.md` — where the new part will be listed

**Status:** [ ] pending

---

### Sub-Task 2 — Write `docs-advanced/part2-confluent/README.md` (the main lab doc)

**Intent:** Write the full lab document that a workshop participant reads and follows. This is the primary deliverable. It adapts and restructures the source material into the Bobchestrate advanced workshop voice: opinionated, section-based, with explicit Bob prompts, pedagogical callouts, and a clean narrative.

**Expected Outcomes:**
- A complete `docs-advanced/part2-confluent/README.md` matching Part 1 in style and quality
- Sections 0–7 fully written with correct commands, copy-paste Bob prompts, expected outputs, and "what you learned" closings
- A working architecture diagram (ASCII, consistent with the README.md in the retail folder)
- Correct file path references into `retail-inventory-optimization/`

**Todo List:**
- [ ] Write lab header (title, duration ~75 min, difficulty ⭐⭐⭐, prerequisites)
- [ ] Write overview + "what you'll build" table
- [ ] Write "Using Bob for this lab" prompt table (one Bob prompt per hands-on section)
- [ ] Write Section 0: What is event-driven AI? (concept — kafka, flink, agent enrichment pattern)
- [ ] Write Section 1: Architecture overview with ASCII diagram matching existing README
- [ ] Write Section 2: Confluent Cloud setup (summarise lab1 from source, reference screenshots already in `retail-inventory-optimization/labs/part1-confluent-cep/lab1-confluent-setup/images/`)
- [ ] Write Section 3: Test the velocity detection pipeline (producer + `consume_velocity_alerts.py`)
- [ ] Write Section 4: Create the AI agent using Bob — three Bob prompts (store tool, weather tool, knowledge base, agent) with the exact prompt text from source lab
- [ ] Write Section 5: Configure the Python consumer — `.env` walkthrough, credential mapping table
- [ ] Write Section 6: Run end-to-end — start producer, start `consume_velocity_alerts_with_agent.py`, annotated expected log output
- [ ] Write Section 7: Understand what happened — explain `agent_payload_builder.py`, `orchestrate_client.py`, `response_validator.py`, `agent_response_producer.py`, schema validation, manual offset commit pattern
- [ ] Write "Key Concepts" sidebar (velocity spike, baseline, hours-to-stockout, Flink SQL simplified baseline caveat)
- [ ] Write troubleshooting section (auth errors, schema validation failures, Confluent credentials)
- [ ] Write "What you learned" summary and outcome block
- [ ] Write reference links section
- [ ] Add navigation buttons (Quiz →, Exercises, ← Back to Advanced Home)

**Relevant Context:**
- Source Bob prompts: `retail-inventory-optimization/labs/part2-watsonx-orchestrate/README.md` lines 195–644 (exact prompts to reuse verbatim)
- Python consumer modules: `retail-inventory-optimization/fashion-inventory-consumer/` — all 6 `.py` files already read
- Schemas: `retail-inventory-optimization/fashion-inventory-setup/schemas/` — 3 JSON schemas already read
- Flink SQL: `retail-inventory-optimization/fashion-inventory-setup/sql/velocity_anomaly_detection.sql` — already read; note the hardcoded `2.0` baseline (add a callout)
- `.env.example`: `retail-inventory-optimization/fashion-inventory-consumer/.env.example` — already read
- Part 1 style reference: `docs-advanced/part1-langgraph/README.md` — especially the "what you learned" blocks and Bob prompt tables

**Status:** [ ] pending

---

### Sub-Task 3 — Write `docs-advanced/part2-confluent/exercises.md`

**Intent:** Write 4–5 stretch exercises that push participants to go deeper, matching the format and difficulty spread of Part 1 exercises.

**Expected Outcomes:**
- `docs-advanced/part2-confluent/exercises.md` with 4–5 exercises
- Each exercise has a clear goal, hints, and a difficulty indicator

**Todo List:**
- [ ] Exercise 1: Add a new Flink SQL condition — detect `LOW_STOCK` events (not just SALE velocity) and extend the alert schema
- [ ] Exercise 2: Add a `get_store_manager` tool to the agent that returns a mock contact name for escalation notifications
- [ ] Exercise 3: Extend `response_validator.py` to also validate the `reorderRecommendation` block is present when `urgencyLevel` is CRITICAL
- [ ] Exercise 4: Wire the agent as a collaborator to a native wxO orchestrator agent that routes inventory questions vs. general questions
- [ ] Exercise 5 (hard): Replace the simple Kafka value producer with a Schema Registry-validated JSON producer using `confluent_kafka`'s `JSONSerializer`

**Relevant Context:**
- Part 1 exercises format: `docs-advanced/part1-langgraph/exercises.md`
- `response_validator.py`: `retail-inventory-optimization/fashion-inventory-consumer/response_validator.py`
- `velocity_anomaly_detection.sql`: `retail-inventory-optimization/fashion-inventory-setup/sql/velocity_anomaly_detection.sql`

**Status:** [ ] pending

---

### Sub-Task 4 — Write `docs-advanced/part2-confluent/quiz.md`

**Intent:** Write a short knowledge-check quiz (5–8 questions) consistent with Part 1 quiz format — tests conceptual understanding, not memorisation.

**Expected Outcomes:**
- `docs-advanced/part2-confluent/quiz.md` with 5–8 questions covering event-driven AI concepts and practical steps from the lab

**Todo List:**
- [ ] Question on what Flink SQL `hoursToStockout` calculation means
- [ ] Question on why the consumer uses manual offset commit (not auto-commit)
- [ ] Question on the role of JSON schema validation in the pipeline
- [ ] Question on what `triggerType: "WEATHER_EVENT"` tells the downstream system
- [ ] Question on why Bob is used to create the agent rather than the wxO UI
- [ ] Question on the difference between `RUSH_REORDER` vs `STANDARD_REORDER` (from agent decision rules)
- [ ] Optional: question on the `_strip_markdown_fence` function's purpose in `orchestrate_client.py`

**Relevant Context:**
- Part 1 quiz format: `docs-advanced/part1-langgraph/quiz.md` (check the format used for questions and answers)
- `orchestrate_client.py`: `retail-inventory-optimization/fashion-inventory-consumer/orchestrate_client.py`

**Status:** [ ] pending

---

### Sub-Task 5 — Create `docs-advanced/part2-confluent/` folder and stub image directory

**Intent:** Create the directory structure expected by MkDocs and the lab document. The lab references images from the existing source lab (already in `retail-inventory-optimization/labs/`), but the `docs-advanced/part2-confluent/images/` directory needs to exist for any new diagrams added later.

**Expected Outcomes:**
- `docs-advanced/part2-confluent/` directory with `images/` subfolder
- A placeholder `images/.gitkeep` so the directory is tracked in git

**Todo List:**
- [ ] Create `docs-advanced/part2-confluent/images/.gitkeep`

**Relevant Context:**
- Existing images are referenced from `retail-inventory-optimization/labs/part1-confluent-cep/lab1-confluent-setup/images/` — the lab doc will use relative paths pointing there; no copies needed unless MkDocs requires local paths (check when writing)

**Status:** [ ] pending

---

### Sub-Task 6 — Register the new lab in `mkdocs-advanced.yml` and update `docs-advanced/index.md`

**Intent:** Make the new lab visible in the MkDocs navigation and update the advanced workshop home page table to include Part 2.

**Expected Outcomes:**
- `mkdocs-advanced.yml` nav updated with Part 2 entries (README, exercises, quiz)
- `docs-advanced/index.md` table row for Part 2 filled in (no longer "coming soon")

**Todo List:**
- [ ] Add to `mkdocs-advanced.yml` nav under `Part 2 - Event-Driven AI Agents`:
  - `Overview: part2-confluent/README.md`
  - `Exercises: part2-confluent/exercises.md`
  - `Quiz: part2-confluent/quiz.md`
- [ ] Update `docs-advanced/index.md` table row to replace placeholder with real Part 2 entry: title, link, duration (~75 min), difficulty (⭐⭐⭐)

**Relevant Context:**
- `mkdocs-advanced.yml`: lines 61–69 (current nav)
- `docs-advanced/index.md`: lines 28–35 (the topic table)

**Status:** [x] done

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Difficulty: ⭐⭐⭐⭐** | Confluent Cloud + Flink SQL + Python consumer + wxO agent is genuinely harder than Part 1 LangGraph — four moving parts across two cloud platforms |
| Lab lives in `docs-advanced/part2-confluent/` | Matches Part 1 pattern; MkDocs serves from `docs-advanced/` |
| Working directory is `retail-inventory-optimization/` | All code is pre-built; participants configure, not code |
| Bob prompts are copy-paste | Removes friction; ensures reproducibility — same pattern as Part 1 |
| Prerequisites live inside the lab itself | Advanced audience reads the lab first; no changes needed to Part 0 setup |
| Confluent setup is summarised, not re-taught | Lab 1 of the source already covers it in depth; advanced audience needs orientation not tutorial |
| Flink baseline = 2.0 hardcoded — add explicit callout | Prevents confusion; teaches the difference between demo simplification and production design — no other intentional simplifications to flag |
| Images referenced from `retail-inventory-optimization/labs/` | Avoids duplication; screenshots already exist and are correct |
| Quiz and exercises are separate files | Matches Part 1; keeps the main doc focused |
