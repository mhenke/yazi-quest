import React from 'react';
import { EyeOff } from 'lucide-react';
import { WarningModal } from './WarningModal';

interface HiddenFilesWarningModalProps {
  allowAutoFix: boolean;
  onDismiss?: () => void;
}

export const HiddenFilesWarningModal: React.FC<HiddenFilesWarningModalProps> = ({
  allowAutoFix,
  onDismiss,
}) => {
  return (
    <WarningModal
      allowAutoFix={allowAutoFix}
      onDismiss={onDismiss}
      detectedText="Hidden files are visible."
      icon={<EyeOff size={20} className="text-zinc-400" />}
      correctiveAction={
        <>
          Press <span className="text-yellow-400 font-bold">Shift+Enter</span> to close dialog.
        </>
      }
    />
  );
};
