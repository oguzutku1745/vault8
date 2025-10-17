#!/usr/bin/env bash
# extract_frontend.sh
# Copy packages/frontend into a new standalone frontend repository folder.
# Usage: ./scripts/extract_frontend.sh /absolute/path/to/destination
# If no destination is provided, defaults to ../vault8-frontend

set -euo pipefail

DEST=${1:-$(dirname "$(pwd)")/vault8-frontend}
SRC_DIR="$(pwd)/packages/frontend"
REPO_ROOT="$(pwd)"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: source frontend package not found at $SRC_DIR"
  exit 1
fi

echo "Creating destination: $DEST"
mkdir -p "$DEST"

echo "Copying frontend package..."
# Use rsync to copy, excluding node_modules, dist, .git, and pnpm-lock
# BSD rsync (macOS) doesn't support --info=progress2; use portable --progress instead.
rsync -a --progress --exclude node_modules --exclude dist --exclude .git --exclude pnpm-lock.yaml "$SRC_DIR/" "$DEST/"

# Ensure folder exists for vendor lib files
mkdir -p "$DEST/lib/client"

# Copy minimal lib files needed by frontend. Adjust paths if your frontend imports other parts of lib/.
echo "Copying minimal lib/client files (myoapp + generated types) from repo root..."
# Copy the lib client files if they exist
if [ -d "$REPO_ROOT/lib/client" ]; then
  rsync -a --progress "$REPO_ROOT/lib/client/" "$DEST/lib/client/"
else
  echo "Warning: $REPO_ROOT/lib/client not found. You may need to copy generated client files manually into $DEST/lib/client"
fi

# Fetch package.json and try to remove workspace/private monorepo fields that could break standalone
if [ -f "$DEST/package.json" ]; then
  echo "Patching package.json for standalone usage"
  # Remove "private": true as it prevents npm publish (but it's okay to keep). Remove workspace-specific fields if present.
  node -e "
  const fs=require('fs'); const p='$DEST/package.json'; let j=JSON.parse(fs.readFileSync(p));
  delete j.workspaces; delete j.pnpm; delete j['pnpm'];
  if (j.private===true) { j.private=false }
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
  console.log('package.json patched at',p);
  "
fi

cat <<EOF
Done.
Next steps (in a new terminal):
  1) cd $DEST
  2) Install deps:
       - Recommended: use pnpm (if you want the exact same layout):\n         corepack enable && corepack prepare pnpm@latest --activate && pnpm install
       - Or use npm: npm install
  3) Start the dev server:
       npm run dev   # or pnpm dev

Notes:
 - This script copies the frontend package and the files under repo_root/lib/client into the standalone project. If your frontend imports other pieces of the repo (shared utils, config, or other lib files), copy those into $DEST and adjust import paths.
 - After extraction, run the app and address any remaining path/import issues (some imports may point to monorepo-relative paths). Replace workspace-relative imports with local paths.
 - If you want, I can attempt the copy and then run the dev server for you and fix the first round of import failures.
EOF
