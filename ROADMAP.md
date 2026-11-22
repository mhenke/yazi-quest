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

- [ ] **Unit Tests for Game Logic**
  - **Current State:** Minimal unit tests (only `fsHelpers.test.ts` and `gameUtils.test.ts` found). Core keyboard handling logic lacks specific unit tests.
  - **Action:**
    - Expand `fsHelpers.test.ts` coverage.
    - Write unit tests for the extracted `handle*.ts` logic (mocking the `GameState` and events).
  - **Benefit:** Fast feedback loop for complex logic (like level 13 node syncing or sorting algorithms).

- [ ] **Strict State Transitions (State Machine Lite)**
  - **Current State:** `mode` is a string. Transitions happen ad-hoc (`dispatch({ type: 'SET_MODE', mode: 'search' })`).
  - **Action:**
    - Define valid transitions. Can we go from `search` to `sort`?
    - Implement a guard function: `transition(currentMode, nextMode)`.
  - **Benefit:** Prevents invalid states (e.g., opening a modal while in a blocking cutscene).

## 🔮 Future Improvements: Modernization (Phase 3)

**Goal:** enhance developer experience and long-term maintainability.

- [ ] **Type-Safe `useReducer` Migration**
  - **Current State:** `useReducer` is partially implemented but state transitions lack formal validation. Deep object merging still occurs in some places.
  - **Action:** Enhance `gameReducer` with comprehensive state transition validation and stricter typing.
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

### ❌ Critical Gaps Identified:

1. **Missing Unit Tests**: No specific unit tests exist for the new keyboard handler modules (`handle*.ts` files). The codebase still relies primarily on E2E tests rather than fast unit tests for verifying complex logic.

2. **Weak State Machine**: No formal validation of state transitions exists. Modes can still be set ad-hoc without validating if the transition is legitimate (e.g., from `search` to `sort`).

3. **Narrative Logic Coupling**: Some narrative triggers are still hardcoded inside input handlers rather than being separated into a dedicated system.

### Recommendations:

1. **Testing**: Add unit tests for the keyboard handler modules to enable faster verification of complex logic.
2. **State Validation**: Introduce formal state transition validation to prevent invalid mode combinations.
3. **Narrative Separation**: Consider moving narrative triggers to a separate engine that observes state changes.

## 🧪 Test Status

| Suite      | Status  | Notes                                        |
| :--------- | :------ | :------------------------------------------- |
| Type-check | ✅ Pass | No type errors detected                      |
| Build      | ✅ Pass | Production build successful                  |
| E2E        | ✅ Pass | 74/75 tests passing (1 flaky test remaining) |

## 📋 Recent Completed Work

| Item                           | Status  | Notes                                                          |
| :----------------------------- | :------ | :------------------------------------------------------------- |
| **Filter Input Fix**           | ✅ Done | Input field now properly displays typed text and doesn't flash |
| **Input Modal Event Handling** | ✅ Done | InputModals now properly stop propagation for all keys         |
| **Input Mode Key Propagation** | ✅ Done | Main keyboard handler no longer interferes with input modes    |
| **Centralized Input Arbiter**  | ✅ Done | Implemented GlobalInputContext to resolve race conditions      |
