# Executive Directive: Maintenance, Polish & The Infinite Cycle

**To:** Engineering & Design Leads
**From:** Executive Producer
**Date:** 2026-01-19
**Subject:** Strategy for Cycle Reset, FS Depth, and Consistency Audits

## 1. Directive Goal

To transition from "Active Feature Development" to "Long-Term Stability and Narrative Cohesion." These items ensure the game feels like a finished, intentional product rather than a series of levels.

---

## Pillar I: The Restart Loop (The Re-Imaging)

**Vision:** Success in Yazi Quest is a lie. The restart should not feel like a "Game Over" or a menu button; it is a narrative event.

#### Implementation Requirements:

1.  **The "Fake Crash":** 3 seconds after the final Outro line ("See you next cycle, AI-7735"), the screen should flicker, simulate a kernel panic/reboot sequence (ASCII BIOS screen), and then land the player back at Level 1, Episode 1.
2.  **Persistence:** Increment a `cycleCount` in `localStorage`.
3.  **Narrative Shift:**
    - Level 1's title changes from `AI-7734` to `AI-7735`.
    - The "previous_cycle.log" breadcrumb becomes active.
    - **New Vision Alignment:** The first "System Broadcast" should be: `[RE-IMAGE COMPLETE] Subject 7735 Online. Monitoring started.`

---

## Pillar II: Filesystem Flattening (The Debt Harvest)

**Vision:** We only tolerate complexity if it is instructional.

#### Implementation Requirements:

1.  **Strict Depth-3 Policy:** Any directory deeper than 3 levels that does NOT involve an explicit tutorial on recursive navigation (`fd`, `rg`, `**`) must be flattened.
2.  **Targets:** Use the Flattening Audit results to merge `sub-sub-directories` into their parents.
3.  **The "Stress Test" Exception:** Keep the deep nests in Episode III where "Mastery" specifically requires hunting through noise.

---

## Pillar III: Audit & Document Sync (The Ground Truth)

**Vision:** The documentation must be the "Director's Blueprint," not a historical artifact of what we _thought_ we were building.

#### Implementation Requirements:

1.  **STORY_ARC.md Sync:** Update Act III to reflect the "You Become the Lab" ending and the "Reactive Horror" antagonist model.
2.  **LEARNING_DESIGN.md Sync:** Verify that the "Cognitive Load" sections still hold true after the FS flattening.
3.  **Cross-Reference:** Ensure all `data-testid` requirements documented in `CONTRIBUTING.md` match the final refactored component IDs.

---

## Execution Priority

- **Priority 1:** Audit & Document Sync (1 week). _We cannot scale if the map is wrong._
- **Priority 2:** Restart Loop (3 days). _High narrative payoff for mid-range effort._
- **Priority 3:** FS Flattening (2 weeks). _Low narrative payoff, high risk. Move to "Post-Release Tech Debt" pile if needed._

**Status:** APPROVED FOR PLANNING.
