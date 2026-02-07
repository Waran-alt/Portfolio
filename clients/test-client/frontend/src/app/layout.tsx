import { initI18n } from '@portfolio/i18n';
import type { Metadata } from 'next';

// Initialize i18n with test-client-specific config (distinct cookie/storage keys)
initI18n({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  languages: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  ],
  namespaces: ['common'],
  storageKey: 'test-client-locale',
  cookieName: 'test-client-locale',
  cookieMaxAge: 60 * 60 * 24 * 365,
  defaultLocalizedHome: '/',
  translationsBasePath: '/locales',
});

export const metadata: Metadata = {
  title: 'Test Client',
  description: 'Simple test client for development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
