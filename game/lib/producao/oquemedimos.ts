// MOMENTO AUTORAL da Produção: a tela "O que medimos" é uma página do Caderno de Escuta sobre o próprio jogo.
// No Caderno, as facções dizem coisas e o jogador verifica (disseram × verdade × como descobri).
// Aqui quem diz é o CINZAS, sobre os seus dados: cada promessa da política vira uma ficha, e o carimbo
// (VERDADE / FALSO) é calculado do estado real deste aparelho na hora em que a tela abre — não é texto fixo.
// Se um dia o código quebrar uma promessa, a própria tela carimba FALSO. Puro: testado em Node.
import type { EventoTelemetria } from '../../nucleo/contratos';
import { CHAVES_PROIBIDAS, MAX_EVENTOS, RETENCAO_DIAS, type Idade } from './telemetria';

export type EstadoTelemetria = { consentiu: boolean; idade: Idade; desde?: number; eventos: number; pendentes: number; enviados: number; descartados: number; maisAntigo?: number; endpoint: boolean };
export type FichaDados = { id: string; disseram: string; estado: 'verdade' | 'falso'; verdade: string; comoVerificar: string };
export type EntradaCaderno = {
  estado: EstadoTelemetria; eventos: EventoTelemetria[];
  /** o que há de fato no armazenamento local sob a chave da telemetria (null = nada) — lido cru, por fora da classe */
  bruto: string | null; agora: number;
  /** pior quadro medido nesta sessão, em ms (0 = não mediu) */ piorQuadroMs: number;
};

const dias = (ms: number) => Math.floor(ms / 86_400_000);
const data = (t: number) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export function cadernoDosDados(e: EntradaCaderno): FichaDados[] {
  const { estado: s, eventos, bruto, agora } = e, f: FichaDados[] = [];
  const guardadoSemPermissao = !s.consentiu && bruto !== null;
  f.push({
    id: 'desligada', disseram: 'A telemetria vem desligada. Sem o seu sim, nada é guardado.',
    estado: guardadoSemPermissao ? 'falso' : 'verdade',
    verdade: s.consentiu ? `Você ligou em ${data(s.desde!)}. Até lá, nada foi guardado.` : guardadoSemPermissao ? 'Há dados guardados mesmo sem o seu sim. Isto é um defeito: apague abaixo e nos conte.' : 'Está desligada. O armazenamento deste aparelho não tem nenhum dado nosso.',
    comoVerificar: 'Leitura direta do armazenamento local, por fora do código que grava.',
  });
  f.push({
    id: 'envio', disseram: 'Nada sai do seu aparelho sem você deixar.',
    estado: s.enviados > 0 && !s.consentiu ? 'falso' : 'verdade',
    verdade: !s.endpoint ? `Esta versão não tem endereço de envio. Enviados: ${s.enviados}. Tudo fica aqui.` : s.consentiu ? `Enviados: ${s.enviados}. Esperando envio: ${s.pendentes}. Só para o servidor do próprio projeto.` : 'Há endereço de envio nesta versão, mas sem o seu sim ele não é usado. Enviados: 0.',
    comoVerificar: 'Contador de envios confirmados pelo servidor.',
  });
  const idadeMax = s.maisAntigo !== undefined ? dias(agora - s.maisAntigo) : 0;
  f.push({
    id: 'retencao', disseram: `Guardamos por no máximo ${RETENCAO_DIAS} dias e ${MAX_EVENTOS} registros.`,
    estado: idadeMax <= RETENCAO_DIAS && eventos.length <= MAX_EVENTOS ? 'verdade' : 'falso',
    verdade: eventos.length ? `O registro mais antigo tem ${plural(idadeMax, 'dia', 'dias')}. Há ${plural(eventos.length, 'registro', 'registros')}${s.descartados ? `; ${s.descartados} antigos já foram descartados` : ''}.` : 'Não há nenhum registro.',
    comoVerificar: 'Data do registro mais antigo da lista abaixo.',
  });
  const suspeito = eventos.find(ev => Object.entries(ev.dados ?? {}).some(([k, v]) => CHAVES_PROIBIDAS.test(k) || (typeof v === 'string' && /@/.test(v))));
  f.push({
    id: 'pessoal', disseram: 'Sem nome, e-mail, localização ou modelo do aparelho. Só eventos do jogo.',
    estado: suspeito ? 'falso' : 'verdade',
    verdade: suspeito ? `O registro "${suspeito.nome}" tem um campo que não devia estar aqui.` : eventos.length ? `Conferimos os ${plural(eventos.length, 'registro', 'registros')}: só nomes de evento, números do jogo e um código aleatório que muda quando você apaga.` : 'Nada para conferir: não há registro.',
    comoVerificar: 'Varredura de cada campo da lista abaixo.',
  });
  f.push({
    id: 'menor', disseram: 'Quem tem menos de 18 anos não é medido.',
    estado: s.idade === 'menor' && (eventos.length > 0 || bruto !== null) ? 'falso' : 'verdade',
    verdade: s.idade === 'menor' ? 'Você disse que tem menos de 18. Não guardamos nada, nem essa resposta.' : s.idade === 'adulto' ? 'Você disse que tem 18 anos ou mais.' : 'Você não respondeu a idade; sem resposta, nada é medido.',
    comoVerificar: 'A sua própria declaração, nesta tela.',
  });
  f.push({
    id: 'quadro', disseram: 'Os números de desempenho são os de verdade, não os que o jogo gostaria.',
    estado: 'verdade',
    verdade: e.piorQuadroMs > 0 ? `Medimos cada quadro da tela sem arredondar para cima: o pior desta sessão levou ${Math.round(e.piorQuadroMs)} ms.` : 'Ainda não medimos nenhum quadro nesta sessão.',
    comoVerificar: 'Relógio da tela (requestAnimationFrame), separado do relógio do jogo, que corta travadas em 50 ms.',
  });
  f.push({
    id: 'apagar', disseram: 'Você pode apagar tudo, quando quiser.',
    estado: 'verdade',
    verdade: 'O botão Apagar abaixo esvazia a lista e troca o código aleatório. Desligar apaga também o código.',
    comoVerificar: 'Aperte e veja a lista desta tela zerar.',
  });
  return f;
}

/** linha legível de um evento para a lista da tela (o jogador vê exatamente o que está guardado) */
export function linhaEvento(ev: EventoTelemetria): string {
  const d = new Date(ev.t), h = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dados = ev.dados ? Object.entries(ev.dados).map(([k, v]) => `${k}=${v}`).join(' ') : '';
  return `${data(ev.t)} ${h} · ${ev.nome}${dados ? ' · ' + dados : ''}`;
}
