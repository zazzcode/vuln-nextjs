# React2Shell Vulnerability Test Site (CVE-2025-66478)

⚠️ **CRITICAL WARNING: This is a deliberately vulnerable application for security testing and educational purposes ONLY. NEVER deploy this to production or expose it to the internet!**

## Overview

This Next.js application demonstrates the React2Shell vulnerability (CVE-2025-66478), a critical Remote Code Execution (RCE) flaw affecting Next.js applications. The project includes:

- **Vulnerable Examples**: Pages demonstrating various attack vectors
- **Secure Examples**: Pages showing proper security implementations
- **Test Scripts**: Automated curl-based tests with malicious payloads
- **Documentation**: Detailed explanations of vulnerabilities and fixes

## CVE-2025-66478 - React2Shell

The React2Shell vulnerability exploits flaws in Next.js's server-side rendering (SSR) mechanism, specifically in how it handles:
- Dynamic imports and component hydration
- User input in `getServerSideProps` functions
- Unsanitized data passed to React components

This can lead to:
- ✗ Remote Code Execution (RCE)
- ✗ System Command Execution
- ✗ Arbitrary File Reading
- ✗ Data Exfiltration
- ✗ Complete Server Compromise

## Installation

1. Install dependencies:
```bash
cd /data/tyolab/web/nextjs/nextjs-vulsite
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Access the application:
```
http://localhost:3000
```

## Project Structure

```
nextjs-vulsite/
├── pages/
│   ├── index.js                          # Home page with navigation
│   ├── _app.js                           # Next.js app wrapper
│   ├── vulnerable/                       # Vulnerable examples
│   │   ├── eval-injection.js            # Eval injection via query params
│   │   ├── form-submission.js           # Form-based RCE
│   │   ├── api-route.js                 # API exploitation
│   │   ├── header-injection.js          # HTTP header injection
│   │   └── dynamic-import.js            # Dynamic import vulnerability
│   ├── secure/                          # Secure examples
│   │   ├── sanitized-input.js           # Proper input sanitization
│   │   ├── validated-form.js            # Form validation
│   │   ├── protected-api.js             # Secure API implementation
│   │   └── csp-enabled.js               # Content Security Policy
│   └── api/                             # API routes
│       ├── vulnerable-submit.js         # Vulnerable form processor
│       ├── vulnerable-exec.js           # Command execution endpoint
│       ├── vulnerable-file-read.js      # Arbitrary file reading
│       └── protected-example.js         # Secure API example
├── scripts/                             # Test scripts
│   ├── test-eval-injection.sh           # Eval injection tests
│   ├── test-form-rce.sh                 # Form RCE tests
│   ├── test-api-exploit.sh              # API exploitation tests
│   ├── test-header-injection.sh         # Header injection tests
│   ├── test-file-read.sh                # File read tests
│   └── test-all.sh                      # Run all tests
├── styles/                              # CSS files
│   ├── globals.css                      # Global styles
│   └── Home.module.css                  # Home page styles
├── package.json                         # Dependencies
├── next.config.js                       # Next.js configuration
└── README.md                            # This file
```

## Vulnerable Pages

### 1. Eval Injection (`/vulnerable/eval-injection`)
Demonstrates code injection via query parameters using `eval()`.

**Test URL:**
```
http://localhost:3000/vulnerable/eval-injection?input='); alert('XSS'); //
```

**Attack Vector:**
```javascript
eval(`setContent('${userInput}')`);  // DANGEROUS!
```

### 2. Form Submission RCE (`/vulnerable/form-submission`)
Shows how form data can be exploited to execute code.

**Malicious Payload:**
```
'); require('child_process').exec('whoami'); //
```

### 3. API Route Exploitation (`/vulnerable/api-route`)
Demonstrates direct system command execution via API endpoint.

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/vulnerable-exec \
  -H "Content-Type: application/json" \
  -d '{"command": "whoami"}'
```

### 4. Header Injection (`/vulnerable/header-injection`)
Shows how HTTP headers can be exploited.

**Test:**
```bash
curl -H "X-Custom-Header: '); console.log('pwned'); //" \
  http://localhost:3000/vulnerable/header-injection
```

### 5. Dynamic Import (`/vulnerable/dynamic-import`)
Demonstrates path traversal via dynamic imports.

**Test URL:**
```
http://localhost:3000/vulnerable/dynamic-import?module=../../../etc/passwd
```

## Secure Pages

### 1. Sanitized Input (`/secure/sanitized-input`)
Shows proper input validation and sanitization.

**Features:**
- Type validation
- Length limits
- Character whitelist
- Pattern blocking

### 2. Validated Form (`/secure/validated-form`)
Demonstrates comprehensive form validation.

**Features:**
- Client-side validation
- Server-side validation
- Input sanitization
- Error handling

### 3. Protected API (`/secure/protected-api`)
Shows secure API implementation.

**Features:**
- Type checking
- Input sanitization
- No eval/exec
- Proper error handling

### 4. CSP Enabled (`/secure/csp-enabled`)
Demonstrates Content Security Policy protection.

**Features:**
- CSP headers
- Multiple security headers
- Defense in depth

## Test Scripts

All test scripts are located in the `/scripts` directory and require the server to be running.

### Run Individual Tests

