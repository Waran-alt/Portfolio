# 🌐 Internationalization (i18n) System

A maintainable i18n system for Next.js App Router with TypeScript.

## 🎯 **Single Source of Truth Architecture**

This system is designed around the principle of **zero duplication**. Adding a new language requires changes to **only 2 locations**:

1. **`i18n/constants.ts`** - Add one entry to the LANGUAGES array
2. **`public/locales/{code}/`** - Copy and translate JSON files

Everything else updates **automatically**:
- ✅ TypeScript types
- ✅ UI components  
- ✅ Translation hooks
- ✅ Language switcher
- ✅ URL routing (`/en/page`, `/fr/page`)
- ✅ SEO hreflang tags

## 🚀 **Adding a New Language**

### Step 1: Add Language Configuration
```typescript
// i18n/constants.ts
export const LANGUAGES: LanguageConfig[] = [
  // ... existing languages
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
  },
];
```

### Step 2: Create Translation Files
Copy English files and translate:
```bash
# Copy English templates
cp -r public/locales/en public/locales/de

# Edit the files and translate content
# public/locales/de/common.json
# public/locales/de/svgTest.json
```

**That's it!** 🎉 The language will automatically appear in the UI.

## 📁 **File Structure**

```
apps/frontend/i18n/
├── constants.ts               # Language configuration (SSoT) - 🔧 Editable
├── HtmlAttributes.tsx         # Dynamic HTML attributes component (lang, dir, hreflang)
├── index.ts                   # Main export facade (**Single Import Point**)
├── LocaleContext.tsx          # React context for locale state management
├── middleware.ts              # Middleware utilities for locale detection & routing
├── README.md                  # This documentation
├── storage.ts                 # Persistence layer (localStorage & cookies)
├── types.ts                   # TypeScript type definitions
└── utils.ts                   # Pure locale helper functions

public/locales/
├── en/                        # English (template)
│   ├── common.json
│   └── svgTest.json
├── fr/                        # French
│   ├── common.json
│   └── svgTest.json
└── ...
```

## 🌐 **URL Routing Integration**

The i18n system is fully integrated with Next.js routing using subpath routing:

