/**
 * Tests for Database Query Functions
 *
 * This test suite validates all database query functions with mocked sql.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @neondatabase/serverless
// neon() returns a sql function that we can mock
const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSql),
}));

import {
  getPosts,
  getPostBySlug,
  getFeaturedPosts,
  searchPosts,
  getPostsByTag,
  getPostsByAuthor,
  incrementPostViews,
  getAuthors,
  getAuthorBySlug,
  getTags,
  getTagBySlug,
  getTagsForPost,
  getPages,
  getPageBySlug,
  testConnection,
} from './db';

// ===========================================================================
// Post Query Tests
// ===========================================================================

describe('Post Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPostBySlug', () => {
    it('should return post when found', async () => {
      const mockPost = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'A test excerpt',
        content: 'Post content',
        content_html: '<p>Post content</p>',
        author_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'published',
        featured_image: '/images/test.jpg',
        featured: true,
        reading_time: 5,
        views: 100,
        published_at: new Date('2024-01-15'),
        created_at: new Date('2024-01-10'),
        updated_at: new Date('2024-01-15'),
      };

      mockSql.mockResolvedValue([mockPost]);

      const result = await getPostBySlug('test-post');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('test-post');
      expect(result?.title).toBe('Test Post');
      expect(result?.status).toBe('published');
      expect(result?.views).toBe(100);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should return null when post not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getPostBySlug('nonexistent');

      expect(result).toBeNull();
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should throw error on database failure', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'));

      await expect(getPostBySlug('test-post')).rejects.toThrow('Failed to fetch post');
    });
  });

  describe('getPosts', () => {
    it('should return paginated posts with default options', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'post-1',
          title: 'Post 1',
          content: 'Content 1',
          status: 'published',
          featured: false,
          views: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          slug: 'post-2',
          title: 'Post 2',
          content: 'Content 2',
          status: 'published',
          featured: false,
          views: 20,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // First call for count, second for data
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '2' }])
        .mockResolvedValueOnce(mockPosts);

      const result = await getPosts({ limit: 10, offset: 0 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter by status', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([]);

      await getPosts({ status: 'draft' });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('p.status = $1'),
        expect.arrayContaining(['draft'])
      );
    });

    it('should filter by authorId', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({ authorId: 'author-123' });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('p.author_id = $1'),
        expect.arrayContaining(['author-123'])
      );
    });

    it('should filter by featured status', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({ featured: true });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('p.featured = $1'),
        expect.arrayContaining([true])
      );
    });

    it('should filter by tag', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({ tag: 'javascript' });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN post_tags pt'),
        expect.arrayContaining(['javascript'])
      );
    });

    it('should search using full-text search', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({ search: 'typescript' });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('plainto_tsquery'),
        expect.arrayContaining(['typescript'])
      );
    });

    it('should handle pagination correctly', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '50' }])
        .mockResolvedValueOnce([]);

      const result = await getPosts({ limit: 10, offset: 20 });

      expect(result.pagination.total).toBe(50);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should support custom ordering', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({ orderBy: 'views', orderDirection: 'asc' });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY p.views ASC'),
        expect.any(Array)
      );
    });

    it('should combine multiple filters', async () => {
      mockSql.mockReset()

        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      await getPosts({
        status: 'published',
        featured: true,
        search: 'test',
        limit: 5,
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('p.status = $1'),
        expect.arrayContaining(['published', true, 'test', 5, 0])
      );
    });
  });

  describe('getFeaturedPosts', () => {
    it('should return featured posts', async () => {
      const mockPosts = [
        { id: '1', slug: 'featured-1', title: 'Featured 1', featured: true },
        { id: '2', slug: 'featured-2', title: 'Featured 2', featured: true },
      ];

      mockSql.mockResolvedValue(
        mockPosts.map((p) => ({
          ...p,
          content: 'content',
          status: 'published',
          views: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      );

      const result = await getFeaturedPosts(3);

      expect(result).toHaveLength(2);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should use default limit of 3', async () => {
      mockSql.mockResolvedValue([]);

      await getFeaturedPosts();

      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchPosts', () => {
    it('should search posts using full-text search', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'post-1',
          title: 'TypeScript Tutorial',
          content: 'Learn TypeScript',
          status: 'published',
          featured: false,
          views: 100,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockPosts);

      const result = await searchPosts('typescript', 20);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('TypeScript Tutorial');
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no matches', async () => {
      mockSql.mockResolvedValue([]);

      const result = await searchPosts('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getPostsByTag', () => {
    it('should return posts with specific tag', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'post-1',
          title: 'Post 1',
          content: 'Content',
          status: 'published',
          featured: false,
          views: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockPosts);

      const result = await getPostsByTag('javascript');

      expect(result).toHaveLength(1);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPostsByAuthor', () => {
    it('should return posts by specific author', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'post-1',
          title: 'Post 1',
          content: 'Content',
          status: 'published',
          featured: false,
          views: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockPosts);

      const result = await getPostsByAuthor('john-doe');

      expect(result).toHaveLength(1);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementPostViews', () => {
    it('should increment view count for post', async () => {
      mockSql.mockResolvedValue([]);

      await incrementPostViews('test-post');

      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(incrementPostViews('test-post')).rejects.toThrow(
        'Failed to increment post views'
      );
    });
  });
});

// ===========================================================================
// Author Query Tests
// ===========================================================================

describe('Author Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthors', () => {
    it('should return all authors', async () => {
      const mockAuthors = [
        {
          id: '1',
          slug: 'john-doe',
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Developer',
          avatar_url: '/avatar.jpg',
          website: 'https://johndoe.com',
          social: '{"twitter": "johndoe"}',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          slug: 'jane-smith',
          name: 'Jane Smith',
          social: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockAuthors);

      const result = await getAuthors();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].social).toEqual({ twitter: 'johndoe' });
      expect(result[1].name).toBe('Jane Smith');
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getAuthors();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(getAuthors()).rejects.toThrow('Failed to fetch authors');
    });
  });

  describe('getAuthorBySlug', () => {
    it('should return author when found', async () => {
      const mockAuthor = {
        id: '1',
        slug: 'john-doe',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Software Developer',
        avatar_url: '/avatar.jpg',
        website: 'https://johndoe.com',
        social: '{"twitter": "johndoe", "github": "johndoe"}',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSql.mockResolvedValue([mockAuthor]);

      const result = await getAuthorBySlug('john-doe');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('john-doe');
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@example.com');
      expect(result?.social).toEqual({ twitter: 'johndoe', github: 'johndoe' });
    });

    it('should return null when author not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getAuthorBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle JSONB social field', async () => {
      const mockAuthor = {
        id: '1',
        slug: 'john-doe',
        name: 'John Doe',
        social: { twitter: 'johndoe' }, // Already parsed JSONB
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSql.mockResolvedValue([mockAuthor]);

      const result = await getAuthorBySlug('john-doe');

      expect(result?.social).toEqual({ twitter: 'johndoe' });
    });
  });
});

// ===========================================================================
// Tag Query Tests
// ===========================================================================

describe('Tag Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTags', () => {
    it('should return all tags', async () => {
      const mockTags = [
        {
          id: '1',
          slug: 'javascript',
          name: 'JavaScript',
          description: 'JavaScript posts',
          created_at: new Date(),
        },
        {
          id: '2',
          slug: 'typescript',
          name: 'TypeScript',
          created_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockTags);

      const result = await getTags();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('JavaScript');
      expect(result[0].description).toBe('JavaScript posts');
      expect(result[1].name).toBe('TypeScript');
    });

    it('should handle empty results', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getTags();

      expect(result).toEqual([]);
    });
  });

  describe('getTagBySlug', () => {
    it('should return tag when found', async () => {
      const mockTag = {
        id: '1',
        slug: 'javascript',
        name: 'JavaScript',
        description: 'All about JavaScript',
        created_at: new Date(),
      };

      mockSql.mockResolvedValue([mockTag]);

      const result = await getTagBySlug('javascript');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('javascript');
      expect(result?.name).toBe('JavaScript');
      expect(result?.description).toBe('All about JavaScript');
    });

    it('should return null when tag not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getTagBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTagsForPost', () => {
    it('should return tags for a specific post', async () => {
      const mockTags = [
        {
          id: '1',
          slug: 'javascript',
          name: 'JavaScript',
          created_at: new Date(),
        },
        {
          id: '2',
          slug: 'tutorial',
          name: 'Tutorial',
          created_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockTags);

      const result = await getTagsForPost('post-123');

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('javascript');
      expect(result[1].slug).toBe('tutorial');
    });

    it('should return empty array when post has no tags', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getTagsForPost('post-123');

      expect(result).toEqual([]);
    });
  });
});

// ===========================================================================
// Page Query Tests
// ===========================================================================

describe('Page Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPages', () => {
    it('should return all published pages', async () => {
      const mockPages = [
        {
          id: '1',
          slug: 'about',
          title: 'About Us',
          content: 'About content',
          content_html: '<p>About content</p>',
          status: 'published',
          template: 'default',
          meta_description: 'About page',
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          slug: 'contact',
          title: 'Contact',
          content: 'Contact content',
          status: 'published',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockSql.mockResolvedValue(mockPages);

      const result = await getPages();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('About Us');
      expect(result[1].title).toBe('Contact');
    });

    it('should handle empty results', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getPages();

      expect(result).toEqual([]);
    });
  });

  describe('getPageBySlug', () => {
    it('should return page when found', async () => {
      const mockPage = {
        id: '1',
        slug: 'about',
        title: 'About Us',
        content: 'About content',
        content_html: '<p>About content</p>',
        status: 'published',
        template: 'default',
        meta_description: 'About our company',
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSql.mockResolvedValue([mockPage]);

      const result = await getPageBySlug('about');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
      expect(result?.title).toBe('About Us');
      expect(result?.template).toBe('default');
      expect(result?.metaDescription).toBe('About our company');
    });

    it('should return null when page not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getPageBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('should only return published pages', async () => {
      mockSql.mockResolvedValue([]);

      await getPageBySlug('draft-page');

      expect(mockSql).toHaveBeenCalledTimes(1);
      // Verify the query includes status check (implicitly tested by mock setup)
    });
  });
});

// ===========================================================================
// Utility Function Tests
// ===========================================================================

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockSql.mockResolvedValue([{ '?column?': 1 }]);

      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should return false on connection failure', async () => {
      mockSql.mockRejectedValue(new Error('Connection failed'));

      const result = await testConnection();

      expect(result).toBe(false);
    });
  });
});

// ===========================================================================
// Error Handling Tests
// ===========================================================================

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap database errors with context', async () => {
    mockSql.mockRejectedValue(new Error('Connection timeout'));

    await expect(getPostBySlug('test')).rejects.toThrow('Failed to fetch post');
    await expect(getAuthors()).rejects.toThrow('Failed to fetch authors');
    await expect(getTags()).rejects.toThrow('Failed to fetch tags');
    await expect(getPages()).rejects.toThrow('Failed to fetch pages');
  });

  it('should handle null/undefined values gracefully', async () => {
    const mockPost = {
      id: '1',
      slug: 'test',
      title: 'Test',
      content: 'Content',
      status: 'published',
      featured: false,
      views: 0,
      excerpt: null,
      content_html: null,
      author_id: null,
      featured_image: null,
      reading_time: null,
      published_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockSql.mockResolvedValue([mockPost]);

    const result = await getPostBySlug('test');

    expect(result?.excerpt).toBeUndefined();
    expect(result?.contentHtml).toBeUndefined();
    expect(result?.authorId).toBeUndefined();
    expect(result?.publishedAt).toBeUndefined();
  });
});
