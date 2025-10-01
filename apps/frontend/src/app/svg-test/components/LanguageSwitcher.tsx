'use client';

import { LANGUAGES, type SupportedLocale } from '@/i18n';
import React from 'react';

interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale,
  onLocaleChange,
  t,
}) => {
  const languages = LANGUAGES;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-violet-700 font-medium">
        {t('common.language', 'Language')}:
      </span>
      <select
        value={currentLocale}
        onChange={(e) => onLocaleChange(e.target.value as SupportedLocale)}
        className="px-2 py-1 text-sm border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
