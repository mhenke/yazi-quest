let _requested = false;

export const setSkipIntroRequested = (): void => {
  _requested = true;
};

export const getSkipIntroRequested = (): boolean => _requested;

export const resetSkipIntroRequested = (): void => {
  _requested = false;
};
