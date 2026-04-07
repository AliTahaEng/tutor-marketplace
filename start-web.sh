#!/usr/bin/env bash
# ============================================================
#  TutorQatar — Web + Admin startup script
#  Runs on: Windows (Git Bash / WSL), macOS, Linux
#
#  What this script does:
#    1. Checks Node.js >= 20
#    2. Installs pnpm if missing
#    3. Installs all workspace dependencies
#    4. Creates .env.local files from .env.example if missing
#    5. Validates required env vars are filled in
#    6. (Optional) Pushes DB migrations via Supabase CLI
#    7. (Optional) Starts Stripe webhook listener
#    8. Starts Web app  → http://localhost:3000
#    9. Starts Admin app → http://localhost:3001
# ============================================================
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m';  GREEN='\033[0;32m';  YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m';   BOLD='\033[1m';  NC='\033[0m'

# ── Helpers ─────────────────────────────────────────────────
step()    { echo -e "\n${BOLD}${BLUE}▶ $*${NC}"; }
ok()      { echo -e "  ${GREEN}✔  $*${NC}"; }
warn()    { echo -e "  ${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "  ${RED}✖  $*${NC}"; }
info()    { echo -e "  ${CYAN}ℹ  $*${NC}"; }

# ── Resolve project root (directory this script lives in) ───
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT/apps/web"
ADMIN_DIR="$ROOT/apps/admin"

# ── Cleanup: kill background jobs on exit / Ctrl+C ──────────
PIDS=()
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}Done.${NC}"
}
trap cleanup INT TERM EXIT

# ============================================================
echo ""
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   TutorQatar  —  Web + Admin Dev       ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Node.js ───────────────────────────────────────────────
step "Checking Node.js"
if ! command -v node &>/dev/null; then
  error "Node.js is not installed."
  info  "Download from https://nodejs.org (v20 LTS or higher)"
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.version)" | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node.js v${NODE_VER} found — v20 or higher is required."
  info  "Download from https://nodejs.org (v20 LTS)"
  exit 1
fi
ok "Node.js v${NODE_VER}"

# ── 2. pnpm ──────────────────────────────────────────────────
step "Checking pnpm"
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found — installing globally via npm..."
  npm install -g pnpm@9
  # Refresh PATH for current session (Git Bash / WSL)
  export PATH="$PATH:$(npm root -g)/../bin"
fi

PNPM_VER=$(pnpm --version 2>/dev/null || echo "0")
PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
if [ "$PNPM_MAJOR" -lt 9 ]; then
  warn "pnpm v${PNPM_VER} found — upgrading to v9..."
  npm install -g pnpm@9
fi
ok "pnpm v$(pnpm --version)"

# ── 3. Install workspace dependencies ────────────────────────
step "Installing dependencies"
if [ ! -d "$ROOT/node_modules" ] || [ ! -d "$WEB_DIR/node_modules" ]; then
  info "Running pnpm install (this may take a minute on first run)..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  ok "Dependencies installed"
else
  # Quick check — reinstall if lockfile is newer than node_modules
  if [ "$ROOT/pnpm-lock.yaml" -nt "$ROOT/node_modules/.modules.yaml" ] 2>/dev/null; then
    info "Lock file changed — refreshing dependencies..."
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    ok "Dependencies updated"
  else
    ok "Dependencies already up to date"
  fi
fi

# ── 4. .env.local setup ──────────────────────────────────────
step "Checking environment files"

setup_env() {
  local dir="$1"
  local app_name="$2"
  local env_file="$dir/.env.local"
  local example_file="$dir/.env.example"

  if [ ! -f "$env_file" ]; then
    if [ -f "$example_file" ]; then
      cp "$example_file" "$env_file"
      warn "$app_name: Created .env.local from .env.example"
      warn "      → Open $env_file and fill in your credentials before continuing."
    else
      warn "$app_name: No .env.local or .env.example found at $dir"
    fi
  else
    ok "$app_name: .env.local exists"
  fi
}

setup_env "$WEB_DIR"   "Web"
setup_env "$ADMIN_DIR" "Admin"

# ── 5. Validate required env vars ────────────────────────────
step "Validating env vars"

