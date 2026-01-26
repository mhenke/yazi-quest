# Level 9 Redesign Plan: Advanced Regex Filtering

## Current Issues

- `access_token.key` is protected and can't be deleted, causing test failures
- Clunky selection process: manually selecting 3 specific files
- Task completion logic expects only 3 files to remain, but protected files make 4
- Unintuitive workflow: select keepers → invert → delete

## Proposed Solution

Redesign level 9 to use Yazi's regex filtering capabilities with alternation pattern `(pid|sock|key)$` to teach advanced filtering.

## Implementation Steps

### 1. Update Level Description

Change the level description to guide users toward using regex filtering:

```
TARGET: Clean /tmp using advanced filtering
PRESERVE: Files matching pattern (pid|sock|key)$
METHOD: Filter → Select → Invert → Delete
```

### 2. Update Task Completion Logic

Modify task 3 completion check to expect 4 files instead of 3:

- `ghost_process.pid`
- `socket_001.sock`
- `system_monitor.pid`
- `access_token.key`

### 3. Update Task Descriptions

- Task 1: Navigate to `/tmp` and use filter `(pid|sock|key)$` to identify keeper files
- Task 2: Select all keeper files using the filter
- Task 3: Invert selection and permanently delete junk files

### 4. Maintain Educational Goals

- Teach advanced regex filtering with alternation
- Reinforce Ctrl+R (invert selection) concept
- Practice permanent deletion (D) skill
- Demonstrate pattern matching for efficient file operations

### 5. Ensure Compatibility

- Keep the same core challenge (cleaning junk files)
- Maintain the same protective file concept
- Ensure the level remains achievable and educational

## Expected Outcome

- More elegant and intuitive workflow
- Properly functioning task completion with protected files
- Teaching of advanced Yazi filtering capabilities
- Resolved test failures
