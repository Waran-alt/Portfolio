# 🌐 Internationalization (i18n) System

A lightweight, maintainable i18n system for Next.js 15 App Router with TypeScript.

## 🎯 **Single Source of Truth Architecture**

This system is designed around the principle of **zero duplication**. Adding a new language requires changes to **only 2 locations**:

1. **`src/i18n/constants.ts`** - Add one entry to the LANGUAGES array
2. **`public/locales/{code}/`** - Copy and translate JSON files

Everything else updates **automatically**:
- ✅ TypeScript types
- ✅ UI components  
- ✅ Translation hooks
- ✅ Language switcher

## 🚀 **Adding a New Language**

### Step 1: Add Language Configuration
```typescript
// src/i18n/constants.ts
export const LANGUAGES: LanguageConfig[] = [
  // ... existing languages
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
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
src/i18n/
├── index.ts                   # Main export (facade)
├── constants.ts               # 🔧 Edit this to add languages
├── types.ts                   # Type definitions
├── utils.ts                   # Helper functions
├── constants.unit.test.ts     # Constants tests
├── utils.unit.test.ts         # Utils tests
├── index.unit.test.ts         # Integration tests
└── README.md                  # This file

public/locales/
├── en/                        # English (template)
│   ├── common.json
│   └── svgTest.json
├── fr/                        # French
│   ├── common.json
│   └── svgTest.json
└── de/                        # German (example)
    ├── common.json
    └── svgTest.json
```



## 🛠️ **Usage Examples**

### Language Switcher (Auto-updates)
```typescript
// Automatically shows all configured languages
const languages = LANGUAGES; // No manual array needed!
```

### Type Safety
```typescript
// Types are automatically generated
type SupportedLocale = 'en' | 'fr' | 'de'; // Auto-updates when you add languages
```

### Translation Hook
```typescript
// Automatically supports all configured languages
const { t } = useTranslation('svgTest', 'de'); // Works immediately after adding German
```

## 🧪 **Validation & Testing**

### TypeScript Validation
TypeScript automatically catches missing translation files and type errors.

### Test Coverage
```bash
# Run comprehensive i18n tests
npm test src/i18n/
```

## 🔄 **Migration from Old System**

The new system is **backward compatible**. Existing code continues to work, but you get:

- ✅ Better maintainability
- ✅ Type safety
- ✅ TypeScript validation
- ✅ Simple copy-paste workflow
- ✅ Single source of truth

## 🎨 **UI Features**

### Language Switcher
- Shows flag + native name (🇫🇷 Français)
- Automatically includes all configured languages
- Type-safe locale switching

### Fallback Chain
1. **Requested locale** (e.g., `de`)
2. **Fallback locale** (e.g., `en`)
3. **Key name** (e.g., `controls.validate`)

## 📊 **Configuration Options**

```typescript
// src/i18n/constants.ts
export const LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',           // Language code (ISO 639-1)
    name: 'English',      // English name
    nativeName: 'English', // Native name
    flag: '🇺🇸',         // Emoji flag
    rtl: false,           // Right-to-left support (optional)
  },
];
```

## 🚨 **Best Practices**

### Language Management
1. **Always add languages to `constants.ts` first** - This triggers all automatic updates
2. **Use English as the template** - Most complete and up-to-date translations
3. **Display native names in UI** - Shows "Français" not "French" for better UX
4. **Test new languages immediately** - TypeScript catches missing files at compile time

### File Organization
5. **Edit only `constants.ts`** - Never modify `utils.ts` or `types.ts` directly
6. **Keep translations flat** - Try to limit to 3 levels deep for easier maintenance
7. **Use descriptive keys** - `errors.invalidPath` not `error1`

### Code Practices
8. **Import from `@/i18n`** - Use the main export, not individual files
9. **Never hardcode strings** - Always use translation keys
10. **Provide fallbacks** - Use `t('key', 'Fallback text')` for safety

## 🔍 **Troubleshooting**

### Missing Translation Files
Copy from English: `cp -r public/locales/en public/locales/{new-lang}`

### Type Errors
Make sure you've updated `constants.ts` and restarted TypeScript.

### Import Errors
Always import from `@/i18n`, never from individual util files.

---

**This system makes i18n maintenance a breeze!** 🎉
