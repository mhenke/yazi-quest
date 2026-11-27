import React from 'react';
import { RequirementNotice } from './RequirementNotice';

export interface ViewportGateProps {
  atFloor: boolean;
  showEpisodeIntro: boolean;
  isGameOver: boolean;
  touchOnly: boolean;
  children: React.ReactNode;
}

export const ViewportGate: React.FC<ViewportGateProps> = ({
  atFloor,
  showEpisodeIntro,
  isGameOver,
  touchOnly,
  children,
}) => {
  if (atFloor) {
    return (
      <div className="flex flex-col flex-1 h-full min-w-0" inert={showEpisodeIntro || isGameOver}>
        {children}
      </div>
    );
  }
  return showEpisodeIntro ? null : <RequirementNotice reason={touchOnly ? 'keyboard' : 'width'} />;
};
