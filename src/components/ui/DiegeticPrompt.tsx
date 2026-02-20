import React from 'react';
import { FileNode, GameState } from '../../types';
import { resolvePath } from '../../utils/fsHelpers';

interface DiegeticPromptProps {
  threatLevel: number;
  mode: GameState['mode'];
  currentPath: string[];
  fs: FileNode;
  filterQuery?: string;
  searchQuery?: string;
  searchResults?: FileNode[];
  cycleCount?: number;
}

export function DiegeticPrompt({
  threatLevel,
  mode,
  currentPath,
  fs,
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
    const parts: string[] = [];
    if (searchQuery) {
      const count = searchResults ? ` (${searchResults.length})` : '';
      parts.push(`search: ${searchQuery}${count}`);
    }
    if (filterQuery) {
      parts.push(`filter: ${filterQuery}`);
    }
    if (mode === 'zoxide-jump') parts.push('(zoxide)');
    if (mode === 'rename') parts.push('(rename)');
    return parts.join(' ');
  };

  const getDesignation = () => `AI-${7734 + cycleCount}`;
  const getHostname = () => 'guest';

  const getPath = () => {
    const fullPath = resolvePath(fs, currentPath);
    if (fullPath === '/home/guest') return '~';
    if (fullPath.startsWith('/home/guest/')) return '~' + fullPath.slice('/home/guest'.length);
    return fullPath;
  };

  const status = getThreatStatus();
  const modeIndicator = getModeIndicator();
  const designation = getDesignation();
  const hostname = getHostname();
  const path = getPath();

  return (
    <div className="diegetic-prompt font-mono text-sm" data-testid="breadcrumbs">
      <span className={status === 'BREACH' ? 'text-red-500' : 'text-green-500'}>
        {designation}@{hostname}:
      </span>
      {(status === 'TRACING' || status === 'BREACH') && (
        <span className="text-red-500">[{status}]</span>
      )}
      <span className="breadcrumb text-blue-400">{path}</span>
      {modeIndicator && <span className="text-yellow-500">{modeIndicator}</span>}
      <span className="text-gray-400">$</span>
    </div>
  );
}
