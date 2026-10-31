# CINZAS

Survival pós-apocalíptico nuclear em **pixel art isométrico**, feito para o **celular (Android/PWA)**: abrigo, viagens de jipe, saque, clima, gangues, mutantes e morte permanente.

- **Jogar:** abra o link publicado no Chrome do Android → menu ⋮ → **Instalar app** (funciona offline depois da primeira visita).
- **Desenvolver:** `npm ci` → `npm run dev` · `npm run build` (gera `out/`) · `npm run teste` (lógica e balanço, 3 s) · `npm run smoke` (Chrome headless).
- **Hospedar:** o site roda na Vercel (https://cinzas-green.vercel.app), que reconstrói a cada push na `main`. `.github/workflows/ci.yml` roda os testes, os tipos, a build e o smoke.
- **Arte:** toda gerada por código (`game/lib/`); veja o catálogo em `/arte/`. Densidade de pixels ajustável em Config. (Ultra → Leve).

Plano e estado atual em [`HANDOFF.md`](HANDOFF.md) (seção 15); créditos em [`CREDITS.md`](CREDITS.md).
