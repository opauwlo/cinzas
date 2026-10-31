// Gera dist-artifact/index.html: jogo inteiro (JS, CSS, fontes e ícones) em um único arquivo para abrir no celular.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('../', import.meta.url).pathname, saida = join(raiz, 'dist-artifact');
mkdirSync(saida, { recursive: true });
const r = await build({
  entryPoints: [join(raiz, 'tools/entrada.tsx')], bundle: true, minify: true, format: 'iife', write: false, outdir: saida, platform: 'browser', target: 'es2020',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.woff2': 'dataurl', '.woff': 'dataurl' }, logLevel: 'warning', legalComments: 'none',
});
const js = r.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(raiz, 'app/globals.css'), 'utf8');
const fonte = (pkg, peso) => { const f = join(raiz, `node_modules/@fontsource/${pkg}/files/${pkg}-latin-${peso}-normal.woff2`); return readFileSync(f).toString('base64'); };
const fontes = [['silkscreen', 400, 'Silkscreen'], ['silkscreen', 700, 'Silkscreen'], ['vt323', 400, 'VT323']].map(([p, w, n]) => `@font-face{font-family:'${n}';font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fonte(p, w)}) format('woff2')}`).join('\n');
const icones = {};
const varre = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) varre(p); else if (n.endsWith('.svg')) icones[p.slice(join(raiz, 'public/icons/').length).replace(/\.svg$/, '')] = 'data:image/svg+xml;base64,' + readFileSync(p).toString('base64'); } };
varre(join(raiz, 'public/icons'));
const ajustes = `html,body,#root{height:100%}.jogo{height:100%}:root{color-scheme:dark}body{background:#050506;color:#cfc7ae}.tela{padding-top:max(16px,env(safe-area-inset-top,0px));padding-bottom:max(16px,env(safe-area-inset-bottom,0px))}`;
const miolo = `<title>CINZAS Survival</title><style>${fontes}\n${css}\n${ajustes}</style><div id="root"></div><script>window.__ICONES__=${JSON.stringify(icones)};</script><script>${js}</script>`;
writeFileSync(join(saida, 'artifact.html'), miolo);
writeFileSync(join(saida, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" href="data:,"></head><body>${miolo}</body></html>`);
console.log(`ok: ${(miolo.length / 1024).toFixed(0)} KB, ${Object.keys(icones).length} ícones`);
