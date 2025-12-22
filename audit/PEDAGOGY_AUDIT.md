# Pedagogy & Realism Audit

**Purpose**: Ensure the game effectively teaches real-world Yazi workflows while maintaining immersive narrative.

---

## 1. Yazi Realism (Parity)
**Score: 9.0/10**

### ✅ Authentic Habit Formation
- **Selection**: `Space` correctly implements "select-and-advance."
- **Navigation**: Directory entry/exit and Extremity jumps (`gg`/`G`) match 1:1.
- **Modifiers**: ✅ **Standardized**. `Shift+` requirements are now explicitly labeled in the HUD to prevent user friction.
- **Filter Persistence**: Filters persist across navigation, matching Yazi's power-user workflow.

### ❌ Remaining Gaps
- **Visual Mode (v/V)**: Missing range selection.
- **Bulk Rename**: Real Yazi uses a temporary editor buffer; simulation uses simplified prompt.

---

## 2. Narrative & Voice
**Score: 10/10**

- **Tone**: Consistently cyberpunk. 
- **Pacing**: One new command per level ensures manageable cognitive load.
- **Feedback**: The "Stress Overlay" (Scanline flicker) at high keystroke counts successfully reinforces narrative stakes.

---

## 3. Recommendations
1.  **Range Selection**: Implement `visualAnchorIndex` to support true Visual Mode.
2.  **Zoxide Preview**: Enhancing the Zoxide jump menu with directory content previews (Complete).