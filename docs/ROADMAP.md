# Yazi Quest — Development Roadmap

> Living document tracking completed work and planned enhancements.

---

## 📊 Executive Summary (2026-01-28)

**This session delivered the Input Handling Refactoring & Stabilization:**

1. **Centralized Input Handling** — Removed dedicated `keydown` listeners from modals (Help, Quest Map, Hint) and centralized them in `App.tsx` state management.
2. **Keyboard Handler Refactoring** — Split the "God Object" `handleNormalMode.ts` into specialized sub-handlers (`handleNavigation`, `handleClipboard`, `handleSystemParams`, `handleNarrativeTriggers`).
3. **Logic Stabilization** — Resolved multiple E2E regressions including filter-clearing bugs, incorrect narrative thought triggers, and missing clipboard abort handlers.
4. **Verified Performance** — Achieved 75/75 E2E test pass rate across all episodes.

---

## ✅ Completed (Recent)

| Item                           | Status  | Notes                                                          |
| :----------------------------- | :------ | :------------------------------------------------------------- |
| **Centralize Input Handling**  | ✅ Done | Removed `useEffect` key listeners from UI components.          |
| **Split Normal Mode Handlers** | ✅ Done | Extracted movement, clipboard, and system/narrative logic.     |
| **Filter Logic Fix**           | ✅ Done | Escape now correctly clears directory-specific filters.        |
| **Narrative Gating Fix**       | ✅ Done | Corrected level-specific triggers for thoughts (L5/L11 fixes). |
| **Clipboard Abort Logic**      | ✅ Done | Restored `Shift+Y` functionality for aborting operations.      |

---

## 📋 Backlog (Prioritized)

### High Priority

| Item                         | Estimate | Notes                                                                                        |
| :--------------------------- | :------- | :------------------------------------------------------------------------------------------- |
| **Formalized State Reducer** | 1 week   | Replace `setGameState` with `useReducer` to enforce valid state transitions and type safety. |
| **Unit Tests for Handlers**  | 3 days   | Add Vitest unit tests for the newly extracted `src/hooks/keyboard/` logic modules.           |
| **Command Pattern Refactor** | 1 week   | Decouple physical keypresses from logical actions to support rebindable keys.                |

### Medium Priority (Playtest-Gated)

| Item                             | Estimate | Trigger                                  |
| :------------------------------- | :------- | :--------------------------------------- |
| **Additional Twist Breadcrumbs** | 1 week   | Playtest confirms twist needs more setup |
| **System Broadcast UI**          | 3 days   | New component for diegetic admin alerts  |
| **System Broadcast UI**          | 3 days   | New component for diegetic admin alerts  |

### Low Priority (Backlog)

| Item                   | Estimate | Notes                                                                                                            |
| :--------------------- | :------- | :--------------------------------------------------------------------------------------------------------------- |
| **Filesystem Pruning** | 2 weeks  | Improve realism by removing depth-for-depth's sake and unnecessary files/folders, but keeping narrative clutter. |

---

## ❌ Out of Scope

- More levels (15 is fixed)
- Multiplayer/leaderboards
- Mobile support
- Procedural content
- Filesystem Flattening (Unrealistic for simulation)

---

## 🧪 Test Status

| Suite      | Last Run   | Result                                        |
| :--------- | :--------- | :-------------------------------------------- |
| Type-check | 2026-01-21 | ✅ Pass                                       |
| Build      | 2026-01-21 | ✅ Pass                                       |
| E2E        | 2026-01-21 | ✅ Pass (All Episode 3/Mastery tests passing) |

---

_Last updated: 2026-01-21_
