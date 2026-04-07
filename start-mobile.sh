#!/usr/bin/env bash
# ============================================================
#  TutorQatar — Mobile (Expo) startup script
#  Runs on: Windows (Git Bash / WSL), macOS, Linux
#
#  What this script does:
#    1. Checks Node.js >= 20
#    2. Installs pnpm if missing
#    3. Installs all workspace dependencies
#    4. Creates apps/mobile/.env.local from .env.example if missing
#    5. Validates required env vars
#    6. Checks Expo CLI (installs if missing)
#    7. Warns if the web app isn't running (mobile needs it for
#       payment & review pages opened in the in-app browser)
#    8. Starts Expo bundler — scan QR with Expo Go or press
#       a/i/w for Android emulator / iOS simulator / web
# ============================================================
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m';  GREEN='\033[0;32m';  YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m';   BOLD='\033[1m';  NC='\033[0m'

# ── Helpers ─────────────────────────────────────────────────
step()   { echo -e "\n${BOLD}${BLUE}▶ $*${NC}"; }
ok()     { echo -e "  ${GREEN}✔  $*${NC}"; }
warn()   { echo -e "  ${YELLOW}⚠  $*${NC}"; }
error()  { echo -e "  ${RED}✖  $*${NC}"; }
info()   { echo -e "  ${CYAN}ℹ  $*${NC}"; }

# ── Project paths ───────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$ROOT/apps/mobile"

# ============================================================
echo ""
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   TutorQatar  —  Mobile (Expo) Dev     ║${NC}"
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
  export PATH="$PATH:$(npm root -g)/../bin"
fi

PNPM_VER=$(pnpm --version 2>/dev/null || echo "0")
PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
if [ "$PNPM_MAJOR" -lt 9 ]; then
  warn "pnpm v${PNPM_VER} — upgrading to v9..."
  npm install -g pnpm@9
fi
ok "pnpm v$(pnpm --version)"

# ── 3. Expo CLI ──────────────────────────────────────────────
step "Checking Expo CLI"
if ! command -v expo &>/dev/null; then
  warn "Expo CLI not found — installing globally..."
  npm install -g expo-cli
  export PATH="$PATH:$(npm root -g)/../bin"
fi

if command -v expo &>/dev/null; then
  ok "Expo CLI: $(expo --version 2>/dev/null | head -1)"
else
  warn "Expo CLI install may need a terminal restart to appear in PATH"
  info "We will use 'npx expo' as a fallback"
fi

# ── 4. Install workspace dependencies ────────────────────────
step "Installing dependencies"
if [ ! -d "$ROOT/node_modules" ] || [ ! -d "$MOBILE_DIR/node_modules" ]; then
  info "Running pnpm install (this may take a minute on first run)..."
  cd "$ROOT"
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  ok "Dependencies installed"
else
  if [ "$ROOT/pnpm-lock.yaml" -nt "$ROOT/node_modules/.modules.yaml" ] 2>/dev/null; then
    info "Lock file changed — refreshing dependencies..."
    cd "$ROOT"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    ok "Dependencies updated"
  else
    ok "Dependencies already up to date"
  fi
fi

# ── 5. .env.local setup ──────────────────────────────────────
step "Checking environment file"

ENV_FILE="$MOBILE_DIR/.env.local"
EXAMPLE_FILE="$MOBILE_DIR/.env.example"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$EXAMPLE_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    warn "Created apps/mobile/.env.local from .env.example"
    warn "Fill in the values below before continuing:"
    echo ""
    echo -e "  ${BOLD}$ENV_FILE${NC}"
    echo ""
    grep -v '^\s*#' "$EXAMPLE_FILE" | grep '=' | while IFS='=' read -r k _; do
      info "  - $k"
    done
    echo ""
    read -r -p "  Press Enter once you've filled in the values, or Ctrl+C to quit..."
  else
    warn "No .env.local or .env.example found in apps/mobile"
  fi
else
  ok ".env.local exists"
fi

# ── 6. Validate required env vars ────────────────────────────
step "Validating env vars"

REQUIRED=(EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY EXPO_PUBLIC_APP_URL)
MISSING=()

for key in "${REQUIRED[@]}"; do
  val=$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d ' ')
  if [ -z "$val" ] || [[ "$val" == *"your-"* ]] || [[ "$val" == *"your-project-ref"* ]]; then
    MISSING+=("$key")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "These env vars still have placeholder values:"
  for k in "${MISSING[@]}"; do
    info "  - $k"
  done
  info "Edit $ENV_FILE and re-run this script."
  echo ""
  read -r -p "  Continue anyway? [y/N] " cont
  [[ "$cont" =~ ^[Yy]$ ]] || exit 1
else
  ok "All required env vars are set"
fi

# ── 7. Web app check (mobile depends on web for payment/review)
step "Checking web app"

APP_URL=$(grep "^EXPO_PUBLIC_APP_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d ' ')
APP_URL="${APP_URL:-http://localhost:3000}"

WEB_RUNNING=false
if curl --silent --max-time 3 "${APP_URL}/api/health" &>/dev/null; then
  WEB_RUNNING=true
fi

if $WEB_RUNNING; then
  ok "Web app is running at $APP_URL"
else
  warn "Web app is NOT running at $APP_URL"
  echo ""
  echo -e "  ${YELLOW}The mobile app opens the web app for:${NC}"
  info "  • Payment (Stripe checkout)"
  info "  • Leaving a review"
  echo ""
  echo -e "  ${YELLOW}Without the web app running, those features will show an error.${NC}"
  echo ""
  echo -e "  To start it, open a ${BOLD}new terminal${NC} and run:"
  echo -e "  ${CYAN}  ./start-web.sh${NC}"
  echo ""
  read -r -p "  Continue without web app? [y/N] " cont_without_web
  [[ "$cont_without_web" =~ ^[Yy]$ ]] || exit 1
fi

# ── 8. Platform hints ────────────────────────────────────────
step "Platform setup hints"

echo ""
echo -e "${BOLD}  Android${NC}"
info  "  Physical device: Install 'Expo Go' from Play Store, scan QR code"
info  "  Emulator: Android Studio → AVD Manager → start emulator → press 'a'"
echo ""
echo -e "${BOLD}  iOS${NC}"
info  "  Physical device: Install 'Expo Go' from App Store (iOS 16+), scan QR code"
info  "  Simulator: Xcode required (macOS only) → press 'i'"
echo ""
echo -e "${BOLD}  Web preview${NC}"
info  "  Press 'w' in the Expo terminal to open in browser"
echo ""

# ── 9. Start Expo ────────────────────────────────────────────
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  Starting Expo bundler${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$MOBILE_DIR"

# Use expo command if available, fall back to npx expo
if command -v expo &>/dev/null; then
  exec expo start
else
  exec npx expo start
fi
