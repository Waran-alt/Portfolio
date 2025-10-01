/**
 * Mock translation function for testing.
 * Returns the key itself as the translation for simplicity.
 */
import type { TranslationFunction } from '@/hooks/useTranslation';

/**
 * Simple mock translation function that returns the key or fallback.
 * Use this in tests to avoid loading actual translation files.
 */
export const mockT: TranslationFunction = (key: string, options?) => {
  return options?.fallback || key;
};

/**
 * Mock translation function that returns English-like text for UI testing.
 * Use this when you need realistic translation output in tests.
 */
export const mockTWithText: TranslationFunction = (key: string, options?) => {
  const translations: Record<string, string> = {
    'controls.showGrid': 'Show Grid',
    'controls.hideGrid': 'Hide Grid',
    'controls.showLabels': 'Show Labels',
    'controls.hideLabels': 'Hide Labels',
    'controls.showPoints': 'Show Points',
    'controls.hidePoints': 'Hide Points',
    'controls.showFill': 'Show Fill',
    'controls.hideFill': 'Hide Fill',
    'controls.resetView': 'Reset Pan',
    'accessibility.canvasLabel': 'SVG Canvas',
    'errors.invalidPath': 'Invalid path',
  };
  
  return translations[key] || options?.fallback || key;
};

