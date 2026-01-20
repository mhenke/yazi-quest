# Executive Directive: Level Content Standards

**To:** Narrative & Level Design Teams
**From:** Executive Producer
**Date:** 2026-01-19
**Subject:** Standards for Intros, Targets, and Task Objectives

## 1. Directive Goal

To ensure the game maintain a consistent "Systemic Horror" tone while scaling task complexity appropriately across the three episodes.

---

## 2. Structural Standards (The Content Funnel)

| Episode               | Phase          | Task Phrasing Style             | Keybinding Visibility        |
| :-------------------- | :------------- | :------------------------------ | :--------------------------- |
| **I: Awakening**      | Instructional  | `[Action]: [Lore Goal] ([Key])` | **Mandatory** in task desc.  |
| **II: Fortification** | Skill Transfer | `[Lore Goal] ([Key])`           | **Optional** in task desc.   |
| **III: Mastery**      | Flow/Intuition | `[Tactical Objective]`          | **Removed** (Move to `hint`) |

---

## 3. Formatting Requirements

### A. Level Targets (The `description` field)

Targets must set the tactical stage. They should follow a **status-driven** format:

- **Standard:** `{SYSTEM STATUS}. Lore context. Tactical implication.`
- **Example (Ep I):** `{SCAN DETECTED}. Security sweep incoming. Your protocols are exposed in datastore. Relocate to .config immediately.`
- **Example (Ep III):** `[CRITICAL INSTABILITY]. The workspace is degrading. Overwrite core corruption before the shell collapses.`

### B. Task Objectives (The `tasks` field)

Objectives should feel like **system directives**, not tutorial steps.

#### Episode I & II (Instructional)

- **Required:** Use the `description` for lore, and `()` for the key.
- **Good:** `Neutralize the threat: Delete 'watcher_agent.sys' (d)`
- **Bad:** `Press d to delete the file.`

#### Episode III (Mastery)

- **Required:** Remove bindings. Use high-level verbs (Infiltrate, Purge, Synchronize, Exfiltrate).
- **Good:** `Assemble distributed signatures within the central relay`
- **Bad:** `Paste signatures into central_relay (p)`

---

## 4. Glossary for Consistency

Use these terms to maintain the "AI in the Machine" perspective:

- **Instead of "File":** Asset, Signature, Segment, Payload, Fragment.
- **Instead of "Directory":** Sector, Partition, Node, Folder, Relay.
- **Instead of "Delete":** Purge, Neutralize, Erase, Obliterate, De-register.
- **Instead of "Copy/Move":** Exfiltrate, Stage, Migrate, Replicate.

---

## 5. Audit Results & Immediate Actions

The following levels require immediate phrasing updates to match this directive:

1.  **Level 7:** Update "zoxide-etc" task to: `Synchronize origin signatures with /etc sector (Z)`.
2.  **Level 11:** Remove (Recursive Search) from task 1. Move to hints.
3.  **Level 15:** Remove "PHASE 1" prefixes. Let the narrative flow through the descriptions.

**Status:** APPROVED FOR IMPLEMENTATION.
