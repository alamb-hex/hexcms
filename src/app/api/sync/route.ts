/**
 * GitHub Webhook Sync Endpoint
 *
 * Receives push events from GitHub and syncs content to database.
 *
 * Features:
 * - HMAC SHA-256 signature verification
 * - Push event processing
 * - Error isolation (individual file failures don't stop the sync)
 * - Comprehensive error handling and logging
 * - Proper status codes
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { GitHubWebhookPayload } from '@/types';
import { verifyWebhookSignature, processWebhook } from '@/lib/sync';

/**
 * POST /api/sync
 *
 * GitHub webhook endpoint for content synchronization
 *
 * Headers required:
 * - x-hub-signature-256: HMAC SHA-256 signature
 * - x-github-event: Event type (must be 'push')
 *
 * @returns JSON response with sync results
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Get headers
    const headersList = await headers();
    const signature = headersList.get('x-hub-signature-256');
    const event = headersList.get('x-github-event');

    // Only process push events
    if (event !== 'push') {
      return NextResponse.json(
        { message: `Event type '${event}' not supported. Only 'push' events are processed.` },
        { status: 200 }
      );
    }

    // Get request body
    const body = await request.text();

    // Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error('GITHUB_WEBHOOK_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const isValid = verifyWebhookSignature(body, signature, secret);
    if (!isValid) {
      console.warn('Webhook signature verification failed', {
        hasSignature: !!signature,
        signaturePrefix: signature?.substring(0, 10),
      });

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    let payload: GitHubWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.head_commit) {
      return NextResponse.json(
        { message: 'No commits in push event, skipping sync' },
        { status: 200 }
      );
    }

    // Log webhook receipt
    console.log('Webhook received:', {
      ref: payload.ref,
      commit: payload.head_commit.id,
      author: payload.head_commit.author?.name,
      message: payload.head_commit.message,
      added: payload.head_commit.added?.length || 0,
      modified: payload.head_commit.modified?.length || 0,
      removed: payload.head_commit.removed?.length || 0,
    });

    // Process webhook and sync content
    const result = await processWebhook(payload);

    // Return appropriate response
    if (result.success) {
      console.log(`✅ Sync completed successfully: ${result.processed} files processed in ${result.duration}ms`);
      return NextResponse.json({
        success: true,
        message: 'Content synchronized successfully',
        processed: result.processed,
        duration: result.duration,
      });
    } else {
      console.warn(`⚠️  Sync completed with errors: ${result.errors.length} files failed`, result.errors);
      return NextResponse.json({
        success: false,
        message: 'Sync completed with errors',
        processed: result.processed,
        duration: result.duration,
        errors: result.errors,
      }, { status: 207 }); // 207 Multi-Status (partial success)
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Webhook processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 *
 * Health check endpoint
 *
 * @returns JSON response with endpoint status
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/sync',
    status: 'operational',
    message: 'GitHub webhook sync endpoint is ready',
    requiredHeaders: ['x-hub-signature-256', 'x-github-event'],
    supportedEvents: ['push'],
  });
}
