// Fauna modular: quadrúpedes (cão, lobo, javali, cervo, coelho, rato), insetos/aracnídeos (barata, escorpião, aranha) e aves (corvo).
// Cada receita varia tamanho, pelagem, orelhas, cauda, mutações e membros faltando.
import { Vox, carimbar, type Cor } from './vox';
import { raiz, ligar, colocar, type Parte, type Osso } from './rig';
import { Rng } from './rng';
import { mix, escurecer, clarear, ruido, hash3 } from './cor';
import * as P from './paletas';

// =============================================================== QUADRÚPEDES
export type RecQuad = {
  tipo: 'quad'; sem: number; esp: 'cao' | 'lobo' | 'javali' | 'cervo' | 'coelho' | 'rato';
  pelo: number; pelo2: number; tam: number; olho: number; hostil: boolean;
  orelha: 'pontuda' | 'caida' | 'longa' | 'redonda'; cauda: 'longa' | 'curta' | 'toco' | 'fina';
  mut: string[]; falta: string[]; galhada: boolean; presas: boolean;
};
type EspQ = { L: number; R: number; H: number; PL: number; PESC: number; CAB: number; FOC: number; TH: number; PW: number };
const ESPQ: Record<RecQuad['esp'], EspQ> = {
  cao: { L: 17, R: 3.6, H: 4.4, PL: 9, PESC: 3, CAB: 6, FOC: 3.5, TH: 0.45, PW: 3 },
  lobo: { L: 19, R: 3.9, H: 4.8, PL: 11, PESC: 4, CAB: 7, FOC: 4.2, TH: 0.4, PW: 3 },
  javali: { L: 17, R: 5.2, H: 5.6, PL: 7, PESC: 2, CAB: 7.5, FOC: 4.5, TH: 0.1, PW: 4 },
  cervo: { L: 18, R: 3.8, H: 4.8, PL: 14, PESC: 8, CAB: 6.5, FOC: 3.8, TH: 0.95, PW: 2 },
  coelho: { L: 8, R: 3, H: 3.5, PL: 4, PESC: 1, CAB: 4, FOC: 2, TH: 0.5, PW: 2 },
  rato: { L: 9, R: 2.2, H: 2.4, PL: 3, PESC: 1, CAB: 3.5, FOC: 2.6, TH: 0.3, PW: 2 },
};
export const GQX = 62, GQY = 28, GQZ = 50, CQX = 26, CQY = 14;
export type PoseQ = { dz?: number; raiz?: Osso; cab?: Osso; boca?: number; FE?: Osso; FD?: Osso; TE?: Osso; TD?: Osso; cauda?: Osso };
type PartesQ = { corpo: Parte; cab: Parte; jaw: Parte; leg: Parte[]; cauda: Parte; hinge: [number, number, number]; E: EspQ };
const cacheQ = new Map<string, PartesQ>();

function peloCor(r: RecQuad, base: number, x: number, y: number, z: number) {
  const h = hash3(x + r.sem, y, z); if (r.mut.includes('sarna') && h < 0.09) return h < 0.04 ? 0xb58a7a : 0x8a8478;
  if (r.mut.includes('cicatriz') && Math.abs(x - 14 - (z - 12) * 0.5) < 0.7 && y % 2 === 0) return 0xb58a7a; return ruido(x, y, z, 0.1, base);
}

function corpoQ(r: RecQuad, E: EspQ): Parte {
  const X = Math.ceil(E.L + 12), Y = Math.ceil(E.R * 2 + 6), Z = Math.ceil(E.H * 2 + 6), cx = X / 2, cy = Y / 2, cz = Z / 2, v = new Vox(X, Y, Z);
  const cor: Cor = (x, y, z) => { const t = (z - (cz - E.H)) / (2 * E.H); return peloCor(r, t < 0.34 ? r.pelo2 : r.pelo, x, y, z); };
  v.ell(cx + E.L * 0.22, cy, cz, E.L * 0.32, E.R * 1.05, E.H * 1.05, cor); v.ell(cx - E.L * 0.2, cy, cz - 0.2, E.L * 0.33, E.R * 0.95, E.H * 0.95, cor); v.ell(cx, cy, cz, E.L * 0.45, E.R, E.H * 0.92, cor);
  if (r.mut.includes('costelas')) for (let x = Math.round(cx - E.L * 0.12); x < cx + E.L * 0.32; x += 2) for (let z = Math.round(cz - E.H * 0.5); z < cz + E.H * 0.5; z++) { v.set(x, Math.round(cy - E.R - 0.2), z, 0xd0c8b0); v.set(x, Math.round(cy + E.R - 0.8), z, 0xd0c8b0); }
  if (r.mut.includes('espinhos')) for (let x = Math.round(cx - E.L * 0.35); x < cx + E.L * 0.3; x += 2) v.linha(x, cy, cz + E.H * 0.8, x - 1, cy, cz + E.H * 0.8 + 3, 1, 0xcfc8b0);
  if (r.mut.includes('tumor')) v.ell(cx - E.L * 0.1, cy + E.R * 0.8, cz + E.H * 0.6, 2.4, 2.2, 2.2, (x, y, z) => (hash3(x, y, z) < 0.15 ? 0xc8ff5a : ruido(x, y, z, 0.1, 0xb08a7a)));
  return { v, pivot: [cx, cy, cz] };
}