validate_env() {
  local env_file="$1"
  local app_name="$2"
  local missing=()

  if [ ! -f "$env_file" ]; then
    warn "$app_name: .env.local missing — skipping validation"
    return
  fi

  # Source the file (skip comment lines)
  while IFS='=' read -r key val; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    declare -g "ENV_${key}=${val}"
  done < <(grep -v '^\s*#' "$env_file" | grep '=')

  # Check required keys are not empty
  local required_keys=("$@")
  shift; shift
  for k in "${required_keys[@]}"; do
    local env_var="ENV_${k}"
    local val="${!env_var:-}"
    if [ -z "$val" ] || [[ "$val" == *"your-"* ]] || [[ "$val" == *"..."* ]]; then
      missing+=("$k")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    warn "$app_name: The following env vars look empty or still have placeholder values:"
    for k in "${missing[@]}"; do
      info "      - $k"
    done
    info "      Fill them in at: $env_file"
  else
    ok "$app_name: All required env vars look set"
  fi
}

WEB_REQUIRED=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_SECRET_KEY)
ADMIN_REQUIRED=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY)

# Simple placeholder-check (no full sourcing to avoid side effects)
check_placeholders() {
  local env_file="$1"
  local app_name="$2"
  shift 2
  local required_keys=("$@")
  local missing=()

  [ ! -f "$env_file" ] && return

  for key in "${required_keys[@]}"; do
    local val
    val=$(grep "^${key}=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d ' ')
    if [ -z "$val" ] || [[ "$val" == *"your-"* ]] || [[ "$val" == "pk_test_..." ]] || [[ "$val" == "sk_test_..." ]]; then
      missing+=("$key")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    warn "$app_name: These vars still have placeholder values in .env.local:"
    for k in "${missing[@]}"; do
      info "      - $k"
    done
  else
    ok "$app_name: All required env vars are set"
  fi
}

check_placeholders "$WEB_DIR/.env.local"   "Web"   "${WEB_REQUIRED[@]}"
check_placeholders "$ADMIN_DIR/.env.local" "Admin" "${ADMIN_REQUIRED[@]}"

# ── 6. Supabase CLI — push migrations (optional) ─────────────
step "Database migrations"
if command -v supabase &>/dev/null; then
  ok "Supabase CLI found: $(supabase --version 2>/dev/null | head -1)"
  read -r -p "  Push pending migrations to your Supabase project? [y/N] " push_migrations
  if [[ "$push_migrations" =~ ^[Yy]$ ]]; then
    info "Pushing migrations..."
    cd "$ROOT"
    supabase db push && ok "Migrations applied" || warn "Migration push failed — check output above"
  else
    info "Skipping migrations (you can run: supabase db push)"
  fi
else
  info "Supabase CLI not found — skipping migration push"
  info "Install: https://supabase.com/docs/guides/cli  or  npm install -g supabase"
fi

# ── 7. Stripe webhook listener (optional) ────────────────────
step "Stripe webhook listener"
if command -v stripe &>/dev/null; then
  ok "Stripe CLI found"
  read -r -p "  Start Stripe webhook listener (forwards to localhost:3000)? [y/N] " start_stripe
  if [[ "$start_stripe" =~ ^[Yy]$ ]]; then
    info "Starting Stripe listener in background..."
    stripe listen \
      --forward-to "http://localhost:3000/api/payments/webhook" \
      --forward-connect-to "http://localhost:3000/api/stripe/connect" \
      &
    PIDS+=($!)
    ok "Stripe listener started (PID $!)"
    info "Copy the webhook signing secret shown above into STRIPE_WEBHOOK_SECRET in .env.local"
  else
    info "Skipping — payments will still work but webhook events won't be received locally"
  fi
else
  warn "Stripe CLI not found — webhook events will not be forwarded locally"
  info "Install: https://stripe.com/docs/stripe-cli"
  info "Without it, payments work but post-payment webhooks (e.g. status updates) won't fire locally"
fi

# ── 8 & 9. Start Web + Admin ─────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  Starting apps${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
info "Web app  → http://localhost:3000"
info "Admin    → http://localhost:3001"
echo ""

# Run Web in background
pnpm --filter @tutor/web dev &
WEB_PID=$!
PIDS+=($WEB_PID)

# Small delay so web output doesn't collide with admin startup messages
sleep 1

# Run Admin in background
pnpm --filter @tutor/admin dev &
ADMIN_PID=$!
PIDS+=($ADMIN_PID)

echo ""
echo -e "${CYAN}Both apps are starting. Press ${BOLD}Ctrl+C${NC}${CYAN} to stop all services.${NC}"
echo ""

# Wait for all background jobs (exits when they all exit or on Ctrl+C)
wait
