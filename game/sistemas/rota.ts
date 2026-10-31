// Física da viagem de jipe (pura, sem DOM): o jipe acelera, cruza a estrada, freia diante da barricada do evento (se houver) e chega.
// A tela de viagem (components/Viagem.tsx) chama `passoRota` a cada quadro e reage ao aviso; a cena desenhada (game/lib/viagem.ts) só lê o estado.
export type Rota = { dur: number; evento: boolean };
export type FaseRota = 'indo' | 'evento' | 'retomando' | 'chegando';
export type EstRota = { p: number; vel: number; dist: number; freio: boolean; tratado: boolean; fim: boolean };
export type Aviso = 'meio' | 'fim' | null;
/** ponto da rota (0..1) onde a barricada do evento bloqueia a estrada e o jipe para */
export const P_PARADA = 0.5;
export const K_ACEL = 1.5, K_FREIO = 2.8, VEL_CHEGADA = 0.35, P_CHEGADA = 0.92;
/** distância nominal da estrada em px de arte: ≈ 60 px por segundo a toda a velocidade */
export const distTotal = (dur: number) => 60 * dur;
export const novaRota = (): EstRota => ({ p: 0, vel: 0, dist: 0, freio: false, tratado: false, fim: false });
/**
 * Avança `dt` segundos. Devolve 'meio' quando o jipe acabou de parar diante do evento e 'fim' quando chegou ao fim da rota (cada um uma só vez).
 * Funciona com qualquer `dt` (inclusive passos grandes, como no modo rápido dos testes): a frenagem começa na distância certa e nunca pula o evento.
 */
export function passoRota(e: EstRota, dt: number, r: Rota, fase: FaseRota): Aviso {
  const freia = fase === 'indo' && r.evento && !e.tratado;
  let alvo = 1;
  if (fase === 'evento' || fase === 'chegando') alvo = 0;
  else if (freia) alvo = e.p >= P_PARADA - e.vel / (K_FREIO * r.dur) ? 0 : 1; // distância de frenagem de um decaimento exponencial: vel / (K · dur)
  else if (e.p >= P_CHEGADA) alvo = VEL_CHEGADA;
  e.vel += (alvo - e.vel) * Math.min(1, dt * (alvo > e.vel ? K_ACEL : K_FREIO)); e.freio = alvo < e.vel - 0.04;
  if (alvo === 0 && e.vel < 0.03) e.vel = 0;
  e.dist += e.vel * 60 * dt; if (fase === 'indo' || fase === 'retomando') e.p = Math.min(1, e.p + (e.vel * dt) / r.dur);
  if (freia && alvo === 0 && e.vel === 0) { e.tratado = true; return 'meio'; }
  if ((fase === 'retomando' || (fase === 'indo' && (!r.evento || e.tratado))) && e.p >= 1 && !e.fim) { e.fim = true; e.vel = Math.min(e.vel, VEL_CHEGADA); return 'fim'; }
  return null;
}
