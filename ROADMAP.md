# Yazi Quest: Architectural Roadmap & Technical Debt Plan

Based on the [Architectural Analysis](ARCHITECTURAL_ANALYSIS.md) and current source code state, this roadmap outlines the steps to stabilize, refactor, and modernize the codebase.

## 🚨 Critical Priority: Stabilization (Phase 1)

**Goal:** Eliminate race conditions and inconsistent input handling that causes "stuck" states or double-firing events.

- [x] **Split Keyboard Handlers (Completed)**
  - **Status:** ✅ IMPLEMENTED - The original God Object `useKeyboardHandlers.ts` has been successfully split into specialized modules following the Strategy Pattern approach.
  - **Modules Created:** `handleNavigation.ts`, `handleClipboard.ts`, `handleSystemParams.ts`, `handleNarrativeTriggers.ts`, `handleSortMode.ts`, `handleDeleteMode.ts`, `handleGCommandMode.ts`, `handleHelpMode.ts`, `handleQuestMapMode.ts`, `handleOverwriteMode.ts`
  - **Benefit:** Reduced complexity in individual handlers and improved maintainability.

- [x] **Centralize Input Handling (The "Arbiter" Pattern)**
  - **Status:** ✅ IMPLEMENTED - Created `GlobalInputContext` and `useGlobalInput` hook.
  - **Approach:** Implemented a priority-based input stack. `App.tsx` and all overlay components (`SuccessToast`, `EpisodeIntro`, etc.) register handlers with specific priorities.
  - **Priorities:** System (2000), Boot/Intro (900-1000), Game Over (800), Success Toast (700), Alerts (600), Modals (500), Game Loop (0).
  - **Benefit:** Eliminated race conditions. Modals now reliably consume inputs (like Escape/Enter) without triggering game actions.

## 🛠 High Priority: Resilience & Testing (Phase 2)

**Goal:** Ensure heavy game logic is verified by fast unit tests, not just slow E2E tests.

- [x] **Unit Tests for Game Logic**
  - **Status:** ✅ IMPLEMENTED - 12 unit test suites with 122 passing tests (covering `gameReducer`, `fsHelpers`, fast-check property testing, consciousness, glitch effects, boot sequence, etc.).
  - **Benefit:** Fast feedback loop for complex logic (like level 13 node syncing or sorting algorithms).

- [x] **Strict State Transitions (State Machine Lite)**
  - **Status:** ✅ IMPLEMENTED - `GameState.mode` is a strict union of 19 literal mode types and handled via centralized reducer actions.
  - **Benefit:** Prevents invalid states (e.g., opening a modal while in a blocking cutscene).

## 🔮 Future Improvements: Modernization (Phase 3)

**Goal:** enhance developer experience and long-term maintainability.

- [x] **Type-Safe `useReducer` Migration**
  - **Status:** ✅ IMPLEMENTED - `useReducer(gameReducer)` is fully implemented with 30+ typed action types and dictionary lookups, and `setGameState` was removed.
  - **Benefit:** Atomic updates, clearer intent, easier logging of state changes (time-travel debugging).

- [ ] **Narrative & Logic Separation**
  - **Current State:** "Thoughts" and narrative triggers are still mixed with input handling logic in some handlers.
  - **Action:** Move narrative triggers to a separate `NarrativeEngine` or `ScriptSystem` that observes state changes.
  - **Benefit:** Writers can tweak dialogue/thoughts without touching input handling code.

## 📊 Audit Summary

### ✅ Implemented Improvements:

1. **Keyboard Handler Refactoring**: The original "God Object" `useKeyboardHandlers.ts` has been successfully split into specialized modules following the Strategy Pattern approach mentioned in the architect's journal.
2. **Modular Design**: Created specific handlers for different modes (navigation, clipboard, system params, etc.)
3. **Filter Input Fix**: Resolved issues with filter input not displaying typed text and UI flashing during typing.
4. **Unit Tests for Game Logic**: 12 unit test suites with 122 passing tests covering game logic, helpers, and narrative effects.
5. **Strict State Transitions**: `GameState.mode` is a strict union of 19 literal mode types handled via centralized reducer actions.
6. **Type-Safe useReducer Migration**: Fully migrated to `useReducer(gameReducer)` with 30+ typed action types and dictionary lookups; `setGameState` removed.

### ❌ Remaining Gaps Identified:

1. **Narrative Logic Coupling**: Some narrative triggers are still hardcoded inside input handlers rather than being separated into a dedicated system.

### Recommendations:

1. **Narrative Separation**: Consider moving narrative triggers to a separate engine that observes state changes.

## 🧪 Test Status

| Suite      | Status  | Notes                             |
| :--------- | :------ | :-------------------------------- |
| Type-check | ✅ Pass | Pass                              |
| Build      | ✅ Pass | Pass                              |
| Unit       | ✅ Pass | 12 test suites, 122 tests passing |
| E2E        | ✅ Pass | 110 tests across 16 spec files    |

## 📋 Recent Completed Work

| Item                           | Status  | Notes                                                          |
| :----------------------------- | :------ | :------------------------------------------------------------- |
| **Filter Input Fix**           | ✅ Done | Input field now properly displays typed text and doesn't flash |
| **Input Modal Event Handling** | ✅ Done | InputModals now properly stop propagation for all keys         |
| **Input Mode Key Propagation** | ✅ Done | Main keyboard handler no longer interferes with input modes    |
| **Centralized Input Arbiter**  | ✅ Done | Implemented GlobalInputContext to resolve race conditions      |
