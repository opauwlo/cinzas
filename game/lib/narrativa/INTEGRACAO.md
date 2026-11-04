# INTEGRAÇÃO — lib de Narrativa (`game/lib/narrativa/`)

Tudo puro (sem Phaser, sem DOM), tudo `autoria: 'rascunho-ia'`. API pública só em `index.ts`. Não importa nenhuma outra lib de área; usa só `game/nucleo/contratos.ts` (e, nos testes, `game/dados/locais.ts` e `objetivos.ts` para conferir ids e metas).

## 1. Libs da comunidade: avaliação e decisão

**(a) i18n** — decisão: **feito aqui** (`i18n.ts`, ~70 linhas) sobre `Intl.PluralRules` (ECMA-402, nativo no navegador e no Node).

| Opção | Licença | Tamanho | Encaixe | Veredito |
|---|---|---|---|---|
| i18next 26.7.1 | MIT | 50 KB min / 15,7 KB gz | plural por sufixo de chave (`_one/_other`), gênero por contexto (`_male`), interpolação `{{x}}`. A sintaxe do contrato (`{o\|a}` inline, `{n}`) exigiria pós-processador de qualquer jeito. Backends, detecção e namespaces não servem a um PWA offline com 2 idiomas. | Não: peso para recurso que não usamos. |
| rosetta 1.1.0 | MIT | 424 B + dlv + templite | tabela por idioma + busca por caminho; template `{{x}}` (templite). Sem plural nem gênero. O que ele faz (um `obj[lang][key]`) é uma linha; o resto teríamos de escrever. | Não: 3 pacotes para uma linha. |
| **Própria + Intl.PluralRules** | — | ~1 KB | Sintaxe do contrato, plural correto por idioma, queda para o português, pseudo-loc. | **Sim.** |

**(b) cenas ramificadas** — decisão: **dados próprios** (`tipos.ts: Cena`, tocador puro `roteiroCena` em `cena640.ts`), no formato de nós do ink (antes → rádio → escolha → resposta → fecho) para a migração ser mecânica se um dia valer a pena.

| Opção | Licença | Tamanho | Encaixe | Veredito |
|---|---|---|---|---|
| inkjs 2.4.0 (Inkle) | MIT | runtime 128 KB min / **31 KB gz**; com compilador 249 KB / 61 KB gz | Excelente para escrita (editor Inky). Mas: (1) precisa compilar `.ink` → JSON (compilador embutido no bundle, ou o `inklecate`/script do pacote, que a regra do projeto não deixa rodar); (2) localização no ink é uma história por idioma, o que tira o texto do catálogo único — o tradutor perde o arquivo só, e os testes de limite/pseudo-loc/gênero não alcançam; (3) `{a\|b}` no ink é sequência, colide com `{o\|a}`. | Não no sprint 1. Reavaliar se passarmos de ~30 cenas ou se o(a) roteirista contratado(a) preferir o Inky. |
| yarn-bound 0.5.5 | ISC | 330 KB (+ bondage) | Mesmo problema de catálogo; manutenção de um autor só. | Não. |
| **Dados próprios** | — | ~0 KB | 3 escolhas-chave e ~4 epílogos no 1.0. Texto por chave no catálogo, testável. | **Sim.** |

**Nenhuma dependência nova no `package.json`.** (inkjs foi instalado só com `--no-save` para medir; nada ficou no lock.)

**Linha para o `CREDITS.md`:** nenhuma de terceiro. Sugestão de linha de autoria: `Texto (rascunho): lib de Narrativa, sprint 1 — rascunho de IA, aguardando revisão e assinatura humana (ver game/lib/narrativa/PEDIDO.md).`

## 2. Momento autoral: **o caderno da Lia** (`caderno-lia.ts`)

