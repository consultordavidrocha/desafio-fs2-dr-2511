#!/usr/bin/env bash
# Gera os PDFs da documentação a partir de docs/src/*.html usando o Chrome headless.
# Uso: bash docs/build-pdf.sh   (defina CHROME se o Chrome estiver em outro caminho)
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for candidate in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then CHROME="$candidate"; break; fi
  done
fi
[ -n "$CHROME" ] || { echo "Chrome não encontrado; defina CHROME=/caminho/do/chrome" >&2; exit 1; }

# Caminho absoluto (no Git Bash do Windows, no formato C:/...).
here() { pwd -W 2>/dev/null || pwd; }

# Perfil temporário: não interfere num Chrome que esteja aberto.
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

render() { # $1 = html de origem, $2 = pdf de saída
  local src out
  src="$(cd src && here)/$1"
  out="$(here)/$2" # o Chrome resolve caminhos relativos a partir da pasta dele, não daqui
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$PROFILE" \
    --print-to-pdf="$out" "file:///${src#/}" >/dev/null 2>&1
  echo "gerado: docs/$2 ($(du -k "$2" | cut -f1) KB)"
}

render manual.html manual-do-usuario.pdf
render tecnica.html documentacao-tecnica.pdf
