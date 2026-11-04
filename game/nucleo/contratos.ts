// CONTRATOS entre a cena e as libs de área (sprint 1 do Plano GOTY, docs/plano-goty/).
// Regra do time: cada lib implementa a sua parte daqui, numa pasta própria; ninguém importa a pasta de outra lib —
// os tipos compartilhados moram aqui e a conversa em tempo de jogo passa pelo barramento (game/nucleo/barramento.ts).
// Mudou um contrato? Só a coordenação muda este arquivo (peça na sua INTEGRACAO.md).
// Tudo aqui é puro: sem Phaser, sem DOM, sem Math.random no que afeta o resultado (use game/lib/rng.ts com seed).

// ================================================================ fachada do mundo (a cena preenche; as libs só leem)
export type ClimaMundo = { tipo: string; chuva: number; vento: number; /** radianos, para onde o vento SOPRA (0 = +x do grid) */ ventoDir: number; neblina: number; poeira: number; acida: boolean };
export type ZonaMundo = { id: string; bioma: string; w: number; h: number; tipos: Uint8Array; solido: Uint8Array; opaco: Uint8Array; /** radiação-base gerada pela zona (0..1 por casa) */ rad: Float32Array };
export type Mundo = {
  seed: string; zona: ZonaMundo; minutos: number; /** 1.. */ dia: number; /** 0..24 */ hora: number;
  jogador: { x: number; y: number; ang: number; hp: number; maxHp: number; furtivo: boolean; mascara: boolean };
  clima: ClimaMundo; interior: boolean; /** 0..1, hostis perto e em perseguição */ perigo: number;
  /** ato da campanha (1..4) e dificuldade (0 Calmo, 1 Normal, 2 Brutal) */ ato: number; dif: number;
};

/** módulo plugado na cena pelo núcleo (game/nucleo/modulos.ts); cada lib exporta um */
export interface ModuloJogo<S = unknown> {
  id: string;
  /** ao entrar numa zona (também depois de carregar um save) */
  iniciar?(m: Mundo): void;
  /** a cada quadro; dt em segundos de jogo real (o jogo pausado não chama) */
  tick?(dt: number, m: Mundo): void;
  /** estado que vai no save da run (JSON puro) */
  salvar?(): S;
  carregar?(s: S | undefined): void;
}

/** texto do jogo: todo texto que o jogador lê nasce marcado com a autoria (política de IA, Plano GOTY §3) */
export type Autoria = 'rascunho-ia' | 'humano';

// ================================================================ RADIAÇÃO (lib: game/lib/radiacao/) — pilar "Ouvir o invisível"
export type TipoFonteRad = 'cratera' | 'barril' | 'carcaca' | 'cogumelo' | 'colosso' | 'po_azul';
export type FonteRad = { x: number; y: number; forca: number; tipo: TipoFonteRad };
export interface CampoRadiacao {
  /** taxa no ponto (0 = limpo, 1 = zona quente; pode passar de 1 junto a fontes fortes) */
  amostra(x: number, y: number): number;
  /** para onde a taxa SOBE (vetor unitário; {0,0} se plano) */
  gradiente(x: number, y: number): { dx: number; dy: number };
  /** avança a pluma: vento leva, chuva deposita e lava, poeira espalha */
  passo(dt: number, clima: ClimaMundo): void;
  fontes(): readonly FonteRad[];
}
export type DegrauDose = 0 | 1 | 2 | 3 | 4; // 0 ok · 1 (≥100) −10 hp máx · 2 (≥250) náusea · 3 (≥400) visão escurece · 4 (≥500) aposenta
export interface Dosimetro {
  /** contaminação atual (curável com antirrad) — é o `rad` de hoje */ contaminacao: number;
  /** dose acumulada da vida (só cai devagar) */ dose: number;
  degrau(): DegrauDose;
  absorver(taxa: number, dt: number, protecao: { mascara: boolean; interior: boolean }): void;
  tratar(antirrad: number): void;
}
export type LeituraGeiger = { cpm: number; /** −1..1, lado de maior gradiente na tela */ pan: number; nivel: 0 | 1 | 2 | 3 };

