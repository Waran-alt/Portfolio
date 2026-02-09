'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslation } from '@portfolio/i18n';
import { useRouter, usePathname } from 'next/navigation';
import CellarPlanCanvas from '@/components/CellarPlanCanvas';
import QuickUpdateForm from '@/components/QuickUpdateForm';
import type { Vat, VatStatus } from '@/types/vat';

// Demo vats with percentage-based positions
const DEMO_VATS: Vat[] = [
  {
    id: '1',
    domainId: 'demo',
    label: 'Vat 1',
    capacity: 5000,
    status: 'empty',
    position: { x: 0.25, y: 0.3 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    domainId: 'demo',
    label: 'Vat 2',
    capacity: 10000,
    status: 'in_progress',
    position: { x: 0.5, y: 0.5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    domainId: 'demo',
    label: 'Vat 3',
    capacity: 8000,
    status: 'full',
    position: { x: 0.75, y: 0.25 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function HomePage() {
  const { locale } = useLocale();
  const { t } = useTranslation('common', locale);
  const router = useRouter();
  const pathname = usePathname();

  const [vats, setVats] = useState<Vat[]>(DEMO_VATS);
  const [selectedVat, setSelectedVat] = useState<Vat | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    router.push(pathWithoutLocale === '/' ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`);
  };

  const handleBackgroundUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setBackgroundUrl(url);
  }, []);

  const handleVatSelect = useCallback((vat: Vat) => {
    setSelectedVat(vat);
  }, []);

  const handleQuickUpdateSave = useCallback(
    (updates: { status?: VatStatus; notes?: string }) => {
      if (!selectedVat) return;
      setVats((prev) =>
        prev.map((v) =>
          v.id === selectedVat.id
            ? {
                ...v,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );
    },
    [selectedVat]
  );

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {t('app.title')}
          </h1>
          <p className="text-white/70">{t('app.subtitle')}</p>
        </div>
        <div>
          <label htmlFor="lang" className="sr-only">
            Language
          </label>
          <select
            id="lang"
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            className="rounded-lg border border-white/20 bg-cellar-accent px-3 py-2 text-white"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-white">
          {t('cellar.title')}
        </h2>
        <CellarPlanCanvas
          vats={vats}
          backgroundImageUrl={backgroundUrl}
          onBackgroundUpload={handleBackgroundUpload}
          onVatSelect={handleVatSelect}
        />
      </section>

      <QuickUpdateForm
        vat={selectedVat}
        onSave={handleQuickUpdateSave}
        onClose={() => setSelectedVat(null)}
      />
    </main>
  );
}
