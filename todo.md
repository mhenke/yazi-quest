# Yazi Quest - Level Design Refactoring Guide

This document provides a set of generic principles and prompts for reviewing and refactoring any level in the game. The goal is to ensure all levels are engaging, narratively coherent, and realistically model the Yazi file manager.

---

## 1. Principle: Eliminate *Unrealistic* Mechanical Tasks

**Prompt:** "Does this task represent a narrative goal, or is it just a UI step? If it's a UI step, is it a core, non-obvious part of the real Yazi workflow?"

A task should feel like a meaningful action within the story. It should not be a purely mechanical instruction **unless** that mechanical step represents a unique or crucial part of the real tool's user experience.

**Verification Step:**
Before removing a mechanical task (e.g., "Press Escape"), first verify the authentic Yazi workflow. Use web research, Yazi's official documentation, or hands-on testing. If the mechanical step is a mandatory or quirky part of the real workflow (like Yazi's two-stage `Esc` for filters), it **must be kept** and taught as a formal task to ensure realism.

**Example Application (from Level 3):**

*   **Problem:** Level 3 had tasks for "Exit filter mode (Esc)" and "Clear the filter (Esc)". This was initially identified as "busy work".
*   **Verification:** Research confirmed that Yazi uses a multi-stage `Esc` workflow: the first `Esc` exits the input prompt but leaves the filter active, and a second `Esc` clears the filter.
*   **Solution:** The "mechanical" tasks were **restored**. They are not busy work; they are a critical lesson in how the tool actually behaves.

---

## 2. Principle: Ensure Complete Workflows

**Prompt:** "Does this level leave any action unfinished?"

If a player starts a multi-step process like `cut-and-paste`, they should complete it. Leaving a file in the clipboard at the end of a level feels unresolved and confusing.

**Example Application (from Level 11):**

*   **Problem:** Level 11 originally ended after the player `cut` a file and jumped to `/tmp`, but never pasted it.
*   **Solution:** A final task, "Deposit the corrupted signature in /tmp (p)", was added to complete the `cut -> jump -> paste` workflow.

---

## 3. Principle: Validate Outcomes, Not Inputs

**Prompt:** "Does this task's validation check *how* the player did something, or *what* the result was?"

Task `check` functions should be flexible. They should validate that the player achieved the correct game state, regardless of the exact method or input string they used.

**Example Application (from Filter Tasks):**

*   **Problem:** Filter tasks were checking if the user's input string matched a specific value (e.g., `filter.includes('neur')`).
*   **Solution:** The validation was changed to check the *result* of the filter. The `check` function now verifies that the list of visible files has been correctly narrowed down to the target files, no matter what the user typed to achieve it. This should be the standard for all filter-based challenges.

---

## 4. Principle: Review Level Pacing (2-4 Task Rule)

**Prompt:** "Does this level have between 2 and 4 meaningful tasks?"

*   **1 Task:** If a level has only one task, it's too simple. It should be expanded into a multi-step objective that feels more substantial.
*   **5+ Tasks:** If a level has five or more tasks, it's likely too granular and feels like a checklist. The tasks should be condensed into more comprehensive goals.

**Example Application (from Level 11):**

*   **Problem:** Level 11 originally had 5 granular tasks for its workflow.
*   **Solution:** It was condensed into 3 primary tasks (Navigate & Filter, Isolate & Extract, Relocate) that encompassed the same actions but felt more goal-oriented.
