# Security Policy

## ⚠️ WARNING: Deliberately Vulnerable Application

This application is **INTENTIONALLY VULNERABLE** and designed for security testing, education, and research purposes ONLY.

## DO NOT

- ❌ Deploy to production
- ❌ Expose to the internet
- ❌ Use in real applications
- ❌ Test on systems you don't own
- ❌ Use without authorization

## DO

- ✅ Use in isolated environments
- ✅ Use for learning and education
- ✅ Use for authorized penetration testing
- ✅ Use for security research
- ✅ Learn from the secure examples

## Vulnerabilities (By Design)

This application contains the following **INTENTIONAL** vulnerabilities:

### 1. CVE-2025-66478 - React2Shell (CRITICAL)

**Severity:** CRITICAL (CVSS 10.0)

**Description:** Remote Code Execution via unsanitized user input in Next.js SSR

**Affected Components:**
- `/pages/vulnerable/eval-injection.js`
- `/pages/vulnerable/form-submission.js`
- `/pages/api/vulnerable-submit.js`

**Impact:**
- Complete server compromise
- Arbitrary code execution
- System command execution
- Data exfiltration

### 2. Command Injection (CRITICAL)

**Severity:** CRITICAL (CVSS 10.0)

**Description:** Direct system command execution via API endpoint

**Affected Components:**
- `/pages/vulnerable/api-route.js`
- `/pages/api/vulnerable-exec.js`

**Impact:**
- Full system access
- Arbitrary command execution
- Server takeover

### 3. Arbitrary File Read (HIGH)

**Severity:** HIGH (CVSS 8.6)

**Description:** Read any file on the system via API endpoint

**Affected Components:**
- `/pages/api/vulnerable-file-read.js`

**Impact:**
- Read sensitive files
- Access credentials
- Enumerate system

### 4. Header Injection (MEDIUM)

**Severity:** MEDIUM (CVSS 6.5)

**Description:** Malicious header processing without validation

**Affected Components:**
- `/pages/vulnerable/header-injection.js`

**Impact:**
- Code injection
- Response manipulation
- Information disclosure

### 5. Path Traversal (HIGH)

**Severity:** HIGH (CVSS 8.2)

**Description:** Directory traversal via dynamic imports

**Affected Components:**
- `/pages/vulnerable/dynamic-import.js`

**Impact:**
- File system access
- Module loading
- Code execution

## Secure Examples

For **SECURE** implementations, refer to:

- `/pages/secure/sanitized-input.js` - Proper input validation
- `/pages/secure/validated-form.js` - Form validation
- `/pages/secure/protected-api.js` - Secure API design
- `/pages/secure/csp-enabled.js` - Content Security Policy
- `/pages/api/protected-example.js` - Safe API implementation

## Security Best Practices

### Input Validation

```javascript
// ALWAYS validate and sanitize
function sanitizeInput(input) {
  // Type check
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }

  // Length check
  if (input.length > 200) {
    throw new Error('Input too long');
  }

  // Character whitelist
  return input.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
}
```

### Never Use These with User Input

```javascript
// DANGEROUS - NEVER USE:
eval(userInput)
Function(userInput)
exec(userInput)
execSync(userInput)
spawn(userInput)
require(userInput)
import(userInput)
```

### Content Security Policy

```javascript
// Implement strict CSP
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');
```

### Defense in Depth

Implement multiple layers:

1. **Input Validation** - First line of defense
2. **Middleware** - Block suspicious patterns
3. **API Validation** - Server-side checks
4. **CSP** - Browser-level protection
5. **Rate Limiting** - Prevent abuse
6. **Logging** - Detect attacks

## Reporting Issues

If you discover **NEW** vulnerabilities (beyond the intentional ones) or have suggestions for improving the secure examples:

1. Document the issue clearly
2. Provide reproduction steps
3. Suggest a fix
4. Submit via appropriate channels

## Responsible Disclosure

When conducting security testing:

1. **Get Authorization** - Always have written permission
2. **Use Isolated Environments** - Never test production systems
3. **Respect Scope** - Stay within agreed boundaries
4. **Document Findings** - Keep detailed records
5. **Report Responsibly** - Follow disclosure guidelines

## Legal Notice

### Disclaimer

This application is provided "AS IS" for educational purposes. The authors and contributors:

- Are NOT responsible for misuse
- Do NOT encourage unauthorized testing
- Do NOT endorse illegal activities
- STRONGLY discourage attacking systems without permission

### Legal Compliance

Users must:

- Comply with all applicable laws
- Obtain proper authorization
- Respect computer fraud and abuse laws
- Follow ethical hacking guidelines

### Unauthorized Access

Unauthorized access to computer systems is **ILLEGAL** in most jurisdictions:

- **USA:** Computer Fraud and Abuse Act (CFAA)
- **UK:** Computer Misuse Act 1990
- **EU:** Cybercrime Directive
- **International:** Budapest Convention

Violations can result in:
- Criminal prosecution
- Civil liability
- Fines and imprisonment
- Professional consequences

## Educational Purpose

This project teaches:

- How vulnerabilities work
- Impact of insecure code
- Exploitation techniques
- Secure coding practices
- Defense strategies

Use this knowledge to:

- Build secure applications
- Conduct authorized testing
- Improve security awareness
- Educate others responsibly

## Ethical Guidelines

### Do's

✅ Use for learning and education
✅ Practice on your own systems
✅ Conduct authorized penetration tests
✅ Research security vulnerabilities
✅ Build secure applications
✅ Share knowledge responsibly

### Don'ts

❌ Attack systems without permission
❌ Cause damage or disruption
❌ Steal or expose data
❌ Deploy to production
❌ Share exploits maliciously
❌ Violate laws or ethics

## Contact

For questions about:

- **Educational Use:** Refer to README.md
- **Security Issues:** Document and report appropriately
- **Legal Concerns:** Consult with legal counsel

## Updates

This security policy may be updated to reflect:

- New vulnerabilities discovered
- Updated security practices
- Changed legal requirements
- Community feedback

## Acknowledgments

This project is inspired by:

- OWASP vulnerable applications
- Security research community
- Ethical hacking education
- Real-world vulnerability disclosures

## Final Warning

🚨 **This is a weapon in the hands of the wrong person.** 🚨

Use it **ONLY** for:
- Learning
- Education
- Authorized testing
- Security research
- Building better defenses

**NOT** for:
- Unauthorized access
- Malicious attacks
- Data theft
- System damage
- Illegal activities

**Remember: Just because you CAN do something doesn't mean you SHOULD.**

---

**Security is everyone's responsibility. Be part of the solution, not the problem.**
