'use client';

import { useSyncExternalStore } from 'react';

function subscribe(): () => void {
  return () => {};
}

function getIsIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** True on iPhone / iPad / iPod (incl. iPadOS desktop UA). False on SSR and non-iOS. */
export function useIosDevice(): boolean {
  return useSyncExternalStore(subscribe, getIsIosDevice, () => false);
}
