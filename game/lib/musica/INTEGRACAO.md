# lib de Música — integração (sprint 1)

**Entrega:** motor adaptativo + **partitura provisória** da "Toada do Abrigo" (Ré, 3/4, ♩ = 66), tocada por vozes sintetizadas no nosso código (0 KB de amostras). O(a) compositor(a) contratado(a) (ver `PEDIDO.md`) substitui `partitura.ts`; o motor fica.

| Arquivo | O que é | Puro? |
|---|---|---|
| `partitura.ts` | tema M/R/M'/R', leitmotivs (Colosso ×4, gangues 7/8, mascate em maior, Morse do Abrigo 7, incelência, dupla em terças), 26 segmentos por estado (+ a sanfona do mascate), stingers no tom, vinheta, timbres puros (parciais do drone, formantes, sino) | sim |
| `maestro.ts` | `MaestroCinzas implements Maestro`: troca na barra (no tempo se urgente), histerese, cota anti-fadiga, respiro, silêncio total, determinismo por seed, `quantizar` dos stingers | sim |
| `sintese.ts` | Karplus-Strong com passa-tudo fracionário + par de cordas da viola; medidores (autocorrelação, FFT) | sim |
| `index.ts` | `DiretorMusical` (estado pelo `Mundo` + barramento), instância `musica`, `moduloMusica` (id `'musica'`) | sim |
| `orquestra.ts` | adaptador Web Audio: viola, rabeca, pífano, zabumba, coral, drone, sanfona, rádio AM, sino | não |
| `vinheta.ts` | vinheta da Farol 107,7 (`notasVinheta` pura + `tocarVinheta`) e o sinal do Abrigo 7 em Morse | dados sim |
| `musica.teste.ts` | 15 testes (tema, modo, faixa, drone, KS, barra, determinismo, cota, densidade, morte/vitória, quantização, vinheta, diretor, batimento, abertura do menu) | — |

## Lib da comunidade: avaliação e decisão

Medido neste sprint com `esbuild --minify` + `gzip -9`:

| Opção | Licença | Peso no bundle | Encaixe |
|---|---|---|---|
| **tone** 15.1.22 | MIT | 341 KB min / **81 KB gz** inteiro; só Transport + Sampler + PolySynth: 236 KB / 60 KB gz | Transport e Sampler prontos, mas é ~2–3% do PWA de ~3 MB só de motor, sem nenhum timbre nosso (viola/rabeca), traz um `Context` próprio por cima do nosso `ctx` e cria grafo pesado por nota. |
| **webaudio-tinysynth** 1.1.3 | Apache-2.0 | 41 KB / 11 KB gz | Sintetizador GM: timbres genéricos (reprovam no teste "R$ 100?"), sem Karplus-Strong, sem viola caipira nem rabeca. |
| **soundfont-player** 0.12.0 | MIT | 16 KB / 6 KB gz **+ soundfonts de MB por instrumento** (CDN) | Quebra o offline do PWA, timbres GM, sem lançamento desde 2018. |
| Strudel | AGPL-3.0 | — | Proibido (obrigaria abrir o jogo). |
| **Agendador próprio sobre Web Audio** (escolhido) | nosso | **29 KB min / 9,8 KB gz** (lib inteira, com núcleo e rng) | Usa o `AudioContext` e o barramento `bMus` que já existem (ducking, perfis, limitador); relógio do `ctx` com lookahead (laço de 100 ms que agenda 300 ms à frente, padrão "A Tale of Two Clocks"); a parte musical é pura e testável em Node. |

**Latência:** a trilha não precisa de latência baixa (entra na barra), então o agendamento com 300 ms de folga absorve engasgos do Android médio; os SFX de jogo continuam diretos (`tocar`), nunca quantizados. Stingers (`nivel`, `conquista`, `raro`, `sinal`) esperam o próximo meio-tempo **só** se ele estiver a ≤ 120 ms.

**Terceiros usados:** `alea` (MIT, já no projeto, via `game/lib/rng.ts`). Algoritmos de domínio público: Karplus-Strong (1983), passa-tudo fracionário de Jaffe & Smith (1983). **Nenhuma dependência nova no `package.json`.**

**Linha para o `CREDITS.md`** (seção "Código"):
> Trilha adaptativa (`game/lib/musica/`): motor e síntese próprios sobre Web Audio; semente via alea (MIT). Viola por Karplus-Strong (algoritmo de 1983, domínio público). Partitura provisória da direção de áudio, a ser substituída pela obra do(a) compositor(a) contratado(a). Nenhuma IA generativa de som.

## O que a coordenação precisa plugar

1. **Registrar o módulo** (`game/nucleo/modulos.ts`):
   ```ts
   import { moduloMusica } from '../lib/musica';
   export const MODULOS: ModuloJogo[] = [moduloMusica as ModuloJogo];
   ```
   Sem isso a música já funciona pelo caminho de reserva (`ambiente()` e `motor.ligar/parar` alimentam o diretor), mas sem zona base, furtivo, ato e vida.
