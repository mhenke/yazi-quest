## 2024-05-22 - Vitest Configuration Gap
**Learning:** The project had `vitest` installed but the `test` script was a placeholder, and `vite.config.ts` had tests commented out. This meant zero unit test coverage despite the infrastructure being partially present.
**Action:** Always check `package.json` scripts and config files (vite/playwright) early to verify if the testing infrastructure matches the installed dependencies.