function cabecaQ(r: RecQuad, E: EspQ): { cab: Parte; jaw: Parte; hinge: [number, number, number] } {
  const hr = E.CAB / 2.2, N = E.PESC, th = E.TH, X = Math.ceil(N * Math.cos(th) + E.CAB + E.FOC + 10), Y = Math.ceil(hr * 2 + 10), Z = Math.ceil(N * Math.sin(th) + hr * 2 + 14), cy = Y / 2, bx = 3, bz = 4, v = new Vox(X, Y, Z);
  const pel: Cor = (x, y, z) => peloCor(r, r.pelo, x, y, z);
  for (let i = 0; i <= N * 2; i++) { const t = i / (N * 2), x = bx + t * N * Math.cos(th), z = bz + t * N * Math.sin(th); v.ell(x, cy, z, hr * 0.85, hr * 0.8, hr * 0.85, pel); }
  const hx = bx + N * Math.cos(th) + hr * 0.8, hz = bz + N * Math.sin(th) + hr * 0.3;
  v.ell(hx, cy, hz, hr * 1.05, hr * 0.95, hr * 0.9, pel);
  const sx0 = Math.round(hx + hr * 0.6), sx1 = Math.round(hx + hr * 0.6 + E.FOC); v.box(sx0, cy - hr * 0.45, hz - hr * 0.45, sx1, cy + hr * 0.45, hz + hr * 0.25, (x, y, z) => peloCor(r, mix(r.pelo, r.pelo2, 0.4), x, y, z));
  v.box(sx1 - 1, cy - 1, hz - 0.5, sx1 + 1, cy + 1, hz + 0.8, 0x14100e);
  const ex = Math.round(hx + hr * 0.62);
  for (const sg of [-1, 1]) { v.set(ex, Math.round(cy + sg * hr * 0.58 - 0.5), Math.round(hz + hr * 0.35), r.olho, r.hostil || r.mut.includes('olhos')); }
  const ear = (sg: number) => {
    const ey = cy + sg * hr * 0.72, ez = hz + hr * 0.8, exx = hx - hr * 0.3;
    if (r.falta.includes('orelha') && sg > 0) return;
    if (r.orelha === 'pontuda') v.linha(exx, ey, ez, exx - 1, ey + sg * 0.5, ez + 4, 2, pel);
    else if (r.orelha === 'longa') v.linha(exx, ey, ez, exx - 2, ey + sg * 1.2, ez + (r.esp === 'coelho' ? 8 : 5), 2, pel);
    else if (r.orelha === 'caida') v.box(exx - 1, ey - 1, ez - 3, exx + 1, ey + 1, ez, pel);
    else v.ell(exx, ey, ez, 1.8, 0.9, 1.8, mix(r.pelo, 0xb08a7a, 0.4));
  };
  ear(-1); ear(1);
  if (r.galhada) for (const sg of [-1, 1]) { const ey = cy + sg * hr * 0.6, ez = hz + hr * 0.9; v.linha(hx - hr * 0.3, ey, ez, hx - hr * 0.9, ey + sg * 2, ez + 6, 1, 0x8a7a5a); v.linha(hx - hr * 0.6, ey + sg, ez + 3.5, hx + hr * 0.2, ey + sg * 2.5, ez + 7, 1, 0x8a7a5a); v.linha(hx - hr * 0.9, ey + sg * 2, ez + 6, hx - hr * 1.6, ey + sg * 3, ez + 9, 1, 0x8a7a5a); }
  if (r.presas) for (const sg of [-1, 1]) v.linha(sx1 - 2, cy + sg * hr * 0.4, hz - hr * 0.4, sx1 - 1, cy + sg * hr * 0.5, hz + hr * 0.6, 1, 0xe4e0cc);
  const hinge: [number, number, number] = [hx - bx + hr * 0.1, 0, hz - bz - hr * 0.5];
  const jl = Math.round(hr + E.FOC), jw = new Vox(jl + 3, Math.ceil(hr * 1.4) + 2, 5), jy = jw.d / 2;
  jw.box(0, jy - hr * 0.5, 1, jl, jy + hr * 0.5, 3, (x, y, z) => peloCor(r, mix(r.pelo, r.pelo2, 0.6), x, y, z)); jw.box(1, jy - hr * 0.4, 3, jl - 1, jy + hr * 0.4, 4, 0x6a2a2a);
  if (r.hostil) for (let i = 2; i < jl - 1; i += 2) jw.set(i, jy - hr * 0.4, 4, 0xe8e4cf);
  return { cab: { v, pivot: [bx, cy, bz] }, jaw: { v: jw, pivot: [0, jy, 2] }, hinge: [hinge[0] + 0, 0, hinge[2]] };
}

