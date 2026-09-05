#!/bin/bash
# Double-click this to preview the site with working links.
#
# Opening index.html directly does not work for clicking around: the links
# are root-absolute (/services, /pricing) and from file:// those resolve
# against your hard drive rather than the site. This starts a small local
# server so they resolve the way they will in production, and opens it.
#
# Close this Terminal window when you are done.

cd "$(dirname "$0")" || exit 1

PORT=8000
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node is not installed, so falling back to Python."
  echo "  Clean URLs like /pricing will 404; /services and /case-studies work."
  echo
  python3 -m http.server "$PORT" &
else
  node tools/serve.js "$PORT" &
fi

SERVER=$!
sleep 1
open "http://localhost:$PORT"

trap 'kill $SERVER 2>/dev/null' EXIT
wait $SERVER
