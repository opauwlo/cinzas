// Humanoide modular: receita -> partes (cabeça, tronco, braços, pernas, mochila, arma) -> poses -> voxel.
// Membros faltando, mutações, facções e escala vêm da receita; nenhum sprite é desenhado à mão.
import { Vox, carimbar, type Cor } from './vox';
import { raiz, ligar, colocar, type Parte, type Osso } from './rig';
import { Rng } from './rng';
import { mix, escurecer, clarear, ruido, hash3 } from './cor';
import * as P from './paletas';
import { desenharArma } from './armas';

export type Faltando = 'bracoE' | 'bracoD' | 'pernaE' | 'pernaD' | 'mandibula';
export type RecHumano = {
  tipo: 'humano'; sem: number;
  pele: number; cabelo: number; corpo: 'magro' | 'normal' | 'forte' | 'gordo'; alt: number;
  cab: 'normal' | 'careca' | 'capuz' | 'capacete' | 'mascara' | 'bandana' | 'bone' | 'moicano' | 'hazmat' | 'touca' | 'comprido';
  tor: 'jaqueta' | 'camisa' | 'colete' | 'hazmat' | 'rasgada' | 'couro' | 'camuflado' | 'jaleco' | 'policial' | 'nu';
  per: 'jeans' | 'cargo' | 'shorts' | 'rasgada' | 'hazmat' | 'camuflada' | 'couro';
  bot: 'bota' | 'tenis' | 'descalco';
  cTor: number; cPer: number; cAc: number; cBot: number;
  moch: 'nenhuma' | 'pequena' | 'grande' | 'saco';
  acs: string[]; mut: string[]; falta: Faltando[];
  esc: number; arma: string; sujo: number; est: 'normal' | 'zumbi';
};

export const GX = 52, GY = 30, GZ = 64, CX = 18, CY = 15;
const CORPO = { magro: { W: 9, D: 6, pw: 3, aw: 3 }, normal: { W: 10, D: 7, pw: 4, aw: 3 }, forte: { W: 12, D: 8, pw: 4, aw: 4 }, gordo: { W: 13, D: 9, pw: 5, aw: 4 } } as const;
const PISTOLAS = ['pistola', 'escopeta', 'rifle'];

type Partes = { pE: Parte; pD: Parte; tor: Parte; cab: Parte; bE: Parte; bD: Parte; moch?: Parte; bX?: Parte };
const cache = new Map<string, Partes>();

const S = (r: RecHumano) => r.sem % 997;
function suj(r: RecHumano, c: number, x: number, y: number, z: number) {
  if (r.sujo <= 0) return c; const h = hash3(x * 3 + S(r), y * 3, z * 3);
  if (h < r.sujo * 0.05) return 0x6a1410; if (h < r.sujo * 0.28) return mix(c, 0x1a120c, 0.5); return c;
}

function corCalca(r: RecHumano, pw: number, LEG: number): Cor {
  const base = r.cPer;
  return (x, y, z) => {
    let c: number;
    switch (r.per) {
      case 'jeans': c = ruido(x, y, z, 0.07, base); if (z > LEG * 0.38 && z < LEG * 0.52) c = clarear(c, 0.1); if (z < 10 && hash3(x, y, z) < 0.22) c = clarear(c, 0.16); break;
      case 'cargo': c = ruido(x, y, z, 0.08, base); if (z > LEG * 0.3 && z < LEG * 0.55 && (y === 0 || y === pw - 1)) c = escurecer(c, 0.22); break;
      case 'shorts': if (z < LEG - 8) return suj(r, ruido(x, y, z, 0.06, r.pele), x, y, z); c = ruido(x, y, z, 0.08, base); break;
      case 'rasgada': c = hash3(x + S(r), y, z) < 0.17 || (z < 7 && hash3(x * 2, y + S(r), z) < 0.5) ? ruido(x, y, z, 0.06, r.pele) : ruido(x, y, z, 0.1, mix(base, 0x1a1410, 0.25)); break;
      case 'hazmat': c = z < 7 ? ruido(x, y, z, 0.06, 0x2a2a2a) : ruido(x, y, z, 0.06, base); break;
      case 'camuflada': { const n = hash3(Math.floor(x / 2), Math.floor(y / 2), Math.floor(z / 2) + S(r)); c = ruido(x, y, z, 0.05, n < 0.33 ? 0x4a5236 : n < 0.66 ? 0x6a6240 : 0x2f3626); break; }
      default: c = ruido(x, y, z, 0.06, 0x232022); if (z === Math.round(LEG * 0.45)) c = 0x8a8a8a;
    }
    return suj(r, c, x, y, z);
  };
}

