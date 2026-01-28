# Yazi Quest: Architectural Roadmap & Technical Debt Plan

Based on the [Architectural Analysis](ARCHITECTURAL_ANALYSIS.md) and current source code state, this roadmap outlines the steps to stabilize, refactor, and modernize the codebase.

## 🚨 Critical Priority: Stabilization (Phase 1)

**Goal:** Eliminate race conditions and inconsistent input handling that causes "stuck" states or double-firing events.

- [ ] **Centralize Input Handling (The "Arbiter" Pattern)**
  - **Current State:** `App.tsx`, `HelpModal.tsx`, `LevelProgress.tsx` all attach independent `keydown` listeners.
  - **Action:**
    - Create a custom hook `useGlobalInput` or explicit context that serves as the _single source of truth_.
    - Refactor Modals (`HelpModal`, `HintModal`) to **not** attach their own listeners. Instead, `App.tsx` should dispatch events to them or they should consume a shared event stream.
    - **Alternative:** Use a "Stack" approach where mounting a modal pushes it to the top of the Input Stack, blocking the layer below.
  - **Benefit:** Fixes the "I pressed Escape but the game triggered search AND closed the modal" bugs.

- [ ] **Fix "God Object" `handleNormalMode.ts`**
  - **Current State:** 800+ lines mixing navigation, clipboard logic, honeypot detection, and narrative thoughts.
  - **Action:**
    - Split into cohesive sub-handlers:
      - `handleNavigation.ts` (j, k, arrows, G, gg)
      - `handleClipboard.ts` (x, y, p, P)
      - `handleSystemParams.ts` (., Z, z)
      - `handleNarrativeTriggers.ts` (Level 11 scouting, Level 13 syncing)
  - **Benefit:** Easier testing and less risk of breaking one feature while fixing another.

## 🛠 High Priority: Resilience & Testing (Phase 2)

**Goal:** Ensure heavy game logic is verified by fast unit tests, not just slow E2E tests.

- [ ] **Unit Tests for Game Logic**
  - **Current State:** Minimal unit tests (only `fsHelpers.test.ts` found). Core logic is mostly tested via E2E.
  - **Action:**
    - Expand `fsHelpers.test.ts` coverage.
    - Write unit tests for the extracted `handle*.ts` logic (mocking the `GameState` and events).
  - **Benefit:** Fast feedback loop for complex logic (like level 13 node syncing or sorting algorithms).

- [ ] **Strict State Transitions (State Machine Lite)**
  - **Current State:** `mode` is a string. Transitions happen ad-hoc (`setGameState({ mode: 'search' })`).
  - **Action:**
    - Define valid transitions. Can we go from `search` to `sort`?
    - Implement a guard function: `transition(currentMode, nextMode)`.
  - **Benefit:** Prevents invalid states (e.g., opening a modal while in a blocking cutscene).

## 🔮 Future Improvements: Modernization (Phase 3)

**Goal:** enhance developer experience and long-term maintainability.

- [ ] **Type-Safe `useReducer` Migration**
  - **Current State:** `useState` with deep object merging (`...prev, ...updates`). Very error-prone.
  - **Action:** Migrate `GameState` management to `useReducer`.
  - **Benefit:** Atomic updates, clearer intent, easier logging of state changes (time-travel debugging).

- [ ] **Narrative & Logic Separation**
  - **Current State:** "Thoughts" and narrative triggers are hardcoded inside input handlers (e.g., Level 11 logic in `handleNormalMode`).
  - **Action:** Move narrative triggers to a separate `NarrativeEngine` or `ScriptSystem` that observes state changes.
  - **Benefit:** Writers can tweak dialogue/thoughts without touching input handling code.
