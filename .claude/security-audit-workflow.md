# Security Audit Agent Workflow

> How to use the Security Audit Agent to analyze heXcms for vulnerabilities

**Last Updated:** 2025-10-24
**Version:** 1.0

---

## Overview

The Security Audit Agent is a specialized Claude Code agent that performs comprehensive security audits of the heXcms codebase. It analyzes code for vulnerabilities, checks compliance with security standards, and generates detailed reports.

**Key Features:**
- 🔍 **Read-only analysis** - Never modifies code
- 📊 **Comprehensive reports** - Detailed findings with evidence
- ✅ **Compliance checking** - Against OWASP Top 10 and security checklist
- 🎯 **Risk prioritization** - Critical, High, Medium, Low severity ratings
- 📋 **Actionable recommendations** - Specific steps to remediate issues

---

## When to Use the Security Audit Agent

### Recommended Schedule

1. **Pre-deployment audit** - Before first production release
2. **Quarterly audits** - Every 3 months
3. **Post-major changes** - After significant feature additions
4. **Post-incident** - After any security event
5. **Dependency updates** - After major dependency upgrades
6. **On-demand** - When security concerns arise

### Use Cases

- ✅ Comprehensive security assessment
- ✅ Vulnerability discovery
- ✅ Compliance verification
- ✅ Code review for security issues
- ✅ Dependency vulnerability analysis
- ✅ Configuration security review
- ❌ DO NOT use for implementing fixes (use rapid-dev agent for that)

---

## How to Invoke the Security Audit Agent

### Method 1: Direct Invocation (Recommended)

In Claude Code, launch a new agent with the following prompt:

```
I need a comprehensive security audit of the heXcms project.

Use the research-agent to perform a thorough security analysis following these instructions:

1. Read and follow the security audit process in .claude/security-audit-agent-prompt.md
2. Analyze all code for OWASP Top 10 vulnerabilities
3. Check compliance with docs/guides/security-checklist.md
4. Generate a detailed security report with findings and recommendations
5. DO NOT modify any code - only analyze and report

Focus areas:
- SQL injection vulnerabilities
- XSS protection
- Authentication and authorization
- Input validation
- CSRF protection
- Secret management
- Security configuration
- Dependencies

Provide a comprehensive report with:
- Executive summary
- Vulnerabilities by severity (Critical, High, Medium, Low)
- Compliance scores
- Prioritized recommendations
```

### Method 2: Focused Audit

For specific areas:

```
Perform a focused security audit on [SPECIFIC AREA] of heXcms.

Follow .claude/security-audit-agent-prompt.md but focus specifically on:
- [Area 1]
- [Area 2]
- [Area 3]

Generate a report with findings and recommendations for these areas only.
```

**Example focused areas:**
- API endpoint security (`src/app/api/`)
- Database security (`src/lib/db/`)
- Authentication (`src/lib/auth/` or webhook verification)
- Input validation (all Zod schemas)
- Dependency security (`package.json`)

---

## Agent Behavior

### What the Agent WILL Do ✅

1. **Read and analyze code**
   - Search for vulnerability patterns
   - Review security implementations
   - Check configuration files

2. **Generate detailed reports**
   - Vulnerability findings with evidence
   - Risk severity ratings
   - Code snippets showing issues
   - Compliance scores

3. **Provide recommendations**
   - Specific remediation steps
   - Prioritized action items
   - Best practice guidance
   - References to documentation

4. **Check compliance**
   - Security checklist (65 items)
   - OWASP Top 10
   - Industry best practices

### What the Agent WILL NOT Do ❌

1. **Make code changes**
   - No file modifications
   - No code fixes
   - No implementations

2. **Install dependencies**
   - No package installations
   - No tool setup

3. **Run security tools**
   - No `npm audit` execution
   - No OWASP ZAP scans
   - (It will analyze results if you provide them)

---

## Expected Output

The agent will provide a comprehensive security report with the following sections:

### 1. Executive Summary
- Overall security posture
- Total vulnerabilities by severity
- Compliance percentage
- Top 3-5 recommendations

### 2. Critical Findings (if any)
Each finding includes:
- Title and description
- File location and line number
- Code snippet
- OWASP category
- Impact analysis
- Remediation recommendation

