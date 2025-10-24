---
title: "About heXcms"
slug: "about"
status: "published"
publishedAt: "2024-01-01"
metaDescription: "Learn about heXcms, a Git-based headless CMS with database sync for modern web applications"
---

# About heXcms

heXcms is a modern, Git-based headless CMS designed for developers who want the best of both worlds: the simplicity of content-as-code and the power of database-driven queries.

## Our Mission

We believe content management should be:

- **Simple** - Content stored as Markdown files in Git
- **Fast** - Database queries instead of build-time parsing
- **Flexible** - Headless architecture works with any frontend
- **Type-safe** - Full TypeScript support throughout

## How It Works

heXcms bridges Git and databases through a smart sync system:

1. **Content in Git** - Writers and developers edit Markdown files in their favorite tools
2. **Webhook Sync** - Every commit triggers an automatic sync to PostgreSQL
3. **Fast Queries** - The Next.js app queries the database for instant results
4. **Full-Text Search** - Built-in search powered by PostgreSQL's advanced capabilities

## Technology Stack

heXcms is built with modern, battle-tested technologies:

### Core Framework
- **Next.js 14** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type safety throughout

### Database & Search
- **PostgreSQL 16** - Robust relational database
- **Full-Text Search** - Native PostgreSQL tsvector search
- **Vercel Postgres** - Managed PostgreSQL for production

### Content Processing
- **gray-matter** - Frontmatter parsing
- **unified/remark/rehype** - Markdown processing pipeline
- **remark-gfm** - GitHub Flavored Markdown support
- **rehype-highlight** - Syntax highlighting

### Development & Quality
- **Vitest** - Fast unit testing
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Zod** - Runtime schema validation

## Use Cases

heXcms is perfect for:

- **Developer Blogs** - Technical content with code examples
- **Documentation Sites** - Versioned docs stored in Git
- **Marketing Sites** - Fast, SEO-friendly content pages
- **Knowledge Bases** - Searchable articles and guides
- **Multi-Author Publications** - Team collaboration through Git

## Open Source

heXcms is open source and available under the MIT License. We welcome contributions from the community!

- **GitHub**: [github.com/yourusername/hexcms](https://github.com/yourusername/hexcms)
- **Documentation**: [hexcms.dev/docs](https://hexcms.dev/docs)
- **Community**: [Discord](https://discord.gg/hexcms)

## The Team

heXcms is built by developers who love Git, databases, and great developer experiences. We're committed to creating tools that make content management simple and enjoyable.

## Get Started

Ready to try heXcms?

1. Clone the repository
2. Set up your PostgreSQL database
3. Configure environment variables
4. Create your first content
5. Deploy to Vercel

Check out our [Getting Started Guide](/docs/guides/getting-started.md) for detailed instructions.

## Contact

Have questions or feedback? Reach out:

- **Email**: hello@hexcms.dev
- **Twitter**: [@hexcms](https://twitter.com/hexcms)
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/hexcms/issues)

We'd love to hear from you!
