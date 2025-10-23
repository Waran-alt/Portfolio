import { fireEvent, render } from '@testing-library/react';
import { LocaleProvider } from '../../../../../i18n/LocaleContext';

// Mutable current locale used by the mocked useLocale
let currentLocale: any = 'aa';
const setLocaleMock = jest.fn();

jest.mock('../../../../../i18n/constants', () => ({
  ...jest.requireActual('../../../../../i18n/constants'),
  LANGUAGES: [
    { code: 'aa', name: 'AA', nativeName: 'AA', flag: '🏳️', rtl: false },
    { code: 'bb', name: 'BB', nativeName: 'BB', flag: '🏳️', rtl: false },
    { code: 'xx', name: 'XX', nativeName: 'XX', flag: '🏳️', rtl: true },
  ],
}));

jest.mock('../../../../../i18n/LocaleContext', () => {
  const actual = jest.requireActual('../../../../../i18n/LocaleContext');
  return {
    ...actual,
    useLocale: () => ({ locale: currentLocale, setLocale: setLocaleMock }),
  };
});

const replaceMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => usePathnameMock(),
}));

import LanguageSwitcher from './LanguageSwitcher';

const t = (key: string) => key; // simple translator stub

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentLocale = 'aa';
  });

  it('navigates to new locale keeping the base path and query/hash', () => {
    usePathnameMock.mockReturnValue('/aa/about');
    // Simulate existing query/hash
    const originalLocation = window.location.href;
    window.history.replaceState({}, '', '/aa/about?q=1#section');

    const { getByRole } = render(
      <LocaleProvider initialLocale={currentLocale}>
        <LanguageSwitcher t={t as any} />
      </LocaleProvider>
    );

    // Change to bb
    const select = getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'bb' } });

    expect(replaceMock).toHaveBeenCalledWith('/bb/about?q=1#section');
    expect(setLocaleMock).not.toHaveBeenCalled();

    // restore
    window.history.replaceState({}, '', originalLocation);
  });

  it('does nothing when selecting the current locale', () => {
    currentLocale = 'aa';
    usePathnameMock.mockReturnValue('/aa/about');

    const { getByRole } = render(
      <LocaleProvider initialLocale={currentLocale}>
        <LanguageSwitcher t={t as any} />
      </LocaleProvider>
    );
    const select = getByRole('combobox') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'aa' } });

    expect(replaceMock).not.toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalled();
  });

  it('derives basePath from URL first segment rather than context', () => {
    // context says aa, URL says bb; switching to xx should keep "/about"
    currentLocale = 'aa';
    usePathnameMock.mockReturnValue('/bb/about');

    const { getByRole } = render(
      <LocaleProvider initialLocale={currentLocale}>
        <LanguageSwitcher t={t as any} />
      </LocaleProvider>
    );
    const select = getByRole('combobox') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'xx' } });

    expect(replaceMock).toHaveBeenCalledWith('/xx/about');
  });

  it('avoids navigation if already at target locale prefix', () => {
    usePathnameMock.mockReturnValue('/bb/about');
    currentLocale = 'aa';

    const { getByRole } = render(
      <LocaleProvider initialLocale={currentLocale}>
        <LanguageSwitcher t={t as any} />
      </LocaleProvider>
    );
    const select = getByRole('combobox') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'bb' } });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('normalizes "/locale" root without trailing slash when switching', () => {
    usePathnameMock.mockReturnValue('/aa');

    const { getByRole } = render(
      <LocaleProvider initialLocale={currentLocale}>
        <LanguageSwitcher t={t as any} />
      </LocaleProvider>
    );
    const select = getByRole('combobox') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'bb' } });

    expect(replaceMock).toHaveBeenCalledWith('/bb');
  });
});


