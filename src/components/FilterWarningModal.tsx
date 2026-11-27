import React from 'react';
import { Filter } from 'lucide-react';
import { WarningModal } from './WarningModal';

interface FilterWarningModalProps {
  allowAutoFix: boolean;
  onDismiss?: () => void;
}

export const FilterWarningModal: React.FC<FilterWarningModalProps> = ({
  allowAutoFix,
  onDismiss,
}) => {
  return (
    <WarningModal
      allowAutoFix={allowAutoFix}
      onDismiss={onDismiss}
      detectedText="Active filters detected."
      note="Navigation is blocked while the current directory is filtered."
      icon={<Filter size={20} className="text-zinc-400" />}
      correctiveAction={
        <>
          Press <kbd>Esc</kbd> to close this warning, then <kbd>Esc</kbd> again to clear the filter.
        </>
      }
    />
  );
};
