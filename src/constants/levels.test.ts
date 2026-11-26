import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import type { FileNode, GameState } from '../types';

const level8 = LEVELS.find((level) => level.id === 8);
const deployPatch = level8?.tasks.find((task) => task.id === 'deploy-patch');

if (!level8 || !deployPatch) {
  throw new Error('Level 8 deploy-patch task is missing');
}

const fs: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'workspace',
      name: 'workspace',
      type: 'dir',
      children: [
        {
          id: 'systemd-core',
          name: 'systemd-core',
          type: 'dir',
          children: [
            { id: 'corrupt-uplink', name: 'uplink_v1.conf', type: 'file', content: 'CLEAN' },
          ],
        },
      ],
    },
  ],
};

const cleanClipboard = {
  nodes: [{ id: 'clean-uplink', name: 'uplink_v1.conf', type: 'file', content: 'CLEAN' }],
  action: 'yank' as const,
  originalPath: ['root', 'home', 'guest', '.config', 'vault', 'active'],
};

const baseState = {
  fs,
  currentPath: ['root', 'workspace', 'systemd-core'],
  keystrokes: 3,
  usedShiftP: true,
  clipboard: cleanClipboard,
  lastHistoryBackPath: ['root', 'workspace', 'systemd-core'],
  lastHistoryBackClipboardIds: ['clean-uplink'],
} as unknown as GameState;

describe('Level 8 deploy-patch check', () => {
  it('accepts H landing in systemd-core while carrying the clean signature', () => {
    expect(deployPatch.check(baseState, level8)).toBe(true);
  });

  it('rejects H that landed somewhere else', () => {
    expect(
      deployPatch.check(
        { ...baseState, lastHistoryBackPath: ['root', 'workspace'] } as GameState,
        level8
      )
    ).toBe(false);
  });

  it('rejects H pressed before the clean signature was on the clipboard', () => {
    expect(
      deployPatch.check(
        { ...baseState, lastHistoryBackClipboardIds: ['old-payload'] } as GameState,
        level8
      )
    ).toBe(false);
  });

  it('rejects a stray H when the player is not in systemd-core', () => {
    expect(
      deployPatch.check({ ...baseState, currentPath: ['root', 'workspace'] } as GameState, level8)
    ).toBe(false);
  });
});

const level9 = LEVELS.find((level) => level.id === 9);
const selectKeepers = level9?.tasks.find((task) => task.id === 'cleanup-1-select');

if (!level9 || !selectKeepers) {
  throw new Error('Level 9 keeper-selection task is missing');
}

const selectedKeepers = {
  fs: {
    id: 'root',
    name: 'root',
    type: 'dir',
    children: [
      {
        id: 'tmp',
        name: 'tmp',
        type: 'dir',
        children: [
          { id: 'ghost', name: 'ghost_process.pid', type: 'file' },
          { id: 'socket', name: 'socket_001.sock', type: 'file' },
          { id: 'monitor', name: 'system_monitor.pid', type: 'file' },
          { id: 'token', name: 'access_token.key', type: 'file' },
        ],
      },
    ],
  } as FileNode,
  currentPath: ['root', 'tmp'],
  selectedIds: ['ghost', 'socket', 'monitor', 'token'],
} as unknown as GameState;

describe('Level 9 keeper-selection task', () => {
  it('waits for the filter to be cleared after selecting the keepers', () => {
    expect(
      selectKeepers.check(
        { ...selectedKeepers, filters: { tmp: '\\.(key|pid|sock)$' } } as GameState,
        level9
      )
    ).toBe(false);
    expect(selectKeepers.check({ ...selectedKeepers, filters: {} }, level9)).toBe(true);
  });
});