function pernaQ(r: RecQuad, E: EspQ, falta: boolean): Parte {
  const v = new Vox(E.PW + 6, E.PW + 2, E.PL + 3), cx = (E.PW + 6) / 2 - 1, cy = (E.PW + 2) / 2, cor: Cor = (x, y, z) => peloCor(r, r.esp === 'cervo' ? mix(r.pelo, 0x3a2a1e, 0.2) : r.pelo, x, y, z);
  if (falta) { v.box(cx - 1, cy - E.PW / 2, E.PL - 3, cx + E.PW - 1, cy + E.PW / 2, E.PL + 1, cor); v.box(cx - 1, cy - E.PW / 2, E.PL - 4, cx + E.PW - 1, cy + E.PW / 2, E.PL - 3, (x, y, z) => (hash3(x, y, z) < 0.6 ? 0x6a1410 : 0xd0c8b0)); return { v, pivot: [cx + 0.5, cy, E.PL + 1] }; }
  for (let z = 0; z < E.PL; z++) { const w = z > E.PL * 0.55 ? E.PW : Math.max(1, E.PW - 1); v.box(cx - 1, cy - w / 2, z, cx - 1 + w, cy + w / 2, z + 1, cor); }
  v.box(cx - 1, cy - E.PW / 2, 0, cx + E.PW, cy + E.PW / 2, 1, r.esp === 'cervo' ? 0x1a1410 : mix(r.pelo, 0x000000, 0.45));
  return { v, pivot: [cx + 0.5, cy, E.PL + 1] };
}

function caudaQ(r: RecQuad, E: EspQ): Parte {
  const v = new Vox(16, 8, 14), cor = (x: number, y: number, z: number) => peloCor(r, r.pelo, x, y, z);
  if (r.falta.includes('cauda')) { v.box(10, 3, 5, 14, 5, 7, cor); return { v, pivot: [14, 4, 5] }; }
  if (r.cauda === 'longa') { v.linha(14, 4, 5, 6, 4, 9, 2, cor); v.linha(6, 4, 9, 3, 4, 12, 2, cor); }
  else if (r.cauda === 'fina') { v.linha(14, 4, 4, 8, 4, 3, 1, 0xb08a7a); v.linha(8, 4, 3, 2, 4, 6, 1, 0xb08a7a); }
  else if (r.cauda === 'curta') v.linha(14, 4, 5, 10, 4, 8, 2, cor); else v.ell(12, 4, 5, 2, 2, 2, mix(r.pelo2, 0xffffff, 0.3));
  return { v, pivot: [14, 4, 5] };
}

function partesQ(r: RecQuad): PartesQ {
  const k = JSON.stringify(r); const c = cacheQ.get(k); if (c) return c; const E = ESPQ[r.esp], h = cabecaQ(r, E);
  const p: PartesQ = { corpo: corpoQ(r, E), cab: h.cab, jaw: h.jaw, hinge: h.hinge, E, cauda: caudaQ(r, E), leg: ['pernaFE', 'pernaFD', 'pernaTE', 'pernaTD'].map(n => pernaQ(r, E, r.falta.includes(n))) };
  if (cacheQ.size > 60) cacheQ.delete(cacheQ.keys().next().value as string); cacheQ.set(k, p); return p;
}

