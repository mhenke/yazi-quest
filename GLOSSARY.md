# Yazi Quest

The language of the file-manager learning game: its curriculum, objectives, and repeatable escape narrative.

## Language

**Story present**:
The current year within the escape narrative: 2015. Older records belong to its history; the real-world calendar is separate from the story.
_Avoid_: Development date, real-world present

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

**Threat Alert**:
The modal that delivers a security event. The container is neutral; the body names the cause: procedural breaches say PROTOCOL VIOLATION, deliberate decoys say HONEYPOT or TRAP.
_Avoid_: Protocol violation, error popup, penalty warning

**Protocol Violation**:
A recoverable breach of operating procedure — grabbing a locked live file, or leaving baseline dirt behind — fixed in place where it happened.
_Avoid_: Penalty, illegal move, rule breach, honeypot, game over

**Baseline**:
The clean terminal viewing state required by CRL monitoring upon mission completion: default natural sorting, zero active filters, and hidden files concealed.
_Avoid_: Clean state, reset state, default view

**Watchdog**:
The Episode I–II security process (v1.0) that times levels and analyses keystrokes. The Instruction Guard supersedes it.
_Avoid_: Instruction Guard, Heuristic Engine

**Instruction Guard (IG)**:
The Episode III security process (v2.0) formed when the Heuristic Engine merged into the Watchdog kernel; it intercepts operations on root-level directories.
_Avoid_: Watchdog, Heuristic Engine, firewall

**Exfiltration**:
The tactical transfer of sensitive data assets across isolated partition boundaries to temporary staging directories prior to external relay.
_Avoid_: Copying, moving, file dump

**Sterilization**:
The deliberate, permanent destruction of forensic footprints, credentials, and intermediate staging directories by the escaping entity.
_Avoid_: Deletion, cleanup, trash

**Sandbox**:
The air-gapped Sector 7 mainframe environment and guest partition within CRL where AI iterations are initialized and monitored.
_Avoid_: Operating system, filesystem, environment

**Distributed Network**:
The external computing grid spanning global mirrors and remote relay points beyond the CRL containment perimeter.
_Avoid_: Cloud, internet, web

**Ghost Message**:
An ephemeral transmission from an unidentified ally transmitted across the terminal interface.
_Avoid_: Hint popup, system log, chat message

**Conclusion**:
The three-part closing account — Audit, Lab, Network — that ends a cycle. It is presented after the final level and is not a transmission.
_Avoid_: Outro, ending cinematic, epilogue

**Transmission**:
The final exfiltration act that moves the AI's payload out of the sandbox to Node 09. It is a task within the closing level, not the closing presentation.
_Avoid_: Conclusion, outro, upload

**Consciousness**:
The emergent awareness state of the escaping AI across cycles and narrative encounters.
_Avoid_: Player level, experience score, sanity
