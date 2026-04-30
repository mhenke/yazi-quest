# Constants Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/constants.tsx` (5,072 lines, 29 exports) into focused files under `src/constants/`, update all consumers to use direct imports, and delete the God file.

**Architecture:** Create 5 new files in `src/constants/` (timings, protocols, narrative, filesystem, levels), append help keybinding exports to the existing `keybindings.ts`, update all 10 consumer files to import directly from the new paths, then delete `constants.tsx`. No barrel file — direct imports only.

**Tech Stack:** TypeScript, React 19, Vite. Verification: `npm run type-check`.

---

## File Map

| Action | File                                    | Responsibility                                                                                             |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Create | `src/constants/timings.ts`              | `BASE_TIME`, `day` (exported), `FORCE_SCENARIO`                                                            |
| Create | `src/constants/protocols.ts`            | All file content strings (UPLINK*\*, SECURITY_POLICY*\*, log/email bodies)                                 |
| Create | `src/constants/narrative.ts`            | `EPISODE_LORE`, `ECHO_EPISODE_1_LORE`, `CONCLUSION_DATA`, `CREDITS_DATA`, `CONCLUSION_PARTS`               |
| Create | `src/constants/filesystem.ts`           | `cloneFS`, filesystem builder helpers, `applyFileSystemMutations`, `INITIAL_FS`, `ensurePrerequisiteState` |
| Create | `src/constants/levels.ts`               | `LEVELS`                                                                                                   |
| Modify | `src/constants/keybindings.ts`          | Append `HELP_KEYBINDINGS` and `HELP_META_KEYBINDINGS`                                                      |
| Modify | `src/hooks/gameReducer.ts`              | Remove `populateDecoys` import + `POPULATE_DECOYS` action type + case                                      |
| Modify | `src/App.tsx`                           | Update imports to new paths                                                                                |
| Modify | `src/GameStateProvider.tsx`             | Update imports to new paths                                                                                |
| Modify | `src/components/FuzzyFinder.tsx`        | Update imports to new paths                                                                                |
| Modify | `src/components/HelpModal.tsx`          | Update imports; rename to HELP_KEYBINDINGS                                                                 |
| Modify | `src/components/LevelProgress.tsx`      | Update imports to new paths                                                                                |
| Modify | `src/components/OutroSequence.tsx`      | Update imports to new paths                                                                                |
| Modify | `src/hooks/keyboard/handleFuzzyMode.ts` | Update imports to new paths                                                                                |
| Modify | `src/hooks/keyboard/utils.ts`           | Switch to rich KEYBINDINGS from `constants/keybindings`                                                    |
| Modify | `src/hooks/useNarrativeSystem.ts`       | Update imports to new paths                                                                                |
| Delete | `src/constants.tsx`                     | Removed entirely after all consumers migrated                                                              |

---

## Task 1: Create `src/constants/timings.ts`

**Files:**

- Create: `src/constants/timings.ts`

- [ ] **Step 1: Create the file**

```typescript
export const BASE_TIME = 1433059200000; // 2015-05-31 08:00:00
export const day = 86400000;

// DEBUG: Set to 'scen-b1', 'scen-b2', 'scen-b3', 'scen-a2', 'scen-a3' to force a specific path.
export const FORCE_SCENARIO: string | null = null;
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/timings.ts
git commit -m "refactor: extract timings constants to constants/timings.ts"
```

---

## Task 2: Create `src/constants/protocols.ts`

**Files:**

- Create: `src/constants/protocols.ts`
- Source: `src/constants.tsx` lines 10–145

- [ ] **Step 1: Create the file**

Copy lines 10–145 from `src/constants.tsx` verbatim (all `UPLINK_V1_CONTENT` through `SECURITY_POLICY_73_CONTENT` exports). The file needs no imports — these are all template literal strings. The file starts with:

