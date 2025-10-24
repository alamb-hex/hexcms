# Content Format Guide

## Overview

This CMS uses Markdown files with YAML frontmatter for content management. Content is organized into posts, authors, and pages.

---

## Directory Structure

```
content/
├── posts/
│   ├── 2024-01-15-getting-started-nextjs.md
│   ├── 2024-01-20-react-best-practices.md
│   └── 2024-02-01-typescript-tips.md
├── authors/
│   ├── john-doe.md
│   └── jane-smith.md
└── pages/
    ├── about.md
    └── contact.md
```

---

## File Naming Conventions

### Posts
Format: `YYYY-MM-DD-slug.md`

**Examples:**
- `2024-01-15-hello-world.md`
- `2024-02-20-nextjs-14-features.md`
- `2024-03-01-typescript-5-release.md`

**Rules:**
- Date format: YYYY-MM-DD
- Slug: lowercase, hyphen-separated
- Extension: `.md`

### Authors
Format: `author-slug.md`

**Examples:**
- `john-doe.md`
- `jane-smith.md`
- `alex-chen.md`

### Pages
Format: `page-slug.md`

**Examples:**
- `about.md`
- `contact.md`
- `privacy-policy.md`

---

## Post Format

### Complete Example

```markdown
---
title: "Getting Started with Next.js 14"
excerpt: "A comprehensive guide to the latest features in Next.js 14, including App Router, Server Components, and more."
author: "john-doe"
publishedAt: "2024-01-15"
updatedAt: "2024-01-20"
featuredImage: "/images/posts/nextjs-14.jpg"
tags: ["nextjs", "react", "web-development"]
status: "published"
metaDescription: "Learn about Next.js 14 features including App Router and Server Components"
metaKeywords: ["nextjs", "react", "server components", "app router"]
---

# Getting Started with Next.js 14

Next.js 14 introduces several exciting features that make building modern web applications even easier.

## Server Components

Server Components are a game-changer...

## App Router

The new App Router provides...

## Conclusion

Next.js 14 is a powerful release that...
```

### Frontmatter Fields

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Post title | "Getting Started with Next.js 14" |
| `author` | string | Author slug | "john-doe" |
| `publishedAt` | string | Publication date (YYYY-MM-DD) | "2024-01-15" |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `excerpt` | string | Short summary | "A comprehensive guide to..." |
| `updatedAt` | string | Last update date | "2024-01-20" |
| `featuredImage` | string | Hero image URL | "/images/posts/hero.jpg" |
| `tags` | array | List of tag slugs | ["nextjs", "react"] |
| `status` | string | Publication status | "published", "draft" |
| `metaDescription` | string | SEO description | "Learn about Next.js 14..." |
| `metaKeywords` | array | SEO keywords | ["nextjs", "react"] |

### Status Values

- `draft` - Not published, only visible in preview mode
- `published` - Live and visible to all users
- `archived` - Removed from listings but URL still accessible

### Default Values

If not specified:
- `status`: "draft"
- `publishedAt`: File creation date
- `updatedAt`: File modification date
- `excerpt`: First 160 characters of content

---

## Author Format

### Complete Example

```markdown
---
name: "John Doe"
email: "john@example.com"
avatar: "/images/authors/john-doe.jpg"
bio: "Full-stack developer passionate about web technologies and open source. Writing about React, Next.js, and TypeScript."
social:
  twitter: "johndoe"
  github: "johndoe"
  linkedin: "johndoe"
  website: "https://johndoe.com"
---
```

### Frontmatter Fields

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Full name | "John Doe" |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `email` | string | Email address | "john@example.com" |
| `bio` | string | Author biography | "Full-stack developer..." |
| `avatar` | string | Profile image URL | "/images/authors/john.jpg" |
| `social` | object | Social media links | See example above |

### Social Links

