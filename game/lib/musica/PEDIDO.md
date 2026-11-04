# Pedido de compra — Compositor(a) + design de som (R$ 18.000)

Linha do orçamento do sprint 1 (`docs/sprint1/TIME.md`). Quem contrata é o Uwlo; este documento é a chamada pronta para publicar e o roteiro do teste pago. Base: `docs/plano-goty/audio.md` §2, §3 e §5.

## Divisão do valor

| Item | R$ |
|---|---|
| Teste pago dos 3 finalistas (R$ 800 cada, pago na entrega, escolhido ou não) | 2.400 |
| Fase 1 da trilha (composição, gravação em estúdio caseiro, MIDI): tema gravado + segmentos dos estados mínimos + multiamostras da sessão 1 | 12.000 |
| Design de som fase 1: sirene de defesa civil, voz dos Filhos do Cinza (3 tipos) e fauna brasileira (6 espécies) | 3.600 |
| **Total** | **18.000** |

A trilha completa (≈ R$ 45–60 mil no cenário enxuto do plano) vem nas próximas captações; a fase 1 já tem valor sozinha (single, trailer, demo do BIG Festival).

---

## A chamada aberta (texto para publicar)

> **CINZAS procura compositor(a) brasileiro(a) para a trilha de um survival pós-nuclear.**
>
> CINZAS é um jogo de sobrevivência para celular (vertical, uma mão) que se passa num Brasil depois da bomba. A tese da trilha: **"O Brasil que sobrou toca no rádio, fora do tom."** Viola caipira, rabeca, pífano, zabumba, coral de igreja, sanfona, rádio AM e sirene de defesa civil, tocados por sobreviventes, com afinação gasta, ouvidos de longe. Nada de orquestra épica.
>
> Procuramos quem toque (ou escreva para) **viola caipira e/ou rabeca**, e tenha intimidade com a tradição armorial, a música do sertão ou a música caipira. Referências: Quinteto Armorial, Elomar, Almir Sater, Tavinho Moura, Uakti, Naná Vasconcelos, Hermeto Pascoal, Cátia de França; nos jogos, Santaolalla (*The Last of Us*), *Darkwood*, *S.T.A.L.K.E.R.*
>
> **A trilha é adaptativa.** Você escreve segmentos de 2, 4 ou 8 compassos com saída em toda barra, e o motor do jogo escolhe a ordem e a hora de trocar. Ele nunca inventa notas: toda nota que toca foi escrita por você.
>
> **Regras do jogo (inegociáveis):** trilha e vozes 100% humanas. **Proibido usar IA generativa** (Suno, Udio e afins) em qualquer etapa do material entregue. Ferramentas de processamento (EQ, compressão, Demucs, RNNoise) estão liberadas.
>
> **Como se inscrever (pelo celular, formulário de 5 minutos):** até 3 links de trabalhos (SoundCloud, YouTube, Bandcamp, Instagram), 1 gravação sua tocando qualquer coisa (pode ser no celular) e um parágrafo sobre o que a frase "o Brasil que sobrou toca no rádio, fora do tom" te faz ouvir. Não pedimos diploma nem currículo. Escolhemos 3 finalistas, e **cada finalista recebe R$ 800 pelo teste**, contratado(a) ou não.
>
> Inscrições de todo o Brasil, com atenção especial a quem vem do interior, do Nordeste e de fora do eixo Rio–São Paulo. Divulgação: BIG Festival, ABRAGAMES, grupos de violeiros e rabequeiros, escolas de música popular.

### O que já existe (o(a) contratado(a) recebe)
- O plano de áudio completo e o **tema provisório** "Toada do Abrigo" (Ré, 3/4, ♩ = 66): motivo M Ré–Lá–Sol♯–Lá e resposta R Dó–Lá–Fá–Mi–Ré, com harmonia e leitmotivs (`game/lib/musica/partitura.ts`). Você pode **refazer o tema**, desde que mantenha as regras de identidade abaixo.
- O motor pronto (`game/lib/musica/`): a sua partitura entra no mesmo formato, e o jogo passa a tocá-la.

### Regras de identidade da trilha (o motor testa várias delas)
1. **A quinta vazia:** o acorde de Ré nunca tem terça durante o jogo. A terça menor (Fá) aparece nas perdas. **A terça maior (Fá♯) só soa no final.**
2. **Um instrumento, uma pessoa:** o tema é sempre tocado por um instrumento sozinho. A segunda voz em terças (a dupla caipira) só entra no final.
3. **Fora do tom de propósito:** rabeca em Lá = 436 Hz contra a viola em 440. O batimento é sempre igual, nunca aleatório.
4. **Celular primeiro:** a melodia fica entre Ré4 e Ré6 (≈ 300 Hz a 4 kHz). Nada que dependa de grave abaixo de 140 Hz para ser entendido.
5. **Assobiável:** alguém tem de conseguir cantarolar M no dia seguinte (gate G1 do plano).

---

## O teste pago dos 3 finalistas: a mesma cena de 2 minutos

Cada finalista recebe o **mesmo vídeo de 2:00** capturado no jogo (sem música, com o som ambiente e os efeitos) e esta folha de deixas:

