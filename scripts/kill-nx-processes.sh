#!/usr/bin/env bash
set -euo pipefail

MATCH_PATTERN='node_modules/.bin/nx|nx run|nx watch|nx run-many|nx/src/daemon|nx/src/project-graph|@nrwl|nrwl'
SELF_PID="$$"
PARENT_PID="$PPID"

if command -v pgrep >/dev/null 2>&1; then
  PIDS="$(pgrep -f -i "$MATCH_PATTERN" | awk -v self="$SELF_PID" -v parent="$PARENT_PID" '$1 != self && $1 != parent' | sort -u)"
else
  if command -v rg >/dev/null 2>&1; then
    FILTER_CMD=(rg -i)
  else
    FILTER_CMD=(grep -i)
  fi

  PS_OUTPUT="$(ps -eo pid=,args=)"
  MATCHED="$(printf '%s\n' "$PS_OUTPUT" | "${FILTER_CMD[@]}" "$MATCH_PATTERN" || true)"
  PIDS="$(printf '%s\n' "$MATCHED" | awk -v self="$SELF_PID" -v parent="$PARENT_PID" '$1 != self && $1 != parent {print $1}' | sort -u)"
fi

if [ -z "$PIDS" ]; then
  echo "No matching Nx processes found."
  exit 0
fi

kill $PIDS || true
sleep 0.2

if command -v pgrep >/dev/null 2>&1; then
  PIDS="$(pgrep -f -i "$MATCH_PATTERN" | awk -v self="$SELF_PID" -v parent="$PARENT_PID" '$1 != self && $1 != parent' | sort -u)"
else
  PS_OUTPUT="$(ps -eo pid=,args=)"
  MATCHED="$(printf '%s\n' "$PS_OUTPUT" | "${FILTER_CMD[@]}" "$MATCH_PATTERN" || true)"
  PIDS="$(printf '%s\n' "$MATCHED" | awk -v self="$SELF_PID" -v parent="$PARENT_PID" '$1 != self && $1 != parent {print $1}' | sort -u)"
fi

if [ -z "$PIDS" ]; then
  echo "Killed Nx processes."
  exit 0
fi

kill -9 $PIDS || true
echo "Killed Nx processes."
