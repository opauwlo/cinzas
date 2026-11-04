# Música — progresso do sprint 1

## Fase 1 — leitura e escolha da lib (pronta)
- Worktree estava em 42c9dfb; avançado (fast-forward) para 8670584, `npm ci` ok.
- Libs medidas num diretório de rascunho (esbuild --minify + gzip -9): tone 15.1.22 = 81 KB gz (60 KB só o essencial); webaudio-tinysynth 1.1.3 = 11 KB gz (GM); soundfont-player 0.12.0 = 6 KB gz + soundfonts de MB.
- Decisão: agendador próprio sobre Web Audio + `alea` (já no projeto). A lib inteira dá 29 KB min / 9,8 KB gz.

## Fase 2 — núcleo puro (pronta)
- `partitura.ts`: tema M/R/M'/R', harmonia, leitmotivs, 26 segmentos (+ sanfona do mascate), stingers, vinheta, Morse, timbres puros.
- `maestro.ts`: troca na barra (no tempo se urgente ou saindo do silêncio), histerese (combate 8 s), cota (5 min, tema 3×/h, exploração ≤ 35%), respiro 6–12 s, corte de silêncio total, segmento de abertura, determinismo por seed, `quantizar`.
- `sintese.ts`: Karplus-Strong com passa-tudo fracionário, par de cordas, medidores.
- `index.ts`: DiretorMusical + `moduloMusica` + caminho de reserva por `ambiente()`.

## Fase 3 — adaptador e audio.ts (pronta)
- `orquestra.ts` (9 vozes), `vinheta.ts`.
- `game/audio.ts`: musicaLoop e o drone antigo saíram; maestro + orquestra no `bMus` (ducking e perfis mantidos); saída mono; stingers em Ré e quantizados; motor em Ré2; batimento 900→520 ms; `iniciarMenu`, `vinhetaRadio`, `sinalAbrigo7`, `sanfonaAoLonge`; retomada do `AudioContext` no próximo toque.
- `game/dados/sons.ts`: `ALVO_MUSICA`, `intervaloBatimento`.
- Conferido no Chrome headless: render de todos os estados (OfflineAudioContext) sem erro/NaN; smoke do audio.ts menu → combate → viagem → morte → vitória sem erro.

## Fase 4 — documentos e testes (pronta)
- `musica.teste.ts` (15 testes), `INTEGRACAO.md`, `PEDIDO.md`.

## Falta (próximo sprint)
- P0 0.7: LUFS (BS.1770) e o render roteirizado do gate G3; calibrar `ALVO_MUSICA` no celular do Uwlo.
- Legendas de música ("♪ sanfona ao longe") no `setAvisoVisual` (P1 1.12).
- Sirene de defesa civil no lugar do `alarme` (P1 1.9).
- Fases do Colosso por HP (precisa de evento da cena).
