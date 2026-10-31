// Gera os ícones do PWA (192, 512, maskable e apple-touch) a partir de app/icon.svg (trevo de radiação, game-icons.net, CC BY 3.0).
// Uso: node tools/icones.mjs   → escreve em public/pwa/
import { readFile, mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const svg = (await readFile(new URL('../app/icon.svg', import.meta.url), 'utf8')).replace(/<path d="M0 0h512v512H0z"\/>/, '').replace('<path fill="#fff"', '<path fill="#b6ff5a"');
const saida = new URL('../public/pwa/', import.meta.url).pathname; await mkdir(saida, { recursive: true });
const nav = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const pg = await nav.newPage();
// pad = fração de folga em volta do símbolo (maskable precisa de zona segura de ~20%)
async function gerar(nome, tam, pad) {
  await pg.setViewport({ width: tam, height: tam, deviceScaleFactor: 1 });
  const fundo = 'radial-gradient(circle at 50% 38%, #1d2a16 0%, #0b0a0c 70%)';
  await pg.setContent(`<body style="margin:0;background:${fundo};width:${tam}px;height:${tam}px;display:grid;place-items:center"><div style="width:${tam * (1 - pad * 2)}px;height:${tam * (1 - pad * 2)}px;filter:drop-shadow(0 0 ${tam * 0.03}px #6ca83e)">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`);
  await pg.screenshot({ path: saida + nome, omitBackground: false });
  console.log('gerado', nome, tam);
}
await gerar('icon-192.png', 192, 0.1); await gerar('icon-512.png', 512, 0.1); await gerar('icon-maskable-512.png', 512, 0.22); await gerar('apple-touch-icon.png', 180, 0.1);
await nav.close();
