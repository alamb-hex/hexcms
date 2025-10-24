/**
 * GitHub Webhook Sync Endpoint
 *
 * Receives push events from GitHub and syncs content to database.
 *
 * TODO (Phase 1):
 * - [ ] Implement signature verification
 * - [ ] Process webhook payload
 * - [ ] Handle errors gracefully
 * - [ ] Return proper status codes
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { GitHubWebhookPayload } from '@/types';

export async function POST(request: Request) {
  try {
    // Get headers
    const headersList = headers();
    const signature = headersList.get('x-hub-signature-256');
    const event = headersList.get('x-github-event');

    // Only process push events
    if (event !== 'push') {
      return NextResponse.json(
        { message: 'Event type not supported' },
        { status: 200 }
      );
    }

    // Get request body
    const body = await request.text();

    // TODO: Verify webhook signature
    // const secret = process.env.GITHUB_WEBHOOK_SECRET!;
    // const isValid = verifyWebhookSignature(body, signature, secret);
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    // Parse payload
    const payload: GitHubWebhookPayload = JSON.parse(body);

    // TODO: Process webhook
    // const result = await processWebhook(payload);

    console.log('Webhook received:', {
      ref: payload.ref,
      commits: payload.head_commit?.id,
      added: payload.head_commit?.added.length,
      modified: payload.head_commit?.modified.length,
      removed: payload.head_commit?.removed.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook received (sync not implemented yet)',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
