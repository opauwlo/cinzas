# Radiação — progresso (sprint 1)

## Fase 1 — leitura e decisão (pronto)
- Contrato RADIAÇÃO + `ModuloJogo` + `Mundo` lidos; código atual: `zona.ts:90-99` (crateras), `cena.ts:423-435` (ganho, maxHp, cpm), `sistemas/clima.ts` (vento 0,85 = Ventania).
- Lib: advecção semi-lagrangiana + difusão à mão; `simplex-noise` (já no projeto) para o meandro. Ver INTEGRACAO.md.
- Obs.: o worktree nasceu em 42c9dfb; foi movido para 8670584 (base do sprint) antes de qualquer trabalho.

## Fase 2 — lib (pronto)
- `campo.ts` (leito/solo/ar/pó, fontes por picos, 2 Hz, ocioso nas zonas frias), `dose.ts`, `geiger.ts`, `po.ts` (autoral), `index.ts` (`SistemaRadiacao`, `radiacao`, `moduloRadiacao`).

## Fase 3 — testes e calibração (pronto)
- `radiacao.teste.ts`: 14 testes (pluma ≥ 6 casas/h, chuva, poeira, ácida, determinismo, zonas frias iguais a hoje, 6–10 expedições até 400, degraus, curável × não, pan na tela isométrica, ≤ 1 ms, barramento 5×/s, save, Colosso, pó azul).
- Calibração: pluma 7,0–7,5 casas; dose 63/expedição média → 7 (sem máscara) / 9 (com).
- `npm run typecheck` 0 · `npm run teste` 0 (68/68).

## Falta (fora da minha pasta — pedido na INTEGRACAO.md)
- Ligar na cena/HUD/áudio (passos 1–7), evento `dose` no contrato, arte da cápsula e do brilho azul, bilhete da Narrativa.
- Depois: irradiados seguindo o gradiente (§4.7), barril aberto como isca, reservatório contaminado pela pluma (S5).
