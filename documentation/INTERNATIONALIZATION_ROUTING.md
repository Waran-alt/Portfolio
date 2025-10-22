# 🌐 Internationalization (i18n) Routing Guide

This guide documents the current i18n routing architecture used by the frontend app. It reflects the locale-prefixed routes, middleware flow, and the split i18n module under `apps/frontend/i18n`.

## Key Goals
- Clean, SEO-friendly, locale-prefixed URLs (e.g., `/en/...`, `/fr/...`).
- Robust locale detection and validation at the edge via middleware.
- Safe client rendering with correct `<html lang>`/`dir` and `hreflang` tags.
- Deterministic language switching without DOM conflicts.

## High-level Flow
1. Request enters Next.js middleware (`apps/frontend/src/middleware.ts`).
2. i18n helpers (`apps/frontend/i18n/middleware.ts`) detect/validate target locale.
3. If missing/invalid prefix, middleware issues a 308 redirect to `/{locale}/...`.
4. The locale layout (`apps/frontend/src/app/[locale]/layout.tsx`) initializes:
   - `LocaleProvider` with `initialLocale` from the route segment.
   - `HtmlAttributes` to update `<html lang>` and `dir`, and manage `hreflang` links.
5. Pages use `useLocale()` and `useTranslation()` to render localized UI.

## URL Structure
- Localized: `/{locale}/{page}` → `/en/svg-test`, `/fr/`
- Root (no prefix): redirects to default or detected locale.

## Locale Detection Priority
The middleware determines the target locale using:
- Query param (if used internally): highest
- Cookie: higher than headers (persisted user choice)
- `Accept-Language` header: next, with region fallback (e.g., `fr-CA` → `fr`)
- Default locale: final fallback

See `apps/frontend/i18n/middleware.ts` for the exact logic and helpers like `getLocaleFromHeaders`, `determineTargetLocale`, and `removeLocalePrefix`.

## Client Responsibilities
- `LocaleProvider` (`apps/frontend/i18n/LocaleContext.tsx`)
  - Owns the current locale state; persists to cookie and localStorage.
  - Uses a “dual persistence” strategy: direct writes on user actions and effect-based sync when driven by route changes.

- `HtmlAttributes` (`apps/frontend/i18n/HtmlAttributes.tsx`)
  - Updates `<html lang>` and `dir` based on the active locale.
  - Manages `<link rel="alternate" hreflang="...">` in `<head>`.
  - Tags generated links with `data-i18n-hreflang="true"` and reliably cleans them up across client transitions.

- `useTranslation` (`apps/frontend/src/hooks/useTranslation.ts`)
  - Loads namespace JSON files dynamically via `import()`.
  - Normalizes locales and supports fallback to the configured fallback locale when a file/key is missing.

## Language Switching
- Source of truth is the route. Switching languages updates the URL (e.g., `/en/...` → `/fr/...`).
- Components like `LanguageSwitcher` should navigate using the router (e.g., `router.replace`), not set state directly.
- The `LocaleProvider` reacts to the changed `initialLocale` from the route and syncs persistence.

## SEO
`HtmlAttributes` injects `hreflang` links for supported locales plus `x-default`, for example:
```html
<link rel="alternate" hreflang="en" href="/en/svg-test">
<link rel="alternate" hreflang="fr" href="/fr/svg-test">
<link rel="alternate" hreflang="x-default" href="/svg-test">
```

## File Map (Essentials)
```
apps/frontend/
├── i18n/
│   ├── HtmlAttributes.tsx
│   ├── LocaleContext.tsx
│   ├── middleware.ts            # i18n helpers for edge middleware
│   └── ...
├── src/
│   ├── middleware.ts            # Next.js middleware entry
│   └── app/
│       └── [locale]/
│           ├── layout.tsx       # Initializes LocaleProvider + HtmlAttributes
│           └── ...              # Pages, e.g. svg-test
└── public/locales/
    ├── en/...
    └── fr/...
```

## Adding a New Locale
1. Update `LANGUAGES` and `SUPPORTED_LOCALES` in `apps/frontend/i18n/constants.ts`.
2. Add translation files under `public/locales/{new-locale}/...`.
3. If RTL, ensure `dir` is set to `rtl` for that locale.
4. Verify middleware accepts the locale and routes render correctly.

## Testing
- Unit/integration tests exist for middleware, HtmlAttributes, LocaleContext, and hooks.
- E2E tests validate localized routes and UI behavior under `/[locale]/...`.

## Notes
- Avoid touching `.env` files in docs or code. Use the documented templates and scripts.
- Prefer route-driven locale changes; do not couple global DOM edits to state in ways that fight React/Next transitions.

For deeper details, see the i18n README at `apps/frontend/i18n/README.md` and the tests colocated with each module.