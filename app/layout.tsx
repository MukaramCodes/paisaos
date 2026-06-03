import type { Metadata, Viewport } from 'next';
import './globals.css';
import UpdateBanner from '@/components/UpdateBanner';
import AuthProvider from '@/components/AuthProvider';

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

// Proper Next.js 14 way to set viewport — raw <meta> tags in <head> are ignored by the framework
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Capture install prompt before React mounts — the event fires very early */}
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});` }} />
        <meta name="theme-color" content="#1B4332" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PaisaOS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-cream text-ink antialiased">
        <AuthProvider>
          {children}
          <UpdateBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
