/**
 * Database Adapter Layer
 *
 * Provides a unified interface for multiple PostgreSQL drivers:
 * - Neon Serverless (for Vercel edge runtime)
 * - node-postgres/pg (for traditional deployments: Docker, VPS, Railway, etc.)
 *
 * The adapter normalizes differences between drivers:
 * - Neon returns arrays directly: sql`query` → [rows]
 * - node-postgres returns: pool.query() → {rows: [rows]}
 *
 * Usage:
 * ```typescript
 * import { sql } from './db-adapter';
 *
 * // Template literal syntax (works with both drivers)
 * const rows = await sql`SELECT * FROM posts WHERE id = ${id}`;
 *
 * // Dynamic queries (for building complex WHERE clauses)
 * const rows = await (sql as any)(queryString, params);
 * ```
 */

import type { Pool, QueryResult, QueryResultRow } from 'pg';

// ===========================================================================
// Types
// ===========================================================================

type DatabaseDriver = 'neon' | 'postgres';

interface SqlQueryFunction {
  // Template literal syntax
  <T extends QueryResultRow = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<T[]>;

  // Dynamic query support (as any)
  (query: string, params?: any[]): Promise<any[]>;
}

// ===========================================================================
// Driver Detection
// ===========================================================================

/**
 * Detect which database driver to use
 *
 * Priority:
 * 1. DATABASE_DRIVER env var ('neon' or 'postgres')
 * 2. Auto-detect: VERCEL env var → neon
 * 3. Default: postgres (for local development)
 */
function detectDriver(): DatabaseDriver {
  const explicitDriver = process.env.DATABASE_DRIVER;

  if (explicitDriver === 'neon' || explicitDriver === 'postgres') {
    return explicitDriver;
  }

  // Auto-detect Vercel environment
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return 'neon';
  }

  // Default to postgres for local/traditional deployments
  return 'postgres';
}

// ===========================================================================
// Neon Serverless Driver
// ===========================================================================

function createNeonAdapter(): SqlQueryFunction {
  const { neon } = require('@neondatabase/serverless');
  const neonSql = neon(process.env.DATABASE_URL!);

  // Neon already returns arrays directly, so we can use it as-is
  return neonSql as SqlQueryFunction;
}

// ===========================================================================
// node-postgres (pg) Driver
// ===========================================================================

let pgPool: Pool | null = null;

function getPgPool(): Pool {
  if (pgPool) {
    return pgPool;
  }

  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err: Error) => {
    console.error('Unexpected database pool error:', err);
  });

  pgPool = pool;
  return pool;
}

function createPostgresAdapter(): SqlQueryFunction {
  const pool = getPgPool();

  // Create adapter function that handles both template literals and dynamic queries
  const adapter = async function(
    stringsOrQuery: TemplateStringsArray | string,
    ...values: any[]
  ): Promise<any[]> {
    // Handle template literal syntax: sql`SELECT * FROM posts WHERE id = ${id}`
    if (typeof stringsOrQuery === 'object' && 'raw' in stringsOrQuery) {
      const strings = stringsOrQuery as TemplateStringsArray;

      // Build parameterized query from template literal
      let query = '';
      const params: any[] = [];

      for (let i = 0; i < strings.length; i++) {
        query += strings[i];
        if (i < values.length) {
          params.push(values[i]);
          query += `$${params.length}`;
        }
      }

      const result: QueryResult = await pool.query(query, params);
      return result.rows;
    }

    // Handle dynamic query syntax: sql(queryString, [params])
    if (typeof stringsOrQuery === 'string') {
      const query = stringsOrQuery;
      const params = values[0] || [];

      const result: QueryResult = await pool.query(query, params);
      return result.rows;
    }

    throw new Error('Invalid query format');
  };

  return adapter as SqlQueryFunction;
}

// ===========================================================================
// Adapter Factory
// ===========================================================================

/**
 * Create and export the SQL query function
 *
 * This is the main export that src/lib/db.ts and src/lib/sync.ts will use.
 */
function createDatabaseAdapter(): SqlQueryFunction {
  const driver = detectDriver();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Set it in .env.local for local development or configure it in your deployment platform.'
    );
  }

  if (driver === 'neon') {
    console.log('[db-adapter] Using Neon serverless driver');
    return createNeonAdapter();
  } else {
    console.log('[db-adapter] Using node-postgres (pg) driver with connection pooling');
    return createPostgresAdapter();
  }
}

// ===========================================================================
// Exports
// ===========================================================================

/**
 * SQL query function that works with both Neon and node-postgres
 *
 * Examples:
 * ```typescript
 * // Template literal (recommended)
 * const posts = await sql`SELECT * FROM posts WHERE status = ${'published'}`;
 *
 * // Dynamic query (for complex WHERE clauses)
 * const posts = await (sql as any)('SELECT * FROM posts WHERE status = $1', ['published']);
 * ```
 */
export const sql = createDatabaseAdapter();

/**
 * Gracefully close database connections
 *
 * Call this when shutting down the application (e.g., in a SIGTERM handler)
 */
export async function closeDatabase(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log('[db-adapter] Database pool closed');
  }
}

/**
 * Get current driver being used
 */
export function getCurrentDriver(): DatabaseDriver {
  return detectDriver();
}
