# Rapid Development Agent Workflow

## Overview

This document outlines the rapid development workflow using Claude's Haiku 4.5 model for fast, efficient coding tasks in the heXcms project.

## What is the Rapid Development Agent?

The Rapid Development Agent is a specialized workflow that leverages Claude Haiku 4.5 for:
- **Speed**: Haiku 4.5 executes tasks faster than larger models
- **Sequential Execution**: Tasks are completed one after another in order
- **Hybrid Input**: Reads tasks from both project files AND direct user instructions
- **Code-Focused**: Optimized for implementation, not planning or research

## When to Use This Agent

### Best Use Cases
- Implementing well-defined features
- Writing boilerplate code
- Creating API endpoints
- Building UI components
- Writing tests
- Refactoring based on clear specifications

### Not Recommended For
- Complex architectural decisions (use Sonnet 4.5 instead)
- Initial project planning
- Deep research tasks
- Multi-file complex refactoring requiring careful analysis

## How to Use

### 1. Define Tasks in project-tasks.md

Create or update the `project-tasks.md` file with your sequential tasks:

```markdown
# Current Sprint Tasks

## Priority 1: User Authentication
- [ ] Create user model with SQLite schema
- [ ] Implement login API endpoint
- [ ] Add JWT token generation
- [ ] Create middleware for auth protection

## Priority 2: Content Management
- [ ] Create article CRUD endpoints
- [ ] Implement markdown parsing
- [ ] Add image upload functionality
```

### 2. Invoke the Agent

Use Claude Code's Task tool to launch a rapid development agent:

```
I need you to launch a rapid development agent using the Task tool with subagent_type=general-purpose.

Here's the agent prompt:

[Use the template from .claude/rapid-dev-agent-prompt.md]

Additional tasks:
- [Any extra tasks beyond what's in project-tasks.md]
```

### 3. Monitor Progress

The agent will:
1. Read tasks from project-tasks.md
2. Execute each task sequentially
3. Use TodoWrite to track progress
4. Report completion and any issues

## Model Configuration

### Using Haiku 4.5

The agent should be instructed to use **claude-haiku-4-5** for rapid execution. While you cannot directly specify the model in the Task tool invocation, you should:

1. Mention in the agent prompt that speed is prioritized
2. Keep tasks focused and well-defined
3. Provide clear specifications to minimize back-and-forth

### When to Switch Models

If the agent encounters complex issues:
- The agent should flag the issue
- You can take over with Sonnet 4.5 for complex analysis
- Resume with Haiku 4.5 for implementation after planning

## Task Structure Best Practices

### Good Task Format
```markdown
- [ ] Create user authentication endpoint
  - POST /api/auth/login
  - Accept email/password
  - Return JWT token
  - Handle invalid credentials with 401
```

### Poor Task Format
```markdown
- [ ] Make the auth system work better
```

### Task Granularity
- **Too Large**: "Build entire authentication system"
- **Just Right**: "Create login endpoint with JWT generation"
- **Too Small**: "Import jwt library"

## Sequential Task Execution

Tasks should be ordered with dependencies in mind:

```markdown
1. Database schema setup
2. Model creation
3. Repository/data access layer
4. Business logic layer
5. API endpoints
6. Frontend integration
7. Tests
```

## Example Workflow

### Step 1: Planning (You or Sonnet 4.5)
- Review requirements
- Break down into tasks
- Add to project-tasks.md

### Step 2: Rapid Development (Haiku 4.5 Agent)
```
Launch rapid dev agent with:
- Read and execute all Priority 1 tasks from project-tasks.md
- Focus on the user authentication module
- Implement each endpoint with error handling
- Create basic tests for each endpoint
```

### Step 3: Review and Iterate
- Review the agent's output
- Test the implementation
- Add refinement tasks if needed

## Integration with Existing Docs

This workflow complements the existing heXcms documentation:

- **ARCHITECTURE.md**: Reference when planning task structure
- **API.md**: Use specifications when implementing endpoints
- **DATABASE.md**: Follow schema patterns when creating models
- **TECH_STACK.md**: Ensure consistency with technology choices

## Tips for Success

1. **Clear Specifications**: The clearer your task descriptions, the faster Haiku 4.5 executes
2. **Sequential Dependencies**: Order tasks so each builds on the previous
3. **Batch Similar Work**: Group similar tasks together (all models, then all endpoints)
4. **Quick Iterations**: Use Haiku for implementation, review, then iterate
5. **Fallback to Sonnet**: If Haiku struggles, switch to Sonnet for that specific task

## Agent Prompt Template

See `.claude/rapid-dev-agent-prompt.md` for the full prompt template to use when invoking the rapid development agent.

## Troubleshooting

### Agent is Too Slow
- Tasks might be too complex for Haiku
- Break them into smaller pieces
- Consider using Sonnet for initial pass

### Agent Misunderstands Tasks
- Add more detail to project-tasks.md
- Include code examples or references
- Specify exact file locations

### Agent Skips Tasks
- Ensure tasks are clearly marked as incomplete
- Check task dependencies are met
- Verify all required files/setup exists

## Related Agents

### Security Audit Agent

The **Security Audit Agent** is a complementary agent for security analysis:

- **Purpose:** Read-only security audits and vulnerability scanning
- **Use case:** Before deployment, quarterly reviews, post-incident analysis
- **Workflow:** See `.claude/security-audit-workflow.md`

**Workflow Integration:**
1. Use **Rapid Dev Agent** to implement features
2. Use **Security Audit Agent** to find vulnerabilities
3. Use **Rapid Dev Agent** to implement security fixes
4. Use **Security Audit Agent** to verify fixes

**Key Difference:**
- Rapid Dev Agent: Makes code changes, implements features
- Security Audit Agent: NO code changes, only analysis and reports

---

## Version History

- v1.1 (2025-10-24): Added security audit agent reference
- v1.0 (2025-10-23): Initial rapid development workflow established
