# Yazi Quest E2E Test Debugging Playbook

This document contains a set of rules and patterns for diagnosing and fixing E2E tests. Each rule is formatted as an actionable instruction for a developer or AI assistant.

---

## 1. Locator & Selector Strategies

### Rule 1.1: Prefer `data-testid` for exact matches.

- **IF** a test fails with a "strict mode violation" (e.g., resolved to 2 elements).
- **THEN** the locator is too broad and matching multiple elements (e.g., `uplink_v1.conf` and `uplink_v1.conf.snapshot`).
- **DO** use `getByTestId('file-<filename>')` for an unambiguous, exact match. Update helpers like `filterAndSelect` to support an `exact: true` option that uses this strategy.
- **AVOID** relying on `hasText` or regexes for exact matches, as they can be brittle.
- **EXAMPLE**:
  ```typescript
  // In a test helper like filterAndSelect
  if (options.exact) {
    target = page.getByTestId(`file-${filterText}`);
  } else {
    target = page.locator('[role="listitem"]', { hasText: filterText });
  }
  // In a test file
  await filterAndSelect(page, 'uplink_v1.conf', { exact: true });
  ```

### Rule 1.2: Use case-insensitive regex for general text matching.

- **IF** a test fails to find an element by its text content (e.g., `getByText('Watchdog:')`).
- **THEN** the cause is likely a case-sensitivity mismatch due to CSS styling or content changes.
- **DO** use a case-insensitive regex (`/text/i`) to locate the element.
- **AVOID** matching exact strings with punctuation unless it's necessary for specificity.
- **EXAMPLE**:
  ```typescript
  // ❌
  await expect(page.getByText('Watchdog:')).toBeVisible();
  // ✅
  await expect(page.getByText(/watchdog/i)).toBeVisible();
  ```

### Rule 1.3: Do not chain `getByText` after `getByTestId` for content checks.

- **IF** a test fails with `element not found` on a chained `getByText` call.
- **THEN** the component's structure has likely been flattened (e.g., `<div><span>Text</span></div>` becomes `<div>Text</div>`).
- **DO** use `toHaveText` directly on the parent locator.
- **AVOID** creating brittle tests that depend on a specific DOM hierarchy.
- **EXAMPLE**:
  ```typescript
  // ❌
  await expect(page.getByTestId('foo').getByText(/bar/)).toBeVisible();
  // ✅
  await expect(page.getByTestId('foo')).toHaveText(/bar/);
  ```

### Rule 1.4: Use robust navigation helpers instead of blind key presses.

- **IF** a test fails to enter a directory or select the correct file.
- **THEN** it's likely assuming a specific sort order and using blind navigation (e.g., `navigateDown(2)`).
- **DO** use robust helpers like `filterAndSelect('filename')` which explicitly target items by name.
- **AVOID** sequences like `j`, `j`, `l` that are not resilient to changes in file order.
- **EXAMPLE**:
  ```typescript
  // ❌
  await gotoCommand(page, 'w');
  await navigateDown(page, 2); // Assumes 'systemd-core' is the 3rd item
  await navigateRight(page, 1);
  // ✅
  await gotoCommand(page, 'w');
  await filterAndSelect(page, 'systemd-core'); // Robustly finds and selects
  await navigateRight(page, 1);
  ```

### Rule 1.5: Make path assertions specific.

- **IF** a test for the root directory (`/`) incorrectly passes when viewing a subdirectory (e.g., `~/datastore`).
- **THEN** the assertion is likely using `toContainText`, which is too permissive.
- **DO** create or use an assertion helper (`expectCurrentDir`) that supports an `exact: true` option, which uses `toHaveText` for strict checks.
- **AVOID** changing all path assertions to be strict, as this will break tests that correctly rely on partial matches.
- **EXAMPLE**:
  ```typescript
  // In utils.ts
  export async function expectCurrentDir(page: Page, dirName: string, exact: boolean = false) {
    const locator = page.locator('.breadcrumb');
    if (exact) {
      await expect(locator).toHaveText(dirName);
    } else {
      await expect(locator).toContainText(dirName);
    }
  }
  // In test file for root
  await expectCurrentDir(page, '/', true);
  ```

---

## 2. Timing, Race Conditions, and Asynchronous Operations

### Rule 2.1: Add delays after actions that close modals.