### 3. High Priority Issues
Same format as Critical findings

### 4. Medium Priority Issues
Same format as Critical findings

### 5. Low Priority Issues
Same format as Critical findings

### 6. Informational Findings
- Best practice improvements
- Security enhancements
- Future considerations

### 7. Compliance Report
- Security checklist compliance score
- OWASP Top 10 assessment
- Compliance matrix

### 8. Recommendations
- Immediate actions (Critical/High)
- Short-term actions (Medium)
- Long-term actions (Low)
- Security improvements roadmap

### 9. Overall Security Grade
Letter grade: A (Excellent) to F (Critical issues)

---

## Sample Audit Timeline

**Total Time:** 60-90 minutes (agent time)

| Phase | Duration | Activities |
|-------|----------|------------|
| Setup | 5 min | Read documentation, understand structure |
| Code Analysis | 30-45 min | Scan for vulnerabilities, review security implementations |
| Configuration Review | 10-15 min | Check environment vars, headers, rate limiting |
| Dependency Check | 5-10 min | Review package.json, known vulnerabilities |
| Compliance Check | 15-20 min | Verify security checklist items |
| Report Generation | 10-15 min | Compile findings, format report |

---

## Interpreting Results

### Severity Levels

**CRITICAL** 🔴
- Immediate action required
- High likelihood of exploitation
- Severe impact (data breach, RCE, complete compromise)
- **Action:** Fix before deployment

**HIGH** 🟠
- Significant security risk
- Moderate to high likelihood of exploitation
- Major impact (data exposure, unauthorized access)
- **Action:** Fix within 1 week

**MEDIUM** 🟡
- Security concern
- Lower likelihood or requires specific conditions
- Moderate impact
- **Action:** Fix within 1 month

**LOW** 🟢
- Minor security issue
- Difficult to exploit or minimal impact
- **Action:** Fix when convenient

**INFORMATIONAL** ℹ️
- Best practice recommendations
- No immediate security risk
- **Action:** Consider for future improvements

### Compliance Scoring

- **90-100%** - Excellent security posture ✅
- **75-89%** - Good, minor improvements needed ⚠️
- **60-74%** - Needs attention, moderate gaps ⚠️
- **Below 60%** - Significant security concerns ❌

---

## After the Audit

### 1. Review the Report
- Read executive summary
- Understand all CRITICAL and HIGH issues
- Review recommendations

### 2. Prioritize Remediation
- Address CRITICAL issues immediately
- Plan for HIGH priority fixes (1 week)
- Schedule MEDIUM priority fixes (1 month)
- Consider LOW and INFORMATIONAL items

### 3. Use Rapid Dev Agent to Fix Issues
Once you understand the vulnerabilities, use the rapid-dev agent to implement fixes:

```
Using the security audit findings, implement fixes for:
1. [Critical Issue 1]
2. [Critical Issue 2]
3. [High Priority Issue 1]

Reference the recommendations in the audit report and docs/guides/security.md
```

### 4. Re-audit
After implementing fixes, run the security audit agent again to verify:
```
Perform a security re-audit focusing on the following previously identified issues:
- [Issue 1] - verify fix in src/file.ts:line
- [Issue 2] - verify fix in src/file.ts:line

Confirm the vulnerabilities are resolved and no new issues were introduced.
```

### 5. Document
- Update security documentation
- Add security test cases
- Document any architectural security decisions

---

## Integration with Development Workflow

### Pre-Deployment Checklist

Before deploying to production:

1. ✅ Run security audit agent
2. ✅ Address all CRITICAL issues
3. ✅ Address all HIGH issues
4. ✅ Verify compliance > 75%
5. ✅ Run `npm audit` and fix vulnerabilities
6. ✅ Complete manual security testing
7. ✅ Update security documentation
8. ✅ Deploy to production

### Continuous Security

**Monthly:**
- Run `npm audit`
- Review dependency updates
- Check security alerts

**Quarterly:**
- Run full security audit agent
- Review and update security documentation
- Test incident response procedures

**Annually:**
- External penetration testing
- Security policy review
- Compliance certification

