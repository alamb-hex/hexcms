/**
 * Tests for Markdown Processing Utilities
 *
 * This test suite validates all markdown parsing, rendering, and utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  parseMarkdownFile,
  parsePostFrontmatter,
  parseAuthorFrontmatter,
  parsePageFrontmatter,
  markdownToHtml,
  calculateReadingTime,
  extractExcerpt,
  extractTableOfContents,
  slugify,
} from './markdown';

// ===========================================================================
// Frontmatter Parsing Tests
// ===========================================================================

describe('parseMarkdownFile', () => {
  it('should parse frontmatter and content', () => {
    const content = `---
title: "Test Post"
author: "john-doe"
---

This is the content.`;

    const result = parseMarkdownFile(content);

    expect(result.data).toEqual({
      title: 'Test Post',
      author: 'john-doe',
    });
    expect(result.content).toBe('\nThis is the content.');
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---

Content only`;

    const result = parseMarkdownFile(content);

    expect(result.data).toEqual({});
    expect(result.content).toBe('\nContent only');
  });

  it('should handle content without frontmatter', () => {
    const content = 'Just plain content';

    const result = parseMarkdownFile(content);

    expect(result.data).toEqual({});
    expect(result.content).toBe('Just plain content');
  });

  it('should parse complex frontmatter with arrays and nested objects', () => {
    const content = `---
title: "Complex Post"
tags:
  - javascript
  - typescript
metadata:
  readingTime: 5
  difficulty: intermediate
---

Content here`;

    const result = parseMarkdownFile(content);

    expect(result.data).toEqual({
      title: 'Complex Post',
      tags: ['javascript', 'typescript'],
      metadata: {
        readingTime: 5,
        difficulty: 'intermediate',
      },
    });
  });
});

describe('parsePostFrontmatter', () => {
  it('should parse valid post frontmatter', () => {
    const content = `---
title: "Test Post"
author: "john-doe"
publishedAt: "2024-01-15"
tags: ["test", "markdown"]
---

Post content here`;

    const result = parsePostFrontmatter(content);

    expect(result.data.title).toBe('Test Post');
    expect(result.data.author).toBe('john-doe');
    expect(result.data.publishedAt).toBe('2024-01-15');
    expect(result.data.tags).toEqual(['test', 'markdown']);
    expect(result.content).toBe('\nPost content here');
  });

  it('should apply default values for optional fields', () => {
    const content = `---
title: "Test Post"
author: "john-doe"
publishedAt: "2024-01-15"
---

Content`;

    const result = parsePostFrontmatter(content);

    expect(result.data.status).toBe('draft');
    expect(result.data.tags).toEqual([]);
  });

  it('should throw error for missing required fields', () => {
    const content = `---
title: "Test Post"
---

Content`;

    expect(() => parsePostFrontmatter(content)).toThrow('Invalid post frontmatter');
  });

  it('should throw error for invalid date format', () => {
    const content = `---
title: "Test Post"
author: "john-doe"
publishedAt: "invalid-date"
---

Content`;

    expect(() => parsePostFrontmatter(content)).toThrow('Invalid post frontmatter');
  });

  it('should validate status enum', () => {
    const validContent = `---
title: "Test Post"
author: "john-doe"
publishedAt: "2024-01-15"
status: "published"
---

Content`;

    const result = parsePostFrontmatter(validContent);
    expect(result.data.status).toBe('published');

    const invalidContent = `---
title: "Test Post"
author: "john-doe"
publishedAt: "2024-01-15"
status: "invalid"
---

Content`;

    expect(() => parsePostFrontmatter(invalidContent)).toThrow('Invalid post frontmatter');
  });

  it('should parse all optional fields when present', () => {
    const content = `---
title: "Full Post"
author: "john-doe"
publishedAt: "2024-01-15"
updatedAt: "2024-01-20"
excerpt: "This is an excerpt"
featuredImage: "/images/featured.jpg"
tags: ["tech", "programming"]
status: "published"
metaDescription: "Meta description"
metaKeywords: ["seo", "keywords"]
---

Content`;

    const result = parsePostFrontmatter(content);

    expect(result.data.excerpt).toBe('This is an excerpt');
    expect(result.data.updatedAt).toBe('2024-01-20');
    expect(result.data.featuredImage).toBe('/images/featured.jpg');
    expect(result.data.metaDescription).toBe('Meta description');
    expect(result.data.metaKeywords).toEqual(['seo', 'keywords']);
  });
});

describe('parseAuthorFrontmatter', () => {
  it('should parse valid author frontmatter', () => {
    const content = `---
name: "John Doe"
email: "john@example.com"
bio: "Software developer"
avatar: "/avatars/john.jpg"
social:
  twitter: "johndoe"
  github: "johndoe"
  linkedin: "johndoe"
  website: "https://johndoe.com"
---`;

    const result = parseAuthorFrontmatter(content);

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.bio).toBe('Software developer');
    expect(result.avatar).toBe('/avatars/john.jpg');
    expect(result.social).toEqual({
      twitter: 'johndoe',
      github: 'johndoe',
      linkedin: 'johndoe',
      website: 'https://johndoe.com',
    });
  });

  it('should parse minimal valid author frontmatter', () => {
    const content = `---
name: "Jane Doe"
---`;

    const result = parseAuthorFrontmatter(content);

    expect(result.name).toBe('Jane Doe');
    expect(result.email).toBeUndefined();
    expect(result.bio).toBeUndefined();
    expect(result.social).toBeUndefined();
  });

  it('should throw error for missing required name', () => {
    const content = `---
email: "john@example.com"
---`;

    expect(() => parseAuthorFrontmatter(content)).toThrow('Invalid author frontmatter');
  });

  it('should throw error for invalid email format', () => {
    const content = `---
name: "John Doe"
email: "invalid-email"
---`;

    expect(() => parseAuthorFrontmatter(content)).toThrow('Invalid author frontmatter');
  });

  it('should throw error for invalid social URLs', () => {
    const content = `---
name: "John Doe"
social:
  website: "not-a-url"
---`;

    expect(() => parseAuthorFrontmatter(content)).toThrow('Invalid author frontmatter');
  });
});

describe('parsePageFrontmatter', () => {
  it('should parse valid page frontmatter', () => {
    const content = `---
title: "About Us"
status: "published"
publishedAt: "2024-01-15"
metaDescription: "Learn about our company"
template: "default"
---

Page content here`;

    const result = parsePageFrontmatter(content);

    expect(result.data.title).toBe('About Us');
    expect(result.data.status).toBe('published');
    expect(result.data.publishedAt).toBe('2024-01-15');
    expect(result.data.metaDescription).toBe('Learn about our company');
    expect(result.data.template).toBe('default');
    expect(result.content).toBe('\nPage content here');
  });

  it('should apply default values', () => {
    const content = `---
title: "Simple Page"
---

Content`;

    const result = parsePageFrontmatter(content);

    expect(result.data.status).toBe('draft');
  });

  it('should throw error for missing required title', () => {
    const content = `---
status: "published"
---

Content`;

    expect(() => parsePageFrontmatter(content)).toThrow('Invalid page frontmatter');
  });

  it('should validate status enum', () => {
    const invalidContent = `---
title: "Test Page"
status: "archived"
---

Content`;

    expect(() => parsePageFrontmatter(invalidContent)).toThrow('Invalid page frontmatter');
  });
});

// ===========================================================================
// Markdown Rendering Tests
// ===========================================================================

describe('markdownToHtml', () => {
  it('should convert basic markdown to HTML', async () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<h1');
    expect(html).toContain('Hello World');
    expect(html).toContain('<p');
    expect(html).toContain('This is a paragraph.');
  });

  it('should handle multiple heading levels', async () => {
    const markdown = `# H1
## H2
### H3
#### H4`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).toContain('<h4');
  });

  it('should handle inline formatting', async () => {
    const markdown = '**bold** *italic* `code`';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<strong');
    expect(html).toContain('bold');
    expect(html).toContain('<em');
    expect(html).toContain('italic');
    expect(html).toContain('<code');
    expect(html).toContain('code');
  });

  it('should handle links', async () => {
    const markdown = '[OpenAI](https://openai.com)';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<a');
    expect(html).toContain('href="https://openai.com"');
    expect(html).toContain('OpenAI');
  });

  it('should handle lists', async () => {
    const markdown = `- Item 1
- Item 2
- Item 3`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('Item 3');
  });

  it('should handle ordered lists', async () => {
    const markdown = `1. First
2. Second
3. Third`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<ol');
    expect(html).toContain('<li');
    expect(html).toContain('First');
    expect(html).toContain('Second');
    expect(html).toContain('Third');
  });

  it('should handle code blocks', async () => {
    const markdown = '```javascript\nconst x = 10;\n```';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<code');
    expect(html).toContain('const');
    expect(html).toContain('10');
  });

  it('should handle blockquotes', async () => {
    const markdown = '> This is a quote';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<blockquote');
    expect(html).toContain('This is a quote');
  });

  it('should handle GitHub Flavored Markdown tables', async () => {
    const markdown = `| Column 1 | Column 2 |
|----------|----------|
| Cell A   | Cell B   |
| Cell C   | Cell D   |`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<tbody');
    expect(html).toContain('<th');
    expect(html).toContain('<td');
    expect(html).toContain('Column 1');
    expect(html).toContain('Cell A');
  });

  it('should handle strikethrough (GFM)', async () => {
    const markdown = '~~strikethrough~~';
    const html = await markdownToHtml(markdown);

    expect(html).toContain('<del');
    expect(html).toContain('strikethrough');
  });

  it('should handle task lists (GFM)', async () => {
    const markdown = `- [x] Completed task
- [ ] Incomplete task`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<input');
    expect(html).toContain('type="checkbox"');
  });

  it('should handle empty string', async () => {
    const html = await markdownToHtml('');
    expect(html).toBe('');
  });

  it('should handle complex nested structures', async () => {
    const markdown = `# Main Title

## Section 1

This is a paragraph with **bold** and *italic* text.

- List item 1
  - Nested item 1
  - Nested item 2
- List item 2

\`\`\`typescript
function hello() {
  console.log("Hello");
}
\`\`\`

> A quote with a [link](https://example.com)`;

    const html = await markdownToHtml(markdown);

    expect(html).toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('<strong');
    expect(html).toContain('<em');
    expect(html).toContain('<ul');
    expect(html).toContain('<code');
    expect(html).toContain('<blockquote');
    expect(html).toContain('<a');
  });
});

// ===========================================================================
// Utility Function Tests
// ===========================================================================

describe('calculateReadingTime', () => {
  it('should calculate reading time for 200 words as 1 minute', () => {
    const content = 'word '.repeat(200);
    expect(calculateReadingTime(content)).toBe(1);
  });

  it('should round up fractional minutes', () => {
    const content = 'word '.repeat(250); // 250 words = 1.25 minutes
    expect(calculateReadingTime(content)).toBe(2);
  });

  it('should handle small content (less than 200 words)', () => {
    const content = 'word '.repeat(50); // 50 words
    expect(calculateReadingTime(content)).toBe(1);
  });

  it('should handle large content', () => {
    const content = 'word '.repeat(1000); // 1000 words = 5 minutes
    expect(calculateReadingTime(content)).toBe(5);
  });

  it('should handle empty string', () => {
    expect(calculateReadingTime('')).toBe(1); // Math.ceil(0/200) = 0, but minimum is 1
  });

  it('should handle content with multiple spaces', () => {
    const content = 'word    word    word    '; // Should count as 3 words
    expect(calculateReadingTime(content)).toBe(1);
  });

  it('should handle realistic article (600 words)', () => {
    const content = 'word '.repeat(600);
    expect(calculateReadingTime(content)).toBe(3);
  });
});

describe('extractExcerpt', () => {
  it('should extract first paragraph when shorter than maxLength', () => {
    const content = 'This is a short paragraph.\n\nThis is the second paragraph.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).toBe('This is a short paragraph.');
  });

  it('should truncate long paragraphs to maxLength', () => {
    const longText = 'a'.repeat(200);
    const content = `${longText}\n\nSecond paragraph.`;
    const excerpt = extractExcerpt(content, 160);

    expect(excerpt.length).toBeLessThanOrEqual(164); // 160 + '...'
    expect(excerpt).toContain('...');
  });

  it('should remove markdown headers', () => {
    const content = '## This is a header\n\nThis is content.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).not.toContain('##');
    expect(excerpt).toContain('This is a header');
  });

  it('should remove bold markdown', () => {
    const content = 'This is **bold** text.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).toBe('This is bold text.');
  });

  it('should remove italic markdown', () => {
    const content = 'This is *italic* text.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).toBe('This is italic text.');
  });

  it('should remove links but keep text', () => {
    const content = 'Check out [this link](https://example.com).';
    const excerpt = extractExcerpt(content);

    expect(excerpt).toBe('Check out this link.');
  });

  it('should remove inline code', () => {
    const content = 'Use `console.log()` for debugging.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).toBe('Use console.log() for debugging.');
  });

  it('should remove code blocks', () => {
    const content = 'Text before.\n\n```js\ncode here\n```\n\nText after.';
    const excerpt = extractExcerpt(content);

    expect(excerpt).not.toContain('```');
    expect(excerpt).not.toContain('code here');
  });

  it('should use custom maxLength', () => {
    const content = 'a'.repeat(100);
    const excerpt = extractExcerpt(content, 50);

    expect(excerpt.length).toBeLessThanOrEqual(54); // 50 + '...'
    expect(excerpt).toContain('...');
  });

  it('should handle empty content', () => {
    const excerpt = extractExcerpt('');
    expect(excerpt).toBe('');
  });

  it('should handle complex markdown', () => {
    const content = `# Title

This is a paragraph with **bold**, *italic*, and [links](https://example.com).

\`\`\`javascript
code block
\`\`\`

Second paragraph.`;

    const excerpt = extractExcerpt(content);

    expect(excerpt).not.toContain('#');
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('[');
    expect(excerpt).not.toContain('```');
    // After cleaning, the first paragraph is just "Title"
    expect(excerpt).toBe('Title');
  });
});

describe('extractTableOfContents', () => {
  it('should extract H2 headers', () => {
    const markdown = `# Main Title
## Section 1
Content
## Section 2
More content`;

    const toc = extractTableOfContents(markdown);

    expect(toc).toHaveLength(2);
    expect(toc[0]).toEqual({ id: 'section-1', level: 2, text: 'Section 1' });
    expect(toc[1]).toEqual({ id: 'section-2', level: 2, text: 'Section 2' });
  });

  it('should extract H3 headers', () => {
    const markdown = `## Section
### Subsection 1
### Subsection 2`;

    const toc = extractTableOfContents(markdown);

    expect(toc).toHaveLength(3);
    expect(toc[0]).toEqual({ id: 'section', level: 2, text: 'Section' });
    expect(toc[1]).toEqual({ id: 'subsection-1', level: 3, text: 'Subsection 1' });
    expect(toc[2]).toEqual({ id: 'subsection-2', level: 3, text: 'Subsection 2' });
  });

  it('should ignore H1 headers', () => {
    const markdown = `# Main Title
## Section 1`;

    const toc = extractTableOfContents(markdown);

    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Section 1');
  });

  it('should ignore H4 and deeper headers', () => {
    const markdown = `## Section
#### Deep Header`;

    const toc = extractTableOfContents(markdown);

    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Section');
  });

  it('should generate slugified IDs', () => {
    const markdown = `## Hello World
### TypeScript & React`;

    const toc = extractTableOfContents(markdown);

    expect(toc[0].id).toBe('hello-world');
    expect(toc[1].id).toBe('typescript-react');
  });

  it('should handle empty markdown', () => {
    const toc = extractTableOfContents('');
    expect(toc).toEqual([]);
  });

  it('should handle markdown without headers', () => {
    const markdown = 'Just some text content';
    const toc = extractTableOfContents(markdown);
    expect(toc).toEqual([]);
  });

  it('should preserve order of headers', () => {
    const markdown = `## First
### Nested First
## Second
### Nested Second
### Another Nested Second`;

    const toc = extractTableOfContents(markdown);

    expect(toc).toHaveLength(5);
    expect(toc[0].text).toBe('First');
    expect(toc[1].text).toBe('Nested First');
    expect(toc[2].text).toBe('Second');
    expect(toc[3].text).toBe('Nested Second');
    expect(toc[4].text).toBe('Another Nested Second');
  });

  it('should handle headers with special characters', () => {
    const markdown = `## What's New?
## Features & Benefits`;

    const toc = extractTableOfContents(markdown);

    expect(toc[0]).toEqual({ id: 'whats-new', level: 2, text: "What's New?" });
    expect(toc[1]).toEqual({ id: 'features-benefits', level: 2, text: 'Features & Benefits' });
  });
});

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('Hello World Test')).toBe('hello-world-test');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
    expect(slugify('Test@Email.com')).toBe('testemailcom');
  });

  it('should handle multiple consecutive spaces', () => {
    expect(slugify('Hello   World')).toBe('hello-world');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('-Hello World-')).toBe('hello-world');
  });

  it('should handle underscores', () => {
    expect(slugify('hello_world_test')).toBe('hello-world-test');
  });

  it('should preserve existing hyphens', () => {
    expect(slugify('already-hyphenated')).toBe('already-hyphenated');
  });

  it('should handle ampersands', () => {
    expect(slugify('TypeScript & React')).toBe('typescript-react');
  });

  it('should handle parentheses and brackets', () => {
    expect(slugify('Function (ES6)')).toBe('function-es6');
    expect(slugify('Array [Methods]')).toBe('array-methods');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle numbers', () => {
    expect(slugify('ECMAScript 2024')).toBe('ecmascript-2024');
  });

  it('should handle mixed special characters', () => {
    expect(slugify('Hello! @World# $Test%')).toBe('hello-world-test');
  });

  it('should handle apostrophes', () => {
    expect(slugify("What's new in TypeScript")).toBe('whats-new-in-typescript');
  });

  it('should handle long strings', () => {
    const longText = 'This is a very long title with many words and spaces';
    expect(slugify(longText)).toBe('this-is-a-very-long-title-with-many-words-and-spaces');
  });

  it('should handle unicode characters', () => {
    // Unicode characters are stripped by the slugify function
    expect(slugify('Café Münchën')).toBe('caf-mnchn');
  });
});
