File System Persistence Validation

Date: 2025-12-21T21:41:47Z

Summary:

- Implemented fix: Quest Map (LevelProgress) jumps now preserve the active game filesystem instead of cloning INITIAL_FS. This prevents accidental reseeding of demo files when jumping between levels.
- AdvanceLevel already clones prev.fs and applies onEnter. With the Quest Map change, player-modified state is preserved across both normal advancement and map jumps.

Quick manual validation steps:

1. Start the game (npm run dev) and reach Level 1.
2. Create a file in /home/guest: press 'a', name 'test_persistence.txt'.
3. Advance to the next level normally; verify 'test_persistence.txt' remains in /home/guest.
4. From the Quest Map (Shift+M), jump to another level that previously re-seeded files; verify 'test_persistence.txt' still exists after the jump.
5. Specific Level 11 test:
   - In Level 10 create 'neural_test.txt' and 'safe_test.txt' inside /workspace.
   - Advance to Level 11. Expect 'neural_test.txt' to be removed (intentional cleanup) and 'safe_test.txt' to remain.
6. Specific Level 12 test:
   - Delete .config/vault (if allowed) in Level 11.
   - Advance to Level 12 and verify .config/vault is recreated by Level 12's onEnter.

If any step fails:

- Capture reproduction steps and open an issue.
- Suggested mitigation: make onEnter hooks conditional (only seed when starting from INITIAL_FS or when a 'freshStart' flag is set) or expand isProtected rules to prevent accidental recreation or deletion of player-created files.

Notes:

- Level 11's onEnter intentionally purges neural\_\* files to ensure level consistency; this behavior remains.
- For longer-term stability, consider adding an explicit 'seedMode' flag to the Level type to indicate whether onEnter should run only on fresh runs (e.g., when starting a new save) vs. always when jumping levels.
