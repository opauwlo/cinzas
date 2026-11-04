# Produção: integração (para a coordenação)

Lib: `game/lib/producao/` + `components/Diag.tsx` + `docs/producao/`. Contrato: seção PRODUÇÃO de `game/nucleo/contratos.ts` (`Telemetria`, `MedidorDesempenho`, `ModoDemo`) + `ModuloJogo` id `'producao'`.

## Arquivos

| Arquivo | O que é | Roda em Node? |
|---|---|---|
| `desempenho.ts` | `Medidor` (implementa `MedidorDesempenho`): buffer circular `Float32Array`, p50/p95 por posto mais próximo, pior quadro, fps, travadas (≥ 50 ms), pausas (≥ 1 s, aba no fundo); `veredito` contra a meta p95 < 33 ms | sim |
| `telemetria.ts` | `TelemetriaLocal` (implementa `Telemetria`): desligada por padrão, só 18+, fila local de 500, 90 dias, `apagar`, revogar = apagar tudo, envio só com endpoint + consentimento (formato Umami `/api/send`) | sim |
| `oquemedimos.ts` | **momento autoral**: as promessas de privacidade viram fichas do Caderno ("disseram × verdade"), com carimbo calculado do estado real | sim |
| `demo.ts` | `lerModoDemo(NEXT_PUBLIC_DEMO)`, `localLiberado`, `objetivoLiberado`, `encerraDemo`, `motivoBloqueio`, mensagem de fim | sim |
| `aparelho.ts` | `resumirUA`/`rotuloGpu` (puros) + `lerAparelho`/`lerDicas` (adaptador): SO, navegador, DPR, tela, núcleos, memória, GPU WebGL | puros sim |
| `relatorio.ts` | texto do "copiar relatório" | sim |
| `navegador.ts` | adaptador fino: rAF que alimenta o medidor, INP (web-vitals), memória JS/texturas, ciclo de vida da aba | não |
| `index.ts` | API pública + `moduloProducao` (`ModuloJogo` id `'producao'`) | sim |
| `components/Diag.tsx` | `Diag` (default, sobreposição) e `OQueMedimos` (para a Config) | não |

**Achado que mudou o desenho:** a cena faz `dt = Math.min(0.05, dms / 1000)` e pula o tick no hit-stop. Se o medidor fosse alimentado pelo `tick`, nenhum quadro passaria de 50 ms e as travadas sumiriam do relatório. Por isso o medidor é alimentado por um `requestAnimationFrame` próprio (`navegador.ts`), independente do Phaser. O `tick` do módulo só conta o minuto para o relatório de desempenho da telemetria.

## Libs da comunidade avaliadas

**(a) Medição de desempenho**
| Opção | Licença | Peso | Encaixe | Decisão |
|---|---|---|---|---|
| stats.js (mrdoob) | MIT | ~2 KB | desenha painel próprio em canvas/DOM; dá fps/ms instantâneo, **não dá p50/p95** nem pior quadro da janela; última versão r17 (2017) | não |
| web-vitals (GoogleChrome) | Apache-2.0 | ~3,3 KB gzip (medido no pacote 6.2.3) | mede **INP** (toque → próxima pintura), que é a "latência de toque" do plano §5.2; não mede quadro | **sim, só para INP**, carregado sob demanda (`import()` dentro do Diag) |
| `game.loop.actualFps` do Phaser | MIT (já no jogo) | 0 | média suavizada, sem percentil, sem travada | só como está (HUD) |
| buffer circular próprio | — | ~1 KB | p50/p95/pior em O(n log n) só no resumo, O(1) por quadro | **sim** (não existe pacote pequeno que dê percentis de quadro sem trazer painel) |

