#!/usr/bin/env bash
# sync.sh - Push local changes in the Antigravity + Lovable workspace to the remote GitHub repository.
# Usage: ./sync.sh "Commit message"

set -e

# Ensure we are in the repository directory
dirname="$(dirname "$0")"
cd "$dirname"

# Optional: accept a commit message argument, default to generic message with timestamp
msg="$1"
if [ -z "$msg" ]; then
  msg="Auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Add all changes
git add -A

# Check if there is anything to commit
if git diff-index --quiet HEAD; then
  echo "No changes to commit."
else
  git commit -m "$msg"
  git push origin HEAD
  echo "Changes pushed to remote repository."
fi
