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
      note="Directory navigation is blocked until the natural sort order is restored."
      icon={<ListOrdered size={20} className="text-zinc-400" />}
      correctiveAction={
        <>
          Press <kbd aria-label="comma">,</kbd> then <kbd>n</kbd> to restore natural sort order.
        </>
      }
      autoFixText="to continue..."
    />
  );
};
