import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
// Never cache a health check.
export const dynamic = 'force-dynamic';

/**
 * Health / readiness probe for load balancers and uptime monitors.
 * `?deep=1` (or `/api/health?db=1`) additionally pings the database with a
 * cheap `SELECT 1`, returning 503 if it is unreachable — use that variant for
 * readiness gating; the default is a fast liveness check.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.has('deep') || url.searchParams.has('db');

  const body: Record<string, unknown> = {
    status: 'ok',
    service: 'neet-smart-practice-platform',
    timestamp: new Date().toISOString(),
  };

  if (deep) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      body.database = 'ok';
    } catch {
      return NextResponse.json(
        { ...body, status: 'error', database: 'unreachable' },
        { status: 503 },
      );
    }
  }

  return NextResponse.json(body);
}
