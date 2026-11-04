# Escuta — integração (para a coordenação)

"O Geiger não mente. O rádio, sim." No abrigo o rádio pega; facções transmitem com técnicas reais de manipulação;
o jogador verifica com instrumentos honestos e cada alegação vira ficha no Caderno de Escuta ("disseram × verdade").

## Lib da comunidade: decisão

| Opção | Versão / licença | Tamanho (npm, desempacotado) | Encaixe |
|---|---|---|---|
| `xstate` | 5.33.3 · MIT | 2,3 MB | Atores, filhos, inspeção: muito além de uma ficha com 2 estados. Peso e curva de aprendizado altos para o celular. |
| `@xstate/fsm` | 2.1.0 · MIT | 57 KB | Máquina finita mínima. Encaixa, mas o estado vira objeto da lib; o save JSON precisaria de ida e volta pela API dela. |
| `robot3` | 1.4.0 · BSD-2-Clause | 29 KB | A menor e funcional. Encaixa, mas daria nome a 3 linhas. |
| **nenhuma** (escolhida) | — | 0 | Uma ficha tem um só passo: `aberta → verdade/falso/meia`, sempre terminal. Quem guarda a transição é a tabela `REGRAS` + `EXIGE` (`verificacao.ts`), que é o que o júri e a Narrativa precisam ler. Uma máquina de estados esconderia a regra atrás da API dela e não economizaria código. |

Determinismo: **`alea` (MIT)**, que já está no projeto, via `game/lib/rng.ts`.
**Linha do CREDITS.md:** nenhuma linha nova. A Escuta não traz terceiro além do `alea` (MIT) e das fontes VT323/Pixelify Sans (OFL), que já estão em `CREDITS.md`.
**Dependência nova do npm:** nenhuma.

## Arquivos

| Arquivo | O que é |
|---|---|
| `verificacao.ts` | `REGRAS` (instrumento → tipos), `EXIGE` (prova que cada um pede), `caminhos`, `toques`, `validarCatalogo` |
| `caderno.ts` | `CadernoEscuta implements Caderno`: fichas, `ouvir`, `verificar`, `registrarVisita/Leitura/Pista`, `revelarAto`, ecos da Farol, `salvar/carregar` |
| `programacao.ts` | `ProgramacaoEscuta implements Programacao`: Farol às 6h40 em loop de 7 dias, janelas por facção, `grade`, `janela`, `proximas` |
| `memoria.ts` | **momento autoral**: assinaturas entre vidas + nota de margem |
| `textos.ts` | rótulos, carimbos, "por quê" de cada técnica, `textoFicha`, `textoRecorte` (todos `rascunho-ia`) |
| `amostras.ts` | 5 transmissões `rascunho-ia` (só testes e gate G0) |
| `index.ts` | classe `Escuta`, `escuta` (instância no barramento global), `moduloEscuta` (id `escuta`), `catalogo()` |
| `CadernoPainel.tsx` / `RadioBalao.tsx` | adaptadores React finos |
| `escuta.teste.ts` | 14 testes |

## Regras de verificação (a lei)

| Instrumento | Resolve | Prova exigida | Toques |
|---|---|---|---|
| `tempo` | `prazo` | a mesma alegação volta ao ar **noutro dia com a mesma frase** → carimbo **PRAZO FALSO** sozinho | 0 |
| `ir` | `local`, `conteudo`, `adesao` | entrar na zona `alegacao.local` **depois** de ouvir | 0 |
| `geiger` | `radiacao` | evento `geiger` na zona `alegacao.local` depois de ouvir (a ficha guarda o cpm lido) | 0 |
| `cruzar` | `conteudo`, `adesao`, `autoridade` | uma pista registrada (`escuta.registrarPista(id)`) → botão "Cruzar com a pista" | 2 (aba + botão) |
| `triangular` | `local` | só no abrigo; a coordenação cobra 1 h + 1 bateria antes | 2 (aba + botão) |

