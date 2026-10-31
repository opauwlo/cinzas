// Exportação estática. Em hospedagem com subcaminho (GitHub Pages: /cinzas) defina NEXT_PUBLIC_BASE_PATH=/cinzas na build.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: base,
  assetPrefix: base || undefined,
};
