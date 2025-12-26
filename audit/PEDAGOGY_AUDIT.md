# Pedagogy & Realism Audit (Source Verified)

**Date:** 2025-12-22
**Auditor:** Senior Technical Auditor
**Purpose**: Ensure the game effectively teaches real-world Yazi workflows while maintaining immersive narrative.

**AUDIT NOTE**: This document has been updated to reflect the current source code (`App.tsx`, `constants.tsx`). Previous versions were based on outdated documentation and contained significant errors.

---

## 1. Yazi Realism (Parity Analysis)

The pedagogical foundation of the game is sound. It correctly prioritizes and teaches the most common Yazi commands in a logical order. However, the documentation's previous claims of feature parity were exaggerated.

### ✅ Correctly Implemented Habits

Code verification confirms the following core features are implemented in a way that builds authentic Yazi muscle memory:

- **Core Navigation**: `j/k` (move), `h/l` (enter/exit), `gg`/`G` (jumps), `Shift+H`/`Shift+L` (history), `Shift+J`/`Shift+K` (preview scroll).
- **Selection**: `Space` (select-and-advance), `Ctrl+A` (select all), `Ctrl+R` (invert).
- **File Operations**: The `d`/`y`/`x`/`p`/`r`/`a` cycle for managing files is accurate.
- **History Navigation**: `Shift+H` (back) and `Shift+L` (forward) are implemented and functional.
- **Preview Pane Scrolling**: `Shift+J` (down) and `Shift+K` (up) are implemented and functional.
- **Filtering & Searching**: The distinction and use cases for `f` (filter) and `z` (fuzzy find) are taught effectively.
- **Sorting:** The use of `,` as a prefix for sort mode is correct.

### ❌ Gaps & Discrepancies

The following features, previously claimed to be implemented in outdated audits, **do not exist** in the current source code:

- **Visual Mode (`v`/`V`):** This feature is not implemented. The `visualAnchorIndex` property, which would support it, was removed from the `GameState` type in `types.ts`, indicating this is not a planned feature. Listing this as a "Blocker" is inaccurate; it is a known, low-priority gap.

## 2. Narrative & Voice

- **Tone:** The cyberpunk aesthetic is consistent across level descriptions and UI notifications.
- **Pacing:** The principle of "one new skill per teaching level" is generally followed, with challenge levels effectively combining previously learned skills. This is a sound pedagogical structure.
- **Feedback:** UI notifications have been updated with narrative flavor (e.g., "TARGETS ELIMINATED"), which reinforces the game's theme.

---

## 3. Actionable Recommendations & Pointed Questions

1.  **Recommendation: Align a "Single Source of Truth."** The project suffers from multiple, conflicting documentation sources (`LEVELS.md`, various audit files). The `constants.tsx` file is the only reliable source. All other documents should be either deleted or regenerated from this file.
    - **Question:** What process will be put in place to prevent documentation desynchronization in the future?

2.  **Recommendation: Re-evaluate "Advanced" Features.** Decide whether features like History Navigation or Visual Mode are within the educational scope of this project. If not, they should be documented as "Intentionally Omitted" rather than appearing as "gaps" in audits.
    - **Question:** Is the goal of this project to be a comprehensive Yazi simulator or an opinionated tool for teaching the _most important_ workflows? The answer dictates which gaps are actually important.

3.  **Recommendation: Focus on Technical Debt.** The `TECHNICAL_AUDIT.md` correctly identifies the lack of automated testing as a critical risk. This is a more significant threat to the project than the absence of minor Yazi features.
    - **Question:** Why is feature parity being discussed when there is no test suite to prevent regressions in the core functionality that is already implemented?
