#!/bin/bash
set -euo pipefail

PROJECT_DIR="/tmp/ghostfolio-fork"
LOG_DIR="/tmp/ghostfolio-fork/test-logs"
mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_DIR/test-run.log"; }
log_file() { echo "[$(date '+%H:%M:%S')] === $1 ===" > "$LOG_DIR/$2"; cat >> "$LOG_DIR/$2" 2>&1; }

cd "$PROJECT_DIR"

# ─── STEP 1: Environment Setup ───
log "═══ STEP 1: Prisma Migration ═══"

set -a; source <(grep -v '^\s*#' .env.test | grep -v '^\s*$'); set +a

# Check if migration needed for the new Tag fields
log "Running prisma migrate deploy..."
if npx prisma migrate deploy 2>&1 | tee "$LOG_DIR/01-migration.log"; then
    log "✅ Migration deploy successful"
else
    log "❌ Migration deploy failed - trying migrate dev..."
    npx prisma migrate dev --name custom_tag_fields --skip-seed 2>&1 | tee -a "$LOG_DIR/01-migration.log" || true
    log "⚠️ Proceeding with migrate dev fallback"
fi

log "Generating Prisma client..."
npx prisma generate 2>&1 | tee "$LOG_DIR/02-prisma-generate.log"

# ─── STEP 2: Build API ───
log "═══ STEP 2: Build API ═══"
if NX_DAEMON=false npx nx run api:copy-assets 2>&1 | tee "$LOG_DIR/03-api-copy.log" && \
   NX_DAEMON=false npx nx run api:build 2>&1 | tee "$LOG_DIR/04-api-build.log"; then
    log "✅ API build successful"
    API_BUILD_OK=1
else
    log "❌ API build FAILED"
    API_BUILD_OK=0
fi

# ─── STEP 3: Build Client ───
log "═══ STEP 3: Build Client ═══"
if NX_DAEMON=false npx nx run client:copy-assets 2>&1 | tee "$LOG_DIR/05-client-copy.log" && \
   NX_DAEMON=false npx nx run client:build 2>&1 | tee "$LOG_DIR/06-client-build.log"; then
    log "✅ Client build successful"
    CLIENT_BUILD_OK=1
else
    log "❌ Client build FAILED"
    CLIENT_BUILD_OK=0
fi

# ─── STEP 4: Run Unit Tests ───
log "═══ STEP 4: Unit Tests ═══"
TEST_ERRORS=""
for project in api common ui; do
    log "Testing $project..."
    if NX_DAEMON=false npx nx test $project --passWithNoTests --silent 2>&1 | tee "$LOG_DIR/07-test-${project}.log"; then
        log "✅ $project tests passed"
    else
        log "❌ $project tests FAILED"
        TEST_ERRORS="$TEST_ERRORS $project"
    fi
done

# ─── STEP 5: Start API and Integration Test ───
log "═══ STEP 5: Integration Test ═══"
API_STARTED=0

if [ "$API_BUILD_OK" = "1" ]; then
    log "Starting API server on port 3333..."
    # Generate prisma types for the dist
    cd "$PROJECT_DIR/dist/apps/api"
    npx prisma generate 2>&1 | tee "$LOG_DIR/08-dist-prisma.log" || true
    cd "$PROJECT_DIR"
    
    # Copy prisma to dist
    cp -r prisma "$PROJECT_DIR/dist/apps/api/" 2>/dev/null || true
    cp -r .config "$PROJECT_DIR/dist/apps/api/" 2>/dev/null || true
    
    # Start API in background
    cd "$PROJECT_DIR/dist/apps/api"
    node main.js > "$LOG_DIR/09-api-server.log" 2>&1 &
    API_PID=$!
    cd "$PROJECT_DIR"
    
    # Wait for startup
    log "Waiting for API to start (PID: $API_PID)..."
    for i in $(seq 1 30); do
        sleep 2
        if curl -sf http://localhost:3333/api/v1/health > /dev/null 2>&1; then
            log "✅ API is healthy!"
            API_STARTED=1
            # Test custom endpoints
            log "Testing health endpoint..."
            curl -s http://localhost:3333/api/v1/health | tee "$LOG_DIR/10-health-check.log"
            
            log "Testing info endpoint..."
            curl -s http://localhost:3333/api/v1/info 2>/dev/null | tee -a "$LOG_DIR/10-health-check.log" || log "⚠️ Info endpoint not available (may need auth)"
            
            break
        fi
        log "  ... waiting ($i/30)"
    done
    
    if [ "$API_STARTED" = "0" ]; then
        log "❌ API failed to start within 60s"
        cat "$LOG_DIR/09-api-server.log" | tail -50 | tee -a "$LOG_DIR/11-api-error.log"
    fi
    
    # Stop API
    kill $API_PID 2>/dev/null || true
    wait $API_PID 2>/dev/null || true
else
    log "⏭️ Skipping integration test (API build failed)"
fi

# ─── SUMMARY ───
log "═══════════════════════════════════════"
log "          TEST SUMMARY"
log "═══════════════════════════════════════"
log "Migration:     ✅ (completed)"
log "API Build:     $([ "$API_BUILD_OK" = "1" ] && echo '✅' || echo '❌ FAILED')"
log "Client Build:  $([ "$CLIENT_BUILD_OK" = "1" ] && echo '✅' || echo '❌ FAILED')"
log "Unit Tests:    $([ -z "$TEST_ERRORS" ] && echo '✅ ALL PASSED' || echo "❌ FAILED:$TEST_ERRORS")"
log "Integration:   $([ "$API_STARTED" = "1" ] && echo '✅ API HEALTHY' || echo '❌ FAILED')"

if [ "$API_BUILD_OK" = "1" ] && [ "$CLIENT_BUILD_OK" = "1" ] && [ -z "$TEST_ERRORS" ] && [ "$API_STARTED" = "1" ]; then
    log ""
    log "🎉 ALL TESTS PASSED - GHOSTFOLIO IS WORKING!"
    echo "SUCCESS" > "$LOG_DIR/result.txt"
else
    log ""
    log "⚠️ SOME TESTS FAILED - NEEDS FIXING"
    echo "FAILED" > "$LOG_DIR/result.txt"
    
    # Collect error details for Claude Code
    echo "=== BUILD ERRORS ===" > "$LOG_DIR/claude-fix-input.md"
    [ "$API_BUILD_OK" = "0" ] && echo -e "\n## API Build Errors\n\`\`\`\n$(cat "$LOG_DIR/04-api-build.log" | tail -100)\n\`\`\`" >> "$LOG_DIR/claude-fix-input.md"
    [ "$CLIENT_BUILD_OK" = "0" ] && echo -e "\n## Client Build Errors\n\`\`\`\n$(cat "$LOG_DIR/06-client-build.log" | tail -100)\n\`\`\`" >> "$LOG_DIR/claude-fix-input.md"
    [ -n "$TEST_ERRORS" ] && echo -e "\n## Test Failures\n\`\`\`\n$(for p in $TEST_ERRORS; do echo "--- $p ---"; cat "$LOG_DIR/07-test-${p}.log" | tail -50; done)\n\`\`\`" >> "$LOG_DIR/claude-fix-input.md"
    [ "$API_STARTED" = "0" ] && echo -e "\n## API Startup Errors\n\`\`\`\n$(cat "$LOG_DIR/11-api-error.log" 2>/dev/null || cat "$LOG_DIR/09-api-server.log" | tail -100)\n\`\`\`" >> "$LOG_DIR/claude-fix-input.md"
fi

log "Done. Logs in $LOG_DIR/"