export const CLIPES_QUAD: Record<string, { n: number; loop: boolean }> = { parado: { n: 2, loop: true }, andar: { n: 4, loop: true }, correr: { n: 4, loop: true }, morder: { n: 3, loop: false }, dano: { n: 1, loop: false }, morrer: { n: 4, loop: false } };
export function poseQuad(clip: string, i: number, r: RecQuad): PoseQ {
  const d = CLIPES_QUAD[clip] ?? CLIPES_QUAD.parado, t = d.loop ? i / d.n : i / Math.max(1, d.n - 1), s = Math.sin(t * Math.PI * 2), p: PoseQ = { cab: {}, FE: {}, FD: {}, TE: {}, TD: {}, cauda: {} };
  const coxo = r.falta.length > 0 && r.falta.some(f => f.startsWith('perna'));
  switch (clip) {
    case 'parado': p.dz = i % 2 ? -0.4 : 0; p.cauda!.rz = i % 2 ? 0.3 : -0.3; p.cab!.ry = i % 2 ? 0.05 : -0.05; break;
    case 'andar': p.FE!.ry = s * 0.55; p.TD!.ry = s * 0.55; p.FD!.ry = -s * 0.55; p.TE!.ry = -s * 0.55; p.dz = -Math.abs(s) * 0.6; p.cauda!.rz = s * 0.25; p.cab!.ry = s * 0.06; break;
    case 'correr': if (r.esp === 'coelho') { p.FE!.ry = p.FD!.ry = s * 0.9; p.TE!.ry = p.TD!.ry = -s * 0.9; p.dz = Math.max(0, Math.cos(t * Math.PI * 2)) * 3; } else { p.FE!.ry = p.FD!.ry = s * 0.9; p.TE!.ry = p.TD!.ry = -s * 0.9 + 0.2; p.raiz = { ry: s * 0.14 }; p.dz = Math.abs(Math.cos(t * Math.PI * 2)) * 1.2 - 0.5; } p.cauda!.rz = s * 0.15; p.cab!.ry = -0.12 + s * 0.1; break;
    case 'morder': p.raiz = { ry: [-0.12, 0.22, 0.05][i] }; p.cab!.ry = [-0.3, 0.55, 0.1][i]; p.boca = [0, 1, 0.3][i]; p.FE!.ry = [0.2, 0.8, 0.3][i]; p.FD!.ry = [0.2, 0.8, 0.3][i]; p.TE!.ry = [-0.2, -0.5, -0.1][i]; p.TD!.ry = [-0.2, -0.5, -0.1][i]; p.dz = [-1.5, 0.5, 0][i]; break;
    case 'dano': p.dz = -1; p.cab!.ry = -0.35; p.FE!.ry = 0.3; p.FD!.ry = 0.3; p.TE!.ry = -0.3; p.TD!.ry = -0.3; p.raiz = { ry: -0.1 }; break;
    case 'morrer': { const a = i / 3; p.raiz = { rx: -1.45 * a }; p.dz = -3 * a - 1; p.FE!.ry = 0.5 * a; p.FD!.ry = 0.6 * a; p.TE!.ry = -0.5 * a; p.TD!.ry = -0.6 * a; p.cab!.ry = -0.3 * a; break; }
  }
  if (coxo && (clip === 'andar' || clip === 'correr')) { p.dz = (p.dz ?? 0) - 2; p.raiz = { ...(p.raiz ?? {}), rx: 0.1 }; }
  return p;
}

