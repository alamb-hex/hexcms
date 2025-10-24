-- heXcms Database Initialization Script
-- PostgreSQL 14+
--
-- This script creates all necessary tables, indexes, and constraints
-- for the heXcms content management system.
--
-- Based on: docs/reference/database.md

-- ===========================================================================
-- Enable Extensions
-- ===========================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search (for search functionality)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================================================
-- Authors Table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  website VARCHAR(500),
  social JSONB DEFAULT '{}'::jsonb, -- Twitter, GitHub, LinkedIn, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for authors
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_created_at ON authors(created_at DESC);

-- ===========================================================================
-- Tags Table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ===========================================================================
-- Posts Table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered markdown
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured_image VARCHAR(500),
  featured BOOLEAN DEFAULT false,
  reading_time INTEGER, -- in minutes
  views INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full-text search column (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);

-- ===========================================================================
-- Post-Tag Junction Table (Many-to-Many)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes for post_tags
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- ===========================================================================
-- Pages Table (Static pages like About, Contact, etc.)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered markdown
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  template VARCHAR(100), -- Optional custom template
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

-- ===========================================================================
-- Sync Log Table (Track content sync operations)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL, -- 'sync', 'create', 'update', 'delete'
  resource_type VARCHAR(50) NOT NULL, -- 'post', 'author', 'page', 'tag'
  resource_id UUID,
  file_path TEXT,
  commit_sha VARCHAR(40),
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_resource_type ON sync_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- ===========================================================================
-- Functions and Triggers
-- ===========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- Sample Data (Optional - for development/testing)
-- ===========================================================================

-- Insert a sample author
INSERT INTO authors (slug, name, email, bio, social)
VALUES (
  'john-doe',
  'John Doe',
  'john@example.com',
  'Full-stack developer passionate about web technologies and open source.',
  '{"twitter": "@johndoe", "github": "johndoe", "website": "https://johndoe.dev"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample tags
INSERT INTO tags (slug, name, description) VALUES
  ('nextjs', 'Next.js', 'The React Framework for Production'),
  ('typescript', 'TypeScript', 'JavaScript with syntax for types'),
  ('postgres', 'PostgreSQL', 'The World''s Most Advanced Open Source Relational Database'),
  ('web-development', 'Web Development', 'Modern web development topics'),
  ('tutorial', 'Tutorial', 'Step-by-step guides and tutorials')
ON CONFLICT (slug) DO NOTHING;

-- ===========================================================================
-- Permissions (Optional - for production multi-user setup)
-- ===========================================================================

-- Grant permissions to application user (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ===========================================================================
-- Completion Message
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE 'heXcms database initialization completed successfully!';
  RAISE NOTICE 'Tables created: authors, tags, posts, post_tags, pages, sync_logs';
  RAISE NOTICE 'Sample data inserted: 1 author, 5 tags';
END $$;
