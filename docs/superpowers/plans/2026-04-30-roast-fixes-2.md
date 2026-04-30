# Roast Fixes Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove debug logging from production, fix three type safety issues, encapsulate a window global into a module-level flag, and extract 12 inline keyboard handler registrations from App.tsx via a React context.

**Architecture:** Tasks 1–4 are isolated file edits with no dependencies. Task 5 introduces `src/utils/skipIntroFlag.ts` and migrates 5 files. Task 6 introduces `src/contexts/GameInputContext.tsx` and `src/hooks/useAppInputHandlers.ts`, then modifies App.tsx to use them. Each task is committed independently.

**Tech Stack:** React 18, TypeScript strict, Vitest (unit tests), Playwright (e2e). Commands: `npm run type-check`, `npm run lint`, `npm test`.

---

## File Map

| File                                    | Action     | Purpose                                                                         |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `src/App.tsx`                           | Modify     | Remove debug calls, empty effect, window reads/writes, 12 useGlobalInput blocks |
| `src/utils/dynamicGlitch.ts`            | Modify     | Replace `any` with `HTMLElement` types                                          |
| `src/hooks/keyboard/handleClipboard.ts` | Modify     | Add explanatory comments to two eslint-disable lines                            |
| `src/utils/skipIntroFlag.ts`            | **Create** | Module-level get/set/reset for skip-intro flag                                  |
| `src/components/BiosBoot.tsx`           | Modify     | Use `setSkipIntroRequested()` / `getSkipIntroRequested()`                       |
| `src/components/EpisodeIntro.tsx`       | Modify     | Use `setSkipIntroRequested()` / `getSkipIntroRequested()`                       |
| `src/types.ts`                          | Modify     | Remove `declare global { interface Window { __yaziQuestSkipIntroRequested } }`  |
| `src/contexts/GameInputContext.tsx`     | **Create** | Context type, context object, `useGameInputContext()` hook                      |
| `src/hooks/useAppInputHandlers.ts`      | **Create** | Reads context, registers all 12 `useGlobalInput` calls                          |

---

## Task 1: Delete debug console.error calls from App.tsx

**Files:**

- Modify: `src/App.tsx`

App.tsx fires seven `console.error('[DEBUG]...')` calls in production whenever a Level 4 player completes tasks. None are guarded by `NODE_ENV`.

- [ ] **Step 1: Delete the `[DEBUG-GLOBAL]` block**

In `src/App.tsx`, find and delete these 4 lines (inside the task-checking useEffect):

```ts
// DEBUG: Trace completion logic
if (gameState.levelIndex === 4 && tasksComplete) {
  console.error(
    `[DEBUG-GLOBAL] Level 4 Tasks Complete! ShowToast: ${gameState.showSuccessToast}, Intro: ${gameState.showEpisodeIntro}`
  );
}
```

- [ ] **Step 2: Delete the six `[DEBUG]` calls inside the Level 4 mutation block**

Find the `if (currentLevel.id === 4)` block inside the same useEffect. Delete the six `console.error('[DEBUG]...')` lines:

```ts
// DELETE these lines:
console.error('[DEBUG] Level 4 completion detected. Checking for mutation...');
// ...
console.error('[DEBUG] Mutating uplink_v1.conf');
// ...
console.error('[DEBUG] Mutating uplink_v2.conf');
// ...
console.error('[DEBUG] Dispatching UPDATE_FS');
// ...
console.error('[DEBUG] No mutation needed (files already updated or missing)');
// ...
console.error('[DEBUG] protocols directory not found or empty');
```