function perna(r: RecHumano, lado: -1 | 1): Parte {
  const cp = CORPO[r.corpo], pw = cp.pw, pd = pw + 1, LEG = Math.round(18 * r.alt), v = new Vox(pd + 5, pw, LEG + 1), x0 = 1, key = lado < 0 ? 'pernaE' : 'pernaD', calca = corCalca(r, pw, LEG);
  const pivot: [number, number, number] = [x0 + pd / 2, pw / 2, LEG];
  if (r.falta.includes(key as Faltando)) {
    v.box(x0, 0, LEG - 9, x0 + pd, pw, LEG, calca); v.box(x0 + 1, 1, LEG - 10, x0 + pd - 1, pw - 1, LEG - 9, 0xcfc8b0);
    v.box(x0, 0, LEG - 9, x0 + pd, pw, LEG - 7, (x, y, z) => (hash3(x, y, z) < 0.7 ? 0x6a1410 : 0x8a2018)); return { v, pivot };
  }
  const bootH = r.bot === 'bota' ? 7 : r.bot === 'tenis' ? 3 : 0, corBota = r.bot === 'descalco' ? r.pele : r.cBot;
  v.box(x0, 0, bootH, x0 + pd, pw, LEG, calca);
  if (bootH) v.box(x0, 0, 0, x0 + pd, pw, bootH, (x, y, z) => ruido(x, y, z, 0.1, corBota));
  v.box(x0, 0, 0, x0 + pd + 3, pw, 3, (x, y, z) => ruido(x, y, z, 0.1, r.bot === 'descalco' ? escurecer(r.pele, 0.15) : corBota));
  if (r.bot === 'tenis') v.box(x0, 0, 0, x0 + pd + 3, pw, 1, 0xd8d4c4);
  return { v, pivot };
}

function braco(r: RecHumano, lado: -1 | 1, grande: boolean): Parte {
  const cp = CORPO[r.corpo], aw = cp.aw, ARM = Math.round(15 * r.alt), M = 15, x0 = 2, v = new Vox(x0 + aw + 22, aw + 1, M + ARM + 2), key = lado < 0 ? 'bracoE' : 'bracoD';
  const pivot: [number, number, number] = [x0 + aw / 2, (aw + 1) / 2, M + ARM];
  const manga: Cor = (x, y, z) => {
    if (r.tor === 'nu' || r.tor === 'couro' || r.tor === 'colete') return suj(r, ruido(x, y, z, 0.07, r.pele), x, y, z);
    const curta = r.tor === 'camisa' || r.tor === 'rasgada'; if (z < M + (curta ? 8 : 4) && !(r.tor === 'hazmat')) return suj(r, ruido(x, y, z, 0.07, r.pele), x, y, z);
    if (r.tor === 'rasgada' && hash3(x + S(r), y, z) < 0.2) return ruido(x, y, z, 0.06, r.pele);
    return suj(r, ruido(x, y, z, 0.08, r.tor === 'camuflado' ? (hash3(Math.floor(x / 2), y, Math.floor(z / 2)) < 0.5 ? 0x4a5236 : 0x6a6240) : r.cTor), x, y, z);
  };
  if (r.falta.includes(key as Faltando)) {
    v.box(x0, 0, M + ARM - 7, x0 + aw, aw, M + ARM, manga); v.box(x0 + 1, 1, M + ARM - 8, x0 + aw - 1, aw - 1, M + ARM - 7, 0xcfc8b0);
    v.box(x0, 0, M + ARM - 7, x0 + aw, aw, M + ARM - 5, (x, y, z) => (hash3(x, y, z) < 0.7 ? 0x6a1410 : 0x8a2018)); return { v, pivot };
  }
  v.box(x0, 0, M, x0 + aw, aw, M + ARM, manga);
  const luva = r.acs.includes('luvas') ? r.cAc : -1;
  v.box(x0, 0, M, x0 + aw, aw, M + 3, (x, y, z) => (luva >= 0 ? ruido(x, y, z, 0.08, luva) : ruido(x, y, z, 0.07, r.pele)));
  if (r.mut.includes('garra')) { for (let i = 0; i < 3; i++) v.linha(x0 + 1, i, M, x0 + 3, i, M - 5, 1, 0xd8d0b8); }
  if (grande) { v.ell(x0 + aw / 2, aw / 2, M + 1, aw * 1.3, aw * 0.95, 4.5, (x, y, z) => ruido(x, y, z, 0.1, r.pele)); }
  if (lado > 0 && r.arma) desenharArma(r.arma, v, x0 + aw / 2, aw / 2, M + 2);
  return { v, pivot };
}

