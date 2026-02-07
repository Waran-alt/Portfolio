'use client';

import { useLocale, useTranslation } from '@portfolio/i18n';
import { useRouter, usePathname } from 'next/navigation';

export default function Home() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation('common', locale);
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
    const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    router.push(pathWithoutLocale === '/' ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
  ];

  return (
    <main
      style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <p>{t('status.message')}</p>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h2>{t('status.heading')}</h2>
        <p>✅ {t('status.frontend')}</p>
        <p>
          ✅ {t('status.backend')}{' '}
          <a href="/api/hello">/api/hello</a>
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <label htmlFor="lang-switch">{t('language')}: </label>
        <select
          id="lang-switch"
          value={locale}
          onChange={(e) => handleLocaleChange(e.target.value)}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          {languages.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </main>
  );
}
