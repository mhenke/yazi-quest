# Design Analysis: Security Indicator Placement

Moving the security indicators (Watchdog/Heuristic Scan) to a top navigation bar introduces several architectural and UX trade-offs that require scrutiny:

## The Structural Pivot: Split-Pane Metadata

Based on the existing UI architecture, we have a unique opportunity to clearly delineate **File Operations** from **Narrative Pressure**.

### 1. The "Narrative & Security" Top Tier

Currently, `LevelProgress.tsx` handles AI thoughts, Quest Map, and Episode Progress. It is the logical home for the **Watchdog**.

- **Move to Top:** Watchdog Console, Timer, and AI Thoughts.
- **Benefits:** Consolidates all "External Pressure" in one place. When the system is scanning or auditing (Heuristic/Instruction Guard), the _entire_ top of the screen becomes the source of urgency.
- **Visual Strategy:** The `LevelProgress` bar should become more dynamic. If the threat level is high, the bar's background could shift from `black/50` to a pulsing `red/20` or `yellow/20`.

### 2. The "Utility & Breadcrumb" Bottom Tier

The `StatusBar` currently tries to do too much. By offloading the Watchdog and Timer, we can fix the ergonomics of file management.

- **Stay at Bottom:** Mode Pill, File Name, Task Counter, Filters, Clipboard, and Stats.
- **Benefits:** These are all "Input-Proximal" data. When the user is typing or navigating, they need to see their Mode and Path.
- **Adjustment:** We can revert the `StatusBar` height to `h-9` or `h-10` to reclaim vertical space, now that it doesn't need to house the large Watchdog console.

---

## Concrete Proposal: The "Command Tier" vs "System Tier"

| Tier                 | Component                             | Contents                                                                          |
| :------------------- | :------------------------------------ | :-------------------------------------------------------------------------------- |
| **SYSTEM (Top)**     | `TopHeader` (Revised `LevelProgress`) | Watchdog Status (Vibrant/Urgent), AI Thoughts, Stage Progress, Timer, Map Access. |
| **NAV (Upper)**      | `BreadcrumbHeader`                    | Current Path, Active Filter/Search string.                                        |
| **COMMAND (Bottom)** | `StatusBar`                           | Mode Indicator (INS/NOR/VIS), File Name, Task Count (X/Y), Clipboard.             |

### Urgency Implementation:

When Watchdog enters `Urgent` state:

- The `TopHeader` gets a high-contrast border-bottom and background animation.
- A "System Alert" glitch effect triggers from the top down.
- This creates a clear visual distinction between "Navigating your files" and "Fighting the system."

---

## Critical Gaps in this Analysis & Proposal

As a critical collaborator, I must highlight where this proposal is logically or ergonomically flawed:

### 1. The Foveal Distance Risk (The biggest gap)

In TUI usage, the "Action Center" is the cursor. By moving the **Watchdog** (Risk) to the opposite pole of the **Mode** (Current Action), we are forcing the player to perform constant vertical eye-tracking.

- **The Gap:** If a player is focused on a fast sequence of keypresses in the bottom third of the screen, they may miss the Watchdog threshold alerts at the top. This effectively _reduces_ urgency by distance.

### 2. Narrative/Visual Collision

The `LevelProgress` bar already houses the **AI Thoughts** with a heavy glitch effect.

- **The Gap:** If the Watchdog also uses an "Urgent Pulse" in the same horizontal band, we risk creating **visual mud**. The HUD could become a flickering mess of orange (Thoughts) and yellow/red (Watchdog), making both hard to read during high-stress moments.

### 3. Structural Coupling (Technical Gap)

The proposal suggests revising `LevelProgress.tsx`.

- **The Gap:** `LevelProgress` is a "Static Progress" component. Forcing it to become a "Dynamic Security HUD" is a violation of the Single Responsibility Principle. This will lead to brittle code where a change in Level Map logic breaks System Security rendering.

### 4. Modal Hierarchy Issues

Currently, `ThreatAlert` and `ConfirmationModal` appear in the center.

- **The Gap:** If the Top Header is designed to represent "Global Pressure," does it remain visible behind or above these modals? If a modal blocks the Top Headers, the "System Urgency" is lost precisely when the player needs to see the state that led to the modal.

---

## Conclusion: The Pivot

The proposal to move to the top is valid for **distinctness** but risky for **reaction time**. If we proceed, the Top Header must be reinvented as a dedicated `SystemHUD` component, not a patched `LevelProgress` bar.
