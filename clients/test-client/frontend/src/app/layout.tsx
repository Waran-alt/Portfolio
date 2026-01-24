import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Client',
  description: 'Simple test client for development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
