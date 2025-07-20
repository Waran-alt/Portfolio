# Frontend (Next.js)

This is the Next.js 15 frontend for the portfolio project, featuring modern animations, responsive design, and a comprehensive development environment.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0
- Yarn 4.9.2+
- Docker & Docker Compose (for full-stack development)

### Development Setup

```bash
# Install dependencies
yarn install

# Start development server (standalone)
yarn dev

# Or start with full stack (recommended)
cd .. && make dev
```

### Build & Production

```bash
# Build for production
yarn build

# Start production server
yarn start

# Lint and type check
yarn lint
yarn type-check

# Or use make commands from project root
cd .. && make build
cd .. && make lint
cd .. && make type-check
```

## 🏗️ Architecture Overview

### Project Structure
```
apps/frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── features/             # Feature-based organization
│   │   ├── animations/       # Animation components & hooks
│   │   ├── dev-info/         # Development tools & debugging
│   │   └── performance/      # Performance monitoring
│   ├── shared/               # Shared utilities & components
│   │   ├── components/       # Reusable UI components
│   │   ├── config/           # Configuration & constants
│   │   ├── contexts/         # React contexts
│   │   └── utils/            # Utility functions
│   └── styles/               # Global styles & Tailwind
├── public/                   # Static assets
└── package.json              # Dependencies & scripts
```

### Key Technologies
- **Framework**: Next.js 15.3.5 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.1.11
- **Animations**: Framer Motion + Canvas API
- **State Management**: React hooks + Context API
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 🔧 Environment Configuration

### Environment Variables

The frontend uses environment variables for dynamic configuration. The project follows a structured approach to environment management:

- **Environment Templates**: See `documentation/env-templates/env.frontend.example` for all available variables
- **Type Definitions**: Environment variable types are defined in `src/shared/config/environment.ts`
- **Configuration Context**: Environment values are provided through `src/shared/contexts/ConfigContext.tsx`
- **Documentation**: Complete setup guide in `documentation/ENVIRONMENT_SETUP.md`

## 🌐 Global Styles

Global styles for the frontend are defined in `src/app/global.css`. This file is imported in the root layout (`src/app/layout.tsx`) and applies styles to the entire application.

## 🛠️ Development Guidelines

### Code Organization
- **Feature-Based Structure**: Create directories in `src/features/` for each major feature (e.g., `animations/`, `dev-info/`, `performance/`)
- **Shared Resources**: Place reusable components, utilities, and types in `src/shared/` with clear subdirectories
- **Type Safety**: Use strict TypeScript with proper interfaces and type guards
- **Component Structure**: One component per file with named exports, comprehensive JSDoc comments

### Best Practices
- **Client-Side Rendering**: Wrap browser-only code (Canvas API, `Math.random()`, `performance.now()`, ...) in `ClientOnly` component to prevent hydration errors
- **Performance Monitoring**: Use the built-in performance monitor and adjust animation parameters based on device capabilities
- **Environment Configuration**: Always use the typed `useConfig()` hook instead of direct `process.env` access
- **Error Boundaries**: Implement graceful fallbacks for missing features and handle animation failures
- **Component Comments**: Add detailed comments explaining purpose, props, and usage examples
- **Debug Class Naming**: Add component name as the first class for easy browser debugging

### Debug Class Naming Convention

To facilitate debugging in the browser, all components should include their component name as the first CSS class. This makes it easy to identify components in browser DevTools and provides better error tracking.

#### Rules:
1. **Component Name First**: Always add the component name as the first class
2. **Descriptive Sub-classes**: Use descriptive class names for nested elements
3. **Hierarchical Structure**: Follow parent-child relationships in class naming
4. **Consistent Format**: Use PascalCase for component names, kebab-case for modifiers

#### Examples:

```tsx
// ✅ Good - Component name as first class
<div className="OverlayMenu fixed top-4 right-4 z-[99999]">
  <button className="OverlayMenu-toggle bg-white/10">
    <span className="OverlayMenu-toggle-text">Settings</span>
  </button>
  <div className="OverlayMenu-panel absolute top-12 right-0">
    <div className="OverlayMenu-header flex items-center justify-between">
      <h3 className="OverlayMenu-title">Controls</h3>
      <button className="OverlayMenu-close">×</button>
    </div>
  </div>
</div>

// ❌ Bad - No component identification
<div className="fixed top-4 right-4 z-[99999]">
  <button className="bg-white/10">
    <span>Settings</span>
  </button>
</div>
```

#### Benefits:
- **🎯 Easy Identification**: Quickly find components in browser DevTools
- **🔍 Better Debugging**: Clear component hierarchy and relationships
- **📱 Error Tracking**: Better error reporting with component context
- **🎨 CSS Targeting**: Easy to target specific components for styling
- **👥 Team Collaboration**: Clear component boundaries for other developers

#### Class Naming Pattern:
```
ComponentName                   # Main component container
ComponentName-element           # Major child elements
ComponentName-element-modifier  # Element with state/modifier
ComponentName-section           # Content sections
ComponentName-section-element   # Elements within sections
```

This convention is applied throughout the codebase and should be followed when adding new components.

### Adding New Features
1. Create feature directory in `src/features/[feature-name]/` with components, hooks, and utilities
2. Add environment variables to `documentation/env-templates/env.frontend.example` and update types in `src/shared/config/environment.ts`
3. Use the `useConfig()` hook for environment access and add to `src/shared/contexts/ConfigContext.tsx` if needed
4. Add comprehensive JSDoc comments to all new components and functions
5. Update this README and relevant documentation files

## 🔍 Troubleshooting

### Common Issues

**Hydration Errors**
```bash
# Caused by server/client mismatch
# Solution: Wrap browser-only code in ClientOnly component
```

**High CPU Usage**
```bash
# Reduce animation intensity in environment variables
NEXT_PUBLIC_ANIMATION_FRAME_RATE=15
NEXT_PUBLIC_PARTICLE_COUNT=25
```

**Port Conflicts**
```bash
# Change ports in the root .env file (for Docker Compose port mapping)
FRONTEND_PORT=3000
BACKEND_PORT=4000

# Then restart services
make restart
```

**TypeScript Errors**
```bash
# Run type checking
yarn type-check

# Check for missing dependencies
yarn install

# Or use make commands from project root
cd .. && make type-check
cd .. && make install-frontend
```

### Performance Optimization
- Monitor CPU usage in Dev Info panel
- Adjust animation parameters for your device
- Use browser dev tools for profiling
- Consider disabling animations on low-end devices

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Framer Motion API](https://www.framer.com/motion/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Note**: This frontend is intentionally feature-rich for learning purposes. In production, consider removing development tools and optimizing animations based on target devices. 