**(b) Telemetria auto-hospedável**
| Opção | Licença | Decisão |
|---|---|---|
| Umami | MIT | **servidor sim**, script de rastreio **não**: o script dele envia URL, referrer, tela e idioma automaticamente. Mandamos direto para `/api/send` só o evento e os dados limpos. 🔶 Conferir o formato do corpo com a versão do Umami instalada (escrito para a v2). |
| Plausible | AGPL-3.0 | **vetado** (regra do time: nada de AGPL/GPL) |
| PostHog | MIT (núcleo) | pesado para celular (dezenas de KB), autocaptura e gravação de sessão: risco de LGPD. Não. |
| fila local própria | — | **sim**: é onde moram as garantias (opt-in, 18+, 90 dias, apagar) e é o que os testes provam |

Sem endpoint configurado (o padrão), **nada sai do aparelho**: a telemetria vira só um registro local que o próprio jogador vê em "O que medimos". Isso já serve para o playtest: o tester toca em "Copiar tudo" e cola.

## Linhas para o `CREDITS.md`

Em "Código (npm, em uso)":
```
web-vitals 6.2.3 (Apache-2.0, Google Chrome team): medição de INP (latência de toque) no diagnóstico `?diag=1`. Carregado só quando o Diag abre.
```
Se o servidor de telemetria for ligado, em "Serviços":
```
Umami (MIT), auto-hospedado: recebe os eventos de telemetria opt-in. O script de rastreio do Umami não é carregado no jogo.
```

## Passos da coordenação (trechos prontos)

**1. Dependência** (`package.json`; instalei com `--no-save` no worktree só para o typecheck):
```json
"web-vitals": "6.2.3"
```

**2. Registrar o módulo** — `game/nucleo/modulos.ts`:
```ts
import type { ModuloJogo } from './contratos';
import { moduloProducao } from '../lib/producao';

export const MODULOS: ModuloJogo[] = [moduloProducao /* , outros módulos */];
```

**3. Montar o Diag** (fora do `Jogo`, para aparecer também no menu e na carga):
- `app/page.tsx`:
```tsx
const Diag = dynamic(() => import('../components/Diag'), { ssr: false });
export default function Page() { return <><Jogo /><Diag /></>; }
```
- `tools/entrada.tsx` (artifact):
```tsx
import Diag from '../components/Diag';
createRoot(document.getElementById('root')!).render(<><Jogo /><Diag /></>);
```
Ligar: `?diag=1` (fica lembrado; `?diag=0` desliga), `#diag`, ou **segurar 4 dedos por 2 s** (o artifact não aceita parâmetro; 3 dedos não serve porque no Motorola é captura de tela).

**4. Ciclo de vida da sessão** — `components/Jogo.tsx`, junto do primeiro `useEffect`:
```tsx
import { ligarProducaoNoNavegador } from '../game/lib/producao/navegador';
// ...
useEffect(() => ligarProducaoNoNavegador(), []);
```

**5. Consentimento na Config** — `components/Paineis.tsx`, função `Config`, logo depois de `<ProgressoLocal />` (o plano §5.3 manda revogar e apagar em "Configurações → Seu progresso"):
```tsx
import { OQueMedimos } from './Diag';
// ...
<ProgressoLocal />
<OQueMedimos />
```
Não há pop-up de consentimento no início do jogo, de propósito: ninguém é empurrado a aceitar. Se a coordenação quiser um convite no alfa, que seja um card com "Sim" e "Não" do mesmo tamanho e "Não" como padrão.

**6. Evento de objetivo** (o barramento não tem evento de objetivo) — `game/sistemas/objetivos.ts`, em `avancarObjetivos`, dentro do `if (cumpridos.length && !silencioso)`:
```ts
import { barramento } from '../nucleo';
// ...
for (const o of cumpridos) barramento.emit({ t: 'telemetria', nome: 'objetivo', dados: { id: o.id, ato: o.ato } });
```

