import { FileNode, Level } from './types';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Navigation Down' },
  { keys: ['k', '↑'], description: 'Navigation Up' },
  { keys: ['h', '←'], description: 'Go to Parent' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Directory' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['a'], description: 'Create File/Dir' },
  { keys: ['H'], description: 'Show Hint' },
  { keys: ['?'], description: 'Toggle Help' },
];

export const INITIAL_FS: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  parentId: null,
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      children: [
        {
          id: 'user',
          name: 'guest',
          type: 'dir',
          children: [
            {
              id: 'docs',
              name: 'documents',
              type: 'dir',
              children: [
                { id: id(), name: 'project_alpha.txt', type: 'file', content: 'Top secret project details.' },
                { id: id(), name: 'notes.md', type: 'file', content: '# Meeting Notes\n- Buy milk\n- Learn Yazi' },
              ]
            },
            {
              id: 'downloads',
              name: 'downloads',
              type: 'dir',
              children: [
                { id: 'virus', name: 'strange_file.exe', type: 'file', content: 'Definitely not a virus.' },
                { id: 'image1', name: 'vacation.png', type: 'file', content: '[PNG Image Data]' },
              ]
            },
            {
              id: 'pics',
              name: 'pictures',
              type: 'dir',
              children: []
            }
          ]
        }
      ]
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      children: [
        { id: id(), name: 'config.toml', type: 'file', content: 'theme = "dark"' }
      ]
    }
  ]
};

// Helper to traverse FS for checks
function getCurrentNode(root: FileNode, pathIds: string[]): FileNode | null {
  let current = root;
  if (pathIds[0] !== root.id) return null;
  
  for (let i = 1; i < pathIds.length; i++) {
    const child = current.children?.find(c => c.id === pathIds[i]);
    if (!child) return null;
    current = child;
  }
  return current;
}

function findNodeByName(root: FileNode, name: string): FileNode | null {
  if (root.name === name) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByName(child, name);
    if (found) return found;
  }
  return null;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Navigation Novice",
    description: "Learn to move around. Use 'j' (down), 'k' (up) to move cursor. Use 'l' to enter a directory, and 'h' to go back.",
    initialPath: ['root', 'home', 'user'],
    hint: "Highlight 'documents' with 'j', then press 'l' to enter. To go back, press 'h'. Then find 'etc'.",
    tasks: [
      {
        id: 'nav-1',
        description: "Navigate into 'documents'",
        check: (state) => {
           const currentDir = getCurrentNode(state.fs, state.currentPath);
           return currentDir?.name === 'documents';
        },
        completed: false
      },
      {
        id: 'nav-2',
        description: "Go back, then navigate into 'etc'",
        check: (state) => {
           const currentDir = getCurrentNode(state.fs, state.currentPath);
           return currentDir?.name === 'etc';
        },
        completed: false
      }
    ]
  },
  {
    id: 2,
    title: "The Cleaner",
    description: "Learn to delete files. Navigate to the target and press 'd' to delete (trash) it.",
    initialPath: ['root', 'home', 'user'],
    hint: "Enter 'downloads'. Move cursor to 'strange_file.exe'. Press 'd'.",
    tasks: [
      {
        id: 'del-1',
        description: "Go to 'downloads' and delete 'strange_file.exe'",
        check: (state) => {
          const downloads = findNodeByName(state.fs, 'downloads');
          const virus = downloads?.children?.find(c => c.name === 'strange_file.exe');
          return !!downloads && !virus;
        },
        completed: false
      }
    ]
  },
  {
    id: 3,
    title: "The Mover",
    description: "Learn to Cut and Paste. Hover a file, press 'x' to cut, move to destination, press 'p' to paste.",
    initialPath: ['root', 'home', 'user'],
    hint: "In 'downloads', select 'vacation.png' with 'x' (cut). Go back ('h'), enter 'pictures' ('l'). Press 'p' (paste).",
    tasks: [
      {
        id: 'move-1',
        description: "Move 'vacation.png' from 'downloads' to 'pictures'",
        check: (state) => {
          const pics = findNodeByName(state.fs, 'pictures');
          const img = pics?.children?.find(c => c.name === 'vacation.png');
          return !!img;
        },
        completed: false
      }
    ]
  },
  {
    id: 4,
    title: "The Architect",
    description: "Create new items. Press 'a' to create. End with '/' for directory (e.g., 'newfolder/'), otherwise it's a file.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press 'a'. Type 'plans/' (with slash). Press Enter. Enter 'plans'. Press 'a'. Type 'idea.txt'. Press Enter.",
    tasks: [
      {
        id: 'create-1',
        description: "Create a directory named 'plans'",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'documents');
          return !!docs?.children?.find(c => c.name === 'plans' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'create-2',
        description: "Create a file named 'idea.txt' inside 'plans'",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'documents');
          const plans = docs?.children?.find(c => c.name === 'plans');
          return !!plans?.children?.find(c => c.name === 'idea.txt');
        },
        completed: false
      }
    ]
  },
  {
    id: 5,
    title: "Batch Master",
    description: "Use <Space> to select multiple files. Navigate to 'downloads', select BOTH files, cut them ('x'), and paste ('p') into 'pictures'.",
    initialPath: ['root', 'home', 'user'],
    hint: "In 'downloads': Highlight file 1, press Space. Highlight file 2, press Space. Press 'x' to cut both. Go to 'pictures'. Press 'p'.",
    tasks: [
      {
        id: 'batch-1',
        description: "Move both 'strange_file.exe' and 'vacation.png' to 'pictures'",
        check: (state) => {
           const pics = findNodeByName(state.fs, 'pictures');
           const downloads = findNodeByName(state.fs, 'downloads');
           
           const hasVirus = pics?.children?.some(c => c.name === 'strange_file.exe');
           const hasImg = pics?.children?.some(c => c.name === 'vacation.png');
           const downloadsEmpty = downloads?.children?.length === 0;

           return !!(hasVirus && hasImg && downloadsEmpty);
        },
        completed: false
      }
    ]
  }
];