```bash
cd /data/tyolab/web/nextjs/nextjs-vulsite/scripts

# Test eval injection
./test-eval-injection.sh

# Test form RCE
./test-form-rce.sh

# Test API exploitation
./test-api-exploit.sh

# Test header injection
./test-header-injection.sh

# Test file reading
./test-file-read.sh
```

### Run All Tests

```bash
cd /data/tyolab/web/nextjs/nextjs-vulsite/scripts
./test-all.sh
```

This will:
1. Run all vulnerability tests
2. Generate detailed logs
3. Create a summary report
4. Save results to `./test-results/[timestamp]/`

## Understanding the Vulnerabilities

### How React2Shell Works

1. **Unsafe Input Handling**: User input is passed to `getServerSideProps` without validation
2. **Code Injection**: Input is used in dangerous functions like `eval()` or `exec()`
3. **Server-Side Execution**: Code runs on the server during SSR, not in the browser
4. **Full System Access**: Attacker gains access to Node.js runtime and system commands

### Example Attack Flow

```
1. Attacker crafts URL:
   /vulnerable?input='); require('child_process').exec('whoami'); //

2. Next.js processes request:
   getServerSideProps({ query }) {
     return { props: { userInput: query.input } }
   }

3. Component uses eval():
   eval(`setContent('${userInput}')`)

4. Malicious code executes:
   setContent(''); require('child_process').exec('whoami'); //')

5. Server executes: whoami
6. Attacker gains RCE
```

## Security Best Practices

### 1. Input Validation

```javascript
// ALWAYS validate input
if (typeof input !== 'string') {
  return { error: 'Invalid input type' };
}

// Check length
if (input.length > 200) {
  return { error: 'Input too long' };
}

// Use whitelist
const sanitized = input.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
```

### 2. Never Use eval() or exec() with User Input

```javascript
// NEVER do this:
eval(userInput);
exec(userInput);

// Instead, use safe alternatives:
const result = JSON.parse(userInput);  // For JSON
const allowed = ['option1', 'option2'];
if (allowed.includes(userInput)) {
  // Process safe input
}
```

### 3. Implement Content Security Policy

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; object-src 'none';"
  }
];
```

### 4. Use Middleware Protection

```javascript
// middleware.js
export function middleware(request) {
  const suspiciousPatterns = [
    /eval\(/,
    /require\(/,
    /child_process/
  ];

  const queryString = request.nextUrl.searchParams.toString();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(queryString)) {
      return new NextResponse('Blocked', { status: 403 });
    }
  }

  return NextResponse.next();
}
```

## Fixing React2Shell

### Official Fix Tool

```bash
npx fix-react2shell-next
```

This will:
- Scan your project for vulnerabilities
- Automatically patch known issues
- Update dependencies
- Generate a security report

### Manual Fix Steps

1. **Update Dependencies:**
```bash
npm update next react react-dom
npm audit fix --force
```

2. **Add Input Validation:**
- Validate all user inputs
- Use type checking
- Implement length limits
- Use character whitelists

3. **Remove Dangerous Functions:**
- Eliminate all `eval()` usage
- Avoid `exec()` with user input
- Use safe alternatives

4. **Implement Security Headers:**
- Add CSP
- Enable X-Frame-Options
- Set X-Content-Type-Options

5. **Add Middleware Protection:**
- Block suspicious patterns
- Rate limit requests
- Log security events

## Testing Checklist

- [ ] Install dependencies
- [ ] Start development server
- [ ] Access home page (http://localhost:3000)
- [ ] Test vulnerable eval injection page
- [ ] Test vulnerable form submission
- [ ] Test vulnerable API route
- [ ] Test header injection
- [ ] Test dynamic import
- [ ] Run eval injection test script
- [ ] Run form RCE test script
- [ ] Run API exploit test script
- [ ] Run header injection test script
- [ ] Run file read test script
- [ ] Run complete test suite
- [ ] Review secure page implementations
- [ ] Test secure input sanitization
- [ ] Test secure form validation
- [ ] Test protected API
- [ ] Verify CSP implementation

## Important Notes

### ⚠️ Security Warnings

1. **DO NOT** deploy this application to production
2. **DO NOT** expose this application to the internet
3. **DO NOT** use this code in real applications
4. **ONLY** use in isolated testing environments
5. **ALWAYS** use with explicit authorization

### Educational Use

This project is designed for:
- Security training and education
- Vulnerability research
- Penetration testing practice
- Understanding web security
- Learning secure coding practices

### Legal Considerations

- Only test on systems you own or have written permission to test
- Unauthorized access to computer systems is illegal
- This tool is for ethical security testing only
- Users are responsible for how they use this code

## Troubleshooting

### Server won't start
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test scripts not executable
```bash
chmod +x scripts/*.sh
```

### Dependencies not found
```bash
npm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## Resources

- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Contributing

This is an educational project. If you find additional vulnerabilities or want to contribute:

1. Document the vulnerability clearly
2. Provide both vulnerable and secure examples
3. Include test cases
4. Add to documentation

## License

This project is for educational purposes only. Use at your own risk.

## Disclaimer

The authors and contributors of this project are not responsible for any misuse or damage caused by this software. This tool is provided for educational and ethical testing purposes only. Users must obtain proper authorization before testing any systems.

---

**Remember: With great power comes great responsibility. Use this knowledge to build secure applications, not to attack systems you don't own.**
