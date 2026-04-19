#!/usr/bin/env zsh

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
template_path="$repo_root/docs/agent-update-template.md"
kickoff_path="$repo_root/docs/agent-kickoff.md"
handoff_path="$repo_root/docs/agent-engineering-handoff.md"

if [[ ! -f "$template_path" ]]; then
  echo "Missing template: $template_path" >&2
  exit 1
fi

branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
repo_name="$(basename "$repo_root")"
today="$(date +%Y-%m-%d)"

changed_files="$(git -C "$repo_root" status --short | awk '{print $2}' | head -n 10)"

echo "============================================================"
echo "Agent update scaffold ($today)"
echo "============================================================"
echo

cat <<EOF
Project: $repo_name
Repo: $repo_root
Branch: $branch

What changed in this step:
-
-
-

Files worth reading first:
EOF

if [[ -n "$changed_files" ]]; then
  while IFS= read -r file; do
    echo "- $file"
  done <<< "$changed_files"
else
  cat <<EOF
-
-
-
EOF
fi

cat <<EOF

Tests/verification run:
-
-

Stage/deploy impact:
-

Task/spec status:
- Completed:
- Still open:

Known caveats:
-

Immediate next step:
1.
2.
3.
EOF

echo
echo "Checklist"
echo "- Refresh $kickoff_path"
echo "- Refresh $handoff_path"
echo "- Update specs/001-wholesale-fashion-platform/tasks.md task IDs if scope changed"
echo "- Keep secrets out of docs"
