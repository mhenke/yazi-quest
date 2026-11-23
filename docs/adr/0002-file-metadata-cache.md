# ADR-0002: Gate directory counts on the loaded-folder cache

**Status**: Accepted
**Date**: 2026-11-23
**Deciders**: @mhenke

Yazi's `size` linemode prints a directory's entry count only when that folder is in
the tab's folder cache: the folder was visited, or its preview rendered. It never
renders the column in the parent pane, and it treats archives as files with byte
sizes. Verified against Yazi 26.9.1. The game previously counted every directory
eagerly, in every pane, and counted archive members as if archives were directories.

We model the tab's folder cache as the current directory plus any hovered directory
whose preview has rendered, store those ids in `GameState.loadedDirIds`, and resolve
a directory's entry count only for a loaded folder. Counts filter hidden children
through the live `showHidden` setting; the parent pane shows no linemode; files and
archives show byte sizes. The cache resets with the level.

## Consequences

- Uninspected directories show a blank count; hovering or visiting reveals it for the
  rest of the level, matching the behavior the game teaches.
- Counts derive from the live tree, so mutations and renames appear without a stale
  snapshot.
- The game's `size` default is a deliberate teaching default: stock Yazi opens in
  `none`, but the curriculum and screenshots depend on the column, and `m s`/`,s`
  teach how to restore it. This ADR governs what the column shows once active.
- `docs/adr/0001-keyboard-and-viewport-floor.md` still governs the column's width;
  this ADR governs its contents.
