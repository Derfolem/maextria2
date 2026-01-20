#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <input-image> <slug> [base-url]" >&2
  echo "Example: $0 /path/to/cover.png curso-ia-pratica https://maextria.com.br" >&2
  exit 1
fi

INPUT_PATH="$1"
SLUG="$2"
BASE_URL="${3:-https://maextria.com.br}"
PUBLIC_DIR="/home/fredomi/maextria/frontend/public"
OUTPUT_PATH="${PUBLIC_DIR}/${SLUG}.webp"

if [[ ! -f "$INPUT_PATH" ]]; then
  echo "Input file not found: $INPUT_PATH" >&2
  exit 1
fi

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' not found. Install it and try again." >&2
  exit 1
fi

mkdir -p "$PUBLIC_DIR"

convert "$INPUT_PATH" -quality 82 "$OUTPUT_PATH"

echo "Saved: $OUTPUT_PATH"
echo "URL: ${BASE_URL}/${SLUG}.webp"
