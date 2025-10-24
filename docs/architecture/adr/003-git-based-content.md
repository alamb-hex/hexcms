# ADR-003: Git-Based Content Management

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** heXcms Core Team

## Context

We need to define how content authors will create, edit, and manage content in heXcms. The content management approach must support:

- Developer-friendly workflows (version control, code review)
- Content versioning and history
- Collaboration between multiple authors
- Rollback capabilities
- Offline editing
- Markdown-based content with frontmatter
- Integration with modern development workflows

Key requirements:
- Content is treated as code
- Full version history with Git commits
- Ability to work offline
- Pull request-based review workflow
- Easy to backup and restore
- No vendor lock-in
- Works with standard development tools

Options considered:
1. Traditional web-based admin panel (WordPress-style)
2. Git-based workflow (content in repository)
3. Headless CMS API (Contentful, Sanity)
4. Hybrid approach (Git + admin panel)

## Decision

We will use a **Git-based content management approach** where content is stored as Markdown files in a Git repository.

Specifically:
- Content stored in a `content/` directory in a Git repository
- Markdown files with YAML frontmatter
- GitHub/GitLab/Gitea webhooks for sync triggers
- Standard Git workflows (branch, commit, PR, merge)
- Optional future: Web-based editor that commits to Git behind the scenes

## Consequences

### Positive

- **Version control**: Full history of every change with Git commits
- **Collaboration**: Pull requests enable review before publishing
- **Developer-friendly**: Use any text editor (VS Code, Vim, Obsidian)
- **Offline capable**: Work on content without internet connection
- **Rollback**: Easily revert to any previous version
- **Backup**: Git serves as distributed backup system
- **Code review**: Apply software engineering practices to content
- **No vendor lock-in**: Content is portable Markdown files
- **Branching**: Work on multiple drafts simultaneously
- **Diffing**: See exactly what changed between versions
- **Automation**: CI/CD pipelines can validate content
- **Free hosting**: GitHub/GitLab host repositories for free

### Negative

- **Learning curve**: Non-technical authors need to learn Git basics
- **No WYSIWYG**: Markdown editing instead of visual editor
- **Setup complexity**: Requires repository setup and webhook configuration
- **Conflict resolution**: Merge conflicts need manual resolution
- **Image management**: Binary files in Git can bloat repository
- **Immediate feedback**: Changes aren't live until committed and synced

### Risks

- **User adoption**: Non-technical users may struggle with Git/Markdown
- **Repository size**: Large images can make cloning slow
- **Webhook reliability**: Webhooks can fail silently
- **Sync delays**: Content isn't live immediately (webhook + sync processing)
- **Private repositories**: GitHub charges for private repos (though GitLab/Gitea are free)

## Alternatives Considered

### Alternative 1: Traditional Admin Panel

- **Pros:**
  - Familiar to non-technical users (WordPress-like)
  - WYSIWYG editing
  - Immediate preview
  - No Git knowledge required
  - Built-in media management
- **Cons:**
  - Need to build and maintain admin UI
  - No version control unless implemented separately
  - Requires authentication and authorization system
  - Content stored in database (less portable)
  - No code review workflow
  - Vendor lock-in
- **Reason for rejection:** Building a full admin panel is a large undertaking. Git provides version control and collaboration for free. We can add a web editor later that commits to Git behind the scenes.

### Alternative 2: Headless CMS API (Contentful, Sanity)

- **Pros:**
  - Managed service (no infrastructure)
  - Rich editing interfaces
  - Built-in media management
  - APIs for content delivery
  - Version control included
- **Cons:**
  - Monthly costs scale with usage
  - Vendor lock-in (content export is painful)
  - API-dependent (no offline editing)
  - Rate limits and quotas
  - Complex pricing tiers
  - Content not in version control alongside code
- **Reason for rejection:** We want content to live alongside code in Git. Open source and self-hostable is a core principle. Monthly costs for hosted CMSs can be expensive.

### Alternative 3: File System Only (No Git)

- **Pros:**
  - Simple: just write Markdown files
  - No Git complexity
  - Fast local development
- **Cons:**
  - No version history
  - No collaboration workflow
  - No rollback capability
  - No distributed backup
  - Changes can be lost
- **Reason for rejection:** Version control is essential. Git provides this for free with decades of tooling and best practices.

### Alternative 4: Hybrid Approach (Git + Admin Panel)

- **Pros:**
  - Best of both worlds
  - Technical users use Git, others use admin panel
  - Admin panel commits to Git behind the scenes
  - Version control for all changes
- **Cons:**
  - Most complex to implement
  - Two systems to maintain
  - Potential conflicts between direct Git commits and admin panel
  - Authentication system needed
  - Significant development effort
- **Reason for rejection:** Start simple with Git-only. We can add a web editor later (Phase 3 in roadmap) that commits to Git. This keeps Phase 1 focused.

## Implementation Notes

### Directory Structure

```
content/
├── posts/
│   ├── 2024-01-15-hello-world.md
│   ├── 2024-01-20-getting-started.md
│   └── 2024-02-01-advanced-features.md
├── authors/
│   ├── john-doe.md
│   └── jane-smith.md
└── pages/
    ├── about.md
    └── contact.md
```

### Content Format

Markdown with YAML frontmatter:

```markdown
---
title: "Getting Started with heXcms"
author: "john-doe"
publishedAt: "2024-01-15"
tags: ["tutorial", "nextjs"]
status: "published"
---

# Getting Started with heXcms

Your content here...
```

### Workflow

1. **Create content**: Write Markdown file locally
2. **Commit**: `git add` and `git commit`
3. **Push**: `git push` to trigger webhook
4. **Sync**: Webhook triggers database sync
5. **Live**: Content appears on site within seconds

### Pull Request Workflow

For team collaboration:

1. **Create branch**: `git checkout -b post/new-feature`
2. **Write content**: Create/edit Markdown files
3. **Commit**: `git commit -m "Add: New feature post"`
4. **Open PR**: Create pull request for review
5. **Review**: Team reviews content and suggests changes
6. **Merge**: After approval, merge to main
7. **Auto-sync**: Merge to main triggers webhook and publish

### GitHub Actions Validation

Validate content on PR:

```yaml
name: Validate Content
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate frontmatter
        run: npm run validate:content
      - name: Lint markdown
        run: npm run lint:md
```

### Future Enhancements

**Phase 2:**
- Web-based Markdown editor (commits to Git)
- Image upload service (optimizes and commits)
- Content preview before merge

**Phase 3:**
- WYSIWYG editor option (still commits Markdown)
- Visual media library
- Scheduled publishing

All enhancements will commit to Git to maintain version control benefits.

## References

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Frontmatter](https://jekyllrb.com/docs/front-matter/)
- [Obsidian](https://obsidian.md/) - Great Markdown editor
- [VS Code](https://code.visualstudio.com/) - Popular editor with Markdown support

---

**Related ADRs:**
- [ADR-005: Database Sync Strategy](./005-database-sync-strategy.md)
