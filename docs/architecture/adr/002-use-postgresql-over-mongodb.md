# ADR-002: Use PostgreSQL Over MongoDB

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** heXcms Core Team

## Context

We need a database to store synced content from Git repositories. The database must support:

- Fast queries for listing and filtering posts
- Full-text search across content
- Relational data (posts, authors, tags)
- Complex queries (filtering by tag, author, date range)
- Good performance with thousands of posts
- ACID transactions for data integrity
- Schema validation and type safety

Key requirements:
- Sub-100ms query times for post listings
- Full-text search with relevance ranking
- Support for JSON/JSONB for flexible metadata
- Strong consistency for content updates
- Easy local development setup
- Mature ecosystem and tooling

## Decision

We will use **PostgreSQL 16** as the primary database for heXcms.

Specifically:
- PostgreSQL 16.x (latest stable)
- Vercel Postgres for production deployments
- Docker for local development
- `pg` driver for Node.js
- Native full-text search using `tsvector`
- JSONB columns for flexible metadata

## Consequences

### Positive

- **Full-text search**: Built-in `tsvector` with relevance ranking, no need for external search service
- **Strong typing**: Schema enforcement prevents data corruption
- **Relational integrity**: Foreign keys ensure authors and tags are valid
- **ACID compliance**: Transactions ensure consistent data during sync operations
- **Performance**: Excellent query performance with proper indexes
- **JSON support**: JSONB columns for flexible metadata while keeping strong schema
- **Mature ecosystem**: Decades of development, extensive documentation
- **SQL standard**: Well-known query language, easier to hire for
- **Extensions**: Rich extension ecosystem (uuid-ossp, pg_trgm, etc.)
- **Vercel integration**: First-class support via Vercel Postgres

### Negative

- **Schema migrations**: Changes require migration scripts (though this is also a pro for data integrity)
- **Less flexible than NoSQL**: Schema changes are more involved
- **Horizontal scaling**: More complex than MongoDB (though rarely needed for CMS use cases)
- **Learning curve**: SQL vs MongoDB's simpler query syntax for some developers

### Risks

- **Scaling limits**: Very large deployments (millions of posts) may need sharding
- **Complex queries**: Poorly written SQL can hurt performance
- **Migration challenges**: Major version upgrades require careful planning

## Alternatives Considered

### Alternative 1: MongoDB

- **Pros:**
  - Schema-less design allows flexible document structure
  - Easy horizontal scaling with built-in sharding
  - Simpler query syntax for some operations
  - Native JSON storage
  - Popular in Node.js ecosystem
- **Cons:**
  - Full-text search less powerful than PostgreSQL's
  - No schema enforcement leads to data integrity issues
  - Weak consistency models (eventually consistent by default)
  - Overkill for relational data (authors, posts, tags)
  - Atlas pricing can be expensive for production
- **Reason for rejection:** Our data is inherently relational (posts have authors, posts have tags). PostgreSQL's full-text search is more powerful, and strong schema enforcement prevents bugs. MongoDB's flexibility isn't needed for our structured content.

### Alternative 2: MySQL

- **Pros:**
  - Very mature and widely deployed
  - Good performance
  - Strong ecosystem
  - Easy to find developers
- **Cons:**
  - Full-text search less powerful than PostgreSQL
  - JSON support added later, not as robust as JSONB
  - Less rich feature set than PostgreSQL
  - Some features require InnoDB engine configuration
- **Reason for rejection:** PostgreSQL has better full-text search (crucial for CMS), better JSON support, and more advanced features while being just as mature.

### Alternative 3: SQLite

- **Pros:**
  - Serverless, no separate database process
  - Simple deployment
  - Perfect for local development
  - Fast for small datasets
- **Cons:**
  - Limited full-text search (FTS5 less powerful than PostgreSQL)
  - Single writer limitation
  - Not suitable for high-traffic production sites
  - Limited concurrent connections
- **Reason for rejection:** While excellent for local dev and small sites, SQLite doesn't scale to production traffic. We need proper multi-client support and robust full-text search.

### Alternative 4: Elasticsearch/Meilisearch + Simple DB

- **Pros:**
  - Best-in-class full-text search
  - Excellent relevance ranking
  - Fast search queries
  - Rich filtering and faceting
- **Cons:**
  - Two systems to maintain (search + database)
  - Additional infrastructure complexity
  - Higher costs (separate search service)
  - Data synchronization between systems
  - Overkill for most CMS deployments
- **Reason for rejection:** PostgreSQL's full-text search is "good enough" for 99% of use cases. Adding a separate search service adds complexity, cost, and failure points. We can always add Elasticsearch later if needed.

## Implementation Notes

### Schema Design

Use relational tables with foreign keys:

```sql
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  social JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES authors(id),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);

CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);
```

### Full-Text Search

Use weighted `tsvector` for relevance ranking:

```typescript
// Search posts with relevance ranking
const results = await sql`
  SELECT
    *,
    ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
  FROM posts
  WHERE search_vector @@ plainto_tsquery('english', ${query})
  ORDER BY rank DESC
  LIMIT 20
`;
```

### JSONB for Metadata

Use JSONB for flexible fields while keeping strong schema for core data:

```sql
-- authors.social is JSONB for flexibility
UPDATE authors
SET social = '{"twitter": "@johndoe", "github": "johndoe"}'::jsonb
WHERE slug = 'john-doe';

-- Query JSONB fields
SELECT * FROM authors
WHERE social->>'twitter' = '@johndoe';
```

### Local Development

Use Docker Compose for easy local setup:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hexcms
      POSTGRES_PASSWORD: hexcms
      POSTGRES_DB: hexcms
    volumes:
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
```

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/16/textsearch.html)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/16/datatype-json.html)

---

**Related ADRs:**
- [ADR-005: Database Sync Strategy](./005-database-sync-strategy.md)