**7. Modo demo**
- `components/Paineis.tsx` (mapa, linhas 74 e 85) e `game/sistemas/acoes.ts:190`: somar o bloqueio da demo ao do nível:
```ts
import { modoDemo, motivoBloqueio } from '../lib/producao'; // em Paineis: '../game/lib/producao'
const bloq = bloqueioLocal(dest, s.nivel, s.inv) ?? motivoBloqueio(modoDemo, dest.id);
```
- `avancarObjetivos`: ao cumprir, `if (cumpridos.some(o => encerraDemo(modoDemo, o.id)))` → mostrar a tela de fim com `modoDemo.mensagemFim` (sem contagem regressiva, sem "compre agora": a mensagem é honesta e já testada contra urgência falsa).
- Seed diária: a run já nasce com `hoje()` como seed (`store.ts`); na demo, não oferecer seed personalizada.
- `package.json`:
```json
"build:demo": "NEXT_PUBLIC_DEMO=1 next build",
"empacotar:demo": "DEMO=1 node tools/empacotar.mjs"
```
- `tools/empacotar.mjs`, no `define` do esbuild:
```js
define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_DEMO': JSON.stringify(process.env.DEMO ? '1' : '') },
```
(Sem isso o artifact também funciona: `variavelDemo()` tem `try` e cai em "jogo completo".)
- Na Vercel: variável de ambiente `NEXT_PUBLIC_DEMO=1` no projeto público **antes de 4/mar/2027** (Tribeca exige jogo não lançado).

**8. Telemetria com servidor (só quando houver Umami no ar e a política publicada):** variáveis de build `NEXT_PUBLIC_TELEMETRIA_URL=https://<servidor>/api/send` e `NEXT_PUBLIC_TELEMETRIA_SITE=<id do site no Umami>`. Sem as duas, não há envio.

## Eventos medidos (só com consentimento de 18+)
`abertura` (1ª vez) · `sessao_inicio` · `aparelho` (SO, navegador, GPU, núcleos, memória, DPR, tela; **sem modelo**) · `primeiro_saque` · `primeira_viagem` · `viagem` · `primeira_morte` · `morte` (causa, bioma) · `objetivo` (passo 6) · `ato` · `vitoria` · `desempenho` a cada minuto de jogo (fps, p50, p95, pior, travadas, bioma) · `sessao_duracao` (ao sair do app). Cada um leva `seg` (segundos de sessão). Chaves pessoais (`nome`, `email`, `ip`, `lat`, `modelo`…) e qualquer texto com `@` são descartados na entrada.

## Momento autoral
**"O que medimos" é uma página do Caderno de Escuta sobre o próprio jogo.** No Caderno, o rádio diz e o jogador verifica. Aqui quem diz é o CINZAS: cada promessa da política ("vem desligada", "nada sai sem você deixar", "90 dias", "sem nome nem localização", "menor de 18 não é medido", "o desempenho é o real") vira uma ficha *Disseram × Verdade × Como verificar*, e o carimbo **VERDADE/FALSO** é calculado na hora, lendo o armazenamento cru por fora da classe que grava. Se um dia o código quebrar uma promessa, a própria tela carimba FALSO (há teste para isso). É o pilar "a interface nunca mente" aplicado aos dados do jogador.

## Riscos
- **INP no Safari/iOS:** depende da Event Timing API; pode não medir. O Diag diz "sem medida" em vez de inventar.
- **Memória de textura** é estimativa (largura × altura × 4 das texturas do Phaser via `window.__cinzas`); WebGL não informa memória de GPU. O relatório diz "~".
- **`WEBGL_debug_renderer_info`** pode vir mascarado (Firefox, Safari): aparece o renderizador genérico.
- **UA reduzido do Chrome** congela "Android 10; K": o relatório mostra "Android ?" em vez de mentir, e o Diag troca pela versão real via Client Hints quando o navegador entrega.
- **rAF extra:** custa um callback por quadro só enquanto o Diag está aberto ou a telemetria está consentida.
- **localStorage indisponível** (modo privado): a telemetria cai para memória e nada sobrevive ao fechar, o que é o lado seguro.
- **Formato do Umami** pode mudar entre versões: conferir antes de ligar o servidor.
- **Envio** usa `fetch` com `keepalive` ao esconder a aba; se falhar, os eventos ficam pendentes e saem na próxima vez (até sair da janela de 90 dias).