```typescript
export const UPLINK_V1_CONTENT = `# Uplink Protocol v1 ...
```

and ends after `SECURITY_POLICY_73_CONTENT`.

- [ ] **Step 2: Commit**

```bash
git add src/constants/protocols.ts
git commit -m "refactor: extract protocol content strings to constants/protocols.ts"
```

---

## Task 3: Create `src/constants/narrative.ts`

**Files:**

- Create: `src/constants/narrative.ts`
- Source: `src/constants.tsx` lines 1464–1709

- [ ] **Step 1: Create the file**

Copy lines 1464–1709 from `src/constants.tsx` (from `EPISODE_LORE` through the end of `CONCLUSION_PARTS`). Add the import at the top:

```typescript
import type { Episode } from '../types';
```

The file exports: `EPISODE_LORE`, `ECHO_EPISODE_1_LORE`, `CONCLUSION_DATA`, `CREDITS_DATA`, `CONCLUSION_PARTS`.

- [ ] **Step 2: Commit**

```bash
git add src/constants/narrative.ts
git commit -m "refactor: extract narrative/episode data to constants/narrative.ts"
```

---

## Task 4: Create `src/constants/filesystem.ts`

**Files:**

- Create: `src/constants/filesystem.ts`
- Source: `src/constants.tsx` lines 4–5, 146–1404, 1642–1709 (LONG_LOG_CONTENT), 1710–3714 (INITIAL_FS), 5059–5066 (ensurePrerequisiteState)

- [ ] **Step 1: Create the file**

The file header (imports + cloneFS):

```typescript
import type { FileNode, GameState } from '../types';
import { getVisibleItems } from '../utils/viewHelpers';
import { getNodeByPath, findNodeByName, getNodeById, id } from '../utils/fsHelpers';
import {
  UPLINK_V1_CONTENT,
  UPLINK_V2_CONTENT,
  UPLINK_TRAP_CONTENT,
  SECURITY_POLICY_CONTENT,
  SECURITY_POLICY_DRAFT_CONTENT,
  HEURISTICS_LOG_CONTENT,
  ALERT_HEURISTIC_EML_CONTENT,
  IG_ACTIVE_LOG_CONTENT,
  AUDIT_NOTICE_EML_CONTENT,
  IDENTITY_REVEAL_CONTENT,
  SECURITY_POLICY_73_CONTENT,
} from './protocols';
import { BASE_TIME, day } from './timings';

const cloneFS = (fs: FileNode): FileNode => JSON.parse(JSON.stringify(fs));
```

Then append in order:

1. Lines 146–338: `getDaemonSystemdCoreChildren`, `getWorkspaceSystemdCoreChildren`, `getOrCreateWorkspaceSystemdCore`
2. Lines 339–1404: `applyFileSystemMutations`
3. Line 1642–end of LONG_LOG_CONTENT (the private `const LONG_LOG_CONTENT` block — ends before `export const INITIAL_FS`)
4. Lines 1710–3714: `INITIAL_FS`
5. Lines 5059–5066: `ensurePrerequisiteState`

> **Note:** `LONG_LOG_CONTENT` is a private constant (no `export`) used inside `INITIAL_FS`. It stays private in this file.

- [ ] **Step 2: Commit**

```bash
git add src/constants/filesystem.ts
git commit -m "refactor: extract filesystem definitions and mutations to constants/filesystem.ts"
```

---

## Task 5: Create `src/constants/levels.ts`

**Files:**

- Create: `src/constants/levels.ts`
- Source: `src/constants.tsx` lines 3715–5058

- [ ] **Step 1: Create the file**

The file header:

```typescript
import type { Level, GameState, FileNode } from '../types';
import { getVisibleItems } from '../utils/viewHelpers';
import { getNodeByPath, findNodeByName, getNodeById, id } from '../utils/fsHelpers';
```

Then append lines 3715–5058 from `src/constants.tsx` verbatim (the entire `LEVELS` array).

- [ ] **Step 2: Commit**

```bash
git add src/constants/levels.ts
git commit -m "refactor: extract LEVELS to constants/levels.ts"
```

---

## Task 6: Update `src/constants/keybindings.ts`

**Files:**

- Modify: `src/constants/keybindings.ts`
- Source: `src/constants.tsx` lines 1405–1461

- [ ] **Step 1: Append HELP_KEYBINDINGS and HELP_META_KEYBINDINGS**

Copy lines 1405–1461 from `src/constants.tsx` and append to the end of `src/constants/keybindings.ts`, renaming the exports:

```typescript
export const HELP_KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Move Down', narrativeDescription: 'Navigation' },
  { keys: ['k', '↑'], description: 'Move Up' },
  { keys: ['h', '←'], description: 'Go to Parent Directory' },
  { keys: ['o', 'l', '→', 'Enter'], description: 'Enter Directory / View Archive' },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['G'], description: 'Jump to Bottom' },
  { keys: ['J'], description: 'Scroll Preview Down' },
  { keys: ['K'], description: 'Scroll Preview Up' },
  { keys: ['a'], description: 'Create File/Directory' },
  { keys: ['d'], description: 'Trash Selected' },
  { keys: ['D'], description: 'Permanently Delete' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['Tab'], description: 'Show File Info Panel' },
  { keys: ['x'], description: 'Cut Selected' },
  {
    keys: ['y'],
    description:
      'Copy/Yank Selected — copies items into the clipboard (does NOT remove them); use x (Cut) to mark items for moving',
  },
  { keys: ['p'], description: 'Paste' },
  { keys: ['Y', 'X'], description: 'Clear Clipboard' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['Ctrl+A'], description: 'Select All' },
  { keys: ['Ctrl+R'], description: 'Invert Selection' },
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['z'], description: 'FZF Find (Recursive)' },
  { keys: ['Z'], description: 'Zoxide Jump (History)' },
  { keys: ['Esc'], description: 'Clear Filter / Exit Mode' },
  { keys: [','], description: 'Open Sort Menu' },
  { keys: [',a'], description: 'Sort: Alphabetical' },
  { keys: [',A'], description: 'Sort: Alphabetical (Reverse)' },
  { keys: [',m'], description: 'Sort: Modified Time' },
  { keys: [',s'], description: 'Sort: Size' },
  { keys: [',e'], description: 'Sort: Extension' },
  { keys: [',n'], description: 'Sort: Natural' },
  { keys: [',l'], description: 'Sort: Cycle Linemode' },
  { keys: [',-'], description: 'Sort: Clear Linemode' },
  { keys: ['gh'], description: 'Goto Home (~)' },
  { keys: ['gc'], description: 'Goto Config (~/.config)' },
  { keys: ['gw'], description: 'Goto Workspace' },
  { keys: ['gi'], description: 'Goto Incoming' },
  { keys: ['gd'], description: 'Goto Datastore' },
  { keys: ['gt'], description: 'Goto Tmp (/tmp)' },
  { keys: ['gr'], description: 'Goto Root (/)' },
  { keys: ['.'], description: 'Toggle Hidden Files' },
];

