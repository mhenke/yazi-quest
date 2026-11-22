# Yazi on mobile: scope research

Researched 2026-11-22 from primary sources. No mobile installation or device test was performed.

## Findings

- **Android terminal use exists.** Yazi's official keymap documentation explicitly names `android` as “Android (Termux)” and includes Android in its `unix` platform group: <https://yazi-rs.github.io/docs/configuration/keymap/#per-os>.
- **Termux maintains a Yazi package.** Its current build recipe packages Yazi 26.9.1, installs the `yazi` and `ya` terminal executables, and applies Android-specific build patches: <https://github.com/termux/termux-packages/blob/master/packages/yazi/build.sh>.
- **This is terminal Yazi on an Android device, not evidence of a separate touch-native Yazi app.** Yazi describes keyboard commands and terminal prerequisites in its official documentation: <https://yazi-rs.github.io/docs/installation/> and <https://yazi-rs.github.io/docs/configuration/keymap/>.
- **No first-party touch-native Android/iOS app or iOS installation procedure was identified in the consulted official pages.** This is a bounded research result, not proof that no community project exists.

## Implication for Yazi Quest

Yazi's Android availability does not establish a requirement for touch-only browser gameplay in Yazi Quest. A phone running Termux and a browser learning game have different input and layout constraints.

Confirmed product scope: desktop browsers with a physical keyboard are the target experience; touch-only mobile gameplay is outside the current scope. Narrow desktop windows and browser zoom remain in scope. See `PRODUCT.md`.

The user confirmed this product requirement after the research. No architecture decision record was needed.
