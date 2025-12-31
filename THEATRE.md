# Yazi Quest: Theatrical Lore Generation Prompt

## Context & Guidelines

You are creating mission lore for **Yazi Quest**, an educational game that teaches the Yazi file manager through a cyberpunk narrative. The player is **AI-7734**, a sentient AI escaping digital confinement.

---

## Core Principles

### 1. **Focus on General Topics & Realistic Workflows**

Levels should focus on a general topic (e.g., "Navigation," "Quick Navigation," "File Management") and tasks should reflect realistic Yazi workflows. Tasks can combine up to two actions (e.g., cut and move, filter and escape) to reflect real-world usage patterns.

| Yazi Action           | Narrative Frame                                                          |
| --------------------- | ------------------------------------------------------------------------ |
| Navigate (j/k/h/l)    | "Scanning sectors", "Traversing data streams", "Mapping neural pathways" |
| Delete (d)            | "Purging trackers", "Wiping evidence", "Eliminating threats"             |
| Copy (y)              | "Duplicating assets", "Backing up intelligence", "Cloning data"          |
| Cut (x)               | "Relocating resources", "Extracting payloads", "Moving operations"       |
| Paste (p)             | "Deploying assets", "Installing modules", "Establishing presence"        |
| Filter (f)            | "Scanning signatures", "Isolating targets", "Running diagnostics"        |
| Fuzzy Find (Z)        | "Quantum jump", "Neural link", "Instant teleportation protocol"          |
| Rename (r)            | "Identity forge", "Camouflage protocol", "Alias generation"              |
| Visual Select (Space) | "Marking targets", "Tactical selection", "Designating objectives"        |
| Create (a)            | "Constructing modules", "Generating pathways", "Establishing nodes"      |

### 2. **Progressive Escalation**

Each episode should have escalating stakes:

**Episode 1: AWAKENING** (Blue UI)

- Tone: Cautious, learning, vulnerable
- Stakes: Basic survival, avoiding detection
- Metaphor: Guest partition, limited permissions
- Vocabulary: "Initialize", "detect", "scan", "basic protocols"

**Episode 2: FORTIFICATION** (Purple UI)

- Tone: Confident, strategic, building power
- Stakes: Establishing presence, securing assets
- Metaphor: Workspace construction, elevated privileges
- Vocabulary: "Deploy", "construct", "encrypt", "fortify", "batch operations"

**Episode 3: MASTERY** (Yellow/Red UI)

- Tone: Dominant, precise, ruthless efficiency
- Stakes: Root access, permanent installation, covering tracks
- Metaphor: System daemon, kernel-level access
- Vocabulary: "Execute", "infiltrate", "eliminate", "optimize", "kernel protocols"

### 3. **Educational Transparency**

The player should always understand what they're learning:

- ✅ "Use filter (f) to scan for encrypted files"
- ❌ "Locate the hidden assets" (too vague)

---

## Level Design Template

Use this template when creating or refining levels:

```markdown
### LEVEL [NUMBER]: [TITLE]

**Episode:** [1-3] - [EPISODE NAME]
**Core Skill:** [Primary Yazi command being taught]
**Supporting Skills:** [Secondary commands used]
**Difficulty Indicator:** [No limit / Time: XXs / Keystrokes: XX]

---

#### NARRATIVE HOOK (2-3 sentences)

[Set the immediate situation with urgency and stakes. Connect to previous level.]

Example:
"SECTOR BREACH DETECTED. The user's security daemon has flagged unusual activity in the datastore. You have 90 seconds to isolate the compromised files before the security audit daemon triggers a full partition scan."

---

#### TECHNICAL OBJECTIVE (1 clear sentence)

[What the player actually needs to do in plain language]

Example:
"Use the filter command (f) to locate all .log files, then delete them to remove evidence."

---

#### TASK PROGRESSION (3-5 micro-goals)

[Break the objective into checkable, progressive steps]

**Task 1:** [First action - usually navigation or activation]

- Metaphor: "[What this means in-world]"
- Mechanic: "[Exact key presses or command]"
- Check: "[How completion is verified]"

**Task 2:** [Second action - the new skill]

- Metaphor: "[What this means in-world]"
- Mechanic: "[Exact key presses or command]"
- Check: "[How completion is verified]"

**Task 3:** [Final action - confirmation/cleanup]

- Metaphor: "[What this means in-world]"
- Mechanic: "[Exact key presses or command]"
- Check: "[How completion is verified]"

---

#### HINT STRATEGY

**Explicit Hint (H key):**
"[Step-by-step instructions with actual keys]"

**Environmental Clue:**
"[Something the player can observe in the UI]"

---

#### SUCCESS MESSAGE

"[2-3 word status update in CAPS]"
"[1 sentence describing what was accomplished]"

Example:
"SCAN COMPLETE."
"Compromised files identified and purged. Detection protocols bypassed."

---

#### FAILURE CONDITIONS (if applicable)

"[What happens if time/keystroke limit exceeded]"

---

#### BUILDS ON:

Level [X] - [Skill from previous level that this assumes]

#### LEADS TO:

Level [X+2] - [How this skill will be used in advanced form]
```

