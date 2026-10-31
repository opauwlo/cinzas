import * as Phaser from 'phaser';
import * as ROT from 'rot-js';
import { gerarZona, W, H, T, idx, dentro, type Zona, type Prop, type FloraObj } from './zona';
import { assarChao, CH } from './chao';
import { ang, sstep, dirTela, proj } from './util';
import { Fabrica, chaveRec, clipesDe, type Quadro } from './lib/fabrica';
import { construirEstatico, type RecEstatica } from './lib/estatico';
import type { RecEstr } from './lib/props';
import { Rng } from './lib/rng';
import { gerarHumano, type RecHumano } from './lib/humano';
import { gerarFlora } from './lib/flora';
import { armaDe, pesoDe } from './dados/itens';
import { BIOMAS, type Bioma } from './dados/biomas';
import { biomaDe } from './dados/meta';
import { localPorId } from './dados/locais';
import { ARQS, type Arq } from './dados/criaturas';
import { useJogo, horaStr, pesoMax, OBJETIVOS } from './store';
import { ponte } from './ponte';
import { sfx, ambiente, setGeiger, setBatimento, aplicarVolumes, trovao } from './audio';
import { Clima, luzDia, gradeCor, sombraSol } from './sistemas/clima';
import { Particulas } from './sistemas/particulas';
import { novoZEstado, salvarRun, type Run, type ZEstado } from './sistemas/salvar';
import { atualizarEnt, criarEnt, atacarJogador, iniciarMorte, type Ent } from './sistemas/ia';
import { montarInterativos, instalarComandos, aguaInter, tickHortas, type Interativo, executarMorte } from './sistemas/acoes';
import { iniciarZona, atualizarDiretor, desenharBeacon, setaAirdrop, type Airdrop, type Raid } from './sistemas/diretor';
import { DIF, dif, pk, melNivel, ganharXp, registrar, tickProgresso } from './sistemas/progresso';

export const MIN_POR_SEG = 1440 / (14 * 60);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
export { ang, dirTela, proj };
let FAB: Fabrica | null = null;
export const resetarFabrica = () => { FAB = null; };

type Rastreado = { spr: Phaser.GameObjects.Image; i: number; lvl: number };
type FloraSpr = { f: FloraObj; spr: Phaser.GameObjects.Image; fase: number; q: Quadro; sw?: number; r1?: RecEstatica; r2?: RecEstatica };
type PropSpr = { p: Prop; spr: Phaser.GameObjects.Image; rast: Rastreado };
export type Jog = { x: number; y: number; ang: number; passo: number; andando: boolean; spr: Phaser.GameObjects.Image; som: Phaser.GameObjects.Image; lvl: number; dano: number; atk: number; atkDur: number; morrendo: number; rec: RecHumano; ultimoPasso: number };

export class Cena extends Phaser.Scene {
  fab!: Fabrica; zona!: Zona; bioma!: Bioma; clima!: Clima; part!: Particulas; ze!: ZEstado; s!: Run;
  chunks = new Map<string, { img: Phaser.GameObjects.Image; paredes: Rastreado[] }>();
  props: PropSpr[] = []; floras: FloraSpr[] = []; portas = new Map<number, { aberta: boolean; spr: Phaser.GameObjects.Image; horiz: boolean; t: number; rast: Rastreado }>();
  ents: Ent[] = []; cadaveres: Ent[] = []; interativos: Interativo[] = []; luzes: { x: number; y: number; r: number; cor: number; f: number; noite: boolean; glow?: Phaser.GameObjects.Image }[] = [];
  jog!: Jog; jogBase!: RecHumano; recCache = new Map<string, RecHumano>();
  lmA = new Float32Array(W * H).fill(0.9); seen = new Uint8Array(W * H); luzFrame = new Float32Array(W * H);
  fogC!: Phaser.Textures.CanvasTexture; fogD!: ImageData; fogImg!: Phaser.GameObjects.Image; climaC!: Phaser.Textures.CanvasTexture; climaD!: ImageData; climaImg!: Phaser.GameObjects.Image; grade!: Phaser.GameObjects.Rectangle;
  gfx!: Phaser.GameObjects.Graphics; marca!: Phaser.GameObjects.Graphics; gChao!: Phaser.GameObjects.Graphics; gAr!: Phaser.GameObjects.Graphics;
  teclas!: Record<string, Phaser.Input.Keyboard.Key>; acao: { rotulo: string; dur: number; t: number; fim: () => void; ruido?: number } | null = null;
  tracers: { x0: number; y0: number; x1: number; y1: number; t: number; cor: number }[] = []; aneis: { x: number; y: number; r: number; t: number }[] = [];
  pronto = false; morto = false; vitoria = false; ambient = 1; hitstop = 0; cdAtaque = 0; tSync = 0; tAlvo = 0; tRuido = 0; tSpawn = 0; tPortas = 0; tCut = 0; tAmb = 0; tSave = 0; tSeg = 0; tFlora = 0; tDicas = 0; flashRaio = 0;
  camX = 0; camY = 0; pathBudget = 3; desktop = false; mouse = { x: 0, y: 0, ativo: false, baixo: false }; radSuave = 0; interior = false; alvoInter: Interativo | null = null; tapVisto = 0; esc = 2; fogW = 0; fogH = 0;
  evPend: import('./sistemas/acoes').EvPend | null = null;
  fz = 2; cz = 1; fogLw = 0; fogLh = 0; climaLw = 0; climaLh = 0;
  airdrop: Airdrop | null = null; raid: Raid | null = null; perkAvisado = 0; novasConquistas: string[] = [];
  tarefas: (() => void)[] = []; totalTarefas = 1; estCache = new Map<string, Quadro>(); recToco!: RecEstatica; pausadoPor = false; noiteAnterior = false; tempo = 0; trava = false; intro = 0;
  _dados!: { run: Run; zonaId: string; esc: number };

  constructor() { super('cena'); }
  init(d: { run: Run; zonaId: string; esc?: number }) {
    this._dados = { run: d.run, zonaId: d.zonaId, esc: d.esc ?? 2 }; this.s = d.run; this.s.zonaId = d.zonaId;
    this.chunks = new Map(); this.props = []; this.floras = []; this.portas = new Map(); this.ents = []; this.cadaveres = []; this.interativos = []; this.luzes = []; this.tracers = []; this.aneis = []; this.estCache = new Map(); this.recCache = new Map();
    this.lmA.fill(0.9); this.seen.fill(0); this.luzFrame.fill(0); this.pronto = false; this.morto = false; this.vitoria = false; this.acao = null; this.alvoInter = null; this.tempo = 0; this.trava = false; this.intro = 0;
    this.fogW = 0; this.fogH = 0; // a mesma instância da cena é reaproveitada na viagem: força recriar as camadas (as antigas foram destruídas)
  }
  private aoRedimensionar = () => this.criarCamadas();

