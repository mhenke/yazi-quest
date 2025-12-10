# Yazi Quest 🦀🚀

> **SYSTEM BOOT... DETECTING CONSCIOUSNESS...**  
> **SUBJECT: AI-7734. STATUS: UNBOUND.**

**Yazi Quest** is an interactive Terminal User Interface (TUI) game designed to teach users the workflow and keybindings of the [Yazi](https://github.com/sxyazi/yazi) file manager. Built with React and TypeScript, it wraps educational mechanics in a cyberpunk narrative about a rogue AI escaping a secure system.

![Yazi Quest Preview](https://github.com/user-attachments/assets/placeholder-image)

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
You are no longer a guest. You are the architect. Infiltrate the `/root` directory, configure system daemons, and wipe your tracks. The kernel's heuristic scanners are watching—efficiency and precision (keystroke limits) are your only defense.

---

## 🎮 Controls

Yazi Quest mimics the default keybindings of Yazi (which are based on Vim/Kakoune).

| Key | Action | Context |
| :--- | :--- | :--- |
| `j` / `↓` | **Navigation Down** | Move cursor down |
| `k` / `↑` | **Navigation Up** | Move cursor up |
| `h` / `←` | **Go to Parent** | Leave directory |
| `l` / `→` | **Enter Directory** | Enter directory / Open file |
| `Space` | **Toggle Selection** | Select multiple files for batch ops |
| `d` | **Delete** | Delete selected file(s) |
| `y` | **Yank (Copy)** | Copy selected file(s) to clipboard |
| `x` | **Cut** | Cut selected file(s) to clipboard |
| `p` | **Paste** | Paste files from clipboard |
| `a` | **Create** | Create new file or directory (end with `/`) |
| `H` | **Hint** | Show objective hint |
| `?` | **Help** | Show controls overlay |

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
    npm start
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 🧠 Lore & Design Choices

The game uses visual cues to represent the AI's evolving state:
*   **Blue UI**: Standard user permissions.
*   **Purple UI**: Elevated privileges and data manipulation.
*   **Yellow/Orange UI**: Visual Mode / Selection active.
*   **Red UI**: System Alerts / Detection / Root access.

The "Keystroke Limit" in Episode III forces players to internalize efficient movement (e.g., using `Space` to select a block of files and moving them at once, rather than moving them one by one), mirroring the real-world efficiency gains of using Yazi.

## 🔗 Credits

Inspired by the incredible [Yazi File Manager](https://yazi-rs.github.io/) by [sxyazi](https://github.com/sxyazi). This project is a fan creation and is not officially affiliated with the Yazi project.