A Lia anota num caderno de escola tudo o que a Íris diz, com um ✓ ao lado, porque "ela nunca erra". É o Caderno de Escuta do jogador visto por uma criança que acredita: a mesma tabela "disseram × verdade", com a coluna da verdade preenchida com fé.
- **Ela descobre o loop antes do jogador, com dado real da run.** O módulo registra cada 6h40 (a Lia ouve mesmo com Cris dormindo ou na estrada). Se ela ouviu duas vezes o programa da tosse, a página mostra os dias de verdade: *"Dia 4: tosse. Dia 11: tosse. IGUAL."* Se não aconteceu, a pista não aparece (`paginaCadernoLia`; testado).
- **As respostas de Cris entram no caderno dela com a mesma marcação que ela dá à Íris** (*"Cris disse: viu. ✓"*). O jogador lê a própria frase ao lado da frase da voz, em letra de criança, antes de a tela final "O QUE FOI DITO" fazer o mesmo.
- **No fim, a narradora escondida** (tela 1 da abertura, "Deixa eu contar do começo", e a tela "Não foi assim") se revela lendo deste caderno: *"Eu anotava tudo. Ainda anoto."*
- **Os desenhos da parede mudam por ato** e reagem à escolha 1 (se Cris disse "A gente vai ver", o sol do jipe ganha um ponto de interrogação no Ato II).

## 3. Como plugar (trechos prontos)

### 3.1 Módulo e tradutor
```ts
// game/nucleo/modulos.ts
import { narrativa } from '../lib/narrativa';
export const MODULOS: ModuloJogo[] = [narrativa /*, … */];

// no store (ou onde a cena tem o gênero/idioma do jogador)
import { tradutor } from '../lib/narrativa';
const t = tradutor(idioma /* 'pt' */, genero /* 'o' | 'a' */, pseudo /* ?pseudo=1 no smoke */);
```
O gênero de Cris precisa existir no save (hoje `gerarHumano` escolhe a aparência; falta o campo `genero: 'o' | 'a'` na criação).

### 3.2 Abertura (substitui `PASSOS_INTRO` em `game/dados/meta.ts`)
```ts
import { telasAbertura } from '../lib/narrativa';
export const PASSOS_INTRO = telasAbertura(t); // 6 telas; "O mundo acabou em luz." vai para o menu: t('menu.chamada')
```

### 3.3 Tela de morte (`components/Telas.tsx`, linhas 25–34)
```tsx
import { telaMorte } from '../game/lib/narrativa';
const m = telaMorte(t, { dif: dif(s), causa: resumo.causa, mortes: meta.mortesNaCampanha, sabe: cadernoSabe /* ['loop','caminhao','limite'] da Escuta */ });
<h1 className="titulo m">{vitoria ? 'ABRIGO 7' : m.titulo}</h1>
{!vitoria && m.linhas.map((l, i) => <p key={i} className="fim-prosa">{l}</p>)}
<button …>{vitoria ? 'Nova run' : m.botao}</button>
```
O resumo numérico da run continua igual embaixo (é a interface: não muda). Precisa de um contador `mortesNaCampanha` no meta-progresso.

### 3.4 Passos (`game/dados/objetivos.ts`) — proposta, a coordenação aplica
- `titulo` ← `PASSOS[i].titulo` formatado (`textoHud(t, id).titulo`); a 1ª linha da `dica` ← `textoHud(t, id).requisito` (o requisito honesto embaixo do título no HUD).
- `ATOS` ← `ATOS_NARRATIVOS.map(a => a.nome)`.
- **Ordem nova:** `radio` sai do Ato IV e vira o último do Ato III; passo novo `militar` (Ato IV, `local: 'militar'`, `valor: s => s.descobertos.includes('militar') ? 1 : 0`, sugestão xp 120) entre `nivel8` e `abrigo7`. **Subir `OBJ_VER` para 4** e rodar o teste de XP/locais (`militar` exige nível 8, igual ao `abrigo7`).
- **"oito" → dez:** em `game/dados/npcs.ts` (dica `combustivel`), trocar "Junte oito." por "Junta dez galões." (`FALAS_NPC_PROPOSTA.combustivel`). Também ali: "Abra o Diário…" e "Os atalhos de baixo…" falam língua de interface — trocar pelas falas de `FALAS_NPC_PROPOSTA` (`contrato`, `comer`, `abater3`). A repetição "Contrato cumprido é combustível e munição no bolso." some.

