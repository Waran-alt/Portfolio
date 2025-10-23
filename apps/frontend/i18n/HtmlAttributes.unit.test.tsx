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
const mockAppendChild = jest.spyOn(document.head, 'appendChild');
const mockHeadQuerySelectorAll = jest.spyOn(document.head, 'querySelectorAll');
const mockDocQuerySelectorAll = jest.spyOn(document, 'querySelectorAll');

// Mock document
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

// document.head.querySelectorAll is spied via mockHeadQuerySelectorAll above

describe('HtmlAttributes', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockHeadQuerySelectorAll.mockReturnValue([] as any);
    mockDocQuerySelectorAll.mockReturnValue([] as any);
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
    const makeTag = () => {
      const tag: any = {};
      tag.parentNode = { removeChild: jest.fn() };
      return tag as HTMLLinkElement;
    };
    const mockExistingTags = [makeTag(), makeTag()] as const;
    (mockDocQuerySelectorAll as jest.Mock).mockReturnValue(mockExistingTags as any);

    render(
      <LocaleProvider initialLocale="en">
        <HtmlAttributes />
      </LocaleProvider>
    );

    // Selector used by component
    expect(mockDocQuerySelectorAll).toHaveBeenCalledWith('link[rel="alternate"][data-i18n-hreflang="true"]');
    // Cleanup should remove via parentNode.removeChild
    expect((mockExistingTags[0] as any).parentNode.removeChild).toHaveBeenCalledWith(mockExistingTags[0]);
    expect((mockExistingTags[1] as any).parentNode.removeChild).toHaveBeenCalledWith(mockExistingTags[1]);
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

    // Verify links were appended for the first render via appendChild calls
    const firstRenderLinks = mockAppendChild.mock.calls.map(c => c[0] as HTMLLinkElement)
      .filter(l => (l as HTMLLinkElement).rel === 'alternate');
    expect(firstRenderLinks.length).toBeGreaterThan(0);

    // Switch to /bb/about and rerender
    window.history.replaceState({}, '', '/bb/about');
    rerender(
      <LocaleProvider initialLocale="bb">
        <HtmlAttributes />
      </LocaleProvider>
    );

    const newCalls = mockAppendChild.mock.calls.map(c => c[0] as HTMLLinkElement)
      .filter(l => (l as HTMLLinkElement).rel === 'alternate')
      .slice(firstRenderLinks.length);
    // Expect a full new batch of links appended on rerender
    expect(newCalls.length).toBeGreaterThanOrEqual(LANGUAGES.length + 1);
    // Validate hrefs for the new batch
    const hrefs = newCalls.map(l => ({ hreflang: (l as HTMLLinkElement).hreflang, href: (l as HTMLLinkElement).href }));
    LANGUAGES.forEach(lang => {
      const found = hrefs.find(h => h.hreflang === lang.code);
      expect(found).toBeTruthy();
      expect(found!.href).toBe(`${window.location.origin}/${lang.code}/about`);
    });
    const xDefault = hrefs.find(h => h.hreflang === 'x-default');
    expect(xDefault).toBeTruthy();
    expect(xDefault!.href).toBe(`${window.location.origin}/about`);
  });
});
