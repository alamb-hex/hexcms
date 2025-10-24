#!/usr/bin/env tsx
/**
 * Manual Sync Script
 *
 * Manually sync content from GitHub repository to database.
 * Useful for:
 * - Initial content loading
 * - Testing sync functionality
 * - Recovering from failed webhook syncs
 * - Bulk content updates
 *
 * Usage:
 *   npx tsx scripts/manual-sync.ts [options]
 *
 * Options:
 *   --dry-run              Show what would be synced without making changes
 *   --all                  Sync all content files from repository
 *   --file <path>          Sync specific file (e.g., content/posts/hello-world.md)
 *   --type <type>          Sync specific content type (posts|authors|pages)
 *   --verbose              Show detailed output
 *
 * Examples:
 *   npx tsx scripts/manual-sync.ts --all
 *   npx tsx scripts/manual-sync.ts --dry-run --all
 *   npx tsx scripts/manual-sync.ts --file content/posts/my-post.md
 *   npx tsx scripts/manual-sync.ts --type posts
 */

import { Octokit } from '@octokit/rest';
import {
  processFile,
  filterContentFiles,
} from '../src/lib/sync';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'Hexaxia-Technologies';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'hexcms-content';
const CONTENT_DIR = 'content';

interface SyncOptions {
  dryRun: boolean;
  all: boolean;
  file?: string;
  type?: 'posts' | 'authors' | 'pages';
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    dryRun: args.includes('--dry-run'),
    all: args.includes('--all'),
    verbose: args.includes('--verbose'),
  };

  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    options.file = args[fileIndex + 1];
  }

  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const type = args[typeIndex + 1];
    if (type === 'posts' || type === 'authors' || type === 'pages') {
      options.type = type;
    } else {
      console.error(`Invalid type: ${type}. Must be posts, authors, or pages.`);
      process.exit(1);
    }
  }

  return options;
}

/**
 * Get all content files from GitHub repository
 */
async function getAllContentFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string = CONTENT_DIR
): Promise<string[]> {
  const files: string[] = [];

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(data)) {
      return files;
    }

    for (const item of data) {
      if (item.type === 'file' && item.path.endsWith('.md')) {
        files.push(item.path);
      } else if (item.type === 'dir') {
        // Recursively get files from subdirectories
        const subFiles = await getAllContentFiles(octokit, owner, repo, item.path);
        files.push(...subFiles);
      }
    }

    return files;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      console.warn(`⚠️  Path not found: ${path}`);
      return [];
    }
    throw error;
  }
}

/**
 * Main sync function
 */
async function sync(options: SyncOptions) {
  const startTime = Date.now();

  console.log('🚀 Manual Sync Started');
  console.log('='.repeat(60));
  console.log(`Repository: ${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`);
  console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log('='.repeat(60));
  console.log('');

  // Validate environment
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  // Initialize Octokit
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  // Get latest commit SHA
  let commitSha = 'manual-sync';
  try {
    const { data: refData } = await octokit.git.getRef({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      ref: 'heads/main',
    });
    commitSha = refData.object.sha;
    if (options.verbose) {
      console.log(`📍 Latest commit: ${commitSha.substring(0, 7)}`);
      console.log('');
    }
  } catch (error) {
    console.warn('⚠️  Could not fetch latest commit SHA, using "manual-sync"');
  }

  // Determine which files to sync
  let filesToSync: string[] = [];

  if (options.file) {
    // Sync single file
    filesToSync = [options.file];
    console.log(`📄 Syncing single file: ${options.file}`);
  } else if (options.all) {
    // Sync all content files
    console.log('📚 Fetching all content files...');
    const allFiles = await getAllContentFiles(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
    filesToSync = filterContentFiles(allFiles);
    console.log(`Found ${filesToSync.length} content files`);
  } else if (options.type) {
    // Sync specific type
    console.log(`📚 Fetching ${options.type}...`);
    const allFiles = await getAllContentFiles(
      octokit,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME,
      `${CONTENT_DIR}/${options.type}`
    );
    filesToSync = filterContentFiles(allFiles);
    console.log(`Found ${filesToSync.length} ${options.type} files`);
  } else {
    console.error('❌ Must specify --all, --file, or --type');
    console.log('');
    console.log('Usage: npx tsx scripts/manual-sync.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --all              Sync all content files');
    console.log('  --file <path>      Sync specific file');
    console.log('  --type <type>      Sync specific type (posts|authors|pages)');
    console.log('  --dry-run          Show what would be synced');
    console.log('  --verbose          Show detailed output');
    process.exit(1);
  }

  console.log('');

  if (filesToSync.length === 0) {
    console.log('ℹ️  No files to sync');
    return;
  }

  // Process files
  const errors: Array<{ file: string; error: string }> = [];
  let processed = 0;

  console.log(`Processing ${filesToSync.length} files...`);
  console.log('');

  for (const file of filesToSync) {
    try {
      if (options.verbose) {
        console.log(`  📄 Processing: ${file}`);
      } else {
        // Show progress
        process.stdout.write(`\r  Progress: ${processed + 1}/${filesToSync.length}`);
      }

      if (!options.dryRun) {
        await processFile(file, commitSha);
      }

      processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ file, error: errorMessage });

      if (options.verbose) {
        console.error(`    ❌ Error: ${errorMessage}`);
      }
    }
  }

  if (!options.verbose) {
    console.log(''); // New line after progress
  }

  const duration = Date.now() - startTime;

  // Log results
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Sync Complete');
  console.log('='.repeat(60));
  console.log(`Files processed: ${processed}/${filesToSync.length}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('');
    console.log('❌ Errors:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  // Exit with appropriate code
  if (errors.length > 0) {
    process.exit(1);
  }
}

// Run sync
const options = parseArgs();
sync(options).catch((error) => {
  console.error('');
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
