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
}

export interface ClipboardItem {
  node: FileNode;
  action: 'yank' | 'cut';
  originalPath: string[]; // Path IDs where it came from
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
}
