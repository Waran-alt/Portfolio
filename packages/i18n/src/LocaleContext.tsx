'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getBestLocale } from './utils.js';
import { getLocaleFromStorage, saveLocaleToCookie, saveLocaleToStorage } from './storage.js';

export type SupportedLocale = string;

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  initialLocale: string;
  children: React.ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps): React.JSX.Element {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => getBestLocale(initialLocale));

  const setLocale = useCallback((newLocale: SupportedLocale): void => {
    setLocaleState(newLocale);
    saveLocaleToStorage(newLocale);
    saveLocaleToCookie(newLocale);
  }, []);

  useEffect(() => {
    const stored = getLocaleFromStorage();
    if (stored !== locale) {
      saveLocaleToStorage(locale);
      saveLocaleToCookie(locale);
    }
  }, [locale]);

  useEffect(() => {
    const normalized = getBestLocale(initialLocale);
    setLocaleState((prev: SupportedLocale) => (prev !== normalized ? normalized : prev));
  }, [initialLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