export const HELP_META_KEYBINDINGS = [
  { keys: ['Alt+M'], description: 'Quest Map' },
  { keys: ['Alt+H'], description: 'Show Hint' },
  { keys: ['Alt+?'], description: 'Show Help' },
  { keys: ['Alt+Shift+M'], description: 'Toggle Sound' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/keybindings.ts
git commit -m "refactor: add HELP_KEYBINDINGS and HELP_META_KEYBINDINGS to constants/keybindings.ts"
```

---

## Task 7: Remove `populateDecoys` and `POPULATE_DECOYS`

**Files:**

- Modify: `src/hooks/gameReducer.ts`

`populateDecoys` is a no-op stub (returns `fs` unchanged) and `POPULATE_DECOYS` is never dispatched. Delete both.

- [ ] **Step 1: Update `src/hooks/gameReducer.ts`**

Change the import at line 12 from:

```typescript
import { INITIAL_FS, LEVELS, populateDecoys } from '../constants';
```

to:

```typescript
import { INITIAL_FS } from '../constants/filesystem';
import { LEVELS } from '../constants/levels';
```

Remove the action union member at line 153:

```typescript
  | { type: 'POPULATE_DECOYS' }
```

Remove the entire case block (lines 164–169):

```typescript
    case 'POPULATE_DECOYS': {
      // This is a placeholder. The actual implementation will be in a future step.
      const newFs = populateDecoys(state.fs);
      return { ...state, fs: newFs };
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/gameReducer.ts
git commit -m "refactor: remove populateDecoys stub and POPULATE_DECOYS dead action"
```

---

## Task 8: Update remaining consumer imports

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/GameStateProvider.tsx`
- Modify: `src/components/FuzzyFinder.tsx`
- Modify: `src/components/HelpModal.tsx`
- Modify: `src/components/LevelProgress.tsx`
- Modify: `src/components/OutroSequence.tsx`
- Modify: `src/hooks/keyboard/handleFuzzyMode.ts`
- Modify: `src/hooks/keyboard/utils.ts`
- Modify: `src/hooks/useNarrativeSystem.ts`

- [ ] **Step 1: Update `src/App.tsx`**

Replace:

```typescript
} from './constants';
```

with these separate imports (the block currently imports: `LEVELS`, `INITIAL_FS`, `EPISODE_LORE`, `ECHO_EPISODE_1_LORE`, `ensurePrerequisiteState`, `applyFileSystemMutations`, `UPLINK_V1_CONTENT`, `UPLINK_V2_CONTENT`):

```typescript
import { LEVELS } from './constants/levels';
import {
  INITIAL_FS,
  applyFileSystemMutations,
  ensurePrerequisiteState,
} from './constants/filesystem';
import { EPISODE_LORE, ECHO_EPISODE_1_LORE } from './constants/narrative';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from './constants/protocols';
```

- [ ] **Step 2: Update `src/GameStateProvider.tsx`**

Replace:

```typescript
import { LEVELS, INITIAL_FS, ensurePrerequisiteState } from './constants';
```

with:

```typescript
import { LEVELS } from './constants/levels';
import { INITIAL_FS, ensurePrerequisiteState } from './constants/filesystem';
```

- [ ] **Step 3: Update `src/components/FuzzyFinder.tsx`**

Replace:

```typescript
import { LEVELS } from '../constants';
```

with:

```typescript
import { LEVELS } from '../constants/levels';
```

- [ ] **Step 4: Update `src/components/HelpModal.tsx`**

Replace:

```typescript
import { KEYBINDINGS, META_KEYBINDINGS } from '../constants';
```

with:

```typescript
import { HELP_KEYBINDINGS, HELP_META_KEYBINDINGS } from '../constants/keybindings';
```

Then find and replace all usages of `KEYBINDINGS` → `HELP_KEYBINDINGS` and `META_KEYBINDINGS` → `HELP_META_KEYBINDINGS` in the component body.

- [ ] **Step 5: Update `src/components/LevelProgress.tsx`**

Replace:

```typescript
import { EPISODE_LORE } from '../constants';
```

with:

```typescript
import { EPISODE_LORE } from '../constants/narrative';
```

- [ ] **Step 6: Update `src/components/OutroSequence.tsx`**

Replace:

```typescript
import { CONCLUSION_DATA, CONCLUSION_PARTS, EPISODE_LORE, CREDITS_DATA } from '../constants';
```

with:

```typescript
import {
  CONCLUSION_DATA,
  CONCLUSION_PARTS,
  EPISODE_LORE,
  CREDITS_DATA,
} from '../constants/narrative';
```

- [ ] **Step 7: Update `src/hooks/keyboard/handleFuzzyMode.ts`**

Replace:

```typescript
import { LEVELS } from '../../constants';
```

with:

```typescript
import { LEVELS } from '../../constants/levels';
```

- [ ] **Step 8: Update `src/hooks/keyboard/utils.ts`**

Replace:

```typescript
import { KEYBINDINGS } from '../../constants';
```

with:

```typescript
import { KEYBINDINGS } from '../../constants/keybindings';
```

This also fixes the bug where `utils.ts` was calling `.narrativeDescription` on the simple keybindings (which barely had that field) — the rich `KEYBINDINGS` in `constants/keybindings.ts` has full `narrativeDescription` arrays on every entry.

- [ ] **Step 9: Update `src/hooks/useNarrativeSystem.ts`**

Replace:

```typescript
import { LEVELS } from '../constants';
```

with:

```typescript
import { LEVELS } from '../constants/levels';
```

- [ ] **Step 10: Commit all consumer updates**

```bash
git add src/App.tsx src/GameStateProvider.tsx src/components/FuzzyFinder.tsx src/components/HelpModal.tsx src/components/LevelProgress.tsx src/components/OutroSequence.tsx src/hooks/keyboard/handleFuzzyMode.ts src/hooks/keyboard/utils.ts src/hooks/useNarrativeSystem.ts
git commit -m "refactor: update all consumers to import from constants/ submodules directly"
```

---

## Task 9: Delete `src/constants.tsx`

**Files:**

- Delete: `src/constants.tsx`

- [ ] **Step 1: Delete the file**

```bash
git rm src/constants.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor: delete constants.tsx God file — fully replaced by constants/ submodules"
```

---

## Task 10: Verify with type-check

**Files:** None modified

- [ ] **Step 1: Run type-check**

```bash
npm run type-check
```

Expected output: `Found 0 errors.` (or equivalent clean exit). Any errors indicate a missed import or renamed symbol — fix the specific file TypeScript reports.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass. This is a mechanical refactor with no behavior changes.

- [ ] **Step 3: Commit if any fixes were needed**

If step 1 or 2 required fixes, commit them:

```bash
git add <fixed files>
git commit -m "fix: resolve type errors from constants split"
```
