import * as Phaser from 'phaser';
import * as ROT from 'rot-js';
import { gerarMundo, W, H, T, idx, dentro, type Mundo, type Prop } from './mapa';
import { gerarAtlas, TS, type Atlas } from './arte';
import { ITENS, COR_RARIDADE } from './itens';
import { useJogo, estadoInicial, horaStr, pesoInv, PESO_MAX } from './store';
import { ponte, type Rapido } from './ponte';
import { sfx, setGeiger, setBatimento, vibra } from './audio';

const CH = 16;
const MIN_POR_SEG = 1440 / (14 * 60); // um dia de jogo = 14 min reais
type Tipo = 'irr' | 'cao' | 'rato';
const DEF: Record<Tipo, { hp: number; vel: number; dano: number; raio: number; visao: number }> = {
  irr: { hp: 45, vel: 1.15, dano: 12, raio: 0.32, visao: 8 },
  cao: { hp: 26, vel: 3.5, dano: 9, raio: 0.3, visao: 11 },
  rato: { hp: 8, vel: 2.7, dano: 3, raio: 0.2, visao: 6 },
};
type Ini = {
  tipo: Tipo; x: number; y: number; hp: number; ang: number; estado: 'ocioso' | 'investiga' | 'persegue';
  alvo: { x: number; y: number } | null; caminho: [number, number][]; tCam: number; cd: number; tSent: number; semVer: number; vagar: number;
  kx: number; ky: number; fase: number; vivo: boolean; spr: Phaser.GameObjects.Image; som: Phaser.GameObjects.Image;
};
type Acao = { rotulo: string; dur: number; t: number; fim: () => void; ruido?: number };
type Efeito = { k: 'arco' | 'tracer' | 'anel'; x: number; y: number; a: number; r: number; t: number; dur: number; x2?: number; y2?: number };
const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
const ang = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Cena extends Phaser.Scene {
  atlas!: Atlas; mundo!: Mundo; fov!: InstanceType<typeof ROT.FOV.PreciseShadowcasting>;
  chunks = new Map<string, Phaser.GameObjects.Image>();
  props: { p: Prop; spr: Phaser.GameObjects.Image }[] = [];
  portas = new Map<number, { aberta: boolean; spr: Phaser.GameObjects.Image; horiz: boolean; t: number }>();
  inim: Ini[] = []; cadaveres: Phaser.GameObjects.Image[] = [];
  jog = { x: 0, y: 0, ang: 0, passo: 0, andando: false, spr: null as unknown as Phaser.GameObjects.Image, som: null as unknown as Phaser.GameObjects.Image };
  s = estadoInicial('');
  lm!: Phaser.Textures.CanvasTexture; lmData!: ImageData; lmA = new Float32Array(W * H).fill(0.96); seen = new Uint8Array(W * H); luzFrame = new Float32Array(W * H);
  gfx!: Phaser.GameObjects.Graphics; efeitos: Efeito[] = [];
  clarao!: Phaser.GameObjects.Image; flash = 0;
  acao: Acao | null = null; teclas!: Record<string, Phaser.Input.Keyboard.Key>;
  morto = false; ambient = 1; hitstop = 0; cdAtaque = 0; tSync = 0; tAlvo = 0; tRuido = 0; tSpawn = 0; tPortas = 0; tAvisoMun = 0;
  camX = 0; camY = 0; pathBudget = 3; distAbrigo0 = 1; desktop = false; mouse = { x: 0, y: 0, ativo: false, baixo: false };
  radSuave = 0; dano = 0; acordado = 0;

  constructor() { super('cena'); }

  init(d: { seed: string }) { this.s = { ...estadoInicial(d.seed) }; }

  create() {
    this.atlas = gerarAtlas();
    for (const [k, c] of Object.entries(this.atlas)) this.textures.addCanvas(k, c);
    this.mundo = gerarMundo(this.s.seed);
    const m = this.mundo;
    this.fov = new ROT.FOV.PreciseShadowcasting((x, y) => dentro(x, y) && !m.opaco[idx(x, y)]);
    this.desktop = !window.matchMedia('(pointer: coarse)').matches;
    this.distAbrigo0 = Math.hypot(m.abrigo.x - m.jogador.x, m.abrigo.y - m.jogador.y);

    // props e portas
    for (const p of m.props) {
      const key = this.chaveProp(p);
      const spr = this.add.image(p.x * TS, p.y * TS, key).setOrigin(0);
      if (p.tipo === 'arvore') spr.setScale(1.5).setPosition(p.x * TS - 16, p.y * TS - 20).setDepth((p.y + 1) * TS + 60);
      else if (p.tipo === 'bunker') spr.setDepth(-100);
      else spr.setDepth(p.y * TS + 16 + (p.h - 1) * TS);
      this.props.push({ p, spr });
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m.tipos[idx(x, y)] === T.PORTA) {
      const horiz = m.tipos[idx(x - 1, y)] === T.PAREDE || m.tipos[idx(x + 1, y)] === T.PAREDE;
      const spr = this.add.image(x * TS + 32, y * TS + 32, 'porta_f').setDepth(y * TS + 20);
      if (!horiz) spr.setRotation(Math.PI / 2);
      this.portas.set(idx(x, y), { aberta: false, spr, horiz, t: 0 });
    }

    // jogador
    this.jog.x = m.jogador.x + 0.5; this.jog.y = m.jogador.y + 0.5;
    this.jog.som = this.add.image(0, 0, 'sombra').setAlpha(0.9);
    this.jog.spr = this.add.image(0, 0, 'jog_melee0');
    this.camX = this.jog.x * TS; this.camY = this.jog.y * TS;

    // inimigos
    for (const sp of m.spawns) this.criarInimigo(sp.tipo, sp.x + 0.5, sp.y + 0.5);

    // luz / fog
    const lm = this.textures.createCanvas('lm', W, H)!; this.lm = lm;
    this.lmData = lm.context.createImageData(W, H);
    this.add.image(0, 0, 'lm').setOrigin(0).setScale(TS).setDepth(100000);
    this.gfx = this.add.graphics().setDepth(90000);
    this.clarao = this.add.image(0, 0, 'clarao').setBlendMode(Phaser.BlendModes.ADD).setDepth(90001).setVisible(false);

    this.teclas = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,F,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    if (this.desktop) {
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => { this.mouse.x = p.worldX / TS; this.mouse.y = p.worldY / TS; this.mouse.ativo = true; });
      this.input.on('pointerdown', () => { this.mouse.baixo = true; });
      this.input.on('pointerup', () => { this.mouse.baixo = false; });
      this.input.keyboard!.on('keydown-E', () => this.interagir());
      this.input.keyboard!.on('keydown-F', () => this.lanterna());
      this.input.keyboard!.on('keydown-Q', () => this.trocarArma());
      for (const [k, v] of [['ONE', 'agua'], ['TWO', 'comida'], ['THREE', 'curar'], ['FOUR', 'antirrad']] as [string, Rapido][]) this.input.keyboard!.on('keydown-' + k, () => this.usarRapido(v));
    }
    this.scale.on('resize', () => this.ajustarZoom());
    this.ajustarZoom();
    for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 1; cx++) this.assar(Math.floor(this.jog.x / CH) + cx, Math.floor(this.jog.y / CH) + cy);

    ponte.cmd = {
      interagir: () => this.interagir(), usarRapido: k => this.usarRapido(k), usarItem: id => this.usarItem(id), largar: id => this.largar(id),
      trocarArma: () => this.trocarArma(), lanterna: () => this.lanterna(), tocarMascara: () => this.tocarMascara(),
      pausar: p => { try { if (!this.sys?.isActive() && !this.sys?.isPaused()) return; if (p) this.scene.pause(); else this.scene.resume(); } catch { /* cena já destruída */ } },
    };
    this.events.once('shutdown', () => { ponte.cmd = null; });
    this.sincronizar(true);
  }

  // ------------------------------------------------------------------ arte / mundo
  chaveProp(p: Prop) {
    switch (p.tipo) {
      case 'carro': return 'carro' + (p.cor % 3); case 'carro_v': return 'carro_v' + (p.cor % 3);
      case 'ferramentas': return 'ferramentas'; case 'barril': return 'barril' + (p.cor % 2); case 'bunker': return 'bunker';
      default: return p.tipo + (p.cor % 3);
    }
  }
  nomeTile(t: number, x: number, y: number) {
    const h = hash(x, y);
    switch (t) {
      case T.TERRA: return 'terra' + [0, 1, 0, 1, 0, 1, 2, 3, 4, 5][h % 10];
      case T.ESTRADA: return 'estrada' + (h % 4); case T.LINHA_H: return 'linha_h' + (h % 2); case T.LINHA_V: return 'linha_v' + (h % 2);
      case T.CALCADA: return 'calcada' + (h % 3); case T.MADEIRA: case T.PORTA: return 'madeira' + (h % 3); case T.AZULEJO: return 'azulejo' + (h % 2);
      case T.PAREDE: return 'parede' + (h % 3); case T.JANELA: return 'janela' + (h % 2); case T.ENTULHO: return 'entulho' + (h % 3);
      default: return 'concreto' + (h % 2);
    }
  }
  assar(cx: number, cy: number) {
    const key = `ch_${cx}_${cy}`;
    if (cx < 0 || cy < 0 || cx * CH >= W || cy * CH >= H || this.chunks.has(key)) return;
    const c = document.createElement('canvas'); c.width = c.height = CH * TS; const g = c.getContext('2d')!;
    const m = this.mundo; const parede = (x: number, y: number) => dentro(x, y) && (m.tipos[idx(x, y)] === T.PAREDE || m.tipos[idx(x, y)] === T.JANELA);
    const rc = document.createElement('canvas'); rc.width = rc.height = CH; const rg = rc.getContext('2d')!; const rd = rg.createImageData(CH, CH);
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const X = cx * CH + tx, Y = cy * CH + ty; if (!dentro(X, Y)) continue;
      g.drawImage(this.atlas[this.nomeTile(m.tipos[idx(X, Y)], X, Y)], tx * TS, ty * TS);
      const r = m.rad[idx(X, Y)], o = (ty * CH + tx) * 4;
      rd.data[o] = 150; rd.data[o + 1] = 255; rd.data[o + 2] = 40; rd.data[o + 3] = r > 0.06 ? Math.min(150, r * 190) : 0;
    }
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) { // faces e sombras das paredes (luz vem do canto superior esquerdo)
      const X = cx * CH + tx, Y = cy * CH + ty; if (!dentro(X, Y) || parede(X, Y)) continue;
      const px = tx * TS, py = ty * TS;
      if (parede(X, Y - 1)) {
        const f = g.createLinearGradient(0, py, 0, py + 10); f.addColorStop(0, '#3b352d'); f.addColorStop(1, '#25211b'); g.fillStyle = f; g.fillRect(px, py, TS, 10);
        const s = g.createLinearGradient(0, py + 10, 0, py + 34); s.addColorStop(0, 'rgba(0,0,0,.55)'); s.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = s; g.fillRect(px, py + 10, TS, 24);
      }
      if (parede(X - 1, Y)) { const s = g.createLinearGradient(px, 0, px + 16, 0); s.addColorStop(0, 'rgba(0,0,0,.38)'); s.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = s; g.fillRect(px, py, 16, TS); }
    }
    rg.putImageData(rd, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const ov = document.createElement('canvas'); ov.width = ov.height = CH * TS; const og = ov.getContext('2d')!; og.imageSmoothingEnabled = true; og.drawImage(rc, 0, 0, CH * TS, CH * TS);
    g.drawImage(ov, 0, 0);
    g.shadowColor = 'rgba(190,255,80,.9)'; g.shadowBlur = 10; g.strokeStyle = 'rgba(200,255,90,.75)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const X = cx * CH + tx, Y = cy * CH + ty; if (!dentro(X, Y) || m.rad[idx(X, Y)] < 0.6 || hash(X, Y) % 3) continue;
      let x = tx * TS + 10 + (hash(Y, X) % 44), y = ty * TS + 10 + (hash(X + 3, Y) % 44); g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += ((hash(X + k, Y) % 21) - 10); y += ((hash(X, Y + k) % 21) - 10); g.lineTo(x, y); } g.stroke();
    }
    g.shadowBlur = 0;
    const tex = this.textures.addCanvas(key, c); void tex;
    this.chunks.set(key, this.add.image(cx * CH * TS, cy * CH * TS, key).setOrigin(0).setDepth(-1000));
  }
  fluxoChunks() {
    const cx = Math.floor(this.jog.x / CH), cy = Math.floor(this.jog.y / CH);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.assar(cx + dx, cy + dy);
    for (const [k, img] of this.chunks) {
      const [, a, b] = k.split('_').map(Number);
      if (Math.abs(a - cx) > 2 || Math.abs(b - cy) > 2) { img.destroy(); this.textures.remove(k); this.chunks.delete(k); }
    }
  }
  ajustarZoom() {
    const dpr = window.devicePixelRatio || 1; const cssW = this.scale.width / dpr;
    const tile = Math.min(46, Math.max(30, cssW / 11));
    this.cameras.main.setZoom((tile * dpr) / TS);
  }

  // ------------------------------------------------------------------ utilidades
  tipoEm(x: number, y: number) { return dentro(x, y) ? this.mundo.tipos[idx(x, y)] : T.PAREDE; }
  solidoEm(x: number, y: number) { return !dentro(x, y) || this.mundo.solido[idx(x, y)] === 1; }
  colide(x: number, y: number, r: number) {
    for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (this.solidoEm(tx, ty)) return true;
    return false;
  }
  temLOS(x0: number, y0: number, x1: number, y1: number) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.3);
    for (let i = 1; i < n; i++) { const t = i / n, tx = Math.floor(x0 + (x1 - x0) * t), ty = Math.floor(y0 + (y1 - y0) * t); if (!dentro(tx, ty) || this.mundo.opaco[idx(tx, ty)]) return false; }
    return true;
  }
  obstaculoAte(x: number, y: number, a: number, max: number) {
    for (let d = 0.2; d < max; d += 0.15) { const tx = Math.floor(x + Math.cos(a) * d), ty = Math.floor(y + Math.sin(a) * d); if (this.solidoEm(tx, ty) && this.tipoEm(tx, ty) !== T.JANELA) return d; if (this.solidoEm(tx, ty)) return d; }
    return max;
  }
  texto(x: number, y: number, t: string, cor = '#ffe9b0') {
    const o = this.add.text(x * TS, y * TS, t, { fontFamily: 'Nunito, sans-serif', fontStyle: '900', fontSize: '30px', color: cor, stroke: '#0a0806', strokeThickness: 6 }).setOrigin(0.5).setDepth(95000);
    this.tweens.add({ targets: o, y: o.y - 70, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => o.destroy() });
  }
  ruido(x: number, y: number, raio: number) {
    if (raio >= 5) this.efeitos.push({ k: 'anel', x, y, a: 0, r: raio, t: 0, dur: 0.7 });
    for (const e of this.inim) {
      if (!e.vivo || e.estado === 'persegue') continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < raio) { e.estado = 'investiga'; e.alvo = { x, y }; e.caminho = []; e.tCam = 0; }
    }
  }

  // ------------------------------------------------------------------ inimigos
  criarInimigo(tipo: Tipo, x: number, y: number) {
    const som = this.add.image(0, 0, 'sombra').setAlpha(0.8);
    const spr = this.add.image(0, 0, tipo + '0').setAlpha(0);
    if (tipo === 'rato') spr.setScale(0.75);
    const e: Ini = { tipo, x, y, hp: DEF[tipo].hp, ang: Math.random() * 6.28, estado: 'ocioso', alvo: null, caminho: [], tCam: 0, cd: 0, tSent: Math.random(), semVer: 0, vagar: Math.random() * 3, kx: 0, ky: 0, fase: Math.random() * 10, vivo: true, spr, som };
    this.inim.push(e); return e;
  }
  ferir(e: Ini, dano: number, de: number) {
    if (!e.vivo) return;
    e.hp -= dano; this.texto(e.x, e.y - 0.6, String(Math.round(dano)));
    e.kx = Math.cos(de) * 5; e.ky = Math.sin(de) * 5; e.estado = 'persegue'; e.semVer = 0; e.alvo = { x: this.jog.x, y: this.jog.y };
    e.spr.setTint(0xff8a70); this.time.delayedCall(90, () => { if (e.vivo) e.spr.clearTint(); });
    if (e.hp <= 0) {
      e.vivo = false; this.s.abates++; e.som.destroy(); e.spr.setDepth(-500).setTint(0x6a4a44).setAlpha(0.8).setRotation(Math.random() * 6.28);
      this.cadaveres.push(e.spr); if (this.cadaveres.length > 50) this.cadaveres.shift()?.destroy();
    }
  }
  iaInimigo(e: Ini, dt: number, noite: number) {
    const d = DEF[e.tipo], J = this.jog;
    const dx = J.x - e.x, dy = J.y - e.y, dist = Math.hypot(dx, dy);
    e.tSent -= dt;
    if (e.tSent <= 0) {
      e.tSent = 0.25 + Math.random() * 0.15;
      const mult = ponte.entrada.furtivo ? 0.5 : ponte.entrada.correr ? 1.3 : 1;
      const alc = d.visao * (1 - noite * 0.35) * mult;
      if (!this.morto && dist < alc && this.temLOS(e.x, e.y, J.x, J.y)) { if (e.estado !== 'persegue') e.tCam = 0; e.estado = 'persegue'; e.alvo = { x: J.x, y: J.y }; e.semVer = 0; }
      else if (e.estado === 'persegue') { e.semVer += 0.3; if (e.semVer > 6) { e.estado = 'investiga'; e.caminho = []; } }
    }
    let vel = d.vel * (1 + noite * 0.25) * (e.estado === 'persegue' ? 1 : 0.5);
    if (e.estado === 'ocioso') {
      e.vagar -= dt;
      if (e.vagar <= 0) { e.vagar = 2 + Math.random() * 4; if (Math.random() < 0.55) { const tx = Math.floor(e.x + (Math.random() - 0.5) * 7), ty = Math.floor(e.y + (Math.random() - 0.5) * 7); if (dentro(tx, ty) && !this.solidoEm(tx, ty)) { e.alvo = { x: tx + 0.5, y: ty + 0.5 }; e.caminho = []; e.tCam = 0; } } else e.alvo = null; }
    }
    if (e.alvo) {
      const adx = e.alvo.x - e.x, ady = e.alvo.y - e.y, ad = Math.hypot(adx, ady);
      if (ad < 0.5 && e.estado !== 'persegue') { e.alvo = null; if (e.estado === 'investiga') e.estado = 'ocioso'; }
      else {
        let tx = e.alvo.x, ty = e.alvo.y;
        const direto = ad < 6 && this.temLOS(e.x, e.y, e.alvo.x, e.alvo.y);
        if (!direto) {
          e.tCam -= dt;
          if ((!e.caminho.length || e.tCam <= 0) && this.pathBudget > 0) {
            this.pathBudget--; e.tCam = 0.7; const cam: [number, number][] = [];
            new ROT.Path.AStar(Math.floor(e.alvo.x), Math.floor(e.alvo.y), (x, y) => dentro(x, y) && !this.mundo.solido[idx(x, y)], { topology: 8 }).compute(Math.floor(e.x), Math.floor(e.y), (x, y) => cam.push([x, y]));
            cam.shift(); e.caminho = cam;
          }
          if (e.caminho.length) { tx = e.caminho[0][0] + 0.5; ty = e.caminho[0][1] + 0.5; if (Math.hypot(tx - e.x, ty - e.y) < 0.3) e.caminho.shift(); }
        }
        const a = Math.atan2(ty - e.y, tx - e.x); e.ang += ang(a - e.ang) * Math.min(1, dt * 9);
        const sx = Math.cos(a) * vel * dt, sy = Math.sin(a) * vel * dt;
        if (!this.colide(e.x + sx, e.y, d.raio)) e.x += sx; if (!this.colide(e.x, e.y + sy, d.raio)) e.y += sy;
        e.fase += vel * dt * 2.4;
      }
    }
    if (e.kx || e.ky) { const sx = e.kx * dt, sy = e.ky * dt; if (!this.colide(e.x + sx, e.y, d.raio)) e.x += sx; if (!this.colide(e.x, e.y + sy, d.raio)) e.y += sy; e.kx *= 0.82; e.ky *= 0.82; if (Math.abs(e.kx) < 0.05) e.kx = e.ky = 0; }
    e.cd -= dt;
    if (!this.morto && e.estado === 'persegue' && dist < 0.85 && e.cd <= 0) {
      e.cd = e.tipo === 'cao' ? 0.7 : 1; this.machucar(d.dano * (0.8 + Math.random() * 0.4), e.tipo === 'cao' ? 0.35 : 0.08);
    }
  }
  machucar(dano: number, chanceSangra: number) {
    this.s.hp -= dano; this.dano = 0.5;
    if (Math.random() < chanceSangra && !this.s.sangra) { this.s.sangra = true; useJogo.getState().toast('Você está sangrando', '#ff5733'); }
    this.texto(this.jog.x, this.jog.y - 0.6, '-' + Math.round(dano), '#ff6a4a');
    this.cameras.main.shake(140, 0.006); sfx.dano(); useJogo.setState({ danoTs: Date.now() });
    if (this.acao) { this.acao = null; useJogo.getState().toast('Interrompido', '#ffb060'); }
    if (this.s.hp <= 0) this.morrer('Morto por criaturas do ermo');
  }
  spawnDinamico() {
    const perto = this.inim.filter(e => e.vivo && Math.hypot(e.x - this.jog.x, e.y - this.jog.y) < 25).length;
    if (perto >= 4 || this.inim.length > 140) return;
    for (let t = 0; t < 20; t++) {
      const a = Math.random() * 6.28, r = 14 + Math.random() * 8, x = Math.floor(this.jog.x + Math.cos(a) * r), y = Math.floor(this.jog.y + Math.sin(a) * r);
      if (!dentro(x, y) || this.solidoEm(x, y) || this.mundo.tipos[idx(x, y)] === T.PORTA || this.luzFrame[idx(x, y)] > 0.1) continue;
      const n = 1 + Math.floor(Math.random() * 2); for (let k = 0; k < n; k++) this.criarInimigo('irr', x + 0.5 + k * 0.4, y + 0.5);
      break;
    }
  }

  // ------------------------------------------------------------------ combate
  armaAtual() { return this.s.arma ? ITENS[this.s.arma] : null; }
  atacar() {
    if (this.cdAtaque > 0 || this.morto || this.acao) return;
    const arma = this.armaAtual(), J = this.jog;
    if (arma?.id === 'pistola') {
      if (this.s.municao <= 0) { if (performance.now() - this.tAvisoMun > 900) { this.tAvisoMun = performance.now(); sfx.seco(); useJogo.getState().toast('Sem munição', '#ffb060'); } this.cdAtaque = 0.3; return; }
      this.s.municao--; this.cdAtaque = 0.38; const a = J.ang + (Math.random() - 0.5) * 0.07;
      const lim = this.obstaculoAte(J.x, J.y, a, 11); let alvo: Ini | null = null, melhor = lim;
      for (const e of this.inim) { if (!e.vivo) continue; const dx = e.x - J.x, dy = e.y - J.y, proj = dx * Math.cos(a) + dy * Math.sin(a); if (proj < 0 || proj > melhor) continue; const perp = Math.abs(-Math.sin(a) * dx + Math.cos(a) * dy); if (perp < DEF[e.tipo].raio + 0.12) { alvo = e; melhor = proj; } }
      const fim = alvo ? melhor : lim;
      this.efeitos.push({ k: 'tracer', x: J.x + Math.cos(a) * 0.8, y: J.y + Math.sin(a) * 0.8, a, r: fim, t: 0, dur: 0.08 });
      this.flash = 0.14; this.clarao.setPosition((J.x + Math.cos(a) * 0.9) * TS, (J.y + Math.sin(a) * 0.9) * TS).setVisible(true).setScale(1.5);
      sfx.tiro(); this.ruido(J.x, J.y, 20); this.cameras.main.shake(90, 0.004);
      if (alvo) { this.ferir(alvo, arma.dano!, a); sfx.acerto(); this.hitstop = 0.05; }
    } else {
      const dano = arma?.dano ?? 6, alc = arma?.alcance ?? 1.2; this.cdAtaque = arma?.id === 'facao' ? 0.38 : 0.55;
      if (this.s.stamina < 8) { this.cdAtaque = 0.8; return; } this.s.stamina -= 7;
      this.efeitos.push({ k: 'arco', x: J.x, y: J.y, a: J.ang, r: alc, t: 0, dur: 0.14 }); sfx.golpe(); this.ruido(J.x, J.y, 5);
      let bateu = false;
      for (const e of this.inim) {
        if (!e.vivo) continue; const dx = e.x - J.x, dy = e.y - J.y, d = Math.hypot(dx, dy);
        if (d < alc + DEF[e.tipo].raio && Math.abs(ang(Math.atan2(dy, dx) - J.ang)) < 1.0 && this.temLOS(J.x, J.y, e.x, e.y)) { this.ferir(e, dano * (0.85 + Math.random() * 0.3), J.ang); bateu = true; }
      }
      if (bateu) { sfx.acerto(); this.hitstop = 0.055; this.cameras.main.shake(100, 0.005); }
    }
  }

  // ------------------------------------------------------------------ interação / itens
  rotulo(p: Prop) { return ({ geladeira: 'Geladeira', armario: 'Armário', caixa: 'Caixa', ferramentas: 'Caixa de ferramentas', carro: 'Porta-malas', carro_v: 'Porta-malas' } as Record<string, string>)[p.tipo] ?? p.tipo; }
  alvoProx(): { p: Prop; rot: string } | null {
    let melhor: { p: Prop; rot: string } | null = null, md = 9;
    for (const { p } of this.props) {
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2, d = Math.hypot(cx - this.jog.x, cy - this.jog.y);
      if (p.tipo === 'bunker') { if (d < 2.6 && d < md) { md = d; melhor = { p, rot: 'Entrar no ABRIGO 7' }; } continue; }
      if (!p.loot || p.aberto || d > 1.45 + (Math.max(p.w, p.h) - 1) * 0.5 || d >= md) continue;
      md = d; melhor = { p, rot: 'Vasculhar ' + this.rotulo(p).toLowerCase() };
    }
    return melhor;
  }
  interagir() {
    if (this.acao || this.morto) return; const alvo = this.alvoProx(); if (!alvo) return;
    if (alvo.p.tipo === 'bunker') { this.vencer(); return; }
    const dur = ({ geladeira: 2.2, armario: 2.6, caixa: 1.6, ferramentas: 2, carro: 3, carro_v: 3 } as Record<string, number>)[alvo.p.tipo] ?? 2;
    this.acao = { rotulo: alvo.rot.replace('Vasculhar', 'Vasculhando'), dur, t: 0, ruido: 3, fim: () => this.concluirSaque(alvo.p) }; sfx.saque();
  }
  concluirSaque(p: Prop) {
    const st = useJogo.getState(); const inv = { ...st.inv }; const resto: string[] = []; let raro = false;
    for (const id of p.loot ?? []) {
      const it = ITENS[id];
      if (it.tipo === 'municao') { this.s.municao += it.balas!; st.toast(`+ ${it.nome}`, COR_RARIDADE[it.raridade]); continue; }
      if (pesoInv(inv) + it.peso > PESO_MAX) { resto.push(id); continue; }
      inv[id] = (inv[id] ?? 0) + 1; st.toast(`+ ${it.nome}`, COR_RARIDADE[it.raridade]);
      if (it.raridade === 'raro') raro = true; if (id === 'lanterna') this.s.lanterna.tem = true;
    }
    if (resto.length) st.toast('Mochila cheia', '#ff9a5a');
    p.loot = resto; if (!resto.length) p.aberto = true;
    this.props.find(x => x.p === p)?.spr.setTint(0x6a6a6a);
    this.s.vasculhados++; useJogo.setState({ inv });
    if (raro) { sfx.raro(); this.cameras.main.flash(220, 255, 225, 80); } else sfx.achado();
  }
  iniciarUso(rotulo: string, dur: number, fim: () => void) { if (this.acao || this.morto) return; this.acao = { rotulo, dur, t: 0, fim }; }
  consumir(id: string) { const inv = { ...useJogo.getState().inv }; if (!inv[id]) return false; inv[id]--; if (inv[id] <= 0) delete inv[id]; useJogo.setState({ inv }); return true; }
  efeitoItem(id: string) {
    const it = ITENS[id], s = this.s; if (!this.consumir(id)) return;
    if (it.fome) s.fome = Math.min(100, s.fome + it.fome); if (it.sede) s.sede = Math.min(100, s.sede + it.sede);
    if (it.hp) s.hp = Math.min(s.maxHp, s.hp + it.hp); if (it.estanca) s.sangra = false; if (it.rad) s.rad = Math.max(0, Math.min(100, s.rad + it.rad));
    if (it.bateria) s.lanterna.bat = Math.min(100, s.lanterna.bat + it.bateria);
    sfx.comer(); useJogo.getState().toast(it.nome + ' usado', '#9be8b0');
  }
  usarItem(id: string) {
    const it = ITENS[id]; if (!it) return; const inv = useJogo.getState().inv; if (!inv[id]) return;
    if (it.tipo === 'arma') { this.s.arma = id; useJogo.getState().toast(it.nome + ' equipado'); return; }
    if (id === 'mascara') { this.tocarMascara(); return; }
    if (id === 'lanterna') { this.lanterna(); return; }
    if (it.tipo === 'especial') { useJogo.getState().toast('Sinal fraco… siga a seta', '#8fe8ff'); return; }
    if (id === 'bateria' && !this.s.lanterna.tem) { useJogo.getState().toast('Precisa de uma lanterna'); return; }
    this.iniciarUso('Usando ' + it.nome.toLowerCase(), 1.0, () => this.efeitoItem(id));
  }
  usarRapido(k: Rapido) {
    const inv = useJogo.getState().inv, tem = (id: string) => (inv[id] ?? 0) > 0; let id: string | undefined;
    if (k === 'agua') id = tem('agua') ? 'agua' : undefined;
    if (k === 'comida') id = ['enlatado', 'pao', 'carne'].find(tem);
    if (k === 'curar') id = this.s.sangra ? ['bandagem', 'kit'].find(tem) : (this.s.hp < this.s.maxHp ? ['bandagem', 'kit'].find(tem) : undefined);
    if (k === 'antirrad') id = tem('antirrad') ? 'antirrad' : undefined;
    if (!id) { useJogo.getState().toast({ agua: 'Sem água', comida: 'Sem comida', curar: this.s.sangra || this.s.hp < this.s.maxHp ? 'Sem curativos' : 'Saúde cheia', antirrad: 'Sem antirrad' }[k], '#ffb060'); return; }
    this.usarItem(id);
  }
  largar(id: string) { if (this.consumir(id)) useJogo.getState().toast(ITENS[id].nome + ' largado'); }
  trocarArma() {
    const inv = useJogo.getState().inv, ciclo = ['pe_de_cabra', 'facao', 'pistola'].filter(i => inv[i]); const lista: (string | null)[] = [...ciclo, null];
    const i = lista.indexOf(this.s.arma); this.s.arma = lista[(i + 1) % lista.length]; useJogo.getState().toast(this.s.arma ? ITENS[this.s.arma].nome : 'Punhos');
  }
  lanterna() {
    const l = this.s.lanterna; if (!(useJogo.getState().inv.lanterna)) { useJogo.getState().toast('Sem lanterna', '#ffb060'); return; }
    l.tem = true; if (l.bat <= 0) { useJogo.getState().toast('Bateria descarregada', '#ffb060'); return; } l.ligada = !l.ligada; sfx.toque();
  }
  tocarMascara() { if (!useJogo.getState().inv.mascara) { useJogo.getState().toast('Sem máscara', '#ffb060'); return; } this.s.mascara = !this.s.mascara; useJogo.getState().toast(this.s.mascara ? 'Máscara colocada' : 'Máscara removida'); }
  abrirPorta(i: number) { const d = this.portas.get(i); if (!d || d.aberta) return; d.aberta = true; d.t = 0; this.mundo.opaco[i] = 0; d.spr.setTexture('porta_a').setRotation(d.horiz ? 0 : -Math.PI / 2).setPosition((i % W) * TS + (d.horiz ? 0 : 0), Math.floor(i / W) * TS).setOrigin(0, 0); sfx.porta(); this.ruido((i % W) + 0.5, Math.floor(i / W) + 0.5, 4); }
  fecharPorta(i: number) { const d = this.portas.get(i); if (!d || !d.aberta) return; d.aberta = false; this.mundo.opaco[i] = 1; d.spr.setTexture('porta_f').setOrigin(0.5).setRotation(d.horiz ? 0 : Math.PI / 2).setPosition((i % W) * TS + 32, Math.floor(i / W) * TS + 32); }

  // ------------------------------------------------------------------ fim de jogo
  morrer(causa: string) {
    if (this.morto) return; this.morto = true; sfx.morte(); this.cameras.main.fadeOut(900, 20, 0, 0);
    const J = this.jog, dist = Math.round(Math.hypot(this.mundo.abrigo.x - J.x, this.mundo.abrigo.y - J.y));
    this.time.delayedCall(1000, () => { this.sincronizar(true); useJogo.setState({ resumo: this.resumo(causa, false, dist), tela: 'morte', acao: null }); });
  }
  vencer() {
    if (this.morto) return; this.morto = true; sfx.vitoria();
    this.time.delayedCall(300, () => { this.sincronizar(true); useJogo.setState({ resumo: this.resumo('Chegou ao abrigo', true, 0), tela: 'vitoria', acao: null }); });
  }
  resumo(causa: string, vitoria: boolean, distAbrigo: number) {
    const dias = Math.floor(this.s.minutos / 1440) + 1; return { causa, dias, hora: horaStr(this.s.minutos), abates: this.s.abates, vasculhados: this.s.vasculhados, radMax: Math.round(this.s.radMax), vitoria, distAbrigo };
  }

  // ------------------------------------------------------------------ luz (cone de visão estilo Zomboid sobre o FOV do rot.js)
  atualizarLuz(dt: number) {
    const J = this.jog, px = Math.floor(J.x), py = Math.floor(J.y), amb = this.ambient, noite = 1 - amb;
    this.luzFrame.fill(0);
    const lant = this.s.lanterna.ligada && this.s.lanterna.bat > 0;
    const meia = 1.22, alcCone = lant ? 12 : amb > 0.5 ? 14 : 6.5, alcLant = 12;
    const base = noite * 0.78, mem = Math.max(0.55, base + 0.2);
    const boost = this.flash > 0 ? 1 : 0;
    this.fov.compute(px, py, 13, (x: number, y: number) => {
      const dx = x + 0.5 - J.x, dy = y + 0.5 - J.y, d = Math.hypot(dx, dy), da = Math.abs(ang(Math.atan2(dy, dx) - J.ang));
      const cone = sstep(meia + 0.12, meia - 0.18, da) * (1 - sstep(alcCone * 0.6, alcCone, d));
      const near = 1 - sstep(2.4, 4.8, d);
      const fl = boost ? 1 - sstep(4, 7, d) : 0;
      const luz = Math.max(cone, near, fl); const i = idx(x, y);
      this.luzFrame[i] = luz; if (luz > 0.5) this.seen[i] = 1;
      const lanter = lant ? sstep(meia + 0.12, meia - 0.18, da) * (1 - sstep(alcLant * 0.6, alcLant, d)) : 0;
      const aLuz = base * (1 - 0.88 * Math.max(lanter, fl)) * (1 - 0.35 * near);
      const alvo = this.seen[i] ? mem : 0.93;
      this.lmA[i] = alvo * (1 - luz) + aLuz * luz; // alvo imediato; suavizado abaixo
    });
    const cr = Math.round(10 + amb * 0), cg = Math.round(8 + noite * 3), cb = Math.round(8 + noite * 20); const d = this.lmData.data;
    for (let i = 0; i < W * H; i++) {
      const alvo = this.luzFrame[i] > 0 || this.lmA[i] < 0.9 ? this.lmA[i] : this.seen[i] ? mem : 0.93;
      this.lmA[i] += (alvo - this.lmA[i]) * Math.min(1, dt * 16); const o = i * 4;
      d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = Math.round(Math.min(1, Math.max(0, this.lmA[i])) * 255);
    }
    this.lm.context.putImageData(this.lmData, 0, 0); this.lm.refresh();
  }

  // ------------------------------------------------------------------ laço principal
  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    const s = this.s; this.pathBudget = 3;
    if (!this.morto) {
      s.minutos += dt * MIN_POR_SEG;
      const h = (s.minutos % 1440) / 60;
      this.ambient = h < 5 ? 0 : h < 7.5 ? (h - 5) / 2.5 : h < 18 ? 1 : h < 20.5 ? 1 - (h - 18) / 2.5 : 0;
      this.jogador(dt); this.necessidades(dt);
    }
    const noite = 1 - this.ambient; this.tSpawn += dt;
    if (!this.morto && this.tSpawn > 45) { this.tSpawn = 0; this.spawnDinamico(); }
    const ativos = this.inim.filter(e => e.vivo && Math.abs(e.x - this.jog.x) < 34 && Math.abs(e.y - this.jog.y) < 34);
    for (const e of ativos) this.iaInimigo(e, dt, noite);
    for (let i = 0; i < ativos.length; i++) for (let j = i + 1; j < ativos.length; j++) { // separação simples
      const a = ativos[i], b = ativos[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 0.6) { const f = (0.6 - d) * 0.5; if (!this.colide(a.x - dx / d * f, a.y, 0.28)) a.x -= dx / d * f; if (!this.colide(a.x, a.y - dy / d * f, 0.28)) a.y -= dy / d * f; if (!this.colide(b.x + dx / d * f, b.y, 0.28)) b.x += dx / d * f; if (!this.colide(b.x, b.y + dy / d * f, 0.28)) b.y += dy / d * f; }
    }
    this.atualizarLuz(dt); this.desenharEntidades(dt); this.camera(dt); this.fluxoChunks(); this.desenharEfeitos(dt);
    this.tPortas += dt; if (this.tPortas > 0.5) { this.tPortas = 0; for (const [i, d] of this.portas) if (d.aberta) { d.t += 0.5; const x = i % W, y = Math.floor(i / W); if (d.t > 4 && Math.hypot(x + 0.5 - this.jog.x, y + 0.5 - this.jog.y) > 6 && !this.inim.some(e => e.vivo && Math.hypot(e.x - x - 0.5, e.y - y - 0.5) < 1.2)) this.fecharPorta(i); } }
    this.tSync += dt; if (this.tSync > 0.1) { this.tSync = 0; this.sincronizar(false); }
  }

  jogador(dt: number) {
    const e = ponte.entrada, s = this.s, J = this.jog, k = this.teclas;
    let mx = e.mx, my = e.my; const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0), ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx || ky) { mx = kx; my = ky; } let m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; m = 1; }
    const corre = (e.correr || k.SHIFT.isDown) && s.stamina > 2, furtivo = e.furtivo; ponte.entrada.furtivo = furtivo;
    const base = furtivo ? 1.4 : corre ? 4.6 : 2.7, peso = 1 - Math.min(0.25, pesoInv(useJogo.getState().inv) / PESO_MAX * 0.2), cura = s.hp < 30 ? 0.88 : 1;
    const v = m > 0.12 ? base * Math.min(1, m) * peso * cura : 0; J.andando = v > 0;
    if (J.andando) {
      if (this.acao && m > 0.35) { this.acao = null; useJogo.getState().toast('Interrompido', '#ffb060'); }
      const sx = (mx / m) * v * dt, sy = (my / m) * v * dt;
      if (!this.colide(J.x + sx, J.y, 0.3)) J.x += sx; if (!this.colide(J.x, J.y + sy, 0.3)) J.y += sy;
      J.passo += v * dt;
      const fx = Math.floor(J.x + (mx / m) * 0.75), fy = Math.floor(J.y + (my / m) * 0.75); if (this.tipoEm(fx, fy) === T.PORTA) this.abrirPorta(idx(fx, fy));
      if (corre) s.stamina = Math.max(0, s.stamina - 14 * dt); else s.stamina = Math.min(100, s.stamina + 9 * dt);
    } else s.stamina = Math.min(100, s.stamina + 16 * dt);
    this.tRuido += dt; if (this.tRuido > 0.45) { this.tRuido = 0; const r = !J.andando ? 0 : corre ? 9 : furtivo ? 1.5 : 4; if (r > 2) this.ruido(J.x, J.y, r); }
    // mira: stick direito > mouse > direção do movimento
    let alvoAng = J.ang, atacando = e.atacar;
    if (e.mira && Math.hypot(e.ax, e.ay) > 0.2) { alvoAng = Math.atan2(e.ay, e.ax); atacando = Math.hypot(e.ax, e.ay) > 0.6; }
    else if (this.desktop && this.mouse.ativo) { alvoAng = Math.atan2(this.mouse.y - J.y, this.mouse.x - J.x); atacando = this.mouse.baixo || k.SPACE.isDown; }
    else if (J.andando) alvoAng = Math.atan2(my, mx);
    if (this.armaAtual()?.id === 'pistola' && (e.mira || this.mouse.baixo)) { // ajuda de mira leve
      let melhor: Ini | null = null, md = 0.18; for (const i of this.inim) { if (!i.vivo || this.luzFrame[idx(Math.floor(i.x), Math.floor(i.y))] < 0.4) continue; const da = Math.abs(ang(Math.atan2(i.y - J.y, i.x - J.x) - alvoAng)), d = Math.hypot(i.x - J.x, i.y - J.y); if (da < md && d < 11) { md = da; melhor = i; } }
      if (melhor) alvoAng += ang(Math.atan2(melhor.y - J.y, melhor.x - J.x) - alvoAng) * 0.5;
    }
    J.ang += ang(alvoAng - J.ang) * Math.min(1, dt * 16);
    this.cdAtaque -= dt; if (atacando) this.atacar();
    if (this.flash > 0) { this.flash -= dt; if (this.flash <= 0) this.clarao.setVisible(false); }
    this.tAlvo += dt; if (this.tAlvo > 0.12) { this.tAlvo = 0; const a = this.alvoProx(); useJogo.setState({ alvo: a ? a.rot : null }); }
    // ação com tempo (barra de progresso)
    if (this.acao) {
      this.acao.t += dt; if (this.acao.ruido && Math.random() < dt * 0.8) this.ruido(J.x, J.y, this.acao.ruido);
      if (this.acao.t >= this.acao.dur) { const f = this.acao.fim; this.acao = null; f(); }
    }
    useJogo.setState(st => (st.acao?.p === (this.acao ? this.acao.t / this.acao.dur : undefined) ? st : { acao: this.acao ? { rotulo: this.acao.rotulo, p: this.acao.t / this.acao.dur } : null }));
    this.dano = Math.max(0, this.dano - dt);
  }

  necessidades(dt: number) {
    const s = this.s, J = this.jog, dmin = dt * MIN_POR_SEG, st = useJogo.getState();
    s.fome = Math.max(0, s.fome - dmin * 0.052); s.sede = Math.max(0, s.sede - dmin * 0.085);
    const rad = this.mundo.rad[idx(Math.floor(J.x), Math.floor(J.y))] ?? 0, mask = s.mascara && st.inv.mascara ? 0.35 : 1;
    this.radSuave += (rad - this.radSuave) * Math.min(1, dt * 4);
    s.rad = Math.min(100, Math.max(0, s.rad + (rad > 0.05 ? Math.pow(rad, 1.2) * 2.4 * mask * dt : -0.03 * dt))); s.radMax = Math.max(s.radMax, s.rad);
    s.maxHp = 100 - s.rad * 0.5; if (s.hp > s.maxHp) s.hp = s.maxHp;
    let dreno = 0; if (s.sangra) dreno += 0.7; if (s.fome <= 0) dreno += 0.4; if (s.sede <= 0) dreno += 0.8; if (s.rad >= 100) dreno += 2;
    if (dreno) { s.hp -= dreno * dt; if (s.hp <= 0) this.morrer(s.sede <= 0 ? 'Morreu de sede' : s.fome <= 0 ? 'Morreu de fome' : s.sangra ? 'Sangrou até a morte' : 'Envenenado pela radiação'); }
    else if (s.fome > 40 && s.sede > 40 && s.rad < 70) s.hp = Math.min(s.maxHp, s.hp + 0.18 * dt);
    if (s.lanterna.ligada) { s.lanterna.bat = Math.max(0, s.lanterna.bat - 0.33 * dt); if (s.lanterna.bat <= 0) { s.lanterna.ligada = false; st.toast('A bateria acabou', '#ffb060'); } }
    const alvoCpm = 18 + this.radSuave * 900; s.cpm += (alvoCpm - s.cpm) * Math.min(1, dt * 3);
    setGeiger(s.cpm); setBatimento(s.hp < 30 && !this.morto);
    // objetivos encadeados (barras que ficam incompletas de propósito: Zeigarnik honesto)
    for (let n = 0; n < 4; n++) {
      if (s.objIdx === 0 && s.vasculhados >= 5) { s.objIdx = 1; st.toast('Objetivo cumprido', '#00ffcc'); }
      if (s.objIdx === 1 && s.minutos >= 20 * 60) { s.objIdx = 2; st.toast('Objetivo cumprido', '#00ffcc'); }
      if (s.objIdx === 2 && st.inv.radio) { s.objIdx = 3; s.sabeAbrigo = true; st.toast('Sinal do abrigo captado', '#00ffcc'); }
    }
  }

  // ------------------------------------------------------------------ apresentação
  desenharEntidades(dt: number) {
    const J = this.jog, arma = this.armaAtual(), tipoArma = !arma ? 'nenhuma' : arma.id === 'pistola' ? 'pistola' : 'melee';
    const fr = J.andando ? Math.floor(J.passo * 2.4) % 4 : 0;
    J.spr.setTexture(`jog_${tipoArma}${fr}`).setPosition(J.x * TS, J.y * TS).setRotation(J.ang).setDepth(J.y * TS);
    J.som.setPosition(J.x * TS + 5, J.y * TS + 9).setDepth(J.y * TS - 1);
    for (const e of this.inim) {
      if (!e.vivo) { const v = this.luzFrame[idx(Math.floor(e.x), Math.floor(e.y))] > 0.4; e.spr.setVisible(v); continue; }
      const luz = dentro(Math.floor(e.x), Math.floor(e.y)) ? this.luzFrame[idx(Math.floor(e.x), Math.floor(e.y))] : 0, v = luz > 0.4 ? 1 : 0;
      e.spr.alpha += (v - e.spr.alpha) * Math.min(1, dt * 12); e.som.alpha = e.spr.alpha * 0.8;
      const f = e.tipo === 'rato' ? Math.floor(e.fase) % 2 : Math.floor(e.fase) % 4;
      e.spr.setTexture(e.tipo + f).setPosition(e.x * TS, e.y * TS).setRotation(e.ang).setDepth(e.y * TS); e.som.setPosition(e.x * TS + 5, e.y * TS + 8).setDepth(e.y * TS - 1);
    }
  }
  camera(dt: number) {
    const e = ponte.entrada, J = this.jog, cam = this.cameras.main;
    const lx = Math.cos(J.ang) * 1.3 * TS, ly = Math.sin(J.ang) * 1.3 * TS;
    const k = 1 - Math.exp(-dt * 7); this.camX += (J.x * TS + lx * (e.mira ? 1.4 : 0.6) - this.camX) * k; this.camY += (J.y * TS + ly * (e.mira ? 1.4 : 0.6) - this.camY) * k; cam.centerOn(this.camX, this.camY);
  }
  desenharEfeitos(dt: number) {
    const g = this.gfx; g.clear();
    this.efeitos = this.efeitos.filter(f => (f.t += dt) < f.dur);
    for (const f of this.efeitos) {
      const p = f.t / f.dur;
      if (f.k === 'arco') { g.lineStyle(10 * (1 - p), 0xfff2c0, 0.85 * (1 - p)); g.beginPath(); g.arc(f.x * TS, f.y * TS, (f.r * 0.85) * TS, f.a - 0.9 + p * 0.5, f.a + 0.9 - (1 - p) * 0.2); g.strokePath(); }
      if (f.k === 'tracer') { g.lineStyle(4, 0xffe9a0, 1 - p); g.beginPath(); g.moveTo(f.x * TS, f.y * TS); g.lineTo((f.x + Math.cos(f.a) * f.r) * TS, (f.y + Math.sin(f.a) * f.r) * TS); g.strokePath(); }
      if (f.k === 'anel') { g.lineStyle(3, 0xff5733, 0.4 * (1 - p)); g.strokeCircle(f.x * TS, f.y * TS, f.r * TS * (0.15 + p * 0.85)); }
    }
  }
  sincronizar(forcar: boolean) {
    const s = this.s, J = this.jog, st = useJogo.getState();
    const dx = this.mundo.abrigo.x - J.x, dy = this.mundo.abrigo.y - J.y, dist = Math.hypot(dx, dy);
    let prog = 0;
    if (s.objIdx === 0) prog = s.vasculhados / 5; else if (s.objIdx === 1) prog = Math.min(1, Math.max(0, (s.minutos % 1440 - 480) / 720)); else if (s.objIdx === 2) prog = 0.08; else prog = Math.max(0.05, 1 - dist / this.distAbrigo0);
    useJogo.setState({
      minutos: s.minutos, hp: s.hp, maxHp: s.maxHp, fome: s.fome, sede: s.sede, stamina: s.stamina, rad: s.rad, sangra: s.sangra, municao: s.municao, arma: s.arma, mascara: s.mascara,
      lanterna: { ...s.lanterna, tem: !!st.inv.lanterna }, cpm: Math.round(s.cpm), objIdx: s.objIdx, objProg: prog, abrigoDist: Math.round(dist), abrigoDir: Math.atan2(dy, dx), sabeAbrigo: s.sabeAbrigo,
      vasculhados: s.vasculhados, abates: s.abates, radMax: s.radMax, furtivo: ponte.entrada.furtivo,
    });
    void forcar;
  }
}

export function criarJogo(pai: HTMLElement, seed: string): Phaser.Game {
  const dpr = window.devicePixelRatio || 1;
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: pai, backgroundColor: '#050403', disableContextMenu: true,
    scale: { mode: Phaser.Scale.NONE, width: Math.max(2, pai.clientWidth * dpr), height: Math.max(2, pai.clientHeight * dpr) },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' }, fps: { target: 60 }, scene: [],
  });
  game.canvas.style.width = '100%'; game.canvas.style.height = '100%';
  game.scene.add('cena', Cena, true, { seed });
  const ro = new ResizeObserver(() => game.scale.resize(Math.max(2, pai.clientWidth * dpr), Math.max(2, pai.clientHeight * dpr)));
  ro.observe(pai); game.events.once('destroy', () => ro.disconnect());
  return game;
}
export { vibra };
