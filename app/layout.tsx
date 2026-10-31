import type { Metadata, Viewport } from 'next';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/metamorphous/400.css';
import '@fontsource/im-fell-english-sc/400.css';
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'CINZAS',
  description: 'Survival pós-apocalíptico nuclear. Visão de cima, vertical, mobile.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0907',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
