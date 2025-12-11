import React from 'react';
import { FileNode } from '../types';
import { FileText, FolderOpen, Image as ImageIcon, FileArchive, PackageOpen } from 'lucide-react';

interface PreviewPaneProps {
  node: FileNode | null;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="flex-1 bg-zinc-950 flex items-center justify-center text-zinc-700">
        <span className="text-sm">No preview available</span>
      </div>
    );
  }

  const isImage = node.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(node.name);
  const isArchiveFile = node.type === 'file' && /\.(zip|tar|gz|7z|rar)$/i.test(node.name);
  const isArchiveDir = node.type === 'archive';
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-300 h-full overflow-hidden">
      <div className="px-3 py-1 text-xs font-bold bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
        Preview
      </div>
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6 flex items-center gap-3 pb-4 border-b border-zinc-800 shrink-0">
             {node.type === 'dir' ? (
                <FolderOpen size={32} className="text-blue-500" /> 
             ) : isArchiveDir ? (
                <PackageOpen size={32} className="text-red-500" />
             ) : isArchiveFile ? (
                <FileArchive size={32} className="text-red-500" />
             ) : isImage ? (
                <ImageIcon size={32} className="text-purple-500" />
             ) : (
                <FileText size={32} className="text-zinc-500" />
             )}
             <div>
                <h2 className="text-lg font-bold text-white">{node.name}</h2>
                <p className="text-xs text-zinc-500 font-mono uppercase">{node.type}</p>
             </div>
        </div>
        
        {/* File Content / Image Preview */}
        {node.type === 'file' && !hasChildren && (
            <div className="flex-1 overflow-auto">
                {isImage ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-zinc-800 rounded bg-zinc-900/30 p-4">
                        <img 
                            src={node.content} 
                            alt={node.name} 
                            className="max-w-full max-h-full object-contain rounded shadow-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerText = '[Image Load Failed]';
                            }}
                        />
                    </div>
                ) : (
                    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
                        {node.content || "(Empty file)"}
                    </div>
                )}
            </div>
        )}

        {/* Directory/Archive Stats */}
        {(node.type === 'dir' || isArchiveDir || hasChildren) && (
            <div className="text-zinc-500 text-sm overflow-auto">
                <p>{(isArchiveDir || isArchiveFile) ? 'Archive' : 'Directory'} contains {node.children?.length || 0} items.</p>
                <ul className="mt-4 space-y-1 list-disc list-inside">
                    {node.children?.slice(0, 5).map(c => (
                        <li key={c.id}>{c.name}</li>
                    ))}
                    {(node.children?.length || 0) > 5 && <li>...</li>}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};