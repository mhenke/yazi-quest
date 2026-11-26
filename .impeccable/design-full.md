---
version: 'alpha'
name: Yazi Quest
description: The Containment Terminal — cinematic instrumentation for learning Yazi.
colors:
  primary: '#3b82f6'
  fortification-purple: '#a855f7'
  mastery-yellow: '#eab308'
  signal-orange: '#f97316'
  directory-cyan: '#22d3ee'
  success-green: '#22c55e'
  danger-red: '#ef4444'
  void-black: '#000000'
  ground: '#09090b'
  console-zinc: '#18181b'
  raised: '#27272a'
  border-strong: '#3f3f46'
  text-main: '#d4d4d8'
  text-muted: '#a1a1aa'
  text-white: '#ffffff'
typography:
  body:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: '20px'
  label:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: '16px'
rounded:
  square: '0px'
  small: '2px'
  utility: '4px'
spacing:
  unit: '4px'
  tight: '8px'
  row: '12px'
  panel: '16px'
  bar: '24px'
components:
  toolbar-button:
    backgroundColor: '{colors.console-zinc}'
    textColor: '{colors.text-muted}'
    rounded: '{rounded.utility}'
    size: '32px'
  text-field:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-white}'
    typography: '{typography.body}'
  file-row-current:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-white}'
    rounded: '{rounded.square}'
  dir-row:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.directory-cyan}'
  episode-tab:
    backgroundColor: '{colors.void-black}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
  tab-ep2:
    backgroundColor: '{colors.void-black}'
    textColor: '{colors.fortification-purple}'
  tab-ep3:
    backgroundColor: '{colors.void-black}'
    textColor: '{colors.mastery-yellow}'
  keycap:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-main}'
    rounded: '{rounded.utility}'
  mission-log-header:
    backgroundColor: '{colors.console-zinc}'
    textColor: '{colors.signal-orange}'
  mode-badge-input:
    backgroundColor: '{colors.success-green}'
    textColor: '{colors.void-black}'
  status-pos:
    backgroundColor: '{colors.border-strong}'
    textColor: '{colors.text-main}'
  watchdog-red:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.danger-red}'
---

# Design System: Yazi Quest

## Overview

**Creative North Star: "The Containment Terminal"**

Technical, tense, and restrained. The interface is the instrument through which the player escapes: file lists, path prompts, mode indicators, and operational messages carry the fiction rather than sitting inside a separate game dashboard.

Components read as cinematic instrumentation, not generic cards. Working surfaces stay flat and legible; overlays and active signals carry depth. This records the existing implementation and the user's confirmed descriptive direction, not a new visual world or a claim that every current detail meets an accessibility standard.

**Key Characteristics:**

- Dense, keyboard-led terminal information.
- Tonal pane separation and thin utility borders.
- Episode-specific signals within a stable dark environment.
- Narrative pressure expressed through messages, glitches, and transitions.

Evidence: `index.html`, local CSS, `src/components/`, and rendered desktop workspace/help/input states. Token names below describe existing utility values; `:root` CSS custom properties in `src/index.css` mirror the frontmatter palette alongside the compiled Tailwind utilities.

## Colors

Void Black and Console Zinc anchor the working environment; brighter colors identify chapter, file type, mode, operation, or threat rather than filling every surface. Frontmatter is the normative value record.

### Primary

- **Awakening Blue** (`primary`): Episode I headings, progression, normal-mode status badge, and navigation/input signals.

### Secondary

- **Fortification Purple** (`fortification-purple`): Episode II identity and filter-mode status badge.
- **Mastery Yellow** (`mastery-yellow`): Episode III identity; also marks selections and incomplete task progress, so chapter color is not the only yellow meaning.

### Tertiary

- **Signal Orange** (`signal-orange`): Mission-log headings, user identity, visual-mode status badge, and operational emphasis.
- **Directory Cyan** (`directory-cyan`): Directory/file-type cues and instrumentation.
- **Success Green / Danger Red** (`success-green`, `danger-red`): Completion, input mode, and threat/watchdog cues. Preserve their local context rather than assigning a new global meaning.

### Neutral

- **Void Black / Ground** (`void-black`, `ground`): Page backing, high-contrast badge foregrounds, and inactive/preview areas.
- **Console Zinc / Raised** (`console-zinc`, `raised`): Working panes, current rows, fields, keycaps, and overlays.
- **Border Strong** (`border-strong`): Utility separators, field edges, and status-bar position blocks.
- **Text Main / Text Muted / Text White** (`text-main`, `text-muted`, `text-white`): Functional text hierarchy. Dim readable text uses `text-muted` rather than element opacity or darker zinc steps so labels stay above 4.5:1 on dark planes.

**The Episode Signal Rule.** Keep the episode mapping stable across story and progression: Awakening Blue, Fortification Purple, Mastery Yellow.

## Typography

File rows, status information, keycaps, and control labels use a system monospace stack. Working file data remains 14px (`body`); functional labels and metadata use a 12px floor (`label`). Cinematic headings retain their larger, tightly tracked treatment.

The application uses the system-monospace stack consistently for headings, body copy, controls, and operational rows. Heading, body, and label roles differ through size, weight, spacing, and color rather than a second family.

