import React from 'react';
import { FileNode } from '../types';
import { FileText, FolderOpen } from 'lucide-react';

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

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-300 h-full overflow-hidden">
      <div className="px-3 py-1 text-xs font-bold bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
        Preview
      </div>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3 pb-4 border-b border-zinc-800">
             {node.type === 'dir' ? <FolderOpen size={32} className="text-blue-500" /> : <FileText size={32} className="text-zinc-500" />}
             <div>
                <h2 className="text-lg font-bold text-white">{node.name}</h2>
                <p className="text-xs text-zinc-500 font-mono uppercase">{node.type}</p>
             </div>
        </div>
        
        {node.type === 'file' && (
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
                {node.content || "(Empty file)"}
            </div>
        )}

        {node.type === 'dir' && (
            <div className="text-zinc-500 text-sm">
                <p>Directory contains {node.children?.length || 0} items.</p>
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
