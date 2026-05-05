#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
	echo "Usage: $0 <source-dir> <r2-key-prefix>" >&2
	exit 64
fi

source_dir="$1"
key_prefix="${2%/}"

if [ -z "${CLOUDFLARE_R2_BUCKET:-}" ]; then
	echo "CLOUDFLARE_R2_BUCKET is not set. Add it as a GitHub repository variable." >&2
	exit 78
fi

if [ ! -d "$source_dir" ]; then
	echo "Source directory does not exist: $source_dir" >&2
	exit 66
fi

cd "$source_dir"

found=0
while IFS= read -r -d '' file; do
	found=1
	relative_path="${file#./}"
	key="$key_prefix/$relative_path"

	wrangler r2 object put "$CLOUDFLARE_R2_BUCKET/$key" \
		--file "$file" \
		--remote \
		--cache-control "public, max-age=604800"
done < <(find . -type f -print0 | sort -z)

if [ "$found" -eq 0 ]; then
	echo "No files found in $source_dir" >&2
	exit 65
fi