// ================================================================ ESCUTA (lib: game/lib/escuta/) — pilar "Toda voz tem interesse"
export type EmissorId = 'farol' | 'filhos' | 'milicia' | 'saqueadores' | 'px' | 'sobrevivente';
export type Tecnica = 'escassez' | 'prova_social' | 'autoridade' | 'ancoragem' | 'quase_la' | 'reciprocidade' | 'pertencimento' | 'meia_verdade' | 'nenhuma';
export type TipoAlegacao = 'local' | 'conteudo' | 'radiacao' | 'prazo' | 'adesao' | 'autoridade';
export type Instrumento = 'geiger' | 'triangular' | 'cruzar' | 'tempo' | 'ir';
export type Verdade = 'verdade' | 'falso' | 'meia';
export type Alegacao = {
  id: string; tipo: TipoAlegacao; /** a frase exata que foi dita */ disseram: string; verdade: Verdade;
  /** o que é de fato (aparece no Caderno quando verificado) */ real: string; /** local do mapa a que se refere (id de game/dados/locais.ts) */ local?: string;
  /** como dá para checar dentro do jogo — toda alegação precisa de pelo menos um */ comoVerificar: Instrumento[];
};
export type EfeitoRadio = 'chiado' | 'vinheta' | 'vinheta_falha' | 'interferencia' | 'loop';
export type FalaRadio = { quem: string; texto: string; efeito?: EfeitoRadio; /** id de alegação que esta fala sustenta */ alegacao?: string };
export type Transmissao = {
  id: string; emissor: EmissorId; /** rótulo de dial, ex.: "107,7 FM" */ frequencia: string;
  /** minuto do dia em que vai ao ar (ex.: 400 = 6h40); ausente = qualquer hora em que o rádio pegar */ minuto?: number;
  /** atos em que pode tocar */ atos: number[]; tecnica: Tecnica; falas: FalaRadio[]; alegacoes: Alegacao[]; autoria: Autoria;
};
export type EstadoFicha = 'aberta' | Verdade;
export type FichaCaderno = { alegacaoId: string; transmissaoId: string; emissor: EmissorId; disseram: string; estado: EstadoFicha; real?: string; comoDescobri?: Instrumento; tecnica: Tecnica; dia: number };
export interface Caderno {
  fichas(): readonly FichaCaderno[];
  /** o jogador ouviu a transmissão: abre uma ficha por alegação ainda não registrada */
  ouvir(t: Transmissao, dia: number): FichaCaderno[];
  /** tenta resolver uma ficha com um instrumento; devolve a ficha atualizada ou null se o instrumento não serve para ela */
  verificar(alegacaoId: string, instr: Instrumento, dia: number): FichaCaderno | null;
  /** fim de ato: tudo que ficou aberto é resolvido e marcado como "você nunca foi ver" (Revelação diegética) */
  revelarAto(ato: number, dia: number): FichaCaderno[];
  salvar(): unknown; carregar(s: unknown): void;
}
/** o que está no ar agora (programação determinística por seed + dia + minuto) */
export interface Programacao { noAr(seed: string, dia: number, minuto: number, ato: number): Transmissao | null; proximas(seed: string, dia: number, minuto: number, ato: number, n: number): { t: Transmissao; minuto: number; dia: number }[] }

// ================================================================ NARRATIVA (lib: game/lib/narrativa/) — conteúdo + i18n
export type Idioma = 'pt' | 'en';
export type Genero = 'o' | 'a';
/** tradução: `t('chave', { n: 3, g: 'a' })`; no texto, {o|a} vira o gênero de Cris e {n} interpola */
export type Traduzir = (chave: string, vars?: Record<string, string | number>) => string;
export type Personagem = { id: string; nome: string; papel: string; arco: string; fala: string[]; autoria: Autoria };
export type Fita = { id: string; n: number; titulo: string; local: string; transcricao: string; autoria: Autoria };
export type BilheteLore = { id: string; titulo: string; texto: string; local?: string; ancora: boolean; ato?: number; autoria: Autoria };
/** a narrativa entrega o conteúdo nos tipos da Escuta: TRANSMISSOES: Transmissao[] */

// ================================================================ MÚSICA (lib: game/lib/musica/) — "O Brasil que sobrou toca no rádio, fora do tom"
export type EstadoMusical = 'silencio' | 'menu' | 'abrigo' | 'exploracao' | 'tensao' | 'combate' | 'colosso' | 'viagem' | 'morte' | 'vitoria';
export type VozId = 'viola' | 'rabeca' | 'pifano' | 'zabumba' | 'coral' | 'drone' | 'sanfona' | 'radio' | 'sino';
export type NotaAgendada = { /** segundos no relógio do AudioContext */ t: number; dur: number; voz: VozId; /** nota MIDI (62 = Ré4) */ midi: number; /** 0..1 */ vel: number; pan?: number };
export interface Maestro {
  estado(): EstadoMusical;
  /** pede um estado; a troca acontece na barra, com histerese (prioridade maior vence) */
  pedir(e: EstadoMusical, prioridade?: number): void;
  /** devolve as notas a agendar entre `agora` e `agora + janela` (chamado ~10×/s); puro e determinístico por seed */
  agendar(agora: number, janela: number): NotaAgendada[];
}

// ================================================================ ARTE (lib: game/lib/arte/) — "O mundo é cinza; a cor é rara e significa alguma coisa"
export type RGB = [number, number, number];
export type CtxGrade = { bioma: string; hora: number; ato: number; /** 0..1 radiação do ar */ rad: number; /** 0..1 */ hp01: number; clima: string; interior: boolean };
/** grade de cor do quadro: multiplicador (substitui o MULTIPLY atual), saturação global e tingimento das sombras */
export type Grade = { mult: RGB; saturacao: number; sombra: RGB; mistura: number };
export type Daltonismo = 'nenhum' | 'protan' | 'deutan' | 'tritan';

// ================================================================ PRODUÇÃO (lib: game/lib/producao/) — diagnóstico, telemetria honesta, demo
export type EventoTelemetria = { nome: string; t: number; dados?: Record<string, number | string | boolean> };
export interface Telemetria {
  /** desligada por padrão; nada sai do aparelho sem consentimento explícito */
  consentiu(): boolean; definirConsentimento(sim: boolean): void;
  registrar(nome: string, dados?: Record<string, number | string | boolean>): void;
  /** o que foi medido, para a tela "O que medimos" */ exportar(): EventoTelemetria[]; apagar(): void;
}
export type ResumoDesempenho = { fps: number; p50ms: number; p95ms: number; piorMs: number; amostras: number };
export interface MedidorDesempenho { quadro(dtMs: number): void; resumo(): ResumoDesempenho; zerar(): void }
export type ModoDemo = { ativo: boolean; /** ids de game/dados/locais.ts liberados na demo */ locais: string[]; /** último passo da campanha jogável */ ultimoObjetivo: string; mensagemFim: string };
