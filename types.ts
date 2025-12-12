
export type NodeType = 'file' | 'dir' | 'archive';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  content?: string; // Text content for files
  children?: FileNode[]; // For dirs AND archives
  parentId?: string | null;
}

export interface FileSystemState {
  root: FileNode;
}

export interface LevelTask {
  id: string;
  description: string;
  check: (gameState: GameState) => boolean;
  completed: boolean;
}

export interface Level {
  id: number;
  episodeId: number; // 1, 2, or 3
  title: string;
  description: string;
  tasks: LevelTask[];
  initialPath: string[]; // Path of IDs
  hint: string;
  onEnter?: (fs: FileNode) => FileNode; // Setup hook to modify FS before level starts
  timeLimit?: number; // Time limit in seconds (optional)
  maxKeystrokes?: number; // Max allowed keystrokes for mastery (optional, replaces timeLimit)
}

export interface Episode {
  id: number;
  title: string;      // Full cinematic title (e.g., "EPISODE I: AWAKENING")
  shortTitle: string; // Compact title for UI (e.g., "Ep. I: Awakening")
  name: string;       // Core name for badges (e.g., "AWAKENING")
  subtitle: string;
  lore: string[];     // Array of strings for typewriter effect paragraphs
  color: string;
}

export interface ClipboardItem {
  nodes: FileNode[]; // Changed to array for batch operations
  action: 'yank' | 'cut';
  originalPath: string[]; // Path IDs where they came from
}

export interface GameStats {
  fuzzyJumps: number;
  filterUsage: number;
  renames: number;
  archivesEntered: number;
}

export interface GameSettings {
  soundEnabled: boolean;
}

export interface GameState {
  currentPath: string[]; // Array of Node IDs representing path from root
  cursorIndex: number; // Index in the current directory list
  clipboard: ClipboardItem | null;
  mode: 'normal' | 'input-file' | 'input-dir' | 'confirm-delete' | 'filter' | 'fuzzy-find' | 'rename' | 'bulk-rename' | 'go' | 'cd-interactive' | 'fzf-current';
  inputBuffer: string; // for typing filenames or search queries
  filters: Record<string, string>; // Directory-based filters map: dirId -> filterString
  zoxideData: Record<string, number>; // Directory visit frequency map: pathString -> count
  history: string[]; // Log of actions
  levelIndex: number;
  fs: FileNode; // The entire file tree
  levelStartFS: FileNode; // Snapshot of FS at start of level (for reset)
  notification: string | null;
  selectedIds: string[]; // IDs of currently selected files
  pendingDeleteIds: string[]; // IDs waiting for deletion confirmation
  showHelp: boolean; // Toggle for help modal
  showHint: boolean; // Toggle for hint modal
  showEpisodeIntro: boolean; // Toggle for story mode overlay
  timeLeft: number | null; // Current countdown time in seconds (null if no timer)
  keystrokes: number; // Track user inputs for mastery levels
  isGameOver: boolean; // Flag for game over state
  gameOverReason?: 'time' | 'keystrokes'; // Reason for failure
  stats: GameStats;
  settings: GameSettings;
  fuzzySelectedIndex?: number; // For FZF navigation
}