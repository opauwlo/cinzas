# PROGRESSO — lib de Narrativa (sprint 1)

## Fase 0 · leitura (feita)
- Worktree estava no commit errado (42c9dfb); avançado por fast-forward para 8670584 (base do sprint). `npm ci` depois: saída 0.
- Lidos: CLAUDE.md, docs/sprint1/TIME.md, contratos.ts (NARRATIVA + ESCUTA), roteiro.md §1–§8, objetivos.ts, notas.ts, PASSOS_INTRO, npcs.ts ("Junte oito"), causas de morte em cena.ts/ia.ts.
- Libs avaliadas: inkjs 2.4.0, yarn-bound 0.5.5, rosetta 1.1.0, i18next 26.7.1. Decisão (INTEGRACAO.md §1): i18n próprio sobre Intl.PluralRules; cenas em dados próprios. Nenhuma dependência nova.

## Fase 1 · código e conteúdo (feita)
- `i18n.ts` (formatar `{n}`, `{o|a}`, `{n:um|# vários}`; tradutor com queda para pt; pseudo-loc +30%; contagem de palavras).
- `tipos.ts` (limites §5.3, tipos de texto, Passo, Cena), `catalogo.ts` (PT montado do conteúdo: 394 chaves, 3.813 palavras).
- `biblia.ts` (9 personagens: os 7 + Lúcia e Vidal; 6 facções; 10 marcos), `transmissoes.ts` (16 transmissões, 24 alegações; Farol em 7 dias com `vinheta_falha` e a tosse no dia 4), `fitas.ts` (1–3 completas, 4–7 esboço), `bilhetes.ts` (15: 8 âncoras + 7 mundo), `abertura.ts` (6 telas), `morte.ts` ("Não foi assim" + Calmo + contagem + reconhecimento), `passos.ts` (25, "dez", falas de NPC sem interface), `cena640.ts` (cena + tocador puro), `caderno-lia.ts` (momento autoral), `en.ts` (168 chaves, fatia do Ato I), `pendentes-en.ts` (226 chaves).
- `index.ts`: API + `narrativa` (ModuloJogo: 6h40 ouvidas, escolhas, cenas vistas; save JSON).

## Fase 2 · testes e documentos (feita)
- `narrativa.teste.ts`: 14 casos. `npm run typecheck` saída 0; `npm run teste` 68/68, saída 0.
- Os testes pegaram dois erros reais, já corrigidos: título "Página de diário" (palavra de interface) → "Folha de agenda"; ficha `farol-ferver` com maiúscula que não batia com a fala.
- `PEDIDO.md` (tradutor EN + roteirista humano, R$ 5.000), `INTEGRACAO.md`.

## Falta (próximo agente / próximos sprints)
- Escolhas-chave 2 e 3 (Atos III e IV) e os epílogos, no mesmo formato de `Cena`.
- Transmissões dos Atos III–IV; fitas 4–7 completas; mais 25 bilhetes de mundo (meta 40).
- `pendentes-en.ts` → zero (tradutor contratado).
- Campo `genero` de Cris no save (pedido à coordenação).
