import { useState, useEffect } from 'react';
import { BREAKPOINT_MOBILE } from '../lib/constants';

interface ViewportState {
  isMobile: boolean;
  isLandscape: boolean;
}

const MOBILE_QUERY = `(max-width: ${BREAKPOINT_MOBILE}px) and (orientation: portrait)`;
const LANDSCAPE_QUERY = '(orientation: landscape)';

export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(() => ({
    isMobile: window.matchMedia(MOBILE_QUERY).matches,
    isLandscape: window.matchMedia(LANDSCAPE_QUERY).matches,
  }));

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    const landscapeMedia = window.matchMedia(LANDSCAPE_QUERY);

    const handleMobileChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isMobile: e.matches }));
    };

    const handleLandscapeChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isLandscape: e.matches }));
    };

    mobileMedia.addEventListener('change', handleMobileChange);
    landscapeMedia.addEventListener('change', handleLandscapeChange);

    return () => {
      mobileMedia.removeEventListener('change', handleMobileChange);
      landscapeMedia.removeEventListener('change', handleLandscapeChange);
    };
  }, []);

  return state;
}
