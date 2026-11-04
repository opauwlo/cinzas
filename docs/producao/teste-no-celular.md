# Teste no celular

Duas partes: **A** é o Uwlo sozinho no Motorola (10 min). **B** é o teste com 5 pessoas de fora (1 tarde).

---

## A. Uwlo no Motorola Edge 70 Fusion Plus: medir e mandar o relatório

Pré-requisito: a coordenação ter montado o `<Diag />` no jogo e publicado o link novo (ver `game/lib/producao/INTEGRACAO.md`). Até lá, o painel não aparece.

1. **Prepare o celular.** Bateria acima de 60%. Tire do modo economia de bateria. Feche os outros apps. Brilho no máximo.
2. **Abra o link do jogo** no Chrome.
   - Se o endereço aceitar parâmetro (deploy da Vercel ou outro site): ponha `?diag=1` no fim do endereço e abra. Exemplo: `https://seu-endereco/?diag=1`.
   - **No link do artifact do Claude (que não aceita `?diag=1`):** abra o jogo normalmente e **segure 4 dedos na tela por 2 segundos**. O painel **DIAG** aparece no canto de cima, à esquerda. Fazer de novo esconde. (São 4 e não 3 porque, no Motorola, segurar 3 dedos tira captura de tela.)
   - O Diag fica lembrado no aparelho. Para tirar: toque no **×** do painel.
3. **Jogue.** Comece ou continue, vá de jipe até o **Ermo Cinzento** e jogue **5 minutos** normalmente: ande, vasculhe, lute.
4. **Toque várias vezes na tela** (vasculhar, atacar, abrir mochila). Isso mede o "toque (INP)", que é o tempo entre o seu dedo e a tela responder.
5. **Toque em "Copiar relatório".**
   - Se aparecer "Copiado", vá para o chat do Claude e **cole** (segure no campo de texto → Colar).
   - Se aparecer um quadro de texto, **segure em cima dele → Selecionar tudo → Copiar**, e cole no chat.
6. **Repita depois de 15 minutos de jogo contínuo** (o celular esquenta e é aí que o desempenho cai). Toque em **Zerar** antes, jogue 2 min, e copie de novo. Mande os dois relatórios.
7. **Diga também, com suas palavras:** o celular esquentou? Algum toque "não pegou"? O som atrasou em relação ao toque?

**Como ler o relatório (para você não depender de ninguém):**
- `fps`: quadros por segundo; 60 é o máximo da tela comum.
- `p95`: em 100 quadros, 95 foram mais rápidos que isso. **A meta é ficar abaixo de 33 ms.** É o número que mais importa.
- `pior`: o quadro mais lento. Um pior alto com p95 baixo = uma travada isolada (carregar zona, por exemplo).
- `travadas`: quadros de 50 ms ou mais (a tela "engasga").
- `leitura`: **liso**, **aceitável** ou **pesado**, já comparado com a meta.

O relatório não tem nome, e-mail nem localização. O modelo do celular aparece porque é você quem manda; ele **não** vai para a telemetria.

---

## B. Teste com 5 estranhos (teste de corredor)

**Por que 5:** cinco pessoas já mostram a maior parte dos problemas de uso (Nielsen, citado no plano §2). **Quem:** maiores de 18, que **não** conhecem o jogo, com celulares diferentes (se der: um Android barato, um iPhone). Amigos de amigos servem; família próxima, menos.

### Antes
- Peça licença para observar e anotar. **Não grave a tela nem a voz sem um "sim" explícito.** Não anote nome: use P1, P2…
- Diga só: *"É um jogo de sobrevivência. Quero ver como você joga sem ajuda. O teste é do jogo, não seu: se algo confundir, a culpa é nossa."*
- Peça para a pessoa **falar em voz alta** o que está pensando.
- Ligue o Diag no celular dela (4 dedos, 2 s) e esconda com o **–** (o painel fica pequeno no canto).

### Durante (20 min por pessoa) — você **não ajuda**
Só responda "o que você acha?". Anote o minuto de cada coisa:

| Momento | O que observar | Anotar |
|---|---|---|
| 0–2 min | Entendeu o que fazer primeiro? | minuto em que fez a 1ª ação útil |
| Primeiro saque | Achou como vasculhar? | minuto; quantos toques "perdidos" (andou em vez de pegar) |
| Fabricar na bancada | Achou a bancada? | minuto ou "não achou" |
| Primeira viagem de jipe | Achou o jipe e o mapa? | minuto ou "não achou" |
| Primeira morte/desmaio | Entendeu por que morreu? | causa que a pessoa disse × causa real |
| Qualquer hora | Hesitou mais de 10 s, ficou irritada, sorriu, falou "ah, legal" | o que estava na tela |

Ao fim, toque em **Copiar relatório** no Diag e guarde junto com P1, P2…

### Depois: as 5 perguntas do plano (§5.2)
1. Foi divertido? (0 a 10)
2. Qual foi o seu momento favorito?
3. O que confundiu?
4. Você jogaria amanhã?
5. Indicaria para alguém? Para quem?

### Resultado (para mandar no chat)
Uma linha por pessoa: `P1 · celular · minuto do 1º saque · achou o jipe? · morreu de quê (disse × real) · nota · momento favorito · o que confundiu · relatório do Diag`.
**Regra honesta:** o resultado serve para tirar atrito e frustração. Não serve para inventar isca de retenção.