- **IF** a test fails, asserting that an input modal is still visible after the confirmation "Enter" press.
- **THEN** the test is faster than React's state update and re-render cycle.
- **DO** add a standard, small delay (`await page.waitForTimeout(DEFAULT_DELAY)`) in helper functions (`addItem`, `renameItem`) immediately after the action that closes the modal.
- **AVOID** making assertions immediately after a state-changing action.
- **EXAMPLE**:
  ```typescript
  // In addItem/renameItem helpers
  await page.keyboard.press('Enter');
  await page.waitForTimeout(DEFAULT_DELAY); // Give React time to update
  await expect(modal).not.toBeVisible();
  ```

### Rule 2.2: Wait for input modals to be visible before interaction.

- **IF** a test fails to type a search or filter query correctly.
- **THEN** the test is likely trying to type before the input modal is rendered and focused.
- **DO** explicitly assert the visibility of the input modal (`expect(page.getByTestId('input-modal')).toBeVisible()`) before attempting to type in it.
- **AVOID** assuming modals appear instantly after a key press.
- **EXAMPLE**:
  ```typescript
  // ❌
  await pressKey(page, 's');
  await typeText(page, 'query');
  // ✅
  await pressKey(page, 's');
  await expect(page.getByTestId('input-modal')).toBeVisible();
  await typeText(page, 'query');
  ```

### Rule 2.3: Use robust waits for level/mission transitions.

- **IF** a test fails with "Timeout waiting for mission complete".
- **THEN** a hardcoded, aggressive timeout (e.g., 500ms) is likely too short for the transition to complete on all environments.
- **DO** use Playwright's default timeout or a generous standard delay. In `waitForMissionComplete`, `Promise.race` is used to wait for either a visibility change or a URL change, which is a robust pattern.
- **AVOID** custom, short timeouts on critical state transitions.

### Rule 2.4: Explicitly dismiss security modals before final assertions.

- **IF** `waitForMissionComplete` times out, but a screenshot shows a "Protocol Violation" or "Security Alert" modal.
- **THEN** the alert modal is blocking the "Mission Complete" screen.
- **DO** explicitly call `await dismissAlertIfPresent(page, /Protocol Violation/i)` in the test script immediately before the final wait.
- **AVOID** relying on a single, blind `Shift+Enter` or hoping the `waitFor` utility will handle it.

### Rule 2.5: Investigate silent errors before increasing timeouts.

- **IF** a test fails because an element does not become visible, and increasing the timeout does not help.
- **THEN** the timeout is a **red herring**. The true cause is likely a silent JavaScript error that occurs during a React re-render, which halts rendering and prevents the UI from ever appearing.
- **DO** modify the failing test to capture browser console output and inspect it for uncaught exceptions.
- **AVOID** reflexively increasing timeouts. Treat a timeout failure as a potential symptom of a runtime error.
- **EXAMPLE**:

  ```typescript
  test('UI Bar Visibility', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(msg.text()));

    // ... test steps that lead to the failure ...

    // Before the failing assertion, save the logs for inspection
    const fs = require('fs');
    fs.writeFileSync('console.log', messages.join('\n'));

    await expect(page.getByTestId('status-bar')).toBeVisible();
  });
  ```

---

## 3. State Management & Game Logic

### Rule 3.1: Use explicit action flags for race-prone task checks.

- **IF** a task check is failing due to a race condition (e.g., checking `searchQuery === null` immediately after an `Escape` key press).
- **THEN** the check is based on transient state that hasn't updated before the assertion runs.
- **DO** create and dispatch an explicit action flag (e.g., `MARK_ACTION_USED` with `actionId: 'SearchCleared'`). The task check should then verify `actionsUsed.has('SearchCleared')`, which is a durable state change.
- **AVOID** basing task completion on intermediate UI state during a rapid sequence of events.

### Rule 3.2: Ensure handlers dispatch action flags.

- **IF** a task fails to complete even though the action (e.g., deleting a file) was visibly performed.
- **THEN** the action handler likely updated the primary state (e.g., the filesystem) but forgot to set the tracking flag (e.g., `usedD: true`).
- **DO** audit the relevant action handler in the game's source code (e.g., `confirmDelete` in `useKeyboardHandlers.ts`) and ensure it dispatches the appropriate `MARK_ACTION_USED` or sets the flag in the reducer.

### Rule 3.3: Reset level-specific state on level transitions.

- **IF** a level or task completes instantly upon entry.
- **THEN** state from a previous test run is leaking into the new level.
- **DO** ensure the `SET_LEVEL` action in the game's reducer has a comprehensive reset block that explicitly clears all task-tracking booleans (`usedCtrlR`, `usedSearch`, `actionsUsed`, etc.).