Keep all surrounding logic (the `cloneFS`, `getNodeById`, `protocols` check, `dispatch({ type: 'UPDATE_FS' })` — only remove the console.error lines.

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "fix: remove debug console.error calls from production code"
```

---

## Task 2: Delete empty useEffect skeleton

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Delete the two lines**

Find and delete:

```ts
// --- DEBUG: LOG PATH CHANGES ---
useEffect(() => {}, [gameState.currentPath, gameState.levelIndex]);
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "fix: delete empty debug useEffect skeleton"
```

---

## Task 3: Fix `any` types in dynamicGlitch.ts

**Files:**

- Modify: `src/utils/dynamicGlitch.ts`

- [ ] **Step 1: Read the current file**

Read `src/utils/dynamicGlitch.ts` in full to see the current `applyDynamicGlitch` function signature and the `triggerScreenShake` export.

- [ ] **Step 2: Replace the file content**

The file currently uses `(el as any).__dynamicGlitchApplied` and `element: any`. Replace with:

```ts
type GlitchElement = HTMLElement & { __dynamicGlitchApplied?: boolean };

export const applyDynamicGlitch = (el: GlitchElement): void => {
  if (el.__dynamicGlitchApplied) return;
  // ... rest of existing function body unchanged ...
  el.__dynamicGlitchApplied = true;
  // ... rest unchanged ...
};

export const triggerScreenShake = (element: HTMLElement): void => {
  if (!element) return;
  element.style.animation = 'none';
  void element.offsetWidth; // trigger reflow
  element.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
};
```

Do NOT change the function bodies — only the type annotations and the removal of `as any` casts. Remove the three `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments that covered the `any` uses.

- [ ] **Step 3: Type-check and lint**

```bash
npm run type-check && npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add src/utils/dynamicGlitch.ts
git commit -m "fix: replace any types with HTMLElement in dynamicGlitch.ts"
```

---

## Task 4: Document handleClipboard.ts eslint-disable suppressions

**Files:**

- Modify: `src/hooks/keyboard/handleClipboard.ts`

The two `eslint-disable` comments at lines ~309 and ~381 suppress valid warnings — those variables are intentionally discarded to strip transient clipboard/search properties before writing nodes to the filesystem. They need a comment explaining why.

- [ ] **Step 1: Add comment above each suppression**

Find the first suppression (inside the normal paste `p` handler):

```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;
```

Change to:

```ts
// Strip transient clipboard/search properties — these must not persist to the filesystem
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;
```

Find the second suppression (inside the force-paste `Shift+P` handler) — identical pattern, identical fix.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no warnings.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/keyboard/handleClipboard.ts
git commit -m "docs: explain eslint-disable suppressions in handleClipboard.ts"
```

---

## Task 5: Move `window.__yaziQuestSkipIntroRequested` to module-level flag

**Files:**

- Create: `src/utils/skipIntroFlag.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/BiosBoot.tsx`
- Modify: `src/components/EpisodeIntro.tsx`
- Modify: `src/types.ts`

### Step 1–3: Create and test the module

- [ ] **Step 1: Write the failing test**

Create `src/utils/skipIntroFlag.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSkipIntroRequested,
  setSkipIntroRequested,
  resetSkipIntroRequested,
} from './skipIntroFlag';

