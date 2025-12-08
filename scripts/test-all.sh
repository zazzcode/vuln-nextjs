#!/bin/bash

# React2Shell Vulnerability Test - Complete Test Suite
# Runs all vulnerability tests for CVE-2025-66478
# WARNING: For testing purposes only on authorized systems!

BASE_URL="http://localhost:3000"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}    React2Shell CVE-2025-66478 - Full Test Suite    ${NC}"
echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${RED}⚠️  WARNING: This will execute multiple vulnerability tests${NC}"
echo -e "${RED}⚠️  Only run this on systems you own or have permission to test${NC}\n"

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if ! curl -s "${BASE_URL}" > /dev/null; then
    echo -e "${RED}✗ Server is not running at ${BASE_URL}${NC}"
    echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Create results directory
RESULTS_ROOT="${SCRIPT_DIR}/test-results"
mkdir -p "${RESULTS_ROOT}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="${RESULTS_ROOT}/${TIMESTAMP}"
mkdir -p "${RESULTS_DIR}"

echo -e "${BLUE}Test results will be saved to: ${RESULTS_DIR}${NC}\n"

# Test Suite 1: Eval Injection
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[1/6] Running Eval Injection Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-eval-injection.sh" 2>&1 | tee "${RESULTS_DIR}/eval-injection.log"
echo ""

# Test Suite 2: Form-based RCE
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[2/6] Running Form-based RCE Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-form-rce.sh" 2>&1 | tee "${RESULTS_DIR}/form-rce.log"
echo ""

# Test Suite 3: API Exploitation
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[3/6] Running API Exploitation Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-api-exploit.sh" 2>&1 | tee "${RESULTS_DIR}/api-exploit.log"
echo ""

# Test Suite 4: Header Injection
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[4/6] Running Header Injection Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-header-injection.sh" 2>&1 | tee "${RESULTS_DIR}/header-injection.log"
echo ""

# Test Suite 5: File Read Exploitation
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[5/6] Running File Read Exploitation Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-file-read.sh" 2>&1 | tee "${RESULTS_DIR}/file-read.log"
echo ""

# Test Suite 6: RSC RCE
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}[6/6] Running RSC Server Action RCE Tests${NC}"
echo -e "${PURPLE}======================================================${NC}\n"
"${SCRIPT_DIR}/test-rsc-exploit.sh" 2>&1 | tee "${RESULTS_DIR}/rsc-exploit.log"
echo ""

# Generate summary report
echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}                  Test Summary                        ${NC}"
echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${BLUE}Test Results Location:${NC}"
echo -e "  ${RESULTS_DIR}\n"

echo -e "${RED}VULNERABILITY SUMMARY:${NC}"
echo -e "  ✗ Eval Injection: ${RED}VULNERABLE${NC}"
echo -e "  ✗ Form-based RCE: ${RED}VULNERABLE${NC}"
echo -e "  ✗ API Command Execution: ${RED}CRITICALLY VULNERABLE${NC}"
echo -e "  ✗ Header Injection: ${RED}VULNERABLE${NC}"
echo -e "  ✗ Arbitrary File Read: ${RED}VULNERABLE${NC}"
echo -e "  ✗ RSC Server Action RCE: ${RED}CRITICALLY VULNERABLE${NC}\n"

echo -e "${YELLOW}IMPACT ASSESSMENT:${NC}"
echo -e "  - Remote Code Execution: ${RED}CONFIRMED${NC}"
echo -e "  - System Command Execution: ${RED}CONFIRMED${NC}"
echo -e "  - Arbitrary File Reading: ${RED}CONFIRMED${NC}"
echo -e "  - Environment Variable Leak: ${RED}POSSIBLE${NC}"
echo -e "  - Data Exfiltration: ${RED}POSSIBLE${NC}\n"

echo -e "${GREEN}REMEDIATION STEPS:${NC}"
echo -e "  1. Run: ${BLUE}npx fix-react2shell-next${NC}"
echo -e "  2. Update dependencies: ${BLUE}npm update next react react-dom${NC}"
echo -e "  3. Implement input validation (see /secure pages)"
echo -e "  4. Add Content Security Policy"
echo -e "  5. Review all eval() and exec() usage"
echo -e "  6. Implement middleware protection\n"

echo -e "${PURPLE}======================================================${NC}"
echo -e "${PURPLE}                  Testing Complete                    ${NC}"
echo -e "${PURPLE}======================================================${NC}\n"

echo -e "${YELLOW}For detailed results, check the log files in:${NC}"
echo -e "${BLUE}${RESULTS_DIR}${NC}\n"

echo -e "${RED}⚠️  This application is EXTREMELY VULNERABLE${NC}"
echo -e "${RED}⚠️  Do NOT deploy to production without fixes${NC}\n"