Supported platforms:
- `twitter` - Twitter/X username (without @)
- `github` - GitHub username
- `linkedin` - LinkedIn username/slug
- `website` - Personal website URL
- `youtube` - YouTube channel URL
- `instagram` - Instagram username

---

## Page Format

### Complete Example

```markdown
---
title: "About Us"
slug: "about"
status: "published"
publishedAt: "2024-01-01"
updatedAt: "2024-01-15"
metaDescription: "Learn more about our team and mission"
---

# About Us

We are a team of passionate developers...

## Our Mission

To create amazing content...

## Our Team

Meet the people behind the blog...
```

### Frontmatter Fields

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Page title | "About Us" |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `slug` | string | URL slug (defaults to filename) | "about" |
| `status` | string | Publication status | "published" |
| `publishedAt` | string | Publication date | "2024-01-01" |
| `updatedAt` | string | Last update date | "2024-01-15" |
| `metaDescription` | string | SEO description | "Learn more about..." |

---

## Markdown Features

### Supported Syntax

#### Headers

```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

#### Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic*** or ___bold italic___
~~strikethrough~~
```

#### Lists

```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
   1. Nested item
```

#### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
```

#### Images

```markdown
![Alt text](/images/example.jpg)
![Alt text](/images/example.jpg "Image title")
```

#### Code

Inline code: \`const x = 10;\`

Code blocks:
````markdown
```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

#### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

#### Horizontal Rule

```markdown
---
```

#### Tables (GitHub Flavored Markdown)

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

#### Task Lists (GitHub Flavored Markdown)

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

---

## Advanced Features

### Code Syntax Highlighting

Specify language for syntax highlighting:

````markdown
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
```
````

Supported languages:
- javascript, typescript
- python, ruby, php
- html, css, scss
- json, yaml
- bash, shell
- sql
- And many more...

### Automatic Features

The CMS automatically generates:
- **Reading Time** - Based on word count
- **Table of Contents** - From headers (H2, H3)
- **Heading IDs** - For anchor links
- **Heading Links** - Click to copy link

---

## Image Guidelines

### Image Paths

Store images in:
```
public/
└── images/
    ├── posts/
    │   ├── featured-image.jpg
    │   └── inline-image.png
    └── authors/
        └── avatar.jpg
```

Reference in markdown:
```markdown
![Description](/images/posts/featured-image.jpg)
```

### Recommended Sizes

| Type | Dimensions | Format |
|------|------------|--------|
| Featured Image | 1200x630px | JPG/WebP |
| Inline Image | Max 800px wide | JPG/PNG/WebP |
| Author Avatar | 400x400px | JPG/PNG |

### Optimization Tips

1. Compress images before uploading
2. Use WebP format when possible
3. Use descriptive alt text
4. Keep file sizes under 500KB

---

## SEO Best Practices

### Title
- Length: 50-60 characters
- Include primary keyword
- Make it compelling
- Example: "Getting Started with Next.js 14 - Complete Guide"

### Excerpt
- Length: 120-160 characters
- Summarize the post
- Include keywords naturally
- Example: "Learn Next.js 14's new features including App Router, Server Components, and streaming. A comprehensive guide for developers."

### Meta Description
- Length: 150-160 characters
- Unique for each post
- Include call-to-action
- Example: "Discover Next.js 14's powerful features in this complete guide. Learn about App Router, Server Components, and more. Start building today!"

### Tags
- Use 3-5 relevant tags per post
- Be consistent with tag names
- Use lowercase slugs
- Example: ["nextjs", "react", "web-development", "javascript"]

---

## Content Guidelines

### Writing Style

1. **Be Clear and Concise**
   - Use short paragraphs (3-4 sentences)
   - Avoid jargon when possible
   - Define technical terms

2. **Use Headers Effectively**
   - H1: Post title (only one)
   - H2: Main sections
   - H3: Subsections
   - H4+: Rarely needed

3. **Include Examples**
   - Code examples for technical posts
   - Real-world use cases
   - Screenshots or diagrams

4. **Add Links**
   - Link to related posts
   - Reference external resources
   - Use descriptive link text

### Formatting Tips

```markdown
# Good Example

