import {
  getBestLocale,
  HtmlAttributes,
  LocaleProvider,
} from '@portfolio/i18n';
import type { Metadata } from 'next';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'VatMan - Winery Vat Management',
    description: 'Visual terrain layer for cellar plans',
    alternates: {
      languages: { en: '/en', fr: '/fr', 'x-default': '/en' },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<React.ReactElement> {
  const { locale: localeParam } = await params;
  const locale = getBestLocale(localeParam);

  return (
    <LocaleProvider initialLocale={locale}>
      <HtmlAttributes />
      {children}
    </LocaleProvider>
  );
}
