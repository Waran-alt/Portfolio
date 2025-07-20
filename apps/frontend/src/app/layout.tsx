// Import Next.js metadata type
import type { Metadata } from 'next';
// Import global CSS for the entire app
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

// Export the root layout component
// Use this as the main layout for all pages
export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  // Render the HTML structure for the app
  // Set language to English
  // Render all children inside the <body>
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 