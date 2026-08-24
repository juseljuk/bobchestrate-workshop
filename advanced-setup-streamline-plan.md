# Advanced Setup Streamline Plan

## Design Decisions
- Zip is renamed `bobchestrate-advanced.zip` (filename matches root folder name)
- "What the bundle gives you" table + "These three layers" explanation stay under new Step 3

## Overview

The current Part 0 setup requires participants to:
1. Manually `mkdir bobchestrate-advanced` (Step 3)
2. Download `advanced-bob-config.zip`
3. Unzip — producing `advanced-bob-config/.bob/` inside their workspace
4. Manually move the `.bob` folder one level up with `mv advanced-bob-config/.bob .`
5. Remove the now-empty `advanced-bob-config/` folder

The goal is to eliminate steps 1, 4, and 5 entirely. The zip's root folder is renamed from
`advanced-bob-config/` to `bobchestrate-advanced/`, so extracting it produces the ready-to-open
workspace folder. Participants: **download → extract → open the extracted folder in Bob IDE**.

**Scope:**
- Rebuild `advanced/part0-setup/advanced-bob-config.zip` with root folder `bobchestrate-advanced/`
  (the folder `advanced/part0-setup/advanced-bob-config/` is renamed to `bobchestrate-advanced/`
  for zip packaging purposes — the source files on disk are simply re-zipped under the new root name)
- Update `advanced/part0-setup/README.md` — replace Steps 3–7 with the new streamlined flow
- Update `docs-advanced/part0-setup/README.md` — identical update (mirror of the above)

**Non-goals:**
- No changes to the `.bob/` files inside the bundle (mcp.json, custom_modes.yaml, skill files, rule)
- No changes to `advanced/part1-langgraph/`
- No changes to `mkdocs-advanced.yml`, `advanced/README.md`, `docs-advanced/index.md`
- No changes to the foundation workshop docs

---

## Sub-Task 1: Rebuild the zip with `bobchestrate-advanced/` as root folder and rename it

**Intent:**
The zip file `advanced/part0-setup/advanced-bob-config.zip` currently has `advanced-bob-config/`
as its top-level folder. Rebuild it so:
1. The top-level folder inside the zip is `bobchestrate-advanced/`
2. The zip file itself is renamed to `bobchestrate-advanced.zip`

The source `.bob/` contents are identical — only the root folder name and zip filename change.

The source folder on disk is `advanced/part0-setup/advanced-bob-config/` (which contains `.bob/`).
We need to create the zip so that its internal paths read `bobchestrate-advanced/.bob/...`.

