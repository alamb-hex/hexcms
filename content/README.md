# Content Repository

This directory contains all content for heXcms in Markdown format with YAML frontmatter.

## Directory Structure

```
content/
├── posts/           # Blog posts
├── authors/         # Author profiles
├── pages/           # Static pages
└── templates/       # Content templates
```

## Quick Start

### Creating a New Post

1. **Create the file** with date-slug format:
   ```bash
   touch content/posts/2024-01-15-my-new-post.md
   ```

2. **Add frontmatter** (required fields):
   ```yaml
   ---
   title: "My New Post"
   author: "john-doe"
   publishedAt: "2024-01-15"
   tags: ["nextjs", "tutorial"]
   status: "draft"
   ---
   ```

3. **Write content** in Markdown below the frontmatter

4. **Commit and push**:
   ```bash
   git add content/posts/2024-01-15-my-new-post.md
   git commit -m "Add: My new post"
   git push
   ```

### Creating a New Author

1. **Create the file**:
   ```bash
   touch content/authors/jane-smith.md
   ```

2. **Add frontmatter**:
   ```yaml
   ---
   name: "Jane Smith"
   email: "jane@example.com"
   bio: "Software engineer and technical writer"
   avatar: "/images/authors/jane-smith.jpg"
   social:
     twitter: "janesmith"
     github: "janesmith"
   ---
   ```

3. **Commit and push**

### Creating a New Page

1. **Create the file**:
   ```bash
   touch content/pages/contact.md
   ```

2. **Add frontmatter and content**:
   ```yaml
   ---
   title: "Contact Us"
   slug: "contact"
   status: "published"
   ---

   # Contact Us

   Your content here...
   ```

3. **Commit and push**

## File Naming Conventions

### Posts
- Format: `YYYY-MM-DD-slug.md`
- Examples:
  - `2024-01-15-hello-world.md`
  - `2024-02-20-nextjs-tutorial.md`

### Authors
- Format: `author-slug.md`
- Examples:
  - `john-doe.md`
  - `jane-smith.md`

### Pages
- Format: `page-slug.md`
- Examples:
  - `about.md`
  - `contact.md`
  - `privacy-policy.md`

## Frontmatter Fields

### Posts

**Required:**
- `title` - Post title (string)
- `author` - Author slug (string)
- `publishedAt` - Publication date YYYY-MM-DD (string)

**Optional:**
- `excerpt` - Short summary (string)
- `updatedAt` - Last update date (string)
- `featuredImage` - Hero image path (string)
- `tags` - Array of tag slugs (array)
- `status` - "draft", "published", or "archived" (default: "draft")
- `metaDescription` - SEO description (string, max 160 chars)
- `metaKeywords` - SEO keywords (array)

### Authors

**Required:**
- `name` - Full name (string)

**Optional:**
- `email` - Email address (string)
- `bio` - Biography (string)
- `avatar` - Profile image path (string)
- `social` - Social media links (object)
  - `twitter` - Username (string)
  - `github` - Username (string)
  - `linkedin` - Username (string)
  - `website` - URL (string)

### Pages

**Required:**
- `title` - Page title (string)

**Optional:**
- `slug` - URL slug (defaults to filename)
- `status` - "draft" or "published" (default: "draft")
- `publishedAt` - Publication date (string)
- `metaDescription` - SEO description (string)

## Markdown Features

### Supported Syntax

- **Headers**: `# H1` through `###### H6`
- **Emphasis**: `*italic*`, `**bold**`, `~~strikethrough~~`
- **Lists**: Ordered and unordered
- **Links**: `[text](url)`
- **Images**: `![alt](/path/to/image.jpg)`
- **Code blocks**: Triple backticks with language
- **Blockquotes**: `> Quote`
- **Tables**: GitHub Flavored Markdown tables
- **Task lists**: `- [ ]` and `- [x]`

### Code Syntax Highlighting

Specify the language for syntax highlighting:

````markdown
```typescript
const greeting: string = "Hello, World!";
console.log(greeting);
```
````

Supported languages: javascript, typescript, python, bash, html, css, json, yaml, and many more.

## Templates

Use the templates in `content/templates/` as starting points:

- **post-template.md** - Blog post structure
- **author-template.md** - Author profile structure

Copy and customize these templates for new content.

## Content Guidelines

### Writing Style

1. **Be clear and concise**
   - Short paragraphs (3-4 sentences)
   - Simple language
   - Define technical terms

2. **Use headers effectively**
   - H1: Post title (only one)
   - H2: Main sections
   - H3: Subsections

3. **Include examples**
   - Code snippets for technical content
   - Real-world use cases
   - Screenshots or diagrams

4. **Add links**
   - Link to related posts
   - Reference external resources
   - Use descriptive link text (not "click here")

### SEO Best Practices

- **Title**: 50-60 characters, include primary keyword
- **Excerpt**: 120-160 characters, summarize the post
- **Meta Description**: 150-160 characters, include call-to-action
- **Tags**: Use 3-5 relevant tags per post
- **Images**: Include descriptive alt text

## Images

### Location

Store images in the `public/images/` directory:

```
public/images/
├── posts/
│   └── my-post-image.jpg
└── authors/
    └── author-avatar.jpg
```

### Reference in Markdown

```markdown
![Description](/images/posts/my-post-image.jpg)
```

### Recommended Sizes

- **Featured images**: 1200x630px (JPG/WebP)
- **Inline images**: Max 800px wide (JPG/PNG/WebP)
- **Author avatars**: 400x400px (JPG/PNG)

### Optimization

- Compress images before uploading
- Use WebP format when possible
- Keep file sizes under 500KB
- Use descriptive alt text

## Validation

### Frontmatter Validation

Run the validation script to check frontmatter:

```bash
npm run validate:content
```

This checks:
- Required fields are present
- Field types are correct
- Dates are in YYYY-MM-DD format
- Status values are valid
- Tag references exist

### Markdown Linting

Check markdown quality:

```bash
npm run lint:md
```

## Common Issues

### Frontmatter Not Parsing

**Problem**: Missing closing `---`

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

### Images Not Displaying

**Problem**: Incorrect path

```markdown
❌ Wrong: ![Image](./images/photo.jpg)
✅ Correct: ![Image](/images/posts/photo.jpg)
```

### Special Characters in Frontmatter

**Problem**: Unescaped quotes

```markdown
❌ Wrong:
title: My Post "With Quotes"

✅ Correct:
title: "My Post \"With Quotes\""
# or
title: 'My Post "With Quotes"'
```

## Sync Process

When you commit and push changes:

1. **GitHub webhook** fires on push
2. **Sync API** receives the webhook
3. **Parser** processes changed Markdown files
4. **Database** updates with new/changed content
5. **Next.js** revalidates affected pages

Changes appear live within seconds!

## Getting Help

- **Documentation**: See `/docs/reference/content-format.md` for detailed format guide
- **Examples**: Check existing posts in `content/posts/`
- **Templates**: Use templates in `content/templates/`
- **Issues**: Report problems on GitHub Issues

## Contributing

We welcome content contributions! Please:

1. Follow the naming conventions
2. Use the templates provided
3. Validate frontmatter before committing
4. Write clear, concise content
5. Include code examples for technical posts
6. Optimize images before uploading

See `CONTRIBUTING.md` for full guidelines.

---

Happy writing! 🚀
