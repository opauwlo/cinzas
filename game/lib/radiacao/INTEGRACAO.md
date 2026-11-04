# Radiação: o que a coordenação precisa ligar

Pilar "Ouvir o invisível". A lib está em `game/lib/radiacao/` e não depende de nada novo do npm.

- `campo.ts`: as fontes saem dos picos de `zona.rad` (cratera, barril, cogumelo, carcaça, mais o Colosso e o pó azul). A pluma roda numa grade 96×96 a 2 Hz: o vento leva, a difusão espalha, a chuva derruba e lava, a poeira levanta o chão e a chuva ácida soma.
- `dose.ts`: `DosimetroCinzas` separa a contaminação (o `s.rad` de hoje, com a mesma fórmula) da dose acumulada. A dose tem degraus em 100, 250, 400 e 500.
- `geiger.ts`: `leituraGeiger` devolve cpm na escala de hoje, `pan` pela tela isométrica e nível de 0 a 3. `setaPan` dá ◀ ou ▶.
- `po.ts`: o momento autoral (pó azul, ver abaixo).
- `index.ts`: `radiacao` (instância única, `SistemaRadiacao`, id `'radiacao'`) e `moduloRadiacao`.

## Lib da comunidade: escolha

| Opção | Licença | Avaliação |
|---|---|---|
| `ndarray` + `ndarray-ops` (scijs) | MIT | Útil para a grade, mas não faz advecção nem difusão. Gera código com `new Function`, o que esbarra em CSP e PWA, e a última versão é de 2016. Para uma grade 96×96, um `Float32Array` com laço é mais rápido. |
| `gpu.js` 2.24 | MIT | 4,4 MB. Precisa de WebGL, não roda puro em Node (o teste exige) e é exagero para 9.216 células. |
| Solvers "stable fluids" do npm | variam | Resolvem Navier-Stokes inteiro (projeção de pressão). Aqui o vento já vem do clima, então isso seria custo sem ganho, e os pacotes estão parados. |
| **`simplex-noise` 4.0.3** (já no projeto) | MIT | **Usado.** Faz o meandro do vento (a pluma serpenteia), com a semente vinda de `game/lib/rng.ts` (alea, MIT). |

**Decisão:** a advecção é semi-lagrangiana (o algoritmo publicado de Jos Stam, *Stable Fluids*, SIGGRAPH 1999) e a difusão é explícita de 5 pontos, ambas feitas à mão. Com vento uniforme por passo, os pesos bilineares são os mesmos para a grade inteira, então o passo custa cerca de 0,17 ms em Node. O ruído vem do `simplex-noise`, que já está no projeto. Nenhuma dependência nova.

**Linha para o `CREDITS.md`:**
> Campo de radiação (`game/lib/radiacao/`): advecção semi-lagrangiana segundo Jos Stam, "Stable Fluids" (SIGGRAPH 1999). O algoritmo é publicado e a implementação é própria. Usa simplex-noise (MIT) e alea (MIT), que já estão no projeto.

## Passos na cena (trechos prontos)

**1. `game/nucleo/modulos.ts`**
```ts
import { moduloRadiacao } from '../lib/radiacao';
export const MODULOS: ModuloJogo[] = [moduloRadiacao];
```

**2. `game/cena.ts:346`.** Sincronize a contaminação em volta do `nucleo.tick`. Assim continuam valendo os pontos que já mexem em `s.rad` (antirrad em `acoes.ts:148`, fonte em `:129`, desmaio em `:244`, eventos em `:184`, sono em `avancar`).
```ts
if (!this.morto) { this.preencherMundo(); radiacao.imune = pk(s, 'imune'); radiacao.dosimetro.contaminacao = s.rad; this.nucleo.tick(dt, this.mundo); s.rad = radiacao.dosimetro.contaminacao; s.radMax = Math.max(s.radMax, s.rad); /* …resto igual… */ }
```
(`import { radiacao } from './lib/radiacao';`)

**3. `game/cena.ts:426-428` (`necessidades`).** A conta de ganho sai da cena, porque o módulo já soma a contaminação com a mesma fórmula:
```ts
this.radSuave = radiacao.taxaJogador(); // o ganho de contaminação já aconteceu no tick do módulo
```
Apague a linha de `ganho` e a linha do `s.rad = …`. **Se uma delas ficar, a contaminação conta em dobro.**

**4. `game/cena.ts:429`: a dose mexe no `maxHp`. `:425`: sede ×1,3 no degrau 2.**
```ts
const ef = radiacao.efeitoDose();
s.maxHp = 100 + VIDA_POR_NIVEL * Math.min(10, (s.nivel ?? 1) - 1) + (pk(s, 'pele') ? 15 : 0) - s.rad * 0.5 + ef.hpMax; // ef.hpMax = −10 a partir de 100 de dose
// :425 → s.sede = Math.max(0, s.sede - dmin * SEDE_POR_MIN * fm * ef.sede);
```
`ef.vinheta` (0,35 no degrau 3) vai para a borda escura do HUD ou da Arte. `ef.aposenta` (degrau 4) é a regra da §3.5, e quem decide é a coordenação.

**5. `game/cena.ts:434`: Geiger.**
```ts
this.cpm = radiacao.cpm(); setGeiger(this.cpm, radiacao.leitura().pan);
```
O `setGeiger(cpm, pan)` com `StereoPannerNode` fica com a Música (`audio.ts`). Outra saída é a Música ouvir `barramento.on('geiger', e => …)`, que chega cerca de 5 vezes por segundo com `cpm`, `pan` e `nivel`.