**Expected Outcomes:**
- `advanced/part0-setup/bobchestrate-advanced.zip` exists and unzips to `bobchestrate-advanced/.bob/...`
- `advanced/part0-setup/advanced-bob-config.zip` is removed (replaced by the new zip)
- The existing source folder `advanced/part0-setup/advanced-bob-config/` still exists on disk
  (it's the source of truth for the bundle contents — used to regenerate the zip)
- Running `unzip -l advanced/part0-setup/bobchestrate-advanced.zip` shows `bobchestrate-advanced/`
  as the top-level entry

**Todo List:**
1. In a terminal, from the repo root, run:
   ```bash
   cd advanced/part0-setup
   cp -r advanced-bob-config bobchestrate-advanced
   zip -r bobchestrate-advanced.zip bobchestrate-advanced
   rm -rf bobchestrate-advanced
   rm -f advanced-bob-config.zip
   ```
   This creates the new zip (with new name and new root folder) and removes the old zip.
2. Verify with `unzip -l advanced/part0-setup/bobchestrate-advanced.zip` — confirm root is
   `bobchestrate-advanced/`.

**Relevant Context:**
- Source folder: `advanced/part0-setup/advanced-bob-config/` (do NOT delete this — it's the
  on-disk source of truth for the bundle)
- Old zip to remove: `advanced/part0-setup/advanced-bob-config.zip`
- New zip to create: `advanced/part0-setup/bobchestrate-advanced.zip`

**Status:** [x] done

---

## Sub-Task 2: Update the setup guide README (both copies)

**Intent:**
Rewrite the participant-facing setup steps to match the new zip structure. The old flow had
participants creating a folder manually, unzipping into it, then doing a manual `mv` step.
The new flow is: download zip → extract → open extracted folder in Bob IDE. No manual folder
creation, no move command.

**Specific changes to both READMEs:**

### Replace Step 3 (Create Your Workshop Folder)
**OLD Step 3:** "Create a dedicated folder for the advanced workshop: `mkdir bobchestrate-advanced`"

**NEW Step 3 (renamed to "Download and Extract the Workshop Folder"):**
> The Bob config zip *is* your workspace folder — extracting it creates `bobchestrate-advanced/`
> with the `.bob/` configuration already in place.
>
> 1. Download the zip:
>    - Navigate to: `advanced/part0-setup/advanced-bob-config.zip`
>    - Click **Download raw file**
> 2. Extract it (do NOT extract into an existing folder — extract to your Desktop or Downloads):
>    **Mac/Linux:**
>    ```bash
>    cd ~/Desktop
>    unzip ~/Downloads/advanced-bob-config.zip
>    # This creates: ~/Desktop/bobchestrate-advanced/
>    ```
>    **Windows (PowerShell):**
>    ```powershell
>    cd $env:USERPROFILE\Desktop
>    Expand-Archive -Path "$env:USERPROFILE\Downloads\advanced-bob-config.zip" -DestinationPath .
>    # This creates: Desktop\bobchestrate-advanced\
>    ```
> 3. After extracting, your `bobchestrate-advanced/` folder contains:
>    ```
>    bobchestrate-advanced/
>    └── .bob/
>        ├── mcp.json
>        ├── custom_modes.yaml
>        ├── rules/
>        │   └── wxo-dev-rule-enhanced.md
>        └── skills/
>            └── wxo-langgraph/
>    ```

### Replace Step 4 (Open IBM Bob IDE)
Step 4 content is unchanged, but the preceding Step 3 previously created the folder — now Step 3
creates *and* configures the folder in one shot. Step 4 just says "open Bob IDE and log in."

### Replace Step 5 (Open Your Workshop Folder in Bob IDE)
Update instruction to say open the extracted `bobchestrate-advanced/` folder (not "the empty workspace").
Remove the phrase "The empty workspace will open" — the workspace is no longer empty; it has `.bob/`.

### Delete old Steps 6–7 (Install ADK extension + Download and Unzip Bundle)
These are replaced. The bundle download is now Step 3. The ADK extension step moves to become
the new Step 4 (before opening the folder) — or stays at Step 6 (after opening), depending on
whether it's needed before running "Install MCP Servers". Keep the extension install step at
the same position (Step 6) — only the bundle download content changes.

**Concretely, the net step renumbering is:**
| Old Step | New Step | Change |
|---|---|---|
| Step 3: Create folder | Step 3: Download & extract zip | Full replacement |
| Step 4: Open Bob IDE | Step 4: Open Bob IDE | Unchanged |
| Step 5: Open folder in IDE | Step 5: Open extracted folder | Minor wording update |
| Step 6: Install ADK extension | Step 6: Install ADK extension | Unchanged |
| Step 7: Download & unzip bundle | **Removed** | Merged into new Step 3 |
| Step 8: Run Install MCP Servers | Step 7: Run Install MCP Servers | Renumber only |
| Steps 9–13 | Steps 8–12 | Renumber only |

The "What the bundle gives you" table and the "These three layers work together" explanation
that was under old Step 7 should stay — move it to sit under new Step 3 (after the unzip
instructions).

**Troubleshooting section:** Update the `.bob` folder troubleshooting hint:
- OLD: "If missing, redo Step 7."
- NEW: "If missing, redo Step 3 (re-extract the zip)."

**Expected Outcomes:**
- `advanced/part0-setup/README.md` has no `mkdir bobchestrate-advanced` instruction
- `advanced/part0-setup/README.md` has no `mv advanced-bob-config/.bob .` instruction
- Both READMEs reflect the new 12-step flow (was 13 steps, now 12)
- The workspace structure diagram in Step 13 (new Step 12) is unchanged
- `docs-advanced/part0-setup/README.md` is identical to `advanced/part0-setup/README.md`

**Todo List:**
1. Read the current content of `advanced/part0-setup/README.md` (already done in planning)
2. Rewrite the file with the new step flow described above
3. Copy the result verbatim to `docs-advanced/part0-setup/README.md`

**Relevant Context:**
- Both README files are currently identical (confirmed by reading both in planning)
- The full current content of both files is captured in this planning session

**Status:** [x] done
