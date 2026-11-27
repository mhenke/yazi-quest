export const createAudioContext = (): AudioContext => {
  const w = window as unknown as {
    AudioContext?: { new (): AudioContext };
    webkitAudioContext?: { new (): AudioContext };
  };
  const Ctor = w.AudioContext || w.webkitAudioContext;
  if (!Ctor) throw new Error('No AudioContext available');
  return new Ctor();
};

export const hasUserActivation = (): boolean =>
  typeof navigator === 'undefined' ||
  !('userActivation' in navigator) ||
  navigator.userActivation.hasBeenActive;