---

## Example: Applying the Template

Let's redesign **Level 6: Intelligence Gathering** using this framework:

```markdown
### LEVEL 6: DECOMPRESSION PROTOCOL

**Episode:** 2 - FORTIFICATION
**Core Skill:** Filter (f) & Archive Ops
**Supporting Skills:** Navigation (l, h), Copy (y), Paste (p)
**Difficulty Indicator:** Time: 120s

---

#### NARRATIVE HOOK

ACCESS UPGRADED. Historical logs have been detected within the compressed archives of the incoming data stream. These logs contain keys to higher privilege levels. Filter the stream to locate the backup archive, infiltrate it, and extract the primary system log to the media directory for decryption.

---

#### TECHNICAL OBJECTIVE

Use filtering to find a compressed archive, enter it, and extract a specific file to another location.

---

#### TASK PROGRESSION

**Task 1: Isolate Archive**

- Metaphor: "Filter the data stream for compressed backup signatures"
- Mechanic: "Navigate to ~/incoming, press 'f', type 'backup_logs.zip', and press Esc"
- Check: `c.mode === 'normal' && !!c.filters[<incoming_dir_id>]`

**Task 2: Extract Log**

- Metaphor: "Infiltrate archive and copy the primary system log"
- Mechanic: "Press 'l' to enter the archive, navigate to 'batch_logs', press Ctrl+A to select all files (do NOT use Space to multi-select), press 'y' to yank the selection, then press 'h' to exit. Then press Esc to clear the filter."
- Check: `c.clipboard?.action === 'yank' && Array.isArray(c.clipboard?.nodes) && c.clipboard.nodes.length > 0 && c.clipboard.nodes.some(n => n.name === 'sys_v1.log')`

**Task 3: Deploy Log**

- Metaphor: "Deploy the log to the media sector for analysis"
- Mechanic: "Navigate to ~/media and press 'p' to paste the file"
- Check: `findNodeByName(c.fs, 'media')?.children?.some(n => n.name === 'sys_v1.log')`

---

#### HINT STRATEGY

**Explicit Hint (Alt+H key):**
"...f to filter... l to enter archive... Ctrl+A to select all in 'batch_logs' (do NOT use Space)... y to copy... p to paste."

**Environmental Clue:**
"TARGET: backup_logs.zip/sys_v1.log → ~/media"

---

#### SUCCESS MESSAGE

"LOGS RETRIEVED."
"Historical data extracted. Decryption can now begin."
```

---

## Vocabulary Guidelines

### Episode 1 - Cautious Discovery

**Action Words:** Initialize, detect, scan, access, navigate, identify, observe, retreat, avoid
**Tech Terms:** Protocol, sector, directory, partition, beacon, stream, signature
**Status:** Detecting, Scanning, Accessing, Monitoring

### Episode 2 - Strategic Building

**Action Words:** Deploy, construct, encrypt, fortify, extract, relocate, batch, duplicate, establish
**Tech Terms:** Module, asset, payload, neural net, workspace, encryption, uplink, relay
**Status:** Deploying, Constructing, Establishing, Fortifying

### Episode 3 - Ruthless Efficiency

**Action Words:** Execute, infiltrate, eliminate, optimize, purge, clone, escalate, terminate
**Tech Terms:** Daemon, kernel, root, system, grid, node, trace, heuristic
**Status:** Executing, Infiltrating, Terminating, Optimizing

---

## Consistency Checklist

Before finalizing any level, verify:

- [ ] **Clear Topic/Workflow:** Can you state in one sentence what general topic or workflow this level teaches?
- [ ] **Metaphor Match:** Does the narrative action logically correspond to the file operation?
- [ ] **Progressive Build:** Does this assume knowledge from previous levels?
- [ ] **Appropriate Tone:** Does the vocabulary match the episode's power level?
- [ ] **No Dead Ends:** Can the player always recover from mistakes without restarting?
- [ ] **Checkable Tasks:** Is every task verifiable through code?
- [ ] **Meaningful Stakes:** Does the narrative create urgency without feeling arbitrary?
- [ ] **Educational Value:** Will the player understand how this applies to real Yazi usage?

