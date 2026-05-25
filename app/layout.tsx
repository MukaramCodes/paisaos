import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaisaOS – Personal Finance for Pakistan',
  description:
    'Stop managing money unconsciously. PaisaOS brings your income, spending, goals, investments, and net worth together in one intelligent dashboard.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PaisaOS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1B4332" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PaisaOS" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
