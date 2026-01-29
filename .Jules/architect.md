# Architect's Journal

## 2025-01-25 - Refactoring `useKeyboardHandlers.ts`
**Learning:** `useKeyboardHandlers.ts` was a "God Object" mixing UI logic, state management, and complex game mechanics (like Honeypots and Level constraints).
**Action:** Splitting by "Mode" (Normal, Sort, Delete, etc.) proved to be the most natural seam because the keyboard handler delegates based on the current mode. This pattern (Strategy Patternish) works well for state-machine-like inputs.

**Verification:** Ran full E2E test suite (71 tests) to ensure no regressions in game mechanics or navigation.

## 2025-01-26 - Centralizing Input Handling (The Arbiter Pattern)
**Learning:** Attaching independent `keydown` listeners in multiple components (`App`, `SuccessToast`, `EpisodeIntro`, etc.) created uncontrollable race conditions. React's event bubbling is not sufficient when multiple modals need to "swallow" global inputs (like Escape or Enter).
**Action:** Implemented a **Global Input Arbiter** (`GlobalInputContext`).
- A single `window.addEventListener` manages all keyboard events.
- Handlers register with a **Priority** (System=2000, Modals=500, Game=0).
- High-priority handlers can return `true` to consume the event, preventing it from reaching lower layers.
- This effectively creates a "Input Stack" where the top-most active UI element (e.g., a Modal) naturally blocks the underlying Game Loop without complex `if (!paused)` checks scattered everywhere.

**Verification:** E2E tests (`dialogs.spec.ts`) verified that Modals close correctly without triggering background search actions.
