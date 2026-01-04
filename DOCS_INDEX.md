# Yazi Quest — Documentation Index

This index lists canonical documentation files and where to look for authoritative
information. Use this as the single place to find the right doc for a task and
as guidance for contributors.

## Canonical content map

- `README.md` — Project overview and quick start (canonical for runners).
- `STORY_ARC.md` — Canonical narrative arc and episode order.
- `NARRATIVE_OVERHAUL_SUMMARY.md` — High-level narrative overhaul summary.
- `THEATRE.md` — Authoring prompts and theatre-style level guidance (level
  authors should consult this for tone and prompts).
- `src/constants.tsx` — Canonical level definitions, hints, and per-level
  `allowedDeletePaths` policies. This is the authoritative source for level
  content used at runtime.
- `IMPLEMENTATION_STATUS.md` — Implementation progress and status (deployment
  readiness).
- `CONTRIBUTING.md` — How to contribute and the development workflow.

## Policy notes

- Per-level filesystem policies (for example, allowing deletes inside a subtree
  during an exam level) live on the Level object as the `allowedDeletePaths`
  field in `src/constants.tsx`. This is deliberately colocated with level
  content so authors can see policy alongside objectives.

## Maintenance guidance

- When updating levels, edit `src/constants.tsx` and update `THEATRE.md` if
  the level tone or prompts change.
- For narrative revisions, update `NARRATIVE_OVERHAUL_SUMMARY.md` and
  `STORY_ARC.md` to keep the top-level arc consistent.
- If you add or remove canonical docs, update this `DOCS_INDEX.md`.

---

Generated: 2026-01-03
