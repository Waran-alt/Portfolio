'use client';

import { useSyncExternalStore } from 'react';

function subscribe(): () => void {
  return () => {};
}

/** Safari engine: iOS/iPadOS + desktop Safari (excludes Chromium-based browsers). */
function getIsSafariWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return /AppleWebKit/i.test(ua) && !/Chromium|Chrome|CriOS|Edg|OPR|SamsungBrowser|Firefox/i.test(ua);
}

export function useSafariWebKit(): boolean {
  return useSyncExternalStore(subscribe, getIsSafariWebKit, () => false);
}
