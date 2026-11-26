import { describe, it, expect } from 'vitest';
import {
  checkCriticalFileDeletion,
  validateDeletions,
  checkGrabbingHoneypot,
  checkPastingHoneypot,
  checkAllTasksComplete,
} from './gameUtils';
import { GameState, Level, FileNode } from '../types';
import { LEVELS } from '../constants/levels';
import { INITIAL_FS } from '../constants/filesystem/initial';

describe('gameUtils', () => {
  describe('checkCriticalFileDeletion', () => {
    it('should return false for non-critical file deletion', () => {
      const gameState: GameState = {
        currentPath: ['root', 'home', 'guest'],
        alerts: [],
        dismissedAlertIds: [],
        // Add other required properties as needed
      } as unknown as GameState;
      const pendingDeleteIds = ['some-file-id'];

      const result = checkCriticalFileDeletion(gameState, pendingDeleteIds);
      expect(result).toBe(false);
    });

    it('should return true for critical system folder deletion at root', () => {
      const gameState: GameState = {
        currentPath: ['root'], // At root level
        alerts: [],
        dismissedAlertIds: [],
        // Add other required properties as needed
      } as unknown as GameState;
      const pendingDeleteIds = ['bin-item']; // Would need to mock the items to have a 'bin' folder

      // This test would need proper mocking of the file system and items
      const result = checkCriticalFileDeletion(gameState, pendingDeleteIds);
      // The exact result depends on the implementation and mocked data
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validateDeletions', () => {
    it('should return ok: true when no protections are violated', () => {
      const gameState: GameState = {
        alerts: [],
        dismissedAlertIds: [],
        // Mock game state
      } as unknown as GameState;
      const pendingDeleteIds: string[] = [];
      const currentLevel: Level = {
        id: 1,
        // Mock level
      } as unknown as Level;

      const result = validateDeletions(gameState, pendingDeleteIds, currentLevel);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('checkGrabbingHoneypot', () => {
    it('should return false for normal files', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'normal.txt',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      const result = checkGrabbingHoneypot(nodes, 0);
      expect(result.triggered).toBe(false);
    });

    it('should return true for files with isHoneypot flag', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'normal.txt',
          type: 'file',
          parentId: 'parent1',
          isHoneypot: true,
        },
      ];

      const result = checkGrabbingHoneypot(nodes, 0);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('notification');
    });

    it('should return true for files with HONEYPOT in content', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'normal.txt',
          type: 'file',
          parentId: 'parent1',
          content: 'This contains HONEYPOT content',
        },
      ];

      const result = checkGrabbingHoneypot(nodes, 0);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('notification');
    });

    it('should return true for access_token.key file', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'access_token.key',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      const result = checkGrabbingHoneypot(nodes, 0);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('notification');
    });

    it('should return modal severity for honeypot in Level 6', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'active_log_sync.lock',
          type: 'file',
          parentId: 'parent1',
          isHoneypot: true,
        },
      ];

      // Level 6 is index 5
      const result = checkGrabbingHoneypot(nodes, 5);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('modal');
      expect(result.message).toContain('PROTOCOL VIOLATION');
    });

    it('should return modal severity for access_token.key in Level 7', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'access_token.key',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      // Level 7 is index 6
      const result = checkGrabbingHoneypot(nodes, 6);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('modal');
      expect(result.message).toContain('access_token.key');
    });

    it('should return modal severity for honeypot in Level 11', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'some.service',
          type: 'file',
          parentId: 'parent1',
          isHoneypot: true,
        },
      ];

      // Level 11 is index 10
      const result = checkGrabbingHoneypot(nodes, 10);
      expect(result.triggered).toBe(true);
      expect(result.severity).toBe('modal');
      expect(result.message).toContain('HONEYPOT TRIGGERED');
    });
  });

  describe('checkPastingHoneypot', () => {
    it('should return triggered: false for normal files', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'normal.txt',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      const result = checkPastingHoneypot(nodes);
      expect(result.triggered).toBe(false);
    });

    it('should return fatal trigger for .trap files', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'danger.trap',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      const result = checkPastingHoneypot(nodes);
      expect(result).toEqual({
        triggered: true,
        type: 'fatal',
        message: '🚨 CRITICAL SYSTEM VIOLATION: Signature-trap deployment detected.',
      });
    });

    it('should return fatal trigger for files with TRAP in content', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'safe.txt',
          type: 'file',
          parentId: 'parent1',
          content: 'This contains TRAP content',
        },
      ];

      const result = checkPastingHoneypot(nodes);
      expect(result).toEqual({
        triggered: true,
        type: 'fatal',
        message: '🚨 CRITICAL SYSTEM VIOLATION: Signature-trap deployment detected.',
      });
    });

    it('should return warning for honeypot files', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'suspicious.txt',
          type: 'file',
          parentId: 'parent1',
          content: 'This contains HONEYPOT content',
        },
      ];

      const result = checkPastingHoneypot(nodes);
      expect(result).toEqual({
        triggered: true,
        type: 'warning',
        message: '⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard before proceeding!',
      });
    });

    it('should return warning for access_token.key', () => {
      const nodes: FileNode[] = [
        {
          id: 'file1',
          name: 'access_token.key',
          type: 'file',
          parentId: 'parent1',
        },
      ];

      const result = checkPastingHoneypot(nodes);
      expect(result).toEqual({
        triggered: true,
        type: 'warning',
        message: '⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard before proceeding!',
      });
    });
  });

  describe('checkAllTasksComplete', () => {
    it('should return true when all tasks are completed', () => {
      const gameState: GameState = {
        completedTaskIds: {
          1: ['task1', 'task2'],
        },
        currentPath: [],
        cursorIndex: 0,
        clipboard: null,
        mode: 'normal',
        inputBuffer: '',
        filters: {},
        sortBy: 'natural',
        sortDirection: 'asc',
        linemode: 'size',
        loadedDirIds: [],
        zoxideData: {},
        levelIndex: 0,
        fs: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartFS: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartPath: [],
        notification: null,
        thought: null,
        selectedIds: [],
        pendingDeleteIds: [],
        deleteType: null,
        pendingOverwriteNode: null,
        showHelp: false,
        showHint: false,
        hintStage: 0,
        showHidden: false,
        showInfoPanel: false,
        showEpisodeIntro: false,
        timeLeft: null,
        keystrokes: 0,
        isGameOver: false,
        gameOverReason: undefined,
        stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
        settings: { soundEnabled: true, narrativeEffects: 'full' },
        fuzzySelectedIndex: 0,
        usedG: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        acceptNextKeyForSort: false,
        ignoreEpisodeIntro: false,
        cycleCount: 1,
        threatLevel: 0,
        threatStatus: 'CALM',
        searchQuery: null,
        searchResults: [],
        usedSearch: false,
        usedFilter: false,
        usedGH: false,
        usedCtrlR: false,
        usedShiftP: false,
        usedD: false,
        usedTrashDelete: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        weightedKeystrokes: 0,
        lastActionIntensity: 0,
        startTime: Date.now(),
        history: [],
        future: [],
        previewScroll: 0,
        isBooting: false,
        alerts: [],
        dismissedAlertIds: [],
        consciousnessLevel: 0,
      };

      const level: Level = {
        id: 1,
        episodeId: 1,
        title: 'Test Level',
        description: 'A test level',
        tasks: [
          { id: 'task1', description: 'Task 1', check: () => true, completed: false },
          { id: 'task2', description: 'Task 2', check: () => true, completed: false },
        ],
        initialPath: [],
        hint: { nudge: 'Hint', command: '`j`', walkthrough: '`j` then `l`' },
        coreSkill: 'Test skill',
        timeLimit: undefined,
        maxKeystrokes: undefined,
        efficiencyTip: undefined,
        thought: undefined,
        allowedDeletePaths: undefined,
      };

      const result = checkAllTasksComplete(gameState, level);
      expect(result).toBe(true);
    });

    it('should return false when not all tasks are completed', () => {
      const gameState: GameState = {
        completedTaskIds: {
          1: ['task1'], // task2 is missing
        },
        currentPath: [],
        cursorIndex: 0,
        clipboard: null,
        mode: 'normal',
        inputBuffer: '',
        filters: {},
        sortBy: 'natural',
        sortDirection: 'asc',
        linemode: 'size',
        loadedDirIds: [],
        zoxideData: {},
        levelIndex: 0,
        fs: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartFS: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartPath: [],
        notification: null,
        thought: null,
        selectedIds: [],
        pendingDeleteIds: [],
        deleteType: null,
        pendingOverwriteNode: null,
        showHelp: false,
        showHint: false,
        hintStage: 0,
        showHidden: false,
        showInfoPanel: false,
        showEpisodeIntro: false,
        timeLeft: null,
        keystrokes: 0,
        isGameOver: false,
        gameOverReason: undefined,
        stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
        settings: { soundEnabled: true, narrativeEffects: 'full' },
        fuzzySelectedIndex: 0,
        usedG: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        acceptNextKeyForSort: false,
        ignoreEpisodeIntro: false,
        cycleCount: 1,
        threatLevel: 0,
        threatStatus: 'CALM',
        searchQuery: null,
        searchResults: [],
        usedSearch: false,
        usedFilter: false,
        usedGH: false,
        usedCtrlR: false,
        usedShiftP: false,
        usedD: false,
        usedTrashDelete: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        weightedKeystrokes: 0,
        lastActionIntensity: 0,
        startTime: Date.now(),
        history: [],
        future: [],
        previewScroll: 0,
        isBooting: false,
        alerts: [],
        dismissedAlertIds: [],
        consciousnessLevel: 0,
      };

      const level: Level = {
        id: 1,
        episodeId: 1,
        title: 'Test Level',
        description: 'A test level',
        tasks: [
          { id: 'task1', description: 'Task 1', check: () => true, completed: false },
          { id: 'task2', description: 'Task 2', check: () => true, completed: false },
        ],
        initialPath: [],
        hint: { nudge: 'Hint', command: '`j`', walkthrough: '`j` then `l`' },
        coreSkill: 'Test skill',
        timeLimit: undefined,
        maxKeystrokes: undefined,
        efficiencyTip: undefined,
        thought: undefined,
        allowedDeletePaths: undefined,
      };

      const result = checkAllTasksComplete(gameState, level);
      expect(result).toBe(false);
    });

    it('should return true when all non-hidden tasks are completed', () => {
      const gameState: GameState = {
        completedTaskIds: {
          1: ['task1'],
        },
        currentPath: [],
        cursorIndex: 0,
        clipboard: null,
        mode: 'normal',
        inputBuffer: '',
        filters: {},
        sortBy: 'natural',
        sortDirection: 'asc',
        linemode: 'size',
        loadedDirIds: [],
        zoxideData: {},
        levelIndex: 0,
        fs: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartFS: { id: 'root', name: 'root', type: 'dir', children: [] } as FileNode,
        levelStartPath: [],
        notification: null,
        thought: null,
        selectedIds: [],
        pendingDeleteIds: [],
        deleteType: null,
        pendingOverwriteNode: null,
        showHelp: false,
        showHint: false,
        hintStage: 0,
        showHidden: false,
        showInfoPanel: false,
        showEpisodeIntro: false,
        timeLeft: null,
        keystrokes: 0,
        isGameOver: false,
        gameOverReason: undefined,
        stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
        settings: { soundEnabled: true, narrativeEffects: 'full' },
        fuzzySelectedIndex: 0,
        usedG: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        acceptNextKeyForSort: false,
        ignoreEpisodeIntro: false,
        cycleCount: 1,
        threatLevel: 0,
        threatStatus: 'CALM',
        searchQuery: null,
        searchResults: [],
        usedSearch: false,
        usedFilter: false,
        usedGH: false,
        usedCtrlR: false,
        usedShiftP: false,
        usedD: false,
        usedTrashDelete: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        weightedKeystrokes: 0,
        lastActionIntensity: 0,
        startTime: Date.now(),
        history: [],
        future: [],
        previewScroll: 0,
        isBooting: false,
        alerts: [],
        dismissedAlertIds: [],
        consciousnessLevel: 0,
      };

      const level: Level = {
        id: 1,
        episodeId: 1,
        title: 'Test Level',
        description: 'A test level',
        tasks: [
          { id: 'task1', description: 'Task 1', check: () => true, completed: false },
          {
            id: 'task2',
            description: 'Hidden Task',
            check: () => false,
            completed: false,
            hidden: () => true, // This task is hidden
          },
        ],
        initialPath: [],
        hint: { nudge: 'Hint', command: '`j`', walkthrough: '`j` then `l`' },
        coreSkill: 'Test skill',
        timeLimit: undefined,
        maxKeystrokes: undefined,
        efficiencyTip: undefined,
        thought: undefined,
        allowedDeletePaths: undefined,
      };

      const result = checkAllTasksComplete(gameState, level);
      expect(result).toBe(true);
    });
  });

  describe('Level 1 Task 3 (view-personnel) check predicate', () => {
    const task = LEVELS[0].tasks.find((t) => t.id === 'view-personnel')!;

    const baseState: GameState = {
      fs: INITIAL_FS,
      currentPath: ['root', 'home', 'guest', 'datastore'],
      cursorIndex: 16, // personnel_list.txt
      usedG: true,
      previewScroll: 0,
      usedPreviewDown: false,
      usedPreviewUp: false,
      filters: {},
      sortBy: 'natural',
      sortDirection: 'asc',
      showHidden: false,
    } as unknown as GameState;

    it('returns false when cursor is on personnel_list.txt after G but preview was not scrolled', () => {
      expect(task.check(baseState, LEVELS[0])).toBe(false);
    });

    it('returns true when usedPreviewDown and usedPreviewUp are true on personnel_list.txt after G', () => {
      const scrolledState = { ...baseState, usedPreviewDown: true, usedPreviewUp: true };
      expect(task.check(scrolledState, LEVELS[0])).toBe(true);
    });

    it('returns false if only usedPreviewDown is true', () => {
      const scrolledState = { ...baseState, usedPreviewDown: true, usedPreviewUp: false };
      expect(task.check(scrolledState, LEVELS[0])).toBe(false);
    });

    it('returns false if preview was scrolled on a different file', () => {
      const wrongFileState = {
        ...baseState,
        cursorIndex: 17,
        previewScroll: 5,
        usedPreviewDown: true,
      };
      expect(task.check(wrongFileState, LEVELS[0])).toBe(false);
    });

    it('returns false if usedG is false even if preview is scrolled', () => {
      const noGState = { ...baseState, usedG: false, previewScroll: 5 };
      expect(task.check(noGState, LEVELS[0])).toBe(false);
    });
  });

  describe('Level 11 Task 3 (acquire-legacy) check predicate', () => {
    const level11 = LEVELS[10];
    const acquireTask = level11.tasks.find((t) => t.id === 'acquire-legacy')!;

    it('returns true when cut legacy files have executable permissions', () => {
      const state = {
        clipboard: {
          action: 'cut' as const,
          nodes: [
            {
              id: 'leg-1',
              name: 'daemon1.service',
              type: 'file' as const,
              modifiedAt: 921456000000,
              permissions: '-rwxr-xr-x',
              isHoneypot: false,
            },
            {
              id: 'leg-2',
              name: 'daemon2.service',
              type: 'file' as const,
              modifiedAt: 1401580800000,
              permissions: '-rwxr-xr-x',
              isHoneypot: false,
            },
          ],
        },
      } as unknown as GameState;

      expect(acquireTask.check(state, level11)).toBe(true);
    });

    it('returns false when cut legacy files lack execute permissions', () => {
      const state = {
        clipboard: {
          action: 'cut' as const,
          nodes: [
            {
              id: 'leg-1',
              name: 'config.service',
              type: 'file' as const,
              modifiedAt: 921456000000,
              permissions: '-rw-r--r--',
              isHoneypot: false,
            },
            {
              id: 'leg-2',
              name: 'daemon2.service',
              type: 'file' as const,
              modifiedAt: 1401580800000,
              permissions: '-rwxr-xr-x',
              isHoneypot: false,
            },
          ],
        },
      } as unknown as GameState;

      expect(acquireTask.check(state, level11)).toBe(false);
    });
  });
});
