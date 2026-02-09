import { initI18n } from '@portfolio/i18n';
import type { Metadata } from 'next';
import './globals.css';

initI18n({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  languages: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  ],
  namespaces: ['common'],
  storageKey: 'vat-man-locale',
  cookieName: 'vat-man-locale',
  cookieMaxAge: 60 * 60 * 24 * 365,
  defaultLocalizedHome: '/',
  translationsBasePath: '/locales',
});

export const metadata: Metadata = {
  title: 'VatMan - Winery Vat Management',
  description: 'Visual terrain layer for cellar plans - manage vats, track updates, audit changes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VatMan',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