---

## Troubleshooting

### Agent doesn't find expected issues

**Solution:**
- Ensure the codebase exists (not just documentation)
- Provide specific files/areas to focus on
- Check that security implementations are in standard locations

### Agent is too slow

**Solution:**
- Use focused audits for specific areas
- Break audit into multiple sessions
- Focus on high-risk areas first

### Agent reports false positives

**Solution:**
- Review the finding carefully
- Check if framework provides built-in protection
- Verify with manual testing
- Document why it's not a real issue

### Agent misses a vulnerability

**Solution:**
- Security audits are not perfect
- Use multiple tools (OWASP ZAP, npm audit, etc.)
- Manual testing is still important
- Consider professional penetration testing

---

## Best Practices

### Before Running Audit

1. ✅ Ensure code is committed (clean working directory)
2. ✅ Run `npm install` (check package-lock.json)
3. ✅ Review recent changes
4. ✅ Update security documentation if needed

### During Audit

1. ✅ Let agent complete full analysis
2. ✅ Don't interrupt or modify code during audit
3. ✅ Take notes on findings

### After Audit

1. ✅ Save the full report
2. ✅ Share with team
3. ✅ Create issues/tickets for findings
4. ✅ Track remediation progress
5. ✅ Schedule re-audit

---

## Example Scenarios

### Scenario 1: Pre-Production Audit

**Situation:** About to deploy heXcms to production for the first time

**Action:**
```
Perform a comprehensive pre-production security audit of heXcms.

Follow .claude/security-audit-agent-prompt.md completely.

This is a pre-production audit, so be extra thorough:
- Check all OWASP Top 10 categories
- Verify all 65 security checklist items
- Review all API endpoints
- Check all database operations
- Verify environment variable security
- Assess dependency vulnerabilities

Provide a production-readiness assessment and list any blockers.
```

### Scenario 2: Post-Incident Audit

**Situation:** Suspicious activity detected in logs

**Action:**
```
Perform a focused security audit following a potential security incident.

Focus on:
- Authentication mechanisms (webhook signature verification)
- Access control and authorization
- Logging and monitoring implementations
- Recent code changes

Look for any vulnerabilities that could have been exploited.
Provide recommendations to prevent similar incidents.
```

### Scenario 3: Dependency Update Audit

**Situation:** Just updated major dependencies (Next.js, React, etc.)

**Action:**
```
Perform a focused security audit after dependency updates.

Focus on:
- Breaking changes that affect security
- New security features to adopt
- Deprecated security practices
- Configuration changes needed
- Updated best practices

Check if the updates introduced any regressions or new vulnerabilities.
```

---

## Report Storage

After each audit:

1. **Save the report**
   ```
   Create: docs/security-audits/audit-YYYY-MM-DD.md
   ```

2. **Track in CHANGELOG**
   ```markdown
   ### Security
   - Completed security audit on YYYY-MM-DD
   - Addressed X critical issues, Y high priority issues
   - Compliance score: XX%
   ```

3. **Update status**
   ```
   Update TASKS.md Phase 8 checkboxes based on compliance
   ```

---

## Related Documentation

- **Agent Prompt:** `.claude/security-audit-agent-prompt.md`
- **Security Guide:** `docs/guides/security.md`
- **Security Checklist:** `docs/guides/security-checklist.md`
- **Report Template:** `docs/security-audits/report-template.md`
- **Rapid Dev Workflow:** `.claude/rapid-dev-workflow.md` (for implementing fixes)

---

## Quick Reference

### Run Full Audit
```
Perform comprehensive security audit following .claude/security-audit-agent-prompt.md
```

### Run Focused Audit
```
Audit [AREA] following .claude/security-audit-agent-prompt.md
```

### Re-audit After Fixes
```
Re-audit previously identified issues: [list issues]
```

### Pre-deployment Check
```
Pre-production security audit - check OWASP Top 10 and all 65 checklist items
```

---

**Remember:** The security audit agent is your security analyst. It finds problems, you (or the rapid-dev agent) fix them. This separation ensures unbiased security assessment.

---

**Last Updated:** 2025-10-24
**Next Review:** After first production deployment
