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

Fix: When encountering backdrop click failures, check for elements with higher z-index values that might be intercepting clicks. Use keyboard shortcuts (Escape, Shift+Enter) as reliable alternatives to backdrop clicks for closing modals.
