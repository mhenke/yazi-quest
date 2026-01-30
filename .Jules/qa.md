## 2024-05-22 - Vitest Configuration Gap

**Learning:** The project had `vitest` installed but the `test` script was a placeholder, and `vite.config.ts` had tests commented out. This meant zero unit test coverage despite the infrastructure being partially present.
**Action:** Always check `package.json` scripts and config files (vite/playwright) early to verify if the testing infrastructure matches the installed dependencies.

## 2024-05-23 - E2E Timing and Robustness

**Learning:** Tests relying on `Shift+Enter` to dismiss modals or skip intros were flaky. Modals often didn't disappear instantly due to animations or state updates, causing `not.toBeVisible()` to fail immediately. Also, manual key-mashing simulations (`intro-pathway`) needed higher iteration counts and explicit delays to reliably trigger React state updates.
**Action:** Use `waitForTimeout(500)` or longer after triggering UI state changes via keyboard shortcuts before asserting visibility changes. Increase assertions timeouts to 10s for animations.

## 2024-05-23 - Level 1 Constraints in Tests

**Learning:** `persistence.spec.ts` failed because it tried to use `gotoCommand('r')` (shortcut `gr`) in Level 1. Level 1 logic specifically blocks shortcuts to force manual learning.
**Action:** Always verify level-specific constraints when writing tests that use global shortcuts. Start tests at Level 2+ if unrestricted navigation is required.

## Development Environment

- **Development Server**: The Vite dev server runs on `http://localhost:3000`. Assume it is already running before executing tests.
- **Testing**: When running Playwright tests, use a non-interactive reporter (e.g., `list`) to ensure the command terminates upon completion. Example: `npm run test:e2e -- --reporter=list`.

## Codebase Navigation

- **Content Searching**: Utilize `rg` (ripgrep) for high-speed, recursive content searches. It is preferred as it automatically respects `.gitignore` rules.
- **File Finding**: Employ `fd` (`fdfind`) for a fast and user-friendly alternative to `find` when locating files and directories.
