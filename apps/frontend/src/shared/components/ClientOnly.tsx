/**
 * Client-Only Component Wrapper
 * 
 * This component prevents hydration mismatches by ensuring that its children
 * only render on the client side. Use this for components that need
 * browser-specific APIs like window, document, or requestAnimationFrame.
 * 
 * Benefits:
 * - Prevents hydration errors
 * - Safe client-side rendering
 * - Fallback content support
 * - Smooth loading transitions
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Props for the ClientOnly component
 */
interface ClientOnlyProps {
  /** React children to render on client side */
  children: React.ReactNode;
  /** Fallback content to show during server-side rendering */
  fallback?: React.ReactNode;
}

/**
 * Client-only wrapper component for preventing hydration mismatches
 * 
 * This component ensures that its children only render after the component
 * has mounted on the client side. This prevents hydration errors that can
 * occur when server-rendered content doesn't match client-rendered content.
 * 
 * Common use cases:
 * - Components using browser APIs (window, document, localStorage)
 * - Components with dynamic content (Math.random(), Date.now())
 * - Components using requestAnimationFrame or other timing APIs
 * - Components that depend on viewport dimensions
 * 
 * @param children - Content to render on client side
 * @param fallback - Optional content to show during SSR
 * 
 * @example
 * ```typescript
 * <ClientOnly fallback={<div>Loading...</div>}>
 *   <ComponentWithBrowserAPI />
 * </ClientOnly>
 * ```
 * 
 * @example
 * ```typescript
 * <ClientOnly>
 *   <PerformanceMonitor />
 * </ClientOnly>
 * ```
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // Track whether the component has mounted on the client
  const [hasMounted, setHasMounted] = useState(false);

  // Set mounted state after component mounts on client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Show fallback during SSR, children after client mount
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 