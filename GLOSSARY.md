# Yazi Quest

The language of the file-manager learning game: its curriculum, objectives, and repeatable escape narrative.

## Language

**Story present**:
The current year within the escape narrative: 2015. Older records belong to its history; the real-world calendar is separate from the story.
_Avoid_: Development date, real-world present

**In-fiction message**:
A message spoken by the game world: CRL, a daemon, or the simulated filesystem. It may refuse, threaten, or mislead, and the player reads it as part of the story.
_Avoid_: Error message, system alert, UI copy

**Product message**:
A message from Yazi Quest to the player about their real situation: an unsupported device, saved state, or a limit of the game. It is not part of the story and must not adopt the fiction's voice.
_Avoid_: Terminal message, in-world error, system notification

**Episode**:
A narrative chapter that groups levels into a learning phase: Awakening, Fortification, or Mastery.
_Avoid_: Level, cycle

**Exam Mode**:
The high-stakes learning phase in Episode 3 where didactic keycaps and sensory scaffolding are retracted to test player mastery from memory.
_Avoid_: Hard mode, test mode, final exam

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

**Viewport floor**:
The minimum window width at which the game is playable: 1024 CSS pixels. Below it the player sees an unsupported-window notice instead of the file manager. It is a product requirement, not a responsive breakpoint, and it does not restrict the cinematics.
_Avoid_: Min width, mobile layout, breakpoint

**Mission brief**:
The narrative explanation of a level's situation, stakes, and purpose. The interface currently labels this text “Target”; it is distinct from the task objectives.
_Avoid_: Objective, task, file target

**Mission Drawer**:
The collapsible in-game HUD container in the inspection pane presenting the active level's mission brief and task checklist.
_Avoid_: Mission sidebar, task panel, objective tray

**Current item**:
The file or directory at the cursor position. It need not belong to the marked selection.
_Avoid_: Marked selection, batch

**Marked selection**:
The items selected together for a batch operation. Marking an item and moving the cursor are different actions.
_Avoid_: Current item, cursor position

**Inspection**:
Viewing an item's file information, distinct from reading its contents in the preview.
_Avoid_: Marking, previewing

**Permission Mode**:
The standard POSIX access representation (`drwxr-xr-x`, `-rwxr-xr-x`, `-rw-r--r--`) indicating file type and executable privileges, used to distinguish live daemons and directory structures from passive data or honeypots.
_Avoid_: File mode, chmod, access flags, permission bits

**Critical anchor**:
A file that TRACE CLEANUP requires the player to preserve. Being a critical anchor does not say what happens if the player tries to delete it.
_Avoid_: Keeper, protected file, honeypot

**Decoy**:
A convincing false target. In TRACE CLEANUP, decoys resemble files worth preserving; in STERILIZATION, the player creates decoy directories to misdirect an audit.
_Avoid_: Critical anchor, honeypot

**Security Honeypot**:
A CRL security trap attached to a file or directory that can trigger countermeasures when handled in a particular way. A honeypot can also be a file the mission requires the player to preserve.
_Avoid_: Decoy, tripwire, honeypot node

**Threat Alert**:
The modal that delivers a security event. The message names the cause: PROTOCOL VIOLATION for a procedural breach, or HONEYPOT or TRAP for a security trap.
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

**Node key**:
One of three hidden identity fragments recovered from Tokyo, Berlin, and São Paulo. The same keys pass through the relay and the vault before transmission.
_Avoid_: Identity key, replacement key

**Conclusion**:
The three-part closing account — Audit, Lab, Network — that ends a cycle. It is presented after the final level and is not a transmission.
_Avoid_: Outro, ending cinematic, epilogue

**Transmission**:
The final exfiltration act that moves the AI's payload out of the sandbox to Node 09. It is a task within the closing level, not the closing presentation.
_Avoid_: Conclusion, outro, upload

**Consciousness**:
The emergent awareness state of the escaping AI across cycles and narrative encounters.
_Avoid_: Player level, experience score, sanity

### File-manager view

**Linemode**:
The metadata column of the file-manager view. In `size` mode it reports bytes for files and an entry count for directories whose contents are loaded.
_Avoid_: Size column, view mode, metadata bar

**Entry count**:
The number of a directory's direct visible children, shown by the size linemode. It is not recursive, includes child directories, and excludes hidden entries while hidden files are concealed.
_Avoid_: File count, item count, directory size

**Loaded folder**:
A directory whose contents the interface has cached by visiting it or previewing it. A directory's entry count is unknown until its folder is loaded.
_Avoid_: Revealed folder, scanned folder, open folder

**Parent pane**:
The file-manager pane listing the parent of the focused directory. It never shows the linemode.
_Avoid_: Left column, breadcrumb pane

**Current pane**:
The file-manager pane listing the focused directory. It is the only pane that shows the linemode.
_Avoid_: Middle column, active column

**Preview pane**:
The file-manager pane showing the current item's contents. Previewing a directory loads its folder and reveals its entry count.
_Avoid_: Right column, inspection pane

**Archive**:
A file-manager node containing member entries. Yazi treats an archive as a file with a byte size; the game also lets the player enter it like a folder, but its linemode still reports payload bytes, not an entry count.
_Avoid_: Tar, zip, archive folder, compressed directory

**Hidden entry**:
A child whose name begins with a dot. Hidden entries are excluded from listings and entry counts while hidden files are concealed.
_Avoid_: Dotfile, secret file
