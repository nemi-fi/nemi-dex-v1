#!/usr/bin/env bash
set -euo pipefail

# Publishes a snapshot of main to the public mirror as a single commit,
# without exposing the private commit history. After a successful sync, an
# empty checkpoint commit is squash-merged into main here (through a PR, via
# the gh CLI) to mark what was published.
# Usage: scripts/sync-public-mirror.sh
# Files can be excluded from the mirror with `export-ignore` in .gitattributes.

MIRROR_URL="${MIRROR_URL:-git@github.com:nemi-fi/nemi-dex-v1.git}"
MIRROR_BRANCH="${MIRROR_BRANCH:-main}"
SOURCE_BRANCH="main"
CHECKPOINT_MSG="chore: sync to public mirror"
LICENSE_URL="https://www.apache.org/licenses/LICENSE-2.0.txt"

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

# the checkpoint commit goes on top of what is synced, so sync the latest main only
if [ "$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)" != "$SOURCE_BRANCH" ]; then
  echo "Switch to $SOURCE_BRANCH first."
  exit 1
fi
git -C "$REPO_ROOT" fetch --quiet origin "$SOURCE_BRANCH"
if [ "$(git -C "$REPO_ROOT" rev-parse HEAD)" != "$(git -C "$REPO_ROOT" rev-parse FETCH_HEAD)" ]; then
  echo "Local $SOURCE_BRANCH is not in sync with origin/$SOURCE_BRANCH. Pull or push first."
  exit 1
fi

SOURCE_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"

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

# replace mirror contents with a snapshot of the source (tracked files only)
git -C "$WORK_DIR" rm -r --quiet --ignore-unmatch .
git -C "$REPO_ROOT" archive "$SOURCE_SHA" | tar -x -C "$WORK_DIR"
# the license only applies to the public mirror, so it is not kept in this repo
curl -fsSL "$LICENSE_URL" -o "$WORK_DIR/LICENSE"
git -C "$WORK_DIR" add -A

if git -C "$WORK_DIR" diff --cached --quiet; then
  echo "Mirror is already up to date"
  exit 0
fi

LAST_CHECKPOINT="$(git -C "$REPO_ROOT" log -1 --format=%H --fixed-strings --grep "$CHECKPOINT_MSG" "$SOURCE_SHA")"
echo
if [ -n "$LAST_CHECKPOINT" ]; then
  echo "Commits since the last sync ($(git -C "$REPO_ROOT" rev-parse --short "$LAST_CHECKPOINT")):"
  git -C "$REPO_ROOT" log --oneline "$LAST_CHECKPOINT..$SOURCE_SHA"
else
  echo "No previous sync checkpoint found"
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
MIRROR_SHA="$(git -C "$WORK_DIR" rev-parse --short HEAD)"
echo "Mirror synced: $MIRROR_SHA"

# mark the sync in this repo with an empty commit, merged through a PR
CHECKPOINT_BRANCH="sync/$MIRROR_SHA"
CHECKPOINT_BODY="Synced $(git -C "$REPO_ROOT" rev-parse --short "$SOURCE_SHA") to $MIRROR_URL ($MIRROR_BRANCH) as $MIRROR_SHA."
git -C "$REPO_ROOT" switch --quiet -c "$CHECKPOINT_BRANCH"
git -C "$REPO_ROOT" commit --quiet --allow-empty -m "$CHECKPOINT_MSG" -m "$CHECKPOINT_BODY"
if ! (
  cd "$REPO_ROOT" &&
    git push --quiet -u origin "$CHECKPOINT_BRANCH" &&
    gh pr create --base "$SOURCE_BRANCH" --head "$CHECKPOINT_BRANCH" --title "$CHECKPOINT_MSG" --body "$CHECKPOINT_BODY" &&
    gh pr merge "$CHECKPOINT_BRANCH" --squash --delete-branch --subject "$CHECKPOINT_MSG" --body "$CHECKPOINT_BODY"
); then
  echo "The mirror is synced, but merging the checkpoint failed. Finish it manually from branch $CHECKPOINT_BRANCH."
  exit 1
fi
git -C "$REPO_ROOT" switch --quiet "$SOURCE_BRANCH"
git -C "$REPO_ROOT" pull --quiet --ff-only origin "$SOURCE_BRANCH"
echo "Checkpoint merged: $(git -C "$REPO_ROOT" rev-parse --short HEAD)"
