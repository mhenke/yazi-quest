# ADR-0001: Require hardware modifiers and a 1024 px viewport

**Status**: Accepted
**Date**: 2026-11-22
**Deciders**: @mhenke

## Context

Yazi Quest teaches Yazi keybindings by making the player perform them. That premise
constrains the input device and the layout:

- Yazi navigation is keyboard-only. The curriculum teaches `j`/`k`/`h`/`l`, `gg`/`G`,
  `Space`, `y`/`p`/`x`, `s`, `f`, `z`/`Z`, and `gc`/`gi`/`gr`. There is no pointer or
  touch equivalent that transfers.
- The composition mirrors Yazi's three panes: parent, current, preview. The preview
  pane is split between file contents and the mission brief (TARGET / OBJECTIVES).
- The game was reachable at any width. Below `lg` the parent pane is `hidden lg:flex`,
  so narrow windows played in two columns with an increasingly cramped brief; a shipped
  fix hides the size column below `sm` so filenames keep their width. The remaining
  question was whether a two-column mode should be the product, not whether it renders.

Measured at Level 6, viewport height fixed at 900 px, with **three columns forced on**
at each width — note the game does not render three columns below 1024 px today, it
plays two, so these rows describe a layout the ADR chooses to require rather than one
a player has seen:

| Viewport width | Parent | Current | Preview | Mission brief            |
| -------------- | ------ | ------- | ------- | ------------------------ |
| 722            | 256    | 232     | 233     | filename span 34 px      |
| 768            | 256    | 255     | 257     | 18.8 chars/line, 5 lines |
| 900            | 256    | 321     | 323     | 31.3 chars/line, 3 lines |
| 1024           | 256    | 383     | 385     | 31.3 chars/line, 3 lines |
| 1280           | 256    | 511     | 513     | 47 chars/line, 2 lines   |

Read from the table: at 768 px the 257 px preview column wraps "mandatory. Move fast."
across three lines, and filenames collapse to 34 px at 722 px. These widths are the
_project owner's_ reported band ("400 px and 430 px unplayable; 800 px plays"); the
table shows the forced layout is not worth restoring there.

The parent pane is the fixed cost. It is 256 px at every width, so three columns give
the preview `(W − 256) / 2` while the two-column mode this ADR replaces gives it
`W / 2`: three columns always cost the brief 128 px, and the gap only closes above
~1150 px.

The project owner measured 800 px as the smallest width that plays comfortably — in
the two-column mode. That reading is not contradicted here and does not set the floor:
the floor exists because the composition at 800 px is not Yazi's, not because the
rendering is unusable. Option 2 covers the difference; the floor picks where
three columns begin.

Reported by the project owner from real use: 400 px and 430 px are unplayable,
800 px is the smallest width that plays comfortably, and tablets in landscape are
unsuitable because the game reads primary input, not form factor: a touch-primary
device is refused wherever the viewport is large enough to play, and a keyboarded
tablet reports touch-primary on iPadOS Safari, Android Chrome/Firefox, and Surface
tablet mode alike, so the pointer gate refuses it. A tablet that does reach the game
would play, but no tested browser reports `pointer: fine` on one.

## Decision Drivers

- **Learning transfer** is the product's success measure (`PRODUCT.md`, principle 1).
  Touch input teaches nothing about Yazi.
- **Composition fidelity**: Yazi is three panes — parent, current, preview. Two columns
  is not Yazi, and the game must not teach a composition Yazi does not have.
- **Do not present a broken layout.** A degraded two-column mode is worse than an
  honest refusal, because the player cannot tell the difference between their mistake
  and a crushed pane.

## Considered Options

### Option 1: Soft-keyboard support

Rely on the on-screen keyboard so phones and tablets can play.

Rejected on input capability. Letters, `Shift+Enter`, and the core cut/yank/paste keys
(`x`/`y`/`p`) work on a soft keyboard. But select-all and invert-selection bind
`Ctrl+A` and `Ctrl+R`, fuzzy-find navigation binds `Ctrl+N`/`J` and `Ctrl+P`/`K`, the
utility panels bind `Alt+M`/`Alt+H`/`Alt+?`, and key repeat — used to move continuously
with a held key — is absent on iOS. iPadOS cannot send `Ctrl` or `Alt` at all, and
Android only sends them through non-standard two-key sequences. Support would
require inventing an input scheme, not Yazi.

### Option 2: Two columns below the floor

Keep the file-manager view reachable at every width by dropping the parent pane, as it
does today.

Rejected because two columns is not Yazi. Yazi shows parent, current, and preview
together; that is the composition being taught, and a two-column window teaches a
different file manager. Readability is not the gate: once the size column yields
(`hidden sm:block`, shipped), two columns are legible down to ~560 px, and the preview
actually reads _better_ in two columns at a given width, because the parent pane costs
it exactly 128 px at every viewport. Legible-but-wrong loses to honest refusal.

### Option 3: Minimum viewport plus a product notice

Require a keyboard at any width, and require 1024 CSS px for the file-manager view.
Below either threshold, show a product notice that names the requirement.

Accepted.

### Option 4: Detect hardware-modifier capability exactly

Refuse only devices that cannot send `Ctrl`/`Alt`, admitting keyboard-equipped tablets.

Rejected as unbuildable. No CSS media feature, and no permission-free browser API,
reports whether a hardware keyboard is attached. Detecting the first keypress is
possible, but it cannot run before the player has already been shown a refusal. The
pointer proxy in Option 3 is the closest available approximation and is documented
as such.

## Decision

