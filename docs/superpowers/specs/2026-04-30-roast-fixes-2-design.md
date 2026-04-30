# Design: Roast Fixes Round 2

## Context

Second pass at repo issues flagged in a code review. Round 1 eliminated dead files, type lies, and the telemetry no-op. Round 2 targets: debug logging in production, an empty useEffect skeleton, `any` types in dynamicGlitch, a window global flag used as cross-component state, and 14 inline keyboard handler registrations keeping App.tsx at 2,065 lines.

---

## Task 1: Delete debug console.error calls from App.tsx

Seven `console.error('[DEBUG]...')` and `console.error('[DEBUG-GLOBAL]...')` calls fire in production whenever a Level 4 player completes tasks. None are guarded by `NODE_ENV`. Delete all seven:

- Line 698–700: `[DEBUG-GLOBAL] Level 4 Tasks Complete!...`
- Line 751: `[DEBUG] Level 4 completion detected.`
- Line 761: `[DEBUG] Mutating uplink_v1.conf`
- Line 766: `[DEBUG] Mutating uplink_v2.conf`
- Line 772: `[DEBUG] Dispatching UPDATE_FS`
- Line 775: `[DEBUG] No mutation needed...`
- Line 778: `[DEBUG] protocols directory not found or empty`

Keep line 158 (`if (isDevOverride) console.error('Zoxide load error:', err)`) — it is guarded by the `?debug=` URL param.

**Files:** `src/App.tsx`

---

## Task 2: Delete empty useEffect skeleton

```ts
// --- DEBUG: LOG PATH CHANGES ---
useEffect(() => {}, [gameState.currentPath, gameState.levelIndex]);
```

App.tsx line 347–348. The implementation was removed; the skeleton and comment were not. Delete both lines.

**Files:** `src/App.tsx`

---

## Task 3: Fix `any` types in dynamicGlitch.ts

Three `any` uses, all fixable with the correct DOM type:

```ts
// Before
if ((el as any).__dynamicGlitchApplied) return;
(el as any).__dynamicGlitchApplied = true;
export const triggerScreenShake = (element: any) => { ... }

// After
type GlitchElement = HTMLElement & { __dynamicGlitchApplied?: boolean };
// el parameter typed as GlitchElement in applyDynamicGlitch signature
export const triggerScreenShake = (element: HTMLElement) => { ... }
```

Remove the three `eslint-disable @typescript-eslint/no-explicit-any` comments that become unnecessary.

**Files:** `src/utils/dynamicGlitch.ts`

---

## Task 4: Document handleClipboard.ts suppressions

Two `eslint-disable @typescript-eslint/no-unused-vars` suppressions at lines 309 and 381 are **valid** — they discard transient search/clipboard properties (`displayPath`, `actualParentPath`, `path`) from clipboard nodes before writing to the filesystem. These properties must not persist. The suppressions lack a comment explaining why.

Add a one-line comment above each:

```ts
// Strip transient clipboard/search properties before writing to filesystem
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;
```

**Files:** `src/hooks/keyboard/handleClipboard.ts`

---

## Task 5: Move `window.__yaziQuestSkipIntroRequested` to a module-level flag

### Problem

`window.__yaziQuestSkipIntroRequested` is set by `BiosBoot.tsx` and `EpisodeIntro.tsx`, read by `createInitialState()` (before React exists) and by three `useEffect` hooks across two components. It never resets — a player who skips Episode 1 intro carries the flag into New Game+. It also requires a `declare global { interface Window { ... } }` augmentation in `types.ts`.

### Fix

New file `src/utils/skipIntroFlag.ts`:

```ts
let _requested = false;

export const setSkipIntroRequested = () => {
  _requested = true;
};
export const getSkipIntroRequested = () => _requested;
export const resetSkipIntroRequested = () => {
  _requested = false;
};
```

**Migration:**

