import { INITIAL_FS } from './src/constants.tsx';
import { getNodeById, resolvePath } from './src/utils/fsHelpers.ts';

console.log('Testing INITIAL_FS lookup...');
const guest = getNodeById(INITIAL_FS, 'guest');
console.log('Guest found:', !!guest);
if (guest) {
  console.log('Guest ID:', guest.id);
  console.log('Guest Name:', guest.name);
}

const config = getNodeById(INITIAL_FS, '.config');
console.log('.config found:', !!config);
if (config) {
  console.log('.config ID:', config.id);
  console.log('.config Name:', config.name);
}

const pathStr = resolvePath(INITIAL_FS, ['root', 'home', 'guest']);
console.log('Path string for guest:', pathStr);

const configPathStr = resolvePath(INITIAL_FS, ['root', 'home', 'guest', '.config']);
console.log('Path string for .config:', configPathStr);