## Introduction

This post covers three main topics:

1. Server Components
2. App Router
3. Data Fetching

Let's start with Server Components.

## Server Components

Server Components allow you to...

### Benefits

The main advantages are...

```

---

## Validation

### Frontmatter Schema (Zod)

```typescript
import { z } from 'zod';

export const postFrontmatterSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  author: z.string(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  featuredImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export const authorFrontmatterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  social: z.object({
    twitter: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
});
```

---

## Migration Guide

### From WordPress

Export posts to markdown using plugins like:
- wordpress-export-to-markdown
- exitwp

Then adjust frontmatter format.

### From Medium

Use medium-to-markdown or similar tools.

### From Other Markdown-based Systems

Map frontmatter fields:
```
Jekyll/Hugo → This CMS
date → publishedAt
categories → tags
author.name → author (slug)
```

---

## Templates

### Blog Post Template

```markdown
---
title: "[Post Title]"
excerpt: "[Brief summary in 1-2 sentences]"
author: "[author-slug]"
publishedAt: "YYYY-MM-DD"
featuredImage: "/images/posts/[image-name].jpg"
tags: ["tag1", "tag2", "tag3"]
status: "draft"
---

# [Post Title]

[Introduction paragraph - hook the reader]

## [Main Section 1]

[Content for section 1]

## [Main Section 2]

[Content for section 2]

## Conclusion

[Wrap up and call to action]
```

### Tutorial Template

```markdown
---
title: "How to [Do Something]"
excerpt: "Learn how to [accomplish task] step by step"
author: "[author-slug]"
publishedAt: "YYYY-MM-DD"
tags: ["tutorial", "technology"]
status: "draft"
---

# How to [Do Something]

## What You'll Learn

- Point 1
- Point 2
- Point 3

## Prerequisites

- Requirement 1
- Requirement 2

## Step 1: [First Step]

[Instructions]

```language
[code example]
```

## Step 2: [Second Step]

[Instructions]

## Conclusion

[Summary and next steps]
```

---

## Common Issues

### Issue: Frontmatter Not Parsing

**Problem:** Missing closing `---`

```markdown
❌ Wrong:
---
title: "My Post"

# Content starts here
```

```markdown
✅ Correct:
---
title: "My Post"
---

# Content starts here
```

### Issue: Images Not Displaying

**Problem:** Incorrect path

```markdown
❌ Wrong: ![Image](./images/photo.jpg)
✅ Correct: ![Image](/images/posts/photo.jpg)
```

### Issue: Special Characters in Frontmatter

**Problem:** Unescaped quotes

```markdown
❌ Wrong:
title: My Post "With Quotes"

✅ Correct:
title: "My Post \"With Quotes\""
# or
title: 'My Post "With Quotes"'
```

---

## Tools & Editors

### Recommended Editors

1. **VS Code** - Best overall
   - Extensions: Markdown All in One, Markdown Preview
   
2. **Obsidian** - Great for content organization
   
3. **Typora** - WYSIWYG markdown editor

4. **Google Docs** - Export as markdown using add-ons

### Markdown Linters

```bash
# Install markdownlint
npm install -D markdownlint-cli2

# Add to package.json
"scripts": {
  "lint:md": "markdownlint-cli2 \"content/**/*.md\""
}
```

### Frontmatter Validation Script

```typescript
// scripts/validate-frontmatter.ts
import { glob } from 'glob';
import matter from 'gray-matter';
import { postFrontmatterSchema } from './schemas';

const files = glob.sync('content/posts/**/*.md');

files.forEach(file => {
  const { data } = matter.read(file);
  try {
    postFrontmatterSchema.parse(data);
    console.log(`✓ ${file}`);
  } catch (error) {
    console.error(`✗ ${file}:`, error.errors);
  }
});
```