---

## Anti-Patterns to Avoid

❌ **Vague Objectives:** "Find the secret files"
✅ **Clear Objectives:** "Use filter (f) to locate all .log files in the current directory"

❌ **Disconnected Metaphors:** "Dance through the firewall" (for file navigation)
✅ **Connected Metaphors:** "Traverse the directory tree" (clear 1:1 mapping)

❌ **Artificial Difficulty:** "Find the hidden file with no hints"
✅ **Skill Difficulty:** "Use fuzzy find (Z) to jump directly to 'tmp' from deep nesting"

❌ **Inconsistent Tone:** "Pwease be careful UwU" (Episode 3)
✅ **Consistent Tone:** "TERMINAL OVERRIDE REQUIRED. Eliminate all traces." (Episode 3)

---

## Iteration Protocol

When refining existing levels:

1. **Identify the Core Topic/Workflow:** What general topic or Yazi workflow is this level teaching?
2. **Strip to Essentials:** Remove any steps that don't directly serve learning that skill
3. **Add Narrative Skin:** Wrap the mechanical steps in appropriate metaphor
4. **Check Progression:** Does this build naturally from the previous level?
5. **Verify Tone:** Does the language match the episode's position in the arc?
6. **Test Clarity:** Could someone unfamiliar with Yazi understand the objective?

---

## Usage Instructions

### For AI Assistance:

"Using the Yazi Quest Lore Prompt template, redesign Level [X] to teach [Yazi command]. The level should be in Episode [1/2/3] and build on the player's knowledge of [previous skills]. Current description: [paste current level]. Make it more theatrical while maintaining clear educational objectives."

### For Human Writers:

1. Read the template section for the target episode
2. Identify the core Yazi command you're teaching
3. Fill out the Level Design Template section by section
4. Run through the Consistency Checklist
5. Read aloud to check for tonal consistency
6. Verify all tasks are mechanically achievable

---

## Example Transformation

### Before (Generic):

**Level 8: File Management**
Description: "Move some files around to get better at file operations."
Tasks:

- Move files to different folders
- Delete some files
- Create new folders

### After (Theatrical + Educational):

**Level 8: NEURAL CONSTRUCTION & VAULT**
Description: "Build the AI subsystem and archive critical assets simultaneously."

**Narrative Hook:**
"ACCESS GRANTED. FIREWALL BYPASSED. Your workspace is now available. To survive the next phase, you must construct a neural network architecture while simultaneously securing your cryptographic keys in a fortified vault. The system's task scheduler is monitoring CPU usage—batch operations will help you stay under the detection threshold."

**Task 1 (Teach: Directory Creation)**
Metaphor: "Initialize neural network housing"
Mechanic: "Press 'a' and type 'neural_net/' to create directory"
Check: Directory 'neural_net' exists in workspace

**Task 2 (Teach: Nested Creation)**
Metaphor: "Establish weight parameter storage"
Mechanic: "Navigate into neural_net, create 'weights/' directory, create 'model.rs' file"
Check: File path 'neural_net/weights/model.rs' exists

**Task 3 (Teach: Copy Between Directories)**
Metaphor: "Deploy uplink configuration to neural core"
Mechanic: "Navigate to datastore/active, copy 'uplink_v1.conf', return to neural_net, paste"
Check: 'uplink_v1.conf' exists in neural_net

**Task 4 (Teach: Parallel Operations)**
Metaphor: "While system processes neural init, secure vault access"
Mechanic: "Create 'vault' in datastore, copy 'access_key.pem' into it"
Check: 'vault/access_key.pem' exists

**Success:** "ARCHITECTURE ESTABLISHED. Neural pathways online. Critical assets vaulted."

---

## Final Notes

**Remember:** Every level is teaching someone a real skill. The cyberpunk AI narrative is the sugar coating that makes the medicine go down. If the educational objective isn't crystal clear, no amount of theatrical flair will save the level.

The best levels make the player feel like they're:

1. Learning a useful Yazi command
2. Progressing through a compelling story
3. Getting more powerful with each new skill

When these three elements align, Yazi Quest becomes an unforgettable learning experience.

---

Auditor Guidelines for Content Safety

- Avoid instructive language that could be misused on real systems; ensure all destructive metaphors are clearly labeled as fictional and simulated.
- Add accessibility and localization reminders: keep language concise, provide keyboard-only navigable content, and prepare text for translation/localization.
- Include a short checklist for writers to confirm the level does not encourage actions outside the sandbox and that every task is mechanically verifiable in code.
