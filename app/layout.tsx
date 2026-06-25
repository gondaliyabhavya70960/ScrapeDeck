import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import '@fontsource-variable/inter';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScrapeDeck — Resin & 3D-Print Price Monitor',
  description:
    'A competitive price-monitoring dashboard for Indian resin-art and 3D-print stores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistMono.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
