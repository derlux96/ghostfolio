#!/bin/bash
# Claude Code Task Runner for Ghostfolio Fork
# Usage: ./scripts/run-claude-task.sh <prompt-file> [branch-name] [commit-message]
#
# This script:
# 1. Creates/switches to the specified branch
# 2. Runs Claude Code with the prompt file
# 3. Pushes results to GitHub
# 4. Sends Telegram notification with summary

set -euo pipefail

REPO_DIR="/home/claw/projects/ghostfolio-fork"
LOG_DIR="/home/claw/projects/ghostfolio-fork/logs"
TELEGRAM_CHAT_ID="6755598417"

mkdir -p "$LOG_DIR"

# Arguments
PROMPT_FILE="${1:?Usage: $0 <prompt-file> [branch-name] [commit-message]}"
BRANCH_NAME="${2:-feature/auto-$(date +%Y%m%d-%H%M%S)}"
COMMIT_MSG="${3:-feat: auto-generated changes}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/run_${TIMESTAMP}.log"

echo "[$(date)] Starting Claude Code task" | tee "$LOG_FILE"
echo "  Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"
echo "  Branch: $BRANCH_NAME" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"

# Go to repo
cd "$REPO_DIR"

# Fetch latest from fork
git fetch myfork 2>&1 | tee -a "$LOG_FILE" || true

# Create/switch branch
git checkout main 2>&1 | tee -a "$LOG_FILE" || git checkout feature/phase1-tr-import-and-allocations 2>&1 | tee -a "$LOG_FILE"
git pull myfork main 2>&1 | tee -a "$LOG_FILE" || true

# Check if branch already exists (remote or local)
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Branch $BRANCH_NAME exists, checking out..." | tee -a "$LOG_FILE"
    git checkout "$BRANCH_NAME" 2>&1 | tee -a "$LOG_FILE"
elif git show-ref --verify --quiet "refs/remotes/myfork/$BRANCH_NAME"; then
    echo "Remote branch exists, checking out..." | tee -a "$LOG_FILE"
    git checkout -b "$BRANCH_NAME" "myfork/$BRANCH_NAME" 2>&1 | tee -a "$LOG_FILE"
else
    echo "Creating new branch $BRANCH_NAME..." | tee -a "$LOG_FILE"
    git checkout -b "$BRANCH_NAME" 2>&1 | tee -a "$LOG_FILE"
fi

# Read prompt
PROMPT=$(cat "$PROMPT_FILE")

echo "[$(date)] Starting Claude Code..." | tee -a "$LOG_FILE"

# Run Claude Code with the prompt
START_TIME=$(date +%s)

claude -p "$PROMPT" --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo "[$(date)] Claude Code finished in ${MINUTES}m ${SECONDS}s" | tee -a "$LOG_FILE"

# Check for changes
CHANGES=$(git status --porcelain 2>&1)
if [ -z "$CHANGES" ]; then
    echo "No changes detected" | tee -a "$LOG_FILE"
    # Send telegram notification
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d text="⚠️ Claude Code Task abgeschlossen — KEINE ÄNDERUNGEN

Prompt: $(basename $PROMPT_FILE)
Branch: $BRANCH_NAME
Dauer: ${MINUTES}m ${SECONDS}s

Claude hat keine Code-Änderungen gemacht. Prüfe den Prompt oder die Aufgabe." \
        -d parse_mode="Markdown" > /dev/null 2>&1 || true
    exit 0
fi

# Stage and commit
git add -A 2>&1 | tee -a "$LOG_FILE"
git commit -m "$COMMIT_MSG" 2>&1 | tee -a "$LOG_FILE" || true

# Push to fork
git push myfork "$BRANCH_NAME" --force 2>&1 | tee -a "$LOG_FILE"

# Count changes
FILES_CHANGED=$(git diff HEAD~1 --stat 2>/dev/null | tail -1 | grep -oP '\d+(?= file)' || echo "unknown")
LINES_ADDED=$(git diff HEAD~1 --stat 2>/dev/null | tail -1 | grep -oP '\d+(?= insert)' || echo "?")
LINES_DELETED=$(git diff HEAD~1 --stat 2>/dev/null | tail -1 | grep -oP '\d+(?= delet)' || echo "?")

# Build summary from log (last 20 lines of claude output)
SUMMARY=$(tail -30 "$LOG_FILE" | head -25)

# Send telegram notification
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="✅ Claude Code Task abgeschlossen

📦 Prompt: $(basename $PROMPT_FILE)
🌿 Branch: $BRANCH_NAME
⏱ Dauer: ${MINUTES}m ${SECONDS}s
📊 Files: $FILES_CHANGED | +$LINES_ADDED | -$LINES_DELETED

Log: $LOG_FILE

Repo: github.com/derlux96/ghostfolio" \
    -d parse_mode="Markdown" > /dev/null 2>&1 || true

echo "[$(date)] Task complete. Notification sent." | tee -a "$LOG_FILE"
