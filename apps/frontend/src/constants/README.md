# Frontend Constants

This directory contains all constants used throughout the frontend application. Constants are values that are fixed at compile-time and do not change across environments.

## Structure

```
constants/
├── index.ts           # Exports all constants
├── animations.ts      # Animation-related constants
└── README.md         # This documentation
```

## Usage Guidelines

### When to Use Constants

Use constants for values that are:
- **Fixed at compile-time**: Values that don't change during runtime
- **Application-wide**: Used across multiple components
- **Non-sensitive**: Not related to API keys, secrets, or environment-specific data
- **Design-related**: Colors, sizes, timing values, etc.

### When NOT to Use Constants

Do NOT use constants for:
- **Environment variables**: Use `.env` files instead
- **User-specific data**: Use state or props
- **API endpoints**: Use environment variables
- **Sensitive information**: Use environment variables

## Importing Constants

```typescript
// Import specific constants
import { SVG_LINE_ANIMATION, Z_INDEX_LAYERS } from '@/constants';

// Import all constants (not recommended for tree-shaking)
import * as Constants from '@/constants';
```

## Adding New Constants

1. **Create a new file** in the constants directory (e.g., `ui.ts`, `validation.ts`)
2. **Define constants** using `as const` for type safety
3. **Export from index.ts** to make them available
4. **Document the constants** with JSDoc comments

### Example

```typescript
// constants/ui.ts
export const UI_CONSTANTS = {
  /** Default border radius for components */
  BORDER_RADIUS: 8,
  /** Standard spacing values */
  SPACING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24
  }
} as const;

// constants/index.ts
export * from './ui';
```

## Constants Categories

### Animation Constants (`animations.ts`)
- SVG line animation settings
- Bubbling animation parameters
- Z-index layering system
- Performance thresholds

### Future Categories
- **UI Constants**: Colors, spacing, typography
- **Validation Constants**: Form validation rules
- **API Constants**: Request timeouts, retry limits
- **Feature Flags**: Feature toggle constants

## Best Practices

1. **Use descriptive names**: `MAX_RETRY_ATTEMPTS` instead of `MAX_RETRY`
2. **Group related constants**: Use objects to organize related values
3. **Add JSDoc comments**: Document the purpose of each constant
4. **Use `as const`**: Ensure type safety and prevent accidental mutations
5. **Keep constants focused**: Each file should have a clear, single responsibility
6. **Version constants**: Consider versioning for breaking changes

## Type Safety

All constants use `as const` to ensure:
- **Immutability**: Constants cannot be modified
- **Type inference**: TypeScript infers exact types
- **IntelliSense**: Better IDE support and autocomplete

```typescript
// Good: Type-safe constant
export const COLORS = {
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d'
} as const;

// Bad: Mutable object
export const COLORS = {
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d'
};
``` 