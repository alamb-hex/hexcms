# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:

**security@hexcms.dev** (when available) or through GitHub Security Advisories

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., SQL injection, XSS, CSRF, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Next scheduled release

### Security Update Process

1. **Acknowledgment:** We'll acknowledge receipt of your vulnerability report
2. **Assessment:** Our security team will assess the vulnerability
3. **Fix Development:** We'll develop a fix for the vulnerability
4. **Testing:** The fix will be thoroughly tested
5. **Release:** We'll release a security update
6. **Disclosure:** After the fix is released, we'll publicly disclose the vulnerability

### Responsible Disclosure

We kindly ask you to:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Not exploit the vulnerability beyond what is necessary to demonstrate the issue

### Recognition

We believe in recognizing security researchers who help keep heXcms secure. With your permission, we will:

- Credit you in our security advisories
- List you in our Hall of Fame (when available)
- Mention you in release notes

### Security Best Practices

For users deploying heXcms:

- Always use the latest version
- Follow security guidelines in `docs/guides/security.md`
- Complete the security checklist in `docs/guides/security-checklist.md`
- Run regular security audits using our Security Audit Agent
- Enable two-factor authentication on your GitHub account
- Use strong, unique webhook secrets
- Regularly rotate API keys and secrets
- Monitor security logs
- Keep dependencies up to date

### Security Features

heXcms includes the following security features:

- **OWASP Top 10 Protection:** Built-in protections against common vulnerabilities
- **Input Validation:** Zod schema validation throughout
- **SQL Injection Prevention:** Parameterized queries only
- **XSS Protection:** Content Security Policy and output encoding
- **CSRF Protection:** Origin verification for state-changing operations
- **Webhook Verification:** HMAC SHA-256 signature verification
- **Rate Limiting:** Protection against DDoS and brute-force attacks
- **Secure Headers:** Comprehensive security headers configured
- **Dependency Scanning:** Regular security audits of dependencies

### Security Documentation

- **Security Guide:** `docs/guides/security.md`
- **Security Checklist:** `docs/guides/security-checklist.md`
- **Security Audit Agent:** `.claude/security-audit-workflow.md`

### Contact

For general security questions (not vulnerabilities), please:

- Open a GitHub Discussion
- Email: team@hexcms.dev (when available)

### Policy Updates

This security policy is subject to change. Last updated: 2025-10-24

---

Thank you for helping keep heXcms and its users safe!
