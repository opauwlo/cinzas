# Pedidos de compra da Produção

Três linhas do orçamento (`orcamento.md`): laboratório de aparelhos (R$ 6.000), QA freelance (R$ 3.000) e editor(a) de trailer (R$ 5.000). Cada pedido está pronto para o Uwlo colar num anúncio ou mandar para um fornecedor. **Todos os preços são referência estimada a conferir** em Mercado Livre, OLX ou lojas de seminovos no dia da compra; não há cotação feita.

---

## 1. Laboratório de aparelhos — R$ 6.000

**Para quê:** o jogo nunca rodou num celular real. A meta do plano é p95 do quadro abaixo de 33 ms num Android intermediário. Sem aparelhos variados, esse número é chute.

| Papel | Modelo sugerido (ou equivalente) | Por que este | Preço de referência (usado, estimativa) |
|---|---|---|---|
| Android fraco | Samsung Galaxy A05 / A06 (4 GB, Helio G85) | faixa de preço onde está boa parte do público brasileiro | R$ 500–700 |
| Android médio | Moto G84 / Galaxy A25 ou A35 | "Android intermediário" da meta do plano | R$ 900–1.300 |
| Android bom | Galaxy S21 / S22 | GPU forte, tela de alta taxa (testa 90/120 Hz) | R$ 1.500–2.000 |
| iPhone | iPhone 11 ou 12 (com bateria acima de 80%) | Safari/WebKit e áudio do iOS; base para a revisão da Apple | R$ 1.200–1.700 |
| Notebook | qualquer usado com GPU integrada (i5 8ª geração ou Ryzen 5 3500U, 8 GB) | testar a build do Steam numa máquina real (o Uwlo não tem PC) | R$ 1.200–1.600 |
| | | **Faixa total estimada** | **R$ 5.300–7.300** |

Se passar de R$ 6.000: cortar primeiro o Android bom (o Motorola Edge 70 Fusion Plus do Uwlo cobre esse papel). Ver também a "ponte" do roteiro em `orcamento.md`.

**Critérios de compra:** bateria com saúde informada; sem conta Google/Apple presa; tela sem mancha (mancha esconde problema de legibilidade); nota fiscal ou recibo. Guardar a lista com modelo, versão do sistema e data no `HANDOFF.md`.

**Como usar:** cada aparelho roda o mesmo roteiro do `teste-no-celular.md` (Diag ligado, 10 min no Ermo, relatório copiado). O relatório vai para uma tabela única: aparelho × fps × p50 × p95 × pior × INP × travadas.

---

## 2. QA freelance — R$ 3.000 (2 rodadas)

**Anúncio (para colar):**
> Procuramos testador(a) de jogos, freelance, para um survival brasileiro que roda no navegador do celular (PWA). Duas rodadas: mar/2027 (demo) e ago/2027 (pré-lançamento). Cada rodada: ~3 dias de teste em **pelo menos 2 celulares seus** (um Android e, se tiver, um iPhone) + um computador. Entrega: planilha de bugs com passo a passo para reproduzir, vídeo curto de cada bug grave e o relatório de diagnóstico do jogo. Pagamento: R$ 1.500 por rodada (estimativa: ~25 h a R$ 60/h; aceitamos proposta). Contrato simples com cessão do relatório. Maior de 18 anos.

**Roteiro de teste no celular (o que medir e como reportar):**

1. **Preparar:** bateria acima de 60%, sem modo economia, brilho no máximo, som ligado. Anotar modelo, versão do Android/iOS e navegador.
2. **Ligar o diagnóstico:** abrir o jogo com `?diag=1` no fim do endereço (ou segurar 4 dedos na tela por 2 s). O painel DIAG aparece no canto.
3. **Primeira sessão, sem ajuda (20 min):** começar jogo novo e anotar, com a hora, cada vez que ficou em dúvida do que fazer. Não ler a ajuda antes.
4. **Desempenho:** no Ermo Cinzento, de dia e depois à noite com chuva, jogar 5 min de cada e tocar em **Copiar relatório**. Repetir depois de 15 min contínuos (o aparelho esquenta: é aí que o fps cai).
5. **Toque:** tentar 20 vezes tocar num contêiner perto de um inimigo. Anotar quantas vezes o personagem andou em vez de vasculhar (toque "perdido"). Testar o modo uma mão e o modo duas mãos.
6. **Áudio:** com fone, conferir se o Geiger aponta o lado certo. Sair do app no meio do som e voltar: o som tem de parar e voltar.
7. **Ciclo de vida:** receber uma ligação ou trocar de app no meio da viagem de jipe; voltar. Fechar o navegador e abrir de novo: o save voltou?
8. **Offline:** instalar como app (Adicionar à tela inicial), ligar o modo avião, abrir.
9. **Acessibilidade:** jogar 5 min com o som desligado e "Sons no visor" ligado. Dá para saber de onde vem o perigo?

**Como reportar cada bug:** título curto · aparelho · passo a passo numerado · o que esperava × o que aconteceu · gravidade (trava o jogo / atrapalha / cosmético) · vídeo ou captura · relatório do Diag colado.

