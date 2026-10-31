import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync(new URL('../conceitos.json', import.meta.url), 'utf8'));
console.log(`Conceitos NOVOS: ${c.novos.length}  |  Adaptados de prontos: ${c.adaptados.length}`);
for (const n of c.novos) console.log(`  #${n.id} ${n.nome}`);
