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
            },
            {
              id: 'workspace',
              name: 'workspace',
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
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      children: [
         { id: id(), name: 'log_old.txt', type: 'file', content: 'log' },
         { id: id(), name: 'cache', type: 'dir', children: [] }
      ]
    }
  ]
};

const setupLevel5 = (fs: FileNode) => {
    // IDs for standard paths (assuming user hasn't renamed 'user' or 'home')
    const downloadsPath = ['root', 'home', 'user', 'downloads'];
    const picsPath = ['root', 'home', 'user', 'pics'];
    
    let newFS = fs;
    
    // 1. Clean up pictures
    const picsNode = findNodeByName(newFS, 'pictures');
    if (picsNode && picsNode.children) {
         const toDelete = picsNode.children.filter(c => c.name === 'vacation.png' || c.name === 'strange_file.exe');
         toDelete.forEach(node => {
             newFS = deleteNode(newFS, picsPath, node.id);
         });
    }
    
    // 2. Ensure they exist in downloads
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
};

const setupLevel6 = (fs: FileNode) => {
    // Ensure workspace is empty
    let newFS = fs;
    const ws = findNodeByName(newFS, 'workspace');
    if (ws && ws.children) {
        ws.children = [];
    }
    return newFS;
};

const setupLevel11 = (fs: FileNode) => {
    // Clean slate for Episode 3
    return fs;
}


