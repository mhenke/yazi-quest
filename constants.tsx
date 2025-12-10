import { FileNode, Level } from './types';
import { addNode, deleteNode, findNodeByName, getNodeByPath } from './utils/fsHelpers';

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
                { id: 'image1', name: 'vacation.png', type: 'file', content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' },
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
           const currentDir = getNodeByPath(state.fs, state.currentPath);
           return currentDir?.name === 'documents';
        },
        completed: false
      },
      {
        id: 'nav-2',
        description: "Go back, then navigate into 'etc'",
        check: (state) => {
           const currentDir = getNodeByPath(state.fs, state.currentPath);
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
    description: "System restored files for training. Navigate to 'downloads', select BOTH files, cut them ('x'), and paste ('p') into 'pictures'.",
    initialPath: ['root', 'home', 'user'],
    hint: "In 'downloads': Highlight file 1, press Space. Highlight file 2, press Space. Press 'x' to cut both. Go to 'pictures'. Press 'p'.",
    onEnter: (fs) => {
        // IDs for standard paths (assuming user hasn't renamed 'user' or 'home')
        const downloadsPath = ['root', 'home', 'user', 'downloads'];
        const picsPath = ['root', 'home', 'user', 'pics'];
        
        let newFS = fs;
        
        // 1. Clean up pictures (remove target files if they are there from prev levels)
        const picsNode = findNodeByName(newFS, 'pictures');
        if (picsNode && picsNode.children) {
             const toDelete = picsNode.children.filter(c => c.name === 'vacation.png' || c.name === 'strange_file.exe');
             toDelete.forEach(node => {
                 newFS = deleteNode(newFS, picsPath, node.id);
             });
        }
        
        // 2. Ensure they exist in downloads (Restoration)
        const downloadsNode = findNodeByName(newFS, 'downloads');
        const hasVirus = downloadsNode?.children?.some(c => c.name === 'strange_file.exe');
        const hasImg = downloadsNode?.children?.some(c => c.name === 'vacation.png');
        
        if (!hasVirus) {
             newFS = addNode(newFS, downloadsPath, { 
                id: 'virus_restored', 
                name: 'strange_file.exe', 
                type: 'file', 
                content: 'Definitely not a virus (restored).' 
             });
        }
        
        if (!hasImg) {
             newFS = addNode(newFS, downloadsPath, { 
                id: 'image1_restored', 
                name: 'vacation.png', 
                type: 'file', 
                content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' 
             });
        }
        return newFS;
    },
    tasks: [
      {
        id: 'batch-1',
        description: "Move both 'strange_file.exe' and 'vacation.png' to 'pictures'",
        check: (state) => {
           const pics = findNodeByName(state.fs, 'pictures');
           const downloads = findNodeByName(state.fs, 'downloads');
           
           const hasVirus = pics?.children?.some(c => c.name === 'strange_file.exe');
           const hasImg = pics?.children?.some(c => c.name === 'vacation.png');
           
           // We check if downloads no longer has them (or is empty) to ensure move occurred
           const downloadsClean = !downloads?.children?.some(c => c.name === 'strange_file.exe' || c.name === 'vacation.png');

           return !!(hasVirus && hasImg && downloadsClean);
        },
        completed: false
      }
    ]
  }
];