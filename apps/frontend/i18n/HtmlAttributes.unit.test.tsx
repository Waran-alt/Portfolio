jest.mock('./constants', () => ({
  LANGUAGES: [
    { code: 'aa', name: 'AA', nativeName: 'AA', flag: '🏳️', rtl: false },
    { code: 'bb', name: 'BB', nativeName: 'BB', flag: '🏳️', rtl: false },
    { code: 'xx', name: 'XX', nativeName: 'XX', flag: '🏳️', rtl: true },
  ],
  DEFAULT_LOCALE: 'aa',
}));
import { render } from '@testing-library/react';
import { DEFAULT_LOCALE, LANGUAGES } from './constants';
import { HtmlAttributes } from './HtmlAttributes';
import { LocaleProvider } from './LocaleContext';

// Mock document methods
const mockDocumentElement = {
  lang: 'en',
  dir: 'ltr',
};

const realCreateElement = document.createElement.bind(document);
const mockCreateElement = jest.fn(realCreateElement);
const mockQuerySelectorAll = jest.fn();
const mockAppendChild = jest.spyOn(document.head, 'appendChild');

// Mock document
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true,
});

describe('HtmlAttributes', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockQuerySelectorAll.mockReturnValue([]);
  });

  it('should update lang and dir attributes on mount', () => {
    render(
      <LocaleProvider initialLocale="aa">
        <HtmlAttributes />
      </LocaleProvider>
    );

    expect(mockDocumentElement.lang).toBe('aa');
    expect(mockDocumentElement.dir).toBe('ltr');
  });

  it('should update lang and dir attributes when locale changes', () => {
    const { rerender } = render(
      <LocaleProvider initialLocale="aa">
        <HtmlAttributes />
      </LocaleProvider>
    );

    expect(mockDocumentElement.lang).toBe('aa');
    expect(mockDocumentElement.dir).toBe('ltr');

    // Change to second LTR language
    rerender(
      <LocaleProvider initialLocale="bb">
        <HtmlAttributes />
      </LocaleProvider>
    );

    expect(mockDocumentElement.lang).toBe('bb');
    expect(mockDocumentElement.dir).toBe('ltr');
  });

  it('should set dir to rtl for RTL languages', () => {
    render(
      <LocaleProvider initialLocale="xx">
        <HtmlAttributes />
      </LocaleProvider>
    );

    expect(mockDocumentElement.lang).toBe('xx');
    expect(mockDocumentElement.dir).toBe('rtl');
  });

  it('should create hreflang meta tags', () => {
    // Set the current URL to include a locale and a path so basePath is computed
    const valid = (LANGUAGES[0]?.code ?? DEFAULT_LOCALE) as string;
    window.history.replaceState({}, '', `/${valid}/about`);

    render(
      <LocaleProvider initialLocale="en">
        <HtmlAttributes />
      </LocaleProvider>
    );

    // Should create link elements for each language
    expect(mockCreateElement).toHaveBeenCalledWith('link');
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('should generate correct hreflang hrefs for current path', () => {
    const valid = (LANGUAGES[0]?.code ?? DEFAULT_LOCALE) as string;
    window.history.replaceState({}, '', `/${valid}/about`);

    render(
      <LocaleProvider initialLocale={valid}>
        <HtmlAttributes />
      </LocaleProvider>
    );

    const appendedLinks = mockAppendChild.mock.calls
      .map(call => call[0] as HTMLLinkElement)
      .filter(link => (link as HTMLLinkElement).rel === 'alternate');

    // Expect one link per language with correct hreflang and href
    LANGUAGES.forEach(lang => {
      const found = appendedLinks.find(l => l.hreflang === lang.code);
      expect(found).toBeTruthy();
      expect(found!.href).toBe(`${window.location.origin}/${lang.code}/about`);
    });

    // Expect x-default to point to base path without locale
    const xDefault = appendedLinks.find(l => l.hreflang === 'x-default');
    expect(xDefault).toBeTruthy();
    expect(xDefault!.href).toBe(`${window.location.origin}/about`);
  });

  it('should remove existing hreflang tags before adding new ones', () => {
    const mockExistingTags = [
      { remove: jest.fn() },
      { remove: jest.fn() },
    ] as const;
    mockQuerySelectorAll.mockReturnValue(mockExistingTags);

    render(
      <LocaleProvider initialLocale="en">
        <HtmlAttributes />
      </LocaleProvider>
    );

    expect(mockQuerySelectorAll).toHaveBeenCalledWith('link[rel="alternate"][data-i18n-hreflang="true"]');
    expect(mockExistingTags[0].remove).toHaveBeenCalled();
    expect(mockExistingTags[1].remove).toHaveBeenCalled();
  });

  it('should create x-default hreflang tag', () => {
    render(
      <LocaleProvider initialLocale="en">
        <HtmlAttributes />
      </LocaleProvider>
    );

    // Should create x-default link
    expect(mockCreateElement).toHaveBeenCalledWith('link');
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('should cleanup previous hreflang tags on locale change', () => {
    // Start on /aa/about
    window.history.replaceState({}, '', '/aa/about');

    const { rerender } = render(
      <LocaleProvider initialLocale="aa">
        <HtmlAttributes />
      </LocaleProvider>
    );

    const initialLinks = Array.from(
      document.head.querySelectorAll('link[rel="alternate"][data-i18n-hreflang="true"]')
    ) as HTMLLinkElement[];
    expect(initialLinks.length).toBe(LANGUAGES.length + 1); // per-lang + x-default
    initialLinks.forEach((l) => {
      if (l.hreflang !== 'x-default') expect(l.href).toBe(`${window.location.origin}/${l.hreflang}/about`);
      else expect(l.href).toBe(`${window.location.origin}/about`);
    });

    // Switch to /bb/about and rerender
    window.history.replaceState({}, '', '/bb/about');
    rerender(
      <LocaleProvider initialLocale="bb">
        <HtmlAttributes />
      </LocaleProvider>
    );

    const afterLinks = Array.from(
      document.head.querySelectorAll('link[rel="alternate"][data-i18n-hreflang="true"]')
    ) as HTMLLinkElement[];
    expect(afterLinks.length).toBe(LANGUAGES.length + 1);
    afterLinks.forEach((l) => {
      if (l.hreflang !== 'x-default') expect(l.href).toBe(`${window.location.origin}/${l.hreflang}/about`);
      else expect(l.href).toBe(`${window.location.origin}/about`);
    });
  });
});