1. **Hardware modifiers are required.** The game binds actions to `Ctrl` and `Alt`
   chords that a soft keyboard cannot send: `Ctrl+A` for select-all and `Ctrl+R` for
   invert-selection (`handleClipboard.ts:276,293`), `Ctrl+N`/`J` and `Ctrl+P`/`K` for
   fuzzy-find navigation (`handleFuzzyMode.ts:58,67`), and `Alt+M`/`Alt+H`/`Alt+?` for
   the Quest Map, hints, and help (`App.tsx:1082-1471`). Cut, yank, and paste are plain
   letters (`x`, `y`, `p`, `handleClipboard.ts:338,339,484`) and a soft keyboard sends
   them, so a soft keyboard can move and act through part of the clipboard loop — but
   it cannot reach select-all, invert, fuzzy keyboard-navigation, or the utility
   panels, and the curriculum requires those.
   Because no media feature reports whether a hardware keyboard is attached, the game
   probes `(hover: none) and (pointer: coarse)` as a best-effort proxy and shows a
   product notice when it matches. The proxy is also imperfect: iPadOS Safari reports
   `pointer: coarse` even with a hardware keyboard connected, so every iPad is refused
   regardless; and a Windows touch monitor with no keyboard reports `pointer: fine` and
   is admitted despite lacking the required modifiers. A hardware keyboard is the one
   input that satisfies both, and that is what the requirement names.
2. **The file-manager view requires 1024 CSS px** (`lg`, matching the existing
   breakpoint that already reveals the parent pane). Below it, a product notice
   explains the width requirement. Unlike the modifier requirement, width is measured
   exactly: an iPad Pro in landscape is 1366 CSS px and passes, a narrow desktop window
   does not.
3. **Both notices are product messages**, per `GLOSSARY.md`: they speak for Yazi Quest
   about the player's real device, and must not adopt the containment terminal's voice.
4. **The cinematic surfaces are exempt from the floor.** The Episode intro and the
   Conclusion are single-column narrative; measured, they still render and advance at
   320×200 CSS px. A player zoomed to 400% on a 1280 px desktop therefore gets the
   story, then the notice, rather than being locked out entirely — this preserves the
   existing reflow work rather than discarding it, and it is the surface a screen-reader
   or low-vision player reaches first.

## Consequences

### Positive

- The three-column composition is intact wherever the game is playable, so every
  player learns the same Yazi layout.
- Narrow windows no longer render a second, silently broken layout to maintain.
- The `lg` reveal of the parent pane and the playable floor are now the same number,
  so the breakpoint cannot drift from the requirement.

### Negative

- Every touch-primary device is refused regardless of attached keyboard, because
  iPadOS Safari, Android Chrome and Firefox, and Windows Surface tablet mode all keep
  `pointer: coarse` as the primary report when a mouse or trackpad is connected
  ([WebKit 209292](https://bugs.webkit.org/show_bug.cgi?id=209292),
  [Chromium 1028118](https://bugs.chromium.org/p/chromium/issues/detail?id=1028118)).
  Tablet landscape is therefore excluded on every tested browser.
- A desktop window narrower than 1024 px cannot play, where it previously could
  (poorly). This reverses the earlier "narrow windows remain in scope" position.
- WCAG 1.4.10 (Reflow) is not met for the file-manager view at 320 CSS px. The
  two-dimensional-layout exception applies to a documented file-manager composition,
  but the claim should not be made without a recorded conformance decision. Cinematic
  surfaces remain reflow-safe below the floor, so a zoomed player is not stranded
  without explanation.

### Risks

- The keyboard probe is a proxy, and it is wrong in both directions: it over-blocks
  iPadOS with peripherals and under-blocks a Windows touch monitor without a keyboard.
  Treat it as a guardrail against the worst case (a phone), not a precise capability test.
  **Revisit this ADR if** [WebKit 209292](https://bugs.webkit.org/show_bug.cgi?id=209292)
  or [Chromium 1028118](https://bugs.chromium.org/p/chromium/issues/detail?id=1028118)
  is fixed and `any-pointer` begins to report attached trackpads — a keyboarded tablet
  would then correctly be admitted, and the "every iPad is refused" consequence lapses.
- Players on 1366×768 laptops at 125–150% OS scaling land near or below the floor
  and will see the notice. The notice must therefore state the requirement in CSS
  pixels, not in vague "larger screen" terms.
- The five 320 px tests in `keyboard-accessibility.spec.ts` describe a path most
  players no longer reach. They remain valid as regression coverage for zoomed users;
  they are not evidence that narrow gameplay works.

## Implementation Notes

- Touch gate: shipped. `index.html` styles plus the mount guard in `src/index.tsx`
  (`(hover: none) and (pointer: coarse)`).
- Size column yielding below `sm` (640 px): shipped, in `FileSystemItem.tsx`. It only
  matters in the two-column mode this ADR retires; at 1024 px and above the size column
  is shown and names still measure 185 px.
- Width floor: shipped. `useViewportFloor` gates the file-manager view at
  `min-width: 1024px` inside `App.tsx`, below the cinematic branches, with
  `WidthNotice` shown below it. Four E2E tests cover the split: two gameplay tests
  moved to 1024 px, one asserts the notice replaces the game at 320 px, and the
  cinematic tests stay at 320 px per Decision 4.
- `PRODUCT.md` previously stated that narrow windows remain in scope; this ADR
  supersedes that line.

## Related Decisions

- `GLOSSARY.md`: **Product message** and **In-fiction message** — the voice boundary
  these notices depend on.
- `docs/yazi-mobile-research.md`: source research on Yazi's Android/Termux support,
  which does not imply touch gameplay here.

## References

- `PRODUCT.md` — Capabilities and Constraints
- `src/App.tsx` — pane composition; parent pane is `hidden lg:flex`
- `src/components/PreviewPane.tsx` — mission brief lives in the preview pane's lower section
- [WCAG 2.2 SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
