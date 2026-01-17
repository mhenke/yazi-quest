import { INITIAL_FS } from './src/constants.tsx';
import { getNodeById } from './src/utils/fsHelpers.ts';

const guest = getNodeById(INITIAL_FS, 'guest');
console.log('Guest found:', !!guest);
if (guest && guest.children) {
  const config = guest.children.find((c) => c.name === '.config');
  console.log('.config in guest children:', !!config);
  if (config) {
    console.log('.config starts with dot:', config.name.startsWith('.'));
  }

  const visible = guest.children.filter((c) => !c.name.startsWith('.'));
  const hasConfig = visible.some((c) => c.name === '.config');
  console.log('.config in filtered items:', hasConfig);
}
