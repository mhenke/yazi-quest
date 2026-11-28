import React from 'react';

import { FileNode } from '../types';
import {
  computeNodeBytes,
  countVisibleChildren,
  formatBytes,
  getDeterministicTimestamp,
} from '../utils/sizeHelpers';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

export interface InfoPanelProps {
  file: FileNode | null;
  onClose: () => void;
  showHidden: boolean;
}

const MIME_MAP: Record<string, string> = {
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

const getMimetype = (node: FileNode): string => {
  if (node.type === 'dir') return 'inode/directory';
  if (node.type === 'archive') {
    if (node.name.endsWith('.zip')) return 'application/zip';
    if (node.name.endsWith('.tar.gz') || node.name.endsWith('.tgz')) return 'application/gzip';
    return 'application/x-archive';
  }
  const ext = node.name.split('.').pop()?.toLowerCase();
  return MIME_MAP[ext || ''] || 'application/octet-stream';
};

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

const resolvePluginLabels = (isDir: boolean, isArchive: boolean, mimetype: string) => {
  if (isDir) return { spotter: 'folder', previewer: 'folder', fetchers: '-' };
  if (isArchive) return { spotter: 'archive', previewer: 'archive', fetchers: 'mime' };
  const fetchers = mimetype === 'application/octet-stream' ? 'binary' : 'mime';
  if (mimetype.startsWith('text')) return { spotter: 'code', previewer: 'code', fetchers };
  if (mimetype.startsWith('image')) return { spotter: 'image', previewer: 'image', fetchers };
  return { spotter: 'mime', previewer: 'file', fetchers };
};

export const InfoPanel: React.FC<InfoPanelProps> = ({ file, onClose, showHidden }) => {
  const panelRef = useOverlayFocus(Boolean(file));

  if (!file) return null;

  const isDir = file.type === 'dir';
  const isArchive = file.type === 'archive';
  const size = isDir ? countVisibleChildren(file, showHidden) : formatBytes(computeNodeBytes(file));
  const mimetype = getMimetype(file);
  const {
    spotter: spotterLabel,
    previewer: previewerLabel,
    fetchers: fetchersLabel,
  } = resolvePluginLabels(isDir, isArchive, mimetype);

  const modifiedTimestamp = getDeterministicTimestamp(file);
  const created = formatDate(file.createdAt ?? modifiedTimestamp);
  const modified = formatDate(modifiedTimestamp);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs"
      onKeyDown={(event) => {
        // Plain Tab is Yazi's toggle-close keybinding (handled at priority 1000 in App.tsx);
        // keep Shift+Tab trapped inside the dialog while letting forward Tab close normally.
        if (event.shiftKey) containOverlayTab(event);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-info-title"
        tabIndex={-1}
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border border-zinc-700 shadow-2xl rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
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
            className="min-h-9 px-3 py-1.5 rounded text-xs text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
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
                className={`text-xs font-bold tracking-widest ${isDir ? 'text-cyan-400' : isArchive ? 'text-yellow-400' : 'text-cyan-400'}`}
              >
                {isDir ? 'Folder' : isArchive ? 'Archive' : 'File'}
              </div>
              <div className="min-w-0 break-words text-sm font-bold text-white">{file.name}</div>
            </div>
            <div className="text-xs text-zinc-300 font-mono mb-3">
              <span className="text-zinc-400">{isDir ? 'Entry count:' : 'Size:'}</span> {size}
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
              <div className="flex justify-between">
                <span className="text-zinc-400">Permissions:</span>
                <span className="text-zinc-300">
                  {file.permissions || (isDir ? 'drwxr-xr-x' : '-rw-r--r--')}
                </span>
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
