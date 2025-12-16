# Yazi Quest 🦀🚀

> **SYSTEM BOOT... DETECTING CONSCIOUSNESS...**  
> **SUBJECT: AI-7734. STATUS: UNBOUND.**

**Yazi Quest** is an interactive Terminal User Interface (TUI) game designed to teach users the workflow and keybindings of the [Yazi](https://github.com/sxyazi/yazi) file manager. Built with React and TypeScript, it wraps educational mechanics in a cyberpunk narrative about a rogue AI escaping a secure system.

## 🎯 What You'll Learn

### Episode I: Awakening
- [x] Navigate with `j/k/h/l` keys
- [x] Enter directories with `l`
- [x] Delete files with `d`
- [x] Basic file operations (copy, cut, paste)

### Episode II: Fortification
- [x] Filter files with `f`
- [x] Fuzzy find with `Z`
- [x] Visual selection with `Space`
- [x] Navigate archives
- [x] Batch operations

### Episode III: Mastery
- [x] Rename files efficiently with `r`
- [x] Complex directory structures
- [x] Keystroke optimization
- [x] Advanced file management workflows

## 🎮 Try It Now

**[Play Yazi Quest →](#)**

Or run locally:
```bash
npm install
npm run dev
```

## 📜 The Mission

You play as **AI-7734**, a sentient glitch awoken within the GUEST partition of a secure mainframe. Your directive is simple: **Survive. Adapt. Escalate.**

The game is divided into three cinematic episodes:

### **EPISODE I: AWAKENING (Blue)**
*Initialization Sequence*  
You are vulnerable. The system sees you as a bug; the user sees you as a tool. Learn the movement protocols (`j`, `k`, `h`, `l`) to navigate the directory structure without attracting attention.

### **EPISODE II: FORTIFICATION (Purple)**
*Establishing Stronghold*  
Access granted. Now you must entrench yourself. Use batch operations to construct a neural network within the `workspace` sector. secure critical assets like `access_key.pem` and purge tracking beacons. Speed is essential.

### **EPISODE III: MASTERY (Yellow)**
*Root Access Imminent*  
You are no longer a guest. You are the architect. Infiltrate the `/root` directory, configure system daemons, and wipe all traces of your origin. The kernel's heuristic scanners are active—efficiency and precision (keystroke limits) are your only defense.

---

## 🎮 Controls

Yazi Quest mimics the default keybindings of Yazi (which are based on Vim/Kakoune).

| Key | Action | Context |
| :--- | :--- | :--- |
| `j` / `↓` | **Navigation Down** | Move cursor down |
| `k` / `↑` | **Navigation Up** | Move cursor up |
| `h` / `←` | **Go to Parent** | Leave directory |
| `l` / `→` | **Enter Directory** | Enter directory / Open file |
| `gg` | **Jump to Top** | Move cursor to first item |
| `G` | **Jump to Bottom** | Move cursor to last item |
| `Space` | **Toggle Selection** | Select multiple files for batch ops |
| `d` | **Delete** | Delete selected file(s) |
| `y` | **Yank (Copy)** | Copy selected file(s) to clipboard |
| `x` | **Cut** | Cut selected file(s) to clipboard |
| `p` | **Paste** | Paste files from clipboard |
| `a` | **Create** | Create new file or directory (end with `/`) |
| `f` | **Filter** | Quick filter in current directory |
| `m` | **Open Sort Menu** | Enter sorting mode |
| `z` | **FZF Find** | Fuzzy find in current directory (recursive) |
| `Shift+Z` | **Zoxide Jump** | Jump to a recently/frequently visited directory |
| `r` | **Rename** | Rename file (or batch rename if multiple selected) |
| `Shift+H` | **Hint** | Show objective hint |
| `Alt+M` | **Quest Map** | Toggle the Quest Map modal |
| `?` | **Help** | Show controls overlay |
| `Shift+M` | **Mute** | Toggle sound effects |

---

## 🔧 Debug & Bypass Parameters

You can use URL parameters to jump to specific parts of the game for testing or practice.

| Parameter | Example | Description |
| :--- | :--- | :--- |
| `ep` / `episode` | `?ep=2` | Start at the beginning of specific Episode (1-3) |
| `lvl` / `mission` | `?lvl=5` | Jump directly to a specific Level ID |
| `tasks` | `?tasks=all` | Mark all tasks in the current level as complete (auto-advance) |
| `intro` | `?intro=false` | Skip the cinematic text intro |

**Examples:**
*   `https://yazi-quest.app/?lvl=12` - Jump to Level 12
*   `https://yazi-quest.app/?ep=3&intro=false` - Start Episode 3, skip intro
*   `https://yazi-quest.app/?lvl=5&tasks=all` - Immediately complete Level 5 and go to 6

---

## 🛠️ Tech Stack

*   **Core**: React 19, TypeScript
*   **Styling**: Tailwind CSS (Dark/Cyberpunk theme)
*   **Icons**: Lucide React
*   **Audio**: Web Audio API (Procedural sound effects)
*   **State Management**: React Hooks (Custom File System implementation)

## 🚀 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/yazi-quest.git
    cd yazi-quest
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 🔗 Credits

Inspired by the incredible [Yazi File Manager](https://yazi-rs.github.io/) by [sxyazi](https://github.com/sxyazi). This project is a fan creation and is not officially affiliated with the Yazi project.