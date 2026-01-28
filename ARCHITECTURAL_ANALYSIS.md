# Architectural Analysis: Keyboard Input Handling

## 🔍 Contradictions & Areas of Disagreement

### 1. Split Control & Race Conditions
**Observation:** `App.tsx` attaches a global `window.addEventListener('keydown')` handler to manage game state modes (`normal`, `sort`, `delete`, etc.). However, multiple UI components (`LevelProgress`, `HelpModal`, `HintModal`, `SuccessToast`) **also** attach their own global `keydown` listeners.
**Contradiction:** There is no centralized arbiter of "who consumes the event". `App.tsx` attempts to block keys when modals are open (e.g., `if (gameState.showHelp)... return`), but the `HelpModal` itself is also listening. This creates a race condition where the order of execution depends on React's mount order and event bubbling, which is fragile.
**Best Practice Violation:** "Single Source of Truth" for input handling is violated.

### 2. Mode Management Logic
**Observation:** `App.tsx` contains a massive `switch(gameState.mode)` block. The recent refactoring moved the *logic* of these cases to `src/hooks/keyboard/`, but the *orchestration* still lives in `App.tsx` inside a `useEffect`.
**Gap:** The state transitions are implicit. For example, `handleGCommandKeyDown` sets `mode: 'normal'` to exit, but there is no explicit state machine defining that `g-command` -> `normal` is a valid transition while `g-command` -> `sort` is not.
**Risk:** It is easy to set invalid states (e.g., stuck in `search` mode while `isGameOver` is true) because the validation logic is scattered across conditional checks in `App.tsx` and the handlers.

### 3. "God Object" Tendencies in `handleNormalMode.ts`
**Observation:** While `useKeyboardHandlers` was split, `handleNormalMode.ts` remains a large file (~400 lines) that mixes:
- Navigation (`j`, `k`)
- Selection (`x`, `space`)
- Clipboard operations (`p`, `y`)
- Game mechanics (Honeypot detection, Level 13 node syncing)
- UI toggles (`Tab`, `.`)
**Critique:** This module still has low cohesion. Navigation logic has little to do with Honeypot detection logic, yet they reside in the same `switch` statement.

## ⚠️ Gaps & Missing Understanding

1.  **Unit Tests for New Modules:** The refactoring created `handle*.ts` files, but no specific unit tests were added for them. We rely entirely on E2E tests (`mechanics.spec.ts`). This makes it hard to test edge cases (like specific Level 13 node syncing) without running the full game.
2.  **Type Safety for `setGameState`:** The handlers receive `setGameState` and perform deep merges manually (e.g., `...prev, ...updates`). This is error-prone. A specialized reducer or action dispatch system would be safer.

## 💡 Contrarian & Alternative Approaches

### A. The "Command Pattern" (Decoupling Input from Action)
Instead of hardcoding keys to logic (e.g., `if (key === 'j') moveDown()`), we could separate them:
1.  **Input Map:** `Key 'j' -> Action 'NAV_DOWN'`
2.  **Command Handler:** `execute(NAV_DOWN, state)`
**Benefit:** Keybindings become configurable (accessibility). Logic becomes testable without mocking KeyboardEvents.

### B. Finite State Machine (XState)
**Approach:** Define the game states formally (Normal, Input, Modal, Locked).
**Benefit:** "Impossible states" become unrepresentable. For example, you cannot receive a `SORT` event while in `LOCKED` state. This eliminates the need for the complex `if (isGamePaused)` checks scattered in `App.tsx`.

### C. React Context for Input Management
**Approach:** Create a `<InputProvider>` that captures `keydown` once. Components "subscribe" to contexts or register themselves as "active consumers" (like a stack).
**Benefit:** Solves the race condition. If `HelpModal` is mounted, it pushes itself to the input stack, blocking `App.tsx` from receiving events automatically.

## ✅ Recommendation
1.  **Short Term:** Centralize input handling. Remove `keydown` listeners from child components and have `App.tsx` pass down explicit props (e.g., `onClose`) or dispatch actions.
2.  **Long Term:** Implement a Reducer or State Machine to manage `GameState` transitions safely, removing the `setGameState` dependency from handlers.
