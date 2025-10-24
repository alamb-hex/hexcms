/**
 * Schema Validation
 *
 * This module provides Zod schemas for validating frontmatter and API inputs.
 *
 * TODO (Phase 1):
 * - [ ] Define Zod schemas for post, author, page frontmatter
 * - [ ] Add custom validation rules
 * - [ ] Add error messages
 */

import { z } from 'zod';

// ===========================================================================
// Frontmatter Schemas
// ===========================================================================

/**
 * Post frontmatter schema
 *
 * TODO: Implement full validation with custom error messages
 */
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

/**
 * Author frontmatter schema
 *
 * TODO: Implement
 */
export const authorFrontmatterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  social: z
    .object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().url().optional(),
      youtube: z.string().url().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
});

/**
 * Page frontmatter schema
 *
 * TODO: Implement
 */
export const pageFrontmatterSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  metaDescription: z.string().max(160).optional(),
  template: z.string().optional(),
});

// ===========================================================================
// API Request Schemas
// ===========================================================================

/**
 * Post filters schema
 *
 * TODO: Implement
 */
export const postFiltersSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.string().uuid().optional(),
  tag: z.string().optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  orderBy: z.enum(['publishedAt', 'createdAt', 'views', 'title']).default('publishedAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// ===========================================================================
// Type Inference
// ===========================================================================

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
export type AuthorFrontmatter = z.infer<typeof authorFrontmatterSchema>;
export type PageFrontmatter = z.infer<typeof pageFrontmatterSchema>;
export type PostFilters = z.infer<typeof postFiltersSchema>;