- O resultado é sempre a `verdade` da alegação. Nada é sorteado.
- `ir` também resolve `adesao` (contar fogueiras e barracas, como no plano de game design §2.2). Se a coordenação preferir só `local`/`conteudo`, basta tirar de `REGRAS.ir`.
- `validarCatalogo(TRANSMISSOES)` recusa instrumento que não resolve o tipo, `ir`/`geiger` sem `local`, prazo **verdadeiro** com `tempo` (a repetição só prova falsidade) e Farol fora do minuto 400. **A Narrativa deve rodar isto no teste dela.**

## Ligar no jogo (trechos prontos)

### 1. Registrar o módulo — `game/nucleo/modulos.ts`
```ts
import type { ModuloJogo } from './contratos';
import { moduloEscuta } from '../lib/escuta';
export const MODULOS: ModuloJogo[] = [moduloEscuta as ModuloJogo];
```

### 2. Conteúdo da Narrativa (onde a coordenação junta as libs, ex.: `game/nucleo/modulos.ts`)
```ts
import { catalogo } from '../lib/escuta';
import { TRANSMISSOES } from '../lib/narrativa';
catalogo(TRANSMISSOES); // sem isto, tocam as AMOSTRAS
```

### 3. Memória entre vidas (meta, fora do save da run) — `game/store.ts`, no boot, ANTES do primeiro `nucleo.carregar`
```ts
import { escuta } from './lib/escuta';
try { escuta.carregarMeta(JSON.parse(localStorage.getItem('cinzas.escuta') ?? 'null')); } catch { /* sem storage */ }
escuta.aoGravarMeta(m => { try { localStorage.setItem('cinzas.escuta', JSON.stringify(m)); } catch { /* sem storage */ } });
```
A vida conta sozinha: `carregar(undefined)` (run nova) abre a vida seguinte; um save da run guarda a vida dele.

### 4. Geiger — `game/cena.ts`, logo depois de `setGeiger(this.cpm)` (linha ~434)
A cena ainda não emite `geiger`. Até a lib de Radiação emitir, basta uma vez por segundo:
```ts
this.geigerT = (this.geigerT ?? 0) + dt;
if (this.geigerT >= 1) { this.geigerT = 0; barramento.emit({ t: 'geiger', cpm: Math.round(this.cpm), pan: 0, nivel: this.cpm > 600 ? 3 : this.cpm > 250 ? 2 : this.cpm > 60 ? 1 : 0 }); }
```
(A Escuta ignora leituras repetidas na mesma zona sem ficha nova: custo ~0.)

### 5. Balão do rádio — `components/Hud.tsx`, dentro do `<div className="hud">`
```tsx
import RadioBalao from '../game/lib/escuta/RadioBalao';
// …
{s.painel === null && <RadioBalao />}
```
Toque no balão = próxima fala. Ele fica abaixo do relógio/objetivo (`top: 112px * --u`) e acima do mundo (`z-index: 7`).

### 6. Aba do Diário — `components/PaineisMeta.tsx`
```tsx
import CadernoPainel from '../game/lib/escuta/CadernoPainel';
type Aba = 'obj' | 'ctr' | 'hab' | 'con' | 'esc';
// em `abas`: ['esc', 'Escuta'],
{aba === 'esc' && <CadernoPainel aoTriangular={() => {
  const st = useJogo.getState(); if (!(st.inv.bateria > 0)) return false;
  useJogo.setState({ inv: { ...st.inv, bateria: st.inv.bateria - 1 } }); ponte.cmd?.('passarTempo', 60); return true; // ajuste ao comando real de passar 1 h
}} />}
```

### 7. Pistas para "Cruzar" — onde um bilhete/NPC cita uma transmissão
```ts
import { escuta } from '../lib/escuta';
escuta.registrarPista('mil-governo'); // id da alegação; a Narrativa diz qual bilhete/NPC prova qual alegação
```
Sugestão para a Narrativa: um campo `prova?: string[]` (ids de alegação) em `BilheteLore`/fala de NPC; a coordenação chama `registrarPista` ao ler.

### 8. Fim de ato
Automático: quando `Mundo.ato` sobe, a Escuta roda `revelarAto(atoAnterior)` e fecha toda ficha aberta com o carimbo
**VOCÊ NUNCA FOI VER** + a verdade. A tela final "O QUE FOI DITO" pode listar `escuta.fichas()` com `textoFicha(f)`.

