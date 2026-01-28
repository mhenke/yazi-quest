Test Failure Patterns & Anti-Patterns
Documenting common pitfalls and patterns observed while fixing E2E tests for Yazi Quest.

1. Locator Fragility (DOM Flattening)
   Symptom: element(s) not found when using chained getByText. Cause: Refactoring often flattens component structures.

Before: <div data-testid="parent"><span>Text</span></div>
After: <div data-testid="parent">Text</div> Fix: Avoid chaining getByText on a getByTestId if checking content.
❌

expect(page.getByTestId('foo').getByText(/bar/)).toBeVisible()
✅

expect(page.getByTestId('foo')).toHaveText(/bar/) 2. Text Content Assumptions (Case Sensitivity)
Symptom: element(s) not found for text locators. Cause: UI changes to uppercase styling (CSS uppercase) or text rewrites.

Issue: Locator getByText('Watchdog:') fails against WATCHDOG or Watchdog. Fix: Use case-insensitive regex without strict punctuation unless necessary.
❌ getByText('Watchdog:')
✅ getByText(/WATCHDOG/i) 3. Strict Mode Violations
Symptom: strict mode violation: resolved to 2 elements. Cause: Generic terms appearing in multiple context (e.g., "WATCHDOG" in the status bar AND in the intro narrative or logs). Fix:

specific attributes: getByTestId('status-bar').getByText(...)
.first() if the first occurrence is consistently the target.
✅ getByText(/WATCHDOG/i).first() 4. Narrative Context Changes
Symptom: Expectation mismatch on Game Over screens. Cause: Game logic changes strings based on Level ID (Context-Aware).

Issue: Level 11 shows "IG KERNEL PANIC" instead of "HEURISTIC ANALYSIS COMPLETE". Fix: Check

constants.tsx
or component logic (

GameOverModal.tsx
) for level-specific conditional rendering. Do not assume strings are static literals across the entire game. 5. Task Logic Race Conditions
Symptom: Test expected 3/5 tasks, but got 4/5. Cause: Efficient test actions (automating input) can trigger multiple completion conditions faster than the game UI updates, or sequentially complete dependent tasks in one "tick" of the test logic.

Issue: "Select file" (Task A) + "Inspect file" (Task B). Doing both quickly means you never see the state where only Task A is done. Fix: Update test expectations to match the "bundled" state changes, or add delays if checking intermediate states is critical.

6. Navigation Fragility (Sort Order Assumptions)
   Symptom: Test fails to enter directory or opens wrong file. Cause: Using blind navigation (navigateRight(1) / 'l') assuming a specific sort order (e.g., "systemd-core" is first). If other files (like "notes.txt") sort alphabetically before it, the test fails.

Issue: 'workspace/' contains 'notes.txt' and 'systemd-core'. 'notes.txt' comes first in 'natural' sort (n < s).
Fix: Use robust navigation like enterDirectory('name') which uses explicit filtering to ensure the correct item is targeted regardless of sort order.
❌ await gotoCommand(page, 'w'); await navigateRight(page, 1);
✅ await gotoCommand(page, 'w'); await enterDirectory(page, 'systemd-core');

7. Missing Initial Filesystem Artifacts
   Symptom: Element(s) not found when tests expect specific files/directories to exist. Cause: Files or directories required for specific levels are not present in the initial filesystem state or are dynamically created only when entering specific levels.

Issue: Tests for Level 8 fail because '~/workspace/systemd-core' doesn't exist when jumping directly to the level. Similarly, Level 9 tests fail because 'system_monitor.pid' is not in '/tmp' when expected.
Fix: Ensure critical files/directories are present in the initial filesystem (INITIAL_FS) and marked as 'protected: true' to prevent accidental deletion. Remove dynamic creation logic from 'onEnter' functions when no longer needed.

- Add required directories/files to INITIAL_FS in constants.tsx
- Mark them as 'protected: true' to prevent user modification
- Remove redundant creation logic from level 'onEnter' functions
- Update ensurePrerequisiteState to not recreate files already in initial FS

8. Honeypot Alert Precedence
   Symptom: Selective guidance thoughts (from `useKeyboardHandlers`) are blocked by modal alerts (from `App.tsx`). Cause: Level-specific selection logic in `App.tsx` may trigger a `ThreatAlert` modal that traps focus/interaction before the narrative logic executes.

Issue: In Level 11, selecting a honeypot triggers a `ThreatAlert`. Test expectations for `expectNarrativeThought` fail because the alert prevents the final "cut/yank" action, or because the modal obscures the guidance.
Fix: Ensure tests handle and dismiss required alerts (`dismissAlertIfPresent`) before checking for narrative guidance. Align `App.tsx` global checks with specific episode narrative goals.

