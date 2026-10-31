// Progressão: XP, níveis, habilidades, estatísticas da vida, conquistas, contratos e melhorias do abrigo.
// registrar() é o ponto único por onde o jogo avisa que algo aconteceu (abate, saque, viagem…).
import type { Cena } from '../cena';
import { useJogo, lerMeta, gravarMeta } from '../store';
import { CONQUISTAS, PERKS, MELHORIAS } from '../dados/meta';
import { ITENS } from '../dados/itens';
import { sfx } from '../audio';
import { Rng } from '../lib/rng';
import { avancarContratos, garantirContratos, progresso, pronto, temParaEntregar, type CtxEvento } from './contratos';
import type { Run } from './salvar';
import { sincGrade } from './grade';

export const pk = (s: { perks?: string[] }, id: string) => !!s.perks?.includes(id);
export const xpNivel = (n: number) => 50 + 40 * (n - 1);
export const DIF_NOMES = ['Calmo', 'Normal', 'Brutal'] as const;
/** multiplicadores por dificuldade: dano recebido, fome/sede, XP, população dinâmica, tamanho das invasões */
export const DIF = { dano: [0.75, 1, 1.3], fome: [0.8, 1, 1.2], xp: [0.9, 1, 1.25], spawn: [0.7, 1, 1.4], raid: [0.8, 1, 1.35], chanceRaid: [0.35, 0.5, 0.7] } as const;
export const dif = (s: Run) => s.dif ?? 1;
export const melNivel = (s: Run, id: string) => s.mel?.[id] ?? 0;
const toast = (t: string, cor?: string) => useJogo.getState().toast(t, cor);

// ---------------------------------------------------------------- XP e níveis
export function ganharXp(c: Cena, n: number, mostrar = true) {
  const s = c.s; n = Math.round(n * DIF.xp[dif(s)]); if (n <= 0) return; s.xp = (s.xp ?? 0) + n; s.nivel ??= 1;
  if (mostrar && n >= 5) c.texto(c.jog.x, c.jog.y - 1.1, `+${n} XP`, '#8fe36a');
  while (s.xp >= xpNivel(s.nivel)) {
    s.xp -= xpNivel(s.nivel); s.nivel++; s.pontos = (s.pontos ?? 0) + 1; sfx.nivel(); c.cameras.main.flash(260, 143, 227, 106);
    toast(`NÍVEL ${s.nivel}! Escolha uma habilidade`, '#8fe36a'); c.s.st!.niveis = s.nivel;
  }
  useJogo.setState({ xp: s.xp, nivel: s.nivel, pontos: s.pontos }); checarConquistas(c);
}

// ---------------------------------------------------------------- habilidades
export function opcoesPerk(s: { seed: string; nivel?: number; perks?: string[] }): string[] {
  const livres = PERKS.filter(p => !pk(s, p.id)).map(p => p.id); if (livres.length <= 3) return livres;
  return new Rng(`${s.seed}|perk|${s.nivel}|${s.perks?.length ?? 0}`).embaralhar(livres).slice(0, 3);
}
export function escolherPerk(c: Cena, id: string) {
  const s = c.s; if ((s.pontos ?? 0) <= 0 || pk(s, id) || !PERKS.some(p => p.id === id)) return;
  s.perks = [...(s.perks ?? []), id]; s.pontos!--; sfx.nivel(); toast('Habilidade: ' + PERKS.find(p => p.id === id)!.nome, '#8fe36a');
  useJogo.setState({ perks: [...s.perks], pontos: s.pontos!, painel: s.pontos! > 0 ? 'perk' : null }); registrar(c, 'perks');
}
/** sem inimigo vivo e hostil por perto? */
const seguro = (c: Cena) => !c.ents.some(e => e.vivo && e.arq.hostil && Math.hypot(e.x - c.jog.x, e.y - c.jog.y) < 16);
/** abre sozinho a escolha de habilidade num momento calmo (uma vez por nível) */
export function tickProgresso(c: Cena) {
  const s = c.s, st = useJogo.getState(); garantirContratos(c);
  if ((s.pontos ?? 0) > 0 && st.painel === null && !c.acao && !c.morto && !c.trava && !c.evPend && seguro(c) && (c.perkAvisado ?? 0) < (s.nivel ?? 1)) { c.perkAvisado = s.nivel ?? 1; sfx.ui('abrir'); useJogo.setState({ painel: 'perk' }); }
}

