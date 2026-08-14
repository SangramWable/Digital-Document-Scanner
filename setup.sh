#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# DocSync India — One-Command Setup Script
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "🛡️  DocSync India — AI-Powered Government Document Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Check for package manager
echo -e "${CYAN}[1/5]${NC} Checking package manager..."
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo -e "  ${GREEN}✓${NC} Using Bun runtime"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "  ${GREEN}✓${NC} Using npm"
else
    echo -e "  ${YELLOW}!${NC} No package manager found. Please install Node.js or Bun."
    exit 1
fi

# Step 2: Install dependencies
echo -e "${CYAN}[2/5]${NC} Installing dependencies..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Step 3: Set up environment file
echo -e "${CYAN}[3/5]${NC} Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
else
    echo -e "  ${GREEN}✓${NC} .env already exists"
fi

# Step 4: Initialize database
echo -e "${CYAN}[4/5]${NC} Initializing database..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun run db:push 2>/dev/null || npx prisma db push
else
    npx prisma db push
fi
echo -e "  ${GREEN}✓${NC} Database initialized"

# Step 5: Start development server
echo -e "${CYAN}[5/5]${NC} Starting development server..."
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🛡️  DocSync India is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  📍 Open: ${CYAN}http://localhost:3000${NC}"
echo ""
echo -e "  💡 ${YELLOW}Demo Mode:${NC} OTP will be shown on screen (no SMS API needed)"
echo -e "  📱 ${YELLOW}Real OTP:${NC} Add MessageCentral credentials to .env"
echo -e "     Sign up at: ${CYAN}https://www.messagecentral.com${NC} (1000 free OTP!)"
echo ""

if [ "$PKG_MANAGER" = "bun" ]; then
    bun run dev
else
    npm run dev
fi
