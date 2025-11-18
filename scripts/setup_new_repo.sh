#!/usr/bin/env bash
# 新 REPO 初始化腳本
# 用途: 建立新的部署 REPO 並初始化基本結構

set -euo pipefail

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING${NC} $*"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR${NC} $*" >&2; }

# 參數
REPO_NAME="${1:-coach-rocks-production}"
REPO_DIR="${2:-../$REPO_NAME}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 檢查前置條件
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found in PATH"
    exit 1
  fi
}

require_cmd git
require_cmd node

# 建立目錄
log "Creating new repository directory: $REPO_DIR"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

# Git 初始化
log "Initializing Git repository..."
git init
git branch -M main

# 建立基本目錄結構
log "Creating directory structure..."
mkdir -p {backend,frontend,scripts,documents,migrations,.github/workflows}

# 複製必要檔案
log "Copying project files..."

# 複製 backend（最小化：只複製源碼和配置）
log "Copying backend directory (minimal files only)..."
rsync -av \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.dev.vars' \
  --exclude='*.log' \
  --exclude='test-*' \
  --exclude='debug-*' \
  --exclude='generate-*' \
  --exclude='insert-*' \
  --exclude='fix-*' \
  --exclude='check-*.sql' \
  --exclude='delete-*.sql' \
  --exclude='execute-*.sql' \
  --exclude='generate-*.sql' \
  --exclude='*.bak' \
  --exclude='*.backup' \
  --exclude='ClientDetails.jsx' \
  --include='migrations/' \
  --include='migrations/*.sql' \
  --include='src/' \
  --include='src/**' \
  --include='package.json' \
  --include='tsconfig.json' \
  --include='wrangler.jsonc' \
  --include='worker-configuration.d.ts' \
  --include='README.md' \
  --exclude='*' \
  "$SOURCE_DIR/backend/" "$REPO_DIR/backend/"

# 複製 frontend（最小化：只複製源碼和配置）
log "Copying frontend directory (minimal files only)..."
rsync -av \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='frontend/tmp' \
  --exclude='*.bak' \
  --exclude='*.backup' \
  --exclude='debug-*.html' \
  --exclude='markdown.md' \
  --exclude='test-oauth-manual.js' \
  --exclude='README_*.md' \
  --include='src/' \
  --include='src/**' \
  --include='public/' \
  --include='public/**' \
  --include='tests/' \
  --include='tests/**' \
  --include='package.json' \
  --include='vite.config.js' \
  --include='eslint.config.js' \
  --include='playwright.config.js' \
  --include='index.html' \
  --include='README.md' \
  --exclude='*' \
  "$SOURCE_DIR/frontend/" "$REPO_DIR/frontend/"

# 複製 scripts
log "Copying scripts..."
cp -r "$SOURCE_DIR/scripts/"* "$REPO_DIR/scripts/" 2>/dev/null || true

# 複製 documents（僅部署相關）
log "Copying deployment documents (minimal files only)..."
DEPLOYMENT_DOCS=(
  "cloudflare_deployment_plan.md"
  "cloudflare_pages_frontend_deploy_plan.md"
  "cloudflare_deployment_complete_plan.md"
  "manual_steps_checklist.md"
  "deployment_file_list.md"
  "deployment_planning_summary.md"
)

for doc in "${DEPLOYMENT_DOCS[@]}"; do
  if [[ -f "$SOURCE_DIR/documents/$doc" ]]; then
    cp "$SOURCE_DIR/documents/$doc" "$REPO_DIR/documents/" 2>/dev/null || true
  fi
done

# 複製 migrations
log "Copying migrations..."
cp -r "$SOURCE_DIR/backend/migrations/"* "$REPO_DIR/migrations/" 2>/dev/null || true

# 建立 .gitignore
log "Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp/
.pnp.js
package-lock.json
pnpm-lock.yaml
yarn.lock

# Environment
.env
.env.local
.env.production
.env.*.local
.dev.vars
*.local

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
test-results/
playwright-report/
coverage/

# Temporary files
tmp/
temp/
*.tmp
EOF

# 建立 README.md
log "Creating README.md..."
cat > README.md << EOF
# CoachRocks Production Deployment

This repository contains the production deployment configuration for CoachRocks AI.

## Quick Start

1. **Setup Cloudflare Account**
   \`\`\`bash
   wrangler login
   wrangler whoami  # Record Account ID
   \`\`\`

2. **Setup Secrets**
   \`\`\`bash
   ./scripts/setup_secrets.sh
   \`\`\`

3. **Deploy**
   \`\`\`bash
   ./scripts/deploy_all.sh
   \`\`\`

## Documentation

- [Complete Deployment Plan](./documents/cloudflare_deployment_complete_plan.md)
- [Backend Deployment Plan](./documents/cloudflare_deployment_plan.md)
- [Frontend Deployment Plan](./documents/cloudflare_pages_frontend_deploy_plan.md)

## Manual Steps Required

See [Complete Deployment Plan](./documents/cloudflare_deployment_complete_plan.md#手動操作清單) for manual steps.
EOF

# 建立 GitHub Actions workflow
log "Creating GitHub Actions workflow..."
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g wrangler
      - run: cd backend && npm install
      - run: cd backend && npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
      - run: npm install -g wrangler
      - run: wrangler pages deploy frontend/dist --project-name=coach-rocks-frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
EOF

# 設定 Git 使用者資訊
log "Configuring Git..."
git config user.name "CoachRocks Deployment" || true
git config user.email "gamepig1976@gmail.com" || true

# 初始 commit
log "Creating initial commit..."
git add .
git commit -m "Initial commit: Production deployment setup" || warn "No changes to commit"

log "Repository setup completed!"
log "Next steps:"
log "1. cd $REPO_DIR"
log "2. wrangler login"
log "3. ./scripts/setup_secrets.sh"
log "4. ./scripts/deploy_all.sh"

