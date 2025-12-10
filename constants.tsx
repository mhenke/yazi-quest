import { FileNode, Level } from './types';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

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

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Navigation Novice",
    description: "Learn to move around. Use 'j' (down), 'k' (up) to move cursor. Use 'l' to enter a directory, and 'h' to go back.",
    initialPath: ['root', 'home', 'user'],
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
    tasks: [
      {
        id: 'del-1',
        description: "Go to 'downloads' and delete 'strange_file.exe'",
        check: (state) => {
          // We need to find the downloads folder and check if virus is gone
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
  }
];

// Helper to traverse FS for checks
function getCurrentNode(root: FileNode, pathIds: string[]): FileNode | null {
  let current = root;
  // Skip root ID in path iteration if path[0] is root, assuming path starts with root
  // Our path state includes root.
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
