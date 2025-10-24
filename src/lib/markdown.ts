/**
 * Markdown Processing Utilities
 *
 * This module handles parsing Markdown files and rendering to HTML.
 *
 * Features:
 * - Frontmatter parsing with gray-matter and Zod validation
 * - Markdown to HTML conversion using unified/remark/rehype
 * - Syntax highlighting with rehype-highlight
 * - GitHub Flavored Markdown support
 * - Reading time calculation
 * - Table of contents extraction from headers
 */

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import type { PostFrontmatter, AuthorFrontmatter, PageFrontmatter } from '@/types';
import {
  postFrontmatterSchema,
  authorFrontmatterSchema,
  pageFrontmatterSchema,
} from './validation';

// ===========================================================================
// Frontmatter Parsing
// ===========================================================================

/**
 * Parse Markdown file with frontmatter
 *
 * @param fileContent - Raw markdown file content
 * @returns Parsed frontmatter data and content
 */
export function parseMarkdownFile<T = Record<string, unknown>>(
  fileContent: string
): { data: T; content: string } {
  const { data, content } = matter(fileContent);
  return { data: data as T, content };
}

/**
 * Parse post frontmatter with Zod validation
 *
 * @param fileContent - Raw markdown file content
 * @returns Validated post frontmatter and content
 * @throws {Error} If frontmatter validation fails
 */
export function parsePostFrontmatter(fileContent: string): {
  data: PostFrontmatter;
  content: string;
} {
  const { data, content } = parseMarkdownFile(fileContent);

  try {
    const validatedData = postFrontmatterSchema.parse(data);
    return { data: validatedData, content };
  } catch (error) {
    throw new Error(
      `Invalid post frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse author frontmatter with Zod validation
 *
 * @param fileContent - Raw markdown file content
 * @returns Validated author frontmatter
 * @throws {Error} If frontmatter validation fails
 */
export function parseAuthorFrontmatter(fileContent: string): AuthorFrontmatter {
  const { data } = parseMarkdownFile(fileContent);

  try {
    const validatedData = authorFrontmatterSchema.parse(data);
    return validatedData;
  } catch (error) {
    throw new Error(
      `Invalid author frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse page frontmatter with Zod validation
 *
 * @param fileContent - Raw markdown file content
 * @returns Validated page frontmatter and content
 * @throws {Error} If frontmatter validation fails
 */
export function parsePageFrontmatter(fileContent: string): {
  data: PageFrontmatter;
  content: string;
} {
  const { data, content } = parseMarkdownFile(fileContent);

  try {
    const validatedData = pageFrontmatterSchema.parse(data);
    return { data: validatedData, content };
  } catch (error) {
    throw new Error(
      `Invalid page frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ===========================================================================
// Markdown Rendering
// ===========================================================================

/**
 * Convert Markdown to HTML
 *
 * Uses unified/remark/rehype pipeline with:
 * - GitHub Flavored Markdown support
 * - Syntax highlighting for code blocks
 *
 * @param markdown - Raw markdown content
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse) // Parse Markdown
      .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, etc.)
      .use(remarkRehype, { allowDangerousHtml: false }) // Convert to HTML AST (sanitized)
      .use(rehypeHighlight) // Syntax highlighting for code blocks
      .use(rehypeStringify) // Convert to HTML string
      .process(markdown);

    return result.toString();
  } catch (error) {
    throw new Error(
      `Failed to convert markdown to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ===========================================================================
// Utility Functions
// ===========================================================================

/**
 * Calculate reading time in minutes
 *
 * Assumes average reading speed of 200 words per minute
 *
 * @param content - Markdown content
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
}

/**
 * Extract excerpt from content
 *
 * Takes first paragraph or truncates to maxLength
 *
 * @param content - Markdown content
 * @param maxLength - Maximum excerpt length (default: 160)
 * @returns Plain text excerpt
 */
export function extractExcerpt(content: string, maxLength: number = 160): string {
  // Remove Markdown syntax
  const plainText = content
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .trim();

  // Get first paragraph
  const firstParagraph = plainText.split('\n\n')[0];

  // Truncate to max length
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  return firstParagraph.substring(0, maxLength).trim() + '...';
}

/**
 * Table of contents item
 */
export interface TocItem {
  id: string;
  level: number;
  text: string;
}

/**
 * Extract table of contents from Markdown headers
 *
 * Parses H2 and H3 headers (## and ###) and generates IDs
 *
 * @param markdown - Markdown content
 * @returns Array of TOC items
 */
export function extractTableOfContents(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Match H2 (##) or H3 (###) headers
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      const text = h2Match[1].trim();
      toc.push({
        id: slugify(text),
        level: 2,
        text,
      });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      toc.push({
        id: slugify(text),
        level: 3,
        text,
      });
    }
  }

  return toc;
}

/**
 * Generate slug from title
 *
 * Converts text to lowercase, URL-friendly slug
 *
 * @param text - Text to slugify
 * @returns URL-safe slug
 *
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("TypeScript & React") // "typescript-react"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