## Barramento
- Ouve: `zona` (chegada → `ir`, corta o rádio fora do abrigo), `minuto` (programação), `geiger` (leitura no local).
- Emite: `transmissao` (`inicio` → `fala` n → `fim`) e `caderno` (`aberta` / `verdade` / `falso` / `meia`).
  A Música pode trocar para `radio` no `inicio`; o Áudio pode tocar chiado/vinheta pelo `efeito` da fala (`FalaRadio.efeito`).

## Grade do rádio (assinaturas)
| Voz | Frequência (amostra) | Horário | Dias |
|---|---|---|---|
| Farol | 107,7 FM | 06h40 | todo dia, fita em loop de 7 dias |
| Rede PX | Canal 11 PX | 07h30 | 70% dos dias (seed) |
| Milícia Velha | AM 640 | 12h00 | todo dia |
| Saqueadores do Km 40 | 94,1 FM | 18h00 | todo dia (por isso o prazo falso aparece) |
| Filhos do Cinza | 88,3 FM | 21h00 | 85% dos dias (seed) |
| Sobrevivente | — | sorteado 8h–22h | 50% |

Janela de 20 min de jogo; dentro dela, a transmissão toca uma vez por dia, do começo. Cada fala fica 3,5–9 s reais na fita.

## Momento autoral — "Nota de margem de outra vida"
O Caderno aprende a **assinatura** de cada voz (frequência, horário, chiado, bordão, técnica que você pegou) e guarda **entre mortes**.
Na vida seguinte, quando os Saqueadores entram no ar, a fita térmica ganha uma anotação a lápis na margem:
> ✎ Vida 1: você pegou os Saqueadores do Km 40 em escassez e prazo falso.

É sempre um **fato** (o que você verificou antes), nunca um veredito sobre a fala nova. Se a mesma alegação (mesma frase, mesma verdade)
volta noutra vida, a ficha já abre resolvida com "Anotado na vida 1. O Caderno lembrou." Só vai para a memória o que você **foi ver**:
o que a Revelação do fim do ato contou não conta como saber. Junto: **Ecos** ("Dia 9: a mesma fala do dia 2, palavra por palavra. Até a tosse.") — a pista R1 do roteiro sai dos seus próprios ouvidos — e o **Recorte**: toda ficha FALSO/MEIA-VERDADE tem "Recortar e mandar" (`navigator.share`, ou copia), com o texto "A Milícia Velha me disse no rádio: “…” Era: …".

## Regra honesta (como a interface nunca mente)
- A ficha aberta não carrega `real` nem técnica (testado: nenhum `real` aparece em `textoFicha` antes de resolver).
- O balão diz "DISSERAM NO RÁDIO" e mostra só o que o personagem disse e a frequência. A ficha aberta mostra "Voz em 94,1 FM", não o emissor real: quem fala de verdade é uma das coisas que a verificação revela. A nota de margem só cita o emissor quando você já o desmascarou numa vida anterior.
- O dial do Caderno só lista horários de vozes que você já ouviu (conhecimento, não brinde).
- Não há prazo de relógio real, cobrança nem número inventado fora da ficção. Botão de instrumento só aparece quando a prova existe.

## Riscos
1. **Radiação × autoria:** uma alegação `radiacao` tem a verdade escrita pelo autor; se a lib de Radiação puser o Pântano limpo, "o brilho queima" vira mentira do jogo. Mitigação: a ficha mostra o cpm **lido** ("O Geiger leu 912 cpm"), e Narrativa + Radiação precisam combinar os locais quentes. Sugiro um teste cruzado na integração.
2. **`geiger` ainda não é emitido** pela cena (trecho 4).
3. **Custo da triangulação** depende de um comando de "passar 1 h" que a coordenação precisa expor (trecho 6).
4. Um save antigo sem a chave `escuta` abre uma vida nova (conta como run nova para a memória).
5. Quem dorme das 6h às 8h perde a Farol; é de propósito (a fita volta em 7 dias), mas vale uma dica no Ajuda.
6. Textos e amostras são `rascunho-ia`: precisam de revisão humana antes do lançamento.