### 3.5 Catálogo de transmissões na Escuta
```ts
import { TRANSMISSOES, PROGRAMA_FAROL, farolDoDia, localizarTransmissao } from '../narrativa'; // via coordenação, não lib→lib
// Programacao.noAr(seed, dia, minuto, ato): às 6h40 (minuto 400) devolva farolDoDia(dia) — a semana gravada em loop;
// o resto por `minuto` (ausente = qualquer hora em que o rádio pegar) e `atos`.
// Antes de tocar: localizarTransmissao(tr, t) (troca falas, nomes e fichas pelo idioma; ids e efeitos iguais).
```
- `lume-porta` (minuto 401) toca **por cima** da Farol, na mesma frequência: interferência.
- As alegações que se repetem usam o **mesmo id** em vários dias (`farol-tem-lugar`, `farol-posto-agua`…): uma ficha só, e a repetição vira prova pelo instrumento `tempo`.
- Pistas do loop para o Áudio: `vinheta_falha` abre e fecha todo programa; `farol-d4` tem a tosse (efeito `chiado`).
- **Dependência de verdade:** `farol-previsao` é `meia` porque é previsão velha. Se a Escuta quiser que a 1ª manhã "acerte", é o clima que precisa casar com a gravação — nunca o texto.

### 3.6 Cena das 6h40 (fim do Ato I)
```ts
const c = narrativa.cenaPendente(mundo, passoConcluido('noite'));
if (c) for (const p of tocarCena(c, t)) { /* 'linha' → balão; 'radio' → Escuta toca farolDoDia(dia) e as interferências; 'escolha' → 3 botões */ }
// ao tocar um botão:
narrativa.escolher(c.id, tom, mundo.dia, t);                  // registra para o save e para "O QUE FOI DITO"
const tudo = tocarCena(c, t, tom, mundo.dia);
for (const p of tudo.slice(tudo.findIndex(p => p.tipo === 'escolha') + 1)) { … } // resposta da Lia, fecho e 'fim'
```
Tela final: `narrativa.oQueVoceDisse(t)` → `[{ disse, verdade, dia }]`. Mesa da base: `narrativa.paginaLia(t, ato)`; parede: `narrativa.parede(t, ato)` (decalque da Arte).

### 3.7 Bilhetes (`game/dados/notas.ts`) — proposta
`BILHETES` tem 8 âncoras (`ancora: true`, `local`, `ato`: o gerador garante como `TEMAS.radio.garante`) e 7 de mundo. `TROCA_NOTAS` diz o que sai (era manual) e o que fica. Os `premio` dos atuais (lata, pilha, ervas, tecido) continuam no `notas.ts`: o texto novo não depende deles. Ler com `localizarBilhete(b, t)` (resolve `{O|A} Cris` no caderno de plantão).

## 4. Testes (`narrativa.teste.ts`, 14 casos)
Limites §5.3 por tipo nos dois gêneros (pt e en) · palavras proibidas no texto do mundo (pt e en) · toda alegação verificável, sustentada por fala exata, local existente, sem duas versões · técnica de cada voz (loop de 7 dias, PX honesta, prazo falso, autoridade) · chave pt ↔ en/pendentes · `{o|a}` e plural · pseudo-loc +30% cabe na caixa · 25 passos × `OBJETIVOS` (meta no requisito; "dez") · cena · morte · caderno da Lia · módulo e save · sensibilidade (Césio-137, a Lia não morre).

## 5. Riscos
- **Gênero de Cris não existe no save.** Sem ele, tudo sai no masculino (padrão `'o'`). Pedir o campo na criação do personagem.
- **A Escuta precisa casar com a Farol do dia.** Se a Programacao sortear outro programa às 6h40, o loop deixa de ser descobrível e o caderno da Lia mente. Usar `farolDoDia(dia)`.
- **Texto é rascunho de IA.** Nada vai para loja ou imprensa antes da revisão humana (PEDIDO.md, item B).
- **Fitas 4–7 em esboço** (marcadas com `[esboço]` e em `FITAS_ESBOCO`): não ligar no jogo antes de terminadas.
- **Âncoras dependem do gerador** garantir um prop por local; o Abrigo 7 é zona feita à mão (roteiro §5.2).
- **Inglês parcial:** 168 de 394 chaves; o tradutor cai no português onde falta (nunca em branco).
- `localizarTransmissao` troca `quem` pelo nome exibido; quem precisar do id original guarda antes.
