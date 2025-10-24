# Database Schema

## Overview

This project uses PostgreSQL (via Vercel Postgres) to store parsed content from Markdown files. The schema is designed for performance, scalability, and relational integrity.

## Entity Relationship Diagram

```
┌─────────────┐
│   authors   │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐      ┌─────────────┐
│    posts    │◄────►│  post_tags  │
└─────────────┘  N:N └──────┬──────┘
                             │
                             │ N:1
                             │
                      ┌──────▼──────┐
                      │    tags     │
                      └─────────────┘

┌─────────────┐
│    pages    │  (standalone pages)
└─────────────┘

┌─────────────┐
│ sync_logs   │  (optional logging)
└─────────────┘
```

## Complete Schema

### Posts Table

Primary table for blog posts.

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  html_content TEXT,
  featured_image VARCHAR(500),
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  author_id INTEGER REFERENCES authors(id),
  status VARCHAR(20) DEFAULT 'draft',
  reading_time INTEGER,
  view_count INTEGER DEFAULT 0,
  meta_description TEXT,
  meta_keywords TEXT[]
);

-- Indexes
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `slug` - URL-friendly identifier (unique)
- `title` - Post title
- `excerpt` - Short summary
- `content` - Raw markdown content
- `html_content` - Processed HTML
- `featured_image` - Hero image URL
- `published_at` - Publication timestamp
- `updated_at` - Last modified timestamp
- `created_at` - Creation timestamp
- `author_id` - Foreign key to authors
- `status` - Enum: 'draft', 'published', 'archived'
- `reading_time` - Estimated minutes to read
- `view_count` - Page view counter
- `meta_description` - SEO description
- `meta_keywords` - SEO keywords array

---

### Authors Table

Store author information.

```sql
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  bio TEXT,
  avatar VARCHAR(500),
  social_links JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_authors_slug ON authors(slug);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `slug` - URL-friendly identifier (unique)
- `name` - Full name
- `email` - Email address
- `bio` - Author biography
- `avatar` - Profile image URL
- `social_links` - JSON object with social profiles
- `created_at` - Creation timestamp

**Social Links Format:**
```json
{
  "twitter": "username",
  "github": "username",
  "linkedin": "username",
  "website": "https://example.com"
}
```

---

### Tags Table

Define available tags.

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags(name);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `name` - Display name (e.g., "JavaScript")
- `slug` - URL-friendly identifier (e.g., "javascript")
- `description` - Tag description
- `created_at` - Creation timestamp

---

### Post_Tags Junction Table

Many-to-many relationship between posts and tags.

```sql
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
```

**Columns:**
- `post_id` - Foreign key to posts
- `tag_id` - Foreign key to tags

**Cascade Behavior:**
- When a post is deleted, its tag associations are removed
- When a tag is deleted, its post associations are removed

---

### Pages Table

Standalone pages (e.g., About, Contact).

```sql
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'draft'
);

