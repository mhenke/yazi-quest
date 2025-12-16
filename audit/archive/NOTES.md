# Audit Implementation Notes

## Task Reduction Decisions

### ✅ Level 1: Remove gg/G tasks (5 → 3 tasks)
**Rationale:** gg/G are now taught in Level 2 via g-command dialog. Level 1 should focus on cardinal navigation only (j/k/h/l).

**Action:** Remove tasks for gg and G jumps.

---

### ❌ Level 3: Keep "Clear filter" task (4 tasks stays)
**Important:** Filters persist in state and must be explicitly cleared. Not clearing filters would leave the UI in a filtered state, affecting later navigation. This is NOT busy work - it's required state management.

**Decision:** Do NOT remove this task. It teaches proper filter lifecycle.

---

### ✅ Level 9: Merge select+delete tasks (4 → 3 tasks)
**Rationale:** Selecting files and deleting them is one cognitive action. The current separation ("Mark 4 files" then "Delete selected files") treats them as separate when they're part of the same goal: "purge the 4 oldest files."

**Action:** Merge into single task: "Mark and purge 4 oldest files (sort by Modified, select, delete)"

---

## Updated Audit Results

| Level | Original | After Changes | Status |
|-------|----------|---------------|--------|
| 1 | 5 tasks | 3 tasks | ✅ Implement |
| 2 | 4 tasks | 3 tasks | ✅ Completed |
| 3 | 4 tasks | 4 tasks | ❌ Keep as-is (filter clearing required) |
| 9 | 4 tasks | 3 tasks | ✅ Implement |

**Final Result:** 2 levels to fix (1, 9) instead of original 3

**Task Range Compliance:** 16/17 levels in 2-4 range (94%) → 17/17 (100%) after fixes