2. **Menu: áudio no primeiro toque** (`components/Menu.tsx`), no primeiro `onPointerDown` da tela:
   ```tsx
   import { iniciarMenu } from '../game/audio';
   <div onPointerDown={() => void iniciarMenu()} …>
   ```
   (`iniciarAudio` continua idempotente; o `Jogo.tsx:27` pode ficar como está.)
3. **Config. → Som: opção mono.** Campo novo `mono?: boolean` em `Configs`, repassado no `aplicarVolumes({ …, mono: c.mono })` de `Jogo.tsx:24` e `Paineis.tsx:114`. Sem valor (`undefined`), o mono liga sozinho no perfil "Alto-falante do celular". Texto sugerido: "Som mono — junta esquerda e direita (fone de um lado só, alto-falante único)".
4. **Colosso perto** (`cena.ts`, onde a IA do Colosso persegue a < 20 tiles):
   `barramento.emit({ t: 'musica', estado: 'colosso', prioridade: 5 })` ao entrar e `{ t: 'musica', estado: 'colosso', prioridade: -1 }` ao sair; ou só `musica.colossoPerto()` a cada segundo. Também ajuda mandar `fonte: e.arq.id` no evento `dano` (`ia.ts:47`): ativa o Colosso e o riff das gangues (7/8) para `saqueador`/`miliciano`.
5. **Batimento com a vida** (`cena.ts:434`): opcional `setBatimento(s.hp < 30 && !this.morto, s.hp / maxHp)`; sem o 2º argumento usa a vida que o módulo lê do `Mundo`.
6. **Rádio/narrativa** (opcionais, já exportados de `game/audio.ts`): `vinhetaRadio('loop')` quando a Farol 107,7 entra no ar; `sinalAbrigo7()` na transmissão do Abrigo 7; `sanfonaAoLonge(dist, pan)` quando o mascate está a < 40 tiles (a cada ~12 s). O evento `transmissao` (início/fim) já baixa a música 9 dB.
7. **Estado fixo pela UI** (opcional): `barramento.emit({ t: 'musica', estado, prioridade })`; prioridade < 0 cancela.

## API preservada de `game/audio.ts`
`sfx.*`, `tocar`, `ambiente`/`trocarAmbiente`, `iniciarAudio`, `aplicarVolumes`, `setAvisoVisual`, `motor`, `vibra`, `aDist`, `setGeiger`, `setBatimento`, `trovao` — mesmas assinaturas (só ganharam parâmetros opcionais: `tocar(…, { afinado, em })`, `setBatimento(b, hp01?)`, `Ajustes.mono?`). Novos: `iniciarMenu`, `vinhetaRadio`, `sinalAbrigo7`, `sanfonaAoLonge`.

P0 do plano feitos aqui: 0.2 drone audível (fundamental ausente, nada tonal abaixo de 140 Hz), 0.3 tudo em Ré (stingers, motor do jipe em Ré2 com a quinta), 0.4 áudio do menu, 0.5 mono, 0.6 batimento que escala (900 → 520 ms), 0.8 estados musicais; 0.1 ganhou retomada no próximo toque. **Fica para depois:** 0.7 (LUFS BS.1770 e o render roteirizado do gate G3).

## Momento autoral: "a nota que falha"
A vinheta da Farol 107,7 são as três primeiras notas do tema (Ré–Lá–Sol♯). A segunda **falha sempre no mesmo ponto** (a fita escorrega 45 cents e corta em 37%, com um estalo): quem ouve com atenção percebe que o rádio está num loop. O jogo inteiro **nunca toca Fá♯** (testado em todos os segmentos e stingers). Na vitória, a vinheta toca pela primeira vez **inteira** e a terceira nota resolve no **Fá♯**: a terça maior guardada o jogo todo, junto com a segunda voz da dupla caipira entrando em terças. O fim do loop se ouve antes de se ler.

## Riscos
- **Mistura não medida em LUFS** (gate G3): `ALVO_MUSICA = 0,55` (`sons.ts`) foi estimado (~9–10 dB abaixo do tiro na exploração); o render no Chrome deu pico −4 dBFS no combate antes do barramento (×0,165). Conferir no Motorola do Uwlo.
- **CPU:** cada nota cria de 3 a 12 nós; a densidade é limitada por teste (≤ 12 notas/s, ≤ 6 melódicas/s). As cordas da viola (Karplus-Strong em JS, ~2 ms cada) são pré-calculadas aos poucos (`aquecerViola`, 18 notas).
- **Partitura provisória:** soa composta (frases do plano, harmonia escrita, micro-timing fixo), mas é síntese; o teste "R$ 100?" só passa com as gravações do(a) compositor(a).
- **Estado 'morte'** fica até a próxima zona (`iniciar`); no Calmo (desmaio) a música volta quando o jogador entra numa zona.
- Conferido no Chrome headless: render de todos os estados em `OfflineAudioContext` sem erro nem NaN, e smoke do `audio.ts` (menu → combate → viagem → morte → vitória) sem erro.
