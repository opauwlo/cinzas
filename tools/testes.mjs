// Roda os testes de lógica e de balanço em Node (sem navegador): empacota tools/testes/principal.ts com esbuild e executa.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'cinzas-testes-')), saida = join(dir, 'principal.mjs');
try {
  await build({ entryPoints: [new URL('./testes/principal.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', outfile: saida, logLevel: 'error', define: { 'process.env.NEXT_PUBLIC_BASE_PATH': '""' } });
  await import(pathToFileURL(saida).href);
} finally { setTimeout(() => rmSync(dir, { recursive: true, force: true }), 500); }
