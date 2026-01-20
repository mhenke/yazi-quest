# Contributing to Yazi Quest

## Adding New Levels

1. Add level definition to `src/constants.tsx`. Ensure all new components or utilities are placed in `src/components/` and `src/utils/` respectively.
2. Implement check functions
3. Test all tasks complete properly
4. Update episode lore if needed

## Level Design Guidelines

- Each level primarily introduces a new core concept or workflow; challenge levels may integrate multiple skills.
- Tasks should build on previous knowledge
- Hints should guide, not solve
- Ensure hints reference specific keybindings
- Verify logic with `src/levelTransitions.test.ts` to ensure consistent state across levels.

### Per-level filesystem policy

- Level-scoped filesystem exceptions (for example: allowing deletes inside a
  specific subtree for an exam level) are authored on the Level object via
  `allowedDeletePaths` in `src/constants.tsx`. Keep policy next to the level
  content so authors and designers can review runtime behavior without
  searching for external policy files.

See the documentation index for detailed rationale:

- [STORY_ARC.md](./docs/STORY_ARC.md) - Narrative and level progression.
- [LEARNING_DESIGN.md](./docs/LEARNING_DESIGN.md) - Pedagogical rationale.
- [CHANGELOG_ARCHIVE.md](./CHANGELOG_ARCHIVE.md) - Historical audit and refactor logs.

## Styling

- Use Tailwind CSS
- Follow the color scheme:
  - Episode 1: Blue
  - Episode 2: Purple
  - Episode 3: Yellow/Orange

## State Management

- Do not mutate the `fs` state directly. Always use helper functions in `utils/fsHelpers.ts` which return a new state copy (immutability).

## Development Workflow

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the code using ESLint.
- `npm run format`: Formats the code using Prettier.

To test the game state, use URL parameters:

- `?ep=2` - Start from Episode 2.
- `?lvl=5` - Jump to specific Level ID.
- `?tasks=all` - Auto-complete current tasks.
- `?intro=false` - Skip intro cinematics.
- `?debug=outro` - Jump directly to end sequence.

To test specific random events in Level 12 (Daemon Installation), you can force a scenario using URL parameters or by modifying `src/constants.tsx`:

**URL Parameter Method (Recommended):**

- Add `?lvl=12&scenario=scen-a1` to the URL (replace `scen-a1` with desired scenario ID)

**Code Modification Method:**

1.  Locate `export const FORCE_SCENARIO: string | null = null;` near the top of the file.
2.  Set it to one of the scenario IDs below.
3.  Set back to `null` to restore normal behavior.

**Scenario Variants:**

**Modern/Risky Scenarios** (if player chose modern daemons in Level 11):

- **scen-b1**: Traffic Alert (33% chance) - Spawns `alert_traffic.log` in `~/workspace`, adds "RISK: High-bandwidth alert detected..." task
- **scen-b2**: Remote Tracker (33% chance) - Spawns `trace_packet.sys` in `~/incoming`, adds "BREACH: Traceback initiated..." task
- **scen-b3**: Heuristic Swarm (34% chance) - Scatters `scan_a.tmp`, `scan_b.tmp`, `scan_c.tmp` across system, adds "SWARM: Heuristic scanning active..." task

**Legacy/Safe Path** (player chose legacy daemons in Level 11):

- **`scen-a1`**: Clean Run - No threat files spawn, no extra tasks (baseline scenario)
- **`scen-a2`**: Bitrot - Spawns hidden `core_dump.tmp` in `~/.config`, adds "CLEANUP: Memory leak in config..." task
- **`scen-a3`**: Dependency Error - Spawns `lib_error.log` in `~/workspace`, adds "FIX: Deprecated library warning..." task

All scenarios include the 4-5 core installation tasks (navigate, cut, paste systemd-core). Scenario-specific tasks are automatically hidden if their threat files don't exist.

## Testing & E2E Requirements

All interactive components must include `data-testid` attributes to support the Playwright E2E suite.

### Required Test IDs:

| Component         | `data-testid`            | Notes                                              |
| :---------------- | :----------------------- | :------------------------------------------------- |
| **File/Dir Item** | `file-${item.name}`      | Applied to the container in `FileSystemItem.tsx`   |
| **Mission Toast** | `mission-complete`       | Applied to the success notification                |
| **Input Modals**  | `input-modal`            | General ID for create/rename/filter modals         |
| **Input Field**   | `input-modal-input`      | Specific ID for the input element itself           |
| **Status Bar**    | `status-bar`             | Container for the fixed status area                |
| **Clipboard**     | `status-clipboard`       | Specifically for the `[YANK]` or `[CUT]` indicator |
| **Panes**         | `filesystem-pane-active` | Also supports `-inactive` variant                  |
| **Search**        | `search-input`           | Specifically for the recursive search input        |
| **Fuzzy Finder**  | `fuzzy-finder`           | Specifically for the `z` shortcut UI               |

### Best Practices:

- **No Manual State**: If a level requires a specific state (e.g. 10 files in `/tmp`), implement it in `onEnter` rather than assuming existing state.
- **Wait for Modals**: E2E tests should always wait for transitions (`Enter`, `Escape`) to resolve before checking tasks.
