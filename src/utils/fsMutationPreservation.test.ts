import { describe, it, expect } from 'vitest';
import { INITIAL_FS } from '../constants/filesystem/initial';
import { applyFileSystemMutations } from '../constants/filesystem/mutations';
import { getNodeById } from './fsHelpers';
import type { FileNode } from '../types';

const coreOf = (fs: FileNode): FileNode => {
  const workspace = getNodeById(fs, 'workspace');
  const core = workspace?.children?.find((c) => c.name === 'systemd-core' && c.type === 'dir');
  if (!core) throw new Error('workspace/systemd-core missing');
  return core;
};

describe('applyFileSystemMutations preserves player files in workspace systemd-core', () => {
  it('keeps .service files installed during Level 11 when advancing to Level 12', () => {
    let fs = applyFileSystemMutations(JSON.parse(JSON.stringify(INITIAL_FS)), 11);

    // Player pastes two legacy daemons into ~/workspace/systemd-core (deposit-daemons)
    const core = coreOf(fs);
    core.children = core.children ?? [];
    for (const name of ['ghost-handler.service', '.backup-archive.service']) {
      core.children.push({
        id: `player-${name}`,
        name,
        type: 'file',
        content: '[Service]\nExecStart=/usr/bin/legacy\n',
        parentId: core.id,
      });
    }

    fs = applyFileSystemMutations(fs, 12);

    const names = coreOf(fs).children?.map((c) => c.name) ?? [];
    expect(names).toContain('ghost-handler.service');
    expect(names).toContain('.backup-archive.service');
    // Seeded content stays authoritative
    expect(names).toContain('uplink_v1.conf');
    // The credentials/ dir created by the Level 11 mutations also survives
    expect(names).toContain('credentials');
  });
});