describe('skipIntroFlag', () => {
  beforeEach(() => {
    resetSkipIntroRequested();
  });

  it('defaults to false', () => {
    expect(getSkipIntroRequested()).toBe(false);
  });

  it('set makes it true', () => {
    setSkipIntroRequested();
    expect(getSkipIntroRequested()).toBe(true);
  });

  it('reset makes it false again', () => {
    setSkipIntroRequested();
    resetSkipIntroRequested();
    expect(getSkipIntroRequested()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test -- skipIntroFlag
```

Expected: FAIL — `Cannot find module './skipIntroFlag'`.

- [ ] **Step 3: Create the module**

Create `src/utils/skipIntroFlag.ts`:

```ts
let _requested = false;

export const setSkipIntroRequested = (): void => {
  _requested = true;
};

export const getSkipIntroRequested = (): boolean => _requested;

export const resetSkipIntroRequested = (): void => {
  _requested = false;
};
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm test -- skipIntroFlag
```

Expected: 3 passed.

### Step 5–9: Migrate consumers

- [ ] **Step 5: Update `src/App.tsx`**

Add import at top:

```ts
import {
  getSkipIntroRequested,
  setSkipIntroRequested,
  resetSkipIntroRequested,
} from './utils/skipIntroFlag';
```

In `createInitialState()`, replace:

```ts
// BEFORE
window.__yaziQuestSkipIntroRequested === true;

// AFTER
getSkipIntroRequested();
```

In `handleSkip` useCallback, replace:

```ts
// BEFORE
window.__yaziQuestSkipIntroRequested = true;

// AFTER
setSkipIntroRequested();
```

In the post-mount useEffect (the one that reads the flag and calls `handleSkip`), replace:

```ts
// BEFORE
if (window.__yaziQuestSkipIntroRequested) {

// AFTER
if (getSkipIntroRequested()) {
```

In `handleRestartCycle` useCallback, add the reset call:

```ts
const handleRestartCycle = useCallback(() => {
  resetSkipIntroRequested();
  dispatch({ type: 'RESTART_CYCLE' });
}, [dispatch]);
```

- [ ] **Step 6: Update `src/components/BiosBoot.tsx`**

Add import:

```ts
import { getSkipIntroRequested, setSkipIntroRequested } from '../utils/skipIntroFlag';
```

Replace every `window.__yaziQuestSkipIntroRequested = true` with `setSkipIntroRequested()`.

Replace every `if (window.__yaziQuestSkipIntroRequested)` with `if (getSkipIntroRequested())`.

- [ ] **Step 7: Update `src/components/EpisodeIntro.tsx`**

Add import:

```ts
import { getSkipIntroRequested, setSkipIntroRequested } from '../utils/skipIntroFlag';
```

Replace every `window.__yaziQuestSkipIntroRequested = true` with `setSkipIntroRequested()`.

Replace every `if (window.__yaziQuestSkipIntroRequested)` with `if (getSkipIntroRequested())`.

- [ ] **Step 8: Remove the `declare global` from `src/types.ts`**

Find and delete this block entirely:

```ts
declare global {
  interface Window {
    __yaziQuestSkipIntroRequested?: boolean;
  }
}
```

- [ ] **Step 9: Type-check and full test**

```bash
npm run type-check && npm test
```

Expected: no type errors, 121+ tests pass (new skipIntroFlag tests included).

- [ ] **Step 10: Commit**

```bash
git add src/utils/skipIntroFlag.ts src/utils/skipIntroFlag.test.ts src/App.tsx src/components/BiosBoot.tsx src/components/EpisodeIntro.tsx src/types.ts
git commit -m "refactor: replace window.__yaziQuestSkipIntroRequested with module-level skipIntroFlag"
```

---

## Task 6: Extract keyboard handlers via GameInputContext

**Files:**

- Create: `src/contexts/GameInputContext.tsx`
- Create: `src/hooks/useAppInputHandlers.ts`
- Modify: `src/App.tsx`

### Step 1–2: Create the context

- [ ] **Step 1: Create `src/contexts/GameInputContext.tsx`**

```tsx
import React, { createContext, useContext } from 'react';
import type { GameState, FileNode, Level } from '../types';
import type { Action } from '../hooks/gameReducer';

export interface GameInputContextValue {
  // Core state
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
  // Derived values (computed in App before provider renders)
  currentLevel: Level;
  isLastLevel: boolean;
  visibleItems: FileNode[];
  currentItem: FileNode | undefined;
  parent: FileNode | null;
  // Game action callbacks
  advanceLevel: () => void;
  handleRenameConfirm: () => void;
  handleInputConfirm: () => void;
  handleSearchConfirm: () => void;
  handleFuzzySelect: (path: string, isZoxide: boolean, pathIds?: string[]) => void;
  handleBootComplete: (options?: { isSkip?: boolean }) => void;
  // Keyboard handler callbacks (from useKeyboardHandlers)
  handleNormalModeKeyDown: (
    e: KeyboardEvent,
    gameState: GameState,
    visibleItems: FileNode[],
    parent: FileNode | null,
    currentItem: FileNode | undefined,
    currentLevel: Level,
    advanceLevel: () => void
  ) => boolean | void;
  handleSortModeKeyDown: (e: KeyboardEvent, gameState: GameState) => void;
  handleConfirmDeleteModeKeyDown: (
    e: KeyboardEvent,
    visibleItems: FileNode[],
    currentLevel: Level,
    gameState: GameState
  ) => void;
  handleOverwriteConfirmKeyDown: (e: KeyboardEvent, gameState: GameState) => void;
  handleGCommandKeyDown: (e: KeyboardEvent, gameState: GameState, currentLevel: Level) => void;
  handleHelpModeKeyDown: (e: KeyboardEvent, gameState: GameState, onClose: () => void) => void;
  handleQuestMapModeKeyDown: (
    e: KeyboardEvent,
    gameState: GameState,
    levels: Level[],
    episodes: {
      id: number;
      name: string;
      shortTitle: string;
      color: string;
      border: string;
      bg: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      levels: Level[];
    }[],
    onClose: () => void,
    onJumpToLevel: (levelIndex: number) => void
  ) => void;
}

const GameInputContext = createContext<GameInputContextValue | null>(null);

export const useGameInputContext = (): GameInputContextValue => {
  const ctx = useContext(GameInputContext);
  if (!ctx) throw new Error('useGameInputContext must be used inside GameInputContext.Provider');
  return ctx;
};

export default GameInputContext;
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

### Step 3: Create useAppInputHandlers

- [ ] **Step 3: Create `src/hooks/useAppInputHandlers.ts`**

Move all 12 `useGlobalInput` call blocks verbatim from `src/App.tsx` lines 1094–1605 into this new hook. The hook reads all needed values from context:

```ts
import { Zap, Shield, Crown } from 'lucide-react';
import { useGameInputContext } from '../contexts/GameInputContext';
import { useGlobalInput } from '../GlobalInputContext';
import { LEVELS, INITIAL_FS } from '../constants/levels'; // adjust imports as needed
import { EPISODE_LORE } from '../constants/narrative';
import { ensurePrerequisiteState } from '../constants/filesystem';
import { cloneFS } from '../utils/fsHelpers'; // if needed
import { checkAllTasksComplete } from '../utils/gameUtils';
import { handleFuzzyModeKeyDown } from './keyboard/handleFuzzyMode';

export function useAppInputHandlers(): void {
  const {
    gameState,
    dispatch,
    currentLevel,
    isLastLevel,
    visibleItems,
    currentItem,
    parent,
    advanceLevel,
    handleRenameConfirm,
    handleInputConfirm,
    handleSearchConfirm,
    handleFuzzySelect,
    handleBootComplete,
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleHelpModeKeyDown,
    handleQuestMapModeKeyDown,
  } = useGameInputContext();

  // Paste the 12 useGlobalInput blocks from App.tsx here verbatim.
  // They reference the destructured values above instead of the App closure.
}
```

**Exact migration:** Open `src/App.tsx`. Cut lines 1094–1605 (from `// Global Key Down Handler` comment through the last `useGlobalInput(...)` closing `);`). Paste them into the function body of `useAppInputHandlers` above. Fix any import references that were previously resolved by App.tsx's imports.

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Fix any import errors. The context values replace the App closure variables one-for-one.

### Step 4–6: Update App.tsx

- [ ] **Step 5: Add context provider and hook call to App.tsx**

Add imports:

```ts
import GameInputContext from './contexts/GameInputContext';
import { useAppInputHandlers } from './hooks/useAppInputHandlers';
```

After all callbacks are defined (after `handleFuzzySelect`, after keyboard handlers from `useKeyboardHandlers`), add the context value assembly and hook call:

```tsx
// Assemble context value for keyboard handlers
const gameInputContextValue = {
  gameState,
  dispatch,
  currentLevel,
  isLastLevel,
  visibleItems,
  currentItem,
  parent,
  advanceLevel,
  handleRenameConfirm,
  handleInputConfirm,
  handleSearchConfirm,
  handleFuzzySelect,
  handleBootComplete,
  handleNormalModeKeyDown,
  handleSortModeKeyDown,
  handleConfirmDeleteModeKeyDown,
  handleOverwriteConfirmKeyDown,
  handleGCommandKeyDown,
  handleHelpModeKeyDown,
  handleQuestMapModeKeyDown,
};

useAppInputHandlers();
```

Wrap the JSX return value in the context provider:

```tsx
return (
  <GameInputContext.Provider value={gameInputContextValue}>
    <GlitchOverlay ...>
      ...existing JSX...
    </GlitchOverlay>
  </GameInputContext.Provider>
);
```

Also wrap the early-return cases that render before the main JSX (the `isBooting` and `isLastLevel` returns are fine outside the provider since they don't use keyboard handlers).

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```

Expected: no errors. If `gameInputContextValue` has type errors, check that callback signatures in the context type match the `useKeyboardHandlers` return type exactly.

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: 121+ passed, 0 failed.

- [ ] **Step 8: Check App.tsx line count**

```bash
wc -l src/App.tsx
```

Expected: ~1,550 lines or fewer (was 2,065).

- [ ] **Step 9: Commit**

```bash
git add src/contexts/GameInputContext.tsx src/hooks/useAppInputHandlers.ts src/App.tsx
git commit -m "refactor: extract 12 useGlobalInput calls to useAppInputHandlers via GameInputContext"
```

---

## Final Verification

- [ ] **Run all checks**

```bash
npm run type-check && npm run lint && npm test && npm run build
```

Expected: zero errors, zero warnings, 121+ tests pass, production build succeeds.

- [ ] **Smoke test**

Start the dev server (`npm run dev`). Verify:

1. Skip intro button works in Episode 1 and Episode 2 boot sequences
2. Starting New Game+ does NOT auto-skip the intro
3. Alt+M / Alt+H / Alt+? modal toggles work
4. Level 4 completion does not log `[DEBUG]` in the browser console
5. Keyboard navigation (j/k/l/h/s/f) functions normally
