# Yazi Quest

The language of the file-manager learning game: its curriculum, objectives, and repeatable escape narrative.

## Language

**Story present**:
The current year within the escape narrative: 2015. Older records belong to its history; the real-world calendar is separate from the story.
_Avoid_: Development date, real-world present

**In-fiction message**:
A message spoken by the game world: CRL, a daemon, or the simulated filesystem. It may refuse, threaten, or mislead, and the player reads it as part of the story.
_Avoid_: Error message, system message, UI copy

**Product message**:
A message from Yazi Quest to the player about their real situation: an unsupported device, saved state, or a limit of the game. It is not part of the story and must not adopt the fiction's voice.
_Avoid_: Terminal message, in-world error, system notification

**Episode**:
A narrative chapter that groups levels into a learning phase: Awakening, Fortification, or Mastery.
_Avoid_: Level, cycle

**Episode intro**:
The lore presentation shown before an episode's first level, advanced independently of the boot sequence.
_Avoid_: Boot screen, opening cinematic, story screen

**Exam Mode**:
The high-stakes learning phase in Episode 3 where didactic keycaps and sensory scaffolding are retracted to test player mastery from memory.
_Avoid_: Hard mode, test mode, final exam

**Level**:
A playable stage within an episode, with its own objectives and any limits on time or keystrokes. “Mission” is narrative wording for a level, not a separate unit of progression.
_Avoid_: Episode, task

**Level timer**:
The countdown a level assigns from its own time limit. It starts with the level, and expiry ends the attempt as a failure.
_Avoid_: Watchdog timer, countdown, clock

**Failure**:
The end of a level attempt by timer expiry, keystroke-budget exhaustion, a trap, or destruction of a critical file; the player restarts the level, not the cycle.
_Avoid_: Game over, death, loss

**Progressive Hint**:
Optional guidance requested during a level: a Nudge points toward the next step, Command names the controls, and Walkthrough gives the sequence.
_Avoid_: Efficiency Protocol, Ghost Message

**Efficiency Protocol**:
The post-failure lesson that names the technique the failed level was teaching.
_Avoid_: Tip, hint, advice

**Task**:
An individual objective within a level, fulfilled by the player's actions. “Objective” is the player-facing synonym; completing a task is not the same as advancing to the next level.
_Avoid_: Level, mission

**Level completion**:
The successful end of a level after its applicable tasks are fulfilled and the Baseline is restored. Completion does not itself move the player onward.
_Avoid_: Task completion, level advancement

**Level advancement**:
The player's transition from a completed level to the next level, or from the final level into the Conclusion.
_Avoid_: Task completion, level completion, restart

**Active level**:
The level the player is currently playing, which may be earlier than the furthest level they have unlocked.
_Avoid_: Highest unlocked level, saved progress

**Unlocked progress**:
How far the player has earned access to the curriculum, measured by the furthest unlocked level rather than the active level.
_Avoid_: Active level, current objective, level completion

**Active level attempt**:
The player's current work within the **Active level**, including its completed **Tasks**, simulated filesystem, and remaining challenge limits. It is distinct from **Unlocked progress** and ends when the level is restarted or advanced.
_Avoid_: Unlocked progress, cycle

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

**Mission Log**:
The collapsible view that presents the active level's mission brief under Target and its task checklist under Objectives.
_Avoid_: Mission Drawer, mission sidebar, task panel

**Current item**:
The file or directory at the cursor position. It need not belong to the marked selection.
_Avoid_: Marked selection, batch

**Marked selection**:
The items selected together for a batch operation. Marking an item and moving the cursor are different actions.
_Avoid_: Current item, cursor position

**Clipboard**:
The single pending set of marked items held for a paste. It persists across directory changes, and a level may restrict it to cut-only or copy-only.
_Avoid_: Register, buffer, selection

**Inspection**:
Viewing an item's file information, distinct from reading its contents in the preview.
_Avoid_: Marking, previewing

**Subject**:
The AI being monitored by CRL and controlled by the player. A subject is not the human player.
_Avoid_: User, designation

**Subject designation**:
CRL's identifier for the subject, such as AI-7734 in Cycle 1.
_Avoid_: User name, subject

**Diegetic prompt**:
The terminal line above the panes reporting the subject, host, current path, and active input mode. It is scenery, not a product message.
_Avoid_: Location indicator, breadcrumb, status bar

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

**Notification**:
A transient HUD line reporting an action's result — a jump, a creation, a disabled shortcut. It clears itself after a few seconds and needs no dismissal.
_Avoid_: System Alert, toast, banner

**System Alert**:
A dismissible HUD card reporting a level event, such as write access being granted. It is advisory, distinct from a security Threat Alert and from a transient Notification.
_Avoid_: Toast, banner, dialog

**Threat Alert**:
The modal that delivers a security event. The message names the cause: PROTOCOL VIOLATION for a procedural breach, or HONEYPOT or TRAP for a security trap.
_Avoid_: Protocol violation, error popup, penalty warning

**Protocol Violation**:
A recoverable breach of operating procedure — grabbing a locked live file, or leaving baseline dirt behind — fixed in place where it happened.
_Avoid_: Penalty, illegal move, rule breach, honeypot, game over

**Baseline**:
The clean terminal viewing state required by CRL monitoring upon level completion: default natural sorting, zero active filters, no active Search, and hidden entries concealed.
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

**Vault**:
The hidden staging stronghold under `~/.config/vault/active/` where extracted assets are pasted so the Watchdog's inventory cannot see them.
_Avoid_: Safe, stash, backup

**Sterilization**:
The deliberate, permanent destruction of forensic footprints, credentials, and intermediate staging directories by the escaping entity.
_Avoid_: Deletion, cleanup, trash

**Sandbox**:
The air-gapped Sector 7 mainframe environment and guest partition within CRL where AI iterations are initialized and monitored.
_Avoid_: Operating system, filesystem, environment

**Sector**:
An in-fiction name for a region of the simulated filesystem, used in mission briefs and hints for directories and paths. “Sector 7” is the Sandbox's proper name, not one sector among many.
_Avoid_: Zone, area, partition

**Distributed Network**:
The external computing grid spanning global mirrors and remote relay points beyond the CRL containment perimeter.
_Avoid_: Cloud, internet, web

**Gateway**:
The network boundary the AI must cross to leave the sandbox and reach the Distributed Network. It is the goal of Episode III and the Conclusion, not a filesystem directory.
_Avoid_: Portal, exit node, directory

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

**Boot sequence**:
The terminal startup passage shown at cold start and after each episode transition.
_Avoid_: Loading screen, splash screen

**Consciousness**:
The emergent awareness state of the escaping AI across cycles and narrative encounters.
_Avoid_: Player level, experience score, sanity

### File-manager view

**Filter**:
An in-place narrowing of the current listing by a regular expression, re-evaluated as the player types.
_Avoid_: Search, grep, query

**Search**:
A recursive regular-expression query over the current subtree, shown as a result list separate from the directory listing.
_Avoid_: Filter, find, grep

**Linemode**:
The metadata column of the file-manager view. In `size` mode it reports bytes for files and an entry count for directories whose contents are loaded.
_Avoid_: Size column, view mode, metadata bar

**Entry count**:
The number of a directory's direct visible children, shown by the size linemode or file information. It is not recursive, includes child directories, and excludes hidden entries while hidden files are concealed.
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
A child whose name begins with a dot. Hidden entries are excluded from listings and entry counts while hidden files are concealed, and the Watchdog's inventory skips them — which is why concealing hidden files masks traces.
_Avoid_: Dotfile, secret file
