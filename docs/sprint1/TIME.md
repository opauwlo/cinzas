# Sprint 1 — o time do FAROL / CINZAS

**Data:** 4/nov/2026 · **Meta do sprint:** cada área entrega a sua **lib** (código que roda, testado) que resolve o P0 do Plano GOTY (`docs/plano-goty/`). A coordenação integra, testa no navegador e publica.
**Investimento:** R$ 50 mil (cenário "pacote mínimo de candidatura" do plano de produção). Nenhum agente gasta dinheiro de verdade: cada área entrega o **pedido de compra** da sua linha do orçamento (o briefing pronto para contratar uma pessoa), e quem contrata é o Uwlo.

## Arquitetura

```
             ┌────────────── game/cena.ts (Phaser) ──────────────┐
             │ preenche a fachada `Mundo` a cada quadro           │
             │ emite eventos: zona, minuto, ruido, dano, abate,   │
             │ saque, viagem, morte, vitoria                      │
             └───────┬───────────────────────────────┬────────────┘
                     │ Nucleo.iniciar/tick/salvar     │ barramento.emit
             ┌───────▼───────────────────────────────▼────────────┐
             │ game/nucleo/  contratos.ts · barramento.ts · index │  ← só a coordenação edita
             └───┬────────┬────────┬────────┬────────┬────────┬───┘
                 │        │        │        │        │        │
        lib/radiacao  lib/escuta  lib/narrativa  lib/musica  lib/arte  lib/producao
```

- **`game/nucleo/contratos.ts`** é a lei: tipos e interfaces de cada lib. Nenhuma lib importa a pasta de outra; o que é compartilhado vem dos contratos, e a conversa em jogo passa pelo **barramento**.
- Cada lib exporta um **`ModuloJogo`** (`iniciar`, `tick`, `salvar`, `carregar`). A coordenação registra em `game/nucleo/modulos.ts`.
- **Núcleo puro:** a lógica de cada lib não importa Phaser nem DOM, para rodar nos testes em Node. O que precisa de navegador (Web Audio, canvas, React) fica num arquivo adaptador separado e fino.
- **Determinismo:** tudo que muda o resultado usa `game/lib/rng.ts` com seed. `Math.random` só em efeito cosmético.
- **Testes:** `*.teste.ts` dentro da pasta da lib, usando `tools/testes/harness.ts` (`teste`, `entre`, `assert`). `npm run teste` acha sozinho.

## Donos de arquivo (para ninguém pisar no outro)

| Área | Pode criar e editar | Não pode editar (peça na INTEGRACAO.md) |
|---|---|---|
| Radiação (game design) | `game/lib/radiacao/**` | o resto |
| Escuta (game design) | `game/lib/escuta/**` | o resto |
| Narrativa (roteiro) | `game/lib/narrativa/**` | o resto (inclusive `game/dados/*.ts`: proponha a troca) |
| Música e áudio | `game/lib/musica/**`, `game/audio.ts`, `game/dados/sons.ts` | o resto |
| Arte | `game/lib/arte/**` | o resto (inclusive `paletas.ts`, `humano.ts`, `clima.ts`: entregue a receita/função nova na sua pasta) |
| Produção | `game/lib/producao/**`, `components/Diag.tsx` (novo), `docs/producao/**` | o resto |
| Coordenação | `game/nucleo/**`, `game/cena.ts`, `store.ts`, HUD, painéis, `package.json`, `CREDITS.md`, `HANDOFF.md`, `tools/testes/principal.ts` | — |

**Dependência nova do npm:** pode instalar no seu worktree para testar, mas a coordenação refaz o `package.json` na integração. Liste no `INTEGRACAO.md` com versão e licença.

## Regras do projeto que valem para todos

