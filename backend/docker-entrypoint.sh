#!/usr/bin/env bash
set -euo pipefail

LOG_PATH="${LOG_FILE:-/var/log/backend/app.log}"
LOG_DIR="$(dirname "$LOG_PATH")"

mkdir -p "$LOG_DIR"
if [ ! -f "$LOG_PATH" ]; then
  touch "$LOG_PATH"
fi

# Ensure log file is writable by the application user
chmod 664 "$LOG_PATH"

# Run the provided command and duplicate stdout/stderr to the log file
exec "$@" \
  >> >(tee -a "$LOG_PATH") \
  2>> >(tee -a "$LOG_PATH" >&2)