9. Z-Index Interference with Modal Backdrop Clicks
   Symptom: Modal backdrop clicks fail to close modals even though the modal is visible. Cause: Elements with higher z-index values intercept pointer events intended for modal backdrops.

Issue: LevelProgress component has a persistent header with z-[100] which is higher than modal backdrops (z-[95]). When trying to click on modal backdrops (HelpModal or QuestMapModal), clicks are intercepted by the LevelProgress header.
❌ await page.locator('[data-testid="help-modal"]').click({ position: { x: 10, y: 10 } });
❌ await page.mouse.click(10, 10); // Still intercepted by higher z-index elements
✅ await page.keyboard.press('Escape'); // Use keyboard shortcut instead of clicking backdrop
✅ await page.keyboard.press('Shift+Enter'); // Alternative keyboard shortcut

10. Regex Safety in Filter Implementation
    Symptom: ESLint security warnings for non-literal arguments to RegExp constructor. Cause: Direct user input passed to RegExp without validation creates potential ReDoS or injection vulnerabilities.

Issue: Using `new RegExp(filter, 'i')` with user-provided filter patterns triggers security/detect-non-literal-regexp warnings.
Fix: Implement safety validation to ensure only safe regex patterns are processed: - Validate pattern contains only safe characters: `/^[\w().|$^[\]*+?{} ]+$/i` - Use try/catch blocks to handle invalid regex gracefully - Fall back to simple substring matching for unsafe patterns - Maintain functionality while preventing security vulnerabilities

✅ // Safe implementation:
const isSafeRegex = /^[\w().|$^[\]*+?{} ]+$/i.test(filter);
if (isSafeRegex) {
try {
const regex = new RegExp(filter, 'i');
// Process with regex
} catch {
// Fallback to substring matching
}
} else {
// Use substring matching for unsafe patterns
}

11. Missing Prerequisite Logic in Level Definitions
    Symptom: Navigation commands (gw) seem to fail or stay at root. Cause: The target level's `onEnter` hook failed to call `ensurePrerequisiteState`, leaving the filesystem incomplete (missing directories like `systemd-core`).

    Issue: Level 8 expected `~/workspace/systemd-core` but didn't initialize it because `onEnter` only created `daemons`.
    Fix: Always call `ensurePrerequisiteState(fs, CURRENT_LEVEL)` in `onEnter` and ensure `ensurePrerequisiteState` covers the specific level's requirements (e.g. `if (targetLevelId >= 8)`).

    ✅
    onEnter: (fs) => {
    let newFs = ensurePrerequisiteState(fs, 8); // Added call
    // ...
    }

12. Missing Action Flags in State Updates
    Symptom: Task check requiring `c.usedD` or `c.usedP` fails even if the action is performed. Cause: The handler function (e.g., `confirmDelete`) updates the filesystem but forgets to set the tracking flag in `GameState`.

    Issue: Level 9 deleted junk files successfully but failed completion because `usedD` was false.
    Fix: Ensure all significant actions update their corresponding tracking flags in `setGameState`.

    ✅ usedD: true, // in confirmDelete

13. Incomplete Selection in Inversion Tests
    Symptom: "Delete Junk" tasks fail because valid files are deleted. Cause: When using "Select Keepers -> Invert -> Delete Junk" pattern, the test must select ALL keepers. If one is missed, Invert leaves it unselected (junk), and it gets deleted.

    Issue: Level 9 test missed `access_token.key`. Invert treated it as junk. It was deleted. Check failed.
    Fix: Verify the full list of "Files to Keep" and ensure the test selects them all before inverting.

14. Literal Character Escaping in Search/Filter Patterns
    Symptom: Search or filter returns more results than expected (e.g., 13 items instead of 1). Cause: The game treats search/filter input as regex patterns, so literal characters like periods (.) are interpreted as wildcards matching any character.

    Issue: Searching for '.identity.log.enc' matches files like 'aidentityblogcenc' because periods match any character.
    Fix: Escape literal periods with backslashes when using search/filter functionality in tests.

    ❌ await typeText(page, '.identity.log.enc'); // Periods match any character
    ✅ await typeText(page, '\\.identity\\.log\\.enc'); // Periods are literal

