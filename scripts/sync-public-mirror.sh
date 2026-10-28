#!/usr/bin/env bash
set -euo pipefail

# Publishes a snapshot of this repo to the public mirror as a single commit,
# without exposing the private commit history.
# Usage: scripts/sync-public-mirror.sh [ref]   (default: HEAD)
# Files can be excluded from the mirror with `export-ignore` in .gitattributes.

MIRROR_URL="${MIRROR_URL:-git@github.com:nemi-fi/nemi-dex-v1.git}"
MIRROR_BRANCH="${MIRROR_BRANCH:-main}"
SOURCE_REF="${1:-HEAD}"
LICENSE_URL="https://www.apache.org/licenses/LICENSE-2.0.txt"

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

SOURCE_SHA="$(git -C "$REPO_ROOT" rev-parse --verify "$SOURCE_REF^{commit}")"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

git -C "$WORK_DIR" init --quiet --initial-branch "$MIRROR_BRANCH"
git -C "$WORK_DIR" remote add mirror "$MIRROR_URL"

# only the latest mirror commit is needed to compute the diff
if git -C "$WORK_DIR" fetch --quiet --depth 1 mirror "$MIRROR_BRANCH" 2>/dev/null; then
  git -C "$WORK_DIR" reset --quiet --hard FETCH_HEAD
  echo "Mirror is at $(git -C "$WORK_DIR" rev-parse --short HEAD)"
else
  echo "Mirror branch '$MIRROR_BRANCH' does not exist yet, creating it"
fi

# replace mirror contents with a snapshot of the source ref (tracked files only)
git -C "$WORK_DIR" rm -r --quiet --ignore-unmatch .
git -C "$REPO_ROOT" archive "$SOURCE_SHA" | tar -x -C "$WORK_DIR"
# the license only applies to the public mirror, so it is not kept in this repo
curl -fsSL "$LICENSE_URL" -o "$WORK_DIR/LICENSE"
git -C "$WORK_DIR" add -A

if git -C "$WORK_DIR" diff --cached --quiet; then
  echo "Mirror is already up to date"
  exit 0
fi

echo
echo "Changes to be pushed to $MIRROR_URL ($MIRROR_BRANCH):"
git -C "$WORK_DIR" -c core.quotePath=false diff --cached --name-status
echo
git -C "$WORK_DIR" diff --cached --shortstat
echo

read -r -p "Push these changes to the mirror? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 1
fi

read -r -p "Commit message [Sync]: " COMMIT_MSG
git -C "$WORK_DIR" commit --quiet -m "${COMMIT_MSG:-Sync}"
git -C "$WORK_DIR" push --quiet mirror "HEAD:$MIRROR_BRANCH"

echo "Mirror synced: $(git -C "$WORK_DIR" rev-parse --short HEAD)"
