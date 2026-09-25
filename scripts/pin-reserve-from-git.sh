#!/usr/bin/env bash
# Rebuild vendor/cavos-reserve from cavos-labs/reserve main (sdk/ts).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor/cavos-reserve"
SRC="$(mktemp -d)"
cleanup() { rm -rf "$SRC"; }
trap cleanup EXIT

git clone --depth 1 https://github.com/cavos-labs/reserve.git "$SRC"
cd "$SRC/sdk/ts"
npm install
npm run build

mkdir -p "$VENDOR"
rm -rf "$VENDOR/dist"
cp package.json README.md "$VENDOR/"
cp -R dist "$VENDOR/"
git -C "$SRC" rev-parse HEAD > "$VENDOR/.git-commit"
# Keep the pin note if present
if [[ ! -f "$VENDOR/README.pin.md" ]]; then
  cat > "$VENDOR/README.pin.md" <<'EOF'
# @cavos/reserve (git pin)
Temporary pin of cavos-labs/reserve sdk/ts. See scripts/pin-reserve-from-git.sh.
EOF
fi

echo "Pinned $(cat "$VENDOR/.git-commit") → $VENDOR"
