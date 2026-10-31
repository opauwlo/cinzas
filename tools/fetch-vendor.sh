#!/usr/bin/env bash
# Reclona os fontes de terceiros (plano B sem npm) nos commits fixados no HANDOFF.md §5.
# Destino: vendor/src/ (fora do git). Clones rasos e esparsos; não executa nada dos repos.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/vendor/src"
mkdir -p "$DEST"

# nome | url | commit | caminhos esparsos (separados por espaço)
REPOS=(
  "phaser|https://github.com/phaserjs/phaser|02d8931b626d9764c133cbb3fbf99966c03c757c|/dist/phaser.esm.js /dist/phaser.min.js /types/* /LICENSE.md /package.json"
  "box2d|https://github.com/erincatto/box2d|dd8bd3fb525f0f33f1079f8ca3c5770783c44a53|/src/* /include/* /LICENSE"
  "walloc|https://github.com/wingo/walloc|a93409f5ebd49c875514c5fee30d3b151f7b0882|/walloc.c /LICENSE.md"
  "trystero|https://github.com/dmotz/trystero|acef9ddc15528f3d5476b64023c4c8d21ff8d5c9|/packages/core/* /packages/nostr/* /packages/ws-relay/* /packages/torrent/* /LICENSE"
  "noble-secp256k1|https://github.com/paulmillr/noble-secp256k1|04c95fb63085e862a14616ce5b86549fea56191c|/index.ts /LICENSE /package.json"
  "nipplejs|https://github.com/yoannmoinet/nipplejs|ea425b3e81deaed14e384a2edcfbbd6a9a50f45b|/packages/nipplejs/src/* /LICENSE"
  "zzfx|https://github.com/KilledByAPixel/ZzFX|aab7e2b6b9086746b6e55fab75c75ce03e716c49|/ZzFX.js /LICENSE"
  "simplex-noise|https://github.com/jwagner/simplex-noise.js|6bfff874f5f0efed6375a9bf27fbd39b3cec6b4e|/simplex-noise.ts /LICENSE"
  "alea|https://github.com/coverslide/node-alea|4107f9c589f5dbee7f2e9d425c6e3bbee70e6cb9|/alea.js /LICENSE*"
  "pathfinding|https://github.com/qiao/PathFinding.js|2904a9afba483c02b5a61eb60fefd63e9b2db78c|/src/* /LICENSE"
  "heap|https://github.com/qiao/heap.js|21701c0b9c22039de6f948ed5f6d44e53ae79231|/lib/* /index.js /LICENSE*"
)

for entry in "${REPOS[@]}"; do
  IFS='|' read -r name url commit paths <<< "$entry"
  dir="$DEST/$name"
  if [ -d "$dir/.git" ] && [ "$(git -C "$dir" rev-parse HEAD)" = "$commit" ]; then
    echo "ok   $name (já no commit)"; continue
  fi
  rm -rf "$dir"
  timeout 300 git clone -q --filter=blob:none --no-checkout "$url" "$dir"
  # shellcheck disable=SC2086
  git -C "$dir" sparse-checkout set --no-cone $paths
  timeout 300 git -C "$dir" checkout -q "$commit"
  got="$(git -C "$dir" rev-parse HEAD)"
  [ "$got" = "$commit" ] || { echo "ERRO $name: commit $got != $commit" >&2; exit 1; }
  n="$(find "$dir" -type f -not -path '*/.git/*' | wc -l)"
  [ "$n" -gt 0 ] || { echo "ERRO $name: nenhum arquivo" >&2; exit 1; }
  echo "ok   $name @ ${commit:0:7} ($n arquivos)"
done