- `BiosBoot.tsx`: replace `window.__yaziQuestSkipIntroRequested = true` with `setSkipIntroRequested()`
- `EpisodeIntro.tsx`: same replacement in the Skip button handler
- `App.tsx` (`createInitialState`): replace `window.__yaziQuestSkipIntroRequested === true` with `getSkipIntroRequested()`
- `App.tsx` (`handleSkip` callback): replace window write with `setSkipIntroRequested()`
- `App.tsx` (`handleRestartCycle`): add `resetSkipIntroRequested()` so New Game+ starts clean
- `App.tsx` (post-mount useEffect at line ~351): replace window read with `getSkipIntroRequested()`
- `BiosBoot.tsx` and `EpisodeIntro.tsx` useEffects: same replacement
- `types.ts`: remove the `declare global { interface Window { __yaziQuestSkipIntroRequested?: boolean } }` block

**Files:** `src/utils/skipIntroFlag.ts` (new), `src/App.tsx`, `src/components/BiosBoot.tsx`, `src/components/EpisodeIntro.tsx`, `src/types.ts`

---

## Task 6: Extract 14 useGlobalInput calls via GameInputContext

### Problem

App.tsx contains 14 inline `useGlobalInput` registrations (~500 lines) that close over App-local state: `gameState`, `dispatch`, `currentLevel`, computed values, and action callbacks. They cannot be extracted without either a 20-parameter interface or shared context.

### Design

**`src/contexts/GameInputContext.tsx`** — new file

Defines `GameInputContextValue` interface and `GameInputContext`. Exports:

- `GameInputContext` — the React context
- `useGameInputContext()` — throws if used outside provider
- `GameInputProvider` — wrapper component (optional; App may use `GameInputContext.Provider` directly)

Context value type:

```ts
interface GameInputContextValue {
  // Core state
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
  // Derived values (computed in App before provider)
  currentLevel: Level;
  isLastLevel: boolean;
  visibleItems: FileNode[];
  currentItem: FileNode | undefined;
  parent: FileNode | null;
  // Action callbacks (useCallback in App)
  advanceLevel: () => void;
  handleRenameConfirm: (name: string) => void;
  handleInputConfirm: (name: string) => void;
  handleSearchConfirm: () => void;
  handleFuzzySelect: (item: FileNode) => void;
  handleBootComplete: (opts?: { isSkip?: boolean }) => void;
  // Keyboard handler callbacks (from useKeyboardHandlers)
  // Keyboard handler callbacks (from useKeyboardHandlers — exact signatures match those hooks)
  handleNormalModeKeyDown: (e: KeyboardEvent) => boolean | void;
  handleSortModeKeyDown: (e: KeyboardEvent) => void;
  handleConfirmDeleteModeKeyDown: (e: KeyboardEvent) => void;
  handleOverwriteConfirmKeyDown: (e: KeyboardEvent) => void;
  handleGCommandKeyDown: (e: KeyboardEvent) => void;
}
```

**`src/hooks/useAppInputHandlers.ts`** — new file

Reads from `GameInputContext` via `useGameInputContext()`. Registers all 14 `useGlobalInput` calls. Zero parameters at call site.

**`App.tsx` changes:**

1. Import `GameInputContext` and `useAppInputHandlers`
2. Assemble `contextValue` object from already-computed state and callbacks
3. Replace the 14 `useGlobalInput` blocks with `useAppInputHandlers()`
4. Wrap the JSX return in `<GameInputContext.Provider value={contextValue}>...</GameInputContext.Provider>`

**Target:** App.tsx from 2,065 → ~1,500 lines

**Files:** `src/contexts/GameInputContext.tsx` (new), `src/hooks/useAppInputHandlers.ts` (new), `src/App.tsx`

---

## Execution Order

| #   | Task                                   | Risk | Lines changed      |
| --- | -------------------------------------- | ---- | ------------------ |
| 1   | Delete [DEBUG] console.errors          | None | -10                |
| 2   | Delete empty useEffect                 | None | -2                 |
| 3   | Fix dynamicGlitch.ts any               | Low  | ~10                |
| 4   | Document handleClipboard suppressions  | None | +2                 |
| 5   | skipIntroFlag module                   | Low  | ~20 across 5 files |
| 6   | GameInputContext + useAppInputHandlers | High | ~-500 in App.tsx   |

Tasks 1–5 in a single session. Task 6 last — type-check and test after each step within it.

## Verification

```bash
npm run type-check   # zero errors
npm run lint         # zero warnings
npm test             # 121/121 pass
npm run build        # clean production build
```

Manual smoke: skip intro button works, New Game+ does not skip intro incorrectly.