function corTorso(r: RecHumano, D: number, W: number, TOR: number): Cor {
  const base = r.cTor;
  return (x, y, z) => {
    const fx = x - 2, frente = fx >= D - 1, costas = fx <= 0, lado = y <= 0 || y >= W - 1, mid = Math.abs(y - (W - 1) / 2) < 0.8; let c: number;
    switch (r.tor) {
      case 'jaqueta': c = ruido(x, y, z, 0.08, base); if (z < 2) c = escurecer(c, 0.3); if (frente && mid) c = 0x2a2a2a; if (z >= TOR - 2) c = clarear(c, 0.08); if (frente && z > 2 && z < 6 && (y === 2 || y === W - 3)) c = escurecer(c, 0.3); break;
      case 'camisa': c = ruido(x, y, z, 0.07, base); if (frente && mid && z % 3 === 1) c = 0xd8d4c4; if (z < 2) c = escurecer(c, 0.15); break;
      case 'colete': c = ruido(x, y, z, 0.08, (frente || costas) && !lado && y > 0 && y < W - 1 ? mix(0x6a5838, base, 0.2) : r.cAc); if (frente && (y === 1 || y === W - 2)) c = 0x2a2820; if (frente && z > 3 && z < 7 && (y === 3 || y === W - 4)) c = 0x3a3224; break;
      case 'hazmat': c = ruido(x, y, z, 0.06, base); if (frente && z > 6 && z < 10 && y > 2 && y < W - 3) c = 0x2a2a2a; if (z % 5 === 0) c = escurecer(c, 0.18); break;
      case 'rasgada': c = hash3(x + S(r), y, z) < 0.2 || (z < 4 && hash3(x, y + S(r), z) < 0.5) ? ruido(x, y, z, 0.06, r.pele) : ruido(x, y, z, 0.1, mix(base, 0x1a1410, 0.2)); break;
      case 'couro': c = ruido(x, y, z, 0.07, 0x2a2224); if (frente && mid) c = 0x3a3a3a; if ((z === TOR - 1 || z === TOR - 2) && (lado || y === 1 || y === W - 2)) c = hash3(x, y, z) < 0.5 ? 0xb8b8b0 : c; if (lado && z > 2) c = ruido(x, y, z, 0.07, r.pele); break;
      case 'camuflado': { const n = hash3(Math.floor(x / 2), Math.floor(y / 2), Math.floor(z / 2) + S(r)); c = ruido(x, y, z, 0.05, n < 0.33 ? 0x4a5236 : n < 0.66 ? 0x6a6240 : 0x2f3626); break; }
      case 'jaleco': c = ruido(x, y, z, 0.05, mix(base, 0xe8e4d4, 0.5)); if (frente && mid) c = 0x9a968a; if (frente && z > 3 && z < 7 && (y === 2 || y === W - 3)) c = 0x8a867a; break;
      case 'policial': c = ruido(x, y, z, 0.06, 0x2a3446); if (z < 2) c = 0x1a1a1a; if (frente && z > 7 && z < 10 && y === 2) c = 0xc9b25a; break;
      default: c = ruido(x, y, z, 0.07, r.pele); if (frente && z > 5 && z < 7 && (y === 3 || y === W - 4)) c = escurecer(c, 0.25); break;
    }
    if (r.acs.includes('bandoleira') && frente && Math.abs((y - 1) - (TOR - z) * 0.7) < 1) c = hash3(x, y, z) < 0.3 ? 0xc9b25a : 0x3a2a1e;
    if (r.acs.includes('cinto') && z >= 1 && z < 3) c = (x + y) % 5 === 0 && lado ? 0xb8b890 : 0x2a2218;
    return suj(r, c, x, y, z);
  };
}

function torso(r: RecHumano): Parte {
  const cp = CORPO[r.corpo], W = cp.W, D = cp.D, TOR = Math.round(13 * r.alt), v = new Vox(D + 6, W, TOR + 3), x0 = 2, cor = corTorso(r, D, W, TOR);
  v.box(x0, 0, 0, x0 + D, W, TOR - 1, cor); v.box(x0, 1, TOR - 1, x0 + D, W - 1, TOR, cor); // ombros arredondados
  if (r.corpo === 'gordo') v.ell(x0 + D, W / 2, 4, 3.2, W / 2 - 0.5, 4.2, cor);
  if (r.acs.includes('lenco')) v.box(x0, 1, TOR - 1, x0 + D, W - 1, TOR + 1, (x, y, z) => ruido(x, y, z, 0.08, r.cAc));
  if (r.mut.includes('costelas')) for (let z = 3; z < TOR - 1; z++) for (let y = 2; y < W - 2; y++) for (let x = x0 + D - 2; x < x0 + D; x++) v.set(x, y, z, z % 2 === 0 ? 0xd0c8b0 : 0x5a1a14);
  if (r.mut.includes('veias')) for (let z = 2; z < TOR; z++) for (let y = 1; y < W - 1; y++) if ((y + z * 2 + S(r)) % 7 === 0) { v.set(x0 + D - 1, y, z, 0xb6ff5a, true); v.set(x0 + (S(r) % 2 ? 0 : D - 1), y, z, 0xb6ff5a, true); }
  if (r.mut.includes('tumor')) { v.ell(x0 - 1, W - 2, TOR - 5, 3.4, 3.2, 3.4, (x, y, z) => (hash3(x, y, z) < 0.12 ? 0xc8ff5a : ruido(x, y, z, 0.1, 0xb08a7a)), false); v.set(x0 - 3, W - 2, TOR - 5, 0xc8ff5a, true); }
  if (r.mut.includes('corcunda')) v.ell(x0 - 0.5, W / 2, TOR - 3, 3.4, W / 2 - 0.8, 4.4, (x, y, z) => suj(r, ruido(x, y, z, 0.09, r.tor === 'nu' ? r.pele : r.cTor), x, y, z));
  return { v, pivot: [x0 + D / 2, W / 2, 0] };
}

