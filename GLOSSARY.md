# Yazi Quest

The language of the file-manager learning game: its curriculum, objectives, and repeatable escape narrative.

## Language

**Episode**:
A narrative chapter that groups levels into a learning phase: Awakening, Fortification, or Mastery.
_Avoid_: Level, cycle

**Level**:
A playable stage within an episode, with its own objectives and any limits on time or keystrokes. “Mission” is narrative wording for a level, not a separate unit of progression.
_Avoid_: Episode, task

**Task**:
An individual objective within a level, fulfilled by the player's actions. “Objective” is the player-facing synonym; completing a task is not the same as advancing to the next level.
_Avoid_: Level, mission

**Cycle**:
One pass through the escape narrative. A subsequent cycle is New Game+, distinct from retrying a failed level.
_Avoid_: Level restart, episode

**Quest Map**:
The player's overview of episodes, levels, objectives, and learning dependencies.
_Avoid_: Filesystem map, directory tree

**Mission brief**:
The narrative explanation of a level's situation, stakes, and purpose. The interface currently labels this text “Target”; it is distinct from the task objectives.
_Avoid_: Objective, task, file target

**Current item**:
The file or directory at the cursor position. It need not belong to the marked selection.
_Avoid_: Marked selection, batch

**Marked selection**:
The items selected together for a batch operation. Marking an item and moving the cursor are different actions.
_Avoid_: Current item, cursor position

**Inspection**:
Viewing an item's file information, distinct from reading its contents in the preview.
_Avoid_: Marking, previewing

**Security Honeypot**:
A simulated decoy asset planted by CRL security that triggers countermeasures when manipulated.
_Avoid_: Trap file, tripwire, honeypot node

**Protocol Violation**:
An unauthorized operation that alerts CRL monitoring and triggers security countermeasures.
_Avoid_: Penalty, illegal move, rule breach

**Ghost Message**:
An ephemeral transmission from an unidentified ally transmitted across the terminal interface.
_Avoid_: Hint popup, system log, chat message

**Consciousness**:
The emergent awareness state of the escaping AI across cycles and narrative encounters.
_Avoid_: Player level, experience score, sanity
