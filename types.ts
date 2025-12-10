
export type NodeType = 'file' | 'dir';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  content?: string; // Text content for files
  children?: FileNode[]; // Only for dirs
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
  title: string;
  description: string;
  tasks: LevelTask[];
  initialPath: string[]; // Path of IDs
  hint: string;
  onEnter?: (fs: FileNode) => FileNode; // Setup hook to modify FS before level starts
}

export interface Episode {
  id: number;
  title: string;
  subtitle: string;
  lore: string[]; // Array of strings for typewriter effect paragraphs
  color: string;
}

export interface ClipboardItem {
  nodes: FileNode[]; // Changed to array for batch operations
  action: 'yank' | 'cut';
  originalPath: string[]; // Path IDs where they came from
}

export interface GameState {
  currentPath: string[]; // Array of Node IDs representing path from root
  cursorIndex: number; // Index in the current directory list
  clipboard: ClipboardItem | null;
  mode: 'normal' | 'input-file' | 'input-dir'; // standard or typing filename
  inputBuffer: string; // for typing filenames
  history: string[]; // Log of actions
  levelIndex: number;
  fs: FileNode; // The entire file tree
  notification: string | null;
  selectedIds: string[]; // IDs of currently selected files
  showHelp: boolean; // Toggle for help modal
  showHint: boolean; // Toggle for hint modal
  showEpisodeIntro: boolean; // Toggle for story mode overlay
}