export function montarQuad(r: RecQuad, pose: PoseQ): Vox {
  const P2 = partesQ(r), E = P2.E, out = new Vox(GQX, GQY, GQZ), zc = E.PL + E.H - 0.5 + (pose.dz ?? 0);
  const R = raiz([CQX, CQY, zc], pose.raiz);
  colocar(out, P2.corpo, R);
  const ys = E.R * 0.62, fx = E.L * 0.27, tx = -E.L * 0.25, lz = -E.H * 0.55;
  const legs: [number, number, Osso | undefined][] = [[fx, -ys, pose.FE], [fx, ys, pose.FD], [tx, -ys, pose.TE], [tx, ys, pose.TD]];
  legs.forEach(([x, y, o], i) => colocar(out, P2.leg[i], ligar(R, [x, y, lz], o)));
  const cabArt = ligar(R, [E.L * 0.38, 0, E.H * 0.35], pose.cab); colocar(out, P2.cab, cabArt);
  colocar(out, P2.jaw, ligar(cabArt, P2.hinge, { ry: -(pose.boca ?? (r.hostil ? 0.08 : 0)) * 0.7 }));
  colocar(out, P2.cauda, ligar(R, [-E.L * 0.5, 0, E.H * 0.2], pose.cauda));
  if (r.tam === 1) return out;
  const gr = new Vox(Math.ceil(GQX * r.tam), Math.ceil(GQY * r.tam), Math.ceil(GQZ * r.tam)); carimbar(gr, out, { pivot: [CQX, CQY, 0], pos: [CQX * r.tam, CQY * r.tam, 0], s: r.tam }); return gr;
}
export const centroQuad = (r: RecQuad): [number, number, number] => [CQX * r.tam, CQY * r.tam, Math.hypot(Math.max(CQX, GQX - CQX), Math.max(CQY, GQY - CQY)) * r.tam];

export function gerarQuad(rng: Rng, esp: RecQuad['esp'], o: { hostil?: boolean; alfa?: boolean } = {}): RecQuad {
  const pelos = esp === 'cervo' ? P.PELOS_CERVO : esp === 'rato' ? [0x4f4036, 0x5d4c40, 0x3a3128] : esp === 'coelho' ? [0x8a8478, 0x6a5a48, 0x9a8f80] : P.PELOS_CAO, pelo = rng.pick(pelos);
  const r: RecQuad = { tipo: 'quad', sem: rng.int(1, 99999), esp, pelo, pelo2: clarear(pelo, rng.range(0.15, 0.35)), tam: 1, olho: o.hostil === false ? 0x15110d : 0xff3a1a, hostil: o.hostil ?? (esp !== 'cervo' && esp !== 'coelho'),
    orelha: esp === 'cao' || esp === 'lobo' ? rng.pick(['pontuda', 'pontuda', 'caida'] as const) : esp === 'cervo' || esp === 'coelho' ? 'longa' : esp === 'rato' ? 'redonda' : 'pontuda', cauda: esp === 'cervo' || esp === 'javali' ? 'curta' : esp === 'coelho' ? 'toco' : esp === 'rato' ? 'fina' : rng.pick(['longa', 'longa', 'curta'] as const),
    mut: [], falta: [], galhada: esp === 'cervo' && rng.chance(0.7), presas: esp === 'javali' };
  r.tam = esp === 'cao' ? rng.range(0.9, 1.15) : esp === 'lobo' ? rng.range(1, 1.2) : esp === 'rato' ? rng.range(0.9, 1.4) : rng.range(0.95, 1.1);
  if (o.alfa) { r.tam *= 1.25; r.mut.push('cicatriz', 'costelas'); r.olho = 0xff6a1a; }
  for (const m of ['sarna', 'cicatriz', 'costelas', 'olhos', 'tumor', 'espinhos']) if (rng.chance(esp === 'cervo' || esp === 'coelho' ? 0.04 : 0.14)) r.mut.push(m);
  if (rng.chance(0.1)) r.falta.push(rng.pick(['pernaFE', 'pernaFD', 'pernaTE', 'pernaTD'])); if (rng.chance(0.08)) r.falta.push('orelha'); if (rng.chance(0.06)) r.falta.push('cauda');
  return r;
}

// =============================================================== INSETOS / ARACNÍDEOS
export type RecInseto = { tipo: 'inseto'; sem: number; esp: 'barata' | 'escorpiao' | 'aranha'; cor: number; cor2: number; tam: number; olho: number; mut: string[]; falta: string[] };
export const GIX = 60, GIY = 48, GIZ = 30, CIX = 24, CIY = 24;
export type PoseI = { dz?: number; raiz?: Osso; cauda?: Osso; garra?: number; leg?: number; antena?: number };
type PartesI = { corpo: Parte; legR: Parte; legL: Parte; cauda?: Parte; garraR?: Parte; garraL?: Parte; n: number; L: number; R: number; Hh: number };
const cacheI = new Map<string, PartesI>();