15. Search Results vs Directory View Task Completion
    Symptom: Task completion fails even when target file is found via recursive search. Cause: Task completion logic checks game state against actual directory path, not search results view.

    Issue: Using 's' (recursive search) finds the file but task doesn't complete because the game state isn't in the target directory.
    Fix: Either use direct navigation to the target directory or ensure the task completion logic works with search results context.

    ❌ // Using recursive search for task that requires being in specific directory
    await pressKey(page, 's');
    await typeText(page, 'target-file.txt');
    await pressKey(page, 'Enter');
    ✅ // Direct navigation to the directory containing the file
    await gotoCommand(page, 'w'); // Go to workspace
    await enterDirectory(page, 'subdir'); // Navigate to specific directory

16. Deterministic Scenario Forcing via URL Params
    Symptom: Level 12 tests fail inconsistently due to unexpected scenario activation.
    Cause: E2E tests for multi-scenario levels rely on specific state, but the game might prioritize saved session flags over URL parameters.
    Fix: In `constants.tsx`, ensure that manually passed URL parameters (`?scenario=scen-x`) always override `gameState` flags in onEnter/logic initializers.

17. Ghost Entries and Selection Loops
    Symptom: "Delete All" tasks fail because one matching instance of a file/dir remains.
    Cause: Bugs in virtual filesystem logic can cause duplicate entries. A single `filterAndSelect` targets only one.
    Fix: Use a counting loop in tests to detect and select _all_ matching elements (`data-testid^="file-..."`) before performing batch actions like Delete or Cut.

18. Auto-Dismissal of "Security" Modals in Missions
    Symptom: `waitForMissionComplete` timeouts because a "Protocol Violation" or "Security Alert" modal blocks the success screen.
    Cause: Final game actions (like exfiltrating core data) often trigger security alerts simultaneously with mission success.
    Fix: Update `waitForMissionComplete` to detect and dismiss (e.g. `page.keyboard.press('Shift+Enter')`) these modals if they appear during the wait window.

19. Removal of Unreliable Scroll Requirements
    Symptom: "Read File" tasks fail despite automated scrolling in the test.
    Cause: `previewScroll` depth thresholds (e.g. `>= 25`) are brittle for short content or different viewport resolutions.
    Fix: Remove numeric scroll requirements from completion checks in `constants.tsx` and rely on cursor placement as the primary completion trigger for stable E2E tests.

20. Synthetic Events vs Native Keyboard Press in Inputs
    Symptom: Tests fail to clear input fields using Ctrl+A + Backspace, resulting in appended text (e.g. "uplink_v1.confuplink_v2.conf") instead of replacement.
    Cause: Synthetic events dispatching `Ctrl+A` or `Meta+A` do not trigger the browser's native "Select All" behavior in input fields for security/sandboxing reasons.

    Issue: `pressKey(page, 'Ctrl+A')` dispatches a window event but doesn't select input text.
    Fix: Use Playwright's native `page.keyboard.press('Control+A')` which correctly simulates the hardware interaction.

    ❌ await pressKey(page, 'Ctrl+A'); // Synthetic dispatch
    ✅ await page.keyboard.press('Control+A'); // Native Playwright event

21. Flaky Search Input Interaction
    Symptom: Tests fail to type search queries correctly, often typing into the void or missing characters, causing "Search returning too many items" or "Item not found" errors.
    Cause: Tests assume the search input modal opens instantly after pressing 's', but rendering delays or race conditions can cause `typeText` to execute before focus is ready.
    Issue: `await pressKey(page, 's'); await typeText(page, 'identity');` fails if modal isn't ready.
    Fix: Explicitly assert visibility of the input modal before typing.

    ❌ await pressKey(page, 's'); await typeText(page, 'identity');
    ✅ await pressKey(page, 's'); await expect(page.getByTestId('input-modal')).toBeVisible(); await typeText(page, 'identity');

22. Insufficient Scroll for "Read File" Tasks
    Symptom: Tasks requiring "reading" a file (scrolling to the bottom) fail completion checks.
    Cause: The logical definition of "read" (e.g. `c.previewScroll >= 25`) might require more keystrokes than assumed, depending on the scroll increment per key press.
    Issue: Loop pressing `Shift+J` 10 times wasn't reaching the required scroll depth.
    Fix: Calculate the required iterations conservatively (e.g. increase to 15) and add minor delays to ensure the UI updates the scroll state between keypresses.

23. Missing State Updates in Action Handlers
    Symptom: Game logic checks for flags like `usedD` (Delete) or `usedP` (Paste) to verify task completion, but the test fails even after performing the action.
    Cause: The internal game hook might perform the file operation (updating FS) but fail to set the auxiliary state flag.
    Issue: `Level 14` require `usedD` for completion.
    Fix: Audit the action handlers (e.g. `confirmDelete` in `useKeyboardHandlers.ts`) to ensure they set the relevant state flags upon success.

