import { teste, assert } from '../../tools/testes/harness';
import { Barramento } from './barramento';
import { Nucleo, novoMundo, ventoDir } from './index';
import type { ModuloJogo } from './contratos';

teste('núcleo: barramento entrega por tipo, cancela inscrição e um ouvinte que quebra não derruba os outros', () => {
  const b = new Barramento(), vistos: number[] = []; const erro = console.error; console.error = () => {};
  try {
    b.on('ruido', () => { throw new Error('quebrei'); }); const off = b.on('ruido', e => vistos.push(e.raio)); let todos = 0; b.qualquer(() => todos++);
    b.emit({ t: 'ruido', x: 0, y: 0, raio: 5 }); b.emit({ t: 'minuto', minutos: 1 }); off(); b.emit({ t: 'ruido', x: 0, y: 0, raio: 7 });
    assert.deepEqual(vistos, [5]); assert.equal(todos, 3);
  } finally { console.error = erro; }
});
teste('núcleo: módulos recebem iniciar/tick, salvam por id, e o que quebra é desligado sem parar os outros', () => {
  let ticks = 0; const erro = console.error; console.error = () => {};
  try {
    const bom: ModuloJogo<{ n: number }> = { id: 'bom', tick: () => { ticks++; }, salvar: () => ({ n: ticks }), carregar: s => { ticks = s?.n ?? 0; } };
    const ruim: ModuloJogo = { id: 'ruim', tick: () => { throw new Error('x'); } };
    const n = new Nucleo([ruim, bom]), m = novoMundo(); n.carregar({ bom: { n: 10 }, antigo: { guardado: true } }); n.iniciar(m); n.tick(0.016, m); n.tick(0.016, m);
    assert.equal(ticks, 12); const s = n.salvar(); assert.deepEqual(s.bom, { n: 12 }); assert.deepEqual(s.antigo, { guardado: true }, 'estado de módulo que saiu do jogo não se perde');
  } finally { console.error = erro; }
});
teste('núcleo: direção do vento é determinística pela seed e muda devagar', () => {
  assert.equal(ventoDir('2026-11-04', 600), ventoDir('2026-11-04', 600)); assert.notEqual(ventoDir('a', 0), ventoDir('b', 0));
  assert.ok(Math.abs(ventoDir('s', 600) - ventoDir('s', 601)) < 0.01, 'em 1 minuto de jogo o vento quase não vira');
});
