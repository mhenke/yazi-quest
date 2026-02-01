import { INITIAL_FS, LEVELS, applyFileSystemMutations } from './src/constants';
import { getNodeById, resolvePath } from './src/utils/fsHelpers';

const idx = LEVELS.findIndex((l) => l.id === 14);
const lvl = LEVELS[idx];
let fs = JSON.parse(JSON.stringify(INITIAL_FS));

// This is what App.tsx does:
fs = applyFileSystemMutations(fs, lvl.id, undefined);

console.log('Level:', lvl.title);
console.log('Initial Path IDs:', lvl.initialPath);

lvl.initialPath.forEach((id) => {
  const node = getNodeById(fs, id);
  if (!node) {
    console.error(`MISSING NODE: ID=${id}`);
  } else {
    console.log(`FOUND: ID=${id}, Name=${node.name}`);
  }
});

const workspace = getNodeById(fs, 'workspace');
if (workspace) {
  console.log('Workspace found. Parent ID:', workspace.parentId);
} else {
  console.error('Workspace NOT found in mutated FS');
}

console.log('Final Resolved Path:', resolvePath(fs, lvl.initialPath));
