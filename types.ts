export type NodeType = 'file' | 'dir' | 'archive';

export interface FileProtection {
  delete?: string;
  cut?: string;
  rename?: string;
  add?: string;
  releaseLevel?: number; // The level ID at which this protection is lifted
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'dir' | 'archive';
  parentId?: string | null; // Null for root
  children?: FileNode[]; // Only for type 'dir' or 'archive'
  content?: string; // Only for type 'file'
  modifiedAt?: number; // Unix timestamp
  createdAt?: number; // Unix timestamp
  protected?: boolean; // If true, node cannot be deleted by player via general rule
  protection?: FileProtection; // Level-specific protection messages
}

export interface FileSystemState {
  root: FileNode;
}

export interface LevelTask {
  id: string;
  description: string | ((gameState: GameState) => string);
  // Allow a single check function or an array of alternative checks (OR semantics).
  // A task is satisfied if ANY of the checks returns true.
  check:
    | ((gameState: GameState, level: Level) => boolean)
    | Array<(gameState: GameState, level: Level) => boolean>;
  completed: boolean;
}

export interface Level {
  id: number;
  episodeId: number; // 1, 2, or 3
  title: string;
  description: string;
  tasks: LevelTask[];
  initialPath: string[] | null; // Path of IDs (null = stay in current)
  hint: string;
  onEnter?: (fs: FileNode) => FileNode; // Setup hook to modify FS before level starts
  seedMode?: 'always' | 'fresh'; // 'fresh': only run on fresh initial filesystem, 'always': run whenever level is entered (default)
  timeLimit?: number; // Time limit in seconds (optional)
  maxKeystrokes?: number; // Max allowed keystrokes for mastery (optional, replaces timeLimit)
  efficiencyTip?: string; // Level-specific tip shown on game over (for timed/keystroke levels)

  // Theatre.md additions
  coreSkill?: string; // Primary Yazi command being taught (e.g., "Filter (f)")
  environmentalClue?: string; // UI hint shown in status area (e.g., "247 files. TARGET: .pem")
  successMessage?: string; // Displayed on level completion (e.g., "ASSET LOCATED.")
  buildsOn?: number[]; // Level IDs this level assumes knowledge from
  leadsTo?: number[]; // Level IDs that build on this level's skill
}

export interface Episode {
  id: number;
  title: string; // Full cinematic title (e.g., "EPISODE I: AWAKENING")
  shortTitle: string; // Compact title for UI (e.g., "Ep. I: Awakening")
  name: string; // Core name for badges (e.g., "AWAKENING")
  subtitle: string;
  lore: string[]; // Array of strings for typewriter effect paragraphs
  color: string;
}

export interface ClipboardItem {
  nodes: FileNode[]; // Changed to array for batch operations
  action: 'yank' | 'cut';
  originalPath: string[]; // Path IDs where they came from
  authorized?: boolean; // Whether the cut was authorized at time of clipboard creation (bypass protection on paste)
}

export interface GameStats {
  fuzzyJumps: number;
  filterUsage: number;
  renames: number;
  archivesEntered: number;
}

// Zoxide frecency tracking - matches real zoxide algorithm
export interface ZoxideEntry {
  count: number; // Visit count (base score)
  lastAccess: number; // Unix timestamp of last access
}

// Calculate frecency score with time decay (matches real zoxide)
// Recent visits weight higher: last hour ×4, last day ×2, last week ÷2, older ÷4
export function calculateFrecency(
  entry: ZoxideEntry | undefined,
  now: number = Date.now()
): number {
  if (!entry) return 0;

  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  const elapsed = now - (entry.lastAccess || now);

  let multiplier: number;
  if (elapsed < hourMs) {
    multiplier = 4;
  } else if (elapsed < dayMs) {
    multiplier = 2;
  } else if (elapsed < weekMs) {
    multiplier = 0.5;
  } else {
    multiplier = 0.25;
  }

  return (entry.count || 0) * multiplier;
}

export interface GameSettings {
  soundEnabled: boolean;
}

