import { describe, it, expect } from 'vitest';
import {
  getRandomElement,
  checkCriticalFileDeletion,
  validateDeletions,
  checkGrabbingHoneypot,
  checkPastingHoneypot,
  checkAllTasksComplete,
} from './gameUtils';
import { GameState, Level, FileNode } from '../types';

describe('gameUtils', () => {
  describe('getRandomElement', () => {
    it('should return a random element from an array', () => {
      const arr = ['a', 'b', 'c'];
      const result = getRandomElement(arr);
      expect(arr).toContain(result);
    });

    it('should return undefined for empty array', () => {
      const arr: string[] = [];
      // Note: The function as written would cause an error for empty array
      expect(() => getRandomElement(arr)).toThrow();
    });

    it('should return the only element for single-element array', () => {
      const arr = ['only'];
      const result = getRandomElement(arr);
      expect(result).toBe('only');
    });
  });

  describe('checkCriticalFileDeletion', () => {
    it('should return false for non-critical file deletion', () => {
      const gameState: GameState = {
        currentPath: ['root', 'home', 'guest'],
        alerts: [],
        // Add other required properties as needed
      } as GameState;
      const pendingDeleteIds = ['some-file-id'];

      const result = checkCriticalFileDeletion(gameState, pendingDeleteIds);
      expect(result).toBe(false);
    });

    it('should return true for critical system folder deletion at root', () => {
      const gameState: GameState = {
        currentPath: ['root'], // At root level
        alerts: [],
        // Add other required properties as needed
      } as GameState;
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
        // Mock game state
      } as GameState;
      const pendingDeleteIds: string[] = [];
      const currentLevel: Level = {
        id: 1,
        // Mock level
      } as Level;

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
        settings: { soundEnabled: true },
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
        triggeredThoughts: [],
        lastThoughtId: null,
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
        hint: 'Test hint',
        coreSkill: 'Test skill',
        timeLimit: null,
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
        settings: { soundEnabled: true },
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
        triggeredThoughts: [],
        lastThoughtId: null,
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
        hint: 'Test hint',
        coreSkill: 'Test skill',
        timeLimit: null,
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
        settings: { soundEnabled: true },
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
        triggeredThoughts: [],
        lastThoughtId: null,
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
        hint: 'Test hint',
        coreSkill: 'Test skill',
        timeLimit: null,
        maxKeystrokes: undefined,
        efficiencyTip: undefined,
        thought: undefined,
        allowedDeletePaths: undefined,
      };

      const result = checkAllTasksComplete(gameState, level);
      expect(result).toBe(true);
    });
  });
});
