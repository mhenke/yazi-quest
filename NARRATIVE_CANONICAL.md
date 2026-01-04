# Narrative Canonical Summary

This concise canonical narrative summarizes the current story arc and the
rationale behind recent changes. It is intended as the single short reference
for writers and designers.

## Episodes (high level)

- Episode I — Awakening: Introduces the player as AI-7734, an emergent
  consciousness facing system dissection. Teaches core navigation and safety.

- Episode II — Fortification: Focuses on strategy: building a daemon presence,
  planting backdoors, and moving key artifacts into a vault. Introduces
  zoxide/fuzzy navigation and batch workflows.

- Episode III — Mastery: Final exam sequence. The player completes distributed
  transmission, erases traces, and executes the memory-wipe payoff. Levels are
  designed as constrained, keystroke-limited exams (no automatic jumps).

## Key design changes

- Memory-wipe twist: The finale recontextualizes earlier narrative beats.
- Level continuity: Filesystem changes persist across levels where appropriate
  (see `ensurePrerequisiteState` in `src/constants.tsx`).
- Per-level policies: Deletion allowances and other level-scoped exceptions are
  defined via `allowedDeletePaths` on Level definitions.

## Authoring notes

- Use `THEATRE.md` for long-form authoring prompts and `STORY_ARC.md` for the
  canonical episode order.
- Keep level mechanics in `src/constants.tsx`; only narrative flavor lives in
  theatre docs.

Links:

- `THEATRE.md` — authoring prompts
- `STORY_ARC.md` — canonical arc
- `src/constants.tsx` — runtime level definitions
