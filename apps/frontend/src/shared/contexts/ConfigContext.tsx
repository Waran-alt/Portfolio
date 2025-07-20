/**
 * Configuration Context System
 * 
 * This module provides React context for sharing environment configuration
 * throughout the application. It ensures that all components have access
 * to the same configuration data and provides type safety for configuration
 * access.
 * 
 * Benefits:
 * - Centralized configuration access
 * - Type-safe configuration consumption
 * - Dependency injection pattern
 * - Easy testing with mock configurations
 */

'use client';

import { env, type AppEnv } from '@/shared/config/app-config';
import { createContext, ReactNode, useContext } from 'react';

/**
 * React context for environment configuration
 * 
 * This context holds the environment configuration and makes it available
 * to all child components. It's initialized with the current environment
 * configuration when the provider is mounted.
 */
const ConfigContext = createContext<AppEnv | null>(null);

/**
 * Props for the ConfigProvider component
 */
interface ConfigProviderProps {
  /** React children that will have access to the configuration */
  children: ReactNode;
}

/**
 * Provider component that makes environment configuration available
 * to all child components through React context.
 * 
 * This component should be placed high in the component tree, typically
 * at the root level of the application, to ensure all components can
 * access the configuration.
 * 
 * @param children - React children that will receive configuration access
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <ConfigProvider>
 *       <HomePage />
 *     </ConfigProvider>
 *   );
 * }
 * ```
 */
export function ConfigProvider({ children }: ConfigProviderProps) {
  // Use the centralized environment configuration
  return (
    <ConfigContext.Provider value={env}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook for accessing environment configuration
 * 
 * This hook provides type-safe access to the environment configuration
 * from any component within the ConfigProvider tree. It throws an error
 * if used outside of a ConfigProvider.
 * 
 * @returns AppEnv object with all configuration values
 * @throws Error if used outside of ConfigProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const config = useConfig();
 *   return <div>Environment: {config.environment}</div>;
 * }
 * ```
 */
export function useConfig(): AppEnv {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
} 