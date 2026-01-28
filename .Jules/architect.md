# Architect's Journal

## 2025-01-25 - Refactoring `useKeyboardHandlers.ts`
**Learning:** `useKeyboardHandlers.ts` was a "God Object" mixing UI logic, state management, and complex game mechanics (like Honeypots and Level constraints).
**Action:** Splitting by "Mode" (Normal, Sort, Delete, etc.) proved to be the most natural seam because the keyboard handler delegates based on the current mode. This pattern (Strategy Patternish) works well for state-machine-like inputs.

**Verification:** Ran full E2E test suite (71 tests) to ensure no regressions in game mechanics or navigation.
