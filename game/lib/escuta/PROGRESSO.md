# Escuta — progresso

## Fase 1 — lógica pura (pronta)
- `verificacao.ts`: tabela `REGRAS` (instrumento → tipos), `EXIGE` (prova de cada instrumento), `caminhos`, `toques`, `validarCatalogo`.
- `caderno.ts`: `CadernoEscuta` (implementa `Caderno`): fichas, `ouvir` (PRAZO FALSO automático pela repetição), `verificar`, `registrarVisita` / `registrarLeitura` / `registrarPista`, `revelarAto` ("você nunca foi ver"), eco de 7 dias da Farol, `salvar/carregar`.
- `programacao.ts`: `ProgramacaoEscuta` (implementa `Programacao`): Farol às 6h40 em loop de 7 dias; facções em janelas fixas; cache por dia.
- `memoria.ts`: assinaturas entre vidas + nota de margem (momento autoral).
- `amostras.ts`: 5 transmissões `rascunho-ia`.
- `index.ts`: `Escuta`, `moduloEscuta` (id `escuta`), `catalogo()`.
- `escuta.teste.ts`: 14 testes; typecheck e teste passando.

## Fase 2 — adaptadores React (pronta)
- `CadernoPainel.tsx`, `RadioBalao.tsx`.

## Fase 3 — documentação (pronta)
- `INTEGRACAO.md`.

## Decisões
- Nenhuma lib de máquina de estados (xstate/robot3 avaliadas; ver INTEGRACAO.md). Determinismo via `alea` (já no projeto, `game/lib/rng.ts`).
- `ir` também resolve `adesao` (contar fogueiras e barracas, como no plano de game design).
- `tempo` só prova prazo FALSO; a validação recusa prazo verdadeiro com `tempo`.
- Só vai para a memória entre vidas o que o jogador verificou; a Revelação do fim do ato não conta como saber.

## Falta (fora da minha pasta, para a coordenação)
- Registrar `moduloEscuta` em `game/nucleo/modulos.ts`, plugar os dois adaptadores, cobrar o custo da triangulação, registrar pistas a partir de bilhetes/NPCs.
