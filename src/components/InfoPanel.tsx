import React from 'react';

import { FileNode } from '../types';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

interface InfoPanelProps {
  file: FileNode | null;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ file, onClose }) => {
  const panelRef = useOverlayFocus(Boolean(file));
  if (!file) return null;

  const computeBytes = (node: FileNode): number => {
    if (node.type === 'dir' || node.type === 'archive') {
      const children = node.children || [];
      return children.reduce((sum, c) => sum + computeBytes(c), 0);
    }
    return node.content ? node.content.length : 0;
  };

  const formatSize = (node: FileNode): string => {
    const bytes = computeBytes(node);
    if (bytes === 0) return '0B';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  };

  const getMimetype = (node: FileNode): string => {
    if (node.type === 'dir') return 'inode/directory';
    if (node.type === 'archive') {
      if (node.name.endsWith('.zip')) return 'application/zip';
      if (node.name.endsWith('.tar.gz') || node.name.endsWith('.tgz')) return 'application/gzip';
      return 'application/x-archive';
    }
    const ext = node.name.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      js: 'text/javascript',
      ts: 'text/typescript',
      tsx: 'text/typescript',
      rs: 'text/rust',
      conf: 'text/plain',
      log: 'text/plain',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      pdf: 'application/pdf',
      pem: 'application/x-pem-file',
      key: 'application/x-pem-file',
      bin: 'application/octet-stream',
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  };

  const size = formatSize(file);
  const mimetype = getMimetype(file);
  const isDir = file.type === 'dir';
  const isArchive = file.type === 'archive';

  // Plugins heuristics — match wording in screenshots
  const spotterLabel = isDir
    ? 'folder'
    : isArchive
      ? 'archive'
      : mimetype.startsWith('text')
        ? 'code'
        : mimetype.startsWith('image')
          ? 'image'
          : 'mime';

  const previewerLabel = isDir
    ? 'folder'
    : isArchive
      ? 'archive'
      : mimetype.startsWith('text')
        ? 'code'
        : mimetype.startsWith('image')
          ? 'image'
          : 'file';

  const fetchersLabel = isDir ? '-' : mimetype === 'application/octet-stream' ? 'binary' : 'mime';

  // Format timestamp as dd/MM/yy HH:mm (24h) to match UI
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const created = formatDate(file.createdAt);
  const modified = formatDate(file.modifiedAt);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onKeyDown={(event) => {
        if (event.shiftKey) containOverlayTab(event);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="file-info-title"
        tabIndex={-1}
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <h2
            id="file-info-title"
            className="text-sm font-bold text-white uppercase tracking-wider"
          >
            Info
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-300 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header with folder/file name and size */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded p-3">
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`text-xs font-bold tracking-widest ${isDir ? 'text-green-400' : isArchive ? 'text-yellow-400' : 'text-cyan-400'}`}
              >
                {isDir ? 'Folder' : isArchive ? 'Archive' : 'File'}
              </div>
              <div className="min-w-0 break-words text-sm font-bold text-white">{file.name}</div>
            </div>
            <div className="text-xs text-zinc-300 font-mono mb-3">
              <span className="text-zinc-400">{isDir ? 'Items:' : 'Size:'}</span> {size}
            </div>

            <h3 className="text-xs uppercase font-bold text-green-500 mb-2 tracking-widest">
              Base
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Created:</span>
                <span className="text-zinc-300">{created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Modified:</span>
                <span className="text-zinc-300">{modified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mimetype:</span>
                <span className="text-zinc-300">{mimetype}</span>
              </div>
            </div>
          </div>

          {/* Plugins Section */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded p-3">
            <h3 className="text-xs uppercase font-bold text-green-500 mb-2 tracking-widest">
              Plugins
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Spotter:</span>
                <span className="text-zinc-300">{spotterLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Previewer:</span>
                <span className="text-zinc-300">{previewerLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fetchers:</span>
                <span className="text-zinc-300">{fetchersLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Preloaders:</span>
                <span className="text-zinc-300">-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 font-mono">Press Tab or Esc to close</p>
        </div>
      </div>
    </div>
  );
};
