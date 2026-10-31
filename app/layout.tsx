import type { Metadata, Viewport } from 'next';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/vt323/400.css';
import './globals.css';
import RegistrarSW from '../components/RegistrarSW';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'CINZAS',
  description: 'Survival pós-apocalíptico nuclear em pixel art isométrico.',
  applicationName: 'CINZAS',
  appleWebApp: { capable: true, title: 'CINZAS', statusBarStyle: 'black-translucent' },
  icons: { icon: [{ url: `${base}/pwa/icon-192.png`, sizes: '192x192', type: 'image/png' }], apple: [{ url: `${base}/pwa/apple-touch-icon.png`, sizes: '180x180' }] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0a0c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}<RegistrarSW /></body>
    </html>
  );
}
