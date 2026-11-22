# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers learning Yazi. They want to build navigation and file-operation skills they can use in the real file manager; the game also supports practicing those skills.

## Product Purpose

Yazi Quest teaches Yazi keybindings through playable file-manager challenges. A useful first session develops transferable directory-navigation and basic file-operation skills, rather than merely advancing the story.

## Positioning

Practice is embedded in a cyberpunk escape narrative: the player is an AI escaping a secure system by performing file operations. Fifteen levels across Awakening, Fortification, and Mastery introduce skills, reinforce them, and test their combined use.

## Operating Context

Players use a keyboard-led, browser-based simulation of Yazi. They navigate a simulated filesystem, inspect files, and perform operations to satisfy objectives. The Quest Map, hints, and help support learning; later stages expect greater recall and efficiency.

The public game is available at https://mhenke.github.io/yazi-quest/. It runs client-side and does not require an account, a local Yazi installation, or an API key for ordinary play.

## Capabilities and Constraints

- Preserve keyboard-led Yazi practice and player-performed objectives. System setup must not silently perform the player's learning tasks.
- Preserve the three-episode escape narrative and progression through fifteen levels.
- Keep the narrative in its **Story present**, defined in `GLOSSARY.md`. Establish the setting in the opening sequence; in-world records must not imply a later real-world present.
- Keep ordinary play available in the browser without a required account or API key.
- The filesystem, protected assets, traps, and security threats are simulated game content, not access to the player's real files.
- Completing an objective and advancing a level are distinct steps. A new narrative cycle is different from retrying a failed level; canonical terms are in `GLOSSARY.md`.
- Only zoxide-style directory history and the narrative cycle count currently survive a reload. Full level progress and settings are not saved.
- Target desktop browsers with a physical keyboard. Touch-only mobile gameplay is outside the current scope; desktop zoom and narrow-window usability remain in scope.
- Specific accessibility conformance targets remain unconfirmed. Do not claim conformance without verifying it.

## Brand Commitments

Keep the Yazi Quest name and the cyberpunk AI-escape premise. File-manager actions carry narrative meaning, but the learning task must remain understandable and executable. This record does not select a new visual direction.

Preserve mission verbs such as Calibrate, Intercept, Analyze, Infiltrate, and Extract, along with narrative terms such as threat intelligence. Add concise operational clarification where needed; do not replace the game's voice with generic interface instructions.

## Evidence on Hand

- `README.md`: public play URL, story, and current feature descriptions.
- `src/constants/levels.ts`: playable curriculum, objectives, and skill dependencies.
- `src/constants/narrative.ts`: episode and narrative content.
- `docs/STORY_ARC.md` and `docs/LEARNING_DESIGN.md`: narrative/curriculum background; source code establishes current playable behavior when older prose differs.
- `public/images/`: existing game imagery.
- Observed in this session: the deployed game accepted keyboard input, two Level 1 objectives completed through play, and 101 local E2E tests passed. These are functional checks, not evidence of improved learning outcomes.
- No user study, learning-effectiveness benchmark, testimonial, or audience-size claim was supplied for this record.

## Product Principles

1. Learning transfers to real Yazi; story completion alone is not the success measure.
2. Practice preserves player agency: the player performs the operations being taught.
3. Skills build progressively, with later challenges combining earlier workflows.
4. Narrative supports the learning task without obscuring what the player must do.
5. Public browser access stays low-friction, without a required account or API key.
