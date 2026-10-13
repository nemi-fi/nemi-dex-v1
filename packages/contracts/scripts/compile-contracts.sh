#!/usr/bin/env bash
set -euo pipefail

pnpm gaztec compile $@

for file in $(find ./target -name "*.json"); do
  # remove `file_map` from the json file
  jq '.file_map = {}' $file >$file.tmp && mv $file.tmp $file
done

ARTIFACTS_DIR=./src/artifacts
rm -rf $ARTIFACTS_DIR
mkdir -p $ARTIFACTS_DIR
pnpm gaztec codegen ./target -o $ARTIFACTS_DIR --force
rm -rf codegenCache.json

# In CI, fail if the committed artifacts-info.json is stale instead of silently regenerating it
if [ -n "${CI:-}" ]; then
  node "$(dirname -- "${BASH_SOURCE[0]}")/track-artifacts.js" --action check
else
  node "$(dirname -- "${BASH_SOURCE[0]}")/track-artifacts.js" --action generate
fi
