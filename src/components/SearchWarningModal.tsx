import React from 'react';
import { Search } from 'lucide-react';
import { WarningModal } from './WarningModal';

export interface SearchWarningModalProps {
  allowAutoFix: boolean;
  onDismiss?: () => void;
}

export const SearchWarningModal: React.FC<SearchWarningModalProps> = ({
  allowAutoFix,
  onDismiss,
}) => {
  return (
    <WarningModal
      allowAutoFix={allowAutoFix}
      onDismiss={onDismiss}
      detectedText="Active search session detected."
      note="Note: Navigation is blocked while viewing search results."
      icon={<Search size={20} className="text-zinc-400" />}
      correctiveAction={
        <>
          Press <kbd>Esc</kbd> to close this warning and clear the search results.
        </>
      }
    />
  );
};