---

## 3. Editor(a) de trailer — R$ 5.000

**Entrega:** trailer de anúncio de 60 s em **9:16** (principal: TikTok, Shorts, Reels) e **16:9** (Steam, imprensa), e depois o trailer de lançamento. Música: a trilha do compositor (linha 1); enquanto ela não existe, o corte 1 usa só som do jogo. **Nada de imagem, voz ou música gerada por IA** (`politica-ia.md`).

**Anúncio (para colar):**
> Editor(a) de trailer para jogo indie brasileiro (survival pós-nuclear, pixel art gerada por código). Dois trailers de 60 s, em 9:16 e 16:9. Roteiro plano a plano pronto; o material é capturado do próprio jogo (enviamos os vídeos e um modo de captura). R$ 5.000 pelos dois, em duas parcelas (estimativa; aceitamos proposta). Mande portfólio com pelo menos um trailer de jogo.

### Roteiro de 60 s, plano a plano (anúncio)

Gancho do plano: **"O Geiger não mente. O rádio, sim."** Cada plano diz como capturar no jogo hoje. Onde falta recurso, está marcado **[falta]** e vira pedido para a coordenação.

| # | Tempo | Plano | Som | Texto na tela | Como capturar |
|---|---|---|---|---|---|
| 1 | 0–3 s | Tela preta. Só cliques de Geiger acelerando. | Geiger (Poisson) | — | gravar o áudio no Ermo andando para uma cratera; imagem preta na edição |
| 2 | 3–7 s | Abrigo ao pôr do sol, câmera parada, fumaça da fogueira. | vento + drone | **CINZAS** (logo) | base às 17h30, clima limpo (referência: `docs/plano-goty/arte-capturas/03-base-por-do-sol.png`) |
| 3 | 7–11 s | Rádio no abrigo; legenda da transmissão: "Posto Km 40 está limpo. Tem combustível." | chiado + voz de rádio **[falta: voz humana]**; no corte 1, só legenda | a fala, como legenda | depende da lib Escuta (transmissões) **[falta]** |
| 4 | 11–16 s | Viagem de jipe pelo mapa, poeira. | motor + trilha entra | — | viagem base → posto (`18-viagem.png`) |
| 5 | 16–21 s | Chegada ao Posto Km 40: parece calmo. O Geiger começa a chiar. | Geiger subindo | — | zona `posto`, meio-dia |
| 6 | 21–25 s | Close no personagem parando; seta do Geiger aponta para uma carcaça. | Geiger forte, coração | "O rádio disse: limpo." | Geiger com Sons no visor ligado (mostra a direção) |
| 7 | 25–29 s | Caderno de Escuta: carimbo **MEIA-VERDADE** na ficha. | carimbo seco | "Disseram × Verdade" | depende da lib Escuta (Caderno) **[falta]** |
| 8 | 29–35 s | Noite sem lanterna no Ermo, quase tudo escuro. | só passos e Geiger | — | Ermo às 23h, lanterna desligada (`04-base-noite.png` como tom) |
| 9 | 35–38 s | Relâmpago revela o Colosso a dois metros. | trovão, silêncio | — | Ermo com tempestade + Colosso (`07-ermo-colosso.png`, `08-ermo-tempestade.png`) |
| 10 | 38–46 s | Montagem rápida: saque raro (cor), combate de taco, cidade com irradiados, pântano com chuva ácida, refinaria. | trilha no auge | — | `10-cidade-dia`, `11-cidade-irradiados`, `16-pantano-acida`, `17-refinaria` |
| 11 | 46–52 s | Tela de morte com o card ("sobreviveu 3 dias…"). | trilha corta | "Você morre. O que você aprendeu, não." | morrer de propósito; card de compartilhar |
| 12 | 52–57 s | Abrigo de dia, novo sobrevivente sai pelo portão. | tema volta, calmo | "O Geiger não mente. O rádio, sim." | base ao meio-dia (`02-base-meio-dia.png`) |
| 13 | 57–60 s | Cartela final. | último clique de Geiger | **CINZAS** · "Demo grátis no navegador" · (data só quando houver; **nunca** "em breve" sem data) | — |

**Pedidos para a coordenação poder capturar:**
- modo de captura sem HUD (ex.: `?captura=1` escondendo HUD, controles e toasts) **[falta]**;
- comando de console para hora e clima fixos: hoje a cena tem `dev(arq, dx, dy)` (põe uma criatura ao lado, serve para o Colosso do plano 9), `devObjetivo` e `devNpc`, mas não tem hora nem clima fixos; mudar `__cinzas.cena().s.minutos` à mão talvez funcione **[conferir; pedir `devHora`/`devClima`]**;
- gravar em 1080×1920 a 60 fps num aparelho bom (o lab, linha 4) ou no Chrome do notebook com emulação de celular.

**Regra honesta do trailer:** só imagem do jogo rodando de verdade (sem cena montada fora do jogo, sem efeito que o jogo não tem). Se um plano usa recurso ainda não lançado, ele só entra quando o recurso existir.
