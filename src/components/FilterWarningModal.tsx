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
      note="Note: filters are per directory and persist with Yazi across sessions."
      icon={<Filter size={20} className="text-zinc-400" />}
      correctiveAction="Clear filter (Esc twice) to restore expected results."
    />
  );
};
