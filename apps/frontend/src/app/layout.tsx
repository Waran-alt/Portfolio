// Import Next.js metadata type
import type { Metadata } from 'next';
// Import global CSS for the entire app
import { DEFAULT_LOCALE } from 'i18n';
import React from 'react';
import './global.css';

// Define metadata for the site (title and description)
export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Developer portfolio built with Next.js 15',
};

// Define props type for RootLayout
interface RootLayoutProps {
  children: React.ReactNode; // Accept any valid React children
}

const rootSurfaceStyle: React.CSSProperties = {
  backgroundColor: '#020617',
  minHeight: '100%',
};

const rootBodyStyle: React.CSSProperties = {
  backgroundColor: '#020617',
  colorScheme: 'dark',
  margin: 0,
  padding: 0,
  minHeight: '100dvh',
};

// Export the root layout component
// Use this as the main layout for all pages
export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  // Render the HTML structure for the app
  // Set language to default (will be updated by locale-specific layouts)
  // Render all children inside the <body>
  // Inline surface colors: first-paint / dev HMR can briefly reorder CSS vs Tailwind; keeps shell dark before `global.css` applies.
  return (
    <html lang={DEFAULT_LOCALE} style={rootSurfaceStyle}>
      <body style={rootBodyStyle}>
        {children}
      </body>
    </html>
  );
} 