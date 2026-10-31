import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Manifesto do PWA: instalável no Android (Chrome → "Instalar app"), tela cheia, retrato, tema escuro.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CINZAS — sobrevivência pós-nuclear',
    short_name: 'CINZAS',
    description: 'Survival pós-apocalíptico em pixel art isométrico. Base, viagens de jipe, saque, clima e criaturas.',
    lang: 'pt-BR',
    id: `${base}/`,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'portrait',
    background_color: '#0b0a0c',
    theme_color: '#0b0a0c',
    categories: ['games'],
    icons: [
      { src: `${base}/pwa/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/pwa/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}/pwa/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