24. Aggressive Timeouts on Final State Transitions
    Symptom: "Timeout waiting for mission complete" failures even when the mission seems to finish.
    Cause: Using `Promise.race` with a short, hardcoded timeout (e.g., 500ms) for critical transitions like "Mission Complete" is flaky on slower CI/local environments.
    Issue: `toBeVisible({ timeout: 500 })` is too aggressive for a major UI state change.
    Fix: Rely on Playwright's default timeout (usually 5s-30s) or use a standard `DEFAULT_DELAY` constant, avoiding tight custom timeouts for critical success paths.

### 25. Modal Overlay and Z-Index Conflicts (LevelProgress header vs. Dialogs)

- **Symptom**: A button (like "Map") opens a modal, but cannot close it by re-clicking because the modal's backdrop (or the modal itself) has a higher z-index than the button's parent container, making the button unclickable.
- **Root Cause**: The header container had `z-index: 150`, while the Quest Map modal backdrop had `z-index: 250`.
- **Fix**: Elevate the interactive container (header) to a higher z-index (e.g., `300`) than the modal overlays to ensure buttons remain interactive.

### 26. Modal Shortcut Toggle Logic vs. Hardcoded Visibility

- **Symptom**: Pressing a shortcut (e.g., `Alt+M`) opens a modal, but pressing it again fails to close it, even if the user expects toggle behavior.
- **Root Cause**: The keydown handler was hardcoded to `setGameState(p => ({ ...p, showMap: true }))` instead of toggling the state.
- **Fix**: Ensure meta-command shortcuts (Help, Map, Hint) use toggle logic: `setGameState(p => ({ ...p, showMap: !p.showMap }))`.

### 27. Directory Path Assertion Specificity (Regression Risk)

- **Symptom**: Fixing one test by making assertions strict (e.g., `toHaveText` instead of `toContainText`) breaks other tests that rely on partial matching (e.g., asserting "tmp" while in "/tmp").
- **Root Cause**: `expectCurrentDir` was changed to use `toHaveText` broadly to fix a root directory check failure (where "/" matched "~/datastore"), but this broke tests in Episode 3 and Persistence expecting partial matches.
- **Fix**: Support optional strictness in the assertion helper, defaulting to partial match for backward compatibility, and opting-in to strict matching only where necessary (e.g., Root check).

  ```typescript
  // utils.ts
  export async function expectCurrentDir(page: Page, dirName: string, exact: boolean = false) {
    if (exact) await expect(page.locator('.breadcrumb')).toHaveText(dirName);
    else await expect(page.locator('.breadcrumb')).toContainText(dirName);
  }

  // episode1.spec.ts (Root check needs strictness)
  await expectCurrentDir(page, '/', true);
  ```

### 28. Robust Modal Dismissal before Mission Completion

- **Symptom**: `waitForMissionComplete` times out because "Mission Complete" text is obscured or blocked by a lingering "Protocol Violation" modal.
- **Root Cause**: Relying on a single blind `Shift+Enter` or `waitForMissionComplete`'s internal auto-dismissal is flaky if the modal flickers or re-triggers (e.g. if Hidden files are still ON).
- **Fix**: Explicitly use `dismissAlertIfPresent(page, /Protocol Violation/i)` in the test script _immediately before_ waiting for completion. Do not rely solely on the utility helper to clean up complex states.

  ```typescript
  // Ensure we aggressively dismiss any blocking modals
  await dismissAlertIfPresent(page, /Protocol Violation/i);
  await dismissAlertIfPresent(page, /Security Alert/i);
  await waitForMissionComplete(page);
  ```

### 29. Flaky URL Navigation Wait Strategy

- **Symptom**: Transients timeouts in tests that navigate to levels via URL (e.g. `goToLevel`), failing with `page.waitForLoadState('networkidle')`.
- **Root Cause**: `networkidle` is discouraged in recent Playwright versions because it waits for _no network traffic_ for 500ms, which is brittle with background polling, analytical beacons, or slow asset loading.
- **Fix**: Replace `networkidle` with `domcontentloaded` for the initial navigation waiter, and rely on explicit element-level assertions (wait for start screen or filesystem container) to confirm the app is truly interactive.

  ```typescript
  // utils.ts
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded'); // Faster, less flaky
  // ... subsequent steps wait for specific UI elements
  ```
