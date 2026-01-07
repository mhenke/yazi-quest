# Yazi Quest — Documentation Index

This index lists canonical documentation files and where to look for authoritative
information. Use this as the single place to find the right doc for a task and
as guidance for contributors.

## Canonical content map

- `README.md` — Project overview and quick start (canonical for runners).
- `STORY_ARC.md` — Canonical narrative arc and episode order.
- `src/constants.tsx` — Canonical level definitions, hints, and per-level
  `allowedDeletePaths` policies. This is the authoritative source for level
  content used at runtime.
- `CONTRIBUTING.md` — How to contribute and the development workflow.
- `GEMINI.md` — Project overview and development context for AI agents.
- `CLAUDE.md` — Specific guidance for Claude AI.
- `QUESTIONS.md` — Open questions about the project.

## Policy notes

- Per-level filesystem policies (for example, allowing deletes inside a subtree
  during an exam level) live on the Level object as the `allowedDeletePaths`
  field in `src/constants.tsx`. This is deliberately colocated with level
  content so authors can see policy alongside objectives.

## Maintenance guidance

- When updating levels, edit `src/constants.tsx` if the level tone or prompts change.
- For narrative revisions, update `STORY_ARC.md` to keep the top-level arc consistent.
- If you add or remove canonical docs, update this `DOCS_INDEX.md`.

---

Generated: 2026-01-03
