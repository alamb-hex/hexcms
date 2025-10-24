/**
 * Type Definitions for heXcms
 *
 * This file contains all TypeScript interfaces and types used throughout the application.
 */

// ===========================================================================
// Content Types
// ===========================================================================

/**
 * Post entity from database
 */
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  contentHtml?: string;
  authorId?: string;
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  featured: boolean;
  readingTime?: number;
  views: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Author entity from database
 */
export interface Author {
  id: string;
  slug: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    youtube?: string;
    instagram?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tag entity from database
 */
export interface Tag {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt: Date;
}

/**
 * Page entity from database
 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  contentHtml?: string;
  status: 'draft' | 'published';
  template?: string;
  metaDescription?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync log entry
 */
export interface SyncLog {
  id: string;
  eventType: 'sync' | 'create' | 'update' | 'delete';
  resourceType: 'post' | 'author' | 'page' | 'tag';
  resourceId?: string;
  filePath?: string;
  commitSha?: string;
  status: 'success' | 'error' | 'skipped';
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ===========================================================================
// Frontmatter Types
// ===========================================================================

/**
 * Post frontmatter structure (from Markdown files)
 */
export interface PostFrontmatter {
  title: string;
  excerpt?: string;
  author: string; // Author slug
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;
  featuredImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  metaDescription?: string;
  metaKeywords?: string[];
}

/**
 * Author frontmatter structure
 */
export interface AuthorFrontmatter {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    youtube?: string;
    instagram?: string;
  };
}

/**
 * Page frontmatter structure
 */
export interface PageFrontmatter {
  title: string;
  slug?: string;
  status?: 'draft' | 'published';
  publishedAt?: string;
  updatedAt?: string;
  metaDescription?: string;
  template?: string;
}

// ===========================================================================
// API Types
// ===========================================================================

/**
 * GitHub webhook payload
 */
export interface GitHubWebhookPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    name: string;
    full_name: string;
    owner: {
      name: string;
      email: string;
    };
  };
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
  };
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  processed: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
  duration: number;
}

// ===========================================================================
// Query Types
// ===========================================================================

/**
 * Post query filters
 */
export interface PostFilters {
  status?: 'draft' | 'published' | 'archived';
  authorId?: string;
  tag?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'publishedAt' | 'createdAt' | 'views' | 'title';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ===========================================================================
// Utility Types
// ===========================================================================

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