function cabeca(r: RecHumano): Parte {
  const v = new Vox(14, 11, 15), hx = 6.5, hy = 5.5, hz = 7, zumbi = r.est === 'zumbi', olho = r.mut.includes('olhos') || (zumbi && r.mut.includes('veias'));
  const sem = S(r), podre = r.mut.includes('podre');
  const pele: Cor = (x, y, z) => { if (podre) { const h = hash3(x + sem, y, z); if (h < 0.03) return 0xcfc8b0; if (h < 0.17) return 0x3a4028; } if (r.sujo > 0 && hash3(x * 2, y * 2 + sem, z * 2) < r.sujo * 0.2) return mix(r.pele, 0x2a1a10, 0.5); return ruido(x, y, z, 0.07, r.pele); };
  v.box(5, 4, 0, 9, 8, 3, (x, y, z) => ruido(x, y, z, 0.06, escurecer(r.pele, 0.1)));
  v.ell(hx, hy, hz, 3.9, 3.7, 4.5, pele);
  const hairCol = r.cab === 'moicano' ? r.cAc : r.cabelo;
  const cabelo: Cor = (x, y, z) => ruido(x, y, z, 0.12, hairCol);
  const frente = (x: number) => x >= 9;
  switch (r.cab) {
    case 'normal': v.ell(hx - 0.7, hy, hz + 0.6, 4.1, 3.9, 4.6, (x, y, z) => (z > 9 || (x < 6.2 && z > 5.2) ? cabelo(x, y, z) : -1)); break;
    case 'comprido': v.ell(hx - 0.7, hy, hz + 0.6, 4.1, 3.9, 4.6, (x, y, z) => (z > 9 || (x < 6.2 && z > 5.2) ? cabelo(x, y, z) : -1)); v.box(2, 2, 0, 6, 9, 9, cabelo); break;
    case 'moicano': v.ell(hx, hy, hz, 3.95, 3.75, 4.5, (x, y, z) => (z > 8.5 ? ruido(x, y, z, 0.08, mix(r.pele, 0x000000, 0.35)) : -1)); v.box(3, 5, 10, 10, 7, 14, cabelo); break;
    case 'careca': if (hash3(sem, 1, 2) < 0.6) v.linha(5, 3, 11, 8, 8, 10, 1, 0x6a3a30); break;
    case 'capuz': v.ell(hx - 0.4, hy, hz + 0.4, 4.9, 4.7, 5.3, (x, y, z) => ruido(x, y, z, 0.1, r.cTor)); v.cut(9, 2, 4, 14, 9, 10); v.ell(hx + 1.2, hy, hz - 0.5, 2.9, 3.2, 3.6, pele); break;
    case 'capacete': v.ell(hx - 0.3, hy, hz + 1.2, 4.8, 4.6, 4.6, (x, y, z) => ruido(x, y, z, 0.08, r.cAc)); v.cut(6, 0, 0, 14, 11, 6); v.box(4, 2, 5, 10, 9, 6, (x, y, z) => ruido(x, y, z, 0.1, r.cAc)); v.box(9, 3, 6, 11, 8, 7, 0x1a1a1a); break;
    case 'mascara': v.box(9, 3, 3, 12, 9, 8, (x, y, z) => ruido(x, y, z, 0.07, 0x1f2321)); v.box(10, 3, 6, 12, 5, 8, 0x0b1416); v.box(10, 7, 6, 12, 9, 8, 0x0b1416); v.set(11, 3, 7, 0x4a6a70); v.set(11, 7, 7, 0x4a6a70); v.cil(12, 6, 2, 6, 1.7, 1.7, (x, y, z) => ruido(x, y, z, 0.08, 0x5a5f43)); v.box(4, 2, 5, 10, 10, 6, 0x1f2321); v.ell(hx - 0.7, hy, hz + 0.6, 4.1, 3.9, 4.6, (x, y, z) => (z > 9 ? cabelo(x, y, z) : -1)); break;
    case 'bandana': v.ell(hx, hy, hz + 0.3, 4.1, 3.9, 4.6, (x, y, z) => (z > 8.4 ? ruido(x, y, z, 0.09, r.cAc) : -1)); v.box(8, 2, 2, 11, 9, 5, (x, y, z) => ruido(x, y, z, 0.09, r.cAc)); v.box(2, 4, 6, 5, 7, 9, ruido(2, 5, 7, 0.1, r.cAc)); break;
    case 'bone': v.ell(hx - 0.3, hy, hz + 0.8, 4.3, 4.1, 4.4, (x, y, z) => (z > 8.6 ? ruido(x, y, z, 0.1, r.cTor) : -1)); v.box(9, 2, 9, 13, 9, 10, ruido(10, 4, 9, 0.1, r.cTor)); break;
    case 'touca': v.ell(hx - 0.3, hy, hz + 0.9, 4.3, 4.1, 4.5, (x, y, z) => (z > 8 ? (z % 2 ? ruido(x, y, z, 0.1, r.cAc) : ruido(x, y, z, 0.1, escurecer(r.cAc, 0.2))) : -1)); break;
    case 'hazmat': v.ell(hx - 0.3, hy, hz + 0.4, 4.9, 4.7, 5.4, (x, y, z) => ruido(x, y, z, 0.06, r.cTor)); v.box(9, 2, 4, 14, 10, 10, (x, y, z) => ruido(x, y, z, 0.05, 0x1f3a40)); v.set(11, 3, 9, 0x6a9aa0); v.set(11, 4, 9, 0x6a9aa0); break;
  }
  if (r.acs.includes('oculos')) { v.box(8, 2, 6, 11, 9, 8, 0x1a1a1a); v.box(10, 3, 6, 11, 5, 8, 0x4a7a80); v.box(10, 6, 6, 11, 8, 8, 0x4a7a80); }
  if (r.acs.includes('faixa')) v.box(4, 1, 9, 10, 10, 10, (x, y, z) => ruido(x, y, z, 0.08, r.cAc));
  // rosto
  const ox = 9, ey = [3, 7];
  for (const y of ey) v.set(ox, y, 7, olho ? 0xc8ff5a : zumbi ? 0x2a2a1a : 0x15110d, olho);
  if (zumbi) { v.box(ox, 4, 4, ox + 1, 7, 5, 0x2a1414); }
  if (r.falta.includes('mandibula')) { v.cut(7, 2, 0, 14, 10, 4); v.box(8, 3, 3, 10, 8, 4, 0xd8d0b8); v.box(8, 3, 2, 10, 8, 3, (x, y, z) => (hash3(x, y, z) < 0.6 ? 0x6a1410 : 0x2a0a08)); }
  if (r.mut.includes('olhoUnico')) { v.cut(ox, 2, 6, ox + 2, 5, 9); v.set(ox, 3, 7, 0x3a1a14); }
  return { v, pivot: [6.5, 5.5, 0] };
}