### Rule 3.4: Preserve cursor position across list mutations.

- **IF** an action after filtering or searching affects the wrong item (e.g., cutting the first item in the list instead of the previously selected one).
- **THEN** the `cursorIndex` was not correctly updated after the list of files changed.
- **DO** implement logic in the reducer (`CLEAR_FILTER`, `CONFIRM_SEARCH`) to: 1) Save the `id` of the selected item. 2) Re-calculate the file list. 3) Find the item's new index in the new list and update `cursorIndex`.

### Rule 3.5: Check against the correct view context.

- **IF** a task requires finding a file, the file is visible in the search results, but the task does not complete.
- **THEN** the task's completion logic likely requires the user to be _in the file's directory_, not in the search results view.
- **DO** read the task description carefully. If it implies navigation, use navigation helpers (`gotoCommand`, `enterDirectory`) instead of search (`s`).

---

## 4. Test Environment & Configuration

### Rule 4.1: Ensure filesystem prerequisites are met.

- **IF** a test fails with `element not found` when it expects a certain file or directory to exist.
- **THEN** the test might be jumping to a level without creating the necessary file structure that would have been built in previous levels.
- **DO** ensure the level's `onEnter` function in `constants.tsx` calls a seeding utility (e.g., `applyFileSystemMutations`) that creates the required files/directories for that level.
- **AVOID** assuming the `INITIAL_FS` is sufficient for all levels.

### Rule 4.2: Use URL parameters to force deterministic scenarios.

- **IF** a test for a multi-scenario level (like Level 12) is flaky or fails inconsistently.
- **THEN** the game might be activating an unexpected scenario based on leftover state.
- **DO** use a URL parameter (e.g., `?scenario=scen-b1`) in the `startLevel` helper to force a specific, deterministic scenario for the test. Ensure the game logic in `constants.tsx` prioritizes URL parameters over any `gameState` flags.

### Rule 4.3: Use `domcontentloaded` for URL navigation.

- **IF** a test that navigates via URL (`goToLevel`) is flaky and times out on `page.waitForLoadState('networkidle')`.
- **THEN** background network traffic is preventing `networkidle` from resolving reliably.
- **DO** use `domcontentloaded` as the wait strategy, which is faster and less brittle. Follow it with assertions that wait for specific UI elements to appear.
- **AVOID** `networkidle`.

### Rule 4.4: Test validity requirement

- **IF** running any test for validation or CI purposes.
- **THEN** the test must be run with a non-interactive reporter to ensure proper termination.
- **DO** use `--reporter=list` or similar non-interactive reporter when running tests. Example: `npm run test:e2e -- --reporter=list`
- **AVOID** running tests without specifying a reporter, as this can lead to hanging processes and invalid results.

---

## 5. Input & Event Handling

### Rule 5.1: Use Playwright's native keyboard API.

- **IF** key presses in a test seem to have no effect (e.g., `Escape` not closing a modal, `Ctrl+A` not selecting text in an input).
- **THEN** the test is likely using a synthetic `window.dispatchEvent`, which does not correctly simulate hardware events or handle focus.
- **DO** use `page.keyboard.press()` for all key press simulations. This is the most reliable method.
- **AVOID** custom `pressKey` helpers that use `dispatchEvent`.
- **EXAMPLE**:
  ```typescript
  // ❌ In a helper
  // page.evaluate(key => window.dispatchEvent(new KeyboardEvent(...)), key);
  // ✅ In a helper
  await page.keyboard.press('Control+A');
  ```

### Rule 5.2: Stop event propagation in input modals.

- **IF** typing in a filter or search modal triggers main UI keyboard shortcuts (e.g., typing `s` opens another search).
- **THEN** key events from the input are bubbling up to the global keyboard handler.
- **DO** ensure the `onKeyDown` handler for the `InputModal` component calls `e.stopPropagation()` for all keys to prevent them from reaching other listeners.

### Rule 5.3: Escape special characters in regex patterns.

- **IF** a search or filter for a string with special characters (like `.`) returns unexpected or extra results.
- **THEN** the special characters are being interpreted as regex operators (e.g., `.` matches any character).
- **DO** ensure the input string is properly escaped before being used to construct a `RegExp`.
- **AVOID** passing raw user-provided strings into a `new RegExp()` constructor.
- **EXAMPLE**:
  ```typescript
  // ❌
  await search(page, '.identity.log.enc');
  // ✅
  await search(page, '\.identity\.log\.enc');
  ```
