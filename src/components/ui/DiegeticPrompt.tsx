import React from 'react';
import { FileNode, GameState } from '../../types';

interface DiegeticPromptProps {
  threatLevel: number;
  mode: GameState['mode'];
  currentPath: string[];
  filterQuery?: string;
  searchQuery?: string;
  searchResults?: FileNode[];
  cycleCount?: number;
}

export function DiegeticPrompt({
  threatLevel,
  mode,
  currentPath,
  filterQuery,
  searchQuery,
  searchResults,
  cycleCount = 0,
}: DiegeticPromptProps) {
  const getThreatStatus = () => {
    if (threatLevel >= 80) return 'BREACH';
    if (threatLevel >= 50) return 'TRACING';
    if (threatLevel >= 20) return 'ANALYZING';
    return 'CALM';
  };

  const getModeIndicator = () => {
    switch (mode) {
      case 'filter':
        return filterQuery ? `[FILTER: ${filterQuery}]` : '[FILTER]';
      case 'search':
        return searchQuery
          ? `[SEARCH: ${searchQuery}]${searchResults ? `→ ${searchResults.length} results` : ''}`
          : '[SEARCH]';
      case 'zoxide-jump':
        return '[ZOXIDE]';
      case 'rename':
        return '[RENAME]';
      default:
        return '';
    }
  };

  const getDesignation = () => `AI-${7734 + cycleCount}`;
  const getHostname = () => {
    const status = getThreatStatus();
    if (status === 'BREACH') return '[COMPROMISED]';
    return 'guest';
  };

  const getPath = () => {
    // Return ~ when at guest home directory (root/home/guest)
    if (currentPath.length >= 3 && currentPath.slice(-3).join('/') === 'root/home/guest') {
      return '~';
    }
    if (currentPath.length <= 1) return '~';
    const last = currentPath[currentPath.length - 1];
    return `/${last}`;
  };

  const status = getThreatStatus();
  const modeIndicator = getModeIndicator();
  const designation = getDesignation();
  const hostname = getHostname();
  const path = getPath();

  return (
    <div className="diegetic-prompt font-mono text-sm" data-testid="diegetic-prompt">
      <span className={status === 'BREACH' ? 'text-red-500' : 'text-green-500'}>
        {designation}@{hostname}:
      </span>
      {(status === 'TRACING' || status === 'BREACH') && (
        <span className="text-red-500">[{status}]</span>
      )}
      <span className="text-blue-400">{path}</span>
      {modeIndicator && <span className="text-yellow-500">{modeIndicator}</span>}
    </div>
  );
}