function partesI(r: RecInseto): PartesI {
  const k = JSON.stringify(r); const c = cacheI.get(k); if (c) return c;
  const esc = r.esp === 'barata' ? { L: 12, R: 3.4, H: 2.4, n: 3 } : r.esp === 'escorpiao' ? { L: 14, R: 4, H: 2.6, n: 4 } : { L: 8, R: 4.2, H: 4, n: 4 };
  const X = esc.L + 14, Y = esc.R * 2 + 8, Z = 14, cx = X / 2, cy = Y / 2, cz = 6, v = new Vox(X, Y, Z), cor: Cor = (x, y, z) => { const h = hash3(x + r.sem, y, z); return h < 0.05 && r.mut.includes('sarna') ? 0x7a8a3a : ruido(x, y, z, 0.12, z > cz ? r.cor : r.cor2); };
  if (r.esp === 'barata') { v.ell(cx - esc.L * 0.12, cy, cz, esc.L * 0.42, esc.R, esc.H, cor); v.ell(cx + esc.L * 0.3, cy, cz, esc.L * 0.2, esc.R * 0.7, esc.H * 0.9, cor); v.ell(cx + esc.L * 0.5, cy, cz, esc.L * 0.12, esc.R * 0.4, esc.H * 0.8, cor); }
  else if (r.esp === 'escorpiao') { v.ell(cx, cy, cz, esc.L * 0.42, esc.R, esc.H, cor); v.ell(cx + esc.L * 0.4, cy, cz, esc.L * 0.16, esc.R * 0.6, esc.H * 0.9, cor); for (let i = -3; i <= 3; i += 2) v.box(cx + i, cy - 1, cz + esc.H - 0.5, cx + i + 1, cy + 1, cz + esc.H + 1, escurecer(r.cor, 0.3)); }
  else { v.ell(cx - esc.L * 0.25, cy, cz + 1, esc.L * 0.5, esc.R, esc.H, cor); v.ell(cx + esc.L * 0.35, cy, cz + 0.6, esc.L * 0.28, esc.R * 0.6, esc.H * 0.7, cor); }
  for (const sg of [-1, 1]) v.set(Math.round(cx + esc.L * (r.esp === 'barata' ? 0.58 : r.esp === 'escorpiao' ? 0.52 : 0.58)), Math.round(cy + sg * esc.R * 0.3 - 0.5), cz + 1, r.olho, true);
  const body: Parte = { v, pivot: [cx, cy, cz] };
  const leg = new Vox(3, 16, 12), up = r.esp === 'aranha' ? 5 : r.esp === 'barata' ? 1.5 : 2.5, reach = r.esp === 'aranha' ? 14 : r.esp === 'barata' ? 7 : 10, pata = (x: number, y: number, z: number) => ruido(x, y, z, 0.12, r.cor2); leg.linha(1, 0, 6, 1, reach * 0.4, 6 + up, 1, pata); leg.linha(1, reach * 0.4, 6 + up, 1, reach, 0, 1, pata);
  const p: PartesI = { corpo: body, legR: { v: leg, pivot: [1, 0, 6] }, legL: { v: leg.espelhar(), pivot: [1, 15, 6] }, n: esc.n, L: esc.L, R: esc.R, Hh: esc.H };
  if (r.esp === 'escorpiao') {
    const tv = new Vox(26, 8, 24); let x = 24, z = 3; let a = 0; for (let k = 0; k < 8; k++) { a += 0.32; x -= Math.cos(a) * 2.6; z += Math.sin(a) * 2.6; tv.ell(x, 4, z, 2 - k * 0.1, 2 - k * 0.1, 2 - k * 0.1, (xx, yy, zz) => ruido(xx, yy, zz, 0.12, r.cor)); }
    tv.linha(x, 4, z, x + 3, 4, z - 2, 1, 0x6a1a14); p.cauda = { v: tv, pivot: [24, 4, 3] };
    const g = new Vox(16, 10, 6); g.linha(0, 5, 2, 8, 3, 2, 2, r.cor); g.ell(11, 3, 2, 3.5, 1.6, 1.6, r.cor); g.ell(11, 6, 2, 3.5, 1.4, 1.4, r.cor); g.set(13, 4, 2, 0x000000); p.garraR = { v: g, pivot: [0, 5, 2] }; p.garraL = { v: g.espelhar(), pivot: [0, 4, 2] };
  }
  if (cacheI.size > 40) cacheI.delete(cacheI.keys().next().value as string); cacheI.set(k, p); return p;
}
export const CLIPES_INSETO: Record<string, { n: number; loop: boolean }> = { parado: { n: 1, loop: true }, andar: { n: 4, loop: true }, atacar: { n: 2, loop: false }, dano: { n: 1, loop: false }, morrer: { n: 2, loop: false } };
export function poseInseto(clip: string, i: number): PoseI {
  const t = i / (CLIPES_INSETO[clip]?.n ?? 1), s = Math.sin(t * Math.PI * 2), p: PoseI = {};
  switch (clip) { case 'andar': p.leg = s; p.antena = s; p.dz = -Math.abs(s) * 0.3; break; case 'atacar': p.cauda = { ry: i ? 0.9 : -0.1 }; p.garra = i ? 1 : 0; p.raiz = { ry: i ? 0.15 : 0 }; break; case 'dano': p.dz = -0.5; break; case 'morrer': p.raiz = { rx: i ? 3.0 : 1.2 }; p.dz = i ? -1 : 0; p.leg = 1.2; break; }
  return p;
}
export function montarInseto(r: RecInseto, pose: PoseI): Vox {
  const P2 = partesI(r), out = new Vox(GIX, GIY, GIZ), R = raiz([CIX, CIY, 6 + (pose.dz ?? 0)], pose.raiz);
  colocar(out, P2.corpo, R);
  const n = P2.n, base = r.esp === 'barata' ? 0.35 : 0.5;
  for (let i = 0; i < n; i++) {
    const x = P2.L * (0.3 - (0.6 * i) / Math.max(1, n - 1)), rz0 = (r.esp === 'aranha' ? 0.9 - i * 0.55 : 0.55 - i * 0.55) * 0.7, sw = (pose.leg ?? 0) * 0.5 * (i % 2 ? 1 : -1);
    if (!r.falta.includes('leg' + i)) { colocar(out, P2.legR, ligar(R, [x, P2.R * 0.7, -1], { rz: -rz0 * 0.5 + sw - base * 0 })); colocar(out, P2.legL, ligar(R, [x, -P2.R * 0.7, -1], { rz: rz0 * 0.5 - sw })); }
  }
  if (P2.cauda) colocar(out, P2.cauda, ligar(R, [-P2.L * 0.35, 0, 1], pose.cauda));
  if (P2.garraR && P2.garraL) { const ab = (pose.garra ?? 0) * 0.5; colocar(out, P2.garraR, ligar(R, [P2.L * 0.45, P2.R * 0.45, 0], { rz: -0.35 - ab })); colocar(out, P2.garraL, ligar(R, [P2.L * 0.45, -P2.R * 0.45, 0], { rz: 0.35 + ab })); }
  if (r.tam === 1) return out;
  const gr = new Vox(Math.ceil(GIX * r.tam), Math.ceil(GIY * r.tam), Math.ceil(GIZ * r.tam)); carimbar(gr, out, { pivot: [CIX, CIY, 0], pos: [CIX * r.tam, CIY * r.tam, 0], s: r.tam }); return gr;
}
export const centroInseto = (r: RecInseto): [number, number, number] => [CIX * r.tam, CIY * r.tam, Math.hypot(CIX, CIY) * r.tam];
export function gerarInseto(rng: Rng, esp: RecInseto['esp']): RecInseto {
  const cores = esp === 'barata' ? [0x4a2f1c, 0x3a2418, 0x5a3a22] : esp === 'escorpiao' ? [0xa8884a, 0x7a6a3a, 0x4a3f2c, 0x8a5a2a] : [0x2a2420, 0x3a3228, 0x1d1a18];
  const cor = rng.pick(cores); const r: RecInseto = { tipo: 'inseto', sem: rng.int(1, 99999), esp, cor, cor2: escurecer(cor, 0.3), tam: esp === 'barata' ? rng.range(0.9, 1.4) : esp === 'escorpiao' ? rng.range(0.9, 1.5) : rng.range(0.9, 1.3), olho: 0xff3a1a, mut: [], falta: [] };
  if (rng.chance(0.12)) r.mut.push('sarna'); if (rng.chance(0.15)) r.falta.push('leg' + rng.int(0, 3)); return r;
}

