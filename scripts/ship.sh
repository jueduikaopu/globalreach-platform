#!/bin/sh
set -eu

message=${1:-}
if [ -z "$message" ]; then
  echo 'Usage: npm run ship -- "feat: describe the completed page"' >&2
  exit 2
fi

if [ -z "$(git status --porcelain --untracked-files=normal)" ]; then
  echo 'Working tree is clean; nothing to ship.'
  exit 0
fi

npm test
npm run check
git add --all
git diff --cached --check
if git diff --cached --quiet; then
  echo 'No staged changes to commit.'
  exit 0
fi

git commit -m "$message"
git push origin HEAD:main
git rev-parse HEAD