1. **Lib da comunidade primeiro** (regra do `CLAUDE.md`): avalie pelo menos duas opções com licença permissiva (MIT, ISC, Apache-2.0, BSD, CC0, OFL) — tamanho, manutenção, encaixe no celular. Escolha uma ou justifique fazer à mão. Registre a decisão e a linha do `CREDITS.md` no seu `INTEGRACAO.md`. **Nada de AGPL/GPL.** Não rode Makefile ou script de repositório de terceiros.
2. **Neurodesign honesto** (`HANDOFF.md` §4): a interface nunca mente. Personagens podem mentir dentro da ficção, sempre com caminho de verificação. O Modo Estudo é a única exceção e não é tocado neste sprint.
3. **Política de IA** (Plano GOTY §3): todo texto que o jogador lê nasce com `autoria: 'rascunho-ia'` até um humano revisar. Música do sprint é **motor + partitura provisória**, marcada para o compositor substituir. Nada de IA generativa de imagem, som ou voz.
4. **Celular primeiro:** Android médio, 60 fps, uma mão, tela vertical. Orçamento por quadro de cada `tick`: ≤ 1 ms.
5. **Shell com assert de qualidade:** `set -euo pipefail`, `timeout` em tudo, conferir artefatos, reportar o código de saída real.
6. **Português** em código, comentários e textos. Comentário só para o que o código não mostra.

## Disciplina de contexto (limite de ~200 mil tokens por agente)

Ninguém aqui roda `/clear` ou configura autocompactação: cada agente começa com o contexto limpo, e é isso que faz o papel do `/clear`. Para caber em ~200 mil:
- leia trechos (`grep -n`, `sed -n 'a,bp'`), nunca arquivos grandes inteiros (`cena.ts`, `zona.ts`, `principal.ts`, planos de 60 KB: só a seção da sua área);
- trabalhe em fases e escreva `PROGRESSO.md` na sua pasta ao fim de cada uma (o que está pronto, o que falta, decisões);
- se sentir o contexto pesado, pare num ponto coerente, faça commit e relate: a coordenação abre um agente novo que continua pelo `PROGRESSO.md`.

## Orçamento do sprint (R$ 50 mil)

| Linha | R$ | Área | Entrega deste sprint |
|---|---|---|---|
| Compositor(a) + design de som | 18.000 | Música | briefing da chamada aberta + teste pago dos 3 finalistas, pronto para publicar |
| Arte-chave, cápsulas de loja e logo | 7.000 | Arte | briefing para pixel artist humano(a), com as regras da paleta e as 5 imagens-assinatura |
| Editor(a) de trailer | 5.000 | Produção | roteiro de 60 s do trailer de anúncio, plano a plano, capturável no jogo |
| Laboratório de aparelhos | 6.000 | Produção | lista de compra (3 Android + 1 iPhone usados + notebook), com preço de referência |
| Localização EN + revisão | 5.000 | Narrativa | catálogo i18n pronto para tradução + glossário |
| QA freelance | 3.000 | Produção | roteiro de teste no celular (o que medir, como reportar) |
| Taxas, contador, jurídico, viagem | 6.000 | Produção | checklist com datas (Steam, Play, INPI, BIG Festival) |

**Lacuna conhecida:** o pacote de R$ 50 mil não paga roteirista humano nem voz. A Produção propõe de onde tirar (ou a primeira captação).

## O que cada agente entrega (Definition of Done)

1. A lib na sua pasta, implementando o contrato, com `index.ts` que exporta o `ModuloJogo` e a API pública.
2. Testes `*.teste.ts` que provam as metas da área (números do plano viram asserções).
3. `npm run typecheck` e `npm run teste` passando no seu worktree.
4. `INTEGRACAO.md` na pasta: a lib da comunidade escolhida (ou a justificativa), a linha do `CREDITS.md`, os passos exatos para a coordenação ligar na cena/HUD (trechos de código prontos) e os riscos.
5. `PROGRESSO.md` atualizado e o pedido de compra (quando a área tem linha no orçamento).
6. Commit no seu worktree com mensagem clara em português.

## Criatividade

O plano dá o rumo; o que vai fazer um júri lembrar é o que vocês inventarem dentro dele. Cada área tem a obrigação de entregar **um momento autoral** — um detalhe que só este jogo tem — e de dizer qual é no `INTEGRACAO.md`.
