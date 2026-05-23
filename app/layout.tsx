import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaisaOS – Personal Finance for Pakistan',
  description:
    'Stop managing money unconsciously. PaisaOS brings your income, spending, goals, investments, and net worth together in one intelligent dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
