import React from 'react';
import { ListOrdered } from 'lucide-react';
import { WarningModal } from './WarningModal';

interface SortWarningModalProps {
  allowAutoFix: boolean;
  onDismiss?: () => void;
}

export const SortWarningModal: React.FC<SortWarningModalProps> = ({ allowAutoFix, onDismiss }) => {
  return (
    <WarningModal
      allowAutoFix={allowAutoFix}
      onDismiss={onDismiss}
      detectedText="Custom sorting active."
      note="Note: sort order is global and persists with Yazi across sessions."
      icon={<ListOrdered size={20} className="text-zinc-400" />}
      correctiveAction="Reset sort to natural (,n) to restore expected order."
      autoFixText="to continue..."
    />
  );
};
