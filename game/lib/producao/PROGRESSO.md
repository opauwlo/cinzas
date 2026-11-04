# Produção — progresso

## Fase 1 (leitura e decisões) — feita
- Worktree movido para 8670584 (base do sprint); `npm ci` saiu 0.
- Achado: a cena limita `dt` a 50 ms (`Math.min(0.05, dms/1000)`) e pula o tick no hit-stop. Medir pelo `tick` esconderia justamente os travamentos. Decisão: o medidor é alimentado por `requestAnimationFrame` próprio (adaptador `navegador.ts`), não pelo `tick`.
- Desempenho: buffer circular próprio (stats.js não dá p50/p95 e desenha um painel DOM; sem release desde 2017). `web-vitals@6.2.3` (Apache-2.0, ~3,3 KB gzip) só para INP = latência de toque, carregado sob demanda no Diag.
- Telemetria: fila local própria; servidor = Umami (MIT) auto-hospedado, recebendo no formato `/api/send` sem carregar o script de rastreio dele. Plausible é AGPL: vetado.
- Demo: Ato I (locais `base` e `ermo`, último objetivo `noite`).

## Fase 2 (código) — feita
- `desempenho.ts`, `aparelho.ts`, `telemetria.ts`, `oquemedimos.ts`, `demo.ts`, `relatorio.ts`, `navegador.ts`, `index.ts`, `components/Diag.tsx`.
- 14 testes em `producao.teste.ts` (p50/p95, custo por quadro, sem consentimento nada grava, menor de 18, apagar/revogar, 90 dias + limite, dados pessoais barrados, envio só com endpoint + sim, funil pelo barramento, demo, UA, "O que medimos" carimba FALSO quando deve, relatório).
- Prévia no Chrome headless (412 px): Diag e "O que medimos" renderizam sem erro de console; ligar a telemetria grava a chave só depois do "Sim" + "ligar".
- Gesto do Diag: 4 dedos por 2 s (3 dedos é captura de tela no Motorola).

## Fase 3 (docs) — feita
- `docs/producao/`: orcamento, pedidos-de-compra (lab, QA, trailer de 60 s), datas, politica-ia, teste-no-celular. `INTEGRACAO.md` com os trechos.

## Falta (depende da coordenação ou de dinheiro)
- Montar Diag, registrar módulo, `OQueMedimos` na Config, evento `objetivo`, bloqueio da demo no mapa, scripts de demo (tudo em `INTEGRACAO.md`).
- Modo de captura sem HUD e comandos de hora/clima para o trailer.
- Rodar a parte A do `teste-no-celular.md` no Motorola e preencher a primeira linha da tabela de aparelhos.
