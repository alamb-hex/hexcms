# Security Audit Checklist

> Comprehensive security checklist for heXcms - Use this before deployment and quarterly

**Last Updated:** 2025-10-24
**Version:** 1.0

---

## Overview

This checklist ensures all security measures are implemented correctly before deploying heXcms to production. Use this for:

- **Pre-deployment audit** - Before going live
- **Quarterly security reviews** - Every 3 months
- **Post-incident reviews** - After any security event
- **Major updates** - Before deploying significant changes

---

## Quick Reference

| Phase | Critical Items | Time Estimate |
|-------|---------------|---------------|
| Code Security | 15 checks | 2-3 hours |
| Configuration | 12 checks | 1-2 hours |
| Dependencies | 8 checks | 30 mins |
| Infrastructure | 10 checks | 1-2 hours |
| Testing | 12 checks | 2-4 hours |
| Monitoring | 8 checks | 1 hour |

**Total Audit Time:** 7-12 hours

---

## Phase 1: Code Security Audit

### 1.1 SQL Injection Prevention

- [ ] **All database queries use parameterized queries**
  - Check: Search codebase for `sql\`SELECT * FROM` patterns
  - Verify: No string concatenation in SQL queries
  - File locations: `src/lib/db/`, `src/app/api/`

- [ ] **No raw SQL string concatenation**
  ```bash
  # Search for dangerous patterns
  grep -r "SELECT.*\${" src/
  grep -r "INSERT.*\${" src/
  grep -r "UPDATE.*\${" src/
  ```

- [ ] **Slug parameters are validated before use**
  - Check: `src/app/blog/[slug]/page.tsx`
  - Verify: Zod schema validation in place

- [ ] **Search queries are sanitized**
  - Check: `src/app/api/search/route.ts`
  - Verify: Input validation before database query

