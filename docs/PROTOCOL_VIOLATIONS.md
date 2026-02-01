# Protocol Violation Guidelines

To maintain a consistent and educational gameplay experience, Yazi Quest enforces "Protocol Violations" when the player's terminal state deviates from the standard operational baseline.

## Violation Types & Manual Fixes

| Violation            | Description                                       | Manual Fix         |
| :------------------- | :------------------------------------------------ | :----------------- |
| **Filter Violation** | Active filter is narrowing the file view.         | Press `Esc` twice  |
| **Search Violation** | Active search results are displayed.              | Press `Esc` once   |
| **Sort Violation**   | File sorting is not set to `natural` (ascending). | Press `,` then `n` |
| **Hidden Violation** | Hidden files (`.*`) are visible.                  | Press `.`          |

## Navigation Rules

- **Blocking Violations**: Active filters, search results, or non-standard sorting **block** movement between directories (`h`, `l`, `g`, `G`). The player must clear these to navigate.
- **Non-Blocking Violations**: Visible hidden files do **not** block navigation, but must be cleared before finalizing a level.

## Audit Mode (Mission Complete)

When all mission tasks are finished, the system enters **Audit Mode**. If any protocol violations are still active:

1.  The mission success dialog is deferred.
2.  The Status Bar at the bottom will display: **"Press Shift+Enter to auto-fix the violation"**.
3.  Pressing `Shift+Enter` will automatically revert all filters, search queries, sort orders, and hidden file visibility to the baseline.
4.  Once the baseline is restored, the Mission Complete interface becomes active.
