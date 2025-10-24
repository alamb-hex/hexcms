/**
 * Database Initialization Script for Neon
 *
 * This script reads init-db.sql and executes it using node-postgres.
 * Since psql may not be available locally, we use pg client instead.
 */

import { Client } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local if it exists (Node 20.12+)
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  try {
    // @ts-ignore - loadEnvFile is available in Node 20.12+
    process.loadEnvFile(envPath);
    console.log('✓ Loaded environment variables from .env.local');
  } catch (error) {
    console.warn('⚠️  Could not load .env.local:', error);
  }
}

async function initializeDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    console.error('Run: vercel env pull .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon database...');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Read the SQL file
    const sqlPath = join(__dirname, 'init-db.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Reading init-db.sql...');
    console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)}KB`);

    console.log('\n🚀 Executing database initialization...\n');

    // Execute the entire SQL content
    await client.query(sqlContent);

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - authors');
    console.log('  - tags');
    console.log('  - posts');
    console.log('  - post_tags');
    console.log('  - pages');
    console.log('  - sync_logs');

    console.log('\n📊 Verifying tables...');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.error('\n❌ Warning: No tables found after initialization');
      await client.end();
      process.exit(1);
    }

    console.log(`   Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Count sample data
    const authorCountResult = await client.query('SELECT COUNT(*) as count FROM authors');
    const tagCountResult = await client.query('SELECT COUNT(*) as count FROM tags');

    console.log('\n📝 Sample data:');
    console.log(`   ${authorCountResult.rows[0].count} authors`);
    console.log(`   ${tagCountResult.rows[0].count} tags`);

    console.log('\n🎉 Database is ready for use!');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await client.end();
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
