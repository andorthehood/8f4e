#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECTS_DIR="$SCRIPT_DIR/src/projects"
CLI_PATH="$SCRIPT_DIR/../cli/bin/cli.js"

count=0
while IFS= read -r -d '' project; do
	if [[ ! -f "$project" ]]; then
		continue
	fi

	wasm_output="${project%.8f4e}.wasm"
	node "$CLI_PATH" compile "$project" --wasm-output "$wasm_output"
	count=$((count + 1))
done < <(find "$PROJECTS_DIR" -type f -name '*.8f4e' -print0)

echo "Generated ${count} wasm files in packages/examples/src/projects"
