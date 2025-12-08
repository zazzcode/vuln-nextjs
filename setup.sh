#!/bin/bash

# React2Shell Vulnerability Test Site - Setup Script
# Automated setup for the test environment

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear

echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}   React2Shell Test Site - Setup & Installation      ${NC}"
echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${RED}⚠️  WARNING: This installs a deliberately vulnerable application!${NC}"
echo -e "${RED}⚠️  Only use in isolated testing environments!${NC}\n"

read -p "Do you understand and wish to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Setup cancelled.${NC}"
    exit 1
fi

# Check Node.js installation
echo -e "${BLUE}[1/6] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js 14+ from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}\n"

# Check npm installation
echo -e "${BLUE}[2/6] Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}\n"

# Install dependencies
echo -e "${BLUE}[3/6] Installing dependencies...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}\n"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Make test scripts executable
echo -e "${BLUE}[4/6] Setting up test scripts...${NC}"
chmod +x scripts/*.sh
echo -e "${GREEN}✓ Test scripts configured${NC}\n"

# Create necessary directories
echo -e "${BLUE}[5/6] Creating directories...${NC}"
mkdir -p test-results
mkdir -p .next
echo -e "${GREEN}✓ Directories created${NC}\n"

# Verify installation
echo -e "${BLUE}[6/6] Verifying installation...${NC}"

REQUIRED_FILES=(
    "package.json"
    "next.config.js"
    "pages/index.js"
    "pages/_app.js"
    "pages/vulnerable/eval-injection.js"
    "pages/secure/sanitized-input.js"
    "scripts/test-all.sh"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (missing)"
        ALL_PRESENT=false
    fi
done

echo ""

if [ "$ALL_PRESENT" = true ]; then
    echo -e "${GREEN}✓ All required files present${NC}\n"
else
    echo -e "${RED}✗ Some files are missing${NC}\n"
    exit 1
fi

# Display next steps
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}               Setup Complete!                        ${NC}"
echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${GREEN}Installation successful!${NC}\n"

echo -e "${BLUE}Next steps:${NC}\n"

echo -e "1. Start the development server:"
echo -e "   ${YELLOW}npm run dev${NC}\n"

echo -e "2. Access the application:"
echo -e "   ${YELLOW}http://localhost:3000${NC}\n"

echo -e "3. Run vulnerability tests:"
echo -e "   ${YELLOW}cd scripts${NC}"
echo -e "   ${YELLOW}./test-all.sh${NC}\n"

echo -e "4. Or run individual tests:"
echo -e "   ${YELLOW}./scripts/test-eval-injection.sh${NC}"
echo -e "   ${YELLOW}./scripts/test-form-rce.sh${NC}"
echo -e "   ${YELLOW}./scripts/test-api-exploit.sh${NC}\n"

echo -e "${BLUE}Documentation:${NC}"
echo -e "   • README.md - Complete documentation"
echo -e "   • SECURITY.md - Security policy and warnings\n"

echo -e "${RED}⚠️  IMPORTANT REMINDERS:${NC}"
echo -e "   • This application is VULNERABLE by design"
echo -e "   • NEVER deploy to production"
echo -e "   • NEVER expose to the internet"
echo -e "   • Only use in isolated environments"
echo -e "   • Only test systems you own or have permission to test\n"

echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${YELLOW}Ready to start? Run: ${GREEN}npm run dev${NC}\n"
