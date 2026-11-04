// Roda os testes de lógica e de balanço em Node (sem navegador): empacota tools/testes/principal.ts com esbuild e executa.
import { build } from 'esbuild';
import { mkdtempSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'cinzas-testes-')), saida = join(dir, 'principal.mjs');
// os testes das libs de área moram ao lado do código: game/**/*.teste.ts
const raiz = new URL('../', import.meta.url).pathname, achados = readdirSync(join(raiz, 'game'), { recursive: true }).map(String).filter(f => f.endsWith('.teste.ts')).sort();
const entrada = join(dir, 'entrada.ts'), abs = f => JSON.stringify(f.replaceAll('\\', '/'));
writeFileSync(entrada, [abs(new URL('./testes/principal.ts', import.meta.url).pathname), ...achados.map(f => abs(join(raiz, 'game', f)))].map(f => `import ${f};`).join('\n') + `\nimport { rodar } from ${abs(new URL('./testes/harness.ts', import.meta.url).pathname)};\nrodar();\n`);
try {
  await build({ entryPoints: [entrada], bundle: true, platform: 'node', format: 'esm', outfile: saida, logLevel: 'error', define: { 'process.env.NEXT_PUBLIC_BASE_PATH': '""' } });
  await import(pathToFileURL(saida).href);
} finally { setTimeout(() => rmSync(dir, { recursive: true, force: true }), 500); }