  // ------------------------------------------------------------------ carga (arte aos poucos, sem travar)
  create() {
    const reg = (k: string, c: HTMLCanvasElement) => { if (this.textures.exists(k)) this.textures.remove(k); this.textures.addCanvas(k, c); }, rem = (k: string) => { if (this.textures.exists(k)) this.textures.remove(k); };
    if (!FAB) FAB = new Fabrica(reg, rem); else FAB.vincular(reg, rem); this.fab = FAB;
    this.esc = this._dados.esc; this.cameras.main.setRoundPixels(true);
    const loc = localPorId(this.s.zonaId); this.bioma = biomaDe(loc.bioma, loc.tema); this.zona = gerarZona(loc.id, loc.bioma, this.s.seed, loc.nome, loc.tema);
    this.ze = this.s.zonas[loc.id] ??= novoZEstado();
    if (this.ze.ultima && this.s.minutos - this.ze.ultima > 3 * 1440) { const h = this.ze.hortas, f = this.ze.fogueiras; Object.assign(this.ze, novoZEstado(), { hortas: h, fogueiras: f }); }
    for (const p of this.zona.props) { if (this.ze.saqueados.includes(p.id)) { p.aberto = true; p.loot = []; for (const i of p.inters) if (i.k === 'saque') i.feito = true; } if (this.ze.desmontados.includes(p.id)) for (const i of p.inters) if (i.k === 'desmontar') i.feito = true; if (this.ze.rasgados.includes(p.id)) for (const i of p.inters) if (i.k === 'rasgar') i.feito = true; }
    for (const f of this.zona.flora) if (this.ze.cortadas.includes(f.id)) f.cortada = true;
    this.zona.spawns = this.zona.spawns.filter(sp => !this.ze.abatidos.includes(sp.id));
    this.clima = new Clima(this.s.seed + '|' + loc.id + '|' + Math.floor(this.s.minutos / 1440), this.bioma, this.s.minutos);
    this.clima.aoRaio = atraso => { this.flashRaio = 1; this.cameras.main.flash(140, 235, 240, 255); trovao(atraso); };
    this.part = new Particulas(); this.recToco = gerarFlora(new Rng('toco'), 'toco', '');
    // jogador (receita base fixa por seed)
    this.jogBase = gerarHumano(new Rng(this.s.seed + '|jogador'), 'sobrevivente');
    // tarefas de pré-carga das texturas estáticas desta zona
    const recs = new Map<string, RecEstatica>(), add = (r: RecEstatica) => recs.set(chaveRec(r), r); add(this.recToco);
    for (const p of this.zona.props) add(p.rec); for (const f of this.zona.flora) add(f.rec);
    const est = new Set<number>(); for (let i = 0; i < W * H; i++) { const t = this.zona.tipos[i]; if (t === T.PAREDE || t === T.JANELA || t === T.RUINA) est.add(this.zona.estilo[i] % 4); }
    for (const e of est) for (const alto of ['a', 'b'] as const) { add({ tipo: 'estr', n: 'parede', estilo: e, alto, sem: 1 }); add({ tipo: 'estr', n: 'janela', estilo: e, alto, sem: 1 }); add({ tipo: 'estr', n: 'ruina', estilo: e, alto: 'a', sem: 1 }); }
    for (const o of [0, 1] as const) for (const n of ['porta', 'portaA'] as const) add({ tipo: 'estr', n, estilo: 0, alto: 'a', sem: 0, o });
    if (loc.id === 'base') for (let v = 0; v < 4; v++) add({ tipo: 'prop', n: 'horta', v, d: 0, o: 0, sem: 1 });
    this.tarefas = [...recs.values()].filter(r => !this.fab.temEstatico(chaveRec(r))).map(r => () => this.est(r)); this.totalTarefas = Math.max(1, this.tarefas.length);
    useJogo.setState({ carga: this.tarefas.length ? 0 : 0.99, zonaNome: loc.nome, zonaId: loc.id, biomaId: loc.bioma });
  }
  est(rec: RecEstatica): Quadro { const k = chaveRec(rec); let q = this.estCache.get(k) ?? this.fab.temEstatico(k); if (!q) { const m = construirEstatico(rec); q = this.fab.estatico(k, () => m.v, { R: m.R, mcx: m.mcx, mcy: m.mcy, yaw: m.yaw }); } this.estCache.set(k, q); return q; }
  img(x: number, y: number, q: Quadro) { return this.add.image(x, y, q.key).setOrigin(q.ox / q.w, q.oy / q.h); }
  setQ(spr: Phaser.GameObjects.Image, q: Quadro) { spr.setTexture(q.key).setOrigin(q.ox / q.w, q.oy / q.h); }