function mochila(r: RecHumano): Parte | undefined {
  if (r.moch === 'nenhuma') return undefined; const v = new Vox(8, 11, 16), cor: Cor = (x, y, z) => ruido(x, y, z, 0.12, r.moch === 'saco' ? 0x7a6a4a : P.MARROM[0]);
  if (r.moch === 'pequena') v.box(1, 1, 0, 6, 10, 9, cor); else if (r.moch === 'grande') { v.box(0, 1, 0, 7, 10, 13, (x, y, z) => ruido(x, y, z, 0.12, z > 10 ? 0x4a5a3a : 0x5a4a34)); v.cil(3.5, 5.5, 13, 16, 3, 5, (x, y, z) => ruido(x, y, z, 0.1, 0x6a6a52)); }
  else v.ell(3.5, 5.5, 5, 3.5, 4.5, 5, cor);
  return { v, pivot: [7, 5.5, 0] };
}

function partesDe(r: RecHumano): Partes {
  const k = JSON.stringify(r); const c = cache.get(k); if (c) return c;
  const grandeE = r.mut.includes('braco_grande_E'), grandeD = r.mut.includes('braco_grande_D');
  const p: Partes = { pE: perna(r, -1), pD: perna(r, 1), tor: torso(r), cab: cabeca(r), bE: braco(r, -1, grandeE), bD: braco(r, 1, grandeD), moch: mochila(r) };
  if (r.mut.includes('braco_extra')) p.bX = braco({ ...r, arma: '' }, 1, false);
  if (cache.size > 80) cache.delete(cache.keys().next().value as string);
  cache.set(k, p); return p;
}