export type SortBy = 'natural' | 'alphabetical' | 'modified' | 'size' | 'extension';
export type SortDirection = 'asc' | 'desc';
export type Linemode = 'none' | 'size' | 'mtime' | 'permissions';

// Enumerate all possible player actions that are relevant for task validation.
export type GameAction =
  | 'JUMP_TOP'
  | 'JUMP_BOTTOM'
  | 'PREVIEW_SCROLL'
  | 'HISTORY_NAV'
  | 'SELECT_ALL'
  | 'CREATE_FILE'
  | 'CREATE_DIR'
  | 'DELETE'
  | 'RENAME'
  | 'YANK'
  | 'CUT'
  | 'PASTE'
  | 'FILTER'
  | 'FZF'
  | 'ZOXIDE_JUMP'
  | 'INVERT_SELECTION';

// Record of a specific action, including when it occurred.
export interface ActionRecord {
  type: GameAction;
  timestamp: number;
  // Optional metadata for the action (direction, method, etc.)
  data?: Record<string, any>;
}

export interface GameState {
  currentPath: string[]; // Array of Node IDs representing path from root
  cursorIndex: number; // Index in the current directory list
  clipboard: ClipboardItem | null;
  mode:
    | 'normal'
    | 'input-file'
    | 'input-dir'
    | 'confirm-delete'
    | 'filter'
    | 'zoxide-jump'
    | 'rename'
    | 'bulk-rename'
    | 'go'
    | 'cd-interactive'
    | 'fzf-current'
    | 'overwrite-confirm'
    | 'sort'
    | 'g-command';
  inputBuffer: string; // for typing filenames or search queries
  filters: Record<string, string>; // Directory-based filters map: dirId -> filterString
  sortBy: SortBy; // Global sticky sort setting
  sortDirection: SortDirection; // Global sticky sort direction
  linemode: Linemode; // Controls the visible data column (size, mtime, etc.)
  zoxideData: Record<string, ZoxideEntry>; // Frecency tracking: pathString -> {count, lastAccess}
  history: string[]; // Log of actions
  levelIndex: number;
  fs: FileNode; // The entire file tree
  levelStartFS: FileNode; // Snapshot of FS at start of level (for reset)
  levelStartShowHidden?: boolean; // Snapshot of showHidden at level start
  notification: string | null;
  selectedIds: string[]; // IDs of currently selected files
  pendingDeleteIds: string[]; // IDs waiting for deletion confirmation
  pendingOverwriteNode: FileNode | null; // Node waiting to be written if user confirms
  showHelp: boolean; // Toggle for help modal
  showHint: boolean; // Toggle for hint modal
  hintStage: number; // Progressive hint disclosure (0=vague, 1=partial, 2=detailed)
  showHidden: boolean; // Toggle for showing hidden files (starting with .)
  showInfoPanel: boolean; // Toggle for file info panel (Tab)
  showEpisodeIntro: boolean; // Toggle for story mode overlay
  timeLeft: number | null; // Current countdown time in seconds (null if no timer)
  keystrokes: number; // Track user inputs for mastery levels
  isGameOver: boolean; // Flag for game over state
  gameOverReason?: 'time' | 'keystrokes'; // Reason for failure
  stats: GameStats;
  settings: GameSettings;
  fuzzySelectedIndex?: number; // For FZF navigation
  lastAction: ActionRecord | null; // Tracks the last significant player action
  // Flags used for tracking whether specific one-off interactions have occurred
  usedG?: boolean;
  usedGG?: boolean;
  usedPreviewScroll?: boolean;
  usedPreviewScrollDirection?: 'down' | 'up' | null;
  usedHistory?: boolean;
  usedCtrlA?: boolean;
  falseThreatActive?: boolean; // Tracks if the false threat scenario has been activated (e.g., cutting sys_patch.conf)
  dynamicHint?: string; // Optional runtime hint override for dynamic scenarios
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export type FsError = 'Collision' | 'Protected' | 'NotFound' | 'InvalidPath';
