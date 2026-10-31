'use client';
import { useEffect, useRef } from 'react';
import { Fabrica } from '../../game/lib/fabrica';
import { Rng } from '../../game/lib/rng';
import { gerarHumano } from '../../game/lib/humano';
import { gerarQuad, gerarInseto, gerarAve } from '../../game/lib/fauna';
import { construirEstatico, type RecEstatica } from '../../game/lib/estatico';
import { gerarFlora } from '../../game/lib/flora';
import { PROP_DIM } from '../../game/lib/props';

// Prévia da biblioteca procedural. ?g=humanos|animais|clipes|colosso
export default function Arte() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const grupo = new URLSearchParams(location.search).get('g') ?? 'todos';
    const fab = new Fabrica(() => undefined), c = ref.current!, g = c.getContext('2d')!; g.imageSmoothingEnabled = false; g.fillStyle = '#34372f'; g.fillRect(0, 0, c.width, c.height);
    const rng = new Rng('arte'); const t0 = performance.now(); let cx = 6, cy = 4, alt = 0;
    const desenha = (tipo: string, r: object, clip: string, dir: number, i: number, esc: number) => { fab.pedir(tipo, r, clip, dir, i, 0); fab.processar(1e9); const q = fab.pedir(tipo, r, clip, dir, i)!; const w = q.w * esc, h = q.h * esc; if (cx + w > c.width - 4) { cx = 6; cy += alt + 6; alt = 0; } g.drawImage(q.canvas, cx, cy, w, h); cx += w + 6; alt = Math.max(alt, h); };
    const sobr = gerarHumano(rng, 'sobrevivente');
    if (grupo === 'todos' || grupo === 'humanos') {
      for (const a of ['', 'pe_de_cabra', 'taco', 'facao', 'machado', 'pistola', 'escopeta', 'rifle']) desenha('humano', { ...sobr, arma: a }, 'parado', 2, 0, 3);
      cx = 6; cy += alt + 6; alt = 0;
      for (let i = 0; i < 8; i++) desenha('humano', gerarHumano(rng, 'irradiado'), 'cambalear', 2, 1, 3);
      cx = 6; cy += alt + 6; alt = 0;
      for (let i = 0; i < 8; i++) desenha('humano', gerarHumano(rng, 'saqueador'), 'parado', 2, 0, 3);
      cx = 6; cy += alt + 6; alt = 0;
      for (const a of ['filho', 'filho', 'miliciano', 'rastejador', 'irradiado'] as const) desenha('humano', gerarHumano(rng, a), a === 'rastejador' ? 'rastejar' : 'parado', 2, 0, 3);
    }
    if (grupo === 'clipes') {
      for (const clip of ['andar', 'golpear', 'atirar', 'morrer']) { const n = clip === 'andar' ? 4 : clip === 'golpear' ? 3 : clip === 'atirar' ? 2 : 5; for (let i = 0; i < n; i++) desenha('humano', { ...sobr, arma: clip === 'atirar' ? 'pistola' : 'machado' }, clip, 1, i, 3); cx = 6; cy += alt + 6; alt = 0; }
    }
    if (grupo === 'colosso') { const col = gerarHumano(rng, 'colosso'); for (const [clip, n] of [['pesado', 4], ['pancada', 3]] as const) { for (let i = 0; i < n; i++) desenha('humano', col, clip, 1, i, 2); cx = 6; cy += alt + 6; alt = 0; } }
    if (grupo === 'todos' || grupo === 'animais') {
      cx = 6; cy += alt + 6; alt = 0;
      for (const e of ['cao', 'cao', 'lobo', 'javali', 'cervo', 'coelho', 'rato'] as const) desenha('quad', gerarQuad(rng, e), 'andar', 1, 1, 3);
      cx = 6; cy += alt + 6; alt = 0; for (const clip of ['morder', 'morrer']) { for (let i = 0; i < (clip === 'morder' ? 3 : 4); i++) desenha('quad', gerarQuad(new Rng('d'), 'cao'), clip, 0, i, 3); }
      cx = 6; cy += alt + 6; alt = 0; for (const e of ['barata', 'escorpiao', 'aranha'] as const) { const r = gerarInseto(rng, e); desenha('inseto', r, 'andar', 1, 1, 4); desenha('inseto', r, 'atacar', 1, 1, 4); desenha('inseto', r, 'morrer', 1, 1, 4); }
      cx = 6; cy += alt + 6; alt = 0; const av = gerarAve(rng); desenha('ave', av, 'voar', 1, 1, 4); desenha('ave', av, 'voar', 0, 3, 4); desenha('ave', av, 'pousado', 1, 0, 4); desenha('ave', av, 'morrer', 1, 0, 4);
    }
    const est = (rec: RecEstatica, esc = 2) => { const q = fab.estatico(JSON.stringify(rec), () => construirEstatico(rec).v, (({ R, mcx, mcy, yaw }) => ({ R, mcx, mcy, yaw }))(construirEstatico(rec))); const w = q.w * esc, h = q.h * esc; if (cx + w > c.width - 4) { cx = 6; cy += alt + 6; alt = 0; } g.drawImage(q.canvas, cx, cy, w, h); cx += w + 6; alt = Math.max(alt, h); };
    if (grupo === 'flora') {
      for (const v of ['morta', 'queimada', 'doente', 'salgueiro', 'pinheiro', 'palmeira', 'morta', 'doente']) est(gerarFlora(rng, 'arvore', v), 2);
      cx = 6; cy += alt + 6; alt = 0;
      for (const f of ['arbusto', 'arbusto', 'capim', 'capim', 'cacto', 'cogumelo', 'cogumelo', 'tronco', 'toco', 'pedra', 'pedra', 'ossos', 'flor', 'junco'] as const) est(gerarFlora(rng, f, f === 'arbusto' && rng.chance(0.5) ? 'seco' : ''), 3);
    }
    if (grupo === 'props') {
      const nomes = ['geladeira', 'armario', 'caixa', 'ferramentas', 'barril', 'tambor_toxico', 'cama', 'mesa', 'cadeira', 'sofa', 'estante', 'prateleira', 'fogao', 'pia', 'vaso', 'tv', 'guarda_roupa', 'mala', 'lixeira', 'balcao', 'bancada', 'pneus', 'poste', 'placa', 'cerca', 'hidrante', 'banco', 'carrinho', 'caixote_militar', 'saco_areia', 'barricada', 'bomba', 'entulho', 'bau', 'fogueira', 'saco_dormir', 'bandeira', 'totem', 'tanque_agua', 'gerador', 'antena', 'horta', 'lixo'];
      for (const n of nomes) est({ tipo: 'prop', n, v: 1, d: 0.2, o: 0, sem: 7 }, 2);
      cx = 6; cy += alt + 6; alt = 0;
      for (const n of ['carro', 'carro', 'carro', 'carro', 'carro', 'caminhao', 'container', 'barraca', 'tanque', 'helicoptero']) est({ tipo: 'prop', n, v: n === 'carro' ? [0, 1, 2, 3, 4][cy % 5 + (cx % 5)] ?? 0 : 1, d: 0.3, o: 0, sem: cx }, 1.5);
      void PROP_DIM;
    }
    document.title = `arte ${Math.round(performance.now() - t0)}ms ${fab.total}q`;
  }, []);
  return <canvas ref={ref} width={1000} height={1100} style={{ imageRendering: 'pixelated', width: '100%' }} />;
}