// =============================================================== AVES
export type RecAve = { tipo: 'ave'; sem: number; pena: number; tam: number; bico: number; mut: string[] };
export const GAX = 40, GAY = 44, GAZ = 28, CAX = 16, CAY = 22;
export type PoseA = { dz?: number; raiz?: Osso; asa?: number; cab?: Osso };
type PartesA = { corpo: Parte; asaR: Parte; asaL: Parte };
const cacheA = new Map<string, PartesA>();
function partesA(r: RecAve): PartesA {
  const k = JSON.stringify(r); const c = cacheA.get(k); if (c) return c; const pen: Cor = (x, y, z) => ruido(x, y, z, 0.14, r.pena);
  const v = new Vox(26, 12, 20), cx = 11, cy = 6, cz = 8; v.ell(cx, cy, cz, 6.5, 3.1, 3.1, pen); v.ell(cx + 6.5, cy, cz + 3, 2.8, 2.6, 2.8, pen); v.box(cx + 8, cy - 0.5, cz + 2, cx + 12, cy + 1, cz + 4, r.bico);
  v.set(cx + 8, cy - 1, cz + 4, 0xd8d0a0, true); v.set(cx + 8, cy + 1, cz + 4, 0xd8d0a0, true); v.linha(cx - 5, cy, cz, cx - 12, cy, cz - 1, 3, pen);
  v.linha(cx, cy - 1, cz - 3, cx, cy - 1, 1, 1, 0x2a2420); v.linha(cx, cy + 1, cz - 3, cx, cy + 1, 1, 1, 0x2a2420);
  if (r.mut.includes('olhos')) { v.set(cx + 8, cy - 1, cz + 4, 0xff3a1a, true); v.set(cx + 8, cy + 1, cz + 4, 0xff3a1a, true); }
  const w = new Vox(18, 20, 5); for (let j = 0; j < 19; j++) { const len = Math.max(5, Math.round(14 - j * 0.45)), x0 = 9 - Math.round(len * 0.35); w.box(x0, j, 1, x0 + len, j + 1, 3, (x, y, z) => (j > 11 && (x + j) % 3 === 0 ? 0x6a6a7a : ruido(x, y, z, 0.16, mix(r.pena, 0x4a4a5e, j / 28)))); }
  const p = { corpo: { v, pivot: [cx, cy, cz] as [number, number, number] }, asaR: { v: w, pivot: [9, 0, 2] as [number, number, number] }, asaL: { v: w.espelhar(), pivot: [9, 19, 2] as [number, number, number] } };
  if (cacheA.size > 20) cacheA.delete(cacheA.keys().next().value as string); cacheA.set(k, p); return p;
}
export const CLIPES_AVE: Record<string, { n: number; loop: boolean }> = { pousado: { n: 2, loop: true }, voar: { n: 4, loop: true }, dano: { n: 1, loop: false }, morrer: { n: 1, loop: false } };
export function poseAve(clip: string, i: number): PoseA {
  const t = i / (CLIPES_AVE[clip]?.n ?? 1), s = Math.sin(t * Math.PI * 2), p: PoseA = {};
  if (clip === 'voar') { p.asa = s * 0.9 + 0.2; p.raiz = { ry: -0.15 }; p.dz = 8 - s; } else if (clip === 'pousado') { p.asa = -1.35; p.cab = { ry: i ? 0.25 : -0.1 }; p.dz = 0; } else if (clip === 'morrer') { p.asa = -0.4; p.raiz = { rx: 3.0 }; p.dz = -2; } else { p.asa = -1.2; }
  return p;
}
export function montarAve(r: RecAve, pose: PoseA): Vox {
  const P2 = partesA(r), out = new Vox(GAX, GAY, GAZ), R = raiz([CAX, CAY, 5 + (pose.dz ?? 0)], pose.raiz); colocar(out, P2.corpo, R);
  const a = pose.asa ?? -1.2; colocar(out, P2.asaR, ligar(R, [0, 3, 2], { rx: a })); colocar(out, P2.asaL, ligar(R, [0, -3, 2], { rx: -a }));
  if (r.tam === 1) return out; const gr = new Vox(Math.ceil(GAX * r.tam), Math.ceil(GAY * r.tam), Math.ceil(GAZ * r.tam)); carimbar(gr, out, { pivot: [CAX, CAY, 0], pos: [CAX * r.tam, CAY * r.tam, 0], s: r.tam }); return gr;
}
export const centroAve = (r: RecAve): [number, number, number] => [CAX * r.tam, CAY * r.tam, Math.hypot(CAX, CAY) * r.tam];
export function gerarAve(rng: Rng): RecAve { return { tipo: 'ave', sem: rng.int(1, 99999), pena: rng.pick(P.PENAS), tam: rng.range(0.9, 1.25), bico: 0x2a2620, mut: rng.chance(0.1) ? ['olhos'] : [] }; }