// ---------------------------------------------------------------- poses e clipes
export type PoseH = { dz?: number; dx?: number; raiz?: Osso; tor?: Osso; cab?: Osso; bE?: Osso; bD?: Osso; bX?: Osso; pE?: Osso; pD?: Osso };
export const CLIPES_HUMANO: Record<string, { n: number; loop: boolean }> = {
  parado: { n: 2, loop: true }, andar: { n: 4, loop: true }, correr: { n: 4, loop: true }, cambalear: { n: 4, loop: true }, mancar: { n: 4, loop: true }, rastejar: { n: 4, loop: true }, pesado: { n: 4, loop: true },
  golpear: { n: 3, loop: false }, atirar: { n: 2, loop: false }, dano: { n: 1, loop: false }, morrer: { n: 5, loop: false }, pancada: { n: 3, loop: false },
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function poseHumano(clip: string, i: number, r: RecHumano): PoseH {
  const def = CLIPES_HUMANO[clip] ?? CLIPES_HUMANO.parado, t = def.loop ? i / def.n : i / Math.max(1, def.n - 1), ph = t * Math.PI * 2, s = Math.sin(ph);
  const arma = r.arma, pist = PISTOLAS.includes(arma), zumbi = r.est === 'zumbi', corc = r.mut.includes('corcunda') ? 0.42 : 0, LEG = Math.round(18 * r.alt);
  const bdPronto = arma ? (pist ? 1.0 : 0.6) : 0.1, p: PoseH = { tor: { ry: corc }, cab: { ry: -corc * 0.6 }, bE: {}, bD: {}, bX: {}, pE: {}, pD: {} };
  const faltaE = r.falta.includes('pernaE'), lado = faltaE ? -1 : 1;
  switch (clip) {
    case 'parado': p.dz = i % 2 ? -0.5 : 0; p.bE!.ry = zumbi ? 0.5 : 0.08; p.bD!.ry = zumbi && !arma ? 0.5 : bdPronto; if (zumbi) p.cab!.rx = 0.22; break;
    case 'andar': p.pE!.ry = s * 0.55; p.pD!.ry = -s * 0.55; p.bE!.ry = -s * 0.5; p.bD!.ry = arma ? bdPronto + s * 0.08 : s * 0.5; p.dz = -Math.abs(s) * 0.8; p.tor!.rz = s * 0.1; break;
    case 'correr': p.pE!.ry = s * 0.95; p.pD!.ry = -s * 0.95; p.bE!.ry = -s * 0.9; p.bD!.ry = arma ? bdPronto + 0.2 + s * 0.15 : s * 0.9; p.dz = -Math.abs(s) * 1.4 - 0.5; p.tor!.ry! += 0.22; p.cab!.ry! -= 0.1; p.tor!.rz = s * 0.14; break;
    case 'cambalear': p.pE!.ry = s * 0.42; p.pD!.ry = -s * 0.2; p.bE!.ry = 1.25 + s * 0.12; p.bD!.ry = 1.15 - s * 0.12; p.tor!.ry! += 0.3; p.cab!.rx = 0.28 * s; p.cab!.ry! += 0.15; p.dz = -Math.abs(s) * 0.6; p.tor!.rz = s * 0.15; break;
    case 'pesado': p.pE!.ry = s * 0.36; p.pD!.ry = -s * 0.36; p.bE!.ry = -s * 0.3 + 0.3; p.bD!.ry = s * 0.3 + 0.3; p.dz = -Math.abs(s) * 1.1; p.tor!.rz = s * 0.08; p.tor!.ry! += 0.18; break;
    case 'mancar': p.dz = -4 - Math.abs(s) * 1.4; p.raiz = { rx: lado * 0.12 }; p.pE!.ry = faltaE ? 0 : s * 0.5; p.pD!.ry = faltaE ? -s * 0.5 : 0; p.bE!.ry = s * 0.6; p.bD!.ry = -s * 0.6 + (zumbi ? 0.9 : 0); p.tor!.rz = s * 0.12; break;
    case 'rastejar': p.dz = -(LEG - 4); p.tor!.ry = 1.4; p.cab!.ry = -0.95; p.bE!.ry = 2.5 + s * 0.5; p.bD!.ry = 2.5 - s * 0.5; p.pE!.ry = -0.2; p.pD!.ry = -0.2; break;
    case 'golpear': {
      if (zumbi && !arma) { const a = [0.9, 1.6, 1.1][i], lunge = [-0.1, 0.55, 0.2][i]; p.bE!.ry = a; p.bD!.ry = a; p.tor!.ry = corc + lunge; p.cab!.ry = [0, 0.45, 0.1][i]; p.pE!.ry = [0.2, 0.6, 0.2][i]; p.pD!.ry = [-0.2, -0.3, -0.1][i]; p.dz = [0, -1, 0][i]; break; }
      p.bD!.ry = [-1.0, 2.0, 1.0][i]; p.bE!.ry = [0.3, -0.4, 0.1][i]; p.tor!.rz = [-0.35, 0.35, 0.1][i]; p.tor!.ry = corc + [-0.05, 0.2, 0.05][i]; p.pE!.ry = [0.3, 0.5, 0.1][i]; p.pD!.ry = [-0.3, -0.5, -0.1][i]; p.dz = [0, -1, 0][i]; break;
    }
    case 'pancada': p.bE!.ry = [-2.4, 2.1, 1.0][i]; p.bD!.ry = [-2.4, 2.1, 1.0][i]; p.tor!.ry = corc + [-0.3, 0.6, 0.1][i]; p.cab!.ry = [-0.1, 0.3, 0][i]; p.pE!.ry = [0.2, 0.5, 0.1][i]; p.pD!.ry = [-0.2, -0.3, -0.1][i]; p.dz = [0, -2, 0][i]; break;
    case 'atirar': p.bD!.ry = i ? 1.72 : 1.5; p.bE!.ry = arma === 'pistola' ? 1.35 : 1.45; p.tor!.rz = 0.05; p.tor!.ry = corc + (i ? -0.06 : 0); p.cab!.ry! += i ? -0.1 : 0; break;
    case 'dano': p.tor!.ry = corc - 0.35; p.cab!.ry = -0.35; p.bE!.ry = 0.7; p.bD!.ry = 0.7; p.dz = -1; p.pE!.ry = 0.2; break;
    case 'morrer': {
      const A = { dz: [0, -5, -11, -15.5, -17], dx: [0, -1, -2.5, -3, -3.5], tor: [0, -0.35, -0.85, -1.3, -1.5], cab: [0, -0.2, -0.4, -0.5, -0.5], pE: [0, 0.7, 1.1, 1.45, 1.5], pD: [0, 0.4, 0.9, 1.3, 1.5], bE: [0.1, 0.5, 0.9, 1.6, 2.0], bD: [0.1, 0.6, 0.5, 1.2, 1.2] };
      p.dz = A.dz[i]; p.dx = A.dx[i]; p.tor!.ry = A.tor[i] + corc * (1 - i / 4); p.cab!.ry = A.cab[i]; p.pE!.ry = A.pE[i]; p.pD!.ry = A.pD[i]; p.bE!.ry = A.bE[i]; p.bD!.ry = A.bD[i]; break;
    }
  }
  void lerp; return p;
}

export function montarHumano(r: RecHumano, pose: PoseH): Vox {
  const P2 = partesDe(r), cp = CORPO[r.corpo], LEG = Math.round(18 * r.alt), TOR = Math.round(13 * r.alt), out = new Vox(GX, GY, GZ);
  const R = raiz([CX + (pose.dx ?? 0), CY, LEG + (pose.dz ?? 0)], pose.raiz), legOff = cp.pw / 2 + 0.5, shY = cp.W / 2 + cp.aw / 2 - 0.4;
  const pE = ligar(R, [0, -legOff, 0], pose.pE), pD = ligar(R, [0, legOff, 0], pose.pD), tor = ligar(R, [0, 0, 0], pose.tor), cab = ligar(tor, [r.est === 'zumbi' ? 0.5 : 0, 0, TOR], pose.cab);
  const bE = ligar(tor, [0, -shY, TOR - 1.5], pose.bE), bD = ligar(tor, [0, shY, TOR - 1.5], pose.bD);
  colocar(out, P2.pE, pE); colocar(out, P2.pD, pD);
  if (P2.moch) colocar(out, P2.moch, ligar(tor, [-cp.D / 2 - 0.5, 0, 2]));
  colocar(out, P2.tor, tor); colocar(out, P2.cab, cab, r.mut.includes('cabecao') ? 1.35 : 1);
  colocar(out, P2.bE, bE, r.mut.includes('braco_grande_E') ? 1.35 : 1); colocar(out, P2.bD, bD, r.mut.includes('braco_grande_D') ? 1.35 : 1);
  if (P2.bX) colocar(out, P2.bX, ligar(tor, [0, -shY - 1, TOR - 7], pose.bX ?? { ry: 0.6 }));
  if (r.esc === 1) return out;
  const gr = new Vox(Math.ceil(GX * r.esc), Math.ceil(GY * r.esc), Math.ceil(GZ * r.esc));
  // escala ao redor do centro do chão
  carimbar(gr, out, { pivot: [CX, CY, 0], pos: [CX * r.esc, CY * r.esc, 0], s: r.esc }); return gr;
}
export const centroHumano = (r: RecHumano): [number, number, number] => [CX * r.esc, CY * r.esc, Math.hypot(Math.max(CX, GX - CX), Math.max(CY, GY - CY)) * r.esc];

// ---------------------------------------------------------------- gerador de receitas
const ARMAS_MELEE = ['pe_de_cabra', 'taco', 'cano', 'facao', 'machado', 'faca', 'martelo', 'clava_pregos'];

export function gerarHumano(rng: Rng, arq: 'sobrevivente' | 'irradiado' | 'rastejador' | 'saqueador' | 'filho' | 'miliciano' | 'colosso' | 'civil', o: { arma?: string; faccao?: number } = {}): RecHumano {
  const doente = arq === 'irradiado' || arq === 'rastejador' || arq === 'colosso';
  const corpo = arq === 'colosso' ? 'gordo' : rng.peso([['magro', 2], ['normal', 5], ['forte', 2], ['gordo', 1]] as const);
  const r: RecHumano = {
    tipo: 'humano', sem: rng.int(1, 99999), pele: doente ? rng.pick(P.PELES_DOENTES) : rng.pick(P.PELES), cabelo: rng.pick(P.CABELOS), corpo, alt: rng.range(0.93, 1.07),
    cab: 'normal', tor: 'jaqueta', per: 'jeans', bot: 'bota', cTor: rng.pick(P.OLIVA), cPer: rng.pick(P.JEANS), cAc: rng.pick(P.DESBOTADOS), cBot: rng.pick(P.COURO),
    moch: 'nenhuma', acs: [], mut: [], falta: [], esc: 1, arma: o.arma ?? '', sujo: doente ? rng.range(0.4, 1) : rng.range(0, 0.4), est: doente ? 'zumbi' : 'normal',
  };
  const civilTor = ['jaqueta', 'camisa', 'rasgada', 'jaleco', 'policial', 'hazmat', 'camuflado', 'colete'] as const;
  switch (arq) {
    case 'sobrevivente': r.cab = 'capuz'; r.tor = 'jaqueta'; r.cTor = P.OLIVA[0]; r.cPer = P.ESCURO[0]; r.moch = 'grande'; r.acs = ['lenco']; r.cAc = 0xb04a1f; r.cBot = P.COURO[0]; r.pele = P.PELES[1]; r.cabelo = P.CABELOS[0]; r.corpo = 'normal'; r.alt = 1; r.per = 'cargo'; break;
    case 'irradiado': case 'rastejador': {
      r.cab = rng.peso([['normal', 3], ['careca', 3], ['comprido', 1], ['touca', 1], ['bone', 1]] as const); r.tor = rng.pick(civilTor); r.per = rng.peso([['jeans', 4], ['cargo', 2], ['rasgada', 4], ['shorts', 1], ['hazmat', 1]] as const);
      r.cTor = rng.pick([...P.DESBOTADOS, ...P.CAQUI, ...P.CINZA, ...P.BRANCO_SUJO]); r.cPer = rng.pick([...P.JEANS, ...P.CAQUI, ...P.ESCURO]); if (r.tor === 'hazmat') { r.cTor = rng.pick(P.HAZMAT); r.per = 'hazmat'; r.cab = rng.chance(0.5) ? 'hazmat' : r.cab; } if (r.tor === 'policial') r.cab = rng.chance(0.4) ? 'bone' : r.cab;
      r.bot = rng.peso([['bota', 3], ['tenis', 3], ['descalco', 3]] as const); r.moch = rng.chance(0.15) ? 'pequena' : 'nenhuma'; r.cAc = rng.pick(P.DESBOTADOS);
      const m = ['veias', 'costelas', 'tumor', 'olhos', 'podre', 'garra', 'olhoUnico']; for (const k of m) if (rng.chance(0.13)) r.mut.push(k); if (rng.chance(0.1)) r.mut.push('corcunda');
      if (arq === 'rastejador') { r.falta.push('pernaE', 'pernaD'); } else {
        if (rng.chance(0.16)) r.falta.push('bracoE'); if (rng.chance(0.16)) r.falta.push('bracoD'); if (rng.chance(0.1)) r.falta.push(rng.chance(0.5) ? 'pernaE' : 'pernaD'); if (rng.chance(0.1)) r.falta.push('mandibula');
      }
      r.arma = ''; break;
    }
    case 'saqueador': {
      const ac = r.cAc = rng.pick([0xb5471f, 0xa8322a, 0x8a7a2a, 0x2f6a5a]); r.cab = rng.peso([['moicano', 2], ['bandana', 3], ['capacete', 2], ['mascara', 1], ['careca', 2], ['touca', 1], ['bone', 1]] as const); r.tor = rng.peso([['couro', 4], ['rasgada', 2], ['jaqueta', 2], ['colete', 2], ['camuflado', 1], ['nu', 1]] as const);
      r.per = rng.peso([['couro', 2], ['cargo', 3], ['jeans', 2], ['camuflada', 1]] as const); r.cTor = rng.pick([...P.ESCURO, ...P.MARROM, ...P.FERRUGEM]); r.cPer = rng.pick([...P.ESCURO, ...P.CAQUI]); r.acs = rng.embaralhar(['ombreira', 'bandoleira', 'cinto', 'lenco', 'oculos', 'faixa', 'luvas']).slice(0, rng.int(1, 3));
      r.moch = rng.chance(0.3) ? 'pequena' : 'nenhuma'; r.arma = o.arma ?? rng.pick([...ARMAS_MELEE, 'pistola', 'pistola', 'escopeta']); if (r.cab === 'capacete') r.cAc = rng.pick(P.CINZA); void ac; break;
    }
    case 'filho': {
      r.cab = rng.peso([['mascara', 4], ['capuz', 3], ['hazmat', 1]] as const); r.tor = rng.peso([['jaleco', 4], ['hazmat', 2], ['camisa', 1]] as const); r.cTor = rng.pick(P.BRANCO_SUJO); r.per = rng.pick(['cargo', 'jeans', 'hazmat'] as const); r.cPer = rng.pick(P.CINZA); r.cAc = 0xb6ff5a; r.acs = ['lenco']; if (r.tor === 'hazmat') { r.cTor = rng.pick(P.HAZMAT); r.per = 'hazmat'; }
      r.arma = o.arma ?? rng.pick(['cano', 'facao', 'tocha', 'taco', 'pistola']); r.sujo = rng.range(0.1, 0.5); break;
    }
    case 'miliciano': r.cab = 'capacete'; r.tor = rng.pick(['camuflado', 'colete'] as const); r.per = 'camuflada'; r.cAc = rng.pick([...P.OLIVA, ...P.CINZA]); r.cTor = rng.pick(P.OLIVA); r.moch = rng.pick(['pequena', 'grande', 'nenhuma'] as const); r.acs = ['cinto']; r.corpo = rng.pick(['normal', 'forte'] as const); r.arma = o.arma ?? rng.pick(['rifle', 'rifle', 'pistola', 'escopeta']); r.sujo = 0.15; break;
    case 'colosso': r.cab = 'careca'; r.tor = 'rasgada'; r.per = 'rasgada'; r.bot = 'descalco'; r.esc = rng.range(1.55, 1.75); r.mut = ['braco_grande_' + rng.pick(['E', 'D']), 'corcunda', 'veias', 'costelas', 'olhos', 'tumor']; r.cTor = rng.pick(P.BRANCO_SUJO); r.cPer = rng.pick(P.ESCURO); r.arma = ''; break;
    default: r.cab = rng.pick(['normal', 'bone', 'touca', 'comprido'] as const); r.tor = rng.pick(['jaqueta', 'camisa', 'colete'] as const);
  }
  if (r.tor === 'hazmat' || r.per === 'hazmat') { r.tor = 'hazmat'; r.per = 'hazmat'; r.cTor = r.cTor === undefined ? P.HAZMAT[0] : r.cTor; }
  return r;
}
