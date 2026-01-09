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

See `DOCS_INDEX.md` for the canonical docs map.

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

## Debugging Scenarios

To test specific random events in Level 12 (Daemon Installation), you can force a scenario by modifying `src/constants.tsx`:

1.  Locate `export const FORCE_SCENARIO: string | null = null;` near the top of the file.
2.  Set it to one of the following IDs:
    - `'scen-b1'`: Traffic Alert (Modern/Risky)
    - `'scen-b2'`: Remote Tracker (Modern/Risky)
    - `'scen-b3'`: Heuristic Swarm (Modern/Risky)
    - `'scen-a2'`: Bitrot (Legacy/Safe)
    - `'scen-a3'`: Dependency Error (Legacy/Safe)
3.  Set back to `null` to restore normal random behavior.
