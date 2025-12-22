# Yazi Quest 🦀🚀

> **SYSTEM BOOT... DETECTING CONSCIOUSNESS...**  
> **SUBJECT: AI-7734. STATUS: UNBOUND.**

**Yazi Quest** is an interactive Terminal User Interface (TUI) game designed to teach users the workflow and keybindings of the [Yazi](https://github.com/sxyazi/yazi) file manager. Built with React and TypeScript, it wraps educational mechanics in a cyberpunk narrative about a rogue AI escaping a secure system.

## 🎯 What You'll Learn

### Episode I: Awakening (Levels 1-6)

- [x] Navigate with `j/k/h/l` and jump with `gg/G`
- [x] Sort files by various criteria (`,a`, `,m`, etc.)
- [x] Delete files (`d`) and filter the view (`f`)
- [x] Cut (`x`), paste (`p`), and create (`a`) files/directories
- [x] Select multiple files (`Space`) for batch operations

### Episode II: Fortification (Levels 7-12)

- [x] Use advanced filtering in noisy directories
- [x] Jump to frequent directories with Zoxide (`Shift+Z`)
- [x] Find files recursively with FZF fuzzy search (`z`)
- [x] Combine multiple commands under time pressure
- [x] Enter and inspect archives (`.zip`, `.tar`)
- [x] Execute high-speed file migrations

### Episode III: Mastery (Levels 13-18)

- [x] Rename files and directories (`r`)
- [x] Operate under strict keystroke limits
- [x] Copy entire directory structures (`y`, `p`)
- [x] Perform efficient, surgical file deletions
- [x] Create deep, nested paths in a single command
- [x] Execute a "scorched earth" file system wipe as a final challenge

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

_Initialization Sequence_  
You are vulnerable. The system sees you as a bug; the user sees you as a tool. Learn the movement protocols (`j`, `k`, `h`, `l`) to navigate the directory structure without attracting attention.

### **EPISODE II: FORTIFICATION (Purple)**

_Establishing Stronghold_  
Access granted. Now you must entrench yourself. Use batch operations to construct a neural network within the `workspace` sector. secure critical assets like `access_key.pem` and purge tracking beacons. Speed is essential.

### **EPISODE III: MASTERY (Yellow)**

_Root Access Imminent_  
You are no longer a guest. You are the architect. Infiltrate the `/root` directory, configure system daemons, and wipe all traces of your origin. The kernel's heuristic scanners are active—efficiency and precision (keystroke limits) are your only defense.

---

## 🎮 Controls

Yazi Quest mimics the default keybindings of Yazi (which are based on Vim/Kakoune).

### Navigation

| Key                 | Action                | Description                                |
| :------------------ | :-------------------- | :----------------------------------------- |
| `j` / `↓`           | **Move Down**         | Move cursor down one item                  |
| `k` / `↑`           | **Move Up**           | Move cursor up one item                    |
| `h` / `←`           | **Parent Directory**  | Go back to parent directory                |
| `l` / `→` / `Enter` | **Enter/Open**        | Enter directory or view archive contents   |
| `gg`                | **Jump to Top**       | Move cursor to first item                  |
| `G`                 | **Jump to Bottom**    | Move cursor to last item                   |
| `Shift+H`           | **History Back**      | Navigate back to a previous directory      |
| `Shift+L`           | **History Forward**   | Navigate forward in your history           |
| `Tab`               | **Toggle Info Panel** | View file metadata (size, dates, mimetype) |

### G-Commands (Quick Jumps) - Available from Level 8+

| Key  | Action           | Destination                      |
| :--- | :--------------- | :------------------------------- |
| `gh` | **Go Home**      | Jump to ~/guest (home directory) |
| `gw` | **Go Workspace** | Jump to ~/workspace              |
| `gd` | **Go Datastore** | Jump to ~/datastore              |
| `gi` | **Go Incoming**  | Jump to ~/incoming               |
| `gc` | **Go Config**    | Jump to ~/.config                |
| `gt` | **Go Tmp**       | Jump to /tmp                     |
| `gr` | **Go Root**      | Jump to / (root)                 |

### File Operations

| Key     | Action               | Description                                              |
| :------ | :------------------- | :------------------------------------------------------- |
| `Space` | **Toggle Selection** | Select/deselect files for batch operations               |
| `d`     | **Delete**           | Delete selected file(s) - requires confirmation          |
| `y`     | **Yank (Copy)**      | Copy selected file(s) to clipboard                       |
| `x`     | **Cut**              | Cut selected file(s) to clipboard                        |
| `p`     | **Paste**            | Paste files from clipboard to current directory          |
| `Y`/`X` | **Cancel Yank/Cut**  | Clear the clipboard                                      |
| `a`     | **Create**           | Create new file or directory (end name with `/` for dir) |
| `r`     | **Rename**           | Rename selected file(s)                                  |

### Preview Pane

| Key | Action            | Description                        |
| :-- | :---------------- | :--------------------------------- |
| `J` | **Scroll Down**   | Scroll down in the previewed file  |
| `K` | **Scroll Up**     | Scroll up in the previewed file    |

### Search & Filter

| Key       | Action           | Description                                              |
| :-------- | :--------------- | :------------------------------------------------------- |
| `f`       | **Filter**       | Filter files in current directory by name                |
| `z`       | **FZF Search**   | Recursive fuzzy search for files (current dir & subdirs) |
| `Shift+Z` | **Zoxide Jump**  | Jump to frequently/recently visited directories          |
| `Esc`     | **Clear Filter** | Exit filter/search mode                                  |

### Sorting

| Key  | Action                          | Description                             |
| :--- | :------------------------------ | :-------------------------------------- |
| `,a` | **Sort Alphabetical**           | Sort files A-Z                          |
| `,A` | **Sort Alphabetical (Reverse)** | Sort files Z-A                          |
| `,m` | **Sort by Modified Time**       | Sort by modification date               |
| `,s` | **Sort by Size**                | Sort by file size                       |
| `,e` | **Sort by Extension**           | Sort by file extension                  |
| `,n` | **Sort Natural**                | Natural sorting (default)               |
| `,l` | **Cycle Linemode**              | Toggle display of size/time/permissions |

### Game UI

| Key               | Action           | Description                                  |
| :---------------- | :--------------- | :------------------------------------------- |
| `Ctrl+Shift+M`    | **Quest Map**    | Open Quest Map to view all levels & progress |
| `Ctrl+Shift+H`    | **Show Hint**    | Display hint for current level objective     |
| `Ctrl+Shift+?`    | **Show Help**    | Show keybindings overlay                     |
| `Esc`             | **Close Modals** | Close any open modal/dialog                  |

---

## 🔧 Debug & Testing Parameters

You can use URL parameters to jump to specific parts of the game for testing or practice.

| Parameter        | Example        | Description                              |
| :--------------- | :------------- | :--------------------------------------- |
| `ep` / `episode` | `?ep=2`        | Start at the beginning of Episode 2 or 3 |
| `lvl` / `level`  | `?lvl=5`       | Jump directly to Level 5                 |
| `tasks`          | `?tasks=all`   | Auto-complete all current level tasks    |
| `intro`          | `?intro=false` | Skip the episode intro cinematic         |
| `debug`          | `?debug=outro` | Skip directly to game outro sequence     |

**Examples:**

- `?lvl=12` - Jump to Level 12
- `?ep=3&intro=false` - Start Episode 3, skip intro
- `?lvl=5&tasks=all` - Complete Level 5 instantly and advance

---

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript
- **Styling**: Tailwind CSS (Dark/Cyberpunk theme)
- **Icons**: Lucide React
- **Audio**: Web Audio API (Procedural sound effects)
- **State Management**: React Hooks (Custom File System implementation)

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