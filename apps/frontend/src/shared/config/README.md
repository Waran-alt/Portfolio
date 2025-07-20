# Frontend Configuration

Quick reference for configuration files and their purposes.

## File Structure

```
config/
├── index.ts              # All exports
├── app-config.ts         # Main config (env vars, API, site settings)
├── overlay-layout.ts     # Overlay positioning & z-index
├── app-environment.ts    # Legacy env config
└── README.md            # This file
```

## Quick Reference

| What you need         | File to look at       |
|-----------------------|-----------------------|
| Environment variables | `app-config.ts`       |
| API endpoints         | `app-config.ts`       |
| Overlay positioning   | `overlay-layout.ts`   |
| Site URLs             | `app-config.ts`       |
| Development settings  | `app-config.ts`       |
| Legacy env config     | `app-environment.ts`  |

## Usage Examples

```typescript
import { env, API_CONFIG, OVERLAY_LAYOUT_CONFIG } from '@/shared/config';

// Environment
env.api.url
env.isDevelopment

// API
API_CONFIG.ENDPOINTS.PROJECTS

// Overlay positioning
OVERLAY_LAYOUT_CONFIG.overlayMenu
```

## Environment Variables

**Required:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_FRONTEND_URL`

**Optional:**
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_BUILD_TIME`
- `FRONTEND_PORT`
- `BACKEND_PORT`
- `BACKEND_URL` 