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

describe('Level 5, 12, and 13 shared objective helpers', () => {
  it('checks deployed vault uplinks on Level 5 deploy-assets and hide-hidden', () => {
    const level5 = LEVELS.find((l) => l.id === 5)!;
    const deploy = level5.tasks.find((t) => t.id === 'deploy-assets')!;
    const hide = level5.tasks.find((t) => t.id === 'hide-hidden')!;

    const missingFs: FileNode = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          children: [{ id: '.config', name: '.config', type: 'dir', children: [] }],
        },
      ],
    };
    const readyFs: FileNode = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          children: [
            {
              id: '.config',
              name: '.config',
              type: 'dir',
              children: [
                {
                  id: 'vault',
                  name: 'vault',
                  type: 'dir',
                  children: [
                    {
                      id: 'active',
                      name: 'active',
                      type: 'dir',
                      children: [
                        { id: 'u1', name: 'uplink_v1.conf', type: 'file' },
                        { id: 'u2', name: 'uplink_v2.conf', type: 'file' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const notReady = {
      fs: missingFs,
      currentPath: ['root', 'guest'],
      showHidden: false,
      usedGH: true,
    } as unknown as GameState;
    expect(deploy.check(notReady, level5)).toBe(false);
    expect(hide.check(notReady, level5)).toBe(false);

    const ready = {
      fs: readyFs,
      currentPath: ['root', 'guest'],
      showHidden: false,
      usedGH: true,
    } as unknown as GameState;
    expect(deploy.check(ready, level5)).toBe(true);
    expect(hide.check(ready, level5)).toBe(true);
  });

  it('checks workspace identity inspection on Level 12 and Level 13', () => {
    const level12 = LEVELS.find((l) => l.id === 12)!;
    const level13 = LEVELS.find((l) => l.id === 13)!;
    const l12Task = level12.tasks.find((t) => t.id === 'discover-identity-12')!;
    const l13Task = level13.tasks.find((t) => t.id === 'discover-identity-13')!;

    const wsFs: FileNode = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [
        {
          id: 'workspace',
          name: 'workspace',
          type: 'dir',
          children: [{ id: 'id-log', name: '.identity.log.enc', type: 'file' }],
        },
      ],
    };

    const hiddenOff = {
      fs: wsFs,
      currentPath: ['root', 'workspace'],
      cursorIndex: 0,
      showHidden: false,
      filters: {},
      sortBy: 'natural',
      sortDirection: 'asc',
      completedTaskIds: { 12: ['navigate-workspace'] },
    } as unknown as GameState;
    expect(l12Task.check(hiddenOff, level12)).toBe(false);
    expect(l13Task.check(hiddenOff, level13)).toBe(false);

    const inspecting = { ...hiddenOff, showHidden: true } as GameState;
    expect(l12Task.check(inspecting, level12)).toBe(true);
    expect(l13Task.check(inspecting, level13)).toBe(true);
  });

  it('checks Level 8 investigation, damage verification, and patch acquisition tasks', () => {
    const investigate = level8.tasks.find((t) => t.id === 'investigate-corruption')!;
    const verify = level8.tasks.find((t) => t.id === 'verify-damage')!;
    const acquire = level8.tasks.find((t) => t.id === 'acquire-patch')!;

    const corruptState = {
      ...baseState,
      fs: {
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
                  {
                    id: 'u',
                    name: 'uplink_v1.conf',
                    type: 'file',
                    content: 'CORRUPT signature',
                  },
                ],
              },
            ],
          },
        ],
      } as FileNode,
      cursorIndex: 0,
      filters: {},
      sortBy: 'natural',
      sortDirection: 'asc',
      showHidden: false,
      usedFilter: true,
    } as unknown as GameState;

    expect(investigate.check(corruptState, level8)).toBe(true);
    expect(verify.check(corruptState, level8)).toBe(true);
    expect(acquire.check(corruptState, level8)).toBe(true);

    expect(investigate.check({ ...corruptState, currentPath: ['root'] } as GameState, level8)).toBe(
      false
    );
    expect(verify.check({ ...corruptState, usedFilter: false } as GameState, level8)).toBe(false);
    expect(acquire.check({ ...corruptState, clipboard: null } as GameState, level8)).toBe(false);
  });

  it('checks Level 9 cleanup-3-delete and Level 10 heist-3-yank tasks', () => {
    const cleanup = level9.tasks.find((t) => t.id === 'cleanup-3-delete')!;
    expect(cleanup.check({ ...selectedKeepers, usedD: true } as GameState, level9)).toBe(true);
    expect(cleanup.check({ ...selectedKeepers, usedD: false } as GameState, level9)).toBe(false);

    const level10 = LEVELS.find((l) => l.id === 10)!;
    const heistYank = level10.tasks.find((t) => t.id === 'heist-3-yank')!;
    const activeKey: FileNode = { id: 'ak', name: 'access_key_new.pem', type: 'file' };
    const yankState = {
      fs: {
        id: 'root',
        name: 'root',
        type: 'dir',
        children: [{ id: 'creds', name: 'credentials', type: 'dir', children: [activeKey] }],
      } as FileNode,
      currentPath: ['root', 'creds'],
      cursorIndex: 0,
      filters: {},
      sortBy: 'modified',
      sortDirection: 'desc',
      showHidden: false,
      usedY: true,
      clipboard: { action: 'yank', nodes: [activeKey], originalPath: ['root', 'creds'] },
      completedTaskIds: { 10: ['heist-2-sort'] },
    } as unknown as GameState;

    expect(heistYank.check(yankState, level10)).toBe(true);
    expect(
      heistYank.check({ ...yankState, completedTaskIds: { 10: [] } } as GameState, level10)
    ).toBe(false);

    const level15 = LEVELS.find((l) => l.id === 15)!;
    const verifyConfigs = level15.tasks.find((t) => t.id === 'verify-configs')!;
    const activeFiles: FileNode[] = [{ id: 'ua', name: 'uplink_active.conf', type: 'file' }];
    const lvl15State = {
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
              {
                id: 'v',
                name: 'vault',
                type: 'dir',
                children: [{ id: 'a', name: 'active', type: 'dir', children: activeFiles }],
              },
            ],
          },
        ],
      } as FileNode,
      keystrokes: 1,
      completedTaskIds: { 15: ['verify-keys'] },
    } as unknown as GameState;

    expect(verifyConfigs.check(lvl15State, level15)).toBe(true);
    expect(verifyConfigs.check({ ...lvl15State, keystrokes: 0 } as GameState, level15)).toBe(false);
  });
});