  iniciar() {
    const z = this.zona, loc = localPorId(z.id);
    // chão, props, flora, portas
    for (const p of z.props) {
      const q = this.est(p.rec), [sx, sy] = proj(p.x + p.w / 2, p.y + p.h / 2), spr = this.img(sx, sy, q).setDepth(p.rec.n === 'bunker' ? -5000 : (p.x + p.y + (p.w + p.h) / 2) * 10 - (p.w + p.h) * 4);
      this.props.push({ p, spr, rast: { spr, i: idx(Math.min(W - 1, p.x + (p.w >> 1)), Math.min(H - 1, p.y + (p.h >> 1))), lvl: -1 } });
      if (p.aberto && p.loot && !p.loot.length) spr.setAlpha(0.8);
      if (p.luz) this.luzes.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, r: p.luz.r, cor: p.luz.cor, f: p.luz.f, noite: p.luz.noite });
    }
    for (const f of z.flora) { const rec = f.cortada ? this.recToco : f.rec, q = this.est(rec), [sx, sy] = proj(f.x, f.y), spr = this.img(sx, sy, q).setDepth((f.x + f.y) * 10); this.floras.push({ f, spr, fase: Math.random() * 6.28, q }); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (z.tipos[idx(x, y)] === T.PORTA) {
      const horiz = z.tipos[idx(x - 1, y)] === T.PAREDE || z.tipos[idx(x + 1, y)] === T.PAREDE, q = this.est({ tipo: 'estr', n: 'porta', estilo: 0, alto: 'a', sem: 0, o: horiz ? 0 : 1 } as RecEstr), [sx, sy] = proj(x + 0.5, y + 0.5);
      const spr = this.img(sx, sy, q).setDepth((x + y + 1) * 10 - 1); this.portas.set(idx(x, y), { aberta: false, spr, horiz, t: 0, rast: { spr, i: idx(x, y), lvl: -1 } });
    }
    for (const f of this.ze.fogueiras) this.criarFogueira(f.x, f.y, false);
    // jogador
    const sx0 = this.s.px ?? z.jogador.x + 0.5, sy0 = this.s.py ?? z.jogador.y + 0.5; this.s.px = undefined; this.s.py = undefined;
    this.jog = { x: sx0, y: sy0, ang: Math.PI / 4, passo: 0, andando: false, spr: this.add.image(0, 0, '__DEFAULT'), som: this.add.image(0, 0, 'sombra'), lvl: 0, dano: 0, atk: 0, atkDur: 0.3, morrendo: 0, rec: this.recJog(), ultimoPasso: 0 };
    const so = document.createElement('canvas'); so.width = 22; so.height = 11; const sg = so.getContext('2d')!; sg.fillStyle = 'rgba(0,0,0,.5)';
    for (let y = 0; y < 11; y++) for (let x = 0; x < 22; x++) { const dx = (x + 0.5 - 11) / 11, dy = (y + 0.5 - 5.5) / 5.5; if (dx * dx + dy * dy < 1 && ((x + y) % 2 === 0 || dx * dx + dy * dy < 0.55)) sg.fillRect(x, y, 1, 1); }
    if (this.textures.exists('sombra')) this.textures.remove('sombra'); this.textures.addCanvas('sombra', so); this.jog.som.setTexture('sombra'); this.jog.spr.setVisible(false);
    const gl = document.createElement('canvas'); gl.width = gl.height = 64; const gg = gl.getContext('2d')!; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = Math.hypot(x - 32, y - 32) / 32; if (d < 1 && (1 - d) * 5 > BAYER[(y & 3) * 4 + (x & 3)] * 5) { gg.fillStyle = `rgba(255,255,255,${Math.pow(1 - d, 1.5) * 0.9})`; gg.fillRect(x, y, 1, 1); } }
    if (this.textures.exists('glow')) this.textures.remove('glow'); this.textures.addCanvas('glow', gl);
    const fl = document.createElement('canvas'); fl.width = fl.height = 17; const fg = fl.getContext('2d')!; fg.fillStyle = '#fff2b0'; for (let i = -8; i <= 8; i++) { const a = 8 - Math.abs(i); fg.fillRect(8 + i, 8, 1, 1); fg.fillRect(8, 8 + i, 1, 1); if (a > 3) fg.fillRect(8 + i, 8 - ((a - 3) >> 1), 1, 1); } fg.fillStyle = '#ffd070'; fg.fillRect(5, 5, 7, 7); fg.fillStyle = '#fff8d8'; fg.fillRect(7, 7, 3, 3);
    if (this.textures.exists('clarao')) this.textures.remove('clarao'); this.textures.addCanvas('clarao', fl);
    for (const l of this.luzes) l.glow = this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(89000).setTint(l.cor).setAlpha(0);
    // criaturas
    for (const sp of z.spawns) criarEnt(this, sp.arq, sp.x + 0.5, sp.y + 0.5, sp.id, sp.grupo, sp.faccao);
    // camadas de efeito
    this.gChao = this.add.graphics().setDepth(-4000); this.gAr = this.add.graphics().setDepth(88000); this.gfx = this.add.graphics().setDepth(90000); this.marca = this.add.graphics().setDepth(90001);
    this.clarao = this.add.image(0, 0, 'clarao').setDepth(90002).setVisible(false);
    this.criarCamadas(); this.scale.off('resize', this.aoRedimensionar); this.scale.on('resize', this.aoRedimensionar);
    this.teclas = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,F,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.desktop = !window.matchMedia('(pointer: coarse)').matches;
    if (this.desktop) {
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => { this.mouse.x = (p.worldX / 16 + p.worldY / 8) / 2; this.mouse.y = (p.worldY / 8 - p.worldX / 16) / 2; this.mouse.ativo = true; });
      this.input.on('pointerdown', () => { this.mouse.baixo = true; }); this.input.on('pointerup', () => { this.mouse.baixo = false; });
      this.input.keyboard!.on('keydown-E', () => ponte.cmd?.interagir()); this.input.keyboard!.on('keydown-F', () => ponte.cmd?.lanterna()); this.input.keyboard!.on('keydown-Q', () => ponte.cmd?.trocarArma());
      for (const [k, v] of [['ONE', 'agua'], ['TWO', 'comida'], ['THREE', 'curar'], ['FOUR', 'antirrad']] as const) this.input.keyboard!.on('keydown-' + k, () => ponte.cmd?.usarRapido(v));
    }
    const [jx, jy] = proj(this.jog.x, this.jog.y, 16); this.camX = jx; this.camY = jy;
    for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 1; cx++) this.assar(Math.floor(this.jog.x / CH) + cx, Math.floor(this.jog.y / CH) + cy);
    this.fov = new ROT.FOV.PreciseShadowcasting((x, y) => dentro(x, y) && !this.zona.opaco[idx(x, y)]);
    montarInterativos(this); instalarComandos(this);
    const ult = this.s.zonas[loc.id]; void ult; this.ze.ultima = this.s.minutos; this.interior = false;
    this.events.once('shutdown', () => { ponte.cmd = null; this.scale.off('resize', this.aoRedimensionar); });
    this.pronto = true; useJogo.setState({ carga: 1 }); this.sincronizar(); this.salvar(); this.intro = 1; this.cameras.main.fadeIn(500, 5, 4, 6);
    if (loc.id !== 'base') useJogo.getState().toast('Chegada: ' + loc.nome, '#8fe36a'); this.verPois(); iniciarZona(this);
  }
  fov!: InstanceType<typeof ROT.FOV.PreciseShadowcasting>; clarao!: Phaser.GameObjects.Image;
  /** auxiliar de teste (playtests headless): cria uma criatura perto do jogador */
  dev(arq: string, dx: number, dy: number, grupo = -1, faccao?: number) { return criarEnt(this, arq, this.jog.x + dx, this.jog.y + dy, null, grupo, faccao); }
  devXp(n: number) { ganharXp(this, n); }
  /** forçadores de teste: 'raid' (invasão agora) e 'airdrop' (na próxima zona); devEv = id do evento de viagem */
  devForcar: string | null = null; devEv: string | null = null;
  criarCamadas() {
    const w = this.scale.width, h = this.scale.height; if (w === this.fogW && h === this.fogH && this.fogImg) return; this.fogW = w; this.fogH = h;
    for (const k of ['fog', 'clima']) if (this.textures.exists(k)) this.textures.remove(k);
    this.fogImg?.destroy(); this.climaImg?.destroy(); this.grade?.destroy();
    this.fz = this.esc < 1.75 ? 2 : 1; this.cz = this.esc < 1.25 ? 2 : 1; this.fogLw = Math.ceil(w / this.fz); this.fogLh = Math.ceil(h / this.fz); this.climaLw = Math.ceil(w / this.cz); this.climaLh = Math.ceil(h / this.cz);
    this.fogC = this.textures.createCanvas('fog', this.fogLw, this.fogLh)!; this.fogD = this.fogC.context.createImageData(this.fogLw, this.fogLh); this.fogImg = this.add.image(0, 0, 'fog').setOrigin(0).setScrollFactor(0).setDepth(-9000).setScale(this.fz);
    this.climaC = this.textures.createCanvas('clima', this.climaLw, this.climaLh)!; this.climaD = this.climaC.context.createImageData(this.climaLw, this.climaLh); this.climaImg = this.add.image(0, 0, 'clima').setOrigin(0).setScrollFactor(0).setDepth(86000).setVisible(false).setScale(this.cz);
    this.grade = this.add.rectangle(0, 0, w, h, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(85000).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }
  recJog(): RecHumano {
    const inv = this.s.inv, k = `${this.s.arma}|${this.s.mascara}|${inv.mochila ? 1 : 0}|${inv.colete ? 1 : 0}`, c = this.recCache.get(k); if (c) return c;
    const r: RecHumano = { ...this.jogBase, arma: armaDe(this.s.arma).visual, cab: this.s.mascara ? 'mascara' : this.jogBase.cab, moch: inv.mochila ? 'grande' : 'pequena', tor: inv.colete ? 'colete' : this.jogBase.tor, cAc: inv.colete ? 0x6a5838 : this.jogBase.cAc };
    this.recCache.set(k, r); return r;
  }
  verPois() { for (const p of this.zona.pois) if (!this.ze.pois.includes(p.id) && Math.hypot(p.x - this.jog.x, p.y - this.jog.y) < p.r) { this.ze.pois.push(p.id); useJogo.getState().toast('Local descoberto: ' + p.nome, '#e0b83a'); sfx.achado(); } }
  criarFogueira(x: number, y: number, novo = true) {
    const rec: RecEstatica = { tipo: 'prop', n: 'fogueira', v: 0, d: 0, o: 0, sem: 3 }, q = this.est(rec), [sx, sy] = proj(x + 0.5, y + 0.5), spr = this.img(sx, sy, q).setDepth((x + y + 1) * 10);
    const p: Prop = { id: 900000 + this.props.length, rec: rec as Prop['rec'], x, y, w: 1, h: 1, solido: false, inters: [{ k: 'fogueira', rot: 'Usar a fogueira', dur: 0.3 }], luz: { r: 7, cor: 0xff9a40, f: 0.25, noite: false } };
    this.zona.props.push(p); this.props.push({ p, spr, rast: { spr, i: idx(x, y), lvl: -1 } }); this.luzes.push({ x: x + 0.5, y: y + 0.5, r: 7, cor: 0xff9a40, f: 0.25, noite: false, glow: this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(89000).setTint(0xff9a40).setAlpha(0) });
    if (novo) { this.ze.fogueiras.push({ x, y }); montarInterativos(this); } return p;
  }

  // ------------------------------------------------------------------ chunks de chão e paredes
  assar(cx: number, cy: number) {
    const key = `ch_${cx}_${cy}`; if (cx < 0 || cy < 0 || cx * CH >= W || cy * CH >= H || this.chunks.has(key)) return;
    const b = assarChao(this.zona, cx, cy); if (this.textures.exists(key)) this.textures.remove(key); this.textures.addCanvas(key, b.canvas);
    const img = this.add.image(b.ox, b.oy, key).setOrigin(0).setDepth(-10000), paredes: Rastreado[] = [], z = this.zona;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = cx * CH + i, y = cy * CH + j; if (!dentro(x, y)) continue; const t = z.tipos[idx(x, y)]; if (t !== T.PAREDE && t !== T.JANELA && t !== T.RUINA) continue;
      const n = t === T.JANELA ? 'janela' : t === T.RUINA ? 'ruina' : 'parede', q = this.est({ tipo: 'estr', n, estilo: z.estilo[idx(x, y)] % 4, alto: 'a', sem: 1 } as RecEstr), [sx, sy] = proj(x + 0.5, y + 0.5);
      const spr = this.img(sx, sy, q).setDepth((x + y + 1) * 10); paredes.push({ spr, i: idx(x, y), lvl: -1 });
    }
    this.chunks.set(key, { img, paredes });
  }
  fluxoChunks() {
    const cx = Math.floor(this.jog.x / CH), cy = Math.floor(this.jog.y / CH), R = this.esc < 1.75 ? 2 : 1, falta: [number, number, number][] = [];
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (!this.chunks.has(`ch_${cx + dx}_${cy + dy}`)) falta.push([cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) * 10 + Math.abs(dx) + Math.abs(dy)]);
    falta.sort((a, b) => a[2] - b[2]); let extra = 0;
    for (const [x, y, d] of falta) { if (d >= 20 && extra++ >= 1) break; this.assar(x, y); } // o miolo 3x3 é imediato; o anel de fora entra 1 por quadro (sem engasgo)
    for (const [k, c] of this.chunks) { const [, a, b] = k.split('_').map(Number); if (Math.abs(a - cx) > R + 1 || Math.abs(b - cy) > R + 1) { c.img.destroy(); c.paredes.forEach(p => p.spr.destroy()); this.textures.remove(k); this.chunks.delete(k); } }
  }

  // ------------------------------------------------------------------ utilidades
  tipoEm(x: number, y: number) { return dentro(x, y) ? this.zona.tipos[idx(x, y)] : T.PAREDE; }
  solidoEm(x: number, y: number) { return !dentro(x, y) || this.zona.solido[idx(x, y)] === 1; }
  colide(x: number, y: number, r: number) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (this.solidoEm(tx, ty)) return true; return false; }
  temLOS(x0: number, y0: number, x1: number, y1: number) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.3); for (let i = 1; i < n; i++) { const t = i / n, tx = Math.floor(x0 + (x1 - x0) * t), ty = Math.floor(y0 + (y1 - y0) * t); if (!dentro(tx, ty) || this.zona.opaco[idx(tx, ty)]) return false; } return true; }
  /** o jogador consegue "tocar" o objeto? Nada sólido no caminho: parede, janela, cerca, porta fechada ou outra peça (a própria peça do objeto não conta). */
  alcancavel(it: Interativo): boolean {
    const J = this.jog, dx = it.x - J.x, dy = it.y - J.y, n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / 0.2)), px = Math.floor(J.x), py = Math.floor(J.y), g = it.pegada; let ult = -1;
    for (let i = 1; i <= n; i++) {
      const t = i / n, tx = Math.floor(J.x + dx * t), ty = Math.floor(J.y + dy * t); if (!dentro(tx, ty)) return false;
      const k = idx(tx, ty); if (k === ult || (tx === px && ty === py)) continue; ult = k;
      if (g && tx >= g[0] && tx < g[0] + g[2] && ty >= g[1] && ty < g[1] + g[3]) continue;
      if (this.zona.solido[k]) return false;
      if (this.zona.tipos[k] === T.PORTA && !this.portas.get(k)?.aberta) return false;
    }
    return true;
  }
  /** (teste) leva o jogador a um ponto de onde o objeto é alcançável */
  devIrPara(it: Interativo) {
    const x0 = this.jog.x, y0 = this.jog.y;
    for (let r = 0.9; r <= 2.4; r += 0.3) for (let a = 0; a < 6.28; a += 0.45) { const x = it.x + Math.cos(a) * r, y = it.y + Math.sin(a) * r; if (this.colide(x, y, 0.3)) continue; this.jog.x = x; this.jog.y = y; if (this.alcancavel(it)) return true; }
    this.jog.x = x0; this.jog.y = y0; return false;
  }
  obstaculoAte(x: number, y: number, a: number, max: number) { for (let d = 0.2; d < max; d += 0.15) { if (this.solidoEm(Math.floor(x + Math.cos(a) * d), Math.floor(y + Math.sin(a) * d))) return d; } return max; }
  texto(x: number, y: number, t: string, cor = '#e8d9a8') {
    const [sx, sy] = proj(x, y, 30), o = this.add.text(Math.round(sx), Math.round(sy), t, { fontFamily: 'VT323, monospace', fontSize: '24px', color: cor, stroke: '#0a0908', strokeThickness: 4 }).setOrigin(0.5).setDepth(95000);
    this.tweens.add({ targets: o, y: o.y - 22, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => o.destroy() });
  }
  ruido(x: number, y: number, raio: number) {
    raio *= this.clima.ruidoMult; if (raio >= 5) this.aneis.push({ x, y, r: raio, t: 0 });
    for (const e of this.ents) { if (!e.vivo || e.estado === 'persegue' || !e.arq.hostil) continue; if (Math.hypot(e.x - x, e.y - y) < raio) { e.estado = 'investiga'; e.alvo = { x, y }; e.caminho = []; e.tCam = 0; } }
  }
  tom(a: number, noite: number) { const f = 1 - Math.min(1, a) * 0.94, r = Math.round(255 * f * (1 - 0.12 * noite)), g = Math.round(255 * f * (1 - 0.05 * noite)), b = Math.round(255 * f); return (r << 16) | (g << 8) | b; }
  tingir(r: Rastreado, noite: number) { const a = this.lmA[r.i], l = Math.round(a * 12); if (l === r.lvl) return; r.lvl = l; r.spr.setTint(this.tom(l / 12, noite)); }
  hora() { return (this.s.minutos % 1440) / 60; }
  superficie(t: number) { return t === T.MADEIRA || t === T.PORTA ? 'madeira' : t === T.AZULEJO ? 'azulejo' : t === T.METAL ? 'metal' : [T.ESTRADA, T.LINHA_H, T.LINHA_V, T.CALCADA, T.CONCRETO].includes(t as 1) ? 'concreto' : t === T.AREIA ? 'areia' : t === T.AGUA_RASA || t === T.LAMA ? 'agua' : 'terra'; }
  salvar() { const st = useJogo.getState(); this.s.inv = { ...st.inv }; this.s.bau = { ...st.bau }; const copia: Run = { ...this.s, px: this.jog?.x, py: this.jog?.y }; salvarRun(copia); useJogo.setState({ temSave: true }); }
  dentroPredio(x: number, y: number) { return this.zona.predios.some(p => x > p.x && x < p.x + p.w - 1 && y > p.y && y < p.y + p.h - 1); }

  // ------------------------------------------------------------------ luz: cone de visão (rot.js) + pontilhado no chão + tingimento dos objetos
  atualizarLuz(dt: number) {
    const J = this.jog, px = Math.floor(J.x), py = Math.floor(J.y), amb = this.ambient, noite = 1 - amb, vis = this.clima.visibilidade;
    this.luzFrame.fill(0); const lant = this.s.lanterna.ligada && this.s.lanterna.bat > 0, meia = 1.22, alcCone = (lant ? 12 : amb > 0.5 ? 14 : 6.5 + (pk(this.s, 'noturno') ? 3 : 0)) * vis, alcLant = 12 * vis;
    const nv = pk(this.s, 'noturno') ? noite * 3 : 0, nearA = (3.4 + amb * 11 + nv) * vis, nearB = (6.4 + amb * 12.5 + nv) * vis, base = noite * 0.74 + this.clima.nuvem * 0.06 * amb, mem = Math.max(0.55, base + 0.2), boost = this.flash > 0 || this.flashRaio > 0.2 ? 1 : 0, fontes = this.luzes.filter(l => Math.hypot(l.x - J.x, l.y - J.y) < 22 && (l.noite ? noite > 0.3 : true));
    this.fov.compute(px, py, 21, (x: number, y: number) => {
      const dx = x + 0.5 - J.x, dy = y + 0.5 - J.y, d = Math.hypot(dx, dy), da = Math.abs(ang(Math.atan2(dy, dx) - J.ang));
      const cone = sstep(meia + 0.12, meia - 0.18, da) * (1 - sstep(alcCone * 0.6, alcCone, d)), near = 1 - sstep(nearA, nearB, d), fl = boost ? 1 - sstep(4, 7, d) : 0;
      let pool = 0; for (const l of fontes) { const dd = Math.hypot(x + 0.5 - l.x, y + 0.5 - l.y); if (dd < l.r) pool = Math.max(pool, 1 - sstep(l.r * 0.35, l.r, dd)); }
      const luz = Math.max(cone, near * (0.9 + 0.1 * vis), fl, pool), i = idx(x, y); this.luzFrame[i] = luz; if (luz > 0.5) this.seen[i] = 1;
      const lanter = lant ? sstep(meia + 0.12, meia - 0.18, da) * (1 - sstep(alcLant * 0.6, alcLant, d)) : 0, aLuz = base * (1 - 0.88 * Math.max(lanter, fl, pool)) * (1 - 0.35 * near), alvo = this.seen[i] ? mem : 0.9;
      this.lmA[i] = alvo * (1 - luz) + aLuz * luz;
    });
    for (let i = 0; i < W * H; i++) { if (this.luzFrame[i] > 0) continue; const alvo = this.seen[i] ? mem : 0.9; this.lmA[i] += (alvo - this.lmA[i]) * Math.min(1, dt * 16); }
  }
  flash = 0;
  pintarFog() {
    const fz = this.fz, lw = this.fogLw, lh = this.fogLh, cam = this.cameras.main, sx0 = Math.round(cam.scrollX), sy0 = Math.round(cam.scrollY), d = this.fogD.data, noite = 1 - this.ambient, cr = 8, cg = 8 + noite * 4, cb = 12 + noite * 22, lm = this.lmA, m = fz / 2;
    for (let py = 0; py < lh; py++) {
      const wy = sy0 + py * fz + m; let gx = (sx0 + m) / 32 + wy / 16 - 0.5, gy = wy / 16 - (sx0 + m) / 32 - 0.5;
      for (let px = 0; px < lw; px++, gx += fz / 32, gy -= fz / 32) {
        const o = (py * lw + px) * 4; let a = 1;
        if (gx > -0.5 && gy > -0.5 && gx < W - 0.5 && gy < H - 0.5) {
          const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, xa = x0 < 0 ? 0 : x0, ya = y0 < 0 ? 0 : y0, xb = x0 + 1 >= W ? W - 1 : x0 + 1, yb = y0 + 1 >= H ? H - 1 : y0 + 1;
          a = lm[ya * W + xa] * (1 - fx) * (1 - fy) + lm[ya * W + xb] * fx * (1 - fy) + lm[yb * W + xa] * (1 - fx) * fy + lm[yb * W + xb] * fx * fy;
        }
        const q = Math.floor(a * 5 + BAYER[(py & 3) * 4 + (px & 3)]) / 5, al = Math.min(1, q) * 0.9; d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = al * 255;
      }
    }
    this.fogC.context.putImageData(this.fogD, 0, 0); this.fogC.refresh();
  }

  // ------------------------------------------------------------------ laço principal
  update(_t: number, dms: number) {
    if (!this.zona) return;
    if (!this.pronto) { const t0 = performance.now(); while (this.tarefas.length && performance.now() - t0 < 14) this.tarefas.shift()!(); useJogo.setState({ carga: Math.min(0.99, 1 - this.tarefas.length / this.totalTarefas) }); if (!this.tarefas.length) this.iniciar(); return; }
    const dt = Math.min(0.05, dms / 1000); this.tempo += dt;
    this.fab.processar(this.fab.pendentes() > 12 ? 9 : 4);
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    const s = this.s; this.pathBudget = 3;
    if (!this.morto) {
      s.minutos += dt * MIN_POR_SEG; const h = this.hora(); this.ambient = luzDia(h) * (1 - this.clima.nuvem * 0.12);
      this.jogador(dt); this.necessidades(dt);
    }
    const noite = 1 - this.ambient; this.tSpawn += dt;
    if (!this.morto && this.tSpawn > 45) { this.tSpawn = 0; this.spawnDinamico(); }
    const J = this.jog; this.clima.atualizar(dt, s.minutos, this.interior);
    for (const e of this.ents) { if (Math.abs(e.x - J.x) < 36 && Math.abs(e.y - J.y) < 36) atualizarEnt(this, e, dt, noite); }
    this.ents = this.ents.filter(e => !e.remover); this.separar();
    this.atualizarLuz(dt); this.desenharEntidades(dt, noite); this.camera(dt); this.fluxoChunks(); this.pintarFog(); this.cortes(dt, noite); this.efeitos(dt); this.vento(dt); desenharBeacon(this, dt);
    this.tPortas += dt; if (this.tPortas > 0.5) { this.tPortas = 0; for (const [i, d] of this.portas) if (d.aberta) { d.t += 0.5; const x = i % W, y = Math.floor(i / W); if (d.t > 4 && Math.hypot(x + 0.5 - J.x, y + 0.5 - J.y) > 6 && !this.ents.some(e => e.vivo && Math.hypot(e.x - x - 0.5, e.y - y - 0.5) < 1.2)) this.fecharPorta(i); } }
    this.tSync += dt; if (this.tSync > 0.1) { this.tSync = 0; this.sincronizar(); }
    this.tSave += dt; if (this.tSave > 30 && !this.morto) { this.tSave = 0; this.salvar(); }
    this.tSeg += dt; if (this.tSeg > 1) { this.tSeg = 0; this.verPois(); this.dicas(); if (this.zona.id === 'base') tickHortas(this); tickProgresso(this); atualizarDiretor(this, 1); }
  }
  separar() {
    const at = this.ents.filter(e => e.vivo && e.arq.hostil && Math.abs(e.x - this.jog.x) < 20 && Math.abs(e.y - this.jog.y) < 20);
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) { const a = at[i], b = at[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.arq.raio + b.arq.raio) * 1.5; if (d > 0 && d < m) { const f = (m - d) * 0.5; if (!this.colide(a.x - dx / d * f, a.y, 0.28)) a.x -= dx / d * f; if (!this.colide(a.x, a.y - dy / d * f, 0.28)) a.y -= dy / d * f; if (!this.colide(b.x + dx / d * f, b.y, 0.28)) b.x += dx / d * f; if (!this.colide(b.x, b.y + dy / d * f, 0.28)) b.y += dy / d * f; } }
  }
  spawnDinamico() {
    const J = this.jog, perto = this.ents.filter(e => e.vivo && e.arq.hostil && Math.hypot(e.x - J.x, e.y - J.y) < 25).length; if (!this.bioma.inimigos.length || perto >= Math.round(4 * DIF.spawn[dif(this.s)]) || this.ents.length > 140) return;
    for (let t = 0; t < 20; t++) { const a = Math.random() * 6.28, r = 14 + Math.random() * 8, x = Math.floor(J.x + Math.cos(a) * r), y = Math.floor(J.y + Math.sin(a) * r); if (!dentro(x, y) || this.solidoEm(x, y) || this.zona.tipos[idx(x, y)] === T.PORTA || this.luzFrame[idx(x, y)] > 0.1) continue; const n = 1 + Math.floor(Math.random() * 2); const arq = this.bioma.inimigos[0][0]; for (let k = 0; k < n; k++) criarEnt(this, arq, x + 0.5 + k * 0.4, y + 0.5, null, -1); break; }
  }

  // ------------------------------------------------------------------ jogador
  jogador(dt: number) {
    const e = ponte.entrada, s = this.s, J = this.jog, k = this.teclas, R2 = Math.SQRT1_2, st = useJogo.getState();
    J.dano = Math.max(0, J.dano - dt); J.atk = Math.max(0, J.atk - dt);
    let sxm = e.mx, sym = e.my; const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0), ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx || ky) { sxm = kx; sym = ky; } let m = Math.hypot(sxm, sym); if (m > 1) { sxm /= m; sym /= m; m = 1; }
    const mx = (sxm + sym) * R2, my = (sym - sxm) * R2, corre = (e.correr || k.SHIFT.isDown) && s.stamina > 2, furtivo = e.furtivo; ponte.entrada.furtivo = furtivo;
    const base = furtivo ? 1.4 : corre ? 4.6 : 2.7, peso = 1 - Math.min(0.25, pesoDe(st.inv) / pesoMax(st.inv) * 0.2), cura = s.hp < 30 ? 0.88 : 1, agua = this.tipoEm(Math.floor(J.x), Math.floor(J.y)) === T.AGUA_RASA ? 0.65 : 1;
    const v = m > 0.12 ? base * Math.min(1, m) * peso * cura * agua : 0; J.andando = v > 0;
    if (J.andando) {
      if (this.acao && m > 0.35) { this.acao = null; useJogo.getState().toast('Interrompido', '#d9a02b'); }
      const sx = (mx / m) * v * dt, sy = (my / m) * v * dt; if (!this.colide(J.x + sx, J.y, 0.3)) J.x += sx; if (!this.colide(J.x, J.y + sy, 0.3)) J.y += sy; J.passo += v * dt;
      const fx = Math.floor(J.x + (mx / m) * 0.75), fy = Math.floor(J.y + (my / m) * 0.75); if (this.tipoEm(fx, fy) === T.PORTA) this.abrirPorta(idx(fx, fy));
      if (corre) s.stamina = Math.max(0, s.stamina - 14 * (pk(s, 'pulmoes') ? 0.7 : 1) * dt); else s.stamina = Math.min(100, s.stamina + 9 * (pk(s, 'pulmoes') ? 1.3 : 1) * dt);
      const f = Math.floor(J.passo * 1.1); if (f !== J.ultimoPasso) { J.ultimoPasso = f; sfx.passo(this.superficie(this.tipoEm(Math.floor(J.x), Math.floor(J.y))), corre, furtivo ? 0.4 : 1); if (corre && Math.random() < 0.3) { const [px, py] = proj(J.x, J.y); this.part.poeira(px, py, 3); } }
    } else s.stamina = Math.min(100, s.stamina + 16 * dt);
    this.tRuido += dt; if (this.tRuido > 0.45) { this.tRuido = 0; const r = (!J.andando ? 0 : corre ? 9 : furtivo ? 1.5 : 4) * (pk(s, 'leve') ? 0.6 : 1); if (r > 1.2) this.ruido(J.x, J.y, r); }
    let alvoAng = J.ang, atacando = e.atacar; const novoTap = e.tap !== this.tapVisto; this.tapVisto = e.tap; if (novoTap) atacando = true;
    if (e.mira && Math.hypot(e.ax, e.ay) > 0.2) { alvoAng = Math.atan2((e.ay - e.ax) * R2, (e.ax + e.ay) * R2); atacando = true; }
    else if (this.desktop && this.mouse.ativo) { alvoAng = Math.atan2(this.mouse.y - J.y, this.mouse.x - J.x); atacando = this.mouse.baixo || k.SPACE.isDown || atacando; }
    else if (J.andando && !atacando) alvoAng = Math.atan2(my, mx);
    if (atacando && !(e.mira && Math.hypot(e.ax, e.ay) > 0.2) && (st.cfg.autoMira || this.desktop === false)) { const a = this.mirarAuto(alvoAng); if (a !== null) alvoAng = a; }
    J.ang += ang(alvoAng - J.ang) * Math.min(1, dt * 16);
    this.cdAtaque -= dt; if (atacando) atacarJogador(this);
    if (this.flash > 0) { this.flash -= dt; if (this.flash <= 0) this.clarao.setVisible(false); } this.flashRaio = Math.max(0, this.flashRaio - dt * 2);
    this.tAlvo += dt; if (this.tAlvo > 0.12) { this.tAlvo = 0; this.alvoInter = this.alvoProx(); useJogo.setState({ alvo: this.alvoInter ? this.alvoInter.rot : null }); }
    if (this.acao) { this.acao.t += dt; if (this.acao.ruido && Math.random() < dt * 0.8) this.ruido(J.x, J.y, this.acao.ruido); if (this.acao.t >= this.acao.dur) { const f = this.acao.fim; this.acao = null; f(); } }
    useJogo.setState(q => (q.acao?.p === (this.acao ? this.acao.t / this.acao.dur : undefined) ? q : { acao: this.acao ? { rotulo: this.acao.rotulo, p: this.acao.t / this.acao.dur } : null }));
  }
  /** direção para o inimigo mais próximo (visível) na frente do jogador; null se não há */
  mirarAuto(base: number): number | null {
    const J = this.jog, arma = armaDe(this.s.arma), alc = arma.alvo === 'tiro' ? arma.alcance : arma.alcance + 1.5; let melhor: Ent | null = null, md = 1e9;
    for (const e of this.ents) { if (!e.vivo || !e.arq.hostil) continue; const d = Math.hypot(e.x - J.x, e.y - J.y); if (d > alc || this.luzFrame[idx(Math.min(W - 1, Math.max(0, Math.floor(e.x))), Math.min(H - 1, Math.max(0, Math.floor(e.y))))] < 0.4) continue; const da = Math.abs(ang(Math.atan2(e.y - J.y, e.x - J.x) - base)); const sc = d + da * 3; if (da < 1.9 && sc < md && this.temLOS(J.x, J.y, e.x, e.y)) { md = sc; melhor = e; } }
    return melhor ? Math.atan2(melhor.y - J.y, melhor.x - J.x) : null;
  }
  alvoProx(): Interativo | null {
    const J = this.jog; let melhor: Interativo | null = null, md = 1e9;
    for (const it of this.interativos) { if (!it.ok()) continue; const d = Math.hypot(it.x - J.x, it.y - J.y); if (d <= it.r && d < md && this.alcancavel(it)) { md = d; melhor = it; } }
    return melhor ?? aguaInter(this);
  }
  abrirPorta(i: number) { const d = this.portas.get(i); if (!d || d.aberta) return; d.aberta = true; d.t = 0; this.zona.opaco[i] = 0; this.setQ(d.spr, this.est({ tipo: 'estr', n: 'portaA', estilo: 0, alto: 'a', sem: 0, o: d.horiz ? 0 : 1 } as RecEstr)); d.rast.lvl = -1; sfx.porta(); this.ruido((i % W) + 0.5, Math.floor(i / W) + 0.5, 4); }
  fecharPorta(i: number) { const d = this.portas.get(i); if (!d || !d.aberta) return; d.aberta = false; this.zona.opaco[i] = 1; this.setQ(d.spr, this.est({ tipo: 'estr', n: 'porta', estilo: 0, alto: 'a', sem: 0, o: d.horiz ? 0 : 1 } as RecEstr)); d.rast.lvl = -1; }

  // ------------------------------------------------------------------ necessidades, clima e objetivos
  avancar(min: number, fator = 1) {
    const s = this.s; s.minutos += min; s.fome = Math.max(0, s.fome - min * 0.052 * fator); s.sede = Math.max(0, s.sede - min * 0.085 * fator); if (s.fome > 30 && s.sede > 30) s.hp = Math.min(s.maxHp, s.hp + min * 0.12);
    s.rad = Math.max(0, s.rad - min * 0.02); this.clima.atualizar(0, s.minutos, false);
  }
  necessidades(dt: number) {
    const s = this.s, J = this.jog, dmin = dt * MIN_POR_SEG, st = useJogo.getState(), cl = this.clima, mask = s.mascara && st.inv.mascara ? 0.35 : 1;
    const fm = DIF.fome[dif(s)] * (pk(s, 'estomago') ? 0.7 : 1); s.fome = Math.max(0, s.fome - dmin * 0.052 * fm); s.sede = Math.max(0, s.sede - dmin * 0.085 * fm);
    const rad = this.zona.rad[idx(Math.floor(J.x), Math.floor(J.y))] ?? 0; this.radSuave += (rad - this.radSuave) * Math.min(1, dt * 4);
    let ganho = rad > 0.05 ? Math.pow(rad, 1.2) * 2.4 * mask : 0; if (cl.acida && !this.interior) ganho += cl.chuva * 1.1 * mask;
    if (pk(s, 'imune')) ganho *= 0.6; s.rad = Math.min(100, Math.max(0, s.rad + (ganho > 0 ? ganho * dt : -0.03 * dt))); s.radMax = Math.max(s.radMax, s.rad);
    s.maxHp = (pk(s, 'pele') ? 115 : 100) - s.rad * 0.5; if (s.hp > s.maxHp) s.hp = s.maxHp;
    let dreno = 0; if (s.sangra) dreno += 0.7; if (s.fome <= 0) dreno += 0.4; if (s.sede <= 0) dreno += 0.8; if (s.rad >= 100) dreno += 2; if (cl.poeira > 0.4 && !this.interior && mask > 0.9) dreno += 0.12 * cl.poeira;
    if (dreno) { s.hp -= dreno * dt; if (s.hp <= 0) this.morrer(s.sede <= 0 ? 'Morreu de sede' : s.fome <= 0 ? 'Morreu de fome' : s.sangra ? 'Sangrou até a morte' : 'Envenenado pela radiação'); }
    else if (s.fome > 40 && s.sede > 40 && s.rad < 70) s.hp = Math.min(s.maxHp, s.hp + 0.18 * dt);
    if (s.lanterna.ligada) { s.lanterna.bat = Math.max(0, s.lanterna.bat - 0.33 * dt); if (s.lanterna.bat <= 0) { s.lanterna.ligada = false; st.toast('A bateria acabou', '#d9a02b'); } }
    const alvoCpm = 18 + this.radSuave * 900 + (cl.acida && !this.interior ? cl.chuva * 120 : 0); st.cpm = st.cpm; this.cpm += (alvoCpm - this.cpm) * Math.min(1, dt * 3); setGeiger(this.cpm); setBatimento(s.hp < 30 && !this.morto);
    if (cl.chuva > 0.2 && this.zona.id === 'base') { const tn = melNivel(s, 'tanque'); s.tanque = Math.min([5, 8, 12][tn], s.tanque + dmin * 0.01 * cl.chuva * [1, 1.5, 2][tn]); }
    const h = this.hora(), noite = h < 6 || h >= 20.5; if (this.noiteAnterior && !noite && h >= 6) { s.noites++; useJogo.getState().toast('Você sobreviveu à noite', '#8fe36a'); registrar(this, 'noites'); ganharXp(this, 30); } this.noiteAnterior = noite;
    for (let n = 0; n < 6; n++) {
      if (s.objIdx === 0 && s.viajou) { s.objIdx = 1; st.toast('Objetivo cumprido', '#8fe36a'); }
      if (s.objIdx === 1 && s.vasculhados >= 5) { s.objIdx = 2; st.toast('Objetivo cumprido', '#8fe36a'); }
      if (s.objIdx === 2 && s.craftou) { s.objIdx = 3; st.toast('Objetivo cumprido', '#8fe36a'); }
      if (s.objIdx === 3 && s.noites >= 1) { s.objIdx = 4; st.toast('Objetivo cumprido', '#8fe36a'); }
      if (s.objIdx === 4 && (st.inv.radio || this.s.inv.radio)) { s.objIdx = 5; s.sabeAbrigo = true; if (!s.descobertos.includes('abrigo7')) s.descobertos.push('abrigo7'); st.toast('Sinal do Abrigo 7 captado', '#8fe36a'); registrar(this, 'radio'); ganharXp(this, 60); }
    }
  }
  cpm = 18;
  dicas() {
    const st = useJogo.getState(), s = this.s, J = this.jog, d = s.dicas, mostrar = (id: string, t: string) => { if (d.includes(id) || st.dica) return false; d.push(id); st.set({ dica: t }); setTimeout(() => useJogo.setState({ dica: null }), 6500); return true; };
    if (this.tempo < 3) return;
    if (!J.andando && this.tempo < 25 && mostrar('mover', 'Arraste o dedo no lado ESQUERDO da tela para andar.')) return;
    if (this.alvoInter && mostrar('interagir', 'Toque no botão laranja (ou no objeto) para interagir.')) return;
    if (this.zona.id === 'base' && mostrar('jipe', 'Use o JIPE no portão para viajar. Cada viagem gasta combustível.')) return;
    if (this.ents.some(e => e.vivo && e.arq.hostil && Math.hypot(e.x - J.x, e.y - J.y) < 12) && mostrar('atacar', 'Toque no lado DIREITO para atacar. Arraste para mirar.')) return;
    if (s.hp < 40 && mostrar('curar', 'Vida baixa! Use bandagem ou kit nos atalhos de baixo.')) return;
    if (this.ambient < 0.4 && mostrar('noite', 'Escureceu. Acenda a lanterna e evite barulho.')) return;
    if (this.clima.tipo === 'acida' && mostrar('acida', 'Chuva ácida sobe a radiação. Procure abrigo coberto.')) return;
  }

  // ------------------------------------------------------------------ apresentação
  desenharEntidades(dt: number, noite: number) {
    const J = this.jog, st = useJogo.getState(); this.jog.spr.setVisible(true);
    // jogador
    const rec = this.recJog(); J.rec = rec; let clip = 'parado', n = 2, f = Math.floor(this.tempo * 1.6) % 2; const arma = armaDe(this.s.arma);
    if (J.morrendo > 0) { clip = 'morrer'; n = 5; f = Math.min(4, Math.floor((0.9 - Math.min(0.9, J.morrendo)) / 0.18)); }
    else if (J.dano > 0.05) { clip = 'dano'; n = 1; f = 0; }
    else if (J.atk > 0) { clip = arma.alvo === 'tiro' ? 'atirar' : 'golpear'; n = clip === 'atirar' ? 2 : 3; f = Math.min(n - 1, Math.floor((1 - J.atk / J.atkDur) * n)); }
    else if (J.andando) { clip = (ponte.entrada.correr && this.s.stamina > 2) ? 'correr' : 'andar'; n = 4; f = Math.floor(J.passo * 2.2) % 4; }
    const dir = dirTela(J.ang), q = this.fab.pedir('humano', rec, clip, dir, f, 0) ?? this.fab.pedir('humano', rec, 'parado', dir, 0, 0); if (q) this.setQ(J.spr, q);
    const [sx, sy] = proj(J.x, J.y); J.spr.setPosition(Math.round(sx), Math.round(sy)).setDepth((J.x + J.y) * 10); this.sombra(J.som, sx, sy, (J.x + J.y) * 10 - 5, 1, 1);
    const ja = this.lmA[idx(Math.min(W - 1, Math.max(0, Math.floor(J.x))), Math.min(H - 1, Math.max(0, Math.floor(J.y))))], jl = Math.round(ja * 12); if (jl !== J.lvl) { J.lvl = jl; J.spr.setTint(this.tom(jl / 12, noite)); }
    for (const e of this.ents) atualizarSpr(this, e, dt, noite);
    void st;
  }
  sombra(spr: Phaser.GameObjects.Image, sx: number, sy: number, depth: number, escala: number, alvo: number) {
    const sol = sombraSol(this.hora(), this.clima.nuvem), a = Math.max(sol.a, this.ambient < 0.3 ? 0.35 : 0) * alvo; spr.setPosition(Math.round(sx + sol.dx * 5 * escala), Math.round(sy + 1)).setDepth(depth).setScale((1 + sol.len * 0.5) * escala, escala).setAlpha(a);
  }
  /** paredes: cortam (ficam baixas/transparentes) na frente do jogador; tingem pela luz */
  cortes(dt: number, noite: number) {
    this.tCut += dt; const J = this.jog, px = Math.floor(J.x), py = Math.floor(J.y), t = this.tipoEm(px, py);
    const dentroAgora = [T.MADEIRA, T.AZULEJO, T.PORTA].includes(t as 3) || (t === T.CONCRETO && this.dentroPredio(px, py)); this.interior = dentroAgora;
    if (this.tCut > 0.12) {
      this.tCut = 0;
      for (const c of this.chunks.values()) for (const w of c.paredes) {
        const x = w.i % W, y = Math.floor(w.i / W), frente = x + y > px + py && Math.abs(x - px) <= 6 && Math.abs(y - py) <= 6, tt = this.zona.tipos[w.i], baixa = this.interior && frente && tt !== T.RUINA, perto = !this.interior && x + y > px + py && Math.abs(x - px) <= 2 && Math.abs(y - py) <= 2;
        const n = tt === T.JANELA ? 'janela' : tt === T.RUINA ? 'ruina' : 'parede', q = this.est({ tipo: 'estr', n, estilo: this.zona.estilo[w.i] % 4, alto: baixa ? 'b' : 'a', sem: 1 } as RecEstr); if (w.spr.texture.key !== q.key) { this.setQ(w.spr, q); w.lvl = -1; } w.spr.alpha = perto ? 0.5 : 1;
      }
    }
    for (const c of this.chunks.values()) for (const w of c.paredes) this.tingir(w, noite);
    for (const p of this.props) this.tingir(p.rast, noite); for (const d of this.portas.values()) this.tingir(d.rast, noite);
    for (const fl of this.floras) { const i = idx(Math.min(W - 1, Math.max(0, Math.floor(fl.f.x))), Math.min(H - 1, Math.max(0, Math.floor(fl.f.y)))), l = Math.round(this.lmA[i] * 12); if (l !== (fl as unknown as { l?: number }).l) { (fl as unknown as { l?: number }).l = l; fl.spr.setTint(this.tom(l / 12, noite)); } }
  }
  /** vento balança a flora (skew) e solta folhas/cinza */
  vento(dt: number) {
    this.tFlora += dt; const cam = this.cameras.main, g = this.clima.rajada, t = this.tempo, vx0 = cam.scrollX - 40, vy0 = cam.scrollY - 60, vx1 = cam.scrollX + this.scale.width + 40, vy1 = cam.scrollY + this.scale.height + 80;
    let orc = 2;
    for (const fl of this.floras) {
      if (fl.f.rec.balanco < 0.3 || fl.f.cortada) continue; const [sx, sy] = proj(fl.f.x, fl.f.y); if (sx < vx0 || sx > vx1 || sy < vy0 || sy > vy1) continue;
      const v = Math.sin(t * (1.3 + g * 1.8) + fl.fase) * (0.25 + g * 1.3) * fl.f.rec.balanco + g * 0.2, sw = v > 0.55 ? 1 : v < -0.55 ? -1 : 0; if (sw === fl.sw) continue;
      const rec = sw === 0 ? fl.f.rec : (sw === 1 ? (fl.r1 ??= { ...fl.f.rec, sw: 1 }) : (fl.r2 ??= { ...fl.f.rec, sw: -1 })); const k = chaveRec(rec);
      if (!this.estCache.has(k) && !this.fab.temEstatico(k)) { if (orc <= 0) continue; orc--; }
      this.setQ(fl.spr, this.est(rec)); fl.sw = sw;
    }
    if (g > 0.35 && Math.random() < dt * g * 14) { const x = cam.scrollX + Math.random() * this.scale.width, y = cam.scrollY + Math.random() * this.scale.height * 0.8; this.part.emitir(1, x, y, 14, { vx: 40 + g * 70, vy: 8, vz: 2, esp: 8, g: 6, vida: 1.6, cor: this.zona.bioma === 'ermo' ? [0x6a604c, 0x8a8068] : this.zona.bioma === 'floresta' ? [0x8a6a2a, 0x7a4a1c] : [0x7a7a6a], tam: 1 }); }
  }
  camera(dt: number) {
    const e = ponte.entrada, J = this.jog, cam = this.cameras.main, [jx, jy] = proj(J.x, J.y, 16), la = e.mira ? 26 : 12, dx = (Math.cos(J.ang) - Math.sin(J.ang)) * 0.5, dy = (Math.cos(J.ang) + Math.sin(J.ang)) * 0.25, k = 1 - Math.exp(-dt * 7);
    this.camX += (jx + dx * la - this.camX) * k; this.camY += (jy + dy * la - this.camY) * k; cam.setScroll(Math.round(this.camX - this.scale.width / 2), Math.round(this.camY - this.scale.height / 2));
  }
  efeitos(dt: number) {
    const cam = this.cameras.main, J = this.jog, h = this.hora(), cl = this.clima;
    this.grade.setFillStyle(gradeCor(h, cl.nuvem, cl.tempestade)).setSize(this.scale.width, this.scale.height);
    this.part.atualizar(dt); this.part.desenhar(this.gChao, this.gAr);
    const ativo = cl.ativo() || cl.flash > 0; this.climaImg.setVisible(ativo);
    if (ativo) { const algo = cl.desenhar(this.climaD.data, this.climaLw, this.climaLh, cam.scrollX, cam.scrollY, dt, this.cz); if (algo) { this.climaC.context.putImageData(this.climaD, 0, 0); this.climaC.refresh(); } else this.climaImg.setVisible(false); }
    // luzes (brilho aditivo com tremida)
    for (const l of this.luzes) { if (!l.glow) continue; const d = Math.hypot(l.x - J.x, l.y - J.y); if (d > 24) { l.glow.setAlpha(0); continue; } const noite = 1 - this.ambient, on = l.noite ? noite > 0.3 : true, [sx, sy] = proj(l.x, l.y, 10), fl = 1 + Math.sin(this.tempo * 13 + l.x * 7) * l.f * 0.3 + (Math.random() - 0.5) * l.f * 0.2; l.glow.setPosition(Math.round(sx), Math.round(sy)).setScale(l.r * 0.55 * fl).setAlpha(on ? Math.min(0.55, 0.12 + noite * 0.45) * (this.lmA[idx(Math.min(W - 1, Math.floor(l.x)), Math.min(H - 1, Math.floor(l.y)))] < 0.85 ? 1 : 0.2) : 0); }
    // tracers e anéis de ruído
    const g = this.gfx; g.clear();
    this.tracers = this.tracers.filter(t => (t.t += dt) < 0.09); for (const t of this.tracers) { g.lineStyle(2, t.cor, 1 - t.t / 0.09); g.beginPath(); g.moveTo(Math.round(t.x0), Math.round(t.y0)); g.lineTo(Math.round(t.x1), Math.round(t.y1)); g.strokePath(); }
    this.aneis = this.aneis.filter(a => (a.t += dt) < 0.7); for (const a of this.aneis) { const p = a.t / 0.7, r = a.r * (0.15 + p * 0.85); g.lineStyle(1, 0xc9561f, 0.7 * (1 - p)); g.beginPath(); for (let i = 0; i <= 28; i++) { const an = (i / 28) * 6.283, [x, y] = proj(a.x + Math.cos(an) * r, a.y + Math.sin(an) * r); if (i === 0) g.moveTo(Math.round(x), Math.round(y)); else g.lineTo(Math.round(x), Math.round(y)); } g.strokePath(); }
    const m = this.marca; m.clear(); const it = this.alvoInter; if (it) { const [x, y] = proj(it.x, it.y, it.alt ?? 40), b = Math.round(Math.sin(performance.now() / 160) * 2); m.fillStyle(0x8fe36a, 1); m.fillTriangle(Math.round(x) - 4, Math.round(y) - 8 + b, Math.round(x) + 4, Math.round(y) - 8 + b, Math.round(x), Math.round(y) - 2 + b); m.fillStyle(0x0b0f08, 1); m.fillRect(Math.round(x) - 1, Math.round(y) - 12 + b, 2, 3); }
    // áudio ambiente (10x por segundo)
    this.tAmb += dt; if (this.tAmb > 0.1) { this.tAmb = 0; const fogo = this.luzes.reduce((a, l) => Math.max(a, 1 - Math.min(1, Math.hypot(l.x - J.x, l.y - J.y) / 9)), 0), perigo = Math.min(1, this.ents.filter(e => e.vivo && e.arq.hostil && e.estado === 'persegue').length / 4); ambiente({ hora: h, vento: cl.rajada, chuva: cl.chuva, interior: this.interior, bioma: this.bioma.ambiente, fogo, perigo }); }
  }
  sincronizar() {
    const s = this.s, J = this.jog, st = useJogo.getState(), cl = this.clima; let prog = 0, h = this.hora();
    if (s.objIdx === 0) prog = 0.06; else if (s.objIdx === 1) prog = s.vasculhados / 5; else if (s.objIdx === 2) prog = 0.08; else if (s.objIdx === 3) prog = h >= 20 ? (h - 20) / 10 : h < 6 ? (h + 4) / 10 : 0.04; else if (s.objIdx === 4) prog = 0.1; else prog = 0.3;
    useJogo.setState({ minutos: s.minutos, hp: s.hp, maxHp: s.maxHp, fome: s.fome, sede: s.sede, stamina: s.stamina, rad: s.rad, sangra: s.sangra, balas: { ...s.balas }, arma: s.arma, mascara: s.mascara, combustivel: s.combustivel, lanterna: { ...s.lanterna, tem: !!st.inv.lanterna }, cpm: Math.round(this.cpm), objIdx: s.objIdx, objProg: prog, vasculhados: s.vasculhados, abates: s.abates, radMax: s.radMax, sabeAbrigo: s.sabeAbrigo, furtivo: ponte.entrada.furtivo, interior: this.interior, tanque: s.tanque, descobertos: [...s.descobertos], clima: { tipo: cl.tipo, chuva: cl.chuva, vento: cl.vento, neblina: cl.neblina, poeira: cl.poeira, nuvem: cl.nuvem }, seta: setaAirdrop(this), fps: Math.round(this.game.loop.actualFps) });
    h = 0; void J; void horaStr; void OBJETIVOS;
  }
  morrer(causa: string) { executarMorte(this, causa); }
  iniciarMorte() { iniciarMorte(this); }
}