export const LEVELS: Level[] = [
  // --- EPISODE 1: AWAKENING ---
  {
    id: 1,
    title: "Navigation Novice",
    description: "Learn to move around. Use 'j' (down), 'k' (up) to move cursor. Use 'l' to enter, 'h' to back.",
    initialPath: ['root', 'home', 'user'],
    hint: "Highlight 'documents' with 'j', then press 'l' to enter. To go back, press 'h'. Then find 'etc'.",
    tasks: [
      {
        id: 'nav-1',
        description: "Navigate into 'documents'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'documents',
        completed: false
      },
      {
        id: 'nav-2',
        description: "Go back, then navigate into 'etc'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'etc',
        completed: false
      }
    ]
  },
  {
    id: 2,
    title: "The Cleaner",
    description: "Navigate to the target and press 'd' to delete (trash) it.",
    initialPath: ['root', 'home', 'user'],
    hint: "Enter 'downloads'. Move cursor to 'strange_file.exe'. Press 'd'.",
    tasks: [
      {
        id: 'del-0',
        description: "Navigate into 'downloads'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'downloads',
        completed: false
      },
      {
        id: 'del-1',
        description: "Delete 'strange_file.exe'",
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
    description: "Hover a file, press 'x' to cut, move to destination, press 'p' to paste.",
    initialPath: ['root', 'home', 'user'],
    hint: "In 'downloads', select 'vacation.png' with 'x'. Go to 'pictures'. Press 'p'.",
    tasks: [
      {
        id: 'move-1',
        description: "Move 'vacation.png' from 'downloads' to 'pictures'",
        check: (state) => {
          const pics = findNodeByName(state.fs, 'pictures');
          return !!pics?.children?.find(c => c.name === 'vacation.png');
        },
        completed: false
      }
    ]
  },
  {
    id: 4,
    title: "The Architect",
    description: "Press 'a' to create. End with '/' for directory (e.g., 'plans/').",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press 'a', type 'plans/', Enter. Enter 'plans'. Press 'a', type 'idea.txt', Enter.",
    tasks: [
      {
        id: 'create-1',
        description: "Create directory 'plans' in documents",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'documents');
          return !!docs?.children?.find(c => c.name === 'plans' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'create-2',
        description: "Create file 'idea.txt' inside 'plans'",
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
    description: "Select multiple files with Space, then Cut (x) and Paste (p).",
    initialPath: ['root', 'home', 'user'],
    hint: "Create 'archive/' in home/user. In 'downloads': Select both files with Space. Press 'x'. Go to 'archive', press 'p'.",
    onEnter: setupLevel5,
    tasks: [
      {
        id: 'batch-0',
        description: "Create directory 'archive' in guest home",
        check: (state) => {
            const user = findNodeByName(state.fs, 'guest');
            return !!user?.children?.find(c => c.name === 'archive' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'batch-1',
        description: "Move 'strange_file.exe' and 'vacation.png' to 'archive'",
        check: (state) => {
           const archive = findNodeByName(state.fs, 'archive');
           const downloads = findNodeByName(state.fs, 'downloads');
           const hasFiles = archive?.children?.some(c => c.name === 'strange_file.exe') && 
                            archive?.children?.some(c => c.name === 'vacation.png');
           const downloadsClean = !downloads?.children?.some(c => c.name === 'strange_file.exe' || c.name === 'vacation.png');
           return !!(hasFiles && downloadsClean);
        },
        completed: false
      }
    ]
  },

  // --- EPISODE 2: EXPANSION ---
  {
    id: 6,
    title: "Deep Structure",
    description: "Create a nested structure 'project/src/main.rs'.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Create 'project/', enter it. Create 'src/', enter it. Create 'main.rs'.",
    onEnter: setupLevel6,
    tasks: [
      {
         id: 'ep2-1a',
         description: "Create 'project' folder",
         check: (state) => {
             const ws = findNodeByName(state.fs, 'workspace');
             return !!ws?.children?.find(c => c.name === 'project');
         },
         completed: false
      },
      {
         id: 'ep2-1b',
         description: "Create 'src' inside 'project'",
         check: (state) => {
             const proj = findNodeByName(state.fs, 'project');
             return !!proj?.children?.find(c => c.name === 'src');
         },
         completed: false
      },
      {
        id: 'ep2-1c',
        description: "Create 'main.rs' inside 'src'",
        check: (state) => {
           const src = findNodeByName(state.fs, 'src');
           return !!src?.children?.find(c => c.name === 'main.rs');
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    title: "The Duplicator",
    description: "Use 'y' (yank/copy) and 'p' (paste) to back up files.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Select 'project_alpha.txt', press 'y'. Create 'backup/' folder. Enter it. Press 'p'.",
    tasks: [
      {
        id: 'ep2-2a',
        description: "Create 'backup' folder in documents",
        check: (state) => {
           const docs = findNodeByName(state.fs, 'documents');
           return !!docs?.children?.find(c => c.name === 'backup');
        },
        completed: false
      },
      {
        id: 'ep2-2b',
        description: "Copy 'project_alpha.txt' into 'backup'",
        check: (state) => {
           const backup = findNodeByName(state.fs, 'backup');
           const copiedFile = backup?.children?.find(c => c.name === 'project_alpha.txt');
           return !!copiedFile;
        },
        completed: false
      }
    ]
  },
  {
    id: 8,
    title: "Clean Sweep",
    description: "Delete multiple specific files using selection.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Navigate to 'tmp'. Delete 'log_old.txt' and 'cache'.",
    tasks: [
      {
          id: 'ep2-3a',
          description: "Navigate to 'tmp' in root",
          check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'tmp',
          completed: false
      },
      {
        id: 'ep2-3b',
        description: "Delete everything in 'tmp'",
        check: (state) => {
            const tmp = findNodeByName(state.fs, 'tmp');
            return tmp?.children?.length === 0;
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    title: "Organized Chaos",
    description: "Move all files from 'docs' to 'workspace'.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Select all files in docs. Cut (x). Go to workspace. Paste (p).",
    tasks: [
      {
        id: 'ep2-4a',
        description: "Move 'project_alpha.txt' to 'workspace'",
        check: (state) => {
           const ws = findNodeByName(state.fs, 'workspace');
           return !!ws?.children?.find(c => c.name.includes('project_alpha'));
        },
        completed: false
      },
      {
        id: 'ep2-4b',
        description: "Move 'notes.md' to 'workspace'",
        check: (state) => {
            const ws = findNodeByName(state.fs, 'workspace');
            return !!ws?.children?.find(c => c.name === 'notes.md');
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    title: "The Swap",
    description: "Move contents of A to B, and B to A.",
    initialPath: ['root', 'home', 'user'],
    hint: "This is a test of speed. Move 'workspace' items back to 'documents'.",
    tasks: [
       {
        id: 'ep2-5',
        description: "Move 'project_alpha.txt' back to 'documents'",
        check: (state) => {
           const docs = findNodeByName(state.fs, 'documents');
           return !!docs?.children?.find(c => c.name.includes('project_alpha'));
        },
        completed: false
       },
       {
        id: 'ep2-5b',
        description: "Move 'notes.md' back to 'documents'",
        check: (state) => {
            const docs = findNodeByName(state.fs, 'documents');
            return !!docs?.children?.find(c => c.name === 'notes.md');
        },
        completed: false
       }
    ]
  },

  // --- EPISODE 3: MASTERY ---
  {
    id: 11,
    title: "Root Access",
    description: "Operate outside the home directory.",
    initialPath: ['root'],
    hint: "Go to 'etc'. Create 'sys/', enter it. Create 'boot.conf'.",
    onEnter: setupLevel11,
    tasks: [
      {
          id: 'ep3-1a',
          description: "Navigate to 'etc'",
          check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'etc',
          completed: false
      },
      {
        id: 'ep3-1b',
        description: "Create 'sys/boot.conf' inside 'etc'",
        check: (state) => {
           const etc = findNodeByName(state.fs, 'etc');
           const sys = etc?.children?.find(c => c.name === 'sys');
           return !!sys?.children?.find(c => c.name === 'boot.conf');
        },
        completed: false
      }
    ]
  },
  {
    id: 12,
    title: "Shadow Copy",
    description: "Duplicate an entire directory structure.",
    initialPath: ['root', 'etc'],
    hint: "Select 'sys'. Copy (y). Paste (p). It will create a copy.",
    tasks: [
      {
        id: 'ep3-2',
        description: "Create a copy of the 'sys' directory",
        check: (state) => {
           const etc = findNodeByName(state.fs, 'etc');
           const sysDirs = etc?.children?.filter(c => c.name === 'sys' && c.type === 'dir');
           return (sysDirs?.length || 0) >= 2;
        },
        completed: false
      }
    ]
  },
  {
    id: 13,
    title: "Precision Strike",
    description: "Navigate deep, delete one file, return immediately.",
    initialPath: ['root'],
    hint: "Go to home/user/documents. Delete 'notes.md'. Return to root.",
    tasks: [
      {
        id: 'ep3-3',
        description: "Delete 'notes.md' and return to 'root'",
        check: (state) => {
           const docs = findNodeByName(state.fs, 'documents');
           const notes = docs?.children?.find(c => c.name === 'notes.md');
           const isAtRoot = state.currentPath.length === 1 && state.currentPath[0] === 'root';
           return !notes && isAtRoot;
        },
        completed: false
      }
    ]
  },
  {
    id: 14,
    title: "Expansionist",
    description: "Create a complex tree: a/b/c and x/y/z.",
    initialPath: ['root', 'home', 'user'],
    hint: "Create 'a/b/c/'. Go back. Create 'x/y/z/'.",
    tasks: [
      {
        id: 'ep3-4a',
        description: "Create 'a/b/c' nested directories",
        check: (state) => {
           const user = findNodeByName(state.fs, 'guest');
           const a = user?.children?.find(c => c.name === 'a');
           return a?.children?.[0]?.children?.[0]?.name === 'c';
        },
        completed: false
      },
      {
        id: 'ep3-4b',
        description: "Create 'x/y/z' nested directories",
        check: (state) => {
            const user = findNodeByName(state.fs, 'guest');
            const x = user?.children?.find(c => c.name === 'x');
            return x?.children?.[0]?.children?.[0]?.name === 'z';
        },
        completed: false
      }
    ]
  },
  {
    id: 15,
    title: "Grand Master",
    description: "The final test. Clean up everything.",
    initialPath: ['root', 'home', 'user'],
    hint: "Delete 'a', 'x', 'documents', 'downloads', 'pictures'. Leave only 'workspace'.",
    tasks: [
      {
          id: 'ep3-5a',
          description: "Delete 'documents' and 'downloads'",
          check: (state) => {
              const user = findNodeByName(state.fs, 'guest');
              const docs = user?.children?.find(c => c.name === 'documents');
              const dl = user?.children?.find(c => c.name === 'downloads');
              return !docs && !dl;
          },
          completed: false
      },
      {
          id: 'ep3-5b',
          description: "Delete 'pictures' and temp folders 'a', 'x', 'archive'",
          check: (state) => {
              const user = findNodeByName(state.fs, 'guest');
              const pics = user?.children?.find(c => c.name === 'pictures');
              const a = user?.children?.find(c => c.name === 'a');
              return !pics && !a;
          },
          completed: false
      },
      {
        id: 'ep3-5c',
        description: "Ensure ONLY 'workspace' remains",
        check: (state) => {
           const user = findNodeByName(state.fs, 'guest');
           const children = user?.children || [];
           const hasWorkspace = children.some(c => c.name === 'workspace');
           const others = children.filter(c => c.name !== 'workspace');
           return hasWorkspace && others.length === 0;
        },
        completed: false
      }
    ]
  }
];