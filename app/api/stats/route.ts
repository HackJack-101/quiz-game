import { NextResponse } from 'next/server';

import { getGlobalStats } from '@/lib/db-utils';

export async function GET() {
  try {
    const stats = getGlobalStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