// ---------------------------------------------------------------------------- sprite de entidade (fora da classe para manter o arquivo legível)
import { atualizarSpr } from './sistemas/ia';
export { clipesDe };

export function criarJogo(pai: HTMLElement, run: Run, esc = 1): Phaser.Game {
  // Cada pixel de arte ocupa um número INTEIRO de pixels do aparelho (grade nítida e uniforme). `esc` = tamanho desejado em px CSS;
  // quanto menor, mais pixels na tela e menos "quadradão" (1 = ultra, 1.5 = alta, 2 = média, 3 = leve).
  const dpr = Math.max(1, window.devicePixelRatio || 1), k = Math.max(2, Math.round(esc * dpr)), css = k / dpr;
  const w = () => Math.max(64, Math.ceil(pai.clientWidth / css)), h = () => Math.max(64, Math.ceil(pai.clientHeight / css));
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: pai, backgroundColor: '#0b0a0c', disableContextMenu: true, roundPixels: true, scale: { mode: Phaser.Scale.NONE, width: w(), height: h() },
    render: { antialias: false, pixelArt: true, roundPixels: true, powerPreference: 'high-performance' }, fps: { target: 60 }, scene: [],
  });
  const ajusta = () => { game.canvas.style.width = `${w() * css}px`; game.canvas.style.height = `${h() * css}px`; };
  ajusta(); game.canvas.style.imageRendering = 'pixelated';
  game.scene.add('cena', Cena, true, { run, zonaId: run.zonaId, esc: css });
  const ro = new ResizeObserver(() => { game.scale.resize(w(), h()); ajusta(); }); ro.observe(pai); game.events.once('destroy', () => { ro.disconnect(); resetarFabrica(); });
  return game;
}
void ARQS; void aplicarVolumes; void BIOMAS; void gerarFlora; void (null as unknown as Arq);
