import { INITIAL_FS, LEVELS, applyFileSystemMutations } from './src/constants';
import { getNodeById, resolvePath } from './src/utils/fsHelpers';

const level = LEVELS.find((l) => l.id === 14);
if (!level) {
  console.error('Level 14 not found');
  process.exit(1);
}

let fs = JSON.parse(JSON.stringify(INITIAL_FS));
fs = applyFileSystemMutations(fs, 14);

console.log('Level 14 Initial Path:', level.initialPath);
level.initialPath.forEach((id) => {
  const node = getNodeById(fs, id);
  console.log(`Node ID: ${id}, Name: ${node?.name}, Found: ${!!node}`);
});

console.log('Resolved Path:', resolvePath(fs, level.initialPath));