// ---------------------------------------------------------------- estatísticas e conquistas
export function valorStat(s: Run, k: string): number {
  switch (k) {
    case 'abates': return s.abates; case 'saques': return s.vasculhados; case 'noites': return s.noites; case 'locais': return s.descobertos.length;
    case 'nivel': return s.nivel ?? 1; case 'radmax': return s.hp > 0 ? Math.round(s.radMax) : 0; default: return s.st?.[k] ?? 0;
  }
}
let checando = false;
export function checarConquistas(c: Cena) {
  if (checando) return; checando = true;
  try {
    const m = lerMeta(), novas: string[] = [];
    for (const q of CONQUISTAS) if (!m.conquistas.includes(q.id) && valorStat(c.s, q.stat) >= q.alvo) { m.conquistas.push(q.id); novas.push(q.id); }
    if (novas.length) {
      m.melhorNivel = Math.max(m.melhorNivel ?? 1, c.s.nivel ?? 1); gravarMeta(m); useJogo.setState({ conquistas: [...m.conquistas] });
      c.s.st!.novas = (c.s.st!.novas ?? 0) + novas.length; c.novasConquistas = [...(c.novasConquistas ?? []), ...novas];
      for (const id of novas) { toast('★ Conquista: ' + CONQUISTAS.find(q => q.id === id)!.nome, '#e0b83a'); }
      sfx.conquista(); for (let i = 0; i < novas.length; i++) ganharXp(c, 20, false);
    }
  } finally { checando = false; }
}
/** o jogo avisa que algo aconteceu: soma estatística, avança contratos, confere conquistas */
export function registrar(c: Cena, k: string, n = 1, ctx: CtxEvento = {}) {
  const st = (c.s.st ??= {}); st[k] = (st[k] ?? 0) + n; avancarContratos(c, k, n, ctx); checarConquistas(c);
}

// ---------------------------------------------------------------- contratos: entregar e receber a recompensa (só no abrigo)
export function receberContrato(c: Cena, id: number) {
  const s = c.s, ct = s.contratos?.find(x => x.id === id); if (!ct || !pronto(ct)) return;
  if (c.zona.id !== 'base') { toast('Volte ao abrigo para receber o pagamento.', '#d9a02b'); sfx.ui('erro'); return; }
  const st = useJogo.getState(), inv = { ...st.inv }, bau = { ...st.bau };
  if (ct.tipo === 'trazer') { let falta = ct.qtd; const id2 = ct.alvo!; const dele = Math.min(falta, inv[id2] ?? 0); inv[id2] = (inv[id2] ?? 0) - dele; falta -= dele; if (falta > 0) bau[id2] = (bau[id2] ?? 0) - falta; if (!inv[id2]) delete inv[id2]; if (!bau[id2]) delete bau[id2]; }
  for (const [item, q] of ct.premio) {
    const it = ITENS[item]; if (!it) continue;
    if (it.tipo === 'municao') { s.balas[it.municaoTipo!] = (s.balas[it.municaoTipo!] ?? 0) + it.balas! * q; continue; }
    if (item === 'combustivel') { s.combustivel += q; continue; }
    bau[item] = (bau[item] ?? 0) + q; // o pagamento vai para o baú do abrigo (a mochila pode estar cheia)
  }
  s.contratos = s.contratos!.filter(x => x.id !== id); s.inv = inv; s.bau = bau; useJogo.setState({ inv, bau, contratos: [...s.contratos], combustivel: s.combustivel, balas: { ...s.balas } }); sincGrade();
  sfx.raro(); toast('Contrato pago: ' + ct.premio.map(([i, q]) => `${q}× ${ITENS[i]?.nome ?? i}`).join(', '), '#8fe36a'); ganharXp(c, ct.xp); registrar(c, 'contratos'); garantirContratos(c);
}

/** chamado quando o caixote de suprimentos é aberto */
export function airdropColetado(c: Cena) {
  if (c.ze.airdrop) c.ze.airdrop.coletado = true; c.airdrop = null; toast('Suprimentos recolhidos!', '#8fe36a'); ganharXp(c, 40); registrar(c, 'airdrops');
}

// ---------------------------------------------------------------- melhorias do abrigo
export const custoMelhoria = (id: string, nivel: number) => MELHORIAS.find(m => m.id === id)?.niveis[nivel]?.custo ?? null;
export const podeMelhorar = (id: string, nivel: number) => { const cs = custoMelhoria(id, nivel); return !!cs && cs.every(([i, q]) => temParaEntregar(i) >= q); };
export function melhorar(c: Cena, id: string) {
  const s = c.s, nv = melNivel(s, id), cs = custoMelhoria(id, nv); if (!cs) return;
  if (c.zona.id !== 'base') { toast('Só dá para melhorar dentro do abrigo.', '#d9a02b'); sfx.ui('erro'); return; }
  if (!podeMelhorar(id, nv)) { toast('Faltam materiais.', '#d9a02b'); sfx.ui('erro'); return; }
  const st = useJogo.getState(), inv = { ...st.inv }, bau = { ...st.bau };
  for (const [i, q] of cs) { let falta = q; const d = Math.min(falta, inv[i] ?? 0); inv[i] = (inv[i] ?? 0) - d; falta -= d; if (falta > 0) bau[i] = (bau[i] ?? 0) - falta; if (!inv[i]) delete inv[i]; if (!bau[i]) delete bau[i]; }
  s.mel = { ...(s.mel ?? {}), [id]: nv + 1 }; s.inv = inv; s.bau = bau; useJogo.setState({ inv, bau, mel: { ...s.mel } }); sincGrade(); sfx.raro(); c.cameras.main.shake(180, 0.004);
  toast(`${MELHORIAS.find(m => m.id === id)!.nome}: nível ${nv + 1}`, '#8fe36a'); ganharXp(c, 35); registrar(c, 'melhorias');
}
export { progresso, pronto, temParaEntregar };
