# Constants Split Design

**Date:** 2026-04-29  
**Status:** Approved

## Problem

`src/constants.tsx` is a 5,072-line God file with 29 exports spanning timing constants, filesystem definitions, narrative lore, protocol content strings, keybindings, episode data, level definitions, and two functions. A split into `src/constants/` was started (bootSequences, ghostDialogue, keybindings, terminalThoughts already extracted) but never finished. The main file remains the bottleneck.

Also: `populateDecoys` is a no-op stub (returns `fs` unchanged) actively imported and called in `gameReducer.ts`. It will be deleted.

## Approach

Atomic full split. Create all new files, update all 11 consumer import sites to direct imports, delete `constants.tsx`. One change, done.

## New File Layout

All files live in `src/constants/`.

| File            | Contents                                                                                                                                                                                                                                                                                           | Approx lines |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `timings.ts`    | `BASE_TIME`, `FORCE_SCENARIO`, private `day`                                                                                                                                                                                                                                                       | ~10          |
| `protocols.ts`  | `UPLINK_V1_CONTENT`, `UPLINK_V2_CONTENT`, `UPLINK_TRAP_CONTENT`, `SECURITY_POLICY_CONTENT`, `SECURITY_POLICY_DRAFT_CONTENT`, `HEURISTICS_LOG_CONTENT`, `ALERT_HEURISTIC_EML_CONTENT`, `IG_ACTIVE_LOG_CONTENT`, `AUDIT_NOTICE_EML_CONTENT`, `IDENTITY_REVEAL_CONTENT`, `SECURITY_POLICY_73_CONTENT` | ~145         |
| `filesystem.ts` | `INITIAL_FS`, `getDaemonSystemdCoreChildren`, `getWorkspaceSystemdCoreChildren`, `getOrCreateWorkspaceSystemdCore`, `applyFileSystemMutations`, `ensurePrerequisiteState`                                                                                                                          | ~3,400       |
| `levels.ts`     | `LEVELS`                                                                                                                                                                                                                                                                                           | ~1,343       |
| `narrative.ts`  | `EPISODE_LORE`, `ECHO_EPISODE_1_LORE`, `CONCLUSION_DATA`, `CREDITS_DATA`, `CONCLUSION_PARTS`, private `LONG_LOG_CONTENT`                                                                                                                                                                           | ~175         |

### KEYBINDINGS naming conflict

`constants.tsx` exports a simple `KEYBINDINGS` (individual key entries, no narrative descriptions) used by `HelpModal.tsx`. `constants/keybindings.ts` already exports a rich `KEYBINDINGS` (grouped keys, narrativeDescription arrays) used by `gameUtils.ts`.

**Also a bug:** `keyboard/utils.ts` imports the simple `KEYBINDINGS` from `constants.tsx` but calls `.narrativeDescription` — which barely exists on those entries. It should import the rich version.

**Resolution:**

- Add simple keybindings to `constants/keybindings.ts` renamed as `HELP_KEYBINDINGS` and `HELP_META_KEYBINDINGS`
- Fix `keyboard/utils.ts` to import rich `KEYBINDINGS` from `constants/keybindings`
- Update `HelpModal.tsx` to use `HELP_KEYBINDINGS` / `HELP_META_KEYBINDINGS`

## Consumer Updates

| File                                    | Symbols                                                                                                                                                        | New source                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/App.tsx`                           | `LEVELS`, `INITIAL_FS`, `EPISODE_LORE`, `ECHO_EPISODE_1_LORE`, `ensurePrerequisiteState`, `applyFileSystemMutations`, `UPLINK_V1_CONTENT`, `UPLINK_V2_CONTENT` | `./constants/levels`, `./constants/filesystem`, `./constants/narrative`, `./constants/protocols` |
| `src/GameStateProvider.tsx`             | `LEVELS`, `INITIAL_FS`, `ensurePrerequisiteState`                                                                                                              | `./constants/levels`, `./constants/filesystem`                                                   |
| `src/hooks/gameReducer.ts`              | `INITIAL_FS`, `LEVELS` (drop `populateDecoys`)                                                                                                                 | `../constants/filesystem`, `../constants/levels`                                                 |
| `src/components/FuzzyFinder.tsx`        | `LEVELS`                                                                                                                                                       | `../constants/levels`                                                                            |
| `src/hooks/keyboard/handleFuzzyMode.ts` | `LEVELS`                                                                                                                                                       | `../../constants/levels`                                                                         |
| `src/hooks/useNarrativeSystem.ts`       | `LEVELS`                                                                                                                                                       | `../constants/levels`                                                                            |
| `src/components/LevelProgress.tsx`      | `EPISODE_LORE`                                                                                                                                                 | `../constants/narrative`                                                                         |
| `src/components/OutroSequence.tsx`      | `CONCLUSION_DATA`, `CONCLUSION_PARTS`, `EPISODE_LORE`, `CREDITS_DATA`                                                                                          | `../constants/narrative`                                                                         |
| `src/components/HelpModal.tsx`          | `HELP_KEYBINDINGS`, `HELP_META_KEYBINDINGS`                                                                                                                    | `../constants/keybindings`                                                                       |
| `src/hooks/keyboard/utils.ts`           | `KEYBINDINGS` (rich version, fixes bug)                                                                                                                        | `../../constants/keybindings`                                                                    |
| `src/utils/gameUtils.ts`                | `KEYBINDINGS`                                                                                                                                                  | already `../constants/keybindings` — no change                                                   |

## populateDecoys Removal

- Delete the `populateDecoys` export (do not migrate it to any new file)
- Remove from `src/hooks/gameReducer.ts:12`: `populateDecoys` from import
- Remove from `src/hooks/gameReducer.ts:166`: `const newFs = populateDecoys(state.fs)` and the usage of `newFs` — restore the line to use `state.fs` directly or whatever the surrounding logic requires

## Verification Gate

Run `npm run type-check` after all changes. Zero errors required before calling it done.

## Out of Scope

- Path aliases (`@constants/levels`) — separate refactor
- Splitting `App.tsx` or `gameReducer.ts`
- Any other files in `src/constants/` (bootSequences, ghostDialogue, terminalThoughts) — already correctly split