**6. A seta ◀▶ das legendas (`components/Hud.tsx:72`, `SonsVisuais`).** Na `:545` da cena, acrescente `geigerPan: radiacao.leitura().pan` ao `useJogo.setState` e passe para `SonsVisuais`:
```tsx
import { setaPan } from '../game/lib/radiacao/geiger';
const s = setaPan(pan); // '◀' | '▶' | ''
… Geiger {s === '◀' ? '◀ ' : ''}{['fraco', 'médio', 'FORTE'][g - 1]}{s === '▶' ? ' ▶' : ''}
```

**7. `game/sistemas/acoes.ts`**
- `beberFonte` e o reservatório: `radiacao.lavar(J.x, J.y)`, com o toast "A água leva o pó azul." quando `radiacao.poNaRoupa() > 0`.
- `desmaiar` (Jornada, S4): `radiacao.somarDose(40)`.

**8. Save:** nada a fazer. O `Nucleo.salvar` guarda `{ v, dose, po, rastros }` em `s.nucleo.radiacao`. Um save antigo carrega com dose 0.

**9. Outros leitores:** a grade da Arte (`CtxGrade.rad`) passa a usar `radiacao.taxaJogador()`. A IA dos irradiados (§4.7) pode subir o `radiacao.campo?.gradiente(x, y)` para "pastar" na pluma.

## Pedidos de contrato (só a coordenação edita)
- `EventoJogo`: `{ t: 'dose'; degrau: DegrauDose; dose: number }`, para o HUD mostrar a dose só quando muda de degrau (S2). Até ele existir, faça polling de `radiacao.dosimetro.degrau()`.
- `Mundo.jogador`: um `imune?: boolean` tiraria o `radiacao.imune = …` da cena.

## Momento autoral: o pó azul (Goiânia, 1987)
Em algumas zonas há uma cápsula rompida. A chance vem da seed: 50% na cidade, 35% na refinaria, 30% no ermo. É um ponto muito quente e pequeno, sem pluma. O pó **gruda** em quem pisa e **cai pelo caminho**, cerca de 2% por casa andada, deixando um rastro que o Geiger ouve. **Vai junto no save**: se você entra no abrigo com ele, o chão do abrigo fica quente, e isso persiste por zona em `rastros`. Enquanto o pó está em você, os cliques aumentam mas **vêm do centro, sem seta**: o perigo não está em lado nenhum, está em você. Só água tira. A chuva lava devagar, e lavar-se tira tudo (um terço fica no chão onde você se lavou). É a história brasileira do perigo invisível que as pessoas levaram para casa, contada pelo som e não por texto.
- **Arte:** a cápsula de chumbo e um brilho azul fraco nas mãos quando `poNaRoupa() > 0.05`. É a única cor azul do mundo cinza, e ela significa alguma coisa.
- **Narrativa:** um bilhete-âncora com cuidado. Nada de nomes de vítimas, nada de espetáculo; nasce `autoria: 'rascunho-ia'` e passa por revisão humana. Sugiro ouvir quem trabalha com a memória do acidente antes de publicar.

Extra (não é o momento autoral): o Colosso abatido vira fonte nova (`abate` com `arq: 'colosso'` no barramento). O solo em volta esfria em cerca de meio dia de jogo.

## Números calibrados (todos nos testes)
- A pluma anda **7,0 a 7,5 casas** em 1 h de vento 0,85 (meta ≥ 6). Doze casas vento abaixo de uma cratera dão uns 60 cpm, contra 18 de fundo.
- Nas zonas frias (floresta, abrigo) `amostra` é igual a `zona.rad` (diferença < 1e-6), a contaminação usa a fórmula da `cena.ts:427` e a dose não anda (há fundo de 0,06).
- Dose: 1,8 por segundo por unidade de taxa acima do fundo. A máscara deixa passar 80% (ela segura o que se respira, não o gama) e o interior, 50%. Numa expedição de 7 min isso dá cerca de 37 no ermo e na refinaria e 112 no pântano, média 63: **400 em 7 expedições sem máscara e 9 com**. A dose cai 3 por dia de jogo.
- O `passo` leva cerca de 0,17 ms em Node e o `tick` por quadro, menos de 0,3 ms em média. Uma zona sem fonte "dorme" e custa cerca de zero.

## Riscos
1. **Contaminação em dobro** se a linha de ganho da `cena.ts:427-428` não for apagada (passo 3).
2. **Chuva ácida ficou mais alta no Geiger.** Antes eram +66 cpm, mas o ganho de contaminação equivalia a uma taxa de cerca de 0,32. Agora o som diz a verdade (cerca de +285 cpm) e o ganho muda menos de 10%. Dentro de casa a chuva ácida não conta, como hoje, e só 30% da pluma entra.
3. **Custo ao entrar na zona:** `criarCampo` aquece 2 h de pluma (13 a 40 ms em Node; num Android médio, talvez 50 a 150 ms). Acontece no carregamento da zona. Se pesar, reduza o aquecimento em `criarCampo`.
4. Outros sistemas ainda leem o `zona.rad` estático: spawn, a água da fonte (`acoes.ts:126`) e a Arte. Os barris novos da refinaria e a pluma só existem no campo.
5. O rastro do pó no abrigo some devagar (só a chuva espalha). É de propósito, mas pode irritar. Se o teste no celular pedir, dá para pôr uma ação "raspar o chão" com a pá.
6. O tema do pó azul é sensível (passo 7 e Narrativa).
