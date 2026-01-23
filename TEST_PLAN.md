# Yazi Quest Test Plan

## Issue Summary

The episode intro tests are failing because:

1. The game has two pathways for episode intros: skip intro (`?intro=false`) and play intro (default)
2. Both pathways should result in the same starting state
3. The BIOS boot screen should respond to Shift+Enter before text finishes typing
4. Tests are brittle due to incorrect selectors and assumptions about directory positions

## Current State

- Level 1 starts in `~/` (home directory) with `initialPath: ['root', 'home', 'guest']`
- Episode intro appears at start of Episodes 1 (Level 1), 2 (Level 6), and 3 (Level 11)
- BIOS screen may appear on certain level starts

## Test Strategy

Create a single, robust test file that verifies both pathways work correctly for each episode start level.

## Plan

### 1. Fix Selector Issues

- Use more robust selectors for intro screens
- Use more robust selectors for BIOS screen
- Add proper waits and timeouts

### 2. Create Dry Test Structure

- Use a loop to test all episode start levels (1, 6, 11)
- For each level, test both skip intro and play intro pathways
- Verify both result in same starting state

### 3. Test Cases for Each Episode Start Level

- Skip intro pathway: `?lvl=X&intro=false`
- Early Shift+Enter pathway: Press Shift+Enter before text completes
- Full completion pathway: Let text finish, then press Shift+Enter
- Verify all result in same starting state

### 4. BIOS Screen Tests

- Test that Shift+Enter works before text completes
- Test that normal completion works

### 5. Implementation

Create `intro-pathway-tests.spec.ts` with:

- Loop through episode start levels
- For each level, test all pathways
- Add proper error handling and screenshots
