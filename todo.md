TODO: Code Quality, Error Handling & Continuity (prioritized)

Timestamp: 2025-12-21T23:14:56.552Z

Context:
- This repo recently had fixes to file persistence (seedMode/onEnter guards) and lint/format tooling added.
- Next actions focus on preventing regressions (CI), improving failure handling in core modules, and hardening TypeScript/ESLint rules.

Priority Plan (recommended order):

1) CI Enforcement (Priority: High — low risk, immediate regression protection)
- Create a GitHub Actions workflow that runs on PRs and pushes to main branches.
- Steps:
  - npm ci
  - npm run type-check
  - npm run lint
  - npm run format -- --check
  - Run scripts/smoke_persistence.sh (or equivalent smoke script) to validate file persistence guard logic.
- Estimated time: 1-2 hours.

2) Refactor core failure handling (Priority: High — medium effort)
- Refactor utils/fsHelpers.* to return structured results (e.g., Result<T, Error> or { ok: boolean; value?: T; error?: string }).
- Replace throw-based flows in critical paths with safeExec/reportError patterns; add unit tests around createPath/addNode/deleteNode/renameNode.
- Use the new utils/error.safeExec to call potentially-throwing code paths inside components and level hooks.
- Estimated time: 4-8 hours (could be chunked into small PRs per helper).

3) Hard ESLint/TypeScript rules (Priority: Medium — higher effort but improves code quality)
- After CI + core refactor, flip key lint/TS rules from warn -> error (explicit-module-boundary-types, no-explicit-any, no-unused-vars -> error).
- Fix compile/lint failures in small batched PRs; avoid a single enormous refactor.
- Estimated time: 2-4 hours of dedicated polishing (spread over multiple PRs).

Operational Recommendations:
- Add GitHub Actions job matrix: Node versions and OS where feasible.
- Fail PRs on type-check, lint errors, or format drift.
- Add unit tests for fsHelpers and level task checks to prevent regressions in game logic.
- Consider adding Playwright/E2E tests for the FILE_PERSISTENCE_VALIDATION checklist as a long-term regression guard.

Immediate next step (requested by reviewer): scaffold the CI workflow (Action: create .github/workflows/ci.yml) and run it on PRs to protect the repo.

Choose which action to run next: (A) scaffold CI now, (B) begin fsHelpers refactor, (C) enforce rules now and fix type errors. If A, will create workflow file and run smoke script in CI as part of the job.
