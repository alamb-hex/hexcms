/**
 * Tests for Content Sync Engine
 *
 * This test suite validates GitHub webhook processing, signature verification,
 * file processing, and database upsert operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock @neondatabase/serverless
const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}));

// Mock dependencies
vi.mock('@octokit/rest', () => {
  const mockGetContent = vi.fn();
  return {
    Octokit: class MockOctokit {
      repos = {
        getContent: mockGetContent,
      };
      constructor() {}
    },
  };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSql),
}));

vi.mock('./markdown', () => ({
  parsePostFrontmatter: vi.fn(),
  parseAuthorFrontmatter: vi.fn(),
  parsePageFrontmatter: vi.fn(),
  markdownToHtml: vi.fn(),
  calculateReadingTime: vi.fn(),
  extractExcerpt: vi.fn(),
}));

vi.mock('./db', () => ({
  getAuthorBySlug: vi.fn(),
  getTagBySlug: vi.fn(),
}));

// Import mocked modules
import { Octokit } from '@octokit/rest';
import * as markdown from './markdown';
import * as db from './db';
import {
  processWebhook,
  verifyWebhookSignature,
  extractSlugFromPath,
  getResourceTypeFromPath,
  filterContentFiles,
  fetchFileFromGitHub,
  processFile,
  processDeletedFile,
  upsertPost,
  upsertAuthor,
  upsertPage,
  logSync,
} from './sync';
import type { GitHubWebhookPayload } from '@/types';

// ===========================================================================
// Webhook Signature Verification Tests
// ===========================================================================

describe('verifyWebhookSignature', () => {
  it('should return true for valid signature', () => {
    const payload = 'test payload';
    const secret = 'test-secret';

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    const result = verifyWebhookSignature(payload, signature, secret);
    expect(result).toBe(true);
  });

  it('should return false for invalid signature', () => {
    const result = verifyWebhookSignature('payload', 'sha256=invalid', 'secret');
    expect(result).toBe(false);
  });

  it('should return false for null signature', () => {
    const result = verifyWebhookSignature('payload', null, 'secret');
    expect(result).toBe(false);
  });

  it('should return false for signature without sha256 prefix', () => {
    const result = verifyWebhookSignature('payload', 'invalidsignature', 'secret');
    expect(result).toBe(false);
  });

  it('should handle different payload content', () => {
    const payload = JSON.stringify({ test: 'data', nested: { value: 123 } });
    const secret = 'my-secret-key';

    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    const result = verifyWebhookSignature(payload, signature, secret);
    expect(result).toBe(true);
  });

  it('should reject signature with wrong secret', () => {
    const payload = 'test payload';
    const correctSecret = 'correct-secret';
    const wrongSecret = 'wrong-secret';

    const hmac = crypto.createHmac('sha256', wrongSecret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    const result = verifyWebhookSignature(payload, signature, correctSecret);
    expect(result).toBe(false);
  });
});

// ===========================================================================
// Path Utility Tests
// ===========================================================================

describe('extractSlugFromPath', () => {
  it('should extract slug from post path', () => {
    expect(extractSlugFromPath('content/posts/2024-01-15-hello-world.md')).toBe('hello-world');
  });

  it('should extract slug from author path', () => {
    expect(extractSlugFromPath('content/authors/john-doe.md')).toBe('john-doe');
  });

  it('should extract slug from page path', () => {
    expect(extractSlugFromPath('content/pages/about.md')).toBe('about');
  });

  it('should remove .md extension', () => {
    expect(extractSlugFromPath('content/pages/contact.md')).toBe('contact');
  });

  it('should handle paths without date prefix', () => {
    expect(extractSlugFromPath('content/authors/jane-smith.md')).toBe('jane-smith');
  });

  it('should handle different date formats in posts', () => {
    expect(extractSlugFromPath('content/posts/2024-12-31-year-end.md')).toBe('year-end');
  });

  it('should handle nested directory paths', () => {
    expect(extractSlugFromPath('content/posts/2024-01-15-nested-post.md')).toBe('nested-post');
  });
});

describe('getResourceTypeFromPath', () => {
  it('should identify post paths', () => {
    expect(getResourceTypeFromPath('content/posts/2024-01-15-test.md')).toBe('post');
  });

  it('should identify author paths', () => {
    expect(getResourceTypeFromPath('content/authors/john-doe.md')).toBe('author');
  });

  it('should identify page paths', () => {
    expect(getResourceTypeFromPath('content/pages/about.md')).toBe('page');
  });

  it('should return null for non-content paths', () => {
    expect(getResourceTypeFromPath('src/lib/utils.ts')).toBeNull();
    expect(getResourceTypeFromPath('README.md')).toBeNull();
    expect(getResourceTypeFromPath('public/images/test.jpg')).toBeNull();
  });

  it('should handle paths with subdirectories', () => {
    expect(getResourceTypeFromPath('content/posts/2024/01/test.md')).toBe('post');
  });
});

describe('filterContentFiles', () => {
  it('should filter markdown files in content directory', () => {
    const files = [
      'content/posts/2024-01-15-test.md',
      'content/authors/john-doe.md',
      'src/lib/utils.ts',
      'README.md',
      'content/pages/about.md',
      'public/image.jpg',
    ];

    const result = filterContentFiles(files);

    expect(result).toEqual([
      'content/posts/2024-01-15-test.md',
      'content/authors/john-doe.md',
      'content/pages/about.md',
    ]);
  });

  it('should return empty array when no content files', () => {
    const files = ['src/index.ts', 'package.json', 'README.md'];
    const result = filterContentFiles(files);
    expect(result).toEqual([]);
  });

  it('should handle empty array', () => {
    const result = filterContentFiles([]);
    expect(result).toEqual([]);
  });
});

// ===========================================================================
// GitHub File Fetching Tests
// ===========================================================================

describe('fetchFileFromGitHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and decode file content', async () => {
    const fileContent = 'Test content';
    const base64Content = Buffer.from(fileContent).toString('base64');

    const mockOctokit = new Octokit();
    (mockOctokit.repos.getContent as any).mockResolvedValue({
      data: {
        type: 'file',
        content: base64Content,
      },
    });

    const result = await fetchFileFromGitHub('content/posts/test.md', 'abc123');

    expect(result).toBe(fileContent);
  });

  it('should throw error for directory paths', async () => {
    const mockOctokit = new Octokit();
    (mockOctokit.repos.getContent as any).mockResolvedValue({
      data: [
        { type: 'file', name: 'file1.md' },
        { type: 'file', name: 'file2.md' },
      ],
    });

    await expect(fetchFileFromGitHub('content/posts', 'abc123')).rejects.toThrow(
      'Path is not a file'
    );
  });

  it('should handle API errors', async () => {
    const mockOctokit = new Octokit();
    (mockOctokit.repos.getContent as any).mockRejectedValue(new Error('Not found'));

    await expect(fetchFileFromGitHub('invalid/path.md', 'abc123')).rejects.toThrow(
      'Failed to fetch file from GitHub'
    );
  });
});

// ===========================================================================
// Webhook Processing Tests
// ===========================================================================

describe('processWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter out non-content files', async () => {
    const payload: GitHubWebhookPayload = {
      ref: 'refs/heads/main',
      before: 'abc123',
      after: 'def456',
      repository: {
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: { name: 'owner', email: 'owner@example.com' },
      },
      head_commit: {
        id: 'def456',
        message: 'Mixed changes',
        timestamp: '2024-01-15T12:00:00Z',
        author: { name: 'John Doe', email: 'john@example.com' },
        added: [
          'src/lib/utils.ts',
          'README.md',
        ],
        modified: [],
        removed: [],
      },
    };

    // When no content files are present, nothing should be processed
    const result = await processWebhook(payload);

    expect(result.processed).toBe(0);
    expect(result.errors).toEqual([]);
  });
});

// ===========================================================================
// File Processing Tests
// ===========================================================================

describe('processFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error for invalid paths', async () => {
    await expect(processFile('invalid/path.md', 'abc123')).rejects.toThrow(
      'Invalid content path'
    );
  });
});

describe('processDeletedFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error for invalid paths', async () => {
    await expect(processDeletedFile('invalid/path.md', 'abc123')).rejects.toThrow(
      'Invalid content path'
    );
  });
});

// ===========================================================================
// Upsert Operation Tests
// ===========================================================================

describe('upsertPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call markdown and db functions correctly', async () => {
    const frontmatter = {
      title: 'Test Post',
      author: 'john-doe',
      publishedAt: '2024-01-15',
      tags: ['javascript'],
      status: 'published' as const,
    };

    (db.getAuthorBySlug as any).mockResolvedValue({ id: 'author-123' });
    (markdown.markdownToHtml as any).mockResolvedValue('<p>HTML content</p>');
    (markdown.calculateReadingTime as any).mockReturnValue(5);
    (markdown.extractExcerpt as any).mockReturnValue('Excerpt text');
    (db.getTagBySlug as any).mockResolvedValue({ id: 'tag-1' });

    mockSql.mockResolvedValue([{ id: 'post-123' }]);

    await upsertPost('test-post', frontmatter, 'Content', 'abc123');

    expect(db.getAuthorBySlug).toHaveBeenCalledWith('john-doe');
    expect(markdown.markdownToHtml).toHaveBeenCalledWith('Content');
    expect(markdown.calculateReadingTime).toHaveBeenCalledWith('Content');
  });
});

describe('upsertAuthor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert author with all fields', async () => {
    const frontmatter = {
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Developer',
      avatar: '/avatar.jpg',
      social: {
        twitter: 'johndoe',
        github: 'johndoe',
        website: 'https://johndoe.com',
      },
    };

    mockSql.mockResolvedValue([{ id: 'author-123' }]);

    await upsertAuthor('john-doe', frontmatter, 'abc123');

    expect(mockSql).toHaveBeenCalled();
  });
});

describe('upsertPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert page with all fields', async () => {
    const frontmatter = {
      title: 'About Us',
      status: 'published' as const,
      publishedAt: '2024-01-15',
      template: 'default',
      metaDescription: 'About our company',
    };

    (markdown.markdownToHtml as any).mockResolvedValue('<p>About content</p>');
    mockSql.mockResolvedValue([{ id: 'page-123' }]);

    await upsertPage('about', frontmatter, 'Content', 'abc123');

    expect(markdown.markdownToHtml).toHaveBeenCalledWith('Content');
    expect(mockSql).toHaveBeenCalled();
  });
});

// ===========================================================================
// Sync Logging Tests
// ===========================================================================

describe('logSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log successful sync operations', async () => {
    mockSql.mockResolvedValue([]);

    await logSync('sync', 'post', 'post-123', 'abc123', 'success', {
      slug: 'test-post',
      title: 'Test Post',
    });

    // sql is called as a tagged template, so just check it was called
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should log errors with error message', async () => {
    mockSql.mockResolvedValue([]);

    await logSync('sync', 'post', 'post-123', 'abc123', 'error', {
      error: 'Processing failed',
    });

    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should not throw on logging errors', async () => {
    mockSql.mockRejectedValue(new Error('Logging failed'));

    // Should not throw
    await expect(
      logSync('sync', 'post', 'post-123', 'abc123', 'success')
    ).resolves.toBeUndefined();
  });

  it('should handle different event types', async () => {
    mockSql.mockResolvedValue([]);

    await logSync('create', 'author', 'author-123', 'abc123', 'success');
    await logSync('update', 'page', 'page-123', 'abc123', 'success');
    await logSync('delete', 'tag', 'tag-123', 'abc123', 'success');

    expect(mockSql).toHaveBeenCalledTimes(3);
  });
});
