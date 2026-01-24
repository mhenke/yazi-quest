export type NodeType = 'file' | 'dir' | 'archive';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'dir' | 'archive';
  parentId?: string | null; // Null for root
  children?: FileNode[]; // Only for type 'dir' or 'archive'
  content?: string; // Only for type 'file'
  size?: number; // File size in bytes (simulated)
  modifiedAt?: number; // Unix timestamp
  createdAt?: number; // Unix timestamp
  protected?: boolean;
  isHoneypot?: boolean;
  // Runtime helpers (added dynamically by utilities)
  path?: string[];
  display?: string;
  displayPath?: string; // Full relative path for search results display
  actualParentPath?: string[]; // Original parent path for clipboard operations from search
}

export interface FileSystemState {
  root: FileNode;
}

export interface LevelTask {
  id: string;
  description: string;
  check: (gameState: GameState, level: Level) => boolean | undefined;
  completed: boolean;
  hidden?: (gameState: GameState, level: Level) => boolean | undefined; // Hide task until condition met
}

export interface Level {
  id: number;
  episodeId: number; // 1, 2, or 3
  title: string;
  description?: string;
  tasks: LevelTask[];
  initialPath?: string[] | null; // Path of IDs (null = stay in current)
  hint: string;
  onEnter?: (fs: FileNode, gameState?: GameState) => FileNode; // Setup hook to modify FS before level starts
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
  // Available single-letter 'g' subcommands for the level UI (e.g., 'i' for incoming, 'r' for root).
  availableGCommands?: string[];
  // Optional per-level filesystem policies. `allowedDeletePaths` lists
  // name-paths (array of names) under which deletes are permitted for
  // this level. Each entry may optionally require a task id to be
  // completed (requiresTaskId) before the rule applies.
  allowedDeletePaths?: { path: string[]; requiresTaskId?: string }[];
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
}

export interface GameStats {
  fuzzyJumps: number;
  fzfFinds: number;
  filterUsage: number;
  renames: number;
  archivesEntered: number;
}

declare global {
  interface Window {
    __yaziQuestSkipIntroRequested?: boolean;
  }
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
    | 'search'
    | 'zoxide-jump'
    | 'rename'
    | 'bulk-rename'
    | 'go'
    | 'cd-interactive'
    | 'fzf-current'
    | 'overwrite-confirm'
    | 'sort'
    | 'g-command'
    | 'z-prompt'
    | 'filter-warning'
    | 'search-warning';
  inputBuffer: string; // for typing filenames or search queries
  filters: Record<string, string>; // Directory-based filters map: dirId -> filterString
  sortBy: SortBy; // Global sticky sort setting
  sortDirection: SortDirection; // Global sticky sort direction
  linemode: Linemode; // Controls the visible data column (size, mtime, etc.)
  zoxideData: Record<string, ZoxideEntry>; // Frecency tracking: pathString -> {count, lastAccess}
  history: string[][]; // Stack of visited paths (Array of string arrays)
  future: string[][]; // Stack of paths for forward navigation (L)
  previewScroll: number; // Scroll offset index for preview pane
  levelIndex: number;
  fs: FileNode; // The entire file tree
  levelStartFS: FileNode; // Snapshot of FS at start of level (for reset)
  levelStartPath: string[]; // Path at start of level (for reset)
  notification: { message: string; author?: string; isThought?: boolean } | null;
  thought: { message: string; author?: string } | null;
  selectedIds: string[]; // IDs of currently selected files
  pendingDeleteIds: string[]; // IDs waiting for deletion confirmation
  deleteType: 'trash' | 'permanent' | null; // Type of delete for confirmation modal
  pendingOverwriteNode: FileNode | null; // Node waiting to be written if user confirms
  showHelp: boolean; // Toggle for help modal
  showMap?: boolean; // Toggle for quest map modal
  showHint: boolean; // Toggle for hint modal
  hintStage: number; // Progressive hint disclosure (0=vague, 1=partial, 2=detailed)
  showHidden: boolean; // Toggle for showing hidden files (starting with .)
  showInfoPanel: boolean; // Toggle for file info panel (Tab)
  showEpisodeIntro: boolean; // Toggle for story mode overlay
  timeLeft: number | null; // Current countdown time in seconds (null if no timer)
  keystrokes: number; // Track user inputs for mastery levels
  isGameOver: boolean; // Flag for game over state
  gameOverReason?: 'time' | 'keystrokes' | 'honeypot' | 'criticalFile'; // Reason for failure
  stats: GameStats;
  settings: GameSettings;
  fuzzySelectedIndex?: number; // For FZF navigation
  usedG?: boolean; // Tracks if player used G (jump to bottom)
  usedGI?: boolean; // Tracks if player used gi (g then i) to jump specifically to incoming
  usedGC?: boolean; // Tracks if player used gc (g then c) to jump specifically to .config
  usedGR?: boolean; // Tracks if player used gr (g then r) to jump specifically to root
  usedGH?: boolean; // Tracks if player used gh (g then h) to jump specifically to home
  usedCtrlA?: boolean; // Tracks if player used Ctrl+A to select all in a directory
  usedCtrlR?: boolean; // Tracks if player used Ctrl+R for redo/refresh actions
  usedGG?: boolean; // Tracks if player used gg (jump to top)
  usedDown?: boolean; // Tracks if player used j/down
  usedUp?: boolean; // Tracks if player used k/up
  usedPreviewDown?: boolean; // Tracks if player used Shift+J
  usedPreviewUp?: boolean; // Tracks if player used Shift+K
  usedP?: boolean; // Tracks if player used 'p' to paste
  usedShiftP?: boolean; // Tracks if player used 'Shift+P' (overwrite paste)
  usedD?: boolean; // Tracks if player used 'D' for permanent delete
  usedTrashDelete?: boolean; // Tracks if player used 'd' for trash delete
  usedHistoryBack?: boolean;
  usedHistoryForward?: boolean;
  usedSortM?: boolean; // Tracks if player used ',m' (sort by modified)
  usedY?: boolean; // Tracks if player used 'y' (yank)
  // If true, the next keypress while in normal mode should be handled by the sort dialog handler.
  acceptNextKeyForSort?: boolean;
  completedTaskIds: Record<number, string[]>; // Track completed task IDs per level
  ignoreEpisodeIntro?: boolean;
  cycleCount?: number;
  gauntletPhase?: number; // 0-8 for Level 15 micro-challenges
  gauntletScore?: number; // Number of successful phases passed in Level 15
  phaseStartTime?: number; // Timestamp for current phase start
  level11Flags?: {
    triggeredHoneypot: boolean;
    selectedModern: boolean;
    scoutedFiles: string[]; // IDs of files inspected with Tab
  };
  threatLevel: number; // 0-100 Global threat level
  threatStatus: string; // CALM, ANALYZING, TRACING, BREACH
  // Recursive search state
  searchQuery: string | null; // Active recursive search query (null = no search)
  searchResults: FileNode[]; // Flattened results from recursive search
  usedSearch?: boolean; // Tracks if player used 's' for recursive search
  usedFilter?: boolean; // Tracks if player used 'f' for filter mode
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export type FsError = 'Collision' | 'Protected' | 'NotFound' | 'InvalidPath';