Uppercase labels, compact spacing, and tabular metadata support the terminal character. Functional metadata uses the lighter text hierarchy rather than dim decorative tones; keep element `opacity` for decorative states rather than readable text.

## Layout

The working surface fills the viewport with a top progression/control bar, a path prompt, the three-pane file-manager region (parent context, active files, and preview), and a bottom status bar. The preview pane hosts a collapsible mission log drawer (`Alt+O`) below its content.

Platform scope is desktop with a hardware keyboard at 1024 CSS px or wider (ADR-0001). Below 1024 px or on touch-primary devices (`(hover: none) and (pointer: coarse)`), the file manager yields to a plain product notice (`RequirementNotice`) stating the requirement, while cinematic sequences remain reachable below 1024 px. The page hides outer overflow and relies on internal pane scrolling.

The top bar is at least `64px` (`min-h-16`) and wraps cleanly when text scales; the bottom status bar is `48px`. The parent context pane is fixed at `256px` (`w-64`), while active files and preview share the remaining space (`flex-1`). Mission-log content uses a minimum height (`160px`) and up to 40% of the preview pane when expanded. Utility overlays shrink to the available width without changing the file-manager layout.

## Elevation & Depth

Flat working surfaces are separated by tone and thin borders. Overlays use dark translucent backdrops, blur, and large soft shadows; active progression and search states occasionally add restrained glow. Shadows express interruption or focus, not a repeating raised-card grid.

**The Working Plane Rule.** Reserve depth for overlays and active signals; keep the file-manager working plane flat.

## Shapes

The dominant geometry is rectangular: contiguous panes, square file rows (`0px`), thin dividers, and compact fields. Small rounding (`2px`–`4px`) appears on utility buttons, mode badges, keycaps, and some dialog shells. Tiny circles and rounded connectors indicate progression rather than serving as decorative containers.

## Motion & Micro-interaction

Fast, restrained color transitions keep terminal interactions crisp: `row-colors` (`75ms`, `cubic-bezier(0.4, 0, 0.2, 1)`) for file-row cursor changes, `utility-colors` (`150ms`) for toolbar and button hover states, and `pane-colors` (`300ms`) for pane and progression transitions. Detailed motion tokens live in the design sidecar.

Glitch slices, flicker, scan lines, and color offsets carry narrative pressure. Respect the OS `prefers-reduced-motion` preference and the in-game Minimal preset with static text and state cues. The Reduced preset removes the background scanline and automatic gameplay glitches while keeping cinematic pacing.

## Components

- **Toolbar buttons** (`toolbar-button`, in LevelProgress): Compact icon controls, muted at rest, with visible focus. `Shift+Tab` from the file browser reaches the toolbar; `Tab` in the file browser remains file inspection.
- **Text fields** (`text-field`, in InputModal): Monospaced, raised backgrounds, light text, thin borders, and operation-specific border color. Dialogs focus their input automatically; this behavior belongs to the application, not the static sidecar preview.
- **Episode navigation** (`episode-tab`, `tab-ep2`, `tab-ep3`, in LevelProgress): Compact uppercase tabs with active episode color and a bottom border. Top-bar progress uses smaller nodes and connectors. Preserve chapter identity across both forms.
- **File rows** (`file-row-current`, `dir-row`, in FileSystemItem): Flat raised highlight with light text for cursor focus; directories use cyan iconography and text cues. Marked, cut, and yanked states add distinct color, icon, and opacity treatments. Current position and marked selection are separate states.
- **Keycaps** (`keycap`, in HelpModal): Small bordered utility rectangles pairing command notation with explanatory text. Preserve uppercase/lowercase distinctions and multi-key sequences.
- **Mission-log panel** (`mission-log-header`, in MissionDrawer): Collapsible operational header above target/objective content; checkboxes, strikethrough, and completion color indicate task state. Keep mission navigation in the drawer and Quest Map; do not add a left mission sidebar.
- **Status bar badges & watchdog** (`mode-badge-input`, `status-pos`, `watchdog-red`, in StatusBar): Mode pills pair solid `-500` accents (blue/green/purple/orange) with Void Black text above 4.5:1; position blocks pair `border-strong` with `text-main`; watchdog alerts escalate into `danger-red` on `ground`.

The design sidecar contains self-contained visual specimens of the core patterns. They are style previews, not replicas of gameplay handlers.

## Do's and Don'ts

### Do:

- **Do** preserve the Containment Terminal's technical, tense, restrained character.
- **Do** use episode color as a consistent progression signal.
- **Do** distinguish current position, marked selection, clipboard state, and completion.
- **Do** keep working surfaces flat and reserve depth for overlays and active signals.
- **Do** verify legibility and keyboard state at the viewport and effect intensity being changed.

### Don't:

- **Don't** replace the file-manager composition with a generic card dashboard.
- **Don't** introduce a left mission sidebar; retain the established navigation model.
- **Don't** treat tiny dim text, missing focus cues, or clipped narrow layouts as binding brand rules.
- **Don't** treat narrow desktop reflow checks as touch gameplay support or accessibility conformance.