### URL Patterns
- **Localized routes:** `/en/svg-test`, `/fr/svg-test`
- **Non-localized routes:** `/svg-test` → redirects to `/en/svg-test` (or user's preferred locale)
- **Query parameter override:** `/?lang=fr` → redirects to `/fr/`

### Automatic Language Detection Priority
1. **Query parameter** (`?lang=fr`) - Explicit user choice
2. **Cookie** (`portfolio-locale=fr`) - Saved preference from previous visit
3. **Accept-Language header** (`Accept-Language: fr-CA,fr;q=0.9`) - Browser setting
4. **Default locale** (`en`) - Final fallback

### Middleware Integration

The middleware handles automatic redirection to localized routes.

### Layout Integration

The `[locale]/layout.tsx` provides locale context to all pages.

## 🛠️ **Usage Examples**

### Basic Translation
```typescript
'use client';

import { useLocale } from 'i18n';
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { locale } = useLocale();
  const { t } = useTranslation('common', locale);

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('title')}</h1> {/* "Portfolio" */}

      {/* Nested keys */}
      <a>{t('navigation.home')}</a> {/* "Home" */}

      {/* With fallback */}
      <p>{t('missing.key', { fallback: 'Default text' })}</p>
    </div>
  );
}
```

### Language Switching
```typescript
'use client';

import { useLocale, LANGUAGES } from 'i18n';
import { useRouter, usePathname } from 'next/navigation';

function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // Update context and storage
    setLocale(newLocale);
    
    // Navigate to new locale (SPA navigation)
    const pathSegments = pathname.split('/').filter(Boolean);
    const newPath = `/${newLocale}/${pathSegments.slice(1).join('/')}`;
    router.push(newPath);
  };

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### Variable Interpolation
```typescript
// Define translations with placeholders
{
  "welcome": "Welcome, {{name}}!",
  "itemCount": "You have {{count}} {{item}}",
  "quest": "{{hero}} must destroy the {{object}} in {{location}}"
}

// Use with variables
t('welcome', { vars: { name: 'Frodo' } })
// → "Welcome, Frodo!"

t('itemCount', { vars: { count: 42, item: 'rings' } })
// → "You have 42 rings"

t('quest', { 
  vars: { 
    hero: 'Harry',
    object: 'Horcrux',
    location: 'Hogwarts'
  }
})
// → "Harry must destroy the Horcrux in Hogwarts"
```

## 💾 **Storage & Persistence**

The system automatically persists user language preferences:

### Client-Side Storage
- **localStorage**: Persists across browser sessions
- **Cookies**: Enables SSR and middleware to detect preferences

### Automatic Persistence
When a user changes language, both storage mechanisms are updated:
```typescript
setLocale('fr'); // Automatically saves to localStorage AND cookie
```

### Storage Utilities
For advanced use cases, you can access storage utilities directly:
```typescript
import { 
  saveLocaleToStorage,
  getLocaleFromStorage,
  saveLocaleToCookie,
  getLocaleFromCookie 
} from 'i18n';

// Manual storage operations (rarely needed)
saveLocaleToStorage('fr');
const stored = getLocaleFromStorage();
```

### Server-Side Access
In middleware or server components, read from cookie headers:
```typescript
import { getLocaleFromCookieHeader } from 'i18n/storage';

const locale = getLocaleFromCookieHeader(request.headers.get('cookie'));
```

## 🎨 **UI Features**

### HTML Attributes
The `HtmlAttributes` component automatically manages:
- **`lang` attribute**: Updates `<html lang="fr">` for accessibility
- **`dir` attribute**: Handles RTL languages (`<html dir="rtl">`)
- **`hreflang` tags**: Generates SEO-friendly alternate language links

### Translation Fallback Chain
When a translation key is missing:
1. **Requested locale** (e.g., `de`) - Try German translation
2. **Fallback locale** (e.g., `en`) - Try English translation
3. **Provided fallback** - Use `{ fallback: 'Default text' }`
4. **Key name** - Display the key itself (e.g., `controls.validate`)

## 🚨 **Best Practices**

### Language Management
1. **Always add languages to `constants.ts` first** - This triggers all automatic updates
2. **Use English as the template** - Most complete and up-to-date translations
3. **Display native names in UI** - Shows "Français" not "French" for better UX
4. **Test new languages immediately** - TypeScript catches missing files at compile time

### File Organization
5. **Edit only `constants.ts`** - Never modify `utils.ts`, `types.ts`, or `storage.ts` directly
6. **Keep translations flat** - Try to limit to 3 levels deep for easier maintenance
7. **Use descriptive keys** - `errors.invalidPath` not `error1`

### Code Practices
8. **Import from `i18n`** - Use the main export, not individual files
   ```typescript
   // ✅ Good
   import { useLocale, LANGUAGES } from 'i18n';
   
   // ❌ Bad
   import { useLocale } from '@/i18n/LocaleContext';
   ```

9. **Never hardcode strings** - Always use translation keys
   ```typescript
   // ✅ Good
   {t('common.save')}
   
   // ❌ Bad
   Save
   ```

10. **Provide fallbacks** - Use `{ fallback: 'Fallback text' }` for safety
    ```typescript
    t('optional.key', { fallback: 'Default text' })
    ```

### Routing & Navigation
11. **Use Next.js router for locale changes** - Never use `window.location.href`
    ```typescript
    // ✅ Good - SPA navigation
    setLocale(newLocale);
    router.push(`/${newLocale}${pathname}`);
    
    // ❌ Bad - Full page reload
    window.location.href = `/${newLocale}${pathname}`;
    ```

12. **Trust the URL locale** - The middleware ensures all routes have a locale prefix
13. **Let `LocaleContext` handle persistence** - `setLocale()` automatically saves to storage

---

**Focus on translations and enjoy!** 🎉