-- Indexes
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
```

---

### Sync_Logs Table (Optional)

Track sync operations for debugging.

```sql
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50),
  files_processed INTEGER,
  status VARCHAR(20),
  error_message TEXT,
  duration_ms INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_logs_synced_at ON sync_logs(synced_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `sync_type` - Type: 'full', 'incremental'
- `files_processed` - Number of files synced
- `status` - Status: 'success', 'failed', 'partial'
- `error_message` - Error details if failed
- `duration_ms` - Sync duration in milliseconds
- `synced_at` - Timestamp of sync

---

## Common Queries

### Get Published Posts

```sql
SELECT 
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.featured_image,
  p.published_at,
  p.reading_time,
  p.view_count,
  a.name as author_name,
  a.slug as author_slug,
  a.avatar as author_avatar,
  ARRAY_AGG(t.name) as tags
FROM posts p
LEFT JOIN authors a ON p.author_id = a.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.status = 'published'
  AND p.published_at <= NOW()
GROUP BY p.id, a.id
ORDER BY p.published_at DESC
LIMIT 20 OFFSET 0;
```

---

### Get Post by Slug

```sql
SELECT 
  p.*,
  a.name as author_name,
  a.slug as author_slug,
  a.bio as author_bio,
  a.avatar as author_avatar,
  a.social_links as author_social,
  ARRAY_AGG(
    json_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug
    )
  ) as tags
FROM posts p
LEFT JOIN authors a ON p.author_id = a.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.slug = $1
  AND p.status = 'published'
GROUP BY p.id, a.id;
```

---

### Get Posts by Tag

```sql
SELECT 
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.featured_image,
  p.published_at,
  p.reading_time,
  a.name as author_name,
  a.slug as author_slug
FROM posts p
INNER JOIN post_tags pt ON p.id = pt.post_id
INNER JOIN tags t ON pt.tag_id = t.id
LEFT JOIN authors a ON p.author_id = a.id
WHERE t.slug = $1
  AND p.status = 'published'
  AND p.published_at <= NOW()
ORDER BY p.published_at DESC
LIMIT 20;
```

---

### Get Related Posts

Based on shared tags:

```sql
SELECT DISTINCT
  p2.id,
  p2.slug,
  p2.title,
  p2.excerpt,
  p2.featured_image,
  COUNT(pt2.tag_id) as shared_tags
FROM posts p1
INNER JOIN post_tags pt1 ON p1.id = pt1.post_id
INNER JOIN post_tags pt2 ON pt1.tag_id = pt2.tag_id
INNER JOIN posts p2 ON pt2.post_id = p2.id
WHERE p1.slug = $1
  AND p2.id != p1.id
  AND p2.status = 'published'
  AND p2.published_at <= NOW()
GROUP BY p2.id
ORDER BY shared_tags DESC, p2.published_at DESC
LIMIT 3;
```

---

### Full-Text Search

Using PostgreSQL full-text search:

```sql
-- Add tsvector column (run once)
ALTER TABLE posts 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'C')
) STORED;

-- Create GIN index
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Search query
SELECT 
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  ts_rank(p.search_vector, query) as rank
FROM posts p,
  plainto_tsquery('english', $1) query
WHERE p.search_vector @@ query
  AND p.status = 'published'
ORDER BY rank DESC
LIMIT 20;
```

---

### Get Popular Posts

```sql
SELECT 
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.featured_image,
  p.view_count,
  a.name as author_name
FROM posts p
LEFT JOIN authors a ON p.author_id = a.id
WHERE p.status = 'published'
  AND p.published_at <= NOW()
ORDER BY p.view_count DESC
LIMIT 10;
```

---

### Get Posts by Author

```sql
SELECT 
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.featured_image,
  p.published_at,
  p.reading_time
FROM posts p
INNER JOIN authors a ON p.author_id = a.id
WHERE a.slug = $1
  AND p.status = 'published'
  AND p.published_at <= NOW()
ORDER BY p.published_at DESC
LIMIT 20;
```

---

### Get Archive (Posts by Month)

```sql
SELECT 
  DATE_TRUNC('month', published_at) as month,
  COUNT(*) as post_count
FROM posts
WHERE status = 'published'
  AND published_at <= NOW()
GROUP BY month
ORDER BY month DESC;
```

---

## Database Functions

### Increment View Count

```sql
CREATE OR REPLACE FUNCTION increment_view_count(post_slug VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET view_count = view_count + 1 
  WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT increment_view_count('my-post-slug');
```

---

### Get or Create Tag

```sql
CREATE OR REPLACE FUNCTION get_or_create_tag(
  tag_name VARCHAR,
  tag_slug VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  tag_id INTEGER;
BEGIN
  -- Try to find existing tag
  SELECT id INTO tag_id FROM tags WHERE slug = tag_slug;
  
  -- If not found, create it
  IF tag_id IS NULL THEN
    INSERT INTO tags (name, slug)
    VALUES (tag_name, tag_slug)
    RETURNING id INTO tag_id;
  END IF;
  
  RETURN tag_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Migration Scripts

### Initial Setup

```sql
-- Run this to set up the database from scratch

BEGIN;

-- Create tables
-- (Copy all CREATE TABLE statements from above)

-- Create indexes
-- (Copy all CREATE INDEX statements from above)

-- Create functions
-- (Copy all CREATE FUNCTION statements from above)

-- Insert default data (optional)
INSERT INTO authors (slug, name, bio) 
VALUES ('system', 'System', 'System-generated content');

COMMIT;
```

---

### Seed Data (Development)

```sql
-- Sample authors
INSERT INTO authors (slug, name, email, bio, avatar) VALUES
('john-doe', 'John Doe', 'john@example.com', 'Software developer and writer', '/images/authors/john.jpg'),
('jane-smith', 'Jane Smith', 'jane@example.com', 'Tech enthusiast and blogger', '/images/authors/jane.jpg');

-- Sample tags
INSERT INTO tags (name, slug, description) VALUES
('JavaScript', 'javascript', 'JavaScript programming language'),
('React', 'react', 'React library and ecosystem'),
('Next.js', 'nextjs', 'Next.js framework'),
('Web Development', 'web-development', 'General web development topics');

-- Sample post
INSERT INTO posts (
  slug, 
  title, 
  excerpt, 
  content, 
  html_content, 
  author_id, 
  status, 
  published_at,
  reading_time
) VALUES (
  'hello-world',
  'Hello World',
  'My first blog post',
  '# Hello World\n\nThis is my first post!',
  '<h1>Hello World</h1><p>This is my first post!</p>',
  1,
  'published',
  NOW(),
  1
);

-- Link post to tags
INSERT INTO post_tags (post_id, tag_id) VALUES
(1, 1),
(1, 3);
```

---

## Performance Optimization

### Index Strategy

**Indexes to create:**
1. Slug lookups (most common query)
2. Published date for chronological sorting
3. Status filtering
4. Composite index on (status, published_at) for common queries
5. Full-text search index (GIN)

### Connection Pooling

```typescript
// Use Vercel's built-in pooling
import { sql } from '@vercel/postgres';

// Or configure custom pool
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Query Optimization Tips

1. **Use LIMIT**: Always paginate results
2. **Select specific columns**: Avoid `SELECT *`
3. **Use indexes**: Ensure WHERE clauses use indexed columns
4. **Batch inserts**: Use multi-row INSERT when syncing
5. **EXPLAIN ANALYZE**: Profile slow queries

```sql
EXPLAIN ANALYZE
SELECT * FROM posts WHERE slug = 'my-post';
```

---

## Backup Strategy

### Automated Backups (Vercel)

Vercel Postgres provides automatic daily backups. For additional protection:

```bash
# Manual backup
pg_dump $POSTGRES_URL > backup.sql

# Restore
psql $POSTGRES_URL < backup.sql
```

### Disaster Recovery

1. Git repository contains source content
2. Database can be rebuilt from Git via full sync
3. Regular database backups for quick recovery

---

## Monitoring

### Key Metrics

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

---

## TypeScript Types

```typescript
// src/types/database.ts

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  html_content: string | null;
  featured_image: string | null;
  published_at: Date | null;
  updated_at: Date;
  created_at: Date;
  author_id: number | null;
  status: 'draft' | 'published' | 'archived';
  reading_time: number | null;
  view_count: number;
  meta_description: string | null;
  meta_keywords: string[] | null;
}

export interface Author {
  id: number;
  slug: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatar: string | null;
  social_links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  } | null;
  created_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
}

export interface PostWithAuthor extends Post {
  author_name: string;
  author_slug: string;
  author_bio: string | null;
  author_avatar: string | null;
  author_social: Author['social_links'];
  tags: Tag[];
}
```
