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

<!-- impeccable:design-map -->

Name: Yazi Quest
Colors: primary: primary #3b82f6; secondary: fortification-purple #a855f7; tertiary: signal-orange #f97316; neutral: void-black #000000; secondary: mastery-yellow #eab308 (+10 more in the sidecar)
Fonts: ui-monospace (body, label)
Spacing: unit 4px, tight 8px, row 12px, panel 16px, bar 24px
Radius: square 0px, small 2px, utility 4px
North Star: "The Containment Terminal"
Rules:

- The Episode Signal Rule. Keep the episode mapping stable across story and progression: Awakening Blue, Fortification Purple, Mastery Yellow.
- The Working Plane Rule. Reserve depth for overlays and active signals; keep the file-manager working plane flat.
  Don't:
- Don't replace the file-manager composition with a generic card dashboard.
- Don't introduce a left mission sidebar; retain the established navigation model.
- Don't treat tiny dim text, missing focus cues, or clipped narrow layouts as binding brand rules.
- Don't treat narrow desktop reflow checks as touch gameplay support or accessibility conformance.
  Do:
- Do preserve the Containment Terminal's technical, tense, restrained character.
- Do use episode color as a consistent progression signal.
- Do distinguish current position, marked selection, clipboard state, and completion.
- Do keep working surfaces flat and reserve depth for overlays and active signals.
- Do verify legibility and keyboard state at the viewport and effect intensity being changed.
  Map: index.html
  Map: src/components/
  Full: .impeccable/design-full.md (read a section when you need its detail)