**Reference:** [Security Guide - SQL Injection](./security.md#sql-injection-prevention)

---

### 1.2 XSS Protection

- [ ] **Content Security Policy (CSP) headers configured**
  - File: `next.config.js` or `middleware.ts`
  - Verify headers include:
    ```javascript
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'"
    ```

- [ ] **User-generated content is sanitized**
  - Check: Markdown rendering in `src/lib/markdown/parser.ts`
  - Verify: DOMPurify or similar sanitization

- [ ] **No `dangerouslySetInnerHTML` without sanitization**
  ```bash
  # Find all uses of dangerouslySetInnerHTML
  grep -r "dangerouslySetInnerHTML" src/
  ```
  - Each instance should have sanitization

- [ ] **HTML entities are escaped in dynamic content**
  - Check: All user input display components
  - Verify: React automatically escapes or manual escaping in place

**Reference:** [Security Guide - XSS Protection](./security.md#xss-cross-site-scripting-protection)

---

### 1.3 Authentication & Authorization

- [ ] **Webhook signature verification uses timing-safe comparison**
  - File: `src/app/api/webhook/route.ts`
  - Code pattern:
    ```typescript
    import { timingSafeEqual } from 'crypto';
    return timingSafeEqual(Buffer.from(sig1), Buffer.from(sig2));
    ```

- [ ] **HMAC verification is implemented correctly**
  - Verify: `crypto.createHmac('sha256', secret)` usage
  - Check: Signature format matches GitHub's specification

- [ ] **Admin endpoints have authentication**
  - Files: `src/app/api/sync/manual/route.ts`
  - Verify: API key or token validation

- [ ] **Sensitive routes check authorization**
  - List all admin/sync routes
  - Verify each has proper auth check

**Reference:** [Security Guide - Authentication](./security.md#authentication--authorization)

---

### 1.4 Input Validation

- [ ] **All API endpoints validate input with Zod**
  - Check each route in `src/app/api/`
  - Example pattern:
    ```typescript
    const schema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) });
    const validated = schema.parse(data);
    ```

- [ ] **Webhook payload is validated**
  - File: `src/app/api/webhook/route.ts`
  - Verify: Payload structure validation before processing

- [ ] **File paths are validated (no directory traversal)**
  ```bash
  # Check for path validation
  grep -r "path.join" src/
  grep -r "\.\./" src/
  ```
  - Verify: No user input directly in file paths

- [ ] **URLs are validated before fetching**
  - Check: GitHub API fetcher in `src/lib/git/fetcher.ts`
  - Verify: URL validation before HTTP requests

**Reference:** [Security Guide - Input Validation](./security.md#input-validation--sanitization)

---

### 1.5 CSRF Protection

- [ ] **POST endpoints verify origin**
  - Check: All POST routes in `src/app/api/`
  - Verify: Origin header check or CSRF tokens

- [ ] **State-changing operations require verification**
  - Routes: `/api/webhook`, `/api/sync/manual`
  - Verify: Additional verification beyond GET requests

- [ ] **SameSite cookie attributes set**
  - File: Cookie configuration in auth system
  - Verify: `SameSite=Strict` or `SameSite=Lax`

**Reference:** [Security Guide - CSRF](./security.md#csrf-protection)

---

## Phase 2: Configuration Security

### 2.1 Environment Variables

- [ ] **All secrets are in environment variables (not code)**
  ```bash
  # Check for hardcoded secrets
  grep -r "secret.*=.*['\"]" src/
  grep -r "password.*=.*['\"]" src/
  grep -r "api.*key.*=.*['\"]" src/
  ```

- [ ] **`.env.local` is in `.gitignore`**
  ```bash
  grep "\.env\.local" .gitignore
  ```

- [ ] **`.env.example` exists with placeholder values**
  - File: `.env.example`
  - Verify: No real secrets, only examples

- [ ] **Environment variable validation at startup**
  - File: `src/lib/env.ts`
  - Verify: Throws error if required vars missing

- [ ] **Production environment uses Vercel environment variables**
  - Vercel Dashboard: Check all required vars are set
  - Verify: No local .env files deployed

**Reference:** [Security Guide - Secrets Management](./security.md#environment-variables--secrets-management)

---

### 2.2 Dependencies

- [ ] **Run `npm audit` and fix all high/critical issues**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **All dependencies are up to date**
  ```bash
  npm outdated
  ```

- [ ] **Dependabot is enabled on GitHub**
  - GitHub Settings → Security → Dependabot alerts: ✅

- [ ] **Review dependency licenses**
  ```bash
  npx license-checker --summary
  ```

- [ ] **No known vulnerable packages**
  - Check: https://snyk.io/vuln/
  - Run: `npx snyk test`

**Reference:** [Security Guide - Dependencies](./security.md#dependency-security)

---

### 2.3 CORS Configuration

- [ ] **CORS headers restrict origins**
  - File: `middleware.ts` or API routes
  - Verify: Not set to `Access-Control-Allow-Origin: *`

- [ ] **Webhook endpoint only accepts GitHub IPs** (optional)
  - File: `src/app/api/webhook/route.ts`
  - Verify: IP allowlist if implemented

**Reference:** [Security Guide - API Security](./security.md#api-security)

---

## Phase 3: Infrastructure Security

### 3.1 Database Security

- [ ] **Database uses SSL/TLS connections**
  - Vercel Postgres: Automatically enabled ✅
  - Verify: Connection string uses `sslmode=require`

- [ ] **Database user has minimal privileges**
  - Verify: Application user can't drop tables
  - Check: No `SUPERUSER` or `GRANT ALL` permissions

- [ ] **Database backups are enabled**
  - Vercel Postgres: Check backup schedule
  - Verify: Can restore from backup

- [ ] **Connection pooling is configured**
  - File: `src/lib/db.ts`
  - Verify: Pool size limits set

**Reference:** [Security Guide - Database Security](./security.md#database-security)

---

### 3.2 Deployment Security

- [ ] **Vercel deployment uses production mode**
  - Verify: `NODE_ENV=production`
  - Check: Source maps disabled in production

- [ ] **HTTPS is enforced (HTTP redirects to HTTPS)**
  - Vercel: Automatically enabled ✅
  - Test: Visit `http://yourdomain.com` → should redirect

- [ ] **Security headers are set**
  - File: `next.config.js` or `middleware.ts`
  - Required headers:
    ```javascript
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    ```

- [ ] **robots.txt doesn't expose sensitive paths**
  - File: `public/robots.txt`
  - Verify: No admin paths exposed

**Reference:** [Security Guide - Deployment](./security.md#deployment-security)

---

### 3.3 Rate Limiting

- [ ] **Rate limiting implemented on webhook endpoint**
  - File: `src/app/api/webhook/route.ts`
  - Verify: Upstash Redis or similar rate limiter

- [ ] **Rate limiting on search endpoint**
  - File: `src/app/api/search/route.ts`
  - Verify: Prevents brute-force searches

- [ ] **Rate limiting on sync endpoint**
  - File: `src/app/api/sync/manual/route.ts`
  - Verify: Prevents DoS attacks

- [ ] **Vercel function timeout is reasonable**
  - Default: 10 seconds (hobby), 60 seconds (pro)
  - Verify: Set appropriately for long-running syncs

**Reference:** [Security Guide - Rate Limiting](./security.md#rate-limiting--ddos-protection)

---

## Phase 4: Testing

### 4.1 Automated Security Tests

- [ ] **SQL injection tests**
  ```typescript
  // Test: src/tests/security/sql-injection.test.ts
  test('rejects malicious slug with SQL injection', async () => {
    const response = await fetch('/api/posts/1; DROP TABLE posts;--');
    expect(response.status).toBe(400); // or 404
  });
  ```

- [ ] **XSS tests**
  ```typescript
  test('escapes HTML in user content', async () => {
    const html = await render('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });
  ```

- [ ] **Webhook signature tests**
  ```typescript
  test('rejects webhook with invalid signature', async () => {
    const response = await POST('/api/webhook', {
      headers: { 'X-Hub-Signature-256': 'sha256=invalid' }
    });
    expect(response.status).toBe(401);
  });
  ```

- [ ] **Input validation tests**
  ```typescript
  test('validates all required fields', async () => {
    const response = await POST('/api/posts', { body: {} });
    expect(response.status).toBe(400);
  });
  ```

**Reference:** [Testing Guide](../development/testing.md)

---

### 4.2 Manual Security Testing

- [ ] **Test SQL injection manually**
  - Try: `https://yoursite.com/blog/'; DROP TABLE posts;--`
  - Expected: 404 or validation error, not database error

- [ ] **Test XSS manually**
  - If comments exist: Submit `<script>alert('xss')</script>`
  - Expected: Script tags should be escaped

- [ ] **Test webhook without signature**
  ```bash
  curl -X POST https://yoursite.com/api/webhook \
    -H "Content-Type: application/json" \
    -d '{"ref":"refs/heads/main"}'
  ```
  - Expected: 401 Unauthorized

- [ ] **Test rate limiting**
  ```bash
  for i in {1..100}; do
    curl https://yoursite.com/api/search?q=test
  done
  ```
  - Expected: 429 Too Many Requests after threshold

- [ ] **Test HTTPS redirect**
  ```bash
  curl -I http://yoursite.com
  ```
  - Expected: 301 redirect to HTTPS

**Reference:** [Security Guide - Testing](./security.md#security-testing)

---

### 4.3 Penetration Testing (Optional)

- [ ] **Run OWASP ZAP scan**
  ```bash
  docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yoursite.com
  ```

- [ ] **Run Lighthouse security audit**
  ```bash
  npx lighthouse https://yoursite.com --only-categories=best-practices
  ```

- [ ] **Check for exposed secrets**
  ```bash
  npx secretlint "**/*"
  ```

- [ ] **Test with Burp Suite** (for advanced users)
  - Test: Authentication bypass attempts
  - Test: Session management issues
  - Test: Business logic flaws

---

## Phase 5: Monitoring & Logging

### 5.1 Logging

- [ ] **Security events are logged**
  - Failed webhook verifications
  - Failed authentication attempts
  - Rate limit triggers
  - Database errors

- [ ] **Logs don't contain sensitive data**
  ```bash
  # Check logs for secrets
  grep -i "password\|secret\|token" logs/
  ```
  - Verify: Secrets are redacted

- [ ] **Log rotation is configured**
  - Vercel: Automatic log retention ✅
  - Self-hosted: Check logrotate config

- [ ] **Structured logging is used**
  - File: `src/lib/logger.ts`
  - Format: JSON logs with timestamps and levels

**Reference:** [Security Guide - Logging](./security.md#logging--monitoring)

---

### 5.2 Monitoring

- [ ] **Uptime monitoring is active**
  - Tool: Vercel Analytics, UptimeRobot, or similar
  - Alerts: Email/SMS on downtime

- [ ] **Error tracking is configured**
  - Tool: Sentry, LogRocket, or similar
  - Verify: Errors are reported in real-time

- [ ] **Security alerts are enabled**
  - GitHub: Dependabot alerts ✅
  - npm audit: Weekly checks
  - Vercel: Security notifications ✅

- [ ] **Webhook failures are monitored**
  - Check: GitHub webhook delivery status
  - Alert: Failed webhook deliveries

**Reference:** [Security Guide - Monitoring](./security.md#monitoring--alerting)

---

## Phase 6: Incident Response

### 6.1 Incident Response Plan

- [ ] **Incident response team is identified**
  - Primary: [Name/Email]
  - Secondary: [Name/Email]
  - Security contact: [Email]

- [ ] **Incident severity levels are defined**
  - Critical: Data breach, site down
  - High: Security vulnerability
  - Medium: Performance degradation
  - Low: Minor issues

- [ ] **Communication plan is documented**
  - Internal: Slack, email
  - External: Status page
  - Users: Email notifications

- [ ] **Backup restoration procedure is tested**
  - Last test date: _________
  - Restoration time: _____ minutes
  - Verified: Data integrity intact

**Reference:** [Security Guide - Incident Response](./security.md#incident-response)

---

## Phase 7: Documentation

### 7.1 Security Documentation

- [ ] **Security guide is up to date**
  - File: `docs/guides/security.md`
  - Last reviewed: _________

- [ ] **This checklist is complete**
  - All items checked: ☐
  - Issues documented: ☐
  - Remediation plan: ☐

- [ ] **Security contacts are documented**
  - File: `SECURITY.md` in root
  - Includes: Reporting process, expected response time

- [ ] **Change log includes security updates**
  - File: `CHANGELOG.md`
  - Security fixes are noted

---

## Audit Summary

**Audit Date:** _________
**Auditor:** _________
**Version:** _________

### Results

| Phase | Total | Passed | Failed | N/A |
|-------|-------|--------|--------|-----|
| Code Security | 15 | __ | __ | __ |
| Configuration | 12 | __ | __ | __ |
| Infrastructure | 10 | __ | __ | __ |
| Testing | 12 | __ | __ | __ |
| Monitoring | 8 | __ | __ | __ |
| Incident Response | 4 | __ | __ | __ |
| Documentation | 4 | __ | __ | __ |
| **TOTAL** | **65** | **__** | **__** | **__** |

### Critical Issues

1. _________
2. _________
3. _________

### Remediation Plan

| Issue | Priority | Assigned To | Due Date | Status |
|-------|----------|-------------|----------|--------|
| ___ | High | ___ | ___ | ☐ |
| ___ | Medium | ___ | ___ | ☐ |
| ___ | Low | ___ | ___ | ☐ |

### Sign-Off

- [ ] All critical and high priority issues resolved
- [ ] Remediation plan documented for remaining issues
- [ ] Next audit scheduled for: _________

**Approved By:** _________
**Date:** _________

---

## Quick Commands

### Security Checks

```bash
# Check for secrets in code
git secrets --scan

# Audit dependencies
npm audit

# Check for outdated packages
npm outdated

# Search for dangerous patterns
grep -r "dangerouslySetInnerHTML" src/
grep -r "eval(" src/
grep -r "\.innerHTML" src/

# Check environment variables
node -e "require('./src/lib/env.ts')"

# Test webhook signature
curl -X POST https://yoursite.com/api/webhook \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"test": "data"}'

# Run all tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Guide](./security.md)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Vercel Security](https://vercel.com/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated:** 2025-10-24
**Next Review:** [3 months from deployment]

**Questions?** Contact security@yourcompany.com
