---
title: "Hello World: Welcome to heXcms"
excerpt: "Welcome to heXcms, a Git-based headless CMS with database sync for blazing-fast builds. Learn about the features and get started."
author: "john-doe"
publishedAt: "2024-01-15"
featuredImage: "/images/posts/hello-world.jpg"
tags: ["nextjs", "typescript", "web-development"]
status: "published"
metaDescription: "Introduction to heXcms - a modern Git-based CMS with PostgreSQL sync for fast, scalable content management"
metaKeywords: ["hexcms", "headless cms", "nextjs", "git-based cms"]
---

# Hello World: Welcome to heXcms

Welcome to heXcms, a modern approach to content management that combines the best of Git-based workflows with the power of database-driven queries.

## What is heXcms?

heXcms is a headless CMS built on Next.js that syncs content from Git repositories to a PostgreSQL database. This hybrid approach gives you:

- **Developer-friendly workflows** - Content as code, version controlled in Git
- **Lightning-fast queries** - Database-powered search and filtering
- **Scalable architecture** - Handle thousands of posts without build-time bottlenecks
- **Type-safe** - Full TypeScript support throughout

## Key Features

### 1. Git-Based Content

Store your content in Markdown files with YAML frontmatter:

```markdown
---
title: "My First Post"
author: "john-doe"
publishedAt: "2024-01-15"
tags: ["tutorial"]
---

# My First Post

Your content here...
```

### 2. Database Sync

Every Git commit triggers a webhook that syncs changes to PostgreSQL:

- **Fast queries** - No need to parse hundreds of Markdown files
- **Full-text search** - Powered by PostgreSQL's tsvector
- **Relations** - Authors, tags, and posts all properly linked
- **Analytics** - Track views, reading time, and more

### 3. Next.js 14 App Router

Built on the latest Next.js features:

- React Server Components for optimal performance
- Streaming for instant page loads
- Built-in caching and revalidation
- TypeScript from the ground up

## Getting Started

To create your first post:

1. Create a new Markdown file in `content/posts/`
2. Add frontmatter with required fields
3. Write your content in Markdown
4. Commit and push to trigger sync

```bash
# Create a new post
touch content/posts/2024-01-15-my-first-post.md

# Edit the file with your favorite editor
vim content/posts/2024-01-15-my-first-post.md

# Commit and push
git add content/posts/2024-01-15-my-first-post.md
git commit -m "Add: My first post"
git push
```

The webhook will automatically sync your content to the database, and it will be live on your site within seconds!

## What's Next?

In upcoming posts, we'll explore:

- Advanced Markdown features and syntax highlighting
- Using tags and categories effectively
- Optimizing images for performance
- Implementing search functionality
- Deploying to production

Stay tuned for more tutorials and guides!

## Contributing

heXcms is open source! If you'd like to contribute:

1. Check out the [GitHub repository](https://github.com/yourusername/hexcms)
2. Read the [Contributing Guide](https://github.com/yourusername/hexcms/blob/main/CONTRIBUTING.md)
3. Submit issues or pull requests

We're excited to see what you build with heXcms!

## Conclusion

heXcms combines the best aspects of static site generators and traditional CMSs. You get the content-as-code workflow developers love with the query performance and flexibility of a database-backed system.

Try it out and let us know what you think!
