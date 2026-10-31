// Inclui os chunks preguiçosos: offline antes da primeira partida.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const raiz = new URL('../out/', import.meta.url).pathname;
async function arquivos(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '404') out.push(...await arquivos(p)); }
    else if (/\.(html|js|css|woff2?|ttf|png|svg|webmanifest)$/.test(e.name) && !['sw.js', 'offline-assets.js', '404.html'].includes(e.name)) out.push(p);
  }
  return out.sort();
}
const lista = await arquivos(raiz), hash = createHash('sha256');
let bytes = 0;
for (const p of lista) { const b = await readFile(p); hash.update(relative(raiz, p)).update(b); bytes += b.length; }
hash.update(await readFile(join(raiz, 'sw.js')));
const urls = lista.map(p => relative(raiz, p).replace(/(^|\/)index\.html$/, '$1'));
await writeFile(join(raiz, 'offline-assets.js'), `self.__CINZAS_VERSION=${JSON.stringify(hash.digest('hex').slice(0, 16))};\nself.__CINZAS_ASSETS=${JSON.stringify(urls)};\n`);
console.log(`Offline: ${urls.length} arquivos, ${(bytes / 1048576).toFixed(1)} MiB; manifesto gerado.`);
