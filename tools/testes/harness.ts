// Registro e execução dos testes de lógica (Node, sem navegador). Cada lib de área põe os seus num `*.teste.ts`
// dentro da própria pasta (ex.: game/lib/radiacao/radiacao.teste.ts) — tools/testes.mjs acha e roda todos.
import assert from 'node:assert/strict';
export { assert };
const casos: { nome: string; fn: () => void }[] = [];
export const teste = (nome: string, fn: () => void) => { casos.push({ nome, fn }); };
export const entre = (v: number, a: number, b: number, rot: string) => assert.ok(v >= a && v <= b, `${rot}: ${v.toFixed(2)} fora de [${a}, ${b}]`);
export function rodar() {
  let falhas = 0; const t0 = Date.now();
  for (const c of casos) { try { c.fn(); console.log('  ok   ' + c.nome); } catch (e) { falhas++; console.log('  FALHA ' + c.nome + '\n        ' + String((e as Error).message).split('\n')[0]); } }
  console.log(`\n${casos.length - falhas}/${casos.length} testes passaram em ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  process.exitCode = falhas ? 1 : 0;
}