| Tempo | O que acontece | O que a música faz |
|---|---|---|
| 0:00–0:45 | Ermo Cinzento ao entardecer. O jogador anda sozinho entre crateras; o Geiger estala baixo | Exploração: o tema (ou um fragmento dele) num instrumento só, com muito silêncio |
| 0:45 | Um saqueador aparece ao longe e o nota | Tensão: a melodia some e entra um pulso. **A troca acontece na barra** |
| 1:00–1:35 | Combate com 3 saqueadores (gangue) | Combate: ♩ = 132 (o dobro do tema), percussão. O riff Sol♯–Lá em 7/8 é bem-vindo |
| 1:35 | Último abate | Saída do combate: termina a frase, sem corte seco |
| 1:35–1:45 | Respiro | 6 a 12 s só com o ambiente: o silêncio faz parte da trilha |
| 1:45–2:00 | Alívio, o sol se põe | A resposta R, devagar, num instrumento só |

**Entrega do teste (em 2 semanas):**
- a mixagem da cena (WAV estéreo, 48 kHz, 24 bits, sincronizada com o vídeo);
- os **segmentos soltos** usados: o loop de exploração, o de combate (4 barras, com saída em toda barra) e a ponte combate → alívio, cada um em WAV + **MIDI**;
- até 4 stems (por exemplo: cordas, percussão, sopro e voz);
- um parágrafo dizendo o que você tocou de verdade e o que é amostra (de quem e com qual licença).

**Como escolhemos:** o Uwlo ouve os três às cegas (sem nomes), **no celular**, numa página de escuta A/B, no alto-falante e no fone. Os critérios abaixo são lidos e pontuados por ele e por mais duas pessoas do time.

| Critério | Peso |
|---|---|
| Identidade: soa como o Brasil do interior, e como CINZAS (a paleta, a tese) | 25% |
| Tema memorável: dá para assobiar no dia seguinte | 20% |
| Funciona adaptativo: os loops emendam, as trocas na barra funcionam, o silêncio é usado | 20% |
| Celular: claro no alto-falante do Motorola a 50% de volume, sem embolar | 15% |
| Execução humana e qualidade da gravação (estúdio caseiro bom serve) | 10% |
| Prazo e conversa (respondeu, entregou no combinado, explicou as escolhas) | 10% |

Desempate: o teste cego "isso é de um jogo de R$ 100?" (gate G2 do plano) com 10 jogadores, pelo celular.

---

## Cronograma

| Data | Etapa |
|---|---|
| 9/nov/2026 | Chamada publicada (formulário pelo celular) |
| 23/nov | Fim das inscrições |
| 24–27/nov | Triagem: 3 finalistas avisados, com o vídeo, a folha de deixas e o contrato do teste |
| 30/nov–14/dez | Teste pago (2 semanas); R$ 800 pagos em até 5 dias úteis após a entrega |
| até 18/dez | Escolha e aviso aos três (com retorno escrito a cada um) |
| 21/dez | Contrato da fase 1 assinado; 30% pagos |
| 15/jan/2027 | **Tema gravado** (viola + rabeca, 2:30, com loop) — gate G1 de assobio com 10 pessoas |
| 28/fev | Segmentos dos estados mínimos (abrigo, exploração, tensão, combate, morte) em MIDI + WAV, e as multiamostras da sessão 1 (viola e rabeca, 24 notas × 2 dinâmicas); 40% pagos |
| 15/mar | Design de som: sirene, vozes dos Filhos do Cinza, fauna (quero-quero, seriema, urutau, sapo-cururu, cigarra, araponga); 30% pagos |
| mar/2027 | Single "Toada do Abrigo" junto com o trailer de revelação |

---

## Cláusulas do contrato (resumo para o jurídico da Produção conferir)

1. **Autoria:** o(a) compositor(a) **mantém a autoria** das obras (Lei 9.610/98) e o crédito nominal em todo lugar em que a trilha aparecer ("Trilha original: Nome").
2. **Licença ao jogo:** licença **exclusiva de sincronização**, mundial e por prazo indeterminado, para o jogo, as suas versões e atualizações, e os materiais promocionais (trailers, redes, eventos).
3. **Content ID liberado para streamers:** o(a) compositor(a) e a distribuidora **não registram** as faixas do jogo em sistemas de identificação automática (Content ID do YouTube e afins) e **não reivindicam** vídeos e transmissões de jogadores. Se a distribuidora do álbum registrar por padrão, a liberação (whitelist) é obrigação contratual.
4. **Proibido IA generativa:** nenhum material entregue (composição, arranjo, interpretação, voz ou efeito) pode ser gerado por IA generativa. O(a) contratado(a) assina declaração e entrega o projeto da DAW e os stems como comprovação. Ferramentas de processamento são permitidas e listadas na entrega.
5. **Amostras de terceiros:** só CC0, CC BY ou bibliotecas com licença comercial, listadas com a licença. Nada de CC BY-NC (como a maior parte do xeno-canto).
6. **Álbum:** master em coprodução, com divisão da receita líquida do álbum a combinar (sugestão: 50/50). Direito de **arranjo orquestral** (TGA, concertos) com crédito e aviso ao(à) autor(a).
7. **Tradições:** a incelência e os cantos de tradição são gravados com quem os canta, com cachê justo, crédito nominal e consulta sobre o uso respeitoso.
8. **Pagamento:** teste R$ 800 na entrega; fase 1 em 30% / 40% / 30% (assinatura, segmentos, design de som). Atraso de mais de 15 dias sem aviso permite rescindir, pagando o que foi entregue.
9. **Sigilo** até o anúncio público do jogo; depois, o(a) compositor(a) pode mostrar o trabalho no portfólio.
