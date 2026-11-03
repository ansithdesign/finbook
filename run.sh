#!/bin/sh
# Runs the prototype with the portable Node in .tools (falls back to system Node).
cd "$(dirname "$0")"
NODE_DIR="$(ls -d .tools/node-*/bin 2>/dev/null | head -1)"
[ -n "$NODE_DIR" ] && PATH="$PWD/$NODE_DIR:$PATH"
[ -d node_modules ] || npm install
exec npm run "${1:-dev}"
