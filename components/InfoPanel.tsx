import React from 'react';
import { FileNode } from '../types';

interface InfoPanelProps {
  file: FileNode | null;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ file, _onClose }) => {
  if (!file) return null;

  // Format file size
  const formatSize = (node: FileNode): string => {
    if (node.type === 'dir') {
      const childCount = node.children?.length || 0;
      return `${childCount} item${childCount !== 1 ? 's' : ''}`;
    }
    if (node.type === 'archive') {
      const childCount = node.children?.length || 0;
      return `${childCount} item${childCount !== 1 ? 's' : ''}`;
    }
    // For files, estimate size based on content length
    const contentLength = node.content?.length || 0;
    if (contentLength < 1024) return `${contentLength}B`;
    if (contentLength < 1024 * 1024) return `${(contentLength / 1024).toFixed(1)}K`;
    return `${(contentLength / (1024 * 1024)).toFixed(1)}M`;
  };

  // Get mimetype
  const getMimetype = (node: FileNode): string => {
    if (node.type === 'dir') return 'inode/directory';
    if (node.type === 'archive') {
      if (node.name.endsWith('.zip')) return 'application/zip';
      if (node.name.endsWith('.tar.gz') || node.name.endsWith('.tgz')) return 'application/gzip';
      return 'application/x-archive';
    }
    // Files
    const ext = node.name.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'rs': 'text/rust',
      'conf': 'text/plain',
      'log': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'pem': 'application/x-pem-file',
      'key': 'application/x-pem-file',
      'bin': 'application/octet-stream',
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  };

  const size = formatSize(file);
  const mimetype = getMimetype(file);

  // Format timestamp
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const created = formatDate(file.createdAt);
  const modified = formatDate(file.modifiedAt);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">File Info</h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header with folder/file name and size */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded p-3">
            <div className="text-sm font-bold text-white mb-1">{file.name}</div>
            <div className="text-xs text-zinc-500 font-mono mb-3">
              <span className="text-zinc-400">Size:</span> {size}
            </div>

            <h3 className="text-[10px] uppercase font-bold text-green-500 mb-2 tracking-widest">Base</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Created:</span>
                <span className="text-zinc-300">{created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Modified:</span>
                <span className="text-zinc-300">{modified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Mimetype:</span>
                <span className="text-zinc-300">{mimetype}</span>
              </div>
            </div>
          </div>

          {/* Plugins Section */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded p-3">
            <h3 className="text-[10px] uppercase font-bold text-green-500 mb-2 tracking-widest">Plugins</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Spotter:</span>
                <span className="text-zinc-300">{file.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Previewer:</span>
                <span className="text-zinc-300">{file.type === 'dir' ? 'folder' : file.type === 'archive' ? 'archive' : 'file'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fetchers:</span>
                <span className="text-zinc-300">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Preloaders:</span>
                <span className="text-zinc-300">-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-600 font-mono">Press Tab or Esc to close</p>
        </div>
      </div>
    </div>
  );
};
