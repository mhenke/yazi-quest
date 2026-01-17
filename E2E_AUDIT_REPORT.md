# E2E Test Suite Audit & Refactoring Plan

This document outlines a senior-level audit of the Yazi Quest E2E test suite. The goal is to improve stability, reduce maintenance overhead, and ensure comprehensive test coverage.

## 1. Executive Summary

The E2E suite currently consists of tests for Episodes 1, 2, and 3. While baseline functionality is covered, several issues were identified that lead to instability and maintenance challenges:

- **Test Gaps:** Critical levels, notably 14 and 15, are either missing tests or have them skipped.
- **Brittleness:** Many tests rely on hardcoded navigation (`navigateDown`) or arbitrary `waitForTimeout` calls, making them susceptible to failures from minor UI or data changes.
- **Duplication (Not DRY):** The tests for Level 12's multiple scenarios contain significant duplicated code for setup and execution, making them difficult to maintain.
- **Inconsistency:** Helper functions and interaction patterns are not used consistently across the suite, as demonstrated by the recent failures in Levels 6, 9, and 12.

This refactoring plan addresses these issues systematically to create a robust and reliable test suite.

## 2. Key Findings & Improvement Areas

### 2.1. Test Gaps

- **Level 14 (EVIDENCE PURGE):** There is currently no E2E test for this level in `episode3.spec.ts`. This is a critical gap as it tests permanent deletion (`D`) and complex sequencing.
- **Level 15 (TRANSMISSION PROTOCOL):** The test for this final level is skipped (`test.skip`). It needs to be reviewed, fixed, and re-enabled to ensure the game's conclusion is testable.

### 2.2. Code Brittleness & Inconsistency

- **Hardcoded Navigation:** Several tests use `navigateDown(page, count)` instead of the more robust `filterAndNavigate(page, 'name')`. This pattern caused the recent failure in Level 10 and should be eradicated.
- **Inconsistent Helpers:** The `utils.ts` file provides helpers like `ensureCleanState` and `filterAndNavigate` that are not used consistently. All tests should be audited to use these standard helpers where applicable.
- **Manual Key-Presses:** Many tests still use `page.keyboard.press('...')` instead of the standardized `pressKey(page, '...')` helper, which includes a built-in delay for stability.

### 2.3. Duplication (DRY Violations)

- **Level 12 Scenarios:** The tests for `scen-a1`, `scen-a2`, `scen-a3`, `scen-b1`, `scen-b2`, and `scen-b3` in `episode3.spec.ts` share a large amount of boilerplate code for navigating to the level, handling threats, and running the core mission. The existing `runLevel12Mission` helper is a good start, but more can be done to consolidate the threat-handling logic.

## 3. Proposed Refactoring Plan

This plan will be executed in phases to ensure stability at each step.

### Phase 1: Consolidate and Stabilize Utilities (Completed)

- **Action:** Refactor `tests/e2e/utils.ts` to standardize delays and navigation helpers.
- **Status:** **DONE**. This was the initial (though flawed) step taken.

### Phase 2: Systematically Eliminate Brittleness

- **Action:** Audit all `spec.ts` files and replace every instance of brittle navigation with robust helper functions.
  - Replace `navigateDown(page, count)` with `filterAndNavigate(page, 'name')`.
  - Replace manual `page.keyboard.press(...)` with `pressKey(...)` or `typeText(...)`.
  - Remove unnecessary `waitForTimeout` calls in favor of the default delay in `pressKey`.
- **File Targets:** `episode1.spec.ts`, `episode2.spec.ts`, `episode3.spec.ts`.

### Phase 3: Refactor Level 12 Tests for DRY Principle

- **Action:** Create a new, higher-level helper function, e.g., `runLevel12Scenario(page, { scenario, threatFile, threatLocation })`. This function would encapsulate:
  1.  Navigating to the correct scenario URL.
  2.  Handling the initial threat alert.
  3.  Navigating to the threat file's location (`threatLocation`).
  4.  Deleting the `threatFile`.
  5.  Running the core `runLevel12Mission`.
- **Benefit:** This will reduce the six separate tests to six single-line calls to the new helper, dramatically improving readability and maintainability.

### Phase 4: Fill Test Gaps

- **Action 1:** Implement the E2E test for **Level 14: EVIDENCE PURGE**. This test will follow the objectives defined in `constants.tsx` (create decoys, permanently delete visible directories, then permanently delete `.config`).
- **Action 2:** Un-skip, debug, and fix the test for **Level 15: TRANSMISSION PROTOCOL**. This will involve analyzing why it was skipped and ensuring it runs reliably.

### Phase 5: Final Review and Verification

- **Action:** Run the entire E2E test suite (`npx playwright test tests/e2e/`) to confirm all tests pass reliably.
- **Goal:** A clean test run with no failures or flaky tests.

By following this plan, we will elevate the E2E test suite to a professional standard, ensuring it is a reliable asset for future development rather than a source of friction.
