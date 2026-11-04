// Retrato do aparelho para o diagnóstico e para a telemetria de desempenho. Sem identificador pessoal:
// nada de user agent inteiro, idioma, fuso, lista de fontes ou qualquer coisa que sirva para seguir alguém entre sites.
// `resumirUA` e `rotuloGpu` são puros (testados em Node); `lerAparelho` é o adaptador fino do navegador.

export type Aparelho = {
  /** ex.: "Android 14", "iOS 18", "Windows", "?" */ so: string;
  /** ex.: "Chrome 142", "Safari 18", "Firefox 140" */ navegador: string;
  movel: boolean;
  /** modelo, só quando o navegador entrega por Client Hints (Chrome Android); nunca vai na telemetria */ modelo?: string;
  dpr: number; /** CSS px, retrato: "412x915" */ tela: string; nucleos: number;
  /** GB aproximados (navigator.deviceMemory, só Chromium; arredondado pelo próprio navegador) */ memoriaGb?: number;
  /** renderizador WebGL (WEBGL_debug_renderer_info quando houver) */ gpu: string;
  webgl: 1 | 2 | 0; maxTextura?: number;
};

const maior = (v: string | undefined) => (v ? v.split(/[._]/)[0] : '');

/** reduz o user agent a SO + navegador com versão maior; descarta o resto (modelo, build, idioma) */
export function resumirUA(ua: string): { so: string; navegador: string; movel: boolean } {
  let so = '?', navegador = '?';
  const and = /Android (\d+)/.exec(ua), ios = /(?:iPhone|iPad|iPod).*? OS (\d+)/.exec(ua);
  // UA reduzido do Chrome congela "Android 10; K": a versão real só vem por Client Hints (lerDicas)
  if (and) so = /Android 10; K\)/.test(ua) ? 'Android ?' : `Android ${and[1]}`;
  else if (ios) so = `iOS ${ios[1]}`;
  else if (/Windows/.test(ua)) so = 'Windows';
  else if (/Mac OS X/.test(ua)) so = 'macOS';
  else if (/CrOS/.test(ua)) so = 'ChromeOS';
  else if (/Linux/.test(ua)) so = 'Linux';
  const m = (re: RegExp) => re.exec(ua)?.[1];
  if (m(/SamsungBrowser\/([\d.]+)/)) navegador = `Samsung Internet ${maior(m(/SamsungBrowser\/([\d.]+)/))}`;
  else if (m(/EdgA?\/([\d.]+)/)) navegador = `Edge ${maior(m(/EdgA?\/([\d.]+)/))}`;
  else if (m(/(?:Firefox|FxiOS)\/([\d.]+)/)) navegador = `Firefox ${maior(m(/(?:Firefox|FxiOS)\/([\d.]+)/))}`;
  else if (m(/CriOS\/([\d.]+)/)) navegador = `Chrome ${maior(m(/CriOS\/([\d.]+)/))}`;
  else if (m(/Chrome\/([\d.]+)/)) navegador = `Chrome ${maior(m(/Chrome\/([\d.]+)/))}`;
  else if (m(/Version\/([\d.]+).*Safari/)) navegador = `Safari ${maior(m(/Version\/([\d.]+).*Safari/))}`;
  return { so, navegador, movel: /Mobi|Android|iPhone|iPad/.test(ua) };
}

/** limpa o texto do renderizador: tira o embrulho do ANGLE e o lixo de driver, mantém o modelo da GPU */
export function rotuloGpu(bruto: string): string {
  let s = bruto.trim();
  const angle = /^ANGLE \((.*)\)$/.exec(s); if (angle) s = angle[1].split(',').slice(0, 2).map(x => x.trim()).filter(Boolean).join(' · ');
  s = s.replace(/\s*\(0x[0-9a-f]+\)/gi, '').replace(/Direct3D11.*$/i, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 64) || '?';
}

/** texto curto para o relatório e para o evento de telemetria (sem modelo) */
export function aparelhoCurto(a: Aparelho): string {
  return `${a.so} · ${a.navegador} · ${a.gpu} · ${a.nucleos} núcleos${a.memoriaGb ? ` · ${a.memoriaGb} GB` : ''} · tela ${a.tela} @${a.dpr}x`;
}

type NavLike = { userAgent?: string; hardwareConcurrency?: number; deviceMemory?: number };

/** lê o aparelho no navegador; em Node (testes) devolve um retrato vazio sem quebrar */
export function lerAparelho(): Aparelho {
  const nav: NavLike = typeof navigator !== 'undefined' ? (navigator as unknown as NavLike) : {};
  const { so, navegador, movel } = resumirUA(nav.userAgent ?? '');
  let dpr = 1, tela = '?';
  if (typeof window !== 'undefined') {
    dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    const w = Math.round(window.screen?.width ?? window.innerWidth), h = Math.round(window.screen?.height ?? window.innerHeight);
    tela = `${Math.min(w, h)}x${Math.max(w, h)}`;
  }
  const a: Aparelho = { so, navegador, movel, dpr, tela, nucleos: nav.hardwareConcurrency ?? 0, memoriaGb: nav.deviceMemory, gpu: '?', webgl: 0 };
  if (typeof document === 'undefined') return a;
  try {
    // contexto descartável só para perguntar o renderizador; liberado logo em seguida para não pesar no celular
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') as WebGLRenderingContext | null) ?? c.getContext('webgl');
    if (gl) {
      a.webgl = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 2 : 1;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      a.gpu = rotuloGpu(String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '?'));
      a.maxTextura = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || undefined;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch { /* sem WebGL */ }
  return a;
}

/** modelo e versão real do Android por Client Hints (só Chromium). Só para o relatório local; nunca vai na telemetria. */
export async function lerDicas(): Promise<{ modelo?: string; versaoSo?: string }> {
  try {
    const uad = (navigator as unknown as { userAgentData?: { getHighEntropyValues(h: string[]): Promise<{ model?: string; platformVersion?: string }> } }).userAgentData;
    const v = await uad?.getHighEntropyValues(['model', 'platformVersion']);
    return { modelo: v?.model || undefined, versaoSo: maior(v?.platformVersion) || undefined };
  } catch { return {}; }
}
