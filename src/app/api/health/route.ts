/**
 * Health Check Endpoint
 *
 * Used for monitoring and uptime checks.
 */

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const dbHealthy = await testConnection();

    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
