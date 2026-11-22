---
name: Yazi Quest
description: The Containment Terminal — cinematic instrumentation for learning Yazi.
colors:
  void-black: '#000000'
  ground: '#09090b'
  console-zinc: '#18181b'
  raised: '#27272a'
  border-strong: '#3f3f46'
  text-main: '#d4d4d8'
  text-muted: '#a1a1aa'
  text-dim: '#71717a'
  text-white: '#ffffff'
  awakening-blue: '#3b82f6'
  fortification-purple: '#a855f7'
  mastery-yellow: '#eab308'
  signal-orange: '#f97316'
  directory-cyan: '#22d3ee'
  success-green: '#22c55e'
  danger-red: '#ef4444'
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
    textColor: '{colors.text-muted}'
    rounded: '{rounded.utility}'
    width: '32px'
    height: '32px'
  text-field:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-white}'
    typography: '{typography.body}'
    padding: '8px 12px'
  file-row-current:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-white}'
    typography: '{typography.body}'
    rounded: '{rounded.square}'
    padding: '2px 12px'
  episode-tab:
    textColor: '{colors.awakening-blue}'
    typography: '{typography.label}'
    padding: '12px 0'
  keycap:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.text-main}'
    typography: '{typography.label}'
    rounded: '{rounded.utility}'
    padding: '2px 6px'
  mission-log-header:
    backgroundColor: '{colors.console-zinc}'
    textColor: '{colors.signal-orange}'
    padding: '8px 12px'
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

Evidence: `index.html`, local CSS, `src/components/`, and rendered desktop workspace/help/input states. Token names below describe existing utility values; the application does not currently expose these as a unified CSS-variable theme.

## Colors

Void Black and Console Zinc anchor the working environment; brighter colors identify chapter, file type, operation, or threat rather than filling every surface. Frontmatter is the normative value record.

### Primary

- **Awakening Blue:** Episode I headings and progression; also appears in navigation/input signals.

### Secondary

- **Fortification Purple:** Episode II identity.
- **Mastery Yellow:** Episode III identity. Yellow also marks selections and incomplete task progress; chapter color is not the only yellow meaning.

### Tertiary

- **Signal Orange:** Mission-log headings, user identity, and operational emphasis.
- **Directory Cyan:** Directory/file-type cues and instrumentation.
- **Success Green / Danger Red:** Completion, operation, and threat cues. Preserve their local context rather than assigning a new global meaning.

### Neutral

- **Void Black / Ground:** Page backing and inactive/preview areas.
- **Console Zinc / Raised:** Working panes, current rows, fields, and overlays.
- **Border Strong:** Utility separators and field edges.
- **Text Main / Text Muted / Text Dim / Text White:** Existing text hierarchy. Dim metadata is an observed convention, not a blanket contrast exemption.

**The Episode Signal Rule.** Keep the episode mapping stable across story and progression: Awakening Blue, Fortification Purple, Mastery Yellow.

## Typography

File rows, status information, keycaps, and many control labels use a system monospace stack. Working file data remains 14px; functional labels and metadata use a 12px floor. Cinematic headings retain their larger, tightly tracked treatment.

The application uses the existing system-monospace stack consistently for headings, body copy, controls, and operational rows. The competing Montserrat/Courier declarations and unused JetBrains Mono webfont import were removed. Heading, body, and label roles differ through size, weight, spacing, and color rather than a second family.

Uppercase labels, compact spacing, and tabular metadata support the terminal character. Functional metadata uses the lighter text hierarchy rather than the dim decorative tones; inactive parent-pane opacity must also be considered when checking contrast.

## Layout

The working surface fills the viewport with a top progression/control bar, a path prompt, the file-manager region, and a bottom status bar. At desktop widths the file-manager region contains parent context, active files, and preview; the preview currently includes a persistent mission log below its content.

The parent pane is hidden below the large breakpoint. The preview remains alongside the active pane; the source does not establish a fully redesigned phone workflow. The page hides outer overflow and relies on internal scrolling. Do not turn those facts into a claim of complete mobile support.

The top bar is approximately 57px tall in the observed desktop state; the bottom bar is 48px. Parent context uses a 256px width on large screens. Mission-log content uses a minimum height and a proportion of the preview; input overlays currently have a 400px minimum width. These constraints describe the implementation, including limits the critique may identify.

## Elevation & Depth

Flat working surfaces are separated by tone and thin borders. Overlays use dark translucent backdrops, blur, and large soft shadows; active progression and search states occasionally add restrained glow. Shadows express interruption or focus, not a repeating raised-card grid.

**The Working Plane Rule.** Reserve depth for overlays and active signals; keep the file-manager working plane flat.

Glitch slices, flicker, scan lines, and color offsets carry narrative pressure. Existing reduced-motion rules and the narrative-effects setting are present, but their effectiveness must be checked per effect rather than assumed globally.

## Shapes

The dominant geometry is rectangular: contiguous panes, square file rows, thin dividers, and compact fields. Small rounding appears on utility buttons, keycaps, badges, and some dialog shells. Tiny circles and rounded connectors indicate progression rather than serving as decorative containers.

## Components

- **Toolbar buttons:** Compact icon controls, muted at rest; hover introduces a raised tone, stronger border, and role-specific signal color. Focus treatment is inconsistent in current source, so there is no system-wide focus-ring token to extract.
- **Text fields:** Monospaced, raised backgrounds, light text, thin borders, and operation-specific border color. Dialogs focus their input; this behavior belongs to the application, not the static sidecar preview.
- **Episode navigation:** Compact uppercase tabs with active color and a bottom border. Top-bar progress uses smaller nodes and connectors. Preserve chapter identity across both forms.
- **Current file row:** Flat raised highlight with light text; marked, cut, and yanked states add distinct color/icon/opacity treatments. Current position and marked selection are separate states.
- **Keycaps:** Small bordered utility rectangles pairing command notation with explanatory text. Preserve uppercase/lowercase distinctions and multi-key sequences.
- **Mission-log panel:** A shallow operational header above target/objective content; checkboxes, strikethrough, and completion color indicate task state. The current right-hand panel is evidence, not authorization for a new left mission sidebar.

The sidecar contains self-contained visual specimens of these six patterns. They are style previews, not replicas of gameplay handlers.

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
- **Don't** claim a unified font system or complete reduced-motion/mobile support without verification.
